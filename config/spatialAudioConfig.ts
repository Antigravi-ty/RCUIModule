/**
 * spatialAudioConfig.ts
 * Configuration, Anthem Catalog (58 Stingers + No Anthem default), Background Music filter persistence,
 * and Non-Linear Directional Spatial Audio Engine parameters.
 */

import { STORAGE_KEYS, safeStorage, isPlainObject, clampNumberOrDefault, booleanOrDefault } from './storageHelpers';

export interface AnthemDef {
  id: string;
  title: string;
  artist: string;
  category: string;
  number: string;
  duration: string;
  durationSec: number;
  tag: string;
  file: string | null;
}

export interface AnthemCategoryDef {
  id: string;
  label: string;
  arenaName: string;
}

export const ANTHEM_CATEGORIES: readonly AnthemCategoryDef[] = Object.freeze([
  { id: 'all', label: 'All', arenaName: 'All Arenas' },
  { id: 'Aquatic', label: 'Aquatic', arenaName: 'AquaDome' },
  { id: 'Arena', label: 'Arena', arenaName: 'DFH Stadium' },
  { id: 'Breakout', label: 'Breakout', arenaName: 'Throwback Arcade' },
  { id: 'CelebrationStadium', label: 'Celebration', arenaName: 'Champions Field' },
  { id: 'Farm', label: 'Farm', arenaName: 'Farmstead' },
  { id: 'Park', label: 'Park', arenaName: 'Beckwith Park' },
  { id: 'Space', label: 'Space', arenaName: 'Starbase ARC' },
  { id: 'Space_Dark', label: 'Space Dark', arenaName: 'Starbase Aftermath' },
  { id: 'Street', label: 'Street', arenaName: 'Urban Central' },
  { id: 'TrainStation', label: 'Train Station', arenaName: 'Urban Station' },
  { id: 'Utopia_Lux', label: 'Utopia Lux', arenaName: 'Utopia Coliseum' },
]);

export const DEFAULT_ANTHEM_ID = 'none';

interface RawStingerEntry {
  id: string;
  category: string;
  number: string;
  durationSec: number;
  duration: string;
}

const RAW_STINGER_ENTRIES: readonly RawStingerEntry[] = Object.freeze([
  { id: 'MX_Aquatic_Stingers_0003', category: 'Aquatic', number: '0003', durationSec: 5.4, duration: '0:05' },
  { id: 'MX_Aquatic_Stingers_0006', category: 'Aquatic', number: '0006', durationSec: 5.5, duration: '0:05' },
  { id: 'MX_Aquatic_Stingers_0007', category: 'Aquatic', number: '0007', durationSec: 5.5, duration: '0:05' },
  { id: 'MX_Aquatic_Stingers_0008', category: 'Aquatic', number: '0008', durationSec: 5.4, duration: '0:05' },
  { id: 'MX_Arena_Stingers_0003', category: 'Arena', number: '0003', durationSec: 13.0, duration: '0:13' },
  { id: 'MX_Arena_Stingers_0005', category: 'Arena', number: '0005', durationSec: 12.0, duration: '0:12' },
  { id: 'MX_Arena_Stingers_0009', category: 'Arena', number: '0009', durationSec: 7.6, duration: '0:08' },
  { id: 'MX_Arena_Stingers_0015', category: 'Arena', number: '0015', durationSec: 11.1, duration: '0:11' },
  { id: 'MX_Arena_Stingers_0016', category: 'Arena', number: '0016', durationSec: 12.9, duration: '0:13' },
  { id: 'MX_Arena_Stingers_0017', category: 'Arena', number: '0017', durationSec: 8.2, duration: '0:08' },
  { id: 'MX_Arena_Stingers_0019', category: 'Arena', number: '0019', durationSec: 9.4, duration: '0:09' },
  { id: 'MX_Breakout_Stingers_0001', category: 'Breakout', number: '0001', durationSec: 12.3, duration: '0:12' },
  { id: 'MX_Breakout_Stingers_0002', category: 'Breakout', number: '0002', durationSec: 12.3, duration: '0:12' },
  { id: 'MX_Breakout_Stingers_0003', category: 'Breakout', number: '0003', durationSec: 9.7, duration: '0:10' },
  { id: 'MX_Breakout_Stingers_0004', category: 'Breakout', number: '0004', durationSec: 11.7, duration: '0:12' },
  { id: 'MX_Breakout_Stingers_0005', category: 'Breakout', number: '0005', durationSec: 11.3, duration: '0:11' },
  { id: 'MX_CelebrationStadium_Stingers_0001', category: 'CelebrationStadium', number: '0001', durationSec: 12.9, duration: '0:13' },
  { id: 'MX_CelebrationStadium_Stingers_0002', category: 'CelebrationStadium', number: '0002', durationSec: 14.6, duration: '0:15' },
  { id: 'MX_CelebrationStadium_Stingers_0003', category: 'CelebrationStadium', number: '0003', durationSec: 13.9, duration: '0:14' },
  { id: 'MX_CelebrationStadium_Stingers_0004', category: 'CelebrationStadium', number: '0004', durationSec: 15.3, duration: '0:15' },
  { id: 'MX_CelebrationStadium_Stingers_0005', category: 'CelebrationStadium', number: '0005', durationSec: 12.2, duration: '0:12' },
  { id: 'MX_CelebrationStadium_Stingers_0006', category: 'CelebrationStadium', number: '0006', durationSec: 16.4, duration: '0:16' },
  { id: 'MX_Farm_Stingers_0001', category: 'Farm', number: '0001', durationSec: 9.5, duration: '0:09' },
  { id: 'MX_Farm_Stingers_0002', category: 'Farm', number: '0002', durationSec: 8.8, duration: '0:09' },
  { id: 'MX_Farm_Stingers_0003', category: 'Farm', number: '0003', durationSec: 10.6, duration: '0:11' },
  { id: 'MX_Farm_Stingers_0004', category: 'Farm', number: '0004', durationSec: 10.8, duration: '0:11' },
  { id: 'MX_Farm_Stingers_0005', category: 'Farm', number: '0005', durationSec: 7.5, duration: '0:07' },
  { id: 'MX_Farm_Stingers_0006', category: 'Farm', number: '0006', durationSec: 9.9, duration: '0:10' },
  { id: 'MX_Farm_Stingers_0007', category: 'Farm', number: '0007', durationSec: 8.3, duration: '0:08' },
  { id: 'MX_Park_Stingers_0001', category: 'Park', number: '0001', durationSec: 15.3, duration: '0:15' },
  { id: 'MX_Park_Stingers_0002', category: 'Park', number: '0002', durationSec: 12.7, duration: '0:13' },
  { id: 'MX_Park_Stingers_0003', category: 'Park', number: '0003', durationSec: 11.2, duration: '0:11' },
  { id: 'MX_Park_Stingers_0004', category: 'Park', number: '0004', durationSec: 11.9, duration: '0:12' },
  { id: 'MX_Space_Dark_Stingers_0003', category: 'Space_Dark', number: '0003', durationSec: 10.8, duration: '0:11' },
  { id: 'MX_Space_Dark_Stingers_0004', category: 'Space_Dark', number: '0004', durationSec: 10.8, duration: '0:11' },
  { id: 'MX_Space_Dark_Stingers_0005', category: 'Space_Dark', number: '0005', durationSec: 10.8, duration: '0:11' },
  { id: 'MX_Space_Stingers_0003', category: 'Space', number: '0003', durationSec: 13.0, duration: '0:13' },
  { id: 'MX_Space_Stingers_0004', category: 'Space', number: '0004', durationSec: 12.3, duration: '0:12' },
  { id: 'MX_Space_Stingers_0006', category: 'Space', number: '0006', durationSec: 9.5, duration: '0:09' },
  { id: 'MX_Space_Stingers_0007', category: 'Space', number: '0007', durationSec: 10.6, duration: '0:11' },
  { id: 'MX_Space_Stingers_0009', category: 'Space', number: '0009', durationSec: 10.0, duration: '0:10' },
  { id: 'MX_Street_Stingers_0001', category: 'Street', number: '0001', durationSec: 10.8, duration: '0:11' },
  { id: 'MX_Street_Stingers_0002', category: 'Street', number: '0002', durationSec: 9.6, duration: '0:10' },
  { id: 'MX_Street_Stingers_0003', category: 'Street', number: '0003', durationSec: 8.9, duration: '0:09' },
  { id: 'MX_Street_Stingers_0004', category: 'Street', number: '0004', durationSec: 9.6, duration: '0:10' },
  { id: 'MX_TrainStation_Stingers_0001', category: 'TrainStation', number: '0001', durationSec: 12.0, duration: '0:12' },
  { id: 'MX_TrainStation_Stingers_0002', category: 'TrainStation', number: '0002', durationSec: 12.4, duration: '0:12' },
  { id: 'MX_TrainStation_Stingers_0006', category: 'TrainStation', number: '0006', durationSec: 11.1, duration: '0:11' },
  { id: 'MX_TrainStation_Stingers_0007', category: 'TrainStation', number: '0007', durationSec: 11.3, duration: '0:11' },
  { id: 'MX_TrainStation_Stingers_0009', category: 'TrainStation', number: '0009', durationSec: 8.9, duration: '0:09' },
  { id: 'MX_TrainStation_Stingers_0010', category: 'TrainStation', number: '0010', durationSec: 10.3, duration: '0:10' },
  { id: 'MX_TrainStation_Stingers_0011', category: 'TrainStation', number: '0011', durationSec: 8.7, duration: '0:09' },
  { id: 'MX_TrainStation_Stingers_0012', category: 'TrainStation', number: '0012', durationSec: 10.8, duration: '0:11' },
  { id: 'MX_Utopia_Lux_Stingers_0001', category: 'Utopia_Lux', number: '0001', durationSec: 17.7, duration: '0:18' },
  { id: 'MX_Utopia_Lux_Stingers_0002', category: 'Utopia_Lux', number: '0002', durationSec: 19.1, duration: '0:19' },
  { id: 'MX_Utopia_Lux_Stingers_0003', category: 'Utopia_Lux', number: '0003', durationSec: 17.2, duration: '0:17' },
  { id: 'MX_Utopia_Lux_Stingers_0004', category: 'Utopia_Lux', number: '0004', durationSec: 17.7, duration: '0:18' },
  { id: 'MX_Utopia_Lux_Stingers_0005', category: 'Utopia_Lux', number: '0005', durationSec: 16.9, duration: '0:17' },
]);

const CATEGORY_META_MAP: Record<string, { label: string; arenaName: string }> = {
  Aquatic: { label: 'Aquatic', arenaName: 'AquaDome Stinger' },
  Arena: { label: 'Arena', arenaName: 'DFH Stadium Stinger' },
  Breakout: { label: 'Breakout', arenaName: 'Throwback Arcade Stinger' },
  CelebrationStadium: { label: 'Celebration', arenaName: 'Champions Field Stinger' },
  Farm: { label: 'Farm', arenaName: 'Farmstead Stinger' },
  Park: { label: 'Park', arenaName: 'Beckwith Park Stinger' },
  Space_Dark: { label: 'Space Dark', arenaName: 'Starbase Aftermath Stinger' },
  Space: { label: 'Space', arenaName: 'Starbase ARC Stinger' },
  Street: { label: 'Street', arenaName: 'Urban Central Stinger' },
  TrainStation: { label: 'Train Station', arenaName: 'Urban Station Stinger' },
  Utopia_Lux: { label: 'Utopia Lux', arenaName: 'Utopia Coliseum Stinger' },
};

export const STINGER_ANTHEMS: readonly AnthemDef[] = Object.freeze(
  RAW_STINGER_ENTRIES.map((entry) => {
    const meta = CATEGORY_META_MAP[entry.category] || {
      label: entry.category,
      arenaName: 'Arena Stinger',
    };
    return Object.freeze({
      id: entry.id,
      title: `${meta.label} #${parseInt(entry.number, 10)} (${entry.id})`,
      artist: `${meta.arenaName} · ${entry.id}.m4a`,
      category: entry.category,
      number: entry.number,
      duration: entry.duration,
      durationSec: entry.durationSec,
      tag: meta.label,
      file: `assets/audio/Anthems/${entry.id}.m4a`,
    });
  })
);

export const ANTHEM_CATALOG: readonly AnthemDef[] = Object.freeze([
  Object.freeze({
    id: 'none',
    title: 'No Anthem',
    artist: 'Muted · Do not play goal celebration audio',
    category: 'none',
    number: '0000',
    duration: 'MUTED',
    durationSec: 0,
    tag: 'Muted',
    file: null,
  }),
  Object.freeze({
    id: 'random',
    title: 'Random Anthem',
    artist: 'Shuffle across all 58 stadium stingers',
    category: 'random',
    number: '0000',
    duration: 'VARIES',
    durationSec: 11.5,
    tag: 'Random',
    file: null,
  }),
  ...STINGER_ANTHEMS,
]);

const VALID_ANTHEM_IDS = new Set(ANTHEM_CATALOG.map((a) => a.id));

export function normalizeAnthemId(id: unknown): string {
  if (typeof id === 'string') {
    const trimmed = id.trim();
    if (VALID_ANTHEM_IDS.has(trimmed)) {
      return trimmed;
    }
    if (trimmed === 'muted' || trimmed === 'no-anthem' || trimmed === 'off' || trimmed === 'default') {
      return DEFAULT_ANTHEM_ID;
    }
  }
  return DEFAULT_ANTHEM_ID;
}

export function getAnthemById(id: unknown): AnthemDef {
  const norm = normalizeAnthemId(id);
  return ANTHEM_CATALOG.find((a) => a.id === norm) || ANTHEM_CATALOG[0];
}

export function resolvePlayableAnthemDef(id: unknown): AnthemDef | null {
  const norm = normalizeAnthemId(id);
  if (norm === 'none') return null;
  if (norm === 'random') {
    if (STINGER_ANTHEMS.length === 0) return null;
    const idx = Math.floor(Math.random() * STINGER_ANTHEMS.length);
    return STINGER_ANTHEMS[idx] || null;
  }
  return STINGER_ANTHEMS.find((a) => a.id === norm) || null;
}

export function encodeAnthemIdIndex(id: unknown): number {
  if (typeof id === 'number' && Number.isFinite(id)) {
    const idx = Math.round(id);
    return idx >= 0 && idx < ANTHEM_CATALOG.length ? idx : 0;
  }
  const norm = normalizeAnthemId(id);
  const idx = ANTHEM_CATALOG.findIndex((a) => a.id === norm);
  return idx >= 0 ? idx : 0;
}

export function decodeAnthemIdIndex(index: unknown): string {
  const idx = Number(index);
  if (Number.isInteger(idx) && idx >= 0 && idx < ANTHEM_CATALOG.length) {
    return ANTHEM_CATALOG[idx].id;
  }
  return DEFAULT_ANTHEM_ID;
}

export function loadStoredPlayerAnthem(): string {
  const raw = safeStorage.get(STORAGE_KEYS.PLAYER_ANTHEM, DEFAULT_ANTHEM_ID);
  return normalizeAnthemId(raw);
}

export function saveStoredPlayerAnthem(anthemId: string): string {
  const normalized = normalizeAnthemId(anthemId);
  safeStorage.set(STORAGE_KEYS.PLAYER_ANTHEM, normalized);
  return normalized;
}

// ============================================================================
// Spatial Audio Engine Tuner Configuration (Defaults from spaceaudio/new + 2.0s)
// ============================================================================

export type SpatialAudioOverrideMode = 'auto' | 'normal' | 'spatial' | 'manual';

export interface SpatialAudioTunerConfig {
  /** Smooth transition duration in seconds (default: 2.0s) */
  transitionDurationSec: number;
  /** High-Pass Filter cutoff frequency at full spatial blend (default: 425 Hz) */
  hpfMaxFreq: number;
  /** Low-Pass Filter cutoff frequency at full spatial blend (default: 3500 Hz) */
  lpfMinFreq: number;
  /** Convolver reverb wet ceiling percentage at full spatial blend (default: 69%) */
  wetMaxPct: number;
  /** Stadium impulse response decay time in seconds (default: 3.0s) */
  decaySec: number;
  /** Equal-power wet makeup gain multiplier (default: 1.35) */
  wetBoost: number;
  /** Directional Cubic-Bezier control point P1.x (default: 0.22 — fast near 0, slow near 1) */
  bzX1: number;
  /** Directional Cubic-Bezier control point P1.y (default: 1.0) */
  bzY1: number;
  /** Directional Cubic-Bezier control point P2.x (default: 1.0) */
  bzX2: number;
  /** Directional Cubic-Bezier control point P2.y (default: 1.0) */
  bzY2: number;
  /** Active Tuner override mode ('auto' follows game state) */
  overrideMode: SpatialAudioOverrideMode;
  /** Manual blend override when overrideMode === 'manual' (0.0 = Normal, 1.0 = Spatial) */
  manualBlend: number;
}

export const DEFAULT_SPATIAL_AUDIO_TUNER_CONFIG: SpatialAudioTunerConfig = Object.freeze({
  transitionDurationSec: 2.0,
  hpfMaxFreq: 425,
  lpfMinFreq: 3500,
  wetMaxPct: 69,
  decaySec: 3.0,
  wetBoost: 1.35,
  bzX1: 0.22,
  bzY1: 1.0,
  bzX2: 1.0,
  bzY2: 1.0,
  overrideMode: 'auto',
  manualBlend: 0,
});

export function sanitizeSpatialAudioTunerConfig(
  raw: unknown,
  fallback: SpatialAudioTunerConfig = DEFAULT_SPATIAL_AUDIO_TUNER_CONFIG
): SpatialAudioTunerConfig {
  const src = isPlainObject(raw) ? raw : {};
  const allowedModes: readonly SpatialAudioOverrideMode[] = ['auto', 'normal', 'spatial', 'manual'];
  const overrideMode: SpatialAudioOverrideMode =
    typeof src.overrideMode === 'string' && allowedModes.includes(src.overrideMode as SpatialAudioOverrideMode)
      ? (src.overrideMode as SpatialAudioOverrideMode)
      : fallback.overrideMode;

  return {
    transitionDurationSec: clampNumberOrDefault(src.transitionDurationSec, fallback.transitionDurationSec, {
      min: 0.1,
      max: 8.0,
    }),
    hpfMaxFreq: clampNumberOrDefault(src.hpfMaxFreq, fallback.hpfMaxFreq, {
      min: 20,
      max: 2000,
      integer: true,
    }),
    lpfMinFreq: clampNumberOrDefault(src.lpfMinFreq, fallback.lpfMinFreq, {
      min: 400,
      max: 16000,
      integer: true,
    }),
    wetMaxPct: clampNumberOrDefault(src.wetMaxPct, fallback.wetMaxPct, {
      min: 0,
      max: 100,
      integer: true,
    }),
    decaySec: clampNumberOrDefault(src.decaySec, fallback.decaySec, {
      min: 0.4,
      max: 8.0,
    }),
    wetBoost: clampNumberOrDefault(src.wetBoost, fallback.wetBoost, {
      min: 0.2,
      max: 3.0,
    }),
    bzX1: clampNumberOrDefault(src.bzX1, fallback.bzX1, { min: 0.01, max: 0.99 }),
    bzY1: clampNumberOrDefault(src.bzY1, fallback.bzY1, { min: 0.0, max: 1.0 }),
    bzX2: clampNumberOrDefault(src.bzX2, fallback.bzX2, { min: 0.01, max: 1.0 }),
    bzY2: clampNumberOrDefault(src.bzY2, fallback.bzY2, { min: 0.0, max: 1.0 }),
    overrideMode,
    manualBlend: clampNumberOrDefault(src.manualBlend, fallback.manualBlend, { min: 0.0, max: 1.0 }),
  };
}

export function loadStoredSpatialAudioTunerConfig(): SpatialAudioTunerConfig {
  const raw = safeStorage.get(STORAGE_KEYS.SPATIAL_AUDIO_TUNER);
  if (!raw) return { ...DEFAULT_SPATIAL_AUDIO_TUNER_CONFIG };
  try {
    const parsed = JSON.parse(raw);
    return sanitizeSpatialAudioTunerConfig(parsed);
  } catch {
    return { ...DEFAULT_SPATIAL_AUDIO_TUNER_CONFIG };
  }
}

export function saveStoredSpatialAudioTunerConfig(cfg: SpatialAudioTunerConfig): SpatialAudioTunerConfig {
  const clean = sanitizeSpatialAudioTunerConfig(cfg);
  // Persist acoustic & curve parameters while resetting session-only manual override on reload
  const toStore = { ...clean, overrideMode: 'auto' as const, manualBlend: 0 };
  safeStorage.set(STORAGE_KEYS.SPATIAL_AUDIO_TUNER, JSON.stringify(toStore));
  return clean;
}

/**
 * Solves a 1D Cubic-Bezier curve y(x) for x in [0, 1] with control points P1=(x1,y1), P2=(x2,y2).
 * Using a phase state `u` in [0, 1] mapped through y(u):
 * - When `u` is near 0 (Normal Playback): slope dy/du is steep -> both leaving Normal (0 -> 1)
 *   and entering Normal (1 -> 0) happen VERY QUICKLY.
 * - When `u` is near 1 (Spatial Stadium Effect): slope dy/du is gentle -> both entering Spatial (0 -> 1)
 *   and leaving Spatial (1 -> 0) happen SLOWLY and smoothly.
 * - Reversing direction mid-transition simply reverses du/dt from the current `u` without any jump.
 */
export function solveCubicBezier(
  x: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const cx = 3.0 * x1;
  const bx = 3.0 * (x2 - x1) - cx;
  const ax = 1.0 - cx - bx;

  const cy = 3.0 * y1;
  const by = 3.0 * (y2 - y1) - cy;
  const ay = 1.0 - cy - by;

  const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleCurveDerivativeX = (t: number) => (3.0 * ax * t + 2.0 * bx) * t + cx;

  let t2 = x;
  for (let i = 0; i < 8; i++) {
    const xEst = sampleCurveX(t2) - x;
    if (Math.abs(xEst) < 1e-6) break;
    const d2 = sampleCurveDerivativeX(t2);
    if (Math.abs(d2) < 1e-6) break;
    t2 = t2 - xEst / d2;
  }

  if (t2 < 0 || t2 > 1 || Number.isNaN(t2)) {
    let t0 = 0.0;
    let t1 = 1.0;
    t2 = x;
    for (let i = 0; i < 12; i++) {
      const xEst = sampleCurveX(t2);
      if (Math.abs(xEst - x) < 1e-6) break;
      if (x > xEst) t0 = t2;
      else t1 = t2;
      t2 = 0.5 * (t1 - t0) + t0;
    }
  }

  return Math.max(0, Math.min(1, sampleCurveY(t2)));
}

export function evaluateSpatialBlendFromPhase(
  linearPhaseU: number,
  cfg: Pick<SpatialAudioTunerConfig, 'bzX1' | 'bzY1' | 'bzX2' | 'bzY2'> = DEFAULT_SPATIAL_AUDIO_TUNER_CONFIG
): number {
  return solveCubicBezier(
    Math.max(0, Math.min(1, linearPhaseU)),
    cfg.bzX1,
    cfg.bzY1,
    cfg.bzX2,
    cfg.bzY2
  );
}

// ============================================================================
// Background Music Filter Preferences (Persisted; Audio Files Are Session-Only)
// ============================================================================

export interface StoredBgmPrefs {
  /** Realistic Background Music toggle in Settings -> Advanced (default: true) */
  realisticBgmEnabled: boolean;
  /** Whether playlist filter groups tracks by V{n}T{m} Volume (true) or lists Uncategorized (false) */
  categorizedMode: boolean;
  /** Volume IDs deselected by the user (new volumes default to selected) */
  deselectedVolumes: string[];
  /** Individual track filenames deselected by the user (new tracks default to selected) */
  deselectedTrackNames: string[];
}

export const DEFAULT_STORED_BGM_PREFS: StoredBgmPrefs = Object.freeze({
  realisticBgmEnabled: true,
  categorizedMode: true,
  deselectedVolumes: [],
  deselectedTrackNames: [],
});

export function loadStoredBgmPrefs(): StoredBgmPrefs {
  const raw = safeStorage.get(STORAGE_KEYS.BGM_PREFS);
  if (!raw) {
    return {
      realisticBgmEnabled: true,
      categorizedMode: true,
      deselectedVolumes: [],
      deselectedTrackNames: [],
    };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) {
      return {
        realisticBgmEnabled: true,
        categorizedMode: true,
        deselectedVolumes: [],
        deselectedTrackNames: [],
      };
    }
    return {
      realisticBgmEnabled: booleanOrDefault(parsed.realisticBgmEnabled, true),
      categorizedMode: booleanOrDefault(parsed.categorizedMode, true),
      deselectedVolumes: Array.isArray(parsed.deselectedVolumes)
        ? parsed.deselectedVolumes.filter((v): v is string => typeof v === 'string')
        : [],
      deselectedTrackNames: Array.isArray(parsed.deselectedTrackNames)
        ? parsed.deselectedTrackNames.filter((v): v is string => typeof v === 'string')
        : [],
    };
  } catch {
    return {
      realisticBgmEnabled: true,
      categorizedMode: true,
      deselectedVolumes: [],
      deselectedTrackNames: [],
    };
  }
}

export function saveStoredBgmPrefs(prefs: StoredBgmPrefs): void {
  safeStorage.set(
    STORAGE_KEYS.BGM_PREFS,
    JSON.stringify({
      realisticBgmEnabled: Boolean(prefs.realisticBgmEnabled),
      categorizedMode: Boolean(prefs.categorizedMode),
      deselectedVolumes: Array.from(new Set(prefs.deselectedVolumes)),
      deselectedTrackNames: Array.from(new Set(prefs.deselectedTrackNames)),
    })
  );
}

export interface ParsedBgmFileMeta {
  vol: string;
  trackNum: number;
  cleanTitle: string;
}

/**
 * Parses soundtrack filenames following the `V{vol}T{track}` convention (e.g. `V1T03_Track.m4a`)
 * or falls back to `'Uncategorized'`.
 */
export function parseBgmFileMetadata(fileName: string): ParsedBgmFileMeta {
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const match = /V(\d+)T(\d+)/i.exec(baseName);
  if (match) {
    const volNum = String(parseInt(match[1], 10));
    const trackNum = parseInt(match[2], 10) || 0;
    return {
      vol: volNum,
      trackNum,
      cleanTitle: baseName,
    };
  }
  return {
    vol: 'Uncategorized',
    trackNum: 999,
    cleanTitle: baseName,
  };
}
