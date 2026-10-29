import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Film, Play, Pause, Rewind, FastForward, Timer } from 'lucide-react';
import { SegmentedSwitch } from '../primitives/SegmentedSwitch';
import { SliderControl } from '../primitives/SliderControl';
import { Badge } from '../primitives/Badge';
import { KeycapBadge } from '../primitives/KeycapBadge';

export interface ReplayIncidentMarker {
  frameIndex: number;
  type: 'goal' | 'demo' | 'touch' | 'save';
  label: string;
}

export interface ReplaySignalMarker {
  frameIndex: number;
  type: 'score' | 'kickoff' | 'end';
  label: string;
  synthesized?: boolean;
}

export const DEFAULT_REPLAY_INCIDENT_MARKERS: ReplayIncidentMarker[] = [
  { frameIndex: 145, type: 'touch', label: 'First Touch (Diagonal Kickoff)' },
  { frameIndex: 420, type: 'demo', label: 'Supersonic Demolition' },
  { frameIndex: 790, type: 'save', label: 'Epic Crossbar Save' },
  { frameIndex: 1180, type: 'goal', label: 'Goal Scored (114 KM/H)' },
];

export const DEFAULT_REPLAY_SIGNAL_MARKERS: ReplaySignalMarker[] = [
  { frameIndex: 60, type: 'kickoff', label: 'Kickoff Go Signal' },
  { frameIndex: 1180, type: 'score', label: 'Score Event Signal' },
  { frameIndex: 1400, type: 'end', label: 'Replay Clip Boundary', synthesized: true },
];

export type ReplayDownCounterSec = 3 | 2 | 1 | 0;
export type ReplayFlowPresetId = '100' | '50' | '200' | '500' | 'custom';

export interface MultiTrackReplayTimelineHandle {
  /** Imperatively move the 3-track playhead cursor at 120Hz with zero React re-renders */
  setCursorFrame: (frameIndex: number) => void;
}

export interface MultiTrackReplayTimelineProps {
  fileName?: string;
  totalFrames?: number;
  /** Controlled current frame index */
  cursorFrame?: number;
  initialCursorFrame?: number;
  isIntervening?: boolean;
  incidentMarkers?: ReplayIncidentMarker[];
  signalMarkers?: ReplaySignalMarker[];
  /** Visual variant: 'card' (full 5B inspector) or 'tracks-only' (embedded 3-track scrub card for ReplayViewerFloatingWindow) */
  variant?: 'card' | 'tracks-only';
  onSeekFrame?: (frameIndex: number) => void;
  onResumeFromCursor?: (cursorFrame: number, downCounterSec: ReplayDownCounterSec) => void;
  isLight?: boolean;
  className?: string;
}

/**
 * MultiTrackReplayTimeline
 * 3-Track Synchronized Replay Timeline Inspector (`Track A: State + Input`, `Track B: Incidents`, `Track C: Signals`)
 * with Down-Counter (`3 / 2 / 1 / 0`) takeover selector, Flow Speed control, and 120Hz zero-React-rerender playhead cursor refs.
 * Used both standalone in 5B Charts & Curves (`variant="card"`) and embedded in ReplayViewerFloatingWindow (`variant="tracks-only"`).
 */
export const MultiTrackReplayTimeline = React.memo(
  forwardRef<MultiTrackReplayTimelineHandle, MultiTrackReplayTimelineProps>(
    (
      {
        fileName = 'match_2026_finals_ot.rcreplay.gz',
        totalFrames = 1440,
        cursorFrame: controlledCursorFrame,
        initialCursorFrame = 540,
        isIntervening = false,
        incidentMarkers = DEFAULT_REPLAY_INCIDENT_MARKERS,
        signalMarkers = DEFAULT_REPLAY_SIGNAL_MARKERS,
        variant = 'card',
        onSeekFrame,
        onResumeFromCursor,
        isLight = true,
        className = '',
      },
      ref
    ) => {
      const [isPlaying, setIsPlaying] = useState(false);
      const [downCounterSec, setDownCounterSec] = useState<ReplayDownCounterSec>(3);
      const [flowPreset, setFlowPreset] = useState<ReplayFlowPresetId>('100');
      const [customFlowPct, setCustomFlowPct] = useState(80);

      const effectiveInitialFrame = controlledCursorFrame ?? initialCursorFrame;
      const cursorFrameRef = useRef(effectiveInitialFrame);
      const cursorTextRef = useRef<HTMLSpanElement | null>(null);
      const trackAFillRef = useRef<HTMLDivElement | null>(null);
      const trackBCursorRef = useRef<HTMLDivElement | null>(null);
      const trackCCursorRef = useRef<HTMLDivElement | null>(null);

      const effectiveFlowPct = flowPreset === 'custom' ? customFlowPct : Number(flowPreset);
      const isTracksOnly = variant === 'tracks-only';
      const denomFrames = isTracksOnly ? Math.max(1, totalFrames) : Math.max(1, totalFrames - 1);

      const applyCursorToDom = useCallback(
        (frameIdx: number) => {
          const maxF = isTracksOnly ? totalFrames : Math.max(1, totalFrames - 1);
          const clamped = Math.max(0, Math.min(maxF, Math.round(frameIdx)));
          cursorFrameRef.current = clamped;
          const pct = (clamped / denomFrames) * 100;

          if (trackAFillRef.current) {
            trackAFillRef.current.style.width = `${pct}%`;
          }
          if (trackBCursorRef.current) {
            trackBCursorRef.current.style.left = `${pct}%`;
          }
          if (trackCCursorRef.current) {
            trackCCursorRef.current.style.left = `${pct}%`;
          }
          if (cursorTextRef.current) {
            const text = `Frame #${clamped} (${(clamped / 120).toFixed(2)}s)`;
            if (cursorTextRef.current.textContent !== text) {
              cursorTextRef.current.textContent = text;
            }
          }
        },
        [totalFrames, denomFrames, isTracksOnly]
      );

      useImperativeHandle(
        ref,
        () => ({
          setCursorFrame: applyCursorToDom,
        }),
        [applyCursorToDom]
      );

      useEffect(() => {
        applyCursorToDom(controlledCursorFrame ?? initialCursorFrame);
      }, [controlledCursorFrame, initialCursorFrame, applyCursorToDom]);

      useEffect(() => {
        if (!isPlaying || isTracksOnly) return;
        const stepFrames = Math.max(1, Math.round((4 * effectiveFlowPct) / 100));
        const id = window.setInterval(() => {
          const next = (cursorFrameRef.current + stepFrames) % Math.max(1, totalFrames);
          applyCursorToDom(next);
        }, 33);
        return () => window.clearInterval(id);
      }, [isPlaying, isTracksOnly, effectiveFlowPct, totalFrames, applyCursorToDom]);

      const handleTrackSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
        const target = Math.round(ratio * denomFrames);
        applyCursorToDom(target);
        onSeekFrame?.(target);
      };

      const stepRelative = (deltaFrames: number) => {
        const next = Math.max(0, Math.min(denomFrames, cursorFrameRef.current + deltaFrames));
        applyCursorToDom(next);
        onSeekFrame?.(next);
      };

      const trackBgClass = isLight ? 'bg-neutral-200/90' : 'bg-neutral-800/95';
      const cursorLineClass = isLight ? 'bg-neutral-900' : 'bg-white';

      if (isTracksOnly) {
        const clampedCursor = Math.max(0, Math.min(totalFrames, effectiveInitialFrame));
        const cursorSec = (clampedCursor / 120).toFixed(2);
        const totalSec = (totalFrames / 120).toFixed(2);
        const cursorPct = (clampedCursor / denomFrames) * 100;

        return (
          <div
            data-ui-element="chart-multitrack-replay-timeline"
            className={`p-3 rounded-xl border flex flex-col gap-2 font-mono select-none ${
              isLight
                ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
                : 'bg-neutral-900/70 border-neutral-800 text-neutral-200'
            } ${className}`}
          >
            {/* File Name Line */}
            <div className="flex items-center justify-between gap-2">
              <span data-allow-truncate="true" className="font-bold text-xs truncate">
                {fileName}
              </span>
              {isIntervening && (
                <span className="text-[10px] font-bold uppercase text-amber-500 shrink-0">
                  Live Intervention
                </span>
              )}
            </div>

            {/* Frame Line: Frame <id> (<sec>s) / <totalId> (<totalSec>s) */}
            <div className="text-[11px] tabular-nums opacity-90">
              Frame <strong>{clampedCursor}</strong> ({cursorSec}s) /{' '}
              <strong>{totalFrames}</strong> ({totalSec}s)
            </div>

            {/* 3 Synchronized Tracks */}
            <div className="flex flex-col gap-1.5 pt-0.5">
              {/* Track 1: State + Input */}
              <div
                onClick={handleTrackSeek}
                title="Track 1 · Physics State & Player Input (Click to seek)"
                className={`w-full h-3 rounded-full overflow-hidden cursor-pointer relative ${trackBgClass}`}
              >
                <div
                  ref={trackAFillRef}
                  className="h-full bg-amber-500 transition-all duration-75"
                  style={{ width: `${cursorPct}%` }}
                />
              </div>

              {/* Track 2: Incidents */}
              <div
                onClick={handleTrackSeek}
                title="Track 2 · Arena Incidents (Touch / Demo / Save / Goal)"
                className={`w-full h-3 rounded-full overflow-hidden cursor-pointer relative ${trackBgClass}`}
              >
                {incidentMarkers.map((m, idx) => {
                  const leftPct = (m.frameIndex / denomFrames) * 100;
                  const colorCls =
                    m.type === 'goal'
                      ? 'bg-emerald-500 w-1.5 z-10'
                      : m.type === 'demo'
                      ? 'bg-rose-500 w-1'
                      : m.type === 'save'
                      ? 'bg-sky-500 w-1'
                      : 'bg-amber-500 w-0.5';
                  return (
                    <div
                      key={`${m.frameIndex}-${idx}`}
                      style={{ left: `${leftPct}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        applyCursorToDom(m.frameIndex);
                        onSeekFrame?.(m.frameIndex);
                      }}
                      className={`absolute top-0 bottom-0 ${colorCls}`}
                      title={`${m.label} @ #${m.frameIndex}`}
                    />
                  );
                })}
                <div
                  ref={trackBCursorRef}
                  style={{ left: `${cursorPct}%` }}
                  className={`absolute top-0 bottom-0 w-0.5 pointer-events-none ${cursorLineClass}`}
                />
              </div>

              {/* Track 3: Signals */}
              <div
                onClick={handleTrackSeek}
                title="Track 3 · Match Signals (Kickoff / Score / Boundary)"
                className={`w-full h-3 rounded-full overflow-hidden cursor-pointer relative ${trackBgClass}`}
              >
                {signalMarkers.map((s, idx) => {
                  const leftPct = (s.frameIndex / denomFrames) * 100;
                  const colorCls =
                    s.type === 'score'
                      ? 'bg-emerald-500 w-1.5'
                      : s.type === 'end'
                      ? 'bg-violet-500 w-1'
                      : 'bg-sky-500 w-1';
                  return (
                    <div
                      key={`${s.frameIndex}-${idx}`}
                      style={{ left: `${leftPct}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        applyCursorToDom(s.frameIndex);
                        onSeekFrame?.(s.frameIndex);
                      }}
                      className={`absolute top-0 bottom-0 ${colorCls}`}
                      title={`${s.label} @ #${s.frameIndex}`}
                    />
                  );
                })}
                <div
                  ref={trackCCursorRef}
                  style={{ left: `${cursorPct}%` }}
                  className={`absolute top-0 bottom-0 w-0.5 pointer-events-none ${cursorLineClass}`}
                />
              </div>
            </div>
          </div>
        );
      }

      return (
        <div
          data-ui-element="chart-multitrack-replay-timeline"
          className={`flex flex-col gap-3 p-4 rounded-2xl border select-none ${
            isLight
              ? 'bg-white border-neutral-200 text-neutral-900 shadow-xs'
              : 'bg-neutral-900/90 border-neutral-800 text-neutral-100 shadow-lg'
          } ${className}`}
        >
          {/* Top File & Status Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Film className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="font-bold text-xs truncate">
                3-Track Synchronized Replay Timeline ({fileName})
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                variant={isPlaying ? 'success' : 'neutral'}
                size="sm"
                isLight={isLight}
                className="font-mono"
              >
                {isPlaying ? 'PLAYING 120HZ' : 'PAUSED'}
              </Badge>
              <Badge variant="primary" size="sm" isLight={isLight} className="font-mono">
                {totalFrames}f ({(totalFrames / 120).toFixed(1)}s)
              </Badge>
            </div>
          </div>

          {/* 3 Synchronized Tracks Container */}
          <div
            className={`p-3 rounded-xl border font-mono text-[10px] flex flex-col gap-2.5 ${
              isLight
                ? 'bg-neutral-50 border-neutral-200 text-neutral-700'
                : 'bg-neutral-950/80 border-neutral-800 text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>
                Playhead: <b ref={cursorTextRef}>Frame #{effectiveInitialFrame}</b>
              </span>
              <span className="text-emerald-500 font-semibold">
                Takeover Preroll: -{downCounterSec + 1}s ({(downCounterSec + 1) * 120}f)
              </span>
            </div>

            {/* Track A: State + Input */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[9.5px] opacity-80">
                <span>Track A · Physics State + Player Input</span>
                <span>{totalFrames} frames (120Hz)</span>
              </div>
              <div
                onClick={handleTrackSeek}
                className={`w-full h-3 rounded-full overflow-hidden cursor-pointer relative ${trackBgClass}`}
                title="Click anywhere on Track A to seek frame"
              >
                <div
                  ref={trackAFillRef}
                  className="h-full bg-amber-500"
                  style={{ width: `${(effectiveInitialFrame / Math.max(1, totalFrames - 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Track B: Incidents */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[9.5px] opacity-80">
                <span>Track B · Arena Incidents (Touch / Demo / Save / Goal)</span>
                <span>{incidentMarkers.length} events</span>
              </div>
              <div
                onClick={handleTrackSeek}
                className={`w-full h-3 rounded-full overflow-hidden cursor-pointer relative ${trackBgClass}`}
              >
                {incidentMarkers.map((m, idx) => {
                  const leftPct = (m.frameIndex / Math.max(1, totalFrames - 1)) * 100;
                  const colorCls =
                    m.type === 'goal'
                      ? 'bg-emerald-500 w-1.5 z-10'
                      : m.type === 'demo'
                      ? 'bg-rose-500 w-1'
                      : m.type === 'save'
                      ? 'bg-sky-500 w-1'
                      : 'bg-amber-500 w-0.5';
                  return (
                    <div
                      key={`${m.frameIndex}-${idx}`}
                      style={{ left: `${leftPct}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        applyCursorToDom(m.frameIndex);
                        onSeekFrame?.(m.frameIndex);
                      }}
                      className={`absolute top-0 bottom-0 ${colorCls}`}
                      title={`${m.label} @ #${m.frameIndex}`}
                    />
                  );
                })}
                <div
                  ref={trackBCursorRef}
                  className={`absolute top-0 bottom-0 w-0.5 pointer-events-none ${cursorLineClass}`}
                />
              </div>
            </div>

            {/* Track C: Signals */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[9.5px] opacity-80">
                <span>Track C · Match Signals (Kickoff / Score / Boundary)</span>
                <span>{signalMarkers.length} signals</span>
              </div>
              <div
                onClick={handleTrackSeek}
                className={`w-full h-3 rounded-full overflow-hidden cursor-pointer relative ${trackBgClass}`}
              >
                {signalMarkers.map((s, idx) => {
                  const leftPct = (s.frameIndex / Math.max(1, totalFrames - 1)) * 100;
                  const colorCls =
                    s.type === 'score'
                      ? 'bg-emerald-500 w-1.5'
                      : s.type === 'end'
                      ? 'bg-violet-500 w-1'
                      : 'bg-sky-500 w-1';
                  return (
                    <div
                      key={`${s.frameIndex}-${idx}`}
                      style={{ left: `${leftPct}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        applyCursorToDom(s.frameIndex);
                        onSeekFrame?.(s.frameIndex);
                      }}
                      className={`absolute top-0 bottom-0 ${colorCls}`}
                      title={`${s.label} @ #${s.frameIndex}`}
                    />
                  );
                })}
                <div
                  ref={trackCCursorRef}
                  className={`absolute top-0 bottom-0 w-0.5 pointer-events-none ${cursorLineClass}`}
                />
              </div>
            </div>
          </div>

        {/* Transport + Down Counter + Flow Speed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between bg-amber-500 hover:bg-amber-400 text-neutral-950 cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-1.5">
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </span>
              <KeycapBadge shortcut="P" size="sm" isLight={isLight} />
            </button>

            <button
              type="button"
              onClick={() => stepRelative(-60)}
              className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700'
              }`}
              title="Step Back 0.5s (-60f)"
            >
              <Rewind className="h-3.5 w-3.5" />
              <span>-60f</span>
            </button>

            <button
              type="button"
              onClick={() => stepRelative(60)}
              className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700'
              }`}
              title="Step Forward 0.5s (+60f)"
            >
              <FastForward className="h-3.5 w-3.5" />
              <span>+60f</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold shrink-0">
              <Timer className="h-3.5 w-3.5 text-amber-500" />
              <span>Down Counter</span>
            </span>
            <SegmentedSwitch
              value={String(downCounterSec)}
              size="sm"
              isLight={isLight}
              onValueChange={(v) => setDownCounterSec(Number(v) as ReplayDownCounterSec)}
              options={[
                { value: '3', label: '3 (-4s)' },
                { value: '2', label: '2 (-3s)' },
                { value: '1', label: '1 (-2s)' },
                { value: '0', label: '0 (-1s)' },
              ]}
            />
          </div>
        </div>

        {/* Flow Speed Row */}
        <div className="flex flex-col gap-2 pt-1 border-t border-neutral-500/15">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">
              Playback Flow Speed ({effectiveFlowPct}% · {Math.round((120 * effectiveFlowPct) / 100)}{' '}
              fps)
            </span>
            <div className="flex items-center gap-2">
              <SegmentedSwitch
                value={flowPreset}
                size="sm"
                isLight={isLight}
                onValueChange={(v) => setFlowPreset(v as ReplayFlowPresetId)}
                options={[
                  { value: '100', label: '100%' },
                  { value: '50', label: '50%' },
                  { value: '200', label: '200%' },
                  { value: '500', label: '500%' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
              {onResumeFromCursor && (
                <button
                  type="button"
                  onClick={() => onResumeFromCursor(cursorFrameRef.current, downCounterSec)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold cursor-pointer"
                >
                  Resume Here [G]
                </button>
              )}
            </div>
          </div>

          {flowPreset === 'custom' && (
            <SliderControl
              label="Custom Flow Speed"
              value={customFlowPct}
              min={1}
              max={500}
              step={1}
              unit="%"
              isLight={isLight}
              onChange={setCustomFlowPct}
            />
          )}
        </div>
      </div>
    );
  })
);

MultiTrackReplayTimeline.displayName = 'MultiTrackReplayTimeline';
