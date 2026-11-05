export type SupersonicTrailOrientationMode =
  | 'surface-aligned'
  | 'flat-ground'
  | 'camera-facing';
export type SupersonicTrailBlendingMode = 'additive' | 'normal';

export interface SupersonicTrailConfig {
  enabled: boolean;
  forceActive: boolean;
  startAgeTicks: number;
  endAgeTicks: number;

  // 3-Point Color Gradient (Head White -> Mid Pink -> Tail Purple)
  headColor: string;
  midColor: string;
  tailColor: string;
  midColorPosPct: number;
  headGlowStrength: number;
  colorTransitionCurve: number;

  // Stage 1 Bezier: Head (White) -> Mid (Pink)
  headToMidBezierP1X: number;
  headToMidBezierP1Y: number;
  headToMidBezierP2X: number;
  headToMidBezierP2Y: number;

  // Stage 2 Bezier: Mid (Pink) -> Tail (Purple)
  midToTailBezierP1X: number;
  midToTailBezierP1Y: number;
  midToTailBezierP2X: number;
  midToTailBezierP2Y: number;

  // Ribbon Taper & Opacity
  headWidthUu: number;
  tailWidthUu: number;
  widthTaperCurve: number;
  opacity: number;
  fadeCurve: number;
  surfaceLiftUu: number;

  // Orientation & View-Adaptive Camera Tilt
  orientationMode: SupersonicTrailOrientationMode;
  cameraTiltStrength: number;
  tiltNearDistUu: number;
  tiltFarDistUu: number;

  blendingMode: SupersonicTrailBlendingMode;
  minSampleDistUu: number;
  maxStepBreakDistUu: number;
  requireWheelContact: boolean;
  useSuspensionCompression: boolean;
  maxHistoryTicks: number;
}

export type SupersonicTrailConfigPatch = Partial<SupersonicTrailConfig>;

export const DEFAULT_SUPERSONIC_TRAIL_CONFIG: Readonly<SupersonicTrailConfig> = Object.freeze({
  enabled: true,
  forceActive: false,
  startAgeTicks: 1,
  endAgeTicks: 30,

  headColor: '#ffffff',
  midColor: '#ff4fd8',
  tailColor: '#8300ff',
  midColorPosPct: 24,
  headGlowStrength: 1,
  colorTransitionCurve: 0.2,

  headToMidBezierP1X: 0.15,
  headToMidBezierP1Y: 0.85,
  headToMidBezierP2X: 0.3,
  headToMidBezierP2Y: 1.0,

  midToTailBezierP1X: 0.25,
  midToTailBezierP1Y: 0.7,
  midToTailBezierP2X: 0.35,
  midToTailBezierP2Y: 1.0,

  headWidthUu: 15,
  tailWidthUu: 1,
  widthTaperCurve: 1,
  opacity: 0.65,
  fadeCurve: 1,
  surfaceLiftUu: 1,

  orientationMode: 'surface-aligned',
  cameraTiltStrength: 0.88,
  tiltNearDistUu: 260,
  tiltFarDistUu: 1350,

  blendingMode: 'normal',
  minSampleDistUu: 3.5,
  maxStepBreakDistUu: 240,
  requireWheelContact: true,
  useSuspensionCompression: true,
  maxHistoryTicks: 120,
});

export const supersonicTrailRuntimeConfig: SupersonicTrailConfig = {
  ...DEFAULT_SUPERSONIC_TRAIL_CONFIG,
};

export function midPctToAgeTicks(
  midPct: number,
  startAgeTicks: number,
  endAgeTicks: number
): number {
  const span = Math.max(1, endAgeTicks - startAgeTicks);
  const clampedPct = Math.max(1, Math.min(99, Number(midPct) || 24));
  return Number((startAgeTicks + (clampedPct / 100) * span).toFixed(2));
}

export function ageTicksToMidPct(
  midAgeTicks: number,
  startAgeTicks: number,
  endAgeTicks: number
): number {
  const span = Math.max(1, endAgeTicks - startAgeTicks);
  const rawPct = ((midAgeTicks - startAgeTicks) / span) * 100;
  return Math.max(1, Math.min(99, Number(rawPct.toFixed(1))));
}

type SupersonicTrailConfigCallback = (snapshot: SupersonicTrailConfig) => void;
const trailConfigListeners = new Set<SupersonicTrailConfigCallback>();

export function getSupersonicTrailConfig(): SupersonicTrailConfig {
  return { ...supersonicTrailRuntimeConfig };
}

export function subscribeSupersonicTrailConfig(
  listener: SupersonicTrailConfigCallback
): () => void {
  if (typeof listener !== 'function') return () => {};
  trailConfigListeners.add(listener);
  return () => {
    trailConfigListeners.delete(listener);
  };
}

function notifySupersonicTrailListeners(): SupersonicTrailConfig {
  const snapshot = getSupersonicTrailConfig();
  for (const listener of trailConfigListeners) {
    try {
      listener(snapshot);
    } catch {
      // ignore listener errors
    }
  }
  return snapshot;
}

export function updateSupersonicTrailConfig(
  patch: SupersonicTrailConfigPatch = {}
): SupersonicTrailConfig {
  if (!patch || typeof patch !== 'object') return getSupersonicTrailConfig();
  Object.assign(supersonicTrailRuntimeConfig, patch);
  if (supersonicTrailRuntimeConfig.endAgeTicks <= supersonicTrailRuntimeConfig.startAgeTicks) {
    supersonicTrailRuntimeConfig.endAgeTicks = supersonicTrailRuntimeConfig.startAgeTicks + 1;
  }
  supersonicTrailRuntimeConfig.midColorPosPct = Math.max(
    1,
    Math.min(99, Number(supersonicTrailRuntimeConfig.midColorPosPct) || 24)
  );
  return notifySupersonicTrailListeners();
}

export function resetSupersonicTrailConfig(): SupersonicTrailConfig {
  Object.assign(supersonicTrailRuntimeConfig, DEFAULT_SUPERSONIC_TRAIL_CONFIG);
  return notifySupersonicTrailListeners();
}
