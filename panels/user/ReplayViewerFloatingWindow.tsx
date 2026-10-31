import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  ClockCheck,
  Play,
  Pause,
  Rewind,
  FastForward,
  Snail,
  Timer,
  RotateCcw,
} from 'lucide-react';
import { MultiTrackReplayTimeline, DEFAULT_REPLAY_INCIDENT_MARKERS, DEFAULT_REPLAY_SIGNAL_MARKERS, type ReplayIncidentMarker, type ReplaySignalMarker } from '../../charts/MultiTrackReplayTimeline';
import { KeycapBadge } from '../../primitives/KeycapBadge';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { SettingActionRow } from '../../compounds/SettingActionRow';
import { SettingSliderRow } from '../../compounds/SettingSliderRow';
import { quickNotification } from '../../stores/quickNotificationStore';
import { useReplayViewerPanelStoreBindings } from './useUserPanelStoreBindings';

export type PlaybackSpeedPreset = '100' | '50' | '200' | '500' | 'custom';
export type DownCounterOption = '3' | '2' | '1' | '0';

export interface ReplayViewerState {
  fileName: string;
  cursorFrame: number;
  totalFrames: number;
  isPlaying: boolean;
  isIntervening: boolean;
  playbackPreset: PlaybackSpeedPreset;
  customSpeedPct: number;
  downCounter: DownCounterOption;
}

export interface ReplayViewerFloatingWindowProps {
  isLight?: boolean;
  active?: boolean;
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
  incidentMarkers?: ReplayIncidentMarker[];
  /** Custom signal markers */
  signalMarkers?: ReplaySignalMarker[];
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

const RECENT_CLIPS = [
  { name: 'RLCS_GrandFinals_Game7_OT.rcreplay', totalFrames: 1800 },
  { name: 'DoubleTap_Read_04.rcreplay', totalFrames: 1440 },
] as const;

/**
 * 1. [User] RC Replay Viewer (`replay-viewer-window`)
 * Standalone L6 Floating Window Panel composing the L5 `<MultiTrackReplayTimeline />`:
 * 1. Top Row: 2 Buttons:
 *    - Left: Black Primary `Load Replay Files` with `Upload` icon
 *    - Right: Secondary `Load Recent` with `ClockCheck` (`clock-check`) icon
 * 2. Rows 2–4: Embedded `<MultiTrackReplayTimeline variant="tracks-only" />` (Replay File Name, Frame readout, and 3 Synchronized Tracks)
 * 3. Row 5: 4 Transport Buttons (`Play`, `Pause`, `Rewind`, `Forward`) with hotkey badges (`O`, `P`, `[`, `]`)
 * 4. Row 6: `Playback Speed` (`snail` icon + Segmented Control `100% | 75% | 50% | 25% | Custom` + Custom Slider)
 * 5. Row 7: `Intervene from here` (Black Primary) + `Back to replay`
 * 6. Row 8: `Down Counter` (`Timer` icon + Segmented Control `3 | 2 | 1 | 0`, default `0`)
 */
export const ReplayViewerFloatingWindow: React.FC<ReplayViewerFloatingWindowProps> = React.memo(
  (rawProps) => {
    const {
      isLight = false,
      hasLoadedReplay: controlledHasLoadedReplay,
      hasRetainedMatch: controlledHasRetainedMatch,
      fileName: controlledFileName,
      cursorFrame: controlledCursorFrame,
      defaultCursorFrame = 420,
      totalFrames: controlledTotalFrames,
      isPlaying: controlledIsPlaying,
      defaultIsPlaying = false,
      isIntervening: controlledIsIntervening,
      defaultIsIntervening = false,
      playbackPreset: controlledPlaybackPreset,
      defaultPlaybackPreset = '100',
      customSpeedPct: controlledCustomSpeedPct,
      defaultCustomSpeedPct = 60,
      downCounter: controlledDownCounter,
      defaultDownCounter = '0',
      incidentMarkers = DEFAULT_REPLAY_INCIDENT_MARKERS,
      signalMarkers = DEFAULT_REPLAY_SIGNAL_MARKERS,
      onLoadReplayFile,
      onLoadRecentReplay,
      onPlay,
      onPause,
      onPlayingChange,
      onSeekFrame,
      onStepFrame,
      onRewindPressStart,
      onRewindPressEnd,
      onForwardPressStart,
      onForwardPressEnd,
      onPlaybackSpeedChange,
      onInterveneFromHere,
      onBackToReplay,
      onDownCounterChange,
      onChange,
    } = useReplayViewerPanelStoreBindings(rawProps);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [clipIndex, setClipIndex] = useState<number>(0);
    const activeClip = RECENT_CLIPS[clipIndex];
    const fileName = controlledFileName ?? activeClip.name;
    const totalFrames = controlledTotalFrames ?? activeClip.totalFrames;
    const controlsDisabled = controlledHasLoadedReplay === false || totalFrames <= 0;
    const loadRecentDisabled = controlledHasRetainedMatch === false;

    const [internalCursorFrame, setInternalCursorFrame] = useState<number>(defaultCursorFrame);
    const [internalIsPlaying, setInternalIsPlaying] = useState<boolean>(defaultIsPlaying);
    const [internalIsIntervening, setInternalIsIntervening] =
      useState<boolean>(defaultIsIntervening);
    const [internalPlaybackPreset, setInternalPlaybackPreset] =
      useState<PlaybackSpeedPreset>(defaultPlaybackPreset);
    const [internalCustomSpeedPct, setInternalCustomSpeedPct] =
      useState<number>(defaultCustomSpeedPct);
    const [internalDownCounter, setInternalDownCounter] =
      useState<DownCounterOption>(defaultDownCounter);

    const cursorFrame = controlledCursorFrame ?? internalCursorFrame;
    const isPlaying = controlledIsPlaying ?? internalIsPlaying;
    const isIntervening = controlledIsIntervening ?? internalIsIntervening;
    const playbackPreset = controlledPlaybackPreset ?? internalPlaybackPreset;
    const customSpeedPct = controlledCustomSpeedPct ?? internalCustomSpeedPct;
    const downCounter = controlledDownCounter ?? internalDownCounter;

    const effectiveSpeedPct =
      playbackPreset === 'custom' ? customSpeedPct : Number(playbackPreset);

    const emitStateChange = (patch: Partial<ReplayViewerState>) => {
      onChange?.({
        fileName,
        cursorFrame,
        totalFrames,
        isPlaying,
        isIntervening,
        playbackPreset,
        customSpeedPct,
        downCounter,
        ...patch,
      });
    };

    useEffect(() => {
      if (controlsDisabled || !isPlaying || controlledCursorFrame !== undefined) return;
      const stepFrames = Math.max(1, Math.round((4 * effectiveSpeedPct) / 100));
      const timer = window.setInterval(() => {
        setInternalCursorFrame((prev) => (prev + stepFrames) % Math.max(1, totalFrames));
      }, 33);
      return () => window.clearInterval(timer);
    }, [controlsDisabled, isPlaying, effectiveSpeedPct, totalFrames, controlledCursorFrame]);

    const clampedCursor = controlsDisabled ? 0 : Math.max(0, Math.min(totalFrames, cursorFrame));
    const cursorSec = (clampedCursor / 120).toFixed(2);

    const handleSeek = (nextFrame: number) => {
      if (controlsDisabled) return;
      if (controlledCursorFrame === undefined) {
        setInternalCursorFrame(nextFrame);
      }
      onSeekFrame?.(nextFrame);
      emitStateChange({ cursorFrame: nextFrame });
    };

    const handleStep = (delta: number) => {
      if (controlsDisabled) return;
      if (controlledIsPlaying === undefined) {
        setInternalIsPlaying(false);
      }
      onPlayingChange?.(false);
      onPause?.();
      const nextFrame = Math.max(0, Math.min(totalFrames, clampedCursor + delta));
      if (controlledCursorFrame === undefined) {
        setInternalCursorFrame(nextFrame);
      }
      onStepFrame?.(delta, nextFrame);
      onSeekFrame?.(nextFrame);
      emitStateChange({ isPlaying: false, cursorFrame: nextFrame });
    };

    const compactBtnClass = `flex-1 min-w-0 whitespace-nowrap inline-flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
      controlsDisabled
        ? isLight
          ? 'bg-neutral-100 border-neutral-200 text-neutral-400 opacity-45 cursor-not-allowed pointer-events-none'
          : 'bg-neutral-800/50 border-neutral-800 text-neutral-500 opacity-45 cursor-not-allowed pointer-events-none'
        : isLight
        ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800 cursor-pointer active:scale-95'
        : 'bg-neutral-800/90 hover:bg-neutral-700 border-neutral-700 text-neutral-100 cursor-pointer active:scale-95'
    }`;

    const backToReplayDisabled = controlsDisabled || !isIntervening;

    return (
      <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
        <input
          ref={fileInputRef}
          type="file"
          accept=".rcreplay,.rcreplay.gz,.rcgr,.rcgr.gz,.json,.gz,application/gzip,application/x-gzip,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file && onLoadReplayFile) {
              onLoadReplayFile(file);
            }
          }}
        />
        {/* 1. Top Row: 2 Buttons — Load Replay Files (Black Primary + Upload icon) & Load Recent (clock-check icon) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              if (rawProps.onLoadReplayFile && rawProps.onLoadReplayFile.length === 0) {
                rawProps.onLoadReplayFile();
              } else if (fileInputRef.current && onLoadReplayFile) {
                fileInputRef.current.value = '';
                fileInputRef.current.click();
              } else if (onLoadReplayFile) {
                onLoadReplayFile();
              } else {
                quickNotification.info('Open local .rcreplay file picker.');
              }
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.985] shadow-xs ${
              isLight
                ? 'bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-900'
                : 'bg-white hover:bg-neutral-200 text-neutral-950 border border-white'
            }`}
          >
            <Upload className="h-3.5 w-3.5 shrink-0" />
            <span>Load Replay Files</span>
          </button>

          <button
            type="button"
            disabled={loadRecentDisabled}
            onClick={() => {
              if (loadRecentDisabled) return;
              if (onLoadRecentReplay) {
                onLoadRecentReplay();
              } else {
                const nextIdx = (clipIndex + 1) % RECENT_CLIPS.length;
                setClipIndex(nextIdx);
                if (controlledCursorFrame === undefined) setInternalCursorFrame(360);
                if (controlledIsIntervening === undefined) setInternalIsIntervening(false);
                quickNotification.info(`Loaded recent replay: ${RECENT_CLIPS[nextIdx].name}`);
              }
            }}
            className={`py-2 px-3 rounded-xl border font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-all ${
              loadRecentDisabled
                ? isLight
                  ? 'bg-neutral-100 border-neutral-200 text-neutral-400 opacity-45 cursor-not-allowed pointer-events-none'
                  : 'bg-neutral-800/50 border-neutral-800 text-neutral-500 opacity-45 cursor-not-allowed pointer-events-none'
                : isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800 cursor-pointer active:scale-95'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200 cursor-pointer active:scale-95'
            }`}
          >
            <ClockCheck className="h-3.5 w-3.5 shrink-0" />
            <span>Load Recent</span>
          </button>
        </div>

        {/* 2. L5 MultiTrackReplayTimeline (File Name, Frame Readout & 3 Synchronized Tracks) */}
        <MultiTrackReplayTimeline
          variant="tracks-only"
          disabled={controlsDisabled}
          fileName={fileName}
          totalFrames={totalFrames}
          cursorFrame={clampedCursor}
          isIntervening={isIntervening}
          incidentMarkers={incidentMarkers}
          signalMarkers={signalMarkers}
          onSeekFrame={handleSeek}
          isLight={isLight}
        />

        {/* 3. Four Transport Buttons with Hotkey Badges: Play, Pause, Rewind, Forward */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={controlsDisabled}
            onClick={() => {
              if (controlsDisabled) return;
              if (controlledIsPlaying === undefined) setInternalIsPlaying(true);
              onPlay?.();
              onPlayingChange?.(true);
              emitStateChange({ isPlaying: true });
            }}
            className={compactBtnClass}
            title="Play replay (Hotkey: O)"
          >
            <Play className="h-3 w-3 fill-current text-amber-500 shrink-0" />
            <span>Play</span>
            <KeycapBadge label="O" size="sm" isLight={isLight} />
          </button>

          <button
            type="button"
            disabled={controlsDisabled}
            onClick={() => {
              if (controlsDisabled) return;
              if (controlledIsPlaying === undefined) setInternalIsPlaying(false);
              onPause?.();
              onPlayingChange?.(false);
              emitStateChange({ isPlaying: false });
            }}
            className={compactBtnClass}
            title="Pause replay (Hotkey: P)"
          >
            <Pause className="h-3 w-3 shrink-0" />
            <span>Pause</span>
            <KeycapBadge label="P" size="sm" isLight={isLight} />
          </button>

          <button
            type="button"
            disabled={controlsDisabled}
            onClick={(e) => {
              if (!onRewindPressStart || e.detail === 0) {
                handleStep(-Math.max(1, Math.round(effectiveSpeedPct / 100)));
              }
            }}
            onMouseDown={controlsDisabled ? undefined : onRewindPressStart}
            onMouseUp={controlsDisabled ? undefined : onRewindPressEnd}
            onMouseLeave={controlsDisabled ? undefined : onRewindPressEnd}
            onTouchStart={controlsDisabled ? undefined : onRewindPressStart}
            onTouchEnd={controlsDisabled ? undefined : onRewindPressEnd}
            className={compactBtnClass}
            title="Rewind (Hotkey: [)"
          >
            <Rewind className="h-3 w-3 shrink-0" />
            <span>Rewind</span>
            <KeycapBadge label="[" size="sm" isLight={isLight} />
          </button>

          <button
            type="button"
            disabled={controlsDisabled}
            onClick={(e) => {
              if (!onForwardPressStart || e.detail === 0) {
                handleStep(Math.max(1, Math.round(effectiveSpeedPct / 100)));
              }
            }}
            onMouseDown={controlsDisabled ? undefined : onForwardPressStart}
            onMouseUp={controlsDisabled ? undefined : onForwardPressEnd}
            onMouseLeave={controlsDisabled ? undefined : onForwardPressEnd}
            onTouchStart={controlsDisabled ? undefined : onForwardPressStart}
            onTouchEnd={controlsDisabled ? undefined : onForwardPressEnd}
            className={compactBtnClass}
            title="Forward (Hotkey: ])"
          >
            <FastForward className="h-3 w-3 shrink-0" />
            <span>Forward</span>
            <KeycapBadge label="]" size="sm" isLight={isLight} />
          </button>
        </div>

        {/* 4. Playback Speed (Consistent with Rewinder: Snail icon + 5-way Segmented Control + Custom Slider) */}
        <SettingActionRow
          icon={Snail}
          iconName="snail"
          title="Playback Speed"
          bordered={false}
          showDescription={false}
          paddingX={4}
          paddingY={2}
          disabled={controlsDisabled}
          isLight={isLight}
          rightSlot={
            <SegmentedSwitch
              value={playbackPreset}
              size="sm"
              disabled={controlsDisabled}
              isLight={isLight}
              onValueChange={(v) => {
                if (controlsDisabled) return;
                const nextPreset = v as PlaybackSpeedPreset;
                if (controlledPlaybackPreset === undefined) {
                  setInternalPlaybackPreset(nextPreset);
                }
                const nextEffective =
                  nextPreset === 'custom' ? customSpeedPct : Number(nextPreset);
                onPlaybackSpeedChange?.(nextEffective, nextPreset, customSpeedPct);
                emitStateChange({ playbackPreset: nextPreset });
              }}
              options={[
                { value: '100', label: '100%' },
                { value: '50', label: '50%' },
                { value: '200', label: '200%' },
                { value: '500', label: '500%' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
          }
        />

        {playbackPreset === 'custom' && (
          <SettingSliderRow
            label="Custom"
            value={customSpeedPct}
            min={1}
            max={500}
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
            disabled={controlsDisabled}
            onChange={(nextPct) => {
              if (controlsDisabled) return;
              if (controlledCustomSpeedPct === undefined) {
                setInternalCustomSpeedPct(nextPct);
              }
              onPlaybackSpeedChange?.(nextPct, playbackPreset, nextPct);
              emitStateChange({ customSpeedPct: nextPct });
            }}
            isLight={isLight}
          />
        )}

        {/* 5. Intervene from here + Back to replay */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={controlsDisabled}
            onClick={() => {
              if (controlsDisabled) return;
              if (controlledIsPlaying === undefined) setInternalIsPlaying(false);
              if (controlledIsIntervening === undefined) setInternalIsIntervening(true);
              onInterveneFromHere?.(clampedCursor, Number(downCounter));
              emitStateChange({ isPlaying: false, isIntervening: true });
              if (!onInterveneFromHere) {
                quickNotification.success(
                  `Intervening from frame #${clampedCursor} (${cursorSec}s, Down Counter: ${downCounter}s).`
                );
              }
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              controlsDisabled
                ? isLight
                  ? 'bg-neutral-200 text-neutral-400 border border-neutral-200 opacity-45 cursor-not-allowed pointer-events-none'
                  : 'bg-neutral-800 text-neutral-500 border border-neutral-800 opacity-45 cursor-not-allowed pointer-events-none'
                : isLight
                ? 'bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-900 cursor-pointer active:scale-[0.985]'
                : 'bg-white hover:bg-neutral-200 text-neutral-950 border border-white cursor-pointer active:scale-[0.985]'
            }`}
          >
            <span>Intervene from here</span>
          </button>

          <button
            type="button"
            disabled={backToReplayDisabled}
            onClick={() => {
              if (backToReplayDisabled) return;
              if (controlledIsIntervening === undefined) setInternalIsIntervening(false);
              onBackToReplay?.();
              emitStateChange({ isIntervening: false });
              if (!onBackToReplay) {
                quickNotification.info('Returned to replay playback mode.');
              }
            }}
            className={`py-2 px-3 rounded-xl border font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-all ${
              backToReplayDisabled
                ? isLight
                  ? 'bg-neutral-100 border-neutral-200 text-neutral-400 opacity-45 cursor-not-allowed pointer-events-none'
                  : 'bg-neutral-800/50 border-neutral-800 text-neutral-500 opacity-45 cursor-not-allowed pointer-events-none'
                : isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800 cursor-pointer active:scale-95'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200 cursor-pointer active:scale-95'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            <span>Back to replay</span>
          </button>
        </div>

        {/* 6. Down Counter (4-way Segmented Control: 3, 2, 1, 0) */}
        <SettingActionRow
          icon={Timer}
          title="Down Counter"
          bordered={false}
          showDescription={false}
          paddingX={4}
          paddingY={2}
          disabled={controlsDisabled}
          isLight={isLight}
          rightSlot={
            <SegmentedSwitch
              value={downCounter}
              size="sm"
              disabled={controlsDisabled}
              isLight={isLight}
              onValueChange={(v) => {
                if (controlsDisabled) return;
                const nextDown = v as DownCounterOption;
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
      </div>
    );
  }
);
ReplayViewerFloatingWindow.displayName = 'ReplayViewerFloatingWindow';

