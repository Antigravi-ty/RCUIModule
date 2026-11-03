import React from 'react';
import { Cpu } from 'lucide-react';
import type { TelemetryComputedStats } from './telemetryRingBuffer';
export interface TelemetryPhaseItem {
  phase: string;
  avgMs: number;
  share: number;
  color?: string;
}

const PHASE_COLORS: Record<string, string> = {
  sim: '#f59e0b',
  scene: '#0ea5e9',
  camera: '#6366f1',
  prep: '#10b981',
  render: '#ec4899',
  ui: '#8b5cf6',
};

export interface TelemetrySparklineFooterProps {
  showQuantiles: boolean;
  compact: boolean;
  isEmbedded: boolean;
  isLight: boolean;
  unit: string;
  budgetMs: number;
  initialStats: TelemetryComputedStats;
  phases?: TelemetryPhaseItem[];
  p50ValRef: React.RefObject<HTMLSpanElement | null>;
  p95ValRef: React.RefObject<HTMLSpanElement | null>;
  p99ValRef: React.RefObject<HTMLSpanElement | null>;
  peakValRef: React.RefObject<HTMLSpanElement | null>;
  budgetBoxRef: React.RefObject<HTMLDivElement | null>;
  budgetTextRef: React.RefObject<HTMLSpanElement | null>;
}

export const TelemetrySparklineFooter: React.FC<TelemetrySparklineFooterProps> = ({
  showQuantiles,
  compact,
  isEmbedded,
  isLight,
  unit,
  budgetMs,
  initialStats,
  phases,
  p50ValRef,
  p95ValRef,
  p99ValRef,
  peakValRef,
  budgetBoxRef,
  budgetTextRef,
}) => {
  return (
    <>
      {showQuantiles && !compact && !isEmbedded && (
        <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
          {[
            { label: 'p50', ref: p50ValRef, val: initialStats.p50.toFixed(2) + unit, cls: '' },
            { label: 'p95', ref: p95ValRef, val: initialStats.p95.toFixed(2) + unit, cls: '' },
            {
              label: 'p99',
              ref: p99ValRef,
              val: initialStats.p99.toFixed(2) + unit,
              cls: 'text-amber-500',
            },
            {
              label: 'Peak',
              ref: peakValRef,
              val: initialStats.worstMs.toFixed(2) + unit,
              cls: initialStats.worstMs > budgetMs * 1.2 ? 'text-rose-500' : '',
            },
          ].map((q) => (
            <div
              key={q.label}
              className={`p-1.5 rounded-lg border ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-950/60 border-neutral-800'
              }`}
            >
              <span className="text-[9px] text-neutral-400 block">{q.label}</span>
              <span ref={q.ref} className={`text-[11px] font-bold tabular-nums ${q.cls}`}>
                {q.val}
              </span>
            </div>
          ))}
          <div
            ref={budgetBoxRef}
            className={`p-1.5 rounded-lg border ${
              initialStats.overBudgetCount > 0
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
            }`}
          >
            <span className="text-[9px] opacity-80 block">Budget</span>
            <span
              ref={budgetTextRef}
              className="text-[11px] font-bold tabular-nums flex items-center justify-center gap-0.5"
            >
              {initialStats.overBudgetCount > 0
                ? `${initialStats.overBudgetPct}% Over`
                : '100% OK'}
            </span>
          </div>
        </div>
      )}

      {phases && phases.length > 0 && !compact && (
        <div
          className={`pt-2 border-t flex flex-col gap-1.5 font-mono text-[10px] ${
            isLight ? 'border-neutral-200' : 'border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="flex items-center gap-1 font-semibold uppercase">
              <Cpu className="h-3 w-3 text-sky-500" />
              <span>CPU Phase Breakdown</span>
            </span>
            <span className="tabular-nums">
              Total {phases.reduce((a, b) => a + b.avgMs, 0).toFixed(2)} {unit}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
            {phases.map((ph) => {
              const pct = Math.round(ph.share * 100);
              const barColor = ph.color || PHASE_COLORS[ph.phase] || '#94a3b8';
              return (
                <div key={ph.phase} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: barColor }}
                  />
                  <span className="uppercase opacity-80 w-12 truncate">{ph.phase}</span>
                  <span className="font-bold tabular-nums">
                    {ph.avgMs.toFixed(2)}
                    {unit}
                  </span>
                  <span className="text-neutral-500 tabular-nums ml-auto">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
