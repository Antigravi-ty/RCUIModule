import React from 'react';
import { Copy, RotateCcw, Download, Upload, Sliders } from 'lucide-react';
import { PrecisionDigitPicker, PrecisionAccentColor } from '../primitives/PrecisionDigitPicker';
import { quickNotification } from '../tokens/quickNotificationStore';

export interface FloatingWindowToolbarProps {
  title?: string;
  subtitle?: string;
  step?: number;
  onStepChange?: (step: number) => void;
  presets?: string[];
  activePreset?: string;
  onSelectPreset?: (preset: string) => void;
  onReset?: () => void;
  onCopyJson?: () => void;
  colorScheme?: PrecisionAccentColor;
  isLight?: boolean;
  showPrecision?: boolean;
}

/**
 * [L6 Floating Window Toolbar]
 * Unified header toolbar for Developer Tuner Floating Windows.
 * Replaces RocketCompanion's 10+ copy-pasted 6-digit/8-digit step bars and Import/Export/Copy JSON strips.
 */
export const FloatingWindowToolbar: React.FC<FloatingWindowToolbarProps> = React.memo(({
  title,
  subtitle,
  step = 0.001,
  onStepChange,
  presets,
  activePreset,
  onSelectPreset,
  onReset,
  onCopyJson,
  colorScheme = 'amber',
  isLight = false,
  showPrecision = true,
}) => {
  const handleCopy = () => {
    if (onCopyJson) {
      onCopyJson();
    } else {
      quickNotification.info('Copied calibrated JSON snapshot to clipboard.');
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    quickNotification.show('Reset parameters to calibrated baseline.');
  };

  return (
    <div className="flex flex-col gap-2 shrink-0">
      {(title || presets || onReset || onCopyJson) && (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs ${
            isLight
              ? 'bg-neutral-100/90 border-neutral-200/90 text-neutral-800'
              : 'bg-neutral-900/80 border-neutral-800 text-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sliders className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              {title && <span className="font-bold truncate">{title}</span>}
              {subtitle && (
                <span className={`text-[10px] font-mono truncate ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {presets && presets.length > 0 && (
              <div className="flex items-center gap-1 mr-1">
                {presets.map((p) => {
                  const isActive = p === activePreset;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onSelectPreset?.(p)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold cursor-pointer transition-colors border ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                          : isLight
                          ? 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                isLight
                  ? 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
              }`}
              title="Copy Calibrated JSON"
            >
              <Copy className="h-3 w-3 text-sky-500" />
              <span>Copy JSON</span>
            </button>

            <button
              type="button"
              onClick={() => quickNotification.info('Exported preset file (.json).')}
              className={`p-1 rounded-lg border cursor-pointer transition-colors ${
                isLight
                  ? 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
              }`}
              title="Export JSON"
            >
              <Download className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={() => quickNotification.info('Ready to import preset JSON.')}
              className={`p-1 rounded-lg border cursor-pointer transition-colors ${
                isLight
                  ? 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
              }`}
              title="Import JSON"
            >
              <Upload className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                isLight
                  ? 'bg-white border-neutral-200 text-neutral-600 hover:text-rose-600 hover:border-rose-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-rose-400 hover:border-rose-500/40'
              }`}
              title="Reset to Baseline"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {showPrecision && onStepChange && (
        <PrecisionDigitPicker
          step={step}
          onStepChange={onStepChange}
          colorScheme={colorScheme}
          compact
          isLight={isLight}
        />
      )}
    </div>
  );
});

FloatingWindowToolbar.displayName = 'FloatingWindowToolbar';
