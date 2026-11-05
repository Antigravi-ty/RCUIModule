import React from 'react';
import { RotateCcw, Sliders, Sparkles, X, Zap } from 'lucide-react';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import {
  type StaticTrainingVariationConfig,
  type StaticTrainingQuickVariationToggles,
  type KevpertPresetKey,
  KEVPERT_PRESET_KEYS,
  KEVPERT_LATEST_PRESETS,
  DEFAULT_QUICK_VARIATION_TOGGLES,
} from '../../config/staticTrainingVariationTypes';

export interface StaticTrainingVariationsModalProps {
  isLight: boolean;
  isOpen: boolean;
  onClose: () => void;
  toggles: StaticTrainingQuickVariationToggles;
  onUpdateToggles: (patch: Partial<StaticTrainingQuickVariationToggles>) => void;
  customVariation: StaticTrainingVariationConfig;
  onUpdateCustomVariation: (patch: Partial<StaticTrainingVariationConfig>) => void;
  onSelectKevpertPreset: (key: KevpertPresetKey) => void;
  packRecommendedVariation?: StaticTrainingVariationConfig | null;
  packTitle?: string;
}

interface RangePairInputRowProps {
  isLight: boolean;
  label: string;
  unit: string;
  value: [number, number];
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (next: [number, number]) => void;
}

const RangePairInputRow: React.FC<RangePairInputRowProps> = ({
  isLight,
  label,
  unit,
  value,
  step = 1,
  min = -2300,
  max = 2300,
  disabled = false,
  onChange,
}) => {
  return (
    <div
      className={`flex items-center justify-between gap-2 py-1 px-2 rounded-lg border text-xs ${
        disabled ? 'opacity-45 pointer-events-none' : ''
      } ${
        isLight
          ? 'bg-neutral-50 border-neutral-200/80 text-neutral-800'
          : 'bg-neutral-850/70 border-neutral-800 text-neutral-200'
      }`}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-semibold truncate">{label}</span>
        <span className="text-[9px] font-mono opacity-60">Min .. Max ({unit})</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={value[0]}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([Number.isFinite(v) ? v : 0, value[1]]);
          }}
          className={`w-16 px-1.5 py-0.5 rounded border text-right font-mono text-[11px] outline-none ${
            isLight
              ? 'bg-white border-neutral-300 text-neutral-900'
              : 'bg-neutral-900 border-neutral-700 text-neutral-100'
          }`}
        />
        <span className="text-[10px] opacity-50">..</span>
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={value[1]}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([value[0], Number.isFinite(v) ? v : 0]);
          }}
          className={`w-16 px-1.5 py-0.5 rounded border text-right font-mono text-[11px] outline-none ${
            isLight
              ? 'bg-white border-neutral-300 text-neutral-900'
              : 'bg-neutral-900 border-neutral-700 text-neutral-100'
          }`}
        />
      </div>
    </div>
  );
};

export const StaticTrainingVariationsModal: React.FC<StaticTrainingVariationsModalProps> =
  React.memo(
    ({
      isLight,
      isOpen,
      onClose,
      toggles,
      onUpdateToggles,
      customVariation,
      onUpdateCustomVariation,
      onSelectKevpertPreset,
      packRecommendedVariation,
      packTitle,
    }) => {
      if (!isOpen) return null;

      const activeDisplayVar = toggles.enableCustomVariationOverride
        ? customVariation
        : packRecommendedVariation || customVariation;

      const isUsingCustom = toggles.enableCustomVariationOverride;

      return (
        <div
          role="dialog"
          aria-label="Training Variations Configuration"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={onClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-[660px] max-h-[86vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
              isLight
                ? 'bg-white border-neutral-300 text-neutral-900'
                : 'bg-neutral-900 border-neutral-700 text-neutral-100'
            }`}
          >
            {/* Header */}
            <div
              className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
                isLight
                  ? 'bg-neutral-100/80 border-neutral-200'
                  : 'bg-neutral-950/60 border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-wider uppercase">
                    Training Variations (Experimental)
                  </span>
                  <span className="text-[10px] opacity-65">
                    {packRecommendedVariation
                      ? `Pack Recommended: ${packRecommendedVariation.label || packRecommendedVariation.presetKey || 'Active'} (${packTitle || 'Current Pack'})`
                      : `No embedded pack variance • Enable Custom Override or pick F3–F12 preset`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateToggles({ ...DEFAULT_QUICK_VARIATION_TOGGLES });
                  }}
                  title="Reset Quick Toggles to Defaults"
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold cursor-pointer ${
                    isLight
                      ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                      : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                  }`}
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-neutral-500/20 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 overflow-y-auto flex flex-col gap-3.5 text-xs">
              {/* 1. Master Override Toggle */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  isUsingCustom
                    ? isLight
                      ? 'bg-cyan-50/70 border-cyan-300'
                      : 'bg-cyan-950/30 border-cyan-500/40'
                    : isLight
                    ? 'bg-neutral-50 border-neutral-200'
                    : 'bg-neutral-850/80 border-neutral-800'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold">
                    Enable Custom Static Training Variance (User Global Override)
                  </span>
                  <span className="text-[10px] opacity-75">
                    {isUsingCustom
                      ? 'ON: Overrides pack metadata with your custom modifiers / selected F-key preset below.'
                      : packRecommendedVariation
                      ? `OFF (Default): Uses pack author's recommended variance (${packRecommendedVariation.presetKey || 'Embedded'}).`
                      : 'OFF (Default): Uses pack metadata variance if present, or zero variance if none.'}
                  </span>
                </div>
                <ToggleSwitch
                  checked={isUsingCustom}
                  onCheckedChange={(checked) =>
                    onUpdateToggles({ enableCustomVariationOverride: checked })
                  }
                  isLight={isLight}
                />
              </div>

              {/* 2. Quick Toggle Switches & Angular Velocity Controls */}
              <div
                className={`p-3 rounded-xl border flex flex-col gap-2.5 ${
                  isLight
                    ? 'bg-neutral-50/80 border-neutral-200'
                    : 'bg-neutral-850/60 border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-400" />
                    Quick Difficulty & Spin Toggles
                  </span>
                  <span className="text-[10px] font-mono opacity-60">
                    Applies to both Recommended & Custom Variance
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* More Boost (0..100, clamped to 100 in arena) */}
                  <div
                    className={`p-2 rounded-lg border flex flex-col gap-1 ${
                      isLight
                        ? 'bg-white border-neutral-200'
                        : 'bg-neutral-900/80 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold">More Boost (+0..100)</span>
                      <span className="text-[11px] font-mono font-bold text-amber-400">
                        +{toggles.moreBoostAmount} (Max 100)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={toggles.moreBoostAmount}
                      onChange={(e) =>
                        onUpdateToggles({ moreBoostAmount: Number(e.target.value) || 0 })
                      }
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  {/* Disable Ball Variance */}
                  <div
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      isLight
                        ? 'bg-white border-neutral-200'
                        : 'bg-neutral-900/80 border-neutral-800'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold">Disable Ball Variance</span>
                      <span className="text-[9px] opacity-65">
                        Keep ball trajectory fixed while car varies
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={toggles.disableBallVariance}
                      onCheckedChange={(v) => onUpdateToggles({ disableBallVariance: v })}
                      isLight={isLight}
                      variant="neutral"
                    />
                  </div>

                  {/* Disable Vehicle Variance */}
                  <div
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      isLight
                        ? 'bg-white border-neutral-200'
                        : 'bg-neutral-900/80 border-neutral-800'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold">Disable Vehicle Variance</span>
                      <span className="text-[9px] opacity-65">
                        Keep car spawn & speed fixed while ball varies
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={toggles.disableVehicleVariance}
                      onCheckedChange={(v) => onUpdateToggles({ disableVehicleVariance: v })}
                      isLight={isLight}
                      variant="neutral"
                    />
                  </div>

                  {/* Only Disable RLRCSPack Angular Velocity (Default ON) */}
                  <div
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      isLight
                        ? 'bg-white border-neutral-200'
                        : 'bg-neutral-900/80 border-neutral-800'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold">
                        Disable RLRCSPack Angular Velocity
                      </span>
                      <span className="text-[9px] opacity-65">
                        Default ON: .Tem shots launch with 0 spin (authentic RL rebound)
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={toggles.disableRLRCSPackAngularVelocity}
                      onCheckedChange={(v) =>
                        onUpdateToggles({ disableRLRCSPackAngularVelocity: v })
                      }
                      isLight={isLight}
                      variant="neutral"
                    />
                  </div>
                </div>

                {/* Global Disable Random Angular Velocity */}
                <div
                  className={`p-2 rounded-lg border flex items-center justify-between ${
                    isLight
                      ? 'bg-white border-neutral-200'
                      : 'bg-neutral-900/80 border-neutral-800'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold">
                      Global Disable Random Angular Velocity (All Packs)
                    </span>
                    <span className="text-[9px] opacity-65">
                      Forces 0 initial ball spin across all native .RCSPack and .RLRCSPack packs
                    </span>
                  </div>
                  <ToggleSwitch
                    checked={toggles.disableAllRandomAngularVelocity}
                    onCheckedChange={(v) =>
                      onUpdateToggles({ disableAllRandomAngularVelocity: v })
                    }
                    isLight={isLight}
                    variant="neutral"
                  />
                </div>
              </div>

              {/* 3. Kevpert BakkesMod F-Key Presets */}
              <div
                className={`p-3 rounded-xl border flex flex-col gap-2 ${
                  isLight
                    ? 'bg-neutral-50/80 border-neutral-200'
                    : 'bg-neutral-850/60 border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-cyan-400" />
                    Kevpert BakkesMod Keybinding Presets
                  </span>
                  <span className="text-[10px] font-mono opacity-65">
                    Click to populate & enable override
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {KEVPERT_PRESET_KEYS.map((k) => {
                    const preset = KEVPERT_LATEST_PRESETS[k];
                    const isSelected =
                      isUsingCustom && customVariation.presetKey === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => onSelectKevpertPreset(k)}
                        title={preset.label}
                        className={`py-1.5 px-2 rounded-lg border text-center font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? isLight
                              ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                              : 'bg-cyan-400 border-cyan-300 text-neutral-950 shadow-xs'
                            : isLight
                            ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-800'
                            : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200'
                        }`}
                      >
                        <div>{k}</div>
                        <div className="text-[9px] font-normal opacity-75">
                          B:{preset.boostLimitOverride ?? 100}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[10px] font-mono opacity-70 truncate">
                  Active Spec: {activeDisplayVar.label || activeDisplayVar.presetKey || 'Custom'}
                </div>
              </div>

              {/* 4. Detailed Ball & Vehicle Modifiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 px-1">
                    Ball Variance Modifiers
                  </span>
                  <RangePairInputRow
                    isLight={isLight}
                    label="Ball Speed Modifier (%)"
                    unit="%"
                    step={0.1}
                    min={-100}
                    max={100}
                    disabled={!isUsingCustom}
                    value={activeDisplayVar.ballSpeedModifierPct}
                    onChange={(val) =>
                      onUpdateCustomVariation({ ballSpeedModifierPct: val })
                    }
                  />
                  <RangePairInputRow
                    isLight={isLight}
                    label="Ball Location Modifier (XY)"
                    unit="UU"
                    step={5}
                    min={-2000}
                    max={2000}
                    disabled={!isUsingCustom}
                    value={activeDisplayVar.ballLocationModifierXY}
                    onChange={(val) =>
                      onUpdateCustomVariation({ ballLocationModifierXY: val })
                    }
                  />
                  <RangePairInputRow
                    isLight={isLight}
                    label="Ball Height Modifier (Z)"
                    unit="UU"
                    step={5}
                    min={-1000}
                    max={1000}
                    disabled={!isUsingCustom}
                    value={activeDisplayVar.ballHeightModifierZ}
                    onChange={(val) =>
                      onUpdateCustomVariation({ ballHeightModifierZ: val })
                    }
                  />
                  <RangePairInputRow
                    isLight={isLight}
                    label="Ball Trajectory Rotation"
                    unit="deg"
                    step={0.5}
                    min={-45}
                    max={45}
                    disabled={!isUsingCustom}
                    value={activeDisplayVar.ballRotationModifierDeg}
                    onChange={(val) =>
                      onUpdateCustomVariation({ ballRotationModifierDeg: val })
                    }
                  />
                  <RangePairInputRow
                    isLight={isLight}
                    label="Ball Spin Modifier"
                    unit="rad/s"
                    step={0.1}
                    min={-6}
                    max={6}
                    disabled={!isUsingCustom}
                    value={activeDisplayVar.ballSpinModifier}
                    onChange={(val) =>
                      onUpdateCustomVariation({ ballSpinModifier: val })
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 px-1">
                    Vehicle & Boost Modifiers
                  </span>
                  <RangePairInputRow
                    isLight={isLight}
                    label="Vehicle Starting Velocity"
                    unit="UU/s"
                    step={50}
                    min={0}
                    max={2300}
                    disabled={!isUsingCustom}
                    value={activeDisplayVar.vehicleSpeedRange || [0, 0]}
                    onChange={(val) =>
                      onUpdateCustomVariation({
                        vehicleSpeedRange: val[0] === 0 && val[1] === 0 ? null : val,
                      })
                    }
                  />
                  <RangePairInputRow
                    isLight={isLight}
                    label="Vehicle Location Modifier"
                    unit="UU"
                    step={15}
                    min={-2000}
                    max={2000}
                    disabled={!isUsingCustom}
                    value={activeDisplayVar.vehicleLocationModifier}
                    onChange={(val) =>
                      onUpdateCustomVariation({ vehicleLocationModifier: val })
                    }
                  />
                  <RangePairInputRow
                    isLight={isLight}
                    label="Vehicle Rotation Modifier"
                    unit="deg"
                    step={0.5}
                    min={-90}
                    max={90}
                    disabled={!isUsingCustom}
                    value={activeDisplayVar.vehicleRotationModifierDeg}
                    onChange={(val) =>
                      onUpdateCustomVariation({ vehicleRotationModifierDeg: val })
                    }
                  />

                  {/* Boost Limit Override */}
                  <div
                    className={`flex items-center justify-between gap-2 py-1 px-2 rounded-lg border text-xs ${
                      !isUsingCustom ? 'opacity-45 pointer-events-none' : ''
                    } ${
                      isLight
                        ? 'bg-neutral-50 border-neutral-200/80 text-neutral-800'
                        : 'bg-neutral-850/70 border-neutral-800 text-neutral-200'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold">Boost Limit Override</span>
                      <span className="text-[9px] font-mono opacity-60">
                        sv_training_limitboost (0..100)
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={activeDisplayVar.boostLimitOverride ?? 100}
                      onChange={(e) =>
                        onUpdateCustomVariation({
                          boostLimitOverride: Math.max(
                            0,
                            Math.min(100, Number(e.target.value) || 0)
                          ),
                        })
                      }
                      className={`w-16 px-1.5 py-0.5 rounded border text-right font-mono text-[11px] outline-none ${
                        isLight
                          ? 'bg-white border-neutral-300 text-neutral-900'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-100'
                      }`}
                    />
                  </div>

                  {/* Checkboxes: Force Spawn Vehicle on Ground & Force Unlimited Boost */}
                  <div
                    className={`flex flex-col gap-1.5 p-2 rounded-lg border ${
                      !isUsingCustom ? 'opacity-45 pointer-events-none' : ''
                    } ${
                      isLight
                        ? 'bg-neutral-50 border-neutral-200/80'
                        : 'bg-neutral-850/70 border-neutral-800'
                    }`}
                  >
                    <label className="flex items-center justify-between gap-2 cursor-pointer">
                      <span className="text-[11px] font-semibold">
                        Force Spawn Vehicle on Ground
                      </span>
                      <input
                        type="checkbox"
                        checked={activeDisplayVar.forceSpawnVehicleOnGround}
                        onChange={(e) =>
                          onUpdateCustomVariation({
                            forceSpawnVehicleOnGround: e.target.checked,
                          })
                        }
                        className="h-3.5 w-3.5 accent-cyan-400 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-2 cursor-pointer">
                      <span className="text-[11px] font-semibold">
                        Force Unlimited Boost
                      </span>
                      <input
                        type="checkbox"
                        checked={activeDisplayVar.forceUnlimitedBoost}
                        onChange={(e) =>
                          onUpdateCustomVariation({
                            forceUnlimitedBoost: e.target.checked,
                          })
                        }
                        className="h-3.5 w-3.5 accent-cyan-400 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  );

StaticTrainingVariationsModal.displayName = 'StaticTrainingVariationsModal';
