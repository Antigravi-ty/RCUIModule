import React, {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import { Activity, Pause, Play, RotateCcw } from 'lucide-react';
import { UI_RADIUS } from '../tokens/radius';
import { UI_THEME } from '../tokens/colors';
import { TelemetryRingBuffer, TelemetryComputedStats } from './telemetryRingBuffer';
import { CanvasRenderCache, drawTelemetryCanvas } from './telemetrySparklinePainter';
import {
  TelemetrySparklineFooter,
  type TelemetryPhaseItem,
  type TelemetrySparklineFooterHandle,
} from './TelemetrySparklineFooter';

export const ALPHA_COMPONENT_ID = 'Alpha:TelemetrySparklineChart' as const;

export type { TelemetryPhaseItem };

export interface TelemetrySparklineChartHandle {
  pushSample: (value: number) => void;
  pushBatch: (values: ArrayLike<number>) => void;
  getRingBuffer: () => TelemetryRingBuffer;
}

export interface TelemetrySparklineChartProps {
  ringBuffer?: TelemetryRingBuffer;
  history?: number[];
  budgetMs?: number;
  refreshHz?: number;
  unit?: string;
  showFpsReadout?: boolean;
  phases?: TelemetryPhaseItem[];
  title?: string;
  height?: number;
  isFrozen?: boolean;
  onFreezeToggle?: (isFrozen: boolean) => void;
  onReset?: () => void;
  variant?: 'card' | 'embedded';
  isLight?: boolean;
  className?: string;
}

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
        isFrozen: controlledIsFrozen,
        onFreezeToggle,
        onReset,
        variant = 'card',
        isLight = false,
        className = '',
      },
      ref
    ) => {
      const compact = variant === 'embedded';
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

      const internalRingBufferRef = useRef<TelemetryRingBuffer | null>(null);
      if (!internalRingBufferRef.current) {
        internalRingBufferRef.current = new TelemetryRingBuffer(240, history);
      }
      const activeRingBuffer = externalRingBuffer ?? internalRingBufferRef.current;

      useEffect(() => {
        if (controlledIsFrozen === undefined) return;
        setFrozenSnapshot(controlledIsFrozen ? activeRingBuffer.snapshot() : null);
      }, [controlledIsFrozen, activeRingBuffer]);

      useEffect(() => {
        if (!externalRingBuffer && history && history.length > 0) {
          internalRingBufferRef.current!.clear();
          internalRingBufferRef.current!.pushBatch(history);
        }
      }, [externalRingBuffer, history]);

      const currentValRef = useRef<HTMLSpanElement | null>(null);
      const fpsValRef = useRef<HTMLSpanElement | null>(null);
      const footerRef = useRef<TelemetrySparklineFooterHandle | null>(null);
      const headerDirtyRef = useRef({ currentStr: '', fpsStr: '' });

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
        setFrozenSnapshot(nextFrozen ? activeRingBuffer.snapshot() : null);
        if (controlledIsFrozen === undefined) {
          setInternalIsFrozen(nextFrozen);
        }
        onFreezeToggle?.(nextFrozen);
      };

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
        (s: TelemetryComputedStats) => {
          const d = headerDirtyRef.current;
          const curStr = s.currentMs.toFixed(2);
          if (d.currentStr !== curStr && currentValRef.current) {
            d.currentStr = curStr;
            currentValRef.current.textContent = curStr;
          }
          if (showFpsReadout && fpsValRef.current) {
            const fStr = `(${s.fps} fps)`;
            if (d.fpsStr !== fStr) {
              d.fpsStr = fStr;
              fpsValRef.current.textContent = fStr;
            }
          }
          footerRef.current?.syncStats(s);
        },
        [showFpsReadout]
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
          data-alpha-id={ALPHA_COMPONENT_ID}
          data-component="telemetry-sparkline-chart"
          className={`${
            isEmbedded ? 'p-2.5 gap-2' : 'p-3 gap-2.5'
          } ${UI_RADIUS.card} border flex flex-col select-none transition-colors ${
            isLight
              ? `bg-white ${UI_THEME.light.border} ${UI_THEME.light.textPrimary} shadow-2xs`
              : isEmbedded
              ? `bg-neutral-900/75 ${UI_THEME.dark.border} ${UI_THEME.dark.textPrimary}`
              : `bg-neutral-900/90 ${UI_THEME.dark.border} ${UI_THEME.dark.textPrimary}`
          } ${className}`}
        >
          {!isEmbedded && (
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
                    className={`px-2 py-0.5 ${UI_RADIUS.badge} border text-[11px] flex items-center gap-1.5 ${
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

                <button
                  type="button"
                  onClick={toggleFreeze}
                  title={isFrozen ? 'Resume live telemetry stream' : 'Freeze frame history to inspect spikes'}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 ${UI_RADIUS.button} border text-[10px] font-semibold cursor-pointer transition-colors ${
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
              </div>
            </div>
          )}

          <div
            className={`relative ${UI_RADIUS.button} border overflow-hidden ${
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

          {isEmbedded && (
            <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleFreeze}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 ${UI_RADIUS.button} border text-[10px] font-semibold cursor-pointer transition-colors ${
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
                  className={`inline-flex items-center gap-1 px-2.5 py-1 ${UI_RADIUS.button} border text-[10px] font-semibold cursor-pointer transition-colors ${
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

          <TelemetrySparklineFooter
            ref={footerRef}
            showQuantiles
            compact={compact}
            isEmbedded={isEmbedded}
            isLight={isLight}
            unit={unit}
            budgetMs={budgetMs}
            initialStats={initialStats}
            phases={phases}
          />
        </div>
      );
    }
  )
);

TelemetrySparklineChart.displayName = 'TelemetrySparklineChart';
