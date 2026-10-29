import React, {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import { Activity, Pause, Play, Cpu, RotateCcw } from 'lucide-react';
import { TelemetryRingBuffer, TelemetryComputedStats } from './telemetryRingBuffer';
import { CanvasRenderCache, drawTelemetryCanvas, syncTelemetryDomReadouts, type TelemetryDomDirtyState } from './telemetrySparklinePainter';

export interface TelemetryPhaseItem {
  phase: string;
  avgMs: number;
  share: number;
  color?: string;
}

export interface TelemetrySparklineChartHandle {
  /** Push a single sample at 120Hz+ without triggering React re-renders */
  pushSample: (value: number) => void;
  /** Push a batch of samples (e.g. spike injection) */
  pushBatch: (values: ArrayLike<number>) => void;
  /** Access underlying ring buffer */
  getRingBuffer: () => TelemetryRingBuffer;
}

export interface TelemetrySparklineChartProps {
  /** Zero-allocation Float32Array ring buffer for 120Hz+ streaming with 0 React re-renders. */
  ringBuffer?: TelemetryRingBuffer;
  /** Optional initial/static sample array (loaded once into internal ringBuffer if `ringBuffer` prop is omitted). */
  history?: number[];
  /** Target frame time / threshold budget in ms (default: 8.33ms for 120Hz). */
  budgetMs?: number;
  /** Target refresh/sample rate in Hz (default: 120). */
  refreshHz?: number;
  /** Optional unit label (default: 'ms'). */
  unit?: string;
  /** Whether to show derived FPS next to current reading (default: true). */
  showFpsReadout?: boolean;
  /** Optional CPU phase breakdown list. */
  phases?: TelemetryPhaseItem[];
  title?: string;
  height?: number;
  compact?: boolean;
  showHeader?: boolean;
  showQuantiles?: boolean;
  showFreezeControl?: boolean;
  /** Controlled freeze state */
  isFrozen?: boolean;
  onFreezeToggle?: (isFrozen: boolean) => void;
  /** Optional Reset button callback (rendered in embedded footer bar) */
  onReset?: () => void;
  /** Visual variant: 'card' (default) or 'embedded' (compact canvas + Freeze/Reset/Average bar inside L6 floating window) */
  variant?: 'card' | 'embedded';
  isLight?: boolean;
  className?: string;
}

const PHASE_COLORS: Record<string, string> = {
  sim: '#f59e0b',
  scene: '#0ea5e9',
  camera: '#6366f1',
  prep: '#10b981',
  bloom: '#d946ef',
  final: '#f43f5e',
};

/**
 * TelemetrySparklineChart
 * Event-driven, 120Hz Zero-Allocation, Zero-React-Rerender DPR Canvas Telemetry Analyzer.
 * Driven by `TelemetryRingBuffer.subscribe()` + coalesced single rAF (0% CPU when idle/frozen).
 */
export const TelemetrySparklineChart = React.memo(
  forwardRef<TelemetrySparklineChartHandle, TelemetrySparklineChartProps>(
    (
      {
        ringBuffer: externalRingBuffer,
        history,
        budgetMs = 8.33,
        refreshHz = 120,
        unit = 'ms',
        showFpsReadout = true,
        phases,
        title = 'Frame Time Telemetry',
        height = 112,
        compact = false,
        showHeader = true,
        showQuantiles = true,
        showFreezeControl = true,
        isFrozen: controlledIsFrozen,
        onFreezeToggle,
        onReset,
        variant = 'card',
        isLight = false,
        className = '',
      },
      ref
    ) => {
      const canvasRef = useRef<HTMLCanvasElement | null>(null);
      const containerRef = useRef<HTMLDivElement | null>(null);
      const renderCacheRef = useRef<CanvasRenderCache>({
        ctx: null,
        grad: null,
        gradHeight: 0,
        gradIsLight: null,
      });

      const [canvasWidth, setCanvasWidth] = useState<number>(360);
      const [internalIsFrozen, setInternalIsFrozen] = useState<boolean>(false);
      const isFrozen = controlledIsFrozen ?? internalIsFrozen;
      const [frozenSnapshot, setFrozenSnapshot] = useState<Float32Array | null>(null);
      const [hoverIndex, setHoverIndex] = useState<number | null>(null);

      // Internal fallback ring buffer when driven via imperative ref or initial `history` prop
      const internalRingBufferRef = useRef<TelemetryRingBuffer | null>(null);
      if (!internalRingBufferRef.current) {
        internalRingBufferRef.current = new TelemetryRingBuffer(240, history);
      }
      const activeRingBuffer = externalRingBuffer ?? internalRingBufferRef.current;

      // Sync controlled freeze snapshot when controlledIsFrozen toggles
      useEffect(() => {
        if (controlledIsFrozen === undefined) return;
        if (controlledIsFrozen) {
          setFrozenSnapshot(activeRingBuffer.snapshot());
        } else {
          setFrozenSnapshot(null);
        }
      }, [controlledIsFrozen, activeRingBuffer]);

      // Sync initial/external `history` array into internal ring buffer ONLY if `externalRingBuffer` is not used
      useEffect(() => {
        if (!externalRingBuffer && history && history.length > 0) {
          internalRingBufferRef.current!.clear();
          internalRingBufferRef.current!.pushBatch(history);
        }
      }, [externalRingBuffer, history]);

      // Transient DOM readout refs (updated without React re-renders, dirty-checked to avoid Recalc Style)
      const currentValRef = useRef<HTMLSpanElement | null>(null);
      const fpsValRef = useRef<HTMLSpanElement | null>(null);
      const p50ValRef = useRef<HTMLSpanElement | null>(null);
      const p95ValRef = useRef<HTMLSpanElement | null>(null);
      const p99ValRef = useRef<HTMLSpanElement | null>(null);
      const peakValRef = useRef<HTMLSpanElement | null>(null);
      const budgetBoxRef = useRef<HTMLDivElement | null>(null);
      const budgetTextRef = useRef<HTMLSpanElement | null>(null);

      const domDirtyStateRef = useRef<TelemetryDomDirtyState>({
        currentStr: '', fpsStr: '', p50Str: '', p95Str: '', p99Str: '', peakStr: '', budgetStr: '',
        isPeakOver: null, isBudgetOver: null,
      });

      useImperativeHandle(
        ref,
        () => ({
          pushSample: (val: number) => activeRingBuffer.push(val),
          pushBatch: (vals: ArrayLike<number>) => activeRingBuffer.pushBatch(vals),
          getRingBuffer: () => activeRingBuffer,
        }),
        [activeRingBuffer]
      );

      const toggleFreeze = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextFrozen = !isFrozen;
        if (nextFrozen) {
          setFrozenSnapshot(activeRingBuffer.snapshot());
        } else {
          setFrozenSnapshot(null);
        }
        if (controlledIsFrozen === undefined) {
          setInternalIsFrozen(nextFrozen);
        }
        onFreezeToggle?.(nextFrozen);
      };

      // Observe container width for crisp 1:1 DPR canvas sizing
      useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const w = Math.max(160, Math.floor(entry.contentRect.width));
            setCanvasWidth((prev) => (prev !== w ? w : prev));
          }
        });
        ro.observe(el);
        return () => ro.disconnect();
      }, []);

      const syncDomReadouts = useCallback(
        (s: TelemetryComputedStats) =>
          syncTelemetryDomReadouts(
            s, domDirtyStateRef.current,
            {
              currentVal: currentValRef.current, fpsVal: fpsValRef.current,
              p50Val: p50ValRef.current, p95Val: p95ValRef.current, p99Val: p99ValRef.current,
              peakVal: peakValRef.current, budgetBox: budgetBoxRef.current, budgetText: budgetTextRef.current,
            },
            budgetMs, showFpsReadout, unit
          ),
        [budgetMs, showFpsReadout, unit]
      );

      const getSampleCount = useCallback(() => {
        return isFrozen && frozenSnapshot ? frozenSnapshot.length : activeRingBuffer.count;
      }, [isFrozen, frozenSnapshot, activeRingBuffer]);

      const getSampleAt = useCallback(
        (idx: number) => {
          if (isFrozen && frozenSnapshot) {
            return frozenSnapshot[idx] ?? 0;
          }
          return activeRingBuffer.getAt(idx);
        },
        [isFrozen, frozenSnapshot, activeRingBuffer]
      );

      // Draw & sync when static props, dimensions, hover, or freeze state change
      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const stats = activeRingBuffer.computeStats(
          budgetMs,
          refreshHz,
          isFrozen ? frozenSnapshot : null
        );
        drawTelemetryCanvas(canvas, renderCacheRef.current, getSampleCount(), getSampleAt, stats.ceiling, {
          canvasWidth, height, budgetMs, refreshHz, unit, isLight, hoverIndex, isFrozen,
        });
        syncDomReadouts(stats);
      }, [
        activeRingBuffer, frozenSnapshot, getSampleCount, getSampleAt,
        canvasWidth, height, budgetMs, refreshHz, unit, isLight, hoverIndex, isFrozen, syncDomReadouts, history,
      ]);

      // Event-driven coalesced rAF draw on ringBuffer push (0% CPU when idle or frozen!)
      const liveOptsRef = useRef({ canvasWidth, height, budgetMs, refreshHz, unit, isLight, hoverIndex, isFrozen });
      liveOptsRef.current = { canvasWidth, height, budgetMs, refreshHz, unit, isLight, hoverIndex, isFrozen };

      useEffect(() => {
        let rafId = 0;
        let scheduled = false;
        let quantileFrameCounter = 0;
        const getAtLive = (idx: number) => activeRingBuffer.getAt(idx);

        const flushFrame = () => {
          scheduled = false;
          const opts = liveOptsRef.current;
          if (opts.isFrozen) return;
          const canvas = canvasRef.current;
          if (!canvas) return;

          quantileFrameCounter = (quantileFrameCounter + 1) % 10;
          if (quantileFrameCounter === 0 && opts.hoverIndex === null) {
            const fullStats = activeRingBuffer.computeStats(opts.budgetMs, opts.refreshHz);
            drawTelemetryCanvas(
              canvas,
              renderCacheRef.current,
              activeRingBuffer.count,
              getAtLive,
              fullStats.ceiling,
              opts
            );
            syncDomReadouts(fullStats);
          } else {
            const fastStats = activeRingBuffer.updateFastBounds(opts.budgetMs, opts.refreshHz);
            drawTelemetryCanvas(
              canvas,
              renderCacheRef.current,
              activeRingBuffer.count,
              getAtLive,
              fastStats.ceiling,
              opts
            );
          }
        };

        const unsub = activeRingBuffer.subscribe(() => {
          if (!scheduled && !liveOptsRef.current.isFrozen) {
            scheduled = true;
            rafId = requestAnimationFrame(flushFrame);
          }
        });

        return () => {
          unsub();
          if (scheduled) cancelAnimationFrame(rafId);
        };
      }, [activeRingBuffer, syncDomReadouts]);

      const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const padLeft = 36;
        const padRight = 10;
        const plotW = Math.max(10, rect.width - padLeft - padRight);
        const relX = e.clientX - rect.left - padLeft;
        const ratio = Math.max(0, Math.min(1, relX / plotW));
        const count = getSampleCount();
        if (count > 0) {
          const idx = Math.round(ratio * (count - 1));
          setHoverIndex((prev) => (prev !== idx ? idx : prev));
        }
      };

      const count = getSampleCount();
      const inspectedValue =
        hoverIndex !== null && hoverIndex >= 0 && hoverIndex < count
          ? getSampleAt(hoverIndex)
          : null;
      const inspectedDelta = inspectedValue !== null ? inspectedValue - budgetMs : null;
      const initialStats = activeRingBuffer.computeStats(
        budgetMs,
        refreshHz,
        isFrozen ? frozenSnapshot : null
      );

      const isEmbedded = variant === 'embedded';
      let sumMs = 0;
      if (isEmbedded && count > 0) {
        for (let i = 0; i < count; i++) {
          sumMs += getSampleAt(i);
        }
      }
      const avgMs = count > 0 ? sumMs / count : 0;

      const handleReset = () => {
        if (onReset) {
          onReset();
        } else {
          activeRingBuffer.clear();
        }
        if (isFrozen) {
          setFrozenSnapshot(activeRingBuffer.snapshot());
        }
      };

      return (
        <div
          ref={containerRef}
          data-component="telemetry-sparkline-chart"
          className={`${
            isEmbedded ? 'p-2.5 gap-2' : 'p-3 gap-2.5'
          } rounded-xl border flex flex-col select-none transition-colors ${
            isLight
              ? 'bg-white border-neutral-200 text-neutral-800 shadow-2xs'
              : isEmbedded
              ? 'bg-neutral-900/75 border-neutral-800 text-neutral-100'
              : 'bg-neutral-900/90 border-neutral-800 text-neutral-100'
          } ${className}`}
        >
          {/* Header Bar */}
          {showHeader && !isEmbedded && (
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                <Activity className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>{title}</span>
                {isFrozen && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-500 border border-amber-500/30 uppercase">
                    Snapshot Frozen
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 font-mono">
                {inspectedValue !== null ? (
                  <div
                    className={`px-2 py-0.5 rounded border text-[11px] flex items-center gap-1.5 ${
                      inspectedValue > budgetMs * 1.02
                        ? 'bg-rose-500/15 text-rose-500 border-rose-500/30 font-bold'
                        : isLight
                        ? 'bg-neutral-100 text-neutral-800 border-neutral-300'
                        : 'bg-neutral-800 text-neutral-200 border-neutral-700'
                    }`}
                  >
                    <span>Sample #{hoverIndex}:</span>
                    <strong>
                      {inspectedValue.toFixed(2)}
                      {unit}
                    </strong>
                    <span className="text-[10px] opacity-80">
                      ({inspectedDelta! >= 0 ? `+${inspectedDelta!.toFixed(2)}` : inspectedDelta!.toFixed(2)}
                      {unit})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span
                      ref={currentValRef}
                      className="text-sm font-bold text-amber-500 tabular-nums"
                    >
                      {initialStats.currentMs.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-neutral-400">{unit}</span>
                    {showFpsReadout && (
                      <span ref={fpsValRef} className="text-[10px] text-neutral-500 tabular-nums">
                        ({initialStats.fps} fps)
                      </span>
                    )}
                  </div>
                )}

                {showFreezeControl && (
                  <button
                    type="button"
                    onClick={toggleFreeze}
                    title={isFrozen ? 'Resume live telemetry stream' : 'Freeze frame history to inspect spikes'}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold cursor-pointer transition-colors ${
                      isFrozen
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                        : isLight
                        ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                        : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                    }`}
                  >
                    {isFrozen ? (
                      <Play className="h-2.5 w-2.5 fill-current" />
                    ) : (
                      <Pause className="h-2.5 w-2.5" />
                    )}
                    <span>{isFrozen ? 'Resume' : 'Freeze'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* High-DPI Canvas Plot */}
          <div
            className={`relative rounded-lg border overflow-hidden ${
              isLight
                ? 'bg-neutral-50/90 border-neutral-200/90'
                : 'bg-neutral-950/90 border-neutral-800'
            }`}
          >
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: `${height}px`, display: 'block' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverIndex(null)}
              className="cursor-crosshair"
            />
          </div>

          {/* Embedded Footer Controls (Freeze + Reset + Average readout) */}
          {isEmbedded && (
            <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleFreeze}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold cursor-pointer transition-colors ${
                    isFrozen
                      ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                      : isLight
                      ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                      : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                  }`}
                >
                  {isFrozen ? (
                    <Play className="h-3 w-3 fill-current" />
                  ) : (
                    <Pause className="h-3 w-3" />
                  )}
                  <span>{isFrozen ? 'Resume' : 'Freeze'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                      : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                  }`}
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-neutral-400">Average:</span>
                <span className="font-bold text-amber-500 tabular-nums">
                  {avgMs.toFixed(2)} {unit}
                </span>
                <span className="text-[10px] opacity-65 tabular-nums">
                  ({avgMs > 0.1 ? Math.min(999, Math.round(1000 / avgMs)) : refreshHz} fps)
                </span>
              </div>
            </div>
          )}

          {/* Quantile Breakdown Chips */}
          {showQuantiles && !compact && !isEmbedded && (
            <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
              {[
                { label: 'p50', ref: p50ValRef, val: initialStats.p50.toFixed(2) + unit, cls: '' },
                { label: 'p95', ref: p95ValRef, val: initialStats.p95.toFixed(2) + unit, cls: '' },
                { label: 'p99', ref: p99ValRef, val: initialStats.p99.toFixed(2) + unit, cls: 'text-amber-500' },
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
                  {initialStats.overBudgetCount > 0 ? `${initialStats.overBudgetPct}% Over` : '100% OK'}
                </span>
              </div>
            </div>
          )}

          {/* Optional CPU Phase Breakdown */}
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
        </div>
      );
    }
  )
);

TelemetrySparklineChart.displayName = 'TelemetrySparklineChart';
