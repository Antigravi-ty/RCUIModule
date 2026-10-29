import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  MiniMapTransientState,
  MiniMapTransientListener,
} from '../stores/hudTransientTypes';

export interface MiniMapBoostPad {
  id: number;
  x: number;
  y: number;
  isBig: boolean;
}

export const ROCKET_LEAGUE_BOOST_PADS_34: MiniMapBoostPad[] = [
  { id: 0, x: 0.0, y: -4240.0, isBig: false },
  { id: 1, x: -1792.0, y: -4184.0, isBig: false },
  { id: 2, x: 1792.0, y: -4184.0, isBig: false },
  { id: 3, x: -3072.0, y: -4096.0, isBig: true },
  { id: 4, x: 3072.0, y: -4096.0, isBig: true },
  { id: 5, x: -940.0, y: -3308.0, isBig: false },
  { id: 6, x: 940.0, y: -3308.0, isBig: false },
  { id: 7, x: 0.0, y: -2816.0, isBig: false },
  { id: 8, x: -3584.0, y: -2484.0, isBig: false },
  { id: 9, x: 3584.0, y: -2484.0, isBig: false },
  { id: 10, x: -1788.0, y: -2300.0, isBig: false },
  { id: 11, x: 1788.0, y: -2300.0, isBig: false },
  { id: 12, x: -2048.0, y: -1036.0, isBig: false },
  { id: 13, x: 0.0, y: -1024.0, isBig: false },
  { id: 14, x: 2048.0, y: -1036.0, isBig: false },
  { id: 15, x: -3584.0, y: 0.0, isBig: true },
  { id: 16, x: -1024.0, y: 0.0, isBig: false },
  { id: 17, x: 1024.0, y: 0.0, isBig: false },
  { id: 18, x: 3584.0, y: 0.0, isBig: true },
  { id: 19, x: -2048.0, y: 1036.0, isBig: false },
  { id: 20, x: 0.0, y: 1024.0, isBig: false },
  { id: 21, x: 2048.0, y: 1036.0, isBig: false },
  { id: 22, x: -1788.0, y: 2300.0, isBig: false },
  { id: 23, x: 1788.0, y: 2300.0, isBig: false },
  { id: 24, x: -3584.0, y: 2484.0, isBig: false },
  { id: 25, x: 3584.0, y: 2484.0, isBig: false },
  { id: 26, x: 0.0, y: 2816.0, isBig: false },
  { id: 27, x: -940.0, y: 3308.0, isBig: false },
  { id: 28, x: 940.0, y: 3308.0, isBig: false },
  { id: 29, x: -3072.0, y: 4096.0, isBig: true },
  { id: 30, x: 3072.0, y: 4096.0, isBig: true },
  { id: 31, x: -1792.0, y: 4184.0, isBig: false },
  { id: 32, x: 1792.0, y: 4184.0, isBig: false },
  { id: 33, x: 0.0, y: 4240.0, isBig: false },
];

export interface PitchMiniMapHandle {
  /** Imperatively push ball coordinates, hit speed ring, and flip state at 120Hz with 0 React re-renders */
  setMiniMapState: (state: MiniMapTransientState) => void;
}

export interface PitchMiniMapHUDProps {
  /** Normalized ball X (`0`..`100`, default `62`) */
  ballX?: number;
  /** Normalized ball Y (`0`..`100`, default `34`) */
  ballY?: number;
  /** Ball hit speed in KPH (`0`..`216`, default `114`) */
  ballHitKph?: number;
  /** 180° perspective flip when spectating Orange team (default `false`) */
  isFlipped?: boolean;
  /** Optional 120Hz transient channel subscription (0 React VDOM re-renders) */
  subscribeMiniMap?: (listener: MiniMapTransientListener) => () => void;
  /** Light/Dark theme adaptive styling */
  isLight?: boolean;
  className?: string;
}

/**
 * PitchMiniMapHUD (`T5A.3`)
 * 1:1 port of `widget-mini-map` (`mini-map.html` + `mini-map.ts`).
 * Features the exact octagonal pitch geometry (`viewBox="0 0 1020 1320"`), 34 Boost pad coordinates
 * (`[-4096, 4096] x [-5120, 5120]`), 180° team perspective flip, and 120Hz DOM ref ball speed ring updates.
 */
export const PitchMiniMapHUD = React.memo(
  forwardRef<PitchMiniMapHandle, PitchMiniMapHUDProps>(
    (
      {
        ballX = 62,
        ballY = 34,
        ballHitKph = 114,
        isFlipped = false,
        subscribeMiniMap,
        isLight = true,
        className = '',
      },
      ref
    ) => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      const ballMarkerRef = useRef<HTMLDivElement | null>(null);
      const ballSpeedRingRef = useRef<HTMLDivElement | null>(null);
      const p1MarkerRef = useRef<HTMLDivElement | null>(null);
      const p4MarkerRef = useRef<HTMLDivElement | null>(null);

      const applyMiniMapToDom = useCallback((st: MiniMapTransientState) => {
        const bx = Math.max(8, Math.min(92, st.ballX));
        const by = Math.max(8, Math.min(92, st.ballY));
        const kph = Math.max(0, st.ballHitKph);
        const speedHue = Math.max(0, Math.round(60 - Math.min(1, kph / 160) * 60));

        if (containerRef.current) {
          containerRef.current.style.transform = st.isFlipped ? 'rotate(180deg)' : 'rotate(0deg)';
        }
        if (ballMarkerRef.current) {
          ballMarkerRef.current.style.left = `${bx}%`;
          ballMarkerRef.current.style.top = `${by}%`;
        }
        if (ballSpeedRingRef.current) {
          const borderCol = `hsl(${speedHue}, 100%, 52%)`;
          const shadowCol = `hsla(${speedHue}, 100%, 50%, 0.45)`;
          ballSpeedRingRef.current.style.borderColor = borderCol;
          ballSpeedRingRef.current.style.boxShadow = `0 0 0 2px ${shadowCol}`;
        }
        if (p1MarkerRef.current) {
          p1MarkerRef.current.style.transform = `translate(-50%, -50%) ${
            st.isFlipped ? 'rotate(-180deg)' : 'rotate(0deg)'
          }`;
        }
        if (p4MarkerRef.current) {
          p4MarkerRef.current.style.transform = `translate(-50%, -50%) ${
            st.isFlipped ? 'rotate(-180deg)' : 'rotate(0deg)'
          }`;
        }
      }, []);

      useImperativeHandle(
        ref,
        () => ({
          setMiniMapState: applyMiniMapToDom,
        }),
        [applyMiniMapToDom]
      );

      useEffect(() => {
        applyMiniMapToDom({
          ballX,
          ballY,
          ballHitKph,
          isFlipped,
        });
      }, [ballX, ballY, ballHitKph, isFlipped, applyMiniMapToDom]);

      useEffect(() => {
        if (!subscribeMiniMap) return;
        return subscribeMiniMap(applyMiniMapToDom);
      }, [subscribeMiniMap, applyMiniMapToDom]);

      const fieldFill = isLight ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 20, 30, 0.78)';
      const strokeLine = isLight ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.25)';

      return (
        <div
          ref={containerRef}
          data-ui-element="hud-pitch-mini-map"
          className={`relative w-[220px] aspect-[1020/1320] transition-transform duration-300 select-none ${className}`}
          style={{
            transform: isFlipped ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          {/* SVG Pitch Outline & Midfield Geometry */}
          <svg
            className="w-full h-full block"
            viewBox="0 0 1020 1320"
          >
            {/* Top Orange Goal Box */}
            <rect
              x="400"
              y="18"
              width="220"
              height="68"
              rx="10"
              fill="rgba(249, 115, 22, 0.22)"
              stroke="#f97316"
              strokeWidth="4"
            />
            {/* Bottom Blue Goal Box */}
            <rect
              x="400"
              y="1234"
              width="220"
              height="68"
              rx="10"
              fill="rgba(59, 130, 246, 0.22)"
              stroke="#3b82f6"
              strokeWidth="4"
            />
            {/* Main Octagonal Field */}
            <polygon
              points="230,86 790,86 960,256 960,1064 790,1234 230,1234 60,1064 60,256"
              fill={fieldFill}
              stroke="rgba(255, 255, 255, 0.48)"
              strokeWidth="4"
            />
            {/* Center Line & Circle */}
            <line
              x1="60"
              y1="660"
              x2="960"
              y2="660"
              stroke={strokeLine}
              strokeWidth="3"
            />
            <circle
              cx="510"
              cy="660"
              r="125"
              fill="none"
              stroke={strokeLine}
              strokeWidth="3"
            />
            <circle cx="510" cy="660" r="10" fill="rgba(255, 255, 255, 0.45)" />
          </svg>

          {/* 34 Authentic Boost Pads */}
          <div className="absolute inset-0 pointer-events-none">
            {ROCKET_LEAGUE_BOOST_PADS_34.map((pad) => {
              const leftPct = 50 + (pad.x / 4096) * 44;
              const topPct = 50 - (pad.y / 5120) * 43.5;
              const isRespawning = pad.id === 4 || pad.id === 18;
              return (
                <div
                  key={pad.id}
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    pad.isBig ? 'w-3 h-3' : 'w-1.5 h-1.5'
                  } ${
                    isRespawning
                      ? 'bg-neutral-500/40 border border-yellow-400/60'
                      : 'bg-[#ffd700] border border-black/40'
                  }`}
                />
              );
            })}
          </div>

          {/* Players & Ball Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Blue Player #1 */}
            <div
              ref={p1MarkerRef}
              style={{
                left: '42%',
                top: '68%',
                transform: `translate(-50%, -50%) ${isFlipped ? 'rotate(-180deg)' : 'rotate(0deg)'}`,
              }}
              className="absolute w-5 h-5 rounded-full bg-blue-500 border-2 border-white text-white text-[10px] font-black flex items-center justify-center"
            >
              1
            </div>
            {/* Orange Player #4 */}
            <div
              ref={p4MarkerRef}
              style={{
                left: '58%',
                top: '28%',
                transform: `translate(-50%, -50%) ${isFlipped ? 'rotate(-180deg)' : 'rotate(0deg)'}`,
              }}
              className="absolute w-5 h-5 rounded-full bg-orange-500 border-2 border-white text-white text-[10px] font-black flex items-center justify-center"
            >
              4
            </div>
            {/* Ball with Dynamic Hit Speed Ring */}
            <div
              ref={ballMarkerRef}
              style={{ left: `${ballX}%`, top: `${ballY}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center z-20 will-change-[left,top]"
            >
              <div
                ref={ballSpeedRingRef}
                className="w-full h-full rounded-full bg-neutral-900/90 border-[2.5px] flex items-center justify-center transition-colors duration-75"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              </div>
            </div>
          </div>
        </div>
      );
    }
  )
);

PitchMiniMapHUD.displayName = 'PitchMiniMapHUD';
