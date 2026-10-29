import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '../../../primitives/Badge';

export interface CounterfactualMetricItem {
  id: string;
  label: string;
  baselineValue: string | number;
  simulatedValue: string | number;
  deltaText?: string;
  /** Whether a lower value is better (e.g. jitter, error, underrun rate) */
  lowerIsBetter?: boolean;
  improved?: boolean | 'neutral';
  unit?: string;
}

export interface CounterfactualComparisonStripProps {
  title?: string;
  baselineLabel?: string;
  simulatedLabel?: string;
  metrics: CounterfactualMetricItem[];
  statusBadgeText?: string;
  statusVariant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  isLight?: boolean;
}

/**
 * [L2 Compound] CounterfactualComparisonStrip
 * Side-by-side Baseline vs Counterfactual / Simulated (or Legacy WASM vs Clean JS) delta comparison strip.
 * Used in ClockPacingTuner, CameraDeterminismHarness, and DualArenaDeterminismHarness.
 */
export const CounterfactualComparisonStrip: React.FC<CounterfactualComparisonStripProps> = React.memo(({
  title = 'Counterfactual What-If Comparison (Baseline vs Simulated)',
  baselineLabel = 'Recorded Baseline',
  simulatedLabel = 'Simulated What-If',
  metrics,
  statusBadgeText,
  statusVariant = 'success',
  isLight = false,
}) => {
  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
    : 'bg-neutral-900/60 border-neutral-800 text-neutral-200';
  const cellBg = isLight
    ? 'bg-white border-neutral-200/90'
    : 'bg-neutral-950/75 border-neutral-800/90';

  return (
    <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${cardBg}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="h-3.5 w-3.5 text-violet-400 shrink-0" />
          <span className="font-bold text-[11px] truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
          <span className="opacity-65">{baselineLabel}</span>
          <ArrowRight className="h-3 w-3 opacity-50" />
          <span className="text-violet-400 font-bold">{simulatedLabel}</span>
          {statusBadgeText && (
            <Badge variant={statusVariant} size="sm" isLight={isLight}>
              {statusBadgeText}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {metrics.map((m) => {
          const deltaTone =
            m.improved === 'neutral' || m.improved === undefined
              ? 'text-sky-400 bg-sky-500/10 border-sky-500/25'
              : m.improved
              ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25'
              : 'text-amber-500 bg-amber-500/10 border-amber-500/25';

          return (
            <div
              key={m.id}
              data-footer-desc={`${m.label}: ${baselineLabel} = ${m.baselineValue}${m.unit || ''} → ${simulatedLabel} = ${m.simulatedValue}${m.unit || ''}`}
              className={`p-2 rounded-xl border flex flex-col justify-between gap-1 ${cellBg}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono opacity-65 truncate">{m.label}</span>
                {m.deltaText && (
                  <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold border ${deltaTone}`}>
                    {m.deltaText}
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between gap-1 font-mono mt-0.5">
                <span className="text-[10px] opacity-55 line-through">
                  {m.baselineValue}
                  {m.unit}
                </span>
                <span className="text-xs font-bold text-violet-400">
                  {m.simulatedValue}
                  {m.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

CounterfactualComparisonStrip.displayName = 'CounterfactualComparisonStrip';
