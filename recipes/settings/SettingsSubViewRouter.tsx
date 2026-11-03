import React from 'react';
import {
  Layer3BallTrajectoryRecipe,
  type TrajectoryConfig,
} from '../Layer3BallTrajectoryRecipe';
import { Layer3TrainingConfigRecipe } from '../Layer3TrainingConfigRecipe';
import { Layer3CameraRecipe } from '../Layer3CameraRecipe';
import type { CameraConfig } from '../camera/cameraConfigSpecs';
import { Layer3KeybindingsRecipe } from '../Layer3KeybindingsRecipe';

export type SettingsInternalSubView = 'trajectory' | 'training-config' | 'camera' | 'keybindings' | null;

export interface SettingsSubViewRouterProps {
  subView: Exclude<SettingsInternalSubView, null>;
  isLight: boolean;
  developerMode: boolean;
  trajectoryConfig?: Partial<TrajectoryConfig>;
  onTrajectoryConfigChange?: (
    next: TrajectoryConfig,
    patch: Partial<TrajectoryConfig>
  ) => void;
  cameraConfig?: Partial<CameraConfig>;
  onCameraConfigChange?: (
    next: CameraConfig,
    patch: Partial<CameraConfig>
  ) => void;
  onChangeSubView: (next: SettingsInternalSubView) => void;
}

export const SettingsSubViewRouter: React.FC<SettingsSubViewRouterProps> = ({
  subView,
  isLight,
  developerMode,
  trajectoryConfig,
  onTrajectoryConfigChange,
  cameraConfig,
  onCameraConfigChange,
  onChangeSubView,
}) => {
  if (subView === 'trajectory') {
    return (
      <Layer3BallTrajectoryRecipe
        isLight={isLight}
        developerMode={developerMode}
        config={trajectoryConfig}
        onChange={onTrajectoryConfigChange}
        onBack={() => onChangeSubView(null)}
        onCollapsePreview={() => onChangeSubView(null)}
      />
    );
  }

  if (subView === 'training-config') {
    return (
      <Layer3TrainingConfigRecipe
        isLight={isLight}
        onBack={() => onChangeSubView(null)}
        onNavigateTrajectory={() => onChangeSubView('trajectory')}
      />
    );
  }

  if (subView === 'camera') {
    return (
      <Layer3CameraRecipe
        isLight={isLight}
        developerMode={developerMode}
        config={cameraConfig}
        onChange={onCameraConfigChange}
        onBack={() => onChangeSubView(null)}
      />
    );
  }

  return (
    <Layer3KeybindingsRecipe
      standalone
      isLight={isLight}
      onBack={() => onChangeSubView(null)}
    />
  );
};
