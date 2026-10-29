import React from 'react';
import { motion } from 'framer-motion';
import { MorphContainerContext } from '../tokens/morphContext';
import { LivePreviewDock } from './LivePreviewDock';

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
