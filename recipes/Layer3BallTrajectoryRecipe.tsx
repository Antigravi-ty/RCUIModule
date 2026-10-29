import React, { useState } from 'react';
import { useLayer3BallTrajectoryStoreBinding } from './hooks/useLayer3DetailStoreBindings';
import { Cpu, Palette } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { SegmentedSwitch } from '../primitives/SegmentedSwitch';
import { SettingActionRow } from '../compounds/SettingActionRow';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { SettingSliderRow } from '../compounds/SettingSliderRow';
import { SettingToggleRow } from '../compounds/SettingToggleRow';
import { BounceSolidSvg } from '../primitives/packagedSvgIcons';
import { useMenuLayoutStore, DEFAULT_PANEL_SIZING } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';

export interface TrajectoryConfig {
  enabled: boolean;
  calculationMode?: 'fast' | 'accurate';
  predictionTicks: number;   // Duration: 60..600 ticks (0.5s..5.0s)
  solidTicks: number;        // Solid Dash: 5..240 ticks (default 50)
  transparentTicks: number;  // Transparent Gap: 5..240 ticks (default 20)
  thickness: number;         // Line Thickness: 1..75 (% of ball diameter, default 10)
  opacity: number;           // 0.05..1.0 (or 5..100 %)
  color: string;
  dynamicMode: boolean;
  duration?: number;
}

export const DEFAULT_TRAJECTORY_CONFIG: TrajectoryConfig = {
  enabled: true,
  calculationMode: 'fast',
  predictionTicks: 600, // 5.0s @ 120Hz
  solidTicks: 50,
  transparentTicks: 20,
  thickness: 10,
  opacity: 0.5,
  color: '#fbbf24',
  dynamicMode: true,
  duration: 5.0,
};

const PRESET_COLOR_MAP: Array<{ value: string; label: string }> = [
  { value: '#000000', label: 'Black' },
  { value: '#ffffff', label: 'White' },
  { value: '#00f0ff', label: 'Cyan' },
  { value: '#fbbf24', label: 'Amber' },
  { value: '#39ff14', label: 'Lime' },
];

export interface Layer3BallTrajectoryRecipeProps {
  isLight?: boolean;
  developerMode?: boolean;
  onBack?: () => void;
  onCollapsePreview?: () => void;
  transparent?: boolean;
  /** Controlled trajectory configuration object */
  config?: Partial<TrajectoryConfig>;
  /** Alias for controlled trajectory configuration object */
  settings?: Partial<TrajectoryConfig>;
  /** Initial trajectory configuration for uncontrolled mode */
  defaultConfig?: Partial<TrajectoryConfig>;
  /** Alias for defaultConfig */
  defaultSettings?: Partial<TrajectoryConfig>;
  /** Callback fired when any trajectory setting changes */
  onChange?: (next: TrajectoryConfig, patch: Partial<TrajectoryConfig>) => void;
  /** Alias for onChange */
  onConfigChange?: (next: TrajectoryConfig, patch: Partial<TrajectoryConfig>) => void;
}

/**
 * [Recipe] Layer 3 Ball Trajectory Predictor
 * Streamlined single-column vertical layout sharing unified Settings row typography & spacing:
 * - Icons retained only on Enable Predictor, Line Color Tone, and Calculation Mode
 * - Trajectory Pattern Mode & Line Color Tone split into 2-line stacked rows with full-width SegmentedSwitch
 * - Iconless inline sliders with expanded label room so titles never truncate
 */
export const Layer3BallTrajectoryRecipe: React.FC<Layer3BallTrajectoryRecipeProps> = (rawProps) => {
  const {
  isLight = false,
  developerMode = false,
  onBack = () => {},
  onCollapsePreview,
  transparent = false,
  config: controlledConfigProp,
  settings: controlledSettingsProp,
  defaultConfig,
  defaultSettings,
  onChange,
  onConfigChange,
} = useLayer3BallTrajectoryStoreBinding(rawProps);
  const sizing = useMenuLayoutStore(
    (s) => s.panels?.['layer3-ball-trajectory'] ?? DEFAULT_PANEL_SIZING['layer3-ball-trajectory']
  );
  const { rowGap } = useSettingActionRowStore();

  const initialSeed = {
    ...DEFAULT_TRAJECTORY_CONFIG,
    ...defaultSettings,
    ...defaultConfig,
  };

  const [internalConfig, setInternalConfig] = useState<TrajectoryConfig>(initialSeed);
  const [customHexColor, setCustomHexColor] = useState<string>(() =>
    initialSeed.color.startsWith('#') ? initialSeed.color : '#fbbf24'
  );

  const controlledSource = controlledConfigProp ?? controlledSettingsProp;
  const resolved: TrajectoryConfig = {
    ...internalConfig,
    ...controlledSource,
  };

  const updateConfig = (patch: Partial<TrajectoryConfig>) => {
    const next: TrajectoryConfig = {
      ...resolved,
      ...patch,
    };
    if (controlledSource === undefined) {
      setInternalConfig(next);
    }
    onChange?.(next, patch);
    onConfigChange?.(next, patch);
  };

  const enablePredictor = resolved.enabled;
  const patternMode: 'dynamic' | 'static' = resolved.dynamicMode ? 'dynamic' : 'static';
  const trajectoryDuration =
    resolved.duration ?? Number(((resolved.predictionTicks || 600) / 120).toFixed(1));
  const lineThickness = resolved.thickness ?? 10;
  // Support both 0..1 fraction (RocketCompanion store) and 5..100 percentage
  const isNormalizedOpacity = (resolved.opacity ?? 0.5) <= 1.0;
  const lineOpacityPct = isNormalizedOpacity
    ? Math.round((resolved.opacity ?? 0.5) * 100)
    : Math.round(resolved.opacity ?? 50);
  const solidDashLength = resolved.solidTicks ?? 50;
  const transparentGap = resolved.transparentTicks ?? 20;
  const calculationMode = resolved.calculationMode === 'accurate' ? 'fast' : 'fast';

  const normalizedColor = (resolved.color || '#fbbf24').toLowerCase();
  const matchedPreset = PRESET_COLOR_MAP.find(
    (p) => p.value.toLowerCase() === normalizedColor
  );
  const renderColor = matchedPreset ? matchedPreset.value : 'custom';
  const effectiveHexColor = resolved.color?.startsWith('#')
    ? resolved.color
    : customHexColor;

  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  return (
    <PanelContainer
      isLight={isLight}
      transparent={transparent}
      sizing={sizing}
      className="w-full select-none"
    >
      <PanelHeader
        title="BALL TRAJECTORY PREDICTOR"
        onBack={onBack}
        isLight={isLight}
        onRightAction={onCollapsePreview}
        rightActionLabel="Live Preview"
        onRightActionHoverChange={(hovered) =>
          setHoveredDesc(
            hovered
              ? 'Press TAB or click to collapse panel to side dock and inspect 3D arena (Live Preview).'
              : null
          )
        }
      />

      <PanelContent scrollable>
        <div
          data-layout="trajectory-settings-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          {/* 1. Enable Predictor */}
          <SettingToggleRow
            icon={BounceSolidSvg}
            iconName="bounce-solid"
            iconColor="text-amber-500"
            title="Enable Predictor"
            checked={enablePredictor}
            onChange={(enabled) => updateConfig({ enabled })}
            bordered={false}
            showDescription={false}
            hoverDescription="Master switch for 3D predictive ball flight path rendering."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 2. Trajectory Pattern Mode */}
          <SettingSegmentedRow
            title="Trajectory Pattern Mode"
            value={patternMode}
            onChange={(v) => updateConfig({ dynamicMode: v === 'dynamic' })}
            layout="stacked"
            bordered={false}
            showDescription={false}
            options={[
              { value: 'dynamic', label: 'Dynamic (Pushes Line)' },
              { value: 'static', label: 'Static (Follows Line)' },
            ]}
            hoverDescription="Switch between velocity-scaled dynamic dashes (pushes line) or uniform static dash geometry (follows line)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 3. Trajectory Horizon */}
          <SettingSliderRow
            label="Trajectory Horizon"
            title="Trajectory Horizon"
            value={trajectoryDuration}
            min={0.5}
            max={5.0}
            step={0.1}
            unit="s"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            onChange={(seconds) =>
              updateConfig({
                duration: seconds,
                predictionTicks: Math.round(seconds * 120),
              })
            }
            hoverDescription="Forward prediction duration in seconds (0.5s to 5.0s / 60 to 600 ticks)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 4. Line Thickness */}
          <SettingSliderRow
            label="Line Thickness"
            title="Line Thickness"
            value={lineThickness}
            min={1}
            max={75}
            step={1}
            unit="%"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            onChange={(thickness) => updateConfig({ thickness })}
            hoverDescription="3D trajectory ribbon thickness as percentage of ball diameter (1% to 75%)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 5. Line Opacity */}
          <SettingSliderRow
            label="Line Opacity"
            title="Line Opacity"
            value={lineOpacityPct}
            min={5}
            max={100}
            step={5}
            unit="%"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            onChange={(opacityPct) =>
              updateConfig({
                opacity: isNormalizedOpacity ? opacityPct / 100 : opacityPct,
              })
            }
            hoverDescription="Overall alpha opacity of the predictive trajectory line (5% to 100%)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 6. Solid Dash Length (RocketCompanion range: 5..240 ticks) */}
          <SettingSliderRow
            label="Solid Dash Length"
            title="Solid Dash Length"
            value={solidDashLength}
            min={5}
            max={240}
            step={5}
            unit=" ticks"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            onChange={(solidTicks) => updateConfig({ solidTicks })}
            hoverDescription="Length of each solid dash segment along the trajectory in physics ticks (5 to 240 ticks)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 7. Transparent Gap (RocketCompanion range: 5..240 ticks) */}
          <SettingSliderRow
            label="Transparent Gap"
            title="Transparent Gap"
            value={transparentGap}
            min={5}
            max={240}
            step={5}
            unit=" ticks"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            onChange={(transparentTicks) => updateConfig({ transparentTicks })}
            hoverDescription="Spacing gap between trajectory dash segments in physics ticks (5 to 240 ticks)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 8. Line Color Tone */}
          <SettingActionRow
            icon={Palette}
            iconColor="text-purple-400"
            title="Line Color Tone"
            bordered={false}
            showDescription={false}
            hoverDescription="Select visual color preset or pick a custom hex color for the predictive trajectory ribbon."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
            rightSlot={
              renderColor === 'custom' ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={effectiveHexColor}
                    onChange={(e) => {
                      const hex = e.target.value;
                      setCustomHexColor(hex);
                      updateConfig({ color: hex });
                    }}
                    className="h-5 w-6 rounded border border-neutral-500/40 cursor-pointer bg-transparent"
                    title="Pick Custom Trajectory Color"
                  />
                  <span className="text-[11px] font-mono text-neutral-400">
                    {effectiveHexColor}
                  </span>
                </div>
              ) : null
            }
            bottomSlot={
              <SegmentedSwitch
                size="sm"
                fullWidth
                value={renderColor}
                onValueChange={(val) => {
                  if (val === 'custom') {
                    updateConfig({ color: effectiveHexColor });
                  } else {
                    updateConfig({ color: val });
                  }
                }}
                isLight={isLight}
                options={[
                  ...PRESET_COLOR_MAP,
                  { value: 'custom', label: 'Custom' },
                ]}
              />
            }
          />

          {/* 9. Calculation Mode (Fast selected by default, Accurate disabled) */}
          <SettingSegmentedRow
            icon={Cpu}
            iconColor="text-emerald-400"
            title="Calculation Mode"
            value={calculationMode}
            onChange={(v) => {
              if (v === 'accurate') return;
              updateConfig({ calculationMode: 'fast' });
            }}
            layout="inline"
            bordered={false}
            showDescription={false}
            options={[
              { value: 'fast', label: 'Fast' },
              { value: 'accurate', label: 'Accurate', disabled: true },
            ]}
            hoverDescription="Switch between fast trajectory prediction (default) or accurate sub-tick physics integration (coming soon)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Configure predictive ball flight horizon, dash geometry, line color tone, and calculation mode."
        hoveredDescription={hoveredDesc}
        rightLabel="Live Preview"
        rightShortcut="TAB"
        onRightClick={onCollapsePreview}
      />
    </PanelContainer>
  );
};
