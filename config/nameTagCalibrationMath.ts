import {
  DEFAULT_NAME_TAG_CONFIG,
  DEFAULT_RUNTIME_SYNC_SNAPSHOT,
  KICKOFF_PERMUTATION_COUNT,
  NAME_TAG_FAR_CALIBRATION_DEPTH_UU,
  NAME_TAG_NEAR_CALIBRATION_DEPTH_UU,
  NAME_TAG_REFERENCE_DEPTH_UU,
  computeAdaptiveNameTagWidthPx,
  formatNameTagDisplayText,
  resolveNameTagBoostBorderVisible,
  resolveNameTagCornerRadiusPx,
  resolveNameTagFontFamilyCss,
  type NameTagAerialClimbTriggerMode,
  type NameTagBoostBorderAudience,
  type NameTagBoostBorderColorMode,
  type NameTagBoostBorderOverride,
  type NameTagBoostIndicatorMode,
  type NameTagCameraMode,
  type NameTagCarOverride,
  type NameTagCarTelemetry,
  type NameTagConfig,
  type NameTagFittedParameters,
  type NameTagFontFamily,
  type NameTagFontWeight,
  type NameTagRuntimeSyncSnapshot,
  type NameTagTelemetrySnapshot,
} from './nameTagConfig';

export {
  NAME_TAG_FAR_CALIBRATION_DEPTH_UU,
  NAME_TAG_NEAR_CALIBRATION_DEPTH_UU,
  NAME_TAG_REFERENCE_DEPTH_UU,
  computeAdaptiveNameTagWidthPx,
  formatNameTagDisplayText,
  resolveNameTagBoostBorderVisible,
  resolveNameTagCornerRadiusPx,
  resolveNameTagFontFamilyCss,
  type NameTagBoostBorderOverride,
  type NameTagBoostIndicatorMode,
  type NameTagCarTelemetry,
  type NameTagConfig,
};

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

export function sanitizeAerialClimbTriggerMode(
  raw: unknown,
  fallbackMode: NameTagAerialClimbTriggerMode
): NameTagAerialClimbTriggerMode {
  if (
    raw === 'double-jump' ||
    raw === 'hold-jump-pitch' ||
    raw === 'either' ||
    raw === 'both'
  ) {
    return raw;
  }
  return fallbackMode;
}

function sanitizeClampedNumber(
  raw: unknown,
  min: number,
  max: number,
  fallback: number,
  round = false
): number {
  const parsed = Number(raw);
  const val = Number.isFinite(parsed) ? parsed : fallback;
  const clamped = Math.max(min, Math.min(max, val));
  return round ? Math.round(clamped) : clamped;
}

export function sanitizeCarOverride(
  raw: Partial<NameTagCarOverride> | null | undefined,
  fallbackWorldOffsetUu: number,
  fallbackScreenOffsetPx: number
): NameTagCarOverride {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: Boolean(source.enabled),
    scaleMultiplier: sanitizeClampedNumber(source.scaleMultiplier, 0.2, 3.0, 1.0),
    worldOffsetUu: sanitizeClampedNumber(
      source.worldOffsetUu,
      0,
      360,
      fallbackWorldOffsetUu
    ),
    screenOffsetPx: sanitizeClampedNumber(
      source.screenOffsetPx,
      -60,
      160,
      fallbackScreenOffsetPx
    ),
  };
}

export function sanitizeConfig(raw: Partial<NameTagConfig> | null | undefined): NameTagConfig {
  const source = raw && typeof raw === 'object' ? raw : {};
  const D = DEFAULT_NAME_TAG_CONFIG;
  const previewNames =
    Array.isArray(source.previewNames) && source.previewNames.length === 6
      ? source.previewNames.map((name, index) => String(name || D.previewNames[index]))
      : [...D.previewNames];

  const previewBoostAmounts =
    Array.isArray(source.previewBoostAmounts) && source.previewBoostAmounts.length === 6
      ? source.previewBoostAmounts.map((boostValue, index) =>
          sanitizeClampedNumber(boostValue, 0, 100, D.previewBoostAmounts[index] ?? 100, true)
        )
      : [...D.previewBoostAmounts];

  const previewAerialClimbingFlags =
    Array.isArray(source.previewAerialClimbingFlags) && source.previewAerialClimbingFlags.length === 6
      ? source.previewAerialClimbingFlags.map((flag, index) =>
          typeof flag === 'boolean' ? flag : Boolean(D.previewAerialClimbingFlags[index])
        )
      : [...D.previewAerialClimbingFlags];

  const verticalOffsetUu = sanitizeClampedNumber(source.verticalOffsetUu, 0, 360, D.verticalOffsetUu);
  const screenVerticalOffsetPx = sanitizeClampedNumber(source.screenVerticalOffsetPx, -60, 160, D.screenVerticalOffsetPx);

  const carOverrides = Array.from({ length: 6 }, (_, index) =>
    sanitizeCarOverride(
      Array.isArray(source.carOverrides) ? source.carOverrides[index] : null,
      verticalOffsetUu,
      screenVerticalOffsetPx
    )
  );

  const clampedMinWidth = sanitizeClampedNumber(source.pillMinWidth, 40, 460, D.pillMinWidth);
  const clampedMaxWidth = sanitizeClampedNumber(source.pillMaxWidth, clampedMinWidth, 480, D.pillMaxWidth);

  const validFontFamilies: NameTagFontFamily[] = ['jetbrains-mono', 'sf-mono', 'archivo'];
  const fontFamily: NameTagFontFamily = validFontFamilies.includes(source.fontFamily as NameTagFontFamily)
    ? (source.fontFamily as NameTagFontFamily)
    : D.fontFamily;

  const validWeights: NameTagFontWeight[] = [400, 500, 600, 700];
  const fontWeight: NameTagFontWeight = validWeights.includes(Number(source.fontWeight) as NameTagFontWeight)
    ? (Number(source.fontWeight) as NameTagFontWeight)
    : D.fontWeight;

  const rawCardRenderScale = Number(source.cardRenderScale);
  const normalizedCardRenderScale = Number.isFinite(rawCardRenderScale)
    ? rawCardRenderScale > 0 && rawCardRenderScale <= 4
      ? rawCardRenderScale * 100
      : rawCardRenderScale
    : D.cardRenderScale;

  const boostBorderColorMode: NameTagBoostBorderColorMode =
    source.boostBorderColorMode === 'shared' || source.boostBorderColorMode === 'team'
      ? source.boostBorderColorMode
      : D.boostBorderColorMode;

  const boolOr = (val: unknown, fallback: boolean): boolean =>
    typeof val === 'boolean' ? val : fallback;

  return {
    enabled: boolOr(source.enabled, D.enabled),
    pillMinWidth: clampedMinWidth,
    pillMaxWidth: clampedMaxWidth,
    pillHeight: sanitizeClampedNumber(source.pillHeight, 28, 120, D.pillHeight),
    cornerRadius: sanitizeClampedNumber(source.cornerRadius, 0, 60, D.cornerRadius),
    borderWidth: sanitizeClampedNumber(source.borderWidth, 0, 12, D.borderWidth),
    fontSize: sanitizeClampedNumber(source.fontSize, 12, 48, D.fontSize),
    fontFamily,
    fontWeight,
    cardRenderScale: Math.max(25, Math.min(200, Math.round(normalizedCardRenderScale))),
    maxChars: sanitizeClampedNumber(source.maxChars, 4, 32, D.maxChars, true),
    opacity: sanitizeClampedNumber(source.opacity, 0.1, 1.0, D.opacity),
    bgOpacity: sanitizeClampedNumber(source.bgOpacity, 0.0, 1.0, D.bgOpacity),
    verticalOffsetUu,
    screenVerticalOffsetPx,
    cameraScaleFactor: sanitizeClampedNumber(source.cameraScaleFactor, 0.02, 0.3, D.cameraScaleFactor),
    distanceScaleExponent: sanitizeClampedNumber(source.distanceScaleExponent, 0.0, 1.5, D.distanceScaleExponent),
    nearScaleMultiplier: sanitizeClampedNumber(source.nearScaleMultiplier, 0.2, 2.5, D.nearScaleMultiplier),
    farScaleMultiplier: sanitizeClampedNumber(source.farScaleMultiplier, 0.2, 2.5, D.farScaleMultiplier),
    depthMetric: source.depthMetric === 'euclidean' ? 'euclidean' : 'viewZ',
    blueBgColor: sanitizeHexColor(source.blueBgColor, D.blueBgColor),
    blueBorderColor: sanitizeHexColor(source.blueBorderColor, D.blueBorderColor),
    blueTextColor: sanitizeHexColor(source.blueTextColor, D.blueTextColor),
    orangeBgColor: sanitizeHexColor(source.orangeBgColor, D.orangeBgColor),
    orangeBorderColor: sanitizeHexColor(source.orangeBorderColor, D.orangeBorderColor),
    orangeTextColor: sanitizeHexColor(source.orangeTextColor, D.orangeTextColor),
    boostBorderEnabled: boolOr(source.boostBorderEnabled, D.boostBorderEnabled),
    boostIndicatorMode: sanitizeBoostIndicatorMode(source.boostIndicatorMode, D.boostIndicatorMode),
    boostFillOpacity: sanitizeClampedNumber(source.boostFillOpacity, 0.05, 1.0, D.boostFillOpacity),
    boostFillColorBlendRatio: sanitizeClampedNumber(
      source.boostFillColorBlendRatio,
      0.0,
      1.0,
      D.boostFillColorBlendRatio
    ),
    boostUnfilledBgOpacity: sanitizeClampedNumber(source.boostUnfilledBgOpacity, 0.0, 1.0, D.boostUnfilledBgOpacity),
    boostUnfilledDarkenRatio: sanitizeClampedNumber(
      source.boostUnfilledDarkenRatio,
      0.0,
      0.9,
      D.boostUnfilledDarkenRatio
    ),
    boostShowHorizonLine: boolOr(source.boostShowHorizonLine, D.boostShowHorizonLine),
    boostBorderColorMode,
    blueBoostBorderColor: sanitizeHexColor(source.blueBoostBorderColor, D.blueBoostBorderColor),
    orangeBoostBorderColor: sanitizeHexColor(source.orangeBoostBorderColor, D.orangeBoostBorderColor),
    sharedBoostBorderColor: sanitizeHexColor(source.sharedBoostBorderColor, D.sharedBoostBorderColor),
    showBoostBorderInMatchPlaying: boolOr(source.showBoostBorderInMatchPlaying, D.showBoostBorderInMatchPlaying),
    boostBorderMatchAudience: sanitizeBoostBorderAudience(source.boostBorderMatchAudience, D.boostBorderMatchAudience),
    showBoostBorderInGoalReplay: boolOr(source.showBoostBorderInGoalReplay, D.showBoostBorderInGoalReplay),
    boostBorderReplayAudience: sanitizeBoostBorderAudience(source.boostBorderReplayAudience, D.boostBorderReplayAudience),
    ballOcclusionEnabled: boolOr(source.ballOcclusionEnabled, D.ballOcclusionEnabled),
    ballOcclusionOpacity: sanitizeClampedNumber(source.ballOcclusionOpacity, 0.0, 1.0, D.ballOcclusionOpacity),
    offscreenIndicatorEnabled: boolOr(source.offscreenIndicatorEnabled, D.offscreenIndicatorEnabled),
    offscreenAudience: sanitizeBoostBorderAudience(source.offscreenAudience, D.offscreenAudience),
    offscreenShowBoostCircle: boolOr(source.offscreenShowBoostCircle, D.offscreenShowBoostCircle),
    offscreenShowArrow: boolOr(source.offscreenShowArrow, D.offscreenShowArrow),
    offscreenCircleRadiusPx: sanitizeClampedNumber(source.offscreenCircleRadiusPx, 8, 56, D.offscreenCircleRadiusPx, true),
    offscreenArrowLengthPx: sanitizeClampedNumber(source.offscreenArrowLengthPx, 4, 36, D.offscreenArrowLengthPx, true),
    offscreenArrowBaseWidthPx: sanitizeClampedNumber(source.offscreenArrowBaseWidthPx, 4, 36, D.offscreenArrowBaseWidthPx, true),
    offscreenArrowGapPx: sanitizeClampedNumber(source.offscreenArrowGapPx, 0, 24, D.offscreenArrowGapPx, true),
    offscreenRoiAvoidHud: boolOr(source.offscreenRoiAvoidHud, D.offscreenRoiAvoidHud),
    offscreenRoiTopInsetPx: sanitizeClampedNumber(source.offscreenRoiTopInsetPx, 12, 260, D.offscreenRoiTopInsetPx, true),
    offscreenRoiBottomInsetPx: sanitizeClampedNumber(source.offscreenRoiBottomInsetPx, 12, 260, D.offscreenRoiBottomInsetPx, true),
    offscreenRoiSideInsetPx: sanitizeClampedNumber(source.offscreenRoiSideInsetPx, 12, 260, D.offscreenRoiSideInsetPx, true),
    aerialClimbAlertEnabled: boolOr(source.aerialClimbAlertEnabled, D.aerialClimbAlertEnabled),
    aerialClimbAlertAudience: sanitizeBoostBorderAudience(source.aerialClimbAlertAudience, D.aerialClimbAlertAudience),
    aerialClimbTriggerMode: sanitizeAerialClimbTriggerMode(source.aerialClimbTriggerMode, D.aerialClimbTriggerMode),
    aerialClimbMinAltitudeUu: sanitizeClampedNumber(source.aerialClimbMinAltitudeUu, 0, 1200, D.aerialClimbMinAltitudeUu, true),
    aerialClimbMinVelZUu: sanitizeClampedNumber(source.aerialClimbMinVelZUu, -200, 1200, D.aerialClimbMinVelZUu, true),
    aerialClimbHoldJumpMinMs: sanitizeClampedNumber(source.aerialClimbHoldJumpMinMs, 20, 500, D.aerialClimbHoldJumpMinMs, true),
    aerialClimbMinPitchFwdZ: Number(
      sanitizeClampedNumber(source.aerialClimbMinPitchFwdZ, -0.2, 0.95, D.aerialClimbMinPitchFwdZ).toFixed(2)
    ),
    aerialClimbGlowColor: sanitizeHexColor(source.aerialClimbGlowColor, D.aerialClimbGlowColor),
    aerialClimbGlowRadiusPx: sanitizeClampedNumber(source.aerialClimbGlowRadiusPx, 8, 100, D.aerialClimbGlowRadiusPx, true),
    aerialClimbGlowOpacity: sanitizeClampedNumber(source.aerialClimbGlowOpacity, 0.1, 1.0, D.aerialClimbGlowOpacity),
    aerialClimbSimulatePovInTuner: boolOr(source.aerialClimbSimulatePovInTuner, D.aerialClimbSimulatePovInTuner),
    previewAerialClimbingFlags,
    showOnLocalCar: boolOr(source.showOnLocalCar, D.showOnLocalCar),
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
    previewAerialClimbingFlags: _pa,
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
      isOffscreen: car.isOffscreen ?? false,
      isDoubleJumpedAndClimbing: car.isDoubleJumpedAndClimbing ?? false,
      aerialClimbTriggerReason: car.aerialClimbTriggerReason ?? 'none',
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
        carAltitudeUu: car.carAltitudeUu ?? 0,
        carVelZUu: car.carVelZUu ?? 0,
        carPitchFwdZ: car.carPitchFwdZ ?? 0,
        carJumpHoldMs: car.carJumpHoldMs ?? 0,
      },
    })),
  };
}
