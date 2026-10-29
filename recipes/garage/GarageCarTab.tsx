import React from 'react';
import { Check, Sliders } from 'lucide-react';
import { Badge } from '../../primitives/Badge';
import { floatingStore } from '../../stores/floatingStore';
import { VEHICLE_MODEL_OFFSET_TUNER_PRESET } from '../../stores/floatingPresets';
import { CARS } from './garageConstants';

export interface GarageCarTabProps {
  selectedCar: string;
  onSelectCar: (carId: string) => void;
  onHoverDesc?: (desc: string | null) => void;
  isLight?: boolean;
}

export const GarageCarTab: React.FC<GarageCarTabProps> = ({
  selectedCar,
  onSelectCar,
  onHoverDesc,
  isLight = false,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${isLight ? 'text-neutral-700' : 'text-neutral-300'}`}>
          Active Chassis Preset: <strong className="text-amber-500 font-bold uppercase">{selectedCar}</strong>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              const containerEl =
                (typeof document !== 'undefined' &&
                  document.getElementById('game-ui-viewport-host')) ||
                (typeof document !== 'undefined' ? document.body : null);
              if (containerEl) {
                floatingStore.spawnWithFlight(
                  VEHICLE_MODEL_OFFSET_TUNER_PRESET,
                  e.currentTarget,
                  containerEl
                );
              } else {
                floatingStore.spawnWindow({
                  ...VEHICLE_MODEL_OFFSET_TUNER_PRESET,
                  startMinimized: true,
                });
              }
            }}
            onMouseEnter={() =>
              onHoverDesc?.('Spawn Vehicle Model & Offset Tuner floating window into the stack.')
            }
            onMouseLeave={() => onHoverDesc?.(null)}
            className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              isLight
                ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-700'
                : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
            }`}
            title="Spawn Vehicle Model & Offset Tuner into Stack"
          >
            <Sliders className="h-3 w-3" />
            <span>Model & Offset Tuner</span>
          </button>
          <span className="text-[11px] font-mono opacity-70">
            7 Standard Models • Click to Equip
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {CARS.map((car) => {
          const isSelected = selectedCar === car.id;
          return (
            <button
              key={car.id}
              type="button"
              onClick={() => onSelectCar(car.id)}
              onMouseEnter={() =>
                onHoverDesc?.(`Equip ${car.name} chassis (${car.hitbox} Hitbox geometry).`)
              }
              onMouseLeave={() => onHoverDesc?.(null)}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer relative min-h-[76px] gap-1.5 ${
                isSelected
                  ? isLight
                    ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/40 text-neutral-900 shadow-xs'
                    : 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/50 text-white shadow-md'
                  : isLight
                  ? 'bg-neutral-50 hover:bg-white border-neutral-200/90 text-neutral-800'
                  : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700/80 text-neutral-200'
              }`}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
              )}
              <span className="font-bold text-xs truncate max-w-full">
                {car.name}
              </span>
              <Badge
                variant={isSelected ? 'amber' : 'neutral'}
                size="sm"
                isLight={isLight}
              >
                {car.hitbox}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
};
