import React, { useEffect, useState } from 'react';
import { Compass, Lock, RotateCcw, Sliders, Sparkles, X } from 'lucide-react';
import {
  type StaticTrainingVariationConfig,
  type StaticTrainingQuickVariationToggles,
  type KevpertPresetKey,
  KEVPERT_PRESET_KEYS,
  KEVPERT_LATEST_PRESETS,
  DEFAULT_QUICK_VARIATION_TOGGLES,
  resolveEffectiveRecommendedVariation,
} from '../../config/staticTrainingVariationTypes';
import { DualThumbRangeSliderRow } from './DualThumbRangeSliderRow';
import { StaticTrainingQuickTogglesSection } from './StaticTrainingQuickTogglesSection';
import { floatingStore } from '../../stores/floatingStore';
import { STATIC_TRAINING_BALL_CAM_TUNER_PRESET } from '../../stores/devFloatingPresets';

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
      const effectivePackRecommended = resolveEffectiveRecommendedVariation(
        packRecommendedVariation,
        Boolean(toggles.applyNewKevpertBind)
      );
      const activeDisplayVar = toggles.enableCustomVariationOverride
        ? customVariation
        : effectivePackRecommended || customVariation;

      const isUsingCustom = toggles.enableCustomVariationOverride;
      const isCustomEditable = isUsingCustom && customVariation.presetKey === 'CUSTOM';

      const [boostLimitText, setBoostLimitText] = useState<string>(() =>
        String(activeDisplayVar.boostLimitOverride ?? 100)
      );

      useEffect(() => {
        setBoostLimitText(String(activeDisplayVar.boostLimitOverride ?? 100));
      }, [activeDisplayVar.boostLimitOverride]);

      if (!isOpen) return null;

      const commitBoostLimitText = () => {
        const parsed = Number.parseFloat(boostLimitText.trim());
        if (!Number.isFinite(parsed)) {
          setBoostLimitText(String(activeDisplayVar.boostLimitOverride ?? 100));
          return;
        }
        const clamped = Math.max(0, Math.min(100, Math.round(parsed)));
        onUpdateCustomVariation({ boostLimitOverride: clamped });
        setBoostLimitText(String(clamped));
      };

      const handleSelectCustomMode = () => {
        if (!toggles.enableCustomVariationOverride) {
          onUpdateToggles({ enableCustomVariationOverride: true });
        }
        onUpdateCustomVariation({
          presetKey: 'CUSTOM',
          label: 'Custom User Variation (Editable Sliders)',
        });
      };

      return (
        <div
          role="dialog"
          aria-label="Training Variations Configuration"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={onClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-[880px] max-h-[88vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
              isLight
                ? 'bg-white border-neutral-300 text-neutral-900'
                : 'bg-neutral-900 border-neutral-700 text-neutral-100'
            }`}
          >
            {/* Header */}
            <div
              className={`px-5 py-3 border-b flex items-center justify-between shrink-0 ${
                isLight
                  ? 'bg-neutral-100/80 border-neutral-200'
                  : 'bg-neutral-950/60 border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-wider uppercase">
                    Training Variations & Boost Override
                  </span>
                  <span className="text-[10px] opacity-65">
                    {packRecommendedVariation
                      ? `Pack Recommended: ${
                          packRecommendedVariation.label ||
                          packRecommendedVariation.presetKey ||
                          'Active'
                        } (${packTitle || 'Current Pack'})`
                      : `No embedded pack variance • Enable Override to pick Kevpert F3–F12 (Read-Only) or Custom (Editable)`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    floatingStore.openWindow(STATIC_TRAINING_BALL_CAM_TUNER_PRESET);
                    onClose();
                  }}
                  title="Open 3D Direction Arrow, Expired Ball Opacity & Ball Cam Floating Tuner"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-800'
                      : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-400/40 text-cyan-300'
                  }`}
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>3D Arrow & Visuals Tuner</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateToggles({ ...DEFAULT_QUICK_VARIATION_TOGGLES });
                  }}
                  title="Reset Quick Toggles to Defaults"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold cursor-pointer ${
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
              <StaticTrainingQuickTogglesSection
                isLight={isLight}
                toggles={toggles}
                isUsingCustom={isUsingCustom}
                isCustomEditable={isCustomEditable}
                customVariation={customVariation}
                packRecommendedVariation={packRecommendedVariation}
                onUpdateToggles={onUpdateToggles}
              />

              {/* 3. Kevpert BakkesMod F-Key Presets (Read-Only) + Custom Button */}
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
                    Kevpert BakkesMod Latest Presets (F1–F12) & Custom Mode
                  </span>
                  <span className="text-[10px] font-mono opacity-65 flex items-center gap-1">
                    {isCustomEditable ? (
                      <span className="text-amber-400 font-bold">
                        Custom Active: Sliders Unlocked
                      </span>
                    ) : (
                      <>
                        <Lock className="h-3 w-3 opacity-70" />
                        <span>Preset Read-Only • Click Custom to Edit Sliders</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-13 gap-1.5">
                  {KEVPERT_PRESET_KEYS.map((k) => {
                    const preset = KEVPERT_LATEST_PRESETS[k];
                    const isSelected =
                      isUsingCustom && customVariation.presetKey === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => onSelectKevpertPreset(k)}
                        title={`${preset.label || preset.presetLabel} (Read-Only Preset)`}
                        className={`py-1.5 px-1.5 rounded-lg border text-center font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 ${
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

                  {/* Explicit Custom Button */}
                  <button
                    type="button"
                    onClick={handleSelectCustomMode}
                    title="Unlock Custom Bidirectional Range Sliders & Direct Numeric Inputs"
                    className={`py-1.5 px-2 rounded-lg border text-center font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                      isCustomEditable
                        ? isLight
                          ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                          : 'bg-amber-400 border-amber-300 text-neutral-950 shadow-xs'
                        : isLight
                        ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                        : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/40 text-amber-300'
                    }`}
                  >
                    <div>Custom</div>
                    <div className="text-[9px] font-normal opacity-80">Sliders</div>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono opacity-75 pt-0.5">
                  <span className="truncate">
                    Active Spec: {activeDisplayVar.label || activeDisplayVar.presetKey || 'Custom'}
                  </span>
                  {!isCustomEditable && (
                    <span className="text-cyan-400 shrink-0 ml-2">
                      Kevpert Presets are locked • Select &ldquo;Custom&rdquo; to adjust sliders
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Detailed Ball & Vehicle Modifiers (Read-Only Numbers for Presets, Dual-Thumb Sliders for Custom) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 px-1">
                    Ball Variance Modifiers {isCustomEditable ? '(Custom Sliders)' : '(Read-Only)'}
                  </span>
                  <DualThumbRangeSliderRow
                    isLight={isLight}
                    label="Ball Speed Modifier (%)"
                    unit="%"
                    step={0.1}
                    sliderMin={-25}
                    sliderMax={25}
                    readOnly={!isCustomEditable}
                    disabled={toggles.disableBallVariance}
                    value={activeDisplayVar.ballSpeedModifierPct}
                    onChange={(val) =>
                      onUpdateCustomVariation({ ballSpeedModifierPct: val })
                    }
                  />
                  <DualThumbRangeSliderRow
                    isLight={isLight}
                    label="Ball Location Modifier (XY, UU)"
                    unit="UU"
                    step={5}
                    sliderMin={-500}
                    sliderMax={500}
                    readOnly={!isCustomEditable}
                    disabled={toggles.disableBallVariance}
                    value={activeDisplayVar.ballLocationModifierXY}
                    onChange={(val) =>
                      onUpdateCustomVariation({ ballLocationModifierXY: val })
                    }
                  />
                  <DualThumbRangeSliderRow
                    isLight={isLight}
                    label="Ball Height Modifier (Z, UU)"
                    unit="UU"
                    step={5}
                    sliderMin={-500}
                    sliderMax={500}
                    readOnly={!isCustomEditable}
                    disabled={toggles.disableBallVariance}
                    value={activeDisplayVar.ballHeightModifierZ}
                    onChange={(val) =>
                      onUpdateCustomVariation({ ballHeightModifierZ: val })
                    }
                  />
                  <DualThumbRangeSliderRow
                    isLight={isLight}
                    label="Ball Trajectory Rotation (deg)"
                    unit="deg"
                    step={0.1}
                    sliderMin={-20}
                    sliderMax={20}
                    readOnly={!isCustomEditable}
                    disabled={toggles.disableBallVariance}
                    value={activeDisplayVar.ballRotationModifierDeg}
                    onChange={(val) =>
                      onUpdateCustomVariation({ ballRotationModifierDeg: val })
                    }
                  />
                  <DualThumbRangeSliderRow
                    isLight={isLight}
                    label="Ball Spin Modifier (rad/s)"
                    unit="rad/s"
                    step={0.1}
                    sliderMin={-6}
                    sliderMax={6}
                    readOnly={!isCustomEditable}
                    disabled={toggles.disableBallVariance}
                    value={activeDisplayVar.ballSpinModifier}
                    onChange={(val) =>
                      onUpdateCustomVariation({ ballSpinModifier: val })
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 px-1">
                    Vehicle & Boost Modifiers {isCustomEditable ? '(Custom Sliders)' : '(Read-Only)'}
                  </span>
                  <DualThumbRangeSliderRow
                    isLight={isLight}
                    label="Vehicle Starting Velocity (UU/s)"
                    unit="UU/s"
                    step={25}
                    sliderMin={0}
                    sliderMax={2300}
                    readOnly={!isCustomEditable}
                    disabled={toggles.disableVehicleVariance}
                    value={activeDisplayVar.vehicleSpeedRange || [0, 0]}
                    onChange={(val) =>
                      onUpdateCustomVariation({
                        vehicleSpeedRange: val[0] === 0 && val[1] === 0 ? null : val,
                      })
                    }
                  />
                  <DualThumbRangeSliderRow
                    isLight={isLight}
                    label="Vehicle Location Modifier (UU)"
                    unit="UU"
                    step={5}
                    sliderMin={-600}
                    sliderMax={600}
                    readOnly={!isCustomEditable}
                    disabled={toggles.disableVehicleVariance}
                    value={activeDisplayVar.vehicleLocationModifier}
                    onChange={(val) =>
                      onUpdateCustomVariation({ vehicleLocationModifier: val })
                    }
                  />
                  <DualThumbRangeSliderRow
                    isLight={isLight}
                    label="Vehicle Rotation Modifier (deg)"
                    unit="deg"
                    step={0.5}
                    sliderMin={-45}
                    sliderMax={45}
                    readOnly={!isCustomEditable}
                    disabled={toggles.disableVehicleVariance}
                    value={activeDisplayVar.vehicleRotationModifierDeg}
                    onChange={(val) =>
                      onUpdateCustomVariation({ vehicleRotationModifierDeg: val })
                    }
                  />

                  {/* Boost Limit Override */}
                  {!isCustomEditable ? (
                    <div
                      className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border ${
                        isLight
                          ? 'bg-neutral-100/70 border-neutral-200/90 text-neutral-800'
                          : 'bg-neutral-900/55 border-neutral-800/90 text-neutral-200'
                      }`}
                    >
                      <span
                        className={`text-[11px] font-medium ${
                          isLight ? 'text-neutral-700' : 'text-neutral-300'
                        }`}
                      >
                        Boost Limit Override (0..100)
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded border font-mono text-[11px] font-bold ${
                          isLight
                            ? 'bg-white/90 border-neutral-200 text-amber-700'
                            : 'bg-neutral-950/90 border-neutral-800 text-amber-300'
                        }`}
                      >
                        {activeDisplayVar.boostLimitOverride ?? 100}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`flex flex-col gap-1.5 px-2.5 py-2 rounded-lg border ${
                        isLight
                          ? 'bg-white/80 border-neutral-200'
                          : 'bg-neutral-900/55 border-neutral-800/90'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold">
                          Boost Limit Override (sv_training_limitboost)
                        </span>
                        <span className="text-[10px] font-mono opacity-45">0 .. 100</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={activeDisplayVar.boostLimitOverride ?? 100}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                            onUpdateCustomVariation({ boostLimitOverride: v });
                          }}
                          className="flex-1 accent-cyan-400 cursor-pointer"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={boostLimitText}
                          onChange={(e) => setBoostLimitText(e.target.value)}
                          onBlur={commitBoostLimitText}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitBoostLimitText();
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className={`w-[70px] px-2 py-1 rounded-md border font-mono text-[11px] font-bold text-center outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            isLight
                              ? 'bg-white border-neutral-300 text-neutral-900 focus:border-cyan-500'
                              : 'bg-neutral-950 border-neutral-700 text-neutral-100 focus:border-cyan-400'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Checkboxes: Force Spawn Vehicle on Ground & Force Unlimited Boost */}
                  <div
                    className={`flex flex-col gap-1.5 px-2.5 py-2 rounded-lg border ${
                      !isCustomEditable ? 'opacity-70 pointer-events-none' : ''
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
                        disabled={!isCustomEditable}
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
                        disabled={!isCustomEditable}
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
