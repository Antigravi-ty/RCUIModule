import React from 'react';
import { Compass, Lock, RotateCcw, Sliders, Sparkles, X, Zap } from 'lucide-react';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import {
  type StaticTrainingVariationConfig,
  type StaticTrainingQuickVariationToggles,
  type KevpertPresetKey,
  KEVPERT_PRESET_KEYS,
  KEVPERT_LATEST_PRESETS,
  DEFAULT_QUICK_VARIATION_TOGGLES,
} from '../../config/staticTrainingVariationTypes';
import { StaticTrainingVariationCustomSlidersSection } from './StaticTrainingVariationCustomSlidersSection';
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
      const activeDisplayVar = toggles.enableCustomVariationOverride
        ? customVariation
        : packRecommendedVariation || customVariation;

      const isUsingCustom = toggles.enableCustomVariationOverride;
      const isCustomEditable = isUsingCustom && customVariation.presetKey === 'CUSTOM';

      if (!isOpen) return null;

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
                    floatingStore.spawnWindow({
                      ...STATIC_TRAINING_BALL_CAM_TUNER_PRESET,
                      startMinimized: false,
                    });
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
                      ? isCustomEditable
                        ? 'ON (Custom Mode): Adjust dual-grabber sliders or type values directly and press Enter.'
                        : `ON (Kevpert Preset ${customVariation.presetKey}): Using read-only Kevpert preset. Click "Custom" below to edit sliders.`
                      : packRecommendedVariation
                      ? `OFF (Default): Uses pack author's recommended variance (${
                          packRecommendedVariation.presetKey || 'Embedded'
                        }).`
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

              {/* 2. Quick Toggle Switches & Boost / Angular Velocity Controls */}
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
                    Quick Difficulty, Boost & Spin Toggles
                  </span>
                  <span className="text-[10px] font-mono opacity-60">
                    Applies to both Recommended & Custom Variance
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Override Unlimited Boost as 100 (Default ON) */}
                  <div
                    className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                      isLight
                        ? 'bg-white border-neutral-200'
                        : 'bg-neutral-900/80 border-neutral-800'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold">
                        Override Unlimited Boost as 100
                      </span>
                      <span className="text-[9px] opacity-65">
                        Default ON: Top HUD shows INF while arena & bottom-right gauge consume from 100
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={toggles.overrideUnlimitedBoostAs100 !== false}
                      onCheckedChange={(v) =>
                        onUpdateToggles({ overrideUnlimitedBoostAs100: v })
                      }
                      isLight={isLight}
                      variant="neutral"
                    />
                  </div>

                  {/* More Boost (0..100, clamped to 100 in arena) */}
                  <div
                    className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
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
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
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
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
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
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
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

                  {/* Global Disable Random Angular Velocity */}
                  <div
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      isLight
                        ? 'bg-white border-neutral-200'
                        : 'bg-neutral-900/80 border-neutral-800'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold">
                        Global Disable Random Angular Velocity
                      </span>
                      <span className="text-[9px] opacity-65">
                        Forces 0 initial ball spin across all native & .Tem packs
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
              </div>

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
                    Kevpert BakkesMod Presets (Read-Only) & Custom Mode
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

                <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
                  {KEVPERT_PRESET_KEYS.map((k) => {
                    const preset = KEVPERT_LATEST_PRESETS[k];
                    const isSelected =
                      isUsingCustom && customVariation.presetKey === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => onSelectKevpertPreset(k)}
                        title={`${preset.label} (Read-Only Preset)`}
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
              <StaticTrainingVariationCustomSlidersSection
                isLight={isLight}
                isCustomEditable={isCustomEditable}
                toggles={toggles}
                activeDisplayVar={activeDisplayVar}
                onUpdateCustomVariation={onUpdateCustomVariation}
              />
            </div>
          </div>
        </div>
      );
    }
  );

StaticTrainingVariationsModal.displayName = 'StaticTrainingVariationsModal';
