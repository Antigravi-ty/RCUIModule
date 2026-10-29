import React, { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Activity, Pause, Play, Zap, RotateCcw } from 'lucide-react';
import { PACING_EVENT_FLAGS, PacingSampleInput, PacingRingBuffer } from './pacingRingBuffer';

export { PACING_EVENT_FLAGS, PacingRingBuffer };
export type { PacingSampleInput };

import {
  drawPacingOscilloscopeCanvas,
  type OscilloscopeRenderCache,
} from './pacingOscilloscopePainter';
export interface PacingOscilloscopeHandle {
  /** Push a single 120Hz pacing frame into the pre-allocated ring buffer with zero React re-renders */
  pushSample: (sample: PacingSampleInput) => void;
  /** Access underlying zero-allocation ring buffer */
  getRingBuffer: () => PacingRingBuffer;
}

export interface PacingOscilloscopeChartProps {
  /** Optional external pre-allocated PacingRingBuffer for 120Hz zero-React-rerender streaming */
  ringBuffer?: PacingRingBuffer;
  /** Height of the 3-pane oscilloscope canvas in px (default: 240) */
  height?: number;
  /** Deadband corridor offsets around target buffer in ticks (default: [-2, 2]) */
  deadbandOffsets?: [number, number];
  /** Optional counterfactual What-If overlay trajectory */
  whatIfOverlay?: {
    simBuffer: ArrayLike<number>;
    simRateHz: ArrayLike<number>;
    targetBuffer?: number;
  } | null;
  /** Whether to run built-in 120Hz self-simulation when no external caller pushes samples */
  autoSimulate?: boolean;
  /** Whether to show the top title & EWMA/Buf/Rate header bar (default: true) */
  showHeader?: boolean;
  /** Whether to show the developer Inject Starvation + Resync button (default: true) */
  showInjectStarvation?: boolean;
  /** Whether to draw inside-pane text labels on the left of each sub-pane (default: true) */
  showPaneLabels?: boolean;
  /** Controlled freeze state (optional) */
  isFrozen?: boolean;
  /** Default freeze state when uncontrolled (default: false) */
  defaultIsFrozen?: boolean;
  /** Callback when freeze state is toggled */
  onFreezeToggle?: (frozen: boolean) => void;
  /** Callback when buffer is cleared */
  onClear?: () => void;
  /** Layout variant: 'card' renders standalone card chrome, 'embedded' renders borderless for floating windows */
  variant?: 'card' | 'embedded';
  isLight?: boolean;
  className?: string;
}

/**
 * PacingOscilloscopeChart
 * 3-Pane Synchronized 120Hz Network Clock-Pacing & Buffer Deadband Oscilloscope:
 * - Pre-allocated `PacingRingBuffer` (`Float32Array` + `Uint8Array`) with O(1) circular indexing.
 * - Cached `CanvasRenderingContext2D`, static dash arrays, and ResizeObserver width caching.
 * - Zero React re-renders on mousemove crosshair or 120Hz sample pushes.
 */
export const PacingOscilloscopeChart = React.memo(
  forwardRef<PacingOscilloscopeHandle, PacingOscilloscopeChartProps>(
    (
      {
        ringBuffer: externalBuffer,
        height = 240,
        deadbandOffsets = [-2, 2],
        whatIfOverlay = null,
        autoSimulate = true,
        showHeader = true,
        showInjectStarvation = true,
        showPaneLabels = true,
        isFrozen: controlledIsFrozen,
        defaultIsFrozen = false,
        onFreezeToggle,
        onClear,
        variant = 'card',
        isLight = true,
        className = '',
      },
      ref
    ) => {
      const internalBufferRef = useRef<PacingRingBuffer | null>(null);
      if (!internalBufferRef.current) {
        const buf = new PacingRingBuffer(360);
        let rtt = 26;
        let eff = 3.0;
        for (let i = 0; i < 240; i++) {
          const spike = i === 110 || i === 111 ? 28 : 0;
          rtt = 26 + Math.sin(i * 0.08) * 3.5 + (Math.random() - 0.5) * 2.2 + spike;
          const tgt = 3.0;
          const srv = spike > 0 ? -0.5 : 3.0 + Math.sin(i * 0.06) * 1.1;
          eff = eff * 0.82 + srv * 0.18;
          const err = eff - tgt;
          const rate = Math.max(115, Math.min(125, 120 - err * 0.85));
          const flags =
            srv < 0
              ? PACING_EVENT_FLAGS.STARVATION
              : spike > 0
              ? PACING_EVENT_FLAGS.JITTER_SPIKE
              : 0;
          buf.push({
            rawRttMs: rtt,
            serverBuffer: srv,
            effectiveBuffer: eff,
            targetBuffer: tgt,
            physicsRateHz: rate,
            eventFlags: flags,
          });
        }
        internalBufferRef.current = buf;
      }

      const activeBuffer = externalBuffer ?? internalBufferRef.current;

      const canvasRef = useRef<HTMLCanvasElement | null>(null);
      const renderCacheRef = useRef<OscilloscopeRenderCache>({
        canvas: null,
        ctx: null,
        cssW: 520,
        cssH: height,
        isLight: false,
      });

      const rttBadgeRef = useRef<HTMLSpanElement | null>(null);
      const bufBadgeRef = useRef<HTMLSpanElement | null>(null);
      const rateBadgeRef = useRef<HTMLSpanElement | null>(null);

      const [internalIsFrozen, setInternalIsFrozen] = useState(defaultIsFrozen);
      const isFrozen = controlledIsFrozen ?? internalIsFrozen;
      const isFrozenRef = useRef(isFrozen);
      isFrozenRef.current = isFrozen;
      const hoverIndexRef = useRef<number | null>(null);

      const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        drawPacingOscilloscopeCanvas(canvas, renderCacheRef.current, activeBuffer, {
          height,
          deadbandOffsets,
          whatIfOverlay,
          showPaneLabels,
          isLight,
          hoverIndex: hoverIndexRef.current,
        });
      }, [activeBuffer, height, deadbandOffsets, whatIfOverlay, showPaneLabels, isLight]);

      const updateHeaderBadges = useCallback(() => {
        const count = activeBuffer.count;
        if (count === 0) return;
        const pIdx = activeBuffer.physicalIndex(count - 1);
        if (rttBadgeRef.current) {
          rttBadgeRef.current.textContent = `${activeBuffer.smoothRttMs[pIdx].toFixed(1)} ms`;
        }
        if (bufBadgeRef.current) {
          bufBadgeRef.current.textContent = `${activeBuffer.effectiveBuffer[pIdx].toFixed(1)} ticks`;
        }
        if (rateBadgeRef.current) {
          rateBadgeRef.current.textContent = `${activeBuffer.physicsRateHz[pIdx].toFixed(1)} Hz`;
        }
      }, [activeBuffer]);

      useImperativeHandle(
        ref,
        () => ({
          pushSample: (sample: PacingSampleInput) => {
            activeBuffer.push(sample);
          },
          getRingBuffer: () => activeBuffer,
        }),
        [activeBuffer]
      );

      // Observe canvas width via ResizeObserver so drawCanvas never forces synchronous layout read
      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || typeof ResizeObserver === 'undefined') return;
        renderCacheRef.current.cssW = canvas.clientWidth || 520;
        const ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const w = Math.max(200, Math.floor(entry.contentRect.width));
            if (renderCacheRef.current.cssW !== w) {
              renderCacheRef.current.cssW = w;
              drawCanvas();
            }
          }
        });
        ro.observe(canvas);
        return () => ro.disconnect();
      }, [drawCanvas]);

      // Subscribe to ring buffer updates with coalesced rAF (0 React re-renders)
      useEffect(() => {
        let tickCounter = 0;
        let rafId = 0;
        let scheduled = false;

        const flush = () => {
          scheduled = false;
          if (isFrozenRef.current) return;
          drawCanvas();
          tickCounter++;
          if (tickCounter % 6 === 0) {
            updateHeaderBadges();
          }
        };

        const unsub = activeBuffer.subscribe(() => {
          if (!scheduled && !isFrozenRef.current) {
            scheduled = true;
            rafId = requestAnimationFrame(flush);
          }
        });

        return () => {
          unsub();
          if (scheduled) cancelAnimationFrame(rafId);
        };
      }, [activeBuffer, drawCanvas, updateHeaderBadges]);

      useEffect(() => {
        drawCanvas();
        updateHeaderBadges();
      }, [drawCanvas, updateHeaderBadges]);

      useEffect(() => {
        if (!autoSimulate || externalBuffer) return;
        let phase = 0;
        const timer = window.setInterval(() => {
          if (isFrozenRef.current) return;
          phase += 0.12;
          const rawRtt = 25 + Math.sin(phase) * 3.8 + (Math.random() - 0.5) * 2.5;
          const tgt = 3.0;
          const srv = 3.0 + Math.cos(phase * 0.7) * 1.1 + (Math.random() - 0.5) * 0.4;
          const eff = srv * 0.9 + 0.3;
          const rate = 120 - (eff - tgt) * 0.75;
          activeBuffer.push({
            rawRttMs: rawRtt,
            serverBuffer: srv,
            effectiveBuffer: eff,
            targetBuffer: tgt,
            physicsRateHz: rate,
            eventFlags: 0,
          });
        }, 33);
        return () => window.clearInterval(timer);
      }, [autoSimulate, externalBuffer, activeBuffer]);

      const handleInjectStarvationBurst = () => {
        for (let i = 0; i < 12; i++) {
          const isResync = i === 11;
          activeBuffer.push({
            rawRttMs: 74 + Math.random() * 18,
            serverBuffer: -1.8 + i * 0.25,
            effectiveBuffer: -1.2 + i * 0.2,
            targetBuffer: 3.0,
            physicsRateHz: 124.2,
            eventFlags: isResync
              ? PACING_EVENT_FLAGS.HARD_RESYNC
              : PACING_EVENT_FLAGS.STARVATION,
          });
        }
        drawCanvas();
        updateHeaderBadges();
      };

      const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const cssW = renderCacheRef.current.cssW || 520;
        const padX = 8;
        const plotW = Math.max(20, cssW - padX * 2);
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left - padX) / plotW));
        const idx = Math.round(ratio * Math.max(0, activeBuffer.count - 1));
        if (hoverIndexRef.current !== idx) {
          hoverIndexRef.current = idx;
          drawCanvas();
        }
      };

      const handleMouseLeave = () => {
        if (hoverIndexRef.current !== null) {
          hoverIndexRef.current = null;
          drawCanvas();
        }
      };

      const handleToggleFreeze = () => {
        const next = !isFrozen;
        if (controlledIsFrozen === undefined) {
          setInternalIsFrozen(next);
        }
        onFreezeToggle?.(next);
      };

      const handleClearBuffer = () => {
        if (onClear) {
          onClear();
        } else {
          activeBuffer.clear();
        }
        drawCanvas();
        updateHeaderBadges();
      };

      const isEmbedded = variant === 'embedded';

      return (
        <div
          data-ui-element="chart-pacing-oscilloscope"
          className={`flex flex-col ${
            isEmbedded
              ? `gap-2 p-2.5 rounded-xl border ${
                  isLight ? 'bg-white border-neutral-200' : 'bg-neutral-900/75 border-neutral-800'
                }`
              : `gap-2.5 p-4 rounded-2xl border ${
                  isLight
                    ? 'bg-white border-neutral-200 text-neutral-900 shadow-xs'
                    : 'bg-neutral-900/90 border-neutral-800 text-neutral-100 shadow-lg'
                }`
          } select-none ${className}`}
        >
          {showHeader && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-500" />
                <span className="font-bold text-xs tracking-tight">
                  3-Pane Network Clock-Pacing & Buffer Deadband Oscilloscope
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isLight
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  Float32 RingBuffer · 0 VDOM Diff
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-sky-500 font-semibold">
                  EWMA: <b ref={rttBadgeRef}>26.0 ms</b>
                </span>
                <span className="opacity-30">|</span>
                <span className="text-emerald-500 font-semibold">
                  Buf: <b ref={bufBadgeRef}>3.0 ticks</b>
                </span>
                <span className="opacity-30">|</span>
                <span className="text-amber-500 font-semibold">
                  Rate: <b ref={rateBadgeRef}>120.0 Hz</b>
                </span>
              </div>
            </div>
          )}

          <div
            className={`relative ${
              isEmbedded ? 'rounded-lg' : 'rounded-xl'
            } overflow-hidden border ${
              isLight ? 'border-neutral-300' : 'border-neutral-800'
            }`}
            style={{ height: `${height}px` }}
          >
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="block w-full h-full cursor-crosshair"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px]">
            <div className="flex items-center gap-3 font-mono text-[10px] opacity-80">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-sky-400 inline-block" />{' '}
                {isEmbedded ? 'RTT' : 'RTT / EWMA'}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />{' '}
                {isEmbedded ? 'Lead Buffer' : 'Eff. Buffer & Deadband'}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />{' '}
                {isEmbedded ? 'Physics Rate' : 'Clock Rate (Hz)'}
              </span>
              {!isEmbedded && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-rose-500/60 inline-block" /> Starvation (&lt;0t)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              {showInjectStarvation && (
                <button
                  type="button"
                  onClick={handleInjectStarvationBurst}
                  className={`px-2.5 py-1 rounded-lg border font-mono text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                      : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <Zap className="h-3 w-3" />
                  <span>Inject Starvation + Resync</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleFreeze}
                className={`px-2.5 py-1 rounded-lg border font-mono text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                  isFrozen
                    ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                    : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                }`}
              >
                {isFrozen ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                <span>{isFrozen ? 'Resume' : 'Freeze'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearBuffer}
                className={`px-2.5 py-1 rounded-lg border font-mono text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                    : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                }`}
                title="Clear / Reset Oscilloscope RingBuffer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
  )
);

PacingOscilloscopeChart.displayName = 'PacingOscilloscopeChart';
