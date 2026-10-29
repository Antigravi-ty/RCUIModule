import React, { useState } from 'react';
import { Link2, Unlink2, Palette, RotateCcw } from 'lucide-react';
import { SliderControl } from '../../../primitives/SliderControl';
import { ToggleSwitch } from '../../../primitives/ToggleSwitch';

export interface OklchZoneConfig {
  id: string;
  label: string;
  lightness: number;
  independentCH: boolean;
  chroma: number;
  blueHue: number;
  orangeHue: number;
}

export interface Q1DecalLayerItem {
  id: string;
  label: string;
  hex: string;
  opacity: number;
}

export interface OklchPerceptualPaletteLinkerProps {
  syncEnabled?: boolean;
  onSyncEnabledChange?: (enabled: boolean) => void;
  masterChroma?: number;
  onMasterChromaChange?: (c: number) => void;
  masterBlueHue?: number;
  onMasterBlueHueChange?: (h: number) => void;
  masterOrangeHue?: number;
  onMasterOrangeHueChange?: (h: number) => void;
  zones?: OklchZoneConfig[];
  onZoneChange?: (id: string, patch: Partial<OklchZoneConfig>) => void;
  q1Layers?: Q1DecalLayerItem[];
  onQ1LayerChange?: (id: string, patch: Partial<Q1DecalLayerItem>) => void;
  onResetPalette?: () => void;
  isLight?: boolean;
}

const DEFAULT_ZONES: OklchZoneConfig[] = [
  { id: 'team-ground', label: '1. Ground Team Half-Field', lightness: 0.7, independentCH: false, chroma: 0.19, blueHue: 250, orangeHue: 45 },
  { id: 'goal-frame', label: '2. Goal Posts & Frame', lightness: 0.58, independentCH: false, chroma: 0.19, blueHue: 250, orangeHue: 45 },
  { id: 'goal-glow', label: '3. Goal Posts Inner Glow', lightness: 0.65, independentCH: false, chroma: 0.21, blueHue: 250, orangeHue: 45 },
  { id: 'ramps-outer', label: '4. Ramps Upper & Net Outer', lightness: 0.5, independentCH: true, chroma: 0.1, blueHue: 248, orangeHue: 42 },
  { id: 'hex-shield', label: '5. Hexagon Shield Grid', lightness: 0.65, independentCH: true, chroma: 0.32, blueHue: 252, orangeHue: 46 },
];

const DEFAULT_Q1_LAYERS: Q1DecalLayerItem[] = [
  { id: 'q1-base', label: 'L0 Base Pitch Slate', hex: '#1e293b', opacity: 1.0 },
  { id: 'q1-Lines', label: 'L1 White Pitch Markings', hex: '#f8fafc', opacity: 0.94 },
  { id: 'q1-penalty', label: 'L2 Penalty Box Trim', hex: '#64748b', opacity: 0.65 },
  { id: 'q1-center', label: 'L3 Center Circle Ring', hex: '#cbd5e1', opacity: 0.85 },
  { id: 'q1-checker', label: 'L4 Subtle Turf Checker', hex: '#334155', opacity: 0.42 },
];

function approxOklchCss(l: number, c: number, h: number): string {
  const clampedL = Math.max(0.15, Math.min(0.98, l));
  const clampedC = Math.max(0, Math.min(0.38, c));
  return `oklch(${(clampedL * 100).toFixed(1)}% ${clampedC.toFixed(3)} ${h.toFixed(0)}deg)`;
}

/**
 * [L2 Compound] OklchPerceptualPaletteLinker
 * Recreates RocketCompanion's DriftwoodsGroundTab OKLCH perceptual luminance +
 * symmetric Blue/Orange team Chroma/Hue linker (Link2/Unlink2 per zone) + Q1 7-layer decal mixer.
 */
export const OklchPerceptualPaletteLinker: React.FC<OklchPerceptualPaletteLinkerProps> = React.memo(({
  syncEnabled: propSync,
  onSyncEnabledChange,
  masterChroma: propMasterC,
  onMasterChromaChange,
  masterBlueHue: propBlueH,
  onMasterBlueHueChange,
  masterOrangeHue: propOrangeH,
  onMasterOrangeHueChange,
  zones: propZones,
  onZoneChange,
  q1Layers: propQ1Layers,
  onQ1LayerChange,
  onResetPalette,
  isLight = false,
}) => {
  const [localSync, setLocalSync] = useState(true);
  const [localMasterC, setLocalMasterC] = useState(0.19);
  const [localBlueH, setLocalBlueH] = useState(250);
  const [localOrangeH, setLocalOrangeH] = useState(45);
  const [localZones, setLocalZones] = useState<OklchZoneConfig[]>(DEFAULT_ZONES);
  const [localQ1, setLocalQ1] = useState<Q1DecalLayerItem[]>(DEFAULT_Q1_LAYERS);

  const syncEnabled = propSync ?? localSync;
  const masterC = propMasterC ?? localMasterC;
  const masterBlueH = propBlueH ?? localBlueH;
  const masterOrangeH = propOrangeH ?? localOrangeH;
  const zones = propZones ?? localZones;
  const q1Layers = propQ1Layers ?? localQ1;

  const updateZone = (id: string, patch: Partial<OklchZoneConfig>) => {
    if (onZoneChange) {
      onZoneChange(id, patch);
    } else {
      setLocalZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)));
    }
  };

  const updateQ1 = (id: string, patch: Partial<Q1DecalLayerItem>) => {
    if (onQ1LayerChange) {
      onQ1LayerChange(id, patch);
    } else {
      setLocalQ1((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    }
  };

  const handleReset = () => {
    setLocalSync(true);
    setLocalMasterC(0.19);
    setLocalBlueH(250);
    setLocalOrangeH(45);
    setLocalZones(DEFAULT_ZONES);
    setLocalQ1(DEFAULT_Q1_LAYERS);
    onResetPalette?.();
  };

  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
    : 'bg-neutral-900/60 border-neutral-800 text-neutral-200';
  const subBg = isLight
    ? 'bg-white border-neutral-200'
    : 'bg-neutral-950/70 border-neutral-800';

  return (
    <div className="flex flex-col gap-3">
      {/* Master OKLCH Perceptual Team Palette Card */}
      <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${cardBg}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-bold text-[11px]">
              OKLCH Perceptual Luminance &amp; Symmetric Team Palette
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ToggleSwitch
              checked={syncEnabled}
              onCheckedChange={(v) => {
                setLocalSync(v);
                onSyncEnabledChange?.(v);
              }}
              label="OKLCH Sync"
              isLight={isLight}
            />
            <button
              type="button"
              onClick={handleReset}
              title="Reset OKLCH Palette to Calibrated Default"
              className="px-2 py-0.5 rounded-lg border text-[10px] font-mono flex items-center gap-1 cursor-pointer border-neutral-300 dark:border-neutral-700 hover:text-amber-500"
            >
              <RotateCcw className="h-2.5 w-2.5" /> Reset
            </button>
          </div>
        </div>

        {/* Shared Master Chroma & Blue/Orange Hue Sliders */}
        <div className={`p-2.5 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-3 ${subBg}`}>
          <SliderControl
            label="Shared Master Chroma (C)"
            value={masterC}
            min={0.02}
            max={0.35}
            step={0.005}
            editable
            colorScheme="amber"
            onChange={(v) => {
              setLocalMasterC(v);
              onMasterChromaChange?.(v);
            }}
            isLight={isLight}
          />
          <SliderControl
            label="Master Blue Hue (H°)"
            value={masterBlueH}
            min={180}
            max={290}
            step={1}
            unit="°"
            editable
            colorScheme="sky"
            onChange={(v) => {
              setLocalBlueH(v);
              onMasterBlueHueChange?.(v);
            }}
            isLight={isLight}
          />
          <SliderControl
            label="Master Orange Hue (H°)"
            value={masterOrangeH}
            min={15}
            max={85}
            step={1}
            unit="°"
            editable
            colorScheme="amber"
            onChange={(v) => {
              setLocalOrangeH(v);
              onMasterOrangeHueChange?.(v);
            }}
            isLight={isLight}
          />
        </div>

        {/* Per-Zone Luminance + Link/Unlink C/H */}
        <div className="flex flex-col gap-2">
          {zones.map((zone) => {
            const effC = zone.independentCH ? zone.chroma : masterC;
            const effBlueH = zone.independentCH ? zone.blueHue : masterBlueH;
            const effOrangeH = zone.independentCH ? zone.orangeHue : masterOrangeH;
            const blueCss = approxOklchCss(zone.lightness, effC, effBlueH);
            const orangeCss = approxOklchCss(zone.lightness, effC, effOrangeH);

            return (
              <div
                key={zone.id}
                className={`p-2.5 rounded-xl border flex flex-col gap-2 ${subBg}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-2xs"
                        style={{ background: blueCss }}
                        title={`Blue OKLCH(${zone.lightness.toFixed(2)}, ${effC.toFixed(2)}, ${effBlueH}°)`}
                      />
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-2xs"
                        style={{ background: orangeCss }}
                        title={`Orange OKLCH(${zone.lightness.toFixed(2)}, ${effC.toFixed(2)}, ${effOrangeH}°)`}
                      />
                    </div>
                    <span className="font-bold text-[11px] truncate">{zone.label}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateZone(zone.id, { independentCH: !zone.independentCH })}
                    data-footer-desc={
                      zone.independentCH
                        ? `Unlinked C/H for [${zone.label}]: Click to relink to Shared Master Chroma & Hue.`
                        : `Linked to Shared Master C/H: Click to unlock independent Chroma & Hue for [${zone.label}].`
                    }
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                      zone.independentCH
                        ? 'bg-amber-500/15 text-amber-500 border-amber-500/35'
                        : isLight
                        ? 'bg-neutral-100 border-neutral-200 text-neutral-600'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {zone.independentCH ? (
                      <>
                        <Unlink2 className="h-3 w-3" />
                        <span>Independent C/H</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="h-3 w-3" />
                        <span>Linked Master C/H</span>
                      </>
                    )}
                  </button>
                </div>

                <SliderControl
                  label="Perceptual Lightness (L)"
                  value={zone.lightness}
                  min={0.2}
                  max={0.98}
                  step={0.01}
                  editable
                  colorScheme="emerald"
                  onChange={(v) => updateZone(zone.id, { lightness: v })}
                  isLight={isLight}
                />

                {zone.independentCH && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-neutral-200/60 dark:border-neutral-800">
                    <SliderControl
                      label="Zone Chroma (C)"
                      value={zone.chroma}
                      min={0.02}
                      max={0.36}
                      step={0.01}
                      editable
                      colorScheme="amber"
                      onChange={(v) => updateZone(zone.id, { chroma: v })}
                      isLight={isLight}
                    />
                    <SliderControl
                      label="Zone Blue Hue"
                      value={zone.blueHue}
                      min={180}
                      max={290}
                      step={1}
                      unit="°"
                      editable
                      colorScheme="sky"
                      onChange={(v) => updateZone(zone.id, { blueHue: v })}
                      isLight={isLight}
                    />
                    <SliderControl
                      label="Zone Orange Hue"
                      value={zone.orangeHue}
                      min={15}
                      max={85}
                      step={1}
                      unit="°"
                      editable
                      colorScheme="amber"
                      onChange={(v) => updateZone(zone.id, { orangeHue: v })}
                      isLight={isLight}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Q1 Semantic Grayscale Decal Opacity Mixer */}
      <div className={`p-3 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <span className="font-bold text-[11px] text-sky-400">
          Q1 4-Quadrant Mirrored Grayscale Layers &amp; Oklab Decal Opacity
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {q1Layers.map((layer) => (
            <div key={layer.id} className={`p-2 rounded-xl border flex flex-col gap-1.5 ${subBg}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <input
                    type="color"
                    value={layer.hex}
                    onChange={(e) => updateQ1(layer.id, { hex: e.target.value })}
                    className="h-4 w-4 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-[10px] font-semibold truncate">{layer.label}</span>
                </div>
                <span className="text-[10px] font-mono opacity-70">{layer.hex}</span>
              </div>
              <SliderControl
                label="Decal Blend Opacity"
                value={layer.opacity}
                min={0}
                max={1}
                step={0.02}
                colorScheme="sky"
                onChange={(v) => updateQ1(layer.id, { opacity: v })}
                isLight={isLight}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

OklchPerceptualPaletteLinker.displayName = 'OklchPerceptualPaletteLinker';
