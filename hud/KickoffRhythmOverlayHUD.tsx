import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  KickoffKeyId,
  KickoffTransientFrame,
  KickoffTransientListener,
} from './types';
import {
  KICKOFF_RHYTHM_KEY_ORDER,
  KickoffSpawnPreset,
  DEFAULT_KICKOFF_SPAWNS,
  KickoffNoteBar,
  DEFAULT_KICKOFF_NOTE_BARS,
  KickoffSubMode,
  KickoffEpisodePhase,
  LANE_META,
  LANE_GAP_PX,
  HIGHWAY_PAD_X,
  HIGHWAY_HEIGHT_PX,
  TOTAL_HIGHWAY_WIDTH_PX,
  paintKickoffHighway,
} from './kickoffRhythmConfig';

export type {
  KickoffKeyId,
  KickoffSpawnPreset,
  KickoffNoteBar,
  KickoffSubMode,
  KickoffEpisodePhase,
};
export {
  KICKOFF_RHYTHM_KEY_ORDER,
  DEFAULT_KICKOFF_SPAWNS,
  DEFAULT_KICKOFF_NOTE_BARS,
};

export interface KickoffRhythmOverlayHandle {
  /** Imperatively push a 120Hz frame update with zero React re-renders */
  setFrame: (frame: KickoffTransientFrame) => void;
}

export interface KickoffRhythmOverlayHUDProps {
  isLight?: boolean;
  subMode?: KickoffSubMode;
  phase?: KickoffEpisodePhase;
  spawnIndex?: number;
  spawns?: KickoffSpawnPreset[];
  onSelectSpawn?: (spawnIndex: number) => void;
  showFallingNotes?: boolean;
  /** Vertical offset % for W (shifts up) and S (shifts down), 0 ~ 50 */
  wsVerticalOffsetPct?: number;
  /** Current 120Hz episode tick */
  episodeTick?: number;
  /** Countdown ticks remaining (120 ticks = 1.00s) */
  countdownRemainingTicks?: number;
  /** Pre-computed note bars along the 120Hz timeline */
  noteBars?: KickoffNoteBar[];
  /** Lookahead window in 120Hz ticks (default: 76 ticks ≈ 0.63s) */
  lookaheadTicks?: number;
  /** AI benchmark touch tick */
  aiTouchTick?: number | null;
  /** Player touch tick */
  playerTouchTick?: number | null;
  /** Delta ticks (playerTouchTick - aiTouchTick) */
  lastDeltaTicks?: number | null;
  /** Required AI keys at current tick */
  requiredKeys?: Partial<Record<KickoffKeyId, boolean>>;
  /** Formatted string of required keys for prompt banner */
  requiredKeyStr?: string;
  /** Currently pressed player keys */
  playerKeys?: Partial<Record<KickoffKeyId, boolean>>;
  /** Optional 120Hz transient frame subscription (0 React VDOM re-renders) */
  subscribeKickoffFrame?: (listener: KickoffTransientListener) => () => void;
  className?: string;
}

/**
 * KickoffRhythmOverlayHUD
 * High-Performance 120Hz DDR Falling-Note Highway + 9-Key Receptor Row + Touch Delta Bar.
 *
 * Architectural Upgrade over RocketCompanion's `KickoffKeyboardOverlay`:
 * - 100% pure presentational / props-driven (zero business store imports).
 * - The 9-lane falling note highway renders onto a cached 1:1 DPR 2D Canvas (`ctxRef`)
 *   instead of diffing/allocating React DOM nodes across 9 lanes at 120Hz.
 * - Receptor keys and timing readouts mutate DOM refs directly with dirty-checking when
 *   driven via `subscribeKickoffFrame` or `ref.current.setFrame(...)` (0 React re-renders).
 */
export const KickoffRhythmOverlayHUD = React.memo(
  forwardRef<KickoffRhythmOverlayHandle, KickoffRhythmOverlayHUDProps>(
    (
      {
        isLight = true,
        subMode = 'easy-learning',
        phase = 'running',
        spawnIndex = 0,
        spawns = DEFAULT_KICKOFF_SPAWNS,
        onSelectSpawn,
        showFallingNotes = true,
        wsVerticalOffsetPct = 15,
        episodeTick = 32,
        countdownRemainingTicks = 0,
        noteBars = DEFAULT_KICKOFF_NOTE_BARS,
        lookaheadTicks = 76,
        aiTouchTick = 202,
        playerTouchTick = null,
        lastDeltaTicks = null,
        requiredKeys = { W: true, Boost: true },
        requiredKeyStr = 'W + Boost',
        playerKeys = { W: true, Boost: true },
        subscribeKickoffFrame,
        className = '',
      },
      ref
    ) => {
      const rootRef = useRef<HTMLDivElement | null>(null);
      const isVisibleRef = useRef<boolean>(true);
      const canvasRef = useRef<HTMLCanvasElement | null>(null);
      const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
      const youReadoutRef = useRef<HTMLSpanElement | null>(null);
      const aiReadoutRef = useRef<HTMLSpanElement | null>(null);
      const keyBoxRefs = useRef<Record<KickoffKeyId, HTMLDivElement | null>>({
        Shift: null,
        Q: null,
        A: null,
        W: null,
        S: null,
        D: null,
        E: null,
        Boost: null,
        Jump: null,
      });
      const keyDotRefs = useRef<Record<KickoffKeyId, HTMLSpanElement | null>>({
        Shift: null,
        Q: null,
        A: null,
        W: null,
        S: null,
        D: null,
        E: null,
        Boost: null,
        Jump: null,
      });

      useEffect(() => {
        const el = rootRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        const obs = new IntersectionObserver(
          (entries) => {
            if (entries[0]) {
              isVisibleRef.current = entries[0].isIntersecting;
            }
          },
          { rootMargin: '120px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
      }, []);

      const paintHighway = useCallback(
        (tick: number) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          let ctx = ctxRef.current;
          if (!ctx) {
            ctx = canvas.getContext('2d');
            ctxRef.current = ctx;
          }
          if (!ctx) return;
          paintKickoffHighway(ctx, tick, noteBars, lookaheadTicks, isLight);
        },
        [noteBars, lookaheadTicks, isLight]
      );

    const applyFrameToDom = useCallback(
      (frame: KickoffTransientFrame) => {
        if (!isVisibleRef.current) return;
        const tick = frame.episodeTick ?? 0;
        if (showFallingNotes) {
          paintHighway(tick);
        }

        const aiTick = frame.aiTouchTick !== undefined ? frame.aiTouchTick : aiTouchTick;
        const pTick = frame.playerTouchTick !== undefined ? frame.playerTouchTick : playerTouchTick;
        const delta = frame.lastDeltaTicks !== undefined ? frame.lastDeltaTicks : lastDeltaTicks;

        if (aiReadoutRef.current) {
          const nextAiText = `AI: ${
            aiTick ? `${(aiTick / 120).toFixed(2)}s (${aiTick}f)` : '--'
          }`;
          if (aiReadoutRef.current.textContent !== nextAiText) {
            aiReadoutRef.current.textContent = nextAiText;
          }
        }

        if (youReadoutRef.current) {
          const nextYouText = `YOU: ${
            pTick
              ? `${(pTick / 120).toFixed(2)}s (${
                  delta !== null && delta !== undefined && delta > 0 ? `+${delta}f` : `${delta ?? 0}f`
                })`
              : `${(tick / 120).toFixed(2)}s`
          }`;
          if (youReadoutRef.current.textContent !== nextYouText) {
            youReadoutRef.current.textContent = nextYouText;
          }
        }

        // Update 9-key receptor row if requiredKeys or playerKeys provided
        const reqMap = frame.requiredKeys ?? requiredKeys;
        const playMap = frame.playerKeys ?? playerKeys;

        for (let i = 0; i < KICKOFF_RHYTHM_KEY_ORDER.length; i++) {
          const k = KICKOFF_RHYTHM_KEY_ORDER[i];
          const box = keyBoxRefs.current[k];
          const dot = keyDotRefs.current[k];
          if (!box) continue;

          const aiActive = Boolean(reqMap?.[k]);
          const playerActive = Boolean(playMap?.[k]);
          const stateKey = `${aiActive ? 1 : 0}-${playerActive ? 1 : 0}-${isLight ? 1 : 0}`;
          if (box.dataset.stateKey !== stateKey) {
            box.dataset.stateKey = stateKey;
            if (aiActive && playerActive) {
              box.style.borderColor = '#10b981';
              box.style.backgroundColor = isLight
                ? 'rgba(16, 185, 129, 0.25)'
                : 'rgba(16, 185, 129, 0.35)';
              box.style.boxShadow = '0 0 0 1px rgba(52, 211, 153, 0.55)';
            } else if (aiActive && !playerActive) {
              box.style.borderColor = LANE_META[k].strokeHex;
              box.style.backgroundColor = isLight
                ? 'rgba(14, 165, 233, 0.2)'
                : 'rgba(56, 189, 248, 0.22)';
              box.style.boxShadow = `0 0 0 1px ${LANE_META[k].strokeHex}`;
            } else if (!aiActive && playerActive) {
              box.style.borderColor = '#f59e0b';
              box.style.backgroundColor = 'rgba(245, 158, 11, 0.25)';
              box.style.boxShadow = '0 0 0 1px rgba(251, 191, 36, 0.55)';
            } else {
              box.style.borderColor = '';
              box.style.backgroundColor = '';
              box.style.boxShadow = '';
            }
          }

          if (dot) {
            dot.style.display = playerActive ? 'block' : 'none';
            dot.style.backgroundColor = aiActive ? '#34d399' : '#fbbf24';
          }
        }
      },
      [
        showFallingNotes,
        paintHighway,
        aiTouchTick,
        playerTouchTick,
        lastDeltaTicks,
        requiredKeys,
        playerKeys,
        isLight,
      ]
    );

    useImperativeHandle(
      ref,
      () => ({
        setFrame: applyFrameToDom,
      }),
      [applyFrameToDom]
    );

    useEffect(() => {
      applyFrameToDom({
        episodeTick,
        countdownRemainingTicks,
        aiTouchTick,
        playerTouchTick,
        lastDeltaTicks,
        requiredKeys,
        playerKeys,
      });
    }, [
      episodeTick,
      countdownRemainingTicks,
      aiTouchTick,
      playerTouchTick,
      lastDeltaTicks,
      requiredKeys,
      playerKeys,
      applyFrameToDom,
    ]);

    useEffect(() => {
      if (!subscribeKickoffFrame) return;
      return subscribeKickoffFrame(applyFrameToDom);
    }, [subscribeKickoffFrame, applyFrameToDom]);

    return (
      <div
        ref={rootRef}
        data-ui-element="hud-kickoff-rhythm-overlay"
        className={`flex flex-col gap-1.5 select-none pointer-events-auto ${className}`}
        style={{ width: `${TOTAL_HIGHWAY_WIDTH_PX}px` }}
      >
        {/* Top Status & Spawn Bar */}
        <div
          className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono ${
            isLight
              ? 'bg-white/95 border-neutral-300 text-neutral-800 shadow-md'
              : 'bg-neutral-950/95 border-neutral-800 text-neutral-200 shadow-md'
          }`}
        >
          <div className="flex items-center gap-1">
            {spawns.map((sp) => {
              const active = sp.index === spawnIndex;
              return (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => onSelectSpawn?.(sp.index)}
                  title={`Switch to ${sp.label} (Hotkey ${sp.key})`}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border ${
                    active
                      ? isLight
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-amber-500 text-neutral-950 border-amber-400 shadow-xs'
                      : isLight
                      ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-neutral-300'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {sp.key}:{sp.shortLabel}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[10px] tabular-nums">
            <span
              ref={aiReadoutRef}
              className={`font-semibold ${isLight ? 'text-sky-600' : 'text-sky-400'}`}
            >
              AI: {aiTouchTick ? `${(aiTouchTick / 120).toFixed(2)}s (${aiTouchTick}f)` : '--'}
            </span>
            <span className="opacity-40">|</span>
            <span
              ref={youReadoutRef}
              className={
                playerTouchTick
                  ? lastDeltaTicks !== null && lastDeltaTicks <= 0
                    ? isLight
                      ? 'text-emerald-600 font-bold'
                      : 'text-emerald-400 font-bold'
                    : isLight
                    ? 'text-amber-600 font-bold'
                    : 'text-amber-400 font-bold'
                  : isLight
                  ? 'text-neutral-600 font-semibold'
                  : 'text-neutral-300 font-semibold'
              }
            >
              YOU: {(episodeTick / 120).toFixed(2)}s
            </span>
          </div>
        </div>

        {/* Mode Prompt Banners */}
        {phase === 'paused-mismatch' && subMode === 'easy-learning' && (
          <div
            className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold flex items-center justify-between shadow-md ${
              isLight
                ? 'border-amber-500/80 bg-amber-100/95 text-amber-950'
                : 'border-amber-400/70 bg-amber-950/90 text-amber-200'
            }`}
          >
            <span>EASY LEARNING STEP-GATE · MATCH AI KEYS:</span>
            <span className="px-2 py-0.5 rounded bg-amber-400 text-neutral-950 font-black">
              {requiredKeyStr}
            </span>
          </div>
        )}

        {phase === 'waiting-for-input' && subMode === 'instant' && (
          <div
            className={`px-3 py-1 rounded-xl border font-mono text-[11px] flex items-center justify-between ${
              isLight
                ? 'border-sky-500/50 bg-sky-100/95 text-sky-900'
                : 'border-sky-500/40 bg-sky-950/90 text-sky-300'
            }`}
          >
            <span>INSTANT READY (30f SETTLED)</span>
            <span className={`font-bold ${isLight ? 'text-sky-950' : 'text-sky-200'}`}>
              Press ({requiredKeyStr})
            </span>
          </div>
        )}

        {phase === 'countdown' && subMode === 'realistic' && (
          <div
            className={`px-3 py-1 rounded-xl border font-mono text-[11px] flex items-center justify-between ${
              isLight
                ? 'border-emerald-500/50 bg-emerald-100/95 text-emerald-900'
                : 'border-emerald-500/40 bg-emerald-950/90 text-emerald-300'
            }`}
          >
            <span>REALISTIC COUNTDOWN</span>
            <span className="font-bold tabular-nums">
              {(countdownRemainingTicks / 120).toFixed(2)}s ({countdownRemainingTicks}f)
            </span>
          </div>
        )}

        {/* 120Hz Zero-Allocation Canvas Falling Note Highway */}
        {showFallingNotes && (
          <div
            className={`relative rounded-t-xl border-x border-t overflow-hidden ${
              isLight
                ? 'bg-white/95 border-neutral-300'
                : 'bg-neutral-950/95 border-neutral-800'
            }`}
            style={{ height: `${HIGHWAY_HEIGHT_PX}px` }}
          >
            <canvas
              ref={canvasRef}
              width={TOTAL_HIGHWAY_WIDTH_PX}
              height={HIGHWAY_HEIGHT_PX}
              className="block w-full h-full pointer-events-none"
            />
          </div>
        )}

        {/* 9-Key Receptor Row with configurable W/S Vertical Offset */}
        <div
          className={`flex items-center gap-[6px] px-2 py-3 rounded-b-xl border ${
            !showFallingNotes ? 'rounded-t-xl' : ''
          } ${
            isLight
              ? 'bg-white/95 border-neutral-300 shadow-md'
              : 'bg-neutral-950/95 border-neutral-800 shadow-md'
          }`}
        >
          {KICKOFF_RHYTHM_KEY_ORDER.map((keyName) => {
            const meta = LANE_META[keyName];
            let verticalTransform = 'translateY(0%)';
            if (keyName === 'W') {
              verticalTransform = `translateY(-${wsVerticalOffsetPct}%)`;
            } else if (keyName === 'S') {
              verticalTransform = `translateY(${wsVerticalOffsetPct}%)`;
            }

            return (
              <div
                key={keyName}
                ref={(el) => {
                  keyBoxRefs.current[keyName] = el;
                }}
                style={{
                  width: `${meta.widthPx}px`,
                  transform: verticalTransform,
                }}
                className={`relative h-12 rounded-lg border flex flex-col items-center justify-center transition-colors duration-75 font-mono ${
                  isLight
                    ? 'bg-neutral-100 border-neutral-300 text-neutral-700'
                    : 'bg-neutral-900/90 border-neutral-700/80 text-neutral-300'
                }`}
              >
                <span className="text-[11px] font-black leading-none tracking-tight">
                  {meta.label}
                </span>
                <span className="text-[8px] uppercase opacity-70 mt-0.5 leading-none">
                  {meta.subLabel}
                </span>
                <span
                  ref={(el) => {
                    keyDotRefs.current[keyName] = el;
                  }}
                  style={{ display: 'none' }}
                  className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  })
);

KickoffRhythmOverlayHUD.displayName = 'KickoffRhythmOverlayHUD';
