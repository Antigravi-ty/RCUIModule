import React, { useEffect, useState } from 'react';
import {
  PackagedSvgIcon,
  PackagedSvgId,
  buildSvgDropShadowFilter,
} from '../primitives/packagedSvgIcons';
import { renderNamedIcon } from '../primitives/iconLookup';

export type StatsEventLayoutVariant = 'card' | 'compact-pill' | 'minimal-hud';
export type StatsEventCapsuleStyle = 'tinted' | 'solid' | 'outline';

export interface StatsEventSvgVariationConfig {
  /** High-Five (1154833): show top 3 + bottom 3 impact lines */
  highFiveShowSparks?: boolean;
  /** High-Five (1154833): solid fill left hand */
  highFiveFillLeftHand?: boolean;
  /** High-Five (1154833): solid fill right hand */
  highFiveFillRightHand?: boolean;
  /** Strategy (6112585): convert top-left X into O circle */
  strategyTopLeftCircle?: boolean;
  /** Strategy (6112585): convert bottom-right X into O circle */
  strategyBottomRightCircle?: boolean;
  /** Bomb Emoji (528868): stroke thickness */
  bombStrokeWidth?: number;
}

export interface StatsEventFeedItem {
  id: string;
  /** Packaged SVG ID or Lucide icon name */
  iconName: PackagedSvgId | string;
  /** Optional SVG variation toggles for High-Five / Strategy / Bomb */
  svgVariations?: StatsEventSvgVariationConfig;
  /** Optional upper kicker / player tag (e.g. "ZEN_MASTER_RL") */
  kickerText?: string;
  /** Primary stat event label (e.g. "CROSSBAR HIT", "HIGH FIVE", "PLAYMAKER") */
  titleText: string;
  /** Capsule / Pill badge text (e.g. "+25 PTS", "118 KM/H", "×3 STREAK") */
  capsuleText?: string;
  /** Footnote text (e.g. "UPPER 90 DEFLECTION · BALL SPEED 118 KPH") */
  footnoteText?: string;
  /** Optional right-aligned footnote telemetry tag (e.g. "TICK #14,280") */
  footnoteTag?: string;
  /** Primary accent color (hex) for icon, glow, and capsule */
  accentColor?: string;
}

export interface StatsEventFeedHUDProps {
  /** Primary item when rendering a single stat event, or fallback when `feedItems` is empty */
  item?: StatsEventFeedItem;
  /** Optional array of stacked status feed items (when in multi-feed mode) */
  feedItems?: StatsEventFeedItem[];

  /** Show / hide the leading Icon */
  showIcon?: boolean;
  /** Show / hide the icon container box */
  showIconBox?: boolean;
  /** Icon size in px (default: 26) */
  iconSizePx?: number;
  /** Override icon color (defaults to item.accentColor) */
  iconColor?: string;

  /** Show / hide upper kicker text */
  showKicker?: boolean;
  /** Show / hide the Capsule / Pill badge */
  showCapsule?: boolean;
  /** Visual style of the Capsule badge */
  capsuleStyle?: StatsEventCapsuleStyle;

  /** Show / hide the Footnote row */
  showFootnote?: boolean;

  /** Visual container layout variant */
  layoutVariant?: StatsEventLayoutVariant;

  /** Outer glow blur radius in px (0 = no glow) */
  glowBlurPx?: number;
  /** Outer glow intensity percentage (0..100) */
  glowIntensityPct?: number;

  /** Font family CSS string */
  fontFamily?: string;
  /** Title font size in px (default: 16) */
  titleFontSizePx?: number;
  /** Title font weight (default: 800) */
  titleFontWeight?: number;

  /** Trigger counter to replay kinetic entry/hold/exit animation */
  triggerKey?: number;
  /** Enable timed entry -> hold -> exit lifecycle (default: false = pinned for inspection) */
  autoLifecycle?: boolean;
  /** Entry animation duration in ms (default: 240) */
  enterMs?: number;
  /** Hold duration in ms (default: 2200) */
  holdMs?: number;
  /** Exit duration in ms (default: 260) */
  exitMs?: number;

  /** Light or Dark surface theme */
  isLight?: boolean;
  className?: string;
}

const PACKAGED_SVG_SET = new Set<string>([
  'bomb-emoji',
  'crossbar-outline',
  'crossbar-solid',
  'bounce-outline',
  'bounce-solid',
  'high-five',
  'tactics',
  'tactics-square',
  'strategy',
]);

export const DEFAULT_STATS_EVENT_ITEM: StatsEventFeedItem = {
  id: 'crossbar-ping',
  iconName: 'crossbar-outline',
  kickerText: 'ZEN_MASTER_RL · SHOT TELEMETRY',
  titleText: 'CROSSBAR PING',
  capsuleText: '118 KM/H',
  footnoteText: 'UPPER 90 IRON DEFLECTION · 0.42M FROM GOAL LINE',
  footnoteTag: '+15 PTS',
  accentColor: '#F59E0B',
};

const SingleStatsEventRow: React.FC<{
  data: StatsEventFeedItem;
  showIcon: boolean;
  showIconBox: boolean;
  iconSizePx: number;
  iconColor?: string;
  showKicker: boolean;
  showCapsule: boolean;
  capsuleStyle: StatsEventCapsuleStyle;
  showFootnote: boolean;
  layoutVariant: StatsEventLayoutVariant;
  glowBlurPx: number;
  glowIntensityPct: number;
  fontFamily: string;
  titleFontSizePx: number;
  titleFontWeight: number;
  isLight: boolean;
}> = ({
  data,
  showIcon,
  showIconBox,
  iconSizePx,
  iconColor,
  showKicker,
  showCapsule,
  capsuleStyle,
  showFootnote,
  layoutVariant,
  glowBlurPx,
  glowIntensityPct,
  fontFamily,
  titleFontSizePx,
  titleFontWeight,
  isLight,
}) => {
  const accent = data.accentColor || '#F59E0B';
  const resolvedIconColor = iconColor || accent;
  const isPackagedSvg = PACKAGED_SVG_SET.has(data.iconName);
  const vars = data.svgVariations;

  const iconGlowFilter = buildSvgDropShadowFilter(
    resolvedIconColor,
    glowBlurPx,
    glowIntensityPct
  );

  const renderIconNode = () => {
    if (isPackagedSvg) {
      return (
        <PackagedSvgIcon
          icon={data.iconName as PackagedSvgId}
          size={iconSizePx}
          color={resolvedIconColor}
          glowColor={resolvedIconColor}
          glowBlurPx={glowBlurPx}
          glowIntensityPct={glowIntensityPct}
          strokeWidth={vars?.bombStrokeWidth ?? 2.0}
          highFiveOptions={{
            showSparks: vars?.highFiveShowSparks ?? true,
            fillLeftHand: vars?.highFiveFillLeftHand ?? false,
            fillRightHand: vars?.highFiveFillRightHand ?? false,
          }}
          strategyOptions={{
            topLeftCircle: vars?.strategyTopLeftCircle ?? false,
            bottomRightCircle: vars?.strategyBottomRightCircle ?? false,
          }}
        />
      );
    }
    return (
      <span
        className="inline-flex items-center justify-center"
        style={{
          color: resolvedIconColor,
          filter: iconGlowFilter,
        }}
      >
        {renderNamedIcon(data.iconName, {
          size: iconSizePx,
          strokeWidth: vars?.bombStrokeWidth ?? 2.1,
        })}
      </span>
    );
  };

  const renderCapsuleBadge = () => {
    if (!showCapsule || !data.capsuleText) return null;

    let capsuleInlineStyle: React.CSSProperties = {};
    if (capsuleStyle === 'solid') {
      capsuleInlineStyle = {
        backgroundColor: accent,
        color: '#09090B',
        borderColor: accent,
        boxShadow: glowBlurPx > 0 ? `0 0 0 1px ${accent}66` : undefined,
      };
    } else if (capsuleStyle === 'outline') {
      capsuleInlineStyle = {
        backgroundColor: 'transparent',
        color: accent,
        borderColor: `${accent}99`,
      };
    } else {
      // 'tinted'
      capsuleInlineStyle = {
        backgroundColor: `${accent}22`,
        color: accent,
        borderColor: `${accent}55`,
      };
    }

    return (
      <span
        data-ui-element="hud-stats-event-capsule"
        className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-extrabold uppercase tracking-wider tabular-nums leading-tight"
        style={{
          fontFamily: 'var(--font-jetbrains)',
          ...capsuleInlineStyle,
        }}
      >
        {data.capsuleText}
      </span>
    );
  };

  // Surface styles per layoutVariant (zero backdrop-blur, uniform perimeter ring)
  const isMinimal = layoutVariant === 'minimal-hud';
  const isCompactPill = layoutVariant === 'compact-pill';

  const containerSurfaceClass = isMinimal
    ? 'bg-transparent border-transparent shadow-none px-2 py-1'
    : isCompactPill
    ? isLight
      ? 'bg-white/96 border-neutral-300 text-neutral-900 shadow-md rounded-full px-4 py-2 border'
      : 'bg-[#09090B]/94 border-white/15 text-white shadow-md rounded-full px-4 py-2 border'
    : isLight
    ? 'bg-white/96 border-neutral-300 text-neutral-900 shadow-md rounded-2xl px-3.5 py-2.5 border'
    : 'bg-[#09090B]/94 border-white/14 text-white shadow-md rounded-2xl px-3.5 py-2.5 border';

  const containerBorderGlowStyle: React.CSSProperties =
    !isMinimal && glowBlurPx > 0
      ? {
          boxShadow: isLight
            ? `0 0 0 2px rgba(115,115,115,0.18), inset 0 0 0 1px ${accent}55`
            : `0 0 0 2px rgba(0,0,0,0.65), inset 0 0 0 1px ${accent}66`,
        }
      : {};

  return (
    <div
      data-ui-element="hud-stats-event-card"
      className={`relative flex flex-col gap-1.5 transition-all duration-200 ${containerSurfaceClass}`}
      style={{
        fontFamily,
        minWidth: isCompactPill ? '260px' : '300px',
        maxWidth: '460px',
        ...containerBorderGlowStyle,
      }}
    >
      {/* Top Main Row: [Icon] + [Kicker & Title Text] + [Capsule Pill] */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {showIcon && (
            <div
              data-ui-element="hud-stats-event-icon"
              className={`shrink-0 flex items-center justify-center transition-all ${
                showIconBox && !isMinimal
                  ? 'rounded-xl border p-1.5'
                  : ''
              }`}
              style={
                showIconBox && !isMinimal
                  ? {
                      backgroundColor: `${accent}18`,
                      borderColor: `${accent}45`,
                    }
                  : undefined
              }
            >
              {renderIconNode()}
            </div>
          )}

          <div className="flex flex-col min-w-0 leading-snug">
            {showKicker && data.kickerText && (
              <span
                data-ui-element="hud-stats-event-kicker"
                className={`text-[9px] font-mono font-bold uppercase tracking-[0.14em] truncate ${
                  isMinimal
                    ? 'text-white/90'
                    : isLight
                    ? 'text-neutral-500'
                    : 'text-neutral-400'
                }`}
              >
                {data.kickerText}
              </span>
            )}
            <span
              data-ui-element="hud-stats-event-title"
              className={`uppercase tracking-[0.06em] truncate ${
                isMinimal
                  ? 'text-white'
                  : isLight
                  ? 'text-neutral-950'
                  : 'text-white'
              }`}
              style={{
                fontSize: `${titleFontSizePx}px`,
                fontWeight: titleFontWeight,
                WebkitTextStroke:
                  isMinimal
                    ? '0.8px rgba(0,0,0,0.85)'
                    : glowBlurPx > 0
                    ? `0.5px ${accent}88`
                    : undefined,
              }}
            >
              {data.titleText}
            </span>
          </div>
        </div>

        {/* Right Capsule / Pill */}
        {renderCapsuleBadge()}
      </div>

      {/* Bottom Footnote Row */}
      {showFootnote && (data.footnoteText || data.footnoteTag) && (
        <div
          data-ui-element="hud-stats-event-footnote"
          className={`flex items-center justify-between gap-2 pt-1 text-[10px] font-mono leading-none ${
            isMinimal
              ? 'text-white/90'
              : isLight
              ? 'border-t border-neutral-200/80 text-neutral-500'
              : 'border-t border-white/10 text-neutral-400'
          }`}
        >
          <span className="truncate tracking-wide">{data.footnoteText}</span>
          {data.footnoteTag && (
            <span
              className="shrink-0 font-bold tabular-nums tracking-wider"
              style={{ color: accent }}
            >
              {data.footnoteTag}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const StatsEventFeedHUD: React.FC<StatsEventFeedHUDProps> = React.memo(
  ({
    item = DEFAULT_STATS_EVENT_ITEM,
    feedItems,
    showIcon = true,
    showIconBox = true,
    iconSizePx = 26,
    iconColor,
    showKicker = true,
    showCapsule = true,
    capsuleStyle = 'tinted',
    showFootnote = true,
    layoutVariant = 'card',
    glowBlurPx = 0,
    glowIntensityPct = 0,
    fontFamily = 'var(--font-space-grotesk)',
    titleFontSizePx = 15,
    titleFontWeight = 800,
    triggerKey = 0,
    autoLifecycle = false,
    enterMs = 240,
    holdMs = 2200,
    exitMs = 260,
    isLight = false,
    className = '',
  }) => {
    const [phase, setPhase] = useState<'entering' | 'holding' | 'exiting' | 'hidden'>('holding');

    useEffect(() => {
      if (!autoLifecycle && triggerKey === 0) {
        setPhase('holding');
        return;
      }

      setPhase('entering');
      const holdTimer = window.setTimeout(() => {
        setPhase('holding');
      }, Math.max(16, enterMs));

      let exitTimer: number | undefined;
      let hideTimer: number | undefined;

      if (autoLifecycle) {
        exitTimer = window.setTimeout(() => {
          setPhase('exiting');
        }, Math.max(16, enterMs + holdMs));

        hideTimer = window.setTimeout(() => {
          setPhase('hidden');
        }, Math.max(16, enterMs + holdMs + exitMs));
      }

      return () => {
        window.clearTimeout(holdTimer);
        if (exitTimer !== undefined) window.clearTimeout(exitTimer);
        if (hideTimer !== undefined) window.clearTimeout(hideTimer);
      };
    }, [triggerKey, autoLifecycle, enterMs, holdMs, exitMs]);

    const itemsToRender =
      feedItems && feedItems.length > 0 ? feedItems : [item];

    const phaseStyle: React.CSSProperties =
      phase === 'entering'
        ? {
            opacity: 0,
            transform: 'translate3d(0, -10px, 0) scale(0.94)',
            transition: `all ${enterMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }
        : phase === 'holding'
        ? {
            opacity: 1,
            transform: 'translate3d(0, 0, 0) scale(1)',
            transition: `all ${enterMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }
        : phase === 'exiting'
        ? {
            opacity: 0,
            transform: 'translate3d(0, -8px, 0) scale(0.96)',
            transition: `all ${exitMs}ms cubic-bezier(0.4, 0, 1, 1)`,
          }
        : {
            opacity: 0,
            pointerEvents: 'none',
          };

    return (
      <div
        data-ui-element="hud-5f-stats-event-feed"
        className={`flex flex-col items-center gap-2 select-none pointer-events-none ${className}`}
        style={phaseStyle}
      >
        {itemsToRender.map((entry) => (
          <SingleStatsEventRow
            key={entry.id}
            data={entry}
            showIcon={showIcon}
            showIconBox={showIconBox}
            iconSizePx={iconSizePx}
            iconColor={iconColor}
            showKicker={showKicker}
            showCapsule={showCapsule}
            capsuleStyle={capsuleStyle}
            showFootnote={showFootnote}
            layoutVariant={layoutVariant}
            glowBlurPx={glowBlurPx}
            glowIntensityPct={glowIntensityPct}
            fontFamily={fontFamily}
            titleFontSizePx={titleFontSizePx}
            titleFontWeight={titleFontWeight}
            isLight={isLight}
          />
        ))}
      </div>
    );
  }
);

StatsEventFeedHUD.displayName = 'StatsEventFeedHUD';
