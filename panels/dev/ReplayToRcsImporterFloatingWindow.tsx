import React, { useMemo, useRef, useState } from 'react';
import {
  Activity,
  Bot,
  ChevronDown,
  ChevronUp,
  Database,
  Download,
  FastForward,
  Loader2,
  Pause,
  Play,
  Rewind,
  Upload,
} from 'lucide-react';
import {
  MultiTrackReplayTimeline,
  type ReplayIncidentMarker as ChartIncidentMarker,
  type ReplaySignalMarker as ChartSignalMarker,
} from '../../charts/MultiTrackReplayTimeline';
import { KeycapBadge } from '../../primitives/KeycapBadge';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { SettingActionRow } from '../../compounds/SettingActionRow';
import {
  ReplayViewerTransportBar,
  type DownCounterOption,
  type PlaybackSpeedPreset,
} from '../user/ReplayViewerTransportBar';
import {
  useReplayToRcsImporterStore,
  type RLReplayInterpolationMethod,
  type RLReplayNonPovInterventionMode,
} from '../../stores/replayToRcsImporterStore';
import type { ReplayDownCounterOption } from '../../stores/replayViewerStore';

export interface ReplayToRcsImporterFloatingWindowProps {
  isLight?: boolean;
}

/**
 * [Developer Sandbox] Replay to RCS Replay Importer (`replay-to-rcs-importer`)
 * Dedicated floating window panel adapted from ReplayViewerFloatingWindow.
 * Supports importing raw Rocket League `.replay` files, upsampling 30Hz -> 120Hz via
 * StateInterpolationPipeline, inspecting Track Delta (native telemetry & unmapped properties),
 * intervening with selectable non-POV car behavior (Disappear | Trajectory | Nexto | Necto),
 * and exporting the converted session as an RCS Replay Pack (`.rcreplay.gz`).
 */
export const ReplayToRcsImporterFloatingWindow: React.FC<ReplayToRcsImporterFloatingWindowProps> =
  React.memo(({ isLight = false }) => {
    const {
      viewerState,
      loadedFileName,
      totalFrames,
      sourceFrameCount,
      sourceRecordFps,
      cursorFrame,
      incidentTrackCount,
      signalTrackCount,
      incidentMarkers,
      signalMarkers,
      interpolationMethod,
      nonPovInterventionMode,
      trackDeltaSummary,
      downCounterSec,
      flowPreset,
      customFlowPct,
      effectiveFlowPct,
      errorMessage,
      isLoadingReplay,
      isExportingRcsPack,
      setDownCounterSec,
      setFlowPreset,
      setCustomFlowPct,
      setInterpolationMethod,
      setNonPovInterventionMode,
      runtimeHandlers,
    } = useReplayToRcsImporterStore();

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [showDeltaDetails, setShowDeltaDetails] = useState(false);

    const hasLoadedReplay = Boolean(loadedFileName && totalFrames > 0);
    const controlsDisabled = isLoadingReplay || !hasLoadedReplay || totalFrames <= 0;
    const isIntervening =
      viewerState === 'preroll-countdown' || viewerState === 'intervening';
    const backToReplayDisabled = controlsDisabled || !isIntervening;

    const clampedCursor = controlsDisabled ? 0 : Math.max(0, Math.min(totalFrames, cursorFrame));
    const cursorSec = (clampedCursor / 120).toFixed(2);

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

    const compactBtnClass = `flex-1 min-w-0 whitespace-nowrap inline-flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
      controlsDisabled
        ? isLight
          ? 'bg-neutral-100 border-neutral-200 text-neutral-400 opacity-45 cursor-not-allowed pointer-events-none'
          : 'bg-neutral-800/50 border-neutral-800 text-neutral-500 opacity-45 cursor-not-allowed pointer-events-none'
        : isLight
        ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800 cursor-pointer active:scale-95'
        : 'bg-neutral-800/90 hover:bg-neutral-700 border-neutral-700 text-neutral-100 cursor-pointer active:scale-95'
    }`;

    const handleStep = (delta: number) => {
      if (controlsDisabled) return;
      runtimeHandlers.onPausePlaying?.();
      const nextFrame = Math.max(0, Math.min(totalFrames, clampedCursor + delta));
      runtimeHandlers.onSeekFrame?.(nextFrame);
    };

    return (
      <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
        <input
          ref={fileInputRef}
          type="file"
          accept=".replay"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) {
              runtimeHandlers.onUploadRLReplayFile?.(file);
            }
          }}
        />

        {/* 1. Top Row: Import .replay File & Save as RCS Replay Pack (.rcreplay.gz) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isLoadingReplay}
            onClick={() => {
              if (isLoadingReplay) return;
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
                fileInputRef.current.click();
              }
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              isLoadingReplay
                ? isLight
                  ? 'bg-neutral-800 text-white/80 border border-neutral-800 cursor-wait'
                  : 'bg-neutral-200 text-neutral-950/80 border border-neutral-200 cursor-wait'
                : isLight
                ? 'bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-900 cursor-pointer active:scale-[0.985]'
                : 'bg-white hover:bg-neutral-200 text-neutral-950 border border-white cursor-pointer active:scale-[0.985]'
            }`}
          >
            {isLoadingReplay ? (
              <>
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                <span>Parsing .replay...</span>
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 shrink-0" />
                <span>Import .replay File</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={controlsDisabled || isExportingRcsPack}
            onClick={() => {
              if (controlsDisabled || isExportingRcsPack) return;
              runtimeHandlers.onExportRcsReplayPack?.();
            }}
            className={`py-2 px-3 rounded-xl border font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-all ${
              controlsDisabled || isExportingRcsPack
                ? isLight
                  ? 'bg-neutral-100 border-neutral-200 text-neutral-400 opacity-45 cursor-not-allowed pointer-events-none'
                  : 'bg-neutral-800/50 border-neutral-800 text-neutral-500 opacity-45 cursor-not-allowed pointer-events-none'
                : isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800 cursor-pointer active:scale-95'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200 cursor-pointer active:scale-95'
            }`}
          >
            {isExportingRcsPack ? (
              <>
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                <span>Saving Pack...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span>Save RCS Pack (.gz)</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium ${
              isLight
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}
          >
            {errorMessage}
          </div>
        )}

        {/* 2. L5 MultiTrackReplayTimeline */}
        <MultiTrackReplayTimeline
          variant="tracks-only"
          disabled={controlsDisabled}
          fileName={hasLoadedReplay && loadedFileName ? loadedFileName : 'No .replay file imported'}
          totalFrames={hasLoadedReplay ? totalFrames : 0}
          cursorFrame={clampedCursor}
          isIntervening={isIntervening}
          incidentMarkers={hasLoadedReplay ? mappedIncidentMarkers : []}
          signalMarkers={hasLoadedReplay ? mappedSignalMarkers : []}
          onSeekFrame={(nextFrame) => runtimeHandlers.onSeekFrame?.(nextFrame)}
          isLight={isLight}
        />

        {/* 3. Track Delta & Upsampling Telemetry Strip */}
        {trackDeltaSummary && (
          <div
            className={`rounded-xl border px-2.5 py-2 flex flex-col gap-1.5 ${
              isLight
                ? 'bg-neutral-100/80 border-neutral-200 text-neutral-700'
                : 'bg-white/[0.03] border-white/[0.08] text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Database className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span className="font-semibold text-[11px] truncate">
                  {Math.round(sourceRecordFps || 30)}Hz ({sourceFrameCount}f) &rarr; 120Hz ({totalFrames}f) · Track Delta
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeltaDetails((prev) => !prev)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                  isLight
                    ? 'bg-neutral-200/80 hover:bg-neutral-300 text-neutral-800'
                    : 'bg-white/[0.07] hover:bg-white/[0.12] text-neutral-200'
                }`}
              >
                <span>
                  {trackDeltaSummary.mappedPropertyCount} Mapped / {trackDeltaSummary.trackDeltaOnlyPropertyCount} Delta
                </span>
                {showDeltaDetails ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>

            {showDeltaDetails && (
              <div className="pt-1 border-t border-white/[0.06] flex flex-col gap-1 text-[10px] opacity-90">
                <div className="flex items-center justify-between">
                  <span>CRC32 Part1 / Part2:</span>
                  <span className="font-mono">
                    {trackDeltaSummary.part1CrcValid ? 'PASS' : 'WARN'} /{' '}
                    {trackDeltaSummary.part2CrcValid ? 'PASS' : 'WARN'} · Map: {trackDeltaSummary.mapName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tracks B / C Events:</span>
                  <span className="font-mono">
                    {incidentTrackCount} Incidents · {signalTrackCount} Signals (0 Synthesized)
                  </span>
                </div>
                {trackDeltaSummary.unmappedPropertyNames.length > 0 && (
                  <div className="max-h-24 overflow-y-auto pr-1 mt-0.5 font-mono text-[9.5px] leading-relaxed opacity-80">
                    <div className="font-sans font-semibold mb-0.5">
                      Retained in Track Delta ({trackDeltaSummary.unmappedPropertyNames.length} UE3 properties):
                    </div>
                    {trackDeltaSummary.unmappedPropertyNames.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. Four Transport Buttons with Hotkey Badges: Play, Pause, Rewind, Forward */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={controlsDisabled}
            onClick={() => runtimeHandlers.onStartPlaying?.()}
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
            onClick={() => runtimeHandlers.onPausePlaying?.()}
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
              if (e.detail === 0) {
                handleStep(-Math.max(1, Math.round(effectiveFlowPct / 100)));
              }
            }}
            onMouseDown={controlsDisabled ? undefined : () => runtimeHandlers.onPushBackwardStart?.()}
            onMouseUp={controlsDisabled ? undefined : () => runtimeHandlers.onPushBackwardStop?.()}
            onMouseLeave={controlsDisabled ? undefined : () => runtimeHandlers.onPushBackwardStop?.()}
            onTouchStart={controlsDisabled ? undefined : () => runtimeHandlers.onPushBackwardStart?.()}
            onTouchEnd={controlsDisabled ? undefined : () => runtimeHandlers.onPushBackwardStop?.()}
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
              if (e.detail === 0) {
                handleStep(Math.max(1, Math.round(effectiveFlowPct / 100)));
              }
            }}
            onMouseDown={controlsDisabled ? undefined : () => runtimeHandlers.onPushForwardStart?.()}
            onMouseUp={controlsDisabled ? undefined : () => runtimeHandlers.onPushForwardStop?.()}
            onMouseLeave={controlsDisabled ? undefined : () => runtimeHandlers.onPushForwardStop?.()}
            onTouchStart={controlsDisabled ? undefined : () => runtimeHandlers.onPushForwardStart?.()}
            onTouchEnd={controlsDisabled ? undefined : () => runtimeHandlers.onPushForwardStop?.()}
            className={compactBtnClass}
            title="Forward (Hotkey: ])"
          >
            <FastForward className="h-3 w-3 shrink-0" />
            <span>Forward</span>
            <KeycapBadge label="]" size="sm" isLight={isLight} />
          </button>
        </div>

        {/* 5. 30Hz -> 120Hz Interpolation Algorithm Selector */}
        <SettingActionRow
          icon={Activity}
          title="30Hz -> 120Hz Interpolation"
          bordered={false}
          showDescription={false}
          paddingX={4}
          paddingY={2}
          disabled={isLoadingReplay}
          isLight={isLight}
          rightSlot={
            <SegmentedSwitch
              value={interpolationMethod}
              size="sm"
              disabled={isLoadingReplay}
              isLight={isLight}
              onValueChange={(v) => setInterpolationMethod(v as RLReplayInterpolationMethod)}
              options={[
                { value: 'hermite-clamped', label: 'Hermite + SLERP' },
                { value: 'linear', label: 'Linear + SLERP' },
              ]}
            />
          }
        />

        {/* 6. Non-POV Vehicles Behavior on Intervene */}
        <SettingActionRow
          icon={Bot}
          title="Non-POV Cars on Intervene"
          bordered={false}
          showDescription={false}
          paddingX={4}
          paddingY={2}
          disabled={controlsDisabled}
          isLight={isLight}
          rightSlot={
            <SegmentedSwitch
              value={nonPovInterventionMode}
              size="sm"
              disabled={controlsDisabled}
              isLight={isLight}
              onValueChange={(v) =>
                setNonPovInterventionMode(v as RLReplayNonPovInterventionMode)
              }
              options={[
                { value: 'disappear', label: 'Disappear' },
                { value: 'trajectory', label: 'Trajectory' },
                { value: 'nexto', label: 'Nexto' },
                { value: 'necto', label: 'Necto' },
              ]}
            />
          }
        />

        {/* 7. Shared Transport Bar (Playback Speed, Intervene from here / Back to replay, Down Counter) */}
        <ReplayViewerTransportBar
          isLight={isLight}
          controlsDisabled={controlsDisabled}
          backToReplayDisabled={backToReplayDisabled}
          playbackPreset={flowPreset as PlaybackSpeedPreset}
          customSpeedPct={customFlowPct}
          downCounter={String(downCounterSec) as DownCounterOption}
          clampedCursor={clampedCursor}
          cursorSec={cursorSec}
          onPresetSelect={(nextPreset) => setFlowPreset(nextPreset)}
          onCustomSpeedSelect={(nextPct) => setCustomFlowPct(nextPct)}
          onInterveneClick={() => {
            if (controlsDisabled) return;
            runtimeHandlers.onResumeFromHere?.();
          }}
          onBackToReplayClick={() => {
            if (backToReplayDisabled) return;
            runtimeHandlers.onReturnToReplay?.();
          }}
          onDownCounterSelect={(nextDown) =>
            setDownCounterSec((Number(nextDown) || 0) as ReplayDownCounterOption)
          }
        />
      </div>
    );
  });
ReplayToRcsImporterFloatingWindow.displayName = 'ReplayToRcsImporterFloatingWindow';
