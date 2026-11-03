import { create } from 'zustand';
import {
  type NameTagBoostBorderOverride,
  type NameTagCameraMode,
  type NameTagCarOverride,
  type NameTagConfig,
  type NameTagFittedParameters,
  type NameTagRuntimeState,
  type NameTagTelemetrySnapshot,
  createDefaultCarOverride,
  getNameTagConfig,
  notifyNameTagListeners,
  resetAllNameTagCarOverrides,
  resetNameTagCarOverride,
  resetNameTagConfig,
  subscribeNameTagConfig,
  updateNameTagCarOverride,
  updateNameTagConfig,
} from '../config/nameTagConfig';
import { computeFittedParametersFromSamples as computeFittedFromConfigAndSnapshot } from '../config/nameTagCalibrationMath';

export {
  getNameTagConfig,
  resetAllNameTagCarOverrides,
  resetNameTagCarOverride,
  resetNameTagConfig,
  subscribeNameTagConfig,
  updateNameTagCarOverride,
  updateNameTagConfig,
};

let runtimeState: NameTagRuntimeState = {
  isTunerArenaActive: false,
  isMultiplayerOrMultiCarMode: false,
  kickoffPermutationIndex: 0,
  activeCameraMode: 'pov',
  focusedCarIndex: 0,
  selectedCalibrationCarIndex: 0,
  carEntries: [],
  boostBorderOverride: null,
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

export function getNameTagRuntimeState(): NameTagRuntimeState {
  return runtimeState;
}

export function setNameTagRuntimeState(
  patch: Partial<NameTagRuntimeState>
): NameTagRuntimeState {
  runtimeState = { ...runtimeState, ...patch };
  notifyNameTagListeners();
  return runtimeState;
}

export function setNameTagTelemetrySnapshot(snapshot: NameTagTelemetrySnapshot): void {
  latestTelemetrySnapshot = snapshot;
}

export function getNameTagTelemetrySnapshot(): NameTagTelemetrySnapshot {
  return latestTelemetrySnapshot;
}

export function computeFittedParametersFromSamples(): NameTagFittedParameters {
  return computeFittedFromConfigAndSnapshot(getNameTagConfig(), latestTelemetrySnapshot);
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
  const currentConfig = getNameTagConfig();
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
      boostBorderEnabled: currentConfig.boostBorderEnabled,
      boostIndicatorMode: currentConfig.boostIndicatorMode,
      boostFillOpacity: currentConfig.boostFillOpacity,
      boostUnfilledBgOpacity: currentConfig.boostUnfilledBgOpacity,
      boostShowHorizonLine: currentConfig.boostShowHorizonLine,
      boostBorderColorMode: currentConfig.boostBorderColorMode,
      blueBoostBorderColor: currentConfig.blueBoostBorderColor,
      orangeBoostBorderColor: currentConfig.orangeBoostBorderColor,
      sharedBoostBorderColor: currentConfig.sharedBoostBorderColor,
      showBoostBorderInMatchPlaying: currentConfig.showBoostBorderInMatchPlaying,
      boostBorderMatchAudience: currentConfig.boostBorderMatchAudience,
      showBoostBorderInGoalReplay: currentConfig.showBoostBorderInGoalReplay,
      boostBorderReplayAudience: currentConfig.boostBorderReplayAudience,
      ballOcclusionEnabled: currentConfig.ballOcclusionEnabled,
      ballOcclusionOpacity: currentConfig.ballOcclusionOpacity,
      showOnLocalCar: currentConfig.showOnLocalCar,
    },
    fittedRecommendation: fitted,
    cars: snapshot.cars.map((car) => ({
      carIndex: car.carIndex,
      slotCode: car.slotCode,
      name: car.name,
      team: car.team,
      visible: car.visible,
      boostAmount: car.boostAmount,
      boostBorderVisible: car.boostBorderVisible,
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

export interface NameTagTunerStoreState {
  config: NameTagConfig;
  isTunerArenaActive: boolean;
  kickoffPermutationIndex: number;
  activeCameraMode: NameTagCameraMode;
  focusedCarIndex: number;
  selectedCalibrationCarIndex: number;
  boostBorderOverride: NameTagBoostBorderOverride;
  updateConfig: (patch: Partial<NameTagConfig>) => void;
  updatePreviewName: (index: number, name: string) => void;
  updatePreviewBoostAmount: (index: number, boostAmount: number) => void;
  setBoostBorderOverride: (override: NameTagBoostBorderOverride) => void;
  selectCalibrationCar: (carIndex: number) => void;
  updateCarOverride: (carIndex: number, patch: Partial<NameTagCarOverride>) => void;
  resetCarOverride: (carIndex: number) => void;
  resetAllCarOverrides: () => void;
  applyFittedFromCarOverrides: () => void;
  exportCalibrationJson: () => string;
  resetConfig: () => void;
  enterTunerArenaAndSpawnSixCars: () => void;
  exitTunerArena: () => void;
  reshuffleKickoffPositions: () => void;
  selectPovCar: (carIndex: number) => void;
  focusFreeCamOverview: () => void;
}

export const useNameTagTunerStore = create<NameTagTunerStoreState>((set) => ({
  config: getNameTagConfig(),
  isTunerArenaActive: getNameTagRuntimeState().isTunerArenaActive,
  kickoffPermutationIndex: getNameTagRuntimeState().kickoffPermutationIndex,
  activeCameraMode: getNameTagRuntimeState().activeCameraMode,
  focusedCarIndex: getNameTagRuntimeState().focusedCarIndex,
  selectedCalibrationCarIndex: getNameTagRuntimeState().selectedCalibrationCarIndex,
  boostBorderOverride: getNameTagRuntimeState().boostBorderOverride,

  updateConfig: (patch) => {
    const nextConfig = updateNameTagConfig(patch);
    set({ config: nextConfig });
  },

  updatePreviewName: (index, name) => {
    const currentConfig = getNameTagConfig();
    const nextNames = [...currentConfig.previewNames];
    if (index >= 0 && index < 6) {
      nextNames[index] = name;
    }
    const nextConfig = updateNameTagConfig({ previewNames: nextNames });
    set({ config: nextConfig });
  },

  updatePreviewBoostAmount: (index, boostAmount) => {
    const currentConfig = getNameTagConfig();
    const nextBoosts = [...currentConfig.previewBoostAmounts];
    if (index >= 0 && index < 6) {
      nextBoosts[index] = Math.max(0, Math.min(100, Math.round(Number(boostAmount) || 0)));
    }
    const nextConfig = updateNameTagConfig({ previewBoostAmounts: nextBoosts });
    set({ config: nextConfig });
  },

  setBoostBorderOverride: (override) => {
    setNameTagRuntimeState({ boostBorderOverride: override });
    set({ boostBorderOverride: override });
  },

  selectCalibrationCar: (carIndex) => {
    const clampedIndex = Math.max(0, Math.min(5, Math.round(Number(carIndex) || 0)));
    setNameTagRuntimeState({ selectedCalibrationCarIndex: clampedIndex });
    set({ selectedCalibrationCarIndex: clampedIndex });
  },

  updateCarOverride: (carIndex, patch) => {
    const nextConfig = updateNameTagCarOverride(carIndex, patch);
    set({ config: nextConfig });
  },

  resetCarOverride: (carIndex) => {
    const nextConfig = resetNameTagCarOverride(carIndex);
    set({ config: nextConfig });
  },

  resetAllCarOverrides: () => {
    const nextConfig = resetAllNameTagCarOverrides();
    set({ config: nextConfig });
  },

  applyFittedFromCarOverrides: () => {
    const nextConfig = applyFittedParametersFromCarOverrides();
    set({ config: nextConfig });
  },

  exportCalibrationJson: () => {
    const payload = buildNameTagCalibrationExportPayload();
    return JSON.stringify(payload, null, 2);
  },

  resetConfig: () => {
    const nextConfig = resetNameTagConfig();
    set({ config: nextConfig });
  },

  enterTunerArenaAndSpawnSixCars: () => {
    const state = getNameTagRuntimeState();
    state.onEnterTunerArena?.();
  },

  exitTunerArena: () => {
    const state = getNameTagRuntimeState();
    state.onExitTunerArena?.();
  },

  reshuffleKickoffPositions: () => {
    const state = getNameTagRuntimeState();
    state.onReshuffleKickoffPositions?.();
  },

  selectPovCar: (carIndex) => {
    const state = getNameTagRuntimeState();
    state.onSelectPovCar?.(carIndex);
  },

  focusFreeCamOverview: () => {
    const state = getNameTagRuntimeState();
    state.onFocusFreeCamOverview?.();
  },
}));

subscribeNameTagConfig(() => {
  const config = getNameTagConfig();
  const state = getNameTagRuntimeState();
  useNameTagTunerStore.setState({
    config,
    isTunerArenaActive: state.isTunerArenaActive,
    kickoffPermutationIndex: state.kickoffPermutationIndex,
    activeCameraMode: state.activeCameraMode,
    focusedCarIndex: state.focusedCarIndex,
    selectedCalibrationCarIndex: state.selectedCalibrationCarIndex,
    boostBorderOverride: state.boostBorderOverride,
  });
});
