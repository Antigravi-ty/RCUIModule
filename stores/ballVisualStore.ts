import { create } from 'zustand';
import {
  type BallVisualApplier,
  type BallVisualConfig,
  type BallVisualListener,
  DEFAULT_BALL_VISUAL_CONFIG,
  getBallVisualConfig,
  registerBallVisualApplier,
  setTemporaryBallOpacityOverride,
  subscribeBallVisualConfig,
  updateBallVisualConfig,
} from '../config/ballVisualConfig';

export {
  type BallVisualApplier,
  type BallVisualConfig,
  type BallVisualListener,
  DEFAULT_BALL_VISUAL_CONFIG,
  getBallVisualConfig,
  registerBallVisualApplier,
  setTemporaryBallOpacityOverride,
  subscribeBallVisualConfig,
  updateBallVisualConfig,
};

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
  config: getBallVisualConfig(),
  updateConfig: (patch = {}, ballRoot = null, indicatorRings = []) =>
    updateBallVisualConfig(patch, ballRoot, indicatorRings),
  setTemporaryOpacityOverride: (
    opacityOrNull = null,
    ballRoot = null,
    indicatorRings = []
  ) => setTemporaryBallOpacityOverride(opacityOrNull, ballRoot, indicatorRings),
  resetConfig: () => updateBallVisualConfig({ ...DEFAULT_BALL_VISUAL_CONFIG }),
}));

subscribeBallVisualConfig((snapshot) => {
  useBallVisualStore.setState({ config: snapshot });
});
