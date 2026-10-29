import React from 'react';
import {
  ArrowLeft,
  Info,
  Minus,
  Minimize2,
  Pin,
  X,
  MoveDiagonal2,
} from 'lucide-react';
import type { FloatingWindowItem } from '../stores/floatingStore';
import type { BackBtnResolvedGeometry } from '../tokens/menuLayoutTokens';
import type { FloatingThreeStageConfig } from '../stores/floatingThreeStageStore';
import { KeycapBadge } from '../primitives/KeycapBadge';
import { getFloatingWindowIcon } from './FloatingWindowIcon';
import { CornerCurvedDragger } from './CornerCurvedDragger';

export interface FloatingThreeStageHeaderProps {
  item: FloatingWindowItem;
  config: FloatingThreeStageConfig;
  isLight: boolean;
  isPinned: boolean;
  setIsPinned: React.Dispatch<React.SetStateAction<boolean>>;
  activeTitle: string;
  subViewStack: string[];
  setSubViewStack: React.Dispatch<React.SetStateAction<string[]>>;
  btnGeom: BackBtnResolvedGeometry;
  minHeaderHeight: number;
  labelFontSize: number;
  isRightExpanded: boolean;
  setRightHovered: (v: boolean) => void;
  setHoveredDesc: (desc: string | null) => void;
  leftBorderStructureClass: string;
  rightBorderStructureClass: string;
  getHeaderBtnSurfaceClasses: (activeHighlight?: boolean) => string;
  handleTitleBarMouseDown: (e: React.MouseEvent) => void;
  handleTriggerMinimize: () => void;
  onClose: () => void;
}

export const FloatingThreeStageHeader: React.FC<FloatingThreeStageHeaderProps> = ({
  item,
  config,
  isLight,
  isPinned,
  setIsPinned,
  activeTitle,
  subViewStack,
  setSubViewStack,
  btnGeom,
  minHeaderHeight,
  labelFontSize,
  isRightExpanded,
  setRightHovered,
  setHoveredDesc,
  leftBorderStructureClass,
  rightBorderStructureClass,
  getHeaderBtnSurfaceClasses,
  handleTitleBarMouseDown,
  handleTriggerMinimize,
  onClose,
}) => {
  return (
    <div
      onMouseDown={handleTitleBarMouseDown}
      data-floating-stage="header"
      style={{
        paddingLeft: `${config.headerPaddingX}px`,
        paddingRight: `${config.headerPaddingX}px`,
        paddingTop: `${config.headerPaddingY}px`,
        paddingBottom: `${config.headerPaddingY}px`,
        minHeight: `${minHeaderHeight}px`,
      }}
      className={`relative flex items-center justify-between border-b shrink-0 transition-colors ${
        isPinned ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
      } ${
        isLight
          ? 'border-neutral-200/90 bg-neutral-100/75 text-neutral-900'
          : 'border-neutral-800/90 bg-neutral-950/60 text-white'
      } ${
        config.showStageAnatomyBorders
          ? 'outline-1 -outline-offset-1 outline-dashed outline-amber-500/70'
          : ''
      }`}
    >
      {config.headerTitleAlign === 'center' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden px-12">
          <span
            style={{ fontSize: `${config.headerTitleFontSize}px` }}
            className="font-bold tracking-wider uppercase whitespace-nowrap truncate leading-none text-center"
          >
            {activeTitle}
          </span>
        </div>
      )}

      <div className="relative z-10 flex items-center gap-2 shrink-0 min-w-0">
        {config.headerLeftSlotMode === 'back-button' && (
          <button
            type="button"
            onClick={() => {
              if (subViewStack.length > 0) {
                setSubViewStack((prev) => prev.slice(0, -1));
              }
            }}
            onMouseEnter={() =>
              config.footerHoverLinkage &&
              setHoveredDesc(
                subViewStack.length > 0
                  ? 'Stage 1 Left Slot [Back]: Return to parent floating window view.'
                  : 'Stage 1 Left Slot [Back]: At root view of floating window (click inside content to push a sub-view).'
              )
            }
            onMouseLeave={() => config.footerHoverLinkage && setHoveredDesc(null)}
            style={{
              minWidth: `${btnGeom.width}px`,
              height: `${btnGeom.height}px`,
              borderRadius: btnGeom.borderRadiusCss,
            }}
            className={`inline-flex items-center justify-center shrink-0 ${leftBorderStructureClass} transition-all outline-none ${getHeaderBtnSurfaceClasses(
              subViewStack.length > 0
            )}`}
            title="Back to parent view in floating window"
          >
            <ArrowLeft
              style={{ width: `${btnGeom.iconSize}px`, height: `${btnGeom.iconSize}px` }}
            />
          </button>
        )}

        {config.headerLeftSlotMode === 'category-icon' && (
          <div
            onMouseEnter={() =>
              config.footerHoverLinkage &&
              setHoveredDesc(
                `Window Category Icon (${item.category || 'telemetry'}): Drag titlebar to reposition window anywhere on canvas.`
              )
            }
            onMouseLeave={() => config.footerHoverLinkage && setHoveredDesc(null)}
            style={
              config.headerTitleAlign === 'center'
                ? {
                    minWidth: `${btnGeom.width}px`,
                    height: `${btnGeom.height}px`,
                    borderRadius: btnGeom.borderRadiusCss,
                  }
                : {
                    paddingLeft: config.headerPaddingX === 0 ? '12px' : '2px',
                  }
            }
            className={`inline-flex items-center justify-center shrink-0 ${
              config.headerTitleAlign === 'center'
                ? `${leftBorderStructureClass} ${
                    isLight ? 'border-neutral-200/90' : 'border-neutral-800/80'
                  }`
                : ''
            }`}
          >
            {getFloatingWindowIcon(item.category, item.id)}
          </div>
        )}

        {config.headerTitleAlign === 'left' && (
          <span
            style={{
              fontSize: `${config.headerTitleFontSize}px`,
              paddingLeft: config.headerLeftSlotMode === 'none' ? '10px' : '0px',
            }}
            className="font-bold tracking-tight truncate max-w-[360px] leading-none"
          >
            {activeTitle}
          </span>
        )}
      </div>

      <div className="relative z-10 flex items-center shrink-0 ml-auto">
        {config.headerRightActionMode === 'minimize-and-pin' && (
          <button
            type="button"
            onClick={() => setIsPinned((v) => !v)}
            onMouseEnter={() =>
              config.footerHoverLinkage &&
              setHoveredDesc(
                isPinned
                  ? 'Unpin Window: Allow dragging and batch ESC minimization.'
                  : 'Pin Window: Lock window position on screen and ignore batch ESC minimize.'
              )
            }
            onMouseLeave={() => config.footerHoverLinkage && setHoveredDesc(null)}
            style={{
              minWidth: `${Math.max(22, btnGeom.width)}px`,
              height: `${btnGeom.height}px`,
            }}
            className={`inline-flex items-center justify-center shrink-0 ${rightBorderStructureClass} transition-all outline-none ${getHeaderBtnSurfaceClasses(
              isPinned
            )}`}
            title={isPinned ? 'Unpin Window' : 'Pin Window Position'}
          >
            <Pin className="h-3 w-3" />
          </button>
        )}

        <button
          type="button"
          onClick={handleTriggerMinimize}
          onMouseEnter={() => {
            setRightHovered(true);
            if (config.footerHoverLinkage) {
              setHoveredDesc(
                'Minimize to Stack [-]: Collapse window via 3-phase sequenced transition into top-right Floating Stack Icon.'
              );
            }
          }}
          onMouseLeave={() => {
            setRightHovered(false);
            if (config.footerHoverLinkage) {
              setHoveredDesc(null);
            }
          }}
          style={{
            minWidth: `${btnGeom.width}px`,
            width: isRightExpanded ? 'auto' : `${btnGeom.width}px`,
            height: `${btnGeom.height}px`,
            borderRadius:
              config.headerRightActionMode === 'minimize-and-close'
                ? '0px'
                : btnGeom.rightBorderRadiusCss,
            paddingLeft: isRightExpanded ? '10px' : undefined,
            paddingRight: isRightExpanded ? '10px' : undefined,
          }}
          className={`inline-flex items-center justify-center gap-1.5 shrink-0 ${rightBorderStructureClass} transition-all outline-none ${getHeaderBtnSurfaceClasses(
            false
          )}`}
          title="Minimize to top-right window stack"
        >
          {isRightExpanded && (
            <span
              style={{ fontSize: `${labelFontSize}px` }}
              className="font-bold tracking-wider uppercase leading-none whitespace-nowrap select-none"
            >
              STACK
            </span>
          )}
          {config.headerRightIconStyle === 'minimize-2' ? (
            <Minimize2
              style={{ width: `${btnGeom.iconSize}px`, height: `${btnGeom.iconSize}px` }}
            />
          ) : (
            <Minus
              className="stroke-[2.5]"
              style={{ width: `${btnGeom.iconSize}px`, height: `${btnGeom.iconSize}px` }}
            />
          )}
        </button>

        {config.headerRightActionMode === 'minimize-and-close' && (
          <button
            type="button"
            onClick={onClose}
            onMouseEnter={() =>
              config.footerHoverLinkage &&
              setHoveredDesc('Close Window [×]: Permanently close and remove from Floating Stack.')
            }
            onMouseLeave={() => config.footerHoverLinkage && setHoveredDesc(null)}
            style={{
              minWidth: `${btnGeom.width}px`,
              height: `${btnGeom.height}px`,
              borderRadius: btnGeom.rightBorderRadiusCss,
            }}
            className={`inline-flex items-center justify-center shrink-0 ${rightBorderStructureClass} transition-all outline-none hover:bg-rose-500/20 hover:text-rose-500 ${getHeaderBtnSurfaceClasses(
              false
            )}`}
            title="Close window"
          >
            <X
              style={{ width: `${btnGeom.iconSize}px`, height: `${btnGeom.iconSize}px` }}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export interface FloatingThreeStageFooterAndResizersProps {
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

export const FloatingThreeStageFooterAndResizers: React.FC<
  FloatingThreeStageFooterAndResizersProps
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
