import React from 'react';
import { SliderControl } from '../../../primitives/SliderControl';
import { ToggleSwitch } from '../../../primitives/ToggleSwitch';

export interface BoostNozzlesTabProps {
  descriptor: any;
  handleBoostNozzleChange?: (patch: Record<string, any>) => void;
  isLight: boolean;
  cardClass: string;
}

export const BoostNozzlesTab: React.FC<BoostNozzlesTabProps> = ({
  descriptor,
  handleBoostNozzleChange,
  isLight,
  cardClass,
}) => {
  return (
    <div className="flex flex-col gap-2.5">
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-[11px] text-amber-500">
            1. Per-Vehicle Dual Boost Exhaust Nozzle Offset ({descriptor.name})
          </span>
          <span className="text-[10px] font-mono opacity-75">Live Emitter Sync</span>
        </div>

        <SliderControl
          label="Nozzle X (Rear Longitudinal)"
          value={descriptor.boostNozzleParams.x}
          min={-80}
          max={-35}
          step={0.1}
          unit=" uu"
          onChange={(x) => handleBoostNozzleChange?.({ x })}
          isLight={isLight}
        />
        <SliderControl
          label="Nozzle Y (Vertical Height)"
          value={descriptor.boostNozzleParams.y}
          min={-10}
          max={30}
          step={0.1}
          unit=" uu"
          onChange={(y) => handleBoostNozzleChange?.({ y })}
          isLight={isLight}
        />
        <SliderControl
          label="Nozzle Z (Lateral Dual Spread)"
          value={descriptor.boostNozzleParams.z}
          min={0}
          max={35}
          step={0.1}
          unit=" uu"
          onChange={(z) => handleBoostNozzleChange?.({ z })}
          isLight={isLight}
        />

        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[11px]">Follow Chassis Center Offset</span>
          <ToggleSwitch
            checked={Boolean(descriptor.boostNozzleParams.followChassisOffset)}
            onChange={(followChassisOffset) => handleBoostNozzleChange?.({ followChassisOffset })}
            isLight={isLight}
          />
        </div>

        <div
          className={`p-2 rounded-lg border font-mono text-[10px] ${
            isLight ? 'bg-white border-neutral-200' : 'bg-neutral-950/60 border-neutral-800'
          }`}
        >
          <div className="opacity-70 mb-0.5">Resolved Emitter World Offsets (uu):</div>
          <div>Left Nozzle: [{descriptor.boostOutlets[0]?.join(', ')}]</div>
          <div>Right Nozzle: [{descriptor.boostOutlets[1]?.join(', ')}]</div>
        </div>
      </div>
    </div>
  );
};
