import React, { useState, useEffect } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Minus, Plus } from 'lucide-react';
import { SliderControl, type SliderColorScheme } from '../primitives/SliderControl';
import { SettingActionRow } from './SettingActionRow';
import { useSettingActionRowStore, type SliderRowLayout } from '../stores/settingRowStore';
import { getDecimalPlaces } from '../primitives/PrecisionDigitPicker';

export interface SettingSliderRowProps {
  /** Primary row title (alias: title) */
  label?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }> | React.ReactNode;
  iconName?: string;
  iconColor?: string;
  badge?: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  /** Override whether numeric input is editable (defaults to store's User vs Developer mode setting) */
  editable?: boolean;
  /** Whether the surrounding panel is in Developer Mode (enables numeric input when sliderEditableInDevMode is true) */
  developerMode?: boolean;
  /** Override layout ('inline' | 'stacked', defaults to useSettingActionRowStore.sliderLayout) */
  layout?: SliderRowLayout;
  /** Override track width in px or CSS string (e.g. '100%') for 'inline' layout (defaults to useSettingActionRowStore.sliderTrackWidth) */
  trackWidth?: number | string;
  /** Override whether - / + steppers are shown (defaults to useSettingActionRowStore.sliderShowStepper) */
  showStepper?: boolean;
  colorScheme?: SliderColorScheme;
  bordered?: boolean;
  showDescription?: boolean;
  paddingX?: number;
  paddingY?: number;
  /** Optional inline action slot rendered before the slider track (e.g. Preview button) */
  actionSlot?: React.ReactNode;
  onChange: (val: number) => void;
  hoverDescription?: string;
  onHover?: (desc?: string) => void;
  onLeave?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isLight?: boolean;
  className?: string;
}

/**
 * [L1/L3 Decoupled Primitive] SettingSliderRow
 * Unified Settings slider row sharing `useSettingActionRowStore` typography, padding, and hover highlight:
 * - Supports `layout="inline"` (Title + Progress Track + Value Readout/Input on a single row)
 *   and `layout="stacked"` (2-row layout).
 * - Mode-aware text input: in User Mode (`developerMode={false}`), defaults to read-only numeric display
 *   so users adjust via the slider track; in Developer Mode (`developerMode={true}`), allows direct text input.
 *   Both modes can also be toggled live in `SettingActionRowTuner`.
 */
export const SettingSliderRow: React.FC<SettingSliderRowProps> = React.memo(({
  label,
  title,
  subtitle,
  description,
  icon,
  iconName,
  iconColor,
  badge,
  value,
  min,
  max,
  step = 1,
  unit = '',
  disabled = false,
  editable: propEditable,
  developerMode = false,
  layout: propLayout,
  trackWidth: propTrackWidth,
  showStepper: propShowStepper,
  colorScheme = 'neutral',
  bordered: propBordered,
  showDescription: propShowDescription,
  paddingX: propPaddingX,
  paddingY: propPaddingY,
  actionSlot,
  onChange,
  hoverDescription,
  onHover,
  onLeave,
  onMouseEnter,
  onMouseLeave,
  isLight = false,
  className = '',
}) => {
  const store = useSettingActionRowStore();

  const resolvedLayout = propLayout ?? store.sliderLayout;
  const resolvedTrackWidth = propTrackWidth ?? store.sliderTrackWidth;
  const resolvedShowStepper = propShowStepper ?? store.sliderShowStepper;
  const resolvedEditable =
    propEditable !== undefined
      ? propEditable
      : developerMode
      ? store.sliderEditableInDevMode
      : store.sliderEditableInUserMode;
  const valueFontSize = store.sliderValueFontSize;

  const handleHover = (desc?: string) => {
    onHover?.(desc);
    onMouseEnter?.();
  };
  const handleLeave = () => {
    onLeave?.();
    onMouseLeave?.();
  };

  const clampedValue = Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
  const [inputText, setInputText] = useState<string>(() => String(value));
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isFocused) {
      setInputText(String(value));
    }
  }, [value, isFocused]);

  const stepByDelta = (delta: number) => {
    const decimals = Math.min(6, Math.max(getDecimalPlaces(value), getDecimalPlaces(step)));
    const next = Number((value + delta).toFixed(decimals));
    const clamped = Math.max(min, Math.min(max, next));
    onChange(clamped);
    setInputText(String(clamped));
  };

  const commitInput = () => {
    setIsFocused(false);
    const parsed = parseFloat(inputText.trim());
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
      setInputText(String(clamped));
    } else {
      setInputText(String(value));
    }
  };

  const resolveRangeColorClass = () => {
    if (colorScheme === 'amber') return 'bg-amber-500';
    if (colorScheme === 'orange') return 'bg-orange-500';
    if (colorScheme === 'sky') return 'bg-sky-500';
    if (colorScheme === 'emerald') return 'bg-emerald-500';
    if (colorScheme === 'rose') return 'bg-rose-500';
    return isLight ? 'bg-neutral-900' : 'bg-white';
  };

  const renderValueReadout = () => {
    if (resolvedEditable) {
      return (
        <div className="flex items-center gap-1 shrink-0 justify-end min-w-[60px]">
          <input
            type="text"
            value={inputText}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={commitInput}
            onChange={(e) => {
              setInputText(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitInput();
                e.currentTarget.blur();
              } else if (e.key === 'Escape') {
                setInputText(String(value));
                setIsFocused(false);
                e.currentTarget.blur();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                stepByDelta(step);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                stepByDelta(-step);
              }
            }}
            style={{ fontSize: `${valueFontSize}px` }}
            className={`w-14 px-1.5 py-0.5 text-right font-mono rounded border outline-none transition-colors ${
              isLight
                ? 'bg-white text-neutral-800 border-neutral-300 focus:border-amber-500'
                : 'bg-neutral-900 text-neutral-200 border-neutral-700 focus:border-amber-500'
            }`}
          />
          {unit && (
            <span
              style={{ fontSize: `${Math.max(10, valueFontSize - 1)}px` }}
              className={`font-mono ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}
            >
              {unit}
            </span>
          )}
        </div>
      );
    }

    return (
      <span
        style={{ fontSize: `${valueFontSize}px` }}
        className={`font-mono font-semibold px-2 py-0.5 rounded border text-right shrink-0 min-w-[54px] transition-colors ${
          isLight
            ? 'bg-neutral-100/90 text-neutral-800 border-neutral-300/80'
            : 'bg-white/[0.06] text-neutral-200 border-white/[0.10]'
        }`}
      >
        {value}
        {unit}
      </span>
    );
  };

  const renderTrackControl = (widthStyle?: React.CSSProperties) => (
    <div className="flex items-center gap-2" style={widthStyle}>
      {resolvedShowStepper && (
        <button
          type="button"
          aria-label="Decrement"
          onClick={() => stepByDelta(-step)}
          className={`inline-flex items-center justify-center h-6 w-6 rounded-md border transition-all active:scale-95 cursor-pointer shrink-0 ${
            isLight
              ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
              : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
          }`}
        >
          <Minus className="h-3 w-3" />
        </button>
      )}

      <SliderPrimitive.Root
        value={[clampedValue]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(vals) => {
          const rawVal = vals[0];
          const decimals = getDecimalPlaces(step);
          const rounded =
            decimals > 0 ? parseFloat(rawVal.toFixed(Math.min(6, decimals))) : rawVal;
          onChange(rounded);
          if (!isFocused) {
            setInputText(String(rounded));
          }
        }}
        className="relative flex items-center select-none touch-none w-full h-5 cursor-pointer"
      >
        <SliderPrimitive.Track
          className={`relative grow rounded-full h-1.5 overflow-hidden transition-colors ${
            isLight ? 'bg-neutral-200/90' : 'bg-neutral-800'
          }`}
        >
          <SliderPrimitive.Range
            className={`absolute h-full rounded-full transition-colors ${resolveRangeColorClass()}`}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={`block h-3.5 w-3.5 rounded-full border shadow-xs transition-transform hover:scale-110 focus:outline-none ${
            isLight
              ? 'bg-white border-neutral-400'
              : 'bg-neutral-100 border-neutral-300'
          }`}
        />
      </SliderPrimitive.Root>

      {resolvedShowStepper && (
        <button
          type="button"
          aria-label="Increment"
          onClick={() => stepByDelta(step)}
          className={`inline-flex items-center justify-center h-6 w-6 rounded-md border transition-all active:scale-95 cursor-pointer shrink-0 ${
            isLight
              ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
              : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
          }`}
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  );

  if (resolvedLayout === 'stacked') {
    return (
      <SettingActionRow
        icon={icon}
        iconName={iconName}
        iconColor={iconColor}
        title={title ?? label ?? ''}
        badge={badge}
        description={description ?? subtitle}
        bordered={propBordered}
        showDescription={propShowDescription}
        paddingX={propPaddingX}
        paddingY={propPaddingY}
        disabled={disabled}
        hoverDescription={hoverDescription}
        onHover={handleHover}
        onLeave={handleLeave}
        isLight={isLight}
        className={className}
        rightSlot={
          actionSlot ? (
            <div className="flex items-center gap-2">
              {actionSlot}
              {renderValueReadout()}
            </div>
          ) : (
            renderValueReadout()
          )
        }
        bottomSlot={renderTrackControl({ width: '100%' })}
      />
    );
  }

  const isFlexTrack = typeof resolvedTrackWidth === 'string';

  // Default: 'inline' single-row [Icon + Title] ... [ActionSlot + Slider Track + Value Readout/Input]
  return (
    <SettingActionRow
      icon={icon}
      iconName={iconName}
      iconColor={iconColor}
      title={title ?? label ?? ''}
      badge={badge}
      description={description ?? subtitle}
      bordered={propBordered}
      showDescription={propShowDescription}
      paddingX={propPaddingX}
      paddingY={propPaddingY}
      disabled={disabled}
      hoverDescription={hoverDescription}
      onHover={handleHover}
      onLeave={handleLeave}
      isLight={isLight}
      className={className}
      rightSlot={
        <div className="flex items-center gap-2.5">
          {actionSlot}
          {renderTrackControl(
            isFlexTrack
              ? { width: resolvedTrackWidth, minWidth: '108px' }
              : { width: `${Math.max(80, resolvedTrackWidth)}px` }
          )}
          {renderValueReadout()}
        </div>
      }
    />
  );
});

SettingSliderRow.displayName = 'SettingSliderRow';
export { SliderControl };
