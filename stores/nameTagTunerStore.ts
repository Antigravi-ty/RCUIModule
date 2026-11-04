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
  notifyNameTagListeners,
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
  useNameTagTunerStore.setState({
    isTunerArenaActive: runtimeState.isTunerArenaActive,
    kickoffPermutationIndex: runtimeState.kickoffPermutationIndex,
    activeCameraMode: runtimeState.activeCameraMode,
    focusedCarIndex: runtimeState.focusedCarIndex,
    selectedCalibrationCarIndex: runtimeState.selectedCalibrationCarIndex,
    boostBorderOverride: runtimeState.boostBorderOverride,
  });
  notifyNameTagListeners();
  return runtimeState;
}

const telemetryListeners = new Set<(snapshot: NameTagTelemetrySnapshot) => void>();

export function setNameTagTelemetrySnapshot(snapshot: NameTagTelemetrySnapshot): void {
  latestTelemetrySnapshot = snapshot;
  for (const listener of telemetryListeners) {
    listener(snapshot);
  }
}

export function getNameTagTelemetrySnapshot(): NameTagTelemetrySnapshot {
  return latestTelemetrySnapshot;
}

export function subscribeNameTagTelemetry(
  listener: (snapshot: NameTagTelemetrySnapshot) => void
): () => void {
  telemetryListeners.add(listener);
  return () => {
    telemetryListeners.delete(listener);
  };
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
  const { previewNames: _pn, previewBoostAmounts: _pb, carOverrides: _co, enabled: _en, ...globalConfig } = currentConfig;
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

export const useNameTagTunerStore = create<NameTagTunerStoreState>((_set, get) => ({
  config: getNameTagConfig(),
  isTunerArenaActive: runtimeState.isTunerArenaActive,
  kickoffPermutationIndex: runtimeState.kickoffPermutationIndex,
  activeCameraMode: runtimeState.activeCameraMode,
  focusedCarIndex: runtimeState.focusedCarIndex,
  selectedCalibrationCarIndex: runtimeState.selectedCalibrationCarIndex,
  boostBorderOverride: runtimeState.boostBorderOverride,

  updateConfig: (patch) => {
    updateNameTagConfig(patch);
  },

  updatePreviewName: (index, name) => {
    const nextNames = [...get().config.previewNames];
    if (index >= 0 && index < 6) {
      nextNames[index] = name;
    }
    updateNameTagConfig({ previewNames: nextNames });
  },

  updatePreviewBoostAmount: (index, boostAmount) => {
    const nextBoosts = [...get().config.previewBoostAmounts];
    if (index >= 0 && index < 6) {
      nextBoosts[index] = Math.max(0, Math.min(100, Math.round(Number(boostAmount) || 0)));
    }
    updateNameTagConfig({ previewBoostAmounts: nextBoosts });
  },

  setBoostBorderOverride: (override) => {
    setNameTagRuntimeState({ boostBorderOverride: override });
  },

  selectCalibrationCar: (carIndex) => {
    const clampedIndex = Math.max(0, Math.min(5, Math.round(Number(carIndex) || 0)));
    setNameTagRuntimeState({ selectedCalibrationCarIndex: clampedIndex });
  },

  updateCarOverride: (carIndex, patch) => {
    updateNameTagCarOverride(carIndex, patch);
  },

  resetCarOverride: (carIndex) => {
    resetNameTagCarOverride(carIndex);
  },

  resetAllCarOverrides: () => {
    resetAllNameTagCarOverrides();
  },

  applyFittedFromCarOverrides: () => {
    applyFittedParametersFromCarOverrides();
  },

  exportCalibrationJson: () => {
    const payload = buildNameTagCalibrationExportPayload();
    return JSON.stringify(payload, null, 2);
  },

  resetConfig: () => {
    resetNameTagConfig();
  },

  enterTunerArenaAndSpawnSixCars: () => {
    runtimeState.onEnterTunerArena?.();
  },

  exitTunerArena: () => {
    runtimeState.onExitTunerArena?.();
  },

  reshuffleKickoffPositions: () => {
    runtimeState.onReshuffleKickoffPositions?.();
  },

  selectPovCar: (carIndex) => {
    runtimeState.onSelectPovCar?.(carIndex);
  },

  focusFreeCamOverview: () => {
    runtimeState.onFocusFreeCamOverview?.();
  },
}));

subscribeNameTagConfig(() => {
  useNameTagTunerStore.setState({
    config: getNameTagConfig(),
    isTunerArenaActive: runtimeState.isTunerArenaActive,
    kickoffPermutationIndex: runtimeState.kickoffPermutationIndex,
    activeCameraMode: runtimeState.activeCameraMode,
    focusedCarIndex: runtimeState.focusedCarIndex,
    selectedCalibrationCarIndex: runtimeState.selectedCalibrationCarIndex,
    boostBorderOverride: runtimeState.boostBorderOverride,
  });
});
