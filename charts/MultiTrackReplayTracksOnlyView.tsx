import React, { useMemo } from 'react';
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

export interface MultiTrackReplayTracksOnlyViewProps {
  fileName: string;
  totalFrames: number;
  denomFrames: number;
  effectiveInitialFrame: number;
  isIntervening: boolean;
  isTrackDisabled: boolean;
  isLight: boolean;
  className: string;
  trackBgClass: string;
  cursorLineClass: string;
  incidentMarkers: ReplayIncidentMarker[];
  signalMarkers: ReplaySignalMarker[];
  trackAFillRef: React.RefObject<HTMLDivElement | null>;
  trackBCursorRef: React.RefObject<HTMLDivElement | null>;
  trackCCursorRef: React.RefObject<HTMLDivElement | null>;
  handleTrackSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  applyCursorToDom: (frameIndex: number) => void;
  onSeekFrame?: (frameIndex: number) => void;
}

export const MultiTrackReplayTracksOnlyView: React.FC<MultiTrackReplayTracksOnlyViewProps> = React.memo(({
  fileName,
  totalFrames,
  denomFrames,
  effectiveInitialFrame,
  isIntervening,
  isTrackDisabled,
  isLight,
  className,
  trackBgClass,
  cursorLineClass,
  incidentMarkers,
  signalMarkers,
  trackAFillRef,
  trackBCursorRef,
  trackCCursorRef,
  handleTrackSeek,
  applyCursorToDom,
  onSeekFrame,
}) => {
  const clampedCursor = isTrackDisabled ? 0 : Math.max(0, Math.min(totalFrames, effectiveInitialFrame));
  const cursorSec = (clampedCursor / 120).toFixed(2);
  const totalSec = (Math.max(0, totalFrames) / 120).toFixed(2);
  const cursorPct = isTrackDisabled ? 0 : (clampedCursor / denomFrames) * 100;
  const trackInteractiveCls = isTrackDisabled
    ? 'cursor-not-allowed pointer-events-none opacity-50'
    : 'cursor-pointer';

  const renderedIncidentMarkers = useMemo(() => {
    if (isTrackDisabled) return null;
    return incidentMarkers.map((m, idx) => {
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
    });
  }, [isTrackDisabled, incidentMarkers, denomFrames, applyCursorToDom, onSeekFrame]);

  const renderedSignalMarkers = useMemo(() => {
    if (isTrackDisabled) return null;
    return signalMarkers.map((s, idx) => {
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
    });
  }, [isTrackDisabled, signalMarkers, denomFrames, applyCursorToDom, onSeekFrame]);

  return (
    <div
      data-ui-element="chart-multitrack-replay-timeline"
      aria-disabled={isTrackDisabled}
      className={`p-3 rounded-xl border flex flex-col gap-2 font-mono select-none ${
        isLight
          ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
          : 'bg-neutral-900/70 border-neutral-800 text-neutral-200'
      } ${isTrackDisabled ? 'opacity-60' : ''} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span data-allow-truncate="true" className="font-bold text-xs truncate">
          {fileName}
        </span>
        {isIntervening && !isTrackDisabled && (
          <span className="text-[10px] font-bold uppercase text-amber-500 shrink-0">
            Live Intervention
          </span>
        )}
      </div>

      <div className="text-[11px] tabular-nums opacity-90">
        Frame <strong>{clampedCursor}</strong> ({cursorSec}s) /{' '}
        <strong>{totalFrames}</strong> ({totalSec}s)
      </div>

      <div className="flex flex-col gap-1.5 pt-0.5">
        <div
          onClick={handleTrackSeek}
          title="Track 1 · Physics State & Player Input (Click to seek)"
          className={`w-full h-3 rounded-full overflow-hidden relative ${trackInteractiveCls} ${trackBgClass}`}
        >
          <div
            ref={trackAFillRef}
            className="h-full bg-amber-500"
            style={{ width: `${cursorPct}%` }}
          />
        </div>

        <div
          onClick={handleTrackSeek}
          title="Track 2 · Arena Incidents (Touch / Demo / Save / Goal)"
          className={`w-full h-3 rounded-full overflow-hidden relative ${trackInteractiveCls} ${trackBgClass}`}
        >
          {renderedIncidentMarkers}
          {!isTrackDisabled && (
            <div
              ref={trackBCursorRef}
              style={{ left: `${cursorPct}%` }}
              className={`absolute top-0 bottom-0 w-0.5 pointer-events-none ${cursorLineClass}`}
            />
          )}
        </div>

        <div
          onClick={handleTrackSeek}
          title="Track 3 · Match Signals (Kickoff / Score / Boundary)"
          className={`w-full h-3 rounded-full overflow-hidden relative ${trackInteractiveCls} ${trackBgClass}`}
        >
          {renderedSignalMarkers}
          {!isTrackDisabled && (
            <div
              ref={trackCCursorRef}
              style={{ left: `${cursorPct}%` }}
              className={`absolute top-0 bottom-0 w-0.5 pointer-events-none ${cursorLineClass}`}
            />
          )}
        </div>
      </div>
    </div>
  );
});

