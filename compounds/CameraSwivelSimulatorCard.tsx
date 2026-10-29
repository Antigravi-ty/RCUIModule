import React from 'react';
import { Eye } from 'lucide-react';
import { SegmentedSwitch } from '../primitives/SegmentedSwitch';
import { SliderControl } from '../primitives/SliderControl';

export type CameraLookOverridePreset = 'none' | 'left' | 'right' | 'up' | 'down' | 'rearView';

export interface CameraSwivelSimulatorCardProps {
  preset?: CameraLookOverridePreset;
  strength?: number;
  lookX?: number;
  lookY?: number;
  onChangePreset?: (preset: CameraLookOverridePreset) => void;
  onChangeStrength?: (strength: number) => void;
  onChangeAxes?: (lookX: number, lookY: number) => void;
  isLight?: boolean;
  className?: string;
}

/**
 * [L3 Compound] CameraSwivelSimulatorCard
 * Pure props-driven Hands-Free Camera Swivel & Rear-View Override Simulator Card.
 */
export const CameraSwivelSimulatorCard: React.FC<CameraSwivelSimulatorCardProps> = React.memo(
  ({
    preset = 'none',
    strength = 0.95,
    lookX = 0,
    lookY = 0,
    onChangePreset,
    onChangeStrength,
    onChangeAxes,
    isLight = true,
    className = '',
  }) => {
  return (
    <div
      data-ui-element="compound-camera-swivel-simulator-card"
      className={`p-3 rounded-xl border flex flex-col gap-2.5 select-none ${
        isLight
          ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
          : 'bg-neutral-900/70 border-neutral-800 text-neutral-200'
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-amber-500 flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          <span>Camera Swivel & Rear View Simulator</span>
        </span>
        <span className="text-[10px] font-mono opacity-75">Hands-Free Input Override</span>
      </div>

      <SegmentedSwitch
        value={preset}
        onValueChange={(val) => onChangePreset?.(val as CameraLookOverridePreset)}
        options={[
          { value: 'none', label: 'None' },
          { value: 'left', label: 'Left' },
          { value: 'right', label: 'Right' },
          { value: 'up', label: 'Up' },
          { value: 'down', label: 'Down' },
          { value: 'rearView', label: 'Rear' },
        ]}
        size="sm"
        fullWidth
        isLight={isLight}
      />

      {preset !== 'none' && preset !== 'rearView' && (
        <SliderControl
          label="Simulated Analog Swivel Magnitude"
          value={strength}
          min={0}
          max={1}
          step={0.01}
          editable={true}
          usePrecisionContext={true}
          onChange={(val) => onChangeStrength?.(val)}
          isLight={isLight}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
        <SliderControl
          label="Manual Look X (Left / Right)"
          value={lookX}
          min={-1}
          max={1}
          step={0.01}
          variation="centered"
          origin={0}
          editable={true}
          usePrecisionContext={true}
          onChange={(val) => onChangeAxes?.(val, lookY)}
          isLight={isLight}
        />
        <SliderControl
          label="Manual Look Y (Up / Down)"
          value={lookY}
          min={-1}
          max={1}
          step={0.01}
          variation="centered"
          origin={0}
          editable={true}
          usePrecisionContext={true}
          onChange={(val) => onChangeAxes?.(lookX, val)}
          isLight={isLight}
        />
      </div>
    </div>
  );
});

CameraSwivelSimulatorCard.displayName = 'CameraSwivelSimulatorCard';
