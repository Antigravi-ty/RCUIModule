export type NameTagDepthMetric = 'viewZ' | 'euclidean';
export type NameTagFontFamily = 'jetbrains-mono' | 'sf-mono' | 'archivo';
export type NameTagFontWeight = 400 | 500 | 600 | 700;
export type NameTagBoostBorderColorMode = 'team' | 'shared';
export type NameTagBoostBorderAudience = 'teammates' | 'all' | 'none';
export type NameTagOffscreenAudience = NameTagBoostBorderAudience;
export type NameTagBoostIndicatorMode = 'bottom-up-fill' | 'left-right-fill' | 'sunset-circle' | 'border-only';
export type NameTagCardDisplayMode = 'pill' | 'circle';
export type NameTagCircleLabelMode = 'slot-code' | 'none' | 'name';
export type NameTagCircleColorMode = 'team' | 'car-primary';
export type NameTagAerialClimbTriggerMode = 'double-jump' | 'hold-jump-pitch' | 'either' | 'both';
export type NameTagAerialClimbTriggerReason = 'none' | 'double-jump' | 'hold-jump-pitch' | 'preview' | 'manual-override';

export interface NameTagBoostBorderSceneFlags {
  matchPlaying?: boolean | NameTagBoostBorderAudience;
  goalReplay?: boolean | NameTagBoostBorderAudience;
  cinematicCamera?: boolean | NameTagBoostBorderAudience;
}

export type NameTagBoostBorderOverride = boolean | NameTagBoostBorderAudience | NameTagBoostBorderSceneFlags | null;

export interface NameTagCarOverride {
  enabled: boolean;
  scaleMultiplier: number;
  worldOffsetUu: number;
  screenOffsetPx: number;
}

export interface NameTagConfig {
  enabled: boolean;
  cardDisplayMode: NameTagCardDisplayMode;
  circleLabelMode: NameTagCircleLabelMode;
  circleColorMode: NameTagCircleColorMode;
  onscreenCircleFixedSize: boolean;
  onscreenCircleRadiusPx: number;
  onscreenCircleFontSizePx: number;
  onscreenCircleBorderWidthPx: number;
  slotCodes: string[];
  distinctCarColors: string[];
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
  boostFillColorBlendRatio: number;
  boostUnfilledBgOpacity: number;
  boostUnfilledDarkenRatio: number;
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
  offscreenShowSlotCode: boolean;
  offscreenCircleRadiusPx: number;
  offscreenBorderWidthPx: number;
  offscreenArrowLengthPx: number;
  offscreenArrowBaseWidthPx: number;
  offscreenArrowGapPx: number;
  offscreenDistanceScaleEnabled: boolean;
  offscreenDistanceMinScale: number;
  offscreenDistanceNearUu: number;
  offscreenDistanceFarUu: number;
  offscreenDistanceCurveExponent: number;
  offscreenDistanceSimEnabled: boolean;
  offscreenDistanceSimDistanceUu: number;
  offscreenDistanceSimAngleDeg: number;
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

export type NameTagCameraMode = 'pov' | 'wasmPov' | 'rearView' | 'free' | 'director' | 'podium';

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

export const NAME_TAG_STORAGE_KEY = 'rc_name_tag_config_v10';
export const NAME_TAG_REFERENCE_DEPTH_UU = 3500;
export const NAME_TAG_NEAR_CALIBRATION_DEPTH_UU = 500;
export const NAME_TAG_FAR_CALIBRATION_DEPTH_UU = 9000;
export const KICKOFF_PERMUTATION_COUNT = 5;

export function resolveNameTagFontFamilyCss(fontFamily: NameTagFontFamily): string {
  if (fontFamily === 'sf-mono') return '"SF Mono", ui-monospace, "JetBrains Mono", Menlo, Monaco, Consolas, monospace';
  if (fontFamily === 'archivo') return '"Archivo", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif';
  return '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Monaco, Consolas, monospace';
}

export function createDefaultCarOverride(worldOffsetUu = 50, screenOffsetPx = 6): NameTagCarOverride {
  return { enabled: false, scaleMultiplier: 1.0, worldOffsetUu, screenOffsetPx };
}

export const DEFAULT_NAME_TAG_SLOT_CODES: string[] = ['X', 'W', 'E', 'A', 'M', 'Z'];
export const DEFAULT_NAME_TAG_DISTINCT_COLORS: string[] = ['#0284c7', '#0d9488', '#4f46e5', '#ea580c', '#e11d48', '#d97706'];

export const DEFAULT_NAME_TAG_CONFIG: NameTagConfig = {
  enabled: true,
  cardDisplayMode: 'pill',
  circleLabelMode: 'name',
  circleColorMode: 'team',
  onscreenCircleFixedSize: true,
  onscreenCircleRadiusPx: 10,
  onscreenCircleFontSizePx: 48,
  onscreenCircleBorderWidthPx: 4,
  slotCodes: [...DEFAULT_NAME_TAG_SLOT_CODES],
  distinctCarColors: [...DEFAULT_NAME_TAG_DISTINCT_COLORS],
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
  boostFillColorBlendRatio: 1.0,
  boostUnfilledBgOpacity: 0.1,
  boostUnfilledDarkenRatio: 0.45,
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
  offscreenShowSlotCode: false,
  offscreenCircleRadiusPx: 24,
  offscreenBorderWidthPx: 4,
  offscreenArrowLengthPx: 12,
  offscreenArrowBaseWidthPx: 12,
  offscreenArrowGapPx: 10,
  offscreenDistanceScaleEnabled: true,
  offscreenDistanceMinScale: 0.5,
  offscreenDistanceNearUu: 1000,
  offscreenDistanceFarUu: 5000,
  offscreenDistanceCurveExponent: 1.35,
  offscreenDistanceSimEnabled: false,
  offscreenDistanceSimDistanceUu: 2700,
  offscreenDistanceSimAngleDeg: 270,
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
  previewNames: ['AlphaStriker', 'Captain Ping', 'Necto', 'K', 'Necto(2)', 'LinLaoGay'],
  carOverrides: Array.from({ length: 6 }, () => createDefaultCarOverride(50, 6)),
};

export function resolveCarSlotCode(carIndex: number, team: 0 | 1, slotCodes: string[] = DEFAULT_NAME_TAG_SLOT_CODES): string {
  const safe = Array.isArray(slotCodes) && slotCodes.length >= 6 ? slotCodes : DEFAULT_NAME_TAG_SLOT_CODES;
  const n = Math.max(0, Math.floor(Number(carIndex) || 0));
  const idx = n < 6 ? n : (team === 1 ? 3 : 0) + (n % 3);
  return String(safe[idx] || DEFAULT_NAME_TAG_SLOT_CODES[idx] || 'X').trim().slice(0, 3);
}

const finiteOr = (val: unknown, fallback: number): number => (Number.isFinite(Number(val)) ? Number(val) : fallback);

export function computeOffscreenDistanceScale(
  distanceUu: number,
  config: Pick<
    NameTagConfig,
    'offscreenDistanceScaleEnabled' | 'offscreenDistanceMinScale' | 'offscreenDistanceNearUu' | 'offscreenDistanceFarUu' | 'offscreenDistanceCurveExponent'
  >
): number {
  if (!config.offscreenDistanceScaleEnabled) return 1.0;
  const D = DEFAULT_NAME_TAG_CONFIG;
  const minScale = finiteOr(config.offscreenDistanceMinScale, D.offscreenDistanceMinScale);
  const nearUu = finiteOr(config.offscreenDistanceNearUu, D.offscreenDistanceNearUu);
  const farUu = finiteOr(config.offscreenDistanceFarUu, D.offscreenDistanceFarUu);
  const exp = Math.max(0.01, finiteOr(config.offscreenDistanceCurveExponent, D.offscreenDistanceCurveExponent));
  const effFar = Math.max(nearUu + 1, farUu);
  const clamped = Math.max(nearUu, Math.min(effFar, Number(distanceUu) || nearUu));
  return 1.0 - (1.0 - minScale) * Math.pow((clamped - nearUu) / Math.max(1, effFar - nearUu), exp);
}

export function formatNameTagDisplayText(rawName: string, maxChars = DEFAULT_NAME_TAG_CONFIG.maxChars): string {
  const trimmed = String(rawName || 'Player').trim() || 'Player';
  const limit = Math.max(1, Math.round(Number(maxChars) || DEFAULT_NAME_TAG_CONFIG.maxChars));
  const glyphs = Array.from(trimmed);
  return glyphs.length <= limit ? trimmed : `…${glyphs.slice(-Math.max(1, limit - 1)).join('')}`;
}

export function estimateNameTagTextWidthPx(displayText: string, fontSize: number, fontFamily: NameTagFontFamily): number {
  const unitFactor = fontFamily === 'archivo' ? 0.56 : 0.6;
  let units = 0;
  for (const ch of Array.from(displayText || '')) units += (ch.codePointAt(0) || 0) > 0x2e7f ? 1.0 : unitFactor;
  return units * fontSize;
}

export function computeAdaptiveNameTagWidthPx(
  displayText: string,
  config: Pick<NameTagConfig, 'pillMinWidth' | 'pillMaxWidth' | 'fontSize' | 'fontFamily' | 'borderWidth' | 'maxChars'>,
  measuredTextWidthPx?: number,
  measuredMaxRefTextWidthPx?: number
): number {
  const D = DEFAULT_NAME_TAG_CONFIG;
  const minW = Math.max(1, finiteOr(config.pillMinWidth, D.pillMinWidth));
  const maxW = Math.max(minW, finiteOr(config.pillMaxWidth, D.pillMaxWidth));
  const fontSize = Math.max(1, finiteOr(config.fontSize, D.fontSize));
  const borderW = Math.max(0, finiteOr(config.borderWidth, D.borderWidth));
  const maxChars = Math.max(1, Math.round(Number(config.maxChars) || D.maxChars));
  const fontFamily = config.fontFamily || D.fontFamily;
  const textW = typeof measuredTextWidthPx === 'number' && Number.isFinite(measuredTextWidthPx)
    ? measuredTextWidthPx
    : estimateNameTagTextWidthPx(displayText, fontSize, fontFamily);
  const maxRefW = typeof measuredMaxRefTextWidthPx === 'number' && Number.isFinite(measuredMaxRefTextWidthPx)
    ? measuredMaxRefTextWidthPx
    : estimateNameTagTextWidthPx('M'.repeat(maxChars), fontSize, fontFamily);
  const glyphCount = Math.max(1, Array.from(displayText || 'P').length);
  const ratio = Math.max(0, Math.min(1, (glyphCount - 1) / Math.max(1, maxChars - 1)));
  const maxPad = Math.max(16, maxW - maxRefW);
  const minPad = Math.min(maxPad, Math.max(12, fontSize * 0.35 + borderW * 2));
  return Math.max(minW, Math.min(maxW, Math.round(textW + minPad + (maxPad - minPad) * ratio)));
}

export function resolveNameTagCornerRadiusPx(pillWidthPx: number, pillHeightPx: number, cornerRadius: number): number {
  const raw = Math.max(0, finiteOr(cornerRadius, DEFAULT_NAME_TAG_CONFIG.cornerRadius));
  return Math.max(0, Math.min(raw, pillWidthPx * 0.5, pillHeightPx * 0.5));
}

export function resolveNameTagBoostBorderVisible(
  config: NameTagConfig,
  boostBorderOverride: NameTagBoostBorderOverride,
  carTeam: 0 | 1,
  povCarTeam: 0 | 1 | null
): boolean {
  if (!config.boostBorderEnabled) return false;
  if (boostBorderOverride === false || boostBorderOverride === 'none') return false;
  if (boostBorderOverride === true || boostBorderOverride === 'all') return true;
  if (boostBorderOverride === 'teammates') return carTeam === (povCarTeam ?? 0);
  return Boolean(config.showBoostBorderInMatchPlaying && config.boostBorderMatchAudience !== 'none');
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
