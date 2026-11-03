/**
 * ballVisualConfig.ts
 * Pure ball visual configuration defaults, runtime state, and listener subscription.
 */

export interface BallVisualConfig {
  visible: boolean;
  opacity: number;
  temporaryOpacityOverride: number | null;
  depthWriteWhenTransparent: boolean;
  doubleSideWhenTransparent: boolean;
  wireframe: boolean;
  indicatorRingOpacity: number;
  goalDarkenJitterEnabled: boolean;
  [key: string]: any;
}

export const DEFAULT_BALL_VISUAL_CONFIG: BallVisualConfig = {
  visible: true,
  opacity: 1.0,
  temporaryOpacityOverride: null,
  depthWriteWhenTransparent: false,
  doubleSideWhenTransparent: false,
  wireframe: false,
  indicatorRingOpacity: 0.2,
  goalDarkenJitterEnabled: true,
};

export const ballVisualRuntimeConfig: BallVisualConfig = {
  ...DEFAULT_BALL_VISUAL_CONFIG,
};

type BallVisualListener = (snapshot: BallVisualConfig) => void;
type BallVisualApplier = (config: BallVisualConfig, ballRoot: any, indicatorRings: any[]) => void;

const ballVisualListeners = new Set<BallVisualListener>();
const ballVisualObjectAppliers = new Set<BallVisualApplier>();

export function getBallVisualConfig(): BallVisualConfig {
  return { ...ballVisualRuntimeConfig };
}

export function subscribeBallVisualConfig(listener: BallVisualListener): () => void {
  if (typeof listener !== 'function') return () => {};
  ballVisualListeners.add(listener);
  return () => {
    ballVisualListeners.delete(listener);
  };
}

export function registerBallVisualApplier(applier: BallVisualApplier): () => void {
  if (typeof applier !== 'function') return () => {};
  ballVisualObjectAppliers.add(applier);
  return () => {
    ballVisualObjectAppliers.delete(applier);
  };
}

export function updateBallVisualConfig(
  patch: Partial<BallVisualConfig> = {},
  ballRoot: any = null,
  indicatorRings: any[] = []
): BallVisualConfig {
  if (patch) {
    Object.assign(ballVisualRuntimeConfig, patch);
  }
  for (const applier of ballVisualObjectAppliers) {
    try {
      applier(ballVisualRuntimeConfig, ballRoot, indicatorRings);
    } catch (err) {
      console.warn('[ballVisualConfig] Object applier threw an error:', err);
    }
  }
  const snapshot = { ...ballVisualRuntimeConfig };
  for (const listener of ballVisualListeners) {
    try {
      listener(snapshot);
    } catch (err) {
      console.warn('[ballVisualConfig] Listener threw an error:', err);
    }
  }
  return snapshot;
}

export function setTemporaryBallOpacityOverride(
  opacityOrNull: number | null = null,
  ballRoot: any = null,
  indicatorRings: any[] = []
): BallVisualConfig {
  const normalized =
    typeof opacityOrNull === 'number' && Number.isFinite(opacityOrNull)
      ? Math.max(0.05, Math.min(1.0, opacityOrNull))
      : null;
  if (ballVisualRuntimeConfig.temporaryOpacityOverride === normalized && !ballRoot) {
    return { ...ballVisualRuntimeConfig };
  }
  return updateBallVisualConfig({ temporaryOpacityOverride: normalized }, ballRoot, indicatorRings);
}
