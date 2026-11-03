import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { BoostTransientListener } from '../stores/hudTransientTypes';
import { BoostColorScheme, getBoostSegmentColor } from './CircularBoostGauge';

export interface DualLayerBoostPieHandle {
  /** Imperatively update boost pie sectors (`0..100`) at 120Hz with 0 React re-renders */
  setBoost: (boostAmount: number) => void;
}

export interface DualLayerBoostPieHUDProps {
  /** Boost percentage (`0`..`100`, default `74`) */
  boostAmount?: number;
  /** Optional 120Hz transient channel subscription (0 React VDOM re-renders) */
  subscribeBoost?: (listener: BoostTransientListener) => () => void;
  /** Outer diameter in px (default `124`) */
  size?: number;
  /** Color scheme: `'step-12'` (default 9-tier 12-boost steps) or `'classic-4'` */
  colorScheme?: BoostColorScheme;
  /** Light/Dark theme adaptive styling */
  isLight?: boolean;
  className?: string;
}

function buildSectorPath(pct: number): string {
  if (pct <= 0) return '';
  if (pct >= 100) {
    return 'M 50 50 L 50 4 A 46 46 0 1 1 49.99 4 Z';
  }
  const angleRad = ((pct / 100) * 360 - 90) * (Math.PI / 180);
  const x = 50 + 46 * Math.cos(angleRad);
  const y = 50 + 46 * Math.sin(angleRad);
  const largeArc = pct > 50 ? 1 : 0;
  return `M 50 50 L 50 4 A 46 46 0 ${largeArc} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`;
}

/**
 * DualLayerBoostPieHUD (`T5A.4`)
 * 1:1 port of `widget-boost-pie` (`boost-pie.html` + `boost-pie.ts`).
 * Features dual-layer SVG sector geometry (`pieFill` + lagging `ghostPieFill`) and 12-boost-per-tier
 * color progression (`0-11` Black, `12-23` Red Flashing, `24-35` Red, `36-47` Orange, `48-59` Yellow,
 * `60-71` Lime, `72-83` Green, `84-96` Emerald, `97-100` Sky Blue), mutating SVG `<path>` `d` and `fill`
 * attributes directly via DOM refs at 120Hz with 0 React re-renders.
 */
export const DualLayerBoostPieHUD = React.memo(
  forwardRef<DualLayerBoostPieHandle, DualLayerBoostPieHUDProps>(
    (
      {
        boostAmount = 74,
        subscribeBoost,
        size = 124,
        colorScheme = 'step-12',
        isLight = false,
        className = '',
      },
      ref
    ) => {
      const mainPathRef = useRef<SVGPathElement | null>(null);
      const ghostPathRef = useRef<SVGPathElement | null>(null);
      const ghostValueRef = useRef<number>(boostAmount);
      const ghostRafRef = useRef<number | null>(null);
      const targetValueRef = useRef<number>(boostAmount);

      const syncDomPaths = useCallback(
        (mainVal: number, ghostVal: number) => {
          const clampedMain = Math.max(0, Math.min(100, mainVal));
          const clampedGhost = Math.max(clampedMain, Math.min(100, ghostVal));
          const seg = getBoostSegmentColor(clampedMain, colorScheme);
          // For 0..11 black tier when sector pct is small, ensure sector is still visible if > 0
          const visualPct =
            clampedMain === 0 && colorScheme === 'step-12' ? 6 : clampedMain;

          if (mainPathRef.current) {
            mainPathRef.current.setAttribute('d', buildSectorPath(visualPct));
            mainPathRef.current.setAttribute(
              'fill',
              !isLight && seg.segmentName === 'black' ? '#27272a' : seg.color
            );
            mainPathRef.current.style.animation = seg.isFlashing
              ? 'hudBoostRedFlash 0.38s ease-in-out infinite alternate'
              : 'none';
          }
          if (ghostPathRef.current) {
            ghostPathRef.current.setAttribute('d', buildSectorPath(clampedGhost));
          }
        },
        [colorScheme, isLight]
      );

      const applyBoost = useCallback(
        (nextBoost: number) => {
          const clamped = Math.max(0, Math.min(100, nextBoost));
          targetValueRef.current = clamped;

          if (clamped >= ghostValueRef.current) {
            ghostValueRef.current = clamped;
            syncDomPaths(clamped, clamped);
            return;
          }

          syncDomPaths(clamped, ghostValueRef.current);

          if (ghostRafRef.current === null) {
            const animateGhost = () => {
              const diff = ghostValueRef.current - targetValueRef.current;
              if (diff <= 0.4) {
                ghostValueRef.current = targetValueRef.current;
                syncDomPaths(targetValueRef.current, ghostValueRef.current);
                ghostRafRef.current = null;
                return;
              }
              ghostValueRef.current -= Math.max(0.35, diff * 0.12);
              syncDomPaths(targetValueRef.current, ghostValueRef.current);
              ghostRafRef.current = requestAnimationFrame(animateGhost);
            };
            ghostRafRef.current = requestAnimationFrame(animateGhost);
          }
        },
        [syncDomPaths]
      );

      useImperativeHandle(
        ref,
        () => ({
          setBoost: applyBoost,
        }),
        [applyBoost]
      );

      useEffect(() => {
        applyBoost(boostAmount);
      }, [boostAmount, applyBoost]);

      useEffect(() => {
        if (!subscribeBoost) return;
        return subscribeBoost((val) => {
          applyBoost(val);
        });
      }, [subscribeBoost, applyBoost]);

      useEffect(() => {
        return () => {
          if (ghostRafRef.current !== null) {
            cancelAnimationFrame(ghostRafRef.current);
          }
        };
      }, []);

      const circleFill = isLight ? 'rgba(241, 245, 249, 0.92)' : 'rgba(15, 23, 42, 0.78)';
      const circleStroke = isLight ? 'rgba(15, 23, 42, 0.22)' : 'rgba(255, 255, 255, 0.22)';
      const ghostFill = isLight ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.32)';
      const initialSeg = getBoostSegmentColor(boostAmount, colorScheme);
      const initialVisualPct =
        boostAmount === 0 && colorScheme === 'step-12' ? 6 : boostAmount;

      return (
        <div
          data-ui-element="hud-dual-layer-boost-pie"
          className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`}
          style={{ width: size, height: size }}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill={circleFill}
              stroke={circleStroke}
              strokeWidth="2.5"
            />
            {/* Ghost Sector (Consumption Trail) */}
            <path ref={ghostPathRef} d={buildSectorPath(boostAmount)} fill={ghostFill} />
            {/* Main Active Sector */}
            <path
              ref={mainPathRef}
              d={buildSectorPath(initialVisualPct)}
              fill={!isLight && initialSeg.segmentName === 'black' ? '#27272a' : initialSeg.color}
            />
          </svg>
        </div>
      );
    }
  )
);

DualLayerBoostPieHUD.displayName = 'DualLayerBoostPieHUD';
