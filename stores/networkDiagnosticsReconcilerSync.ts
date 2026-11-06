import type {
  NetworkDiagnosticsState,
  NetworkMetrics,
  ReconcilerDiagnosticsTarget,
  ReconcilerRawMetricsPayload,
  StressSimulatorTarget,
  TransportChannelDiagnosticsTarget,
} from './networkDiagnosticsTypes';

function assertFiniteMetric(val: number, name: string) {
  if (val !== undefined && !Number.isFinite(val)) {
    throw new Error(`[networkDiagnosticsStore] Non-finite ${name} encountered: ${val}`);
  }
}

export function bindReconcilerMetricsListener(
  reconciler: ReconcilerDiagnosticsTarget | null | undefined,
  getState: () => NetworkDiagnosticsState,
  resolveChannel: () => TransportChannelDiagnosticsTarget | null | undefined,
  stressSim: StressSimulatorTarget,
  updateMetricsPatch: (patch: Partial<NetworkMetrics>) => void
): void {
  if (!reconciler) return;

  const updateFn = (m: ReconcilerRawMetricsPayload) => {
    const state = getState();
    const ch = resolveChannel();
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const extraUplinkMs = Math.max(
      0,
      Math.round(Number(m.extraUplinkMs ?? ch?.extraUplinkMs ?? stressSim.extraUplinkMs) || 0)
    );
    const extraDownlinkMs = Math.max(
      0,
      Math.round(Number(m.extraDownlinkMs ?? ch?.extraDownlinkMs ?? stressSim.extraDownlinkMs) || 0)
    );
    const extraRttMs = extraUplinkMs + extraDownlinkMs;
    const effectiveRtt = m.rttMs ?? ch?.rttMs ?? extraRttMs;
    const uplinkMs =
      m.uplinkMs ?? Math.max(0, Math.round((effectiveRtt - extraRttMs) * 0.5) + extraUplinkMs);
    const downlinkMs = m.downlinkMs ?? Math.max(0, effectiveRtt - uplinkMs);
    const leadTicks = m.leadTicks ?? m.clientLeadTicks ?? 0;
    const corrections = m.totalCorrections ?? m.corrections ?? 0;
    const serverTick = m.serverTick ?? state.metrics.serverTick;
    const clientTick = m.clientTick ?? state.metrics.clientTick;
    const deltaTicks = Math.abs(clientTick - serverTick);

    assertFiniteMetric(effectiveRtt, 'effectiveRtt');
    assertFiniteMetric(leadTicks, 'leadTicks');
    assertFiniteMetric(corrections, 'corrections');
    assertFiniteMetric(serverTick, 'serverTick');
    assertFiniteMetric(clientTick, 'clientTick');
    assertFiniteMetric(deltaTicks, 'deltaTicks');

    if (serverTick !== state.metrics.serverTick) {
      stressSim.recordPacketReceived(nowMs);
    }

    const packetLossPct =
      ch?.packetLossRate !== undefined
        ? Math.round(ch.packetLossRate * 100)
        : (ch?.simulatedPacketLossPct ?? state.metrics.packetLossPct);
    const jitterMs = ch?.jitterMs ?? ch?.measuredJitterMs ?? state.metrics.jitterMs;
    const inputBufferDepth = m.inputBufferSize ?? reconciler.metrics?.inputBufferSize ?? 0;
    const rollbackWindow = m.rollbackWindow ?? reconciler.history?.length ?? 0;
    const lastErrorUu = m.lastCorrectionDelta ?? reconciler.metrics?.lastCorrectionDelta ?? 0;
    const maxErrorUu = m.maxCorrectionDelta ?? reconciler.metrics?.maxCorrectionDelta ?? 0;
    const localCarIdx = reconciler.localCarIndex ?? 0;
    const rttPlayers = Array.isArray(m.allUserRtt)
      ? m.allUserRtt
      : Array.isArray(m.allUserRtt?.players)
      ? m.allUserRtt.players
      : [];
    const peerRttEntry = rttPlayers.find((entry) =>
      typeof entry === 'object' && entry !== null
        ? entry.carIndex !== localCarIdx && (entry.rtt ?? 0) > 0
        : false
    );
    const rawPeerRtt =
      typeof peerRttEntry === 'object' && peerRttEntry !== null
        ? peerRttEntry.rtt
        : typeof rttPlayers[1] === 'number'
        ? rttPlayers[1]
        : typeof ch?.peerRttMs === 'number'
        ? ch.peerRttMs
        : 0;
    const opponentRttMs = Math.round(Number(rawPeerRtt) || 0);
    const visualSmoothing = Boolean(m.enableSmoothing ?? reconciler.enableSmoothing);

    const health = stressSim.getHealthSnapshot(
      { rttMs: effectiveRtt, jitterMs, packetLossPct, lastErrorUu },
      nowMs
    );

    let probeTelemetry = state.metrics.probeTelemetry;
    if (state.metrics.zeroGFleetEnabled && state.bridge.onSampleZeroGFleetTelemetry) {
      probeTelemetry = state.bridge.onSampleZeroGFleetTelemetry() || [];
    }

    updateMetricsPatch({
      ...m,
      rttMs: effectiveRtt,
      uplinkMs,
      downlinkMs,
      jitterMs: Number.isFinite(jitterMs) ? jitterMs : 0,
      clientLeadTicks: leadTicks,
      corrections,
      serverTick,
      clientTick,
      deltaTicks,
      extraUplinkMs,
      extraDownlinkMs,
      extraRttMs,
      extraLatencyMs: Math.round(extraRttMs * 0.5),
      packetLossPct,
      connected: Boolean(ch),
      inputBufferDepth: Number.isFinite(inputBufferDepth) ? inputBufferDepth : 0,
      rollbackWindow: Number.isFinite(rollbackWindow) ? rollbackWindow : 0,
      lastErrorUu: Number.isFinite(lastErrorUu) ? lastErrorUu : 0,
      maxErrorUu: Number.isFinite(maxErrorUu) ? maxErrorUu : 0,
      opponentRttMs: Number.isFinite(opponentRttMs) ? opponentRttMs : 0,
      visualSmoothing,
      reportRates: 'S: 120Hz / C: 120Hz',
      stressPresetId: health.presetId,
      impairmentPresetId: health.presetId,
      qualityScore: health.score,
      qualityGrade: health.grade,
      healthState: health.healthState,
      packetAgeMs: health.packetAgeMs,
      neutralFallbackActive: health.neutralFallbackActive,
      disconnectEvicted: health.disconnectEvicted,
      probeTelemetry,
    });
  };

  if (typeof reconciler.addMetricsListener === 'function') {
    reconciler.addMetricsListener(updateFn);
  } else {
    const prev = reconciler.onMetricsUpdated;
    reconciler.onMetricsUpdated = (m: ReconcilerRawMetricsPayload) => {
      if (typeof prev === 'function') {
        try {
          prev(m);
        } catch (err) {
          console.error('[networkDiagnosticsStore] Error in previous reconciler onMetricsUpdated:', err);
        }
      }
      updateFn(m);
    };
  }
}
