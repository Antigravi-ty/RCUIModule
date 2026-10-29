import React, { useState } from 'react';
import { Palette, Sparkles, Car, Tag, Info } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { useMenuLayoutStore, DEFAULT_PANEL_SIZING } from '../stores/menuLayoutStore';
import type { PanelSizingConfig } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import {
  ATMOSPHERE_FX_TUNER_PRESET,
  VEHICLE_GLOBAL_FX_TUNER_PRESET,
  DRIFTWOODS_TUNER_PRESET,
  BOOST_PAD_TUNER_PRESET,
  NAME_TAG_TUNER_PRESET,
} from '../stores/floatingPresets';
import { FloatingWindowCard } from './settings/components/FloatingWindowCard';

export interface Layer3DevCalibratedPresetsRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAddPresetWindow?: (preset: any, e: React.MouseEvent<HTMLButtonElement>) => void;
  activeWindows?: unknown[];
  onClosePresetWindow?: (id: string) => void;
  sizing?: PanelSizingConfig;
}

/**
 * [Recipe] Layer 3 Calibrated Presets (Developer Tier)
 * Compact borderless 5-row configuration panel matching Settings & Training Configuration:
 * 1. Atmosphere & FX Tuner
 * 2. Vehicle Global Surfaces & FX Tuner
 * 3. Driftwoods Stadium Tuner
 * 4. Boost Pad Visual Tuner
 * 5. Multiplayer Name Tag Tuner
 */
export const Layer3DevCalibratedPresetsRecipe: React.FC<
  Layer3DevCalibratedPresetsRecipeProps
> = ({ isLight = false, onBack, sizing: propSizing }) => {
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  const storeSizing = useMenuLayoutStore(
    (s) =>
      s.panels?.['layer3-dev-calibrated-presets'] ??
      DEFAULT_PANEL_SIZING['layer3-dev-calibrated-presets']
  );
  const sizing = propSizing ?? storeSizing;
  const { rowGap } = useSettingActionRowStore();

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full">
      <PanelHeader title="CALIBRATED PRESETS" onBack={onBack} isLight={isLight} />

      <PanelContent scrollable>
        <div
          data-layout="calibrated-presets-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          {/* 1. Atmosphere & FX Tuner */}
          <FloatingWindowCard
            preset={ATMOSPHERE_FX_TUNER_PRESET}
            icon={Sparkles}
            iconColor="text-sky-400"
            badge="Calibrated"
            badgeClass={
              isLight
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-700'
                : 'bg-sky-500/15 border-sky-500/30 text-sky-400'
            }
            bordered={false}
            showDescription={false}
            description="Wall & Pulse (Cubic-Bezier Fade-Out Curve), Shadows, Full-Sphere Skybox & 70% Ball"
            hoverTooltip="Atmosphere & FX Tuner: Calibrated 3D Ball-Wall Intersection Ring & Sonar Pulse, Single-Sun Sharp Shadows, Full-Sphere Cloudy Skybox & 70% Ball Opacity."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 2. Vehicle Global Surfaces & FX Tuner */}
          <FloatingWindowCard
            preset={VEHICLE_GLOBAL_FX_TUNER_PRESET}
            icon={Car}
            iconColor="text-emerald-400"
            badge="Calibrated"
            badgeClass={
              isLight
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }
            bordered={false}
            showDescription={false}
            description="Universal Surfaces & Paint, Head/Brake Lamps, 3-Face Solid Cylinder Wheels & Boost FX"
            hoverTooltip="Vehicle Global Surfaces & FX Tuner: Calibrated universal vehicle surface materials, headlamp/brake intensities, 7uu solid-cylinder wheels & dual-stream Gold Rush boost FX."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 3. Driftwoods Stadium Tuner */}
          <FloatingWindowCard
            preset={DRIFTWOODS_TUNER_PRESET}
            icon={Palette}
            iconColor="text-emerald-400"
            badge="Calibrated"
            badgeClass={
              isLight
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }
            bordered={false}
            showDescription={false}
            description="Ground dynamic mask, 8-mesh PBR palette, 0.20 Hex Shield & Lite mode"
            hoverTooltip="Driftwoods Stadium Tuner: Calibrated PBR material colors, ground dual-color mask, 0.20 shield hex grid opacity & Lite Lambert mode."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 4. Boost Pad Visual Tuner */}
          <FloatingWindowCard
            preset={BOOST_PAD_TUNER_PRESET}
            icon={Sparkles}
            iconColor="text-amber-400"
            badge="Calibrated"
            badgeClass={
              isLight
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-700'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            }
            bordered={false}
            showDescription={false}
            description="Upward gradient opacity, midpoint falloff & Big Pad floating orb"
            hoverTooltip="Boost Pad Visual Tuner: Calibrated upward opacity gradient falloff, midpoint calibration & Big Pad floating orb geometry."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 5. Multiplayer Name Tag Tuner */}
          <FloatingWindowCard
            preset={NAME_TAG_TUNER_PRESET}
            icon={Tag}
            iconColor="text-sky-400"
            badge="Calibrated"
            badgeClass={
              isLight
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-700'
                : 'bg-sky-500/15 border-sky-500/30 text-sky-400'
            }
            bordered={false}
            showDescription={false}
            description="208×54 pill, γ=0.86 distance curve, 50UU+6px dual offset, 100% Retina overlay & 6-car kickoff arena"
            hoverTooltip="Multiplayer Name Tag Tuner: Calibrated 208×54 horizontal pill name cards (Scale 0.04, γ=0.86, 50 UU world + 6 px screen offset, 100% independent Retina overlay render scale)."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Calibrated visual presets (Atmosphere & FX, Vehicle Global Surfaces, Driftwoods Stadium, Boost Pad & Multiplayer Name Tag)."
        hoveredDescription={hoveredDesc}
        icon={<Info className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
      />
    </PanelContainer>
  );
};
