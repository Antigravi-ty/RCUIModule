import { useSyncExternalStore } from 'react';
import { createExternalStore } from './createExternalStore';

export type TrajectoryUpdateKind =
  | 'incremental-tail'
  | 'full-car-hit'
  | 'full-deviation'
  | 'full-initial'
  | 'full-world-bounce'
  | 'full-forced'
  | 'cached-tick'
  | 'static-preview'
  | 'sleeping';

export interface BallTrajectoryTelemetry {
  computeTimeUs: number;
  wasmComputeTimeUs: number;
  geometryBuildTimeUs: number;
  lastUpdateKind: TrajectoryUpdateKind;
  activeSlices: number;
  remainingSlices: number;
  incrementalStepCount: number;
  fullRecomputeCount: number;
  carHitRecomputeCount: number;
  deviationRecomputeCount: number;
  primitiveCount: number;
  bounceCount: number;
  maxHeightUu: number;
  ballSpeedUu: number;
}

export const INITIAL_BALL_TRAJECTORY_TELEMETRY: Readonly<BallTrajectoryTelemetry> =
  Object.freeze({
    computeTimeUs: 0,
    wasmComputeTimeUs: 0,
    geometryBuildTimeUs: 0,
    lastUpdateKind: 'sleeping',
    activeSlices: 0,
    remainingSlices: 0,
    incrementalStepCount: 0,
    fullRecomputeCount: 0,
    carHitRecomputeCount: 0,
    deviationRecomputeCount: 0,
    primitiveCount: 0,
    bounceCount: 0,
    maxHeightUu: 0,
    ballSpeedUu: 0,
  });

interface BallTrajectoryTunerStoreState {
  telemetry: BallTrajectoryTelemetry;
}

const core = createExternalStore<BallTrajectoryTunerStoreState>({
  telemetry: { ...INITIAL_BALL_TRAJECTORY_TELEMETRY },
});

export const ballTrajectoryTunerStore = {
  getSnapshot: core.getSnapshot,

  getTelemetry(): BallTrajectoryTelemetry {
    return core.getSnapshot().telemetry;
  },

  publishTelemetry(patch: Partial<BallTrajectoryTelemetry>): void {
    core.setState((state) => ({
      telemetry: {
        ...state.telemetry,
        ...patch,
      },
    }));
  },

  resetTelemetryCounters(): void {
    core.setState((state) => ({
      telemetry: {
        ...state.telemetry,
        incrementalStepCount: 0,
        fullRecomputeCount: 0,
        carHitRecomputeCount: 0,
        deviationRecomputeCount: 0,
      },
    }));
  },

  subscribe: core.subscribe,
};

export function useBallTrajectoryTunerStore(): BallTrajectoryTunerStoreState {
  return useSyncExternalStore(
    ballTrajectoryTunerStore.subscribe,
    ballTrajectoryTunerStore.getSnapshot,
    ballTrajectoryTunerStore.getSnapshot
  );
}
