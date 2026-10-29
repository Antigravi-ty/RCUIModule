import React, { useEffect, useId, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  ReplayFooterTransientState,
  ReplayFooterTransientListener,
} from './types';

export interface TemporalReplayData {
  scorerName: string;
  /** e.g. `118KPH` or number `118` */
  goalSpeed: string | number;
  /** Optional assister name; if null or empty, the Assister block is hidden automatically */
  assisterName?: string | null;
  /** Team accent color for the center glow & SVG top border gradient mid-stop (default: `#edce0b`) */
  teamAccentColor?: string;
}

export interface TemporalReplayFooterHandle {
  /** Imperatively push replay footer state at 120Hz with 0 React re-renders */
  setReplayFooter: (state: ReplayFooterTransientState) => void;
}

export interface TemporalReplayFooterHUDProps {
  /** Controls bottom-up slide-in (`visible=true`) and slide-out (`visible=false`) animation */
  visible?: boolean;
  data?: TemporalReplayData;
  /** Optional transient channel subscription (0 React VDOM re-renders) */
  subscribeReplayFooter?: (listener: ReplayFooterTransientListener) => () => void;
  /** Slide-in transition duration in seconds (default 0.75s, matching `replay-controller.ts`) */
  enterDurationSec?: number;
  /** Slide-out transition duration in seconds (default 0.65s, matching `scene-replay-viewer.html`) */
  exitDurationSec?: number;
  /** Side wing vertical offset in px (default -16px) */
  sideY?: number;
  /** Center dip vertical offset in px (default 47px) */
  centerY?: number;
  /** Wing flat width % (default 7%) */
  wingWidthPct?: number;
  /** Slope transition width % (default 15%) */
  slopeWidthPct?: number;
  /** Footer content height in px (default 98px) */
  footerHeightPx?: number;
  /** Light/Dark theme adaptive styling */
  isLight?: boolean;
  className?: string;
}

function hexToRgbTuple(hex: string, fallback: [number, number, number] = [250, 200, 0]): [number, number, number] {
  const clean = (hex || '').replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) return [r, g, b];
  } else if (clean.length >= 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) return [r, g, b];
  }
  return fallback;
}

/**
 * TemporalReplayFooterHUD (`T5A.1`)
 * 1:1 faithful port of `RLoverlay_debug_v1` / `agrepo1` (`scene-replay-viewer.html` + `replay-controller.ts`).
 * Upgraded to High-Performance Architecture (`React.memo` + `forwardRef` + `subscribeReplayFooter` + `isLight`).
 */
export const TemporalReplayFooterHUD = React.memo(
  forwardRef<TemporalReplayFooterHandle, TemporalReplayFooterHUDProps>(
    (
      {
        visible = true,
        data = {
          scorerName: 'Vatira_KC',
          goalSpeed: '118KPH',
          assisterName: 'Atow.',
          teamAccentColor: '#edce0b',
        },
        subscribeReplayFooter,
        enterDurationSec = 0.75,
        exitDurationSec = 0.65,
        sideY = -16,
        centerY = 47,
        wingWidthPct = 7,
        slopeWidthPct = 15,
        footerHeightPx = 98,
        isLight = true,
        className = '',
      },
      ref
    ) => {
      const footerRef = useRef<HTMLElement | null>(null);
      const bgRef = useRef<HTMLDivElement | null>(null);
      const svgPathRef = useRef<SVGPathElement | null>(null);
      const stopMid1Ref = useRef<SVGStopElement | null>(null);
      const stopMid2Ref = useRef<SVGStopElement | null>(null);
      const scorerTextRef = useRef<HTMLSpanElement | null>(null);
      const speedTextRef = useRef<HTMLSpanElement | null>(null);
      const assisterBlockRef = useRef<HTMLDivElement | null>(null);
      const assisterTextRef = useRef<HTMLSpanElement | null>(null);
      const gradId = useId().replace(/:/g, '');

      const baseTop = 120;
      const totalHeightPx = footerHeightPx + baseTop;
      const midColor = data.teamAccentColor || '#edce0b';
      const [midR, midG, midB] = hexToRgbTuple(midColor);

      const formatSpeed = useCallback((gs: string | number) => {
        if (typeof gs === 'number') return `${Math.floor(gs)}KPH`;
        return gs.endsWith('KPH') ? gs : `${gs}KPH`;
      }, []);

      const applyStateToDom = useCallback(
        (st: ReplayFooterTransientState) => {
          if (footerRef.current) {
            footerRef.current.style.transform = st.visible
              ? 'translate3d(0, 0%, 0)'
              : 'translate3d(0, 100%, 0)';
            footerRef.current.style.transition = st.visible
              ? `transform ${enterDurationSec}s cubic-bezier(0.16, 1, 0.3, 1)`
              : `transform ${exitDurationSec}s cubic-bezier(0.7, 0, 0.84, 0)`;
          }
          if (scorerTextRef.current) {
            const nextScorer = st.scorerName || 'Player';
            if (scorerTextRef.current.textContent !== nextScorer) {
              scorerTextRef.current.textContent = nextScorer;
            }
          }
          if (speedTextRef.current) {
            const nextSpd = formatSpeed(st.goalSpeed);
            if (speedTextRef.current.textContent !== nextSpd) {
              speedTextRef.current.textContent = nextSpd;
            }
          }
          const hasAssister = Boolean(st.assisterName && st.assisterName.trim().length > 0);
          if (assisterBlockRef.current) {
            assisterBlockRef.current.style.display = hasAssister ? 'flex' : 'none';
          }
          if (assisterTextRef.current && hasAssister) {
            const nextAst = st.assisterName || '';
            if (assisterTextRef.current.textContent !== nextAst) {
              assisterTextRef.current.textContent = nextAst;
            }
          }
          const accent = st.teamAccentColor || '#edce0b';
          const [r, g, b] = hexToRgbTuple(accent);
          if (stopMid1Ref.current) stopMid1Ref.current.setAttribute('stop-color', accent);
          if (stopMid2Ref.current) stopMid2Ref.current.setAttribute('stop-color', accent);
          if (bgRef.current) {
            const wingRgb = isLight ? '20, 24, 38' : '35, 30, 25';
            const wingAlpha = isLight ? 0.52 : 0.35;
            bgRef.current.style.background = `linear-gradient(
              90deg,
              rgba(160, 20, 45, 0.32) 0%,
              rgba(${wingRgb}, ${wingAlpha}) 18%,
              rgba(${r}, ${g}, ${b}, 0.42) 50%,
              rgba(${wingRgb}, ${wingAlpha}) 82%,
              rgba(160, 20, 45, 0.32) 100%
            )`;
          }
        },
        [enterDurationSec, exitDurationSec, formatSpeed, isLight]
      );

      useImperativeHandle(
        ref,
        () => ({
          setReplayFooter: applyStateToDom,
        }),
        [applyStateToDom]
      );

      useEffect(() => {
        applyStateToDom({
          visible,
          scorerName: data.scorerName,
          goalSpeed: data.goalSpeed,
          assisterName: data.assisterName,
          teamAccentColor: data.teamAccentColor || '#edce0b',
        });
      }, [visible, data, applyStateToDom]);

      useEffect(() => {
        if (!subscribeReplayFooter) return;
        return subscribeReplayFooter(applyStateToDom);
      }, [subscribeReplayFooter, applyStateToDom]);

      // Compute exact SVG top border path (`updateReplaySvgBorder` from `replay-controller.ts`) via ResizeObserver
      useEffect(() => {
        const footerEl = footerRef.current;
        const pathEl = svgPathRef.current;
        if (!footerEl || !pathEl) return;

        const updateBorderPath = () => {
          const winW = footerEl.clientWidth || window.innerWidth || 1280;
          const sideY_px = baseTop + sideY;
          const centerY_px = baseTop + centerY;

          const p1_x = winW * (wingWidthPct / 100);
          const p2_x = winW * ((wingWidthPct + slopeWidthPct) / 100);
          const p3_x = winW * ((100 - wingWidthPct - slopeWidthPct) / 100);
          const p4_x = winW * ((100 - wingWidthPct) / 100);

          const dPath = `M 0 ${sideY_px} L ${p1_x} ${sideY_px} L ${p2_x} ${centerY_px} L ${p3_x} ${centerY_px} L ${p4_x} ${sideY_px} L ${winW} ${sideY_px}`;
          pathEl.setAttribute('d', dPath);
        };

        updateBorderPath();
        const ro = new ResizeObserver(updateBorderPath);
        ro.observe(footerEl);
        return () => ro.disconnect();
      }, [sideY, centerY, wingWidthPct, slopeWidthPct]);

      const sideTopPx = baseTop + sideY;
      const centerTopPx = baseTop + centerY;
      const clipPolygon = `polygon(
        0% ${sideTopPx}px,
        ${wingWidthPct}% ${sideTopPx}px,
        ${wingWidthPct + slopeWidthPct}% ${centerTopPx}px,
        ${100 - wingWidthPct - slopeWidthPct}% ${centerTopPx}px,
        ${100 - wingWidthPct}% ${sideTopPx}px,
        100% ${sideTopPx}px,
        100% 100%,
        0% 100%
      )`;

      const formattedSpeed = formatSpeed(data.goalSpeed);
      const hasAssister = Boolean(data.assisterName && data.assisterName.trim().length > 0);
      const wingRgb = isLight ? '20, 24, 38' : '35, 30, 25';
      const wingAlpha = isLight ? 0.52 : 0.35;

      return (
        <footer
          ref={footerRef}
          data-ui-element="hud-temporal-replay-footer"
          className={`absolute bottom-0 left-0 w-full z-40 pointer-events-none select-none will-change-transform ${className}`}
          style={{
            height: `${totalHeightPx}px`,
            transform: visible ? 'translate3d(0, 0%, 0)' : 'translate3d(0, 100%, 0)',
            transition: visible
              ? `transform ${enterDurationSec}s cubic-bezier(0.16, 1, 0.3, 1)`
              : `transform ${exitDurationSec}s cubic-bezier(0.7, 0, 0.84, 0)`,
            fontFamily: "'Chakra Petch', var(--font-jetbrains), system-ui, sans-serif",
          }}
        >
          <style>{`
            @keyframes rlReplayPulseDot {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.25; transform: scale(0.7); }
            }
          `}</style>

          {/* 1. Semi-transparent Polygon Solid-Gradient Background Layer (`.rl-footer-bg`, 0 backdrop-filter) */}
          <div
            ref={bgRef}
            className="absolute inset-0 w-full h-full pointer-events-auto"
            style={{
              clipPath: clipPolygon,
              background: `linear-gradient(
                90deg,
                rgba(160, 20, 45, 0.65) 0%,
                rgba(${wingRgb}, 0.85) 18%,
                rgba(${midR}, ${midG}, ${midB}, 0.68) 50%,
                rgba(${wingRgb}, 0.85) 82%,
                rgba(160, 20, 45, 0.65) 100%
              )`,
            }}
          />

          {/* 2. Top Highlight Gradient Glowing SVG Line (`.rl-footer-border` & `#svgBorderPath`) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" width="100%" height="100%">
            <defs>
              <linearGradient id={`lineGrad-${gradId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff2a4b" />
                <stop offset="16%" stopColor="#ff2a4b" />
                <stop ref={stopMid1Ref} offset="28%" stopColor={midColor} />
                <stop ref={stopMid2Ref} offset="72%" stopColor={midColor} />
                <stop offset="84%" stopColor="#ff2a4b" />
                <stop offset="100%" stopColor="#ff2a4b" />
              </linearGradient>
            </defs>
            <path
              ref={svgPathRef}
              d=""
              fill="none"
              stroke={`url(#lineGrad-${gradId})`}
              strokeWidth="3"
            />
          </svg>

          {/* 3. Foreground Content Grid (`.rl-footer-content`) */}
          <div
            className="absolute bottom-0 left-0 z-20 w-full grid items-center px-6 md:px-8 pointer-events-auto"
            style={{
              height: `${footerHeightPx}px`,
              gridTemplateColumns: 'minmax(130px, 220px) 1fr minmax(130px, 220px)',
            }}
          >
            {/* Left REPLAY Wing Indicator */}
            <div
              className="flex items-center gap-2.5 text-[#ff2a4b] font-extrabold italic tracking-[3px] text-base md:text-xl"
              style={{
                transform: `translateY(${sideY * 0.5}px)`,
              }}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full bg-[#ff2a4b] shrink-0"
                style={{
                  boxShadow: '0 0 0 2px rgba(255, 42, 75, 0.35)',
                  animation: 'rlReplayPulseDot 1.2s infinite ease-in-out',
                }}
              />
              <span>REPLAY</span>
            </div>

            {/* Center Scorer / Goal Speed / Assister Stats (`.center-stats`) */}
            <div
              className="flex items-center justify-center gap-6 md:gap-11 text-white font-extrabold italic tracking-[1.5px] text-base md:text-[21px]"
              style={{
                WebkitTextStroke: '0.6px rgba(0, 0, 0, 0.65)',
                transform: `translateY(${centerY * 0.5}px)`,
              }}
            >
              {/* Goal Scorer */}
              <div className="flex items-center gap-2.5">
                <svg
                  className="shrink-0"
                  style={{ width: '31px', height: '31px' }}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g>
                    <path
                      d="M15,9l-2.5,2.5M15,6V9h3l3-3H18V3Z"
                      fill="none"
                      stroke="#ffffff"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M12.33,3H12a9,9,0,1,0,9,9c0-.11,0-.22,0-.33"
                      fill="none"
                      stroke="#ffffff"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M16.9,13A5,5,0,1,1,11,7.1"
                      fill="none"
                      stroke="#ffffff"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </g>
                </svg>
                <span ref={scorerTextRef} className="truncate max-w-[180px]">
                  {data.scorerName || 'Player'}
                </span>
              </div>

              {/* Goal Ball Speed */}
              <div className="flex items-center gap-2.5">
                <svg
                  className="shrink-0"
                  style={{ width: '35px', height: '35px' }}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.34315 17.6569C5.22433 16.538 4.4624 15.1126 4.15372 13.5607C3.84504 12.0089 4.00346 10.4003 4.60896 8.93853C5.21446 7.47672 6.23984 6.22729 7.55544 5.34824C8.87103 4.46919 10.4177 4 12 4C13.5823 4 15.129 4.46919 16.4446 5.34824C17.7602 6.22729 18.7855 7.47672 19.391 8.93853C19.9965 10.4003 20.155 12.0089 19.8463 13.5607C19.5376 15.1126 18.7757 16.538 17.6569 17.6569"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d="M12 12L16 10"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                <span ref={speedTextRef} className="text-[#f1f5f9] text-base md:text-xl tabular-nums">
                  {formattedSpeed}
                </span>
              </div>

              {/* Optional Assister */}
              <div
                ref={assisterBlockRef}
                className="flex items-center gap-2.5"
                style={{ display: hasAssister ? 'flex' : 'none' }}
              >
                <svg
                  className="shrink-0"
                  style={{ width: '25px', height: '25px' }}
                  viewBox="0 0 360.001 360.001"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g fill="#ffffff">
                    <path d="M81.987,165.207c6.078,0,12.154-2.316,16.791-6.947c9.26-9.269,9.26-24.295,0-33.569l-11.02-11.007l11.02-11.008c9.26-9.267,9.26-24.295,0-33.563c-9.271-9.27-24.307-9.272-33.566,0L54.204,80.122L43.183,69.112c-9.258-9.272-24.293-9.27-33.553,0c-9.275,9.269-9.275,24.297,0,33.563l11.006,11.008L9.63,124.69c-9.275,9.274-9.275,24.301,0,33.569c4.635,4.631,10.701,6.947,16.775,6.947c6.078,0,12.154-2.316,16.777-6.951l11.021-11.005l11.008,11.005C69.847,162.89,75.911,165.207,81.987,165.207z" />
                    <path d="M250.603,187.093c-30.585,0-55.374,24.79-55.374,55.375s24.789,55.375,55.374,55.375c30.584,0,55.388-24.79,55.388-55.375S281.187,187.093,250.603,187.093z" />
                    <path d="M356.897,58.524c-1.021-4.274-3.781-7.933-7.599-10.097L267.346,2.056c-7.598-4.302-17.248-1.631-21.547,5.965l-5.162,9.101c-2.069,3.652-2.604,7.979-1.485,12.023c1.116,4.046,3.809,7.48,7.463,9.548l29.571,16.729c-30.79,11.656-59.528,28.811-85.75,51.206c-31.078,26.548-58.768,60.509-82.283,100.937c-34.674,59.63-49.719,114.674-53.506,130.113c-1.004,4.144-0.307,8.511,1.943,12.128c2.25,3.619,5.857,6.18,10.025,7.097l12.373,2.728c1.139,0.254,2.289,0.371,3.418,0.371c7.107,0,13.559-4.823,15.336-12c3.51-14.113,17.396-64.314,48.717-118.159c37.254-64.053,83.781-107.779,138.668-130.401l-17.693,26.548c-2.325,3.495-3.172,7.77-2.35,11.893c0.832,4.116,3.26,7.735,6.752,10.06l8.711,5.787c7.273,4.833,17.088,2.864,21.933-4.4l52.188-78.358C357.112,67.31,357.915,62.805,356.897,58.524z" />
                  </g>
                </svg>
                <span ref={assisterTextRef} className="truncate max-w-[160px]">
                  {data.assisterName}
                </span>
              </div>
            </div>

            {/* Right REPLAY Wing Indicator */}
            <div
              className="flex items-center justify-end gap-2.5 text-[#ff2a4b] font-extrabold italic tracking-[3px] text-base md:text-xl"
              style={{
                transform: `translateY(${sideY * 0.5}px)`,
              }}
            >
              <span>REPLAY</span>
              <span
                className="inline-block w-2.5 h-2.5 rounded-full bg-[#ff2a4b] shrink-0"
                style={{
                  boxShadow: '0 0 0 2px rgba(255, 42, 75, 0.35)',
                  animation: 'rlReplayPulseDot 1.2s infinite ease-in-out',
                }}
              />
            </div>
          </div>
        </footer>
      );
    }
  )
);

TemporalReplayFooterHUD.displayName = 'TemporalReplayFooterHUD';
