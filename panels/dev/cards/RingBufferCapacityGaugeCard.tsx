import React from 'react';
import { Database, Activity, Server, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from '../../../primitives/Badge';

export interface RingBufferGaugeItem {
  id: string;
  label: string;
  subtitle?: string;
  usedFrames: number;
  maxFrames: number;
  fps?: number;
  estimatedBytesPerFrame?: number;
  colorScheme?: 'sky' | 'amber' | 'emerald' | 'violet';
  included?: boolean;
  onToggleInclude?: (included: boolean) => void;
}

export interface RingBufferCapacityPreset {
  label: string;
  frames: number;
}

export interface RingBufferCapacityGaugeCardProps {
  buffers: RingBufferGaugeItem[];
  capacityPresets?: RingBufferCapacityPreset[];
  selectedCapacityFrames?: number;
  onSelectCapacityFrames?: (frames: number) => void;
  autoPauseOnOverflow?: boolean;
  onToggleAutoPauseOnOverflow?: (val: boolean) => void;
  isLight?: boolean;
}

const DEFAULT_CAPACITY_PRESETS: RingBufferCapacityPreset[] = [
  { label: '30s (3.6k)', frames: 3600 },
  { label: '90s (10.8k)', frames: 10800 },
  { label: '150s (18k)', frames: 18000 },
  { label: '300s (36k)', frames: 36000 },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * [L2 Compound] RingBufferCapacityGaugeCard
 * Reusable multi-track ring-buffer capacity gauge with frame/time/MB readouts,
 * capacity preset pills (30s..300s), overflow auto-pause toggle, and per-track export inclusion.
 */
export const RingBufferCapacityGaugeCard: React.FC<RingBufferCapacityGaugeCardProps> = React.memo(({
  buffers,
  capacityPresets = DEFAULT_CAPACITY_PRESETS,
  selectedCapacityFrames = 36000,
  onSelectCapacityFrames,
  autoPauseOnOverflow = true,
  onToggleAutoPauseOnOverflow,
  isLight = false,
}) => {
  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
    : 'bg-neutral-900/60 border-neutral-800 text-neutral-200';
  const subBg = isLight
    ? 'bg-white border-neutral-200'
    : 'bg-neutral-950/70 border-neutral-800/80';

  const getBarColor = (scheme: RingBufferGaugeItem['colorScheme'], isNearFull: boolean) => {
    if (isNearFull) return 'bg-rose-500';
    switch (scheme) {
      case 'amber':
        return 'bg-amber-500';
      case 'emerald':
        return 'bg-emerald-500';
      case 'violet':
        return 'bg-violet-500';
      case 'sky':
      default:
        return 'bg-sky-500';
    }
  };

  const getIcon = (idx: number, scheme: RingBufferGaugeItem['colorScheme']) => {
    const cls =
      scheme === 'amber'
        ? 'text-amber-500'
        : scheme === 'emerald'
        ? 'text-emerald-500'
        : scheme === 'violet'
        ? 'text-violet-500'
        : 'text-sky-500';
    if (idx === 0) return <Database className={`h-3.5 w-3.5 ${cls} shrink-0`} />;
    if (idx === 1) return <Activity className={`h-3.5 w-3.5 ${cls} shrink-0`} />;
    return <Server className={`h-3.5 w-3.5 ${cls} shrink-0`} />;
  };

  return (
    <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${cardBg}`}>
      {/* Capacity Presets & Overflow Behavior */}
      {(onSelectCapacityFrames || onToggleAutoPauseOnOverflow) && (
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200/70 dark:border-neutral-800">
          {onSelectCapacityFrames && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] font-mono opacity-65 mr-1">Ring Capacity:</span>
              {capacityPresets.map((preset) => {
                const active = selectedCapacityFrames === preset.frames;
                return (
                  <button
                    key={preset.frames}
                    type="button"
                    onClick={() => onSelectCapacityFrames(preset.frames)}
                    data-footer-desc={`Set client ring buffer capacity to ${preset.label} (${preset.frames.toLocaleString()} frames @ 120Hz).`}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-semibold cursor-pointer transition-colors ${
                      active
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                        : isLight
                        ? 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          )}

          {onToggleAutoPauseOnOverflow && (
            <button
              type="button"
              onClick={() => onToggleAutoPauseOnOverflow(!autoPauseOnOverflow)}
              data-footer-desc="Toggle whether recording automatically pauses when the ring buffer reaches 100% capacity or wraps around."
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-semibold cursor-pointer transition-colors ${
                autoPauseOnOverflow
                  ? 'bg-amber-500/15 text-amber-500 border-amber-500/35'
                  : isLight
                  ? 'bg-white border-neutral-200 text-neutral-500'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400'
              }`}
            >
              {autoPauseOnOverflow ? 'Overflow: Auto-Pause' : 'Overflow: Ring Overwrite'}
            </button>
          )}
        </div>
      )}

      {/* Individual Ring Buffer Gauges */}
      <div className="flex flex-col gap-2">
        {buffers.map((buf, idx) => {
          const fps = buf.fps ?? 120;
          const maxF = Math.max(1, buf.maxFrames);
          const pct = Math.min(100, Math.max(0, (buf.usedFrames / maxF) * 100));
          const isNearFull = pct >= 92;
          const usedSec = (buf.usedFrames / fps).toFixed(1);
          const maxSec = (maxF / fps).toFixed(0);
          const estBytes = buf.usedFrames * (buf.estimatedBytesPerFrame ?? 224);

          return (
            <div
              key={buf.id}
              className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${subBg}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {getIcon(idx, buf.colorScheme)}
                  <span className="font-bold text-[11px] truncate">{buf.label}</span>
                  {buf.subtitle && (
                    <span className="text-[10px] font-mono opacity-55 truncate hidden sm:inline">
                      ({buf.subtitle})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={isNearFull ? 'danger' : pct > 0 ? 'success' : 'neutral'}
                    size="sm"
                    isLight={isLight}
                  >
                    {isNearFull ? (
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" /> {pct.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> {pct.toFixed(1)}%
                      </span>
                    )}
                  </Badge>

                  {buf.onToggleInclude && (
                    <button
                      type="button"
                      onClick={() => buf.onToggleInclude!(!buf.included)}
                      data-footer-desc={`Include or exclude [${buf.label}] track when exporting diagnostic .zip bundle.`}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border cursor-pointer transition-colors ${
                        buf.included !== false
                          ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/35'
                          : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                      }`}
                    >
                      {buf.included !== false ? 'INCLUDED' : 'SKIPPED'}
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-neutral-200/80 dark:bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${getBarColor(
                    buf.colorScheme,
                    isNearFull
                  )}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Numeric Telemetry Readout */}
              <div className="flex items-center justify-between text-[10px] font-mono opacity-75">
                <span>
                  {buf.usedFrames.toLocaleString()} / {maxF.toLocaleString()} frames ({usedSec}s / {maxSec}s)
                </span>
                <span>~{formatBytes(estBytes)} raw</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

RingBufferCapacityGaugeCard.displayName = 'RingBufferCapacityGaugeCard';
