import {
  MAX_TELEMETRY_TICKS,
  TELEMETRY_EVENT_FLAGS,
  evaluatePacingControllerStep,
  simulatePacingOnRecordedTrace,
} from '../config/pacingControllerEvaluator';

export {
  MAX_TELEMETRY_TICKS,
  TELEMETRY_EVENT_FLAGS,
  evaluatePacingControllerStep,
  simulatePacingOnRecordedTrace,
};

export class PacingTelemetryRecorder {
  constructor(maxTicks = MAX_TELEMETRY_TICKS) {
    this.maxTicks = maxTicks;
    this.timeMs = new Float32Array(maxTicks);
    this.clientTick = new Int32Array(maxTicks);
    this.serverTick = new Int32Array(maxTicks);
    this.rawRttMs = new Float32Array(maxTicks);
    this.smoothRttMs = new Float32Array(maxTicks);
    this.jitterMs = new Float32Array(maxTicks);
    this.serverBuffer = new Int8Array(maxTicks);
    this.effectiveBuffer = new Float32Array(maxTicks);
    this.targetBuffer = new Float32Array(maxTicks);
    this.physicsRateHz = new Float32Array(maxTicks);
    this.leadTicks = new Int16Array(maxTicks);
    this.posErrorUu = new Float32Array(maxTicks);
    this.localPosErrorUu = new Float32Array(maxTicks);
    this.ballPosErrorUu = new Float32Array(maxTicks);
    this.remotePosErrorUu = new Float32Array(maxTicks);
    this.probePosErrorUu = new Float32Array(maxTicks);
    this.reconcileTier = new Uint8Array(maxTicks);
    this.tierState = new Int8Array(maxTicks);
    this.eventFlags = new Uint8Array(maxTicks);

    this.count = 0;
    this.sessionStartMs = -1;
    this.isOverflowFrozen = false;
    this.overflowNotified = false;
    this.onCapacityOverflow = null;

    this.starvationCount = 0;
    this.hardResyncCount = 0;
    this.tier3SnapCount = 0;
    this.catchupStepCount = 0;
    this.skipStepCount = 0;
    this.tierSwitchCount = 0;

    this.activeMode = 'csts';
    this.activePriority = 'balanced';
    this.activeParams = null;
  }

  reset(nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now()) {
    this.count = 0;
    this.sessionStartMs = nowMs;
    this.isOverflowFrozen = false;
    this.overflowNotified = false;
    this.starvationCount = 0;
    this.hardResyncCount = 0;
    this.tier3SnapCount = 0;
    this.catchupStepCount = 0;
    this.skipStepCount = 0;
    this.tierSwitchCount = 0;
  }

  setSessionMetadata(mode, priority, params) {
    if (mode) this.activeMode = mode;
    if (priority) this.activePriority = priority;
    if (params) this.activeParams = { ...params };
  }

  recordTick(sample) {
    if (this.isOverflowFrozen) {
      return false;
    }
    if (this.count >= this.maxTicks) {
      this.isOverflowFrozen = true;
      if (!this.overflowNotified) {
        this.overflowNotified = true;
        if (typeof this.onCapacityOverflow === 'function') {
          try {
            this.onCapacityOverflow(this);
          } catch (err) {
            console.warn('[PacingTelemetryRecorder] Error in onCapacityOverflow callback:', err);
          }
        }
      }
      return false;
    }

    const nowMs = sample.nowMs ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (this.sessionStartMs < 0) {
      this.sessionStartMs = nowMs;
    }

    const idx = this.count++;
    this.timeMs[idx] = Math.max(0, nowMs - this.sessionStartMs);
    this.clientTick[idx] = sample.clientTick | 0;
    this.serverTick[idx] = sample.serverTick | 0;
    this.rawRttMs[idx] = sample.rawRttMs || 0;
    this.smoothRttMs[idx] = sample.smoothRttMs || sample.rawRttMs || 0;
    this.jitterMs[idx] = sample.jitterMs || 0;

    const clampedSrvBuf = Math.max(-64, Math.min(63, Math.round(sample.serverBuffer ?? 0)));
    this.serverBuffer[idx] = clampedSrvBuf;
    this.effectiveBuffer[idx] = sample.effectiveBuffer ?? clampedSrvBuf;
    this.targetBuffer[idx] = sample.targetBuffer ?? 3;
    this.physicsRateHz[idx] = sample.physicsRateHz ?? 120;
    this.leadTicks[idx] = sample.leadTicks ?? 3;
    this.posErrorUu[idx] = sample.posErrorUu ?? 0;
    this.localPosErrorUu[idx] = sample.localPosErrorUu ?? sample.posErrorUu ?? 0;
    this.ballPosErrorUu[idx] = sample.ballPosErrorUu ?? 0;
    this.remotePosErrorUu[idx] = sample.remotePosErrorUu ?? 0;
    this.probePosErrorUu[idx] = sample.probePosErrorUu ?? 0;
    this.reconcileTier[idx] = sample.reconcileTier ?? 1;
    this.tierState[idx] = sample.tierState ?? 0;

    let flags = 0;
    if (sample.packetArrived) flags |= TELEMETRY_EVENT_FLAGS.PACKET_ARRIVED;
    if (
      clampedSrvBuf <= 0 &&
      sample.packetArrived &&
      sample.serverTick > 0 &&
      !sample.isKickoffMasked
    ) {
      flags |= TELEMETRY_EVENT_FLAGS.STARVATION;
      this.starvationCount++;
    }
    if (sample.hardResync) {
      flags |= TELEMETRY_EVENT_FLAGS.HARD_RESYNC;
      this.hardResyncCount++;
    }
    if (sample.stepCatchup) {
      flags |= TELEMETRY_EVENT_FLAGS.STEP_CATCHUP;
      this.catchupStepCount++;
    }
    if (sample.stepSkip) {
      flags |= TELEMETRY_EVENT_FLAGS.STEP_SKIP;
      this.skipStepCount++;
    }
    if (sample.tierSwitched) {
      flags |= TELEMETRY_EVENT_FLAGS.TIER_SWITCH;
      this.tierSwitchCount++;
    }
    if (sample.tier3Snap || sample.reconcileTier === 3) {
      flags |= TELEMETRY_EVENT_FLAGS.TIER3_SNAP;
      this.tier3SnapCount++;
    }
    if (sample.isKickoffMasked) {
      flags |= TELEMETRY_EVENT_FLAGS.KICKOFF_MASKED;
    }
    this.eventFlags[idx] = flags;
    return true;
  }

  getSummaryStats() {
    const n = this.count;
    if (n <= 0) {
      return {
        recordedTicks: 0,
        durationSeconds: 0,
        capacityPct: 0,
        isOverflowFrozen: this.isOverflowFrozen,
        starvationCount: 0,
        starvationPct: 0,
        hardResyncCount: 0,
        tier3SnapCount: 0,
        catchupStepCount: 0,
        skipStepCount: 0,
        tierSwitchCount: 0,
        rateSwitchesPerMin: 0,
        meanRttMs: 0,
        maxJitterMs: 0,
        meanBufferTicks: 0,
        p95BufferAbsError: 0,
        stdPhysicsRateHz: 0,
        estimated5050LeadPenaltyMs: 0,
        reconcileBreakdown: {
          tier1NoOpCount: 0,
          tier2RollbackCount: 0,
          tier3HardSnapCount: 0,
          localPosErrorMaxUu: 0,
          ballPosErrorMaxUu: 0,
          remotePosErrorMaxUu: 0,
          probePosErrorMaxUu: 0,
        },
        recommendedMode: 'sts',
        recommendedPriority: 'balanced',
        recommendationReason: 'No active match samples recorded yet.',
      };
    }

    const durationSec = Math.max(0.01, (this.timeMs[n - 1] - this.timeMs[0]) / 1000.0);
    let sumRtt = 0;
    let maxJitter = 0;
    let sumBuf = 0;
    let sumRate = 0;
    let sumLead = 0;
    let tier1NoOpCount = 0;
    let tier2RollbackCount = 0;
    let tier3HardSnapCount = 0;
    let localPosErrorMaxUu = 0;
    let ballPosErrorMaxUu = 0;
    let remotePosErrorMaxUu = 0;
    let probePosErrorMaxUu = 0;
    for (let i = 0; i < n; i++) {
      sumRtt += this.rawRttMs[i];
      if (this.jitterMs[i] > maxJitter) maxJitter = this.jitterMs[i];
      sumBuf += this.serverBuffer[i];
      sumRate += this.physicsRateHz[i];
      sumLead += this.leadTicks[i];
      const rt = this.reconcileTier[i] || 1;
      if (rt === 3) tier3HardSnapCount++;
      else if (rt === 2) tier2RollbackCount++;
      else tier1NoOpCount++;
      if (this.localPosErrorUu[i] > localPosErrorMaxUu) localPosErrorMaxUu = this.localPosErrorUu[i];
      if (this.ballPosErrorUu[i] > ballPosErrorMaxUu) ballPosErrorMaxUu = this.ballPosErrorUu[i];
      if (this.remotePosErrorUu[i] > remotePosErrorMaxUu) remotePosErrorMaxUu = this.remotePosErrorUu[i];
      if (this.probePosErrorUu[i] > probePosErrorMaxUu) probePosErrorMaxUu = this.probePosErrorUu[i];
    }
    const meanRtt = sumRtt / n;
    const meanBuf = sumBuf / n;
    const meanRate = sumRate / n;
    const meanLead = sumLead / n;

    let sumRateVar = 0;
    const stride = Math.max(1, Math.floor(n / 2000));
    const absErrors = [];
    for (let i = 0; i < n; i++) {
      const dr = this.physicsRateHz[i] - meanRate;
      sumRateVar += dr * dr;
      if (i % stride === 0) {
        absErrors.push(Math.abs(this.serverBuffer[i] - this.targetBuffer[i]));
      }
    }
    absErrors.sort((a, b) => a - b);
    const p95Idx = Math.min(absErrors.length - 1, Math.floor(absErrors.length * 0.95));
    const p95Err = absErrors.length > 0 ? absErrors[p95Idx] : 0;

    const starvationPct = Math.round((this.starvationCount / n) * 10000) / 100;
    const roundedMeanRtt = Math.round(meanRtt * 10) / 10;
    const roundedMaxJitter = Math.round(maxJitter * 10) / 10;

    let recommendedMode = 'csts';
    let recommendedPriority = 'balanced';
    let recommendationReason = '';
    if (roundedMaxJitter <= 4.5 && starvationPct < 0.5) {
      recommendedMode = 'sts';
      recommendedPriority = roundedMeanRtt <= 25 ? 'low_latency_5050' : 'rate_stability';
      recommendationReason = `Stable link (RTT ${roundedMeanRtt}ms, max jitter ${roundedMaxJitter}ms): STS 2-tier Schmitt deadband locks clock at 120.00Hz without continuous PD micro-modulation.`;
    } else if (roundedMaxJitter > 12.0 || starvationPct >= 2.0) {
      recommendedMode = 'csts';
      recommendedPriority = 'anti_starvation';
      recommendationReason = `High jitter/loss link (max jitter ${roundedMaxJitter}ms, starvation ${starvationPct}%): CSTS with Anti-Starvation dynamic target boost recommended.`;
    } else {
      recommendedMode = 'csts';
      recommendedPriority = 'balanced';
      recommendationReason = `Moderate jitter link (RTT ${roundedMeanRtt}ms, max jitter ${roundedMaxJitter}ms): CSTS with Balanced deadband damping recommended.`;
    }

    return {
      recordedTicks: n,
      durationSeconds: Math.round(durationSec * 10) / 10,
      capacityPct: Math.round((n / this.maxTicks) * 1000) / 10,
      isOverflowFrozen: this.isOverflowFrozen,
      starvationCount: this.starvationCount,
      starvationPct,
      hardResyncCount: this.hardResyncCount,
      tier3SnapCount: this.tier3SnapCount,
      catchupStepCount: this.catchupStepCount,
      skipStepCount: this.skipStepCount,
      tierSwitchCount: this.tierSwitchCount,
      rateSwitchesPerMin: Math.round((this.tierSwitchCount / (durationSec / 60.0)) * 10) / 10,
      meanRttMs: roundedMeanRtt,
      maxJitterMs: roundedMaxJitter,
      meanBufferTicks: Math.round(meanBuf * 100) / 100,
      p95BufferAbsError: Math.round(p95Err * 100) / 100,
      stdPhysicsRateHz: Math.round(Math.sqrt(sumRateVar / n) * 1000) / 1000,
      estimated5050LeadPenaltyMs: Math.round(meanLead * (1000.0 / 120.0) * 10) / 10,
      reconcileBreakdown: {
        tier1NoOpCount,
        tier2RollbackCount,
        tier3HardSnapCount,
        localPosErrorMaxUu: Math.round(localPosErrorMaxUu * 100) / 100,
        ballPosErrorMaxUu: Math.round(ballPosErrorMaxUu * 100) / 100,
        remotePosErrorMaxUu: Math.round(remotePosErrorMaxUu * 100) / 100,
        probePosErrorMaxUu: Math.round(probePosErrorMaxUu * 100) / 100,
      },
      recommendedMode,
      recommendedPriority,
      recommendationReason,
    };
  }

  getRecentWindow(windowSize = 360) {
    const n = this.count;
    const count = Math.min(n, Math.max(10, windowSize));
    const start = Math.max(0, n - count);
    return {
      count,
      start,
      totalCount: n,
      timeMs: this.timeMs.subarray(start, start + count),
      rawRttMs: this.rawRttMs.subarray(start, start + count),
      smoothRttMs: this.smoothRttMs.subarray(start, start + count),
      jitterMs: this.jitterMs.subarray(start, start + count),
      serverBuffer: this.serverBuffer.subarray(start, start + count),
      effectiveBuffer: this.effectiveBuffer.subarray(start, start + count),
      targetBuffer: this.targetBuffer.subarray(start, start + count),
      physicsRateHz: this.physicsRateHz.subarray(start, start + count),
      eventFlags: this.eventFlags.subarray(start, start + count),
    };
  }

  toMetadataObject() {
    const n = this.count;
    const summary = this.getSummaryStats();
    return {
      schemaVersion: 'rc-network-telemetry-v2',
      exportedAt: new Date().toISOString(),
      metadata: {
        clockPacingMode: this.activeMode,
        clockPacingPriority: this.activePriority,
        clockPacingParams: this.activeParams,
        maxCapacityTicks: this.maxTicks,
        recordedTicks: n,
      },
      summary,
    };
  }

  toSerializableObject() {
    const n = this.count;
    const meta = this.toMetadataObject();
    return {
      ...meta,
      schemaVersion: 'rc-network-telemetry-v2',
      columns: {
        timeMs: Array.from(this.timeMs.subarray(0, n), (v) => Math.round(v * 10) / 10),
        clientTick: Array.from(this.clientTick.subarray(0, n)),
        serverTick: Array.from(this.serverTick.subarray(0, n)),
        rawRttMs: Array.from(this.rawRttMs.subarray(0, n), (v) => Math.round(v * 100) / 100),
        smoothRttMs: Array.from(this.smoothRttMs.subarray(0, n), (v) => Math.round(v * 100) / 100),
        jitterMs: Array.from(this.jitterMs.subarray(0, n), (v) => Math.round(v * 100) / 100),
        serverBuffer: Array.from(this.serverBuffer.subarray(0, n)),
        effectiveBuffer: Array.from(this.effectiveBuffer.subarray(0, n), (v) => Math.round(v * 100) / 100),
        targetBuffer: Array.from(this.targetBuffer.subarray(0, n), (v) => Math.round(v * 100) / 100),
        physicsRateHz: Array.from(this.physicsRateHz.subarray(0, n), (v) => Math.round(v * 100) / 100),
        leadTicks: Array.from(this.leadTicks.subarray(0, n)),
        posErrorUu: Array.from(this.posErrorUu.subarray(0, n), (v) => Math.round(v * 100) / 100),
        localPosErrorUu: Array.from(this.localPosErrorUu.subarray(0, n), (v) => Math.round(v * 100) / 100),
        ballPosErrorUu: Array.from(this.ballPosErrorUu.subarray(0, n), (v) => Math.round(v * 100) / 100),
        remotePosErrorUu: Array.from(this.remotePosErrorUu.subarray(0, n), (v) => Math.round(v * 100) / 100),
        probePosErrorUu: Array.from(this.probePosErrorUu.subarray(0, n), (v) => Math.round(v * 100) / 100),
        reconcileTier: Array.from(this.reconcileTier.subarray(0, n)),
        tierState: Array.from(this.tierState.subarray(0, n)),
        eventFlags: Array.from(this.eventFlags.subarray(0, n)),
      },
    };
  }

  toCsvString() {
    const n = this.count;
    const lines = [
      'index,timeMs,clientTick,serverTick,rawRttMs,smoothRttMs,jitterMs,serverBuffer,effectiveBuffer,targetBuffer,physicsRateHz,leadTicks,posErrorUu,tierState,eventFlags,localPosErrorUu,ballPosErrorUu,remotePosErrorUu,probePosErrorUu,reconcileTier',
    ];
    for (let i = 0; i < n; i++) {
      lines.push(
        `${i},${this.timeMs[i].toFixed(1)},${this.clientTick[i]},${this.serverTick[i]},` +
          `${this.rawRttMs[i].toFixed(2)},${this.smoothRttMs[i].toFixed(2)},${this.jitterMs[i].toFixed(2)},` +
          `${this.serverBuffer[i]},${this.effectiveBuffer[i].toFixed(2)},${this.targetBuffer[i].toFixed(2)},` +
          `${this.physicsRateHz[i].toFixed(2)},${this.leadTicks[i]},${this.posErrorUu[i].toFixed(2)},` +
          `${this.tierState[i]},${this.eventFlags[i]},` +
          `${this.localPosErrorUu[i].toFixed(2)},${this.ballPosErrorUu[i].toFixed(2)},` +
          `${this.remotePosErrorUu[i].toFixed(2)},${this.probePosErrorUu[i].toFixed(2)},${this.reconcileTier[i]}`
      );
    }
    return lines.join('\n');
  }
}

/**
 * Counterfactual Offline What-If Evaluator:
 * Re-simulates a candidate (mode, params) configuration over a recorded telemetry trace
 * (either from a live PacingTelemetryRecorder or an imported JSON trace object).
 */
export const globalPacingTelemetryRecorder = new PacingTelemetryRecorder(MAX_TELEMETRY_TICKS);
