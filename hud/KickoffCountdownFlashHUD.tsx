import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  CountdownFlashTransientState,
  CountdownFlashTransientListener,
} from './types';

export interface KickoffCountdownFlashHandle {
  /** Imperatively push countdown flash value (`4 | 3 | 2 | 1 | 0 | null`) with 0 React re-renders */
  setCountdownFlash: (state: CountdownFlashTransientState) => void;
}

export interface KickoffCountdownFlashHUDProps {
  /** Active countdown value (`4`, `3`, `2`, `1`, `0` = GO!, or `null` = hidden) */
  value?: 4 | 3 | 2 | 1 | 0 | null;
  /** Optional transient channel subscription (0 React VDOM re-renders) */
  subscribeCountdownFlash?: (listener: CountdownFlashTransientListener) => () => void;
  /** Light/Dark theme adaptive styling */
  isLight?: boolean;
  className?: string;
}

function getCountdownMeta(
  val: 4 | 3 | 2 | 1 | 0 | null,
  isLight: boolean
): { text: string; color: string; stroke: string; glow: string } {
  if (val === null) {
    return { text: '', color: 'transparent', stroke: 'transparent', glow: 'none' };
  }
  if (val === 0) {
    return {
      text: 'GO!',
      color: isLight ? '#16a34a' : '#22c55e',
      stroke: isLight ? '#052e16' : '#ffffff',
      glow: '0 0 28px rgba(34, 197, 94, 0.75)',
    };
  }
  if (val === 1) {
    return {
      text: '1',
      color: '#ef4444',
      stroke: isLight ? '#450a0a' : '#ffffff',
      glow: '0 0 26px rgba(239, 68, 68, 0.75)',
    };
  }
  if (val === 2) {
    return {
      text: '2',
      color: '#f97316',
      stroke: isLight ? '#431407' : '#ffffff',
      glow: '0 0 24px rgba(249, 115, 22, 0.75)',
    };
  }
  if (val === 3) {
    return {
      text: '3',
      color: isLight ? '#d97706' : '#eab308',
      stroke: isLight ? '#422006' : '#ffffff',
      glow: '0 0 24px rgba(234, 179, 8, 0.75)',
    };
  }
  return {
    text: '4',
    color: isLight ? '#0f172a' : '#ffffff',
    stroke: isLight ? '#334155' : '#0f172a',
    glow: isLight
      ? '0 4px 16px rgba(15, 23, 42, 0.35)'
      : '0 0 22px rgba(255, 255, 255, 0.75)',
  };
}

/**
 * KickoffCountdownFlashHUD (`T5A.6`)
 * 1:1 port of `widget-countdown` (`countdown.html` + `countdown.ts`).
 * Features dual-layer stroke + fill typography with `4 -> 3 -> 2 -> 1 -> GO!` scale-pop flash,
 * driven either declaratively or via `subscribeCountdownFlash` with 0 React re-renders.
 */
export const KickoffCountdownFlashHUD = React.memo(
  forwardRef<KickoffCountdownFlashHandle, KickoffCountdownFlashHUDProps>(
    ({ value = 3, subscribeCountdownFlash, isLight = false, className = '' }, ref) => {
      const textRef = useRef<HTMLDivElement | null>(null);

      const applyFlashToDom = useCallback(
        (val: 4 | 3 | 2 | 1 | 0 | null) => {
          const el = textRef.current;
          if (!el) return;
          if (val === null) {
            el.style.opacity = '0';
            el.style.transform = 'scale(0.75)';
            return;
          }
          const meta = getCountdownMeta(val, isLight);
          el.textContent = meta.text;
          el.style.color = meta.color;
          el.style.webkitTextStroke = `2px ${meta.stroke}`;
          el.style.opacity = '1';

          // Trigger crisp GPU scale pop without React re-render
          el.animate(
            [
              { transform: 'scale(1.38)', opacity: 0.35 },
              { transform: 'scale(1.0)', opacity: 1 },
            ],
            {
              duration: 220,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }
          );
        },
        [isLight]
      );

      useImperativeHandle(
        ref,
        () => ({
          setCountdownFlash: (st: CountdownFlashTransientState) => {
            applyFlashToDom(st.value);
          },
        }),
        [applyFlashToDom]
      );

      useEffect(() => {
        applyFlashToDom(value);
      }, [value, applyFlashToDom]);

      useEffect(() => {
        if (!subscribeCountdownFlash) return;
        return subscribeCountdownFlash((st) => {
          applyFlashToDom(st.value);
        });
      }, [subscribeCountdownFlash, applyFlashToDom]);

      const initialMeta = getCountdownMeta(value, isLight);

      return (
        <div
          data-ui-element="hud-kickoff-countdown-flash"
          className={`relative inline-flex items-center justify-center min-w-[160px] min-h-[104px] px-6 py-3 rounded-2xl border select-none pointer-events-none ${
            isLight
              ? 'bg-white/95 border-neutral-300 shadow-md'
              : 'bg-neutral-950/92 border-neutral-800 shadow-lg'
          } ${className}`}
        >
          <div
            ref={textRef}
            className="text-7xl font-black italic tracking-wider transition-all duration-150 will-change-transform"
            style={{
              fontFamily: "'Chakra Petch', var(--font-jetbrains), sans-serif",
              color: initialMeta.color,
              WebkitTextStroke: `2px ${initialMeta.stroke}`,
            }}
          >
            {initialMeta.text}
          </div>
        </div>
      );
    }
  )
);

KickoffCountdownFlashHUD.displayName = 'KickoffCountdownFlashHUD';
