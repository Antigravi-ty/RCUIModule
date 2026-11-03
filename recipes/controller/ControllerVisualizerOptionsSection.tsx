import React from 'react';
import { SettingSegmentedRow } from '../../compounds/SettingSegmentedRow';
import { SettingToggleRow } from '../../compounds/SettingToggleRow';
import { SettingSliderRow } from '../../compounds/SettingSliderRow';
import { ControllerDeadzoneVisualizer } from './ControllerDeadzoneVisualizer';
import type { DeadzoneAntiAliasing, StickAxisOption } from './deadzoneCanvasRenderer';

export interface ControllerVisualizerOptionsSectionProps {
  stickDeadzone: number;
  dodgeDeadzone: number;
  showCircularOverlay: boolean;
  onShowCircularOverlayChange: (val: boolean) => void;
  maxDiagonal: number;
  onMaxDiagonalChange: (val: number) => void;
  altArrow: boolean;
  onAltArrowChange: (val: boolean) => void;
  antiAliasing: DeadzoneAntiAliasing;
  onAntiAliasingChange: (val: DeadzoneAntiAliasing) => void;
  steerAxisRole: StickAxisOption;
  invertSteerAxis: boolean;
  pitchAxisRole: StickAxisOption;
  invertPitchAxis: boolean;
  selectedGamepadIndex: number | null;
  developerMode?: boolean;
  isLight?: boolean;
  onHoverDesc: (desc: string | null) => void;
  onResetToDefault: () => void;
}

export const ControllerVisualizerOptionsSection: React.FC<
  ControllerVisualizerOptionsSectionProps
> = ({
  stickDeadzone,
  dodgeDeadzone,
  showCircularOverlay,
  onShowCircularOverlayChange,
  maxDiagonal,
  onMaxDiagonalChange,
  altArrow,
  onAltArrowChange,
  antiAliasing,
  onAntiAliasingChange,
  steerAxisRole,
  invertSteerAxis,
  pitchAxisRole,
  invertPitchAxis,
  selectedGamepadIndex,
  developerMode = false,
  isLight = false,
  onHoverDesc,
  onResetToDefault,
}) => {
  return (
    <>
      {/* 9. Show Circular Overlay (HalfwayDead Visualizer Option) */}
      <SettingToggleRow
        title="Show Circular Overlay"
        checked={showCircularOverlay}
        onChange={onShowCircularOverlayChange}
        bordered={false}
        showDescription={false}
        hoverDescription="Display circular physical thumbstick boundary overlay on the Turning and Dodging diagrams."
        onHover={(desc) => desc && onHoverDesc(desc)}
        onLeave={() => onHoverDesc(null)}
        isLight={isLight}
      />

      {/* 10. Max. Diagonal Value (HalfwayDead Visualizer Option) */}
      <SettingSliderRow
        title="Max. Diagonal Value"
        min={0.5}
        max={1.0}
        step={0.01}
        value={maxDiagonal}
        onChange={onMaxDiagonalChange}
        disabled={!showCircularOverlay}
        layout="inline"
        bordered={false}
        showDescription={false}
        developerMode={developerMode}
        hoverDescription="Maximum diagonal coordinate reached by the physical circular controller gate (default 0.77)."
        onHover={(desc) => desc && onHoverDesc(desc)}
        onLeave={() => onHoverDesc(null)}
        isLight={isLight}
      />

      {/* 11. Display Alternative Arrow (HalfwayDead Visualizer Option) */}
      <SettingToggleRow
        title="Display Alternative Arrow"
        checked={altArrow}
        onChange={onAltArrowChange}
        bordered={false}
        showDescription={false}
        hoverDescription="Anchor the Turning vector arrow at the deadzone offset pointing to the raw cursor position."
        onHover={(desc) => desc && onHoverDesc(desc)}
        onLeave={() => onHoverDesc(null)}
        isLight={isLight}
      />

      {/* 12. Anti-Aliasing (HalfwayDead Visualizer Option) */}
      <SettingSegmentedRow
        title="Anti-Aliasing"
        value={antiAliasing}
        onChange={(val) => onAntiAliasingChange(val as DeadzoneAntiAliasing)}
        options={[
          { value: 'off', label: 'Off' },
          { value: '4x', label: '4x' },
          { value: '9x', label: '9x' },
          { value: '16x', label: '16x' },
        ]}
        bordered={false}
        showDescription={false}
        hoverDescription="Supersampling anti-aliasing factor for the Turning and Dodging deadzone diagrams."
        onHover={(desc) => desc && onHoverDesc(desc)}
        onLeave={() => onHoverDesc(null)}
        isLight={isLight}
      />

      {/* 13. Turning & Dodging Deadzone Visualizer + Dual Raw Input Readouts */}
      <ControllerDeadzoneVisualizer
        deadzone={stickDeadzone}
        dodgeDeadzone={dodgeDeadzone}
        showCircularOverlay={showCircularOverlay}
        maxDiagonal={maxDiagonal}
        altArrow={altArrow}
        antiAliasing={antiAliasing}
        steerAxisRole={steerAxisRole}
        invertSteerAxis={invertSteerAxis}
        pitchAxisRole={pitchAxisRole}
        invertPitchAxis={invertPitchAxis}
        selectedGamepadIndex={selectedGamepadIndex}
        isLight={isLight}
        onHover={(desc) => onHoverDesc(desc)}
        onLeave={() => onHoverDesc(null)}
      />

      {/* 14. Reset to Default Button */}
      <button
        type="button"
        onClick={onResetToDefault}
        onMouseEnter={() =>
          onHoverDesc(
            'Restore default controller stick axes, deadzones, trigger threshold, and visualizer settings.'
          )
        }
        onMouseLeave={() => onHoverDesc(null)}
        className={`mt-1 w-full py-2 px-3 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
          isLight
            ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
            : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
        }`}
      >
        Reset to Default
      </button>
    </>
  );
};
