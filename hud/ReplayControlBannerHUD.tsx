import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  ReplayBannerTransientState,
  ReplayBannerTransientListener,
} from '../stores/hudTransientTypes';

export type ReplayBannerPhase = 'goal' | 'replay' | 'podium' | 'ended';
export type ReplayCameraMode = 'director' | 'pov';

export interface ReplayControlBannerHandle {
  /** Imperatively update replay scrubber progress & frame counter at 120Hz with zero React re-renders */
  setReplayProgress: (normalizedProgress: number, frameIndex: number, totalFrames: number) => void;
}

export interface ReplayControlBannerHUDProps {
  phase?: ReplayBannerPhase;
  scorerName?: string;
  scorerTeam?: 'blue' | 'orange' | 0 | 1;
  ballSpeedKph?: number;
  assistName?: string;
  replayPaused?: boolean;
  replayPersistent?: boolean;
  replaySpeed?: number;
  replayCameraMode?: ReplayCameraMode;
  replayProgress?: number;
  replayFrameIndex?: number;
  replayTotalFrames?: number;
  winner?: 'BLUE' | 'ORANGE' | 'DRAW' | null;
  winReason?: string;
  /** Optional 120Hz transient channel subscription (0 React VDOM re-renders) */
  subscribeReplayBanner?: (listener: ReplayBannerTransientListener) => () => void;
  onTogglePause?: () => void;
  onToggleCameraMode?: () => void;
  onCycleSpeed?: () => void;
  onSkipReplay?: () => void;
  onSeekNormalized?: (normalized: number) => void;
  onVoteRematch?: () => void;
  onExitRoom?: () => void;
  isLight?: boolean;
  className?: string;
}

/**
 * ReplayControlBannerHUD (`5A.8`)
 * Top-center Goal Replay / Scorer Telemetry Pill / Interactive Scrubber / Podium Celebration Banner.
 * Extracted and decoupled from RocketCompanion's `MatchHeaderHUD` with imperative 120Hz scrubber ref support.
 */
export const ReplayControlBannerHUD = React.memo(
  forwardRef<ReplayControlBannerHandle, ReplayControlBannerHUDProps>(
    (
      {
        phase = 'replay',
        scorerName = 'STRIKER-4829',
        scorerTeam = 'blue',
        ballSpeedKph = 114,
        assistName = 'AERO-BOT',
        replayPaused = false,
        replayPersistent = true,
        replaySpeed = 1.0,
        replayCameraMode = 'director',
        replayProgress = 0.42,
        replayFrameIndex = 151,
        replayTotalFrames = 360,
        winner = 'BLUE',
        winReason = 'SCORE',
        subscribeReplayBanner,
        onTogglePause,
        onToggleCameraMode,
        onCycleSpeed,
        onSkipReplay,
        onSeekNormalized,
        onVoteRematch,
        onExitRoom,
        isLight = true,
        className = '',
      },
      ref
    ) => {
      const rangeInputRef = useRef<HTMLInputElement | null>(null);
      const frameReadoutRef = useRef<HTMLSpanElement | null>(null);

      const applyProgressToDom = useCallback(
        (norm: number, frameIdx: number, totalF: number) => {
          const clampedNorm = Math.max(0, Math.min(1, norm || 0));
          if (rangeInputRef.current) {
            rangeInputRef.current.value = String(Math.round(clampedNorm * 1000));
          }
          if (frameReadoutRef.current) {
            const text = `${Math.round(frameIdx)}/${Math.max(1, Math.round(totalF))}`;
            if (frameReadoutRef.current.textContent !== text) {
              frameReadoutRef.current.textContent = text;
            }
          }
        },
        []
      );

      useImperativeHandle(
        ref,
        () => ({
          setReplayProgress: applyProgressToDom,
        }),
        [applyProgressToDom]
      );

      useEffect(() => {
        applyProgressToDom(replayProgress, replayFrameIndex, replayTotalFrames);
      }, [replayProgress, replayFrameIndex, replayTotalFrames, applyProgressToDom]);

      useEffect(() => {
        if (!subscribeReplayBanner) return;
        return subscribeReplayBanner((st: ReplayBannerTransientState) => {
          applyProgressToDom(st.replayProgress, st.replayFrameIndex, st.replayTotalFrames);
        });
      }, [subscribeReplayBanner, applyProgressToDom]);

    const isBlueScorer = scorerTeam === 'blue' || scorerTeam === 0;
    const isOrangeScorer = scorerTeam === 'orange' || scorerTeam === 1;

    return (
      <div
        data-ui-element="hud-replay-control-banner"
        className={`select-none pointer-events-auto flex flex-col items-center gap-1.5 ${className}`}
      >
        {/* Top Action & Phase Bar */}
        <div
          className={`px-4 py-1.5 rounded-xl border font-mono text-xs flex items-center gap-2.5 shadow-lg ${
            isLight
              ? 'bg-white/95 border-neutral-300 text-neutral-800'
              : 'bg-neutral-900/92 border-neutral-700/80 text-neutral-200'
          }`}
        >
          {phase === 'ended' || phase === 'podium' ? (
            <>
              <span
                className={`font-black uppercase tracking-wider ${
                  winner === 'BLUE'
                    ? 'text-sky-500'
                    : winner === 'ORANGE'
                    ? 'text-amber-500'
                    : isLight
                    ? 'text-neutral-900'
                    : 'text-neutral-200'
                }`}
              >
                {winner === 'BLUE'
                  ? 'BLUE WINS!'
                  : winner === 'ORANGE'
                  ? 'ORANGE WINS!'
                  : 'DRAW!'}
                {winReason && winReason !== 'SCORE' ? ` (${winReason})` : ''}
              </span>
              <button
                type="button"
                onClick={onVoteRematch}
                className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase cursor-pointer transition-colors"
              >
                Rematch Ready
              </button>
              <button
                type="button"
                onClick={onExitRoom}
                className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-neutral-200 hover:bg-neutral-300 border-neutral-300 text-neutral-700'
                    : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-200'
                }`}
              >
                Exit Room
              </button>
            </>
          ) : (
            <>
              <span className="text-xs uppercase tracking-wider font-extrabold text-rose-500 animate-pulse">
                {phase === 'goal' ? 'GOAL SCORED' : 'GOAL REPLAY'}
              </span>
              {phase === 'replay' && (
                <>
                  <button
                    type="button"
                    onClick={onTogglePause}
                    className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                      isLight
                        ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                        : 'bg-neutral-800/90 hover:bg-neutral-700 border-neutral-600/70 text-neutral-200'
                    }`}
                  >
                    {replayPaused ? '[P] Play' : '[P] Pause'}
                  </button>
                  <button
                    type="button"
                    onClick={onToggleCameraMode}
                    className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                      isLight
                        ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-neutral-800/90 hover:bg-neutral-700 border-neutral-600/70 text-amber-300'
                    }`}
                  >
                    Cam: {replayCameraMode === 'director' ? 'Director' : 'POV'}
                  </button>
                  {(replayPersistent || replayPaused) && (
                    <button
                      type="button"
                      onClick={onCycleSpeed}
                      className={`px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer transition-colors tabular-nums ${
                        isLight
                          ? 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-800'
                          : 'bg-neutral-800/90 hover:bg-neutral-700 border-neutral-600/70 text-sky-300'
                      }`}
                    >
                      {replaySpeed}x
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={onSkipReplay}
                className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-neutral-200 hover:bg-neutral-300 border-neutral-300 text-neutral-700'
                    : 'bg-neutral-700/70 hover:bg-neutral-600 border-neutral-500/50 text-neutral-200'
                }`}
              >
                Skip Replay
              </button>
            </>
          )}
        </div>

        {/* Goal Scorer, Ball Speed & Assist Telemetry Pill */}
        {(phase === 'goal' || phase === 'replay') &&
          (scorerName || typeof ballSpeedKph === 'number') && (
            <div
              className={`px-3.5 py-1 rounded-lg border font-mono text-[11px] flex items-center gap-3 shadow-md ${
                isLight
                  ? 'bg-white/95 border-neutral-300 text-neutral-800'
                  : 'bg-neutral-900/92 border-neutral-700/80 text-neutral-200'
              }`}
            >
              {scorerName && (
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-400 uppercase text-[10px]">Scorer:</span>
                  <span
                    className={`font-extrabold uppercase ${
                      isBlueScorer
                        ? 'text-sky-500'
                        : isOrangeScorer
                        ? 'text-amber-500'
                        : isLight
                        ? 'text-neutral-900'
                        : 'text-white'
                    }`}
                  >
                    {scorerName}
                  </span>
                </div>
              )}
              {typeof ballSpeedKph === 'number' && (
                <>
                  {scorerName && <span className="text-neutral-500 opacity-50">|</span>}
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400 uppercase text-[10px]">Speed:</span>
                    <span className="font-bold text-emerald-500 tabular-nums">
                      {ballSpeedKph} KM/H
                    </span>
                  </div>
                </>
              )}
              {assistName && (
                <>
                  <span className="text-neutral-500 opacity-50">|</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400 uppercase text-[10px]">Assist:</span>
                    <span className="font-semibold uppercase">{assistName}</span>
                  </div>
                </>
              )}
            </div>
          )}

        {/* Interactive Replay Timeline Scrubber Bar */}
        {phase === 'replay' && (replayPersistent || replayPaused) && (
          <div
            className={`px-3 py-1 rounded-lg border flex items-center gap-2.5 font-mono text-[10px] shadow-md ${
              isLight
                ? 'bg-white/95 border-neutral-300 text-neutral-700'
                : 'bg-neutral-900/92 border-neutral-700/80 text-neutral-300'
            }`}
          >
            <span className="text-rose-500 font-bold">SCRUB</span>
            <input
              ref={rangeInputRef}
              type="range"
              min={0}
              max={1000}
              defaultValue={Math.round((replayProgress || 0) * 1000)}
              onChange={(e) => {
                const norm = Number(e.target.value) / 1000;
                onSeekNormalized?.(norm);
              }}
              className="w-36 h-1.5 accent-amber-500 cursor-pointer"
            />
            <span ref={frameReadoutRef} className="text-neutral-400 tabular-nums">
              {replayFrameIndex}/{Math.max(1, replayTotalFrames)}
            </span>
          </div>
        )}

        {/* Post-Match Podium Celebration Sub-Banner */}
        {(phase === 'podium' || phase === 'ended') && (
          <div
            className={`px-3 py-0.5 rounded-lg border font-mono text-[10px] tracking-wide ${
              isLight
                ? 'bg-white/85 border-neutral-300 text-neutral-700'
                : 'bg-neutral-900/80 border-neutral-700/60 text-neutral-300'
            }`}
          >
            PODIUM SHOWCASE — JUMP / BOOST / AIR ROLL TO CELEBRATE
          </div>
        )}
      </div>
    );
  })
);

ReplayControlBannerHUD.displayName = 'ReplayControlBannerHUD';
