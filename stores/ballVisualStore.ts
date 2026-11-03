import { create } from 'zustand';
import {
  type BallVisualConfig,
  DEFAULT_BALL_VISUAL_CONFIG,
  normalizeTemporaryBallOpacityOverride,
  sanitizeBallVisualConfig,
} from '../config/ballVisualConfig';

export { type BallVisualConfig, DEFAULT_BALL_VISUAL_CONFIG };

export type BallVisualListener = (snapshot: BallVisualConfig) => void;
export type BallVisualApplier = (config: BallVisualConfig, ballRoot: any, indicatorRings: any[]) => void;

const ballVisualListeners = new Set<BallVisualListener>();
const ballVisualObjectAppliers = new Set<BallVisualApplier>();

export interface BallVisualStoreState {
  config: BallVisualConfig;
  updateConfig: (
    patch?: Partial<BallVisualConfig>,
    ballRoot?: any,
    indicatorRings?: any[]
  ) => BallVisualConfig;
  setTemporaryOpacityOverride: (
    opacityOrNull?: number | null,
    ballRoot?: any,
    indicatorRings?: any[]
  ) => BallVisualConfig;
  resetConfig: () => BallVisualConfig;
}

export const useBallVisualStore = create<BallVisualStoreState>(() => ({
  config: { ...DEFAULT_BALL_VISUAL_CONFIG },
  updateConfig: (patch = {}, ballRoot = null, indicatorRings = []) =>
    updateBallVisualConfig(patch, ballRoot, indicatorRings),
  setTemporaryOpacityOverride: (opacityOrNull = null, ballRoot = null, indicatorRings = []) =>
    setTemporaryBallOpacityOverride(opacityOrNull, ballRoot, indicatorRings),
  resetConfig: () => updateBallVisualConfig({ ...DEFAULT_BALL_VISUAL_CONFIG }),
}));

export function getBallVisualConfig(): BallVisualConfig {
  return { ...useBallVisualStore.getState().config };
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
  const prev = useBallVisualStore.getState().config;
  const next = sanitizeBallVisualConfig(patch, prev);
  useBallVisualStore.setState({ config: next });

  for (const applier of ballVisualObjectAppliers) {
    try {
      applier(next, ballRoot, indicatorRings);
    } catch (err) {
      console.warn('[ballVisualStore] Object applier threw an error:', err);
    }
  }
  const snapshot = { ...next };
  for (const listener of ballVisualListeners) {
    try {
      listener(snapshot);
    } catch (err) {
      console.warn('[ballVisualStore] Listener threw an error:', err);
    }
  }
  return snapshot;
}

export function setTemporaryBallOpacityOverride(
  opacityOrNull: number | null = null,
  ballRoot: any = null,
  indicatorRings: any[] = []
): BallVisualConfig {
  const normalized = normalizeTemporaryBallOpacityOverride(opacityOrNull);
  const current = useBallVisualStore.getState().config;
  if (current.temporaryOpacityOverride === normalized && !ballRoot) {
    return { ...current };
  }
  return updateBallVisualConfig({ temporaryOpacityOverride: normalized }, ballRoot, indicatorRings);
}
