/**
 * demolishShockwaveConfig.ts
 * Runtime configuration, smoothstep track evaluator, and 3D coordinate simulation state
 * for the camera-facing demolition shockwave ring effect.
 */

export interface DemolishOuterRadiusKey { t: number; size: number; }
export interface DemolishInnerHoleKey { t: number; innerHole: number; }
export interface DemolishColorKey { t: number; color: string; }
export type DemolishSimAnchorMode = 'custom-xyz' | 'local-car' | 'in-front-car' | 'ball';

export interface DemolishShockwaveConfig {
  enabled: boolean;
  duration: number;
  worldScale: number;
  verticalOffsetUu: number;
  featherPct: number;
  outerFeatherPct: number;
  glowEndNormT: number;
  glowStrength: number;
  fadeStartNormT: number;
  outerKeys: [DemolishOuterRadiusKey, DemolishOuterRadiusKey, DemolishOuterRadiusKey, DemolishOuterRadiusKey];
  innerKeys: [DemolishInnerHoleKey, DemolishInnerHoleKey, DemolishInnerHoleKey, DemolishInnerHoleKey];
  colorKeys: [DemolishColorKey, DemolishColorKey, DemolishColorKey, DemolishColorKey, DemolishColorKey, DemolishColorKey];
  simAnchorMode: DemolishSimAnchorMode;
  simX: number;
  simY: number;
  simZ: number;
  simAutoLoop: boolean;
  simHideTargetCar: boolean;
  simShowReticle: boolean;
}

export interface DemolishShockwaveEvaluatedFrame {
  normT: number;
  elapsedSec: number;
  frameIndex120: number;
  totalFrames120: number;
  size: number;
  worldDiameterUu: number;
  innerHolePct: number;
  rgb: [number, number, number];
  rgbNormalized: [number, number, number];
  cssRgb: string;
  glowFactor: number;
  opacity: number;
}

export interface DemolishShockwaveSimState {
  isPlaying: boolean;
  activeIn3d: boolean;
  normT: number;
  triggerId: number;
  lastStepMs: number;
}

export interface DemolishLiveAnchors {
  carX: number; carY: number; carZ: number;
  carFwdX: number; carFwdY: number;
  ballX: number; ballY: number; ballZ: number;
}

export const DEFAULT_DEMOLISH_SHOCKWAVE_CONFIG: DemolishShockwaveConfig = {
  enabled: true,
  duration: 1.6,
  worldScale: 1.0,
  verticalOffsetUu: 32,
  featherPct: 12,
  outerFeatherPct: 6,
  glowEndNormT: 0.35,
  glowStrength: 0.85,
  fadeStartNormT: 0.75,
  outerKeys: [
    { t: 0.0, size: 6 },
    { t: 0.15, size: 270 },
    { t: 0.55, size: 320 },
    { t: 1.0, size: 350 },
  ],
  innerKeys: [
    { t: 0.0, innerHole: 0 },
    { t: 0.28, innerHole: 0 },
    { t: 0.65, innerHole: 35 },
    { t: 1.0, innerHole: 100 },
  ],
  colorKeys: [
    { t: 0.0, color: '#ffffff' },
    { t: 0.08, color: '#ffe600' },
    { t: 0.25, color: '#ff4500' },
    { t: 0.48, color: '#8c1d00' },
    { t: 0.72, color: '#222020' },
    { t: 1.0, color: '#0d0d0d' },
  ],
  simAnchorMode: 'in-front-car',
  simX: 0,
  simY: -1500,
  simZ: 45,
  simAutoLoop: false,
  simHideTargetCar: false,
  simShowReticle: false,
};

function cloneConfig(src: DemolishShockwaveConfig): DemolishShockwaveConfig {
  return {
    ...src,
    outerKeys: [{ ...src.outerKeys[0] }, { ...src.outerKeys[1] }, { ...src.outerKeys[2] }, { ...src.outerKeys[3] }],
    innerKeys: [{ ...src.innerKeys[0] }, { ...src.innerKeys[1] }, { ...src.innerKeys[2] }, { ...src.innerKeys[3] }],
    colorKeys: [
      { ...src.colorKeys[0] }, { ...src.colorKeys[1] }, { ...src.colorKeys[2] },
      { ...src.colorKeys[3] }, { ...src.colorKeys[4] }, { ...src.colorKeys[5] },
    ],
  };
}

const runtimeHolder: {
  config: DemolishShockwaveConfig;
  sim: DemolishShockwaveSimState;
  anchors: DemolishLiveAnchors;
} = {
  config: cloneConfig(DEFAULT_DEMOLISH_SHOCKWAVE_CONFIG),
  sim: { isPlaying: false, activeIn3d: false, normT: 0, triggerId: 0, lastStepMs: 0 },
  anchors: { carX: 0, carY: -2048, carZ: 17, carFwdX: 0, carFwdY: 1, ballX: 0, ballY: 0, ballZ: 93 },
};

type ConfigListener = (config: DemolishShockwaveConfig) => void;
type SimListener = (sim: DemolishShockwaveSimState, config: DemolishShockwaveConfig) => void;

const configListeners: ConfigListener[] = [];
const simListeners: SimListener[] = [];

function notifyConfigListeners(): void {
  const snapshot = cloneConfig(runtimeHolder.config);
  for (let i = 0; i < configListeners.length; i++) configListeners[i]?.(snapshot);
}

function notifySimListeners(): void {
  const simSnapshot = { ...runtimeHolder.sim };
  for (let i = 0; i < simListeners.length; i++) simListeners[i]?.(simSnapshot, runtimeHolder.config);
}

export function getDemolishShockwaveConfig(): DemolishShockwaveConfig {
  return runtimeHolder.config;
}

export function setDemolishShockwaveConfig(patch: Partial<DemolishShockwaveConfig>): DemolishShockwaveConfig {
  const cur = runtimeHolder.config;
  runtimeHolder.config = {
    ...cur,
    ...patch,
    outerKeys: patch.outerKeys
      ? [{ ...patch.outerKeys[0], t: 0.0 }, { ...patch.outerKeys[1] }, { ...patch.outerKeys[2] }, { ...patch.outerKeys[3], t: 1.0 }]
      : cur.outerKeys,
    innerKeys: patch.innerKeys
      ? [{ ...patch.innerKeys[0], t: 0.0 }, { ...patch.innerKeys[1] }, { ...patch.innerKeys[2] }, { ...patch.innerKeys[3], t: 1.0 }]
      : cur.innerKeys,
    colorKeys: patch.colorKeys
      ? [
          { ...patch.colorKeys[0], t: 0.0 }, { ...patch.colorKeys[1] }, { ...patch.colorKeys[2] },
          { ...patch.colorKeys[3] }, { ...patch.colorKeys[4] }, { ...patch.colorKeys[5], t: 1.0 },
        ]
      : cur.colorKeys,
  };
  notifyConfigListeners();
  notifySimListeners();
  return runtimeHolder.config;
}

export function resetDemolishShockwaveConfig(): DemolishShockwaveConfig {
  runtimeHolder.config = cloneConfig(DEFAULT_DEMOLISH_SHOCKWAVE_CONFIG);
  notifyConfigListeners();
  notifySimListeners();
  return runtimeHolder.config;
}

export function subscribeDemolishShockwaveConfig(listener: ConfigListener): () => void {
  if (!configListeners.includes(listener)) configListeners.push(listener);
  return () => {
    const idx = configListeners.indexOf(listener);
    if (idx !== -1) configListeners.splice(idx, 1);
  };
}

export function subscribeDemolishShockwaveSim(listener: SimListener): () => void {
  if (!simListeners.includes(listener)) simListeners.push(listener);
  return () => {
    const idx = simListeners.indexOf(listener);
    if (idx !== -1) simListeners.splice(idx, 1);
  };
}

export function getDemolishShockwaveSimState(): DemolishShockwaveSimState {
  return runtimeHolder.sim;
}

export function triggerDemolishShockwaveSim(customCoords?: { x?: number; y?: number; z?: number }): void {
  if (customCoords) {
    runtimeHolder.config = {
      ...runtimeHolder.config,
      simAnchorMode: 'custom-xyz',
      simX: typeof customCoords.x === 'number' ? customCoords.x : runtimeHolder.config.simX,
      simY: typeof customCoords.y === 'number' ? customCoords.y : runtimeHolder.config.simY,
      simZ: typeof customCoords.z === 'number' ? customCoords.z : runtimeHolder.config.simZ,
    };
    notifyConfigListeners();
  }
  runtimeHolder.sim = {
    isPlaying: true,
    activeIn3d: true,
    normT: 0,
    triggerId: runtimeHolder.sim.triggerId + 1,
    lastStepMs: typeof performance !== 'undefined' ? performance.now() : 0,
  };
  notifySimListeners();
}

export function scrubDemolishShockwaveSim(normT: number, isPlaying = false): void {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(normT) ? normT : 0));
  runtimeHolder.sim = {
    ...runtimeHolder.sim,
    isPlaying,
    activeIn3d: true,
    normT: clamped,
    lastStepMs: typeof performance !== 'undefined' ? performance.now() : 0,
  };
  notifySimListeners();
}

export function stopDemolishShockwaveSim(clear3d = false): void {
  runtimeHolder.sim = {
    ...runtimeHolder.sim,
    isPlaying: false,
    activeIn3d: clear3d ? false : runtimeHolder.sim.activeIn3d,
  };
  notifySimListeners();
}

export function advanceDemolishShockwaveSimClock(nowMs: number): void {
  const sim = runtimeHolder.sim;
  if (!sim.isPlaying) return;
  if (sim.lastStepMs <= 0) {
    sim.lastStepMs = nowMs;
    return;
  }
  const dtSec = (nowMs - sim.lastStepMs) / 1000;
  if (dtSec < 0.002) return;
  sim.lastStepMs = nowMs;

  const cfg = runtimeHolder.config;
  const duration = Math.max(0.1, cfg.duration || 1.6);
  const nextNormT = sim.normT + Math.min(0.1, Math.max(0, dtSec)) / duration;

  if (nextNormT >= 1.0) {
    runtimeHolder.sim = cfg.simAutoLoop
      ? { ...sim, isPlaying: true, activeIn3d: true, normT: nextNormT % 1.0, lastStepMs: nowMs }
      : { ...sim, isPlaying: false, activeIn3d: false, normT: 1.0, lastStepMs: nowMs };
  } else {
    runtimeHolder.sim = { ...sim, normT: nextNormT, lastStepMs: nowMs };
  }
  notifySimListeners();
}

export function updateDemolishLiveAnchors(
  carX: number, carY: number, carZ: number, carFwdX: number, carFwdY: number,
  ballX: number, ballY: number, ballZ: number
): void {
  const a = runtimeHolder.anchors;
  a.carX = carX; a.carY = carY; a.carZ = carZ;
  a.carFwdX = carFwdX; a.carFwdY = carFwdY;
  a.ballX = ballX; a.ballY = ballY; a.ballZ = ballZ;
}

export function getDemolishLiveAnchors(): DemolishLiveAnchors {
  return runtimeHolder.anchors;
}

export function resolveDemolishSimTargetUu(config: DemolishShockwaveConfig = runtimeHolder.config): { x: number; y: number; z: number } {
  const a = runtimeHolder.anchors;
  if (config.simAnchorMode === 'local-car') {
    return { x: Math.round(a.carX), y: Math.round(a.carY), z: Math.max(17, Math.round(a.carZ)) };
  }
  if (config.simAnchorMode === 'in-front-car') {
    const len = Math.hypot(a.carFwdX, a.carFwdY) || 1;
    return {
      x: Math.round(a.carX + (a.carFwdX / len) * 420),
      y: Math.round(a.carY + (a.carFwdY / len) * 420),
      z: Math.max(35, Math.round(a.carZ + 20)),
    };
  }
  if (config.simAnchorMode === 'ball') {
    return { x: Math.round(a.ballX), y: Math.round(a.ballY), z: Math.max(40, Math.round(a.ballZ)) };
  }
  return { x: config.simX, y: config.simY, z: config.simZ };
}

export function smoothstep01(f: number): number {
  const c = Math.max(0, Math.min(1, f));
  return c * c * (3 - 2 * c);
}

export function hexToRgbTuple(hex: string): [number, number, number] {
  const cleaned = String(hex || '#ffffff').replace('#', '').trim();
  const n = parseInt(cleaned.length === 3 ? cleaned.replace(/(.)/g, '$1$1') : cleaned, 16);
  if (Number.isNaN(n)) return [255, 255, 255];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function sampleOuterTrack(keys: readonly DemolishOuterRadiusKey[], normT: number): number {
  if (normT <= keys[0].t) return keys[0].size;
  const last = keys[keys.length - 1];
  if (normT >= last.t) return last.size;
  for (let i = 0; i < keys.length - 1; i++) {
    const k1 = keys[i], k2 = keys[i + 1];
    if (normT >= k1.t && normT <= k2.t) {
      const f = smoothstep01((normT - k1.t) / Math.max(1e-5, k2.t - k1.t));
      return k1.size + (k2.size - k1.size) * f;
    }
  }
  return keys[0].size;
}

export function sampleInnerHoleTrack(keys: readonly DemolishInnerHoleKey[], normT: number): number {
  if (normT <= keys[0].t) return keys[0].innerHole;
  const last = keys[keys.length - 1];
  if (normT >= last.t) return last.innerHole;
  for (let i = 0; i < keys.length - 1; i++) {
    const k1 = keys[i], k2 = keys[i + 1];
    if (normT >= k1.t && normT <= k2.t) {
      const f = smoothstep01((normT - k1.t) / Math.max(1e-5, k2.t - k1.t));
      return k1.innerHole + (k2.innerHole - k1.innerHole) * f;
    }
  }
  return keys[0].innerHole;
}

export function sampleColorTrack(keys: readonly DemolishColorKey[], normT: number): [number, number, number] {
  if (normT <= keys[0].t) return hexToRgbTuple(keys[0].color);
  const last = keys[keys.length - 1];
  if (normT >= last.t) return hexToRgbTuple(last.color);
  for (let i = 0; i < keys.length - 1; i++) {
    const k1 = keys[i], k2 = keys[i + 1];
    if (normT >= k1.t && normT <= k2.t) {
      const f = smoothstep01((normT - k1.t) / Math.max(1e-5, k2.t - k1.t));
      const c1 = hexToRgbTuple(k1.color), c2 = hexToRgbTuple(k2.color);
      return [
        Math.round(c1[0] + (c2[0] - c1[0]) * f),
        Math.round(c1[1] + (c2[1] - c1[1]) * f),
        Math.round(c1[2] + (c2[2] - c1[2]) * f),
      ];
    }
  }
  return hexToRgbTuple(keys[0].color);
}

export function evaluateDemolishShockwaveFrame(
  normT: number,
  config: DemolishShockwaveConfig = runtimeHolder.config
): DemolishShockwaveEvaluatedFrame {
  const clampedT = Math.max(0, Math.min(1, Number.isFinite(normT) ? normT : 0));
  const duration = Math.max(0.1, config.duration || 1.6);
  const totalFrames120 = Math.max(1, Math.round(duration * 120));
  const frameIndex120 = Math.round(clampedT * totalFrames120);
  const size = Math.max(1, sampleOuterTrack(config.outerKeys, clampedT));
  const worldDiameterUu = size * Math.max(0.1, config.worldScale || 1.0);
  const innerHolePct = Math.max(0, Math.min(100, sampleInnerHoleTrack(config.innerKeys, clampedT)));
  const rgb = sampleColorTrack(config.colorKeys, clampedT);

  const glowFactor =
    config.glowEndNormT > 1e-4 && clampedT < config.glowEndNormT
      ? (1 - smoothstep01(clampedT / config.glowEndNormT)) * config.glowStrength
      : 0;
  const opacity =
    clampedT > config.fadeStartNormT
      ? 1 - smoothstep01((clampedT - config.fadeStartNormT) / Math.max(1e-4, 1 - config.fadeStartNormT))
      : 1;

  return {
    normT: clampedT,
    elapsedSec: clampedT * duration,
    frameIndex120,
    totalFrames120,
    size,
    worldDiameterUu,
    innerHolePct,
    rgb,
    rgbNormalized: [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255],
    cssRgb: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
    glowFactor,
    opacity,
  };
}

export function exportDemolishShockwaveJson(cfg: DemolishShockwaveConfig = runtimeHolder.config): string {
  const { duration, worldScale, verticalOffsetUu, featherPct, outerFeatherPct, glowEndNormT, glowStrength, fadeStartNormT, outerKeys, innerKeys, colorKeys } = cfg;
  return JSON.stringify(
    { duration, worldScale, verticalOffsetUu, featherPct, outerFeatherPct, glowEndNormT, glowStrength, fadeStartNormT, outerKeys, innerKeys, colorKeys },
    null,
    2
  );
}

export function importDemolishShockwaveJson(rawJson: string): boolean {
  try {
    const p = JSON.parse(rawJson);
    if (!p || typeof p !== 'object') return false;
    const patch: Partial<DemolishShockwaveConfig> = {};
    const numKeys = ['duration', 'worldScale', 'verticalOffsetUu', 'featherPct', 'outerFeatherPct', 'glowEndNormT', 'glowStrength', 'fadeStartNormT'] as const;
    for (const k of numKeys) {
      if (typeof p[k] === 'number' && Number.isFinite(p[k])) patch[k] = p[k];
    }
    if (Array.isArray(p.outerKeys) && p.outerKeys.length === 4) {
      patch.outerKeys = [
        { t: 0.0, size: Number(p.outerKeys[0]?.size ?? 6) },
        { t: Number(p.outerKeys[1]?.t ?? 0.15), size: Number(p.outerKeys[1]?.size ?? 270) },
        { t: Number(p.outerKeys[2]?.t ?? 0.55), size: Number(p.outerKeys[2]?.size ?? 320) },
        { t: 1.0, size: Number(p.outerKeys[3]?.size ?? 350) },
      ];
    }
    if (Array.isArray(p.innerKeys) && p.innerKeys.length === 4) {
      patch.innerKeys = [
        { t: 0.0, innerHole: Number(p.innerKeys[0]?.innerHole ?? 0) },
        { t: Number(p.innerKeys[1]?.t ?? 0.28), innerHole: Number(p.innerKeys[1]?.innerHole ?? 0) },
        { t: Number(p.innerKeys[2]?.t ?? 0.65), innerHole: Number(p.innerKeys[2]?.innerHole ?? 35) },
        { t: 1.0, innerHole: Number(p.innerKeys[3]?.innerHole ?? 100) },
      ];
    }
    if (Array.isArray(p.colorKeys) && p.colorKeys.length === 6) {
      patch.colorKeys = [
        { t: 0.0, color: String(p.colorKeys[0]?.color || '#ffffff') },
        { t: Number(p.colorKeys[1]?.t ?? 0.08), color: String(p.colorKeys[1]?.color || '#ffe600') },
        { t: Number(p.colorKeys[2]?.t ?? 0.25), color: String(p.colorKeys[2]?.color || '#ff4500') },
        { t: Number(p.colorKeys[3]?.t ?? 0.48), color: String(p.colorKeys[3]?.color || '#8c1d00') },
        { t: Number(p.colorKeys[4]?.t ?? 0.72), color: String(p.colorKeys[4]?.color || '#222020') },
        { t: 1.0, color: String(p.colorKeys[5]?.color || '#0d0d0d') },
      ];
    }
    setDemolishShockwaveConfig(patch);
    return true;
  } catch {
    return false;
  }
}
