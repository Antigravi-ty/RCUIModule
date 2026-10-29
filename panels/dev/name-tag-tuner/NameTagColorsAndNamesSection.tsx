import React from 'react';
import { Palette, Users, Camera } from 'lucide-react';
import type { NameTagConfig } from '../../../config/nameTagConfig';
import { ToggleSwitch } from '../../../primitives/ToggleSwitch';

export interface NameTagColorsAndNamesSectionProps {
  config: NameTagConfig;
  isPovMode: boolean;
  effectiveFocusedCarIndex: number;
  focusedSlotCode: string;
  isLight: boolean;
  updateConfig: (partial: Partial<NameTagConfig>) => void;
  updatePreviewName: (index: number, value: string) => void;
  selectPovCar: (carIndex: number) => void;
}

const COLOR_PALETTE_PRESETS = [
  {
    label: 'RL Calibrated',
    blueBgColor: '#075985',
    blueBorderColor: '#38bdf8',
    blueTextColor: '#ffffff',
    orangeBgColor: '#9a3412',
    orangeBorderColor: '#fb923c',
    orangeTextColor: '#ffffff',
  },
  {
    label: 'Vibrant RL',
    blueBgColor: '#0284c7',
    blueBorderColor: '#7dd3fc',
    blueTextColor: '#ffffff',
    orangeBgColor: '#ea580c',
    orangeBorderColor: '#fdba74',
    orangeTextColor: '#ffffff',
  },
  {
    label: 'Deep Contrast',
    blueBgColor: '#0c2d48',
    blueBorderColor: '#38bdf8',
    blueTextColor: '#f0f9ff',
    orangeBgColor: '#431407',
    orangeBorderColor: '#fb923c',
    orangeTextColor: '#fff7ed',
  },
  {
    label: 'Neon Cyber',
    blueBgColor: '#0f172a',
    blueBorderColor: '#00f0ff',
    blueTextColor: '#e0f2fe',
    orangeBgColor: '#1c1917',
    orangeBorderColor: '#ff5500',
    orangeTextColor: '#ffedd5',
  },
];

export const NameTagColorsAndNamesSection: React.FC<
  NameTagColorsAndNamesSectionProps
> = ({
  config,
  isPovMode,
  effectiveFocusedCarIndex,
  focusedSlotCode,
  isLight,
  updateConfig,
  updatePreviewName,
  selectPovCar,
}) => {
  const cardBackground = isLight
    ? 'bg-neutral-50/95 border-neutral-200/90 text-neutral-800 shadow-2xs'
    : 'bg-neutral-850/60 border-neutral-700/60 text-neutral-200';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  return (
    <>
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBackground}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-[11px] flex items-center gap-1.5">
            <Palette
              className={`h-3.5 w-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`}
            />
            <span>Team Pill Colors (Background · Border · Text)</span>
          </span>
          <span className={`text-[10px] font-mono ${mutedText}`}>
            Opacity {(config.opacity * 100).toFixed(0)}% · Fill{' '}
            {(config.bgOpacity * 100).toFixed(0)}%
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {COLOR_PALETTE_PRESETS.map((palette) => {
            const isSelected =
              config.blueBgColor.toLowerCase() === palette.blueBgColor &&
              config.orangeBgColor.toLowerCase() === palette.orangeBgColor &&
              config.blueBorderColor.toLowerCase() === palette.blueBorderColor &&
              config.orangeBorderColor.toLowerCase() === palette.orangeBorderColor;
            return (
              <button
                key={palette.label}
                type="button"
                onClick={() =>
                  updateConfig({
                    blueBgColor: palette.blueBgColor,
                    blueBorderColor: palette.blueBorderColor,
                    blueTextColor: palette.blueTextColor,
                    orangeBgColor: palette.orangeBgColor,
                    orangeBorderColor: palette.orangeBorderColor,
                    orangeTextColor: palette.orangeTextColor,
                  })
                }
                className={`px-1 py-1 rounded border text-[9px] font-mono cursor-pointer truncate transition-colors ${
                  isSelected
                    ? isLight
                      ? 'bg-amber-500/15 border-amber-500 text-amber-800 font-bold'
                      : 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                    : isLight
                      ? 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                      : 'border-neutral-700/70 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {palette.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2 rounded-lg border border-sky-500/30 bg-sky-500/5 flex flex-col gap-1.5">
            <span
              className={`text-[10px] font-bold ${
                isLight ? 'text-sky-700' : 'text-sky-400'
              }`}
            >
              BLUE TEAM
            </span>
            <div className="flex items-center justify-between text-[10px]">
              <span className={mutedText}>Background</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[9px] uppercase opacity-75">
                  {config.blueBgColor}
                </span>
                <input
                  type="color"
                  value={config.blueBgColor}
                  onChange={(event) => updateConfig({ blueBgColor: event.target.value })}
                  className="h-5 w-8 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className={mutedText}>Border</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[9px] uppercase opacity-75">
                  {config.blueBorderColor}
                </span>
                <input
                  type="color"
                  value={config.blueBorderColor}
                  onChange={(event) =>
                    updateConfig({ blueBorderColor: event.target.value })
                  }
                  className="h-5 w-8 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className={mutedText}>Text</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[9px] uppercase opacity-75">
                  {config.blueTextColor}
                </span>
                <input
                  type="color"
                  value={config.blueTextColor}
                  onChange={(event) => updateConfig({ blueTextColor: event.target.value })}
                  className="h-5 w-8 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>
          </div>

          <div className="p-2 rounded-lg border border-orange-500/30 bg-orange-500/5 flex flex-col gap-1.5">
            <span
              className={`text-[10px] font-bold ${
                isLight ? 'text-orange-700' : 'text-orange-400'
              }`}
            >
              ORANGE TEAM
            </span>
            <div className="flex items-center justify-between text-[10px]">
              <span className={mutedText}>Background</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[9px] uppercase opacity-75">
                  {config.orangeBgColor}
                </span>
                <input
                  type="color"
                  value={config.orangeBgColor}
                  onChange={(event) => updateConfig({ orangeBgColor: event.target.value })}
                  className="h-5 w-8 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className={mutedText}>Border</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[9px] uppercase opacity-75">
                  {config.orangeBorderColor}
                </span>
                <input
                  type="color"
                  value={config.orangeBorderColor}
                  onChange={(event) =>
                    updateConfig({ orangeBorderColor: event.target.value })
                  }
                  className="h-5 w-8 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className={mutedText}>Text</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[9px] uppercase opacity-75">
                  {config.orangeTextColor}
                </span>
                <input
                  type="color"
                  value={config.orangeTextColor}
                  onChange={(event) =>
                    updateConfig({ orangeTextColor: event.target.value })
                  }
                  className="h-5 w-8 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${cardBackground}`}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-[11px] flex items-center gap-1.5">
            <Users
              className={`h-3.5 w-3.5 ${
                isLight ? 'text-emerald-600' : 'text-emerald-400'
              }`}
            />
            <span>6 Kickoff Car Sample Usernames</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] ${mutedText}`}>
              Show on Local Car {isPovMode ? `(${focusedSlotCode})` : '(POV)'}
            </span>
            <ToggleSwitch
              checked={config.showOnLocalCar}
              onChange={(nextShow) => updateConfig({ showOnLocalCar: nextShow })}
              isLight={isLight}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono opacity-80">
          <Camera
            className={`h-3 w-3 shrink-0 ${isLight ? 'text-sky-600' : 'text-sky-400'}`}
          />
          <span className="truncate">
            {isPovMode
              ? config.showOnLocalCar
                ? `POV on ${focusedSlotCode}: Focused car name tag is VISIBLE`
                : `POV on ${focusedSlotCode}: Focused car name tag is HIDDEN`
              : 'FreeCam active: Press 1–6 to focus a car POV (hides focused car tag unless enabled)'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          {config.previewNames.map((name, index) => {
            const isOrange = index >= 3;
            const isFocusedInPov =
              isPovMode && effectiveFocusedCarIndex === index;
            return (
              <div key={index} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => selectPovCar(index)}
                  title={`Focus ${isOrange ? `O${index - 2}` : `B${index + 1}`} POV (Key ${index + 1})`}
                  className={`text-[10px] font-mono font-bold w-7 py-0.5 rounded border shrink-0 cursor-pointer transition-colors ${
                    isFocusedInPov
                      ? isLight
                        ? 'bg-amber-500/20 border-amber-500 text-amber-800'
                        : 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : isOrange
                        ? isLight
                          ? 'border-orange-500/40 text-orange-700 bg-orange-500/5 hover:bg-orange-500/15'
                          : 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10'
                        : isLight
                          ? 'border-sky-500/40 text-sky-700 bg-sky-500/5 hover:bg-sky-500/15'
                          : 'border-sky-500/30 text-sky-400 hover:bg-sky-500/10'
                  }`}
                >
                  {isOrange ? `O${index - 2}` : `B${index + 1}`}
                </button>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => updatePreviewName(index, event.target.value)}
                  className={`w-full px-2 py-1 rounded border text-[10px] font-mono outline-none ${
                    isLight
                      ? 'bg-white border-neutral-300 text-neutral-800 focus:border-sky-500'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-200 focus:border-sky-400'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
