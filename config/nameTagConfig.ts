export type NameTagDepthMetric = 'viewZ' | 'euclidean';
export type NameTagFontFamily = 'jetbrains-mono' | 'sf-mono' | 'archivo';
export type NameTagFontWeight = 400 | 500 | 600 | 700;
export type NameTagBoostBorderColorMode = 'team' | 'shared';
export type NameTagBoostBorderAudience = 'teammates' | 'all' | 'none';
export type NameTagOffscreenAudience = NameTagBoostBorderAudience;
export type NameTagBoostIndicatorMode =
  | 'bottom-up-fill'
  | 'left-right-fill'
  | 'sunset-circle'
  | 'border-only';

export type NameTagAerialClimbTriggerMode =
  | 'double-jump'
  | 'hold-jump-pitch'
  | 'either'
  | 'both';

export type NameTagAerialClimbTriggerReason =
  | 'none'
  | 'double-jump'
  | 'hold-jump-pitch'
  | 'preview'
  | 'manual-override';

export interface NameTagBoostBorderSceneFlags {
  matchPlaying?: boolean | NameTagBoostBorderAudience;
  goalReplay?: boolean | NameTagBoostBorderAudience;
  cinematicCamera?: boolean | NameTagBoostBorderAudience;
}

export type NameTagBoostBorderOverride =
  | boolean
  | NameTagBoostBorderAudience
  | NameTagBoostBorderSceneFlags
  | null;

export interface NameTagCarOverride {
  enabled: boolean;
  scaleMultiplier: number;
  worldOffsetUu: number;
  screenOffsetPx: number;
}

export interface NameTagConfig {
  enabled: boolean;
  pillMinWidth: number;
  pillMaxWidth: number;
  pillHeight: number;
  cornerRadius: number;
  borderWidth: number;
  fontSize: number;
  fontFamily: NameTagFontFamily;
  fontWeight: NameTagFontWeight;
  cardRenderScale: number;
  maxChars: number;
  opacity: number;
  bgOpacity: number;
  verticalOffsetUu: number;
  screenVerticalOffsetPx: number;
  cameraScaleFactor: number;
  distanceScaleExponent: number;
  nearScaleMultiplier: number;
  farScaleMultiplier: number;
  depthMetric: NameTagDepthMetric;
  blueBgColor: string;
  blueBorderColor: string;
  blueTextColor: string;
  orangeBgColor: string;
  orangeBorderColor: string;
  orangeTextColor: string;
  boostBorderEnabled: boolean;
  boostIndicatorMode: NameTagBoostIndicatorMode;
  boostFillOpacity: number;
  boostUnfilledBgOpacity: number;
  boostShowHorizonLine: boolean;
  boostBorderColorMode: NameTagBoostBorderColorMode;
  blueBoostBorderColor: string;
  orangeBoostBorderColor: string;
  sharedBoostBorderColor: string;
  showBoostBorderInMatchPlaying: boolean;
  boostBorderMatchAudience: NameTagBoostBorderAudience;
  showBoostBorderInGoalReplay: boolean;
  boostBorderReplayAudience: NameTagBoostBorderAudience;
  ballOcclusionEnabled: boolean;
  ballOcclusionOpacity: number;
  offscreenIndicatorEnabled: boolean;
  offscreenAudience: NameTagBoostBorderAudience;
  offscreenShowBoostCircle: boolean;
  offscreenShowArrow: boolean;
  offscreenCircleRadiusPx: number;
  offscreenArrowLengthPx: number;
  offscreenArrowBaseWidthPx: number;
  offscreenArrowGapPx: number;
  offscreenRoiAvoidHud: boolean;
  offscreenRoiTopInsetPx: number;
  offscreenRoiBottomInsetPx: number;
  offscreenRoiSideInsetPx: number;
  aerialClimbAlertEnabled: boolean;
  aerialClimbAlertAudience: NameTagBoostBorderAudience;
  aerialClimbTriggerMode: NameTagAerialClimbTriggerMode;
  aerialClimbMinAltitudeUu: number;
  aerialClimbMinVelZUu: number;
  aerialClimbHoldJumpMinMs: number;
  aerialClimbMinPitchFwdZ: number;
  aerialClimbGlowColor: string;
  aerialClimbGlowRadiusPx: number;
  aerialClimbGlowOpacity: number;
  aerialClimbSimulatePovInTuner: boolean;
  previewAerialClimbingFlags: boolean[];
  previewBoostAmounts: number[];
  showOnLocalCar: boolean;
  previewNames: string[];
  carOverrides: NameTagCarOverride[];
}

export interface NameTagCarEntry {
  carIndex: number;
  name: string;
  team: 0 | 1 | number;
  boostAmount?: number;
  showBoostBorder?: boolean | null;
  isDoubleJumpedAndClimbing?: boolean;
  aerialClimbTriggerReason?: NameTagAerialClimbTriggerReason;
}

export type NameTagCameraMode =
  | 'pov'
  | 'wasmPov'
  | 'rearView'
  | 'free'
  | 'director'
  | 'podium';

export interface NameTagCarTelemetry {
  carIndex: number;
  slotCode: string;
  name: string;
  team: 0 | 1;
  visible: boolean;
  boostAmount?: number;
  boostBorderVisible?: boolean;
  isOffscreen?: boolean;
  isDoubleJumpedAndClimbing?: boolean;
  aerialClimbTriggerReason?: string;
  carAltitudeUu?: number;
  carVelZUu?: number;
  carPitchFwdZ?: number;
  carJumpHoldMs?: number;
  carWorldPos: [number, number, number];
  anchorWorldPos: [number, number, number];
  spriteWorldPos: [number, number, number];
  euclideanDistanceUu: number;
  viewZDepthUu: number;
  activeDepthUu: number;
  offAxisAngleDeg: number;
  worldScaleWidthUu: number;
  worldScaleHeightUu: number;
  screenPillWidthPx: number;
  screenPillHeightPx: number;
  effectiveScaleMultiplier: number;
  effectiveWorldOffsetUu: number;
  effectiveScreenOffsetPx: number;
  totalWorldVerticalOffsetUu: number;
}

export interface NameTagTelemetrySnapshot {
  updatedAtMs: number;
  viewportWidthPx: number;
  viewportHeightPx: number;
  aspectRatio: number;
  devicePixelRatio: number;
  cameraMode: string;
  focusedCarIndex: number;
  cameraFovDeg: number;
  cameraPosition: [number, number, number];
  cameraForward: [number, number, number];
  cameraUp: [number, number, number];
  cars: NameTagCarTelemetry[];
}

export interface NameTagRuntimeState {
  isTunerArenaActive: boolean;
  isMultiplayerOrMultiCarMode: boolean;
  kickoffPermutationIndex: number;
  activeCameraMode: NameTagCameraMode;
  focusedCarIndex: number;
  selectedCalibrationCarIndex: number;
  carEntries: NameTagCarEntry[];
  boostBorderOverride: NameTagBoostBorderOverride;
  onEnterTunerArena: (() => void) | null;
  onExitTunerArena: (() => void) | null;
  onReshuffleKickoffPositions: (() => void) | null;
  onSelectPovCar: ((carIndex: number) => void) | null;
  onFocusFreeCamOverview: (() => void) | null;
}

export interface NameTagFittedParameters {
  sampleCount: number;
  cameraScaleFactor: number;
  distanceScaleExponent: number;
  nearScaleMultiplier: number;
  farScaleMultiplier: number;
  verticalOffsetUu: number;
  screenVerticalOffsetPx: number;
}

export const NAME_TAG_STORAGE_KEY = 'rc_name_tag_config_v9';
export const NAME_TAG_REFERENCE_DEPTH_UU = 3500;
export const NAME_TAG_NEAR_CALIBRATION_DEPTH_UU = 500;
export const NAME_TAG_FAR_CALIBRATION_DEPTH_UU = 9000;
export const KICKOFF_PERMUTATION_COUNT = 5;

export function resolveNameTagFontFamilyCss(fontFamily: NameTagFontFamily): string {
  if (fontFamily === 'sf-mono') {
    return '"SF Mono", ui-monospace, "JetBrains Mono", Menlo, Monaco, Consolas, monospace';
  }
  if (fontFamily === 'archivo') {
    return '"Archivo", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif';
  }
  return '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Monaco, Consolas, monospace';
}

export function createDefaultCarOverride(
  worldOffsetUu = 50,
  screenOffsetPx = 6
): NameTagCarOverride {
  return {
    enabled: false,
    scaleMultiplier: 1.0,
    worldOffsetUu,
    screenOffsetPx,
  };
}

export const DEFAULT_NAME_TAG_CONFIG: NameTagConfig = {
  enabled: true,
  pillMinWidth: 80,
  pillMaxWidth: 380,
  pillHeight: 54,
  cornerRadius: 27,
  borderWidth: 4,
  fontSize: 48,
  fontFamily: 'jetbrains-mono',
  fontWeight: 600,
  cardRenderScale: 100,
  maxChars: 12,
  opacity: 0.7,
  bgOpacity: 0.7,
  verticalOffsetUu: 50,
  screenVerticalOffsetPx: 6,
  cameraScaleFactor: 0.04,
  distanceScaleExponent: 0.86,
  nearScaleMultiplier: 1.0,
  farScaleMultiplier: 1.0,
  depthMetric: 'viewZ',
  blueBgColor: '#075985',
  blueBorderColor: '#38bdf8',
  blueTextColor: '#ffffff',
  orangeBgColor: '#9a3412',
  orangeBorderColor: '#fb923c',
  orangeTextColor: '#ffffff',
  boostBorderEnabled: true,
  boostIndicatorMode: 'bottom-up-fill',
  boostFillOpacity: 1.0,
  boostUnfilledBgOpacity: 0.1,
  boostShowHorizonLine: true,
  boostBorderColorMode: 'shared',
  blueBoostBorderColor: '#ffffff',
  orangeBoostBorderColor: '#ffffff',
  sharedBoostBorderColor: '#ffffff',
  showBoostBorderInMatchPlaying: true,
  boostBorderMatchAudience: 'teammates',
  showBoostBorderInGoalReplay: true,
  boostBorderReplayAudience: 'all',
  ballOcclusionEnabled: true,
  ballOcclusionOpacity: 1.0,
  offscreenIndicatorEnabled: true,
  offscreenAudience: 'teammates',
  offscreenShowBoostCircle: true,
  offscreenShowArrow: true,
  offscreenCircleRadiusPx: 24,
  offscreenArrowLengthPx: 12,
  offscreenArrowBaseWidthPx: 12,
  offscreenArrowGapPx: 10,
  offscreenRoiAvoidHud: true,
  offscreenRoiTopInsetPx: 72,
  offscreenRoiBottomInsetPx: 132,
  offscreenRoiSideInsetPx: 60,
  aerialClimbAlertEnabled: true,
  aerialClimbAlertAudience: 'teammates',
  aerialClimbTriggerMode: 'hold-jump-pitch',
  aerialClimbMinAltitudeUu: 110,
  aerialClimbMinVelZUu: 400,
  aerialClimbHoldJumpMinMs: 70,
  aerialClimbMinPitchFwdZ: 0.2,
  aerialClimbGlowColor: '#facc15',
  aerialClimbGlowRadiusPx: 100,
  aerialClimbGlowOpacity: 0.9,
  aerialClimbSimulatePovInTuner: false,
  previewAerialClimbingFlags: [false, true, false, false, true, false],
  previewBoostAmounts: [100, 66, 33, 85, 50, 18],
  showOnLocalCar: false,
  previewNames: [
    'AlphaStriker',
    'Captain Ping',
    'Necto',
    'K',
    'Necto(2)',
    'LinLaoGay',
  ],
  carOverrides: Array.from({ length: 6 }, () => createDefaultCarOverride(50, 6)),
};

export function formatNameTagDisplayText(
  rawName: string,
  maxChars = DEFAULT_NAME_TAG_CONFIG.maxChars
): string {
  const trimmedName = String(rawName || 'Player').trim() || 'Player';
  const charLimit = Math.max(
    4,
    Math.min(32, Math.round(Number(maxChars) || DEFAULT_NAME_TAG_CONFIG.maxChars))
  );
  const glyphs = Array.from(trimmedName);
  if (glyphs.length <= charLimit) {
    return trimmedName;
  }
  const suffixLength = Math.max(1, charLimit - 1);
  return `…${glyphs.slice(-suffixLength).join('')}`;
}

export function estimateNameTagTextWidthPx(
  displayText: string,
  fontSize: number,
  fontFamily: NameTagFontFamily
): number {
  const unitFactor = fontFamily === 'archivo' ? 0.56 : 0.6;
  let totalUnits = 0;
  for (const ch of Array.from(displayText || '')) {
    const code = ch.codePointAt(0) || 0;
    totalUnits += code > 0x2e7f ? 1.0 : unitFactor;
  }
  return totalUnits * fontSize;
}

export function computeAdaptiveNameTagWidthPx(
  displayText: string,
  config: Pick<
    NameTagConfig,
    'pillMinWidth' | 'pillMaxWidth' | 'fontSize' | 'fontFamily' | 'borderWidth' | 'maxChars'
  >,
  measuredTextWidthPx?: number,
  measuredMaxRefTextWidthPx?: number
): number {
  const minWidth = Math.max(
    40,
    Math.min(
      460,
      Number.isFinite(Number(config.pillMinWidth))
        ? Number(config.pillMinWidth)
        : DEFAULT_NAME_TAG_CONFIG.pillMinWidth
    )
  );
  const maxWidth = Math.max(
    minWidth,
    Math.min(
      480,
      Number.isFinite(Number(config.pillMaxWidth))
        ? Number(config.pillMaxWidth)
        : DEFAULT_NAME_TAG_CONFIG.pillMaxWidth
    )
  );
  const fontSize = Math.max(
    12,
    Math.min(48, Number(config.fontSize) || DEFAULT_NAME_TAG_CONFIG.fontSize)
  );
  const borderWidth = Math.max(
    0,
    Math.min(12, Number(config.borderWidth) ?? DEFAULT_NAME_TAG_CONFIG.borderWidth)
  );
  const maxChars = Math.max(
    4,
    Math.min(32, Math.round(Number(config.maxChars) || DEFAULT_NAME_TAG_CONFIG.maxChars))
  );
  const fontFamily = config.fontFamily || DEFAULT_NAME_TAG_CONFIG.fontFamily;

  const textWidth =
    typeof measuredTextWidthPx === 'number' && Number.isFinite(measuredTextWidthPx)
      ? measuredTextWidthPx
      : estimateNameTagTextWidthPx(displayText, fontSize, fontFamily);
  const maxRefTextWidth =
    typeof measuredMaxRefTextWidthPx === 'number' && Number.isFinite(measuredMaxRefTextWidthPx)
      ? measuredMaxRefTextWidthPx
      : estimateNameTagTextWidthPx('M'.repeat(maxChars), fontSize, fontFamily);

  const glyphCount = Math.max(1, Array.from(displayText || 'P').length);
  const lengthRatio = Math.max(0, Math.min(1, (glyphCount - 1) / Math.max(1, maxChars - 1)));
  const maxPaddingPx = Math.max(16, maxWidth - maxRefTextWidth);
  const minPaddingPx = Math.min(maxPaddingPx, Math.max(12, fontSize * 0.35 + borderWidth * 2));
  const paddingPx = minPaddingPx + (maxPaddingPx - minPaddingPx) * lengthRatio;

  const unclampedWidth = textWidth + paddingPx;
  return Math.max(minWidth, Math.min(maxWidth, Math.round(unclampedWidth)));
}

export function resolveNameTagCornerRadiusPx(
  pillWidthPx: number,
  pillHeightPx: number,
  cornerRadius: number
): number {
  const rawRadius = Math.max(
    0,
    Math.min(
      60,
      Number.isFinite(Number(cornerRadius))
        ? Number(cornerRadius)
        : DEFAULT_NAME_TAG_CONFIG.cornerRadius
    )
  );
  return Math.max(0, Math.min(rawRadius, pillWidthPx * 0.5, pillHeightPx * 0.5));
}

export function resolveNameTagBoostBorderVisible(
  config: NameTagConfig,
  boostBorderOverride: NameTagBoostBorderOverride,
  carTeam: 0 | 1,
  povCarTeam: 0 | 1 | null
): boolean {
  if (!config.boostBorderEnabled) {
    return false;
  }
  if (boostBorderOverride === false || boostBorderOverride === 'none') {
    return false;
  }
  if (boostBorderOverride === true || boostBorderOverride === 'all') {
    return true;
  }
  if (boostBorderOverride === 'teammates') {
    return carTeam === (povCarTeam ?? 0);
  }
  if (!config.showBoostBorderInMatchPlaying || config.boostBorderMatchAudience === 'none') {
    return false;
  }
  return true;
}

export interface NameTagRuntimeSyncSnapshot {
  isTunerArenaActive: boolean;
  kickoffPermutationIndex: number;
  activeCameraMode: NameTagCameraMode;
  focusedCarIndex: number;
  selectedCalibrationCarIndex: number;
  boostBorderOverride: NameTagBoostBorderOverride;
}

export const DEFAULT_RUNTIME_SYNC_SNAPSHOT: NameTagRuntimeSyncSnapshot = {
  isTunerArenaActive: false,
  kickoffPermutationIndex: 0,
  activeCameraMode: 'pov',
  focusedCarIndex: 0,
  selectedCalibrationCarIndex: 0,
  boostBorderOverride: null,
};
