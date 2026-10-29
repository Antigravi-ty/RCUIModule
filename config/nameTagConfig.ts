import { safeLocalStorageGet, safeLocalStorageSet } from './storageHelpers';
import {
  type NameTagDepthMetric,
  type NameTagFontFamily,
  type NameTagFontWeight,
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
  computeFittedParametersFromSamples as computeFittedFromConfigAndSnapshot,
} from './nameTagCalibrationMath';

export {
  type NameTagDepthMetric,
  type NameTagFontFamily,
  type NameTagFontWeight,
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

const STORAGE_KEY = 'rc_name_tag_config_v7';

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

  const rawMinWidth = Math.max(
    40,
    Math.min(
      460,
      Number.isFinite(Number(source.pillMinWidth))
        ? Number(source.pillMinWidth)
        : DEFAULT_NAME_TAG_CONFIG.pillMinWidth
    )
  );
  const rawMaxWidth = Math.max(
    80,
    Math.min(
      480,
      Number.isFinite(Number(source.pillMaxWidth))
        ? Number(source.pillMaxWidth)
        : DEFAULT_NAME_TAG_CONFIG.pillMaxWidth
    )
  );
  const pillMinWidth = Math.min(rawMinWidth, rawMaxWidth);
  const pillMaxWidth = Math.max(rawMinWidth, rawMaxWidth);

  return {
    enabled:
      typeof source.enabled === 'boolean' ? source.enabled : DEFAULT_NAME_TAG_CONFIG.enabled,
    pillMinWidth,
    pillMaxWidth,
    pillHeight: Math.max(
      28,
      Math.min(120, Number(source.pillHeight) || DEFAULT_NAME_TAG_CONFIG.pillHeight)
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
      Math.min(48, Number(source.fontSize) || DEFAULT_NAME_TAG_CONFIG.fontSize)
    ),
    fontFamily:
      source.fontFamily === 'sf-mono' || source.fontFamily === 'archivo'
        ? source.fontFamily
        : 'jetbrains-mono',
    fontWeight:
      source.fontWeight === 400 ||
      source.fontWeight === 500 ||
      source.fontWeight === 600 ||
      source.fontWeight === 700
        ? source.fontWeight
        : DEFAULT_NAME_TAG_CONFIG.fontWeight,
    cardRenderScale: Math.max(
      25,
      Math.min(
        200,
        Number.isFinite(Number(source.cardRenderScale)) && Number(source.cardRenderScale) >= 25
          ? Math.round(Number(source.cardRenderScale))
          : DEFAULT_NAME_TAG_CONFIG.cardRenderScale
      )
    ),
    maxChars: Math.max(
      4,
      Math.min(32, Math.round(Number(source.maxChars) || DEFAULT_NAME_TAG_CONFIG.maxChars))
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
        Number.isFinite(Number(source.cameraScaleFactor)) && Number(source.cameraScaleFactor) > 0
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
    blueBgColor:
      typeof source.blueBgColor === 'string' && source.blueBgColor.startsWith('#')
        ? source.blueBgColor
        : DEFAULT_NAME_TAG_CONFIG.blueBgColor,
    blueBorderColor:
      typeof source.blueBorderColor === 'string' && source.blueBorderColor.startsWith('#')
        ? source.blueBorderColor
        : DEFAULT_NAME_TAG_CONFIG.blueBorderColor,
    blueTextColor:
      typeof source.blueTextColor === 'string' && source.blueTextColor.startsWith('#')
        ? source.blueTextColor
        : DEFAULT_NAME_TAG_CONFIG.blueTextColor,
    orangeBgColor:
      typeof source.orangeBgColor === 'string' && source.orangeBgColor.startsWith('#')
        ? source.orangeBgColor
        : DEFAULT_NAME_TAG_CONFIG.orangeBgColor,
    orangeBorderColor:
      typeof source.orangeBorderColor === 'string' && source.orangeBorderColor.startsWith('#')
        ? source.orangeBorderColor
        : DEFAULT_NAME_TAG_CONFIG.orangeBorderColor,
    orangeTextColor:
      typeof source.orangeTextColor === 'string' && source.orangeTextColor.startsWith('#')
        ? source.orangeTextColor
        : DEFAULT_NAME_TAG_CONFIG.orangeTextColor,
    showOnLocalCar:
      typeof source.showOnLocalCar === 'boolean'
        ? source.showOnLocalCar
        : DEFAULT_NAME_TAG_CONFIG.showOnLocalCar,
    previewNames,
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

let runtimeState: NameTagRuntimeState = {
  isTunerArenaActive: false,
  isMultiplayerOrMultiCarMode: false,
  kickoffPermutationIndex: 0,
  activeCameraMode: 'pov',
  focusedCarIndex: 0,
  selectedCalibrationCarIndex: 0,
  carEntries: [],
  onEnterTunerArena: null,
  onExitTunerArena: null,
  onReshuffleKickoffPositions: null,
  onSelectPovCar: null,
  onFocusFreeCamOverview: null,
};

let latestTelemetrySnapshot: NameTagTelemetrySnapshot = {
  updatedAtMs: 0,
  viewportWidthPx: 1920,
  viewportHeightPx: 1080,
  aspectRatio: 16 / 9,
  devicePixelRatio: 1,
  cameraMode: 'pov',
  focusedCarIndex: 0,
  cameraFovDeg: 80,
  cameraPosition: [0, 0, 0],
  cameraForward: [0, 0, -1],
  cameraUp: [0, 1, 0],
  cars: [],
};

const listeners = new Set<() => void>();

function notifyListeners() {
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
  notifyListeners();
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
  notifyListeners();
  return currentConfig;
}

export function getNameTagRuntimeState(): NameTagRuntimeState {
  return runtimeState;
}

export function setNameTagRuntimeState(
  patch: Partial<NameTagRuntimeState>
): NameTagRuntimeState {
  runtimeState = { ...runtimeState, ...patch };
  notifyListeners();
  return runtimeState;
}

export function setNameTagTelemetrySnapshot(snapshot: NameTagTelemetrySnapshot): void {
  latestTelemetrySnapshot = snapshot;
}

export function getNameTagTelemetrySnapshot(): NameTagTelemetrySnapshot {
  return latestTelemetrySnapshot;
}

export function computeFittedParametersFromSamples(): NameTagFittedParameters {
  return computeFittedFromConfigAndSnapshot(currentConfig, latestTelemetrySnapshot);
}

export function applyFittedParametersFromCarOverrides(): NameTagConfig {
  const fitted = computeFittedParametersFromSamples();
  const nextOverrides = Array.from({ length: 6 }, () =>
    createDefaultCarOverride(fitted.verticalOffsetUu, fitted.screenVerticalOffsetPx)
  );
  return updateNameTagConfig({
    cameraScaleFactor: fitted.cameraScaleFactor,
    distanceScaleExponent: fitted.distanceScaleExponent,
    nearScaleMultiplier: fitted.nearScaleMultiplier,
    farScaleMultiplier: fitted.farScaleMultiplier,
    verticalOffsetUu: fitted.verticalOffsetUu,
    screenVerticalOffsetPx: fitted.screenVerticalOffsetPx,
    carOverrides: nextOverrides,
  });
}

export function buildNameTagCalibrationExportPayload() {
  const snapshot = getNameTagTelemetrySnapshot();
  const fitted = computeFittedParametersFromSamples();
  return {
    schema: 'rc_name_tag_calibration_v1',
    exportedAt: new Date().toISOString(),
    viewport: {
      widthPx: snapshot.viewportWidthPx,
      heightPx: snapshot.viewportHeightPx,
      aspectRatio: Number(snapshot.aspectRatio.toFixed(4)),
      devicePixelRatio: snapshot.devicePixelRatio,
    },
    camera: {
      mode: snapshot.cameraMode,
      focusedCarIndex: snapshot.focusedCarIndex,
      kickoffPermutationIndex: runtimeState.kickoffPermutationIndex,
      fovDeg: snapshot.cameraFovDeg,
      position: snapshot.cameraPosition,
      forward: snapshot.cameraForward,
      up: snapshot.cameraUp,
    },
    globalConfig: {
      pillMinWidth: currentConfig.pillMinWidth,
      pillMaxWidth: currentConfig.pillMaxWidth,
      pillHeight: currentConfig.pillHeight,
      cornerRadius: currentConfig.cornerRadius,
      borderWidth: currentConfig.borderWidth,
      fontSize: currentConfig.fontSize,
      fontFamily: currentConfig.fontFamily,
      fontWeight: currentConfig.fontWeight,
      cardRenderScale: currentConfig.cardRenderScale,
      maxChars: currentConfig.maxChars,
      opacity: currentConfig.opacity,
      bgOpacity: currentConfig.bgOpacity,
      cameraScaleFactor: currentConfig.cameraScaleFactor,
      distanceScaleExponent: currentConfig.distanceScaleExponent,
      nearScaleMultiplier: currentConfig.nearScaleMultiplier,
      farScaleMultiplier: currentConfig.farScaleMultiplier,
      depthMetric: currentConfig.depthMetric,
      verticalOffsetUu: currentConfig.verticalOffsetUu,
      screenVerticalOffsetPx: currentConfig.screenVerticalOffsetPx,
      blueBgColor: currentConfig.blueBgColor,
      blueBorderColor: currentConfig.blueBorderColor,
      blueTextColor: currentConfig.blueTextColor,
      orangeBgColor: currentConfig.orangeBgColor,
      orangeBorderColor: currentConfig.orangeBorderColor,
      orangeTextColor: currentConfig.orangeTextColor,
      showOnLocalCar: currentConfig.showOnLocalCar,
    },
    fittedRecommendation: fitted,
    cars: snapshot.cars.map((car) => ({
      carIndex: car.carIndex,
      slotCode: car.slotCode,
      name: car.name,
      team: car.team,
      visible: car.visible,
      override: currentConfig.carOverrides[car.carIndex] || null,
      telemetry: {
        carWorldPos: car.carWorldPos,
        anchorWorldPos: car.anchorWorldPos,
        spriteWorldPos: car.spriteWorldPos,
        euclideanDistanceUu: car.euclideanDistanceUu,
        viewZDepthUu: car.viewZDepthUu,
        activeDepthUu: car.activeDepthUu,
        offAxisAngleDeg: car.offAxisAngleDeg,
        worldScaleWidthUu: car.worldScaleWidthUu,
        worldScaleHeightUu: car.worldScaleHeightUu,
        screenPillWidthPx: car.screenPillWidthPx,
        screenPillHeightPx: car.screenPillHeightPx,
        effectiveScaleMultiplier: car.effectiveScaleMultiplier,
        effectiveWorldOffsetUu: car.effectiveWorldOffsetUu,
        effectiveScreenOffsetPx: car.effectiveScreenOffsetPx,
        totalWorldVerticalOffsetUu: car.totalWorldVerticalOffsetUu,
      },
    })),
  };
}

export function subscribeNameTagConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
