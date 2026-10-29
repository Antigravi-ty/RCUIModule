import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { SpeedTransientListener } from './types';

export interface VelocityProgressBarHandle {
  /** Imperatively update velocity (0 ~ 2300 uu/s) at 120Hz+ with zero React re-renders */
  setSpeed: (speed: number) => void;
}

export interface VelocityProgressBarProps {
  /**  (0 ~ 2300 Unreal Units/s)/ Props  */
  speed?: number;
  /**  120Hz  DOM Ref0 React VDOM  */
  subscribeSpeed?: (listener: SpeedTransientListener) => () => void;
  /**  (CSS  100%) */
  width?: string | number;
  /**  ( 20px) */
  height?: string | number;
  /**  className */
  className?: string;
}

//  HEX  (#ffffff)  RGB 
const hexToRgb = (hex: string): [number, number, number] => {
  const bigint = parseInt(hex.replace('#', ''), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

/**
 * 
 * -  (<= 1410) #d4af37 ()
 * -  (1410 ~ 2200) #77ca7a  #59f168 ()
 * -  (>= 2200)#a020f0 ( + )
 */
export const getVelocityBarColor = (v: number): {
  color: string;
  isSupersonic: boolean;
  percent: number;
} => {
  const speed = Math.max(0, Math.min(2300, Math.round(v)));

  let percent = 0;
  if (speed <= 1410) {
    percent = (speed / 1410) * 40;
  } else if (speed <= 2200) {
    percent = 40 + ((speed - 1410) / (2200 - 1410)) * 45;
  } else {
    percent = 85 + ((speed - 2200) / (2300 - 2200)) * 15;
  }
  percent = Math.min(100, Math.max(0, percent));

  if (speed >= 2200) {
    return { color: '#a020f0', isSupersonic: true, percent };
  }

  if (speed <= 1410) {
    return { color: '#d4af37', isSupersonic: false, percent };
  }

  // 1410 ~ 2200 
  const ratio = (speed - 1410) / (2200 - 1410);
  const rgbStart = hexToRgb('#77ca7a');
  const rgbEnd = hexToRgb('#59f168');
  const r = Math.round(rgbStart[0] + (rgbEnd[0] - rgbStart[0]) * ratio);
  const g = Math.round(rgbStart[1] + (rgbEnd[1] - rgbStart[1]) * ratio);
  const b = Math.round(rgbStart[2] + (rgbEnd[2] - rgbStart[2]) * ratio);
  return { color: `rgb(${r}, ${g}, ${b})`, isSupersonic: false, percent };
};

/**
 * VelocityProgressBar
 *  120Hz  Props 
 * 1.  85% 
 * 2.  ()
 * 3.  ( ->  -> )
 */
export const VelocityProgressBar = React.memo(
  forwardRef<VelocityProgressBarHandle, VelocityProgressBarProps>(
    ({ speed = 0, subscribeSpeed, width = '100%', height = 20, className = '' }, ref) => {
  const fillRef = useRef<HTMLDivElement | null>(null);
  const initial = getVelocityBarColor(speed);

  const applySpeedToDom = useCallback((rawSpeed: number) => {
    const el = fillRef.current;
    if (!el) return;
    const { color, isSupersonic, percent } = getVelocityBarColor(rawSpeed);
    el.style.width = `${percent}%`;
    el.style.backgroundColor = color;
    el.classList.toggle('supersonic-heartbeat', isSupersonic);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      setSpeed: applySpeedToDom,
    }),
    [applySpeedToDom]
  );

  // Sync when declarative `speed` prop changes
  useEffect(() => {
    applySpeedToDom(speed);
  }, [speed, applySpeedToDom]);

  // Subscribe to 120Hz transient channel if provided (0 React re-renders)
  useEffect(() => {
    if (!subscribeSpeed) return;
    return subscribeSpeed(applySpeedToDom);
  }, [subscribeSpeed, applySpeedToDom]);

  const resolvedWidth = typeof width === 'number' ? `${width}px` : width;
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      data-ui-element="hud-velocity-progress-bar"
      className={`relative select-none pointer-events-auto overflow-hidden bg-[#333333]/80 ${className}`}
      style={{
        width: resolvedWidth,
        height: resolvedHeight,
        borderRadius: 0,
      }}
    >
      {/* 85%  () */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none z-10"
        style={{
          left: '85%',
          width: '2px',
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
        }}
        title="Supersonic Threshold (2200 uu/s)"
      />

      {/*  CSS  0ms  */}
      <div
        ref={fillRef}
        className={`h-full ${initial.isSupersonic ? 'supersonic-heartbeat' : ''}`}
        style={{
          width: `${initial.percent}%`,
          backgroundColor: initial.color,
          borderRadius: 0,
          transition: 'none',
        }}
      />

      {/*  opacity 0 filter/box-shadow  */}
      <style>{`
        @keyframes supersonicHeartbeat {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.72; }
        }
        .supersonic-heartbeat {
          animation: supersonicHeartbeat 1.2s infinite ease-in-out;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
        }
      `}</style>
      </div>
    );
  })
);

VelocityProgressBar.displayName = 'VelocityProgressBar';
