/**
 * staticTrainingVariationTypes.ts
 * Types, Kevpert BakkesMod presets, and variance calculation helpers for
 * Static Training Packs (`RLRCSPack` / `RCSPack` / `RCSPackE`).
 */

import {
  type KevpertPresetKey,
  type StaticTrainingVariationConfig,
  KEVPERT_PRESET_KEYS,
  KEVPERT_LATEST_PRESETS,
  KEVPERT_PACK_VIDEO_VARIATIONS_BY_CODE,
  isVariationMatchingLatestPreset,
  resolveEffectiveRecommendedVariation,
} from './kevpertVariationPresets';

export type { KevpertPresetKey, StaticTrainingVariationConfig };
export { KEVPERT_PRESET_KEYS };

export interface StaticTrainingQuickVariationToggles {
  /** Master switch to override pack's recommended variation with custom/preset variation */
  enableCustomVariationOverride: boolean;
  /**
   * When false (default / OFF = "Apply Old"), Kevpert packs use the exact BakkesMod
   * variation parameters from their original YouTube video description.
   * When true (ON = "Apply New"), Kevpert packs use the latest F3–F12 keybinding parameters.
   */
  applyNewKevpertBind?: boolean;
  /** Additional boost added on top of active boost limit (0 - 100), capped at 100 */
  moreBoostAmount: number;
  /** Disable all ball position/speed/rotation/spin variance */
  disableBallVariance: boolean;
  /** Disable all vehicle position/speed/rotation variance */
  disableVehicleVariance: boolean;
  /** Disable all random angular velocity across all training packs */
  disableAllRandomAngularVelocity: boolean;
  /** Specifically disable deterministic/random angular velocity imported from .RLRCSPack (.Tem) */
  disableRLRCSPackAngularVelocity: boolean;
  /**
   * Override Unlimited Boost as 100 (default: true).
   * When enabled, packs/shots with Unlimited Boost keep the top HUD badge as INF,
   * while actual arena physics and the bottom-right boost gauge start at 100 and consume boost.
   */
  overrideUnlimitedBoostAs100?: boolean;
  /**
   * Enable pressing [F] during Static Training Play / Single-Shot Test to horizontally
   * mirror the current shot across the longitudinal center plane X = 0 (default: true).
   */
  enableFToMirror?: boolean;
}

export const DEFAULT_QUICK_VARIATION_TOGGLES: StaticTrainingQuickVariationToggles = {
  enableCustomVariationOverride: false,
  applyNewKevpertBind: false,
  moreBoostAmount: 0,
  disableBallVariance: false,
  disableVehicleVariance: false,
  disableAllRandomAngularVelocity: false,
  disableRLRCSPackAngularVelocity: true,
  overrideUnlimitedBoostAs100: true,
  enableFToMirror: true,
};

export const ZERO_VARIATION_CONFIG: StaticTrainingVariationConfig = {
  presetKey: 'CUSTOM',
  label: 'Reset / No Variance',
  presetLabel: 'Reset / No Variance',
  ballSpeedModifierPct: [0, 0],
  ballLocationModifierXY: [0, 0],
  ballHeightModifierZ: [0, 0],
  ballRotationModifierDeg: [0, 0],
  ballSpinModifier: [0, 0],
  vehicleSpeedRange: null,
  vehicleLocationModifier: [0, 0],
  vehicleRotationModifierDeg: [0, 0],
  boostLimitOverride: null,
  forceSpawnVehicleOnGround: false,
  forceUnlimitedBoost: false,
};

export {
  KEVPERT_LATEST_PRESETS,
  KEVPERT_PACK_VIDEO_VARIATIONS_BY_CODE,
  isVariationMatchingLatestPreset,
  resolveEffectiveRecommendedVariation,
};

export function cloneVariationConfig(
  cfg: Partial<StaticTrainingVariationConfig> | null | undefined
): StaticTrainingVariationConfig {
  const fallback = KEVPERT_LATEST_PRESETS.F7;
  if (!cfg) {
    return {
      ...fallback,
      label: fallback.label ?? fallback.presetLabel ?? 'Kevpert F7',
      presetLabel: fallback.presetLabel ?? fallback.label ?? 'Kevpert F7',
      ballSpeedModifierPct: [...fallback.ballSpeedModifierPct],
      ballLocationModifierXY: [...fallback.ballLocationModifierXY],
      ballHeightModifierZ: [...fallback.ballHeightModifierZ],
      ballRotationModifierDeg: [...fallback.ballRotationModifierDeg],
      ballSpinModifier: [...fallback.ballSpinModifier],
      vehicleSpeedRange: fallback.vehicleSpeedRange ? [...fallback.vehicleSpeedRange] : null,
      vehicleLocationModifier: [...fallback.vehicleLocationModifier],
      vehicleRotationModifierDeg: [...fallback.vehicleRotationModifierDeg],
    };
  }
  const resolvedLabel = cfg.label ?? cfg.presetLabel ?? 'Custom Training Variation';
  return {
    presetKey: cfg.presetKey ?? 'CUSTOM',
    label: resolvedLabel,
    presetLabel: resolvedLabel,
    ...(cfg.sourceVideoId ? { sourceVideoId: cfg.sourceVideoId } : {}),
    ballSpeedModifierPct: Array.isArray(cfg.ballSpeedModifierPct)
      ? [Number(cfg.ballSpeedModifierPct[0]) || 0, Number(cfg.ballSpeedModifierPct[1]) || 0]
      : [0, 0],
    ballLocationModifierXY: Array.isArray(cfg.ballLocationModifierXY)
      ? [Number(cfg.ballLocationModifierXY[0]) || 0, Number(cfg.ballLocationModifierXY[1]) || 0]
      : [0, 0],
    ballHeightModifierZ: Array.isArray(cfg.ballHeightModifierZ)
      ? [Number(cfg.ballHeightModifierZ[0]) || 0, Number(cfg.ballHeightModifierZ[1]) || 0]
      : [0, 0],
    ballRotationModifierDeg: Array.isArray(cfg.ballRotationModifierDeg)
      ? [Number(cfg.ballRotationModifierDeg[0]) || 0, Number(cfg.ballRotationModifierDeg[1]) || 0]
      : [0, 0],
    ballSpinModifier: Array.isArray(cfg.ballSpinModifier)
      ? [Number(cfg.ballSpinModifier[0]) || 0, Number(cfg.ballSpinModifier[1]) || 0]
      : [0, 0],
    vehicleSpeedRange:
      Array.isArray(cfg.vehicleSpeedRange) && cfg.vehicleSpeedRange.length === 2
        ? [Number(cfg.vehicleSpeedRange[0]) || 0, Number(cfg.vehicleSpeedRange[1]) || 0]
        : null,
    vehicleLocationModifier: Array.isArray(cfg.vehicleLocationModifier)
      ? [Number(cfg.vehicleLocationModifier[0]) || 0, Number(cfg.vehicleLocationModifier[1]) || 0]
      : [0, 0],
    vehicleRotationModifierDeg: Array.isArray(cfg.vehicleRotationModifierDeg)
      ? [
          Number(cfg.vehicleRotationModifierDeg[0]) || 0,
          Number(cfg.vehicleRotationModifierDeg[1]) || 0,
        ]
      : [0, 0],
    boostLimitOverride:
      cfg.boostLimitOverride !== null && cfg.boostLimitOverride !== undefined
        ? Math.max(0, Math.min(100, Number(cfg.boostLimitOverride)))
        : null,
    forceSpawnVehicleOnGround: Boolean(cfg.forceSpawnVehicleOnGround),
    forceUnlimitedBoost: Boolean(cfg.forceUnlimitedBoost),
  };
}

/**
 * Resolves the recommended BakkesMod / Kevpert variation for a pack based on its code or title.
 */
export function resolveRecommendedVariationForPack(
  code?: string | null,
  title?: string | null,
  creatorName?: string | null
): StaticTrainingVariationConfig | undefined {
  const normalizedCode = (code || '').trim().toUpperCase();
  if (normalizedCode && KEVPERT_PACK_VIDEO_VARIATIONS_BY_CODE[normalizedCode]) {
    return cloneVariationConfig(KEVPERT_PACK_VIDEO_VARIATIONS_BY_CODE[normalizedCode]);
  }

  const combined = `${title || ''} ${creatorName || ''}`;
  if (!/kevpert/i.test(combined)) {
    return undefined;
  }

  const fKeyMatch = (title || '').match(/\b(F1[0-2]|F[35789])\b/i);
  if (fKeyMatch) {
    const key = fKeyMatch[1].toUpperCase() as KevpertPresetKey;
    if (KEVPERT_LATEST_PRESETS[key]) {
      return cloneVariationConfig(KEVPERT_LATEST_PRESETS[key]);
    }
  }

  return undefined;
}
