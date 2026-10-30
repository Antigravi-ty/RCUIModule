import React from 'react';
import { FastForward, Play, Rewind, Square } from 'lucide-react';
import { KeycapBadge } from '../../../primitives/KeycapBadge';

export type RewinderBadgeState = 'idle' | 'recording' | 'stopped' | 'error';

export interface RewinderTransportProgressSectionProps {
  isLight: boolean;
  status: RewinderBadgeState;
  isReady: boolean;
  recordedFrames: number;
  effectiveCursorFrame: number;
  effectiveReleaseFrame: number;
  recordedRelSec: string;
  cursorRelSec: string;
  releaseRelSec: string;
  warmupProgressPct: number;
  readyCursorPct: number;
  readyReleasePct: number;
  onStartNewRecording: () => void;
  onStopRecording: () => void;
  onStepFrame: (delta: number) => void;
  onRewindPressStart?: () => void;
  onRewindPressEnd?: () => void;
  onForwardPressStart?: () => void;
  onForwardPressEnd?: () => void;
  onCycleBadgeState: () => void;
  onScrubBar: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const RewinderTransportProgressSection: React.FC<
  RewinderTransportProgressSectionProps
> = React.memo(
  ({
    isLight,
    status,
    isReady,
    recordedFrames,
    effectiveCursorFrame,
    effectiveReleaseFrame,
    recordedRelSec,
    cursorRelSec,
    releaseRelSec,
    warmupProgressPct,
    readyCursorPct,
    readyReleasePct,
    onStartNewRecording,
    onStopRecording,
    onStepFrame,
    onRewindPressStart,
    onRewindPressEnd,
    onForwardPressStart,
    onForwardPressEnd,
    onCycleBadgeState,
    onScrubBar,
  }) => {
    const statusBadgeConfig: Record<
      RewinderBadgeState,
      { label: string; className: string }
    > = {
      idle: {
        label: 'Idle',
        className: isLight
          ? 'bg-neutral-200/90 border-neutral-300 text-neutral-700'
          : 'bg-neutral-800 border-neutral-700 text-neutral-300',
      },
      recording: {
        label: 'Recording',
        className: isLight
          ? 'bg-amber-100 border-amber-300 text-amber-800'
          : 'bg-amber-500/20 border-amber-500/40 text-amber-300',
      },
      stopped: {
        label: 'Stopped',
        className: isLight
          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
      },
      error: {
        label: 'Error',
        className: isLight
          ? 'bg-rose-100 border-rose-300 text-rose-800'
          : 'bg-rose-500/20 border-rose-500/40 text-rose-300',
      },
    };

    const currentBadge = statusBadgeConfig[status];
    const compactBtnClass = `inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-all active:scale-95 ${
      isLight
        ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
        : 'bg-neutral-800/90 hover:bg-neutral-700 border-neutral-700 text-neutral-100'
    }`;

    return (
      <>
        {/* 1. Top Row: 4 Compact Transport Buttons + Status Badge */}
        <div className="flex items-center justify-between gap-1.5 flex-nowrap">
          <div className="flex items-center gap-1 flex-nowrap shrink-0">
            <button
              type="button"
              onClick={onStartNewRecording}
              className={compactBtnClass}
              title="Start new recording (Hotkey: O)"
            >
              <Play className="h-3 w-3 fill-current text-amber-500 shrink-0" />
              <span>New</span>
              <KeycapBadge label="O" size="sm" isLight={isLight} />
            </button>

            <button
              type="button"
              onClick={onStopRecording}
              className={compactBtnClass}
              title="Stop recording (Hotkey: P)"
            >
              <Square className="h-3 w-3 fill-current text-rose-500 shrink-0" />
              <span>Stop</span>
              <KeycapBadge label="P" size="sm" isLight={isLight} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                if (!onRewindPressStart || e.detail === 0) {
                  onStepFrame(-1);
                }
              }}
              onMouseDown={onRewindPressStart}
              onMouseUp={onRewindPressEnd}
              onMouseLeave={onRewindPressEnd}
              onTouchStart={onRewindPressStart}
              onTouchEnd={onRewindPressEnd}
              className={compactBtnClass}
              title="Rewind cursor (Hotkey: [)"
            >
              <Rewind className="h-3 w-3 shrink-0" />
              <span>Rewind</span>
              <KeycapBadge label="[" size="sm" isLight={isLight} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                if (!onForwardPressStart || e.detail === 0) {
                  onStepFrame(1);
                }
              }}
              onMouseDown={onForwardPressStart}
              onMouseUp={onForwardPressEnd}
              onMouseLeave={onForwardPressEnd}
              onTouchStart={onForwardPressStart}
              onTouchEnd={onForwardPressEnd}
              className={compactBtnClass}
              title="Forward cursor (Hotkey: ])"
            >
              <FastForward className="h-3 w-3 shrink-0" />
              <span>Forward</span>
              <KeycapBadge label="]" size="sm" isLight={isLight} />
            </button>
          </div>

          <button
            type="button"
            onClick={onCycleBadgeState}
            title="Status Badge (Idle / Recording / Stopped / Error)"
            className={`min-w-[78px] inline-flex items-center justify-center text-center whitespace-nowrap px-2 py-1 rounded-lg border font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 cursor-pointer transition-colors ${currentBadge.className}`}
          >
            {currentBadge.label}
          </button>
        </div>

        {/* 2. Two-Layer Progress Bar Box */}
        <div
          className={`p-3 rounded-xl border flex flex-col gap-2 font-mono ${
            isLight
              ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
              : 'bg-neutral-900/70 border-neutral-800 text-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px]">
            <span>
              Cursor:{' '}
              <strong className="tabular-nums">
                #{isReady ? effectiveCursorFrame : recordedFrames}
              </strong>{' '}
              <span className="opacity-75 tabular-nums">({cursorRelSec}s)</span>
            </span>
            <span>
              Recorded:{' '}
              <strong className="tabular-nums">{recordedRelSec}s</strong>{' '}
              <span className="opacity-65 text-[10px] tabular-nums">
                ({recordedFrames}f)
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="opacity-80">
              Release Marker:{' '}
              <strong className="tabular-nums">
                {isReady ? `#${effectiveReleaseFrame} (${releaseRelSec}s)` : '—'}
              </strong>
            </span>
            <span
              className={`font-bold uppercase tracking-wider ${
                isReady
                  ? isLight
                    ? 'text-neutral-950'
                    : 'text-white'
                  : 'text-amber-500'
              }`}
            >
              {isReady ? 'Ready' : 'Starvation'}
            </span>
          </div>

          <div
            onClick={onScrubBar}
            title={
              isReady
                ? `Click to scrub selectable frames (#120 .. #${recordedFrames})`
                : `Warming up mandatory 1.0s buffer (${recordedFrames} / 120 frames)`
            }
            className={`relative w-full h-3.5 rounded-full overflow-hidden border ${
              isReady ? 'cursor-pointer' : 'cursor-not-allowed'
            } ${
              isLight
                ? 'bg-neutral-200/90 border-neutral-300/80'
                : 'bg-neutral-950 border-neutral-800'
            }`}
          >
            {!isReady ? (
              <div
                className="h-full bg-rose-500 transition-all duration-75"
                style={{ width: `${warmupProgressPct}%` }}
              />
            ) : (
              <>
                <div
                  className="h-full bg-amber-500 transition-all duration-75"
                  style={{ width: `${Math.max(2, Math.min(100, readyCursorPct))}%` }}
                />
                <div
                  style={{ left: `${Math.max(0, Math.min(100, readyReleasePct))}%` }}
                  className={`absolute top-0 bottom-0 w-0.5 -translate-x-1/2 pointer-events-none ${
                    isLight ? 'bg-neutral-950' : 'bg-white'
                  }`}
                />
              </>
            )}
          </div>
        </div>
      </>
    );
  }
);
RewinderTransportProgressSection.displayName = 'RewinderTransportProgressSection';
