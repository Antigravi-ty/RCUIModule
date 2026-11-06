/**
 * kevpertVariationPresets.ts
 * Kevpert BakkesMod training variation presets:
 * 1. KEVPERT_LATEST_PRESETS (F1..F12 latest universal keybindings)
 * 2. KEVPERT_PACK_VIDEO_VARIATIONS_BY_CODE (per-pack historical video description specifications)
 * 3. Helpers to compare a pack's video spec against the latest F-key preset and resolve Old vs New mode.
 */

export type KevpertPresetKey =
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'F5'
  | 'F6'
  | 'F7'
  | 'F8'
  | 'F9'
  | 'F10'
  | 'F11'
  | 'F12';

export const KEVPERT_PRESET_KEYS: KevpertPresetKey[] = [
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
];

export interface StaticTrainingVariationConfig {
  /** Preset identifier if derived from Kevpert F1-F12 or custom */
  presetKey?: KevpertPresetKey | 'CUSTOM' | 'custom';
  /** Human-readable preset or source description */
  label?: string;
  /** Human-readable label alias */
  presetLabel?: string;
  /** Source YouTube video ID if matched from Kevpert video description */
  sourceVideoId?: string;
  /** Ball speed modifier percentage [minPct, maxPct] (e.g., [-1.9, 3.5]) */
  ballSpeedModifierPct: [number, number];
  /** Ball horizontal XY location modifier in Unreal Units [minUU, maxUU] */
  ballLocationModifierXY: [number, number];
  /** Ball vertical Z height modifier in Unreal Units [minUU, maxUU] */
  ballHeightModifierZ: [number, number];
  /** Ball velocity direction rotation modifier in degrees [minDeg, maxDeg] */
  ballRotationModifierDeg: [number, number];
  /** Ball angular velocity spin modifier in rad/s [minSpin, maxSpin] */
  ballSpinModifier: [number, number];
  /** Vehicle launch speed override range in UU/s [minSpeed, maxSpeed] (null = keep pack default) */
  vehicleSpeedRange: [number, number] | null;
  /** Vehicle XY location modifier in Unreal Units [minUU, maxUU] */
  vehicleLocationModifier: [number, number];
  /** Vehicle yaw rotation modifier in degrees [minDeg, maxDeg] */
  vehicleRotationModifierDeg: [number, number];
  /** Boost limit override [0..100] (null = keep pack default) */
  boostLimitOverride: number | null;
  /** Force vehicle to spawn snapped on the ground */
  forceSpawnVehicleOnGround: boolean;
  /** Force unlimited boost */
  forceUnlimitedBoost: boolean;
}

/**
 * Latest Kevpert BakkesMod Keybindings (F1 - F12) from Kevpert's latest videos
 * (e.g. Dodge Control 2 / Aerial Reads & Rebounds / 1v1 Defense & Offense).
 */
export const KEVPERT_LATEST_PRESETS: Record<KevpertPresetKey, StaticTrainingVariationConfig> = {
  F1: {
    presetKey: 'F1',
    label: 'F1 • Reset / Zero Variance (Boost 100)',
    presetLabel: 'Kevpert F1 (Reset / Zero Variance)',
    ballSpeedModifierPct: [0, 0],
    ballLocationModifierXY: [0, 0],
    ballHeightModifierZ: [0, 0],
    ballRotationModifierDeg: [0, 0],
    ballSpinModifier: [0, 0],
    vehicleSpeedRange: null,
    vehicleLocationModifier: [0, 0],
    vehicleRotationModifierDeg: [0, 0],
    boostLimitOverride: 100,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F2: {
    presetKey: 'F2',
    label: 'F2 • High Speed Tight (Vel 1600–1800, Boost 90)',
    presetLabel: 'Kevpert F2 (High Speed / 90 Boost)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-5, 5],
    ballHeightModifierZ: [-5, 5],
    ballRotationModifierDeg: [-1.2, 1.2],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1600, 1800],
    vehicleLocationModifier: [-50, 50],
    vehicleRotationModifierDeg: [-6, 6],
    boostLimitOverride: 90,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F3: {
    presetKey: 'F3',
    label: 'F3 • Fast Aerial / Dodge Control 2 (Vel 1600–1800, Boost 90)',
    presetLabel: 'Kevpert F3 (Wide Variance / 90 Boost)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-100, 100],
    ballRotationModifierDeg: [-5, 5],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1600, 1800],
    vehicleLocationModifier: [-315, 335],
    vehicleRotationModifierDeg: [-6, 6],
    boostLimitOverride: 90,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F4: {
    presetKey: 'F4',
    label: 'F4 • Tight High Speed (Vel 1600–1800, Boost 50)',
    presetLabel: 'Kevpert F4 (Tight High Speed / 50 Boost)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-5, 5],
    ballHeightModifierZ: [-5, 5],
    ballRotationModifierDeg: [-1.2, 1.2],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1600, 1800],
    vehicleLocationModifier: [-10, 10],
    vehicleRotationModifierDeg: [-6, 6],
    boostLimitOverride: 50,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F5: {
    presetKey: 'F5',
    label: 'F5 • Backwall Def / Turn & Clear (Vel 1400–1600, Boost 35)',
    presetLabel: 'Kevpert F5 (Wide Car Spawn / 35 Boost)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-5, 5],
    ballHeightModifierZ: [-5, 5],
    ballRotationModifierDeg: [-1.2, 1.2],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1400, 1600],
    vehicleLocationModifier: [-350, 350],
    vehicleRotationModifierDeg: [-10, 10],
    boostLimitOverride: 35,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F6: {
    presetKey: 'F6',
    label: 'F6 • Extreme Ball Height (Vel 1400–1600, Boost 52)',
    presetLabel: 'Kevpert F6 (Extreme Ball Height / 52 Boost)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-200, 400],
    ballRotationModifierDeg: [-5, 5],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1400, 1600],
    vehicleLocationModifier: [-75, 75],
    vehicleRotationModifierDeg: [-6, 6],
    boostLimitOverride: 52,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F7: {
    presetKey: 'F7',
    label: 'F7 • Adv Double Taps / Striking / Redirects (Vel 1500–1700, Boost 64)',
    presetLabel: 'Kevpert F7 (Standard Aerial & Striking / 64 Boost)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-100, 100],
    ballRotationModifierDeg: [-5, 5],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1500, 1700],
    vehicleLocationModifier: [-315, 335],
    vehicleRotationModifierDeg: [-6, 6],
    boostLimitOverride: 64,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F8: {
    presetKey: 'F8',
    label: 'F8 • 1s Shots / Mid-Speed Setups (Vel 450–650, Boost 35)',
    presetLabel: 'Kevpert F8 (Low Boost Wide / 35 Boost)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-100, 100],
    ballRotationModifierDeg: [-5, 5],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [450, 650],
    vehicleLocationModifier: [-315, 335],
    vehicleRotationModifierDeg: [-6, 6],
    boostLimitOverride: 35,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F9: {
    presetKey: 'F9',
    label: 'F9 • Low-Boost / Boost Pickups (Vel 250–450, Boost 16)',
    presetLabel: 'Kevpert F9 (Minimal Boost Pickups / 16 Boost)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-100, 100],
    ballRotationModifierDeg: [-5, 5],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [250, 450],
    vehicleLocationModifier: [-315, 335],
    vehicleRotationModifierDeg: [-6, 6],
    boostLimitOverride: 16,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F10: {
    presetKey: 'F10',
    label: 'F10 • High-Speed Double Taps (Vel 1700–1900, Boost 70)',
    presetLabel: 'Kevpert F10 (High-Speed Double Taps / 70 Boost)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-100, 100],
    ballRotationModifierDeg: [-5, 5],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1700, 1900],
    vehicleLocationModifier: [-315, 335],
    vehicleRotationModifierDeg: [-6, 6],
    boostLimitOverride: 70,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F11: {
    presetKey: 'F11',
    label: 'F11 • Wall Powerclears / Aerial Setups (Vel 750–900, Boost 85)',
    presetLabel: 'Kevpert F11 (Slow Approach / 85 Boost)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-100, 100],
    ballRotationModifierDeg: [-5, 5],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [750, 900],
    vehicleLocationModifier: [-315, 335],
    vehicleRotationModifierDeg: [-6, 6],
    boostLimitOverride: 85,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  F12: {
    presetKey: 'F12',
    label: 'F12 • Mid-Fast Aerials / Reads (Vel 1200–1350, Boost 65)',
    presetLabel: 'Kevpert F12 (Mid-Fast Aerials / 65 Boost)',
    ballSpeedModifierPct: [-1.9, 3.5],
    ballLocationModifierXY: [-100, 100],
    ballHeightModifierZ: [-100, 100],
    ballRotationModifierDeg: [-5, 5],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1200, 1350],
    vehicleLocationModifier: [-315, 335],
    vehicleRotationModifierDeg: [-6, 6],
    boostLimitOverride: 65,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
};

/**
 * Historical video-exact Kevpert variations by Rocket League Training Pack Code.
 * Extracted directly from Kevpert's YouTube video descriptions where each pack was published.
 * Default OFF ("Apply Old") uses these exact video-time parameters;
 * ON ("Apply New") upgrades to KEVPERT_LATEST_PRESETS[presetKey].
 */
export const KEVPERT_PACK_VIDEO_VARIATIONS_BY_CODE: Record<string, StaticTrainingVariationConfig> = {
  // 2019-04-15: Long & Air Roll Shots (FffJoKWnOps)
  'FC42-A3E1-A202-884A': {
    presetKey: 'F8',
    label: 'Kevpert: Striking 1s Shots F8 (2019 Video Spec)',
    presetLabel: 'Kevpert F8 (2019 Video Spec)',
    sourceVideoId: 'FffJoKWnOps',
    ballSpeedModifierPct: [-1.0, 0.5],
    ballLocationModifierXY: [0, 0],
    ballHeightModifierZ: [0, 0],
    ballRotationModifierDeg: [-0.3, 0.3],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [450, 650],
    vehicleLocationModifier: [0, 0],
    vehicleRotationModifierDeg: [0, 0],
    boostLimitOverride: 35,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  // 2019-05-10: Ultimate Defense: Backwall Defense, Turn & Clears, Wall Powerclears (MlBlhnHe0Ns)
  'DDC9-8CBF-5E2C-C3BE': {
    presetKey: 'F5',
    label: 'Kevpert: Backwall Def 1 F5 (2019 Video Spec)',
    presetLabel: 'Kevpert F5 (2019 Video Spec)',
    sourceVideoId: 'MlBlhnHe0Ns',
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
  '0C52-B1DD-39BC-EF97': {
    presetKey: 'F5',
    label: 'Kevpert: Turn & Clear 1 F5 (2019 Video Spec)',
    presetLabel: 'Kevpert F5 (2019 Video Spec)',
    sourceVideoId: 'MlBlhnHe0Ns',
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
  '89F5-2C75-3B79-BA52': {
    presetKey: 'F11',
    label: 'Kevpert: Wall Powerclears F11 (2019 Video Spec)',
    presetLabel: 'Kevpert F11 (2019 Video Spec)',
    sourceVideoId: 'MlBlhnHe0Ns',
    ballSpeedModifierPct: [-1.0, 0.5],
    ballLocationModifierXY: [0, 0],
    ballHeightModifierZ: [0, 0],
    ballRotationModifierDeg: [-0.3, 0.3],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [750, 900],
    vehicleLocationModifier: [0, 0],
    vehicleRotationModifierDeg: [0, 0],
    boostLimitOverride: 85,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  // 2023-05-14: Double Taps Training (1aIWlWXOQZk)
  '3115-DC26-525D-F409': {
    presetKey: 'F10',
    label: 'Kevpert: Adv Double Taps 1 F10 (May 2023 Video Spec)',
    presetLabel: 'Kevpert F10 (May 2023 Video Spec)',
    sourceVideoId: '1aIWlWXOQZk',
    ballSpeedModifierPct: [-1.0, 0.5],
    ballLocationModifierXY: [0, 0],
    ballHeightModifierZ: [0, 0],
    ballRotationModifierDeg: [-0.3, 0.3],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1700, 1900],
    vehicleLocationModifier: [0, 0],
    vehicleRotationModifierDeg: [0, 0],
    boostLimitOverride: 70,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  'DEC7-4CAD-1452-30D3': {
    presetKey: 'F7',
    label: 'Kevpert: Adv Double Taps 2 F7 (May 2023 Video Spec)',
    presetLabel: 'Kevpert F7 (May 2023 Video Spec)',
    sourceVideoId: '1aIWlWXOQZk',
    ballSpeedModifierPct: [-1.0, 0.5],
    ballLocationModifierXY: [0, 0],
    ballHeightModifierZ: [0, 0],
    ballRotationModifierDeg: [-0.3, 0.3],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1500, 1700],
    vehicleLocationModifier: [0, 0],
    vehicleRotationModifierDeg: [0, 0],
    boostLimitOverride: 64,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  // 2023-05-22: Redirects (5STk3c4X2mw)
  '5E3A-FC4A-3AD7-0BBD': {
    presetKey: 'F7',
    label: 'Kevpert: Redirects 1 F7 (May 2023 Video Spec)',
    presetLabel: 'Kevpert F7 (May 2023 Video Spec)',
    sourceVideoId: '5STk3c4X2mw',
    ballSpeedModifierPct: [-1.9, 2.5],
    ballLocationModifierXY: [-5.0, 5.0],
    ballHeightModifierZ: [-5.0, 5.0],
    ballRotationModifierDeg: [-1.5, 1.5],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1500, 1700],
    vehicleLocationModifier: [-75, 75],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 64,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  // 2023-05-28: Striking 1 & 2 (Pst1mRFWqjM)
  '1711-49F1-66CB-FC65': {
    presetKey: 'F7',
    label: 'Kevpert: Striking 1 F7 (May 2023 Video Spec)',
    presetLabel: 'Kevpert F7 (May 2023 Video Spec)',
    sourceVideoId: 'Pst1mRFWqjM',
    ballSpeedModifierPct: [-1.9, 2.5],
    ballLocationModifierXY: [-5.0, 5.0],
    ballHeightModifierZ: [-5.0, 5.0],
    ballRotationModifierDeg: [-1.5, 1.5],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1500, 1700],
    vehicleLocationModifier: [-75, 75],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 64,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  '097C-9818-637B-7B55': {
    presetKey: 'F7',
    label: 'Kevpert: Striking 2 F7 (May 2023 Video Spec)',
    presetLabel: 'Kevpert F7 (May 2023 Video Spec)',
    sourceVideoId: 'Pst1mRFWqjM',
    ballSpeedModifierPct: [-1.9, 2.5],
    ballLocationModifierXY: [-5.0, 5.0],
    ballHeightModifierZ: [-5.0, 5.0],
    ballRotationModifierDeg: [-1.5, 1.5],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1500, 1700],
    vehicleLocationModifier: [-75, 75],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 64,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  // 2023-06-04: Dodge Control 1 (IjaWcvSgSc0)
  '2C44-12C9-F864-CF3B': {
    presetKey: 'F7',
    label: 'Kevpert: Dodge Control 1 F7 (June 2023 Video Spec)',
    presetLabel: 'Kevpert F7 (June 2023 Video Spec)',
    sourceVideoId: 'IjaWcvSgSc0',
    ballSpeedModifierPct: [-1.9, 2.5],
    ballLocationModifierXY: [-5.0, 5.0],
    ballHeightModifierZ: [-5.0, 5.0],
    ballRotationModifierDeg: [-1.5, 1.5],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1500, 1700],
    vehicleLocationModifier: [-75, 75],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 64,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  // 2023-06-11: Powerslide 1 (rA8fccIIMVs)
  'ADEB-B89D-7EC3-E7FA': {
    presetKey: 'F11',
    label: 'Kevpert: Powerslide 1 F11 (June 2023 Video Spec)',
    presetLabel: 'Kevpert F11 (June 2023 Video Spec)',
    sourceVideoId: 'rA8fccIIMVs',
    ballSpeedModifierPct: [-1.9, 2.5],
    ballLocationModifierXY: [-5.0, 5.0],
    ballHeightModifierZ: [-5.0, 5.0],
    ballRotationModifierDeg: [-1.2, 1.2],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [750, 900],
    vehicleLocationModifier: [-75, 75],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 85,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  // 2023-06-18: Catches Ground 1 (ztRZ46ZyUq8)
  '8FA1-DC94-C18D-D82B': {
    presetKey: 'F7',
    label: 'Kevpert: Catches Ground 1 F7 (June 2023 Video Spec)',
    presetLabel: 'Kevpert F7 (June 2023 Video Spec)',
    sourceVideoId: 'ztRZ46ZyUq8',
    ballSpeedModifierPct: [-1.9, 2.5],
    ballLocationModifierXY: [-5.0, 5.0],
    ballHeightModifierZ: [-5.0, 5.0],
    ballRotationModifierDeg: [-1.5, 1.5],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [1500, 1700],
    vehicleLocationModifier: [-75, 75],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 64,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  // 2023-06-19: GroundFlipReset 2 F11 (i0YfQLqjgBU)
  '555F-7503-BBB9-E1E3': {
    presetKey: 'F11',
    label: 'Kevpert: GroundFlipReset 2 F11 (June 2023 Video Spec)',
    presetLabel: 'Kevpert F11 (June 2023 Video Spec)',
    sourceVideoId: 'i0YfQLqjgBU',
    ballSpeedModifierPct: [-1.9, 2.5],
    ballLocationModifierXY: [-5.0, 5.0],
    ballHeightModifierZ: [-5.0, 5.0],
    ballRotationModifierDeg: [-1.2, 1.2],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [750, 900],
    vehicleLocationModifier: [-75, 75],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 85,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  // 2023-06-25: Boost Pickups (edWi_ATGh9A) — Matches Latest F8
  'E9CC-EFC9-AE09-B500': {
    ...KEVPERT_LATEST_PRESETS.F8,
    label: 'Kevpert: Boost Pickups F8 (June 2023 Video Spec)',
    presetLabel: 'Kevpert F8',
    sourceVideoId: 'edWi_ATGh9A',
  },
  // 2023-07-02: Wall Stops 1 (fOA9lOjpbNE)
  '5FEA-4927-9052-664F': {
    presetKey: 'F11',
    label: 'Kevpert: Wall Stops 1 F11 (July 2023 Video Spec)',
    presetLabel: 'Kevpert F11 (July 2023 Video Spec)',
    sourceVideoId: 'fOA9lOjpbNE',
    ballSpeedModifierPct: [-1.9, 2.5],
    ballLocationModifierXY: [-5.0, 5.0],
    ballHeightModifierZ: [-5.0, 5.0],
    ballRotationModifierDeg: [-1.2, 1.2],
    ballSpinModifier: [-0.3, 0.3],
    vehicleSpeedRange: [750, 900],
    vehicleLocationModifier: [-75, 75],
    vehicleRotationModifierDeg: [-6.0, 6.0],
    boostLimitOverride: 85,
    forceSpawnVehicleOnGround: false,
    forceUnlimitedBoost: false,
  },
  // 2023-07-08: GroundFlipReset 1 F3 (0abbKpEMnWA) — Matches Latest F3
  'AFE5-53FD-EC5B-9352': {
    ...KEVPERT_LATEST_PRESETS.F3,
    label: 'Kevpert: GroundFlipReset 1 F3 (July 2023 Video Spec)',
    presetLabel: 'Kevpert F3',
    sourceVideoId: '0abbKpEMnWA',
  },
  // 2023-07-09: Rebounds Low 1 & Rebounds 1 (6cV5N31jYag) — Matches Latest F11 & F12
  '950B-490B-649A-FBDE': {
    ...KEVPERT_LATEST_PRESETS.F11,
    label: 'Kevpert: Rebounds Low 1 F11 (July 2023 Video Spec)',
    presetLabel: 'Kevpert F11',
    sourceVideoId: '6cV5N31jYag',
  },
  '9379-E2D6-673B-FFF3': {
    ...KEVPERT_LATEST_PRESETS.F12,
    label: 'Kevpert: Rebounds 1 F12 (July 2023 Video Spec)',
    presetLabel: 'Kevpert F12',
    sourceVideoId: '6cV5N31jYag',
  },
  // 2023-08-06: Dodge Control 2 (l1qDJypL6sE) — Matches Latest F3
  '0624-600D-000E-F2A7': {
    ...KEVPERT_LATEST_PRESETS.F3,
    label: 'Kevpert: Dodge Control 2 F3 (Aug 2023 Video Spec)',
    presetLabel: 'Kevpert F3',
    sourceVideoId: 'l1qDJypL6sE',
  },
};

function tupleEquals(
  a: [number, number] | null | undefined,
  b: [number, number] | null | undefined
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return Math.abs(a[0] - b[0]) < 1e-4 && Math.abs(a[1] - b[1]) < 1e-4;
}

/**
 * Checks whether a variation config matches the latest Kevpert preset for its F-key.
 */
export function isVariationMatchingLatestPreset(
  variation: StaticTrainingVariationConfig | null | undefined
): boolean {
  if (
    !variation ||
    !variation.presetKey ||
    variation.presetKey === 'custom' ||
    variation.presetKey === 'CUSTOM'
  ) {
    return false;
  }
  const latest = KEVPERT_LATEST_PRESETS[variation.presetKey as KevpertPresetKey];
  if (!latest) return false;

  return (
    tupleEquals(variation.ballSpeedModifierPct, latest.ballSpeedModifierPct) &&
    tupleEquals(variation.ballLocationModifierXY, latest.ballLocationModifierXY) &&
    tupleEquals(variation.ballHeightModifierZ, latest.ballHeightModifierZ) &&
    tupleEquals(variation.ballRotationModifierDeg, latest.ballRotationModifierDeg) &&
    tupleEquals(variation.ballSpinModifier, latest.ballSpinModifier) &&
    tupleEquals(variation.vehicleSpeedRange, latest.vehicleSpeedRange) &&
    tupleEquals(variation.vehicleLocationModifier, latest.vehicleLocationModifier) &&
    tupleEquals(variation.vehicleRotationModifierDeg, latest.vehicleRotationModifierDeg) &&
    variation.boostLimitOverride === latest.boostLimitOverride
  );
}

/**
 * Resolves the effective recommended variation for a pack given the user's
 * `applyNewKevpertBind` toggle:
 * - false (default / OFF): uses the pack's historical video description spec (`variation`)
 * - true (ON): upgrades to the latest Kevpert F-key preset (`KEVPERT_LATEST_PRESETS[presetKey]`)
 */
export function resolveEffectiveRecommendedVariation(
  variation: StaticTrainingVariationConfig | null | undefined,
  applyNewKevpertBind = false
): StaticTrainingVariationConfig | null {
  if (!variation) return null;
  if (
    applyNewKevpertBind &&
    variation.presetKey &&
    variation.presetKey !== 'custom' &&
    variation.presetKey !== 'CUSTOM' &&
    KEVPERT_LATEST_PRESETS[variation.presetKey as KevpertPresetKey]
  ) {
    const latest = KEVPERT_LATEST_PRESETS[variation.presetKey as KevpertPresetKey];
    const lbl = `Kevpert ${variation.presetKey} (Latest)`;
    return {
      ...latest,
      label: lbl,
      presetLabel: lbl,
    };
  }
  return variation;
}
