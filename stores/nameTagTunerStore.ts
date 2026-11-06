import { create } from 'zustand';
import {
  DEFAULT_NAME_TAG_CONFIG,
  DEFAULT_RUNTIME_SYNC_SNAPSHOT,
  KICKOFF_PERMUTATION_COUNT,
  NAME_TAG_STORAGE_KEY,
  type NameTagBoostBorderOverride,
  type NameTagCameraMode,
  type NameTagCarOverride,
  type NameTagConfig,
  type NameTagFittedParameters,
  type NameTagRuntimeState,
  type NameTagRuntimeSyncSnapshot,
  type NameTagTelemetrySnapshot,
  createDefaultCarOverride,
} from '../config/nameTagConfig';
import {
  buildNameTagCalibrationExportPayload as buildExportPayloadFromConfigAndSnapshot,
  computeFittedParametersFromSamples as computeFittedFromConfigAndSnapshot,
  mergeNameTagConfigPatch,
  sanitizeCarOverride,
  sanitizeConfig,
  sanitizeRuntimeSyncSnapshot,
} from '../config/nameTagCalibrationMath';
import {
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeStorage,
} from '../config/storageHelpers';
import { getInitialDeveloperMode } from '../config/uiConfig';
import { syncBridge } from './syncBridge';

const CONFIG_SYNC_KEY = 'store:nameTagConfig:v1';
const RUNTIME_SYNC_KEY = 'store:nameTagRuntime:v1';
const TELEMETRY_SYNC_KEY = 'store:nameTagTelemetry:v1';
const DEV_OFFSCREEN_MANUAL_OFF_KEY = 'rc_dev_quick_offscreen_manual_off_v1';

function loadSavedNameTagConfig(): NameTagConfig {
  const isDevMode = getInitialDeveloperMode();
  try {
    const raw = safeLocalStorageGet(NAME_TAG_STORAGE_KEY);
    if (!raw) {
      return sanitizeConfig({
        ...DEFAULT_NAME_TAG_CONFIG,
        offscreenIndicatorEnabled: isDevMode,
      });
    }
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const sanitized = sanitizeConfig(parsed);
    if (
      isDevMode &&
      !sanitized.offscreenIndicatorEnabled &&
      safeLocalStorageGet(DEV_OFFSCREEN_MANUAL_OFF_KEY) !== '1'
    ) {
      return {
        ...sanitized,
        offscreenIndicatorEnabled: true,
      };
    }
    return sanitized;
  } catch {
    return sanitizeConfig({
      ...DEFAULT_NAME_TAG_CONFIG,
      offscreenIndicatorEnabled: isDevMode,
    });
  }
}

function persistNameTagConfig(config: NameTagConfig, broadcast = true): void {
  try {
    safeLocalStorageSet(NAME_TAG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
  if (broadcast && !syncBridge.isApplyingRemote()) {
    syncBridge.set(CONFIG_SYNC_KEY, config);
  }
}

let currentConfig: NameTagConfig = sanitizeConfig(
  syncBridge.get<NameTagConfig>(CONFIG_SYNC_KEY, loadSavedNameTagConfig())
);

const initialRuntimeSync = sanitizeRuntimeSyncSnapshot(
  syncBridge.get<NameTagRuntimeSyncSnapshot>(
    RUNTIME_SYNC_KEY,
    DEFAULT_RUNTIME_SYNC_SNAPSHOT
  )
);

let runtimeState: NameTagRuntimeState = {
  isTunerArenaActive: initialRuntimeSync.isTunerArenaActive,
  isMultiplayerOrMultiCarMode: false,
  kickoffPermutationIndex: initialRuntimeSync.kickoffPermutationIndex,
  activeCameraMode: initialRuntimeSync.activeCameraMode,
  focusedCarIndex: initialRuntimeSync.focusedCarIndex,
  selectedCalibrationCarIndex: initialRuntimeSync.selectedCalibrationCarIndex,
  carEntries: [],
  boostBorderOverride: initialRuntimeSync.boostBorderOverride,
  onEnterTunerArena: null,
  onExitTunerArena: null,
  onReshuffleKickoffPositions: null,
  onSelectPovCar: null,
  onFocusFreeCamOverview: null,
};

const DEFAULT_TELEMETRY_SNAPSHOT: NameTagTelemetrySnapshot = {
  updatedAtMs: 0,
  viewportWidthPx: 1920,
  viewportHeightPx: 1080,
  aspectRatio: 16 / 9,
  devicePixelRatio: 1,
  cameraMode: 'pov',
  focusedCarIndex: 0,
  cameraFovDeg: 110,
  cameraPosition: [0, 0, 0],
  cameraForward: [0, 0, -1],
  cameraUp: [0, 1, 0],
  cars: [],
};

let latestTelemetrySnapshot: NameTagTelemetrySnapshot = syncBridge.get<NameTagTelemetrySnapshot>(
  TELEMETRY_SYNC_KEY,
  DEFAULT_TELEMETRY_SNAPSHOT
);

const configListeners = new Set<() => void>();
const telemetryListeners = new Set<(snapshot: NameTagTelemetrySnapshot) => void>();

function extractRuntimeSyncSnapshot(
  state: NameTagRuntimeState
): NameTagRuntimeSyncSnapshot {
  return {
    isTunerArenaActive: state.isTunerArenaActive,
    kickoffPermutationIndex: state.kickoffPermutationIndex,
    activeCameraMode: state.activeCameraMode,
    focusedCarIndex: state.focusedCarIndex,
    selectedCalibrationCarIndex: state.selectedCalibrationCarIndex,
    boostBorderOverride: state.boostBorderOverride,
  };
}

function syncStoreState(): void {
  useNameTagTunerStore.setState({
    config: currentConfig,
    isTunerArenaActive: runtimeState.isTunerArenaActive,
    kickoffPermutationIndex: runtimeState.kickoffPermutationIndex,
    activeCameraMode: runtimeState.activeCameraMode,
    focusedCarIndex: runtimeState.focusedCarIndex,
    selectedCalibrationCarIndex: runtimeState.selectedCalibrationCarIndex,
    boostBorderOverride: runtimeState.boostBorderOverride,
  });
}

export function notifyNameTagListeners(): void {
  syncStoreState();
  for (const listener of configListeners) {
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

export function updateNameTagConfig(
  patch: Partial<NameTagConfig>,
  options?: { fromCloudSync?: boolean; fromDevAutoActivate?: boolean }
): NameTagConfig {
  if (
    typeof patch.offscreenIndicatorEnabled === 'boolean' &&
    !options?.fromCloudSync &&
    !options?.fromDevAutoActivate &&
    !syncBridge.isApplyingRemote()
  ) {
    try {
      safeLocalStorageSet(
        DEV_OFFSCREEN_MANUAL_OFF_KEY,
        patch.offscreenIndicatorEnabled ? '0' : '1'
      );
    } catch {
      // Ignore storage errors
    }
  }
  currentConfig = mergeNameTagConfigPatch(currentConfig, patch);
  persistNameTagConfig(currentConfig, true);
  notifyNameTagListeners();
  return currentConfig;
}

export function activateNameTagOffscreenForDeveloperMode(): void {
  if (safeLocalStorageGet(DEV_OFFSCREEN_MANUAL_OFF_KEY) === '1') {
    return;
  }
  if (!currentConfig.offscreenIndicatorEnabled) {
    updateNameTagConfig(
      { offscreenIndicatorEnabled: true },
      { fromDevAutoActivate: true }
    );
  }
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
  try {
    safeLocalStorageSet(DEV_OFFSCREEN_MANUAL_OFF_KEY, '0');
  } catch {
    // Ignore storage errors
  }
  currentConfig = sanitizeConfig({
    ...DEFAULT_NAME_TAG_CONFIG,
    offscreenIndicatorEnabled: getInitialDeveloperMode(),
  });
  persistNameTagConfig(currentConfig, true);
  notifyNameTagListeners();
  return currentConfig;
}

export function subscribeNameTagConfig(listener: () => void): () => void {
  configListeners.add(listener);
  return () => {
    configListeners.delete(listener);
  };
}

export function getNameTagRuntimeState(): NameTagRuntimeState {
  return runtimeState;
}

export function setNameTagRuntimeState(
  patch: Partial<NameTagRuntimeState>
): NameTagRuntimeState {
  const prevSync = extractRuntimeSyncSnapshot(runtimeState);
  runtimeState = { ...runtimeState, ...patch };
  const nextSync = sanitizeRuntimeSyncSnapshot(extractRuntimeSyncSnapshot(runtimeState));
  runtimeState = { ...runtimeState, ...nextSync };

  const syncChanged =
    prevSync.isTunerArenaActive !== nextSync.isTunerArenaActive ||
    prevSync.kickoffPermutationIndex !== nextSync.kickoffPermutationIndex ||
    prevSync.activeCameraMode !== nextSync.activeCameraMode ||
    prevSync.focusedCarIndex !== nextSync.focusedCarIndex ||
    prevSync.selectedCalibrationCarIndex !== nextSync.selectedCalibrationCarIndex ||
    prevSync.boostBorderOverride !== nextSync.boostBorderOverride;

  if (syncChanged && !syncBridge.isApplyingRemote()) {
    syncBridge.set(RUNTIME_SYNC_KEY, nextSync);
  }
  notifyNameTagListeners();
  return runtimeState;
}

export function setNameTagTelemetrySnapshot(
  snapshot: NameTagTelemetrySnapshot,
  broadcast = true
): void {
  latestTelemetrySnapshot = snapshot;
  if (broadcast && !syncBridge.isApplyingRemote()) {
    syncBridge.set(TELEMETRY_SYNC_KEY, snapshot);
  }
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
  return buildExportPayloadFromConfigAndSnapshot(
    getNameTagConfig(),
    getNameTagTelemetrySnapshot(),
    runtimeState.kickoffPermutationIndex
  );
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
  updatePreviewAerialClimbingFlag: (index: number, climbing: boolean) => void;
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
  config: currentConfig,
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

  updatePreviewAerialClimbingFlag: (index, climbing) => {
    const nextFlags = [...(get().config.previewAerialClimbingFlags || [])];
    if (index >= 0 && index < 6) {
      nextFlags[index] = Boolean(climbing);
    }
    updateNameTagConfig({ previewAerialClimbingFlags: nextFlags });
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
    setNameTagRuntimeState({
      isTunerArenaActive: true,
      activeCameraMode: 'pov',
      focusedCarIndex: 0,
    });
    runtimeState.onEnterTunerArena?.();
  },

  exitTunerArena: () => {
    setNameTagRuntimeState({
      isTunerArenaActive: false,
      activeCameraMode: 'free',
    });
    runtimeState.onExitTunerArena?.();
  },

  reshuffleKickoffPositions: () => {
    const nextIndex =
      (runtimeState.kickoffPermutationIndex + 1) % KICKOFF_PERMUTATION_COUNT;
    setNameTagRuntimeState({
      isTunerArenaActive: true,
      kickoffPermutationIndex: nextIndex,
    });
    runtimeState.onReshuffleKickoffPositions?.();
  },

  selectPovCar: (carIndex) => {
    const clampedIndex = Math.max(0, Math.min(5, Math.round(Number(carIndex) || 0)));
    setNameTagRuntimeState({
      isTunerArenaActive: true,
      activeCameraMode: 'pov',
      focusedCarIndex: clampedIndex,
    });
    runtimeState.onSelectPovCar?.(clampedIndex);
  },

  focusFreeCamOverview: () => {
    setNameTagRuntimeState({
      isTunerArenaActive: true,
      activeCameraMode: 'free',
    });
    runtimeState.onFocusFreeCamOverview?.();
  },
}));

syncBridge.registerDefault(CONFIG_SYNC_KEY, sanitizeConfig(DEFAULT_NAME_TAG_CONFIG));
syncBridge.registerDefault(RUNTIME_SYNC_KEY, { ...DEFAULT_RUNTIME_SYNC_SNAPSHOT });
syncBridge.registerDefault(TELEMETRY_SYNC_KEY, DEFAULT_TELEMETRY_SNAPSHOT);

syncBridge.onReset((scopePrefix) => {
  if (!scopePrefix || CONFIG_SYNC_KEY.startsWith(scopePrefix)) {
    currentConfig = sanitizeConfig(DEFAULT_NAME_TAG_CONFIG);
    safeStorage.remove(NAME_TAG_STORAGE_KEY);
  }
  if (!scopePrefix || RUNTIME_SYNC_KEY.startsWith(scopePrefix)) {
    runtimeState = {
      ...runtimeState,
      ...DEFAULT_RUNTIME_SYNC_SNAPSHOT,
    };
  }
  notifyNameTagListeners();
});

syncBridge.subscribeKey<NameTagConfig>(CONFIG_SYNC_KEY, (remote) => {
  if (!remote || typeof remote !== 'object') return;
  currentConfig = sanitizeConfig(remote);
  persistNameTagConfig(currentConfig, false);
  notifyNameTagListeners();
});

syncBridge.subscribeKey<NameTagRuntimeSyncSnapshot>(RUNTIME_SYNC_KEY, (remote) => {
  if (!remote || typeof remote !== 'object') return;
  const sanitized = sanitizeRuntimeSyncSnapshot(remote);
  runtimeState = {
    ...runtimeState,
    ...sanitized,
  };
  notifyNameTagListeners();
});

syncBridge.subscribeKey<NameTagTelemetrySnapshot>(TELEMETRY_SYNC_KEY, (remote) => {
  if (!remote || typeof remote !== 'object' || !Array.isArray(remote.cars)) return;
  latestTelemetrySnapshot = remote;
  for (const listener of telemetryListeners) {
    listener(remote);
  }
});
