/**
 * replayDirectorConfig.ts
 * Pure configuration schema, defaults, and parameter sanitization for the Goal Replay Director Camera & Slow-Motion.
 */

export const DEFAULT_REPLAY_DIRECTOR_FOV_DEG = 110.0;

export interface ReplayDirectorConfigState {
  cameraFovDeg: number;
  lastTouchSlowMoPreSeconds: number;
  lastTouchSlowMoPostSeconds: number;
  lastTouchSlowMoScale: number;
  goalLineSlowMoPreSeconds: number;
  goalLineSlowMoPostSeconds: number;
  goalLineSlowMoScale: number;

  touchHoldAfterSeconds: number;
  twoTouchLookaheadSeconds: number;
  twoTouchAnticipationWeight: number;

  corridorBackDistStart: number;
  corridorBackDistEnd: number;
  corridorSideDistBase: number;
  goalBoxShowcaseDist: number;
  carMidpointMaxWeight: number;

  cameraBaseHeightUu: number;
  cameraAerialHeightSlope: number;
  interceptorLookaheadSeconds: number;
  interceptorFramingWeight: number;
  suffixTimeDecayRate: number;
  trajectorySmoothPasses: number;
  maxTotalYawBudgetDeg: number;

  postGoalExplosionStretchDist: number;
  postGoalExplosionStretchDuration: number;
  postGoalScorerFollowTransitionSec: number;
  eyeDampingRate: number;
  gazeDampingRate: number;
  strikerSwitchDampingRate: number;
  muteSignalAudioInGoalReplay: boolean;
  [key: string]: number | boolean;
}

export const DEFAULT_REPLAY_DIRECTOR_CONFIG: Readonly<ReplayDirectorConfigState> = Object.freeze({
  cameraFovDeg: DEFAULT_REPLAY_DIRECTOR_FOV_DEG,
  lastTouchSlowMoPreSeconds: 0.50,
  lastTouchSlowMoPostSeconds: 0.25,
  lastTouchSlowMoScale: 0.50,
  goalLineSlowMoPreSeconds: 0.25,
  goalLineSlowMoPostSeconds: 0.25,
  goalLineSlowMoScale: 0.50,

  touchHoldAfterSeconds: 0.20,
  twoTouchLookaheadSeconds: 2.20,
  twoTouchAnticipationWeight: 0.36,

  corridorBackDistStart: 500.0,
  corridorBackDistEnd: 400.0,
  corridorSideDistBase: 760.0,
  goalBoxShowcaseDist: 920.0,
  carMidpointMaxWeight: 0.46,

  cameraBaseHeightUu: 195.0,
  cameraAerialHeightSlope: 0.36,
  interceptorLookaheadSeconds: 1.65,
  interceptorFramingWeight: 0.72,
  suffixTimeDecayRate: 1.40,
  trajectorySmoothPasses: 4,
  maxTotalYawBudgetDeg: 320.0,

  postGoalExplosionStretchDist: 780.0,
  postGoalExplosionStretchDuration: 0.36,
  postGoalScorerFollowTransitionSec: 0.28,
  eyeDampingRate: 5.2,
  gazeDampingRate: 8.5,
  strikerSwitchDampingRate: 4.2,
  muteSignalAudioInGoalReplay: true,
});

export function sanitizeReplayDirectorConfigPatch(
  current: ReplayDirectorConfigState,
  patch: Partial<ReplayDirectorConfigState> = {}
): { nextConfig: ReplayDirectorConfigState; changed: boolean } {
  if (!patch || typeof patch !== 'object') {
    return { nextConfig: current, changed: false };
  }
  const nextConfig: ReplayDirectorConfigState = { ...current };
  let changed = false;
  for (const [key, val] of Object.entries(patch)) {
    if (!(key in DEFAULT_REPLAY_DIRECTOR_CONFIG)) continue;
    if (typeof DEFAULT_REPLAY_DIRECTOR_CONFIG[key] === 'boolean' && typeof val === 'boolean') {
      if (nextConfig[key] !== val) {
        nextConfig[key] = val;
        changed = true;
      }
    } else if (typeof val === 'number' && Number.isFinite(val)) {
      if (nextConfig[key] !== val) {
        nextConfig[key] = val;
        changed = true;
      }
    }
  }
  return { nextConfig, changed };
}
