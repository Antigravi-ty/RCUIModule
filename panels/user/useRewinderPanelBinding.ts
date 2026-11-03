import {
  useRewinderStore,
  type RewinderDownCounterSec,
} from '../../stores/rewinderStore';
import { triggerReplayFilePicker } from './replayFilePicker';

export type RewinderBadgeState = 'recording' | 'stopped' | 'idle' | 'error';
export type RewinderDownCounterOption = '0' | '1' | '2' | '3';
export type ShuttleSpeedPreset = '100' | '75' | '50' | '25' | 'custom';

export interface RewinderConfiguratorState {
  status: RewinderBadgeState;
  recordedFrames: number;
  cursorFrame: number;
  releaseMarkerFrame: number;
  downCounter: RewinderDownCounterOption;
  shuttlePreset: ShuttleSpeedPreset;
  customShuttleSpeed: number;
}

export interface RewinderConfiguratorFloatingWindowProps {
  isLight?: boolean;
  active?: boolean;
  /** Controlled status ('idle' | 'recording' | 'stopped' | 'error') */
  status?: RewinderBadgeState;
  defaultStatus?: RewinderBadgeState;
  /** Controlled recorded frame count */
  recordedFrames?: number;
  defaultRecordedFrames?: number;
  /** Controlled cursor frame */
  cursorFrame?: number;
  defaultCursorFrame?: number;
  /** Controlled release marker frame */
  releaseMarkerFrame?: number;
  defaultReleaseMarkerFrame?: number;
  /** Controlled down counter ('3' | '2' | '1' | '0') */
  downCounter?: RewinderDownCounterOption;
  defaultDownCounter?: RewinderDownCounterOption;
  /** Controlled shuttle speed preset */
  shuttlePreset?: ShuttleSpeedPreset;
  defaultShuttlePreset?: ShuttleSpeedPreset;
  /** Controlled custom shuttle speed percentage (1..100) */
  customShuttleSpeed?: number;
  defaultCustomShuttleSpeed?: number;
  // Action callbacks
  onStartNewRecording?: () => void;
  onStopRecording?: () => void;
  onStatusChange?: (status: RewinderBadgeState) => void;
  onSeekFrame?: (frame: number) => void;
  onStepFrame?: (deltaFrames: number, nextFrame: number) => void;
  onRewindPressStart?: () => void;
  onRewindPressEnd?: () => void;
  onForwardPressStart?: () => void;
  onForwardPressEnd?: () => void;
  onResumeFromHere?: (frame: number, downCounterSec: number) => void;
  onClear?: () => void;
  onImportReplay?: () => void;
  onExportReplay?: () => void;
  onDownCounterChange?: (downCounter: RewinderDownCounterOption) => void;
  onShuttleSpeedChange?: (
    effectiveSpeedPct: number,
    preset: ShuttleSpeedPreset,
    customSpeedPct: number
  ) => void;
  onChange?: (state: RewinderConfiguratorState) => void;
}

export function useRewinderPanelBinding(
  rawProps: RewinderConfiguratorFloatingWindowProps
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
    status: rawProps.status ?? status,
    recordedFrames: rawProps.recordedFrames ?? Math.max(1, rewinderRecordedFrames),
    cursorFrame: rawProps.cursorFrame ?? rewinderCursorFrame,
    releaseMarkerFrame: rawProps.releaseMarkerFrame ?? rewinderTargetFrame,
    downCounter:
      rawProps.downCounter ?? (String(rewinderDownCounterSec) as RewinderDownCounterOption),
    onDownCounterChange:
      rawProps.onDownCounterChange ??
      ((dc: RewinderDownCounterOption) =>
        setRewinderDownCounterSec((Number(dc) || 0) as RewinderDownCounterSec)),
    shuttlePreset: rawProps.shuttlePreset ?? rewinderFlowPreset,
    customShuttleSpeed: rawProps.customShuttleSpeed ?? rewinderCustomFlowPct,
    onShuttleSpeedChange:
      rawProps.onShuttleSpeedChange ??
      ((_eff: number, preset: ShuttleSpeedPreset, customPct: number) => {
        setRewinderFlowPreset(preset);
        setRewinderCustomFlowPct(customPct);
      }),
    onStartNewRecording:
      rawProps.onStartNewRecording ?? (() => runtimeHandlers.onRewinderStartRecording?.()),
    onStopRecording:
      rawProps.onStopRecording ?? (() => runtimeHandlers.onRewinderStopRecording?.()),
    onRewindPressStart:
      rawProps.onRewindPressStart ?? (() => runtimeHandlers.onRewinderPushBackwardStart?.()),
    onRewindPressEnd:
      rawProps.onRewindPressEnd ?? (() => runtimeHandlers.onRewinderPushBackwardStop?.()),
    onForwardPressStart:
      rawProps.onForwardPressStart ?? (() => runtimeHandlers.onRewinderPushForwardStart?.()),
    onForwardPressEnd:
      rawProps.onForwardPressEnd ?? (() => runtimeHandlers.onRewinderPushForwardStop?.()),
    onSeekFrame:
      rawProps.onSeekFrame ??
      ((frame: number) => runtimeHandlers.onRewinderSeekFrame?.(frame)),
    onStepFrame:
      rawProps.onStepFrame ??
      ((_delta: number, nextFrame: number) =>
        runtimeHandlers.onRewinderSeekFrame?.(nextFrame)),
    onResumeFromHere:
      rawProps.onResumeFromHere ?? (() => runtimeHandlers.onRewinderResumeFromHere?.()),
    onClear: rawProps.onClear ?? (() => runtimeHandlers.onRewinderClearBuffer?.()),
    onExportReplay:
      rawProps.onExportReplay ?? (() => runtimeHandlers.onRewinderExportReplay?.()),
    onImportReplay:
      rawProps.onImportReplay ??
      (() =>
        triggerReplayFilePicker((file) => {
          runtimeHandlers.onRewinderImportReplay?.(file);
        })),
  };
}

