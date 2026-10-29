import { useCallback, useMemo } from 'react';
import {
  BARRIER_GRID_COLS,
  BARRIER_GRID_ROWS,
  type NormalizedBarrierRect,
} from '../../charts/GoalBarrier2DEditor';
import type {
  ReplayIncidentMarker as ChartIncidentMarker,
  ReplaySignalMarker as ChartSignalMarker,
} from '../../charts/MultiTrackReplayTimeline';
import { useGoalBarrierStore } from '../../stores/goalBarrierStore';
import {
  decomposeGoalBarrierOperations,
  saveGoalBarrierConfig,
  type NormalizedRect,
} from '../../config/goalBarrierConfig';
import {
  useReplayViewerStore,
  type ReplayDownCounterOption,
} from '../../stores/replayViewerStore';
import {
  useRewinderStore,
  type RewinderDownCounterSec,
} from '../../stores/rewinderStore';
import type {
  GoalBarrierConfiguratorFloatingWindowProps,
  GoalBarrierPlacement,
} from './GoalBarrierConfiguratorFloatingWindow';
import type {
  ReplayViewerFloatingWindowProps,
  DownCounterOption,
} from './ReplayViewerFloatingWindow';
import type {
  RewinderConfiguratorFloatingWindowProps,
  RewinderBadgeState,
  RewinderDownCounterOption,
} from './RewinderConfiguratorFloatingWindow';

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

function triggerReplayFilePicker(onSelect: (file: File) => void): void {
  if (typeof document === 'undefined') return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.rcreplay,.json,.gz';
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) onSelect(file);
  };
  input.click();
}

export function useGoalBarrierPanelStoreBindings(
  props: GoalBarrierConfiguratorFloatingWindowProps
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
    ...props,
    placement: props.placement ?? storePlacement,
    onPlacementChange: handlePlacementChange,
    selectionMode: props.selectionMode ?? selectionMode,
    onSelectionModeChange: (mode) => {
      setSelectionMode(mode);
      props.onSelectionModeChange?.(mode);
    },
    opacityPct: props.opacityPct ?? storeOpacityPct,
    onOpacityPctChange: handleOpacityPctChange,
    grid: props.grid ?? storeGrid,
    onGridChange: handleGridChange,
    onApplyPreset: (presetId, grid) => {
      applyPreset(presetId);
      props.onApplyPreset?.(presetId, grid);
    },
    onClear: () => {
      clearBarrier();
      props.onClear?.();
    },
  };
}

export function useReplayViewerPanelStoreBindings(
  props: ReplayViewerFloatingWindowProps
): ReplayViewerFloatingWindowProps {
  const {
    loadedFileName,
    totalFrames,
    cursorFrame,
    viewerState,
    flowPreset,
    customFlowPct,
    downCounterSec,
    incidentMarkers,
    signalMarkers,
    setFlowPreset,
    setCustomFlowPct,
    setDownCounterSec,
    runtimeHandlers,
  } = useReplayViewerStore();

  const mappedIncidentMarkers = useMemo<ChartIncidentMarker[]>(
    () =>
      incidentMarkers.map((m) => ({
        frameIndex: m.frameIndex,
        type:
          m.type === 0x0e
            ? 'goal'
            : m.type === 0x03
            ? 'demo'
            : m.type === 0x05 || m.type === 0x0f
            ? 'save'
            : 'touch',
        label: m.label,
      })),
    [incidentMarkers]
  );

  const mappedSignalMarkers = useMemo<ChartSignalMarker[]>(
    () =>
      signalMarkers.map((m) => ({
        frameIndex: m.frameIndex,
        type:
          m.type === 0x91 || m.type === 0x87 || m.type === 0x88
            ? 'score'
            : m.type === 0x97 || m.type === 0x99 || m.type === 0x8b
            ? 'end'
            : 'kickoff',
        label: m.label,
        synthesized: m.synthesized,
      })),
    [signalMarkers]
  );

  if (!runtimeHandlers || Object.keys(runtimeHandlers).length === 0) {
    return props;
  }

  return {
    ...props,
    fileName: props.fileName ?? (loadedFileName || undefined),
    totalFrames: props.totalFrames ?? Math.max(1, totalFrames),
    cursorFrame: props.cursorFrame ?? cursorFrame,
    onSeekFrame: props.onSeekFrame ?? ((frame) => runtimeHandlers.onSeekFrame?.(frame)),
    onStepFrame:
      props.onStepFrame ?? ((_delta, nextFrame) => runtimeHandlers.onSeekFrame?.(nextFrame)),
    isPlaying: props.isPlaying ?? viewerState === 'playing',
    onPlay: props.onPlay ?? (() => runtimeHandlers.onStartPlaying?.()),
    onPause: props.onPause ?? (() => runtimeHandlers.onPausePlaying?.()),
    onPlayingChange:
      props.onPlayingChange ??
      ((playing) => {
        if (playing) runtimeHandlers.onStartPlaying?.();
        else runtimeHandlers.onPausePlaying?.();
      }),
    onRewindPressStart:
      props.onRewindPressStart ?? (() => runtimeHandlers.onPushBackwardStart?.()),
    onRewindPressEnd: props.onRewindPressEnd ?? (() => runtimeHandlers.onPushBackwardStop?.()),
    onForwardPressStart:
      props.onForwardPressStart ?? (() => runtimeHandlers.onPushForwardStart?.()),
    onForwardPressEnd:
      props.onForwardPressEnd ?? (() => runtimeHandlers.onPushForwardStop?.()),
    playbackPreset: props.playbackPreset ?? flowPreset,
    customSpeedPct: props.customSpeedPct ?? customFlowPct,
    onPlaybackSpeedChange:
      props.onPlaybackSpeedChange ??
      ((_eff, preset, customPct) => {
        setFlowPreset(preset);
        setCustomFlowPct(customPct);
      }),
    downCounter: props.downCounter ?? (String(downCounterSec) as DownCounterOption),
    onDownCounterChange:
      props.onDownCounterChange ??
      ((dc) => setDownCounterSec((Number(dc) || 0) as ReplayDownCounterOption)),
    isIntervening: props.isIntervening ?? viewerState === 'preroll-countdown',
    onInterveneFromHere:
      props.onInterveneFromHere ?? (() => runtimeHandlers.onResumeFromHere?.()),
    onBackToReplay: props.onBackToReplay ?? (() => runtimeHandlers.onClearReplay?.()),
    onLoadReplayFile:
      props.onLoadReplayFile ??
      (() =>
        triggerReplayFilePicker((file) => {
          runtimeHandlers.onUploadReplayFile?.(file);
        })),
    onLoadRecentReplay:
      props.onLoadRecentReplay ?? (() => runtimeHandlers.onLoadRetainedMatchReplay?.()),
    incidentMarkers:
      props.incidentMarkers ??
      (mappedIncidentMarkers.length > 0 ? mappedIncidentMarkers : undefined),
    signalMarkers:
      props.signalMarkers ??
      (mappedSignalMarkers.length > 0 ? mappedSignalMarkers : undefined),
  };
}

export function useRewinderPanelStoreBindings(
  props: RewinderConfiguratorFloatingWindowProps
): RewinderConfiguratorFloatingWindowProps {
  const {
    rewinderState,
    rewinderRecordedFrames,
    rewinderCursorFrame,
    rewinderTargetFrame,
    rewinderDownCounterSec,
    rewinderFlowPreset,
    rewinderCustomFlowPct,
    setRewinderFlowPreset,
    setRewinderCustomFlowPct,
    setRewinderDownCounterSec,
    runtimeHandlers,
  } = useRewinderStore();

  if (!runtimeHandlers || Object.keys(runtimeHandlers).length === 0) {
    return props;
  }

  const status: RewinderBadgeState =
    rewinderState === 'recording'
      ? 'recording'
      : rewinderState === 'idle'
      ? 'idle'
      : 'stopped';

  return {
    ...props,
    status: props.status ?? status,
    recordedFrames: props.recordedFrames ?? Math.max(1, rewinderRecordedFrames),
    cursorFrame: props.cursorFrame ?? rewinderCursorFrame,
    releaseMarkerFrame: props.releaseMarkerFrame ?? rewinderTargetFrame,
    downCounter:
      props.downCounter ?? (String(rewinderDownCounterSec) as RewinderDownCounterOption),
    onDownCounterChange:
      props.onDownCounterChange ??
      ((dc) => setRewinderDownCounterSec((Number(dc) || 0) as RewinderDownCounterSec)),
    shuttlePreset: props.shuttlePreset ?? rewinderFlowPreset,
    customShuttleSpeed: props.customShuttleSpeed ?? rewinderCustomFlowPct,
    onShuttleSpeedChange:
      props.onShuttleSpeedChange ??
      ((_eff, preset, customPct) => {
        setRewinderFlowPreset(preset);
        setRewinderCustomFlowPct(customPct);
      }),
    onStartNewRecording:
      props.onStartNewRecording ?? (() => runtimeHandlers.onRewinderStartRecording?.()),
    onStopRecording:
      props.onStopRecording ?? (() => runtimeHandlers.onRewinderStopRecording?.()),
    onRewindPressStart:
      props.onRewindPressStart ?? (() => runtimeHandlers.onRewinderPushBackwardStart?.()),
    onRewindPressEnd:
      props.onRewindPressEnd ?? (() => runtimeHandlers.onRewinderPushBackwardStop?.()),
    onForwardPressStart:
      props.onForwardPressStart ?? (() => runtimeHandlers.onRewinderPushForwardStart?.()),
    onForwardPressEnd:
      props.onForwardPressEnd ?? (() => runtimeHandlers.onRewinderPushForwardStop?.()),
    onSeekFrame:
      props.onSeekFrame ?? ((frame) => runtimeHandlers.onRewinderSeekFrame?.(frame)),
    onStepFrame:
      props.onStepFrame ??
      ((_delta, nextFrame) => runtimeHandlers.onRewinderSeekFrame?.(nextFrame)),
    onResumeFromHere:
      props.onResumeFromHere ?? (() => runtimeHandlers.onRewinderResumeFromHere?.()),
    onClear: props.onClear ?? (() => runtimeHandlers.onRewinderClearBuffer?.()),
    onExportReplay:
      props.onExportReplay ?? (() => runtimeHandlers.onRewinderExportReplay?.()),
    onImportReplay:
      props.onImportReplay ??
      (() =>
        triggerReplayFilePicker((file) => {
          runtimeHandlers.onRewinderImportReplay?.(file);
        })),
  };
}
