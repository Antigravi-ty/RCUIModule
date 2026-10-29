import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MorphContainerContext } from '../tokens/morphContext';
import { type ContainerTransitionMode, type FluidMorphConfig, type SequencedStepConfig } from '../tokens/easing';
import { type TransitionPhase } from './transitions';
import { LivePreviewDock } from './LivePreviewDock';
import { measureMenuPanelIntrinsicDimensions } from './menuPanelAdaptive';
import { type PanelSizingConfig } from '../tokens/menuLayoutTokens';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { MorphingStageShell, type MorphingStageShellProps } from './MorphingStageShell';

export { MorphingStageShell, type MorphingStageShellProps };

export interface MorphingShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  width?: number;
  height?: number;
  sizing?: PanelSizingConfig;
  currentKey?: string;
  children: React.ReactNode;
  isLight?: boolean;
  onBack?: () => void;
  isLayer1?: boolean;
  isDockState?: boolean;
  isContentVisible?: boolean;
  isPillContentVisible?: boolean;
  onExpandDock?: () => void;
  isShaking?: boolean;
  backdropDuration?: number;
  inspectorSlot?: React.ReactNode;
  className?: string;
  uiScale?: number;
  safeAreaMargin?: number;
  maxSafeScale?: number;
  hasExtraMainMenuItem?: boolean;
  developerMode?: boolean;
  enableDiagnostics?: boolean;
  transitionMode?: ContainerTransitionMode;
  onPhaseChange?: (phase: TransitionPhase) => void;
  fluidDuration?: number;
  stepFadeDuration?: number;
  stepResizeDuration?: number;
  fluidConfig?: FluidMorphConfig;
  stepConfig?: SequencedStepConfig;
}

/**
 * MorphingShell
 * Single-Container Decoupled Stage Architecture with Per-Panel Auto-Fit / Fixed Sizing Contracts.
 */
export const MorphingShell: React.FC<MorphingShellProps> = ({
  open,
  onOpenChange,
  width = 460,
  height,
  sizing,
  currentKey = 'default',
  children,
  isLight = false,
  onBack: _onBack,
  isLayer1 = false,
  isDockState = false,
  isContentVisible = true,
  isPillContentVisible = false,
  onExpandDock,
  isShaking = false,
  backdropDuration = 250,
  inspectorSlot,
  className = '',
  uiScale = 100,
  safeAreaMargin = 0,
  maxSafeScale,
  hasExtraMainMenuItem = false,
  developerMode = false,
}) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);
  const [isPillHovered, setIsPillHovered] = useState(false);

  const panelOuterRadius = useMenuLayoutStore((s) => s.panelOuterRadius ?? 16);

  const [stageSize, setStageSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  });

  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [intrinsicHeightByRoute, setIntrinsicHeightByRoute] = useState<Record<string, number>>({});

  const routeMetricKey =
    currentKey === 'main-menu'
      ? hasExtraMainMenuItem
        ? 'main-menu:extra'
        : 'main-menu:base'
      : currentKey === 'settings'
      ? developerMode
        ? 'settings:dev'
        : 'settings:user'
      : currentKey;

  useLayoutEffect(() => {
    if (!open || isDockState || sizing?.mode === 'fixed') return;
    const wrapper = contentWrapperRef.current;
    if (!wrapper) return;
    const panelEl = wrapper.querySelector<HTMLElement>('[data-panel="container"]');
    if (!panelEl) return;

    const measure = () => {
      const { intrinsicHeight } = measureMenuPanelIntrinsicDimensions(panelEl, {
        measureWidth: false,
      });
      if (intrinsicHeight > 40) {
        setIntrinsicHeightByRoute((prev) => {
          const prevH = prev[routeMetricKey];
          if (prevH !== undefined && Math.abs(prevH - intrinsicHeight) <= 1) {
            return prev;
          }
          return { ...prev, [routeMetricKey]: intrinsicHeight };
        });
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(panelEl);
    Array.from(panelEl.children).forEach((rawChild) => {
      const child = rawChild as HTMLElement;
      ro.observe(child);
      if (child.getAttribute('data-panel-section') === 'content') {
        Array.from(child.children).forEach((grandChild) => {
          ro.observe(grandChild as HTMLElement);
        });
      }
    });

    return () => ro.disconnect();
  }, [
    open,
    isDockState,
    sizing?.mode,
    currentKey,
    routeMetricKey,
    hasExtraMainMenuItem,
    developerMode,
    stageSize.width,
    stageSize.height,
  ]);

  const marginW = stageSize.width * (safeAreaMargin / 100);
  const marginH = stageSize.height * (safeAreaMargin / 100);
  const Wsafe = Math.max(100, stageSize.width - marginW * 2);
  const Hsafe = Math.max(100, stageSize.height - marginH * 2);

  const computedMaxSafeScale =
    maxSafeScale ??
    Math.min(
      140,
      Math.max(
        60,
        Math.floor(Math.min(Wsafe / 820, Hsafe / 600) * 100)
      )
    );
  const isSettings = currentKey === 'settings';
  const effectiveScale = isSettings && uiScale > computedMaxSafeScale ? computedMaxSafeScale : uiScale;
  const currentZoom = (effectiveScale || 100) / 100;

  const localWidth = Wsafe / currentZoom;
  const localHeight = Hsafe / currentZoom;

  const availStageW = Math.max(320, localWidth - 32);
  const availStageH = Math.max(240, localHeight - 32);

  const resolveExpandedDimensions = (): { width: number; height: number } => {
    if (!sizing) {
      const w = Math.min(width, availStageW);
      const h = Math.min(height || (isLayer1 ? 377 : 457), availStageH);
      return { width: w, height: h };
    }
    const w = Math.min(sizing.width, availStageW);
    if (sizing.mode === 'fixed') {
      const h = Math.min(sizing.targetHeight, availStageH);
      return { width: w, height: h };
    }
    const maxAllowed = Math.min(sizing.maxHeight, availStageH);
    const minAllowed = Math.min(sizing.minHeight, maxAllowed);
    const fallbackIntrinsic =
      currentKey === 'main-menu'
        ? hasExtraMainMenuItem
          ? 444
          : sizing.targetHeight
        : sizing.targetHeight;
    const naturalH = intrinsicHeightByRoute[routeMetricKey] ?? fallbackIntrinsic;
    const h = Math.max(minAllowed, Math.min(naturalH, maxAllowed));
    return { width: w, height: Math.round(h) };
  };

  const dockW = 88;
  const dockH = 38;
  const { width: expandedW, height: expandedH } = resolveExpandedDimensions();

  const xExpanded = Math.max(16, Math.round((localWidth - expandedW) / 2));
  const yExpanded = Math.max(16, Math.round((localHeight - expandedH) / 2));

  const xDock = Math.max(16, Math.round(localWidth - 16 - dockW));
  const yDock = Math.max(16, Math.round((localHeight - dockH) / 2));

  const targetX = isDockState ? xDock : xExpanded;
  const targetY = isDockState ? yDock : yExpanded;
  const targetW = isDockState ? dockW : expandedW;
  const targetH = isDockState ? dockH : expandedH;
  const targetRadius = isDockState ? 12 : panelOuterRadius;

  if (!open && !isDockState) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none backdrop-blur-none z-40"
        style={{
          backgroundColor:
            isLayer1 || isDockState ? 'transparent' : 'rgba(0, 0, 0, 0.65)',
          transition: `background-color ${backdropDuration}ms cubic-bezier(0.2, 0.8, 0.25, 1)`,
        }}
      />

      {isLayer1 && !isDockState && (
        <div
          className="fixed inset-0 z-[45] pointer-events-auto cursor-pointer"
          onClick={() => onOpenChange(false)}
        />
      )}

      <motion.div
        key="decoupled-menu-stage-wrapper"
        animate={isShaking ? { x: [0, -10, 10, -7, 7, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        style={{ transform: isShaking ? undefined : 'none' }}
        className="absolute inset-0 pointer-events-none z-50"
      >
        <MorphContainerContext.Provider value={true}>
          <motion.div
            ref={shellRef}
            data-ui-element="menu-shell"
            data-morph-container="true"
            data-panel="container"
            data-component={sizing?.component || currentKey}
            data-source-path={sizing?.sourcePath || ''}
            initial={false}
            animate={{
              left: targetX,
              top: targetY,
              width: targetW,
              height: targetH,
              borderRadius: targetRadius,
              opacity: 1,
            }}
            transition={{
              left: { duration: 0.28, ease: [0.2, 0.8, 0.25, 1] },
              top: { duration: 0.28, ease: [0.2, 0.8, 0.25, 1] },
              width: { duration: 0.28, ease: [0.2, 0.8, 0.25, 1] },
              height: { duration: 0.28, ease: [0.2, 0.8, 0.25, 1] },
              borderRadius: { duration: 0.28, ease: [0.2, 0.8, 0.25, 1] },
            }}
            style={{
              position: 'absolute',
              transform: 'none',
            }}
            className={`pointer-events-auto select-none transition-shadow overflow-hidden flex flex-col ${
              isDockState
                ? isLight
                  ? 'border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_0_16px_rgba(0,0,0,0.15)] cursor-pointer'
                  : 'border border-neutral-700 bg-neutral-900 hover:bg-neutral-850 text-neutral-100 shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_0_18px_rgba(255,255,255,0.08)] cursor-pointer'
                : isLight
                ? 'border border-neutral-300/80 bg-neutral-50/98 text-neutral-900 shadow-[0_0_0_1px_rgba(0,0,0,0.12),0_0_24px_rgba(0,0,0,0.16),0_0_48px_rgba(0,0,0,0.10)]'
                : 'border border-neutral-700/60 bg-neutral-900/98 text-neutral-100 shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_0_25px_rgba(0,0,0,0.85),0_0_35px_rgba(255,255,255,0.08)]'
            } ${className}`}
            onClick={isDockState ? onExpandDock : undefined}
            onMouseEnter={() => isDockState && setIsPillHovered(true)}
            onMouseLeave={() => setIsPillHovered(false)}
          >
            {isDockState ? (
              <LivePreviewDock
                isLight={isLight}
                isHovered={isPillHovered}
                isVisible={isPillContentVisible}
              />
            ) : (
              <div
                ref={contentWrapperRef}
                className={`w-full h-full flex flex-col transition-opacity ${
                  isContentVisible
                    ? 'opacity-100 pointer-events-auto duration-150'
                    : 'opacity-0 pointer-events-none duration-100'
                }`}
              >
                <motion.div
                  key={currentKey}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: [0.2, 0.8, 0.25, 1] }}
                  className="w-full h-full flex flex-col min-h-0"
                >
                  {children}
                </motion.div>
              </div>
            )}
          </motion.div>
        </MorphContainerContext.Provider>
      </motion.div>

      {!isDockState && inspectorSlot}
    </>
  );
};
