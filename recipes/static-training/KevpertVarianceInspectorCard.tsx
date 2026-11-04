/**
 * KevpertVarianceInspectorCard.tsx
 * Reusable UI inspector card for Pack-Global Kevpert F-Key Presets (F3..F12),
 * Historical Era Spreads (Era 1 Precision 2019, Era 2 Wide 2023, Era 3 Tight 2023),
 * raw BakkesMod `bind Fxx "sv_training_..."` string import, and Retained Demo Ghost controls.
 */

import React, { useState } from 'react';
import { Ghost, Shuffle, Sparkles, Terminal } from 'lucide-react';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import {
  KEVPERT_ERA_SPREADS,
  KEVPERT_FKEY_SPECS,
  type KevpertVarianceEra,
  type TrainingVarianceConfig,
  type TrainingVariancePresetId,
} from '../../config/kevpertVariancePresets';

export interface KevpertVarianceInspectorCardProps {
  isLight: boolean;
  varianceConfig: TrainingVarianceConfig;
  onSelectPreset: (presetId: TrainingVariancePresetId, era?: KevpertVarianceEra) => void;
  onPatchVariance: (patch: Partial<TrainingVarianceConfig>) => void;
  onApplyBindString: (rawBind: string) => void;
  retainedGhostLabel?: string | null;
  showRetainedGhost?: boolean;
  onToggleShowGhost?: (show: boolean) => void;
  onPinLastAttemptGhost?: () => void;
  onClearGhost?: () => void;
  onHoverDesc?: (desc: string | null) => void;
}

export const KevpertVarianceInspectorCard: React.FC<KevpertVarianceInspectorCardProps> = React.memo(
  ({
    isLight,
    varianceConfig,
    onSelectPreset,
    onPatchVariance,
    onApplyBindString,
    retainedGhostLabel,
    showRetainedGhost = true,
    onToggleShowGhost,
    onPinLastAttemptGhost,
    onClearGhost,
    onHoverDesc,
  }) => {
    const [bindInput, setBindInput] = useState('');
    const [showBindInput, setShowBindInput] = useState(false);

    const activeFKeySpec = KEVPERT_FKEY_SPECS.find((s) => s.id === varianceConfig.presetId);
    const eraMeta = KEVPERT_ERA_SPREADS[varianceConfig.era] || KEVPERT_ERA_SPREADS['era3-tight-2023'];

    return (
      <div
        className={`p-2.5 rounded-lg border flex flex-col gap-2 ${
          isLight
            ? 'bg-neutral-50 border-neutral-200 text-neutral-900'
            : 'bg-neutral-850/70 border-neutral-800 text-neutral-100'
        }`}
      >
        {/* Header Row: Toggle Kevpert / BakkesMod Seeded Variance */}
        <div className="flex items-center justify-between gap-2">
          <div
            className="flex items-center gap-1.5 cursor-pointer select-none"
            onClick={() => {
              if (!varianceConfig.enabled) {
                onSelectPreset(
                  varianceConfig.presetId === 'off' ? 'kevpert-f11' : varianceConfig.presetId,
                  varianceConfig.era,
                );
              } else {
                onPatchVariance({ enabled: false, presetId: 'off' });
              }
            }}
            onMouseEnter={() =>
              onHoverDesc?.(
                'Deterministic seeded BakkesMod / Kevpert training variance (sv_training_player_velocity, var_speed, var_rot, var_loc, var_spin, limitboost).',
              )
            }
            onMouseLeave={() => onHoverDesc?.(null)}
          >
            <Shuffle className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold">
                Kevpert / BakkesMod Variance
              </span>
              <span className={`text-[10px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                {varianceConfig.enabled
                  ? `${activeFKeySpec ? activeFKeySpec.shortLabel : varianceConfig.presetId.toUpperCase()} • Seed #${varianceConfig.baseSeed}`
                  : 'Off (Exact authored shot coordinates & speed)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowBindInput((v) => !v)}
              title="Paste raw BakkesMod bind string"
              className={`px-1.5 py-0.5 rounded border text-[10px] font-mono flex items-center gap-1 cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
              }`}
            >
              <Terminal className="h-2.5 w-2.5" />
              <span>CVar</span>
            </button>
            <ToggleSwitch
              checked={varianceConfig.enabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSelectPreset(
                    varianceConfig.presetId === 'off' ? 'kevpert-f11' : varianceConfig.presetId,
                    varianceConfig.era,
                  );
                } else {
                  onPatchVariance({ enabled: false, presetId: 'off' });
                }
              }}
              isLight={isLight}
              variant="neutral"
            />
          </div>
        </div>

        {/* F-Key Tier Selector + Era Selector when enabled */}
        {varianceConfig.enabled && (
          <div className="flex flex-col gap-2 pt-1 border-t border-neutral-500/15">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold opacity-75">Kevpert F-Key Tier (Speed + Boost)</span>
                {varianceConfig.limitBoost >= 0 && (
                  <span className="font-mono text-amber-500 dark:text-amber-400 font-bold">
                    Boost Cap: {varianceConfig.limitBoost}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {KEVPERT_FKEY_SPECS.map((spec) => {
                  const active = varianceConfig.presetId === spec.id;
                  const vel = spec.velocityByEra[varianceConfig.era];
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => onSelectPreset(spec.id, varianceConfig.era)}
                      onMouseEnter={() =>
                        onHoverDesc?.(
                          `${spec.shortLabel} — ${spec.roleSummary}${
                            spec.conflictNote ? ` | Note: ${spec.conflictNote}` : ''
                          }`,
                        )
                      }
                      onMouseLeave={() => onHoverDesc?.(null)}
                      className={`px-1.5 py-1 rounded border text-[10px] font-mono flex flex-col items-center leading-tight transition-all cursor-pointer ${
                        active
                          ? isLight
                            ? 'bg-neutral-900 border-neutral-900 text-white font-bold'
                            : 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-bold'
                          : isLight
                          ? 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                          : 'bg-neutral-900/60 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <span>
                        {spec.fKey} · {spec.limitBoost}B
                      </span>
                      <span className="text-[9px] opacity-75">
                        {vel[0]}-{vel[1]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Era Spread Selector */}
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[10px] font-semibold opacity-75"
                title={eraMeta.subtitle}
              >
                Spread Era
              </span>
              <SegmentedSwitch
                options={[
                  { value: 'era3-tight-2023', label: '2023 Tight' },
                  { value: 'era2-wide-2023', label: '2023 Wide' },
                  { value: 'era1-precision-2019', label: '2019 Zero-Loc' },
                ]}
                value={varianceConfig.era}
                onValueChange={(val) =>
                  onSelectPreset(varianceConfig.presetId, val as KevpertVarianceEra)
                }
                isLight={isLight}
                size="sm"
              />
            </div>

            {/* Compact Readout of Active BakkesMod CVars */}
            <div
              className={`px-2 py-1 rounded text-[9px] font-mono flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 ${
                isLight ? 'bg-neutral-100 text-neutral-600' : 'bg-neutral-900/80 text-neutral-400'
              }`}
            >
              <span>
                vel:({varianceConfig.playerVelocityRange[0]},{varianceConfig.playerVelocityRange[1]})
              </span>
              <span>
                spd:({varianceConfig.ballSpeedPctRange[0]}%,{varianceConfig.ballSpeedPctRange[1]}%)
              </span>
              <span>
                rot:({varianceConfig.ballRotPctRange[0]}°,{varianceConfig.ballRotPctRange[1]}°)
              </span>
              <span>
                loc:({varianceConfig.ballLocXYRange[0]},{varianceConfig.ballLocXYRange[1]})
              </span>
              <span>
                car:({varianceConfig.carLocXYRange[0]},{varianceConfig.carLocXYRange[1]})
              </span>
            </div>
          </div>
        )}

        {/* Raw BakkesMod Bind Paste Box */}
        {showBindInput && (
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={bindInput}
              onChange={(e) => setBindInput(e.target.value)}
              placeholder='Paste: bind F10 "sv_training_player_velocity (1700, 1900); ..."'
              className={`flex-1 px-2 py-1 rounded border text-[10px] font-mono outline-none ${
                isLight
                  ? 'bg-white border-neutral-300 text-neutral-900'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-100'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                if (bindInput.trim()) {
                  onApplyBindString(bindInput.trim());
                  setShowBindInput(false);
                }
              }}
              className="px-2 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-[10px] font-bold cursor-pointer"
            >
              Apply
            </button>
          </div>
        )}

        {/* Retained Demo Ghost Tape Controls */}
        {onPinLastAttemptGhost && (
          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-neutral-500/15">
            <div className="flex items-center gap-1.5 min-w-0">
              <Ghost className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] font-medium truncate">
                {retainedGhostLabel ? `Ghost: ${retainedGhostLabel}` : 'Retained Demo Ghost [G]'}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onPinLastAttemptGhost}
                className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                  isLight
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 hover:bg-amber-500/25'
                    : 'bg-amber-400/15 border-amber-400/40 text-amber-300 hover:bg-amber-400/25'
                }`}
              >
                <Sparkles className="h-2.5 w-2.5" />
                <span>Pin Last</span>
              </button>
              {retainedGhostLabel && (
                <>
                  <button
                    type="button"
                    onClick={() => onToggleShowGhost?.(!showRetainedGhost)}
                    className={`px-1.5 py-0.5 rounded border text-[10px] font-mono cursor-pointer ${
                      showRetainedGhost
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    {showRetainedGhost ? 'Shown' : 'Hidden'}
                  </button>
                  <button
                    type="button"
                    onClick={onClearGhost}
                    className="px-1.5 py-0.5 rounded border border-rose-500/40 bg-rose-500/15 text-rose-400 text-[10px] cursor-pointer"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);

KevpertVarianceInspectorCard.displayName = 'KevpertVarianceInspectorCard';
