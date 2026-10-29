import React from 'react';
import { SettingSliderRow } from '../../compounds/SettingSliderRow';
import { useFloatingStore, floatingSandboxStore } from '../../tokens/floatingStore';

export interface FloatingWindowOpacityProps {
  isLight?: boolean;
  /** Controlled opacity percentage (1..100) */
  opacity?: number;
  /** Initial opacity percentage when uncontrolled */
  defaultOpacity?: number;
  /** Callback fired when opacity percentage changes */
  onOpacityChange?: (opacity: number) => void;
  /** Alias for onOpacityChange */
  onChange?: (opacity: number) => void;
}

/**
 * 6. [User] Floating Window Opacity (`floating-window-opacity`)
 * Standalone L6 Floating Window Panel — non-resizable, single inline row:
 * Left: "Opacity", Middle: Slider (1%–100%, >= 180px track for >=99px 1% resolution), Right: Editable numeric input (Enter to confirm).
 */
export const FloatingWindowOpacityFloatingWindow: React.FC<FloatingWindowOpacityProps> = React.memo(({
  isLight = false,
  opacity: controlledOpacity,
  defaultOpacity,
  onOpacityChange,
  onChange,
}) => {
  const { opacity: storeOpacity, setOpacity: setMainOpacity } = useFloatingStore();
  const effectiveOpacity = controlledOpacity ?? defaultOpacity ?? storeOpacity;

  const setOpacity = (val: number) => {
    const clamped = Math.max(1, Math.min(100, Math.round(val)));
    if (controlledOpacity === undefined) {
      setMainOpacity(clamped);
      floatingSandboxStore.setOpacity(clamped);
    }
    onOpacityChange?.(clamped);
    onChange?.(clamped);
  };

  return (
    <div className="px-3 py-2 flex flex-col justify-center text-xs select-none">
      <SettingSliderRow
        label="Opacity"
        title={<span className="whitespace-nowrap">Opacity</span>}
        value={effectiveOpacity}
        min={1}
        max={100}
        step={1}
        unit="%"
        layout="inline"
        trackWidth={148}
        showStepper={false}
        editable={true}
        bordered={false}
        showDescription={false}
        onChange={setOpacity}
        hoverDescription="Global opacity (1% - 100%) for all floating windows. Type a value and press Enter to confirm."
        isLight={isLight}
      />
    </div>
  );
});
FloatingWindowOpacityFloatingWindow.displayName = 'FloatingWindowOpacityFloatingWindow';

