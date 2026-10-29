import React from 'react';

/**
 * 9-Zone Semantic HUD Anchor Positions
 * Decouples individual HUD widgets from hardcoded screen coordinates.
 */
export type HudAnchorPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'upper-center'
  | 'left-edge'
  | 'center'
  | 'right-edge'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Slot Presence Strategy inside an Anchor Zone:
 * - `'reserve'`: Fixed landmark slot. When `visible={false}`, keeps its exact DOM box & spacing
 *    footprint (`visibility: hidden; opacity: 0`) so sibling widgets never jump (protects saccadic muscle memory).
 * - `'collapse'`: Flow stack slot. When `visible={false}`, smoothly collapses height & spacing to `0`
 *   so subsequent widgets in the same stack automatically glide into place.
 */
export type HudSlotMode = 'reserve' | 'collapse';

/**
 * Stage-Level Choreography Strategy Preset:
 * - `'reserve'`: Fixed slots everywhere; hiding top-left telemetry leaves `[1-3]` & `[4-6]` untouched.
 * - `'collapse-local'`: Independent corner stacks; hiding top-left telemetry pulls only left `[1-3]` upward.
 * - `'collapse-symmetric'`: Axial-symmetric linked flow; hiding top-left telemetry pulls both left `[1-3]`
 *   and right `[4-6]` upward in unison to preserve strict horizontal team symmetry.
 */
export type HudLayoutStrategy = 'reserve' | 'collapse-local' | 'collapse-symmetric';

export interface HudAnchorStageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Active spatial choreography strategy (exposed as `data-hud-strategy` for telemetry/debugging) */
  strategy?: HudLayoutStrategy;
  /** Optional safe margin in px (ignored on DOM, mapped to CSS custom property if provided) */
  safeMarginPx?: number;
  className?: string;
}

/**
 * HudAnchorStage (L2 Pure Spatial Layout Shell)
 * Full-canvas non-occluding overlay stage that hosts 9-zone `<HudZone>` containers.
 * Zero business logic, zero L3–L7 imports.
 */
export const HudAnchorStage: React.FC<HudAnchorStageProps> = React.memo(
  ({ children, strategy = 'reserve', safeMarginPx: _safeMarginPx, className = '', style, ...props }) => {
    return (
      <div
        data-layout="hud-anchor-stage"
        data-hud-strategy={strategy}
        className={`relative z-20 w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);

HudAnchorStage.displayName = 'HudAnchorStage';

export interface HudZoneProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which of the semantic screen zones this container anchors to */
  anchor: HudAnchorPosition;
  children: React.ReactNode;
  /**
   * If true, sits flush (`0px`) against the anchored viewport edge(s)
   * (e.g., `top-0` for `StepperScoreboardHUD`, `left-0` / `right-0` for `EdgePlayerHudStrip`).
   * If false, applies standard optical safe-area padding (`10px–20px`).
   */
  flush?: boolean;
  /** Flex stack direction inside the zone (defaults to `'col'`) */
  direction?: 'col' | 'row' | 'col-reverse' | 'row-reverse';
  /** Cross-axis alignment override (auto-inferred from `anchor` if omitted) */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Gap in px or CSS string between children when not using `<HudSlot spacingAfter>` */
  gap?: number | string;
  /** Optional z-index class (default `'z-30'`) */
  zIndexClassName?: string;
  className?: string;
}

const ANCHOR_POSITION_CLASSES: Record<HudAnchorPosition, { flush: string; padded: string }> = {
  'top-left': {
    flush: 'top-0 left-0',
    padded: 'top-2.5 left-3',
  },
  'top-center': {
    flush: 'top-0 left-1/2 -translate-x-1/2 w-max max-w-none',
    padded: 'top-3 left-1/2 -translate-x-1/2 w-max max-w-none',
  },
  'top-right': {
    flush: 'top-0 right-0',
    padded: 'top-2.5 right-3',
  },
  'upper-center': {
    flush: 'top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-max max-w-none',
    padded: 'top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-max max-w-none',
  },
  'left-edge': {
    flush: 'top-1/2 left-0 -translate-y-1/2',
    padded: 'top-1/2 left-3 -translate-y-1/2',
  },
  center: {
    flush: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-max max-w-none',
    padded: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-max max-w-none',
  },
  'right-edge': {
    flush: 'top-1/2 right-0 -translate-y-1/2',
    padded: 'top-1/2 right-3 -translate-y-1/2',
  },
  'bottom-left': {
    flush: 'bottom-0 left-0',
    padded: 'bottom-5 left-5',
  },
  'bottom-center': {
    flush: 'bottom-0 left-1/2 -translate-x-1/2 w-max max-w-none',
    padded: 'bottom-5 left-1/2 -translate-x-1/2 w-max max-w-none',
  },
  'bottom-right': {
    flush: 'bottom-0 right-0',
    padded: 'bottom-4 right-5',
  },
};

const DEFAULT_ANCHOR_ALIGN: Record<HudAnchorPosition, 'start' | 'center' | 'end'> = {
  'top-left': 'start',
  'top-center': 'center',
  'top-right': 'end',
  'upper-center': 'center',
  'left-edge': 'start',
  center: 'center',
  'right-edge': 'end',
  'bottom-left': 'start',
  'bottom-center': 'center',
  'bottom-right': 'end',
};

const DIRECTION_CLASSES: Record<NonNullable<HudZoneProps['direction']>, string> = {
  col: 'flex-col',
  row: 'flex-row',
  'col-reverse': 'flex-col-reverse',
  'row-reverse': 'flex-row-reverse',
};

const ALIGN_CLASSES: Record<NonNullable<HudZoneProps['align']>, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

/**
 * HudZone (L2 9-Anchor Spatial Zone Container)
 * Positions a group of HUD widgets at a semantic screen landmark without coupling child components to coordinates.
 */
export const HudZone: React.FC<HudZoneProps> = React.memo(
  ({
    anchor,
    children,
    flush = false,
    direction = 'col',
    align,
    gap,
    zIndexClassName = 'z-30',
    className = '',
    style,
    ...props
  }) => {
    const posClass = flush
      ? ANCHOR_POSITION_CLASSES[anchor].flush
      : ANCHOR_POSITION_CLASSES[anchor].padded;
    const resolvedAlign = align ?? DEFAULT_ANCHOR_ALIGN[anchor];

    return (
      <div
        data-layout="hud-zone"
        data-anchor={anchor}
        className={`absolute flex ${posClass} ${DIRECTION_CLASSES[direction]} ${ALIGN_CLASSES[resolvedAlign]} ${zIndexClassName} ${className}`}
        style={{
          ...(gap !== undefined
            ? { gap: typeof gap === 'number' ? `${gap}px` : gap }
            : undefined),
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

HudZone.displayName = 'HudZone';

export interface HudSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** Whether the widget inside this slot is currently active/shown */
  visible?: boolean;
  /**
   * Presence strategy when `visible={false}`:
   * - `'reserve'`: Keeps the exact intrinsic height/width and spacing in the layout tree (`opacity-0 invisible`).
   * - `'collapse'`: Smoothly animates height (`grid-template-rows: 0fr`) and spacing to `0px` so neighbors reflow.
   */
  mode?: HudSlotMode;
  /**
   * Optional directional slide-out offset when `visible={false}` (e.g., `'translate3d(0, 140%, 0)'`,
   * `'translate3d(130%, 0, 0)'`, `'translate3d(-130%, 0, 0)'`).
   * Animates purely on the GPU compositor (`transform`, `opacity`).
   */
  exitOffset?: string;
  /**
   * If `true`, bypasses CSS transition (`duration-0`) for immediate 0ms show/hide
   * (e.g., when Spectator switches to/from `focusedSlotKey === null`).
   */
  instant?: boolean;
  /**
   * Optional explicit reserved height (px or CSS string) when used as a pure symmetric spacer
   * without children, or as a minimum height guarantee in `'reserve'` mode.
   */
  reservedHeight?: number | string;
  /** Bottom spacing (px or CSS string) that persists in `'reserve'` mode and collapses to `0px` in `'collapse'` mode */
  spacingAfter?: number | string;
  /** Top spacing (px or CSS string) that persists in `'reserve'` mode and collapses to `0px` in `'collapse'` mode */
  spacingBefore?: number | string;
  /** Optional inner wrapper class (e.g. inset padding for a specific card inside a flush zone) */
  innerClassName?: string;
  className?: string;
}

/**
 * HudSlot (L2 Presence & Reflow Wrapper)
 * Controls whether hiding a HUD widget reserves its landmark space (`mode="reserve"`)
 * or triggers a smooth spring reflow of neighboring widgets (`mode="collapse"`).
 * Keeps children mounted in DOM so 120Hz transient channel refs never detach.
 */
export const HudSlot: React.FC<HudSlotProps> = React.memo(
  ({
    children,
    visible = true,
    mode = 'collapse',
    exitOffset,
    instant = false,
    reservedHeight,
    spacingAfter = 0,
    spacingBefore = 0,
    innerClassName = '',
    className = '',
    style,
    ...props
  }) => {
    const shouldHoldSpace = visible || mode === 'reserve';

    const resolvedMarginBottom = shouldHoldSpace
      ? typeof spacingAfter === 'number'
        ? `${spacingAfter}px`
        : spacingAfter
      : '0px';

    const resolvedMarginTop = shouldHoldSpace
      ? typeof spacingBefore === 'number'
        ? `${spacingBefore}px`
        : spacingBefore
      : '0px';

    const resolvedMinHeight =
      shouldHoldSpace && reservedHeight !== undefined
        ? typeof reservedHeight === 'number'
          ? `${reservedHeight}px`
          : reservedHeight
        : '0px';

    const resolvedTransform = visible
      ? 'translate3d(0, 0, 0)'
      : exitOffset ?? 'translate3d(0, 0, 0)';

    const transitionClass = instant
      ? 'transition-none duration-0'
      : 'transition-[grid-template-rows,transform,opacity,margin,min-height,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]';

    return (
      <div
        data-layout="hud-slot"
        data-slot-mode={mode}
        data-slot-visible={visible ? 'true' : 'false'}
        data-slot-instant={instant ? 'true' : 'false'}
        aria-hidden={!visible}
        className={`grid will-change-transform ${transitionClass} ${
          visible
            ? 'opacity-100 visible pointer-events-auto'
            : 'opacity-0 invisible pointer-events-none'
        } ${className}`}
        style={{
          gridTemplateRows: shouldHoldSpace ? '1fr' : '0fr',
          marginBottom: resolvedMarginBottom,
          marginTop: resolvedMarginTop,
          minHeight: resolvedMinHeight,
          transform: resolvedTransform,
          ...style,
        }}
        {...props}
      >
        <div
          className={`min-h-0 min-w-0 ${
            shouldHoldSpace ? 'overflow-visible' : 'overflow-hidden'
          } ${innerClassName}`}
        >
          {children}
        </div>
      </div>
    );
  }
);

HudSlot.displayName = 'HudSlot';

export type HudAttachmentPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface HudRelativeAnchorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The primary landmark widget */
  children: React.ReactNode;
  /** The secondary companion widget attached relative to the primary widget */
  attachment: React.ReactNode;
  /** Which side of the primary widget the attachment sits on */
  placement: HudAttachmentPlacement;
  /** Cross-axis alignment when stacked in flow (`'start' | 'center' | 'end'`) */
  align?: 'start' | 'center' | 'end';
  /** Gap between primary widget and attachment (in px or CSS string, default `10`) */
  gap?: number | string;
  /**
   * If `true`, positions the attachment out-of-flow (`absolute left-full` / `right-full` / `bottom-full` / `top-full`)
   * so the primary widget's own center/anchor alignment is never shifted by the attachment's size
   * (ideal for attaching `FlipIndicatorPillHUD` beside a centered `VelocityProgressBar`).
   * If `false` (default), uses Flexbox flow so both items move together as a unit.
   */
  floating?: boolean;
  /** Extra classes for the attachment wrapper */
  attachmentClassName?: string;
  className?: string;
}

const FLOW_DIRECTION_MAP: Record<HudAttachmentPlacement, string> = {
  bottom: 'flex-col',
  top: 'flex-col-reverse',
  right: 'flex-row',
  left: 'flex-row-reverse',
};

/**
 * HudRelativeAnchor (L2 Companion Attachment Container)
 * Eliminates hardcoded pixel offsets (`calc(50% + 196px)`, `top-[178px]`, `right-[206px]`)
 * by declaratively binding a companion widget to any side of a primary HUD landmark.
 */
export const HudRelativeAnchor: React.FC<HudRelativeAnchorProps> = React.memo(
  ({
    children,
    attachment,
    placement,
    align = 'center',
    gap = 10,
    floating = false,
    attachmentClassName = '',
    className = '',
    style,
    ...props
  }) => {
    const gapCss = typeof gap === 'number' ? `${gap}px` : gap;

    if (floating) {
      let floatPosStyle: React.CSSProperties = {};
      if (placement === 'right') {
        floatPosStyle = {
          left: '100%',
          marginLeft: gapCss,
          ...(align === 'start'
            ? { top: 0 }
            : align === 'end'
            ? { bottom: 0 }
            : { top: '50%', transform: 'translateY(-50%)' }),
        };
      } else if (placement === 'left') {
        floatPosStyle = {
          right: '100%',
          marginRight: gapCss,
          ...(align === 'start'
            ? { top: 0 }
            : align === 'end'
            ? { bottom: 0 }
            : { top: '50%', transform: 'translateY(-50%)' }),
        };
      } else if (placement === 'top') {
        floatPosStyle = {
          bottom: '100%',
          marginBottom: gapCss,
          ...(align === 'start'
            ? { left: 0 }
            : align === 'end'
            ? { right: 0 }
            : { left: '50%', transform: 'translateX(-50%)' }),
        };
      } else {
        floatPosStyle = {
          top: '100%',
          marginTop: gapCss,
          ...(align === 'start'
            ? { left: 0 }
            : align === 'end'
            ? { right: 0 }
            : { left: '50%', transform: 'translateX(-50%)' }),
        };
      }

      return (
        <div
          data-layout="hud-relative-anchor"
          data-placement={placement}
          data-align={align}
          data-floating="true"
          className={`relative inline-flex items-center justify-center pointer-events-auto ${className}`}
          style={style}
          {...props}
        >
          {children}
          <div
            className={`absolute z-30 shrink-0 transition-all duration-300 ${attachmentClassName}`}
            style={floatPosStyle}
          >
            {attachment}
          </div>
        </div>
      );
    }

    return (
      <div
        data-layout="hud-relative-anchor"
        data-placement={placement}
        data-align={align}
        data-floating="false"
        className={`flex ${FLOW_DIRECTION_MAP[placement]} ${ALIGN_CLASSES[align]} transition-all duration-300 pointer-events-auto ${className}`}
        style={{ gap: gapCss, ...style }}
        {...props}
      >
        {children}
        <div className={`shrink-0 transition-all duration-300 ${attachmentClassName}`}>
          {attachment}
        </div>
      </div>
    );
  }
);

HudRelativeAnchor.displayName = 'HudRelativeAnchor';

export interface HudTopSplitBandProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Top-left slot content (e.g., `CompactTelemetryBarHUD`), vertically centered in the shared band height */
  leftSlot?: React.ReactNode;
  /** Top-center slot content (e.g., `StepperScoreboardHUD`), anchored flush to `top-0` and allowed to overflow downward */
  centerSlot?: React.ReactNode;
  /** Top-right slot content (e.g., `FloatingStackIcon` + counter bubble), vertically centered in the shared band height */
  rightSlot?: React.ReactNode;
  /** Shared vertical band height dictated by the tallest top-corner widget (default `56px` for 40px Stack Icon + Bubble) */
  bandHeight?: number | string;
  className?: string;
}

/**
 * HudTopSplitBand (L2 3-Container Horizontal Top Band)
 * Splits the top system/diagnostic region into 3 horizontal containers (`Left` / `Center` / `Right`)
 * sharing a unified vertical height (`bandHeight`, default `56px`).
 * - `leftSlot` (Telemetry) and `rightSlot` (Stack Icon + Bubble) are vertically centered (`items-center`)
 *   within the exact same vertical space so Telemetry naturally aligns with the Stack Icon's center axis.
 * - `centerSlot` (Scorebug) stays flush at `top-0` (`self-start`) and can expand its tiered sub-banners downward freely.
 */
export const HudTopSplitBand: React.FC<HudTopSplitBandProps> = React.memo(
  ({
    leftSlot,
    centerSlot,
    rightSlot,
    bandHeight = 56,
    className = '',
    style,
    ...props
  }) => {
    const resolvedH = typeof bandHeight === 'number' ? `${bandHeight}px` : bandHeight;

    return (
      <div
        data-layout="hud-top-split-band"
        className={`relative z-40 w-full flex items-stretch justify-between pointer-events-none ${className}`}
        style={{ height: resolvedH, ...style }}
        {...props}
      >
        {/* 1. Left Horizontal Container (Vertically centers Telemetry inside the shared band height) */}
        <div className="flex-1 flex items-center justify-start pl-3 min-w-0">
          {leftSlot}
        </div>

        {/* 2. Center Horizontal Container (Flush `top-0`, allows Scorebug Sub-Banners & Demolish Hourglass to hang below) */}
        <div className="shrink-0 flex flex-col items-center self-start">
          {centerSlot}
        </div>

        {/* 3. Right Horizontal Container (Vertically centers Stack Icon + Bubble inside the shared band height; tray overlays z-50) */}
        <div className="flex-1 flex items-center justify-end pr-3 min-w-0 relative z-50">
          {rightSlot}
        </div>
      </div>
    );
  }
);

HudTopSplitBand.displayName = 'HudTopSplitBand';

