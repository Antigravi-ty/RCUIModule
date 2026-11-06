import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  DEFAULT_INITIAL_ROSTER,
  type EdgeDemoIndicatorConfig,
  type EdgeSkipIndicatorConfig,
  type EdgePlayerSlotState,
  type EdgeRosterHudState,
  type HudRosterViewMode,
  type RosterTransientListener,
  resolveDemoIndicatorConfig,
  resolveSkipIndicatorConfig,
} from '../stores/hudTransientTypes';
import { globalHudTransientChannel } from '../stores/hudTransientChannel';
import {
  BombEmojiSvg,
  ReplaySkipCheckSvg,
  SKIP_ICON_VARIANT_PATHS,
  buildSvgDropShadowFilter,
} from '../primitives/svg/packagedSvgDefinitions';

export const KEY_BADGE_WIDTH_PX = 28;
export const DEMO_EXTEND_PX = 10;
export const CARD_ROW_PITCH_PX = 45;
export const MAX_TEAM_SLOTS = 5;

export interface EdgePlayerSlotCardHandle {
  setRoster: (roster: EdgeRosterHudState) => void;
}

export interface EdgePlayerSlotCardProps {
  slotIndex: number;
  side: 'left' | 'right';
  viewMode?: HudRosterViewMode;
  players?: EdgePlayerSlotState[];
  teamColor?: string;
  barColor?: string;
  isLight?: boolean;
  demoIndicatorConfig?: Partial<EdgeDemoIndicatorConfig>;
  skipIndicatorConfig?: Partial<EdgeSkipIndicatorConfig>;
  onSelectSlot?: (slotKey: 1 | 2 | 3 | 4 | 5 | 6) => void;
  subscribeRoster?: (listener: RosterTransientListener) => () => void;
}

function computeSlotRanksForRoster(
  list: EdgePlayerSlotState[],
  slotIndex: number,
  isLiveRightCompact: boolean
): { existingRank: number; demoVisualRank: number } {
  let existingRankCounter = 0;
  let existingRank = slotIndex;
  for (let i = 0; i <= slotIndex; i++) {
    const s = list[i];
    if (s && s.exists !== false) {
      if (i === slotIndex) existingRank = existingRankCounter;
      existingRankCounter++;
    }
  }
  let demoVisualRank = existingRank;
  if (isLiveRightCompact) {
    const demoIndices: number[] = [];
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      if (s && s.exists !== false && s.isDemolished) demoIndices.push(i);
    }
    demoIndices.sort((a, b) => {
      const tA = list[a]?.demolishedAtMs ?? 0;
      const tB = list[b]?.demolishedAtMs ?? 0;
      if (tA > 0 && tB > 0 && tA !== tB) return tA - tB;
      const remA = list[a]?.demoRespawnRemainingSec ?? 3.0;
      const remB = list[b]?.demoRespawnRemainingSec ?? 3.0;
      return Math.abs(remA - remB) > 0.001 ? remA - remB : a - b;
    });
    const foundDemoRank = demoIndices.indexOf(slotIndex);
    if (foundDemoRank >= 0) demoVisualRank = foundDemoRank;
  }
  return { existingRank, demoVisualRank };
}

function updateSkipBadgeDom(
  skipClipWrapEl: HTMLDivElement | null,
  skipBadgeEl: HTMLDivElement | null,
  side: 'left' | 'right',
  isLight: boolean,
  slot: EdgePlayerSlotState,
  resolvedSkipCfg: EdgeSkipIndicatorConfig
): void {
  const showSkipReady = Boolean(slot.replaySkipReady);
  const underlapPx = Math.max(0, Math.round(resolvedSkipCfg.underlapPx ?? 20));
  const protrudeWidthPx = Math.max(20, Math.round(resolvedSkipCfg.protrudeWidthPx ?? 34));
  const cardRadiusPx = Math.max(0, Math.round(resolvedSkipCfg.cardRadiusPx ?? 9));
  const iconOffsetXPx = Number(resolvedSkipCfg.iconOffsetXPx ?? 0);
  const iconOffsetYPx = Number(resolvedSkipCfg.iconOffsetYPx ?? -1);
  const enterMs = Math.max(0, Math.round(resolvedSkipCfg.enterDurationMs ?? 220));
  const exitMs = Math.max(0, Math.round(resolvedSkipCfg.exitDurationMs ?? 160));

  if (skipClipWrapEl) {
    skipClipWrapEl.style.marginLeft = side === 'left' ? `-${underlapPx}px` : '0px';
    skipClipWrapEl.style.marginRight = side === 'right' ? `-${underlapPx}px` : '0px';
    skipClipWrapEl.style.clipPath =
      side === 'left' ? 'inset(-4px -18px -4px 0px)' : 'inset(-4px 0px -4px -18px)';
  }
  if (!skipBadgeEl) return;
  skipBadgeEl.style.display = 'flex';
  skipBadgeEl.style.width = `${underlapPx + protrudeWidthPx}px`;
  skipBadgeEl.style.height = '37px';
  skipBadgeEl.style.paddingLeft = side === 'left' ? `${underlapPx}px` : '0px';
  skipBadgeEl.style.paddingRight = side === 'right' ? `${underlapPx}px` : '0px';
  skipBadgeEl.style.borderRadius =
    side === 'left' ? `0px ${cardRadiusPx}px ${cardRadiusPx}px 0px` : `${cardRadiusPx}px 0px 0px ${cardRadiusPx}px`;
  skipBadgeEl.style.backgroundColor = isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(20, 20, 25, 0.98)';
  const innerLine = isLight ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.14)';
  const outerRing = isLight ? 'rgba(115, 115, 115, 0.32)' : 'rgba(113, 113, 122, 0.55)';
  const outerSideInset = side === 'left' ? `inset -1px 0 0 0 ${innerLine}` : `inset 1px 0 0 0 ${innerLine}`;
  skipBadgeEl.style.boxShadow = `0 0 0 1.5px ${outerRing}, ${outerSideInset}, inset 0 1px 0 0 ${innerLine}, inset 0 -1px 0 0 ${innerLine}`;
  skipBadgeEl.style.transitionDuration = `${showSkipReady ? enterMs : exitMs}ms`;
  skipBadgeEl.style.transform = showSkipReady
    ? 'translate3d(0%, 0, 0)'
    : side === 'left' ? 'translate3d(-112%, 0, 0)' : 'translate3d(112%, 0, 0)';
  skipBadgeEl.style.pointerEvents = showSkipReady ? 'auto' : 'none';

  const skipSvgEl = skipBadgeEl.querySelector('svg');
  if (!skipSvgEl) return;
  const effectiveVariant = slot.skipIndicatorVariant ?? resolvedSkipCfg.variant ?? 'check';
  const effectiveColor = slot.skipIndicatorColor ?? resolvedSkipCfg.color ?? '#10B981';
  const effectiveGlowColor = slot.skipIndicatorColor ?? resolvedSkipCfg.glowColor ?? effectiveColor;
  const pxVal = resolvedSkipCfg.sizePx || 24;
  const sz = `${pxVal}px`;
  const skipGlow = buildSvgDropShadowFilter(effectiveGlowColor, resolvedSkipCfg.glowBlurPx, resolvedSkipCfg.glowIntensityPct);
  skipSvgEl.setAttribute('width', String(pxVal));
  skipSvgEl.setAttribute('height', String(pxVal));
  skipSvgEl.style.width = sz;
  skipSvgEl.style.height = sz;
  skipSvgEl.style.color = effectiveColor;
  skipSvgEl.style.filter = skipGlow !== 'none' ? skipGlow : 'none';
  skipSvgEl.style.transform =
    iconOffsetXPx !== 0 || iconOffsetYPx !== 0 ? `translate3d(${iconOffsetXPx}px, ${iconOffsetYPx}px, 0)` : 'none';
  const pathD = SKIP_ICON_VARIANT_PATHS[effectiveVariant] ?? SKIP_ICON_VARIANT_PATHS.check;
  skipSvgEl.querySelectorAll('path').forEach((p) => {
    p.setAttribute('d', pathD);
    p.setAttribute('stroke-width', String(resolvedSkipCfg.strokeWidth || 2.0));
    p.setAttribute('stroke', 'currentColor');
  });
}

const EdgePlayerSlotCardInner = forwardRef<EdgePlayerSlotCardHandle, EdgePlayerSlotCardProps>(
  (
    {
      slotIndex, side, viewMode, players,
      teamColor = side === 'left' ? '#2563EB' : '#EA580C',
      barColor = side === 'left' ? '#3B82F6' : '#F97316',
      isLight = true, demoIndicatorConfig, skipIndicatorConfig,
      onSelectSlot, subscribeRoster,
    },
    ref
  ) => {
    const defaultKey = Math.min(6, Math.max(1, side === 'left' ? slotIndex + 1 : slotIndex + 4)) as 1 | 2 | 3 | 4 | 5 | 6;
    const rowWrapRef = useRef<HTMLDivElement | null>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const skipClipWrapRef = useRef<HTMLDivElement | null>(null);
    const skipBadgeRef = useRef<HTMLDivElement | null>(null);
    const keyBadgeRef = useRef<HTMLDivElement | null>(null);
    const nameRef = useRef<HTMLSpanElement | null>(null);
    const selfTagRef = useRef<HTMLSpanElement | null>(null);
    const boostTextRef = useRef<HTMLSpanElement | null>(null);
    const demoCrossRef = useRef<HTMLSpanElement | null>(null);
    const demoBombWrapRef = useRef<HTMLSpanElement | null>(null);
    const barTrackRef = useRef<HTMLDivElement | null>(null);
    const barFillRef = useRef<HTMLDivElement | null>(null);
    const currentSlotKeyRef = useRef<1 | 2 | 3 | 4 | 5 | 6>(defaultKey);

    const defaultPlayers =
      players ?? (side === 'left' ? DEFAULT_INITIAL_ROSTER.leftPlayers : DEFAULT_INITIAL_ROSTER.rightPlayers);
    const initialSlot = defaultPlayers[slotIndex];
    const isRight = side === 'right';

    const applySlotStateToDom = useCallback(
      (
        slot: EdgePlayerSlotState | undefined,
        currentMode: HudRosterViewMode,
        existingRank: number,
        visualRowIndex: number,
        resolvedDemoCfg: EdgeDemoIndicatorConfig,
        resolvedSkipCfg: EdgeSkipIndicatorConfig
      ) => {
        const rowWrapEl = rowWrapRef.current;
        const cardEl = cardRef.current;
        if (!cardEl || !rowWrapEl) return;

        if (!slot || slot.exists === false) {
          rowWrapEl.style.display = 'none';
          return;
        }
        rowWrapEl.style.display = 'flex';
        currentSlotKeyRef.current = slot.slotKey;

        const isDemo = Boolean(slot.isDemolished);
        const isFocused = Boolean(slot.isFocusedPov);
        const showSkipReady = Boolean(slot.replaySkipReady);
        const isReplayOrSpec = currentMode === 'goal-replay' || currentMode === 'spectator';

        updateSkipBadgeDom(skipClipWrapRef.current, skipBadgeRef.current, side, isLight, slot, resolvedSkipCfg);

        if (side === 'left') {
          const baseOffsetPx = isReplayOrSpec ? 0 : -KEY_BADGE_WIDTH_PX;
          const demoOffsetPx = !isReplayOrSpec && isDemo ? DEMO_EXTEND_PX : 0;
          rowWrapEl.style.transform = `translate3d(${baseOffsetPx + demoOffsetPx}px, 0px, 0)`;
          rowWrapEl.style.opacity = '1';
        } else if (!isReplayOrSpec) {
          if (isDemo || showSkipReady) {
            const targetX = isDemo ? KEY_BADGE_WIDTH_PX - DEMO_EXTEND_PX : KEY_BADGE_WIDTH_PX;
            const deltaY = isDemo ? (visualRowIndex - existingRank) * CARD_ROW_PITCH_PX : 0;
            rowWrapEl.style.transform = `translate3d(${targetX}px, ${deltaY}px, 0)`;
            rowWrapEl.style.opacity = '1';
          } else {
            rowWrapEl.style.transform = 'translate3d(105%, 0px, 0)';
            rowWrapEl.style.opacity = '0';
          }
        } else {
          rowWrapEl.style.transform = 'translate3d(0px, 0px, 0)';
          rowWrapEl.style.opacity = '1';
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
          cardEl.style.backgroundColor = isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(20, 20, 25, 0.98)';
          cardEl.style.color = isLight ? '#09090B' : '#F4F4F5';
          cardEl.style.boxShadow = isLight
            ? '0 0 0 2px rgba(115, 115, 115, 0.22), inset 0 0 0 1px rgba(0, 0, 0, 0.14)'
            : '0 0 0 2px rgba(0, 0, 0, 0.65), inset 0 0 0 1px rgba(255, 255, 255, 0.14)';
        }

        const keyBadgeEl = keyBadgeRef.current;
        if (keyBadgeEl) {
          const slotKeyStr = String(slot.slotKey);
          if (keyBadgeEl.textContent !== slotKeyStr) keyBadgeEl.textContent = slotKeyStr;
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
            keyBadgeEl.style.backgroundColor = isLight ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.08)';
            keyBadgeEl.style.color = isLight ? '#52525B' : '#A1A1AA';
          }
        }

        if (nameRef.current && nameRef.current.textContent !== slot.name) nameRef.current.textContent = slot.name;
        if (selfTagRef.current) selfTagRef.current.style.display = slot.isSelf ? 'inline-block' : 'none';

        const clampedBoost = Math.max(0, Math.min(100, Math.round(slot.boostAmount || 0)));
        const boostTextEl = boostTextRef.current;
        const demoCrossEl = demoCrossRef.current;
        const demoBombWrapEl = demoBombWrapRef.current;
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
                svgEl.setAttribute('width', String(pxVal));
                svgEl.setAttribute('height', String(pxVal));
                svgEl.style.width = `${pxVal}px`;
                svgEl.style.height = `${pxVal}px`;
                svgEl.querySelectorAll('path').forEach((p) => {
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
            if (boostTextEl.textContent !== nextBoostStr) boostTextEl.textContent = nextBoostStr;
          }
        }

        const barTrackEl = barTrackRef.current;
        const barFillEl = barFillRef.current;
        if (barTrackEl && barFillEl) {
          if (isDemo) {
            barTrackEl.style.backgroundColor = '#27272A';
            const totalSec = Math.max(0.1, slot.demoRespawnTotalSec ?? 3.0);
            const remaining = Math.max(0, Math.min(totalSec, slot.demoRespawnRemainingSec ?? totalSec));
            const ratio = remaining / totalSec;
            barFillEl.style.backgroundColor =
              remaining > (totalSec * 2) / 3 ? '#FFFFFF' : remaining > totalSec / 3 ? '#FFD60A' : '#EF4444';
            barFillEl.style.transform = `scaleX(${ratio.toFixed(4)})`;
          } else {
            barTrackEl.style.backgroundColor = isLight ? '#E4E4E7' : '#09090B';
            barFillEl.style.backgroundColor = isFocused ? '#FFFFFF' : barColor;
            barFillEl.style.transform = `scaleX(${(clampedBoost / 100).toFixed(4)})`;
          }
        }
      },
      [side, teamColor, barColor, isLight]
    );

    const applyRoster = useCallback(
      (roster: EdgeRosterHudState) => {
        const list = side === 'left' ? roster.leftPlayers : roster.rightPlayers;
        const effectiveMode: HudRosterViewMode = viewMode ?? roster.viewMode ?? 'player-live';
        const isLiveRightCompact =
          side === 'right' && effectiveMode === 'player-live' && roster.opponentDemoCompact !== false;
        const resolvedDemoCfg = resolveDemoIndicatorConfig(
          demoIndicatorConfig,
          resolveDemoIndicatorConfig(roster.demoIndicatorConfig)
        );
        const resolvedSkipCfg = resolveSkipIndicatorConfig(
          skipIndicatorConfig,
          resolveSkipIndicatorConfig(roster.skipIndicatorConfig)
        );
        const { existingRank, demoVisualRank } = computeSlotRanksForRoster(list, slotIndex, isLiveRightCompact);
        applySlotStateToDom(list[slotIndex], effectiveMode, existingRank, demoVisualRank, resolvedDemoCfg, resolvedSkipCfg);
      },
      [side, slotIndex, viewMode, demoIndicatorConfig, skipIndicatorConfig, applySlotStateToDom]
    );

    useImperativeHandle(ref, () => ({ setRoster: applyRoster }), [applyRoster]);

    useEffect(() => {
      if (subscribeRoster) return subscribeRoster(applyRoster);
      if (players) {
        const resolvedDemoCfg = resolveDemoIndicatorConfig(demoIndicatorConfig);
        const resolvedSkipCfg = resolveSkipIndicatorConfig(skipIndicatorConfig);
        const effectiveMode: HudRosterViewMode = viewMode ?? 'player-live';
        const { existingRank, demoVisualRank } = computeSlotRanksForRoster(
          players,
          slotIndex,
          side === 'right' && effectiveMode === 'player-live'
        );
        applySlotStateToDom(players[slotIndex], effectiveMode, existingRank, demoVisualRank, resolvedDemoCfg, resolvedSkipCfg);
        return;
      }
      return globalHudTransientChannel.subscribeRoster(applyRoster);
    }, [subscribeRoster, players, slotIndex, side, viewMode, demoIndicatorConfig, skipIndicatorConfig, applyRoster, applySlotStateToDom]);

    const slotKey = initialSlot?.slotKey ?? defaultKey;
    const initShowSkip = Boolean(initialSlot?.replaySkipReady);
    const shapeClass = side === 'left' ? 'rounded-r-[9px] rounded-l-none' : 'rounded-l-[9px] rounded-r-none';
    const initialDemoCfg = resolveDemoIndicatorConfig(demoIndicatorConfig);
    const initialSkipCfg = resolveSkipIndicatorConfig(skipIndicatorConfig);
    const initUnderlapPx = Math.max(0, Math.round(initialSkipCfg.underlapPx ?? 20));
    const initProtrudePx = Math.max(20, Math.round(initialSkipCfg.protrudeWidthPx ?? 34));
    const initRadiusPx = Math.max(0, Math.round(initialSkipCfg.cardRadiusPx ?? 9));
    const innerLine = isLight ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.14)';
    const outerRing = isLight ? 'rgba(115, 115, 115, 0.32)' : 'rgba(113, 113, 122, 0.55)';
    const outerSideInset = side === 'left' ? `inset -1px 0 0 0 ${innerLine}` : `inset 1px 0 0 0 ${innerLine}`;
    const initDemoFilter = buildSvgDropShadowFilter(
      initialDemoCfg.glowColor,
      initialDemoCfg.glowBlurPx,
      initialDemoCfg.glowIntensityPct
    );

    return (
      <div
        ref={rowWrapRef}
        className={`flex items-center gap-0 will-change-transform transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isRight ? 'flex-row-reverse' : 'flex-row'
        }`}
        style={{ display: initialSlot && initialSlot.exists !== false ? 'flex' : 'none' }}
      >
        <div
          ref={cardRef}
          onClick={() => onSelectSlot?.(currentSlotKeyRef.current)}
          title={`Press [${slotKey}] to observe ${initialSlot?.name ?? `Player ${slotKey}`}`}
          className={`group relative z-20 shrink-0 flex flex-col overflow-hidden cursor-pointer ${shapeClass}`}
          style={{ width: '196px' }}
        >
          <div className={`flex items-center h-[32px] w-full ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
            <div
              ref={keyBadgeRef}
              className={`flex items-center justify-center shrink-0 h-full text-[11px] font-normal tabular-nums ${
                isRight ? 'border-l' : 'border-r'
              } border-black/10 transition-colors duration-200`}
              style={{ width: `${KEY_BADGE_WIDTH_PX}px`, fontWeight: 400 }}
            >
              {slotKey}
            </div>
            <div className={`flex items-center gap-1 min-w-0 flex-1 ${isRight ? 'flex-row-reverse pr-2.5 pl-1.5 justify-start' : 'flex-row pl-2.5 pr-1.5 justify-start'}`}>
              <span ref={nameRef} className={`truncate text-[12px] leading-snug tracking-tight ${isRight ? 'text-right' : 'text-left'}`} style={{ fontWeight: 400 }}>
                {initialSlot?.name ?? `Player ${slotKey}`}
              </span>
              <span ref={selfTagRef} className="shrink-0 px-1 py-[1px] rounded text-[8px] uppercase tracking-wider bg-black/20 text-current opacity-80" style={{ display: initialSlot?.isSelf ? 'inline-block' : 'none' }}>
                YOU
              </span>
            </div>
            <div className={`flex items-center shrink-0 ${isRight ? 'justify-start pl-2.5 pr-1' : 'justify-end pr-2.5 pl-1'}`}>
              <span ref={boostTextRef} className={`inline-block w-[3ch] text-[13px] leading-none tabular-nums tracking-tight ${isRight ? 'text-left' : 'text-right'}`} style={{ fontWeight: 400 }}>
                {initialSlot?.boostAmount ?? 100}
              </span>
              <span ref={demoCrossRef} className={`items-center min-w-[3ch] overflow-visible text-[15px] leading-none font-bold ${isRight ? 'justify-start text-left' : 'justify-end text-right'}`} style={{ display: 'none', color: initialDemoCfg.color, filter: initDemoFilter }}>
                x
              </span>
              <span ref={demoBombWrapRef} className={`items-center min-w-[3ch] overflow-visible leading-none ${isRight ? 'justify-start text-left' : 'justify-end text-right'}`} style={{ display: 'none', color: initialDemoCfg.color, filter: initDemoFilter }}>
                <BombEmojiSvg size={initialDemoCfg.sizePx} color={initialDemoCfg.color} strokeWidth={initialDemoCfg.strokeWidth} />
              </span>
            </div>
          </div>
          <div ref={barTrackRef} className="relative w-full h-[5px] bg-[#09090B] overflow-hidden">
            <div
              ref={barFillRef}
              className={`h-full w-full ${isRight ? 'origin-right' : 'origin-left'} will-change-transform transition-colors duration-150`}
              style={{ backgroundColor: barColor, transform: `scaleX(${((initialSlot?.boostAmount ?? 100) / 100).toFixed(3)})` }}
            />
          </div>
        </div>
        <div
          ref={skipClipWrapRef}
          className="relative z-10 shrink-0 flex items-center"
          style={{
            marginLeft: side === 'left' ? `-${initUnderlapPx}px` : '0px',
            marginRight: side === 'right' ? `-${initUnderlapPx}px` : '0px',
            clipPath: side === 'left' ? 'inset(-4px -18px -4px 0px)' : 'inset(-4px 0px -4px -18px)',
          }}
        >
          <div
            ref={skipBadgeRef}
            data-ui-element={`hud-edge-player-skip-ready-${slotKey}`}
            title={`Player #${slotKey} Ready / Skip Goal Replay`}
            className="h-[37px] shrink-0 flex items-center justify-center will-change-transform transition-transform ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              width: `${initUnderlapPx + initProtrudePx}px`,
              paddingLeft: side === 'left' ? `${initUnderlapPx}px` : '0px',
              paddingRight: side === 'right' ? `${initUnderlapPx}px` : '0px',
              borderRadius: side === 'left' ? `0px ${initRadiusPx}px ${initRadiusPx}px 0px` : `${initRadiusPx}px 0px 0px ${initRadiusPx}px`,
              backgroundColor: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(20, 20, 25, 0.98)',
              boxShadow: `0 0 0 1.5px ${outerRing}, ${outerSideInset}, inset 0 1px 0 0 ${innerLine}, inset 0 -1px 0 0 ${innerLine}`,
              transitionDuration: `${initShowSkip ? initialSkipCfg.enterDurationMs : initialSkipCfg.exitDurationMs}ms`,
              transform: initShowSkip ? 'translate3d(0%, 0, 0)' : side === 'left' ? 'translate3d(-112%, 0, 0)' : 'translate3d(112%, 0, 0)',
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
  }
);

EdgePlayerSlotCardInner.displayName = 'EdgePlayerSlotCard';

export const EdgePlayerSlotCard = React.memo(EdgePlayerSlotCardInner);
