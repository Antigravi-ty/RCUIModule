import { create } from 'zustand';
import { safeLocalStorageGet, safeLocalStorageSet } from '../config/storageHelpers';
import {
  type NameTagBoostBorderOverride,
  type NameTagCameraMode,
  type NameTagCarOverride,
  type NameTagConfig,
  type NameTagFittedParameters,
  type NameTagRuntimeState,
  type NameTagTelemetrySnapshot,
  NAME_TAG_STORAGE_KEY,
  DEFAULT_NAME_TAG_CONFIG,
  createDefaultCarOverride,
  sanitizeCarOverride,
  sanitizeConfig,
} from '../config/nameTagConfig';
import { computeFittedParametersFromSamples as computeFittedFromConfigAndSnapshot } from '../config/nameTagCalibrationMath';

function loadInitialNameTagConfig(): NameTagConfig {
  try {
    const raw = safeLocalStorageGet(NAME_TAG_STORAGE_KEY);
    if (!raw) {
      return sanitizeConfig(DEFAULT_NAME_TAG_CONFIG);
    }
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return sanitizeConfig(parsed);
  } catch {
    return sanitizeConfig(DEFAULT_NAME_TAG_CONFIG);
  }
}

function persistNameTagConfig(config: NameTagConfig): void {
  try {
    safeLocalStorageSet(NAME_TAG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

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

export function subscribeNameTagConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getNameTagConfig(): NameTagConfig {
  return useNameTagTunerStore.getState().config;
}

export function updateNameTagConfig(patch: Partial<NameTagConfig>): NameTagConfig {
  const currentConfig = useNameTagTunerStore.getState().config;
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
  const nextConfig = sanitizeConfig(merged);
  persistNameTagConfig(nextConfig);
  useNameTagTunerStore.setState({ config: nextConfig });
  notifyNameTagListeners();
  return nextConfig;
}

export function updateNameTagCarOverride(
  carIndex: number,
  patch: Partial<NameTagCarOverride>
): NameTagConfig {
  const currentConfig = useNameTagTunerStore.getState().config;
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
  const currentConfig = useNameTagTunerStore.getState().config;
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
  const currentConfig = useNameTagTunerStore.getState().config;
  const nextOverrides = Array.from({ length: 6 }, () =>
    createDefaultCarOverride(
      currentConfig.verticalOffsetUu,
      currentConfig.screenVerticalOffsetPx
    )
  );
  return updateNameTagConfig({ carOverrides: nextOverrides });
}

export function resetNameTagConfig(): NameTagConfig {
  const nextConfig = sanitizeConfig(DEFAULT_NAME_TAG_CONFIG);
  persistNameTagConfig(nextConfig);
  useNameTagTunerStore.setState({ config: nextConfig });
  notifyNameTagListeners();
  return nextConfig;
}

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

export const useNameTagTunerStore = create<NameTagTunerStoreState>((set, get) => ({
  config: loadInitialNameTagConfig(),
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
