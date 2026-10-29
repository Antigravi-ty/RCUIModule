import React, { useState, useCallback, useMemo } from 'react';
import { BrickWallShield, Cloudy } from 'lucide-react';
import { GoalBarrier2DEditor, type GoalBarrierSelectionMode, type GoalBarrierPresetId, type NormalizedBarrierRect, type GoalBarrierDecomposition, decomposeBarrierGrid, buildPresetBarrierGrid } from '../../charts/GoalBarrier2DEditor';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { SettingActionRow } from '../../compounds/SettingActionRow';
import { SettingSliderRow } from '../../compounds/SettingSliderRow';

export type GoalBarrierPlacement = 'none' | 'both' | 'orange' | 'blue';

export interface GoalBarrierConfigState {
  placement: GoalBarrierPlacement;
  selectionMode: GoalBarrierSelectionMode;
  opacityPct: number;
  grid: Uint8Array;
  mergedRects?: NormalizedBarrierRect[];
}

export interface GoalBarrierConfiguratorFloatingWindowProps {
  isLight?: boolean;
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

/**
 * 2. [User] Goal Barrier Config (`goal-barrier-config`)
 * Standalone L6 Floating Window Panel composing the L5 `<GoalBarrier2DEditor />`:
 * 1. Row 1: `BrickWallShield` (`brick-wall-shield`) icon + `Placement` + Segmented Control (`None`, `Both`, `Orange`, `Blue`).
 * 2. Rows 2–4: Embedded `<GoalBarrier2DEditor variant="embedded" />` (Selection Mode Buttons, 2D Outer-Snap Goal Selector, and 4 Quick Presets).
 * 3. Row 5: `Cloudy` (`cloudy`) icon + `Opacity` + Slider (no `-`/`+` steppers) + editable percentage input (Enter to confirm).
 */
export const GoalBarrierConfiguratorFloatingWindow: React.FC<GoalBarrierConfiguratorFloatingWindowProps> = React.memo(
  ({
    isLight = false,
    placement: controlledPlacement,
    defaultPlacement = 'both',
    onPlacementChange,
    selectionMode: controlledSelectionMode,
    defaultSelectionMode = 'new',
    onSelectionModeChange,
    opacityPct: controlledOpacityPct,
    defaultOpacityPct = 65,
    onOpacityPctChange,
    grid: controlledGrid,
    defaultGrid,
    onGridChange,
    onApplyPreset,
    onClear,
    onChange,
  }) => {
    const [internalPlacement, setInternalPlacement] =
      useState<GoalBarrierPlacement>(defaultPlacement);
    const [internalSelectionMode, setInternalSelectionMode] =
      useState<GoalBarrierSelectionMode>(defaultSelectionMode);
    const [internalOpacityPct, setInternalOpacityPct] =
      useState<number>(defaultOpacityPct);
    const [internalGrid, setInternalGrid] = useState<Uint8Array>(
      () => defaultGrid ?? buildPresetBarrierGrid('top-corners-open')
    );

    const placement = controlledPlacement ?? internalPlacement;
    const selectionMode = controlledSelectionMode ?? internalSelectionMode;
    const opacityPct = controlledOpacityPct ?? internalOpacityPct;
    const grid = controlledGrid ?? internalGrid;

    const decomposition = useMemo(() => decomposeBarrierGrid(grid), [grid]);
    const quadCount = decomposition.mergedRects.length;
    const isBarrierEnabled = placement !== 'none' && quadCount > 0;

    const emitChange = useCallback(
      (patch: Partial<GoalBarrierConfigState>, nextGridOverride?: Uint8Array) => {
        const g = nextGridOverride ?? grid;
        const rects = nextGridOverride
          ? decomposeBarrierGrid(nextGridOverride).mergedRects
          : decomposition.mergedRects;
        onChange?.({
          placement,
          selectionMode,
          opacityPct,
          grid: g,
          mergedRects: rects,
          ...patch,
        });
      },
      [placement, selectionMode, opacityPct, grid, decomposition.mergedRects, onChange]
    );

    const setPlacement = useCallback(
      (nextOrUpdater: GoalBarrierPlacement | ((prev: GoalBarrierPlacement) => GoalBarrierPlacement)) => {
        const next =
          typeof nextOrUpdater === 'function' ? nextOrUpdater(placement) : nextOrUpdater;
        if (controlledPlacement === undefined) {
          setInternalPlacement(next);
        }
        onPlacementChange?.(next);
        emitChange({ placement: next });
      },
      [placement, controlledPlacement, onPlacementChange, emitChange]
    );

    const setSelectionMode = useCallback(
      (next: GoalBarrierSelectionMode) => {
        if (controlledSelectionMode === undefined) {
          setInternalSelectionMode(next);
        }
        onSelectionModeChange?.(next);
        emitChange({ selectionMode: next });
      },
      [controlledSelectionMode, onSelectionModeChange, emitChange]
    );

    const setOpacityPct = useCallback(
      (next: number) => {
        if (controlledOpacityPct === undefined) {
          setInternalOpacityPct(next);
        }
        onOpacityPctChange?.(next);
        emitChange({ opacityPct: next });
      },
      [controlledOpacityPct, onOpacityPctChange, emitChange]
    );

    const handleEditorGridChange = useCallback(
      (nextGrid: Uint8Array, nextDecomp: GoalBarrierDecomposition) => {
        if (controlledGrid === undefined) {
          setInternalGrid(nextGrid);
        }
        const hasQuads = nextDecomp.mergedRects.length > 0;
        const nextPlacement = hasQuads && placement === 'none' ? 'both' : placement;
        if (hasQuads && placement === 'none') {
          if (controlledPlacement === undefined) {
            setInternalPlacement('both');
          }
          onPlacementChange?.('both');
        }
        onGridChange?.(nextGrid, nextDecomp.mergedRects);
        emitChange(
          nextPlacement !== placement
            ? { grid: nextGrid, placement: nextPlacement }
            : { grid: nextGrid },
          nextGrid
        );
      },
      [controlledGrid, placement, controlledPlacement, onPlacementChange, onGridChange, emitChange]
    );

    return (
      <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
        {/* 1. Row 1: BrickWallShield (`brick-wall-shield`) + Placement + Segmented Control (None, Both, Orange, Blue) */}
        <SettingActionRow
          icon={BrickWallShield}
          iconName="brick-wall-shield"
          title="Placement"
          bordered={false}
          showDescription={false}
          paddingX={4}
          paddingY={2}
          isLight={isLight}
          rightSlot={
            <SegmentedSwitch
              value={placement}
              size="sm"
              isLight={isLight}
              onValueChange={(v) => setPlacement(v as GoalBarrierPlacement)}
              options={[
                { value: 'none', label: 'None' },
                { value: 'both', label: 'Both' },
                { value: 'orange', label: 'Orange' },
                { value: 'blue', label: 'Blue' },
              ]}
            />
          }
        />

        {/* 2–4. L5 GoalBarrier2DEditor (Selection Buttons + 2D Outer-Snap Goal Mouth Canvas + Quick Presets) */}
        <GoalBarrier2DEditor
          variant="embedded"
          isLight={isLight}
          grid={grid}
          onGridChange={handleEditorGridChange}
          selectionMode={selectionMode}
          onSelectionModeChange={setSelectionMode}
          enabled={isBarrierEnabled}
          opacity={opacityPct / 100}
          onApplyPreset={onApplyPreset}
          onClear={onClear}
        />

        {/* 5. Row 5: Opacity (icon `cloudy`, slider without -/+, editable Enter-confirm percentage on right) */}
        <SettingSliderRow
          icon={Cloudy}
          iconName="cloudy"
          label="Opacity"
          value={opacityPct}
          min={1}
          max={100}
          step={1}
          unit="%"
          layout="inline"
          trackWidth={148}
          showStepper={false}
          editable={true}
          bordered={false}
          showDescription={false}
          paddingX={4}
          paddingY={2}
          onChange={setOpacityPct}
          isLight={isLight}
        />
      </div>
    );
  }
);
GoalBarrierConfiguratorFloatingWindow.displayName = 'GoalBarrierConfiguratorFloatingWindow';
