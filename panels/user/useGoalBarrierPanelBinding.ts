import { useCallback, useMemo } from 'react';
import {
  BARRIER_GRID_COLS,
  BARRIER_GRID_ROWS,
  type NormalizedBarrierRect,
} from '../../charts/goalBarrierMath';
import { useGoalBarrierStore } from '../../stores/goalBarrierStore';
import {
  decomposeGoalBarrierOperations,
  saveGoalBarrierConfig,
  type NormalizedRect,
} from '../../config/goalBarrierConfig';

export type GoalBarrierPlacement = 'none' | 'blue' | 'orange' | 'both';

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

export function useGoalBarrierPanelBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
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
      props.onPlacementChange?.(next);
    },
    [setEnabled, setTargetGoal, props.onPlacementChange]
  );

  const handleOpacityPctChange = useCallback(
    (pct: number) => {
      setOpacity(pct / 100);
      props.onOpacityPctChange?.(pct);
    },
    [setOpacity, props.onOpacityPctChange]
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
      props.onGridChange?.(grid, mergedRects);
    },
    [props.onGridChange]
  );

  return {
    ...rawProps,
    placement: props.placement ?? storePlacement,
    onPlacementChange: handlePlacementChange,
    selectionMode: props.selectionMode ?? selectionMode,
    onSelectionModeChange: (mode: any) => {
      setSelectionMode(mode);
      props.onSelectionModeChange?.(mode);
    },
    opacityPct: props.opacityPct ?? storeOpacityPct,
    onOpacityPctChange: handleOpacityPctChange,
    grid: props.grid ?? storeGrid,
    onGridChange: handleGridChange,
    onApplyPreset: (presetId: any, grid: Uint8Array) => {
      applyPreset(presetId);
      props.onApplyPreset?.(presetId, grid);
    },
    onClear: () => {
      clearBarrier();
      props.onClear?.();
    },
  } as TProps;
}

