import {
  useRewinderStore,
  type RewinderDownCounterSec,
} from '../../stores/rewinderStore';
import { triggerReplayFilePicker } from './replayFilePicker';

export type RewinderBadgeState = 'recording' | 'stopped' | 'idle' | 'error';
export type RewinderDownCounterOption = '0' | '1' | '2' | '3';

export function useRewinderPanelBinding<TProps extends object>(
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

