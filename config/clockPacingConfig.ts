/**
 * clockPacingConfig.ts
 * Pure configuration types, trade-off priority presets, custom parameter defaults,
 * and LocalStorage persistence helpers for Input Buffer & Clock Pacing algorithms.
 */

import {
  STORAGE_KEYS,
  safeStorage,
  isPlainObject,
  booleanOrDefault,
  clampNumberOrDefault,
  stringOrDefault,
} from './storageHelpers.ts';

export type ClockPacingMode = 'legacy' | 'sts' | 'csts' | 'custom';

export type ClockPacingPriority =
  | 'low_latency_5050'
  | 'balanced'
  | 'anti_starvation'
  | 'rate_stability';

export type ClockRateStepMode = 'discrete_2tier' | 'continuous_pd' | 'hybrid';

export interface ClockPacingParams {
  targetBufferTicks: number;
  deadbandCatchupOffset: number;
  deadbandSkipOffset: number;
  rateStepMode: ClockRateStepMode;
  tier1Hz: number;
  tier2Hz: number;
  tier1EnterError: number;
  tier1ExitError: number;
  tier2EnterError: number;
  tier2ExitError: number;
  minDwellTicks: number;
  kpHzPerTick: number;
  kdHzPerTickVel: number;
  maxAdjustHz: number;
  inFlightCompGain: number;
  rttEwmaAlpha: number;
  bufferEwmaAlpha: number;
  enableAdaptiveJitterBoost: boolean;
  adaptiveJitterGain: number;
  maxAdaptiveBoostTicks: number;
  enableHardResync: boolean;
  hardResyncThresholdTicks: number;
  hardResyncCooldownMs: number;
}

export interface ClockPacingPriorityDescriptor {
  id: ClockPacingPriority;
  label: string;
  shortLabel: string;
  description: string;
  targetBufferTicks: number;
  deadband: [number, number];
  paramsPatch: Partial<ClockPacingParams>;
}

export const ALLOWED_CLOCK_PACING_MODES: readonly ClockPacingMode[] = Object.freeze([
  'legacy',
  'sts',
  'csts',
  'custom',
]);

export const ALLOWED_CLOCK_PACING_PRIORITIES: readonly ClockPacingPriority[] = Object.freeze([
  'low_latency_5050',
  'balanced',
  'anti_starvation',
  'rate_stability',
]);

export const ALLOWED_RATE_STEP_MODES: readonly ClockRateStepMode[] = Object.freeze([
  'discrete_2tier',
  'continuous_pd',
  'hybrid',
]);

export const DEFAULT_CLOCK_PACING_PARAMS: ClockPacingParams = Object.freeze({
  targetBufferTicks: 3,
  deadbandCatchupOffset: -2,
  deadbandSkipOffset: 2,
  rateStepMode: 'continuous_pd',
  tier1Hz: 1.0,
  tier2Hz: 3.0,
  tier1EnterError: 1.0,
  tier1ExitError: 0.4,
  tier2EnterError: 2.5,
  tier2ExitError: 1.3,
  minDwellTicks: 18,
  kpHzPerTick: 0.85,
  kdHzPerTickVel: 0.35,
  maxAdjustHz: 6.0,
  inFlightCompGain: 0.85,
  rttEwmaAlpha: 0.12,
  bufferEwmaAlpha: 0.25,
  enableAdaptiveJitterBoost: true,
  adaptiveJitterGain: 1.25,
  maxAdaptiveBoostTicks: 4.0,
  enableHardResync: true,
  hardResyncThresholdTicks: 10,
  hardResyncCooldownMs: 1000,
});

export const CLOCK_PACING_PRIORITY_PRESETS: Record<
  ClockPacingPriority,
  ClockPacingPriorityDescriptor
> = Object.freeze({
  low_latency_5050: {
    id: 'low_latency_5050',
    label: '50/50 Accuracy & Minimal Lead',
    shortLabel: '50/50 Lead',
    description:
      'Minimizes forward prediction ticks for sharper 50/50 challenges. Accepts occasional input starvation during severe jitter spikes.',
    targetBufferTicks: 2,
    deadband: [-1, 1],
    paramsPatch: {
      targetBufferTicks: 2,
      deadbandCatchupOffset: -1,
      deadbandSkipOffset: 1,
      tier1Hz: 1.5,
      tier2Hz: 4.0,
      tier1EnterError: 0.8,
      tier1ExitError: 0.3,
      tier2EnterError: 2.0,
      tier2ExitError: 1.0,
      minDwellTicks: 12,
      kpHzPerTick: 1.15,
      kdHzPerTickVel: 0.35,
      maxAdjustHz: 6.0,
      inFlightCompGain: 0.9,
      bufferEwmaAlpha: 0.32,
      adaptiveJitterGain: 0.65,
      maxAdaptiveBoostTicks: 2.5,
      hardResyncThresholdTicks: 8,
    },
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced (Default)',
    shortLabel: 'Balanced',
    description:
      'Balances 50/50 prediction lead against input buffer safety and smooth clock rate transitions.',
    targetBufferTicks: 3,
    deadband: [-2, 2],
    paramsPatch: {
      targetBufferTicks: 3,
      deadbandCatchupOffset: -2,
      deadbandSkipOffset: 2,
      tier1Hz: 1.0,
      tier2Hz: 3.0,
      tier1EnterError: 1.0,
      tier1ExitError: 0.4,
      tier2EnterError: 2.5,
      tier2ExitError: 1.3,
      minDwellTicks: 18,
      kpHzPerTick: 0.85,
      kdHzPerTickVel: 0.35,
      maxAdjustHz: 6.0,
      inFlightCompGain: 0.85,
      bufferEwmaAlpha: 0.25,
      adaptiveJitterGain: 1.25,
      maxAdaptiveBoostTicks: 4.0,
      hardResyncThresholdTicks: 10,
    },
  },
  anti_starvation: {
    id: 'anti_starvation',
    label: 'Anti-Starvation & Jitter Shield',
    shortLabel: 'Anti-Starve',
    description:
      'Prioritizes zero input starvation on unstable connections by maintaining a deeper buffer and stronger jitter margin.',
    targetBufferTicks: 4,
    deadband: [-1, 3],
    paramsPatch: {
      targetBufferTicks: 4,
      deadbandCatchupOffset: -1,
      deadbandSkipOffset: 3,
      tier1Hz: 1.25,
      tier2Hz: 3.5,
      tier1EnterError: 0.85,
      tier1ExitError: 0.35,
      tier2EnterError: 2.1,
      tier2ExitError: 1.1,
      minDwellTicks: 16,
      kpHzPerTick: 1.0,
      kdHzPerTickVel: 0.4,
      maxAdjustHz: 6.0,
      inFlightCompGain: 0.85,
      bufferEwmaAlpha: 0.28,
      adaptiveJitterGain: 2.0,
      maxAdaptiveBoostTicks: 5.5,
      hardResyncThresholdTicks: 12,
    },
  },
  rate_stability: {
    id: 'rate_stability',
    label: 'Physics Rate Stability',
    shortLabel: 'Rate Stable',
    description:
      'Minimizes clock frequency adjustments and state transitions, using gentle fractional pacing and wide hysteresis.',
    targetBufferTicks: 3,
    deadband: [-2, 2],
    paramsPatch: {
      targetBufferTicks: 3,
      deadbandCatchupOffset: -2,
      deadbandSkipOffset: 2,
      tier1Hz: 0.5,
      tier2Hz: 1.5,
      tier1EnterError: 1.5,
      tier1ExitError: 0.6,
      tier2EnterError: 3.2,
      tier2ExitError: 1.8,
      minDwellTicks: 36,
      kpHzPerTick: 0.45,
      kdHzPerTickVel: 0.55,
      maxAdjustHz: 3.0,
      inFlightCompGain: 0.9,
      bufferEwmaAlpha: 0.15,
      adaptiveJitterGain: 1.0,
      maxAdaptiveBoostTicks: 3.5,
      hardResyncThresholdTicks: 12,
    },
  },
});

export function sanitizeClockPacingParams(
  raw: unknown,
  fallback: ClockPacingParams = DEFAULT_CLOCK_PACING_PARAMS
): ClockPacingParams {
  if (!isPlainObject(raw)) {
    return { ...fallback };
  }

  const targetBufferTicks = clampNumberOrDefault(raw.targetBufferTicks, fallback.targetBufferTicks, {
    min: 1,
    max: 12,
    integer: true,
  });
  const deadbandCatchupOffset = clampNumberOrDefault(
    raw.deadbandCatchupOffset,
    fallback.deadbandCatchupOffset,
    { min: -12, max: 0, integer: true }
  );
  const deadbandSkipOffset = clampNumberOrDefault(
    raw.deadbandSkipOffset,
    fallback.deadbandSkipOffset,
    { min: 0, max: 12, integer: true }
  );
  const rateStepMode = stringOrDefault(
    raw.rateStepMode,
    ALLOWED_RATE_STEP_MODES,
    fallback.rateStepMode
  ) as ClockRateStepMode;

  const tier1Hz = clampNumberOrDefault(raw.tier1Hz, fallback.tier1Hz, { min: 0.1, max: 6.0 });
  const tier2Hz = clampNumberOrDefault(raw.tier2Hz, fallback.tier2Hz, {
    min: Math.max(0.2, tier1Hz),
    max: 12.0,
  });

  const tier1EnterError = clampNumberOrDefault(raw.tier1EnterError, fallback.tier1EnterError, {
    min: 0.2,
    max: 8.0,
  });
  const tier1ExitError = clampNumberOrDefault(raw.tier1ExitError, fallback.tier1ExitError, {
    min: 0.0,
    max: Math.max(0.1, tier1EnterError - 0.1),
  });
  const tier2EnterError = clampNumberOrDefault(raw.tier2EnterError, fallback.tier2EnterError, {
    min: Math.max(0.5, tier1EnterError + 0.2),
    max: 12.0,
  });
  const tier2ExitError = clampNumberOrDefault(raw.tier2ExitError, fallback.tier2ExitError, {
    min: Math.max(0.1, tier1ExitError),
    max: Math.max(0.2, tier2EnterError - 0.1),
  });

  const minDwellTicks = clampNumberOrDefault(raw.minDwellTicks, fallback.minDwellTicks, {
    min: 0,
    max: 240,
    integer: true,
  });
  const kpHzPerTick = clampNumberOrDefault(raw.kpHzPerTick, fallback.kpHzPerTick, {
    min: 0.05,
    max: 4.0,
  });
  const kdHzPerTickVel = clampNumberOrDefault(raw.kdHzPerTickVel, fallback.kdHzPerTickVel, {
    min: 0.0,
    max: 3.0,
  });
  const maxAdjustHz = clampNumberOrDefault(raw.maxAdjustHz, fallback.maxAdjustHz, {
    min: 0.5,
    max: 12.0,
  });
  const inFlightCompGain = clampNumberOrDefault(raw.inFlightCompGain, fallback.inFlightCompGain, {
    min: 0.0,
    max: 1.2,
  });
  const rttEwmaAlpha = clampNumberOrDefault(raw.rttEwmaAlpha, fallback.rttEwmaAlpha, {
    min: 0.01,
    max: 0.8,
  });
  const bufferEwmaAlpha = clampNumberOrDefault(raw.bufferEwmaAlpha, fallback.bufferEwmaAlpha, {
    min: 0.02,
    max: 1.0,
  });
  const enableAdaptiveJitterBoost = booleanOrDefault(
    raw.enableAdaptiveJitterBoost,
    fallback.enableAdaptiveJitterBoost
  );
  const adaptiveJitterGain = clampNumberOrDefault(
    raw.adaptiveJitterGain,
    fallback.adaptiveJitterGain,
    { min: 0.0, max: 4.0 }
  );
  const maxAdaptiveBoostTicks = clampNumberOrDefault(
    raw.maxAdaptiveBoostTicks,
    fallback.maxAdaptiveBoostTicks,
    { min: 0.0, max: 10.0 }
  );
  const enableHardResync = booleanOrDefault(raw.enableHardResync, fallback.enableHardResync);
  const hardResyncThresholdTicks = clampNumberOrDefault(
    raw.hardResyncThresholdTicks,
    fallback.hardResyncThresholdTicks,
    { min: 4, max: 40, integer: true }
  );
  const hardResyncCooldownMs = clampNumberOrDefault(
    raw.hardResyncCooldownMs,
    fallback.hardResyncCooldownMs,
    { min: 100, max: 10000, integer: true }
  );

  return {
    targetBufferTicks,
    deadbandCatchupOffset,
    deadbandSkipOffset,
    rateStepMode,
    tier1Hz,
    tier2Hz,
    tier1EnterError,
    tier1ExitError,
    tier2EnterError,
    tier2ExitError,
    minDwellTicks,
    kpHzPerTick,
    kdHzPerTickVel,
    maxAdjustHz,
    inFlightCompGain,
    rttEwmaAlpha,
    bufferEwmaAlpha,
    enableAdaptiveJitterBoost,
    adaptiveJitterGain,
    maxAdaptiveBoostTicks,
    enableHardResync,
    hardResyncThresholdTicks,
    hardResyncCooldownMs,
  };
}

export function resolveEffectiveClockPacingParams(
  mode: ClockPacingMode,
  priority: ClockPacingPriority,
  targetBufferTicks: number,
  thresholdRange: [number, number],
  customParams: ClockPacingParams
): ClockPacingParams {
  if (mode === 'custom') {
    return sanitizeClockPacingParams(customParams);
  }

  const preset = CLOCK_PACING_PRIORITY_PRESETS[priority] || CLOCK_PACING_PRIORITY_PRESETS.balanced;
  const base: ClockPacingParams = {
    ...DEFAULT_CLOCK_PACING_PARAMS,
    ...preset.paramsPatch,
    targetBufferTicks: clampNumberOrDefault(targetBufferTicks, preset.targetBufferTicks, {
      min: 1,
      max: 12,
      integer: true,
    }),
    deadbandCatchupOffset: clampNumberOrDefault(thresholdRange?.[0], preset.deadband[0], {
      min: -12,
      max: 0,
      integer: true,
    }),
    deadbandSkipOffset: clampNumberOrDefault(thresholdRange?.[1], preset.deadband[1], {
      min: 0,
      max: 12,
      integer: true,
    }),
  };

  if (mode === 'legacy') {
    return {
      ...base,
      rateStepMode: 'discrete_2tier',
      tier1Hz: 0,
      tier2Hz: 0,
      maxAdjustHz: 0,
      enableAdaptiveJitterBoost: false,
    };
  }

  if (mode === 'sts') {
    return {
      ...base,
      rateStepMode: 'discrete_2tier',
      enableAdaptiveJitterBoost: false,
    };
  }

  return {
    ...base,
    rateStepMode: 'continuous_pd',
    enableAdaptiveJitterBoost: true,
  };
}

/**
 * Hydrate initial ClockPacingMode from LocalStorage.
 * Intentionally allows 'custom' to remain selected even when developerMode is false,
 * so a user who tuned custom parameters in developer mode and turned developer mode off
 * continues running their custom parameters until they click Legacy, STS, or CSTS.
 */
export function getInitialClockPacingMode(): ClockPacingMode {
  const raw = safeStorage.get(STORAGE_KEYS.CLOCK_PACING);
  if (raw && (ALLOWED_CLOCK_PACING_MODES as readonly string[]).includes(raw)) {
    return raw as ClockPacingMode;
  }
  return 'csts';
}

export function getInitialClockPacingPriority(): ClockPacingPriority {
  const raw = safeStorage.get(STORAGE_KEYS.CLOCK_PACING_PRIORITY);
  if (raw && (ALLOWED_CLOCK_PACING_PRIORITIES as readonly string[]).includes(raw)) {
    return raw as ClockPacingPriority;
  }
  return 'balanced';
}

export function getInitialCustomClockPacingParams(): ClockPacingParams {
  const raw = safeStorage.get(STORAGE_KEYS.CLOCK_PACING_CUSTOM_PARAMS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return sanitizeClockPacingParams(parsed, DEFAULT_CLOCK_PACING_PARAMS);
    } catch (err) {
      console.warn('[clockPacingConfig] Failed to parse stored custom clock pacing params:', err);
    }
  }
  return { ...DEFAULT_CLOCK_PACING_PARAMS };
}

export function saveCustomClockPacingParams(params: ClockPacingParams): ClockPacingParams {
  const clean = sanitizeClockPacingParams(params, DEFAULT_CLOCK_PACING_PARAMS);
  safeStorage.set(STORAGE_KEYS.CLOCK_PACING_CUSTOM_PARAMS, JSON.stringify(clean));
  return clean;
}
