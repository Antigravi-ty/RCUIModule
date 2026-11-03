import React from 'react';
import { Info, MoveDiagonal2 } from 'lucide-react';
import type { FloatingThreeStageConfig } from '../stores/floatingThreeStageStore';
import { KeycapBadge } from '../primitives/KeycapBadge';
import { CornerCurvedDragger } from './CornerCurvedDragger';
export interface FloatingThreeStageFooterProps {
  config: FloatingThreeStageConfig;
  isLight: boolean;
  effectiveShowFooter: boolean;
  isContentHidden: boolean;
  hasFooterRightCompartment: boolean;
  effectiveFooterRightMode: 'none' | 'carved-resize-grip' | 'live-dimensions' | 'shortcut-badge';
  showCornerDragger: boolean;
  isCornerDraggerStyle: boolean;
  showInvisibleEdges: boolean;
  isAutoFitHeight: boolean;
  cornerGripHovered: boolean;
  setCornerGripHovered: (v: boolean) => void;
  isResizingNow: boolean;
  hoveredDesc: string | null;
  setHoveredDesc: (desc: string | null) => void;
  defaultDescription: string;
  size: { width: number; height: number };
  pos: { x: number; y: number };
  startResize: (axis: 'both' | 'w' | 'h') => (e: React.MouseEvent) => void;
  handleTriggerMinimize: () => void;
}

export const FloatingThreeStageFooter: React.FC<
  FloatingThreeStageFooterProps
> = ({
  config,
  isLight,
  effectiveShowFooter,
  isContentHidden,
  hasFooterRightCompartment,
  effectiveFooterRightMode,
  showCornerDragger,
  isCornerDraggerStyle,
  showInvisibleEdges,
  isAutoFitHeight,
  cornerGripHovered,
  setCornerGripHovered,
  isResizingNow,
  hoveredDesc,
  setHoveredDesc,
  defaultDescription,
  size,
  pos,
  startResize,
  handleTriggerMinimize,
}) => {
  return (
    <>
      {effectiveShowFooter && !isContentHidden && (
        <div
          data-floating-stage="footer"
          style={{
            paddingLeft: hasFooterRightCompartment ? '0px' : `${config.footerPaddingX}px`,
            paddingRight: hasFooterRightCompartment
              ? '0px'
              : showCornerDragger
              ? `${Math.max(config.footerPaddingX, 24)}px`
              : `${config.footerPaddingX}px`,
            paddingTop: hasFooterRightCompartment ? '0px' : `${config.footerPaddingY}px`,
            paddingBottom: hasFooterRightCompartment ? '0px' : `${config.footerPaddingY}px`,
            fontSize: `${config.footerFontSize}px`,
          }}
          className={`flex items-stretch justify-between border-t select-none shrink-0 mt-auto relative z-10 transition-colors duration-150 ${
            isLight
              ? 'border-neutral-200/90 text-neutral-600 bg-neutral-100/70'
              : 'border-neutral-800/90 text-neutral-400 bg-neutral-950/60'
          } ${
            config.showStageAnatomyBorders
              ? 'outline-1 -outline-offset-1 outline-dashed outline-sky-500/70'
              : ''
          }`}
        >
          <div
            style={
              hasFooterRightCompartment
                ? {
                    paddingLeft: `${config.footerPaddingX}px`,
                    paddingRight: '10px',
                    paddingTop: `${config.footerPaddingY}px`,
                    paddingBottom: `${config.footerPaddingY}px`,
                  }
                : undefined
            }
            className="flex items-center gap-2 min-w-0 flex-1 truncate"
          >
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

          {hasFooterRightCompartment && (
            <div
              onMouseDown={
                effectiveFooterRightMode === 'carved-resize-grip'
                  ? startResize('both')
                  : undefined
              }
              onClick={
                effectiveFooterRightMode === 'shortcut-badge'
                  ? handleTriggerMinimize
                  : undefined
              }
              onMouseEnter={() => {
                if (!config.footerHoverLinkage) return;
                if (effectiveFooterRightMode === 'carved-resize-grip') {
                  setHoveredDesc(
                    `Stage 3 Carved Resize Slot: Drag diagonally to resize (${size.width}×${size.height}px).`
                  );
                } else if (effectiveFooterRightMode === 'live-dimensions') {
                  setHoveredDesc(
                    `Window Geometry Readout: ${size.width}×${size.height}px at Canvas (${pos.x}, ${pos.y}).`
                  );
                } else if (effectiveFooterRightMode === 'shortcut-badge') {
                  setHoveredDesc(
                    'Stage 3 Right Action: Click or press [ESC] to fold floating window into top-right Stack.'
                  );
                }
              }}
              onMouseLeave={() => config.footerHoverLinkage && setHoveredDesc(null)}
              style={{
                paddingLeft: `${config.footerRightPaddingX}px`,
                paddingRight: `${config.footerRightPaddingX}px`,
                paddingTop: `${config.footerPaddingY}px`,
                paddingBottom: `${config.footerPaddingY}px`,
              }}
              className={`flex items-center gap-1.5 shrink-0 font-mono transition-colors ${
                config.footerRightDivider
                  ? isLight
                    ? 'border-l border-neutral-200/90'
                    : 'border-l border-neutral-800/90'
                  : ''
              } ${
                effectiveFooterRightMode === 'carved-resize-grip'
                  ? isLight
                    ? 'cursor-nwse-resize hover:bg-amber-500/15 hover:text-amber-600 text-neutral-500'
                    : 'cursor-nwse-resize hover:bg-amber-500/20 hover:text-amber-400 text-neutral-400'
                  : effectiveFooterRightMode === 'shortcut-badge'
                  ? isLight
                    ? 'cursor-pointer hover:bg-neutral-200/75 text-neutral-600 hover:text-neutral-950'
                    : 'cursor-pointer hover:bg-neutral-800/80 text-neutral-400 hover:text-white'
                  : isLight
                  ? 'text-neutral-500'
                  : 'text-neutral-400'
              }`}
              title={
                effectiveFooterRightMode === 'carved-resize-grip'
                  ? 'Drag slot to resize window (Carved 2D Resize Handle)'
                  : undefined
              }
            >
              {effectiveFooterRightMode === 'carved-resize-grip' && (
                <>
                  <span className="text-[10px] opacity-80">
                    {size.width}×{size.height}
                  </span>
                  <MoveDiagonal2 className="h-3 w-3 text-amber-500 shrink-0" />
                </>
              )}
              {effectiveFooterRightMode === 'live-dimensions' && (
                <span className="text-[10px]">
                  {size.width}×{size.height}px
                </span>
              )}
              {effectiveFooterRightMode === 'shortcut-badge' && (
                <>
                  <span className="font-sans font-medium whitespace-nowrap leading-none">
                    Stack
                  </span>
                  <KeycapBadge shortcut="ESC" size="sm" isLight={isLight} />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {showCornerDragger && (
        <div
          onMouseDown={startResize('both')}
          onMouseEnter={() => {
            setCornerGripHovered(true);
            if (config.footerHoverLinkage) {
              setHoveredDesc(
                `Corner Resize Dragger (${size.width}×${size.height}px · Unrestricted Max Size): Drag diagonally to freely scale window.`
              );
            }
          }}
          onMouseLeave={() => {
            setCornerGripHovered(false);
            if (config.footerHoverLinkage) {
              setHoveredDesc(null);
            }
          }}
          title="Drag bottom-right corner arc to resize window"
          className="absolute bottom-0 right-0 cursor-nwse-resize flex items-end justify-end select-none z-30"
        >
          <CornerCurvedDragger
            styleVariant={
              isCornerDraggerStyle ? config.resizeHandleStyle : 'corner-arc'
            }
            outerRadius={config.outerRadius}
            concentric={config.cornerArcConcentric}
            arcRadius={config.cornerArcRadius}
            inset={config.cornerArcInset}
            sweepDeg={config.cornerArcSweepDeg}
            strokeWidth={config.cornerArcStrokeWidth}
            idleOpacity={config.cornerArcIdleOpacity}
            colorMode={config.cornerArcColorMode}
            isLight={isLight}
            isActiveOrHovered={cornerGripHovered || isResizingNow}
          />
        </div>
      )}

      {showInvisibleEdges && (
        <>
          {(config.enableRightEdgeResize ||
            config.resizeHandleStyle === 'invisible-edges-and-corner' ||
            config.resizeHandleStyle === 'both-slot-and-edges') && (
            <div
              onMouseDown={startResize('w')}
              title="Drag right edge to resize width"
              className="absolute top-8 bottom-4 right-0 w-2 cursor-ew-resize z-20 hover:bg-amber-500/30 transition-colors"
            />
          )}
          {(config.enableBottomEdgeResize ||
            config.resizeHandleStyle === 'invisible-edges-and-corner' ||
            config.resizeHandleStyle === 'both-slot-and-edges') &&
            !isAutoFitHeight && (
              <div
                onMouseDown={startResize('h')}
                title="Drag bottom edge to resize height"
                className="absolute left-4 right-8 bottom-0 h-2 cursor-ns-resize z-20 hover:bg-amber-500/30 transition-colors"
              />
            )}
        </>
      )}
    </>
  );
};
