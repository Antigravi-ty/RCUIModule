import { useCallback, useMemo } from 'react';
import {
  BARRIER_GRID_COLS,
  BARRIER_GRID_ROWS,
  type GoalBarrierPresetId,
  type GoalBarrierSelectionMode,
  type NormalizedBarrierRect,
} from '../../charts/goalBarrierMath';
import { useGoalBarrierStore } from '../../stores/goalBarrierStore';
import {
  decomposeGoalBarrierOperations,
  saveGoalBarrierConfig,
  type NormalizedRect,
} from '../../config/goalBarrierConfig';
export type GoalBarrierPlacement = 'none' | 'blue' | 'orange' | 'both';

export interface GoalBarrierConfigState {
  placement: GoalBarrierPlacement;
  selectionMode: GoalBarrierSelectionMode;
  opacityPct: number;
  grid: Uint8Array;
  mergedRects?: NormalizedBarrierRect[];
}

export interface GoalBarrierConfiguratorFloatingWindowProps {
  isLight?: boolean;
  active?: boolean;
  /** Controlled placement ('none' | 'both' | 'orange' | 'blue') */
  placement?: GoalBarrierPlacement;
  defaultPlacement?: GoalBarrierPlacement;
  onPlacementChange?: (placement: GoalBarrierPlacement) => void;
  /** Controlled selection mode ('new' | 'add' | 'subtract') */
  selectionMode?: GoalBarrierSelectionMode;
  defaultSelectionMode?: GoalBarrierSelectionMode;
  onSelectionModeChange?: (mode: GoalBarrierSelectionMode) => void;
  /** Controlled opacity percentage (1..100) */
  opacityPct?: number;
  defaultOpacityPct?: number;
  onOpacityPctChange?: (opacityPct: number) => void;
  /** Controlled 32x16 barrier grid */
  grid?: Uint8Array;
  defaultGrid?: Uint8Array;
  onGridChange?: (grid: Uint8Array, mergedRects: NormalizedBarrierRect[]) => void;
  /** Callback when a preset is clicked */
  onApplyPreset?: (presetId: GoalBarrierPresetId, grid: Uint8Array) => void;
  /** Callback when Clear is clicked */
  onClear?: () => void;
  /** Aggregated state change callback */
  onChange?: (state: GoalBarrierConfigState) => void;
}

function rectsToGrid(rects: NormalizedRect[]): Uint8Array {
  const grid = new Uint8Array(BARRIER_GRID_COLS * BARRIER_GRID_ROWS);
  for (const r of rects) {
    const c0 = Math.max(0, Math.min(BARRIER_GRID_COLS - 1, Math.floor(r.u0 * BARRIER_GRID_COLS)));
    const c1 = Math.max(c0 + 1, Math.min(BARRIER_GRID_COLS, Math.ceil(r.u1 * BARRIER_GRID_COLS)));
    const r0 = Math.max(0, Math.min(BARRIER_GRID_ROWS - 1, Math.floor(r.v0 * BARRIER_GRID_ROWS)));
    const r1 = Math.max(r0 + 1, Math.min(BARRIER_GRID_ROWS, Math.ceil(r.v1 * BARRIER_GRID_ROWS)));
    for (let y = r0; y < r1; y++) {
      for (let x = c0; x < c1; x++) {
        grid[y * BARRIER_GRID_COLS + x] = 1;
      }
    }
  }
  return grid;
}

export function useGoalBarrierPanelBinding(
  rawProps: GoalBarrierConfiguratorFloatingWindowProps
): GoalBarrierConfiguratorFloatingWindowProps {
  const {
    enabled,
    targetGoal,
    selectionMode,
    opacity,
    decomposition,
    setEnabled,
    setTargetGoal,
    setSelectionMode,
    setOpacity,
    applyPreset,
    clearBarrier,
  } = useGoalBarrierStore();

  const storePlacement: GoalBarrierPlacement = !enabled ? 'none' : targetGoal;
  const storeOpacityPct = Math.round(opacity * 100);
  const storeGrid = useMemo(
    () => rectsToGrid(decomposition.mergedRects),
    [decomposition.mergedRects]
  );

  const handlePlacementChange = useCallback(
    (next: GoalBarrierPlacement) => {
      if (next === 'none') {
        setEnabled(false);
      } else {
        setTargetGoal(next);
        setEnabled(true);
      }
      rawProps.onPlacementChange?.(next);
    },
    [setEnabled, setTargetGoal, rawProps.onPlacementChange]
  );

  const handleOpacityPctChange = useCallback(
    (pct: number) => {
      setOpacity(pct / 100);
      rawProps.onOpacityPctChange?.(pct);
    },
    [setOpacity, rawProps.onOpacityPctChange]
  );

  const handleGridChange = useCallback(
    (grid: Uint8Array, mergedRects: NormalizedBarrierRect[]) => {
      const ops = mergedRects.map((rect, idx) => ({
        mode: (idx === 0 ? 'new' : 'add') as 'new' | 'add',
        rect,
      }));
      const nextDecomp = decomposeGoalBarrierOperations(ops);
      const state = useGoalBarrierStore.getState();
      const nextEnabled = nextDecomp.mergedRects.length > 0;
      saveGoalBarrierConfig({
        enabled: nextEnabled,
        selectionMode: state.selectionMode,
        targetGoal: state.targetGoal,
        opacity: state.opacity,
        rects: nextDecomp.mergedRects,
      });
      useGoalBarrierStore.setState({
        enabled: nextEnabled,
        operations: ops,
        decomposition: nextDecomp,
        revision: state.revision + 1,
      });
      rawProps.onGridChange?.(grid, mergedRects);
    },
    [rawProps.onGridChange]
  );

  return {
    ...rawProps,
    placement: rawProps.placement ?? storePlacement,
    onPlacementChange: handlePlacementChange,
    selectionMode: rawProps.selectionMode ?? selectionMode,
    onSelectionModeChange: (mode: GoalBarrierSelectionMode) => {
      setSelectionMode(mode);
      rawProps.onSelectionModeChange?.(mode);
    },
    opacityPct: rawProps.opacityPct ?? storeOpacityPct,
    onOpacityPctChange: handleOpacityPctChange,
    grid: rawProps.grid ?? storeGrid,
    onGridChange: handleGridChange,
    onApplyPreset: (presetId: GoalBarrierPresetId, grid: Uint8Array) => {
      applyPreset(presetId);
      rawProps.onApplyPreset?.(presetId, grid);
    },
    onClear: () => {
      clearBarrier();
      rawProps.onClear?.();
    },
  };
}

