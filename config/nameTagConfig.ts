import { safeLocalStorageGet, safeLocalStorageSet } from './storageHelpers';
import {
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
};

const STORAGE_KEY = 'rc_name_tag_config_v8';

function sanitizeHexColor(raw: unknown, fallbackHex: string): string {
  return typeof raw === 'string' && raw.startsWith('#') && raw.length >= 4
    ? raw
    : fallbackHex;
}

function sanitizeBoostBorderAudience(
  raw: unknown,
  fallbackAudience: NameTagBoostBorderAudience
): NameTagBoostBorderAudience {
  if (raw === 'teammates' || raw === 'all' || raw === 'none') {
    return raw;
  }
  return fallbackAudience;
}

function sanitizeBoostIndicatorMode(
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

function sanitizeCarOverride(
  raw: Partial<NameTagCarOverride> | null | undefined,
  fallbackWorldOffsetUu: number,
  fallbackScreenOffsetPx: number
): NameTagCarOverride {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: Boolean(source.enabled),
    scaleMultiplier: Math.max(
      0.2,
      Math.min(
        3.0,
        Number.isFinite(Number(source.scaleMultiplier))
          ? Number(source.scaleMultiplier)
          : 1.0
      )
    ),
    worldOffsetUu: Math.max(
      0,
      Math.min(
        360,
        Number.isFinite(Number(source.worldOffsetUu))
          ? Number(source.worldOffsetUu)
          : fallbackWorldOffsetUu
      )
    ),
    screenOffsetPx: Math.max(
      -60,
      Math.min(
        160,
        Number.isFinite(Number(source.screenOffsetPx))
          ? Number(source.screenOffsetPx)
          : fallbackScreenOffsetPx
      )
    ),
  };
}

function sanitizeConfig(raw: Partial<NameTagConfig> | null | undefined): NameTagConfig {
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
          const parsed = Number(boostValue);
          const fallback = DEFAULT_NAME_TAG_CONFIG.previewBoostAmounts[index] ?? 100;
          return Math.max(
            0,
            Math.min(100, Math.round(Number.isFinite(parsed) ? parsed : fallback))
          );
        })
      : [...DEFAULT_NAME_TAG_CONFIG.previewBoostAmounts];

  const verticalOffsetUu = Math.max(
    0,
    Math.min(
      360,
      Number.isFinite(Number(source.verticalOffsetUu))
        ? Number(source.verticalOffsetUu)
        : DEFAULT_NAME_TAG_CONFIG.verticalOffsetUu
    )
  );

  const screenVerticalOffsetPx = Math.max(
    -60,
    Math.min(
      160,
      Number.isFinite(Number(source.screenVerticalOffsetPx))
        ? Number(source.screenVerticalOffsetPx)
        : DEFAULT_NAME_TAG_CONFIG.screenVerticalOffsetPx
    )
  );

  const carOverrides = Array.from({ length: 6 }, (_, index) =>
    sanitizeCarOverride(
      Array.isArray(source.carOverrides) ? source.carOverrides[index] : null,
      verticalOffsetUu,
      screenVerticalOffsetPx
    )
  );

  const rawMinWidth = Number.isFinite(Number(source.pillMinWidth))
    ? Number(source.pillMinWidth)
    : DEFAULT_NAME_TAG_CONFIG.pillMinWidth;
  const rawMaxWidth = Number.isFinite(Number(source.pillMaxWidth))
    ? Number(source.pillMaxWidth)
    : DEFAULT_NAME_TAG_CONFIG.pillMaxWidth;
  const clampedMinWidth = Math.max(40, Math.min(460, rawMinWidth));
  const clampedMaxWidth = Math.max(clampedMinWidth, Math.min(480, rawMaxWidth));

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
    source.boostBorderColorMode === 'shared' ? 'shared' : 'team';

  return {
    enabled:
      typeof source.enabled === 'boolean'
        ? source.enabled
        : DEFAULT_NAME_TAG_CONFIG.enabled,
    pillMinWidth: clampedMinWidth,
    pillMaxWidth: clampedMaxWidth,
    pillHeight: Math.max(
      28,
      Math.min(
        120,
        Number.isFinite(Number(source.pillHeight))
          ? Number(source.pillHeight)
          : DEFAULT_NAME_TAG_CONFIG.pillHeight
      )
    ),
    cornerRadius: Math.max(
      0,
      Math.min(
        60,
        Number.isFinite(Number(source.cornerRadius))
          ? Number(source.cornerRadius)
          : DEFAULT_NAME_TAG_CONFIG.cornerRadius
      )
    ),
    borderWidth: Math.max(
      0,
      Math.min(
        12,
        Number.isFinite(Number(source.borderWidth))
          ? Number(source.borderWidth)
          : DEFAULT_NAME_TAG_CONFIG.borderWidth
      )
    ),
    fontSize: Math.max(
      12,
      Math.min(
        48,
        Number.isFinite(Number(source.fontSize))
          ? Number(source.fontSize)
          : DEFAULT_NAME_TAG_CONFIG.fontSize
      )
    ),
    fontFamily,
    fontWeight,
    cardRenderScale: Math.max(25, Math.min(200, Math.round(normalizedCardRenderScale))),
    maxChars: Math.max(
      4,
      Math.min(
        32,
        Number.isFinite(Number(source.maxChars))
          ? Math.round(Number(source.maxChars))
          : DEFAULT_NAME_TAG_CONFIG.maxChars
      )
    ),
    opacity: Math.max(
      0.1,
      Math.min(
        1.0,
        Number.isFinite(Number(source.opacity))
          ? Number(source.opacity)
          : DEFAULT_NAME_TAG_CONFIG.opacity
      )
    ),
    bgOpacity: Math.max(
      0.0,
      Math.min(
        1.0,
        Number.isFinite(Number(source.bgOpacity))
          ? Number(source.bgOpacity)
          : DEFAULT_NAME_TAG_CONFIG.bgOpacity
      )
    ),
    verticalOffsetUu,
    screenVerticalOffsetPx,
    cameraScaleFactor: Math.max(
      0.02,
      Math.min(
        0.3,
        Number.isFinite(Number(source.cameraScaleFactor))
          ? Number(source.cameraScaleFactor)
          : DEFAULT_NAME_TAG_CONFIG.cameraScaleFactor
      )
    ),
    distanceScaleExponent: Math.max(
      0.0,
      Math.min(
        1.5,
        Number.isFinite(Number(source.distanceScaleExponent))
          ? Number(source.distanceScaleExponent)
          : DEFAULT_NAME_TAG_CONFIG.distanceScaleExponent
      )
    ),
    nearScaleMultiplier: Math.max(
      0.2,
      Math.min(
        2.5,
        Number.isFinite(Number(source.nearScaleMultiplier))
          ? Number(source.nearScaleMultiplier)
          : DEFAULT_NAME_TAG_CONFIG.nearScaleMultiplier
      )
    ),
    farScaleMultiplier: Math.max(
      0.2,
      Math.min(
        2.5,
        Number.isFinite(Number(source.farScaleMultiplier))
          ? Number(source.farScaleMultiplier)
          : DEFAULT_NAME_TAG_CONFIG.farScaleMultiplier
      )
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
    boostFillOpacity: Math.max(
      0.05,
      Math.min(
        1.0,
        Number.isFinite(Number(source.boostFillOpacity))
          ? Number(source.boostFillOpacity)
          : DEFAULT_NAME_TAG_CONFIG.boostFillOpacity
      )
    ),
    boostUnfilledBgOpacity: Math.max(
      0.0,
      Math.min(
        1.0,
        Number.isFinite(Number(source.boostUnfilledBgOpacity))
          ? Number(source.boostUnfilledBgOpacity)
          : DEFAULT_NAME_TAG_CONFIG.boostUnfilledBgOpacity
      )
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
    ballOcclusionOpacity: Math.max(
      0.0,
      Math.min(
        1.0,
        Number.isFinite(Number(source.ballOcclusionOpacity))
          ? Number(source.ballOcclusionOpacity)
          : DEFAULT_NAME_TAG_CONFIG.ballOcclusionOpacity
      )
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

let currentConfig: NameTagConfig = (() => {
  try {
    const raw = safeLocalStorageGet(STORAGE_KEY);
    if (!raw) {
      return sanitizeConfig(DEFAULT_NAME_TAG_CONFIG);
    }
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return sanitizeConfig(parsed);
  } catch {
    return sanitizeConfig(DEFAULT_NAME_TAG_CONFIG);
  }
})();

const listeners = new Set<() => void>();

export function notifyNameTagListeners(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // Ignore listener errors
    }
  }
}

export function getNameTagConfig(): NameTagConfig {
  return currentConfig;
}

export function updateNameTagConfig(patch: Partial<NameTagConfig>): NameTagConfig {
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
  currentConfig = sanitizeConfig(merged);
  try {
    safeLocalStorageSet(STORAGE_KEY, JSON.stringify(currentConfig));
  } catch {
    // Ignore storage errors
  }
  notifyNameTagListeners();
  return currentConfig;
}

export function updateNameTagCarOverride(
  carIndex: number,
  patch: Partial<NameTagCarOverride>
): NameTagConfig {
  const nextOverrides = currentConfig.carOverrides.map((entry, idx) =>
    idx === carIndex
      ? sanitizeCarOverride(
          { ...entry, ...patch },
          currentConfig.verticalOffsetUu,
          currentConfig.screenVerticalOffsetPx
        )
      : entry
  );
  return updateNameTagConfig({ carOverrides: nextOverrides });
}

export function resetNameTagCarOverride(carIndex: number): NameTagConfig {
  const nextOverrides = currentConfig.carOverrides.map((entry, idx) =>
    idx === carIndex
      ? createDefaultCarOverride(
          currentConfig.verticalOffsetUu,
          currentConfig.screenVerticalOffsetPx
        )
      : entry
  );
  return updateNameTagConfig({ carOverrides: nextOverrides });
}

export function resetAllNameTagCarOverrides(): NameTagConfig {
  const nextOverrides = Array.from({ length: 6 }, () =>
    createDefaultCarOverride(
      currentConfig.verticalOffsetUu,
      currentConfig.screenVerticalOffsetPx
    )
  );
  return updateNameTagConfig({ carOverrides: nextOverrides });
}

export function resetNameTagConfig(): NameTagConfig {
  currentConfig = sanitizeConfig(DEFAULT_NAME_TAG_CONFIG);
  try {
    safeLocalStorageSet(STORAGE_KEY, JSON.stringify(currentConfig));
  } catch {
    // Ignore storage errors
  }
  notifyNameTagListeners();
  return currentConfig;
}

export function subscribeNameTagConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
