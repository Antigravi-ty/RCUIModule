import React, { useRef, useState, useEffect } from 'react';
import { Cpu, HardDrive } from 'lucide-react';
import { TelemetrySparklineChart, TelemetryPhaseItem } from '../../charts/TelemetrySparklineChart';
import { TelemetryRingBuffer } from '../../charts/telemetryRingBuffer';
import { quickNotification } from '../../stores/quickNotificationStore';

const INITIAL_FRAME_SAMPLES: number[] = [
  3.18, 3.24, 3.31, 3.22, 3.45, 3.28, 3.19, 3.35, 3.41, 3.26, 3.3, 3.21,
  3.38, 3.52, 3.29, 3.25, 3.33, 3.4, 3.27, 3.18, 3.36, 4.12, 3.48, 3.31,
  3.22, 3.29, 3.34, 3.26, 3.19, 3.32, 3.44, 3.28, 3.23, 3.37, 3.3, 3.25,
  3.41, 3.33, 3.27, 3.21, 3.35, 3.49, 3.31, 3.24, 3.28, 3.39, 3.26, 3.32,
];

const DEFAULT_CPU_PHASES: TelemetryPhaseItem[] = [
  { phase: 'Physics & Collision (Sim)', avgMs: 1.12, share: 0.34, color: '#f59e0b' },
  { phase: 'Scene Graph & Matrices', avgMs: 0.74, share: 0.22, color: '#0ea5e9' },
  { phase: 'Post-FX & Bloom Pass', avgMs: 0.45, share: 0.14, color: '#d946ef' },
  { phase: 'Render Queue Prep', avgMs: 0.42, share: 0.13, color: '#10b981' },
  { phase: 'Camera & Tracking', avgMs: 0.31, share: 0.09, color: '#6366f1' },
  { phase: 'Final Composite & HUD', avgMs: 0.26, share: 0.08, color: '#f43f5e' },
];

export interface LiveSystemTelemetrySnapshot {
  /** Latest frame time in milliseconds (pushed into internal Canvas RingBuffer) */
  frameTimeMs?: number;
  budgetMs?: number;
  refreshHz?: number;
  /** Optional override for P50/P95/P99/Peak/Budget stats */
  p50Ms?: number;
  p95Ms?: number;
  p99Ms?: number;
  peakMs?: number;
  overBudgetPct?: number;
  /** Optional CPU breakdown phases */
  cpuPhases?: TelemetryPhaseItem[];
  /** Optional WASM Physics & Bot Engine metrics */
  physicsStepHz?: string | number;
  substepsPerTick?: string | number;
  botPolicyLabel?: string;
  wasmHeapMb?: string | number;
  /** Optional WebGL2 / Three.js pipeline metrics */
  pipelineBadge?: string;
  drawCalls?: number;
  trianglesLabel?: string | number;
  geometries?: number;
  shaderPrograms?: number;
}

export interface PerformanceMonitorFloatingWindowProps {
  isLight?: boolean;
  /** Aggregated telemetry snapshot; when provided, disables internal random setInterval and pushes frameTimeMs to RingBuffer */
  snapshot?: LiveSystemTelemetrySnapshot;
  /** Optional historical array of frame times (ms) to seed/replace RingBuffer */
  frameSamplesMs?: number[];
  budgetMs?: number;
  refreshHz?: number;
  isFrozen?: boolean;
  defaultIsFrozen?: boolean;
  onFreezeToggle?: (isFrozen: boolean) => void;
  onPauseToggle?: (isFrozen: boolean) => void;
  onReset?: () => void;
  onClear?: () => void;
  onExportLog?: () => void;
}

/**
 * 5. [User] Performance Monitor (`live-system-telemetry`)
 * Standalone L6 Floating Window Panel composing the L5 `<TelemetrySparklineChart />`:
 * 1. Top row: 5 quantile/metric cards (`P50`, `P95`, `P99`, `Peak`, `Budget`)
 * 2. Embedded `<TelemetrySparklineChart variant="embedded" />`: `Freeze`, `Reset`, and current window `Average`
 * 3. CPU Breakdown card: Header (`Cpu` icon + `CPU Breakdown` on left, `Total` on right) + vertical multi-color percentage bars
 * 4. Bottom cards: WASM Physics & WebGL2 Pipeline (preserved)
 */
export const PerformanceMonitorFloatingWindow: React.FC<PerformanceMonitorFloatingWindowProps> =
  React.memo(
    ({
      isLight = false,
      snapshot,
      frameSamplesMs,
      budgetMs: propBudgetMs,
      refreshHz: propRefreshHz,
      isFrozen: controlledIsFrozen,
      defaultIsFrozen = false,
      onFreezeToggle,
      onPauseToggle,
      onReset,
      onClear,
    }) => {
      const budgetMs = propBudgetMs ?? snapshot?.budgetMs ?? 8.33;
      const refreshHz = propRefreshHz ?? snapshot?.refreshHz ?? 120;

      const ringBufferRef = useRef<TelemetryRingBuffer | null>(null);
      if (!ringBufferRef.current) {
        ringBufferRef.current = new TelemetryRingBuffer(
          240,
          frameSamplesMs && frameSamplesMs.length > 0 ? frameSamplesMs : INITIAL_FRAME_SAMPLES
        );
      }
      const ringBuffer = ringBufferRef.current;

      const [internalIsFrozen, setInternalIsFrozen] = useState<boolean>(defaultIsFrozen);
      const isFrozen = controlledIsFrozen ?? internalIsFrozen;
      const [frozenSnapshot, setFrozenSnapshot] = useState<Float32Array | null>(null);
      const [, setVersionTick] = useState<number>(0);

      const hasExternalFeed = snapshot !== undefined || frameSamplesMs !== undefined;

      // Sync external historical array when provided
      useEffect(() => {
        if (!frameSamplesMs || isFrozen) return;
        ringBuffer.clear();
        ringBuffer.pushBatch(frameSamplesMs);
        setVersionTick((v) => (v + 1) % 10000);
      }, [frameSamplesMs, isFrozen, ringBuffer]);

      // Push incoming snapshot.frameTimeMs into internal Canvas RingBuffer
      useEffect(() => {
        if (!snapshot || snapshot.frameTimeMs === undefined || isFrozen) return;
        ringBuffer.push(Number(snapshot.frameTimeMs));
        setVersionTick((v) => (v + 1) % 10000);
      }, [snapshot, isFrozen, ringBuffer]);

      // Gentle self-simulation when unfrozen and no external snapshot is passed
      useEffect(() => {
        if (isFrozen || hasExternalFeed) return;
        let phase = 0;
        const id = window.setInterval(() => {
          phase += 0.18;
          const sample = 3.25 + Math.sin(phase) * 0.22 + (Math.random() - 0.5) * 0.18;
          ringBuffer.push(Number(sample.toFixed(2)));
          setVersionTick((v) => (v + 1) % 10000);
        }, 120);
        return () => window.clearInterval(id);
      }, [isFrozen, hasExternalFeed, ringBuffer]);

      const stats = ringBuffer.computeStats(budgetMs, refreshHz, isFrozen ? frozenSnapshot : null);
      const displayP50 = snapshot?.p50Ms ?? stats.p50;
      const displayP95 = snapshot?.p95Ms ?? stats.p95;
      const displayP99 = snapshot?.p99Ms ?? stats.p99;
      const displayPeak = snapshot?.peakMs ?? stats.worstMs;
      const displayOverBudgetPct = snapshot?.overBudgetPct ?? stats.overBudgetPct;
      const isOverBudget =
        snapshot?.overBudgetPct !== undefined
          ? snapshot.overBudgetPct > 0
          : stats.overBudgetCount > 0;

      const handleFreezeChange = (nextFrozen: boolean) => {
        if (nextFrozen) {
          setFrozenSnapshot(ringBuffer.snapshot());
        } else {
          setFrozenSnapshot(null);
        }
        if (controlledIsFrozen === undefined) {
          setInternalIsFrozen(nextFrozen);
        }
        onFreezeToggle?.(nextFrozen);
        onPauseToggle?.(nextFrozen);
      };

      const handleReset = () => {
        ringBuffer.clear();
        if (!hasExternalFeed) {
          ringBuffer.pushBatch(INITIAL_FRAME_SAMPLES);
        } else if (frameSamplesMs && frameSamplesMs.length > 0) {
          ringBuffer.pushBatch(frameSamplesMs);
        }
        if (isFrozen) {
          setFrozenSnapshot(ringBuffer.snapshot());
        }
        setVersionTick((v) => v + 1);
        onReset?.();
        onClear?.();
        quickNotification.info('Reset frame-time telemetry window.');
      };

      const cpuPhases = snapshot?.cpuPhases ?? DEFAULT_CPU_PHASES;
      const totalCpuMs = cpuPhases.reduce((acc, item) => acc + item.avgMs, 0);

      const physicsStepLabel =
        snapshot?.physicsStepHz !== undefined
          ? typeof snapshot.physicsStepHz === 'number'
            ? `${snapshot.physicsStepHz.toFixed(1)} Hz`
            : snapshot.physicsStepHz
          : '120.0 Hz';
      const substepsLabel =
        snapshot?.substepsPerTick !== undefined
          ? typeof snapshot.substepsPerTick === 'number'
            ? `${snapshot.substepsPerTick} / tick`
            : snapshot.substepsPerTick
          : '4 / tick';
      const botPolicyLabel = snapshot?.botPolicyLabel ?? 'Nexto (15Hz)';
      const wasmHeapLabel =
        snapshot?.wasmHeapMb !== undefined
          ? typeof snapshot.wasmHeapMb === 'number'
            ? `${snapshot.wasmHeapMb.toFixed(1)} MB`
            : snapshot.wasmHeapMb
          : '64.0 MB';

      const pipelineBadge = snapshot?.pipelineBadge ?? 'DPR 1.0 · FXAA + Bloom';
      const drawCalls = snapshot?.drawCalls ?? 142;
      const trianglesLabel = snapshot?.trianglesLabel ?? '218.4 K';
      const geometries = snapshot?.geometries ?? 68;
      const shaderPrograms = snapshot?.shaderPrograms ?? 29;

      return (
        <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
          {/* 1. Top 5 Data Metrics: P50, P95, P99, Peak, Budget */}
          <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
            <div
              className={`p-2 rounded-xl border ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/70 border-neutral-800'
              }`}
            >
              <span className="text-[9px] text-neutral-400 uppercase block">P50</span>
              <span className="text-[11px] font-bold tabular-nums">{displayP50.toFixed(2)}ms</span>
            </div>

            <div
              className={`p-2 rounded-xl border ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/70 border-neutral-800'
              }`}
            >
              <span className="text-[9px] text-neutral-400 uppercase block">P95</span>
              <span className="text-[11px] font-bold tabular-nums">{displayP95.toFixed(2)}ms</span>
            </div>

            <div
              className={`p-2 rounded-xl border ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/70 border-neutral-800'
              }`}
            >
              <span className="text-[9px] text-neutral-400 uppercase block">P99</span>
              <span className="text-[11px] font-bold text-amber-500 tabular-nums">
                {displayP99.toFixed(2)}ms
              </span>
            </div>

            <div
              className={`p-2 rounded-xl border ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/70 border-neutral-800'
              }`}
            >
              <span className="text-[9px] text-neutral-400 uppercase block">Peak</span>
              <span
                className={`text-[11px] font-bold tabular-nums ${
                  displayPeak > budgetMs * 1.2 ? 'text-rose-500' : ''
                }`}
              >
                {displayPeak.toFixed(2)}ms
              </span>
            </div>

            <div
              className={`p-2 rounded-xl border ${
                isOverBudget
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              }`}
            >
              <span className="text-[9px] opacity-80 uppercase block">Budget</span>
              <span className="text-[11px] font-bold tabular-nums">
                {isOverBudget ? `${displayOverBudgetPct}% Over` : `${budgetMs}ms`}
              </span>
            </div>
          </div>

          {/* 2. L5 TelemetrySparklineChart (Embedded Frame-Time Sparkline Canvas + Freeze / Reset / Average Bar) */}
          <TelemetrySparklineChart
            variant="embedded"
            ringBuffer={ringBuffer}
            budgetMs={budgetMs}
            refreshHz={refreshHz}
            height={124}
            isFrozen={isFrozen}
            onFreezeToggle={handleFreezeChange}
            onReset={handleReset}
            isLight={isLight}
          />

      {/* 3. CPU Breakdown (Vertical Multi-Color Percentage Bars) */}
      <div
        className={`p-3 rounded-xl border flex flex-col gap-2.5 ${
          isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
        }`}
      >
        <div className="flex items-center justify-between font-mono">
          <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-sky-500 shrink-0" />
            <span>CPU Breakdown</span>
          </span>
          <span className="text-[11px] font-bold tabular-nums text-sky-400">
            Total: {totalCpuMs.toFixed(2)} ms (100%)
          </span>
        </div>

        <div className="flex flex-col gap-2 font-mono text-[10px]">
          {cpuPhases.map((item) => {
            const pct = Math.round(item.share * 100);
            const barColor = item.color || '#38bdf8';
            return (
              <div key={item.phase} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: barColor }}
                    />
                    <span className="opacity-90 truncate">{item.phase}</span>
                  </span>
                  <span className="tabular-nums shrink-0">
                    <strong className="mr-1.5">{item.avgMs.toFixed(2)}ms</strong>
                    <span className="opacity-65">({pct}%)</span>
                  </span>
                </div>
                <div
                  className={`w-full h-1.5 rounded-full overflow-hidden ${
                    isLight ? 'bg-neutral-200/90' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(2, Math.min(100, pct))}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Physics & WebGL Pipeline Cards */}
      <div className="grid grid-cols-1 gap-2.5">
        <div
          className={`p-3 rounded-xl border flex flex-col gap-2 ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
              <Cpu className="h-3.5 w-3.5" />
              <span>WASM Physics & Bot Engine</span>
            </span>
            <span className="font-mono text-[10px] opacity-70">Bullet3 + ONNX Runtime</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between gap-1.5 whitespace-nowrap px-2 py-1 rounded bg-black/5 dark:bg-white/5">
              <span className="opacity-65">Physics Step:</span>
              <span className="font-bold text-emerald-500">{physicsStepLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-1.5 whitespace-nowrap px-2 py-1 rounded bg-black/5 dark:bg-white/5">
              <span className="opacity-65">Substeps:</span>
              <span className="font-bold">{substepsLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-1.5 whitespace-nowrap px-2 py-1 rounded bg-black/5 dark:bg-white/5">
              <span className="opacity-65">Bot Policy:</span>
              <span className="font-bold text-sky-400">{botPolicyLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-1.5 whitespace-nowrap px-2 py-1 rounded bg-black/5 dark:bg-white/5">
              <span className="opacity-65">WASM Heap:</span>
              <span className="font-bold">{wasmHeapLabel}</span>
            </div>
          </div>
        </div>

        <div
          className={`p-3 rounded-xl border flex flex-col gap-2 ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-sky-500">
              <HardDrive className="h-3.5 w-3.5" />
              <span>WebGL2 / Three.js Pipeline</span>
            </span>
            <span className="font-mono text-[10px] opacity-70">{pipelineBadge}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between gap-1.5 whitespace-nowrap px-2 py-1 rounded bg-black/5 dark:bg-white/5">
              <span className="opacity-65">Draw Calls:</span>
              <span className="font-bold">{drawCalls}</span>
            </div>
            <div className="flex items-center justify-between gap-1.5 whitespace-nowrap px-2 py-1 rounded bg-black/5 dark:bg-white/5">
              <span className="opacity-65">Triangles:</span>
              <span className="font-bold">{trianglesLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-1.5 whitespace-nowrap px-2 py-1 rounded bg-black/5 dark:bg-white/5">
              <span className="opacity-65">Geometries:</span>
              <span className="font-bold">{geometries}</span>
            </div>
            <div className="flex items-center justify-between gap-1.5 whitespace-nowrap px-2 py-1 rounded bg-black/5 dark:bg-white/5">
              <span className="opacity-65">Shader Progs:</span>
              <span className="font-bold">{shaderPrograms}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
PerformanceMonitorFloatingWindow.displayName = 'PerformanceMonitorFloatingWindow';
