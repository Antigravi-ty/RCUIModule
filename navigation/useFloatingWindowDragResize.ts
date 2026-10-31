import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FloatingWindowItem } from '../stores/floatingStore';
import { PRESET_WINDOWS } from '../stores/floatingPresets';
import {
  resolveClampedWindowGeometry,
  type ContainerBounds,
  type WindowRect,
} from './floatingWindowGeometry';
import {
  measureIntrinsicMinWidth,
  SCROLLBAR_GUTTER_RESERVE_PX,
} from './floatingWindowMinWidth';

export const DEFAULT_MIN_WINDOW_WIDTH = 340;
export const DEFAULT_MIN_WINDOW_HEIGHT = 200;
export const MIN_NON_RESIZABLE_HEIGHT = 92;
export const OUTER_RADIUS = 16;
export const CONTAINER_MARGIN = 8;

export interface UseFloatingWindowDragResizeOptions {
  item: FloatingWindowItem;
  index: number;
  batchMinimizeSignal?: number;
  showFooter?: boolean;
  containerBounds: ContainerBounds | null;
  onFocus: () => void;
  onMinimize: () => void;
  onUpdatePosition: (pos: { x: number; y: number }) => void;
  onUpdateSize: (size: { width: number; height: number }, userAdjusted?: boolean) => void;
  onReportIntrinsicMetrics?: (metrics: {
    autoMinWidth: number;
    scrollbarReservePx: number;
  }) => void;
}

export function useFloatingWindowDragResize({
  item,
  index,
  batchMinimizeSignal,
  showFooter = true,
  containerBounds,
  onFocus,
  onMinimize,
  onUpdatePosition,
  onUpdateSize,
  onReportIntrinsicMetrics,
}: UseFloatingWindowDragResizeOptions) {
  const matchedPreset = React.useMemo(
    () =>
      PRESET_WINDOWS.find(
        (p) => p.id === item.id || item.id.startsWith(p.id)
      ),
    [item.id]
  );

  const isResizable = (item.resizable ?? matchedPreset?.resizable ?? true) !== false;
  const shouldAutoFitHeight =
    item.autoFitHeight ??
    matchedPreset?.autoFitHeight ??
    (!isResizable || matchedPreset?.tier === 'user');

  const presetMinWidth = Math.round(
    item.minWidth ?? matchedPreset?.minWidth ?? DEFAULT_MIN_WINDOW_WIDTH
  );
  const presetMinHeight = Math.round(
    item.minHeight ??
      matchedPreset?.minHeight ??
      (isResizable ? DEFAULT_MIN_WINDOW_HEIGHT : MIN_NON_RESIZABLE_HEIGHT)
  );
  const presetMaxWidth = item.maxWidth ?? matchedPreset?.maxWidth ?? Infinity;
  const presetMaxHeight = item.maxHeight ?? matchedPreset?.maxHeight;

  const headerElRef = useRef<HTMLDivElement | null>(null);
  const contentInnerElRef = useRef<HTMLDivElement | null>(null);
  const footerElRef = useRef<HTMLDivElement | null>(null);

  const [intrinsicMaxHeight, setIntrinsicMaxHeight] = useState<number | null>(null);
  const [intrinsicMinWidth, setIntrinsicMinWidth] = useState<number>(presetMinWidth);
  const [scrollbarReservePx, setScrollbarReservePx] = useState<number>(
    isResizable ? SCROLLBAR_GUTTER_RESERVE_PX : 0
  );

  const autoMinWidth = Math.max(presetMinWidth, intrinsicMinWidth);
  const effectiveMinWidth =
    item.manualMinWidth !== undefined && Number.isFinite(item.manualMinWidth)
      ? Math.max(240, Math.round(item.manualMinWidth))
      : autoMinWidth;

  const effectiveMinHeight =
    !isResizable && intrinsicMaxHeight !== null
      ? intrinsicMaxHeight
      : intrinsicMaxHeight !== null
      ? Math.min(presetMinHeight, intrinsicMaxHeight)
      : presetMinHeight;

  const effectiveMaxHeight =
    presetMaxHeight !== undefined
      ? presetMaxHeight
      : intrinsicMaxHeight !== null
      ? Math.max(effectiveMinHeight, Math.min(5000, intrinsicMaxHeight))
      : 5000;

  const [desiredAnchor, setDesiredAnchor] = useState<WindowRect>(() => ({
    x: Math.round(item.position?.x ?? 40),
    y: Math.round(item.position?.y ?? 40),
    width: Math.round(
      Math.max(effectiveMinWidth, item.width ?? matchedPreset?.width ?? 440)
    ),
    height: Math.round(
      Math.max(presetMinHeight, item.height ?? matchedPreset?.height ?? 360)
    ),
  }));
  const desiredAnchorRef = useRef<WindowRect>(desiredAnchor);
  desiredAnchorRef.current = desiredAnchor;

  const userHasResizedRef = useRef<boolean>(Boolean(item.userAdjustedSize));
  const lastMeasuredIntrinsicHRef = useRef<number | null>(null);
  const lastMeasuredChildCountRef = useRef<number>(-1);

  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  const measureIntrinsicDimensions = useCallback(() => {
    const innerEl = contentInnerElRef.current;
    if (!innerEl) return;

    const headerH = headerElRef.current?.offsetHeight ?? 39;
    const footerH = showFooter ? footerElRef.current?.offsetHeight ?? 29 : 0;
    const contentH = Math.ceil(innerEl.offsetHeight);

    if (contentH > 0) {
      const totalIntrinsicH = Math.round(headerH + contentH + footerH + 2);
      setIntrinsicMaxHeight((prev) =>
        prev !== null && Math.abs(prev - totalIntrinsicH) <= 1 ? prev : totalIntrinsicH
      );

      if (!isResizable) {
        lastMeasuredIntrinsicHRef.current = totalIntrinsicH;
        setDesiredAnchor((prev) =>
          Math.abs(prev.height - totalIntrinsicH) <= 1
            ? prev
            : { ...prev, height: totalIntrinsicH }
        );
      } else if (shouldAutoFitHeight) {
        const prevIntrinsic = lastMeasuredIntrinsicHRef.current;
        lastMeasuredIntrinsicHRef.current = totalIntrinsicH;

        setDesiredAnchor((prev) => {
          if (!userHasResizedRef.current) {
            if (Math.abs(prev.height - totalIntrinsicH) <= 1) return prev;
            return { ...prev, height: totalIntrinsicH };
          }
          if (
            prevIntrinsic !== null &&
            Math.abs(prev.height - prevIntrinsic) <= 4 &&
            Math.abs(totalIntrinsicH - prevIntrinsic) > 2
          ) {
            return { ...prev, height: totalIntrinsicH };
          }
          if (prev.height > totalIntrinsicH) {
            return { ...prev, height: totalIntrinsicH };
          }
          return prev;
        });
      }
    }

    if (!isDraggingRef.current && !isResizingRef.current && innerEl.clientWidth > 0) {
      const rootChild = (innerEl.firstElementChild as HTMLElement | null) || innerEl;
      const childCount = rootChild.children.length;
      if (lastMeasuredChildCountRef.current !== childCount) {
        lastMeasuredChildCountRef.current = childCount;
        const result = measureIntrinsicMinWidth(innerEl, {
          isResizable,
          fallbackMinWidth: presetMinWidth,
          tier: matchedPreset?.tier,
        });
        setIntrinsicMinWidth(result.totalMinWidth);
        setScrollbarReservePx(result.scrollbarReservePx);
        onReportIntrinsicMetrics?.({
          autoMinWidth: result.totalMinWidth,
          scrollbarReservePx: result.scrollbarReservePx,
        });
      }
    }
  }, [
    isResizable,
    matchedPreset?.tier,
    onReportIntrinsicMetrics,
    presetMinWidth,
    shouldAutoFitHeight,
    showFooter,
  ]);

  useEffect(() => {
    const innerEl = contentInnerElRef.current;
    if (!innerEl) return;
    measureIntrinsicDimensions();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        measureIntrinsicDimensions();
      });
      ro.observe(innerEl);
      if (headerElRef.current) ro.observe(headerElRef.current);
      if (footerElRef.current) ro.observe(footerElRef.current);
      return () => ro.disconnect();
    }
  }, [measureIntrinsicDimensions]);

  const [minimizePhase, setMinimizePhase] = useState<
    'idle' | 'fading_content' | 'resizing_to_stack'
  >('idle');
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDraggingNow, setIsDraggingNow] = useState(false);
  const [isResizingNow, setIsResizingNow] = useState(false);

  useEffect(() => {
    if (isDraggingRef.current || isResizingRef.current) return;
    if (item.position) {
      const rx = Math.round(item.position.x);
      const ry = Math.round(item.position.y);
      setDesiredAnchor((prev) =>
        prev.x === rx && prev.y === ry ? prev : { ...prev, x: rx, y: ry }
      );
    }
  }, [item.position]);

  useEffect(() => {
    userHasResizedRef.current = Boolean(item.userAdjustedSize);
  }, [item.userAdjustedSize]);

  useEffect(() => {
    if (isDraggingRef.current || isResizingRef.current) return;
    if (item.width && item.height) {
      setDesiredAnchor((prev) => {
        const nextW = Math.max(effectiveMinWidth, Math.round(item.width!));
        const nextH =
          !isResizable && intrinsicMaxHeight !== null
            ? intrinsicMaxHeight
            : shouldAutoFitHeight &&
              !item.userAdjustedSize &&
              intrinsicMaxHeight !== null
            ? intrinsicMaxHeight
            : Math.max(
                effectiveMinHeight,
                Math.min(effectiveMaxHeight, Math.round(item.height!))
              );
        if (prev.width === nextW && prev.height === nextH) return prev;
        return { ...prev, width: nextW, height: nextH };
      });
    }
  }, [
    item.width,
    item.height,
    item.userAdjustedSize,
    effectiveMinWidth,
    effectiveMinHeight,
    effectiveMaxHeight,
    isResizable,
    shouldAutoFitHeight,
    intrinsicMaxHeight,
  ]);

  const clampedGeometry = resolveClampedWindowGeometry(
    desiredAnchor,
    containerBounds,
    {
      minWidth: effectiveMinWidth,
      maxWidth: presetMaxWidth,
      minHeight: effectiveMinHeight,
      maxHeight: effectiveMaxHeight,
      resizable: isResizable,
    },
    {
      margin: CONTAINER_MARGIN,
      prioritizePositionSqueeze: isDraggingNow,
    }
  );

  const latestClampedRef = useRef(clampedGeometry);
  latestClampedRef.current = clampedGeometry;

  const latestConstraintsRef = useRef({
    containerBounds,
    effectiveMinWidth,
    presetMaxWidth,
    effectiveMinHeight,
    effectiveMaxHeight,
    isResizable,
  });
  latestConstraintsRef.current = {
    containerBounds,
    effectiveMinWidth,
    presetMaxWidth,
    effectiveMinHeight,
    effectiveMaxHeight,
    isResizable,
  };

  const handleTriggerMinimize = useCallback(() => {
    if (minimizePhase !== 'idle') return;
    setMinimizePhase('fading_content');
    setTimeout(() => {
      setMinimizePhase('resizing_to_stack');
      setTimeout(() => {
        onMinimize();
      }, 240);
    }, 110);
  }, [minimizePhase, onMinimize]);

  const lastSignalRef = useRef(batchMinimizeSignal);
  useEffect(() => {
    if (batchMinimizeSignal && batchMinimizeSignal !== lastSignalRef.current) {
      lastSignalRef.current = batchMinimizeSignal;
      if (minimizePhase === 'idle') {
        const staggerDelay = Math.max(0, index) * 35;
        const timer = setTimeout(() => {
          handleTriggerMinimize();
        }, staggerDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [batchMinimizeSignal, minimizePhase, index, handleTriggerMinimize]);

  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    onFocus();
    isDraggingRef.current = true;
    setIsInteracting(true);
    setIsDraggingNow(true);

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = latestClampedRef.current.x;
    const startY = latestClampedRef.current.y;
    const preservedDesiredW = desiredAnchorRef.current.width;
    const preservedDesiredH = desiredAnchorRef.current.height;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = ev.clientX - startMouseX;
      const deltaY = ev.clientY - startMouseY;

      const nextDesired: WindowRect = {
        x: Math.round(startX + deltaX),
        y: Math.round(startY + deltaY),
        width: preservedDesiredW,
        height: preservedDesiredH,
      };
      desiredAnchorRef.current = nextDesired;
      setDesiredAnchor(nextDesired);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsInteracting(false);
        setIsDraggingNow(false);

        const c = latestConstraintsRef.current;
        const settled = resolveClampedWindowGeometry(
          desiredAnchorRef.current,
          c.containerBounds,
          {
            minWidth: c.effectiveMinWidth,
            maxWidth: c.presetMaxWidth,
            minHeight: c.effectiveMinHeight,
            maxHeight: c.effectiveMaxHeight,
            resizable: c.isResizable,
          },
          { margin: CONTAINER_MARGIN, prioritizePositionSqueeze: false }
        );
        const settledAnchor: WindowRect = {
          x: settled.x,
          y: settled.y,
          width: preservedDesiredW,
          height: preservedDesiredH,
        };
        desiredAnchorRef.current = settledAnchor;
        setDesiredAnchor(settledAnchor);
        onUpdatePosition({ x: settled.x, y: settled.y });
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (!isResizable) return;
    e.stopPropagation();
    e.preventDefault();
    onFocus();
    isResizingRef.current = true;
    userHasResizedRef.current = true;
    setIsInteracting(true);
    setIsResizingNow(true);

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = latestClampedRef.current.x;
    const startY = latestClampedRef.current.y;
    const startWidth = latestClampedRef.current.width;
    const startHeight = latestClampedRef.current.height;

    const handleResizeMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaW = ev.clientX - startMouseX;
      const deltaH = ev.clientY - startMouseY;

      const c = latestConstraintsRef.current;
      const maxWInContainer = c.containerBounds
        ? Math.max(c.effectiveMinWidth, c.containerBounds.width - CONTAINER_MARGIN - startX)
        : c.presetMaxWidth;
      const maxHInContainer = c.containerBounds
        ? Math.max(
            c.effectiveMinHeight,
            Math.min(
              c.effectiveMaxHeight,
              c.containerBounds.height - CONTAINER_MARGIN - startY
            )
          )
        : c.effectiveMaxHeight;

      const nextWidth = Math.max(
        c.effectiveMinWidth,
        Math.min(maxWInContainer, Math.round(startWidth + deltaW))
      );
      const nextHeight = Math.max(
        c.effectiveMinHeight,
        Math.min(maxHInContainer, Math.round(startHeight + deltaH))
      );

      const nextDesired: WindowRect = {
        x: startX,
        y: startY,
        width: nextWidth,
        height: nextHeight,
      };
      desiredAnchorRef.current = nextDesired;
      setDesiredAnchor(nextDesired);
    };

    const handleResizeUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        setIsInteracting(false);
        setIsResizingNow(false);
        const latest = desiredAnchorRef.current;
        onUpdatePosition({ x: latest.x, y: latest.y });
        onUpdateSize({ width: latest.width, height: latest.height }, true);
      }
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeUp);
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeUp);
  };

  return {
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
  };
}
