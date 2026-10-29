import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { RotateCcw, Minus, Plus } from 'lucide-react';
import { Checkbox } from '../../primitives/Checkbox';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { SettingActionRow } from '../../compounds/SettingActionRow';
import { getDecimalPlaces } from '../../primitives/PrecisionDigitPicker';
import type { CameraSettingsStyleConfig } from '../../tokens/cameraSettingsStyleStore';
import {
  CAMERA_BOOLEAN_SPECS,
  resolveSliderFillClass,
  type CameraBooleanSpec,
  type CameraProfileSettings,
  type CameraSliderSpec,
} from './cameraConfigSpecs';

interface CameraLabelCellProps {
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  cfg: CameraSettingsStyleConfig;
  isLight: boolean;
}

const CameraLabelCell: React.FC<CameraLabelCellProps> = ({
  label,
  icon: IconComponent,
  iconColor,
  cfg,
  isLight,
}) => (
  <div
    style={{
      width: `${cfg.labelColumnWidthPx}px`,
      marginRight: `${cfg.labelToControlGapPx}px`,
      fontSize: `${cfg.labelFontSizePx}px`,
      fontWeight: cfg.labelFontWeight,
    }}
    className={`shrink-0 flex items-center gap-2 min-w-0 select-none ${
      cfg.labelTextAlign === 'right' ? 'justify-end text-right' : 'justify-start text-left'
    } ${isLight ? 'text-neutral-800' : 'text-neutral-200'}`}
  >
    {cfg.showRowIcon && (
      <IconComponent
        style={{ width: '16px', height: '16px' }}
        className={`shrink-0 ${iconColor}`}
      />
    )}
    <span className="truncate leading-tight" title={label}>
      {label}
    </span>
  </div>
);

export interface CameraSliderRowProps {
  spec: CameraSliderSpec;
  rawValue: number;
  cfg: CameraSettingsStyleConfig;
  isLight: boolean;
  controlColWidthPx: number;
  readoutColWidthPx: number;
  rowHoverClasses: string;
  onUpdate: (key: CameraSliderSpec['key'], value: number) => void;
  onHoverDesc: (desc: string | null) => void;
}

export const CameraSliderRow: React.FC<CameraSliderRowProps> = ({
  spec,
  rawValue,
  cfg,
  isLight,
  controlColWidthPx,
  readoutColWidthPx,
  rowHoverClasses,
  onUpdate,
  onHoverDesc,
}) => {
  const clampedValue = Math.max(
    spec.min,
    Math.min(spec.max, Number.isFinite(rawValue) ? rawValue : spec.min)
  );
  const displayStr = `${rawValue}${spec.unit}`;

  const stepByDelta = (delta: number) => {
    const decimals = Math.min(6, Math.max(getDecimalPlaces(rawValue), getDecimalPlaces(spec.step)));
    const next = Number((rawValue + delta).toFixed(decimals));
    const clamped = Math.max(spec.min, Math.min(spec.max, next));
    onUpdate(spec.key, clamped);
  };

  const textAlignClass =
    cfg.readoutTextAlign === 'left'
      ? 'text-left justify-start'
      : cfg.readoutTextAlign === 'center'
      ? 'text-center justify-center'
      : 'text-right justify-end';

  return (
    <div
      data-camera-row={spec.key}
      onMouseEnter={() => onHoverDesc(spec.hoverDescription)}
      onMouseLeave={() => onHoverDesc(null)}
      style={{
        paddingTop: `${cfg.rowPaddingYPx}px`,
        paddingBottom: `${cfg.rowPaddingYPx}px`,
        paddingLeft: `${cfg.rowPaddingXPx}px`,
        paddingRight: `${cfg.rowPaddingXPx}px`,
        borderRadius: `${cfg.rowBorderRadiusPx}px`,
      }}
      className={`group flex items-center transition-colors ${rowHoverClasses}`}
    >
      <CameraLabelCell
        label={spec.label}
        icon={spec.icon}
        iconColor={spec.iconColor}
        cfg={cfg}
        isLight={isLight}
      />

      <div
        style={{ width: `${controlColWidthPx}px` }}
        className="relative shrink-0 flex items-center gap-2"
      >
        {cfg.showSpineGuideLine && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-2 -bottom-2 left-0 w-px bg-amber-500/45 z-20"
          />
        )}

        {cfg.sliderShowStepper && (
          <button
            type="button"
            aria-label={`Decrease ${spec.label}`}
            onClick={() => stepByDelta(-spec.step)}
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
          min={spec.min}
          max={spec.max}
          step={spec.step}
          onValueChange={(vals) => {
            const rawVal = vals[0];
            const decimals = getDecimalPlaces(spec.step);
            const rounded =
              decimals > 0 ? parseFloat(rawVal.toFixed(Math.min(6, decimals))) : rawVal;
            onUpdate(spec.key, rounded);
          }}
          style={{ width: `${cfg.sliderTrackWidthPx}px` }}
          className="relative flex items-center select-none touch-none h-5 cursor-pointer shrink-0"
        >
          <SliderPrimitive.Track
            style={{ height: `${cfg.sliderTrackHeightPx}px` }}
            className={`relative grow rounded-full overflow-hidden transition-colors ${
              isLight ? 'bg-neutral-200/95' : 'bg-neutral-800'
            }`}
          >
            <SliderPrimitive.Range
              className={`absolute h-full rounded-full transition-colors ${resolveSliderFillClass(
                cfg.sliderColorScheme,
                isLight
              )}`}
            />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            style={{
              width: `${cfg.sliderThumbSizePx}px`,
              height: `${cfg.sliderThumbSizePx}px`,
            }}
            className={`block rounded-full border shadow-xs transition-transform hover:scale-110 focus:outline-none ${
              isLight
                ? 'bg-white border-neutral-400'
                : 'bg-neutral-100 border-neutral-300'
            }`}
          />
        </SliderPrimitive.Root>

        {cfg.sliderShowStepper && (
          <button
            type="button"
            aria-label={`Increase ${spec.label}`}
            onClick={() => stepByDelta(spec.step)}
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

      <div
        style={{
          width: `${readoutColWidthPx}px`,
          marginLeft: `${cfg.controlToReadoutGapPx}px`,
        }}
        className="shrink-0 flex items-center justify-start"
      >
        {cfg.readoutContainerMode === 'plain-text' ? (
          <span
            data-camera-readout-measure="true"
            style={{ fontSize: `${cfg.readoutFontSizePx}px` }}
            className={`inline-flex items-center font-mono font-semibold whitespace-nowrap w-full ${textAlignClass} ${
              isLight ? 'text-neutral-800' : 'text-neutral-200'
            }`}
          >
            {displayStr}
          </span>
        ) : (
          <span
            style={{
              fontSize: `${cfg.readoutFontSizePx}px`,
              paddingLeft: `${cfg.readoutPaddingXPx}px`,
              paddingRight: `${cfg.readoutPaddingXPx}px`,
              paddingTop: `${cfg.readoutPaddingYPx}px`,
              paddingBottom: `${cfg.readoutPaddingYPx}px`,
              borderRadius: `${cfg.readoutBorderRadiusPx}px`,
              width: cfg.readoutContainerMode === 'uniform-longest' ? '100%' : 'auto',
            }}
            className={`inline-flex items-center font-mono font-semibold border whitespace-nowrap transition-colors ${textAlignClass} ${
              isLight
                ? 'bg-neutral-100/90 text-neutral-800 border-neutral-300/85'
                : 'bg-white/[0.06] text-neutral-200 border-white/[0.10]'
            }`}
          >
            <span data-camera-readout-measure="true" className="whitespace-nowrap">
              {displayStr}
            </span>
          </span>
        )}
      </div>
    </div>
  );
};

export interface CameraBooleanSectionProps {
  settings: CameraProfileSettings;
  cfg: CameraSettingsStyleConfig;
  isLight: boolean;
  controlColWidthPx: number;
  readoutColWidthPx: number;
  rowHoverClasses: string;
  onUpdate: (key: CameraBooleanSpec['key'], value: boolean) => void;
  onHoverDesc: (desc: string | null) => void;
}

export const CameraBooleanSection: React.FC<CameraBooleanSectionProps> = ({
  settings,
  cfg,
  isLight,
  controlColWidthPx,
  readoutColWidthPx,
  rowHoverClasses,
  onUpdate,
  onHoverDesc,
}) => {
  const renderBooleanControl = (spec: CameraBooleanSpec) => {
    const checked = settings[spec.key];
    const statusLabel = cfg.checkboxShowStatusText ? (checked ? 'On' : 'Off') : undefined;

    if (cfg.booleanControlType === 'toggle-switch') {
      return (
        <ToggleSwitch
          checked={checked}
          onCheckedChange={(v) => onUpdate(spec.key, v)}
          isLight={isLight}
          variant="neutral"
        />
      );
    }

    return (
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onUpdate(spec.key, v)}
        isLight={isLight}
        variant={cfg.checkboxVariant}
        size={cfg.checkboxSizePx}
        radiusPx={cfg.checkboxRadiusPx}
        strokeWidth={cfg.checkboxStrokeWidth}
        iconStyle={cfg.checkboxIconStyle}
        animationStyle={cfg.checkboxAnimationStyle}
        highContrastUnchecked={cfg.checkboxHighContrastUnchecked}
        statusText={statusLabel}
      />
    );
  };

  const renderSpineBooleanRow = (spec: CameraBooleanSpec) => {
    const checked = settings[spec.key];
    return (
      <div
        key={spec.key}
        data-camera-row={spec.key}
        onClick={() => onUpdate(spec.key, !checked)}
        onMouseEnter={() => onHoverDesc(spec.hoverDescription)}
        onMouseLeave={() => onHoverDesc(null)}
        style={{
          paddingTop: `${cfg.rowPaddingYPx}px`,
          paddingBottom: `${cfg.rowPaddingYPx}px`,
          paddingLeft: `${cfg.rowPaddingXPx}px`,
          paddingRight: `${cfg.rowPaddingXPx}px`,
          borderRadius: `${cfg.rowBorderRadiusPx}px`,
        }}
        className={`group flex items-center cursor-pointer transition-colors ${rowHoverClasses}`}
      >
        <CameraLabelCell
          label={spec.label}
          icon={spec.icon}
          iconColor={spec.iconColor}
          cfg={cfg}
          isLight={isLight}
        />

        <div
          style={{ width: `${controlColWidthPx}px` }}
          className={`relative shrink-0 flex items-center ${
            cfg.checkboxPlacement === 'spine-center' ? 'justify-center' : 'justify-start'
          }`}
        >
          {cfg.showSpineGuideLine && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-2 -bottom-2 left-0 w-px bg-amber-500/45 z-20"
            />
          )}
          <div onClick={(e) => e.stopPropagation()}>{renderBooleanControl(spec)}</div>
        </div>

        <div
          style={{
            width: `${readoutColWidthPx}px`,
            marginLeft: `${cfg.controlToReadoutGapPx}px`,
          }}
          className="shrink-0"
        />
      </div>
    );
  };

  if (cfg.checkboxPlacement === 'centered-cluster') {
    return (
      <div
        style={{ marginTop: `${cfg.checkboxSectionTopGapPx}px` }}
        className="w-full flex flex-wrap items-center justify-center gap-6 py-2 px-3"
      >
        {CAMERA_BOOLEAN_SPECS.map((spec) => {
          const checked = settings[spec.key];
          return (
            <div
              key={spec.key}
              onClick={() => onUpdate(spec.key, !checked)}
              onMouseEnter={() => onHoverDesc(spec.hoverDescription)}
              onMouseLeave={() => onHoverDesc(null)}
              style={{
                paddingTop: `${cfg.rowPaddingYPx}px`,
                paddingBottom: `${cfg.rowPaddingYPx}px`,
                paddingLeft: `${cfg.rowPaddingXPx + 2}px`,
                paddingRight: `${cfg.rowPaddingXPx + 2}px`,
                borderRadius: `${cfg.rowBorderRadiusPx}px`,
              }}
              className={`inline-flex items-center gap-3 cursor-pointer transition-colors ${rowHoverClasses}`}
            >
              <span
                style={{
                  fontSize: `${cfg.labelFontSizePx}px`,
                  fontWeight: cfg.labelFontWeight,
                }}
                className={isLight ? 'text-neutral-800' : 'text-neutral-200'}
              >
                {spec.label}
              </span>
              <div onClick={(e) => e.stopPropagation()}>{renderBooleanControl(spec)}</div>
            </div>
          );
        })}
      </div>
    );
  }

  if (cfg.checkboxPlacement === 'detached-card') {
    return (
      <div
        style={{
          marginTop: `${cfg.checkboxSectionTopGapPx}px`,
          gap: `${cfg.rowGapPx}px`,
        }}
        className={`flex flex-col p-1.5 rounded-xl border ${
          isLight
            ? 'bg-neutral-100/60 border-neutral-200/80'
            : 'bg-white/[0.025] border-white/[0.07]'
        }`}
      >
        {CAMERA_BOOLEAN_SPECS.map((spec) => renderSpineBooleanRow(spec))}
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: `${cfg.checkboxSectionTopGapPx}px`,
        gap: `${cfg.rowGapPx}px`,
      }}
      className="flex flex-col"
    >
      {CAMERA_BOOLEAN_SPECS.map((spec) => renderSpineBooleanRow(spec))}
    </div>
  );
};

export interface CameraResetSectionProps {
  cfg: CameraSettingsStyleConfig;
  isLight: boolean;
  confirmReset: boolean;
  totalSpineWidthPx: number;
  onResetClick: () => void;
  onHoverDesc: (desc: string | null) => void;
}

export const CameraResetSection: React.FC<CameraResetSectionProps> = ({
  cfg,
  isLight,
  confirmReset,
  totalSpineWidthPx,
  onResetClick,
  onHoverDesc,
}) => {
  const resolveBigResetButtonClasses = (): string => {
    if (confirmReset && cfg.resetConfirmMode === 'inline-two-step') {
      return 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 font-bold shadow-[0_0_16px_rgba(244,63,94,0.35)]';
    }
    switch (cfg.resetButtonStyle) {
      case 'danger-solid':
        return 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 font-bold shadow-xs';
      case 'danger-outline':
        return isLight
          ? 'bg-transparent hover:bg-rose-50 text-rose-600 border-rose-400/80 hover:border-rose-500 font-semibold'
          : 'bg-transparent hover:bg-rose-500/15 text-rose-400 border-rose-500/45 hover:border-rose-400 font-semibold';
      case 'neutral-hover-danger':
        return isLight
          ? 'bg-neutral-200/70 hover:bg-rose-500/15 text-neutral-700 hover:text-rose-600 border-neutral-300 hover:border-rose-400 font-semibold'
          : 'bg-white/[0.06] hover:bg-rose-500/20 text-neutral-200 hover:text-rose-300 border-white/[0.10] hover:border-rose-500/45 font-semibold';
      case 'danger-subtle':
      default:
        return isLight
          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border-rose-400/50 hover:border-rose-500/70 font-semibold'
          : 'bg-rose-500/12 hover:bg-rose-500/22 text-rose-400 hover:text-rose-300 border-rose-500/35 hover:border-rose-500/55 font-semibold';
    }
  };

  const resetHoverText =
    cfg.resetConfirmMode === 'dialogue'
      ? 'Open double-check confirmation dialogue to restore default competitive camera profile settings.'
      : 'Restore default competitive camera profile settings (two-step confirmation).';

  if (cfg.resetButtonMode === 'compact-row') {
    return (
      <div style={{ marginTop: `${cfg.resetButtonTopMarginPx}px` }} className="w-full">
        <SettingActionRow
          icon={RotateCcw}
          title={cfg.resetButtonLabel}
          bordered={false}
          showDescription={false}
          hoverDescription={resetHoverText}
          onAction={onResetClick}
          onHover={(desc) => desc && onHoverDesc(desc)}
          onLeave={() => onHoverDesc(null)}
          isLight={isLight}
          rightSlot={
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onResetClick();
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95 ${resolveBigResetButtonClasses()}`}
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              <span>
                {confirmReset && cfg.resetConfirmMode === 'inline-two-step'
                  ? 'Confirm Reset'
                  : 'Reset'}
              </span>
            </button>
          }
        />
      </div>
    );
  }

  const widthStyle: React.CSSProperties =
    cfg.resetButtonWidthMode === 'full-width'
      ? { width: '100%' }
      : cfg.resetButtonWidthMode === 'spine-width'
      ? { width: `${totalSpineWidthPx}px`, maxWidth: '100%' }
      : { width: 'auto', paddingLeft: '28px', paddingRight: '28px' };

  return (
    <div
      style={{ marginTop: `${cfg.resetButtonTopMarginPx}px` }}
      className="w-full flex justify-center"
    >
      <button
        type="button"
        data-camera-reset-btn="big"
        onClick={onResetClick}
        onMouseEnter={() => onHoverDesc(resetHoverText)}
        onMouseLeave={() => onHoverDesc(null)}
        style={{
          ...widthStyle,
          height: `${cfg.resetButtonHeightPx}px`,
          fontSize: `${cfg.resetButtonFontSizePx}px`,
          borderRadius: `${cfg.resetButtonRadiusPx}px`,
        }}
        className={`inline-flex items-center justify-center gap-2 border transition-all duration-150 cursor-pointer select-none active:scale-[0.985] ${resolveBigResetButtonClasses()}`}
      >
        {cfg.resetButtonShowIcon && (
          <RotateCcw
            style={{
              width: `${cfg.resetButtonIconSizePx}px`,
              height: `${cfg.resetButtonIconSizePx}px`,
            }}
            className="shrink-0"
          />
        )}
        <span>
          {confirmReset && cfg.resetConfirmMode === 'inline-two-step'
            ? `Confirm ${cfg.resetButtonLabel}?`
            : cfg.resetButtonLabel}
        </span>
      </button>
    </div>
  );
};
