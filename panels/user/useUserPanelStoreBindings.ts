import { useCallback, useEffect, useMemo } from 'react';
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
import { useAppStore } from '../../stores/appStore';
import { useNetworkDiagnosticsData } from '../../stores/networkDiagnosticsStore';
import { globalPacingTelemetryRecorder } from '../../stores/pacingTelemetryRecorder.js';
import { downloadNetworkTelemetryZip } from '../../stores/pacingTelemetryExporter.js';
import { useTelemetryData } from '../../stores/perfTelemetryStore';
export type GoalBarrierPlacement = 'none' | 'blue' | 'orange' | 'both';
export type DownCounterOption = '0' | '1' | '2' | '3';
export type RewinderBadgeState = 'recording' | 'stopped' | 'idle' | 'error';
export type RewinderDownCounterOption = '0' | '1' | '2' | '3';
export type NetworkSessionMode = 'single-player' | 'online-host' | 'online-client';

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

let _persistentReplayFileInput: HTMLInputElement | null = null;
let _pendingReplaySelectHandler: ((file: File) => void) | null = null;

function triggerReplayFilePicker(onSelect: (file: File) => void): void {
  if (typeof document === 'undefined') return;
  _pendingReplaySelectHandler = onSelect;
  if (!_persistentReplayFileInput || !_persistentReplayFileInput.isConnected) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.rcreplay,.rcreplay.gz,.rcgr,.rcgr.gz,.json,.gz,application/gzip,application/x-gzip,application/json';
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.top = '-9999px';
    input.style.width = '1px';
    input.style.height = '1px';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      input.value = '';
      if (file && _pendingReplaySelectHandler) {
        const handler = _pendingReplaySelectHandler;
        handler(file);
      }
    });
    document.body.appendChild(input);
    _persistentReplayFileInput = input;
  }
  _persistentReplayFileInput.value = '';
  _persistentReplayFileInput.click();
}

export function useGoalBarrierPanelStoreBindings<TProps extends object>(
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

export function useReplayViewerPanelStoreBindings<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const {
    loadedFileName,
    totalFrames,
    cursorFrame,
    viewerState,
    flowPreset,
    customFlowPct,
    downCounterSec,
    hasRetainedMatch,
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
    return rawProps;
  }

  const hasLoadedReplay = Boolean(loadedFileName && totalFrames > 0);

  return {
    ...rawProps,
    hasLoadedReplay: props.hasLoadedReplay ?? hasLoadedReplay,
    hasRetainedMatch: props.hasRetainedMatch ?? hasRetainedMatch,
    fileName:
      props.fileName ?? (hasLoadedReplay && loadedFileName ? loadedFileName : 'No replay loaded'),
    totalFrames: props.totalFrames ?? (hasLoadedReplay ? totalFrames : 0),
    cursorFrame: props.cursorFrame ?? (hasLoadedReplay ? cursorFrame : 0),
    onSeekFrame:
      props.onSeekFrame ?? ((frame: number) => runtimeHandlers.onSeekFrame?.(frame)),
    onStepFrame:
      props.onStepFrame ??
      ((_delta: number, nextFrame: number) => runtimeHandlers.onSeekFrame?.(nextFrame)),
    isPlaying: props.isPlaying ?? viewerState === 'playing',
    onPlay: props.onPlay ?? (() => runtimeHandlers.onStartPlaying?.()),
    onPause: props.onPause ?? (() => runtimeHandlers.onPausePlaying?.()),
    onPlayingChange:
      props.onPlayingChange ??
      ((playing: boolean) => {
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
      ((_eff: number, preset: any, customPct: number) => {
        setFlowPreset(preset);
        setCustomFlowPct(customPct);
      }),
    downCounter: props.downCounter ?? (String(downCounterSec) as DownCounterOption),
    onDownCounterChange:
      props.onDownCounterChange ??
      ((dc: DownCounterOption) =>
        setDownCounterSec((Number(dc) || 0) as ReplayDownCounterOption)),
    isIntervening:
      props.isIntervening ??
      (viewerState === 'preroll-countdown' || viewerState === 'intervening'),
    onInterveneFromHere:
      props.onInterveneFromHere ?? (() => runtimeHandlers.onResumeFromHere?.()),
    onBackToReplay:
      props.onBackToReplay ??
      (() => (runtimeHandlers.onReturnToReplay ?? runtimeHandlers.onPausePlaying)?.()),
    onLoadReplayFile:
      props.onLoadReplayFile ??
      ((directFile?: File) => {
        if (directFile && typeof (directFile as any).arrayBuffer === 'function') {
          runtimeHandlers.onUploadReplayFile?.(directFile);
          return;
        }
        triggerReplayFilePicker((file) => {
          runtimeHandlers.onUploadReplayFile?.(file);
        });
      }),
    onLoadRecentReplay:
      props.onLoadRecentReplay ?? (() => runtimeHandlers.onLoadRetainedMatchReplay?.()),
    incidentMarkers:
      props.incidentMarkers ?? (hasLoadedReplay ? mappedIncidentMarkers : []),
    signalMarkers:
      props.signalMarkers ?? (hasLoadedReplay ? mappedSignalMarkers : []),
  } as TProps;
}

export function useRewinderPanelStoreBindings<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
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
    return rawProps;
  }

  const status: RewinderBadgeState =
    rewinderState === 'recording'
      ? 'recording'
      : rewinderState === 'idle'
      ? 'idle'
      : 'stopped';

  return {
    ...rawProps,
    status: props.status ?? status,
    recordedFrames: props.recordedFrames ?? Math.max(1, rewinderRecordedFrames),
    cursorFrame: props.cursorFrame ?? rewinderCursorFrame,
    releaseMarkerFrame: props.releaseMarkerFrame ?? rewinderTargetFrame,
    downCounter:
      props.downCounter ?? (String(rewinderDownCounterSec) as RewinderDownCounterOption),
    onDownCounterChange:
      props.onDownCounterChange ??
      ((dc: RewinderDownCounterOption) =>
        setRewinderDownCounterSec((Number(dc) || 0) as RewinderDownCounterSec)),
    shuttlePreset: props.shuttlePreset ?? rewinderFlowPreset,
    customShuttleSpeed: props.customShuttleSpeed ?? rewinderCustomFlowPct,
    onShuttleSpeedChange:
      props.onShuttleSpeedChange ??
      ((_eff: number, preset: any, customPct: number) => {
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
      props.onSeekFrame ??
      ((frame: number) => runtimeHandlers.onRewinderSeekFrame?.(frame)),
    onStepFrame:
      props.onStepFrame ??
      ((_delta: number, nextFrame: number) =>
        runtimeHandlers.onRewinderSeekFrame?.(nextFrame)),
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
  } as TProps;
}

export function useNetworkMonitorPanelStoreBindings<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const { metrics } = useNetworkDiagnosticsData();
  const onlineSession = useAppStore((s) => s.onlineSession);
  const bridge = useAppStore((s) => s.bridge);

  useEffect(() => {
    bridge?.onEnsureNetworkDiagnostics?.();
  }, [bridge]);

  const hasHostRuntime = Boolean(bridge?.onEnsureNetworkDiagnostics || metrics);

  const sessionMode: NetworkSessionMode = onlineSession?.roomId
    ? onlineSession.isHosting
      ? 'online-host'
      : 'online-client'
    : 'single-player';

  const storeSnapshot = useMemo(() => {
    if (!hasHostRuntime) return undefined;
    const raw = metrics as Record<string, any> | undefined;
    return {
      sessionMode,
      rttMs: metrics?.rttMs || 0,
      jitterMs: metrics?.jitterMs || 0,
      leadTicks: raw?.effectiveBuffer ?? metrics?.clientLeadTicks ?? 0,
      physicsRateHz: raw?.physicsRateHz || 120,
      rollbackCount: raw?.rollbackCount ?? metrics?.corrections ?? 0,
      targetBuffer: raw?.targetBuffer || 0,
      serverBuffer: raw?.serverBuffer || 0,
    };
  }, [hasHostRuntime, sessionMode, metrics]);

  if (!hasHostRuntime) {
    return rawProps;
  }

  return {
    ...rawProps,
    sessionMode: props.sessionMode ?? sessionMode,
    snapshot: props.snapshot ?? storeSnapshot,
    onExportLog:
      props.onExportLog ??
      (() => {
        try {
          downloadNetworkTelemetryZip();
        } catch (err: unknown) {
          console.error('[NetworkDiagnostics] Export failed:', err);
        }
      }),
    onClear:
      props.onClear ??
      (() => {
        globalPacingTelemetryRecorder.reset();
      }),
  } as TProps;
}

export function usePerformanceMonitorPanelStoreBindings<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const { data: snap } = useTelemetryData(180, true);

  const telemetrySnapshot = useMemo(() => {
    if (!snap) return undefined;
    return {
      frameTimeMs: snap.frameMs || 8.33,
      budgetMs: snap.budgetMs || 8.33,
      refreshHz: snap.refreshHz || 120,
      p50Ms: snap.p50 || 8.3,
      p95Ms: snap.p95 || 8.5,
      p99Ms: snap.p99 || 9.0,
      peakMs: snap.worstMs || 9.5,
      overBudgetPct: snap.overBudgetPct || 0,
      physicsStepHz: snap.sim?.physicsRateHz || 120,
      substepsPerTick: snap.sim?.ticksPerFrame || 1,
      drawCalls: snap.renderer?.drawCalls || 0,
      trianglesLabel: String(snap.renderer?.triangles ?? '0'),
      geometries: snap.renderer?.geometries || 0,
    };
  }, [snap]);

  if (!telemetrySnapshot) {
    return rawProps;
  }

  return {
    ...rawProps,
    snapshot: props.snapshot ?? telemetrySnapshot,
  } as TProps;
}


