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
import { useAppStore } from '../../../stores/appStore';
import { useViewportStore, viewportStore } from '../../../stores/viewportStore';
import { calculateSettingsSafeScale } from '../../../config/uiConfig';

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
  /** Optional controlled GraphicsConfig override */
  graphicsConfig?: Partial<GraphicsConfig>;
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
  highlightSetting: propHighlightSetting,
  onClearHighlight: propOnClearHighlight,
  onHover,
  onLeave,
}) => {
  const storeTheme = useAppStore((s) => s.theme);
  const setStoreTheme = useAppStore((s) => s.setTheme);
  const storeGraphics = useAppStore((s) => s.graphics);
  const updateStoreGraphics = useAppStore((s) => s.updateGraphics);
  const storeRenderScale = useAppStore((s) => s.renderScale);
  const setStoreRenderScale = useAppStore((s) => s.setRenderScale);
  const storeHighlightSetting = useAppStore((s) => s.highlightSetting);
  const clearHighlightSetting = useAppStore((s) => s.clearHighlightSetting);

  const highlightSetting = propHighlightSetting ?? storeHighlightSetting;
  const onClearHighlight = propOnClearHighlight ?? clearHighlightSetting;

  const {
    renderScale: uiScale = 100,
    safeAreaMargin = 0,
  } = useViewportStore();
  const setUiScale = viewportStore.setRenderScale;
  const setSafeAreaMargin = viewportStore.setSafeAreaMargin;

  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxSafeScale = calculateSettingsSafeScale(
    windowDimensions.width,
    windowDimensions.height,
    safeAreaMargin
  );

  const normalizePowerSave = (val?: MenuPowerSaveOption): 'extreme' | '15' | '30' | 'disable' => {
    if (val === 'freeze' || val === 'extreme') return 'extreme';
    if (val === 'match' || val === 'disable') return 'disable';
    if (val === '15') return '15';
    return '30';
  };

  const [internalGraphics, setInternalGraphics] = useState<GraphicsConfig>(() => ({
    ...DEFAULT_GRAPHICS_CONFIG,
    renderScale: storeRenderScale ?? storeGraphics.renderScale ?? DEFAULT_GRAPHICS_CONFIG.renderScale,
    limitFps: storeGraphics.limitFps,
    maxFps: storeGraphics.maxFps,
    menuPowerSave: normalizePowerSave(storeGraphics.menuPowerSave),
  }));

  const [internalFpsSelection, setInternalFpsSelection] = useState<string>(() => {
    const initLimit = storeGraphics.limitFps;
    const initMax = storeGraphics.maxFps;
    if (initLimit === false) return 'unlimited';
    if (initMax !== undefined) {
      return FPS_PRESET_VALUES.has(initMax) ? String(initMax) : 'custom';
    }
    return '120';
  });

  const [internalCustomFps, setInternalCustomFps] = useState<number>(() => {
    const initMax = storeGraphics.maxFps;
    if (initMax !== undefined && !FPS_PRESET_VALUES.has(initMax)) {
      return initMax;
    }
    return 144;
  });

  const resolvedLimitFps =
    propGraphicsConfig?.limitFps ?? storeGraphics.limitFps ?? internalGraphics.limitFps;
  const resolvedMaxFps =
    propGraphicsConfig?.maxFps ?? storeGraphics.maxFps ?? internalGraphics.maxFps;
  const resolvedRenderScale =
    propGraphicsConfig?.renderScale ?? storeRenderScale ?? internalGraphics.renderScale;
  const rawPowerSave =
    propGraphicsConfig?.menuPowerSave ?? storeGraphics.menuPowerSave ?? internalGraphics.menuPowerSave;
  const powerSaveValue = normalizePowerSave(rawPowerSave);

  const customFps =
    propGraphicsConfig?.maxFps !== undefined && !FPS_PRESET_VALUES.has(propGraphicsConfig.maxFps)
      ? propGraphicsConfig.maxFps
      : internalCustomFps;

  const fpsSelection = (() => {
    if (!resolvedLimitFps) return 'unlimited';
    if (internalFpsSelection === 'custom' && resolvedMaxFps === customFps) return 'custom';
    return FPS_PRESET_VALUES.has(resolvedMaxFps) ? String(resolvedMaxFps) : 'custom';
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
  };

  const handleFpsPresetChange = (preset: string) => {
    setInternalFpsSelection(preset);
    if (preset === 'unlimited') {
      updateStoreGraphics({ limitFps: false });
      emitGraphicsPatch({ limitFps: false });
    } else if (preset === 'custom') {
      updateStoreGraphics({ limitFps: true, maxFps: customFps });
      emitGraphicsPatch({ limitFps: true, maxFps: customFps });
    } else {
      const numericFps = Number(preset);
      updateStoreGraphics({ limitFps: true, maxFps: numericFps });
      emitGraphicsPatch({ limitFps: true, maxFps: numericFps });
    }
  };

  const handleCustomFpsChange = (nextFps: number) => {
    setInternalCustomFps(nextFps);
    setInternalFpsSelection('custom');
    updateStoreGraphics({ limitFps: true, maxFps: nextFps });
    emitGraphicsPatch({ limitFps: true, maxFps: nextFps });
  };

  const handlePowerSaveChange = (val: string) => {
    const next = val as 'extreme' | '15' | '30' | 'disable';
    setPulsingPowerSave(false);
    onClearHighlight?.();
    const mapped =
      next === 'extreme'
        ? 'freeze'
        : next === 'disable'
        ? 'match'
        : next;
    updateStoreGraphics({ menuPowerSave: mapped });
    emitGraphicsPatch({ menuPowerSave: next });
  };

  const handleRenderScaleChange = (nextScale: number) => {
    setStoreRenderScale(nextScale);
    updateStoreGraphics({ renderScale: nextScale });
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
        onChange={setUiScale}
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
        onChange={setSafeAreaMargin}
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
        value={storeTheme}
        onChange={(val) => setStoreTheme(val as 'dark' | 'light')}
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
