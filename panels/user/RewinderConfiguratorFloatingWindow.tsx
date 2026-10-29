import React, { useState, useEffect } from 'react';
import {
  Timer,
  Trash2,
  Upload,
  Download,
  Snail,
} from 'lucide-react';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { SettingActionRow } from '../../compounds/SettingActionRow';
import { SettingSliderRow } from '../../compounds/SettingSliderRow';
import { quickNotification } from '../../stores/quickNotificationStore';
import {
  RewinderTransportProgressSection,
  type RewinderBadgeState,
} from './rewinder/RewinderTransportProgressSection';

export type { RewinderBadgeState };
export type RewinderDownCounterOption = '3' | '2' | '1' | '0';
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

const BUFFER_WARMUP_FRAMES = 120; // 1.00s @ 120Hz required before rewind is selectable

/**
 * 3. [User] Rewinder Configurator (`rewinder-configurator`)
 * Standalone L6 Floating Window Panel — 100% isolated from other panels.
 */
export const RewinderConfiguratorFloatingWindow: React.FC<RewinderConfiguratorFloatingWindowProps> = React.memo(
  ({
    isLight = false,
    status: controlledStatus,
    defaultStatus = 'stopped',
    recordedFrames: controlledRecordedFrames,
    defaultRecordedFrames = 600,
    cursorFrame: controlledCursorFrame,
    defaultCursorFrame = 360,
    releaseMarkerFrame: controlledReleaseMarkerFrame,
    defaultReleaseMarkerFrame = 360,
    downCounter: controlledDownCounter,
    defaultDownCounter = '0',
    shuttlePreset: controlledShuttlePreset,
    defaultShuttlePreset = '100',
    customShuttleSpeed: controlledCustomShuttleSpeed,
    defaultCustomShuttleSpeed = 60,
    onStartNewRecording,
    onStopRecording,
    onStatusChange,
    onSeekFrame,
    onStepFrame,
    onRewindPressStart,
    onRewindPressEnd,
    onForwardPressStart,
    onForwardPressEnd,
    onResumeFromHere,
    onClear,
    onImportReplay,
    onExportReplay,
    onDownCounterChange,
    onShuttleSpeedChange,
    onChange,
  }) => {
    const [internalStatus, setInternalStatus] = useState<RewinderBadgeState>(defaultStatus);
    const [internalRecordedFrames, setInternalRecordedFrames] =
      useState<number>(defaultRecordedFrames);
    const [internalCursorFrame, setInternalCursorFrame] = useState<number>(defaultCursorFrame);
    const [internalReleaseMarkerFrame, setInternalReleaseMarkerFrame] =
      useState<number>(defaultReleaseMarkerFrame);
    const [internalDownCounter, setInternalDownCounter] =
      useState<RewinderDownCounterOption>(defaultDownCounter);
    const [internalShuttlePreset, setInternalShuttlePreset] =
      useState<ShuttleSpeedPreset>(defaultShuttlePreset);
    const [internalCustomShuttleSpeed, setInternalCustomShuttleSpeed] =
      useState<number>(defaultCustomShuttleSpeed);

    const status = controlledStatus ?? internalStatus;
    const recordedFrames = controlledRecordedFrames ?? internalRecordedFrames;
    const cursorFrame = controlledCursorFrame ?? internalCursorFrame;
    const releaseMarkerFrame = controlledReleaseMarkerFrame ?? internalReleaseMarkerFrame;
    const downCounter = controlledDownCounter ?? internalDownCounter;
    const shuttlePreset = controlledShuttlePreset ?? internalShuttlePreset;
    const customShuttleSpeed = controlledCustomShuttleSpeed ?? internalCustomShuttleSpeed;

    const emitStateChange = (patch: Partial<RewinderConfiguratorState>) => {
      onChange?.({
        status,
        recordedFrames,
        cursorFrame,
        releaseMarkerFrame,
        downCounter,
        shuttlePreset,
        customShuttleSpeed,
        ...patch,
      });
    };

    useEffect(() => {
      if (status !== 'recording' || controlledRecordedFrames !== undefined) return;
      const timer = window.setInterval(() => {
        setInternalRecordedFrames((prev) => {
          const next = prev + 6;
          if (controlledCursorFrame === undefined) {
            setInternalCursorFrame(next);
          }
          if (next >= BUFFER_WARMUP_FRAMES && controlledReleaseMarkerFrame === undefined) {
            setInternalReleaseMarkerFrame(next);
          }
          return next;
        });
      }, 50);
      return () => window.clearInterval(timer);
    }, [status, controlledRecordedFrames, controlledCursorFrame, controlledReleaseMarkerFrame]);

    const isReady = recordedFrames >= BUFFER_WARMUP_FRAMES;

    const effectiveCursorFrame = isReady
      ? Math.max(BUFFER_WARMUP_FRAMES, Math.min(recordedFrames, cursorFrame))
      : recordedFrames;

    const effectiveReleaseFrame = isReady
      ? Math.max(BUFFER_WARMUP_FRAMES, Math.min(recordedFrames, releaseMarkerFrame))
      : BUFFER_WARMUP_FRAMES;

    const relativeRecordedFrames = isReady ? recordedFrames - BUFFER_WARMUP_FRAMES : 0;
    const relativeCursorFrames = isReady ? effectiveCursorFrame - BUFFER_WARMUP_FRAMES : 0;
    const relativeReleaseFrames = isReady ? effectiveReleaseFrame - BUFFER_WARMUP_FRAMES : 0;

    const recordedRelSec = (relativeRecordedFrames / 120).toFixed(2);
    const cursorRelSec = (relativeCursorFrames / 120).toFixed(2);
    const releaseRelSec = (relativeReleaseFrames / 120).toFixed(2);

    const warmupProgressPct = Math.min(100, (recordedFrames / BUFFER_WARMUP_FRAMES) * 100);
    const selectableSpan = Math.max(1, recordedFrames - BUFFER_WARMUP_FRAMES);
    const readyCursorPct = isReady
      ? recordedFrames === BUFFER_WARMUP_FRAMES
        ? 100
        : ((effectiveCursorFrame - BUFFER_WARMUP_FRAMES) / selectableSpan) * 100
      : 0;
    const readyReleasePct = isReady
      ? recordedFrames === BUFFER_WARMUP_FRAMES
        ? 100
        : ((effectiveReleaseFrame - BUFFER_WARMUP_FRAMES) / selectableSpan) * 100
      : 0;

    const handleStartNewRecording = () => {
      if (controlledRecordedFrames === undefined) setInternalRecordedFrames(0);
      if (controlledCursorFrame === undefined) setInternalCursorFrame(0);
      if (controlledReleaseMarkerFrame === undefined)
        setInternalReleaseMarkerFrame(BUFFER_WARMUP_FRAMES);
      if (controlledStatus === undefined) setInternalStatus('recording');
      onStartNewRecording?.();
      onStatusChange?.('recording');
      emitStateChange({
        recordedFrames: 0,
        cursorFrame: 0,
        releaseMarkerFrame: BUFFER_WARMUP_FRAMES,
        status: 'recording',
      });
    };

    const handleStopRecording = () => {
      const nextStatus: RewinderBadgeState = status === 'idle' ? 'idle' : 'stopped';
      if (controlledStatus === undefined) setInternalStatus(nextStatus);
      onStopRecording?.();
      onStatusChange?.(nextStatus);
      emitStateChange({ status: nextStatus });
    };

    const handleStepFrame = (delta: number) => {
      if (!isReady) return;
      if (status === 'recording') {
        if (controlledStatus === undefined) setInternalStatus('stopped');
        onStatusChange?.('stopped');
      }
      const clamped = Math.max(
        BUFFER_WARMUP_FRAMES,
        Math.min(recordedFrames, Math.max(BUFFER_WARMUP_FRAMES, cursorFrame) + delta)
      );
      if (controlledCursorFrame === undefined) {
        setInternalCursorFrame(clamped);
      }
      onStepFrame?.(delta, clamped);
      onSeekFrame?.(clamped);
      emitStateChange({ status: 'stopped', cursorFrame: clamped });
    };

    const handleScrubBar = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isReady) return;
      if (status === 'recording') {
        if (controlledStatus === undefined) setInternalStatus('stopped');
        onStatusChange?.('stopped');
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
      const targetFrame =
        BUFFER_WARMUP_FRAMES + Math.round(ratio * Math.max(0, recordedFrames - BUFFER_WARMUP_FRAMES));
      if (controlledCursorFrame === undefined) {
        setInternalCursorFrame(targetFrame);
      }
      onSeekFrame?.(targetFrame);
      emitStateChange({ status: 'stopped', cursorFrame: targetFrame });
    };

    const handleResumeFromHere = () => {
      if (!isReady) {
        quickNotification.warning('Starvation: Record at least 1.0s (120 frames) before resuming.');
        return;
      }
      if (controlledReleaseMarkerFrame === undefined) {
        setInternalReleaseMarkerFrame(effectiveCursorFrame);
      }
      if (controlledStatus === undefined) {
        setInternalStatus('stopped');
      }
      onResumeFromHere?.(effectiveCursorFrame, Number(downCounter));
      onStatusChange?.('stopped');
      emitStateChange({
        releaseMarkerFrame: effectiveCursorFrame,
        status: 'stopped',
      });
      if (!onResumeFromHere) {
        quickNotification.info(
          `Resume from frame #${effectiveCursorFrame} (+${cursorRelSec}s, Down Counter: ${downCounter}s).`
        );
      }
    };

    const handleClear = () => {
      if (controlledStatus === undefined) setInternalStatus('idle');
      if (controlledRecordedFrames === undefined) setInternalRecordedFrames(0);
      if (controlledCursorFrame === undefined) setInternalCursorFrame(0);
      if (controlledReleaseMarkerFrame === undefined)
        setInternalReleaseMarkerFrame(BUFFER_WARMUP_FRAMES);
      onClear?.();
      onStatusChange?.('idle');
      emitStateChange({
        status: 'idle',
        recordedFrames: 0,
        cursorFrame: 0,
        releaseMarkerFrame: BUFFER_WARMUP_FRAMES,
      });
      if (!onClear) {
        quickNotification.info('Cleared rewinder buffer.');
      }
    };

    const cycleBadgeStateForPreview = () => {
      const nextStatus: RewinderBadgeState =
        status === 'idle'
          ? 'recording'
          : status === 'recording'
          ? 'stopped'
          : status === 'stopped'
          ? 'error'
          : 'idle';
      if (controlledStatus === undefined) {
        setInternalStatus(nextStatus);
      }
      onStatusChange?.(nextStatus);
      emitStateChange({ status: nextStatus });
    };

    return (
      <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
        <RewinderTransportProgressSection
          isLight={isLight}
          status={status}
          isReady={isReady}
          recordedFrames={recordedFrames}
          effectiveCursorFrame={effectiveCursorFrame}
          effectiveReleaseFrame={effectiveReleaseFrame}
          recordedRelSec={recordedRelSec}
          cursorRelSec={cursorRelSec}
          releaseRelSec={releaseRelSec}
          warmupProgressPct={warmupProgressPct}
          readyCursorPct={readyCursorPct}
          readyReleasePct={readyReleasePct}
          onStartNewRecording={handleStartNewRecording}
          onStopRecording={handleStopRecording}
          onStepFrame={handleStepFrame}
          onRewindPressStart={onRewindPressStart}
          onRewindPressEnd={onRewindPressEnd}
          onForwardPressStart={onForwardPressStart}
          onForwardPressEnd={onForwardPressEnd}
          onCycleBadgeState={cycleBadgeStateForPreview}
          onScrubBar={handleScrubBar}
        />

        {/* 3. Down Counter Row */}
        <SettingActionRow
          icon={Timer}
          title="Down Counter"
          bordered={false}
          showDescription={false}
          paddingX={4}
          paddingY={2}
          isLight={isLight}
          rightSlot={
            <SegmentedSwitch
              value={downCounter}
              size="sm"
              isLight={isLight}
              onValueChange={(v) => {
                const nextDown = v as RewinderDownCounterOption;
                if (controlledDownCounter === undefined) {
                  setInternalDownCounter(nextDown);
                }
                onDownCounterChange?.(nextDown);
                emitStateChange({ downCounter: nextDown });
              }}
              options={[
                { value: '3', label: '3' },
                { value: '2', label: '2' },
                { value: '1', label: '1' },
                { value: '0', label: '0' },
              ]}
            />
          }
        />

        {/* 4. Four Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleResumeFromHere}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.985] shadow-xs ${
              isLight
                ? 'bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-900'
                : 'bg-white hover:bg-neutral-200 text-neutral-950 border border-white'
            }`}
          >
            <span>Resume from here</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className={`py-2 px-2.5 rounded-xl border font-semibold text-xs inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
              isLight
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-700'
                : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-300'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onImportReplay) {
                onImportReplay();
              } else {
                quickNotification.info('Imported rewinder state timeline.');
              }
            }}
            className={`py-2 px-2.5 rounded-xl border font-semibold text-xs inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
              isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
            }`}
          >
            <Upload className="h-3.5 w-3.5 shrink-0" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onExportReplay) {
                onExportReplay();
              } else {
                quickNotification.success('Exported rewinder state timeline.');
              }
            }}
            className={`py-2 px-2.5 rounded-xl border font-semibold text-xs inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
              isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
            }`}
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span>Export</span>
          </button>
        </div>

        {/* 5. Shuttle Speed Row */}
        <SettingActionRow
          icon={Snail}
          iconName="snail"
          title="Shuttle Speed"
          bordered={false}
          showDescription={false}
          paddingX={4}
          paddingY={2}
          isLight={isLight}
          rightSlot={
            <SegmentedSwitch
              value={shuttlePreset}
              size="sm"
              isLight={isLight}
              onValueChange={(v) => {
                const nextPreset = v as ShuttleSpeedPreset;
                if (controlledShuttlePreset === undefined) {
                  setInternalShuttlePreset(nextPreset);
                }
                const nextEffective =
                  nextPreset === 'custom' ? customShuttleSpeed : Number(nextPreset);
                onShuttleSpeedChange?.(nextEffective, nextPreset, customShuttleSpeed);
                emitStateChange({ shuttlePreset: nextPreset });
              }}
              options={[
                { value: '100', label: '100%' },
                { value: '75', label: '75%' },
                { value: '50', label: '50%' },
                { value: '25', label: '25%' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
          }
        />

        {shuttlePreset === 'custom' && (
          <SettingSliderRow
            label="Custom"
            value={customShuttleSpeed}
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
            onChange={(nextPct) => {
              if (controlledCustomShuttleSpeed === undefined) {
                setInternalCustomShuttleSpeed(nextPct);
              }
              onShuttleSpeedChange?.(nextPct, shuttlePreset, nextPct);
              emitStateChange({ customShuttleSpeed: nextPct });
            }}
            isLight={isLight}
          />
        )}
      </div>
    );
  }
);
RewinderConfiguratorFloatingWindow.displayName = 'RewinderConfiguratorFloatingWindow';
