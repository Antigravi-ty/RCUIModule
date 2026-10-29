import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFloatingStore, type FloatingWindowItem, type FloatingStoreInstance, } from '../tokens/floatingStore';
import { useMenuLayoutStore, resolvePanelHeaderBackBtnGeometry, } from '../tokens/menuLayoutStore';
import { useFloatingThreeStageStore, type FloatingThreeStageConfig, } from '../tokens/floatingThreeStageStore';
import { CornerCurvedDragger, type CornerCurvedDraggerProps, } from './CornerCurvedDragger';
import { FloatingThreeStageHeader, FloatingThreeStageFooterAndResizers, } from './FloatingThreeStageChrome';
export interface FloatingThreeStageRenderContext {
  isLight: boolean;
  width: number;
  height: number;
  hoveredDescription: string | null;
  setHoveredDescription: (desc: string | null) => void;
  subViewDepth: number;
  pushSubView: (title: string) => void;
  popSubView: () => void;
}

export { CornerCurvedDragger, type CornerCurvedDraggerProps };
export interface FloatingThreeStageWindowManagerProps {
  isLight?: boolean;
  store?: FloatingStoreInstance;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  configOverride?: Partial<FloatingThreeStageConfig>;
  defaultDescriptionForWindow?: (item: FloatingWindowItem) => string;
  renderWindowContent?: (
    item: FloatingWindowItem, ctx: FloatingThreeStageRenderContext
  ) => React.ReactNode;
}

/**
 * [L4/L6 Variation Component] FloatingThreeStageWindowManager
 * Combines L4 Floating Window choreography (drag, 3-phase stack minimize, multi-window z-index, opacity)
 * with Stage 3 Footer hover descriptions, unrestricted max W×H resizing, and natural concentric curved corner draggers.
 */
export const FloatingThreeStageWindowManager: React.FC<FloatingThreeStageWindowManagerProps> = ({
  isLight = false,
  store,
  containerRef,
  configOverride,
  defaultDescriptionForWindow,
  renderWindowContent,
}) => {
  const {
    windows, windowOrder,
    bringToFront, minimizeWindow,
    closeWindow, updatePosition,
    updateSize, batchMinimizeSignal,
    opacity,
  } = useFloatingStore(store);
  const baseConfig = useFloatingThreeStageStore();
  const l2Store = useMenuLayoutStore();
  const resolvedConfig: FloatingThreeStageConfig = React.useMemo(() => {
    const merged: FloatingThreeStageConfig = {
      ...baseConfig, ...(configOverride || {}),
    };
    if (merged.syncWithGlobalL2Shell && !configOverride) {
      return {
        ...merged, headerPaddingX: l2Store.panelHeaderPaddingX,
        headerPaddingY: l2Store.panelHeaderPaddingY, headerTitleFontSize: l2Store.panelHeaderTitleFontSize,
        headerBtnWidth: l2Store.panelHeaderBackBtnWidth, headerBtnHeight: l2Store.panelHeaderBackBtnHeight,
        headerBtnRadiusMode: l2Store.panelHeaderBackBtnRadiusMode,
        headerBtnCustomRadius: l2Store.panelHeaderBackBtnRadius,
        headerBtnInnerRadius: l2Store.panelHeaderBackBtnInnerRadius,
        headerBtnRadiusTL: l2Store.panelHeaderBackBtnRadiusTL,
        headerBtnRadiusTR: l2Store.panelHeaderBackBtnRadiusTR,
        headerBtnRadiusBR: l2Store.panelHeaderBackBtnRadiusBR,
        headerBtnRadiusBL: l2Store.panelHeaderBackBtnRadiusBL,
        headerBtnIdleTone: l2Store.panelHeaderBackBtnIdleTone,
        headerBtnStyle: l2Store.panelHeaderBackBtnStyle,
        headerBtnExpandOnHover: l2Store.panelHeaderRightBtnExpandOnHover,
        outerRadius: l2Store.panelOuterRadius, bodyPaddingX: l2Store.panelBodyPaddingX,
        bodyPaddingY: l2Store.panelBodyPaddingY, footerPaddingX: l2Store.panelFooterPaddingX,
        footerPaddingY: l2Store.panelFooterPaddingY, footerFontSize: l2Store.panelFooterFontSize,
        footerRightDivider: l2Store.panelFooterRightDivider,
        footerRightPaddingX: l2Store.panelFooterRightPaddingX, };
    }
    return merged;
  }, [baseConfig, configOverride, l2Store]);
  const visibleWindows = windows.filter((w) => !w.isMinimized);
  if (visibleWindows.length === 0) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      <AnimatePresence>
        {visibleWindows.map((win, idx) => {
          const zIndex = 5 + Math.max(0, windowOrder.indexOf(win.id));
          return (
            <FloatingThreeStageWindowInstance
              key={win.id} item={win}
              index={idx} config={resolvedConfig}
              batchMinimizeSignal={batchMinimizeSignal} opacity={opacity}
              isLight={isLight} zIndex={zIndex}
              containerRef={containerRef} defaultDescription={
                defaultDescriptionForWindow?.(win) ?? win.subtitle ??
                'Hover any control or action button to inspect contextual help in Stage 3 Footer.' }
              renderWindowContent={renderWindowContent} onFocus={() => bringToFront(win.id)}
              onMinimize={() => minimizeWindow(win.id)} onClose={() => closeWindow(win.id)}
              onUpdatePosition={(pos) => updatePosition(win.id, pos)}
              onUpdateSize={(size) => updateSize(win.id, size)} />
          );
        })}
      </AnimatePresence>
    </div>
  );
};

interface FloatingThreeStageWindowInstanceProps {
  item: FloatingWindowItem;
  index: number;
  config: FloatingThreeStageConfig;
  batchMinimizeSignal?: number;
  opacity?: number;
  isLight?: boolean;
  zIndex: number;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  defaultDescription: string;
  renderWindowContent?: (
    item: FloatingWindowItem, ctx: FloatingThreeStageRenderContext
  ) => React.ReactNode;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onUpdatePosition: (pos: { x: number; y: number }) => void;
  onUpdateSize: (size: { width: number; height: number }) => void;
}

export const FloatingThreeStageWindowInstance: React.FC<FloatingThreeStageWindowInstanceProps> = ({
  item,
  index,
  config,
  batchMinimizeSignal,
  opacity = 85,
  isLight = false,
  zIndex,
  containerRef,
  defaultDescription,
  renderWindowContent,
  onFocus,
  onMinimize,
  onClose,
  onUpdatePosition,
  onUpdateSize,
}) => {
  const [pos, setPos] = useState({
    x: item.position?.x ?? 36, y: item.position?.y ?? 36,
  });
  const [size, setSize] = useState({
    width: item.width ?? 480, height: item.height ?? 350,
  });
  const [minimizePhase, setMinimizePhase] = useState<
    'idle' | 'fading_content' | 'resizing_to_stack'
  >('idle');
  const [interactionMode, setInteractionMode] = useState<
    'idle' | 'dragging' | 'resizing-both' | 'resizing-w' | 'resizing-h'
  >('idle');
  const [isPinned, setIsPinned] = useState(false);
  const [rightHovered, setRightHovered] = useState(false);
  const [cornerGripHovered, setCornerGripHovered] = useState(false);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  const [subViewStack, setSubViewStack] = useState<string[]>([]);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({
    mouseX: 0, mouseY: 0,
    startWidth: 0, startHeight: 0,
    axis: 'both' as 'both' | 'w' | 'h',
  });
  useEffect(() => {
    if (item.position) setPos(item.position);
  }, [item.position]);
  useEffect(() => {
    if (item.width && item.height) {
      const effectiveMinH = item.resizable === false ? 88 : config.minHeight;
      const clampedW = config.limitMaxSize
        ? Math.min(config.maxWidth, item.width) : item.width;
      const clampedH = config.limitMaxSize
        ? Math.min(config.maxHeight, item.height) : item.height;
      setSize({
        width: Math.max(config.minWidth, clampedW), height: Math.max(effectiveMinH, clampedH),
      });
    }
  }, [
    item.width, item.height,
    item.resizable, config.limitMaxSize,
    config.minWidth, config.minHeight,
    config.maxWidth, config.maxHeight,
  ]);
  const lastSignalRef = useRef(batchMinimizeSignal);
  useEffect(() => {
    if (batchMinimizeSignal && batchMinimizeSignal !== lastSignalRef.current) {
      lastSignalRef.current = batchMinimizeSignal;
      if (minimizePhase === 'idle' && !isPinned) {
        const staggerDelay = Math.max(0, index) * 35;
        const timer = setTimeout(() => {
          handleTriggerMinimize();
        }, staggerDelay);
        return () => clearTimeout(timer);
      } }
  }, [batchMinimizeSignal, minimizePhase, index, isPinned]);
  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (isPinned) {
      onFocus();
      return;
    } e.preventDefault();
    onFocus();
    isDraggingRef.current = true;
    setInteractionMode('dragging');
    dragStartRef.current = {
      mouseX: e.clientX, mouseY: e.clientY,
      startX: pos.x, startY: pos.y,
    };
    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = ev.clientX - dragStartRef.current.mouseX;
      const deltaY = ev.clientY - dragStartRef.current.mouseY;
      let newX = Math.max(8, dragStartRef.current.startX + deltaX);
      let newY = Math.max(8, dragStartRef.current.startY + deltaY);
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        newX = Math.min(newX, Math.max(16, rect.width - 120));
        newY = Math.min(newY, Math.max(16, rect.height - 60));
      } setPos({ x: Math.round(newX), y: Math.round(newY) });
    };
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setInteractionMode('idle');
        setPos((latestPos) => {
          onUpdatePosition(latestPos);
          return latestPos;
        });
      } window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  const startResize = (axis: 'both' | 'w' | 'h') => (e: React.MouseEvent) => {
    if (!config.resizable || item.resizable === false) return;
    e.stopPropagation();
    e.preventDefault();
    onFocus();
    isResizingRef.current = true;
    setInteractionMode( axis === 'w' ? 'resizing-w' : axis === 'h' ? 'resizing-h' : 'resizing-both'
    );
    resizeStartRef.current = {
      mouseX: e.clientX, mouseY: e.clientY,
      startWidth: size.width, startHeight: size.height,
      axis, };
    const handleResizeMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaW = ev.clientX - resizeStartRef.current.mouseX;
      const deltaH = ev.clientY - resizeStartRef.current.mouseY;
      const currentAxis = resizeStartRef.current.axis;
      const rawNextW = Math.max(
        config.minWidth, resizeStartRef.current.startWidth + deltaW
      );
      const rawNextH = Math.max(
        config.minHeight, resizeStartRef.current.startHeight + deltaH
      );
      const nextWidth =
        currentAxis === 'h' ? resizeStartRef.current.startWidth
          : config.limitMaxSize ? Math.min(config.maxWidth, rawNextW)
          : rawNextW;
      const nextHeight =
        currentAxis === 'w' ? resizeStartRef.current.startHeight
          : config.limitMaxSize ? Math.min(config.maxHeight, rawNextH)
          : rawNextH;
      setSize({
        width: Math.round(nextWidth), height: Math.round(nextHeight),
      });
    };
    const handleResizeUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        setInteractionMode('idle');
        setSize((latestSize) => {
          onUpdateSize(latestSize);
          return latestSize;
        });
      } window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeUp);
    };
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeUp);
  };
  const handleTriggerMinimize = () => {
    if (minimizePhase !== 'idle') return;
    setMinimizePhase('fading_content');
    setTimeout(() => {
      setMinimizePhase('resizing_to_stack');
      setTimeout(() => {
        onMinimize();
      }, 240);
    }, 110);
  };
  const btnGeom = resolvePanelHeaderBackBtnGeometry({
    panelHeaderPaddingX: config.headerPaddingX, panelHeaderPaddingY: config.headerPaddingY,
    panelHeaderBackBtnWidth: config.headerBtnWidth, panelHeaderBackBtnHeight: config.headerBtnHeight,
    panelHeaderBackBtnRadiusMode: config.headerBtnRadiusMode,
    panelHeaderBackBtnRadius: config.headerBtnCustomRadius,
    panelHeaderBackBtnInnerRadius: config.headerBtnInnerRadius,
    panelHeaderBackBtnRadiusTL: config.headerBtnRadiusTL,
    panelHeaderBackBtnRadiusTR: config.headerBtnRadiusTR,
    panelHeaderBackBtnRadiusBR: config.headerBtnRadiusBR,
    panelHeaderBackBtnRadiusBL: config.headerBtnRadiusBL, panelOuterRadius: config.outerRadius,
  });
  const isFlushDividerMode =
    config.headerPaddingX === 0 && config.headerPaddingY === 0 &&
    btnGeom.innerRadius === 0;
  const leftBorderStructureClass =
    config.headerBtnStyle === 'surface' ? isFlushDividerMode
        ? 'border-0 border-r' : 'border'
      : 'border-0';
  const rightBorderStructureClass =
    config.headerBtnStyle === 'surface' ? isFlushDividerMode
        ? 'border-0 border-l' : 'border'
      : 'border-0';
  const getHeaderBtnSurfaceClasses = (activeHighlight = false) => {
    const borderColorClass = isLight
      ? 'border-neutral-200/90 hover:border-neutral-300' : 'border-neutral-800/80 hover:border-neutral-700';
    if (activeHighlight) {
      return isLight
        ? `bg-amber-500/15 text-amber-600 ${borderColorClass} cursor-pointer`
        : `bg-amber-500/20 text-amber-400 ${borderColorClass} cursor-pointer`;
    }
    if (config.headerBtnIdleTone === 'match-header') {
      return isLight
        ? `bg-transparent hover:bg-neutral-200/80 active:bg-neutral-300/75 ${borderColorClass} text-neutral-500 hover:text-neutral-950 cursor-pointer`
        : `bg-transparent hover:bg-neutral-800/85 active:bg-neutral-700/80 ${borderColorClass} text-neutral-400 hover:text-white cursor-pointer`;
    }
    if (config.headerBtnIdleTone === 'muted-gray') {
      if (isFlushDividerMode) {
        return isLight
          ? `bg-neutral-200/50 hover:bg-neutral-200/95 ${borderColorClass} text-neutral-500 hover:text-neutral-950 cursor-pointer`
          : `bg-neutral-900/65 hover:bg-neutral-800/90 ${borderColorClass} text-neutral-400 hover:text-white cursor-pointer`;
      }
      return isLight
        ? 'bg-neutral-200/55 hover:bg-white border-neutral-300/75 text-neutral-500 hover:text-neutral-950 cursor-pointer'
        : 'bg-neutral-800/55 hover:bg-neutral-700/90 border-neutral-700/50 text-neutral-400 hover:text-white cursor-pointer';
    }
    if (isFlushDividerMode) {
      return isLight
        ? `bg-white/90 hover:bg-neutral-200/90 ${borderColorClass} text-neutral-700 hover:text-neutral-950 cursor-pointer`
        : `bg-neutral-800/80 hover:bg-neutral-700/90 ${borderColorClass} text-neutral-200 hover:text-white cursor-pointer`;
    }
    return isLight
      ? 'bg-white hover:bg-neutral-100 border-neutral-300/80 text-neutral-700 hover:text-neutral-950 cursor-pointer'
      : 'bg-neutral-800/85 hover:bg-neutral-700/90 border-neutral-700/60 text-neutral-200 hover:text-white cursor-pointer';
  };
  const isResizingToStack = minimizePhase === 'resizing_to_stack';
  const isContentHidden = minimizePhase !== 'idle';
  const isInteracting = interactionMode !== 'idle';
  const isResizingNow =
    interactionMode === 'resizing-both' || interactionMode === 'resizing-w' ||
    interactionMode === 'resizing-h';
  const isAutoFitHeight = config.contentOverflowMode === 'auto-fit-height';
  const isClassicBaseline = config.variant === 'classic-6d-baseline';
  const effectiveShowFooter =
    !isClassicBaseline && config.variant !== 'two-stage-l2-header' &&
    config.showFooter;
  const stackX = containerRef?.current ? containerRef.current.clientWidth - 56 : 600;
  const effectiveOpacity = Math.max(0.01, Math.min(1, (opacity ?? 85) / 100));
  const activeTitle =
    subViewStack.length > 0 ? `${item.title} / ${subViewStack[subViewStack.length - 1]}`
      : item.title;
  const renderCtx: FloatingThreeStageRenderContext = {
    isLight, width: size.width,
    height: size.height, hoveredDescription: hoveredDesc,
    setHoveredDescription: (desc) => {
      if (config.footerHoverLinkage) {
        setHoveredDesc(desc);
      } },
    subViewDepth: subViewStack.length,
    pushSubView: (subTitle: string) => setSubViewStack((prev) => [...prev, subTitle]),
    popSubView: () => setSubViewStack((prev) => prev.slice(0, -1)),
  };
  const customContent = renderWindowContent?.(item, renderCtx);
  const minHeaderHeight = btnGeom.height + config.headerPaddingY * 2;
  const labelFontSize = Math.max(10, Math.min(12, Math.round(btnGeom.height * 0.35)));
  const isRightExpanded = rightHovered && config.headerBtnExpandOnHover;
  const isCornerDraggerStyle =
    config.resizeHandleStyle === 'corner-arc' || config.resizeHandleStyle === 'corner-arc-dots' ||
    config.resizeHandleStyle === 'corner-double-arc' || config.resizeHandleStyle === 'corner-pill-arc' ||
    config.resizeHandleStyle === 'corner-dots';
  const showCornerDragger =
    config.resizable && item.resizable !== false &&
    !isContentHidden && (isCornerDraggerStyle ||
      (!effectiveShowFooter && config.resizeHandleStyle === 'footer-carved-slot'));
  const showInvisibleEdges =
    config.resizable && item.resizable !== false &&
    !isContentHidden && (config.resizeHandleStyle === 'invisible-edges-and-corner' ||
      config.resizeHandleStyle === 'both-slot-and-edges' || config.enableRightEdgeResize ||
      config.enableBottomEdgeResize);
  const showCarvedFooterGrip =
    effectiveShowFooter && config.resizable &&
    item.resizable !== false && (config.footerRightSlotMode === 'carved-resize-grip' ||
      config.resizeHandleStyle === 'footer-carved-slot' ||
      config.resizeHandleStyle === 'both-slot-and-edges');
  const effectiveFooterRightMode = showCarvedFooterGrip
    ? 'carved-resize-grip' : config.footerRightSlotMode;
  const hasFooterRightCompartment = effectiveFooterRightMode !== 'none';
  return (
    <motion.div onMouseDown={onFocus} initial={{ opacity: 0 }} animate={ isResizingToStack ? { x: stackX, y: 16,
      width: 40, height: 40, opacity: 0, borderRadius: 12, } : { x: pos.x, y: pos.y, width: size.width,
      ...(isAutoFitHeight ? {} : { height: size.height }), opacity: effectiveOpacity,
      borderRadius: config.outerRadius, } } transition={{
      duration: isInteracting ? 0 : isResizingToStack ? 0.24 : 0, ease: [0.2, 0.8, 0.25, 1], }} style={{
      zIndex: isPinned ? zIndex + 50 : zIndex, position: 'absolute', top: 0, left: 0,
      ...(isAutoFitHeight && !isResizingToStack ? { height: 'auto', minHeight: `${config.minHeight}px`,
      ...(config.limitMaxSize ? { maxHeight: `${config.maxHeight}px` } : {}), } : {}), }}
      data-floating-window-variant={config.variant}
      className={`pointer-events-auto flex flex-col border overflow-hidden select-none outline-none shadow-2xl ${
      isLight ? 'bg-neutral-50/98 border-neutral-300/90 text-neutral-900'
      : 'bg-neutral-900/98 border-neutral-700/80 text-neutral-100' }`}>
      {/* Live Resize / Drag Telemetry Pill Overlay */}
      {config.showResizeHudOverlay && isInteracting && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-40 pointer-events-none px-2.5 py-1 rounded-lg bg-amber-500 text-neutral-950 font-mono font-bold text-[10px] shadow-md flex items-center gap-2">
          <span>
            {interactionMode === 'dragging'
              ? `DRAG POS (${pos.x}, ${pos.y})` : interactionMode === 'resizing-w'
              ? `RESIZE WIDTH: ${size.width}px` : interactionMode === 'resizing-h'
              ? `RESIZE HEIGHT: ${size.height}px` : `RESIZE 2D: ${size.width} × ${size.height}px`}
          </span>
          <span className="opacity-75">
            [Min {config.minWidth}×{config.minHeight} · Max {config.limitMaxSize ? `${config.maxWidth}×${config.maxHeight}` : '∞'}]
          </span>
        </div>
      )}
      <FloatingThreeStageHeader item={item} config={config} isLight={isLight} isPinned={isPinned}
        setIsPinned={setIsPinned} activeTitle={activeTitle} subViewStack={subViewStack}
        setSubViewStack={setSubViewStack} btnGeom={btnGeom} minHeaderHeight={minHeaderHeight}
        labelFontSize={labelFontSize} isRightExpanded={isRightExpanded} setRightHovered={setRightHovered}
        setHoveredDesc={setHoveredDesc} leftBorderStructureClass={leftBorderStructureClass}
        rightBorderStructureClass={rightBorderStructureClass}
        getHeaderBtnSurfaceClasses={getHeaderBtnSurfaceClasses} handleTitleBarMouseDown={handleTitleBarMouseDown}
        handleTriggerMinimize={handleTriggerMinimize} onClose={onClose} />
      {/* ════════════════════════════════════════════════════════════════════
          STAGE 2: CONTENT BODY ════════════════════════════════════════════════════════════════════ */}
      <div data-floating-stage="content" style={{ paddingLeft: `${config.bodyPaddingX}px`,
        paddingRight: `${config.bodyPaddingX}px`, paddingTop: `${config.bodyPaddingY}px`,
        paddingBottom: `${config.bodyPaddingY}px`, }} className={`flex flex-col ${
        isAutoFitHeight ? 'flex-initial min-h-0' : 'flex-1 min-h-0'
        } w-full box-border overflow-y-auto text-xs transition-opacity duration-100 ${
        isContentHidden ? 'opacity-0' : 'opacity-100' } ${ config.showStageAnatomyBorders
        ? 'outline-1 -outline-offset-1 outline-dashed outline-emerald-500/70 bg-emerald-500/[0.02]' : '' }`}>
        {customContent}
      </div>
      <FloatingThreeStageFooterAndResizers config={config} isLight={isLight}
        effectiveShowFooter={effectiveShowFooter} isContentHidden={isContentHidden}
        hasFooterRightCompartment={hasFooterRightCompartment} effectiveFooterRightMode={effectiveFooterRightMode}
        showCornerDragger={showCornerDragger} isCornerDraggerStyle={isCornerDraggerStyle}
        showInvisibleEdges={showInvisibleEdges} isAutoFitHeight={isAutoFitHeight}
        cornerGripHovered={cornerGripHovered} setCornerGripHovered={setCornerGripHovered}
        isResizingNow={isResizingNow} hoveredDesc={hoveredDesc} setHoveredDesc={setHoveredDesc}
        defaultDescription={defaultDescription} size={size} pos={pos} startResize={startResize}
        handleTriggerMinimize={handleTriggerMinimize} />
    </motion.div>
  );
};
