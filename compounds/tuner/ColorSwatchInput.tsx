import React, { useState, useEffect } from 'react';

export interface ColorSwatchInputProps {
  label: string;
  description?: string;
  value: string;
  onChange: (hex: string) => void;
  presets?: string[];
  isLight?: boolean;
  className?: string;
}

/**
 * ColorSwatchInput (TunerColorRow)
 * Combines native color picker swatch, direct #RRGGBB hex text input, and optional quick palette dots.
 */
export const ColorSwatchInput: React.FC<ColorSwatchInputProps> = React.memo(({
  label,
  description,
  value,
  onChange,
  presets,
  isLight = false,
  className = '',
}) => {
  const [text, setText] = useState<string>(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    onChange(raw);
  };

  return (
    <div
      data-component="color-swatch-input"
      data-tuner-label={label}
      data-tuner-value={value}
      className={`p-2.5 rounded-xl border flex flex-col gap-2 text-xs select-none transition-colors ${
        isLight
          ? 'bg-neutral-50/90 border-neutral-200 text-neutral-800'
          : 'bg-neutral-900/60 border-neutral-800 text-neutral-200'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
          <span className={`font-semibold truncate ${isLight ? 'text-neutral-800' : 'text-neutral-200'}`}>
            {label}
          </span>
          {description && (
            <span className={`text-[10px] leading-tight ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
              {description}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="color"
            value={value.startsWith('#') && value.length === 7 ? value : '#f59e0b'}
            onChange={(e) => onChange(e.target.value)}
            className="w-6 h-6 rounded border border-neutral-500/60 cursor-pointer p-0 bg-transparent"
          />
          <input
            type="text"
            value={text}
            onChange={handleInputChange}
            placeholder="#ffffff"
            className={`w-20 px-2 py-0.5 text-center font-mono text-xs rounded border transition-colors outline-none focus:ring-1 focus:ring-amber-500 ${
              isLight
                ? 'bg-white border-neutral-300 text-neutral-800'
                : 'bg-neutral-900 border-neutral-700 text-neutral-100'
            }`}
          />
        </div>
      </div>

      {presets && presets.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-200/60 dark:border-neutral-800/60">
          <span className="text-[10px] font-mono text-neutral-400 mr-1">Swatches:</span>
          {presets.map((hex) => {
            const isActive = value.toLowerCase() === hex.toLowerCase();
            return (
              <button
                key={hex}
                type="button"
                onClick={() => onChange(hex)}
                title={hex}
                className={`h-4 w-4 rounded-full border transition-transform cursor-pointer ${
                  isActive
                    ? 'scale-125 ring-2 ring-amber-500 border-white'
                    : 'border-black/20 dark:border-white/20 hover:scale-110'
                }`}
                style={{ backgroundColor: hex }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

ColorSwatchInput.displayName = 'ColorSwatchInput';
