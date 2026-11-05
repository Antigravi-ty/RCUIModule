import React from 'react';
import { useNameTagTunerStore } from '../../stores/nameTagTunerStore';
import { useAppStore } from '../../stores/appStore';
import { useHudStore } from '../../stores/hudStore';
import {
  CAR_SLOT_BADGES,
  NameTagCalibrationSection,
} from './name-tag-tuner/NameTagCalibrationSection';
import { NameTagPillGeometryAndPreviewSection } from './name-tag-tuner/NameTagPillGeometryAndPreviewSection';
import { NameTagBoostBorderSection } from './name-tag-tuner/NameTagBoostBorderSection';
import { NameTagColorsAndNamesSection } from './name-tag-tuner/NameTagColorsAndNamesSection';

export interface NameTagTunerFloatingWindowProps {
  isLight?: boolean;
  active?: boolean;
  layout?: 'column' | 'grid';
}

export const NameTagTunerFloatingWindow: React.FC<NameTagTunerFloatingWindowProps> = ({
  isLight = false,
  layout = 'column',
}) => {
  const {
    config,
    isTunerArenaActive,
    activeCameraMode,
    focusedCarIndex,
    updateConfig,
    updatePreviewName,
    selectPovCar,
  } = useNameTagTunerStore();

  const isFreeCamApp = useAppStore((state) => state.isFreeCam);
  const hudCameraMode = useHudStore((state) => state.cameraMode);
  const hudFocusedCarIndex = useHudStore((state) => state.focusedCarIndex);

  const effectiveCameraMode = isFreeCamApp
    ? 'free'
    : activeCameraMode || hudCameraMode || 'pov';
  const isPovMode =
    effectiveCameraMode === 'pov' ||
    effectiveCameraMode === 'wasmPov' ||
    effectiveCameraMode === 'rearView';
  const effectiveFocusedCarIndex = isTunerArenaActive
    ? focusedCarIndex
    : hudFocusedCarIndex;
  const focusedSlotCode =
    CAR_SLOT_BADGES[effectiveFocusedCarIndex]?.slotCode ||
    `#${effectiveFocusedCarIndex + 1}`;

  const containerClassName =
    layout === 'grid'
      ? 'grid grid-cols-1 lg:grid-cols-2 gap-3 items-start select-none text-xs'
      : 'flex flex-col gap-2.5 select-none text-xs';

  return (
    <div className={containerClassName}>
      <NameTagCalibrationSection isLight={isLight} />
      <NameTagPillGeometryAndPreviewSection isLight={isLight} />
      <NameTagBoostBorderSection isLight={isLight} />

      <NameTagColorsAndNamesSection
        config={config}
        isPovMode={isPovMode}
        effectiveFocusedCarIndex={effectiveFocusedCarIndex}
        focusedSlotCode={focusedSlotCode}
        isLight={isLight}
        updateConfig={updateConfig}
        updatePreviewName={updatePreviewName}
        selectPovCar={selectPovCar}
      />
    </div>
  );
};
