import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { BoostTransientListener } from './types';
import { useBoostGaugeStore } from '../stores/boostGaugeStore';

export type BoostColorScheme = 'classic-4' | 'step-12';
export type BoostColorMode = 'standard' | 'inverted' | 'ring-only';
export type BoostThemeOverride = 'auto' | 'dark' | 'light';

export interface BoostSegmentColorInfo {
  color: string;
  segmentName:
    | 'black'
    | 'red-flash'
    | 'red'
    | 'orange'
    | 'yellow'
    | 'lime'
    | 'green'
    | 'emerald'
    | 'sky';
  rangeLabel: string;
  isFlashing: boolean;
  tierIndex: number;
}

export interface CircularBoostGaugeHandle {
  /** Imperatively update boost amount (0~100) and unlimited state at 120Hz+ with zero React re-renders */
  setBoost: (amount: number, isUnlimited?: boolean) => void;
}

export interface CircularBoostGaugeProps {
  /**  (0 ~ 100)/ Props  */
  amount?: number;
  /**  '--'  100% */
  isUnlimited?: boolean;
  /**  120Hz  SVG/DOM Ref0 React VDOM  */
  subscribeBoost?: (listener: BoostTransientListener) => () => void;
  /**  ( px 148) */
  size?: number;
  /**  themeOverride  'auto'  darkModeOverride  */
  isLight?: boolean;
  /**
   * Dark Mode Override: 
   * - true: 
   * - false / undefined:  themeOverride  isLight 
   */
  darkModeOverride?: boolean;
  /** 'auto' ( isLight) | 'dark' () | 'light' () */
  themeOverride?: BoostThemeOverride;
  /**
   *  (0 ~ 99 72%)
   *  50  50% 60  60% 
   */
  ringInnerPct?: number;
  /**
   *  (1 ~ 100 84%)
   *  55  55%  100 
   */
  ringOuterPct?: number;
  /** 'round' () | 'butt' () */
  lineCap?: 'round' | 'butt';
  /**
   *  (0° ~ 359° 90°  270° )
   * - 0°:  360° 
   * - 90°:  90° (270° )
   * - 120°:  (240° )
   * - 180°:  (180° )
   * 
   */
  cutoutAngleDeg?: number;
  /**
   *  /  ( ° 0° )
   * - 0°:  (Bottom)
   * - -45° ( 315°):  (Bottom-Right)
   * - -90° ( 270°):  (Right)
   * - 45°:  (Bottom-Left)
   * - 90°:  (Left)
   * - 180°:  (Top)
   * 
   */
  rotationDeg?: number;
  /**
   * 
   * - 'classic-4':  (0-24, 25-60, 61-96, 97-100)
   * - 'step-12':  12 Boost  (0-11, 12-23, 24-35, 36-47, 48-59, 60-71, 72-83, 84-96Emerald, 97-100)
   */
  colorScheme?: BoostColorScheme;
  /**
   * 
   * - 'standard':  Boost 
   * - 'inverted':  ——  Boost 
   * - 'ring-only':  Boost 
   */
  colorMode?: BoostColorMode;
  /**  colorMode  'inverted'  'ring-only'  ( '#FFFFFF') */
  fixedTextColor?: string;
  /**  className */
  className?: string;
}

/**
 * 
 * 1. `'classic-4'` ():
 *    - 0  ~ 24   (#ef4444)
 *    - 25 ~ 60   (#f59e0b)
 *    - 61 ~ 96   (#10b981)
 *    - 97 ~ 100  (#0ea5e9)
 * 2. `'step-12'` ( 12 Boost  ·  T5A.4 DualLayerBoostPie  9 ):
 *    - 0  ~ 11  (<12)   (#18181b)
 *    - 12 ~ 23  (<24)   (#ef4444, isFlashing: true)
 *    - 24 ~ 35  (<36)   (#ef4444)
 *    - 36 ~ 47  (<48)   (#f97316)
 *    - 48 ~ 59  (<60)   (#eab308)
 *    - 60 ~ 71  (<72)   (#84cc16)
 *    - 72 ~ 83  (<84)   (#22c55e)
 *    - 84 ~ 96  (<=96) : Emerald (#10b981)
 *    - 97 ~ 100 (>96)   (#0ea5e9)
 */
const STEP_12_TIERS: (BoostSegmentColorInfo & { maxVal: number })[] = [
  { maxVal: 11, color: '#18181b', segmentName: 'black', rangeLabel: '0-11 (Empty · Black)', isFlashing: false, tierIndex: 0 },
  { maxVal: 23, color: '#ef4444', segmentName: 'red-flash', rangeLabel: '12-23 (Critical · Red Flash)', isFlashing: true, tierIndex: 1 },
  { maxVal: 35, color: '#ef4444', segmentName: 'red', rangeLabel: '24-35 (Low · Red)', isFlashing: false, tierIndex: 2 },
  { maxVal: 47, color: '#f97316', segmentName: 'orange', rangeLabel: '36-47 (Low-Mid · Orange)', isFlashing: false, tierIndex: 3 },
  { maxVal: 59, color: '#eab308', segmentName: 'yellow', rangeLabel: '48-59 (Medium · Yellow)', isFlashing: false, tierIndex: 4 },
  { maxVal: 71, color: '#84cc16', segmentName: 'lime', rangeLabel: '60-71 (Good · Lime)', isFlashing: false, tierIndex: 5 },
  { maxVal: 83, color: '#22c55e', segmentName: 'green', rangeLabel: '72-83 (High · Green)', isFlashing: false, tierIndex: 6 },
  { maxVal: 96, color: '#10b981', segmentName: 'emerald', rangeLabel: '84-96 (Near Full · Emerald)', isFlashing: false, tierIndex: 7 },
  { maxVal: 100, color: '#0ea5e9', segmentName: 'sky', rangeLabel: '97-100 (Full · Sky)', isFlashing: false, tierIndex: 8 },
];

const CLASSIC_4_TIERS: (BoostSegmentColorInfo & { maxVal: number })[] = [
  { maxVal: 24, color: '#ef4444', segmentName: 'red', rangeLabel: '0-24 (Critical · Red)', isFlashing: false, tierIndex: 0 },
  { maxVal: 60, color: '#f59e0b', segmentName: 'yellow', rangeLabel: '25-60 (Caution · Yellow)', isFlashing: false, tierIndex: 1 },
  { maxVal: 96, color: '#10b981', segmentName: 'green', rangeLabel: '61-96 (Sufficient · Green)', isFlashing: false, tierIndex: 2 },
  { maxVal: 100, color: '#0ea5e9', segmentName: 'sky', rangeLabel: '97-100 (Full · Sky)', isFlashing: false, tierIndex: 3 },
];

export const getBoostSegmentColor = (
  amount: number,
  colorScheme: BoostColorScheme = 'classic-4'
): BoostSegmentColorInfo => {
  const val = Math.max(0, Math.min(100, Math.round(amount)));
  const table = colorScheme === 'step-12' ? STEP_12_TIERS : CLASSIC_4_TIERS;
  const found = table.find((t) => val <= t.maxVal) ?? table[table.length - 1];
  const { maxVal: _m, ...info } = found;
  return info;
};

export const STEP_12_TIER_PRESETS: {
  val: number;
  range: string;
  label: string;
  hex: string;
  isFlashing?: boolean;
}[] = [
  { val: 6, range: '0~11', label: 'Black (Tier 0)', hex: '#18181b' },
  { val: 18, range: '12~23', label: 'Red Flash (Tier 1)', hex: '#ef4444', isFlashing: true },
  { val: 30, range: '24~35', label: 'Red (Tier 2)', hex: '#ef4444' },
  { val: 42, range: '36~47', label: 'Orange (Tier 3)', hex: '#f97316' },
  { val: 54, range: '48~59', label: 'Yellow (Tier 4)', hex: '#eab308' },
  { val: 66, range: '60~71', label: 'Lime (Tier 5)', hex: '#84cc16' },
  { val: 78, range: '72~83', label: 'Green (Tier 6)', hex: '#22c55e' },
  { val: 90, range: '84~96', label: 'Emerald (Tier 7)', hex: '#10b981' },
  { val: 100, range: '97~100', label: 'Sky Blue (Full)', hex: '#0ea5e9' },
];

/**
 *  SF Mono JetBrains Mono
 */
const MONO_FONT_FAMILY =
  "'SF Mono', 'JetBrains Mono', ui-monospace, Menlo, Monaco, Consolas, monospace";

// SVG viewBox="0 0 136 136" (68, 68) R_DISC = 68 ( 100% )
const DISC_CENTER = 68;
const DISC_MAX_RADIUS = 68;

/**
 * CircularBoostGauge (`5A.5`)
 *  120Hz  Props 
 * -  (`ringInnerPct`)  (`ringOuterPct`)  60%~100% 
 * -  (`colorMode = 'inverted'`) Boost 
 * -  Dark Mode Override (`darkModeOverride` / `themeOverride`)
 * -  (`cutoutAngleDeg`: 0°~359°)  (`rotationDeg`: //)
 * -  (`classic-4`)  12 + (`step-12`)
 */
export const CircularBoostGauge = React.memo(
  forwardRef<CircularBoostGaugeHandle, CircularBoostGaugeProps>(
    (
      {
        amount = 100,
        isUnlimited = false,
        subscribeBoost,
        size: propSize,
        isLight = false,
        darkModeOverride,
        themeOverride: propThemeOverride,
        ringInnerPct: propRingInnerPct,
        ringOuterPct: propRingOuterPct,
        lineCap: propLineCap,
        cutoutAngleDeg: propCutoutAngleDeg,
        rotationDeg: propRotationDeg,
        colorScheme: propColorScheme,
        colorMode: propColorMode,
        fixedTextColor: propFixedTextColor,
        className = '',
      },
      ref
    ) => {
      const storeTokens = useBoostGaugeStore();

      const size = propSize ?? storeTokens.size;
      const themeOverride = propThemeOverride ?? storeTokens.themeOverride;
      const ringInnerPct = propRingInnerPct ?? storeTokens.ringInnerPct;
      const ringOuterPct = propRingOuterPct ?? storeTokens.ringOuterPct;
      const lineCap = propLineCap ?? storeTokens.lineCap;
      const cutoutAngleDeg = propCutoutAngleDeg ?? storeTokens.cutoutAngleDeg;
      const rotationDeg = propRotationDeg ?? storeTokens.rotationDeg;
      const colorScheme = propColorScheme ?? storeTokens.colorScheme;
      const colorMode = propColorMode ?? storeTokens.colorMode;
      const fixedTextColor = propFixedTextColor ?? storeTokens.fixedTextColor;

      const dialPlateRef = useRef<HTMLDivElement | null>(null);
      const innerDiscRef = useRef<SVGCircleElement | null>(null);
      const trackCircleRef = useRef<SVGCircleElement | null>(null);
      const arcCircleRef = useRef<SVGCircleElement | null>(null);
      const readoutSpanRef = useRef<HTMLSpanElement | null>(null);
      const labelSpanRef = useRef<HTMLSpanElement | null>(null);
      const lastBoostRef = useRef<{ amount: number; unlimited: boolean }>({
        amount,
        unlimited: isUnlimited,
      });

      // Resolve effective light/dark mode with Dark Mode Override support
      const effectiveIsLight =
        darkModeOverride === true
          ? false
          : themeOverride === 'dark'
          ? false
          : themeOverride === 'light'
          ? true
          : isLight;

      // Compute radial geometry from [ringInnerPct, ringOuterPct] relative to DISC_MAX_RADIUS (68)
      const safeInnerPct = Math.max(0, Math.min(99, Number.isFinite(ringInnerPct) ? ringInnerPct : 60));
      const safeOuterPct = Math.max(
        safeInnerPct + 1,
        Math.min(100, Number.isFinite(ringOuterPct) ? ringOuterPct : 98)
      );
      const innerR = (safeInnerPct / 100) * DISC_MAX_RADIUS;
      const outerR = (safeOuterPct / 100) * DISC_MAX_RADIUS;
      const radius = (innerR + outerR) / 2;
      const strokeWidth = Math.max(0.5, outerR - innerR);
      const circumference = 2 * Math.PI * radius;

      // Compute arc sweep & cutout angle (0° = full circle, 90° = 270° arc, 180° = semicircle)
      const safeCutoutDeg = Math.max(
        0,
        Math.min(359.5, Number.isFinite(cutoutAngleDeg) ? cutoutAngleDeg : 90)
      );
      const sweepAngleDeg = 360 - safeCutoutDeg;
      const arcTotal = (sweepAngleDeg / 360) * circumference;

      // Center the cutout opening on `rotationDeg` (0° = Bottom 6 o'clock, -45° = Bottom-Right, -90° = Right)
      const safeRotationDeg = Number.isFinite(rotationDeg) ? rotationDeg : -45;
      const svgRotateDeg = 90 + safeRotationDeg + safeCutoutDeg / 2;

      // Respect user-selected lineCap ('round' vs 'butt') whenever cutoutAngleDeg > 1°
      const effectiveLineCap: 'round' | 'butt' =
        safeCutoutDeg <= 1 ? 'butt' : lineCap;

      const resolveVisualColors = useCallback(
        (seg: BoostSegmentColorInfo) => {
          // On a dark dial, pure #18181b black needs a readable charcoal tone so 0..11 is visible
          const tierColorForStrokeOrText =
            !effectiveIsLight && seg.segmentName === 'black' ? '#52525b' : seg.color;

          if (colorMode === 'inverted') {
            // Inverted mode:
            // - Inner dial plate (0 .. innerR) is filled with tier color
            // - Active ring portion (0 .. amount%) is filled with tier color
            // - Empty ring portion (100 - amount)% and cutout angle are 100% transparent (carved away!)
            // - Center readout stays fixedTextColor
            const isLightFixedText =
              fixedTextColor.toUpperCase() === '#FFFFFF' ||
              fixedTextColor.toUpperCase() === '#F8FAFC' ||
              fixedTextColor.toUpperCase() === '#FDE047';
            return {
              dialBg: 'transparent',
              dialBorder: 'transparent',
              innerDiscFill: seg.color,
              innerDiscStroke: isLightFixedText
                ? 'rgba(0, 0, 0, 0.28)'
                : 'rgba(255, 255, 255, 0.28)',
              trackStroke: 'transparent',
              arcStroke: seg.color,
              readoutColor: fixedTextColor,
              labelColor: isLightFixedText ? 'rgba(255, 255, 255, 0.82)' : 'rgba(9, 9, 11, 0.75)',
              flashDial: seg.isFlashing,
              flashArcAndText: seg.isFlashing,
            };
          }

          const stdDialBg = effectiveIsLight
            ? 'rgba(255, 255, 255, 0.92)'
            : 'rgba(9, 9, 11, 0.88)';
          const stdDialBorder = effectiveIsLight
            ? 'rgba(212, 212, 216, 0.85)'
            : 'rgba(39, 39, 42, 0.85)';
          const stdTrackStroke = effectiveIsLight ? '#e5e5e5' : '#262626';
          const stdLabelColor = effectiveIsLight ? '#737373' : '#a3a3a3';

          if (colorMode === 'ring-only') {
            return {
              dialBg: stdDialBg,
              dialBorder: stdDialBorder,
              innerDiscFill: 'transparent',
              innerDiscStroke: 'transparent',
              trackStroke: stdTrackStroke,
              arcStroke: tierColorForStrokeOrText,
              readoutColor:
                fixedTextColor || (effectiveIsLight ? '#09090B' : '#FFFFFF'),
              labelColor: stdLabelColor,
              flashDial: false,
              flashArcAndText: seg.isFlashing,
            };
          }

          // 'standard' mode
          return {
            dialBg: stdDialBg,
            dialBorder: stdDialBorder,
            innerDiscFill: 'transparent',
            innerDiscStroke: 'transparent',
            trackStroke: stdTrackStroke,
            arcStroke: tierColorForStrokeOrText,
            readoutColor: tierColorForStrokeOrText,
            labelColor: stdLabelColor,
            flashDial: false,
            flashArcAndText: seg.isFlashing,
          };
        },
        [colorMode, effectiveIsLight, fixedTextColor]
      );

      const applyBoostToDom = useCallback(
        (rawAmount: number, unlimited = false) => {
          lastBoostRef.current = { amount: rawAmount, unlimited };
          const clamped = Math.max(0, Math.min(100, Math.round(rawAmount)));
          const effective = unlimited ? 100 : clamped;
          const seg = getBoostSegmentColor(effective, colorScheme);
          const activeArcLen = (effective / 100) * arcTotal;
          const colors = resolveVisualColors(seg);

          if (dialPlateRef.current) {
            dialPlateRef.current.style.backgroundColor = colors.dialBg;
            dialPlateRef.current.style.borderColor = colors.dialBorder;
            dialPlateRef.current.style.animation = colors.flashDial
              ? 'hudBoostRedFlash 0.38s ease-in-out infinite alternate'
              : 'none';
          }
          if (innerDiscRef.current) {
            innerDiscRef.current.setAttribute('fill', colors.innerDiscFill);
            innerDiscRef.current.setAttribute('stroke', colors.innerDiscStroke);
          }
          if (trackCircleRef.current) {
            trackCircleRef.current.setAttribute('stroke', colors.trackStroke);
          }
          if (arcCircleRef.current) {
            arcCircleRef.current.setAttribute('stroke-dasharray', `${activeArcLen} ${circumference}`);
            arcCircleRef.current.style.strokeDashoffset = '0';
            arcCircleRef.current.style.opacity = effective <= 0 ? '0' : '1';
            arcCircleRef.current.setAttribute('stroke', colors.arcStroke);
            arcCircleRef.current.style.animation = colors.flashArcAndText
              ? 'hudBoostRedFlash 0.38s ease-in-out infinite alternate'
              : 'none';
          }
          if (readoutSpanRef.current) {
            readoutSpanRef.current.textContent = unlimited ? '--' : String(clamped);
            readoutSpanRef.current.style.color = colors.readoutColor;
            readoutSpanRef.current.style.animation =
              colorMode === 'standard' && colors.flashArcAndText
                ? 'hudBoostRedFlash 0.38s ease-in-out infinite alternate'
                : 'none';
          }
          if (labelSpanRef.current) {
            labelSpanRef.current.style.color = colors.labelColor;
          }
        },
        [arcTotal, circumference, colorMode, colorScheme, resolveVisualColors]
      );

      useImperativeHandle(
        ref,
        () => ({
          setBoost: (val: number, unlim = isUnlimited) => applyBoostToDom(val, unlim),
        }),
        [applyBoostToDom, isUnlimited]
      );

      // Sync when declarative props or geometry/color settings change
      useEffect(() => {
        applyBoostToDom(lastBoostRef.current.amount ?? amount, lastBoostRef.current.unlimited ?? isUnlimited);
      }, [amount, isUnlimited, applyBoostToDom]);

      // Also sync when amount/isUnlimited props change explicitly
      useEffect(() => {
        applyBoostToDom(amount, isUnlimited);
      }, [amount, isUnlimited, applyBoostToDom]);

      // Subscribe to 120Hz transient channel if provided (0 React re-renders)
      useEffect(() => {
        if (!subscribeBoost) return;
        return subscribeBoost(applyBoostToDom);
      }, [subscribeBoost, applyBoostToDom]);

      const clampedAmount = Math.max(0, Math.min(100, Math.round(amount)));
      const effectiveAmount = isUnlimited ? 100 : clampedAmount;
      const initialSeg = getBoostSegmentColor(effectiveAmount, colorScheme);
      const initialColors = resolveVisualColors(initialSeg);
      const initialActiveArcLen = (effectiveAmount / 100) * arcTotal;

      return (
        <div
          data-ui-element="hud-circular-boost-gauge"
          className={`relative select-none pointer-events-auto flex items-center justify-center ${className}`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            fontFamily: MONO_FONT_FAMILY,
          }}
        >
          <style>{`
            @keyframes hudBoostRedFlash {
              0% { opacity: 1; }
              100% { opacity: 0.28; }
            }
          `}</style>
          <div
            ref={dialPlateRef}
            className={`relative w-full h-full flex flex-col items-center justify-center rounded-full overflow-hidden transition-colors ${
              colorMode === 'inverted' || safeOuterPct >= 99.5 ? 'border-0' : 'border'
            } ${
              colorMode === 'inverted'
                ? 'drop-shadow-md'
                : effectiveIsLight
                ? 'shadow-md'
                : 'shadow-lg'
            }`}
            style={{
              backgroundColor: initialColors.dialBg,
              borderColor: initialColors.dialBorder,
            }}
          >
            {/* SVG  0..100%  */}
            <svg
              className="w-full h-full"
              viewBox="0 0 136 136"
              style={{
                transform: `rotate(${svgRotateDeg}deg)`,
              }}
            >
              {/*  (0 .. innerR) (100 - amount)%  */}
              <circle
                ref={innerDiscRef}
                cx={DISC_CENTER}
                cy={DISC_CENTER}
                r={Math.max(0, innerR)}
                fill={initialColors.innerDiscFill}
                stroke={initialColors.innerDiscStroke}
                strokeWidth={colorMode === 'inverted' && innerR > 0 ? 1.25 : 0}
              />

              {/*  ( transparent) */}
              <circle
                ref={trackCircleRef}
                cx={DISC_CENTER}
                cy={DISC_CENTER}
                r={radius}
                stroke={initialColors.trackStroke}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${arcTotal} ${circumference}`}
                strokeLinecap={effectiveLineCap}
              />

              {/* 0ms  */}
              <circle
                ref={arcCircleRef}
                cx={DISC_CENTER}
                cy={DISC_CENTER}
                r={radius}
                stroke={initialColors.arcStroke}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${initialActiveArcLen} ${circumference}`}
                strokeDashoffset={0}
                strokeLinecap={effectiveLineCap}
                style={{
                  opacity: effectiveAmount <= 0 ? 0 : 1,
                  transition: 'stroke 80ms ease',
                }}
              />
            </svg>

            {/*  BOOST  */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              style={{ fontFamily: MONO_FONT_FAMILY }}
            >
              <span
                ref={readoutSpanRef}
                className="text-4xl font-black tracking-tighter tabular-nums transition-colors leading-none"
                style={{
                  color: initialColors.readoutColor,
                  fontFamily: MONO_FONT_FAMILY,
                  WebkitTextStroke:
                    colorMode === 'inverted' ? '1px rgba(0,0,0,0.35)' : undefined,
                }}
              >
                {isUnlimited ? '--' : clampedAmount}
              </span>

              <span
                ref={labelSpanRef}
                className="text-[10px] font-bold tracking-widest uppercase mt-1"
                style={{
                  color: initialColors.labelColor,
                  fontFamily: MONO_FONT_FAMILY,
                }}
              >
                BOOST
              </span>
            </div>
          </div>
        </div>
      );
    }
  )
);

CircularBoostGauge.displayName = 'CircularBoostGauge';

