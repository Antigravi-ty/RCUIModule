import React from 'react';
import {
  ArrowLeft,
  Minus,
  Minimize2,
  Pin,
  X,
} from 'lucide-react';
import type { FloatingWindowItem } from '../stores/floatingStore';
import type { BackBtnResolvedGeometry } from '../tokens/menuLayoutTokens';
import type { FloatingThreeStageConfig } from '../stores/floatingThreeStageStore';
import { getFloatingWindowIcon } from './FloatingWindowIcon';
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
            className="font-bold tracking-wider uppercase whitespace-nowrap truncate leading-snug text-center"
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
            className="font-bold tracking-tight truncate max-w-[360px] leading-snug"
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
