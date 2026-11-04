/**
 * kevpertVariancePresets.ts
 * Canonical BakkesMod & Kevpert Training Variance presets, historical era conflict resolution,
 * Kevpert training pack code catalog, and BakkesMod `bind Fxx "sv_training_..."` parser.
 */

export type KevpertVarianceEra =
  | 'era3-tight-2023'      // May-Jul 2023: Redirects, Dodge Control, Flip Resets, Catches, Wall Stops, Powerslide
  | 'era2-wide-2023'       // Apr/Jun 2023: Car Control Air Dribbles #1, High/Low Rebounds (wide arena spread)
  | 'era1-precision-2019'; // 2019-2021: Backwall Defense, Turn & Clear, Long Shots, Adv Double Taps (zero loc spread)

export type TrainingVariancePresetId =
  | 'off'
  | 'kevpert-f3'
  | 'kevpert-f5'
  | 'kevpert-f7'
  | 'kevpert-f8'
  | 'kevpert-f9'
  | 'kevpert-f10'
  | 'kevpert-f11'
  | 'kevpert-f12'
  | 'bm-very-low'
  | 'bm-low'
  | 'bm-medium'
  | 'bm-high'
  | 'custom';

export interface TrainingVarianceConfig {
  enabled: boolean;
  presetId: TrainingVariancePresetId;
  era: KevpertVarianceEra;
  /** Whether `sv_training_player_velocity` overrides the shot's base car launch speed */
  overridePlayerVelocity: boolean;
  /** `sv_training_player_velocity (min, max)` in uu/s (0..2300) */
  playerVelocityRange: [number, number];
  /** `sv_training_limitboost`: -1 = keep shot default, 0..100 = override initial boost & disable unlimited */
  limitBoost: number;
  /** `sv_training_var_speed (min, max)` in % delta of ball initial speed */
  ballSpeedPctRange: [number, number];
  /** `sv_training_var_rot (min, max)` in BakkesMod rotation units (1.0 unit = 1 deg trajectory deflection) */
  ballRotPctRange: [number, number];
  /** `sv_training_var_loc (min, max)` in uu horizontal X/Y offset */
  ballLocXYRange: [number, number];
  /** `sv_training_var_loc_z (min, max)` in uu vertical Z offset */
  ballLocZRange: [number, number];
  /** `sv_training_var_spin (min, max)` in rad/s ball angular velocity offset */
  ballSpinRange: [number, number];
  /** `sv_training_var_car_loc (min, max)` in uu car horizontal X/Y offset */
  carLocXYRange: [number, number];
  /** `sv_training_var_car_rot (min, max)` in deg car yaw rotation offset */
  carRotPctRange: [number, number];
  /** Probability [0..1] of mirroring the shot across the X=0 center plane (`sv_training_mirror`) */
  mirrorShotProbability: number;
  /** Base deterministic seed for episode RNG */
  baseSeed: number;
}

export interface KevpertFKeySpec {
  id: TrainingVariancePresetId;
  fKey: string;
  shortLabel: string;
  roleSummary: string;
  limitBoost: number;
  /** Velocity ranges per era when Kevpert adjusted his F-key speed brackets */
  velocityByEra: Record<KevpertVarianceEra, [number, number]>;
  conflictNote?: string;
}

export const KEVPERT_ERA_SPREADS: Record<
  KevpertVarianceEra,
  {
    label: string;
    subtitle: string;
    ballSpeedPctRange: [number, number];
    ballRotPctRange: [number, number];
    ballLocXYRange: [number, number];
    ballLocZRange: [number, number];
    ballSpinRange: [number, number];
    carLocXYRange: [number, number];
    carRotPctRange: [number, number];
  }
> = {
  'era3-tight-2023': {
    label: 'Era 3: Tight Mechanical (May–Jul 2023)',
    subtitle: 'Redirects, Dodge Control, Flip Resets, Catches, Wall Stops, Powerslide (±5 uu ball, ±75 uu car)',
    ballSpeedPctRange: [-1.9, 2.5],
    ballRotPctRange: [-1.2, 1.2],
    ballLocXYRange: [-5.0, 5.0],
    ballLocZRange: [-5.0, 5.0],
    ballSpinRange: [-0.3, 0.3],
    carLocXYRange: [-75.0, 75.0],
    carRotPctRange: [-6.0, 6.0],
  },
  'era2-wide-2023': {
    label: 'Era 2: Wide Arena Spread (Apr/Jun 2023)',
    subtitle: 'Car Control Air Dribbles #1 & High/Low Rebounds (±100 uu ball, -315..335 uu car)',
    ballSpeedPctRange: [-1.9, 3.5],
    ballRotPctRange: [-5.0, 5.0],
    ballLocXYRange: [-100.0, 100.0],
    ballLocZRange: [-100.0, 100.0],
    ballSpinRange: [-0.3, 0.3],
    carLocXYRange: [-315.0, 335.0],
    carRotPctRange: [-6.0, 6.0],
  },
  'era1-precision-2019': {
    label: 'Era 1: Precision Zero-Loc (2019–2021)',
    subtitle: 'Backwall Defense, Turn & Clear, Long Shots, Adv Double Taps (0 uu loc, ±0.3 rot)',
    ballSpeedPctRange: [-1.0, 0.5],
    ballRotPctRange: [-0.3, 0.3],
    ballLocXYRange: [0.0, 0.0],
    ballLocZRange: [0.0, 0.0],
    ballSpinRange: [-0.3, 0.3],
    carLocXYRange: [0.0, 0.0],
    carRotPctRange: [0.0, 0.0],
  },
};

export const KEVPERT_FKEY_SPECS: KevpertFKeySpec[] = [
  {
    id: 'kevpert-f3',
    fKey: 'F3',
    shortLabel: 'F3 · High Speed (1600–1800) · 90B',
    roleSummary: 'Fast approach / 90 boost high-momentum setups',
    limitBoost: 90,
    velocityByEra: {
      'era3-tight-2023': [1600, 1800],
      'era2-wide-2023': [1600, 1800],
      'era1-precision-2019': [1600, 1800],
    },
  },
  {
    id: 'kevpert-f5',
    fKey: 'F5',
    shortLabel: 'F5 · Defense Mid-Low (650–850) · 40B',
    roleSummary: 'Backwall Defense & Turn & Clear shadow saves with 40 boost',
    limitBoost: 40,
    velocityByEra: {
      'era3-tight-2023': [650, 850],
      'era2-wide-2023': [650, 850],
      'era1-precision-2019': [600, 800],
    },
    conflictNote: '2019 Defense used (600, 800); 2021 Double Taps bumped F5 to (650, 850).',
  },
  {
    id: 'kevpert-f7',
    fKey: 'F7',
    shortLabel: 'F7 · Fast Aerial / Catch (1500–1700) · 64B',
    roleSummary: 'Dodge Control, Ground Catches, Redirects & Adv Double Taps 2',
    limitBoost: 64,
    velocityByEra: {
      'era3-tight-2023': [1500, 1700],
      'era2-wide-2023': [1500, 1700],
      'era1-precision-2019': [1500, 1700],
    },
  },
  {
    id: 'kevpert-f8',
    fKey: 'F8',
    shortLabel: 'F8 · Low-Mid Speed · 35B',
    roleSummary: 'Long & Air Roll Shots / Low-boost transitions',
    limitBoost: 35,
    velocityByEra: {
      'era3-tight-2023': [750, 950],
      'era2-wide-2023': [450, 650],
      'era1-precision-2019': [450, 650],
    },
    conflictNote:
      'Era 1/2 use (450, 650) @ 35B; 2021 Double Taps used (500, 800) @ 40B; May–Jul 2023 uses (750, 950) @ 35B.',
  },
  {
    id: 'kevpert-f9',
    fKey: 'F9',
    shortLabel: 'F9 · Starved 16B Slow Setup',
    roleSummary: '16-boost starved recovery, catches, and close-range setups',
    limitBoost: 16,
    velocityByEra: {
      'era3-tight-2023': [400, 650],
      'era2-wide-2023': [250, 450],
      'era1-precision-2019': [250, 450],
    },
    conflictNote:
      'Era 1/2 & Wall Stops use (250, 450) @ 16B; May–Jul 2023 Catches/Redirects/Flip Resets use (400, 650) @ 16B.',
  },
  {
    id: 'kevpert-f10',
    fKey: 'F10',
    shortLabel: 'F10 · Supersonic (1700–1900) · 70B',
    roleSummary: 'Adv Double Taps 1, Air Dribbles #1 & High-Speed Redirects',
    limitBoost: 70,
    velocityByEra: {
      'era3-tight-2023': [1700, 1900],
      'era2-wide-2023': [1700, 1900],
      'era1-precision-2019': [1700, 1900],
    },
  },
  {
    id: 'kevpert-f11',
    fKey: 'F11',
    shortLabel: 'F11 · Medium Setup (750–900) · 85B',
    roleSummary: 'Wall Powerclears, Ground Flip Resets, Low Rebounds, Wall Stops, Powerslide',
    limitBoost: 85,
    velocityByEra: {
      'era3-tight-2023': [750, 900],
      'era2-wide-2023': [750, 900],
      'era1-precision-2019': [750, 900],
    },
  },
  {
    id: 'kevpert-f12',
    fKey: 'F12',
    shortLabel: 'F12 · Mid-High (1200–1350) · 65B',
    roleSummary: 'High Rebounds 1, Air Dribbles & Mid-Speed Redirects',
    limitBoost: 65,
    velocityByEra: {
      'era3-tight-2023': [1200, 1350],
      'era2-wide-2023': [1200, 1350],
      'era1-precision-2019': [1200, 1350],
    },
  },
];

export interface KevpertPackRecommendation {
  code: string;
  packName: string;
  videoTitle: string;
  recommendedFKey: TrainingVariancePresetId;
  recommendedEra: KevpertVarianceEra;
}

export const KEVPERT_PACK_RECOMMENDATIONS: KevpertPackRecommendation[] = [
  { code: 'DDC9-8CBF-5E2C-C3BE', packName: 'Kevpert - Backwall Defense', videoTitle: 'Ultimate Defense (2019)', recommendedFKey: 'kevpert-f5', recommendedEra: 'era1-precision-2019' },
  { code: '0C52-B1DD-39BC-EF97', packName: 'Kevpert - Turn & Clear', videoTitle: 'Ultimate Defense (2019)', recommendedFKey: 'kevpert-f5', recommendedEra: 'era1-precision-2019' },
  { code: '89F5-2C75-3B79-BA52', packName: 'Kevpert - Wall Powerclears', videoTitle: 'Ultimate Defense (2019)', recommendedFKey: 'kevpert-f11', recommendedEra: 'era1-precision-2019' },
  { code: 'FC42-A3E1-A202-884A', packName: 'Long & Air Roll Shots', videoTitle: 'Long & Air Roll Shots (2019)', recommendedFKey: 'kevpert-f8', recommendedEra: 'era1-precision-2019' },
  { code: '3115-DC26-525D-F409', packName: 'Adv Double Taps 1', videoTitle: 'Best Double Taps (2021)', recommendedFKey: 'kevpert-f10', recommendedEra: 'era1-precision-2019' },
  { code: 'DEC7-4CAD-1452-30D3', packName: 'Adv Double Taps 2', videoTitle: 'Best Double Taps (2021)', recommendedFKey: 'kevpert-f7', recommendedEra: 'era1-precision-2019' },
  { code: 'AFE5-53FD-EC5B-9352', packName: 'Car Control: Air Dribbles & Flip Resets #1', videoTitle: 'Car Control Routine (Apr 2023)', recommendedFKey: 'kevpert-f10', recommendedEra: 'era2-wide-2023' },
  { code: '5E3A-FC4A-3AD7-0BBD', packName: 'Redirects (50 Shots)', videoTitle: 'Redirects Training (May 2023)', recommendedFKey: 'kevpert-f10', recommendedEra: 'era3-tight-2023' },
  { code: '2C44-12C9-F864-CF3B', packName: 'Dodge Control 1', videoTitle: 'Dodge Control (May 2023)', recommendedFKey: 'kevpert-f7', recommendedEra: 'era3-tight-2023' },
  { code: '555F-7503-BBB9-E1E3', packName: 'GroundFlipReset 2', videoTitle: 'Flip Reset Like a Pro (May 2023)', recommendedFKey: 'kevpert-f11', recommendedEra: 'era3-tight-2023' },
  { code: '8FA1-DC94-C18D-D82B', packName: 'Catches Ground 1', videoTitle: 'Catches, Dribbles & Flicks (May 2023)', recommendedFKey: 'kevpert-f7', recommendedEra: 'era3-tight-2023' },
  { code: '9379-E2D6-673B-FFF3', packName: 'Rebounds 1', videoTitle: 'High & Low Rebounds (Jun 2023)', recommendedFKey: 'kevpert-f12', recommendedEra: 'era2-wide-2023' },
  { code: '950B-490B-649A-FBDE', packName: 'Low Rebounds 1', videoTitle: 'High & Low Rebounds (Jun 2023)', recommendedFKey: 'kevpert-f11', recommendedEra: 'era2-wide-2023' },
  { code: '5FEA-4927-9052-664F', packName: 'Wall Stops 1', videoTitle: 'Wall Stops & Control (Jul 2023)', recommendedFKey: 'kevpert-f11', recommendedEra: 'era3-tight-2023' },
  { code: 'ADEB-B89D-7EC3-E7FA', packName: 'Powerslide 1', videoTitle: 'Powerslide Control (Jul 2023)', recommendedFKey: 'kevpert-f11', recommendedEra: 'era3-tight-2023' },
];

export const DEFAULT_TRAINING_VARIANCE_CONFIG: TrainingVarianceConfig = {
  enabled: false,
  presetId: 'off',
  era: 'era3-tight-2023',
  overridePlayerVelocity: false,
  playerVelocityRange: [750, 900],
  limitBoost: -1,
  ballSpeedPctRange: [0, 0],
  ballRotPctRange: [0, 0],
  ballLocXYRange: [0, 0],
  ballLocZRange: [0, 0],
  ballSpinRange: [0, 0],
  carLocXYRange: [0, 0],
  carRotPctRange: [0, 0],
  mirrorShotProbability: 0,
  baseSeed: 1337,
};

export function buildVarianceConfigFromPreset(
  presetId: TrainingVariancePresetId,
  era: KevpertVarianceEra = 'era3-tight-2023',
  currentSeed = 1337,
): TrainingVarianceConfig {
  if (presetId === 'off') {
    return { ...DEFAULT_TRAINING_VARIANCE_CONFIG, era, baseSeed: currentSeed };
  }

  const fKeySpec = KEVPERT_FKEY_SPECS.find((s) => s.id === presetId);
  if (fKeySpec) {
    const spread = KEVPERT_ERA_SPREADS[era];
    const rotRange: [number, number] =
      presetId === 'kevpert-f7' && era === 'era3-tight-2023'
        ? [-1.5, 1.5]
        : [...spread.ballRotPctRange];
    return {
      enabled: true,
      presetId,
      era,
      overridePlayerVelocity: true,
      playerVelocityRange: [...fKeySpec.velocityByEra[era]],
      limitBoost: fKeySpec.limitBoost,
      ballSpeedPctRange: [...spread.ballSpeedPctRange],
      ballRotPctRange: rotRange,
      ballLocXYRange: [...spread.ballLocXYRange],
      ballLocZRange: [...spread.ballLocZRange],
      ballSpinRange: [...spread.ballSpinRange],
      carLocXYRange: [...spread.carLocXYRange],
      carRotPctRange: [...spread.carRotPctRange],
      mirrorShotProbability: 0,
      baseSeed: currentSeed,
    };
  }

  const bmPresets: Record<string, Partial<TrainingVarianceConfig>> = {
    'bm-very-low': {
      ballSpeedPctRange: [-2, 2],
      ballRotPctRange: [-1.5, 1.5],
      ballLocXYRange: [-15, 15],
      ballLocZRange: [-10, 10],
      ballSpinRange: [-0.5, 0.5],
      carLocXYRange: [-25, 25],
      carRotPctRange: [-2, 2],
    },
    'bm-low': {
      ballSpeedPctRange: [-5, 5],
      ballRotPctRange: [-3, 3],
      ballLocXYRange: [-50, 50],
      ballLocZRange: [-35, 35],
      ballSpinRange: [-1.5, 1.5],
      carLocXYRange: [-75, 75],
      carRotPctRange: [-5, 5],
    },
    'bm-medium': {
      ballSpeedPctRange: [-10, 10],
      ballRotPctRange: [-6, 6],
      ballLocXYRange: [-120, 120],
      ballLocZRange: [-80, 80],
      ballSpinRange: [-3, 3],
      carLocXYRange: [-180, 180],
      carRotPctRange: [-10, 10],
    },
    'bm-high': {
      ballSpeedPctRange: [-18, 18],
      ballRotPctRange: [-12, 12],
      ballLocXYRange: [-250, 250],
      ballLocZRange: [-150, 150],
      ballSpinRange: [-6, 6],
      carLocXYRange: [-320, 320],
      carRotPctRange: [-18, 18],
    },
  };

  const bm = bmPresets[presetId];
  return {
    ...DEFAULT_TRAINING_VARIANCE_CONFIG,
    enabled: true,
    presetId,
    era,
    overridePlayerVelocity: false,
    limitBoost: -1,
    ...(bm || {}),
    baseSeed: currentSeed,
  };
}

/**
 * Parses a raw BakkesMod bind or cvar string such as:
 * `bind F10 "sv_training_player_velocity (1700, 1900); sv_training_var_speed (-1.9, 3.5); ..."`
 */
export function parseBakkesModBindString(
  raw: string,
  base: TrainingVarianceConfig = DEFAULT_TRAINING_VARIANCE_CONFIG,
): TrainingVarianceConfig {
  const next: TrainingVarianceConfig = {
    ...base,
    enabled: true,
    presetId: 'custom',
  };

  const pairRegex = (cvar: string) =>
    new RegExp(`${cvar}\\s*\\(\\s*([-+]?\\d*\\.?\\d+)\\s*,\\s*([-+]?\\d*\\.?\\d+)\\s*\\)`, 'i');

  const matchPair = (cvar: string): [number, number] | null => {
    const m = raw.match(pairRegex(cvar));
    if (!m) return null;
    const a = parseFloat(m[1]);
    const b = parseFloat(m[2]);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return [Math.min(a, b), Math.max(a, b)];
  };

  const pVel = matchPair('sv_training_player_velocity');
  if (pVel) {
    next.overridePlayerVelocity = true;
    next.playerVelocityRange = pVel;
  }
  const vSpeed = matchPair('sv_training_var_speed');
  if (vSpeed) next.ballSpeedPctRange = vSpeed;
  const vRot = matchPair('sv_training_var_rot');
  if (vRot) next.ballRotPctRange = vRot;
  const vLoc = matchPair('sv_training_var_loc');
  if (vLoc) next.ballLocXYRange = vLoc;
  const vLocZ = matchPair('sv_training_var_loc_z');
  if (vLocZ) next.ballLocZRange = vLocZ;
  const vSpin = matchPair('sv_training_var_spin');
  if (vSpin) next.ballSpinRange = vSpin;
  const vCarLoc = matchPair('sv_training_var_car_loc');
  if (vCarLoc) next.carLocXYRange = vCarLoc;
  const vCarRot = matchPair('sv_training_var_car_rot');
  if (vCarRot) next.carRotPctRange = vCarRot;

  const boostMatch = raw.match(/sv_training_limitboost\s+([-+]?\d+)/i);
  if (boostMatch) {
    next.limitBoost = parseInt(boostMatch[1], 10);
  }

  return next;
}
