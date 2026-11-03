import React, { useState, useEffect } from 'react';
import { Gamepad2 } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { Badge } from '../primitives/Badge';
import { DropdownMenu } from '../compounds/DropdownMenu';
import { SettingActionRow } from '../compounds/SettingActionRow';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { SettingToggleRow } from '../compounds/SettingToggleRow';
import { SettingSliderRow } from '../compounds/SettingSliderRow';
import { useAppStore } from '../stores/appStore';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { DEFAULT_PANEL_SIZING } from '../tokens/menuLayoutTokens';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import {
  loadInputBindings,
  saveInputBindings,
  resetAxisBindings,
  getSelectedController,
  setSelectedController,
  getConnectedGamepads,
} from '../config/inputBindings';
import type {
  DeadzoneAntiAliasing,
  StickAxisOption,
} from './controller/deadzoneCanvasRenderer';
import { ControllerVisualizerOptionsSection } from './controller/ControllerVisualizerOptionsSection';

export type AirRollConflictMode = 'override' | 'cancel';
export type AnalogCurveShape = 'linear' | 'precision-s' | 'aggressive';

export interface ControllerAxesConfig {
  steer: { axis: number; invert: boolean };
  pitch: { axis: number; invert: boolean };
  deadzone: number;          // 0.00..0.50, step 0.01, default 0.12
  dodgeDeadzone?: number;    // 0.10..0.95, step 0.01, default 0.70
  triggerThreshold: number;  // 0.05..0.95, step 0.05, default 0.15
}

export const DEFAULT_CONTROLLER_AXES_CONFIG: ControllerAxesConfig = {
  steer: { axis: 0, invert: false },
  pitch: { axis: 1, invert: false },
  deadzone: 0.12,
  dodgeDeadzone: 0.70,
  triggerThreshold: 0.15,
};

const AXIS_INDEX_TO_ROLE: Record<number, StickAxisOption> = {
  0: 'left-x',
  1: 'left-y',
  2: 'right-x',
  3: 'right-y',
};

const ROLE_TO_AXIS_INDEX: Record<StickAxisOption, number> = {
  'left-x': 0,
  'left-y': 1,
  'right-x': 2,
  'right-y': 3,
};

export interface Layer4ControllerSettingsRecipeProps {
  isLight?: boolean;
  developerMode?: boolean;
  defaultAirRollConflict?: AirRollConflictMode;
  defaultLeftStickCurve?: AnalogCurveShape;
  defaultSteeringSensitivity?: number;
  defaultAerialSensitivity?: number;
  /** Controlled controller axes & deadzone configuration */
  config?: Partial<ControllerAxesConfig>;
  /** Alias for config */
  settings?: Partial<ControllerAxesConfig>;
  /** Initial controller axes configuration for uncontrolled mode */
  defaultConfig?: Partial<ControllerAxesConfig>;
  /** Alias for defaultConfig */
  defaultSettings?: Partial<ControllerAxesConfig>;
  /** Callback fired when any controller axes / deadzone / trigger setting changes */
  onChange?: (next: ControllerAxesConfig, patch: Partial<ControllerAxesConfig>) => void;
  /** Alias for onChange */
  onConfigChange?: (next: ControllerAxesConfig, patch: Partial<ControllerAxesConfig>) => void;
  /** Controlled input device ID */
  inputDevice?: string;
  /** Initial input device ID for uncontrolled mode */
  defaultInputDevice?: string;
  /** Callback when input device selection changes */
  onInputDeviceChange?: (deviceId: string) => void;
  /** Callback when Reset to Default button is clicked */
  onReset?: (defaults: ControllerAxesConfig) => void;
  onBack?: () => void;
  className?: string;
}

const STICK_AXIS_OPTIONS: Array<{ value: StickAxisOption; label: string }> = [
  { value: 'left-x', label: 'Left Stick X' },
  { value: 'left-y', label: 'Left Stick Y' },
  { value: 'right-x', label: 'Right Stick X' },
  { value: 'right-y', label: 'Right Stick Y' },
];

export const Layer4ControllerSettingsRecipe: React.FC<Layer4ControllerSettingsRecipeProps> = React.memo(({
  isLight = false,
  developerMode = false,
  config: controlledConfigProp,
  settings: controlledSettingsProp,
  defaultConfig,
  defaultSettings,
  onChange: propOnChange,
  onConfigChange,
  inputDevice: propInputDevice,
  defaultInputDevice = 'none',
  onInputDeviceChange: propOnInputDeviceChange,
  onReset: propOnReset,
  onBack: propOnBack,
  className = '',
}) => {
  const goBack = useAppStore((s) => s.goBack);
  const bridge = useAppStore((s) => s.bridge);
  const [bindings, setBindings] = useState(() => {
    try {
      return loadInputBindings();
    } catch {
      return {
        axes: {
          steer: { axis: 0, invert: false },
          pitch: { axis: 1, invert: false },
          deadzone: 0.12,
          triggerThreshold: 0.15,
        },
      };
    }
  });
  const [storeInputDevice, setStoreInputDevice] = useState<string>(() => {
    try {
      const sel = getSelectedController();
      if (sel && sel.index !== null && sel.index !== undefined) {
        return `pad-${sel.index}`;
      }
    } catch {
      // ignore
    }
    return defaultInputDevice;
  });

  const onBack = propOnBack ?? goBack;
  const onChange =
    propOnChange ??
    ((nextConfig: ControllerAxesConfig) => {
      const nextBindings = {
        ...bindings,
        axes: {
          ...bindings.axes,
          steer: { ...nextConfig.steer },
          pitch: { ...nextConfig.pitch },
          deadzone: nextConfig.deadzone,
          triggerThreshold: nextConfig.triggerThreshold,
        },
      };
      setBindings(nextBindings);
      saveInputBindings(nextBindings);
      bridge.onBindingsChange?.(nextBindings);
    });
  const onReset =
    propOnReset ??
    (() => {
      const nextBindings = { ...bindings };
      resetAxisBindings(nextBindings);
      setBindings(nextBindings);
      saveInputBindings(nextBindings);
      bridge.onBindingsChange?.(nextBindings);
    });
  const controlledInputDevice = propInputDevice ?? storeInputDevice;
  const onInputDeviceChange =
    propOnInputDeviceChange ??
    ((deviceId: string) => {
      setStoreInputDevice(deviceId);
      if (deviceId === 'none' || !deviceId.startsWith('pad-')) {
        setSelectedController(null);
        return;
      }
      const padIdx = parseInt(deviceId.replace('pad-', ''), 10);
      const pads = getConnectedGamepads().filter((p) => p && p.connected);
      const pad = pads.find((p) => p && p.index === padIdx);
      if (pad) {
        setSelectedController({ id: pad.id, index: pad.index });
      }
    });

  const { rowGap } = useSettingActionRowStore();
  const sizing = useMenuLayoutStore(
    (s) => s.panels?.['layer4-controller-settings'] ?? DEFAULT_PANEL_SIZING['layer4-controller-settings']
  );

  const [connectedPads, setConnectedPads] = useState<Array<{ index: number; id: string }>>([]);
  const [internalInputDevice, setInternalInputDevice] = useState<string>(defaultInputDevice);
  const inputDevice = controlledInputDevice ?? internalInputDevice;

  const setInputDevice = (nextDevice: string | ((prev: string) => string)) => {
    const resolvedNext =
      typeof nextDevice === 'function' ? nextDevice(inputDevice) : nextDevice;
    if (controlledInputDevice === undefined) {
      setInternalInputDevice(resolvedNext);
    }
    onInputDeviceChange?.(resolvedNext);
  };

  const initialSeed: ControllerAxesConfig = {
    ...DEFAULT_CONTROLLER_AXES_CONFIG,
    ...defaultSettings,
    ...defaultConfig,
    steer: {
      ...DEFAULT_CONTROLLER_AXES_CONFIG.steer,
      ...defaultSettings?.steer,
      ...defaultConfig?.steer,
    },
    pitch: {
      ...DEFAULT_CONTROLLER_AXES_CONFIG.pitch,
      ...defaultSettings?.pitch,
      ...defaultConfig?.pitch,
    },
  };

  const [internalConfig, setInternalConfig] = useState<ControllerAxesConfig>(initialSeed);
  const hasDefaultConfigOverride = Boolean(defaultConfig || defaultSettings);
  const controlledSource =
    controlledConfigProp ??
    controlledSettingsProp ??
    (hasDefaultConfigOverride ? undefined : bindings.axes);

  const resolvedConfig: ControllerAxesConfig = {
    ...internalConfig,
    ...controlledSource,
    steer: {
      ...internalConfig.steer,
      ...controlledSource?.steer,
    },
    pitch: {
      ...internalConfig.pitch,
      ...controlledSource?.pitch,
    },
  };

  const updateConfig = (patch: Partial<ControllerAxesConfig>) => {
    const next: ControllerAxesConfig = {
      ...resolvedConfig,
      ...patch,
      steer: patch.steer ? { ...resolvedConfig.steer, ...patch.steer } : resolvedConfig.steer,
      pitch: patch.pitch ? { ...resolvedConfig.pitch, ...patch.pitch } : resolvedConfig.pitch,
    };
    if (controlledSource === undefined) {
      setInternalConfig(next);
    }
    onChange?.(next, patch);
    onConfigChange?.(next, patch);
  };

  const steerAxisRole: StickAxisOption =
    AXIS_INDEX_TO_ROLE[resolvedConfig.steer.axis] ?? 'left-x';
  const invertSteerAxis = resolvedConfig.steer.invert;
  const pitchAxisRole: StickAxisOption =
    AXIS_INDEX_TO_ROLE[resolvedConfig.pitch.axis] ?? 'left-y';
  const invertPitchAxis = resolvedConfig.pitch.invert;
  const stickDeadzone = resolvedConfig.deadzone;
  const dodgeDeadzone = resolvedConfig.dodgeDeadzone ?? DEFAULT_CONTROLLER_AXES_CONFIG.dodgeDeadzone ?? 0.70;
  const triggerThreshold = resolvedConfig.triggerThreshold;

  // Visualizer options ported from HalfwayDead's Rocket League Deadzone Visualizer
  const [showCircularOverlay, setShowCircularOverlay] = useState<boolean>(true);
  const [maxDiagonal, setMaxDiagonal] = useState<number>(0.77);
  const [altArrow, setAltArrow] = useState<boolean>(false);
  const [antiAliasing, setAntiAliasing] = useState<DeadzoneAntiAliasing>('4x');

  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const handleResetToDefault = () => {
    const defaults: ControllerAxesConfig = {
      steer: { ...DEFAULT_CONTROLLER_AXES_CONFIG.steer },
      pitch: { ...DEFAULT_CONTROLLER_AXES_CONFIG.pitch },
      deadzone: DEFAULT_CONTROLLER_AXES_CONFIG.deadzone,
      dodgeDeadzone: DEFAULT_CONTROLLER_AXES_CONFIG.dodgeDeadzone,
      triggerThreshold: DEFAULT_CONTROLLER_AXES_CONFIG.triggerThreshold,
    };
    if (controlledSource === undefined) {
      setInternalConfig(defaults);
    }
    setShowCircularOverlay(true);
    setMaxDiagonal(0.77);
    setAltArrow(false);
    setAntiAliasing('4x');
    onChange?.(defaults, defaults);
    onConfigChange?.(defaults, defaults);
    onReset?.(defaults);
  };

  useEffect(() => {
    const syncGamepads = () => {
      if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
        return;
      }
      const rawPads = navigator.getGamepads();
      const detected: Array<{ index: number; id: string }> = [];
      for (let i = 0; i < rawPads.length; i++) {
        const gp = rawPads[i];
        if (gp && gp.connected) {
          detected.push({ index: gp.index, id: gp.id || `Gamepad #${gp.index + 1}` });
        }
      }
      setConnectedPads(detected);
      if (detected.length > 0 && inputDevice === 'none') {
        setInputDevice(`pad-${detected[0].index}`);
      }
    };

    syncGamepads();
    window.addEventListener('gamepadconnected', syncGamepads);
    window.addEventListener('gamepaddisconnected', syncGamepads);
    return () => {
      window.removeEventListener('gamepadconnected', syncGamepads);
      window.removeEventListener('gamepaddisconnected', syncGamepads);
    };
  }, [inputDevice]);

  const isGamepadActive = inputDevice !== 'none' || connectedPads.length > 0;
  const gamepadBadgeLabel = isGamepadActive
    ? connectedPads.length > 1
      ? `${connectedPads.length} Gamepads Detected`
      : '1 Gamepad Detected'
    : 'No Gamepad Detected';

  const deviceOptions = [
    {
      value: 'none',
      label: connectedPads.length > 0 ? 'None' : 'None Found',
    },
    ...connectedPads.map((p) => ({
      value: `pad-${p.index}`,
      label: p.id,
    })),
    { value: 'dualsense', label: 'DualSense Wireless Controller' },
    { value: 'xbox', label: 'Xbox Wireless Controller' },
  ];

  const selectedGamepadIndex = inputDevice.startsWith('pad-')
    ? parseInt(inputDevice.replace('pad-', ''), 10)
    : null;

  return (
    <PanelContainer
      isLight={isLight}
      sizing={sizing}
      className={`w-full select-none ${className}`}
    >
      <PanelHeader
        isLight={isLight}
        title="CONTROLLER SETTINGS"
        onBack={onBack}
      />

      <PanelContent scrollable={true}>
        <div
          data-layout="controller-settings-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          {/* 1. Controller Input Device (Green Controller icon + status Badge + DropdownMenu) */}
          <SettingActionRow
            icon={Gamepad2}
            iconColor="text-emerald-500"
            title="Controller Input Device"
            bordered={false}
            showDescription={false}
            badge={
              <Badge
                variant={isGamepadActive ? 'emerald' : 'warning'}
                size="sm"
                dot
                isLight={isLight}
                onClick={(e) => {
                  e.stopPropagation();
                  setInputDevice((prev) => (prev === 'none' ? 'dualsense' : 'none'));
                }}
                title="Click to toggle simulated gamepad detection state"
                className="cursor-pointer"
              >
                {gamepadBadgeLabel}
              </Badge>
            }
            hoverDescription="Select active controller input device or inspect gamepad detection status."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
            rightSlot={
              <DropdownMenu
                value={inputDevice}
                options={deviceOptions}
                onChange={(val) => setInputDevice(String(val))}
                align="right"
                menuWidthClass="w-64"
                isLight={isLight}
                className="min-w-[168px]"
              />
            }
          />

          {/* 2. Steer / Yaw Axis (4 axes DropdownMenu) */}
          <SettingSegmentedRow
            title="Steer / Yaw Axis"
            controlType="dropdown"
            value={steerAxisRole}
            onChange={(val) =>
              updateConfig({
                steer: {
                  ...resolvedConfig.steer,
                  axis: ROLE_TO_AXIS_INDEX[val as StickAxisOption] ?? 0,
                },
              })
            }
            options={STICK_AXIS_OPTIONS}
            bordered={false}
            showDescription={false}
            hoverDescription="Select which analog stick axis controls horizontal vehicle steering and aerial yaw."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 3. Invert Steer Axis (ToggleSwitch) */}
          <SettingToggleRow
            title="Invert Steer Axis"
            checked={invertSteerAxis}
            onChange={(invert) =>
              updateConfig({
                steer: { ...resolvedConfig.steer, invert },
              })
            }
            bordered={false}
            showDescription={false}
            hoverDescription="Reverse horizontal steering and yaw axis polarity."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 4. Pitch (Tilt) Axis (4 axes DropdownMenu) */}
          <SettingSegmentedRow
            title="Pitch (Tilt) Axis"
            controlType="dropdown"
            value={pitchAxisRole}
            onChange={(val) =>
              updateConfig({
                pitch: {
                  ...resolvedConfig.pitch,
                  axis: ROLE_TO_AXIS_INDEX[val as StickAxisOption] ?? 1,
                },
              })
            }
            options={STICK_AXIS_OPTIONS}
            bordered={false}
            showDescription={false}
            hoverDescription="Select which analog stick axis controls vertical aerial pitch (tilt) and dodge forward/back."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 5. Invert Pitch Axis (ToggleSwitch) */}
          <SettingToggleRow
            title="Invert Pitch Axis"
            checked={invertPitchAxis}
            onChange={(invert) =>
              updateConfig({
                pitch: { ...resolvedConfig.pitch, invert },
              })
            }
            bordered={false}
            showDescription={false}
            hoverDescription="Reverse vertical aerial pitch (tilt) axis polarity."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 6. Deadzone */}
          <SettingSliderRow
            title="Deadzone"
            min={0.0}
            max={0.5}
            step={0.01}
            value={stickDeadzone}
            onChange={(deadzone) => updateConfig({ deadzone })}
            layout="inline"
            bordered={false}
            showDescription={false}
            developerMode={developerMode}
            hoverDescription="Axial cross deadzone threshold (0.00 to 0.50) filtering center thumbstick drift."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 7. Dodge Deadzone */}
          <SettingSliderRow
            title="Dodge Deadzone"
            min={0.1}
            max={0.95}
            step={0.01}
            value={dodgeDeadzone}
            onChange={(nextDodgeDeadzone) => updateConfig({ dodgeDeadzone: nextDodgeDeadzone })}
            layout="inline"
            bordered={false}
            showDescription={false}
            developerMode={developerMode}
            hoverDescription="Minimum stick deflection required to trigger a directional dodge instead of a double jump (0.10 to 0.95)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 8. Trigger Threshold */}
          <SettingSliderRow
            title="Trigger Threshold"
            min={0.05}
            max={0.95}
            step={0.05}
            value={triggerThreshold}
            onChange={(nextTriggerThreshold) =>
              updateConfig({ triggerThreshold: nextTriggerThreshold })
            }
            layout="inline"
            bordered={false}
            showDescription={false}
            developerMode={developerMode}
            hoverDescription="Minimum L2/R2 analog trigger depression required to register throttle or reverse input (0.05 to 0.95)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          <ControllerVisualizerOptionsSection
            stickDeadzone={stickDeadzone}
            dodgeDeadzone={dodgeDeadzone}
            showCircularOverlay={showCircularOverlay}
            onShowCircularOverlayChange={setShowCircularOverlay}
            maxDiagonal={maxDiagonal}
            onMaxDiagonalChange={setMaxDiagonal}
            altArrow={altArrow}
            onAltArrowChange={setAltArrow}
            antiAliasing={antiAliasing}
            onAntiAliasingChange={setAntiAliasing}
            steerAxisRole={steerAxisRole}
            invertSteerAxis={invertSteerAxis}
            pitchAxisRole={pitchAxisRole}
            invertPitchAxis={invertPitchAxis}
            selectedGamepadIndex={selectedGamepadIndex}
            developerMode={developerMode}
            isLight={isLight}
            onHoverDesc={setHoveredDesc}
            onResetToDefault={handleResetToDefault}
          />
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Configure controller input device, analog stick axes, deadzones, trigger threshold, and interactive Turning & Dodging visualizer."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
});

Layer4ControllerSettingsRecipe.displayName = 'Layer4ControllerSettingsRecipe';
