import React, { useState, useEffect } from 'react';
import { Gamepad2 } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { Badge } from '../primitives/Badge';
import { DropdownMenu } from '../compounds/DropdownMenu';
import { SettingActionRow } from '../compounds/SettingActionRow';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { SettingToggleRow } from '../compounds/SettingToggleRow';
import { SettingSliderRow } from '../compounds/SettingSliderRow';
import { useMenuLayoutStore, DEFAULT_PANEL_SIZING } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import {
  ControllerDeadzoneVisualizer,
  type DeadzoneAntiAliasing,
  type StickAxisOption,
} from './controller/ControllerDeadzoneVisualizer';

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

export const Layer4ControllerSettingsRecipe: React.FC<
  Layer4ControllerSettingsRecipeProps
> = React.memo(({
  isLight = false,
  developerMode = false,
  config: controlledConfigProp,
  settings: controlledSettingsProp,
  defaultConfig,
  defaultSettings,
  onChange,
  onConfigChange,
  inputDevice: controlledInputDevice,
  defaultInputDevice = 'none',
  onInputDeviceChange,
  onReset,
  onBack = () => {},
  className = '',
}) => {
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
  const controlledSource = controlledConfigProp ?? controlledSettingsProp;

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

          {/* 9. Show Circular Overlay (HalfwayDead Visualizer Option) */}
          <SettingToggleRow
            title="Show Circular Overlay"
            checked={showCircularOverlay}
            onChange={setShowCircularOverlay}
            bordered={false}
            showDescription={false}
            hoverDescription="Display circular physical thumbstick boundary overlay on the Turning and Dodging diagrams."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 10. Max. Diagonal Value (HalfwayDead Visualizer Option) */}
          <SettingSliderRow
            title="Max. Diagonal Value"
            min={0.5}
            max={1.0}
            step={0.01}
            value={maxDiagonal}
            onChange={setMaxDiagonal}
            disabled={!showCircularOverlay}
            layout="inline"
            bordered={false}
            showDescription={false}
            developerMode={developerMode}
            hoverDescription="Maximum diagonal coordinate reached by the physical circular controller gate (default 0.77)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 11. Display Alternative Arrow (HalfwayDead Visualizer Option) */}
          <SettingToggleRow
            title="Display Alternative Arrow"
            checked={altArrow}
            onChange={setAltArrow}
            bordered={false}
            showDescription={false}
            hoverDescription="Anchor the Turning vector arrow at the deadzone offset pointing to the raw cursor position."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 12. Anti-Aliasing (HalfwayDead Visualizer Option) */}
          <SettingSegmentedRow
            title="Anti-Aliasing"
            value={antiAliasing}
            onChange={(val) => setAntiAliasing(val as DeadzoneAntiAliasing)}
            options={[
              { value: 'off', label: 'Off' },
              { value: '4x', label: '4x' },
              { value: '9x', label: '9x' },
              { value: '16x', label: '16x' },
            ]}
            bordered={false}
            showDescription={false}
            hoverDescription="Supersampling anti-aliasing factor for the Turning and Dodging deadzone diagrams."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 13. Turning & Dodging Deadzone Visualizer + Dual Raw Input Readouts */}
          <ControllerDeadzoneVisualizer
            deadzone={stickDeadzone}
            dodgeDeadzone={dodgeDeadzone}
            showCircularOverlay={showCircularOverlay}
            maxDiagonal={maxDiagonal}
            altArrow={altArrow}
            antiAliasing={antiAliasing}
            steerAxisRole={steerAxisRole}
            invertSteerAxis={invertSteerAxis}
            pitchAxisRole={pitchAxisRole}
            invertPitchAxis={invertPitchAxis}
            selectedGamepadIndex={selectedGamepadIndex}
            isLight={isLight}
            onHover={(desc) => setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
          />

          {/* 14. Reset to Default Button */}
          <button
            type="button"
            onClick={handleResetToDefault}
            onMouseEnter={() =>
              setHoveredDesc(
                'Restore default controller stick axes, deadzones, trigger threshold, and visualizer settings.'
              )
            }
            onMouseLeave={() => setHoveredDesc(null)}
            className={`mt-1 w-full py-2 px-3 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
            }`}
          >
            Reset to Default
          </button>
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
