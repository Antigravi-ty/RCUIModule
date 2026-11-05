import {
  type NameTagBoostBorderAudience,
  type NameTagBoostBorderColorMode,
  type NameTagBoostBorderOverride,
  type NameTagBoostIndicatorMode,
  type NameTagCameraMode,
  type NameTagCarOverride,
  type NameTagConfig,
  type NameTagFontFamily,
  type NameTagFontWeight,
  DEFAULT_NAME_TAG_CONFIG,
} from './nameTagCalibrationMath';

export {
  type NameTagDepthMetric,
  type NameTagFontFamily,
  type NameTagFontWeight,
  type NameTagBoostIndicatorMode,
  type NameTagBoostBorderColorMode,
  type NameTagBoostBorderAudience,
  type NameTagBoostBorderSceneFlags,
  type NameTagBoostBorderOverride,
  type NameTagCarOverride,
  type NameTagConfig,
  type NameTagCarEntry,
  type NameTagCameraMode,
  type NameTagCarTelemetry,
  type NameTagTelemetrySnapshot,
  type NameTagRuntimeState,
  type NameTagFittedParameters,
  NAME_TAG_REFERENCE_DEPTH_UU,
  NAME_TAG_NEAR_CALIBRATION_DEPTH_UU,
  NAME_TAG_FAR_CALIBRATION_DEPTH_UU,
  DEFAULT_NAME_TAG_CONFIG,
  resolveNameTagFontFamilyCss,
  createDefaultCarOverride,
  formatNameTagDisplayText,
  estimateNameTagTextWidthPx,
  computeAdaptiveNameTagWidthPx,
  resolveNameTagCornerRadiusPx,
} from './nameTagCalibrationMath';

export const NAME_TAG_STORAGE_KEY = 'rc_name_tag_config_v10';

export function sanitizeHexColor(raw: unknown, fallbackHex: string): string {
  return typeof raw === 'string' && raw.startsWith('#') && raw.length >= 4
    ? raw
    : fallbackHex;
}

export function sanitizeBoostBorderAudience(
  raw: unknown,
  fallbackAudience: NameTagBoostBorderAudience
): NameTagBoostBorderAudience {
  if (raw === 'teammates' || raw === 'all' || raw === 'none') {
    return raw;
  }
  return fallbackAudience;
}

export function sanitizeBoostIndicatorMode(
  raw: unknown,
  fallbackMode: NameTagBoostIndicatorMode
): NameTagBoostIndicatorMode {
  if (
    raw === 'bottom-up-fill' ||
    raw === 'left-right-fill' ||
    raw === 'sunset-circle' ||
    raw === 'border-only'
  ) {
    return raw;
  }
  return fallbackMode;
}

function clampFinite(
  raw: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const num = Number(raw);
  return Math.max(min, Math.min(max, Number.isFinite(num) ? num : fallback));
}

export function sanitizeCarOverride(
  raw: Partial<NameTagCarOverride> | null | undefined,
  fallbackWorldOffsetUu: number,
  fallbackScreenOffsetPx: number
): NameTagCarOverride {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: Boolean(source.enabled),
    scaleMultiplier: clampFinite(source.scaleMultiplier, 0.2, 3.0, 1.0),
    worldOffsetUu: clampFinite(source.worldOffsetUu, 0, 360, fallbackWorldOffsetUu),
    screenOffsetPx: clampFinite(source.screenOffsetPx, -60, 160, fallbackScreenOffsetPx),
  };
}

export function sanitizeConfig(raw: Partial<NameTagConfig> | null | undefined): NameTagConfig {
  const source = raw && typeof raw === 'object' ? raw : {};
  const previewNames =
    Array.isArray(source.previewNames) && source.previewNames.length === 6
      ? source.previewNames.map((name, index) =>
          String(name || DEFAULT_NAME_TAG_CONFIG.previewNames[index])
        )
      : [...DEFAULT_NAME_TAG_CONFIG.previewNames];

  const previewBoostAmounts =
    Array.isArray(source.previewBoostAmounts) && source.previewBoostAmounts.length === 6
      ? source.previewBoostAmounts.map((boostValue, index) => {
          const fallback = DEFAULT_NAME_TAG_CONFIG.previewBoostAmounts[index] ?? 100;
          return Math.round(clampFinite(boostValue, 0, 100, fallback));
        })
      : [...DEFAULT_NAME_TAG_CONFIG.previewBoostAmounts];

  const verticalOffsetUu = clampFinite(
    source.verticalOffsetUu,
    0,
    360,
    DEFAULT_NAME_TAG_CONFIG.verticalOffsetUu
  );
  const screenVerticalOffsetPx = clampFinite(
    source.screenVerticalOffsetPx,
    -60,
    160,
    DEFAULT_NAME_TAG_CONFIG.screenVerticalOffsetPx
  );

  const carOverrides = Array.from({ length: 6 }, (_, index) =>
    sanitizeCarOverride(
      Array.isArray(source.carOverrides) ? source.carOverrides[index] : null,
      verticalOffsetUu,
      screenVerticalOffsetPx
    )
  );

  const clampedMinWidth = clampFinite(
    source.pillMinWidth,
    40,
    460,
    DEFAULT_NAME_TAG_CONFIG.pillMinWidth
  );
  const clampedMaxWidth = clampFinite(
    source.pillMaxWidth,
    clampedMinWidth,
    480,
    DEFAULT_NAME_TAG_CONFIG.pillMaxWidth
  );

  const validFontFamilies: NameTagFontFamily[] = ['jetbrains-mono', 'sf-mono', 'archivo'];
  const fontFamily: NameTagFontFamily = validFontFamilies.includes(
    source.fontFamily as NameTagFontFamily
  )
    ? (source.fontFamily as NameTagFontFamily)
    : DEFAULT_NAME_TAG_CONFIG.fontFamily;

  const validWeights: NameTagFontWeight[] = [400, 500, 600, 700];
  const fontWeight: NameTagFontWeight = validWeights.includes(
    Number(source.fontWeight) as NameTagFontWeight
  )
    ? (Number(source.fontWeight) as NameTagFontWeight)
    : DEFAULT_NAME_TAG_CONFIG.fontWeight;

  const rawCardRenderScale = Number(source.cardRenderScale);
  const normalizedCardRenderScale = Number.isFinite(rawCardRenderScale)
    ? rawCardRenderScale > 0 && rawCardRenderScale <= 4
      ? rawCardRenderScale * 100
      : rawCardRenderScale
    : DEFAULT_NAME_TAG_CONFIG.cardRenderScale;

  const boostBorderColorMode: NameTagBoostBorderColorMode =
    source.boostBorderColorMode === 'shared' || source.boostBorderColorMode === 'team'
      ? source.boostBorderColorMode
      : DEFAULT_NAME_TAG_CONFIG.boostBorderColorMode;

  return {
    enabled:
      typeof source.enabled === 'boolean'
        ? source.enabled
        : DEFAULT_NAME_TAG_CONFIG.enabled,
    pillMinWidth: clampedMinWidth,
    pillMaxWidth: clampedMaxWidth,
    pillHeight: clampFinite(source.pillHeight, 28, 120, DEFAULT_NAME_TAG_CONFIG.pillHeight),
    cornerRadius: clampFinite(
      source.cornerRadius,
      0,
      60,
      DEFAULT_NAME_TAG_CONFIG.cornerRadius
    ),
    borderWidth: clampFinite(source.borderWidth, 0, 12, DEFAULT_NAME_TAG_CONFIG.borderWidth),
    fontSize: clampFinite(source.fontSize, 12, 48, DEFAULT_NAME_TAG_CONFIG.fontSize),
    fontFamily,
    fontWeight,
    cardRenderScale: Math.max(25, Math.min(200, Math.round(normalizedCardRenderScale))),
    maxChars: Math.round(
      clampFinite(source.maxChars, 4, 32, DEFAULT_NAME_TAG_CONFIG.maxChars)
    ),
    opacity: clampFinite(source.opacity, 0.1, 1.0, DEFAULT_NAME_TAG_CONFIG.opacity),
    bgOpacity: clampFinite(source.bgOpacity, 0.0, 1.0, DEFAULT_NAME_TAG_CONFIG.bgOpacity),
    verticalOffsetUu,
    screenVerticalOffsetPx,
    cameraScaleFactor: clampFinite(
      source.cameraScaleFactor,
      0.02,
      0.3,
      DEFAULT_NAME_TAG_CONFIG.cameraScaleFactor
    ),
    distanceScaleExponent: clampFinite(
      source.distanceScaleExponent,
      0.0,
      1.5,
      DEFAULT_NAME_TAG_CONFIG.distanceScaleExponent
    ),
    nearScaleMultiplier: clampFinite(
      source.nearScaleMultiplier,
      0.2,
      2.5,
      DEFAULT_NAME_TAG_CONFIG.nearScaleMultiplier
    ),
    farScaleMultiplier: clampFinite(
      source.farScaleMultiplier,
      0.2,
      2.5,
      DEFAULT_NAME_TAG_CONFIG.farScaleMultiplier
    ),
    depthMetric: source.depthMetric === 'euclidean' ? 'euclidean' : 'viewZ',
    blueBgColor: sanitizeHexColor(
      source.blueBgColor,
      DEFAULT_NAME_TAG_CONFIG.blueBgColor
    ),
    blueBorderColor: sanitizeHexColor(
      source.blueBorderColor,
      DEFAULT_NAME_TAG_CONFIG.blueBorderColor
    ),
    blueTextColor: sanitizeHexColor(
      source.blueTextColor,
      DEFAULT_NAME_TAG_CONFIG.blueTextColor
    ),
    orangeBgColor: sanitizeHexColor(
      source.orangeBgColor,
      DEFAULT_NAME_TAG_CONFIG.orangeBgColor
    ),
    orangeBorderColor: sanitizeHexColor(
      source.orangeBorderColor,
      DEFAULT_NAME_TAG_CONFIG.orangeBorderColor
    ),
    orangeTextColor: sanitizeHexColor(
      source.orangeTextColor,
      DEFAULT_NAME_TAG_CONFIG.orangeTextColor
    ),
    boostBorderEnabled:
      typeof source.boostBorderEnabled === 'boolean'
        ? source.boostBorderEnabled
        : DEFAULT_NAME_TAG_CONFIG.boostBorderEnabled,
    boostIndicatorMode: sanitizeBoostIndicatorMode(
      source.boostIndicatorMode,
      DEFAULT_NAME_TAG_CONFIG.boostIndicatorMode
    ),
    boostFillOpacity: clampFinite(
      source.boostFillOpacity,
      0.0,
      1.0,
      DEFAULT_NAME_TAG_CONFIG.boostFillOpacity
    ),
    boostFillColorBlendRatio: clampFinite(
      source.boostFillColorBlendRatio,
      0.0,
      1.0,
      DEFAULT_NAME_TAG_CONFIG.boostFillColorBlendRatio
    ),
    boostUnfilledBgOpacity: clampFinite(
      source.boostUnfilledBgOpacity,
      0.0,
      1.0,
      DEFAULT_NAME_TAG_CONFIG.boostUnfilledBgOpacity
    ),
    boostUnfilledDarkenRatio: clampFinite(
      source.boostUnfilledDarkenRatio,
      0.0,
      1.0,
      DEFAULT_NAME_TAG_CONFIG.boostUnfilledDarkenRatio
    ),
    boostShowHorizonLine:
      typeof source.boostShowHorizonLine === 'boolean'
        ? source.boostShowHorizonLine
        : DEFAULT_NAME_TAG_CONFIG.boostShowHorizonLine,
    boostBorderColorMode,
    blueBoostBorderColor: sanitizeHexColor(
      source.blueBoostBorderColor,
      DEFAULT_NAME_TAG_CONFIG.blueBoostBorderColor
    ),
    orangeBoostBorderColor: sanitizeHexColor(
      source.orangeBoostBorderColor,
      DEFAULT_NAME_TAG_CONFIG.orangeBoostBorderColor
    ),
    sharedBoostBorderColor: sanitizeHexColor(
      source.sharedBoostBorderColor,
      DEFAULT_NAME_TAG_CONFIG.sharedBoostBorderColor
    ),
    showBoostBorderInMatchPlaying:
      typeof source.showBoostBorderInMatchPlaying === 'boolean'
        ? source.showBoostBorderInMatchPlaying
        : DEFAULT_NAME_TAG_CONFIG.showBoostBorderInMatchPlaying,
    boostBorderMatchAudience: sanitizeBoostBorderAudience(
      source.boostBorderMatchAudience,
      DEFAULT_NAME_TAG_CONFIG.boostBorderMatchAudience
    ),
    showBoostBorderInGoalReplay:
      typeof source.showBoostBorderInGoalReplay === 'boolean'
        ? source.showBoostBorderInGoalReplay
        : DEFAULT_NAME_TAG_CONFIG.showBoostBorderInGoalReplay,
    boostBorderReplayAudience: sanitizeBoostBorderAudience(
      source.boostBorderReplayAudience,
      DEFAULT_NAME_TAG_CONFIG.boostBorderReplayAudience
    ),
    ballOcclusionEnabled:
      typeof source.ballOcclusionEnabled === 'boolean'
        ? source.ballOcclusionEnabled
        : DEFAULT_NAME_TAG_CONFIG.ballOcclusionEnabled,
    ballOcclusionOpacity: clampFinite(
      source.ballOcclusionOpacity,
      0.0,
      1.0,
      DEFAULT_NAME_TAG_CONFIG.ballOcclusionOpacity
    ),
    showOnLocalCar:
      typeof source.showOnLocalCar === 'boolean'
        ? source.showOnLocalCar
        : DEFAULT_NAME_TAG_CONFIG.showOnLocalCar,
    previewNames,
    previewBoostAmounts,
    carOverrides,
  };
}

export const sanitizeNameTagConfig = sanitizeConfig;

export function mergeNameTagConfigPatch(
  currentConfig: NameTagConfig,
  patch: Partial<NameTagConfig>
): NameTagConfig {
  const merged: Partial<NameTagConfig> = { ...currentConfig, ...patch };
  if (
    typeof patch.pillMinWidth === 'number' &&
    patch.pillMaxWidth === undefined &&
    patch.pillMinWidth > currentConfig.pillMaxWidth
  ) {
    merged.pillMaxWidth = patch.pillMinWidth;
  } else if (
    typeof patch.pillMaxWidth === 'number' &&
    patch.pillMinWidth === undefined &&
    patch.pillMaxWidth < currentConfig.pillMinWidth
  ) {
    merged.pillMinWidth = patch.pillMaxWidth;
  }
  return sanitizeConfig(merged);
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

export const KICKOFF_PERMUTATION_COUNT = 5;

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

export function sanitizeRuntimeSyncSnapshot(
  raw: Partial<NameTagRuntimeSyncSnapshot> | null | undefined
): NameTagRuntimeSyncSnapshot {
  const source = raw && typeof raw === 'object' ? raw : {};
  const validModes: NameTagCameraMode[] = [
    'pov',
    'wasmPov',
    'rearView',
    'free',
    'director',
    'podium',
  ];
  const activeCameraMode: NameTagCameraMode = validModes.includes(
    source.activeCameraMode as NameTagCameraMode
  )
    ? (source.activeCameraMode as NameTagCameraMode)
    : DEFAULT_RUNTIME_SYNC_SNAPSHOT.activeCameraMode;

  const kickoffIndex = Number.isFinite(Number(source.kickoffPermutationIndex))
    ? Math.max(0, Math.round(Number(source.kickoffPermutationIndex))) %
      KICKOFF_PERMUTATION_COUNT
    : DEFAULT_RUNTIME_SYNC_SNAPSHOT.kickoffPermutationIndex;

  const focusedCarIndex = Number.isFinite(Number(source.focusedCarIndex))
    ? Math.max(0, Math.min(5, Math.round(Number(source.focusedCarIndex))))
    : DEFAULT_RUNTIME_SYNC_SNAPSHOT.focusedCarIndex;

  const selectedCalibrationCarIndex = Number.isFinite(
    Number(source.selectedCalibrationCarIndex)
  )
    ? Math.max(0, Math.min(5, Math.round(Number(source.selectedCalibrationCarIndex))))
    : DEFAULT_RUNTIME_SYNC_SNAPSHOT.selectedCalibrationCarIndex;

  let boostBorderOverride: NameTagBoostBorderOverride = null;
  if (
    source.boostBorderOverride === 'teammates' ||
    source.boostBorderOverride === 'all' ||
    source.boostBorderOverride === 'none' ||
    typeof source.boostBorderOverride === 'boolean'
  ) {
    boostBorderOverride = source.boostBorderOverride;
  }

  return {
    isTunerArenaActive:
      typeof source.isTunerArenaActive === 'boolean'
        ? source.isTunerArenaActive
        : DEFAULT_RUNTIME_SYNC_SNAPSHOT.isTunerArenaActive,
    kickoffPermutationIndex: kickoffIndex,
    activeCameraMode,
    focusedCarIndex,
    selectedCalibrationCarIndex,
    boostBorderOverride,
  };
}
