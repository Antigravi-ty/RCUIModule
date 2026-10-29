import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  Scan,
  Palette,
  Moon,
  Sun,
  Gauge,
  BatteryCharging,
  Monitor,
  Sliders,
} from 'lucide-react';
import { SettingSliderRow } from '../../../compounds/SettingSliderRow';
import { SettingSegmentedRow } from '../../../compounds/SettingSegmentedRow';
import { SettingPresetCustomRow } from '../../../compounds/SettingPresetCustomRow';
import { useSettingActionRowStore } from '../../../stores/settingRowStore';

export type MenuPowerSaveOption = 'extreme' | '15' | '30' | 'disable' | 'freeze' | 'match';
export type FpsTargetOption = '30' | '60' | '75' | '90' | '120' | '240' | 'unlimited' | 'custom' | string;

export interface GraphicsConfig {
  renderScale: number;       // 25..100
  limitFps: boolean;         // false when FPS Target is 'unlimited'
  maxFps: number;            // 30 | 60 | 75 | 90 | 120 | 240 | custom
  menuPowerSave: MenuPowerSaveOption;
}

export const DEFAULT_GRAPHICS_CONFIG: GraphicsConfig = {
  renderScale: 50,
  limitFps: true,
  maxFps: 120,
  menuPowerSave: '30',
};

const FPS_PRESET_VALUES = new Set([30, 60, 75, 90, 120, 240]);

export interface DisplayTabProps {
  isLight?: boolean;
  developerMode?: boolean;
  /** Aggregated GraphicsConfig (controlled) */
  graphicsConfig?: Partial<GraphicsConfig>;
  /** Alias for graphicsConfig */
  config?: Partial<GraphicsConfig>;
  /** Initial GraphicsConfig (uncontrolled) */
  defaultGraphicsConfig?: Partial<GraphicsConfig>;
  /** Callback when any field of GraphicsConfig changes */
  onGraphicsConfigChange?: (next: GraphicsConfig, patch: Partial<GraphicsConfig>) => void;
  /** Alias for onGraphicsConfigChange */
  onChange?: (next: GraphicsConfig, patch: Partial<GraphicsConfig>) => void;
  /** UI Scaling (50..200 %) and optional maxSafeScale hint */
  uiScale?: number;
  defaultUiScale?: number;
  maxSafeScale?: number;
  onUiScaleChange?: (scale: number) => void;
  /** Safe Area Margin (-5..+10 %) */
  safeAreaMargin?: number;
  defaultSafeAreaMargin?: number;
  onSafeAreaMarginChange?: (margin: number) => void;
  /** Theme Mode */
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
  /** FPS Target & Custom FPS */
  limitFps?: boolean;
  onLimitFpsChange?: (limitFps: boolean) => void;
  maxFps?: number;
  onMaxFpsChange?: (maxFps: number) => void;
  fpsSelection?: string;
  defaultFpsSelection?: string;
  onFpsSelectionChange?: (selection: string) => void;
  customFps?: number;
  defaultCustomFps?: number;
  onCustomFpsChange?: (fps: number) => void;
  /** Power Saving */
  menuPowerSave?: MenuPowerSaveOption;
  onMenuPowerSaveChange?: (mode: MenuPowerSaveOption) => void;
  /** Render Scale (25..100 %) */
  renderScale?: number;
  defaultRenderScale?: number;
  onRenderScaleChange?: (scale: number) => void;
  highlightSetting?: string | null;
  onClearHighlight?: () => void;
  onHover: (desc: string) => void;
  onLeave: () => void;
}

/**
 * [Layer 2 Settings -> Display Tab]
 * Updated Display settings:
 * 1. `UI Scaling` — Uses shared `SettingPresetCustomRow` (`100%`, `125%`, `150%`, `Custom`) with live slide-reveal / morph-pill / popover-scrub / below-row variations.
 * 2. `Safe Area Margin` — Uneditable readout + draggable slider (`-5%` to `+10%`).
 *    (`Observe Safe Area Boundary` has been relocated to Developer Settings.)
 * 3. `Theme Mode` — Leading `Palette` (`palette`) icon, with `Moon` + `Dark Mode` and `Sun` + `Light Mode` icons inside the segmented options.
 *    (`Show Stadium Exterior Details` and `Frame Rate Limit` toggle have been removed.)
 * 4. `FPS Target` — Single long segmented control (`30`, `60`, `75`, `90`, `120`, `240`, `Custom`, `Unlimited`).
 * 5. `Power Saving` — Leading `BatteryCharging` (`battery-charging`) icon, options: `Extreme` (replaces Freeze), `15 FPS`, `30 FPS`, `Disable` (follows FPS Target).
 * 6. `Render Scale` — Uses the exact same shared `SettingPresetCustomRow` (`25%`, `50%`, `75%`, `Custom`) as `UI Scaling`.
 */
export const DisplayTab: React.FC<DisplayTabProps> = ({
  isLight = false,
  developerMode = false,
  graphicsConfig: propGraphicsConfig,
  config: propAliasConfig,
  defaultGraphicsConfig,
  onGraphicsConfigChange,
  onChange,
  uiScale: propUiScale,
  defaultUiScale = 100,
  maxSafeScale,
  onUiScaleChange,
  safeAreaMargin: propSafeAreaMargin,
  defaultSafeAreaMargin = 0,
  onSafeAreaMarginChange,
  theme: propTheme,
  onThemeChange,
  limitFps: propLimitFps,
  onLimitFpsChange,
  maxFps: propMaxFps,
  onMaxFpsChange,
  fpsSelection: propFpsSelection,
  defaultFpsSelection = '120',
  onFpsSelectionChange,
  customFps: propCustomFps,
  defaultCustomFps = 144,
  onCustomFpsChange,
  menuPowerSave: propMenuPowerSave,
  onMenuPowerSaveChange,
  renderScale: propRenderScale,
  defaultRenderScale,
  onRenderScaleChange,
  highlightSetting,
  onClearHighlight,
  onHover,
  onLeave,
}) => {
  const controlledGfx = propGraphicsConfig ?? propAliasConfig;
  const [internalTheme, setInternalTheme] = useState<'dark' | 'light'>(isLight ? 'light' : 'dark');
  const theme = propTheme ?? internalTheme;

  const [internalUiScale, setInternalUiScale] = useState<number>(defaultUiScale);
  const uiScale = propUiScale ?? internalUiScale;

  const [internalSafeAreaMargin, setInternalSafeAreaMargin] = useState<number>(defaultSafeAreaMargin);
  const safeAreaMargin = propSafeAreaMargin ?? internalSafeAreaMargin;

  const normalizePowerSave = (val?: MenuPowerSaveOption): 'extreme' | '15' | '30' | 'disable' => {
    if (val === 'freeze' || val === 'extreme') return 'extreme';
    if (val === 'match' || val === 'disable') return 'disable';
    if (val === '15') return '15';
    return '30';
  };

  const [internalGraphics, setInternalGraphics] = useState<GraphicsConfig>(() => ({
    ...DEFAULT_GRAPHICS_CONFIG,
    ...defaultGraphicsConfig,
    ...(defaultRenderScale !== undefined ? { renderScale: defaultRenderScale } : {}),
  }));

  const [internalFpsSelection, setInternalFpsSelection] = useState<string>(() => {
    if (defaultGraphicsConfig?.limitFps === false) return 'unlimited';
    if (defaultGraphicsConfig?.maxFps !== undefined) {
      return FPS_PRESET_VALUES.has(defaultGraphicsConfig.maxFps)
        ? String(defaultGraphicsConfig.maxFps)
        : 'custom';
    }
    return defaultFpsSelection;
  });

  const [internalCustomFps, setInternalCustomFps] = useState<number>(() => {
    if (
      defaultGraphicsConfig?.maxFps !== undefined &&
      !FPS_PRESET_VALUES.has(defaultGraphicsConfig.maxFps)
    ) {
      return defaultGraphicsConfig.maxFps;
    }
    return defaultCustomFps;
  });

  const resolvedLimitFps =
    propLimitFps ?? controlledGfx?.limitFps ?? internalGraphics.limitFps;
  const resolvedMaxFps =
    propMaxFps ?? controlledGfx?.maxFps ?? internalGraphics.maxFps;
  const resolvedRenderScale =
    propRenderScale ?? controlledGfx?.renderScale ?? internalGraphics.renderScale;
  const rawPowerSave =
    propMenuPowerSave ?? controlledGfx?.menuPowerSave ?? internalGraphics.menuPowerSave;
  const powerSaveValue = normalizePowerSave(rawPowerSave);

  const customFps =
    propCustomFps ??
    (controlledGfx?.maxFps !== undefined && !FPS_PRESET_VALUES.has(controlledGfx.maxFps)
      ? controlledGfx.maxFps
      : internalCustomFps);

  const fpsSelection = (() => {
    if (propFpsSelection !== undefined) return propFpsSelection;
    if (propLimitFps !== undefined || propMaxFps !== undefined || controlledGfx !== undefined) {
      if (!resolvedLimitFps) return 'unlimited';
      if (internalFpsSelection === 'custom' && resolvedMaxFps === customFps) return 'custom';
      return FPS_PRESET_VALUES.has(resolvedMaxFps) ? String(resolvedMaxFps) : 'custom';
    }
    return internalFpsSelection;
  })();

  const emitGraphicsPatch = (patch: Partial<GraphicsConfig>) => {
    const currentFull: GraphicsConfig = {
      renderScale: resolvedRenderScale,
      limitFps: resolvedLimitFps,
      maxFps: resolvedMaxFps,
      menuPowerSave: powerSaveValue,
    };
    const nextConfig: GraphicsConfig = { ...currentFull, ...patch };
    setInternalGraphics(nextConfig);
    onGraphicsConfigChange?.(nextConfig, patch);
    onChange?.(nextConfig, patch);
  };

  const handleUiScaleChange = (next: number) => {
    setInternalUiScale(next);
    onUiScaleChange?.(next);
  };

  const handleSafeAreaMarginChange = (next: number) => {
    setInternalSafeAreaMargin(next);
    onSafeAreaMarginChange?.(next);
  };

  const handleFpsPresetChange = (preset: string) => {
    setInternalFpsSelection(preset);
    onFpsSelectionChange?.(preset);
    if (preset === 'unlimited') {
      onLimitFpsChange?.(false);
      emitGraphicsPatch({ limitFps: false });
    } else if (preset === 'custom') {
      onLimitFpsChange?.(true);
      onMaxFpsChange?.(customFps);
      emitGraphicsPatch({ limitFps: true, maxFps: customFps });
    } else {
      const numericFps = Number(preset);
      onLimitFpsChange?.(true);
      onMaxFpsChange?.(numericFps);
      emitGraphicsPatch({ limitFps: true, maxFps: numericFps });
    }
  };

  const handleCustomFpsChange = (nextFps: number) => {
    setInternalCustomFps(nextFps);
    setInternalFpsSelection('custom');
    onCustomFpsChange?.(nextFps);
    onLimitFpsChange?.(true);
    onMaxFpsChange?.(nextFps);
    emitGraphicsPatch({ limitFps: true, maxFps: nextFps });
  };

  const handlePowerSaveChange = (val: string) => {
    const next = val as 'extreme' | '15' | '30' | 'disable';
    setPulsingPowerSave(false);
    onClearHighlight?.();
    onMenuPowerSaveChange?.(next);
    emitGraphicsPatch({ menuPowerSave: next });
  };

  const handleRenderScaleChange = (nextScale: number) => {
    onRenderScaleChange?.(nextScale);
    emitGraphicsPatch({ renderScale: nextScale });
  };

  const maxSafeScalePct =
    maxSafeScale !== undefined
      ? Math.round(maxSafeScale <= 4 ? maxSafeScale * 100 : maxSafeScale)
      : undefined;

  const { rowGap } = useSettingActionRowStore();

  const [pulsingPowerSave, setPulsingPowerSave] = useState(highlightSetting === 'menu-power-save');

  useEffect(() => {
    if (highlightSetting === 'menu-power-save') {
      setPulsingPowerSave(true);
      const timer = setTimeout(() => {
        setPulsingPowerSave(false);
        onClearHighlight?.();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [highlightSetting, onClearHighlight]);

  return (
    <div
      data-layout="display-settings-list"
      className="flex flex-col w-full"
      style={{ gap: `${rowGap}px` }}
    >
      {/* 1. UI Scaling (Shared SettingPresetCustomRow: 100%, 125%, 150%, Custom) */}
      <SettingPresetCustomRow
        icon={Maximize2}
        label="UI Scaling"
        subtitle={
          maxSafeScalePct !== undefined
            ? `Scale HUD, overlays, and menu interface (Max safe scale: ${maxSafeScalePct}%)`
            : 'Scale HUD, overlays, and menu interface (100%, 125%, 150%, Custom)'
        }
        value={uiScale}
        presets={[
          { value: 100, label: '100%' },
          { value: 125, label: '125%' },
          { value: 150, label: '150%' },
        ]}
        min={50}
        max={maxSafeScalePct ?? 200}
        step={5}
        unit="%"
        customRowLabel="Custom UI Scale"
        onChange={handleUiScaleChange}
        hoverDescription={
          maxSafeScalePct !== undefined
            ? `Select interface scaling preset (100%, 125%, 150%) or Custom (Max safe scale for current viewport: ${maxSafeScalePct}%).`
            : 'Select interface scaling preset (100%, 125%, 150%) or click Custom to reveal inline fine-tuning slider.'
        }
        customHoverDescription={
          maxSafeScalePct !== undefined
            ? `Fine-tune interface scale factor between 50% and ${maxSafeScalePct}%.`
            : 'Fine-tune interface scale factor between 50% and 200%.'
        }
        onHover={(desc) => desc && onHover(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 2. Safe Area Margin Slider */}
      <SettingSliderRow
        icon={Scan}
        label="Safe Area Margin"
        description="Compensates for display bezel cutouts and camera notches (-5% to +10%)"
        value={safeAreaMargin}
        min={-5}
        max={10}
        step={0.5}
        unit="%"
        developerMode={developerMode}
        onChange={handleSafeAreaMarginChange}
        hoverDescription="Compensates for display bezel cutouts and camera notches (-5% to +10%)."
        onHover={(desc) => desc && onHover(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 3. Theme Mode (Icon: Palette 'palette', options with leading Moon / Sun icons) */}
      <SettingSegmentedRow
        icon={Palette}
        iconName="palette"
        label="Theme Mode"
        subtitle="Switch between dark and light user interface styling"
        value={theme}
        onChange={(val) => {
          const next = val as 'dark' | 'light';
          setInternalTheme(next);
          onThemeChange?.(next);
        }}
        options={[
          {
            value: 'dark',
            label: 'Dark Mode',
            icon: <Moon className="h-3.5 w-3.5" />,
          },
          {
            value: 'light',
            label: 'Light Mode',
            icon: <Sun className="h-3.5 w-3.5" />,
          },
        ]}
        hoverDescription="Switches user interface appearance between Dark Mode and Light Mode."
        onHover={(desc) => desc && onHover(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 4. FPS Target (Long Segmented Control: 30, 60, 75, 90, 120, 240, Custom, Unlimited) */}
      <SettingSegmentedRow
        icon={Gauge}
        label="FPS Target"
        subtitle="Target maximum frame rate cap or Unlimited"
        value={fpsSelection}
        onChange={handleFpsPresetChange}
        options={[
          { value: '30', label: '30' },
          { value: '60', label: '60' },
          { value: '75', label: '75' },
          { value: '90', label: '90' },
          { value: '120', label: '120' },
          { value: '240', label: '240' },
          { value: 'custom', label: 'Custom' },
          { value: 'unlimited', label: 'Unlimited' },
        ]}
        hoverDescription="Select a frame rate target (30, 60, 75, 90, 120, 240), Custom for fine control, or Unlimited to uncap frame rate."
        onHover={(desc) => desc && onHover(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      {fpsSelection === 'custom' && (
        <SettingSliderRow
          icon={Sliders}
          label="Custom FPS Target"
          value={customFps}
          min={15}
          max={360}
          step={1}
          unit=" FPS"
          developerMode={developerMode}
          onChange={handleCustomFpsChange}
          hoverDescription="Sets target maximum frame rate between 15 and 360 FPS."
          onHover={(desc) => desc && onHover(desc)}
          onLeave={onLeave}
          isLight={isLight}
        />
      )}

      {/* 5. Power Saving (Renamed from Menu Power Save, icon: BatteryCharging 'battery-charging', options: Extreme, 15 FPS, 30 FPS, Disable) */}
      <div
        className={`transition-all duration-300 rounded-lg ${
          pulsingPowerSave
            ? 'ring-2 ring-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.7)] animate-pulse bg-amber-500/10'
            : ''
        }`}
      >
        <SettingSegmentedRow
          icon={BatteryCharging}
          iconName="battery-charging"
          label="Power Saving"
          subtitle="3D scene render behavior while menus are open (Disable follows FPS Target)"
          value={powerSaveValue}
          onChange={handlePowerSaveChange}
          options={[
            { value: 'extreme', label: 'Extreme' },
            { value: '15', label: '15 FPS' },
            { value: '30', label: '30 FPS' },
            { value: 'disable', label: 'Disable' },
          ]}
          hoverDescription="Controls 3D background rendering while menus are open: Extreme halts GPU rendering completely, 15/30 FPS throttles render rate to save battery, and Disable follows your FPS Target."
          onHover={(desc) => desc && onHover(desc)}
          onLeave={onLeave}
          isLight={isLight}
        />
      </div>

      {/* 6. Render Scale (Uses shared SettingPresetCustomRow: 25%, 50%, 75%, Custom — automatically syncs variations with UI Scaling) */}
      <SettingPresetCustomRow
        icon={Monitor}
        label="Render Scale"
        subtitle="Internal 3D canvas physical pixel resolution scaling"
        value={resolvedRenderScale}
        presets={[
          { value: 25, label: '25%' },
          { value: 50, label: '50%' },
          { value: 75, label: '75%' },
        ]}
        defaultCustomValue={100}
        min={25}
        max={100}
        step={1}
        unit="%"
        customRowLabel="Custom Render Scale"
        onChange={handleRenderScaleChange}
        hoverDescription="Select a preset render scale (25%, 50%, 75%) or click Custom to reveal inline resolution slider."
        customHoverDescription="Continuous internal resolution slider between 25% and 100%."
        onHover={(desc) => desc && onHover(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />
    </div>
  );
};
