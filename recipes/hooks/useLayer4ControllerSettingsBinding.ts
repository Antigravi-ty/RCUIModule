import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import {
  loadInputBindings,
  saveInputBindings,
  resetAxisBindings,
  getSelectedController,
  setSelectedController,
  getConnectedGamepads,
} from '../../config/inputBindings';

export interface ControllerAxesConfig {
  steer: { axis: number; invert: boolean };
  pitch: { axis: number; invert: boolean };
  deadzone: number;
  triggerThreshold: number;
}

export function useLayer4ControllerSettingsStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const bridge = useAppStore((s) => s.bridge);
  const [bindings, setBindings] = useState(() => {
    try {
      return loadInputBindings();
    } catch {
      return {
        keyboard: {},
        pad: {},
        axes: {
          steer: { axis: 0, invert: false },
          pitch: { axis: 1, invert: false },
          deadzone: 0.12,
          triggerThreshold: 0.15,
        },
      };
    }
  });

  const [inputDevice, setInputDevice] = useState<string>(() => {
    try {
      const sel = getSelectedController();
      if (sel && sel.index !== null && sel.index !== undefined) {
        return `pad-${sel.index}`;
      }
    } catch {
      // ignore
    }
    return 'none';
  });

  const handleConfigChange = (nextConfig: ControllerAxesConfig) => {
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
  };

  const handleReset = () => {
    const nextBindings = { ...bindings };
    resetAxisBindings(nextBindings);
    setBindings(nextBindings);
    saveInputBindings(nextBindings);
    bridge.onBindingsChange?.(nextBindings);
  };

  const handleInputDeviceChange = (deviceId: string) => {
    setInputDevice(deviceId);
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
  };

  return {
    ...rawProps,
    onBack: props.onBack ?? goBack,
    config:
      props.config ??
      props.settings ??
      (props.defaultConfig ? undefined : bindings.axes),
    onChange: props.onChange ?? handleConfigChange,
    onReset: props.onReset ?? handleReset,
    inputDevice: props.inputDevice ?? inputDevice,
    onInputDeviceChange: props.onInputDeviceChange ?? handleInputDeviceChange,
  } as TProps;
}
