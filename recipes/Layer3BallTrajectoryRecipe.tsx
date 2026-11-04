import React, { useState } from 'react';
import { Cpu, Palette, Sliders } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { SegmentedSwitch } from '../primitives/SegmentedSwitch';
import { SettingActionRow } from '../compounds/SettingActionRow';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { SettingSliderRow } from '../compounds/SettingSliderRow';
import { SettingToggleRow } from '../compounds/SettingToggleRow';
import { BounceSolidSvg } from '../primitives/packagedSvgIcons';
import { useAppStore } from '../stores/appStore';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { DEFAULT_PANEL_SIZING } from '../tokens/menuLayoutTokens';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import {
  DEFAULT_TRAJECTORY_CONFIG,
  type TrajectoryConfig,
  type TrajectoryUpdateMode,
} from '../config/trainingDefaults';
import { BALL_TRAJECTORY_TUNER_PRESET } from '../stores/devFloatingPresets';
import { FloatingWindowCard } from './settings/components/FloatingWindowCard';

export { DEFAULT_TRAJECTORY_CONFIG, type TrajectoryConfig };

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
 * - Developer-gated controls (`Line Thickness`, `Solid Dash Length`, `Transparent Gap`) respect
 *   `allowUserThicknessEdit` and `allowUserDashEdit` calibrated in `BallTrajectoryTunerFloatingWindow`.
 * - Calculation Mode selects between Continuous Incremental Tail Prediction (600t) and Event Snapshot.
 */
export const Layer3BallTrajectoryRecipe: React.FC<Layer3BallTrajectoryRecipeProps> = ({
  isLight = false,
  developerMode: propDeveloperMode,
  onBack: propOnBack,
  onCollapsePreview: propOnCollapsePreview,
  transparent = false,
  config: controlledConfigProp,
  settings: controlledSettingsProp,
  defaultConfig,
  defaultSettings,
  onChange: propOnChange,
  onConfigChange,
}) => {
  const goBack = useAppStore((s) => s.goBack);
  const storeDeveloperMode = useAppStore((s) => s.developerMode);
  const storeTrajectory = useAppStore((s) => s.trajectory);
  const storeUpdateTrajectory = useAppStore((s) => s.updateTrajectory);
  const setLivePreviewCollapsed = useAppStore((s) => s.setLivePreviewCollapsed);

  const developerMode = propDeveloperMode ?? storeDeveloperMode;
  const onBack = propOnBack ?? goBack;
  const onCollapsePreview =
    propOnCollapsePreview ?? (() => setLivePreviewCollapsed(true));
  const onChange =
    propOnChange ??
    ((_next: TrajectoryConfig, patch: Partial<TrajectoryConfig>) =>
      storeUpdateTrajectory(patch));

  const sizing = useMenuLayoutStore(
    (s) => s.panels?.['layer3-ball-trajectory'] ?? DEFAULT_PANEL_SIZING['layer3-ball-trajectory']
  );
  const { rowGap } = useSettingActionRowStore();

  const initialSeed: TrajectoryConfig = {
    ...DEFAULT_TRAJECTORY_CONFIG,
    ...defaultSettings,
    ...defaultConfig,
  };

  const [internalConfig, setInternalConfig] = useState<TrajectoryConfig>(initialSeed);
  const [customHexColor, setCustomHexColor] = useState<string>(() =>
    initialSeed.color.startsWith('#') ? initialSeed.color : '#ffffff'
  );

  const hasInitialSeedOverride = Boolean(defaultConfig || defaultSettings);
  const controlledSource =
    controlledConfigProp ??
    controlledSettingsProp ??
    (hasInitialSeedOverride ? undefined : storeTrajectory);
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
    resolved.duration ?? Number(((resolved.predictionTicks || 396) / 120).toFixed(1));
  const lineThickness = resolved.thickness ?? 20;
  // Support both 0..1 fraction (RocketCompanion store) and 5..100 percentage
  const isNormalizedOpacity = (resolved.opacity ?? 0.5) <= 1.0;
  const lineOpacityPct = isNormalizedOpacity
    ? Math.round((resolved.opacity ?? 0.5) * 100)
    : Math.round(resolved.opacity ?? 50);
  const solidDashLength = resolved.solidTicks ?? 50;
  const transparentGap = resolved.transparentTicks ?? 20;
  const updateMode: TrajectoryUpdateMode =
    resolved.updateMode === 'event-snapshot' || resolved.updateMode === 'full-every-tick'
      ? resolved.updateMode
      : 'continuous-incremental';

  const canEditThickness = Boolean(developerMode || resolved.allowUserThicknessEdit);
  const canEditDashes = Boolean(developerMode || resolved.allowUserDashEdit !== false);

  const normalizedColor = (resolved.color || '#ffffff').toLowerCase();
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
          {/* Developer Active Tuner Launcher (Visible when Developer Mode is enabled) */}
          {developerMode && (
            <FloatingWindowCard
              preset={BALL_TRAJECTORY_TUNER_PRESET}
              icon={Sliders}
              iconColor="text-amber-400"
              badge="WASM Incr · 3D Tube · JSON"
              badgeClass="bg-amber-500/15 border-amber-500/30 text-amber-400"
              bordered={false}
              showDescription={false}
              description="Open Ball Trajectory Prediction Line Tuner for WASM incremental tail thresholds, 3D tube shading, spatial depth cues & JSON export"
              hoverTooltip="Ball Trajectory Prediction Line Tuner (Developer Floating Window): Live telemetry, WASM incremental triggers, 3D volumetric tube shading, bounce markers, ground drop lines, user access locks, and JSON export."
              onHover={setHoveredDesc}
              onLeave={() => setHoveredDesc(null)}
              isLight={isLight}
            />
          )}

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
            hoverDescription="Switch between velocity-scaled dynamic dashes (pushes line) or world-anchored static dash geometry (follows line)."
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

          {/* 4. Line Thickness (Developer-only by default unless unlocked in Developer Tuner) */}
          {canEditThickness && (
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
              hoverDescription="3D trajectory tube/ribbon thickness as percentage of ball diameter (1% to 75%). Developer-locked by default."
              onHover={(desc) => desc && setHoveredDesc(desc)}
              onLeave={() => setHoveredDesc(null)}
              isLight={isLight}
            />
          )}

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

          {/* 6 & 7. Solid Dash Length & Transparent Gap (Gated by allowUserDashEdit) */}
          {canEditDashes && (
            <>
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
            </>
          )}

          {/* 8. Line Color Tone */}
          <SettingActionRow
            icon={Palette}
            iconColor="text-purple-400"
            title="Line Color Tone"
            bordered={false}
            showDescription={false}
            hoverDescription="Select visual color preset or pick a custom hex color for the predictive trajectory tube."
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

          {/* 9. Calculation Mode (Continuous Incremental 600t Tail vs Event Snapshot) */}
          <SettingSegmentedRow
            icon={Cpu}
            iconColor="text-emerald-400"
            title="Calculation Mode"
            value={updateMode === 'event-snapshot' ? 'event-snapshot' : 'continuous-incremental'}
            onChange={(v) => {
              const nextMode: TrajectoryUpdateMode =
                v === 'event-snapshot' ? 'event-snapshot' : 'continuous-incremental';
              updateConfig({
                updateMode: nextMode,
                calculationMode: nextMode === 'continuous-incremental' ? 'fast' : 'accurate',
              });
            }}
            layout="inline"
            bordered={false}
            showDescription={false}
            options={[
              { value: 'continuous-incremental', label: 'Incremental (600t)' },
              { value: 'event-snapshot', label: 'Snapshot (Hit Only)' },
            ]}
            hoverDescription="Incremental (600t): Continuously extends the tail to maintain a full 5.0s lookahead at ~1/100th CPU cost, recomputing from scratch only on Car-Ball Hit or deviation. Snapshot: Recomputes only on collision/deviation and shrinks as the ball flies."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Configure predictive ball flight horizon, dash geometry, line color tone, and WASM incremental mode."
        hoveredDescription={hoveredDesc}
        rightLabel="Live Preview"
        rightShortcut="TAB"
        onRightClick={onCollapsePreview}
      />
    </PanelContainer>
  );
};
