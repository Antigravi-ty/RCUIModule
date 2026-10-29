import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Square,
  PlusSquare,
  MinusSquare,
  Trash2,
  Shield,
  Crosshair,
  Layers,
} from 'lucide-react';
import { ToggleSwitch } from '../primitives/ToggleSwitch';
import { SegmentedSwitch } from '../primitives/SegmentedSwitch';
import { SliderControl } from '../primitives/SliderControl';

import {
  GOAL_BARRIER_WIDTH_UU,
  GOAL_BARRIER_HEIGHT_UU,
  BARRIER_GRID_COLS,
  BARRIER_GRID_ROWS,
  clamp01,
  normalizeRect,
  decomposeBarrierGrid,
  buildPresetBarrierGrid,
  type GoalBarrierSelectionMode,
  type GoalBarrierTargetGoal,
  type GoalBarrierPresetId,
  type NormalizedBarrierRect,
  type GoalBarrierDecomposition,
} from './goalBarrierMath';
export * from './goalBarrierMath';

const GRID_U = BARRIER_GRID_COLS;
const GRID_V = BARRIER_GRID_ROWS;

export interface GoalBarrier2DEditorProps {
  isLight?: boolean;
  defaultPreset?: GoalBarrierPresetId;
  /** Controlled 32x16 barrier grid */
  grid?: Uint8Array;
  onGridChange?: (grid: Uint8Array, decomposition: GoalBarrierDecomposition) => void;
  /** Controlled selection mode ('new' | 'add' | 'subtract') */
  selectionMode?: GoalBarrierSelectionMode;
  defaultSelectionMode?: GoalBarrierSelectionMode;
  onSelectionModeChange?: (mode: GoalBarrierSelectionMode) => void;
  /** Controlled enabled state */
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  /** Controlled opacity (0..1) */
  opacity?: number;
  onOpacityChange?: (opacity: number) => void;
  /** Controlled target goal ('both' | 'orange' | 'blue') */
  targetGoal?: GoalBarrierTargetGoal;
  onTargetGoalChange?: (goal: GoalBarrierTargetGoal) => void;
  /** Visual variant: 'card' (standalone 5B chart card) or 'embedded' (compact inside L6 floating window) */
  variant?: 'card' | 'embedded';
  onApplyPreset?: (presetId: GoalBarrierPresetId, grid: Uint8Array) => void;
  onClear?: () => void;
  onChangeDecomposition?: (decomposition: GoalBarrierDecomposition) => void;
  className?: string;
}

interface DragState {
  startU: number;
  startV: number;
  currU: number;
  currV: number;
}

/**
 * GoalBarrier2DEditor
 * Pure presentational / self-contained 2D Boolean Goal Mouth Barrier Editor (`1792 × 644 UU`).
 * Supports New / Add / Subtract boolean rectangle operations, Outer Snap Zone clamping,
 * disjoint quad decomposition, and 4 quick templates.
 * Used both standalone in 5B Charts & Curves and embedded inside GoalBarrierFloatingWindow.
 */
export const GoalBarrier2DEditor: React.FC<GoalBarrier2DEditorProps> = React.memo(
  ({
    isLight = true,
    defaultPreset = 'top-corners-open',
    grid: controlledGrid,
    onGridChange,
    selectionMode: controlledSelectionMode,
    defaultSelectionMode = 'subtract',
    onSelectionModeChange,
    enabled: controlledEnabled,
    onEnabledChange,
    opacity: controlledOpacity,
    onOpacityChange,
    targetGoal: controlledTargetGoal,
    onTargetGoalChange,
    variant = 'card',
    onApplyPreset,
    onClear,
    onChangeDecomposition,
    className = '',
  }) => {
    const isEmbedded = variant === 'embedded';
    const [internalEnabled, setInternalEnabled] = useState(true);
    const [internalSelectionMode, setInternalSelectionMode] =
      useState<GoalBarrierSelectionMode>(defaultSelectionMode);
    const [internalTargetGoal, setInternalTargetGoal] =
      useState<GoalBarrierTargetGoal>('both');
    const [internalOpacity, setInternalOpacity] = useState(0.65);
    const [internalGrid, setInternalGrid] = useState<Uint8Array>(() =>
      buildPresetBarrierGrid(defaultPreset)
    );

    const enabled = controlledEnabled ?? internalEnabled;
    const selectionMode = controlledSelectionMode ?? internalSelectionMode;
    const targetGoal = controlledTargetGoal ?? internalTargetGoal;
    const opacity = controlledOpacity ?? internalOpacity;
    const grid = controlledGrid ?? internalGrid;

    const decomposition = useMemo(() => decomposeBarrierGrid(grid), [grid]);

    useEffect(() => {
      onChangeDecomposition?.(decomposition);
    }, [decomposition, onChangeDecomposition]);

    const updateSelectionMode = useCallback(
      (mode: GoalBarrierSelectionMode) => {
        if (controlledSelectionMode === undefined) {
          setInternalSelectionMode(mode);
        }
        onSelectionModeChange?.(mode);
      },
      [controlledSelectionMode, onSelectionModeChange]
    );

    const updateEnabled = useCallback(
      (next: boolean) => {
        if (controlledEnabled === undefined) {
          setInternalEnabled(next);
        }
        onEnabledChange?.(next);
      },
      [controlledEnabled, onEnabledChange]
    );

    const updateGrid = useCallback(
      (nextGrid: Uint8Array) => {
        if (controlledGrid === undefined) {
          setInternalGrid(nextGrid);
        }
        const nextDecomp = decomposeBarrierGrid(nextGrid);
        onGridChange?.(nextGrid, nextDecomp);
      },
      [controlledGrid, onGridChange]
    );

    const goalBoxRef = useRef<HTMLDivElement | null>(null);
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [hoverSnapPoint, setHoverSnapPoint] = useState<{
      u: number;
      v: number;
      isClamped: boolean;
    } | null>(null);

    const resolveGoalCoords = useCallback((clientX: number, clientY: number) => {
      const el = goalBoxRef.current;
      if (!el) return { u: 0, v: 0, isClamped: false };
      const rect = el.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const rawU = (clientX - rect.left) / w;
      const rawV = (clientY - rect.top) / h;
      const isClamped = rawU < 0 || rawU > 1 || rawV < 0 || rawV > 1;
      return { u: clamp01(rawU), v: clamp01(rawV), isClamped };
    }, []);

    const commitRect = useCallback(
      (rect: NormalizedBarrierRect) => {
        const next =
          selectionMode === 'new'
            ? new Uint8Array(GRID_U * GRID_V)
            : new Uint8Array(grid);
        const val: 0 | 1 = selectionMode === 'subtract' ? 0 : 1;
        const c0 = Math.max(0, Math.min(GRID_U - 1, Math.floor(rect.u0 * GRID_U)));
        const c1 = Math.max(0, Math.min(GRID_U, Math.ceil(rect.u1 * GRID_U)));
        const r0 = Math.max(0, Math.min(GRID_V - 1, Math.floor(rect.v0 * GRID_V)));
        const r1 = Math.max(0, Math.min(GRID_V, Math.ceil(rect.v1 * GRID_V)));
        for (let r = r0; r < r1; r++) {
          for (let c = c0; c < c1; c++) {
            next[r * GRID_U + c] = val;
          }
        }
        updateGrid(next);
        updateEnabled(true);
      },
      [selectionMode, grid, updateGrid, updateEnabled]
    );

    const handleStageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const pt = resolveGoalCoords(e.clientX, e.clientY);
      setDragState({
        startU: pt.u,
        startV: pt.v,
        currU: pt.u,
        currV: pt.v,
      });
    };

    const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (dragState) return;
      setHoverSnapPoint(resolveGoalCoords(e.clientX, e.clientY));
    };

    useEffect(() => {
      if (!dragState) return;
      const handleWindowMouseMove = (ev: MouseEvent) => {
        const pt = resolveGoalCoords(ev.clientX, ev.clientY);
        setDragState((prev) => (prev ? { ...prev, currU: pt.u, currV: pt.v } : null));
        setHoverSnapPoint(pt);
      };
      const handleWindowMouseUp = (ev: MouseEvent) => {
        const pt = resolveGoalCoords(ev.clientX, ev.clientY);
        const finalRect = normalizeRect(dragState.startU, dragState.startV, pt.u, pt.v);
        if (finalRect) commitRect(finalRect);
        setDragState(null);
      };
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
      };
    }, [dragState, resolveGoalCoords, commitRect]);

    const previewRect: NormalizedBarrierRect | null = dragState
      ? {
          u0: Math.min(dragState.startU, dragState.currU),
          v0: Math.min(dragState.startV, dragState.currV),
          u1: Math.max(dragState.startU, dragState.currU),
          v1: Math.max(dragState.startV, dragState.currV),
        }
      : null;

    const coveragePct = (decomposition.coverageRatio * 100).toFixed(1);
    const quadCount = decomposition.mergedRects.length;

    const handleApplyPreset = (presetId: GoalBarrierPresetId) => {
      const nextGrid = buildPresetBarrierGrid(presetId);
      updateGrid(nextGrid);
      updateEnabled(true);
      onApplyPreset?.(presetId, nextGrid);
    };

    const handleClear = () => {
      const empty = new Uint8Array(GRID_U * GRID_V);
      updateGrid(empty);
      onClear?.();
    };

    return (
      <div
        data-ui-element="chart-goal-barrier-2d-editor"
        className={`flex flex-col gap-3 select-none ${
          isEmbedded
            ? ''
            : `p-4 rounded-2xl border ${
                isLight
                  ? 'bg-white border-neutral-200 text-neutral-900 shadow-xs'
                  : 'bg-neutral-900/90 border-neutral-800 text-neutral-100 shadow-lg'
              }`
        } ${className}`}
      >
        {/* Top Status & Master Toggle Bar (Card variant only) */}
        {!isEmbedded && (
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
              isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-950/70 border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="flex flex-col leading-tight min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs truncate">
                    2D Boolean Goal Mouth Barrier Editor
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-semibold ${
                      enabled && quadCount > 0
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500'
                        : isLight
                        ? 'bg-neutral-200 border-neutral-300 text-neutral-600'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    {enabled && quadCount > 0 ? `${coveragePct}% Blocked` : 'Inactive'}
                  </span>
                </div>
                <span
                  className={`text-[10px] mt-0.5 truncate ${
                    isLight ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                >
                  {quadCount} Disjoint {quadCount === 1 ? 'Quad' : 'Quads'} · 1792 × 644 UU Aperture
                </span>
              </div>
            </div>

            <ToggleSwitch
              checked={Boolean(enabled && quadCount > 0)}
              onCheckedChange={(checked) => {
                if (checked && quadCount === 0) {
                  updateGrid(buildPresetBarrierGrid('full'));
                }
                updateEnabled(checked);
              }}
              isLight={isLight}
            />
          </div>
        )}

        {/* Boolean Operation Toolbar: New | Add | Subtract | Clear */}
        <div className={isEmbedded ? 'flex items-center gap-1.5' : 'grid grid-cols-4 gap-1.5'}>
          {(
            [
              {
                id: 'new',
                label: 'New Selection',
                icon: <Square className="h-3.5 w-3.5 shrink-0" />,
                activeClass: 'bg-amber-500 border-amber-500 text-neutral-950',
              },
              {
                id: 'add',
                label: isEmbedded ? 'Add' : 'Add (+)',
                icon: <PlusSquare className="h-3.5 w-3.5 shrink-0" />,
                activeClass: 'bg-emerald-500 border-emerald-500 text-neutral-950',
              },
              {
                id: 'subtract',
                label: isEmbedded ? 'Subtract' : 'Subtract (-)',
                icon: <MinusSquare className="h-3.5 w-3.5 shrink-0" />,
                activeClass: 'bg-rose-500 border-rose-500 text-white',
              },
            ] as const
          ).map((btn) => {
            const isSelected = selectionMode === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => updateSelectionMode(btn.id)}
                className={`${
                  isEmbedded ? 'flex-1' : ''
                } flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? btn.activeClass
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                    : 'bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                }`}
              >
                {btn.icon}
                <span className="truncate">{btn.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleClear}
            disabled={quadCount === 0}
            title="Clear barrier selection"
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border text-[11px] font-semibold transition-all shrink-0 ${
              quadCount === 0
                ? 'opacity-40 cursor-not-allowed border-neutral-700/40 text-neutral-500'
                : isLight
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-700 cursor-pointer'
                : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-300 cursor-pointer'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            <span>Clear</span>
          </button>
        </div>

        {/* Interactive 2D Goal Canvas with Outer Snap Margin */}
        <div className="flex flex-col gap-1.5">
          <div
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseLeave={() => !dragState && setHoverSnapPoint(null)}
            className={`relative ${
              isEmbedded ? 'p-5' : 'p-6'
            } rounded-xl border cursor-crosshair overflow-hidden ${
              isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-950/90 border-neutral-800'
            }`}
          >
            {!isEmbedded && (
              <div className="absolute top-1.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none text-[9px] font-mono opacity-65">
                <span className="flex items-center gap-1">
                  <Crosshair className="h-2.5 w-2.5 text-amber-500" />
                  <span>OUTER SNAP ZONE (Drag from outside to snap to goal post/crossbar)</span>
                </span>
                <span>1792 × 644 UU</span>
              </div>
            )}

            <div
              ref={goalBoxRef}
              style={{ aspectRatio: `${GOAL_BARRIER_WIDTH_UU} / ${GOAL_BARRIER_HEIGHT_UU}` }}
              className={`relative w-full ${
                isEmbedded ? '' : 'mt-2'
              } rounded-t-2xl border-2 shadow-inner ${
                isLight
                  ? 'bg-neutral-800/95 border-neutral-500/80'
                  : 'bg-neutral-900/95 border-neutral-500/80'
              }`}
            >
              {/* Net Grid */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)',
                  backgroundSize: '12.5% 25%',
                }}
              />

              {/* Decomposed Disjoint Barrier Quads */}
              {decomposition.mergedRects.map((r, idx) => (
                <div
                  key={`${r.u0}-${r.v0}-${idx}`}
                  style={{
                    left: `${r.u0 * 100}%`,
                    top: `${r.v0 * 100}%`,
                    width: `${(r.u1 - r.u0) * 100}%`,
                    height: `${(r.v1 - r.v0) * 100}%`,
                    opacity: enabled ? opacity : 0.2,
                  }}
                  className="absolute pointer-events-none bg-amber-500/45 border border-amber-400/60"
                />
              ))}

              {/* Contour SVG */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {decomposition.contourSegments.map((seg, idx) => (
                  <line
                    key={idx}
                    x1={seg.u0 * 100}
                    y1={seg.v0 * 100}
                    x2={seg.u1 * 100}
                    y2={seg.v1 * 100}
                    stroke={enabled ? '#fbbf24' : '#9ca3af'}
                    strokeWidth="1.4"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>

              {/* Active Rubber-Band Selection */}
              {previewRect && (
                <div
                  style={{
                    left: `${previewRect.u0 * 100}%`,
                    top: `${previewRect.v0 * 100}%`,
                    width: `${(previewRect.u1 - previewRect.u0) * 100}%`,
                    height: `${(previewRect.v1 - previewRect.v0) * 100}%`,
                  }}
                  className={`absolute pointer-events-none border-2 ${
                    selectionMode === 'subtract'
                      ? 'bg-rose-500/35 border-rose-400'
                      : 'bg-emerald-400/35 border-emerald-300'
                  }`}
                />
              )}

              {/* Snap Reticle */}
              {hoverSnapPoint && (
                <div
                  style={{
                    left: `${hoverSnapPoint.u * 100}%`,
                    top: `${hoverSnapPoint.v * 100}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                >
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      hoverSnapPoint.isClamped
                        ? 'border-amber-400 bg-amber-400/40 scale-125'
                        : 'border-white/80 bg-white/20'
                    }`}
                  />
                </div>
              )}
            </div>

            {!isEmbedded && (
              <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono opacity-75 pointer-events-none">
                <span>
                  {hoverSnapPoint
                    ? `Cursor: X=${Math.round(
                        (0.5 - hoverSnapPoint.u) * GOAL_BARRIER_WIDTH_UU
                      )} Z=${Math.round((1 - hoverSnapPoint.v) * GOAL_BARRIER_HEIGHT_UU)} UU${
                        hoverSnapPoint.isClamped ? ' [SNAPPED]' : ''
                      }`
                    : 'Drag inside or from outer snap zone to sculpt barrier'}
                </span>
                <span>Mode: {selectionMode.toUpperCase()}</span>
              </div>
            )}
          </div>

          {isEmbedded && (
            <div className="px-1 font-mono text-[10px] opacity-75">
              {hoverSnapPoint
                ? `Cursor: X=${Math.round(
                    (0.5 - hoverSnapPoint.u) * GOAL_BARRIER_WIDTH_UU
                  )} Z=${Math.round((1 - hoverSnapPoint.v) * GOAL_BARRIER_HEIGHT_UU)} UU${
                    hoverSnapPoint.isClamped ? ' [SNAPPED]' : ''
                  }`
                : 'Cursor: not detected'}
            </div>
          )}
        </div>

        {/* Quick Templates */}
        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              { id: 'full', label: isEmbedded ? 'Full' : 'Full Barrier' },
              { id: 'top-corners-open', label: isEmbedded ? 'Top Corner' : 'Top Corners Open' },
              { id: 'bottom-corners-open', label: isEmbedded ? 'Lower Corner' : 'Low Corners Open' },
              { id: 'center-slot', label: isEmbedded ? 'Centre' : 'Center Slot Open' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPreset(p.id)}
              className={`py-1.5 px-2 rounded-lg border ${
                isEmbedded ? 'text-[11px]' : 'text-[10px]'
              } font-semibold transition-all cursor-pointer truncate ${
                isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                  : 'bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              }`}
            >
              {!isEmbedded && <Layers className="inline h-3 w-3 mr-1 text-amber-500" />}
              {p.label}
            </button>
          ))}
        </div>

        {/* Target Goal & Opacity (Card variant only) */}
        {!isEmbedded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">Target Goal</span>
              <SegmentedSwitch
                value={targetGoal}
                onValueChange={(v) => {
                  const next = v as GoalBarrierTargetGoal;
                  if (controlledTargetGoal === undefined) setInternalTargetGoal(next);
                  onTargetGoalChange?.(next);
                }}
                size="sm"
                isLight={isLight}
                options={[
                  { value: 'both', label: 'Both' },
                  { value: 'orange', label: 'Orange' },
                  { value: 'blue', label: 'Blue' },
                ]}
              />
            </div>
            <SliderControl
              label="Barrier Visual Opacity"
              value={Math.round(opacity * 100)}
              min={10}
              max={100}
              step={5}
              unit="%"
              onChange={(val) => {
                const next = val / 100;
                if (controlledOpacity === undefined) setInternalOpacity(next);
                onOpacityChange?.(next);
              }}
              isLight={isLight}
            />
          </div>
        )}
      </div>
    );
  }
);

GoalBarrier2DEditor.displayName = 'GoalBarrier2DEditor';
