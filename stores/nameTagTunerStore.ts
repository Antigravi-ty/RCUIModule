import { create } from 'zustand';
import {
  type NameTagCameraMode,
  type NameTagCarOverride,
  type NameTagConfig,
  applyFittedParametersFromCarOverrides,
  buildNameTagCalibrationExportPayload,
  getNameTagConfig,
  getNameTagRuntimeState,
  resetAllNameTagCarOverrides,
  resetNameTagCarOverride,
  resetNameTagConfig,
  setNameTagRuntimeState,
  subscribeNameTagConfig,
  updateNameTagCarOverride,
  updateNameTagConfig,
} from '../config/nameTagConfig';

export interface NameTagTunerStoreState {
  config: NameTagConfig;
  isTunerArenaActive: boolean;
  kickoffPermutationIndex: number;
  activeCameraMode: NameTagCameraMode;
  focusedCarIndex: number;
  selectedCalibrationCarIndex: number;
  updateConfig: (patch: Partial<NameTagConfig>) => void;
  updatePreviewName: (index: number, name: string) => void;
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
    const runtimeState = getNameTagRuntimeState();
    runtimeState.onEnterTunerArena?.();
  },

  exitTunerArena: () => {
    const runtimeState = getNameTagRuntimeState();
    runtimeState.onExitTunerArena?.();
  },

  reshuffleKickoffPositions: () => {
    const runtimeState = getNameTagRuntimeState();
    runtimeState.onReshuffleKickoffPositions?.();
  },

  selectPovCar: (carIndex) => {
    const runtimeState = getNameTagRuntimeState();
    runtimeState.onSelectPovCar?.(carIndex);
  },

  focusFreeCamOverview: () => {
    const runtimeState = getNameTagRuntimeState();
    runtimeState.onFocusFreeCamOverview?.();
  },
}));

subscribeNameTagConfig(() => {
  const config = getNameTagConfig();
  const runtimeState = getNameTagRuntimeState();
  useNameTagTunerStore.setState({
    config,
    isTunerArenaActive: runtimeState.isTunerArenaActive,
    kickoffPermutationIndex: runtimeState.kickoffPermutationIndex,
    activeCameraMode: runtimeState.activeCameraMode,
    focusedCarIndex: runtimeState.focusedCarIndex,
    selectedCalibrationCarIndex: runtimeState.selectedCalibrationCarIndex,
  });
});
