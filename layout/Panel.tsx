import React, { createContext, useContext, useState } from 'react';
import { ArrowLeft, Info, Minimize2 } from 'lucide-react';
import { KeycapBadge } from '../primitives/KeycapBadge';
import { UI_RADIUS } from '../tokens/radius';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import {
  resolvePanelHeaderBackBtnGeometry,
  type PanelSizingConfig,
  type PanelSizingMode,
} from '../tokens/menuLayoutTokens';

export const MorphContainerContext = createContext<boolean>(false);
export const useInMorphContainer = () => useContext(MorphContainerContext);

const PanelSizingModeContext = createContext<PanelSizingMode>('fixed');

export interface PanelHeaderProps {
  title: string;
  onBack?: () => void;
  /** Keep the Back button permanently mounted in the header but disabled (prevents header height shift between root and detail views) */
  backDisabled?: boolean;
  /** Custom right-side element. If omitted, the standardized Right Action Button can be rendered via `onRightAction` or `showRightAction`. */
  rightElement?: React.ReactNode;
  /** Callback when the standardized top-right action button (e.g. Live Preview / Minimize) is clicked */
  onRightAction?: () => void;
  /** Explicitly show or hide the standardized top-right action button (defaults to true when `onRightAction` is provided) */
  showRightAction?: boolean;
  /** Custom icon for the standardized top-right action button (defaults to Lucide `<Minimize2 />`) */
  rightActionIcon?: React.ReactNode;
  /** Hover label for the standardized top-right action button (defaults to `'Live Preview'`) */
  rightActionLabel?: string;
  /** Optional hover callback so hovering the top-right action button can also update PanelFooter's hoveredDescription */
  onRightActionHoverChange?: (hovered: boolean) => void;
  isLight?: boolean;
  className?: string;
  titleClassName?: string;
  style?: React.CSSProperties;
}

/**
 * 3-Stage Compound Panel Header (Layer 2+ Standard Shell)
 * Driven by L0 `useMenuLayoutStore` tokens and pure geometry resolver `resolvePanelHeaderBackBtnGeometry`
 * so tuning in L2/L6 immediately updates all Layer 2–4 recipes and L7 sandboxes with zero coupling.
 */
export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  onBack,
  backDisabled = false,
  rightElement,
  onRightAction,
  showRightAction,
  rightActionIcon,
  rightActionLabel = 'Live Preview',
  onRightActionHoverChange,
  isLight = false,
  className = '',
  titleClassName = '',
  style,
}) => {
  const headerPadX = useMenuLayoutStore((s) => s.panelHeaderPaddingX);
  const headerPadY = useMenuLayoutStore((s) => s.panelHeaderPaddingY);
  const titleFontSize = useMenuLayoutStore((s) => s.panelHeaderTitleFontSize);
  const backBtnWidth = useMenuLayoutStore((s) => s.panelHeaderBackBtnWidth);
  const backBtnHeight = useMenuLayoutStore((s) => s.panelHeaderBackBtnHeight);
  const backBtnShowArrow = useMenuLayoutStore((s) => s.panelHeaderBackBtnShowArrow);
  const backBtnShowLabel = useMenuLayoutStore((s) => s.panelHeaderBackBtnShowLabel);
  const backBtnIdleTone = useMenuLayoutStore((s) => s.panelHeaderBackBtnIdleTone);
  const backBtnStyle = useMenuLayoutStore((s) => s.panelHeaderBackBtnStyle);
  const backBtnRadiusMode = useMenuLayoutStore((s) => s.panelHeaderBackBtnRadiusMode);
  const backBtnCustomRadius = useMenuLayoutStore((s) => s.panelHeaderBackBtnRadius);
  const backBtnInnerRadius = useMenuLayoutStore((s) => s.panelHeaderBackBtnInnerRadius);
  const backBtnRadiusTL = useMenuLayoutStore((s) => s.panelHeaderBackBtnRadiusTL);
  const backBtnRadiusTR = useMenuLayoutStore((s) => s.panelHeaderBackBtnRadiusTR);
  const backBtnRadiusBR = useMenuLayoutStore((s) => s.panelHeaderBackBtnRadiusBR);
  const backBtnRadiusBL = useMenuLayoutStore((s) => s.panelHeaderBackBtnRadiusBL);
  const showRightBtnToken = useMenuLayoutStore((s) => s.panelHeaderShowRightBtn);
  const rightBtnTransform = useMenuLayoutStore((s) => s.panelHeaderRightBtnTransform);
  const rightBtnExpandOnHover = useMenuLayoutStore((s) => s.panelHeaderRightBtnExpandOnHover);
  const panelOuterRadius = useMenuLayoutStore((s) => s.panelOuterRadius);

  const [rightHovered, setRightHovered] = useState(false);

  const btnGeom = resolvePanelHeaderBackBtnGeometry({
    panelHeaderPaddingX: headerPadX, panelHeaderPaddingY: headerPadY,
    panelHeaderBackBtnWidth: backBtnWidth, panelHeaderBackBtnHeight: backBtnHeight,
    panelHeaderBackBtnRadiusMode: backBtnRadiusMode, panelHeaderBackBtnRadius: backBtnCustomRadius,
    panelHeaderBackBtnInnerRadius: backBtnInnerRadius, panelHeaderBackBtnRadiusTL: backBtnRadiusTL,
    panelHeaderBackBtnRadiusTR: backBtnRadiusTR, panelHeaderBackBtnRadiusBR: backBtnRadiusBR,
    panelHeaderBackBtnRadiusBL: backBtnRadiusBL, panelOuterRadius,
  });

  const effectiveShowArrow = backBtnShowArrow || !backBtnShowLabel;
  const effectiveShowLabel = backBtnShowLabel;

  const isFlushDividerMode = headerPadX === 0 && headerPadY === 0 && btnGeom.innerRadius === 0;
  const leftBorderStructureClass =
    backBtnStyle === 'surface' ? (isFlushDividerMode ? 'border-0 border-r' : 'border') : 'border-0';
  const rightBorderStructureClass =
    backBtnStyle === 'surface' ? (isFlushDividerMode ? 'border-0 border-l' : 'border') : 'border-0';

  const getBtnSurfaceClasses = (disabled = false) => {
    const borderColorClass = isLight
      ? 'border-neutral-200/90 hover:border-neutral-300'
      : 'border-neutral-800/80 hover:border-neutral-700';

    if (disabled) {
      if (backBtnIdleTone === 'match-header' || backBtnStyle === 'ghost') {
        return `${isLight ? 'text-neutral-300' : 'text-neutral-600'} bg-transparent ${borderColorClass} opacity-50 cursor-not-allowed`;
      }
      if (backBtnIdleTone === 'muted-gray' || backBtnStyle === 'subtle') {
        return `${isLight ? 'bg-neutral-200/40 text-neutral-300' : 'bg-neutral-900/50 text-neutral-600'} ${borderColorClass} opacity-50 cursor-not-allowed`;
      }
      return `${isLight ? 'bg-white/70 text-neutral-300' : 'bg-neutral-800/50 text-neutral-600'} ${borderColorClass} opacity-50 cursor-not-allowed`;
    }

    if (backBtnIdleTone === 'match-header') {
      return isLight
        ? `bg-transparent hover:bg-neutral-200/80 active:bg-neutral-300/75 ${borderColorClass} text-neutral-500 hover:text-neutral-950 cursor-pointer`
        : `bg-transparent hover:bg-neutral-800/85 active:bg-neutral-700/80 ${borderColorClass} text-neutral-400 hover:text-white cursor-pointer`;
    }

    if (backBtnIdleTone === 'muted-gray') {
      if (isFlushDividerMode) {
        return isLight
          ? `bg-neutral-200/50 hover:bg-neutral-200/95 active:bg-neutral-300/80 ${borderColorClass} text-neutral-500 hover:text-neutral-950 cursor-pointer`
          : `bg-neutral-900/65 hover:bg-neutral-800/90 active:bg-neutral-700/85 ${borderColorClass} text-neutral-400 hover:text-white cursor-pointer`;
      }
      return isLight
        ? 'bg-neutral-200/55 hover:bg-white border-neutral-300/75 hover:border-neutral-300 text-neutral-500 hover:text-neutral-950 shadow-2xs active:scale-95 cursor-pointer'
        : 'bg-neutral-800/55 hover:bg-neutral-700/90 border-neutral-700/50 hover:border-neutral-600 text-neutral-400 hover:text-white shadow-2xs active:scale-95 cursor-pointer';
    }

    if (isFlushDividerMode) {
      return isLight
        ? `bg-white/90 hover:bg-neutral-200/90 active:bg-neutral-300/80 ${borderColorClass} text-neutral-700 hover:text-neutral-950 cursor-pointer`
        : `bg-neutral-800/80 hover:bg-neutral-700/90 active:bg-neutral-600/80 ${borderColorClass} text-neutral-200 hover:text-white cursor-pointer`;
    }
    return isLight
      ? 'bg-white hover:bg-neutral-100 border-neutral-300/80 text-neutral-700 hover:text-neutral-950 shadow-2xs active:scale-95 cursor-pointer'
      : 'bg-neutral-800/85 hover:bg-neutral-700/90 border-neutral-700/60 text-neutral-200 hover:text-white shadow-2xs active:scale-95 cursor-pointer';
  };

  const minHeaderHeight = btnGeom.height + headerPadY * 2;
  const labelFontSize = Math.max(10, Math.min(13, Math.round(btnGeom.height * 0.36)));

  const shouldRenderRightAction =
    showRightBtnToken && Boolean(showRightAction ?? onRightAction);

  const rightIconTransformStyle: React.CSSProperties =
    rightBtnTransform === 'flip-x'
      ? { transform: 'scaleX(-1)' }
      : rightBtnTransform === 'rotate-90'
      ? { transform: 'rotate(90deg)' }
      : {};

  const isRightExpanded = rightHovered && rightBtnExpandOnHover;

  return (
    <div
      data-ui-element="panel-header"
      data-panel-section="header"
      style={{
        paddingLeft: `${headerPadX}px`,
        paddingRight: shouldRenderRightAction ? `${headerPadX}px` : `${headerPadX || 12}px`,
        paddingTop: `${headerPadY}px`,
        paddingBottom: `${headerPadY}px`,
        minHeight: `${minHeaderHeight}px`,
        ...style,
      }}
      className={`relative flex items-center justify-between border-b select-none shrink-0 transition-colors duration-150 ${
        isLight
          ? 'border-neutral-200/90 bg-neutral-100/50 text-neutral-900'
          : 'border-neutral-800/80 bg-neutral-950/40 text-white'
      } ${className}`}
    >
      {/* Layer 1: Container-Centered Title (centered across the full header width first; if title is too long, the left/right buttons naturally overlap it) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden px-3">
        <h2
          style={{ fontSize: `${titleFontSize}px` }}
          className={`font-bold tracking-wider uppercase whitespace-nowrap leading-snug text-center ${titleClassName}`}
        >
          {title}
        </h2>
      </div>

      {/* Layer 2 (Left): Fixed carved space on the far left for Back Button */}
      <div className="relative z-10 flex items-center shrink-0">
        {onBack && (
          <button
            type="button"
            disabled={backDisabled}
            onClick={backDisabled ? undefined : onBack}
            style={{
              minWidth: `${btnGeom.width}px`,
              width: effectiveShowLabel ? 'auto' : `${btnGeom.width}px`,
              height: `${btnGeom.height}px`,
              borderRadius: btnGeom.borderRadiusCss,
              paddingLeft: effectiveShowLabel ? '10px' : undefined,
              paddingRight: effectiveShowLabel ? '10px' : undefined,
            }}
            className={`inline-flex items-center justify-center gap-1.5 shrink-0 ${leftBorderStructureClass} transition-all outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 ${getBtnSurfaceClasses(backDisabled)}`}
            aria-label="Back"
          >
            {effectiveShowArrow && (
              <ArrowLeft
                className="shrink-0"
                style={{ width: `${btnGeom.iconSize}px`, height: `${btnGeom.iconSize}px` }}
              />
            )}
            {effectiveShowLabel && (
              <span
                style={{ fontSize: `${labelFontSize}px` }}
                className="font-bold tracking-wider uppercase leading-none select-none"
              >
                BACK
              </span>
            )}
          </button>
        )}
      </div>

      {/* Layer 2 (Right): Standardized carved Right Action Button (Minimize2 / Custom Icon -> Hover "Live Preview") or custom rightElement */}
      {shouldRenderRightAction ? (
        <div className="relative z-10 flex items-center shrink-0 ml-auto">
          <button
            type="button"
            onClick={onRightAction}
            onMouseEnter={() => {
              setRightHovered(true);
              onRightActionHoverChange?.(true);
            }}
            onMouseLeave={() => {
              setRightHovered(false);
              onRightActionHoverChange?.(false);
            }}
            style={{
              minWidth: `${btnGeom.width}px`,
              width: isRightExpanded ? 'auto' : `${btnGeom.width}px`,
              height: `${btnGeom.height}px`,
              borderRadius: btnGeom.rightBorderRadiusCss,
              paddingLeft: isRightExpanded ? '10px' : undefined,
              paddingRight: isRightExpanded ? '10px' : undefined,
            }}
            className={`inline-flex items-center justify-center gap-1.5 shrink-0 ${rightBorderStructureClass} transition-all outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 ${getBtnSurfaceClasses(false)}`}
            aria-label={rightActionLabel}
            title={`${rightActionLabel} [TAB]`}
          >
            {isRightExpanded && (
              <span
                style={{ fontSize: `${labelFontSize}px` }}
                className="font-bold tracking-wider uppercase leading-none whitespace-nowrap select-none"
              >
                {rightActionLabel}
              </span>
            )}
            <span
              className="inline-flex items-center justify-center shrink-0 transition-transform duration-150"
              style={rightIconTransformStyle}
            >
              {rightActionIcon ?? (
                <Minimize2
                  className="shrink-0"
                  style={{ width: `${btnGeom.iconSize}px`, height: `${btnGeom.iconSize}px` }}
                />
              )}
            </span>
          </button>
        </div>
      ) : rightElement ? (
        <div className="relative z-10 flex items-center gap-2 shrink-0 ml-auto">
          {rightElement}
        </div>
      ) : null}
    </div>
  );
};

export interface PanelContentProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
  style?: React.CSSProperties;
}

/**
 * 3-Stage Compound Panel Content Body (Layer 2+ Standard Shell)
 * Driven by L0 `useMenuLayoutStore` tokens (`panelBodyPaddingX`, `panelBodyPaddingY`).
 * - In 'fixed' sizing mode: `flex-1 min-h-0` fills the locked container height.
 * - In 'auto' sizing mode: `flex-initial min-h-0` fits natural content height while shrinking to scroll when hitting maxHeight/availH.
 */
export const PanelContent: React.FC<PanelContentProps> = ({
  children,
  className = '',
  scrollable = true,
  style,
}) => {
  const sizingMode = useContext(PanelSizingModeContext);
  const bodyPadX = useMenuLayoutStore((s) => s.panelBodyPaddingX);
  const bodyPadY = useMenuLayoutStore((s) => s.panelBodyPaddingY);
  const flexClass = sizingMode === 'auto' ? 'flex-initial min-h-0' : 'flex-1 min-h-0';

  return (
    <div
      data-ui-element="panel-content"
      data-panel-section="content"
      style={{
        paddingLeft: `${bodyPadX}px`,
        paddingRight: `${bodyPadX}px`,
        paddingTop: `${bodyPadY}px`,
        paddingBottom: `${bodyPadY}px`,
        ...style,
      }}
      className={`flex flex-col ${flexClass} w-full box-border ${
        scrollable ? 'overflow-y-auto' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export interface PanelContainerProps {
  children: React.ReactNode;
  isLight?: boolean;
  className?: string;
  transparent?: boolean;
  /** Unified per-panel sizing contract ('auto' clamping vs 'fixed' height) */
  sizing?: PanelSizingConfig;
  /** Legacy / explicit outer container height (in px or CSS string) when rendered standalone outside MorphContainer */
  height?: number | string;
  /** Legacy / explicit outer container max-width (in px or CSS string) */
  width?: number | string;
  style?: React.CSSProperties;
}

/**
 * PanelContainer
 * Shell wrapping the 3-stage panel hierarchy (Header -> Content -> Footer).
 * Supports dual sizing modes ('auto' content-fit with min/max clamping vs 'fixed' targetHeight with viewport fallback).
 */
export const PanelContainer: React.FC<PanelContainerProps> = ({
  children,
  isLight = false,
  className = '',
  transparent,
  sizing,
  height,
  width,
  style,
}) => {
  const inMorphContainer = useInMorphContainer();
  const isTransparent = transparent ?? inMorphContainer;

  const effectiveClassName = isTransparent
    ? className
        .replace(/shadow-\[[^\]]+\]/g, '')
        .replace(/\bshadow(-\w+)?\b/g, '')
        .trim()
    : className;

  const effectiveWidth = sizing?.width ?? width;
  const resolvedMaxWidth =
    !inMorphContainer && effectiveWidth !== undefined
      ? typeof effectiveWidth === 'number'
        ? `${effectiveWidth}px`
        : effectiveWidth
      : undefined;

  const sizingMode: PanelSizingMode = sizing?.mode ?? 'fixed';

  // Compute standalone container height constraints when outside MorphContainer
  const standaloneSizingStyle: React.CSSProperties = {};
  if (!inMorphContainer) {
    if (sizing) {
      if (sizing.mode === 'auto') {
        standaloneSizingStyle.height = 'auto';
        standaloneSizingStyle.minHeight = `min(${sizing.minHeight}px, var(--avail-h, 100vh))`;
        standaloneSizingStyle.maxHeight = `min(${sizing.maxHeight}px, var(--avail-h, 100vh))`;
      } else {
        standaloneSizingStyle.height = `min(${sizing.targetHeight}px, var(--avail-h, 100vh))`;
        standaloneSizingStyle.maxHeight = `min(${sizing.targetHeight}px, var(--avail-h, 100vh))`;
      }
    } else if (height !== undefined) {
      const hStr = typeof height === 'number' ? `${height}px` : height;
      standaloneSizingStyle.height = `min(${hStr}, var(--avail-h, 100vh))`;
      standaloneSizingStyle.maxHeight = `min(${hStr}, var(--avail-h, 100vh))`;
    }
  }

  const panelOuterRadius = useMenuLayoutStore((s) => s.panelOuterRadius);

  return (
    <PanelSizingModeContext.Provider value={sizingMode}>
      <div
        data-panel="container"
        data-sizing-mode={sizingMode}
        style={{
          ...standaloneSizingStyle,
          ...(resolvedMaxWidth ? { maxWidth: resolvedMaxWidth } : {}),
          ...(!isTransparent ? { borderRadius: `${panelOuterRadius}px` } : {}),
          ...style,
        }}
        className={`flex flex-col ${
          inMorphContainer ? 'h-full' : sizing?.mode === 'auto' ? 'h-auto' : 'h-full'
        } w-full overflow-hidden transition-colors ${
          isTransparent
            ? 'bg-transparent border-0 ring-0 shadow-none'
            : `${UI_RADIUS.xl} border shadow-2xl ${
                isLight
                  ? 'bg-neutral-50/98 border-neutral-300/80 text-neutral-900 ring-1 ring-black/5'
                  : 'bg-neutral-900/98 border-neutral-700/60 text-neutral-100 ring-1 ring-white/10'
              }`
        } ${effectiveClassName}`}
      >
        {children}
      </div>
    </PanelSizingModeContext.Provider>
  );
};

