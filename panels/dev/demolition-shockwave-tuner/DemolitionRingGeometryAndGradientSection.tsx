import React from 'react';
import {
  DEMOLITION_SHOCKWAVE_PRESETS,
  triggerDemolitionShockwaveSimulation,
  updateDemolitionShockwaveConfig,
  type DemolitionShockwaveBlendingMode,
  type DemolitionShockwaveConfig,
} from '../../../config/demolitionShockwaveConfig';
import { SegmentedSwitch } from '../../../primitives/SegmentedSwitch';
import { SliderControl } from '../../../primitives/SliderControl';
import { TunerColorRow } from '../../../compounds/TunerControls';

export interface DemolitionRingGeometryAndGradientSectionProps {
  cfg: DemolitionShockwaveConfig;
  isLight: boolean;
}

export const DemolitionRingGeometryAndGradientSection: React.FC<
  DemolitionRingGeometryAndGradientSectionProps
> = ({ cfg, isLight }) => {
  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-900'
    : 'bg-neutral-900/60 border-neutral-700/60 text-neutral-100';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const midStopPct = Math.max(8, Math.min(92, Number(cfg.midColorStopPct) || 58));

  return (
    <>
      {/* Section 2: Inner / Outer Radius & Expansion Dynamics */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 shrink-0 ${cardBg}`}>
        <div className="flex items-center justify-between border-b border-neutral-500/20 pb-1">
          <span className="font-bold text-[11px] text-amber-400">
            2. Shockwave Ring Radii, Hollow Ratio &amp; Far-Field Readability
          </span>
          <span className="font-mono text-[10px] opacity-80">
            {cfg.startOuterRadiusUu} → {cfg.endOuterRadiusUu} UU ({cfg.durationSec}s)
          </span>
        </div>

        {/* Aesthetic Style Presets */}
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-semibold ${mutedText}`}>
            Calibrated Shockwave Style Presets
          </span>
          <div className="grid grid-cols-3 gap-1">
            {DEMOLITION_SHOCKWAVE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  updateDemolitionShockwaveConfig(preset.patch);
                  triggerDemolitionShockwaveSimulation();
                }}
                className={`px-2 py-1 rounded-lg border text-left text-[10px] font-semibold transition-all cursor-pointer truncate ${
                  isLight
                    ? 'bg-white border-neutral-200 hover:border-amber-400 text-neutral-800'
                    : 'bg-neutral-800/80 border-neutral-700 hover:border-amber-400/60 text-neutral-200'
                }`}
                title={preset.description}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <SliderControl
          label="Shockwave Total Duration"
          description="Total lifetime of the expanding shockwave ring"
          value={cfg.durationSec}
          min={0.18}
          max={2.0}
          step={0.02}
          unit="s"
          editable={true}
          onChange={(durationSec) => updateDemolitionShockwaveConfig({ durationSec })}
          isLight={isLight}
        />

        <SliderControl
          label="Start Outer Radius"
          description="Initial outer radius of the shockwave at t = 0"
          value={cfg.startOuterRadiusUu}
          min={30}
          max={500}
          step={10}
          unit=" UU"
          editable={true}
          onChange={(startOuterRadiusUu) =>
            updateDemolitionShockwaveConfig({
              startOuterRadiusUu,
              endOuterRadiusUu: Math.max(startOuterRadiusUu + 20, cfg.endOuterRadiusUu),
            })
          }
          isLight={isLight}
        />

        <SliderControl
          label="End Outer Radius (Peak Expansion)"
          description="Final outer radius of the shockwave ring at completion"
          value={cfg.endOuterRadiusUu}
          min={200}
          max={1800}
          step={20}
          unit=" UU"
          editable={true}
          onChange={(endOuterRadiusUu) =>
            updateDemolitionShockwaveConfig({
              endOuterRadiusUu: Math.max(cfg.startOuterRadiusUu + 20, endOuterRadiusUu),
            })
          }
          isLight={isLight}
        />

        <SliderControl
          label="Expansion Ease-Out Power"
          description="Higher values produce an explosive initial burst followed by smooth deceleration"
          value={cfg.expansionCurvePower}
          min={1.0}
          max={6.0}
          step={0.1}
          editable={true}
          onChange={(expansionCurvePower) =>
            updateDemolitionShockwaveConfig({ expansionCurvePower })
          }
          isLight={isLight}
        />

        <SliderControl
          label="Start Inner Hollow Ratio (Inner / Outer)"
          description="0.0 = solid core at ignition; 0.5 = half-hollow ring at ignition"
          value={cfg.startInnerRadiusRatio}
          min={0.0}
          max={0.9}
          step={0.02}
          editable={true}
          onChange={(startInnerRadiusRatio) =>
            updateDemolitionShockwaveConfig({
              startInnerRadiusRatio,
              endInnerRadiusRatio: Math.max(startInnerRadiusRatio, cfg.endInnerRadiusRatio),
            })
          }
          isLight={isLight}
        />

        <SliderControl
          label="End Inner Hollow Ratio (Thinning Rim)"
          description="As the wave expands, inner radius catches up to outer radius to form a crisp shock ring"
          value={cfg.endInnerRadiusRatio}
          min={0.2}
          max={0.97}
          step={0.01}
          editable={true}
          onChange={(endInnerRadiusRatio) =>
            updateDemolitionShockwaveConfig({
              endInnerRadiusRatio: Math.max(cfg.startInnerRadiusRatio, endInnerRadiusRatio),
            })
          }
          isLight={isLight}
        />

        <div className="grid grid-cols-2 gap-2">
          <SliderControl
            label="Inner Edge Softness"
            value={cfg.innerEdgeSoftnessPct}
            min={2}
            max={65}
            step={1}
            unit="%"
            editable={true}
            onChange={(innerEdgeSoftnessPct) =>
              updateDemolitionShockwaveConfig({ innerEdgeSoftnessPct })
            }
            isLight={isLight}
          />

          <SliderControl
            label="Outer Rim Sharpness"
            value={cfg.outerEdgeSoftnessPct}
            min={2}
            max={50}
            step={1}
            unit="%"
            editable={true}
            onChange={(outerEdgeSoftnessPct) =>
              updateDemolitionShockwaveConfig({ outerEdgeSoftnessPct })
            }
            isLight={isLight}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SliderControl
            label="Far-Field Scale Boost"
            description="Scales up distant explosions so cross-field demos remain unmistakable"
            value={cfg.distanceScaleBoost}
            min={0.0}
            max={1.2}
            step={0.05}
            editable={true}
            onChange={(distanceScaleBoost) =>
              updateDemolitionShockwaveConfig({ distanceScaleBoost })
            }
            isLight={isLight}
          />

          <SliderControl
            label="Min Far-Field Screen Size"
            description="Minimum apparent screen footprint for cross-stadium demolitions"
            value={cfg.distanceMinRadiusPx}
            min={0}
            max={64}
            step={2}
            unit=" px"
            editable={true}
            onChange={(distanceMinRadiusPx) =>
              updateDemolitionShockwaveConfig({ distanceMinRadiusPx })
            }
            isLight={isLight}
          />
        </div>
      </div>

      {/* Section 3: Radial Color Gradient & Ignition Core */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 shrink-0 ${cardBg}`}>
        <div className="flex items-center justify-between border-b border-neutral-500/20 pb-1">
          <span className="font-bold text-[11px] text-orange-400">
            3. Radial Color Gradient (Inner Core → Mid Fire → Outer Rim)
          </span>
          <span className="font-mono text-[10px] opacity-80">
            Mid @ {midStopPct.toFixed(0)}% · {cfg.emissiveIntensity.toFixed(1)}x HDR
          </span>
        </div>

        {/* Live 3-Stop Radial Gradient Preview Strip */}
        <div className="flex flex-col gap-1">
          <div
            className="relative h-4 w-full rounded-lg border border-neutral-500/30 overflow-hidden shadow-inner"
            style={{
              background: `linear-gradient(90deg, ${cfg.coreColor} 0%, ${cfg.midColor} ${midStopPct}%, ${cfg.outerColor} 100%)`,
            }}
          >
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_rgba(0,0,0,0.9)]"
              style={{ left: `${midStopPct}%` }}
            />
          </div>
          <div className={`flex items-center justify-between font-mono text-[9px] ${mutedText}`}>
            <span>Inner Core ({cfg.coreColor})</span>
            <span>Mid Fire {midStopPct}% ({cfg.midColor})</span>
            <span>Outer Rim ({cfg.outerColor})</span>
          </div>
        </div>

        <TunerColorRow
          label="1. Inner Hot Core Color"
          description="High-temperature inner ring & center flash color"
          value={cfg.coreColor}
          onChange={(coreColor) => updateDemolitionShockwaveConfig({ coreColor })}
          isLight={isLight}
        />

        <TunerColorRow
          label="2. Mid Shockwave Body Color"
          description="Primary energy band color across the shockwave ring"
          value={cfg.midColor}
          onChange={(midColor) => updateDemolitionShockwaveConfig({ midColor })}
          isLight={isLight}
        />

        <TunerColorRow
          label="3. Outer Shockwave Rim Color"
          description="Leading shockwave boundary color"
          value={cfg.outerColor}
          onChange={(outerColor) => updateDemolitionShockwaveConfig({ outerColor })}
          isLight={isLight}
        />

        <SliderControl
          label="Mid Color Radial Stop Position"
          value={cfg.midColorStopPct}
          min={10}
          max={90}
          step={1}
          unit="%"
          editable={true}
          onChange={(midColorStopPct) =>
            updateDemolitionShockwaveConfig({ midColorStopPct })
          }
          isLight={isLight}
        />

        <div className="grid grid-cols-2 gap-2">
          <SliderControl
            label="Ring HDR Intensity"
            value={cfg.emissiveIntensity}
            min={0.5}
            max={5.0}
            step={0.1}
            unit="x"
            editable={true}
            onChange={(emissiveIntensity) =>
              updateDemolitionShockwaveConfig({ emissiveIntensity })
            }
            isLight={isLight}
          />

          <SliderControl
            label="Center Ignition Burst"
            value={cfg.centerFlashIntensity}
            min={0.0}
            max={5.0}
            step={0.1}
            unit="x"
            editable={true}
            onChange={(centerFlashIntensity) =>
              updateDemolitionShockwaveConfig({ centerFlashIntensity })
            }
            isLight={isLight}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SliderControl
            label="Peak Opacity"
            value={cfg.peakOpacity}
            min={0.2}
            max={1.0}
            step={0.02}
            editable={true}
            onChange={(peakOpacity) => updateDemolitionShockwaveConfig({ peakOpacity })}
            isLight={isLight}
          />

          <SliderControl
            label="Fade-Out Start Progress"
            value={cfg.fadeStartProgress}
            min={0.05}
            max={0.85}
            step={0.05}
            editable={true}
            onChange={(fadeStartProgress) =>
              updateDemolitionShockwaveConfig({ fadeStartProgress })
            }
            isLight={isLight}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-semibold ${mutedText}`}>Blending Mode</span>
          <SegmentedSwitch
            value={cfg.blendingMode}
            onValueChange={(val) =>
              updateDemolitionShockwaveConfig({
                blendingMode: val as DemolitionShockwaveBlendingMode,
              })
            }
            options={[
              { value: 'additive', label: 'Additive Luminous (HDR Glow)' },
              { value: 'normal', label: 'Normal Alpha Blend' },
            ]}
            size="sm"
            fullWidth
            isLight={isLight}
          />
        </div>
      </div>
    </>
  );
};
