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

export type DownCounterOption = '0' | '1' | '2' | '3';

export function useReplayViewerPanelBinding<TProps extends object>(
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
    isLoadingReplay: props.isLoadingReplay ?? isLoadingReplay,
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

