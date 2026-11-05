/**
 * staticTrainingVariationTypes.ts
 * Types, Kevpert BakkesMod presets, and variance calculation helpers for
 * Static Training Packs (`RLRCSPack` / `RCSPack` / `RCSPackE`).
 */

export type KevpertPresetKey =
  | 'F3'
  | 'F5'
  | 'F7'
  | 'F8'
  | 'F9'
  | 'F10'
  | 'F11'
  | 'F12';

export const KEVPERT_PRESET_KEYS: KevpertPresetKey[] = [
  'F3',
  'F5',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
];

export interface StaticTrainingVariationConfig {
  /** Optional preset key label (e.g. 'F7') */
  presetKey?: KevpertPresetKey | 'CUSTOM';
  /** Human-readable preset or source description (e.g. 'Kevpert 2023 F7 (Dodge Control / Redirects)') */
  label?: string;
  /** Source YouTube video ID if matched from Kevpert video description */
  sourceVideoId?: string;
  /** Ball speed modifier percentage range [minPct, maxPct] (`sv_training_var_speed`, e.g. [-1.9, 3.5]) */
  ballSpeedModifierPct: [number, number];
  /** Ball XY horizontal location offset range in UU [minUU, maxUU] (`sv_training_var_loc`, e.g. [-100, 100]) */
  ballLocationModifierXY: [number, number];
  /** Ball Z vertical height offset range in UU [minUU, maxUU] (`sv_training_var_loc_z`, e.g. [-100, 100]) */
  ballHeightModifierZ: [number, number];
  /** Ball launch trajectory rotation modifier in degrees [minDeg, maxDeg] (`sv_training_var_rot`, e.g. [-5, 5]) */
  ballRotationModifierDeg: [number, number];
  /** Ball spin modifier in rad/s [minSpin, maxSpin] (`sv_training_var_spin`, e.g. [-0.3, 0.3]) */
  ballSpinModifier: [number, number];
  /** Vehicle starting speed range in UU/s [minSpeed, maxSpeed] (`sv_training_player_velocity`, null = keep shot's car speed) */
  vehicleSpeedRange: [number, number] | null;
  /** Vehicle XY location offset range in UU [minUU, maxUU] (`sv_training_var_car_loc`, e.g. [-315, 335]) */
  vehicleLocationModifier: [number, number];
  /** Vehicle yaw rotation offset range in degrees [minDeg, maxDeg] (`sv_training_var_car_rot`, e.g. [-6, 6]) */
  vehicleRotationModifierDeg: [number, number];
  /** Boost limit override (`sv_training_limitboost`, 0..100, null = keep shot's initialBoost) */
  boostLimitOverride: number | null;
  /** Force spawn vehicle on ground (settles suspension at Z=17.05) */
  forceSpawnVehicleOnGround: boolean;
  /** Force unlimited boost regardless of shot or preset boost limit */
  forceUnlimitedBoost: boolean;
}

export interface StaticTrainingQuickVariationToggles {
  /** User global override: when true, uses customVariation instead of pack's recommendedVariation */
  enableCustomVariationOverride: boolean;
  /** Additional boost added to boost limit (0 .. 100, clamped to max 100 in arena) */
  moreBoostAmount: number;
  /** Disables all ball variance (speed, location, height, trajectory rotation, spin) */
  disableBallVariance: boolean;
  /** Disables all vehicle variance (starting velocity override, location, rotation) */
  disableVehicleVariance: boolean;
  /** Globally disables random initial ball angular velocity for all packs */
  disableAllRandomAngularVelocity: boolean;
  /** Disables random initial ball angular velocity specifically for RLRCSPack (.Tem) packs (Default: true) */
  disableRLRCSPackAngularVelocity: boolean;
  /**
   * When true (default), shots with unlimitedBoost enabled will still display INF in the top pack HUD
   * while overriding actual boost consumption to start at 100 in the arena & bottom-right boost gauge.
   */
  overrideUnlimitedBoostAs100: boolean;
}

export const DEFAULT_QUICK_VARIATION_TOGGLES: StaticTrainingQuickVariationToggles = {
  enableCustomVariationOverride: false,
  moreBoostAmount: 0,
  disableBallVariance: false,
  disableVehicleVariance: false,
  disableAllRandomAngularVelocity: false,
  disableRLRCSPackAngularVelocity: true,
  overrideUnlimitedBoostAs100: true,
};

/**
 * Latest Kevpert BakkesMod F-key presets (June–August 2023 standard + F5 from Defense series).
 */
export const KEVPERT_LATEST_PRESETS: Record<KevpertPresetKey, StaticTrainingVariationConfig> = {
  F3: {
    presetKey: 'F3',
    label: 'F3 • Fast Aerial / Dodge Control 2 (Vel 1600–1800, Boost 90)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-100, 100],
    ballRotationModifierDeg: [-5.0, 5.0],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1600, 1800],
    vehicleLocationModifier: [-315, 335],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 90,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F5: {
    presetKey: 'F5',
    label: 'F5 • Backwall Def / Turn & Clear (Vel 600–800, Boost 40)',
    ballSpeedModifierPct: [-1.0, 0.5],
    ballLocationModifierXY: [0, 0],
    ballHeightModifierZ: [0, 0],
    ballRotationModifierDeg: [-0.3, 0.3],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [600, 800],
    vehicleLocationModifier: [0, 0],
    vehicleRotationModifierDeg: [0, 0],
    boostLimitOverride: 40,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F7: {
    presetKey: 'F7',
    label: 'F7 • Adv Double Taps / Striking / Redirects (Vel 1500–1700, Boost 64)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-100, 100],
    ballRotationModifierDeg: [-5.0, 5.0],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1500, 1700],
    vehicleLocationModifier: [-315, 335],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 64,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F8: {
    presetKey: 'F8',
    label: 'F8 • 1s Shots / Mid-Speed Setups (Vel 450–650, Boost 35)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-100, 100],
    ballRotationModifierDeg: [-5.0, 5.0],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [450, 650],
    vehicleLocationModifier: [-315, 335],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 35,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F9: {
    presetKey: 'F9',
    label: 'F9 • Low-Boost / Boost Pickups (Vel 250–450, Boost 16)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-100, 100],
    ballRotationModifierDeg: [-5.0, 5.0],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [250, 450],
    vehicleLocationModifier: [-315, 335],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 16,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F10: {
    presetKey: 'F10',
    label: 'F10 • High-Speed Double Taps (Vel 1700–1900, Boost 70)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-100, 100],
    ballRotationModifierDeg: [-5.0, 5.0],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1700, 1900],
    vehicleLocationModifier: [-315, 335],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 70,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F11: {
    presetKey: 'F11',
    label: 'F11 • Wall Powerclears / Aerial Setups (Vel 750–900, Boost 85)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-100, 100],
    ballRotationModifierDeg: [-5.0, 5.0],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [750, 900],
    vehicleLocationModifier: [-315, 335],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 85,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F12: {
    presetKey: 'F12',
    label: 'F12 • Mid-Fast Aerials / Reads (Vel 1200–1350, Boost 65)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-100, 100],
    ballRotationModifierDeg: [-5.0, 5.0],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1200, 1350],
    vehicleLocationModifier: [-315, 335],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 65,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
};

import { KEVPERT_PACK_VIDEO_VARIATIONS_BY_CODE } from './staticTrainingKevpertPackCatalog';
export { KEVPERT_PACK_VIDEO_VARIATIONS_BY_CODE };

export function cloneVariationConfig(
  cfg: Partial<StaticTrainingVariationConfig> | null | undefined
): StaticTrainingVariationConfig {
  const fallback = KEVPERT_LATEST_PRESETS.F7;
  if (!cfg) {
    return {
      ...fallback,
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
  return {
    presetKey: cfg.presetKey ?? 'CUSTOM',
    label: cfg.label ?? 'Custom Training Variation',
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
 * Resolves the recommended variation for a training pack given its code and title.
 */
export function resolveRecommendedVariationForPack(
  code?: string | null,
  title?: string | null,
  _creator?: string | null
): StaticTrainingVariationConfig | undefined {
  const normCode = (code || '').trim().toUpperCase();
  if (normCode && KEVPERT_PACK_VIDEO_VARIATIONS_BY_CODE[normCode]) {
    return cloneVariationConfig(KEVPERT_PACK_VIDEO_VARIATIONS_BY_CODE[normCode]);
  }
  const fKeyMatch = (title || '').match(/\b(F3|F5|F7|F8|F9|F10|F11|F12)\b/i);
  if (fKeyMatch) {
    const key = fKeyMatch[1].toUpperCase() as KevpertPresetKey;
    if (KEVPERT_LATEST_PRESETS[key]) {
      return cloneVariationConfig(KEVPERT_LATEST_PRESETS[key]);
    }
  }
  return undefined;
}
