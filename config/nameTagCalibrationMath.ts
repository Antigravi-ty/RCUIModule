
export type NameTagDepthMetric = 'viewZ' | 'euclidean';
export type NameTagFontFamily = 'jetbrains-mono' | 'sf-mono' | 'archivo';
export type NameTagFontWeight = 400 | 500 | 600 | 700;

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
  showOnLocalCar: boolean;
  previewNames: string[];
  carOverrides: NameTagCarOverride[];
}

export interface NameTagCarEntry {
  carIndex: number;
  name: string;
  team: 0 | 1;
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
  onEnterTunerArena: (() => void) | null;
  onExitTunerArena: (() => void) | null;
  onReshuffleKickoffPositions: (() => void) | null;
  onSelectPovCar: ((carIndex: number) => void) | null;
  onFocusFreeCamOverview: (() => void) | null;
}

const STORAGE_KEY = 'rc_name_tag_config_v7';
export const NAME_TAG_REFERENCE_DEPTH_UU = 3500;
export const NAME_TAG_NEAR_CALIBRATION_DEPTH_UU = 500;
export const NAME_TAG_FAR_CALIBRATION_DEPTH_UU = 9000;

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


export interface NameTagFittedParameters {
  sampleCount: number;
  cameraScaleFactor: number;
  distanceScaleExponent: number;
  nearScaleMultiplier: number;
  farScaleMultiplier: number;
  verticalOffsetUu: number;
  screenVerticalOffsetPx: number;
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

  // Log-linear regression for scale:
  // ln(effectiveScaleFactor_i * (d_i / d_ref)^gamma_current) = ln(baseScale) + gamma_new * ln(d_i / d_ref)
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

  // Linear regression for totalWorldVerticalOffsetUu = worldOffsetUu + screenOffsetPx * uuPerRefPx
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

