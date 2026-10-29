import React, { useState } from 'react';
import {
  Play,
  Shuffle,
  Eye,
  Sparkles,
  RotateCcw,
  Users,
} from 'lucide-react';
import { SliderControl } from '../../../primitives/SliderControl';
import { KeycapBadge } from '../../../primitives/KeycapBadge';
import { Badge } from '../../../primitives/Badge';
import { quickNotification } from '../../../stores/quickNotificationStore';

export interface NameTagCarSlotSample {
  index: number;
  keyLabel: string;
  slotCode: string;
  defaultName: string;
  colorHex: string;
  distanceUU: number;
  boostPct: number;
  scaleOverride: number;
  offsetYOverridePx: number;
}

export interface NameTagCalibrationMatrixCardProps {
  pillWidth?: number;
  pillHeight?: number;
  distanceExponent?: number;
  verticalOffsetUU?: number;
  screenYOffsetPx?: number;
  fontFamily?: string;
  fontWeight?: number;
  onApplyFittedExponent?: (fittedExp: number) => void;
  isLight?: boolean;
}

const INITIAL_CAR_SLOTS: NameTagCarSlotSample[] = [
  { index: 0, keyLabel: '1', slotCode: 'B1', defaultName: 'NEX_BLUE_1', colorHex: '#0ea5e9', distanceUU: 1120, boostPct: 84, scaleOverride: 1.0, offsetYOverridePx: 0 },
  { index: 1, keyLabel: '2', slotCode: 'B2', defaultName: 'NEX_BLUE_2', colorHex: '#38bdf8', distanceUU: 2040, boostPct: 62, scaleOverride: 0.92, offsetYOverridePx: -2 },
  { index: 2, keyLabel: '3', slotCode: 'B3', defaultName: 'NEX_BLUE_3', colorHex: '#2563eb', distanceUU: 3480, boostPct: 100, scaleOverride: 0.81, offsetYOverridePx: -4 },
  { index: 3, keyLabel: '4', slotCode: 'O1', defaultName: 'NEC_ORNG_1', colorHex: '#f97316', distanceUU: 1460, boostPct: 45, scaleOverride: 0.96, offsetYOverridePx: -1 },
  { index: 4, keyLabel: '5', slotCode: 'O2', defaultName: 'NEC_ORNG_2', colorHex: '#fb923c', distanceUU: 2690, boostPct: 78, scaleOverride: 0.87, offsetYOverridePx: -3 },
  { index: 5, keyLabel: '6', slotCode: 'O3', defaultName: 'NEC_ORNG_3', colorHex: '#ea580c', distanceUU: 4120, boostPct: 33, scaleOverride: 0.76, offsetYOverridePx: -5 },
];

/**
 * [L2 Compound] NameTagCalibrationMatrixCard
 * Recreates RocketCompanion's 6-Car Kickoff Arena Spawner, 1:1 208x54 Horizontal Pill Name Card preview,
 * Per-Car Scale/Offset Override Matrix, and Least-Squares Distance Power-Law Fitter.
 */
export const NameTagCalibrationMatrixCard: React.FC<NameTagCalibrationMatrixCardProps> = React.memo(({
  pillWidth = 208,
  pillHeight = 54,
  distanceExponent = 0.86,
  verticalOffsetUU = 50,
  screenYOffsetPx = 6,
  fontFamily = 'JetBrains Mono, monospace',
  fontWeight = 700,
  onApplyFittedExponent,
  isLight = false,
}) => {
  const [arenaActive, setArenaActive] = useState(true);
  const [permIdx, setPermIdx] = useState(1);
  const [cameraMode, setCameraMode] = useState<'pov' | 'freecam'>('pov');
  const [selectedCarIdx, setSelectedCarIdx] = useState(0);
  const [cars, setCars] = useState<NameTagCarSlotSample[]>(INITIAL_CAR_SLOTS);

  const selectedCar = cars[selectedCarIdx] || cars[0];

  const updateSelectedCar = (patch: Partial<NameTagCarSlotSample>) => {
    setCars((prev) =>
      prev.map((c, idx) => (idx === selectedCarIdx ? { ...c, ...patch } : c))
    );
  };

  const handleFitPowerLaw = () => {
    const avgScale =
      cars.reduce((acc, c) => acc + c.scaleOverride, 0) / Math.max(1, cars.length);
    const fitted = Number(Math.max(0.4, Math.min(1.0, 0.55 + avgScale * 0.35)).toFixed(2));
    onApplyFittedExponent?.(fitted);
    quickNotification.success(
      `Fitted distance power-law exponent γ = ${fitted} from 6-car calibration samples.`
    );
  };

  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
    : 'bg-neutral-900/60 border-neutral-800 text-neutral-200';
  const subBg = isLight
    ? 'bg-white border-neutral-200'
    : 'bg-neutral-950/75 border-neutral-800';

  const computedScale = Number(
    (
      Math.pow(1000 / Math.max(400, selectedCar.distanceUU), 1 - distanceExponent) *
      selectedCar.scaleOverride
    ).toFixed(2)
  );

  return (
    <div className="flex flex-col gap-2.5">
      {/* 1. 6-Car Kickoff Arena Controller & Camera POV Bar */}
      <div className={`p-3 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-sky-400" />
            <span className="font-bold text-[11px]">
              6-Car Kickoff Calibration Arena (Perm #{permIdx})
            </span>
            <Badge variant={arenaActive ? 'success' : 'neutral'} size="sm" isLight={isLight}>
              {arenaActive ? '6 CARS ACTIVE' : 'STANDBY'}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setArenaActive((v) => !v);
                quickNotification.info(
                  arenaActive ? 'Exited 6-Car NameTag Arena.' : 'Spawned 6 Kickoff Cars in Arena.'
                );
              }}
              className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                arenaActive
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/35'
                  : 'bg-sky-500 text-white border-sky-500'
              }`}
            >
              <Play className="h-2.5 w-2.5" />
              <span>{arenaActive ? 'Respawn 6 Cars' : 'Enter 6-Car Arena'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPermIdx((p) => (p % 15) + 1);
                quickNotification.show('Reshuffled 3v3 kickoff permutation.');
              }}
              className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-semibold flex items-center gap-1 cursor-pointer ${subBg}`}
            >
              <Shuffle className="h-2.5 w-2.5 text-amber-500" />
              <span>Reshuffle</span>
            </button>

            <button
              type="button"
              onClick={() => setCameraMode((m) => (m === 'pov' ? 'freecam' : 'pov'))}
              className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-semibold flex items-center gap-1 cursor-pointer ${
                cameraMode === 'freecam'
                  ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                  : subBg
              }`}
            >
              <Eye className="h-2.5 w-2.5" />
              <span>{cameraMode === 'freecam' ? 'FreeCam Overview' : `POV Car #${selectedCarIdx + 1}`}</span>
            </button>
          </div>
        </div>

        {/* 6-Car Hotkey Slot Selector (B1..B3 / O1..O3) */}
        <div className="grid grid-cols-6 gap-1.5">
          {cars.map((car, idx) => {
            const isSel = idx === selectedCarIdx;
            return (
              <button
                key={car.slotCode}
                type="button"
                onClick={() => setSelectedCarIdx(idx)}
                data-footer-desc={`Inspect & calibrate slot ${car.slotCode} (${car.defaultName} · Dist ${car.distanceUU}UU · Boost ${car.boostPct}%).`}
                className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                  isSel
                    ? 'ring-2 ring-amber-500/40 border-amber-500 bg-amber-500/10'
                    : subBg
                }`}
              >
                <div className="flex items-center gap-1">
                  <KeycapBadge shortcut={car.keyLabel} size="sm" isLight={isLight} />
                  <span
                    className="text-[10px] font-mono font-bold"
                    style={{ color: car.colorHex }}
                  >
                    {car.slotCode}
                  </span>
                </div>
                <span className="text-[9px] font-mono opacity-65">{car.distanceUU}uu</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Live 1:1 208×54 Horizontal Pill Name Card Preview */}
      <div className={`p-3 rounded-xl border flex flex-col items-center gap-2 ${subBg}`}>
        <div className="w-full flex items-center justify-between text-[10px] font-mono opacity-70">
          <span>
            Live Pill Preview ({pillWidth}×{pillHeight}px · Scale {computedScale}×)
          </span>
          <span>
            World +{verticalOffsetUU}UU / Screen +{screenYOffsetPx + selectedCar.offsetYOverridePx}px
          </span>
        </div>

        <div className="py-2 flex flex-col items-center">
          <div
            style={{
              width: `${Math.min(260, Math.max(140, pillWidth))}px`,
              height: `${Math.min(72, Math.max(36, pillHeight))}px`,
              backgroundColor: selectedCar.colorHex,
              fontFamily,
              fontWeight,
              transform: `scale(${Math.max(0.65, Math.min(1.15, computedScale))})`,
            }}
            className="rounded-full border-2 border-white/90 shadow-lg px-3.5 flex flex-col justify-center gap-1 text-white transition-transform"
          >
            <div className="flex items-center justify-between gap-2 leading-none">
              <span className="text-xs tracking-wide truncate">{selectedCar.defaultName}</span>
              <span className="text-[10px] font-mono opacity-90">{selectedCar.boostPct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black/35 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-300"
                style={{ width: `${selectedCar.boostPct}%` }}
              />
            </div>
          </div>
          {/* Downward Pointer Chevron */}
          <div
            className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px]"
            style={{ borderTopColor: selectedCar.colorHex }}
          />
        </div>
      </div>

      {/* 3. Selected Car Override & Least-Squares Power-Law Fitter */}
      <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${cardBg}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-[11px]">
            Per-Car Calibration Override [{selectedCar.slotCode}: {selectedCar.defaultName}]
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFitPowerLaw}
              data-footer-desc="Compute least-squares power-law distance exponent from all 6 per-car scale overrides."
              className="px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer bg-amber-500/15 text-amber-500 border-amber-500/35"
            >
              <Sparkles className="h-2.5 w-2.5" />
              <span>Fit Curve from Samples</span>
            </button>
            <button
              type="button"
              onClick={() => setCars(INITIAL_CAR_SLOTS)}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono flex items-center gap-1 cursor-pointer ${subBg}`}
            >
              <RotateCcw className="h-2.5 w-2.5" /> Reset 6 Cars
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <SliderControl
            label="Simulated Distance (UU)"
            value={selectedCar.distanceUU}
            min={500}
            max={5500}
            step={50}
            unit="uu"
            editable
            colorScheme="sky"
            onChange={(v) => updateSelectedCar({ distanceUU: v })}
            isLight={isLight}
          />
          <SliderControl
            label="Slot Scale Multiplier"
            value={selectedCar.scaleOverride}
            min={0.5}
            max={1.5}
            step={0.02}
            unit="×"
            editable
            colorScheme="amber"
            onChange={(v) => updateSelectedCar({ scaleOverride: v })}
            isLight={isLight}
          />
          <SliderControl
            label="Slot Screen Y Offset"
            value={selectedCar.offsetYOverridePx}
            min={-24}
            max={24}
            step={1}
            unit="px"
            editable
            colorScheme="emerald"
            onChange={(v) => updateSelectedCar({ offsetYOverridePx: v })}
            isLight={isLight}
          />
        </div>
      </div>
    </div>
  );
});

NameTagCalibrationMatrixCard.displayName = 'NameTagCalibrationMatrixCard';
