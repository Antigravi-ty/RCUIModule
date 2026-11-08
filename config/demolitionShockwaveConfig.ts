/**
 * demolitionShockwaveConfig.ts
 * Pure configuration schema, defaults, and simulation event dispatch for the
 * single-quad camera-facing Demolition Shockwave Ring effect.
 */

export type DemolitionShockwaveBlendingMode = 'additive' | 'normal';

export interface DemolitionShockwaveConfig {
  enabled: boolean;

  // Timing & Expansion
  durationSec: number;
  startOuterRadiusUu: number;
  endOuterRadiusUu: number;
  expansionCurvePower: number;
  verticalLiftUu: number;

  // Inner / Outer Ring Thickness & Softness
  startInnerRadiusRatio: number;
  endInnerRadiusRatio: number;
  innerEdgeSoftnessPct: number;
  outerEdgeSoftnessPct: number;

  // 3-Stop Radial & Temporal Color Gradient (Inner Core -> Mid Fire -> Outer Shock Rim)
  coreColor: string;
  midColor: string;
  outerColor: string;
  midColorStopPct: number;
  emissiveIntensity: number;

  // Center Flash Burst (Integrated into same shader pass)
  centerFlashIntensity: number;
  centerFlashRadiusPct: number;
  centerFlashDurationRatio: number;

  // Opacity & Distance Readability Boost
  peakOpacity: number;
  fadeStartProgress: number;
  fadeCurvePower: number;
  distanceScaleBoost: number;
  distanceMinRadiusPx: number;
  blendingMode: DemolitionShockwaveBlendingMode;

  // Developer Simulation Coordinates (RocketSim UU: X right, Y forward, Z up)
  simTargetX: number;
  simTargetY: number;
  simTargetZ: number;
  simAutoRepeat: boolean;
  simRepeatIntervalSec: number;
  simPlayAudio: boolean;
}

export type DemolitionShockwaveConfigPatch = Partial<DemolitionShockwaveConfig>;

export interface DemolitionShockwaveSimPayload {
  x: number;
  y: number;
  z: number;
  playAudio: boolean;
  timestampMs: number;
}

export interface DemolitionShockwavePreset {
  id: string;
  label: string;
  description: string;
  patch: DemolitionShockwaveConfigPatch;
}

export const DEFAULT_DEMOLITION_SHOCKWAVE_CONFIG: Readonly<DemolitionShockwaveConfig> =
  Object.freeze({
    enabled: true,

    durationSec: 0.68,
    startOuterRadiusUu: 110,
    endOuterRadiusUu: 760,
    expansionCurvePower: 2.8,
    verticalLiftUu: 42,

    startInnerRadiusRatio: 0.12,
    endInnerRadiusRatio: 0.84,
    innerEdgeSoftnessPct: 24,
    outerEdgeSoftnessPct: 14,

    coreColor: '#fff6cc',
    midColor: '#ff6a00',
    outerColor: '#ff1e00',
    midColorStopPct: 58,
    emissiveIntensity: 2.4,

    centerFlashIntensity: 2.8,
    centerFlashRadiusPct: 48,
    centerFlashDurationRatio: 0.32,

    peakOpacity: 0.96,
    fadeStartProgress: 0.28,
    fadeCurvePower: 1.85,
    distanceScaleBoost: 0.35,
    distanceMinRadiusPx: 28,
    blendingMode: 'additive',

    simTargetX: 0,
    simTargetY: 1800,
    simTargetZ: 95,
    simAutoRepeat: false,
    simRepeatIntervalSec: 1.1,
    simPlayAudio: true,
  });

export const DEMOLITION_SHOCKWAVE_PRESETS: readonly DemolitionShockwavePreset[] = Object.freeze([
  {
    id: 'solar-blast',
    label: 'Solar Blast (Default)',
    description: 'High-impact warm gold-to-crimson shockwave ring with crisp outer rim and bright ignition core.',
    patch: {
      durationSec: 0.68,
      startOuterRadiusUu: 110,
      endOuterRadiusUu: 760,
      expansionCurvePower: 2.8,
      startInnerRadiusRatio: 0.12,
      endInnerRadiusRatio: 0.84,
      innerEdgeSoftnessPct: 24,
      outerEdgeSoftnessPct: 14,
      coreColor: '#fff6cc',
      midColor: '#ff6a00',
      outerColor: '#ff1e00',
      midColorStopPct: 58,
      emissiveIntensity: 2.4,
      centerFlashIntensity: 2.8,
      blendingMode: 'additive',
    },
  },
  {
    id: 'plasma-nova',
    label: 'Plasma Nova (Cyan / Violet)',
    description: 'High-contrast electric cyan core expanding into a neon magenta-violet shock front.',
    patch: {
      durationSec: 0.64,
      startOuterRadiusUu: 120,
      endOuterRadiusUu: 820,
      expansionCurvePower: 3.1,
      startInnerRadiusRatio: 0.18,
      endInnerRadiusRatio: 0.88,
      innerEdgeSoftnessPct: 20,
      outerEdgeSoftnessPct: 12,
      coreColor: '#e0ffff',
      midColor: '#00d4ff',
      outerColor: '#a82cff',
      midColorStopPct: 52,
      emissiveIntensity: 2.6,
      centerFlashIntensity: 3.0,
      blendingMode: 'additive',
    },
  },
  {
    id: 'tactical-sonic',
    label: 'Tactical Sonic Ring (Sharp)',
    description: 'Ultra-clean thin expanding shock ring with minimal visual clutter and maximum far-field legibility.',
    patch: {
      durationSec: 0.55,
      startOuterRadiusUu: 140,
      endOuterRadiusUu: 880,
      expansionCurvePower: 3.4,
      startInnerRadiusRatio: 0.45,
      endInnerRadiusRatio: 0.91,
      innerEdgeSoftnessPct: 14,
      outerEdgeSoftnessPct: 9,
      coreColor: '#ffffff',
      midColor: '#ff9d2e',
      outerColor: '#ff3b00',
      midColorStopPct: 68,
      emissiveIntensity: 2.2,
      centerFlashIntensity: 1.8,
      blendingMode: 'additive',
    },
  },
]);

export interface DemolitionCoordinatePreset {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
}

export const DEMOLITION_SIM_COORDINATE_PRESETS: readonly DemolitionCoordinatePreset[] =
  Object.freeze([
    { id: 'center-mid', label: 'Center Field (0, 0, 95)', x: 0, y: 0, z: 95 },
    { id: 'mid-far', label: 'Mid Far (0, 1800, 95)', x: 0, y: 1800, z: 95 },
    { id: 'orange-box', label: 'Orange Goal Box (0, 4200, 95)', x: 0, y: 4200, z: 95 },
    { id: 'blue-box', label: 'Blue Goal Box (0, -4200, 95)', x: 0, y: -4200, z: 95 },
    { id: 'corner-far', label: 'Far Corner (2800, 3600, 120)', x: 2800, y: 3600, z: 120 },
    { id: 'high-air', label: 'High Aerial (0, 2200, 950)', x: 0, y: 2200, z: 950 },
  ]);

export const demolitionShockwaveRuntimeConfig: DemolitionShockwaveConfig = {
  ...DEFAULT_DEMOLITION_SHOCKWAVE_CONFIG,
};

type ShockwaveConfigCallback = (snapshot: DemolitionShockwaveConfig) => void;
const shockwaveConfigCallbacks: ShockwaveConfigCallback[] = [];

type ShockwaveSimCallback = (payload: DemolitionShockwaveSimPayload) => void;
const shockwaveSimCallbacks: ShockwaveSimCallback[] = [];

const VALID_SHOCKWAVE_KEYS = new Set<string>(
  Object.keys(DEFAULT_DEMOLITION_SHOCKWAVE_CONFIG)
);

export function getDemolitionShockwaveConfig(): DemolitionShockwaveConfig {
  return { ...demolitionShockwaveRuntimeConfig };
}

export function subscribeDemolitionShockwaveConfig(
  listener: ShockwaveConfigCallback
): () => void {
  if (typeof listener !== 'function') return () => {};
  if (!shockwaveConfigCallbacks.includes(listener)) {
    shockwaveConfigCallbacks.push(listener);
  }
  return () => {
    const idx = shockwaveConfigCallbacks.indexOf(listener);
    if (idx !== -1) {
      shockwaveConfigCallbacks.splice(idx, 1);
    }
  };
}

function notifyDemolitionShockwaveListeners(): DemolitionShockwaveConfig {
  const snapshot = getDemolitionShockwaveConfig();
  for (const listener of shockwaveConfigCallbacks) {
    try {
      listener(snapshot);
    } catch {
      // ignore listener errors
    }
  }
  return snapshot;
}

export function updateDemolitionShockwaveConfig(
  patch: DemolitionShockwaveConfigPatch = {}
): DemolitionShockwaveConfig {
  if (!patch || typeof patch !== 'object') return getDemolitionShockwaveConfig();
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (VALID_SHOCKWAVE_KEYS.has(k) && v !== undefined) {
      sanitized[k] = v;
    }
  }
  Object.assign(demolitionShockwaveRuntimeConfig, sanitized);
  demolitionShockwaveRuntimeConfig.durationSec = Math.max(
    0.1,
    Math.min(3.0, Number(demolitionShockwaveRuntimeConfig.durationSec) || 0.68)
  );
  demolitionShockwaveRuntimeConfig.endOuterRadiusUu = Math.max(
    demolitionShockwaveRuntimeConfig.startOuterRadiusUu + 10,
    Number(demolitionShockwaveRuntimeConfig.endOuterRadiusUu) || 760
  );
  demolitionShockwaveRuntimeConfig.startInnerRadiusRatio = Math.max(
    0,
    Math.min(0.98, Number(demolitionShockwaveRuntimeConfig.startInnerRadiusRatio) ?? 0.12)
  );
  demolitionShockwaveRuntimeConfig.endInnerRadiusRatio = Math.max(
    demolitionShockwaveRuntimeConfig.startInnerRadiusRatio,
    Math.min(0.99, Number(demolitionShockwaveRuntimeConfig.endInnerRadiusRatio) ?? 0.84)
  );
  return notifyDemolitionShockwaveListeners();
}

export function resetDemolitionShockwaveConfig(): DemolitionShockwaveConfig {
  Object.assign(demolitionShockwaveRuntimeConfig, DEFAULT_DEMOLITION_SHOCKWAVE_CONFIG);
  return notifyDemolitionShockwaveListeners();
}

export function subscribeDemolitionShockwaveSimTrigger(
  listener: ShockwaveSimCallback
): () => void {
  if (typeof listener !== 'function') return () => {};
  if (!shockwaveSimCallbacks.includes(listener)) {
    shockwaveSimCallbacks.push(listener);
  }
  return () => {
    const idx = shockwaveSimCallbacks.indexOf(listener);
    if (idx !== -1) {
      shockwaveSimCallbacks.splice(idx, 1);
    }
  };
}

export function triggerDemolitionShockwaveSimulation(
  coords?: { x?: number; y?: number; z?: number; playAudio?: boolean }
): DemolitionShockwaveSimPayload {
  const cfg = demolitionShockwaveRuntimeConfig;
  const payload: DemolitionShockwaveSimPayload = {
    x: Number.isFinite(coords?.x) ? Number(coords!.x) : cfg.simTargetX,
    y: Number.isFinite(coords?.y) ? Number(coords!.y) : cfg.simTargetY,
    z: Number.isFinite(coords?.z) ? Number(coords!.z) : cfg.simTargetZ,
    playAudio:
      typeof coords?.playAudio === 'boolean' ? coords.playAudio : Boolean(cfg.simPlayAudio),
    timestampMs: Date.now(),
  };
  for (const listener of shockwaveSimCallbacks) {
    try {
      listener(payload);
    } catch {
      // ignore listener errors
    }
  }
  return payload;
}
