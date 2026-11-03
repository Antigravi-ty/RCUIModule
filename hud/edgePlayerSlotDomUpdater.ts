import {
  type EdgeDemoIndicatorConfig,
  type EdgePlayerSlotState,
  type EdgeSkipIndicatorConfig,
  type HudRosterViewMode,
} from '../stores/hudTransientTypes';
import {
  SKIP_ICON_VARIANT_PATHS,
  buildSvgDropShadowFilter,
} from '../primitives/svg/packagedSvgDefinitions';

export interface CardDomRefs {
  rowWrapEl: HTMLDivElement | null;
  cardEl: HTMLDivElement | null;
  skipClipWrapEl: HTMLDivElement | null;
  skipBadgeEl: HTMLDivElement | null;
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

export const KEY_BADGE_WIDTH_PX = 28;
export const DEMO_EXTEND_PX = 10;
export const CARD_ROW_PITCH_PX = 45;
export const MAX_TEAM_SLOTS = 5;

export function createEmptyCardRefs(defaultKey: 1 | 2 | 3 | 4 | 5 | 6): CardDomRefs {
  return {
    rowWrapEl: null,
    cardEl: null,
    skipClipWrapEl: null,
    skipBadgeEl: null,
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

export function applyEdgePlayerSlotDom(params: {
  side: 'left' | 'right';
  teamColor: string;
  barColor: string;
  isLight: boolean;
  slot: EdgePlayerSlotState | undefined;
  refs: CardDomRefs;
  currentMode: HudRosterViewMode;
  slotIndex: number;
  visualRowIndex: number;
  resolvedDemoCfg: EdgeDemoIndicatorConfig;
  resolvedSkipCfg: EdgeSkipIndicatorConfig;
}): void {
  const {
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
  } = params;

  const {
    rowWrapEl,
    cardEl,
    skipClipWrapEl,
    skipBadgeEl,
    keyBadgeEl,
    nameEl,
    selfTagEl,
    boostTextEl,
    demoCrossEl,
    demoBombWrapEl,
    barTrackEl,
    barFillEl,
  } = refs;
  if (!cardEl || !rowWrapEl) return;

  const exists = slot !== undefined && slot.exists !== false;
  if (!exists || !slot) {
    rowWrapEl.style.display = 'none';
    return;
  }
  rowWrapEl.style.display = 'flex';
  refs.currentSlotKey = slot.slotKey;

  const isDemo = Boolean(slot.isDemolished);
  const isFocused = Boolean(slot.isFocusedPov);
  const showSkipReady = Boolean(slot.replaySkipReady);
  const isReplayOrSpec = currentMode === 'goal-replay' || currentMode === 'spectator';

  const underlapPx = Math.max(0, Math.round(resolvedSkipCfg.underlapPx ?? 20));
  const protrudeWidthPx = Math.max(20, Math.round(resolvedSkipCfg.protrudeWidthPx ?? 34));
  const cardRadiusPx = Math.max(0, Math.round(resolvedSkipCfg.cardRadiusPx ?? 9));
  const iconOffsetXPx = Number(resolvedSkipCfg.iconOffsetXPx ?? 0);
  const iconOffsetYPx = Number(resolvedSkipCfg.iconOffsetYPx ?? -1);
  const enterMs = Math.max(0, Math.round(resolvedSkipCfg.enterDurationMs ?? 220));
  const exitMs = Math.max(0, Math.round(resolvedSkipCfg.exitDurationMs ?? 160));

  if (skipClipWrapEl) {
    if (side === 'left') {
      skipClipWrapEl.style.marginLeft = `-${underlapPx}px`;
      skipClipWrapEl.style.marginRight = '0px';
      skipClipWrapEl.style.clipPath = 'inset(-4px -18px -4px 0px)';
    } else {
      skipClipWrapEl.style.marginRight = `-${underlapPx}px`;
      skipClipWrapEl.style.marginLeft = '0px';
      skipClipWrapEl.style.clipPath = 'inset(-4px 0px -4px -18px)';
    }
  }

  if (skipBadgeEl) {
    const totalWidthPx = underlapPx + protrudeWidthPx;
    skipBadgeEl.style.display = 'flex';
    skipBadgeEl.style.width = `${totalWidthPx}px`;
    skipBadgeEl.style.height = '37px';
    skipBadgeEl.style.paddingLeft = side === 'left' ? `${underlapPx}px` : '0px';
    skipBadgeEl.style.paddingRight = side === 'right' ? `${underlapPx}px` : '0px';
    skipBadgeEl.style.borderRadius =
      side === 'left'
        ? `0px ${cardRadiusPx}px ${cardRadiusPx}px 0px`
        : `${cardRadiusPx}px 0px 0px ${cardRadiusPx}px`;
    skipBadgeEl.style.backgroundColor = isLight
      ? 'rgba(255, 255, 255, 0.98)'
      : 'rgba(20, 20, 25, 0.98)';
    const innerLine = isLight ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.14)';
    const outerRing = isLight ? 'rgba(115, 115, 115, 0.32)' : 'rgba(113, 113, 122, 0.55)';
    const outerSideInset =
      side === 'left'
        ? `inset -1px 0 0 0 ${innerLine}`
        : `inset 1px 0 0 0 ${innerLine}`;
    skipBadgeEl.style.boxShadow = `0 0 0 1.5px ${outerRing}, ${outerSideInset}, inset 0 1px 0 0 ${innerLine}, inset 0 -1px 0 0 ${innerLine}`;
    skipBadgeEl.style.transitionDuration = `${showSkipReady ? enterMs : exitMs}ms`;
    skipBadgeEl.style.transform = showSkipReady
      ? 'translate3d(0%, 0, 0)'
      : side === 'left'
      ? 'translate3d(-112%, 0, 0)'
      : 'translate3d(112%, 0, 0)';
    skipBadgeEl.style.pointerEvents = showSkipReady ? 'auto' : 'none';

    const skipSvgEl = skipBadgeEl.querySelector('svg');
    if (skipSvgEl) {
      const effectiveVariant =
        slot.skipIndicatorVariant ?? resolvedSkipCfg.variant ?? 'check';
      const effectiveColor =
        slot.skipIndicatorColor ?? resolvedSkipCfg.color ?? '#10B981';
      const effectiveGlowColor =
        slot.skipIndicatorColor ?? resolvedSkipCfg.glowColor ?? effectiveColor;
      const pxVal = resolvedSkipCfg.sizePx || 24;
      const sz = `${pxVal}px`;
      const skipGlow = buildSvgDropShadowFilter(
        effectiveGlowColor,
        resolvedSkipCfg.glowBlurPx,
        resolvedSkipCfg.glowIntensityPct
      );
      skipSvgEl.setAttribute('width', String(pxVal));
      skipSvgEl.setAttribute('height', String(pxVal));
      skipSvgEl.style.width = sz;
      skipSvgEl.style.height = sz;
      skipSvgEl.style.color = effectiveColor;
      skipSvgEl.style.filter = skipGlow !== 'none' ? skipGlow : 'none';
      skipSvgEl.style.transform =
        iconOffsetXPx !== 0 || iconOffsetYPx !== 0
          ? `translate3d(${iconOffsetXPx}px, ${iconOffsetYPx}px, 0)`
          : 'none';
      const pathD =
        SKIP_ICON_VARIANT_PATHS[effectiveVariant] ?? SKIP_ICON_VARIANT_PATHS.check;
      const paths = skipSvgEl.querySelectorAll('path');
      paths.forEach((p) => {
        p.setAttribute('d', pathD);
        p.setAttribute('stroke-width', String(resolvedSkipCfg.strokeWidth || 2.0));
        p.setAttribute('stroke', 'currentColor');
      });
    }
  }

  if (side === 'left') {
    const baseOffsetPx = isReplayOrSpec ? 0 : -KEY_BADGE_WIDTH_PX;
    const demoOffsetPx = !isReplayOrSpec && isDemo ? DEMO_EXTEND_PX : 0;
    rowWrapEl.style.transform = `translate3d(${baseOffsetPx + demoOffsetPx}px, 0px, 0)`;
    rowWrapEl.style.opacity = '1';
  } else {
    if (!isReplayOrSpec) {
      if (isDemo || showSkipReady) {
        const targetX = isDemo ? KEY_BADGE_WIDTH_PX - DEMO_EXTEND_PX : KEY_BADGE_WIDTH_PX;
        const deltaY = isDemo ? (visualRowIndex - slotIndex) * CARD_ROW_PITCH_PX : 0;
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
      ? 'rgba(255, 255, 255, 0.98)'
      : 'rgba(20, 20, 25, 0.98)';
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
}
