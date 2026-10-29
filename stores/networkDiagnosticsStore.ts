import { useSyncExternalStore } from 'react';
import {
  NetworkStressSimulator,
  NETWORK_STRESS_PRESETS,
  NETWORK_STRESS_PRESET_LIST,
  CONNECTION_HEALTH_STATES,
  ZERO_G_ANCHOR_MODES,
} from '../config/networkStressConfig.js';

export {
  NETWORK_STRESS_PRESETS,
  NETWORK_STRESS_PRESET_LIST,
  CONNECTION_HEALTH_STATES,
  ZERO_G_ANCHOR_MODES,
};

import {
  DEFAULT_DIAGNOSTIC_BUFFER_SNAPSHOT,
  createInitialNetworkDiagnosticsState,
  type DiagnosticProbeTelemetry,
  type DiagnosticBufferSnapshot,
  type DiagnosticDumpExportOptions,
  type NetworkDiagnosticsBridge,
  type NetworkMetrics,
  type NetworkDiagnosticsState,
} from './networkDiagnosticsTypes';

export {
  DEFAULT_DIAGNOSTIC_BUFFER_SNAPSHOT,
  createInitialNetworkDiagnosticsState,
  type DiagnosticProbeTelemetry,
  type DiagnosticBufferSnapshot,
  type DiagnosticDumpExportOptions,
  type NetworkDiagnosticsBridge,
  type NetworkMetrics,
  type NetworkDiagnosticsState,
};

const stressSim = new NetworkStressSimulator();

let state: NetworkDiagnosticsState = createInitialNetworkDiagnosticsState();

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((cb) => cb());
let isTriggeringBurstDrop = false;

const resolveChannel = () => state.channelRef || null;
const resolveReconciler = () => state.reconcilerRef || null;

function assertFiniteMetric(val: number, name: string) {
  if (val !== undefined && !Number.isFinite(val)) {
    throw new Error(`[networkDiagnosticsStore] Non-finite ${name} encountered: ${val}`);
  }
}

function updateMetricsPatch(patch: Partial<NetworkMetrics>) {
  state = { ...state, metrics: { ...state.metrics, ...patch } };
  notify();
}

export const networkDiagnosticsStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  registerBridge: (bridgePatch: Partial<NetworkDiagnosticsBridge>) => {
    state = {
      ...state,
      bridge: {
        ...state.bridge,
        ...bridgePatch,
      },
    };
  },

  updateDiagnosticBuffers: (patch: Partial<DiagnosticBufferSnapshot>) => {
    updateMetricsPatch({
      diagnosticBuffers: {
        ...state.metrics.diagnosticBuffers,
        ...patch,
      },
    });
  },

  setSession: (reconciler: any, channel: any, bridgeOverride?: Partial<NetworkDiagnosticsBridge>) => {
    const isBridgeObject =
      bridgeOverride &&
      typeof bridgeOverride === 'object' &&
      !('physics' in bridgeOverride) &&
      !('arena' in bridgeOverride);
    state = {
      ...state,
      reconcilerRef: reconciler,
      channelRef: channel,
      bridge: isBridgeObject ? { ...state.bridge, ...bridgeOverride } : state.bridge,
      metrics: {
        ...state.metrics,
        connected: Boolean(channel),
      },
    };
    if (channel) stressSim.syncToChannel(channel);
    if (reconciler) {
      const updateFn = (m: any) => {
        const ch = resolveChannel();
        const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const extraUplinkMs = Math.max(0, Math.round(Number(m.extraUplinkMs ?? ch?.extraUplinkMs ?? stressSim.extraUplinkMs) || 0));
        const extraDownlinkMs = Math.max(0, Math.round(Number(m.extraDownlinkMs ?? ch?.extraDownlinkMs ?? stressSim.extraDownlinkMs) || 0));
        const extraRttMs = extraUplinkMs + extraDownlinkMs;
        const effectiveRtt = m.rttMs ?? ch?.rttMs ?? extraRttMs;
        const uplinkMs = m.uplinkMs ?? Math.max(0, Math.round((effectiveRtt - extraRttMs) * 0.5) + extraUplinkMs);
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

        const packetLossPct = ch?.packetLossRate !== undefined
          ? Math.round(ch.packetLossRate * 100)
          : (ch?.simulatedPacketLossPct ?? state.metrics.packetLossPct);
        const jitterMs = ch?.jitterMs ?? ch?.measuredJitterMs ?? state.metrics.jitterMs;
        const inputBufferDepth = m.inputBufferSize ?? reconciler.metrics?.inputBufferSize ?? 0;
        const rollbackWindow = m.rollbackWindow ?? reconciler.history?.length ?? 0;
        const lastErrorUu = m.lastCorrectionDelta ?? reconciler.metrics?.lastCorrectionDelta ?? 0;
        const maxErrorUu = m.maxCorrectionDelta ?? reconciler.metrics?.maxCorrectionDelta ?? 0;
        const opponentRttMs = Array.isArray(m.allUserRtt) && m.allUserRtt.length > 1
          ? m.allUserRtt[1]
          : (typeof ch?.peerRttMs === 'number' ? ch.peerRttMs : 0);
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
        reconciler.onMetricsUpdated = (m: any) => {
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
    notify();
  },

  setAsymmetricLatency: (uplinkMs: number, downlinkMs: number) => {
    const upVal = Math.max(0, Math.min(500, Math.round(uplinkMs)));
    const downVal = Math.max(0, Math.min(500, Math.round(downlinkMs)));
    const extraRttMs = upVal + downVal;
    const ch = resolveChannel();
    stressSim.setStress({ extraUplinkMs: upVal, extraDownlinkMs: downVal }, ch);
    const reconciler = resolveReconciler();
    let nextLeadTicks = state.metrics.clientLeadTicks;
    let nextRttMs = ch ? (ch.rttMs ?? extraRttMs) : extraRttMs;
    let nextUplinkMs = upVal;
    let nextDownlinkMs = downVal;
    if (reconciler) {
      const breakdown = reconciler._resolveLatencyBreakdown ? reconciler._resolveLatencyBreakdown() : null;
      const effectiveRtt = breakdown ? breakdown.rttMs : (reconciler._resolveEffectiveRtt ? reconciler._resolveEffectiveRtt() : nextRttMs);
      nextRttMs = effectiveRtt;
      nextUplinkMs = breakdown ? breakdown.uplinkMs : Math.max(0, Math.round((effectiveRtt - extraRttMs) * 0.5) + upVal);
      nextDownlinkMs = breakdown ? breakdown.downlinkMs : Math.max(0, effectiveRtt - nextUplinkMs);
      nextLeadTicks = reconciler.calculateLeadTicks(effectiveRtt);
      reconciler.leadTicks = nextLeadTicks;
      if (reconciler.metrics) {
        reconciler.metrics.leadTicks = nextLeadTicks;
        reconciler.metrics.rttMs = effectiveRtt;
        reconciler.metrics.uplinkMs = nextUplinkMs;
        reconciler.metrics.downlinkMs = nextDownlinkMs;
        reconciler.metrics.extraUplinkMs = upVal;
        reconciler.metrics.extraDownlinkMs = downVal;
        reconciler.metrics.extraRttMs = extraRttMs;
      }
      reconciler.notifyMetricsUpdated?.();
    }
    const health = stressSim.getHealthSnapshot({
      rttMs: nextRttMs,
      jitterMs: state.metrics.jitterMs,
      packetLossPct: state.metrics.packetLossPct,
      lastErrorUu: state.metrics.lastErrorUu,
    });
    updateMetricsPatch({
      extraUplinkMs: upVal,
      extraDownlinkMs: downVal,
      extraRttMs,
      extraLatencyMs: Math.round(extraRttMs * 0.5),
      rttMs: nextRttMs,
      uplinkMs: nextUplinkMs,
      downlinkMs: nextDownlinkMs,
      clientLeadTicks: nextLeadTicks,
      qualityScore: health.score,
      qualityGrade: health.grade,
    });
  },

  setExtraUplinkLatency: (ms: number) => {
    networkDiagnosticsStore.setAsymmetricLatency(ms, state.metrics.extraDownlinkMs);
  },

  setExtraDownlinkLatency: (ms: number) => {
    networkDiagnosticsStore.setAsymmetricLatency(state.metrics.extraUplinkMs, ms);
  },

  setExtraLatency: (ms: number) => {
    const val = Math.max(0, Math.min(500, Math.round(ms)));
    networkDiagnosticsStore.setAsymmetricLatency(val, val);
  },

  setJitter: (ms: number) => {
    const val = Math.max(0, Math.min(200, Math.round(ms)));
    stressSim.setStress({ jitterMs: val }, resolveChannel());
    const health = stressSim.getHealthSnapshot({
      rttMs: state.metrics.rttMs,
      jitterMs: val,
      packetLossPct: state.metrics.packetLossPct,
      lastErrorUu: state.metrics.lastErrorUu,
    });
    updateMetricsPatch({ jitterMs: val, qualityScore: health.score, qualityGrade: health.grade });
    resolveReconciler()?.notifyMetricsUpdated?.();
  },

  adjustExtraLatency: (direction: number, stepMs?: number) => {
    const step = stepMs ?? state.metrics.adjustStepMs;
    networkDiagnosticsStore.setAsymmetricLatency(
      Math.max(0, Math.min(500, state.metrics.extraUplinkMs + direction * step)),
      Math.max(0, Math.min(500, state.metrics.extraDownlinkMs + direction * step))
    );
  },

  setAdjustStep: (stepMs: number) => updateMetricsPatch({ adjustStepMs: Math.max(1, stepMs) }),

  setPacketLoss: (pct: number) => {
    const val = Math.max(0, Math.min(100, pct));
    stressSim.setStress({ packetLossPct: val }, resolveChannel());
    const health = stressSim.getHealthSnapshot({
      rttMs: state.metrics.rttMs,
      jitterMs: state.metrics.jitterMs,
      packetLossPct: val,
      lastErrorUu: state.metrics.lastErrorUu,
    });
    updateMetricsPatch({ packetLossPct: val, qualityScore: health.score, qualityGrade: health.grade });
    resolveReconciler()?.notifyMetricsUpdated?.();
  },

  setBurstDropEnabled: (enabled: boolean) => {
    const nextEnabled = Boolean(enabled);
    const safePeriod = Math.max(1, Math.floor(state.metrics.burstPeriodMs || 2000));
    let safeDuration = Math.max(0, Math.min(safePeriod - 1, Math.floor(state.metrics.burstDurationMs || 0)));
    if (nextEnabled && safeDuration <= 0) {
      safeDuration = Math.min(safePeriod - 1, Math.max(1, Math.floor(safePeriod * 0.375)));
    }
    const safePct = Math.min(99, Math.floor((safeDuration / safePeriod) * 100));
    stressSim.setStress(
      { burstDropEnabled: nextEnabled, burstPeriodMs: safePeriod, burstDurationMs: safeDuration },
      resolveChannel()
    );
    updateMetricsPatch({
      burstDropEnabled: nextEnabled,
      burstPeriodMs: safePeriod,
      burstDurationMs: safeDuration,
      burstDurationPct: safePct,
    });
    resolveReconciler()?.notifyMetricsUpdated?.();
    return nextEnabled;
  },

  toggleBurstDrop: (forceEnabled?: boolean) => {
    const nextEnabled = forceEnabled !== undefined ? Boolean(forceEnabled) : !state.metrics.burstDropEnabled;
    return networkDiagnosticsStore.setBurstDropEnabled(nextEnabled);
  },

  setBurstPeriodMs: (periodMs: number) => {
    const safePeriod = Math.max(1, Math.floor(Number(periodMs) || 2000));
    const safeDuration = Math.max(0, Math.min(safePeriod - 1, Math.floor(state.metrics.burstDurationMs || 0)));
    const safePct = Math.min(99, Math.floor((safeDuration / safePeriod) * 100));
    stressSim.setStress(
      { burstDropEnabled: state.metrics.burstDropEnabled, burstPeriodMs: safePeriod, burstDurationMs: safeDuration },
      resolveChannel()
    );
    updateMetricsPatch({
      burstPeriodMs: safePeriod,
      burstDurationMs: safeDuration,
      burstDurationPct: safePct,
    });
  },

  setBurstDurationMs: (durationMs: number) => {
    const safePeriod = Math.max(1, Math.floor(state.metrics.burstPeriodMs || 2000));
    const safeDuration = Math.max(0, Math.min(safePeriod - 1, Math.floor(Number(durationMs) || 0)));
    const safePct = Math.min(99, Math.floor((safeDuration / safePeriod) * 100));
    const nextEnabled = safeDuration > 0;
    stressSim.setStress(
      { burstDropEnabled: nextEnabled, burstPeriodMs: safePeriod, burstDurationMs: safeDuration },
      resolveChannel()
    );
    updateMetricsPatch({
      burstDropEnabled: nextEnabled,
      burstDurationMs: safeDuration,
      burstDurationPct: safePct,
    });
  },

  setBurstDurationPct: (pct: number) => {
    const safePct = Math.max(0, Math.min(99, Math.floor(Number(pct) || 0)));
    const safePeriod = Math.max(1, Math.floor(state.metrics.burstPeriodMs || 2000));
    const safeDuration = Math.max(0, Math.min(safePeriod - 1, Math.floor((safePct / 100) * safePeriod)));
    const nextEnabled = safeDuration > 0;
    stressSim.setStress(
      { burstDropEnabled: nextEnabled, burstPeriodMs: safePeriod, burstDurationMs: safeDuration },
      resolveChannel()
    );
    updateMetricsPatch({
      burstDropEnabled: nextEnabled,
      burstDurationPct: safePct,
      burstDurationMs: safeDuration,
    });
  },

  applyStressPreset: (presetId: string) => {
    const channel = resolveChannel();
    const preset = stressSim.applyPreset(presetId, channel);
    networkDiagnosticsStore.setAsymmetricLatency(preset.extraUplinkMs, preset.extraDownlinkMs);
    networkDiagnosticsStore.setJitter(preset.jitterMs);
    networkDiagnosticsStore.setPacketLoss(preset.packetLossPct);
    const health = stressSim.getHealthSnapshot({
      rttMs: Math.max(state.metrics.rttMs, preset.extraUplinkMs + preset.extraDownlinkMs),
      jitterMs: preset.jitterMs,
      packetLossPct: preset.packetLossPct,
      lastErrorUu: state.metrics.lastErrorUu,
    });
    updateMetricsPatch({
      stressPresetId: preset.id,
      impairmentPresetId: preset.id,
      qualityScore: health.score,
      qualityGrade: health.grade,
      healthState: health.healthState,
      packetAgeMs: health.packetAgeMs,
      neutralFallbackActive: health.neutralFallbackActive,
      disconnectEvicted: health.disconnectEvicted,
    });
    resolveReconciler()?.notifyMetricsUpdated?.();
  },

  applyImpairmentPreset: (presetId: string) => {
    networkDiagnosticsStore.applyStressPreset(presetId);
  },

  setVisualSmoothing: (enabled: boolean) => {
    const reconciler = resolveReconciler();
    if (reconciler) {
      if (typeof reconciler.setEnableSmoothing === 'function') reconciler.setEnableSmoothing(enabled);
      else reconciler.enableSmoothing = enabled;
    }
    updateMetricsPatch({ visualSmoothing: enabled });
  },

  toggleZeroGFleet: async (forceEnabled?: boolean) => {
    const nextEnabled = forceEnabled !== undefined ? forceEnabled : !state.metrics.zeroGFleetEnabled;
    await state.bridge.onToggleZeroGFleet?.(nextEnabled, state.metrics.zeroGAnchorMode);
    const probeTelemetry = nextEnabled && state.bridge.onSampleZeroGFleetTelemetry
      ? (state.bridge.onSampleZeroGFleetTelemetry() || [])
      : [];
    updateMetricsPatch({
      zeroGFleetEnabled: nextEnabled,
      observationTarget: nextEnabled ? state.metrics.observationTarget : 0,
      probeTelemetry,
    });
  },

  setZeroGAnchorMode: async (anchorMode: string) => {
    await state.bridge.onSetZeroGAnchorMode?.(anchorMode);
    updateMetricsPatch({ zeroGAnchorMode: anchorMode });
  },

  setObservationTarget: (targetCarIndex: number) => {
    const idx = Math.max(0, Math.min(7, Math.floor(targetCarIndex)));
    state.bridge.onSetObservationTarget?.(idx);
    updateMetricsPatch({ observationTarget: idx });
  },

  syncZeroGFleetState: (enabled: boolean) => {
    const probeTelemetry = enabled && state.bridge.onSampleZeroGFleetTelemetry
      ? (state.bridge.onSampleZeroGFleetTelemetry() || [])
      : [];
    updateMetricsPatch({
      zeroGFleetEnabled: Boolean(enabled),
      probeTelemetry,
    });
  },

  setTestCarAudioEnabled: (enabled: boolean) => {
    const next = Boolean(enabled);
    state.bridge.onSetTestCarAudioEnabled?.(next);
    updateMetricsPatch({ testCarAudioEnabled: next });
    return next;
  },

  toggleTestCarAudio: (forceEnabled?: boolean) => {
    const next = forceEnabled !== undefined ? Boolean(forceEnabled) : !state.metrics.testCarAudioEnabled;
    return networkDiagnosticsStore.setTestCarAudioEnabled(next);
  },

  setLobbyGhostMode: (enabled: boolean) => {
    state.bridge.onSetLobbyGhostMode?.(enabled);
    updateMetricsPatch({ lobbyGhostMode: Boolean(enabled) });
  },

  setDiagnosticMaxCapacity: (frames: number) => {
    state.bridge.onSetDiagnosticMaxCapacity?.(frames);
    networkDiagnosticsStore.updateDiagnosticBuffers({
      maxClientFrames: frames,
      clientOverflowPaused:
        state.metrics.diagnosticBuffers.clientFrames < frames
          ? false
          : state.metrics.diagnosticBuffers.clientOverflowPaused,
    });
  },

  setDiagnosticAutoPauseOverflow: (enabled: boolean) => {
    state.bridge.onSetDiagnosticAutoPauseOverflow?.(enabled);
    networkDiagnosticsStore.updateDiagnosticBuffers({ autoPauseOnOverflow: enabled });
  },

  toggleDiagnosticRecordingPause: () => {
    const nextActive = !state.metrics.diagnosticBuffers.clientRecordingActive;
    state.bridge.onToggleDiagnosticRecordingPause?.(nextActive);
    networkDiagnosticsStore.updateDiagnosticBuffers({
      clientRecordingActive: nextActive,
      clientOverflowPaused: false,
    });
  },

  clearDiagnosticBuffers: () => {
    state.bridge.onClearDiagnosticBuffers?.();
    networkDiagnosticsStore.updateDiagnosticBuffers({
      clientFrames: 0,
      telemetryTicks: 0,
      serverFrames: 0,
      clientOverflowPaused: false,
      starvationCount: 0,
      hardResyncCount: 0,
    });
  },

  resetLatency: () => {
    networkDiagnosticsStore.setBurstDropEnabled(false);
    networkDiagnosticsStore.applyStressPreset(NETWORK_STRESS_PRESETS.IDEAL_LAN.id);
  },

  resetStats: () => {
    resolveReconciler()?.resetStats?.();
    stressSim.clearBlackout(resolveChannel());
    updateMetricsPatch({
      corrections: 0,
      mispredictions: 0,
      lastErrorUu: 0,
      maxErrorUu: 0,
      healthState: CONNECTION_HEALTH_STATES.HEALTHY,
      packetAgeMs: 0,
      neutralFallbackActive: false,
      disconnectEvicted: false,
    });
  },

  dumpNextPacket: () => {
    if (state.bridge.onDumpNextPacket) state.bridge.onDumpNextPacket();
    else if (state.reconcilerRef?.dumpNextPacket) state.reconcilerRef.dumpNextPacket();
  },

  dumpLatestPacket: () => {
    if (state.bridge.onDumpLatestPacket) state.bridge.onDumpLatestPacket();
    else if (state.reconcilerRef?.dumpPacketDiagnostics) state.reconcilerRef.dumpPacketDiagnostics();
  },

  triggerBurstDrop: (count?: number) => {
    if (isTriggeringBurstDrop) return;
    isTriggeringBurstDrop = true;
    try {
      const cnt = count ?? state.metrics.burstDropCount;
      if (state.bridge.onTriggerBurstDrop) state.bridge.onTriggerBurstDrop(cnt);
      else if (state.channelRef?.forceDropNextInput) state.channelRef.forceDropNextInput(cnt);
    } finally {
      isTriggeringBurstDrop = false;
    }
  },

  getDiagnosticDump: () => ({
    timestamp: new Date().toISOString(),
    ...state.metrics,
  }),

  copyDiagnostics: () => {
    const text = JSON.stringify(networkDiagnosticsStore.getDiagnosticDump(), null, 2);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch((err) => {
        console.warn('[networkDiagnosticsStore] Failed to copy diagnostics to clipboard:', err);
      });
    }
  },
};

export const useNetworkDiagnosticsData = () =>
  useSyncExternalStore(networkDiagnosticsStore.subscribe, networkDiagnosticsStore.getSnapshot);
