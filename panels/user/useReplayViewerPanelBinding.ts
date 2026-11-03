import { useMemo } from 'react';
import type {
  ReplayIncidentMarker as ChartIncidentMarker,
  ReplaySignalMarker as ChartSignalMarker,
} from '../../charts/MultiTrackReplayTimeline';
import {
  useReplayViewerStore,
  type ReplayDownCounterOption,
} from '../../stores/replayViewerStore';
import { triggerReplayFilePicker } from './replayFilePicker';
import type {
  PlaybackSpeedPreset,
  ReplayViewerState,
} from './ReplayViewerTransportBar';

export type DownCounterOption = '0' | '1' | '2' | '3';

export interface ReplayViewerFloatingWindowProps {
  isLight?: boolean;
  active?: boolean;
  /** Controlled whether a replay file is currently being parsed/loaded */
  isLoadingReplay?: boolean;
  /** Controlled whether a valid replay is loaded */
  hasLoadedReplay?: boolean;
  /** Controlled whether a retained recent match replay exists in memory */
  hasRetainedMatch?: boolean;
  /** Controlled replay file name */
  fileName?: string;
  /** Controlled current frame cursor */
  cursorFrame?: number;
  defaultCursorFrame?: number;
  /** Controlled total frame count */
  totalFrames?: number;
  /** Controlled play/pause state */
  isPlaying?: boolean;
  defaultIsPlaying?: boolean;
  /** Controlled intervention state */
  isIntervening?: boolean;
  defaultIsIntervening?: boolean;
  /** Controlled playback speed preset */
  playbackPreset?: PlaybackSpeedPreset;
  defaultPlaybackPreset?: PlaybackSpeedPreset;
  /** Controlled custom playback speed percentage (1..100) */
  customSpeedPct?: number;
  defaultCustomSpeedPct?: number;
  /** Controlled down counter ('3' | '2' | '1' | '0') */
  downCounter?: DownCounterOption;
  defaultDownCounter?: DownCounterOption;
  /** Custom incident markers */
  incidentMarkers?: ChartIncidentMarker[];
  /** Custom signal markers */
  signalMarkers?: ChartSignalMarker[];
  // Action callbacks
  onLoadReplayFile?: (file?: File) => void;
  onLoadRecentReplay?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  onSeekFrame?: (frame: number) => void;
  onStepFrame?: (deltaFrames: number, nextFrame: number) => void;
  onRewindPressStart?: () => void;
  onRewindPressEnd?: () => void;
  onForwardPressStart?: () => void;
  onForwardPressEnd?: () => void;
  onPlaybackSpeedChange?: (
    effectiveSpeedPct: number,
    preset: PlaybackSpeedPreset,
    customSpeedPct: number
  ) => void;
  onInterveneFromHere?: (frame: number, downCounterSec: number) => void;
  onBackToReplay?: () => void;
  onDownCounterChange?: (downCounter: DownCounterOption) => void;
  onChange?: (state: ReplayViewerState) => void;
}

export function useReplayViewerPanelBinding(
  rawProps: ReplayViewerFloatingWindowProps
): ReplayViewerFloatingWindowProps {
  const {
    loadedFileName,
    totalFrames,
    cursorFrame,
    viewerState,
    flowPreset,
    customFlowPct,
    downCounterSec,
    hasRetainedMatch,
    isLoadingReplay,
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
    isLoadingReplay: rawProps.isLoadingReplay ?? isLoadingReplay,
    hasLoadedReplay: rawProps.hasLoadedReplay ?? hasLoadedReplay,
    hasRetainedMatch: rawProps.hasRetainedMatch ?? hasRetainedMatch,
    fileName:
      rawProps.fileName ?? (hasLoadedReplay && loadedFileName ? loadedFileName : 'No replay loaded'),
    totalFrames: rawProps.totalFrames ?? (hasLoadedReplay ? totalFrames : 0),
    cursorFrame: rawProps.cursorFrame ?? (hasLoadedReplay ? cursorFrame : 0),
    onSeekFrame:
      rawProps.onSeekFrame ?? ((frame: number) => runtimeHandlers.onSeekFrame?.(frame)),
    onStepFrame:
      rawProps.onStepFrame ??
      ((_delta: number, nextFrame: number) => runtimeHandlers.onSeekFrame?.(nextFrame)),
    isPlaying: rawProps.isPlaying ?? viewerState === 'playing',
    onPlay: rawProps.onPlay ?? (() => runtimeHandlers.onStartPlaying?.()),
    onPause: rawProps.onPause ?? (() => runtimeHandlers.onPausePlaying?.()),
    onPlayingChange:
      rawProps.onPlayingChange ??
      ((playing: boolean) => {
        if (playing) runtimeHandlers.onStartPlaying?.();
        else runtimeHandlers.onPausePlaying?.();
      }),
    onRewindPressStart:
      rawProps.onRewindPressStart ?? (() => runtimeHandlers.onPushBackwardStart?.()),
    onRewindPressEnd: rawProps.onRewindPressEnd ?? (() => runtimeHandlers.onPushBackwardStop?.()),
    onForwardPressStart:
      rawProps.onForwardPressStart ?? (() => runtimeHandlers.onPushForwardStart?.()),
    onForwardPressEnd:
      rawProps.onForwardPressEnd ?? (() => runtimeHandlers.onPushForwardStop?.()),
    playbackPreset: rawProps.playbackPreset ?? flowPreset,
    customSpeedPct: rawProps.customSpeedPct ?? customFlowPct,
    onPlaybackSpeedChange:
      rawProps.onPlaybackSpeedChange ??
      ((_eff: number, preset: PlaybackSpeedPreset, customPct: number) => {
        setFlowPreset(preset);
        setCustomFlowPct(customPct);
      }),
    downCounter: rawProps.downCounter ?? (String(downCounterSec) as DownCounterOption),
    onDownCounterChange:
      rawProps.onDownCounterChange ??
      ((dc: DownCounterOption) =>
        setDownCounterSec((Number(dc) || 0) as ReplayDownCounterOption)),
    isIntervening:
      rawProps.isIntervening ??
      (viewerState === 'preroll-countdown' || viewerState === 'intervening'),
    onInterveneFromHere:
      rawProps.onInterveneFromHere ?? (() => runtimeHandlers.onResumeFromHere?.()),
    onBackToReplay:
      rawProps.onBackToReplay ??
      (() => (runtimeHandlers.onReturnToReplay ?? runtimeHandlers.onPausePlaying)?.()),
    onLoadReplayFile:
      rawProps.onLoadReplayFile ??
      ((directFile?: File) => {
        if (directFile && typeof directFile.arrayBuffer === 'function') {
          runtimeHandlers.onUploadReplayFile?.(directFile);
          return;
        }
        triggerReplayFilePicker((file) => {
          runtimeHandlers.onUploadReplayFile?.(file);
        });
      }),
    onLoadRecentReplay:
      rawProps.onLoadRecentReplay ?? (() => runtimeHandlers.onLoadRetainedMatchReplay?.()),
    incidentMarkers:
      rawProps.incidentMarkers ?? (hasLoadedReplay ? mappedIncidentMarkers : []),
    signalMarkers:
      rawProps.signalMarkers ?? (hasLoadedReplay ? mappedSignalMarkers : []),
  };
}

