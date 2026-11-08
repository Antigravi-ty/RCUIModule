import React from 'react';
import { Crosshair, Play, Repeat, Volume2 } from 'lucide-react';
import {
  DEMOLITION_SIM_COORDINATE_PRESETS,
  triggerDemolitionShockwaveSimulation,
  updateDemolitionShockwaveConfig,
  type DemolitionShockwaveConfig,
} from '../../../config/demolitionShockwaveConfig';
import { Button } from '../../../primitives/Button';
import { SliderControl } from '../../../primitives/SliderControl';
import { ToggleSwitch } from '../../../primitives/ToggleSwitch';

export interface DemolitionCoordinateSimulatorSectionProps {
  cfg: DemolitionShockwaveConfig;
  isLight: boolean;
}

export const DemolitionCoordinateSimulatorSection: React.FC<
  DemolitionCoordinateSimulatorSectionProps
> = ({ cfg, isLight }) => {
  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-900'
    : 'bg-neutral-900/60 border-neutral-700/60 text-neutral-100';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const handleTriggerNow = () => {
    triggerDemolitionShockwaveSimulation({
      x: cfg.simTargetX,
      y: cfg.simTargetY,
      z: cfg.simTargetZ,
      playAudio: cfg.simPlayAudio,
    });
  };

  const handleSelectCoordPreset = (x: number, y: number, z: number) => {
    updateDemolitionShockwaveConfig({
      simTargetX: x,
      simTargetY: y,
      simTargetZ: z,
    });
    triggerDemolitionShockwaveSimulation({
      x,
      y,
      z,
      playAudio: cfg.simPlayAudio,
    });
  };

  return (
    <div className={`p-2.5 rounded-xl border flex flex-col gap-2 shrink-0 ${cardBg}`}>
      <div className="flex items-center justify-between border-b border-neutral-500/20 pb-1">
        <span className="font-bold text-[11px] text-rose-400 flex items-center gap-1.5">
          <Crosshair className="h-3.5 w-3.5" />
          <span>1. Coordinate Explosion Simulator</span>
        </span>
        <span className="font-mono text-[10px] opacity-80">
          XYZ: ({cfg.simTargetX}, {cfg.simTargetY}, {cfg.simTargetZ}) UU
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
        <Button
          variant="primary"
          size="sm"
          onClick={handleTriggerNow}
          isLight={isLight}
          className="gap-1.5 py-1.5 text-[11px] font-semibold"
        >
          <Play className="h-3.5 w-3.5" />
          <span>Simulate Explosion at XYZ</span>
        </Button>

        <div className="flex items-center justify-between px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10">
          <div className="flex items-center gap-1.5">
            <Repeat className="h-3.5 w-3.5 text-rose-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-rose-400">Auto-Loop Pulse</span>
              <span className={`text-[9px] ${mutedText}`}>Every {cfg.simRepeatIntervalSec}s</span>
            </div>
          </div>
          <ToggleSwitch
            checked={Boolean(cfg.simAutoRepeat)}
            onCheckedChange={(simAutoRepeat) =>
              updateDemolitionShockwaveConfig({ simAutoRepeat })
            }
            isLight={isLight}
          />
        </div>
      </div>

      {/* Quick Arena Coordinate Presets */}
      <div className="flex flex-col gap-1">
        <span className={`text-[10px] font-semibold ${mutedText}`}>
          Quick Arena Coordinate Presets (Click to Move &amp; Detonate)
        </span>
        <div className="grid grid-cols-3 gap-1">
          {DEMOLITION_SIM_COORDINATE_PRESETS.map((preset) => {
            const isSelected =
              cfg.simTargetX === preset.x &&
              cfg.simTargetY === preset.y &&
              cfg.simTargetZ === preset.z;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectCoordPreset(preset.x, preset.y, preset.z)}
                className={`px-2 py-1 rounded-lg border text-left font-mono text-[9.5px] transition-all cursor-pointer truncate ${
                  isSelected
                    ? isLight
                      ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold'
                      : 'bg-rose-500/20 border-rose-400 text-rose-100 font-bold'
                    : isLight
                      ? 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700'
                      : 'bg-neutral-800/70 border-neutral-700 hover:border-neutral-600 text-neutral-300'
                }`}
                title={preset.label}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom X, Y, Z Coordinates */}
      <SliderControl
        label="Target Coordinate X (Left -4096 ↔ Right +4096)"
        value={cfg.simTargetX}
        min={-4000}
        max={4000}
        step={50}
        unit=" UU"
        editable={true}
        allowOutOfBoundsInput={true}
        onChange={(simTargetX) => updateDemolitionShockwaveConfig({ simTargetX })}
        isLight={isLight}
      />

      <SliderControl
        label="Target Coordinate Y (Blue -5120 ↔ Orange +5120)"
        value={cfg.simTargetY}
        min={-5000}
        max={5000}
        step={50}
        unit=" UU"
        editable={true}
        allowOutOfBoundsInput={true}
        onChange={(simTargetY) => updateDemolitionShockwaveConfig({ simTargetY })}
        isLight={isLight}
      />

      <SliderControl
        label="Target Coordinate Z (Ground 17 ↔ Ceiling 2044)"
        value={cfg.simTargetZ}
        min={17}
        max={2000}
        step={10}
        unit=" UU"
        editable={true}
        allowOutOfBoundsInput={true}
        onChange={(simTargetZ) => updateDemolitionShockwaveConfig({ simTargetZ })}
        isLight={isLight}
      />

      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <SliderControl
          label="Auto-Loop Interval"
          value={cfg.simRepeatIntervalSec}
          min={0.3}
          max={4.0}
          step={0.1}
          unit="s"
          editable={true}
          onChange={(simRepeatIntervalSec) =>
            updateDemolitionShockwaveConfig({ simRepeatIntervalSec })
          }
          isLight={isLight}
        />

        <div className="flex items-center justify-between px-2.5 py-1 rounded-lg border border-neutral-500/20">
          <div className="flex items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-medium">Play Demo SFX</span>
          </div>
          <ToggleSwitch
            checked={Boolean(cfg.simPlayAudio)}
            onCheckedChange={(simPlayAudio) =>
              updateDemolitionShockwaveConfig({ simPlayAudio })
            }
            isLight={isLight}
          />
        </div>
      </div>
    </div>
  );
};
