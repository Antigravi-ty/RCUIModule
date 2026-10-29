import React, { useState } from 'react';
import { Badge } from '../primitives/Badge';
import {
  DEFAULT_PLAY_CARD_STYLE_PARAMS,
  DEFAULT_CARD_ICON_COLORS,
  resolvePlayCardIconColorClass,
  resolvePlayCardIconHex,
  isCustomPlayCardColor,
  type PlayCardStyleParams,
  type PlayCardStyleVariant,
  type PlayCardIconColorValue,
  type PlayModeCardId,
} from '../stores/playCardStyleStore';

export interface PlayModeCardProps {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeVariant?: 'primary' | 'warning' | 'success' | 'neutral' | 'amber';
  icon: React.ReactNode;
  /** Optional explicit per-card icon color token or custom RGB/Hex override */
  iconColorToken?: PlayCardIconColorValue;
  isLight?: boolean;
  disabled?: boolean;
  /** Style variant override (defaults to styleParams.variant or 'mono-giant-watermark') */
  variant?: PlayCardStyleVariant;
  /** Optional granular style parameters (pure props-driven, zero store coupling) */
  styleParams?: Partial<PlayCardStyleParams>;
  onClick?: (id: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
}

/**
 * [L2 Layout] PlayModeCard
 * Pure props-driven mode selection card supporting 3 distinct visual archetypes:
 * 1. 'icon-badge-top': Row 1 [Left Icon + Right Badge] -> Row 2 [Title] -> Row 3 [Description]
 * 2. 'icon-title-inline': Row 1 [Left Icon + Right Title (No Badge)] -> Row 2 [Description]
 * 3. 'mono-giant-watermark': Large JetBrains Mono title + Giant background watermark icon (~30% opacity)
 */
export const PlayModeCard: React.FC<PlayModeCardProps> = React.memo(({
  id,
  title,
  subtitle,
  badge,
  badgeVariant = 'primary',
  icon,
  iconColorToken,
  isLight = false,
  disabled = false,
  variant: variantOverride,
  styleParams,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const cfg: PlayCardStyleParams = {
    ...DEFAULT_PLAY_CARD_STYLE_PARAMS,
    ...(styleParams || {}),
    cardIconColors: {
      ...DEFAULT_CARD_ICON_COLORS,
      ...(styleParams?.cardIconColors || {}),
    },
  };
  const activeVariant: PlayCardStyleVariant = variantOverride ?? cfg.variant;

  const normalizedCardKey = (id === 'online-training' ? 'host-training' : id) as PlayModeCardId;
  const resolvedCardColorValue: PlayCardIconColorValue | undefined =
    iconColorToken ?? cfg.cardIconColors?.[normalizedCardKey];
  const isCustomColor = isCustomPlayCardColor(resolvedCardColorValue);
  const perCardColorClass = resolvePlayCardIconColorClass(resolvedCardColorValue, isLight);
  const perCardCustomCssColor = isCustomColor
    ? resolvePlayCardIconHex(resolvedCardColorValue, isLight)
    : undefined;

  const renderClonedIcon = (
    node: React.ReactNode,
    sizePx: number,
    strokeWidth: number,
    overrideColorClass?: string,
    overrideCssColor?: string
  ) => {
    if (!React.isValidElement(node)) return node;
    const el = node as React.ReactElement<{
      className?: string;
      size?: number;
      width?: number;
      height?: number;
      strokeWidth?: number;
      style?: React.CSSProperties;
    }>;
    const origClass = el.props.className || '';
    // Strip fixed h-X w-X classes so explicit pixel dimensions take effect cleanly
    const strippedClass = origClass
      .replace(/\bh-\d+(?:\.\d+)?\b/g, '')
      .replace(/\bw-\d+(?:\.\d+)?\b/g, '')
      .trim();
    const shouldStripColorClasses = Boolean(overrideColorClass || overrideCssColor);
    const colorProcessedClass = shouldStripColorClasses
      ? (
          strippedClass.replace(/\b(?:dark:)?text-[a-z]+-\d+\b/g, '').trim() +
          (overrideColorClass ? ` ${overrideColorClass}` : '')
        ).trim()
      : strippedClass;

    return React.cloneElement(el, {
      size: sizePx,
      width: sizePx,
      height: sizePx,
      strokeWidth,
      className: `shrink-0 transition-transform duration-200 ${colorProcessedClass}`.trim(),
      style: {
        ...(el.props.style || {}),
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        ...(overrideCssColor ? { color: overrideCssColor } : {}),
      },
    });
  };

  const clampClass =
    cfg.descLineClamp === 1
      ? 'line-clamp-1'
      : cfg.descLineClamp === 2
      ? 'line-clamp-2'
      : cfg.descLineClamp === 3
      ? 'line-clamp-3'
      : '';

  const titleFontFamily = cfg.titleUseMonoFont ? 'var(--font-jetbrains)' : 'var(--font-apple)';

  // Watermark positioning for Style 3
  const getWatermarkPositionStyle = (): React.CSSProperties => {
    const ox = cfg.watermarkOffsetXPx;
    const oy = cfg.watermarkOffsetYPx;
    const scale = isHovered ? cfg.watermarkHoverScale : 1;
    const rot = cfg.watermarkRotateDeg;

    switch (cfg.watermarkAnchor) {
      case 'center':
        return {
          left: `calc(50% + ${ox}px)`,
          top: `calc(50% + ${oy}px)`,
          transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
        };
      case 'right-center':
        return {
          right: `${-ox}px`,
          top: `calc(50% + ${oy}px)`,
          transform: `translateY(-50%) rotate(${rot}deg) scale(${scale})`,
        };
      case 'top-right':
        return {
          right: `${-ox}px`,
          top: `${-oy}px`,
          transform: `rotate(${rot}deg) scale(${scale})`,
        };
      case 'bottom-left':
        return {
          left: `${-ox}px`,
          bottom: `${-oy}px`,
          transform: `rotate(${rot}deg) scale(${scale})`,
        };
      case 'bottom-right':
      default:
        return {
          right: `${-ox}px`,
          bottom: `${-oy}px`,
          transform: `rotate(${rot}deg) scale(${scale})`,
        };
    }
  };

  const watermarkColorOverride =
    cfg.watermarkColorMode === 'amber'
      ? 'text-amber-500'
      : cfg.watermarkColorMode === 'neutral'
      ? isLight
        ? 'text-neutral-500'
        : 'text-neutral-300'
      : perCardColorClass;

  const watermarkCssColorOverride =
    cfg.watermarkColorMode === 'mode-accent' ? perCardCustomCssColor : undefined;

  // Title alignment classes for Style 3
  const getMonoContainerAlignmentClass = (): string => {
    switch (cfg.monoTitleAnchor) {
      case 'center':
        return 'items-center justify-center text-center';
      case 'bottom-left':
        return 'items-start justify-end text-left';
      case 'top-left':
        return 'items-start justify-start text-left';
      case 'bottom-right':
        return 'items-end justify-end text-right';
      case 'center-left':
      default:
        return 'items-start justify-center text-left';
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      data-play-card-id={id}
      data-play-card-variant={activeVariant}
      onClick={() => onClick?.(id)}
      onMouseEnter={() => {
        setIsHovered(true);
        onMouseEnter?.();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onMouseLeave?.();
      }}
      style={{
        paddingLeft: `${cfg.cardPaddingXPx}px`,
        paddingRight: `${cfg.cardPaddingXPx}px`,
        paddingTop: `${cfg.cardPaddingYPx}px`,
        paddingBottom: `${cfg.cardPaddingYPx}px`,
        minHeight: `${cfg.cardMinHeightPx}px`,
        borderRadius: `${cfg.cardRadiusPx}px`,
      }}
      className={`group relative overflow-hidden flex flex-col w-full text-left transition-all duration-150 border cursor-pointer select-none active:scale-[0.985] ${
        isLight
          ? 'bg-neutral-50/90 hover:bg-white hover:border-amber-400 hover:shadow-xs border-neutral-200/90 text-neutral-900'
          : 'bg-neutral-850/85 hover:bg-neutral-800 hover:border-amber-500/70 hover:shadow-md border-neutral-700/80 text-neutral-100'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      {/* ──────────────────────────────────────────────────────────────────────
          STYLE 1: 'icon-badge-top'
          Row 1: Left Icon + Right Badge
          Row 2: Title
          Row 3: Description
         ────────────────────────────────────────────────────────────────────── */}
      {activeVariant === 'icon-badge-top' && (
        <>
          <div
            className="flex items-center justify-between w-full shrink-0"
            style={{ marginBottom: `${cfg.style1TopRowMarginBottomPx}px` }}
          >
            {cfg.showIconBox ? (
              <div
                style={{
                  padding: `${cfg.iconBoxPaddingPx}px`,
                  borderRadius: `${cfg.iconBoxRadiusPx}px`,
                }}
                className={`border transition-colors flex items-center justify-center shrink-0 ${
                  isLight
                    ? 'bg-white border-neutral-200 group-hover:border-amber-300'
                    : 'bg-neutral-900 border-neutral-700/80 group-hover:border-amber-500/50'
                }`}
              >
                {renderClonedIcon(
                  icon,
                  cfg.iconSizePx,
                  cfg.iconStrokeWidth,
                  perCardColorClass,
                  perCardCustomCssColor
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center shrink-0">
                {renderClonedIcon(
                  icon,
                  cfg.iconSizePx,
                  cfg.iconStrokeWidth,
                  perCardColorClass,
                  perCardCustomCssColor
                )}
              </div>
            )}

            {badge && (
              <Badge variant={badgeVariant} size="sm" isLight={isLight}>
                {badge}
              </Badge>
            )}
          </div>

          <span
            style={{
              fontSize: `${cfg.titleFontSizePx}px`,
              fontWeight: cfg.titleFontWeight,
              fontFamily: titleFontFamily,
              marginBottom: `${cfg.style1TitleMarginBottomPx}px`,
            }}
            className="tracking-tight group-hover:text-amber-500 transition-colors leading-snug"
          >
            {title}
          </span>

          <span
            style={{
              fontSize: `${cfg.descFontSizePx}px`,
              lineHeight: cfg.descLineHeight,
            }}
            className={`${clampClass} ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}
          >
            {subtitle}
          </span>
        </>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          STYLE 2: 'icon-title-inline'
          Row 1: Left Icon + Right Title (No Badge)
          Row 2: Description
         ────────────────────────────────────────────────────────────────────── */}
      {activeVariant === 'icon-title-inline' && (
        <>
          <div
            style={{
              gap: `${cfg.inlineIconTitleGapPx}px`,
              marginBottom: `${cfg.inlineHeaderMarginBottomPx}px`,
            }}
            className={`flex items-center w-full shrink-0 ${
              cfg.inlineHeaderLayout === 'space-between' ? 'justify-between' : 'justify-start'
            }`}
          >
            {cfg.showIconBox ? (
              <div
                style={{
                  padding: `${cfg.iconBoxPaddingPx}px`,
                  borderRadius: `${cfg.iconBoxRadiusPx}px`,
                }}
                className={`border transition-colors flex items-center justify-center shrink-0 ${
                  isLight
                    ? 'bg-white border-neutral-200 group-hover:border-amber-300'
                    : 'bg-neutral-900 border-neutral-700/80 group-hover:border-amber-500/50'
                }`}
              >
                {renderClonedIcon(
                  icon,
                  cfg.iconSizePx,
                  cfg.iconStrokeWidth,
                  perCardColorClass,
                  perCardCustomCssColor
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center shrink-0">
                {renderClonedIcon(
                  icon,
                  cfg.iconSizePx,
                  cfg.iconStrokeWidth,
                  perCardColorClass,
                  perCardCustomCssColor
                )}
              </div>
            )}

            <span
              style={{
                fontSize: `${cfg.titleFontSizePx}px`,
                fontWeight: cfg.titleFontWeight,
                fontFamily: titleFontFamily,
              }}
              className="tracking-tight group-hover:text-amber-500 transition-colors leading-snug truncate"
            >
              {title}
            </span>
          </div>

          <span
            style={{
              fontSize: `${cfg.descFontSizePx}px`,
              lineHeight: cfg.descLineHeight,
            }}
            className={`${clampClass} ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}
          >
            {subtitle}
          </span>
        </>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          STYLE 3: 'mono-giant-watermark'
          Background: Giant Watermark Icon (~30% opacity, configurable size/pos/rot/color)
          Foreground: Large JetBrains Mono Title (+ optional badge/desc)
         ────────────────────────────────────────────────────────────────────── */}
      {activeVariant === 'mono-giant-watermark' && (
        <>
          {/* Giant Background Watermark Icon Layer */}
          <div
            aria-hidden="true"
            style={{
              ...getWatermarkPositionStyle(),
              opacity:
                (isHovered ? cfg.watermarkHoverOpacityPct : cfg.watermarkOpacityPct) / 100,
            }}
            className="absolute pointer-events-none select-none z-0 transition-all duration-200 ease-out"
          >
            {renderClonedIcon(
              icon,
              cfg.watermarkSizePx,
              cfg.watermarkStrokeWidth,
              watermarkColorOverride,
              watermarkCssColorOverride
            )}
          </div>

          {/* Optional Corner Badge */}
          {cfg.monoShowBadge && badge && (
            <div className="relative z-10 w-full flex justify-end mb-auto">
              <Badge variant={badgeVariant} size="sm" isLight={isLight}>
                {badge}
              </Badge>
            </div>
          )}

          {/* Foreground Large JetBrains Mono Title & Optional Subtitle */}
          <div
            className={`relative z-10 flex flex-col flex-1 w-full ${getMonoContainerAlignmentClass()}`}
          >
            <span
              style={{
                fontFamily: 'var(--font-jetbrains)',
                fontSize: `${cfg.monoTitleSizePx}px`,
                fontWeight: cfg.monoTitleWeight,
                letterSpacing: `${cfg.monoLetterSpacingEm}em`,
                lineHeight: cfg.monoLineHeight,
                textTransform: cfg.monoUppercase ? 'uppercase' : 'none',
              }}
              className={`group-hover:text-amber-500 transition-colors ${
                isLight ? 'text-neutral-900' : 'text-neutral-100'
              }`}
            >
              {title}
            </span>

            {cfg.monoShowDescription && (
              <span
                style={{
                  fontSize: `${cfg.descFontSizePx}px`,
                  lineHeight: cfg.descLineHeight,
                }}
                className={`mt-1.5 ${clampClass} ${
                  isLight ? 'text-neutral-600/90' : 'text-neutral-300/85'
                }`}
              >
                {subtitle}
              </span>
            )}
          </div>
        </>
      )}
    </button>
  );
});

PlayModeCard.displayName = 'PlayModeCard';
