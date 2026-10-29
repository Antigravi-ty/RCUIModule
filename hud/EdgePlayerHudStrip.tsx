import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  DEFAULT_DEMO_INDICATOR_CONFIG,
  DEFAULT_INITIAL_ROSTER,
  EdgeDemoIndicatorConfig,
  EdgePlayerSlotState,
  EdgeRosterHudState,
  HudRosterViewMode,
  RosterTransientListener,
} from '../stores/hudTransientChannel';
import { BombEmojiSvg, buildSvgDropShadowFilter } from '../primitives/packagedSvgIcons';

export interface EdgePlayerHudStripHandle {
  /** Imperatively push roster state to DOM refs with zero React re-renders */
  setRoster: (roster: EdgeRosterHudState) => void;
}

export interface EdgePlayerHudStripProps {
  /** Which screen edge this vertical player stack attaches to */
  side: 'left' | 'right';
  /** Declarative fallback props when subscribeRoster is not used */
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
  /** Optional callback when user clicks a card or presses 1-6 to switch POV */
  onSelectSlot?: (slotKey: 1 | 2 | 3 | 4 | 5 | 6) => void;
  /**
   * High-efficiency Transient Channel subscription (0 React re-renders).
   * Updates card transforms, POV highlight, demolished indicator & 3s countdown bar, and 120Hz boost via DOM refs.
   */
  subscribeRoster?: (listener: RosterTransientListener) => () => void;
  className?: string;
}

interface CardDomRefs {
  cardEl: HTMLDivElement | null;
  keyBadgeEl: HTMLDivElement | null;
  nameEl: HTMLSpanElement | null;
  selfTagEl: HTMLSpanElement | null;
  boostTextEl: HTMLSpanElement | null;
  demoCrossEl: HTMLSpanElement | null;
  demoBombWrapEl: HTMLSpanElement | null;
  barTrackEl: HTMLDivElement | null;
  barFillEl: HTMLDivElement | null;
  currentSlotKey: 1 | 2 | 3 | 4 | 5 | 6;
}

const KEY_BADGE_WIDTH_PX = 28;
const DEMO_EXTEND_PX = 10;
const CARD_ROW_PITCH_PX = 45; // 37px card height (32px row + 5px bar) + 8px gap-2
const MAX_TEAM_SLOTS = 5; // Supports 1v1, 2v2, 3v3, 2v4, 1v5 (up to 6 total match cars)

function createEmptyCardRefs(defaultKey: 1 | 2 | 3 | 4 | 5 | 6): CardDomRefs {
  return {
    cardEl: null,
    keyBadgeEl: null,
    nameEl: null,
    selfTagEl: null,
    boostTextEl: null,
    demoCrossEl: null,
    demoBombWrapEl: null,
    barTrackEl: null,
    barFillEl: null,
    currentSlotKey: defaultKey,
  };
}

const EdgePlayerHudStripInner = forwardRef<EdgePlayerHudStripHandle, EdgePlayerHudStripProps>(
  (
    {
      side,
      viewMode = 'player-live',
      players,
      teamColor = side === 'left' ? '#2563EB' : '#EA580C',
      barColor = side === 'left' ? '#3B82F6' : '#F97316',
      isLight = true,
      demoIndicatorConfig,
      onSelectSlot,
      subscribeRoster,
      className = '',
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
        resolvedDemoCfg: EdgeDemoIndicatorConfig
      ) => {
        const {
          cardEl,
          keyBadgeEl,
          nameEl,
          selfTagEl,
          boostTextEl,
          demoCrossEl,
          demoBombWrapEl,
          barTrackEl,
          barFillEl,
        } = refs;
        if (!cardEl) return;

        const exists = slot !== undefined && slot.exists !== false;
        if (!exists || !slot) {
          cardEl.style.display = 'none';
          return;
        }
        cardEl.style.display = 'flex';
        refs.currentSlotKey = slot.slotKey;

        const isDemo = Boolean(slot.isDemolished);
        const isFocused = Boolean(slot.isFocusedPov);
        const isReplayOrSpec = currentMode === 'goal-replay' || currentMode === 'spectator';

        if (side === 'left') {
          const baseOffsetPx = isReplayOrSpec ? 0 : -KEY_BADGE_WIDTH_PX;
          const demoOffsetPx = !isReplayOrSpec && isDemo ? DEMO_EXTEND_PX : 0;
          cardEl.style.transform = `translate3d(${baseOffsetPx + demoOffsetPx}px, 0px, 0)`;
          cardEl.style.opacity = '1';
        } else {
          // Right side:
          // - In Replay / Spectator: all existing players shown at x=0, y=0
          // - In Player Live: hidden off-screen to the right UNLESS demolished!
          //   When demolished, slides in with key badge tucked off-screen (+KEY_BADGE_WIDTH_PX - DEMO_EXTEND_PX)
          //   and translates vertically to `visualRowIndex` (top-compacted FIFO order!).
          if (!isReplayOrSpec) {
            if (isDemo) {
              const targetX = KEY_BADGE_WIDTH_PX - DEMO_EXTEND_PX;
              const deltaY = (visualRowIndex - slotIndex) * CARD_ROW_PITCH_PX;
              cardEl.style.transform = `translate3d(${targetX}px, ${deltaY}px, 0)`;
              cardEl.style.opacity = '1';
            } else {
              cardEl.style.transform = 'translate3d(105%, 0px, 0)';
              cardEl.style.opacity = '0';
            }
          } else {
            cardEl.style.transform = 'translate3d(0px, 0px, 0)';
            cardEl.style.opacity = '1';
          }
        }

        if (isDemo) {
          cardEl.style.backgroundColor = '#3F3F46';
          cardEl.style.color = '#D4D4D8';
          const borderHex = resolvedDemoCfg.color || '#EF4444';
          cardEl.style.boxShadow = `0 0 0 1px ${borderHex}, inset 0 0 0 1px ${borderHex}BF`;
        } else if (isFocused) {
          cardEl.style.backgroundColor = teamColor;
          cardEl.style.color = '#FFFFFF';
          cardEl.style.boxShadow = `0 0 0 2px ${teamColor}66, inset 0 0 0 1px rgba(255,255,255,0.32)`;
        } else {
          cardEl.style.backgroundColor = isLight
            ? 'rgba(255, 255, 255, 0.96)'
            : 'rgba(20, 20, 25, 0.95)';
          cardEl.style.color = isLight ? '#09090B' : '#F4F4F5';
          cardEl.style.boxShadow = isLight
            ? '0 0 0 2px rgba(115, 115, 115, 0.22), inset 0 0 0 1px rgba(0, 0, 0, 0.14)'
            : '0 0 0 2px rgba(0, 0, 0, 0.65), inset 0 0 0 1px rgba(255, 255, 255, 0.14)';
        }

        if (keyBadgeEl) {
          const slotKeyStr = String(slot.slotKey);
          if (keyBadgeEl.textContent !== slotKeyStr) {
            keyBadgeEl.textContent = slotKeyStr;
          }
          // During Player Live, keep the 1-6 key badge completely invisible (opacity 0, transparent border)
          // so that even when a demolished card extends 10px inward, the key badge seam never peeks into view!
          keyBadgeEl.style.opacity = isReplayOrSpec ? '1' : '0';
          keyBadgeEl.style.borderColor = isReplayOrSpec ? 'rgba(0, 0, 0, 0.10)' : 'transparent';

          if (!isReplayOrSpec) {
            keyBadgeEl.style.backgroundColor = 'transparent';
          } else if (isDemo) {
            keyBadgeEl.style.backgroundColor = 'rgba(239, 68, 68, 0.22)';
            keyBadgeEl.style.color = '#FCA5A5';
          } else if (isFocused) {
            keyBadgeEl.style.backgroundColor = 'rgba(0, 0, 0, 0.25)';
            keyBadgeEl.style.color = '#FFFFFF';
          } else {
            keyBadgeEl.style.backgroundColor = isLight
              ? 'rgba(0, 0, 0, 0.07)'
              : 'rgba(255, 255, 255, 0.08)';
            keyBadgeEl.style.color = isLight ? '#52525B' : '#A1A1AA';
          }
        }

        if (nameEl && nameEl.textContent !== slot.name) {
          nameEl.textContent = slot.name;
        }
        if (selfTagEl) {
          selfTagEl.style.display = slot.isSelf ? 'inline-block' : 'none';
        }

        const clampedBoost = Math.max(0, Math.min(100, Math.round(slot.boostAmount || 0)));
        if (boostTextEl && demoCrossEl && demoBombWrapEl) {
          if (isDemo) {
            boostTextEl.style.display = 'none';
            const glowFilter = buildSvgDropShadowFilter(
              resolvedDemoCfg.glowColor || resolvedDemoCfg.color,
              resolvedDemoCfg.glowBlurPx,
              resolvedDemoCfg.glowIntensityPct
            );

            if (resolvedDemoCfg.variant === 'bomb-svg') {
              demoCrossEl.style.display = 'none';
              demoBombWrapEl.style.display = 'inline-flex';
              demoBombWrapEl.style.color = resolvedDemoCfg.color;
              demoBombWrapEl.style.filter = glowFilter ?? 'none';
              const svgEl = demoBombWrapEl.querySelector('svg');
              if (svgEl) {
                const pxVal = resolvedDemoCfg.sizePx || 16;
                const sz = `${pxVal}px`;
                svgEl.setAttribute('width', String(pxVal));
                svgEl.setAttribute('height', String(pxVal));
                svgEl.style.width = sz;
                svgEl.style.height = sz;
                const paths = svgEl.querySelectorAll('path');
                paths.forEach((p) => {
                  p.setAttribute('stroke-width', String(resolvedDemoCfg.strokeWidth || 1.9));
                  p.setAttribute('stroke', resolvedDemoCfg.color || '#EF4444');
                });
              }
            } else {
              demoBombWrapEl.style.display = 'none';
              demoCrossEl.style.display = 'inline-flex';
              demoCrossEl.style.color = resolvedDemoCfg.color || '#EF4444';
              demoCrossEl.style.fontSize = `${Math.max(10, resolvedDemoCfg.sizePx || 16)}px`;
              demoCrossEl.style.filter = glowFilter ?? 'none';
            }
          } else {
            boostTextEl.style.display = 'inline-block';
            demoCrossEl.style.display = 'none';
            demoBombWrapEl.style.display = 'none';
            const nextBoostStr = String(clampedBoost);
            if (boostTextEl.textContent !== nextBoostStr) {
              boostTextEl.textContent = nextBoostStr;
            }
          }
        }

        if (barTrackEl && barFillEl) {
          if (isDemo) {
            barTrackEl.style.backgroundColor = '#27272A';
            const totalSec = Math.max(0.1, slot.demoRespawnTotalSec ?? 3.0);
            const remaining = Math.max(0, Math.min(totalSec, slot.demoRespawnRemainingSec ?? totalSec));
            const ratio = remaining / totalSec;
            const stageColor =
              remaining > (totalSec * 2) / 3
                ? '#FFFFFF'
                : remaining > totalSec / 3
                ? '#FFD60A'
                : '#EF4444';
            barFillEl.style.backgroundColor = stageColor;
            barFillEl.style.transform = `scaleX(${ratio.toFixed(4)})`;
          } else {
            barTrackEl.style.backgroundColor = isLight ? '#E4E4E7' : '#09090B';
            const ratio = clampedBoost / 100;
            barFillEl.style.backgroundColor = isFocused ? '#FFFFFF' : barColor;
            barFillEl.style.transform = `scaleX(${ratio.toFixed(4)})`;
          }
        }
      },
      [side, teamColor, barColor, isLight]
    );

    const applyRoster = useCallback(
      (roster: EdgeRosterHudState) => {
        const list = side === 'left' ? roster.leftPlayers : roster.rightPlayers;
        const isLiveRightCompact =
          side === 'right' &&
          roster.viewMode === 'player-live' &&
          roster.opponentDemoCompact !== false;

        const resolvedDemoCfg: EdgeDemoIndicatorConfig = {
          ...DEFAULT_DEMO_INDICATOR_CONFIG,
          ...(roster.demoIndicatorConfig ?? {}),
          ...(demoIndicatorConfig ?? {}),
        };

        // Precompute existing slot indices and FIFO demolished opponent ranks (supports 1..5 slots per side)
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

        // If right-side Player Live auto-compaction is enabled, sort demolished opponents in FIFO order:
        // Primary key: `demolishedAtMs` ascending (if > 0)
        // Fallback key (for C++ WASM direct `demoRespawnTimer` without JS timestamp): `demoRespawnRemainingSec` ascending!
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
            if (tA > 0 && tB > 0 && tA !== tB) {
              return tA - tB;
            }
            const remA = list[a]?.demoRespawnRemainingSec ?? 3.0;
            const remB = list[b]?.demoRespawnRemainingSec ?? 3.0;
            if (Math.abs(remA - remB) > 0.001) {
              return remA - remB;
            }
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
              roster.viewMode,
              existingRanks[i],
              demoVisualRanks[i],
              resolvedDemoCfg
            );
          }
        }
      },
      [side, applySlotDom, demoIndicatorConfig]
    );

    useImperativeHandle(
      ref,
      () => ({
        setRoster: applyRoster,
      }),
      [applyRoster]
    );

    useEffect(() => {
      if (subscribeRoster) {
        return subscribeRoster(applyRoster);
      }

      const resolvedDemoCfg: EdgeDemoIndicatorConfig = {
        ...DEFAULT_DEMO_INDICATOR_CONFIG,
        ...(demoIndicatorConfig ?? {}),
      };
      let rankCounter = 0;
      for (let i = 0; i < MAX_TEAM_SLOTS; i++) {
        const slot = defaultPlayers[i];
        const refs = cardRefs.current[i];
        if (refs) {
          const r = slot && slot.exists !== false ? rankCounter++ : i;
          applySlotDom(slot, refs, viewMode, r, r, resolvedDemoCfg);
        }
      }
    }, [subscribeRoster, applyRoster, applySlotDom, defaultPlayers, viewMode, demoIndicatorConfig]);

    const shapeClass =
      side === 'left' ? 'rounded-r-[9px] rounded-l-none' : 'rounded-l-[9px] rounded-r-none';

    const initialDemoCfg: EdgeDemoIndicatorConfig = {
      ...DEFAULT_DEMO_INDICATOR_CONFIG,
      ...(demoIndicatorConfig ?? {}),
    };

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
            | 1
            | 2
            | 3
            | 4
            | 5
            | 6;
          const slotKey = initialSlot?.slotKey ?? fallbackKey;

          return (
            <div
              key={idx}
              ref={(el) => {
                cardRefs.current[idx].cardEl = el;
              }}
              onClick={() => onSelectSlot?.(cardRefs.current[idx].currentSlotKey)}
              title={`Press [${slotKey}] to observe ${initialSlot?.name ?? `Player ${slotKey}`}`}
              className={`group relative flex flex-col overflow-hidden cursor-pointer will-change-transform transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${shapeClass}`}
              style={{
                width: '196px',
                display: initialSlot && initialSlot.exists !== false ? 'flex' : 'none',
              }}
            >
              <div
                className={`flex items-center h-[32px] w-full ${
                  isRight ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  ref={(el) => {
                    cardRefs.current[idx].keyBadgeEl = el;
                  }}
                  className={`flex items-center justify-center shrink-0 h-full text-[11px] font-normal tabular-nums ${
                    isRight ? 'border-l' : 'border-r'
                  } border-black/10 transition-colors duration-200`}
                  style={{
                    width: `${KEY_BADGE_WIDTH_PX}px`,
                    fontWeight: 400,
                  }}
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
                    ref={(el) => {
                      cardRefs.current[idx].nameEl = el;
                    }}
                    className={`truncate text-[12px] leading-tight tracking-tight ${
                      isRight ? 'text-right' : 'text-left'
                    }`}
                    style={{ fontWeight: 400 }}
                  >
                    {initialSlot?.name ?? `Player ${slotKey}`}
                  </span>
                  <span
                    ref={(el) => {
                      cardRefs.current[idx].selfTagEl = el;
                    }}
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
                    ref={(el) => {
                      cardRefs.current[idx].boostTextEl = el;
                    }}
                    className={`inline-block w-[3ch] text-[13px] leading-none tabular-nums tracking-tight ${
                      isRight ? 'text-left' : 'text-right'
                    }`}
                    style={{ fontWeight: 400 }}
                  >
                    {initialSlot?.boostAmount ?? 100}
                  </span>

                  {/* Classic Red Cross ('cross') indicator */}
                  <span
                    ref={(el) => {
                      cardRefs.current[idx].demoCrossEl = el;
                    }}
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

                  {/* Packaged Bomb Emoji SVG ('bomb-svg') indicator */}
                  <span
                    ref={(el) => {
                      cardRefs.current[idx].demoBombWrapEl = el;
                    }}
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
                ref={(el) => {
                  cardRefs.current[idx].barTrackEl = el;
                }}
                className="relative w-full h-[5px] bg-[#09090B] overflow-hidden"
              >
                <div
                  ref={(el) => {
                    cardRefs.current[idx].barFillEl = el;
                  }}
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
          );
        })}
      </div>
    );
  }
);

EdgePlayerHudStripInner.displayName = 'EdgePlayerHudStrip';

export const EdgePlayerHudStrip = React.memo(EdgePlayerHudStripInner);
