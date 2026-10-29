/**
 * PacingTelemetryRecorder.js
 * High-performance, zero-allocation 20-minute (144,000 ticks @ 120Hz) telemetry recorder,
 * exporter (.json / .csv), and counterfactual What-If offline pacing simulator.
 */

export const MAX_TELEMETRY_TICKS = 144000; // 20 minutes @ 120Hz

export const TELEMETRY_EVENT_FLAGS = Object.freeze({
  PACKET_ARRIVED: 0x01,
  STARVATION: 0x02,
  HARD_RESYNC: 0x04,
  STEP_CATCHUP: 0x08,
  STEP_SKIP: 0x10,
  TIER_SWITCH: 0x20,
  TIER3_SNAP: 0x40,
  KICKOFF_MASKED: 0x80,
});

function numOr(val, fallback) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Pure step evaluation of the Clock Pacing Controller (shared between live runtime
 * in ReconciliationTimelineHelper and offline What-If simulation).
 */
export function evaluatePacingControllerStep(state, input, mode, params = {}) {
  const tickDtSec = 1.0 / 120.0;
  const rttAlpha = Math.max(0.01, Math.min(0.8, numOr(params.rttEwmaAlpha, 0.12)));
  const bufAlpha = Math.max(0.02, Math.min(1.0, numOr(params.bufferEwmaAlpha, 0.25)));

  const sampleRtt = Math.max(0, numOr(input.rawRttMs, 0));
  if (!state.initialized) {
    state.smoothRttMs = sampleRtt;
    state.jitterMs = 0;
    state.smoothBuffer = Number.isFinite(input.rawServerBuffer)
      ? input.rawServerBuffer
      : numOr(params.targetBufferTicks, 3);
    state.prevSmoothBuffer = state.smoothBuffer;
    state.inFlightBiasTicks = 0;
    state.currentTier = 0;
    state.dwellTicks = 0;
    state.currentRateHz = 120.0;
    state.lastHardResyncMs = -100000;
    state.initialized = true;
  } else if (input.packetArrived) {
    const rttDelta = Math.abs(sampleRtt - state.smoothRttMs);
    state.smoothRttMs = state.smoothRttMs * (1 - rttAlpha) + sampleRtt * rttAlpha;
    state.jitterMs = state.jitterMs * (1 - rttAlpha) + rttDelta * rttAlpha;
  }

  // Decay in-flight rate bias over RTT and integrate current clock rate deviation
  const rttSec = Math.max(0.008333, state.smoothRttMs / 1000.0);
  const decayFactor = Math.exp(-tickDtSec / Math.max(0.016, rttSec));
  const rateDevHz = (state.currentRateHz || 120.0) - 120.0;
  state.inFlightBiasTicks = state.inFlightBiasTicks * decayFactor + rateDevHz * tickDtSec;

  const rawBuf = Number.isFinite(input.rawServerBuffer)
    ? input.rawServerBuffer
    : state.smoothBuffer;
  state.prevSmoothBuffer = state.smoothBuffer;
  if (input.packetArrived) {
    state.smoothBuffer = state.smoothBuffer * (1 - bufAlpha) + rawBuf * bufAlpha;
  }

  const inFlightCompGain = Math.max(0, Math.min(1.2, numOr(params.inFlightCompGain, 0.85)));
  const effectiveBuffer = state.smoothBuffer + state.inFlightBiasTicks * inFlightCompGain;
  const bufferVelTicksPerSec = (state.smoothBuffer - state.prevSmoothBuffer) * 120.0;

  // Dynamic target buffer boost under high RTT jitter (when enabled in CSTS / Custom)
  const baseTarget = Math.max(1, Math.min(12, numOr(params.targetBufferTicks, 3)));
  let adaptiveBoost = 0;
  if (params.enableAdaptiveJitterBoost && mode !== 'legacy' && mode !== 'sts') {
    const jitterTicks = state.jitterMs / (1000.0 / 120.0);
    const gain = Math.max(0, numOr(params.adaptiveJitterGain, 1.25));
    const maxBoost = Math.max(0, numOr(params.maxAdaptiveBoostTicks, 4.0));
    adaptiveBoost = Math.min(maxBoost, jitterTicks * gain * 0.5);
  }
  const activeTarget = baseTarget + adaptiveBoost;

  const catchupOffset = Math.min(0, numOr(params.deadbandCatchupOffset, -2));
  const skipOffset = Math.max(0, numOr(params.deadbandSkipOffset, 2));
  const lowerBand = activeTarget + catchupOffset;
  const upperBand = activeTarget + skipOffset;

  // Buffer error: positive means buffer is too deep (client too far ahead -> slow down),
  // negative means buffer is too shallow (client starving -> speed up).
  const bufferError = effectiveBuffer - activeTarget;

  let nextRateHz = 120.0;
  let nextTier = state.currentTier;
  let requestHardResync = false;
  let requestStepCatchup = false;
  let requestStepSkip = false;

  const nowMs = numOr(input.nowMs, 0);
  const hardThresh = Math.max(4, numOr(params.hardResyncThresholdTicks, 10));
  const hardCooldown = Math.max(100, numOr(params.hardResyncCooldownMs, 1000));
  if (
    params.enableHardResync !== false &&
    Math.abs(rawBuf - activeTarget) >= hardThresh &&
    nowMs - state.lastHardResyncMs >= hardCooldown
  ) {
    requestHardResync = true;
    state.lastHardResyncMs = nowMs;
    state.inFlightBiasTicks = 0;
    state.smoothBuffer = activeTarget;
    nextTier = 0;
    state.dwellTicks = 0;
  }

  state.dwellTicks = (state.dwellTicks || 0) + 1;

  if (mode === 'legacy') {
    nextRateHz = 120.0;
    nextTier = 0;
    if (input.packetArrived && !requestHardResync) {
      if (rawBuf < lowerBand) {
        requestStepCatchup = true;
      } else if (rawBuf > upperBand) {
        requestStepSkip = true;
      }
    }
  } else {
    const stepMode = mode === 'sts' ? 'discrete_2tier' : (params.rateStepMode || 'continuous_pd');
    const tier1Hz = Math.max(0, numOr(params.tier1Hz, 1.0));
    const tier2Hz = Math.max(tier1Hz, numOr(params.tier2Hz, 3.0));
    const t1Enter = Math.max(0.2, numOr(params.tier1EnterError, 1.0));
    const t1Exit = Math.max(0.0, Math.min(t1Enter - 0.05, numOr(params.tier1ExitError, 0.4)));
    const t2Enter = Math.max(t1Enter + 0.2, numOr(params.tier2EnterError, 2.5));
    const t2Exit = Math.max(t1Exit, Math.min(t2Enter - 0.1, numOr(params.tier2ExitError, 1.3)));
    const minDwell = Math.max(0, numOr(params.minDwellTicks, 18));
    const canRelaxTier = state.dwellTicks >= minDwell;

    // Schmitt Trigger 2-Tier State Machine (used directly by 'discrete_2tier' and as tier indicator for 'continuous_pd')
    const absErr = Math.abs(bufferError);
    const sign = bufferError < 0 ? 1 : -1; // bufferError < 0 -> need positive Hz (+1/+2 tier) to build buffer

    if (absErr >= t2Enter) {
      nextTier = 2 * sign;
    } else if (Math.abs(state.currentTier) === 2 && Math.sign(state.currentTier) === sign) {
      if (absErr <= t2Exit && canRelaxTier) {
        nextTier = absErr <= t1Exit ? 0 : 1 * sign;
      } else {
        nextTier = 2 * sign;
      }
    } else if (absErr >= t1Enter) {
      nextTier = 1 * sign;
    } else if (Math.abs(state.currentTier) === 1 && Math.sign(state.currentTier) === sign) {
      if (absErr <= t1Exit && canRelaxTier) {
        nextTier = 0;
      } else {
        nextTier = 1 * sign;
      }
    } else if (canRelaxTier) {
      nextTier = 0;
    }

    if (nextTier !== state.currentTier) {
      state.dwellTicks = 0;
    }

    const isZeroLatencyLocal =
      sampleRtt === 0 &&
      state.smoothRttMs < 0.05 &&
      state.jitterMs < 0.05 &&
      Math.abs(rawBuf - baseTarget) <= 1.5;

    if (isZeroLatencyLocal) {
      nextTier = 0;
      nextRateHz = 120.0;
      state.dwellTicks = 0;
    } else if (stepMode === 'discrete_2tier') {
      if (nextTier === 2) nextRateHz = 120.0 + tier2Hz;
      else if (nextTier === 1) nextRateHz = 120.0 + tier1Hz;
      else if (nextTier === -1) nextRateHz = 120.0 - tier1Hz;
      else if (nextTier === -2) nextRateHz = 120.0 - tier2Hz;
      else nextRateHz = 120.0;
    } else if (stepMode === 'hybrid' && nextTier === 0) {
      nextRateHz = 120.0;
    } else {
      // Continuous PD fractional Hz controller with deadband softening & gated derivative
      const kp = Math.max(0.05, numOr(params.kpHzPerTick, 0.85));
      const kd = Math.max(0.0, numOr(params.kdHzPerTickVel, 0.35));
      const maxAdj = Math.max(0.5, numOr(params.maxAdjustHz, 6.0));

      let deadbandExcess = 0;
      let derivativeGate = 1.0;
      if (effectiveBuffer < lowerBand) {
        deadbandExcess = effectiveBuffer - lowerBand; // negative
      } else if (effectiveBuffer > upperBand) {
        deadbandExcess = effectiveBuffer - upperBand; // positive
      } else if (Math.abs(bufferError) > t1Enter) {
        deadbandExcess = (bufferError - Math.sign(bufferError) * t1Exit) * 0.35;
        derivativeGate = Math.min(
          1.0,
          (Math.abs(bufferError) - t1Enter) / Math.max(0.25, t2Enter - t1Enter)
        );
      } else {
        deadbandExcess = 0;
        derivativeGate = 0;
      }

      if (deadbandExcess === 0 && derivativeGate === 0) {
        nextRateHz = 120.0;
      } else {
        const rawDeltaHz =
          -kp * deadbandExcess - kd * derivativeGate * (bufferVelTicksPerSec * 0.08);
        const clampedDeltaHz = Math.max(-maxAdj, Math.min(maxAdj, rawDeltaHz));
        nextRateHz = Math.round((120.0 + clampedDeltaHz) * 100) / 100;
      }
    }

    // Emergency starvation catchup guard if server buffer drops deeply negative
    if (input.packetArrived && !requestHardResync && rawBuf <= -2 && effectiveBuffer < lowerBand - 1.5) {
      requestStepCatchup = true;
      state.inFlightBiasTicks = 0;
    } else if (input.packetArrived && !requestHardResync && rawBuf > upperBand + 4) {
      requestStepSkip = true;
      state.inFlightBiasTicks = 0;
    }
  }

  const tierSwitched = nextTier !== state.currentTier;
  state.currentTier = nextTier;
  state.currentRateHz = nextRateHz;

  return {
    physicsRateHz: nextRateHz,
    tierState: nextTier,
    tierSwitched,
    effectiveBuffer,
    activeTarget,
    lowerBand,
    upperBand,
    smoothRttMs: state.smoothRttMs,
    jitterMs: state.jitterMs,
    requestHardResync,
    requestStepCatchup,
    requestStepSkip,
  };
}


export function simulatePacingOnRecordedTrace(traceSource, candidateModeOrParams, candidateParamsOrMode, maxPreviewSamples = 360) {
  let candidateMode = 'custom';
  let candidateParams = {};
  if (typeof candidateModeOrParams === 'string') {
    candidateMode = candidateModeOrParams;
    candidateParams = candidateParamsOrMode || {};
  } else if (candidateModeOrParams && typeof candidateModeOrParams === 'object') {
    candidateParams = candidateModeOrParams;
    if (typeof candidateParamsOrMode === 'string') {
      candidateMode = candidateParamsOrMode;
    }
  }
  const cols = traceSource?.columns || traceSource;
  const n = traceSource?.count ?? cols?.timeMs?.length ?? 0;
  if (!cols || n <= 0) {
    return null;
  }

  const timeMs = cols.timeMs;
  const rawRttMs = cols.rawRttMs;
  const recServerBuffer = cols.serverBuffer;
  const recPhysicsRateHz = cols.physicsRateHz;
  const recTargetBuffer = cols.targetBuffer;
  const recEventFlags = cols.eventFlags;

  const simBufferSeries = new Float32Array(n);
  const simTargetSeries = new Float32Array(n);
  const simRateSeries = new Float32Array(n);
  const simFlagsSeries = new Uint8Array(n);

  const ctrlState = { initialized: false };
  const tickDtSec = 1.0 / 120.0;

  let cumulativeRecTicks = 0;
  let cumulativeSimTicks = 0;
  const initialTargetDiff = (Number(candidateParams?.targetBufferTicks) || 3) - (recTargetBuffer?.[0] || 3);

  let starvationTicks = 0;
  let hardResyncCount = 0;
  let catchupStepCount = 0;
  let skipStepCount = 0;
  let rateSwitchCount = 0;
  let sumRate = 0;
  let sumBuf = 0;
  let sumLeadTicks = 0;

  for (let i = 0; i < n; i++) {
    const recFlags = recEventFlags ? recEventFlags[i] : 1;
    const packetArrived = Boolean(recFlags & TELEMETRY_EVENT_FLAGS.PACKET_ARRIVED) || i % 2 === 0;

    // Reconstruct the counterfactual server input buffer by replacing the historical client clock
    // integration with the candidate controller's clock integration + discrete adjustments.
    const recRateDev = (recPhysicsRateHz ? recPhysicsRateHz[i] : 120.0) - 120.0;
    cumulativeRecTicks += recRateDev * tickDtSec;

    const netBaselineBuffer =
      (recServerBuffer ? recServerBuffer[i] : 3) - cumulativeRecTicks + initialTargetDiff;
    const simulatedRawServerBuffer = Math.max(
      -64,
      Math.min(63, Math.round(netBaselineBuffer + cumulativeSimTicks))
    );

    const stepOut = evaluatePacingControllerStep(
      ctrlState,
      {
        nowMs: timeMs[i],
        rawRttMs: rawRttMs[i],
        rawServerBuffer: simulatedRawServerBuffer,
        packetArrived,
      },
      candidateMode,
      candidateParams
    );

    const simRateDev = stepOut.physicsRateHz - 120.0;
    cumulativeSimTicks += simRateDev * tickDtSec;

    if (stepOut.requestHardResync) {
      cumulativeSimTicks = stepOut.activeTarget - netBaselineBuffer;
      hardResyncCount++;
    } else if (stepOut.requestStepCatchup) {
      cumulativeSimTicks += Math.max(1, stepOut.activeTarget - simulatedRawServerBuffer);
      catchupStepCount++;
    } else if (stepOut.requestStepSkip) {
      cumulativeSimTicks -= Math.max(1, simulatedRawServerBuffer - stepOut.activeTarget);
      skipStepCount++;
    }

    const finalSimBuf = Math.max(-64, Math.min(63, netBaselineBuffer + cumulativeSimTicks));
    simBufferSeries[i] = finalSimBuf;
    simTargetSeries[i] = stepOut.activeTarget;
    simRateSeries[i] = stepOut.physicsRateHz;

    let flags = packetArrived ? TELEMETRY_EVENT_FLAGS.PACKET_ARRIVED : 0;
    if (finalSimBuf <= 0 && packetArrived) {
      flags |= TELEMETRY_EVENT_FLAGS.STARVATION;
      starvationTicks++;
    }
    if (stepOut.requestHardResync) flags |= TELEMETRY_EVENT_FLAGS.HARD_RESYNC;
    if (stepOut.requestStepCatchup) flags |= TELEMETRY_EVENT_FLAGS.STEP_CATCHUP;
    if (stepOut.requestStepSkip) flags |= TELEMETRY_EVENT_FLAGS.STEP_SKIP;
    if (stepOut.tierSwitched) {
      flags |= TELEMETRY_EVENT_FLAGS.TIER_SWITCH;
      rateSwitchCount++;
    }
    simFlagsSeries[i] = flags;

    sumRate += stepOut.physicsRateHz;
    sumBuf += finalSimBuf;
    const oneWayTicks = Math.ceil((rawRttMs[i] * 0.5) / (1000.0 / 120.0));
    sumLeadTicks += Math.max(1, oneWayTicks + Math.max(0, finalSimBuf));
  }

  const durationSec = Math.max(0.01, (timeMs[n - 1] - timeMs[0]) / 1000.0);
  const meanRate = sumRate / n;
  const meanBuf = sumBuf / n;
  const meanLead = sumLeadTicks / n;

  let sumRateVar = 0;
  const stride = Math.max(1, Math.floor(n / 2000));
  const absErrors = [];
  for (let i = 0; i < n; i++) {
    const dr = simRateSeries[i] - meanRate;
    sumRateVar += dr * dr;
    if (i % stride === 0) {
      absErrors.push(Math.abs(simBufferSeries[i] - simTargetSeries[i]));
    }
  }
  absErrors.sort((a, b) => a - b);
  const p95Idx = Math.min(absErrors.length - 1, Math.floor(absErrors.length * 0.95));
  const p95Err = absErrors.length > 0 ? absErrors[p95Idx] : 0;

  const previewCount = Math.min(n, Math.max(10, maxPreviewSamples));
  const previewStart = Math.max(0, n - previewCount);

  return {
    summary: {
      evaluatedTicks: n,
      durationSeconds: Math.round(durationSec * 10) / 10,
      starvationCount: starvationTicks,
      starvationPct: Math.round((starvationTicks / n) * 10000) / 100,
      hardResyncCount,
      catchupStepCount,
      skipStepCount,
      rateSwitchCount,
      rateSwitchesPerMin: Math.round((rateSwitchCount / (durationSec / 60.0)) * 10) / 10,
      meanBufferTicks: Math.round(meanBuf * 100) / 100,
      p95BufferAbsError: Math.round(p95Err * 100) / 100,
      stdPhysicsRateHz: Math.round(Math.sqrt(sumRateVar / n) * 1000) / 1000,
      estimated5050LeadPenaltyMs: Math.round(meanLead * (1000.0 / 120.0) * 10) / 10,
    },
    previewWindow: {
      count: previewCount,
      start: previewStart,
      totalCount: n,
      timeMs: timeMs.slice ? timeMs.slice(previewStart, previewStart + previewCount) : timeMs,
      rawRttMs: rawRttMs.slice ? rawRttMs.slice(previewStart, previewStart + previewCount) : rawRttMs,
      simBuffer: simBufferSeries.subarray(previewStart, previewStart + previewCount),
      simTarget: simTargetSeries.subarray(previewStart, previewStart + previewCount),
      simRateHz: simRateSeries.subarray(previewStart, previewStart + previewCount),
      simFlags: simFlagsSeries.subarray(previewStart, previewStart + previewCount),
    },
  };
}

