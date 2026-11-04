/**
 * DynamicTrainingHUD.tsx
 * Top-center floating HUD banner displayed during active `dynamic-training-pack` sessions.
 * Shows scenario title, Pre-Roll Watch / 3-2-1 Takeover countdown, active car slot & bot
 * fallback policies, Kevpert variance badge, and Retained Ghost status.
 */

import React from 'react';
import { Ghost, Disc, Shuffle } from 'lucide-react';
import { useDynamicTrainingStore } from '../stores/dynamicTrainingStore';

export interface DynamicTrainingHUDProps {
  isLight?: boolean;
  className?: string;
}

export const DynamicTrainingHUD: React.FC<DynamicTrainingHUDProps> = React.memo(
  ({ isLight = false, className = '' }) => {
    const scenarios = useDynamicTrainingStore((s) => s.scenarios);
    const selectedScenarioId = useDynamicTrainingStore((s) => s.selectedScenarioId);
    const varianceConfig = useDynamicTrainingStore((s) => s.varianceConfig);
    const telemetry = useDynamicTrainingStore((s) => s.liveTelemetry);

    const scenario =
      scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0] || null;
    if (!scenario) return null;

    const isPreroll = telemetry.playPhase === 'preroll-watch';

    return (
      <div
        data-ui-element="dynamic-training-hud"
        className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none flex flex-col items-center gap-1.5 ${className}`}
      >
        <div
          className={`px-4 py-2 rounded-xl border font-mono text-xs flex items-center gap-3.5 shadow-lg ${
            isLight
              ? 'bg-white/95 border-neutral-300 text-neutral-900'
              : 'bg-neutral-950/92 border-neutral-700/80 text-neutral-100'
          }`}
        >
          <span className="text-xs font-extrabold tracking-tight text-cyan-500 dark:text-cyan-400">
            {scenario.title}
          </span>

          <span className="opacity-30">|</span>

          {isPreroll ? (
            <span className="text-amber-300 font-bold animate-pulse">
              PRE-ROLL WATCH {telemetry.prerollRemainingSec.toFixed(1)}s (HOLD W → TAKEOVER{' '}
              {telemetry.activeCountdownSec}...)
            </span>
          ) : (
            <span
              className={`font-bold tabular-nums ${
                telemetry.remainingTimeoutSec <= 3 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              LIVE {Math.max(0, telemetry.remainingTimeoutSec).toFixed(1)}s
            </span>
          )}

          {telemetry.isRecordingOverdub && (
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-bold flex items-center gap-1 animate-pulse">
              <Disc className="h-3 w-3" />
              REC SLOT #{telemetry.activePlayerSlot + 1}
            </span>
          )}

          {varianceConfig.enabled && (
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1">
              <Shuffle className="h-3 w-3" />
              {varianceConfig.presetId.replace('kevpert-', '').toUpperCase()}
            </span>
          )}

          {telemetry.retainedGhostLabel && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold flex items-center gap-1">
              <Ghost className="h-3 w-3" />
              GHOST
            </span>
          )}
        </div>

        <div
          className={`px-3 py-1 rounded-lg border font-mono text-[10px] shadow-xs ${
            isLight
              ? 'bg-neutral-100/95 border-neutral-300 text-neutral-700'
              : 'bg-neutral-900/90 border-neutral-800 text-neutral-300'
          }`}
        >
          [R] Reset · [[ / ]] Prev/Next Scenario · [1/2/3] Switch Active Car Slot · [G] Pin Ghost Tape
        </div>
      </div>
    );
  },
);

DynamicTrainingHUD.displayName = 'DynamicTrainingHUD';
