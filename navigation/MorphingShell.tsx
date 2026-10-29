import React, { useEffect, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { UI_RADIUS } from '../tokens/spacing';
import { MorphContainerContext } from '../tokens/morphContext';
import { type ContainerTransitionMode, type FluidMorphConfig, type SequencedStepConfig } from '../tokens/easing';
import { MorphContainer, type TransitionPhase } from './transitions';
import { LivePreviewDock } from './LivePreviewDock';

export interface MorphingShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  width?: number;
  height?: number;
  currentKey?: string;
  children: React.ReactNode;
  isLight?: boolean;
  onBack?: () => void;
  isLayer1?: boolean;
  enableDiagnostics?: boolean;
  className?: string;
  transitionMode?: ContainerTransitionMode;
  onPhaseChange?: (phase: TransitionPhase) => void;
  backdropDuration?: number;
  fluidDuration?: number;
  stepFadeDuration?: number;
  stepResizeDuration?: number;
  fluidConfig?: FluidMorphConfig;
  stepConfig?: SequencedStepConfig;
}

export interface MorphingStageShellProps {
  isLight?: boolean;
  targetX: number;
  targetY: number;
  targetW: number;
  targetH: number;
  targetRadius: number;
  isShaking?: boolean;
  isDockState?: boolean;
  isPillHovered?: boolean;
  onPillHoverChange?: (hovered: boolean) => void;
  isPillContentVisible?: boolean;
  isContentVisible?: boolean;
  onExpandFromDock?: () => void;
  contentWrapperRef?: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

/**
 * [L4 Navigation] MorphingStageShell
 * Absolute-coordinate morphing stage container supporting:
 * 1. Continuous 4-corner geometric interpolation (left, top, width, height, borderRadius)
 * 2. Right-middle LivePreviewDock pill collapse & expand
 * 3. Apple HIG sheet shake feedback when blocked interactions occur
 */
export const MorphingStageShell: React.FC<MorphingStageShellProps> = ({
  isLight = false,
  targetX,
  targetY,
  targetW,
  targetH,
  targetRadius,
  isShaking = false,
  isDockState = false,
  isPillHovered = false,
  onPillHoverChange,
  isPillContentVisible = true,
  isContentVisible = true,
  onExpandFromDock,
  contentWrapperRef,
  children,
}) => {
  return (
    <MorphContainerContext.Provider value={true}>
      <motion.div
        key="decoupled-menu-stage-wrapper"
        animate={isShaking ? { x: [0, -10, 10, -7, 7, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        style={{ transform: isShaking ? undefined : 'none' }}
        className="absolute inset-0 pointer-events-none z-30"
      >
        <motion.div
          key="decoupled-menu-stage-container"
          data-morph-container="true"
          data-panel="container"
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
          }`}
          onClick={isDockState ? onExpandFromDock : undefined}
          onMouseEnter={() => isDockState && onPillHoverChange?.(true)}
          onMouseLeave={() => onPillHoverChange?.(false)}
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
              {children}
            </div>
          )}
        </motion.div>
      </motion.div>
    </MorphContainerContext.Provider>
  );
};

export const MorphingShell: React.FC<MorphingShellProps> = ({
  open,
  onOpenChange,
  width = 460,
  height,
  currentKey,
  children,
  isLight = false,
  isLayer1 = false,
  enableDiagnostics = false,
  className = '',
  transitionMode = 'fluid-morph',
  onPhaseChange,
  backdropDuration = 250,
  fluidDuration,
  stepFadeDuration,
  stepResizeDuration,
  fluidConfig,
  stepConfig,
}) => {
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !enableDiagnostics) return;

    const timer = setTimeout(() => {
      if (!shellRef.current) return;
      const comp = window.getComputedStyle(shellRef.current);
      console.log('─────────────────────────────────────────────────────────────────');
      console.log('[UI Diagnostics] Morphing Shell Metrics:');
      console.log(`• Shell Box: width=${comp.width} (target=${width}px) height=${comp.height}`);
      console.log(`• Transition Mode: ${transitionMode}`);
      console.log(`• Mode: ${isLight ? 'Light' : 'Dark'} | Layer: ${isLayer1 ? 'Layer 1 (Root)' : 'Layer 2 (Sub)'}`);
      console.log('─────────────────────────────────────────────────────────────────');
    }, 150);

    return () => clearTimeout(timer);
  }, [open, width, isLight, isLayer1, enableDiagnostics, transitionMode]);

  const handleInteractOutside = () => {
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 select-none backdrop-blur-none cursor-pointer"
          style={{
            backgroundColor: isLayer1 ? 'transparent' : 'rgba(0, 0, 0, 0.65)',
            transition: `background-color ${backdropDuration}ms cubic-bezier(0.2, 0.8, 0.25, 1)`,
          }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              handleInteractOutside();
            }
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleInteractOutside();
            }
          }}
        >
          <DialogPrimitive.Content
            asChild
            onPointerDownOutside={(e) => {
              e.preventDefault();
              handleInteractOutside();
            }}
            onInteractOutside={(e) => {
              e.preventDefault();
              handleInteractOutside();
            }}
          >
            <MorphContainer
              ref={shellRef}
              data-ui-element="menu-shell"
              data-morph-container="true"
              currentKey={currentKey || (isLayer1 ? 'layer1' : 'layer2')}
              width={width}
              height={height}
              mode={transitionMode}
              onPhaseChange={onPhaseChange}
              fluidDuration={fluidDuration}
              stepFadeDuration={stepFadeDuration}
              stepResizeDuration={stepResizeDuration}
              fluidConfig={fluidConfig}
              stepConfig={stepConfig}
              initialModal={!isLayer1}
              isLight={isLight}
              className={`${UI_RADIUS.xl} max-w-full max-h-[90vh] flex flex-col outline-none cursor-default shadow-2xl ${className}`}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </MorphContainer>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
