export type SupersonicTrailOrientationMode = 'surface-aligned' | 'camera-facing';
export type SupersonicTrailBlendingMode = 'additive' | 'normal';

export interface SupersonicTrailConfig {
  enabled: boolean;
  forceActive: boolean;
  startAgeTicks: number;
  endAgeTicks: number;
  headColor: string;
  tailColor: string;
  headGlowStrength: number;
  colorTransitionCurve: number;
  headWidthUu: number;
  tailWidthUu: number;
  widthTaperCurve: number;
  opacity: number;
  fadeCurve: number;
  surfaceLiftUu: number;
  orientationMode: SupersonicTrailOrientationMode;
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
  startAgeTicks: 10,
  endAgeTicks: 60,
  headColor: '#ffffff',
  tailColor: '#a855f7',
  headGlowStrength: 1.85,
  colorTransitionCurve: 0.75,
  headWidthUu: 11.0,
  tailWidthUu: 1.5,
  widthTaperCurve: 1.15,
  opacity: 0.92,
  fadeCurve: 1.25,
  surfaceLiftUu: 1.6,
  orientationMode: 'surface-aligned',
  blendingMode: 'additive',
  minSampleDistUu: 3.5,
  maxStepBreakDistUu: 240.0,
  requireWheelContact: true,
  useSuspensionCompression: true,
  maxHistoryTicks: 120,
});

export const supersonicTrailRuntimeConfig: SupersonicTrailConfig = {
  ...DEFAULT_SUPERSONIC_TRAIL_CONFIG,
};

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
  return notifySupersonicTrailListeners();
}

export function resetSupersonicTrailConfig(): SupersonicTrailConfig {
  Object.assign(supersonicTrailRuntimeConfig, DEFAULT_SUPERSONIC_TRAIL_CONFIG);
  return notifySupersonicTrailListeners();
}
