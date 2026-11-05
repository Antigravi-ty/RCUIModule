import {
  DEFAULT_NAME_TAG_CONFIG,
  DEFAULT_RUNTIME_SYNC_SNAPSHOT,
  KICKOFF_PERMUTATION_COUNT,
  NAME_TAG_REFERENCE_DEPTH_UU,
  type NameTagBoostBorderAudience,
  type NameTagBoostBorderColorMode,
  type NameTagBoostBorderOverride,
  type NameTagBoostIndicatorMode,
  type NameTagCameraMode,
  type NameTagCarOverride,
  type NameTagConfig,
  type NameTagFittedParameters,
  type NameTagFontFamily,
  type NameTagFontWeight,
  type NameTagRuntimeSyncSnapshot,
  type NameTagTelemetrySnapshot,
} from './nameTagConfig';

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

export function sanitizeCarOverride(
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

export function computeFittedParametersFromSamples(
  config: NameTagConfig,
  snapshot: NameTagTelemetrySnapshot
): NameTagFittedParameters {
  const telemetryCars = snapshot.cars || [];
  const enabledSamples = telemetryCars.filter(
    (car) =>
      car.visible &&
      car.activeDepthUu > 10 &&
      config.carOverrides[car.carIndex]?.enabled
  );
  const samples =
    enabledSamples.length > 0
      ? enabledSamples
      : telemetryCars.filter((car) => car.visible && car.activeDepthUu > 10);

  if (samples.length === 0) {
    return {
      sampleCount: 0,
      cameraScaleFactor: config.cameraScaleFactor,
      distanceScaleExponent: config.distanceScaleExponent,
      nearScaleMultiplier: config.nearScaleMultiplier,
      farScaleMultiplier: config.farScaleMultiplier,
      verticalOffsetUu: config.verticalOffsetUu,
      screenVerticalOffsetPx: config.screenVerticalOffsetPx,
    };
  }

  if (samples.length === 1) {
    const sample = samples[0];
    const override = config.carOverrides[sample.carIndex];
    const mult = override?.enabled ? override.scaleMultiplier : 1.0;
    return {
      sampleCount: 1,
      cameraScaleFactor: Number(
        Math.max(0.02, Math.min(0.3, config.cameraScaleFactor * mult)).toFixed(4)
      ),
      distanceScaleExponent: config.distanceScaleExponent,
      nearScaleMultiplier: config.nearScaleMultiplier,
      farScaleMultiplier: config.farScaleMultiplier,
      verticalOffsetUu: Math.round(sample.effectiveWorldOffsetUu),
      screenVerticalOffsetPx: Math.round(sample.effectiveScreenOffsetPx),
    };
  }

  const xs: number[] = [];
  const ys: number[] = [];
  const depthRatios: number[] = [];
  const totalWorldOffsets: number[] = [];

  const fovRad = (snapshot.cameraFovDeg || 80) * (Math.PI / 180);
  const tanHalfFov = Math.tan(fovRad * 0.5);

  for (const sample of samples) {
    const depth = Math.max(50, sample.activeDepthUu);
    const logDepthRatio = Math.log(depth / NAME_TAG_REFERENCE_DEPTH_UU);
    const currentEffectiveScaleAtDepth =
      config.cameraScaleFactor *
      Math.pow(depth / NAME_TAG_REFERENCE_DEPTH_UU, config.distanceScaleExponent) *
      sample.effectiveScaleMultiplier;
    xs.push(logDepthRatio);
    ys.push(Math.log(Math.max(0.001, currentEffectiveScaleAtDepth)));

    const uuPerRefPx = (2 * depth * tanHalfFov) / 1080;
    depthRatios.push(uuPerRefPx);
    totalWorldOffsets.push(sample.totalWorldVerticalOffsetUu);
  }

  const n = xs.length;
  const meanX = xs.reduce((acc, val) => acc + val, 0) / n;
  const meanY = ys.reduce((acc, val) => acc + val, 0) / n;
  let numXY = 0;
  let denXX = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    numXY += dx * (ys[i] - meanY);
    denXX += dx * dx;
  }

  let fittedExponent = config.distanceScaleExponent;
  let fittedScaleFactor = config.cameraScaleFactor;
  if (denXX > 1e-4) {
    fittedExponent = Math.max(0.0, Math.min(1.5, numXY / denXX));
    fittedScaleFactor = Math.max(
      0.02,
      Math.min(0.3, Math.exp(meanY - fittedExponent * meanX))
    );
  } else {
    fittedScaleFactor = Math.max(0.02, Math.min(0.3, Math.exp(meanY)));
  }

  const meanD = depthRatios.reduce((acc, val) => acc + val, 0) / n;
  const meanO = totalWorldOffsets.reduce((acc, val) => acc + val, 0) / n;
  let numDO = 0;
  let denDD = 0;
  for (let i = 0; i < n; i++) {
    const dd = depthRatios[i] - meanD;
    numDO += dd * (totalWorldOffsets[i] - meanO);
    denDD += dd * dd;
  }

  let fittedWorldOffsetUu = config.verticalOffsetUu;
  let fittedScreenOffsetPx = config.screenVerticalOffsetPx;
  if (denDD > 1e-4) {
    fittedScreenOffsetPx = Math.max(-60, Math.min(160, Math.round(numDO / denDD)));
    fittedWorldOffsetUu = Math.max(
      0,
      Math.min(360, Math.round(meanO - fittedScreenOffsetPx * meanD))
    );
  }

  return {
    sampleCount: samples.length,
    cameraScaleFactor: Number(fittedScaleFactor.toFixed(4)),
    distanceScaleExponent: Number(fittedExponent.toFixed(3)),
    nearScaleMultiplier: 1.0,
    farScaleMultiplier: 1.0,
    verticalOffsetUu: fittedWorldOffsetUu,
    screenVerticalOffsetPx: fittedScreenOffsetPx,
  };
}

export function buildNameTagCalibrationExportPayload(
  config: NameTagConfig,
  snapshot: NameTagTelemetrySnapshot,
  kickoffPermutationIndex: number
) {
  const fitted = computeFittedParametersFromSamples(config, snapshot);
  const {
    previewNames: _pn,
    previewBoostAmounts: _pb,
    carOverrides: _co,
    enabled: _en,
    ...globalConfig
  } = config;
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
      kickoffPermutationIndex,
      fovDeg: snapshot.cameraFovDeg,
      position: snapshot.cameraPosition,
      forward: snapshot.cameraForward,
      up: snapshot.cameraUp,
    },
    globalConfig,
    fittedRecommendation: fitted,
    cars: snapshot.cars.map((car) => ({
      carIndex: car.carIndex,
      slotCode: car.slotCode,
      name: car.name,
      team: car.team,
      visible: car.visible,
      boostAmount: car.boostAmount,
      boostBorderVisible: car.boostBorderVisible,
      override: config.carOverrides[car.carIndex] || null,
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
