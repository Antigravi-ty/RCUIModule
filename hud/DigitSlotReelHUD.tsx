import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { BoostTransientListener } from '../stores/hudTransientTypes';

export interface DigitSlotReelHandle {
  /** Imperatively update 3-digit slot reels (`0..999`) at 120Hz with 0 React re-renders */
  setValue: (value: number) => void;
}

export interface DigitSlotReelHUDProps {
  /** Numeric value (`0`..`999`, default `74`) */
  value?: number;
  /** Optional 120Hz transient channel subscription (0 React VDOM re-renders) */
  subscribeBoost?: (listener: BoostTransientListener) => () => void;
  /** Whether to auto-hide leading zeros (default `true`, matching `boost-number.ts`) */
  hideLeadingZeros?: boolean;
  /** Light/Dark theme adaptive styling */
  isLight?: boolean;
  className?: string;
}

function getSlotTierColor(val: number, isLight: boolean): string {
  if (val <= 15) return '#ef4444';
  if (val <= 35) return '#f97316';
  if (val <= 55) return isLight ? '#ca8a04' : '#eab308';
  if (val <= 75) return isLight ? '#65a30d' : '#84cc16';
  if (val <= 90) return isLight ? '#16a34a' : '#22c55e';
  return isLight ? '#059669' : '#10b981';
}

/**
 * DigitSlotReelHUD (`T5A.5`)
 * 1:1 port of `widget-boost-number` (`boost-number.html` + `boost-number.ts`).
 * Uses 3 independent vertical digit reels (`0..9`) driven by `translate3d(0, -digit * 10%, 0)`
 * directly on DOM refs so 120Hz numeric updates trigger 0 layout reflows and 0 React re-renders.
 */
export const DigitSlotReelHUD = React.memo(
  forwardRef<DigitSlotReelHandle, DigitSlotReelHUDProps>(
    (
      {
        value = 74,
        subscribeBoost,
        hideLeadingZeros = true,
        isLight = false,
        className = '',
      },
      ref
    ) => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      const colHundRef = useRef<HTMLDivElement | null>(null);
      const colTensRef = useRef<HTMLDivElement | null>(null);
      const colOnesRef = useRef<HTMLDivElement | null>(null);
      const stripHundRef = useRef<HTMLDivElement | null>(null);
      const stripTensRef = useRef<HTMLDivElement | null>(null);
      const stripOnesRef = useRef<HTMLDivElement | null>(null);

      const applyValueToDom = useCallback(
        (rawVal: number) => {
          const clamped = Math.max(0, Math.min(999, Math.round(rawVal)));
          const dHund = Math.floor(clamped / 100);
          const dTens = Math.floor((clamped % 100) / 10);
          const dOnes = clamped % 10;

          if (stripHundRef.current) {
            stripHundRef.current.style.transform = `translate3d(0, -${dHund * 10}%, 0)`;
          }
          if (stripTensRef.current) {
            stripTensRef.current.style.transform = `translate3d(0, -${dTens * 10}%, 0)`;
          }
          if (stripOnesRef.current) {
            stripOnesRef.current.style.transform = `translate3d(0, -${dOnes * 10}%, 0)`;
          }

          if (colHundRef.current) {
            colHundRef.current.style.display =
              hideLeadingZeros && clamped < 100 ? 'none' : 'block';
          }
          if (colTensRef.current) {
            colTensRef.current.style.display =
              hideLeadingZeros && clamped < 10 ? 'none' : 'block';
          }

          if (containerRef.current) {
            const activeColor = getSlotTierColor(clamped, isLight);
            containerRef.current.style.color = activeColor;
            containerRef.current.style.webkitTextStroke = isLight
              ? '1px rgba(15, 23, 42, 0.22)'
              : '1px rgba(0, 0, 0, 0.75)';
          }
        },
        [hideLeadingZeros, isLight]
      );

      useImperativeHandle(
        ref,
        () => ({
          setValue: applyValueToDom,
        }),
        [applyValueToDom]
      );

      useEffect(() => {
        applyValueToDom(value);
      }, [value, applyValueToDom]);

      useEffect(() => {
        if (!subscribeBoost) return;
        return subscribeBoost((boostVal) => {
          applyValueToDom(boostVal);
        });
      }, [subscribeBoost, applyValueToDom]);

      const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      return (
        <div
          ref={containerRef}
          data-ui-element="hud-digit-slot-reel"
          className={`inline-flex items-center justify-center font-black italic text-5xl tracking-tight select-none pointer-events-none px-4 py-2 rounded-2xl border ${
            isLight
              ? 'bg-white/90 border-neutral-200 shadow-md'
              : 'bg-neutral-950/80 border-neutral-800 shadow-xl'
          } ${className}`}
          style={{
            fontFamily: "'Chakra Petch', var(--font-jetbrains), sans-serif",
            color: getSlotTierColor(value, isLight),
          }}
        >
          {/* Hundreds Reel */}
          <div
            ref={colHundRef}
            className="h-[52px] overflow-hidden"
            style={{ display: hideLeadingZeros && value < 100 ? 'none' : 'block' }}
          >
            <div
              ref={stripHundRef}
              className="flex flex-col transition-transform duration-150 ease-out will-change-transform"
            >
              {digits.map((n) => (
                <span key={n} className="h-[52px] leading-[52px] block text-center">
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* Tens Reel */}
          <div
            ref={colTensRef}
            className="h-[52px] overflow-hidden"
            style={{ display: hideLeadingZeros && value < 10 ? 'none' : 'block' }}
          >
            <div
              ref={stripTensRef}
              className="flex flex-col transition-transform duration-150 ease-out will-change-transform"
            >
              {digits.map((n) => (
                <span key={n} className="h-[52px] leading-[52px] block text-center">
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* Ones Reel */}
          <div ref={colOnesRef} className="h-[52px] overflow-hidden">
            <div
              ref={stripOnesRef}
              className="flex flex-col transition-transform duration-150 ease-out will-change-transform"
            >
              {digits.map((n) => (
                <span key={n} className="h-[52px] leading-[52px] block text-center">
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }
  )
);

DigitSlotReelHUD.displayName = 'DigitSlotReelHUD';
