import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  useFloatingStore,
  type FloatingWindowItem,
  type FloatingStoreInstance,
} from '../stores/floatingStore';
import type { ContainerBounds } from './floatingWindowGeometry';
import {
  FloatingWindowInstance,
  type FloatingWindowRenderContext,
} from './FloatingWindowInstance';

export type { FloatingWindowRenderContext } from './FloatingWindowInstance';
export { FloatingWindowInstance } from './FloatingWindowInstance';

export interface FloatingWindowManagerProps {
  isLight?: boolean;
  /** Optional isolated store instance (defaults to primary floatingStore) */
  store?: FloatingStoreInstance;
  /** Canvas bounds container ref for drag clamping, dynamic push-inward & stack target positioning */
  containerRef?: React.RefObject<HTMLDivElement | null>;
  /** Whether to display Stage 3 Footer on all managed floating windows (defaults to true) */
  showFooter?: boolean;
  /** Optional resolver for idle Stage 3 Footer description per window */
  defaultDescriptionForWindow?: (item: FloatingWindowItem) => string;
  /** Optional custom content renderer injected from L6/L7 so L4 stays 100% decoupled */
  renderWindowContent?: (
    item: FloatingWindowItem,
    ctx: FloatingWindowRenderContext
  ) => React.ReactNode;
}

export const FloatingWindowManager: React.FC<FloatingWindowManagerProps> = ({
  isLight = false,
  store,
  containerRef,
  showFooter = true,
  defaultDescriptionForWindow,
  renderWindowContent,
}) => {
  const {
    windows,
    windowOrder,
    bringToFront,
    minimizeWindow,
    closeWindow,
    updatePosition,
    updateSize,
    reportIntrinsicMetrics,
    batchMinimizeSignal,
    opacity,
  } = useFloatingStore(store);

  const rootOverlayRef = useRef<HTMLDivElement | null>(null);
  const [containerBounds, setContainerBounds] = useState<ContainerBounds | null>(null);

  useEffect(() => {
    const targetEl = containerRef?.current || rootOverlayRef.current;
    if (!targetEl) return;

    const measure = () => {
      const rect = targetEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerBounds((prev) => {
          const w = Math.floor(rect.width);
          const h = Math.floor(rect.height);
          if (prev && prev.width === w && prev.height === h) return prev;
          return { width: w, height: h };
        });
      }
    };

    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => measure());
      ro.observe(targetEl);
      window.addEventListener('resize', measure);
      return () => {
        ro.disconnect();
        window.removeEventListener('resize', measure);
      };
    }

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [containerRef, windows.length]);

  const visibleWindows = windows.filter((w) => !w.isMinimized);

  if (visibleWindows.length === 0) return null;

  return (
    <div
      ref={rootOverlayRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-[5]"
    >
      <AnimatePresence>
        {visibleWindows.map((win, idx) => {
          const zIndex = 5 + Math.max(0, windowOrder.indexOf(win.id));
          return (
            <FloatingWindowInstance
              key={win.id}
              item={win}
              index={idx}
              batchMinimizeSignal={batchMinimizeSignal}
              opacity={opacity}
              isLight={isLight}
              zIndex={zIndex}
              showFooter={showFooter}
              defaultDescription={
                defaultDescriptionForWindow?.(win) ??
                win.subtitle ??
                `${win.title} · Drag titlebar to move · Drag bottom-right corner arc to resize.`
              }
              containerRef={containerRef}
              containerBounds={containerBounds}
              renderWindowContent={renderWindowContent}
              onFocus={() => bringToFront(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              onClose={() => closeWindow(win.id)}
              onUpdatePosition={(pos) => updatePosition(win.id, pos)}
              onUpdateSize={(size, userAdjusted) =>
                updateSize(win.id, size, userAdjusted)
              }
              onReportIntrinsicMetrics={(metrics) =>
                reportIntrinsicMetrics(win.id, metrics)
              }
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
};
