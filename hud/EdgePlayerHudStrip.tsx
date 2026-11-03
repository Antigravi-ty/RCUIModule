import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  DEFAULT_DEMO_INDICATOR_CONFIG,
  DEFAULT_SKIP_INDICATOR_CONFIG,
  DEFAULT_INITIAL_ROSTER,
  EdgeDemoIndicatorConfig,
  EdgeSkipIndicatorConfig,
  EdgePlayerSlotState,
  EdgeRosterHudState,
  HudRosterViewMode,
  RosterTransientListener,
  resolveDemoIndicatorConfig,
  resolveSkipIndicatorConfig,
} from '../stores/hudTransientTypes';
import {
  BombEmojiSvg,
  ReplaySkipCheckSvg,
  buildSvgDropShadowFilter,
} from '../primitives/svg/packagedSvgDefinitions';
import {
  applyEdgePlayerSlotDom,
  createEmptyCardRefs,
  KEY_BADGE_WIDTH_PX,
  MAX_TEAM_SLOTS,
  type CardDomRefs,
} from './edgePlayerSlotDomUpdater';

export interface EdgePlayerHudStripHandle {
  /** Imperatively push roster state to DOM refs with zero React re-renders */
  setRoster: (roster: EdgeRosterHudState) => void;
}

export interface EdgePlayerHudStripProps {
  /** Which screen edge this vertical player stack attaches to */
  side: 'left' | 'right';
  /** Optional viewMode override (falls back to roster.viewMode or 'player-live') */
  viewMode?: HudRosterViewMode;
  players?: EdgePlayerSlotState[];
  /** Team color for this side (default: left = Blue #2563EB, right = Orange #EA580C) */
  teamColor?: string;
  /** Progress bar fill color (default: bright team accent) */
  barColor?: string;
  /** Light/Dark theme for default (unfocused) card surface */
  isLight?: boolean;
  /**
   * Optional demolished indicator configuration override (Bomb SVG vs Red Cross, strokeWidth, color, glow).
   * Merges over `roster.demoIndicatorConfig` when provided.
   */
  demoIndicatorConfig?: Partial<EdgeDemoIndicatorConfig>;
  /**
   * Optional replay skip / auxiliary extension card configuration override.
   * Merges over `roster.skipIndicatorConfig` when provided.
   */
  skipIndicatorConfig?: Partial<EdgeSkipIndicatorConfig>;
  /** Optional callback when user clicks a card or presses 1-6 to switch POV */
  onSelectSlot?: (slotKey: 1 | 2 | 3 | 4 | 5 | 6) => void;
  /**
   * High-efficiency Transient Channel subscription (0 React re-renders).
   * Updates card transforms, POV highlight, demolished indicator & 3s countdown bar, and 120Hz boost via DOM refs.
   */
  subscribeRoster?: (listener: RosterTransientListener) => () => void;
  className?: string;
}

const EdgePlayerHudStripInner = forwardRef<EdgePlayerHudStripHandle, EdgePlayerHudStripProps>(
  (
    {
      side, viewMode, players,
      teamColor = side === 'left' ? '#2563EB' : '#EA580C',
      barColor = side === 'left' ? '#3B82F6' : '#F97316',
      isLight = true, demoIndicatorConfig, skipIndicatorConfig,
      onSelectSlot, subscribeRoster, className = '',
    },
    ref
  ) => {
    const stripContainerRef = useRef<HTMLDivElement | null>(null);
    const cardRefs = useRef<CardDomRefs[]>([
      createEmptyCardRefs(side === 'left' ? 1 : 4),
      createEmptyCardRefs(side === 'left' ? 2 : 5),
      createEmptyCardRefs(side === 'left' ? 3 : 6),
      createEmptyCardRefs(side === 'left' ? 4 : 5),
      createEmptyCardRefs(side === 'left' ? 5 : 6),
    ]);

    const defaultPlayers =
      players ??
      (side === 'left' ? DEFAULT_INITIAL_ROSTER.leftPlayers : DEFAULT_INITIAL_ROSTER.rightPlayers);
    const isRight = side === 'right';

    const applySlotDom = useCallback(
      (
        slot: EdgePlayerSlotState | undefined,
        refs: CardDomRefs,
        currentMode: HudRosterViewMode,
        slotIndex: number,
        visualRowIndex: number,
        resolvedDemoCfg: EdgeDemoIndicatorConfig,
        resolvedSkipCfg: EdgeSkipIndicatorConfig
      ) => {
        applyEdgePlayerSlotDom({
          side,
          teamColor,
          barColor,
          isLight,
          slot,
          refs,
          currentMode,
          slotIndex,
          visualRowIndex,
          resolvedDemoCfg,
          resolvedSkipCfg,
        });
      },
      [side, teamColor, barColor, isLight]
    );

    const applyRoster = useCallback(
      (roster: EdgeRosterHudState) => {
        const list = side === 'left' ? roster.leftPlayers : roster.rightPlayers;
        const effectiveMode: HudRosterViewMode = viewMode ?? roster.viewMode ?? 'player-live';
        const isLiveRightCompact =
          side === 'right' &&
          effectiveMode === 'player-live' &&
          roster.opponentDemoCompact !== false;

        const resolvedDemoCfg = resolveDemoIndicatorConfig(
          demoIndicatorConfig,
          resolveDemoIndicatorConfig(roster.demoIndicatorConfig)
        );
        const resolvedSkipCfg = resolveSkipIndicatorConfig(
          skipIndicatorConfig,
          resolveSkipIndicatorConfig(roster.skipIndicatorConfig)
        );

        let existingRankCounter = 0;
        const existingRanks: number[] = [0, 1, 2, 3, 4];
        for (let i = 0; i < MAX_TEAM_SLOTS; i++) {
          const s = list[i];
          if (s && s.exists !== false) {
            existingRanks[i] = existingRankCounter++;
          } else {
            existingRanks[i] = i;
          }
        }

        const demoVisualRanks: number[] = [...existingRanks];
        if (isLiveRightCompact) {
          const demoIndices: number[] = [];
          for (let i = 0; i < MAX_TEAM_SLOTS; i++) {
            const s = list[i];
            if (s && s.exists !== false && s.isDemolished) {
              demoIndices.push(i);
            }
          }
          demoIndices.sort((a, b) => {
            const tA = list[a]?.demolishedAtMs ?? 0;
            const tB = list[b]?.demolishedAtMs ?? 0;
            if (tA > 0 && tB > 0 && tA !== tB) return tA - tB;
            const remA = list[a]?.demoRespawnRemainingSec ?? 3.0;
            const remB = list[b]?.demoRespawnRemainingSec ?? 3.0;
            if (Math.abs(remA - remB) > 0.001) return remA - remB;
            return a - b;
          });
          for (let r = 0; r < demoIndices.length; r++) {
            demoVisualRanks[demoIndices[r]] = r;
          }
        }

        for (let i = 0; i < MAX_TEAM_SLOTS; i++) {
          const slot = list[i];
          const refs = cardRefs.current[i];
          if (refs) {
            applySlotDom(
              slot,
              refs,
              effectiveMode,
              existingRanks[i],
              demoVisualRanks[i],
              resolvedDemoCfg,
              resolvedSkipCfg
            );
          }
        }
      },
      [side, viewMode, applySlotDom, demoIndicatorConfig, skipIndicatorConfig]
    );

    useImperativeHandle(ref, () => ({ setRoster: applyRoster }), [applyRoster]);

    useEffect(() => {
      if (subscribeRoster) return subscribeRoster(applyRoster);
      const resolvedDemoCfg = resolveDemoIndicatorConfig(demoIndicatorConfig);
      const resolvedSkipCfg = resolveSkipIndicatorConfig(skipIndicatorConfig);
      const effectiveMode: HudRosterViewMode = viewMode ?? 'player-live';
      let rankCounter = 0;
      for (let i = 0; i < MAX_TEAM_SLOTS; i++) {
        const slot = defaultPlayers[i];
        const refs = cardRefs.current[i];
        if (refs) {
          const r = slot && slot.exists !== false ? rankCounter++ : i;
          applySlotDom(slot, refs, effectiveMode, r, r, resolvedDemoCfg, resolvedSkipCfg);
        }
      }
    }, [subscribeRoster, applyRoster, applySlotDom, defaultPlayers, viewMode, demoIndicatorConfig, skipIndicatorConfig]);

    const shapeClass =
      side === 'left' ? 'rounded-r-[9px] rounded-l-none' : 'rounded-l-[9px] rounded-r-none';
    const initialDemoCfg = resolveDemoIndicatorConfig(demoIndicatorConfig);
    const initialSkipCfg = resolveSkipIndicatorConfig(skipIndicatorConfig);
    const initUnderlapPx = Math.max(0, Math.round(initialSkipCfg.underlapPx ?? 20));
    const initProtrudePx = Math.max(20, Math.round(initialSkipCfg.protrudeWidthPx ?? 34));
    const initRadiusPx = Math.max(0, Math.round(initialSkipCfg.cardRadiusPx ?? 9));

    return (
      <div
        ref={stripContainerRef}
        data-ui-element={`hud-edge-player-strip-${side}`}
        className={`flex flex-col gap-2 select-none pointer-events-auto ${
          side === 'left' ? 'items-start' : 'items-end'
        } ${className}`}
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        {[0, 1, 2, 3, 4].map((idx) => {
          const initialSlot = defaultPlayers[idx];
          const fallbackKey = Math.min(6, Math.max(1, side === 'left' ? idx + 1 : idx + 4)) as
            | 1 | 2 | 3 | 4 | 5 | 6;
          const slotKey = initialSlot?.slotKey ?? fallbackKey;
          const initShowSkip = Boolean(initialSlot?.replaySkipReady);
          const innerLine = isLight ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.14)';
          const outerRing = isLight ? 'rgba(115, 115, 115, 0.32)' : 'rgba(113, 113, 122, 0.55)';
          const outerSideInset =
            side === 'left'
              ? `inset -1px 0 0 0 ${innerLine}`
              : `inset 1px 0 0 0 ${innerLine}`;

          return (
            <div
              key={idx}
              ref={(el) => { cardRefs.current[idx].rowWrapEl = el; }}
              className={`flex items-center gap-0 will-change-transform transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isRight ? 'flex-row-reverse' : 'flex-row'
              }`}
              style={{ display: initialSlot && initialSlot.exists !== false ? 'flex' : 'none' }}
            >
              <div
                ref={(el) => { cardRefs.current[idx].cardEl = el; }}
                onClick={() => onSelectSlot?.(cardRefs.current[idx].currentSlotKey)}
                title={`Press [${slotKey}] to observe ${initialSlot?.name ?? `Player ${slotKey}`}`}
                className={`group relative z-20 shrink-0 flex flex-col overflow-hidden cursor-pointer ${shapeClass}`}
                style={{ width: '196px' }}
              >
                <div className={`flex items-center h-[32px] w-full ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div
                    ref={(el) => { cardRefs.current[idx].keyBadgeEl = el; }}
                    className={`flex items-center justify-center shrink-0 h-full text-[11px] font-normal tabular-nums ${
                      isRight ? 'border-l' : 'border-r'
                    } border-black/10 transition-colors duration-200`}
                    style={{ width: `${KEY_BADGE_WIDTH_PX}px`, fontWeight: 400 }}
                  >
                    {slotKey}
                  </div>

                  <div
                    className={`flex items-center gap-1 min-w-0 flex-1 ${
                      isRight
                        ? 'flex-row-reverse pr-2.5 pl-1.5 justify-start'
                        : 'flex-row pl-2.5 pr-1.5 justify-start'
                    }`}
                  >
                    <span
                      ref={(el) => { cardRefs.current[idx].nameEl = el; }}
                      className={`truncate text-[12px] leading-snug tracking-tight ${
                        isRight ? 'text-right' : 'text-left'
                      }`}
                      style={{ fontWeight: 400 }}
                    >
                      {initialSlot?.name ?? `Player ${slotKey}`}
                    </span>
                    <span
                      ref={(el) => { cardRefs.current[idx].selfTagEl = el; }}
                      className="shrink-0 px-1 py-[1px] rounded text-[8px] uppercase tracking-wider bg-black/20 text-current opacity-80"
                      style={{ display: initialSlot?.isSelf ? 'inline-block' : 'none' }}
                    >
                      YOU
                    </span>
                  </div>

                  <div
                    className={`flex items-center shrink-0 ${
                      isRight ? 'justify-start pl-2.5 pr-1' : 'justify-end pr-2.5 pl-1'
                    }`}
                  >
                    <span
                      ref={(el) => { cardRefs.current[idx].boostTextEl = el; }}
                      className={`inline-block w-[3ch] text-[13px] leading-none tabular-nums tracking-tight ${
                        isRight ? 'text-left' : 'text-right'
                      }`}
                      style={{ fontWeight: 400 }}
                    >
                      {initialSlot?.boostAmount ?? 100}
                    </span>

                    <span
                      ref={(el) => { cardRefs.current[idx].demoCrossEl = el; }}
                      className={`items-center min-w-[3ch] overflow-visible text-[15px] leading-none font-bold ${
                        isRight ? 'justify-start text-left' : 'justify-end text-right'
                      }`}
                      style={{
                        display: 'none',
                        color: initialDemoCfg.color,
                        filter: buildSvgDropShadowFilter(
                          initialDemoCfg.glowColor,
                          initialDemoCfg.glowBlurPx,
                          initialDemoCfg.glowIntensityPct
                        ),
                      }}
                    >
                      x
                    </span>

                    <span
                      ref={(el) => { cardRefs.current[idx].demoBombWrapEl = el; }}
                      className={`items-center min-w-[3ch] overflow-visible leading-none ${
                        isRight ? 'justify-start text-left' : 'justify-end text-right'
                      }`}
                      style={{
                        display: 'none',
                        color: initialDemoCfg.color,
                        filter: buildSvgDropShadowFilter(
                          initialDemoCfg.glowColor,
                          initialDemoCfg.glowBlurPx,
                          initialDemoCfg.glowIntensityPct
                        ),
                      }}
                    >
                      <BombEmojiSvg
                        size={initialDemoCfg.sizePx}
                        color={initialDemoCfg.color}
                        strokeWidth={initialDemoCfg.strokeWidth}
                      />
                    </span>
                  </div>
                </div>

                <div
                  ref={(el) => { cardRefs.current[idx].barTrackEl = el; }}
                  className="relative w-full h-[5px] bg-[#09090B] overflow-hidden"
                >
                  <div
                    ref={(el) => { cardRefs.current[idx].barFillEl = el; }}
                    className={`h-full w-full ${
                      isRight ? 'origin-right' : 'origin-left'
                    } will-change-transform transition-colors duration-150`}
                    style={{
                      backgroundColor: barColor,
                      transform: `scaleX(${((initialSlot?.boostAmount ?? 100) / 100).toFixed(3)})`,
                    }}
                  />
                </div>
              </div>

              <div
                ref={(el) => { cardRefs.current[idx].skipClipWrapEl = el; }}
                className="relative z-10 shrink-0 flex items-center"
                style={{
                  marginLeft: side === 'left' ? `-${initUnderlapPx}px` : '0px',
                  marginRight: side === 'right' ? `-${initUnderlapPx}px` : '0px',
                  clipPath:
                    side === 'left'
                      ? 'inset(-4px -18px -4px 0px)'
                      : 'inset(-4px 0px -4px -18px)',
                }}
              >
                <div
                  ref={(el) => { cardRefs.current[idx].skipBadgeEl = el; }}
                  data-ui-element={`hud-edge-player-skip-ready-${slotKey}`}
                  title={`Player #${slotKey} Ready / Skip Goal Replay`}
                  className="h-[37px] shrink-0 flex items-center justify-center will-change-transform transition-transform ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    width: `${initUnderlapPx + initProtrudePx}px`,
                    paddingLeft: side === 'left' ? `${initUnderlapPx}px` : '0px',
                    paddingRight: side === 'right' ? `${initUnderlapPx}px` : '0px',
                    borderRadius:
                      side === 'left'
                        ? `0px ${initRadiusPx}px ${initRadiusPx}px 0px`
                        : `${initRadiusPx}px 0px 0px ${initRadiusPx}px`,
                    backgroundColor: isLight
                      ? 'rgba(255, 255, 255, 0.98)'
                      : 'rgba(20, 20, 25, 0.98)',
                    boxShadow: `0 0 0 1.5px ${outerRing}, ${outerSideInset}, inset 0 1px 0 0 ${innerLine}, inset 0 -1px 0 0 ${innerLine}`,
                    transitionDuration: `${
                      initShowSkip
                        ? initialSkipCfg.enterDurationMs
                        : initialSkipCfg.exitDurationMs
                    }ms`,
                    transform: initShowSkip
                      ? 'translate3d(0%, 0, 0)'
                      : side === 'left'
                      ? 'translate3d(-112%, 0, 0)'
                      : 'translate3d(112%, 0, 0)',
                    pointerEvents: initShowSkip ? 'auto' : 'none',
                  }}
                >
                  <ReplaySkipCheckSvg
                    variant={initialSlot?.skipIndicatorVariant ?? initialSkipCfg.variant}
                    size={initialSkipCfg.sizePx}
                    color={initialSlot?.skipIndicatorColor ?? initialSkipCfg.color}
                    strokeWidth={initialSkipCfg.strokeWidth}
                    glowColor={initialSlot?.skipIndicatorColor ?? initialSkipCfg.glowColor}
                    glowBlurPx={initialSkipCfg.glowBlurPx}
                    glowIntensityPct={initialSkipCfg.glowIntensityPct}
                    style={{
                      transform:
                        initialSkipCfg.iconOffsetXPx !== 0 || initialSkipCfg.iconOffsetYPx !== 0
                          ? `translate3d(${initialSkipCfg.iconOffsetXPx}px, ${initialSkipCfg.iconOffsetYPx}px, 0)`
                          : undefined,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

EdgePlayerHudStripInner.displayName = 'EdgePlayerHudStrip';

export const EdgePlayerHudStrip = React.memo(EdgePlayerHudStripInner);
