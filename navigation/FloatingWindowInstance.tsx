import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, Minus } from 'lucide-react';
import type { FloatingWindowItem } from '../stores/floatingStore';
import { getFloatingWindowIcon } from './FloatingWindowIcon';
import { CornerCurvedDragger } from './CornerCurvedDragger';
import type { ContainerBounds } from './floatingWindowGeometry';
import {
  useFloatingWindowDragResize,
  OUTER_RADIUS,
} from './useFloatingWindowDragResize';

export interface FloatingWindowRenderContext {
  isLight: boolean;
  width: number;
  height: number;
  containerBounds: ContainerBounds | null;
  intrinsicMaxHeight: number | null;
  minWidth: number;
  autoMinWidth: number;
  scrollbarReservePx: number;
  hoveredDescription: string | null;
  setHoveredDescription: (desc: string | null) => void;
}

export interface FloatingWindowInstanceProps {
  item: FloatingWindowItem;
  index: number;
  batchMinimizeSignal?: number;
  opacity?: number;
  isLight?: boolean;
  zIndex: number;
  showFooter?: boolean;
  defaultDescription: string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  containerBounds: ContainerBounds | null;
  renderWindowContent?: (
    item: FloatingWindowItem,
    ctx: FloatingWindowRenderContext
  ) => React.ReactNode;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onUpdatePosition: (pos: { x: number; y: number }) => void;
  onUpdateSize: (size: { width: number; height: number }, userAdjusted?: boolean) => void;
  onReportIntrinsicMetrics?: (metrics: {
    autoMinWidth: number;
    scrollbarReservePx: number;
  }) => void;
}

export const FloatingWindowInstance: React.FC<FloatingWindowInstanceProps> = ({
  item,
  index,
  batchMinimizeSignal,
  opacity = 85,
  isLight = false,
  zIndex,
  showFooter = true,
  defaultDescription,
  containerRef,
  containerBounds,
  renderWindowContent,
  onFocus,
  onMinimize,
  onUpdatePosition,
  onUpdateSize,
  onReportIntrinsicMetrics,
}) => {
  const {
    headerElRef,
    contentInnerElRef,
    footerElRef,
    isResizable,
    intrinsicMaxHeight,
    autoMinWidth,
    effectiveMinWidth,
    effectiveMaxHeight,
    scrollbarReservePx,
    clampedGeometry,
    minimizePhase,
    isInteracting,
    isResizingNow,
    handleTitleBarMouseDown,
    handleResizeMouseDown,
    handleTriggerMinimize,
  } = useFloatingWindowDragResize({
    item,
    index,
    batchMinimizeSignal,
    showFooter,
    containerBounds,
    onFocus,
    onMinimize,
    onUpdatePosition,
    onUpdateSize,
    onReportIntrinsicMetrics,
  });

  const [cornerGripHovered, setCornerGripHovered] = useState(false);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const handleContentMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const descEl = target.closest('[data-footer-desc],[title]') as HTMLElement | null;
    if (descEl) {
      const desc =
        descEl.getAttribute('data-footer-desc') || descEl.getAttribute('title');
      if (desc && desc.trim().length > 0) {
        setHoveredDesc(desc.trim());
      }
    }
  };

  const handleContentMouseLeave = () => {
    setHoveredDesc(null);
  };

  const getHeaderIcon = () => getFloatingWindowIcon(item.category, item.id);

  const isResizingToStack = minimizePhase === 'resizing_to_stack';
  const isContentHidden = minimizePhase !== 'idle';
  const showCornerDragger = isResizable && !isContentHidden;

  const stackX = containerBounds
    ? containerBounds.width - 56
    : containerRef?.current
    ? containerRef.current.clientWidth - 56
    : 600;
  const effectiveOpacity = Math.max(0.01, Math.min(1, (opacity ?? 85) / 100));

  const renderCtx: FloatingWindowRenderContext = {
    isLight,
    width: clampedGeometry.width,
    height: clampedGeometry.height,
    containerBounds,
    intrinsicMaxHeight,
    minWidth: effectiveMinWidth,
    autoMinWidth,
    scrollbarReservePx,
    hoveredDescription: hoveredDesc,
    setHoveredDescription: setHoveredDesc,
  };

  const customContent = renderWindowContent?.(item, renderCtx);

  const isVerticallyCompressed =
    intrinsicMaxHeight !== null && clampedGeometry.height < intrinsicMaxHeight - 2;

  return (
    <motion.div
      onMouseDown={onFocus}
      initial={{ opacity: 0 }}
      animate={
        isResizingToStack
          ? {
              x: stackX,
              y: 16,
              width: 40,
              height: 40,
              opacity: 0,
              borderRadius: 12,
            }
          : {
              x: clampedGeometry.x,
              y: clampedGeometry.y,
              width: clampedGeometry.width,
              height: clampedGeometry.height,
              opacity: effectiveOpacity,
              borderRadius: OUTER_RADIUS,
            }
      }
      transition={{
        duration: isInteracting ? 0 : isResizingToStack ? 0.24 : 0,
        ease: [0.2, 0.8, 0.25, 1],
      }}
      style={{
        zIndex,
        position: 'absolute',
        top: 0,
        left: 0,
      }}
      data-floating-window-id={item.id}
      data-min-width={effectiveMinWidth}
      data-auto-min-width={autoMinWidth}
      data-scrollbar-reserve={scrollbarReservePx}
      data-max-height={effectiveMaxHeight}
      className={`pointer-events-auto flex flex-col border overflow-hidden select-none outline-none shadow-2xl ${
        isLight
          ? 'bg-neutral-50/98 border-neutral-300/90 text-neutral-900'
          : 'bg-neutral-900/98 border-neutral-700/80 text-neutral-100'
      }`}
    >
      {/* STAGE 1: CALIBRATED CLASSIC FLOATING WINDOW HEADER */}
      <div
        ref={headerElRef}
        onMouseDown={handleTitleBarMouseDown}
        data-floating-stage="header"
        className={`flex items-center justify-between px-3 py-2 border-b shrink-0 cursor-grab active:cursor-grabbing transition-colors ${
          isLight
            ? 'border-neutral-200/90 bg-neutral-100/75 text-neutral-900'
            : 'border-neutral-800/90 bg-neutral-950/60 text-white'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            onMouseEnter={() =>
              setHoveredDesc(
                `Window Category Icon (${item.category || 'telemetry'}): Drag titlebar to reposition window within container bounds.`
              )
            }
            onMouseLeave={() => setHoveredDesc(null)}
            className="inline-flex items-center justify-center shrink-0 pl-0.5"
          >
            {getHeaderIcon()}
          </div>
          <span className="font-bold text-[14px] tracking-tight truncate max-w-[360px] leading-none">
            {item.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            type="button"
            onClick={handleTriggerMinimize}
            onMouseEnter={() =>
              setHoveredDesc(
                'Minimize to Stack [-]: Collapse window via 3-phase sequenced transition into top-right Floating Stack Icon.'
              )
            }
            onMouseLeave={() => setHoveredDesc(null)}
            title="Minimize to top-right window stack"
            className={`h-[22px] w-[22px] rounded-[6px] border flex items-center justify-center cursor-pointer transition-colors ${
              isLight
                ? 'bg-white hover:bg-neutral-100 border-neutral-300/80 text-neutral-700 hover:text-neutral-950'
                : 'bg-neutral-800/85 hover:bg-neutral-700/90 border-neutral-700/60 text-neutral-200 hover:text-white'
            }`}
          >
            <Minus className="h-3 w-3 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* STAGE 2: CONTENT BODY */}
      <div
        data-floating-stage="content"
        onMouseOver={handleContentMouseOver}
        onMouseLeave={handleContentMouseLeave}
        className={`flex-1 min-h-0 ${
          isVerticallyCompressed ? 'overflow-y-auto' : 'overflow-y-hidden'
        } overflow-x-hidden flex flex-col text-xs transition-opacity duration-100 ${
          isContentHidden ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div
          ref={contentInnerElRef}
          data-floating-stage="content-inner"
          className={customContent ? 'w-full shrink-0' : 'p-3.5 flex flex-col gap-2.5 w-full shrink-0'}
        >
          {customContent ? (
            customContent
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`p-2 rounded-xl border ${
                    isLight
                      ? 'bg-neutral-50 border-neutral-200'
                      : 'bg-neutral-800/60 border-neutral-700/60'
                  }`}
                >
                  <span className="text-[10px] text-neutral-400 block font-mono">
                    Loop Frequency
                  </span>
                  <span className="text-sm font-mono font-bold text-amber-500">
                    120.0 Hz
                  </span>
                </div>

                <div
                  className={`p-2 rounded-xl border ${
                    isLight
                      ? 'bg-neutral-50 border-neutral-200'
                      : 'bg-neutral-800/60 border-neutral-700/60'
                  }`}
                >
                  <span className="text-[10px] text-neutral-400 block font-mono">
                    Step Latency
                  </span>
                  <span className="text-sm font-mono font-bold text-emerald-500">
                    0.32 ms
                  </span>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-xl border font-mono text-[10px] leading-relaxed ${
                  isLight
                    ? 'bg-neutral-100/60 border-neutral-200 text-neutral-700'
                    : 'bg-neutral-950/40 border-neutral-800 text-neutral-300'
                }`}
              >
                <div>• Body: Car[0] Active (SimTick #8192)</div>
                <div>• Ball: Pos [12.4, -180.2, 17.0] Vel [28.5m/s]</div>
                <div>• Hitbox: OBB Contact Normal [0.0, 1.0, 0.0]</div>
                <div>• Telemetry Channel: WASM SharedMemory</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* STAGE 3: CALIBRATED FOOTER */}
      {showFooter && !isContentHidden && (
        <div
          ref={footerElRef}
          data-floating-stage="footer"
          style={{
            paddingLeft: '14px',
            paddingRight: showCornerDragger ? '24px' : '14px',
            paddingTop: '6px',
            paddingBottom: '6px',
            fontSize: '11px',
          }}
          className={`flex items-center justify-between border-t select-none shrink-0 mt-auto relative z-10 transition-colors duration-150 ${
            isLight
              ? 'border-neutral-200/90 text-neutral-600 bg-neutral-100/70'
              : 'border-neutral-800/90 text-neutral-400 bg-neutral-950/60'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
            <Info
              className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                hoveredDesc
                  ? 'text-amber-500'
                  : isLight
                  ? 'text-neutral-400'
                  : 'text-neutral-500'
              }`}
            />
            <span
              className={`truncate transition-colors duration-150 ${
                hoveredDesc
                  ? isLight
                    ? 'text-neutral-950 font-semibold'
                    : 'text-white font-semibold'
                  : isLight
                  ? 'text-neutral-500'
                  : 'text-neutral-400'
              }`}
            >
              {hoveredDesc || defaultDescription}
            </span>
          </div>
        </div>
      )}

      {/* BOTTOM-RIGHT CONCENTRIC CORNER ARC DRAGGER */}
      {showCornerDragger && (
        <div
          onMouseDown={handleResizeMouseDown}
          onMouseEnter={() => {
            setCornerGripHovered(true);
            setHoveredDesc(
              `Corner Resize Dragger (${clampedGeometry.width}×${clampedGeometry.height}px · MinWidth ${effectiveMinWidth}px · MaxHeight ${effectiveMaxHeight}px): Drag to scale window.`
            );
          }}
          onMouseLeave={() => {
            setCornerGripHovered(false);
            setHoveredDesc(null);
          }}
          title={`Drag bottom-right corner arc to resize window (MinW: ${effectiveMinWidth}px, MaxH: ${effectiveMaxHeight}px)`}
          className="absolute bottom-0 right-0 cursor-nwse-resize flex items-end justify-end select-none z-30"
        >
          <CornerCurvedDragger
            styleVariant="corner-arc"
            outerRadius={OUTER_RADIUS}
            concentric={true}
            arcRadius={12}
            inset={4}
            sweepDeg={68}
            strokeWidth={2.4}
            idleOpacity={60}
            colorMode="neutral"
            isLight={isLight}
            isActiveOrHovered={cornerGripHovered || isResizingNow}
          />
        </div>
      )}
    </motion.div>
  );
};
