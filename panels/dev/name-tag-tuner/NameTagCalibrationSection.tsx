import React, { useState } from 'react';
import {
  Play,
  Shuffle,
  XCircle,
  Eye,
  Copy,
  Check,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  computeFittedParametersFromSamples,
  formatNameTagDisplayText,
  type NameTagCarOverride,
  type NameTagConfig,
  type NameTagTelemetrySnapshot,
} from '../../../config/nameTagConfig';
import { Button } from '../../../primitives/Button';
import { SliderControl } from '../../../primitives/SliderControl';
import { ToggleSwitch } from '../../../primitives/ToggleSwitch';
import { KeycapBadge } from '../../../primitives/KeycapBadge';

export const CAR_SLOT_BADGES = [
  { index: 0, keyLabel: '1', slotCode: 'B1', colorHex: '#0ea5e9' },
  { index: 1, keyLabel: '2', slotCode: 'B2', colorHex: '#38bdf8' },
  { index: 2, keyLabel: '3', slotCode: 'B3', colorHex: '#2563eb' },
  { index: 3, keyLabel: '4', slotCode: 'O1', colorHex: '#f97316' },
  { index: 4, keyLabel: '5', slotCode: 'O2', colorHex: '#fb923c' },
  { index: 5, keyLabel: '6', slotCode: 'O3', colorHex: '#ea580c' },
];

export interface NameTagCalibrationSectionProps {
  config: NameTagConfig;
  telemetry: NameTagTelemetrySnapshot;
  isTunerArenaActive: boolean;
  kickoffPermutationIndex: number;
  effectiveCameraMode: string;
  isPovMode: boolean;
  effectiveFocusedCarIndex: number;
  focusedSlotCode: string;
  selectedCalibrationCarIndex: number;
  isLight: boolean;
  updateConfig: (partial: Partial<NameTagConfig>) => void;
  selectCalibrationCar: (carIndex: number) => void;
  updateCarOverride: (carIndex: number, partial: Partial<NameTagCarOverride>) => void;
  resetCarOverride: (carIndex: number) => void;
  resetAllCarOverrides: () => void;
  applyFittedFromCarOverrides: () => void;
  exportCalibrationJson: () => string;
  enterTunerArenaAndSpawnSixCars: () => void;
  exitTunerArena: () => void;
  reshuffleKickoffPositions: () => void;
  selectPovCar: (carIndex: number) => void;
  focusFreeCamOverview: () => void;
}

export const NameTagCalibrationSection: React.FC<NameTagCalibrationSectionProps> = ({
  config,
  telemetry,
  isTunerArenaActive,
  kickoffPermutationIndex,
  effectiveCameraMode,
  isPovMode,
  effectiveFocusedCarIndex,
  focusedSlotCode,
  selectedCalibrationCarIndex,
  isLight,
  updateConfig,
  selectCalibrationCar,
  updateCarOverride,
  resetCarOverride,
  resetAllCarOverrides,
  applyFittedFromCarOverrides,
  exportCalibrationJson,
  enterTunerArenaAndSpawnSixCars,
  exitTunerArena,
  reshuffleKickoffPositions,
  selectPovCar,
  focusFreeCamOverview,
}) => {
  const [copiedStatus, setCopiedStatus] = useState<'idle' | 'copied'>('idle');

  const activeCalibIndex = Math.max(0, Math.min(5, selectedCalibrationCarIndex || 0));
  const activeCalibSlot = CAR_SLOT_BADGES[activeCalibIndex] || CAR_SLOT_BADGES[0];
  const activeCarOverride = config.carOverrides?.[activeCalibIndex] || {
    enabled: false,
    scaleMultiplier: 1.0,
    worldOffsetUu: config.verticalOffsetUu,
    screenOffsetPx: config.screenVerticalOffsetPx,
  };
  const activeCarTelemetry =
    telemetry.cars?.find((entry) => entry.carIndex === activeCalibIndex) || null;
  const enabledOverrideCount = (config.carOverrides || []).filter(
    (entry) => entry?.enabled
  ).length;
  const fittedPreview = computeFittedParametersFromSamples();

  const cardBackground = isLight
    ? 'bg-neutral-50/95 border-neutral-200/90 text-neutral-800 shadow-2xs'
    : 'bg-neutral-850/60 border-neutral-700/60 text-neutral-200';
  const subCardBackground = isLight
    ? 'bg-white border-neutral-200 text-neutral-800'
    : 'bg-neutral-950/40 border-neutral-700/50 text-neutral-200';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';
  const dividerBorder = isLight ? 'border-neutral-200' : 'border-neutral-700/40';

  const truncatePreview = (rawName: string) =>
    formatNameTagDisplayText(rawName, config.maxChars);

  const handleCopyCalibrationJson = async () => {
    const jsonText = exportCalibrationJson();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(jsonText);
      } else if (typeof document !== 'undefined') {
        const tempArea = document.createElement('textarea');
        tempArea.value = jsonText;
        tempArea.style.position = 'fixed';
        tempArea.style.opacity = '0';
        document.body.appendChild(tempArea);
        tempArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempArea);
      }
      setCopiedStatus('copied');
      window.setTimeout(() => setCopiedStatus('idle'), 2200);
    } catch {
      setCopiedStatus('copied');
      window.setTimeout(() => setCopiedStatus('idle'), 2200);
    }
  };

  return (
    <>
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBackground}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                isTunerArenaActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-bold text-xs truncate">
              {isTunerArenaActive
                ? `6-Car Kickoff Arena Active (Formation #${kickoffPermutationIndex + 1})`
                : 'Stadium Evaluation Standby (Calibrated Preset)'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] ${mutedText}`}>Enabled</span>
            <ToggleSwitch
              checked={config.enabled}
              onChange={(nextEnabled) => updateConfig({ enabled: nextEnabled })}
              isLight={isLight}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="primary"
            size="sm"
            onClick={
              isTunerArenaActive ? focusFreeCamOverview : enterTunerArenaAndSpawnSixCars
            }
            isLight={isLight}
            className="flex-1 gap-1.5 py-1.5 text-[11px] font-semibold justify-center"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>
              {isTunerArenaActive
                ? 'FreeCam Overview [0]'
                : 'Enter Arena & Spawn 6 Kickoff Cars'}
            </span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={reshuffleKickoffPositions}
            isLight={isLight}
            className="gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold"
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span>Reshuffle Kickoff</span>
          </Button>

          {isTunerArenaActive && (
            <Button
              variant="secondary"
              size="sm"
              onClick={exitTunerArena}
              isLight={isLight}
              className={`gap-1 px-2 py-1.5 text-[11px] font-semibold ${
                isLight ? 'text-rose-600' : 'text-rose-400'
              }`}
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Exit</span>
            </Button>
          )}
        </div>

        <div className={`pt-1 border-t flex flex-col gap-1.5 ${dividerBorder}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-[11px] flex items-center gap-1.5">
              <Eye
                className={`h-3.5 w-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`}
              />
              <span>Camera Mode &amp; POV Switcher (Keys 1–6)</span>
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                isPovMode
                  ? isLight
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-700'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : isLight
                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-700'
                    : 'bg-sky-500/15 border-sky-500/40 text-sky-400'
              }`}
            >
              {isPovMode
                ? `POV · ${focusedSlotCode} (${truncatePreview(
                    config.previewNames[effectiveFocusedCarIndex] || ''
                  )})`
                : `CAMERA: ${effectiveCameraMode.toUpperCase()}`}
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1">
            {CAR_SLOT_BADGES.map((slot) => {
              const isSelected =
                isTunerArenaActive &&
                isPovMode &&
                effectiveFocusedCarIndex === slot.index;
              return (
                <button
                  key={slot.index}
                  type="button"
                  onClick={() => selectPovCar(slot.index)}
                  title={`Switch to ${slot.slotCode} POV (Key ${slot.keyLabel})`}
                  className={`px-1.5 py-1 rounded-lg border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-amber-500/20 border-amber-500 text-amber-900 font-bold shadow-2xs'
                        : 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                      : isLight
                        ? 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                        : 'bg-neutral-900/70 hover:bg-neutral-800 border-neutral-700/70 text-neutral-300'
                  }`}
                >
                  <KeycapBadge label={slot.keyLabel} size="sm" isLight={isLight} />
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: slot.colorHex }}
                  />
                  <span className="text-[10px] font-mono">{slot.slotCode}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBackground}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-[11px] flex items-center gap-1.5">
            <Sliders
              className={`h-3.5 w-3.5 ${
                isLight ? 'text-emerald-600' : 'text-emerald-400'
              }`}
            />
            <span>Per-Car Independent Calibration &amp; Export</span>
          </span>
          <div className="flex items-center gap-1.5">
            {enabledOverrideCount > 0 && (
              <button
                type="button"
                onClick={resetAllCarOverrides}
                className={`text-[10px] font-mono hover:underline cursor-pointer ${
                  isLight ? 'text-rose-600' : 'text-rose-400'
                }`}
              >
                Clear All ({enabledOverrideCount})
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyCalibrationJson}
              className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                copiedStatus === 'copied'
                  ? isLight
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700'
                    : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : isLight
                    ? 'bg-sky-500/10 border-sky-500/40 text-sky-700 hover:bg-sky-500/20'
                    : 'bg-sky-500/15 border-sky-500/40 text-sky-300 hover:bg-sky-500/25'
              }`}
            >
              {copiedStatus === 'copied' ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Copied JSON!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy Calibration JSON</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-1">
          {CAR_SLOT_BADGES.map((slot) => {
            const isTarget = activeCalibIndex === slot.index;
            const hasOverride = Boolean(config.carOverrides?.[slot.index]?.enabled);
            const carTel = telemetry.cars?.find((c) => c.carIndex === slot.index);
            const depthLabel = carTel
              ? `${Math.round(carTel.activeDepthUu)}u`
              : slot.slotCode;
            return (
              <button
                key={slot.index}
                type="button"
                onClick={() => selectCalibrationCar(slot.index)}
                title={`Select ${slot.slotCode} for independent calibration (does not switch camera)`}
                className={`px-1 py-1 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  isTarget
                    ? isLight
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 font-bold shadow-2xs'
                      : 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-sm'
                    : hasOverride
                      ? isLight
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-800'
                        : 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : isLight
                        ? 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                        : 'bg-neutral-900/70 hover:bg-neutral-800 border-neutral-700/70 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: slot.colorHex }}
                  />
                  <span className="text-[10px] font-mono">{slot.slotCode}</span>
                  {hasOverride && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  )}
                </div>
                <span className={`text-[9px] font-mono ${mutedText}`}>{depthLabel}</span>
              </button>
            );
          })}
        </div>

        <div className={`p-2 rounded-lg border flex flex-col gap-1.5 ${subCardBackground}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: activeCalibSlot.colorHex }}
              />
              <span className="font-mono font-bold text-[11px] truncate">
                Target: {activeCalibSlot.slotCode} (
                {truncatePreview(config.previewNames[activeCalibIndex] || '')})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeCarOverride.enabled && (
                <button
                  type="button"
                  onClick={() => resetCarOverride(activeCalibIndex)}
                  className={`text-[10px] font-mono hover:underline cursor-pointer ${
                    isLight ? 'text-amber-700' : 'text-amber-400'
                  }`}
                >
                  Reset {activeCalibSlot.slotCode}
                </button>
              )}
              <span className={`text-[10px] ${mutedText}`}>Override</span>
              <ToggleSwitch
                checked={activeCarOverride.enabled}
                onChange={(nextEnabled) =>
                  updateCarOverride(activeCalibIndex, { enabled: nextEnabled })
                }
                isLight={isLight}
              />
            </div>
          </div>

          {activeCarTelemetry ? (
            <div
              className={`grid grid-cols-3 gap-1 text-[10px] font-mono p-1.5 rounded border ${
                isLight
                  ? 'bg-neutral-100/90 border-neutral-200 text-neutral-800'
                  : 'bg-neutral-900/70 border-neutral-800 text-neutral-200'
              }`}
            >
              <div>
                <span className={mutedText}>View-Z: </span>
                <span
                  className={`font-semibold ${
                    isLight ? 'text-sky-700' : 'text-sky-300'
                  }`}
                >
                  {Math.round(activeCarTelemetry.viewZDepthUu)} UU
                </span>
              </div>
              <div>
                <span className={mutedText}>3D Dist: </span>
                <span>{Math.round(activeCarTelemetry.euclideanDistanceUu)} UU</span>
              </div>
              <div>
                <span className={mutedText}>Angle: </span>
                <span>{activeCarTelemetry.offAxisAngleDeg.toFixed(1)}°</span>
              </div>
              <div>
                <span className={mutedText}>Screen: </span>
                <span
                  className={`font-semibold ${
                    isLight ? 'text-emerald-700' : 'text-emerald-300'
                  }`}
                >
                  {activeCarTelemetry.screenPillWidthPx.toFixed(1)}×
                  {activeCarTelemetry.screenPillHeightPx.toFixed(1)}px
                </span>
              </div>
              <div>
                <span className={mutedText}>Scale×: </span>
                <span>{activeCarTelemetry.effectiveScaleMultiplier.toFixed(2)}x</span>
              </div>
              <div>
                <span className={mutedText}>Total Y: </span>
                <span>{Math.round(activeCarTelemetry.totalWorldVerticalOffsetUu)} UU</span>
              </div>
            </div>
          ) : (
            <div className={`text-[10px] font-mono ${mutedText}`}>
              Enter the 6-Car Arena to stream live distance, depth, and screen pixel telemetry.
            </div>
          )}

          <SliderControl
            label={`${activeCalibSlot.slotCode} Scale Multiplier`}
            value={activeCarOverride.scaleMultiplier}
            min={0.2}
            max={3.0}
            step={0.01}
            unit="x"
            onChange={(nextValue) =>
              updateCarOverride(activeCalibIndex, {
                enabled: true,
                scaleMultiplier: nextValue,
              })
            }
            isLight={isLight}
          />
          <SliderControl
            label={`${activeCalibSlot.slotCode} 3D World Offset (Car Relative)`}
            value={activeCarOverride.worldOffsetUu}
            min={0}
            max={360}
            step={2}
            unit="UU"
            onChange={(nextValue) =>
              updateCarOverride(activeCalibIndex, {
                enabled: true,
                worldOffsetUu: nextValue,
              })
            }
            isLight={isLight}
          />
          <SliderControl
            label={`${activeCalibSlot.slotCode} 2D Screen Offset (Viewport Relative)`}
            value={activeCarOverride.screenOffsetPx}
            min={-60}
            max={160}
            step={1}
            unit="px"
            onChange={(nextValue) =>
              updateCarOverride(activeCalibIndex, {
                enabled: true,
                screenOffsetPx: nextValue,
              })
            }
            isLight={isLight}
          />

          <div
            className={`flex items-center justify-between gap-2 pt-1 border-t ${dividerBorder}`}
          >
            <span className={`text-[10px] font-mono ${mutedText} truncate`}>
              Fit Preview: Scale {fittedPreview.cameraScaleFactor} · γ=
              {fittedPreview.distanceScaleExponent} · World {fittedPreview.verticalOffsetUu}
              UU · Screen {fittedPreview.screenVerticalOffsetPx}px
            </span>
            <button
              type="button"
              onClick={applyFittedFromCarOverrides}
              className={`px-2 py-0.5 rounded border text-[10px] font-mono font-semibold flex items-center gap-1 shrink-0 cursor-pointer ${
                isLight
                  ? 'border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800'
                  : 'border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>Apply Fit to Global</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
