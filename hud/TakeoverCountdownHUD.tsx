import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useId,
} from 'react';
import {
  CenterUpperGlowConfig,
  CenterUpperTypographyConfig,
  CenterUpperTimingConfig,
  DEFAULT_RL_COUNTDOWN_GLOW,
  buildOuterGlowTextShadow,
  hexToRgba,
} from './CenterUpperInfoHUD';

export type TakeoverCountdownStep = '3' | '2' | '1' | 'complete';

export type TakeoverSignal = 'replacing-in' | 'takeover-complete';

export type TakeoverTeamSide = 'blue' | 'orange';

export interface TakeoverVignetteCurve {
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
}

export interface TakeoverVignetteConfig {
  /** Whether the surrounding 4-edge rounded-rectangle vignette layer is enabled beneath the HUD */
  enabled: boolean;
  /** Vignette tint color (default `#000000`) */
  color: string;
  /** Edge peak intensity / opacity percentage (`0` – `100`, default `50`) */
  intensityPct: number;
  /** Clear center rounded-rectangle distance percentage from screen center (`0` – `95`, default `40`) */
  distancePct: number;
  /** Outer full-density reach percentage (`20` – `140`, default `120`) */
  outerReachPct: number;
  /** Non-linear Cubic-Bezier falloff curve from clear inner boundary (`0`) to outer edge (`1`) */
  curve: TakeoverVignetteCurve;
  /** Fade-in transition duration when entering `replacing-in` in ms (default `280`) */
  fadeInMs: number;
  /** Fade-out transition duration when `3-2-1` completes and HUD returns in ms (default `380`) */
  fadeOutMs: number;
  /** Corner radius of the clear inner rounded-rectangle opening in px (default `36`) */
  cornerRadiusPx?: number;
}

export interface TakeoverLayoutConfig {
  /** Upward vertical offset in px relative to `bottom-center` (default `24`) */
  bottomOffsetPx: number;
}

export interface TakeoverTopLabelStyleConfig {
  /** Whether top label (`Takeover in...`) uses team-specific fill color (Blue vs Orange) */
  useTeamColor?: boolean;
  /** Blue team top label font fill color (default `#2563EB`) */
  blueTeamColor?: string;
  /** Orange team top label font fill color (default `#EA580C`) */
  orangeTeamColor?: string;
  /** Top label stroke color (default `#FFFFFF` white) */
  strokeColor?: string;
  /** Top label stroke width in px (default `0.75`) */
  strokeWidthPx?: number;
  /** Top label outer glow color (default `#FFFFFF` white) */
  glowColor?: string;
  /** Top label tight core glow blur in px (default `6`) */
  innerBlurPx?: number;
  /** Top label outer glow blur in px (default `16`) */
  outerBlurPx?: number;
  /** Top label ambient glow blur in px (default `28`) */
  ambientBlurPx?: number;
  /** Top label glow intensity percentage (`0` – `200`, default `100`) */
  glowIntensityPct?: number;
}

export interface TakeoverGlowConfig extends CenterUpperGlowConfig {
  /** Team-colored + white glowing stroke overrides for the stationary top label (`Takeover in...`) */
  topLabelStyle?: TakeoverTopLabelStyleConfig;
}

export interface TakeoverHudPayload {
  /** Top static label rendered in `JetBrains Mono Regular` (`400`) — e.g. `'Takeover in...'` */
  topText: string;
  /** Bottom countdown text rendered in `JetBrains Mono Thin` (`100`) — e.g. `'3'`, `'2'`, `'1'` */
  mainText: string;
  /** Optional secondary sub-caption below countdown */
  subText?: string;
  /** Active player team side (`'blue'` | `'orange'`) for team-colored top label */
  teamSide?: TakeoverTeamSide;
  /** Active glow configuration override */
  glow?: Partial<TakeoverGlowConfig>;
  /** Active typography configuration override */
  typography?: Partial<CenterUpperTypographyConfig>;
  /** Active timing configuration override */
  timing?: Partial<CenterUpperTimingConfig>;
  /** Unique trigger key so consecutive steps re-trigger the bottom-only scale pop */
  triggerKey?: number | string;
}

export interface TakeoverCountdownHandle {
  /** Imperatively trigger a countdown step with bottom-only scale pop and static top label */
  triggerTakeoverStep: (payload: TakeoverHudPayload | null) => void;
}

export interface TakeoverCountdownHUDProps {
  /** Active takeover payload (`null` = hidden) */
  payload?: TakeoverHudPayload | null;
  /** Active team side (`'blue'` | `'orange'`, default `'blue'`) */
  teamSide?: TakeoverTeamSide;
  /** Glow configuration (shared with 5E `CenterUpperGlowConfig` + `topLabelStyle`) */
  glowConfig?: TakeoverGlowConfig;
  /** Typography configuration (`uppercase: false` by default for Takeover) */
  typographyConfig?: CenterUpperTypographyConfig;
  /** Timing configuration (scale pop applies strictly to `mainText`, leaving `topText` stationary) */
  timingConfig?: CenterUpperTimingConfig;
  /** Callback fired when an individual step's hold + exit window completes */
  onStepExpire?: () => void;
  className?: string;
}

export const DEFAULT_TAKEOVER_TOP_LABEL_STYLE: Required<TakeoverTopLabelStyleConfig> = {
  useTeamColor: true,
  blueTeamColor: '#2563EB',
  orangeTeamColor: '#EA580C',
  strokeColor: '#FFFFFF',
  strokeWidthPx: 0.75,
  glowColor: '#FFFFFF',
  innerBlurPx: 6,
  outerBlurPx: 16,
  ambientBlurPx: 28,
  glowIntensityPct: 100,
};

export const DEFAULT_TAKEOVER_GLOW: TakeoverGlowConfig = {
  ...DEFAULT_RL_COUNTDOWN_GLOW,
  textColor: '#FFE600',
  glowColor: '#F59E0B',
  innerBlurPx: 0,
  outerBlurPx: 28,
  ambientBlurPx: 0,
  intensityPct: 100,
  topLabelColor: '#FFFFFF',
  topLabelGlowColor: '#FFFFFF',
  strokeWidthPx: 0,
  strokeColor: '#FFFBEB',
  backdropBloomPct: 0,
  topLabelStyle: {
    ...DEFAULT_TAKEOVER_TOP_LABEL_STYLE,
  },
};

export const DEFAULT_TAKEOVER_TYPOGRAPHY: CenterUpperTypographyConfig = {
  mainFontSizePx: 56,
  mainFontWeight: 100,
  mainLetterSpacingEm: 0,
  topFontSizePx: 24,
  topFontWeight: 400,
  topLetterSpacingEm: 0,
  lineGapPx: 8,
  uppercase: false,
  italic: false,
};

export const DEFAULT_TAKEOVER_TIMING: CenterUpperTimingConfig = {
  durationMs: 1000,
  entryScale: 1.5,
  entryDurationMs: 380,
  exitDurationMs: 220,
  persistentInspect: false,
};

export const DEFAULT_TAKEOVER_LAYOUT: TakeoverLayoutConfig = {
  bottomOffsetPx: 24,
};

export const DEFAULT_TAKEOVER_VIGNETTE: TakeoverVignetteConfig = {
  enabled: true,
  color: '#000000',
  intensityPct: 50,
  distancePct: 40,
  outerReachPct: 120,
  curve: {
    p1x: 0.28,
    p1y: 0.01,
    p2x: 0,
    p2y: 1.01,
  },
  fadeInMs: 280,
  fadeOutMs: 380,
  cornerRadiusPx: 36,
};

function sampleCubicBezier1D(u: number, p1: number, p2: number): number {
  const inv = 1 - u;
  return 3 * inv * inv * u * p1 + 3 * inv * u * u * p2 + u * u * u;
}

export function evaluateCubicBezierAtX(
  targetX: number,
  curve: TakeoverVignetteCurve
): number {
  const x = Math.max(0, Math.min(1, targetX));
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const p1x = Math.max(0, Math.min(1, curve.p1x));
  const p2x = Math.max(0, Math.min(1, curve.p2x));

  let low = 0;
  let high = 1;
  let u = x;
  for (let i = 0; i < 14; i++) {
    u = 0.5 * (low + high);
    const estX = sampleCubicBezier1D(u, p1x, p2x);
    if (estX < x) {
      low = u;
    } else {
      high = u;
    }
  }
  const y = sampleCubicBezier1D(u, curve.p1y, curve.p2y);
  return Math.max(0, Math.min(1, y));
}

/**
 * Builds a 4-edge rectangular gradient fallback CSS string (used when SVG is not active).
 */
export function buildTakeoverVignetteGradient(config: TakeoverVignetteConfig): string {
  if (!config.enabled || config.intensityPct <= 0) {
    return 'none';
  }
  const peakAlpha = Math.max(0, Math.min(1, config.intensityPct / 100));
  const innerStop = Math.max(0, Math.min(95, config.distancePct));
  const outerStop = Math.max(innerStop + 4, Math.min(150, config.outerReachPct));
  const span = outerStop - innerStop;

  const sampleFractions = [0, 0.2, 0.4, 0.6, 0.8, 1];
  const buildEdgeStops = () =>
    sampleFractions
      .map((frac) => {
        const distFromCenterPct = innerStop + frac * span;
        const posFromEdgePct = Math.max(0, 50 - distFromCenterPct * 0.5);
        const curveFactor = evaluateCubicBezierAtX(frac, config.curve);
        const alpha = peakAlpha * curveFactor;
        return `${hexToRgba(config.color, alpha)} ${posFromEdgePct.toFixed(1)}%`;
      })
      .reverse()
      .join(', ');

  const edgeStops = buildEdgeStops();
  return [
    `linear-gradient(to bottom, ${edgeStops}, transparent 50%)`,
    `linear-gradient(to top, ${edgeStops}, transparent 50%)`,
    `linear-gradient(to right, ${edgeStops}, transparent 50%)`,
    `linear-gradient(to left, ${edgeStops}, transparent 50%)`,
  ].join(', ');
}

export interface TakeoverVignetteOverlayProps {
  config: TakeoverVignetteConfig;
  /** Whether the vignette is currently active (e.g., during `replacing-in` 3-2-1 countdown) */
  active: boolean;
  className?: string;
}

const VIGNETTE_RING_SAMPLES = 28;

/**
 * TakeoverVignetteOverlay
 * Renders a 4-edge rounded-rectangle atmospheric vignette mask beneath the HUD layer (`z-10`, below `HudAnchorStage z-20`).
 * Fades inward from the 4 screen edges toward the clear rounded-rectangle center opening, parameterized by
 * `intensityPct`, `distancePct`, `outerReachPct`, `cornerRadiusPx`, and `curve` (Cubic-Bezier).
 */
export const TakeoverVignetteOverlay: React.FC<TakeoverVignetteOverlayProps> = React.memo(
  ({ config, active, className = '' }) => {
    const rawId = useId();
    const maskId = `takeover-rect-vignette-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const transitionMs = active ? config.fadeInMs : config.fadeOutMs;
    const isShown = active && config.enabled && config.intensityPct > 0;

    const peakAlpha = Math.max(0, Math.min(1, config.intensityPct / 100));
    const innerPct = Math.max(0, Math.min(95, config.distancePct));
    const outerPct = Math.max(innerPct + 4, Math.min(150, config.outerReachPct));
    const baseRadiusPx = config.cornerRadiusPx ?? 36;

    const rings = [];
    for (let i = 0; i < VIGNETTE_RING_SAMPLES; i++) {
      const tOuter = 1 - i / VIGNETTE_RING_SAMPLES;
      const tInner = 1 - (i + 1) / VIGNETTE_RING_SAMPLES;
      const tMid = 0.5 * (tOuter + tInner);

      // Map normalized distance `s = innerPct + t * (outerPct - innerPct)` where s=0 is center and s=100 is screen edge
      const sInner = innerPct + tInner * (outerPct - innerPct);
      const halfSpanPct = Math.max(0, Math.min(50, sInner * 0.5));
      const xPct = 50 - halfSpanPct;
      const yPct = 50 - halfSpanPct;
      const wPct = halfSpanPct * 2;
      const hPct = halfSpanPct * 2;

      const curveVal = evaluateCubicBezierAtX(tMid, config.curve);
      const maskLuminance = Math.max(0, Math.min(1, 1 - curveVal));
      const gray = Math.round(maskLuminance * 255);
      const scaleFactor = Math.max(0.15, wPct / 100);
      const rx = Math.round(baseRadiusPx * scaleFactor);

      rings.push(
        <rect
          key={i}
          x={`${xPct.toFixed(2)}%`}
          y={`${yPct.toFixed(2)}%`}
          width={`${wPct.toFixed(2)}%`}
          height={`${hPct.toFixed(2)}%`}
          rx={rx}
          ry={rx}
          fill={`rgb(${gray}, ${gray}, ${gray})`}
        />
      );
    }

    const clearHalfSpanPct = Math.max(0, Math.min(50, innerPct * 0.5));
    const clearXYPct = 50 - clearHalfSpanPct;
    const clearWHPct = clearHalfSpanPct * 2;
    const clearRx = Math.round(baseRadiusPx * Math.max(0.15, clearWHPct / 100));

    return (
      <div
        data-ui-element="hud-takeover-vignette"
        data-vignette-shape="rounded-rect"
        data-active={isShown ? 'true' : 'false'}
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none select-none z-10 transition-opacity ${className}`}
        style={{
          opacity: isShown ? 1 : 0,
          transitionDuration: `${Math.max(0, transitionMs)}ms`,
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <svg
          className="w-full h-full block"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
        >
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0%" y="0%" width="100%" height="100%">
              {/* Outer boundary at 100% vignette strength */}
              <rect x="0%" y="0%" width="100%" height="100%" fill="rgb(255, 255, 255)" />
              {/* Concentric rounded-rectangle falloff bands from outerReachPct inward to distancePct */}
              {rings}
              {/* Innermost clear rounded-rectangle opening (0% vignette darkening) */}
              {clearWHPct > 0 && (
                <rect
                  x={`${clearXYPct.toFixed(2)}%`}
                  y={`${clearXYPct.toFixed(2)}%`}
                  width={`${clearWHPct.toFixed(2)}%`}
                  height={`${clearWHPct.toFixed(2)}%`}
                  rx={clearRx}
                  ry={clearRx}
                  fill="rgb(0, 0, 0)"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            fill={config.color}
            fillOpacity={peakAlpha}
            mask={`url(#${maskId})`}
          />
        </svg>
      </div>
    );
  }
);

TakeoverVignetteOverlay.displayName = 'TakeoverVignetteOverlay';

/**
 * Resolves the top label (`Takeover in...`) fill color, white stroke, and white outer glow shadow
 * based on the player's team side (`'blue'` | `'orange'`) and `TakeoverGlowConfig`.
 */
export function resolveTakeoverTopLabelVisuals(
  glow: TakeoverGlowConfig,
  teamSide: TakeoverTeamSide = 'blue'
): {
  fillColor: string;
  strokeCss: string;
  textShadowCss: string;
  strokeColor: string;
  strokeWidthPx: number;
} {
  const style: Required<TakeoverTopLabelStyleConfig> = {
    ...DEFAULT_TAKEOVER_TOP_LABEL_STYLE,
    ...(glow.topLabelStyle ?? {}),
  };

  const fillColor = style.useTeamColor
    ? teamSide === 'orange'
      ? style.orangeTeamColor
      : style.blueTeamColor
    : glow.topLabelColor || '#FFFFFF';

  const strokeWidthPx = style.strokeWidthPx;
  const strokeColor = style.strokeColor || '#FFFFFF';
  const strokeCss =
    strokeWidthPx > 0 ? `${strokeWidthPx}px ${strokeColor}` : '0px transparent';

  const glowShadow = buildOuterGlowTextShadow(
    style.glowColor || '#FFFFFF',
    style.innerBlurPx,
    style.outerBlurPx,
    style.ambientBlurPx,
    style.glowIntensityPct
  );

  // Pair crisp white perimeter outline halo with the soft white outer glow so team color glyphs stay legible on all arenas
  const crispWhiteHalo =
    strokeWidthPx > 0
      ? `0 0 2px ${hexToRgba(strokeColor, 0.95)}, 0 0 5px ${hexToRgba(strokeColor, 0.75)}`
      : '';
  const textShadowCss = [crispWhiteHalo, glowShadow !== 'none' ? glowShadow : '']
    .filter(Boolean)
    .join(', ') || 'none';

  return {
    fillColor,
    strokeCss,
    textShadowCss,
    strokeColor,
    strokeWidthPx,
  };
}

/**
 * TakeoverCountdownHUD
 * Bottom-center anchored takeover countdown banner:
 * - Top line (`topText`, default `'Takeover in...'`): `JetBrains Mono Regular (400)`, strictly stationary (never scales or jumps),
 *   rendered in the player's team color (Blue `#2563EB` or Orange `#EA580C`) with a white glowing stroke (`#FFFFFF`).
 * - Bottom line (`mainText`, `'3' -> '2' -> '1'`): `JetBrains Mono Thin (100)`, receives the scale pop animation independently.
 * - Default `uppercase: false` so mixed-case `'Takeover in...'` renders naturally without forced uppercase.
 */
export const TakeoverCountdownHUD = React.memo(
  forwardRef<TakeoverCountdownHandle, TakeoverCountdownHUDProps>(
    (
      {
        payload = null,
        teamSide = 'blue',
        glowConfig = DEFAULT_TAKEOVER_GLOW,
        typographyConfig = DEFAULT_TAKEOVER_TYPOGRAPHY,
        timingConfig = DEFAULT_TAKEOVER_TIMING,
        onStepExpire,
        className = '',
      },
      ref
    ) => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      const innerBoxRef = useRef<HTMLDivElement | null>(null);
      const bloomRef = useRef<HTMLDivElement | null>(null);
      const topTextRef = useRef<HTMLDivElement | null>(null);
      const mainTextWrapRef = useRef<HTMLDivElement | null>(null);
      const mainTextRef = useRef<HTMLDivElement | null>(null);
      const subTextRef = useRef<HTMLDivElement | null>(null);
      const expireTimerRef = useRef<number | null>(null);
      const activeMainAnimRef = useRef<Animation | null>(null);
      const activeRootFadeAnimRef = useRef<Animation | null>(null);
      const onStepExpireRef = useRef(onStepExpire);
      onStepExpireRef.current = onStepExpire;

      const clearTimers = useCallback(() => {
        if (expireTimerRef.current !== null) {
          window.clearTimeout(expireTimerRef.current);
          expireTimerRef.current = null;
        }
        if (activeMainAnimRef.current) {
          activeMainAnimRef.current.cancel();
          activeMainAnimRef.current = null;
        }
        if (activeRootFadeAnimRef.current) {
          activeRootFadeAnimRef.current.cancel();
          activeRootFadeAnimRef.current = null;
        }
      }, []);

      const applyPayloadToDom = useCallback(
        (nextPayload: TakeoverHudPayload | null, animateEntry: boolean) => {
          const rootEl = containerRef.current;
          const innerEl = innerBoxRef.current;
          const bloomEl = bloomRef.current;
          const topEl = topTextRef.current;
          const mainWrapEl = mainTextWrapRef.current;
          const mainEl = mainTextRef.current;
          const subEl = subTextRef.current;
          if (!rootEl || !innerEl || !bloomEl || !topEl || !mainWrapEl || !mainEl || !subEl) {
            return;
          }

          clearTimers();

          if (!nextPayload || !nextPayload.mainText) {
            rootEl.style.opacity = '0';
            rootEl.style.visibility = 'hidden';
            return;
          }

          const resolvedGlow: TakeoverGlowConfig = {
            ...glowConfig,
            ...(nextPayload.glow ?? {}),
            topLabelStyle: {
              ...DEFAULT_TAKEOVER_TOP_LABEL_STYLE,
              ...(glowConfig.topLabelStyle ?? {}),
              ...(nextPayload.glow?.topLabelStyle ?? {}),
            },
          };
          const resolvedTypo: CenterUpperTypographyConfig = {
            ...typographyConfig,
            ...(nextPayload.typography ?? {}),
          };
          const resolvedTiming: CenterUpperTimingConfig = {
            ...timingConfig,
            ...(nextPayload.timing ?? {}),
          };
          const resolvedTeamSide: TakeoverTeamSide = nextPayload.teamSide ?? teamSide;

          rootEl.style.visibility = 'visible';
          rootEl.style.opacity = '1';
          rootEl.style.transform = 'scale3d(1, 1, 1)';
          innerEl.style.gap = `${resolvedTypo.lineGapPx}px`;

          // 1. Backdrop radial bloom
          const bloomPct = resolvedGlow.backdropBloomPct ?? 0;
          if (bloomPct > 0 && resolvedGlow.intensityPct > 0) {
            const bloomAlpha = Math.min(
              0.65,
              (bloomPct / 100) * (resolvedGlow.intensityPct / 100) * 0.45
            );
            bloomEl.style.background = `radial-gradient(ellipse at center, ${hexToRgba(
              resolvedGlow.glowColor,
              bloomAlpha
            )} 0%, ${hexToRgba(resolvedGlow.glowColor, bloomAlpha * 0.35)} 42%, transparent 74%)`;
            bloomEl.style.opacity = '1';
          } else {
            bloomEl.style.opacity = '0';
          }

          const strokeW = resolvedGlow.strokeWidthPx ?? 0;
          const resolvedStrokeCol =
            resolvedGlow.strokeColor || resolvedGlow.glowColor || resolvedGlow.textColor;

          // 2. Top Line (`JetBrains Mono Regular` 400 — e.g. `Takeover in...`)
          // Team-colored fill (Blue vs Orange) + White glowing stroke (`#FFFFFF`), strictly stationary!
          const hasTopText = Boolean(nextPayload.topText && nextPayload.topText.trim().length > 0);
          if (hasTopText) {
            const topVisuals = resolveTakeoverTopLabelVisuals(resolvedGlow, resolvedTeamSide);
            topEl.style.display = 'block';
            topEl.style.transform = 'none';
            topEl.textContent = resolvedTypo.uppercase
              ? nextPayload.topText.toUpperCase()
              : nextPayload.topText;
            topEl.style.fontSize = `${resolvedTypo.topFontSizePx}px`;
            topEl.style.fontWeight = String(resolvedTypo.topFontWeight);
            topEl.style.letterSpacing = `${resolvedTypo.topLetterSpacingEm}em`;
            topEl.style.paddingLeft =
              resolvedTypo.topLetterSpacingEm > 0
                ? `${resolvedTypo.topLetterSpacingEm}em`
                : '0px';
            topEl.style.color = topVisuals.fillColor;
            topEl.style.webkitTextStroke = topVisuals.strokeCss;
            topEl.style.paintOrder = 'stroke fill';
            topEl.style.textShadow = topVisuals.textShadowCss;
          } else {
            topEl.style.display = 'none';
            topEl.textContent = '';
          }

          // 3. Bottom Countdown Line (`JetBrains Mono Thin` 100 — `3`, `2`, `1`)
          mainEl.textContent = resolvedTypo.uppercase
            ? nextPayload.mainText.toUpperCase()
            : nextPayload.mainText;
          mainEl.style.fontSize = `${resolvedTypo.mainFontSizePx}px`;
          mainEl.style.fontWeight = String(resolvedTypo.mainFontWeight);
          mainEl.style.letterSpacing = `${resolvedTypo.mainLetterSpacingEm}em`;
          mainEl.style.paddingLeft =
            resolvedTypo.mainLetterSpacingEm > 0
              ? `${resolvedTypo.mainLetterSpacingEm}em`
              : '0px';
          mainEl.style.fontStyle = resolvedTypo.italic ? 'italic' : 'normal';
          mainEl.style.color = resolvedGlow.textColor;
          mainEl.style.textShadow = buildOuterGlowTextShadow(
            resolvedGlow.glowColor,
            resolvedGlow.innerBlurPx,
            resolvedGlow.outerBlurPx,
            resolvedGlow.ambientBlurPx,
            resolvedGlow.intensityPct
          );
          mainEl.style.webkitTextStroke =
            strokeW > 0 ? `${strokeW}px ${resolvedStrokeCol}` : '0px transparent';

          // 4. Optional Sub-caption
          if (nextPayload.subText && nextPayload.subText.trim().length > 0) {
            subEl.style.display = 'inline-flex';
            subEl.textContent = resolvedTypo.uppercase
              ? nextPayload.subText.toUpperCase()
              : nextPayload.subText;
            subEl.style.color = resolvedGlow.topLabelColor || '#E2E8F0';
            subEl.style.borderColor = hexToRgba(resolvedGlow.glowColor, 0.45);
            subEl.style.boxShadow = `0 0 0 1px ${hexToRgba(resolvedGlow.glowColor, 0.25)}`;
          } else {
            subEl.style.display = 'none';
            subEl.textContent = '';
          }

          // 5. Kinetic Scale Pop strictly on `mainWrapEl` (`3 -> 2 -> 1`), while `topEl` stays rock-solid
          const entryMs = Math.max(0, resolvedTiming.entryDurationMs);
          const holdMs = Math.max(entryMs, resolvedTiming.durationMs);
          const exitMs = Math.max(0, resolvedTiming.exitDurationMs);
          const totalTimelineMs = Math.max(1, holdMs + exitMs);
          const entryScale = resolvedTiming.entryScale;

          if (typeof mainWrapEl.animate === 'function') {
            if (resolvedTiming.persistentInspect) {
              if (animateEntry && entryMs > 0) {
                activeMainAnimRef.current = mainWrapEl.animate(
                  [
                    { transform: `scale3d(${entryScale}, ${entryScale}, 1)`, opacity: 1 },
                    { transform: 'scale3d(1, 1, 1)', opacity: 1 },
                  ],
                  {
                    duration: entryMs,
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    fill: 'forwards',
                  }
                );
              } else {
                mainWrapEl.style.transform = 'scale3d(1, 1, 1)';
                mainWrapEl.style.opacity = '1';
              }
            } else if (animateEntry) {
              const entryOffset = entryMs > 0 ? Math.min(1, entryMs / totalTimelineMs) : 0;
              const holdEndOffset = Math.min(1, holdMs / totalTimelineMs);
              const mainKeyframes: Keyframe[] = [];

              if (entryOffset > 0) {
                mainKeyframes.push({
                  offset: 0,
                  transform: `scale3d(${entryScale}, ${entryScale}, 1)`,
                  opacity: 1,
                  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                });
                mainKeyframes.push({
                  offset: entryOffset,
                  transform: 'scale3d(1, 1, 1)',
                  opacity: 1,
                  easing: 'linear',
                });
              } else {
                mainKeyframes.push({
                  offset: 0,
                  transform: 'scale3d(1, 1, 1)',
                  opacity: 1,
                  easing: 'linear',
                });
              }

              if (exitMs > 0 && holdEndOffset > entryOffset && holdEndOffset < 1) {
                mainKeyframes.push({
                  offset: holdEndOffset,
                  transform: 'scale3d(1, 1, 1)',
                  opacity: 1,
                  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                });
              }

              mainKeyframes.push({
                offset: 1,
                transform: 'scale3d(1, 1, 1)',
                opacity: exitMs > 0 ? 0 : 1,
              });

              activeMainAnimRef.current = mainWrapEl.animate(mainKeyframes, {
                duration: totalTimelineMs,
                easing: 'linear',
                fill: 'forwards',
              });

              expireTimerRef.current = window.setTimeout(() => {
                onStepExpireRef.current?.();
              }, totalTimelineMs);
            } else {
              mainWrapEl.style.transform = 'scale3d(1, 1, 1)';
              mainWrapEl.style.opacity = '1';
            }
          }
        },
        [teamSide, glowConfig, typographyConfig, timingConfig, clearTimers]
      );

      useImperativeHandle(
        ref,
        () => ({
          triggerTakeoverStep: (nextPayload: TakeoverHudPayload | null) => {
            applyPayloadToDom(nextPayload, true);
          },
        }),
        [applyPayloadToDom]
      );

      const prevTriggerSigRef = useRef<string>('');
      const prevConfigSigRef = useRef<string>('');

      useEffect(() => {
        const sig = payload
          ? `${payload.topText}::${payload.mainText}::${payload.triggerKey ?? ''}`
          : 'null';
        const configSig = JSON.stringify({
          teamSide,
          glowConfig,
          typographyConfig,
          timingConfig,
          payloadTeamSide: payload?.teamSide,
          payloadGlow: payload?.glow,
          payloadTypo: payload?.typography,
          payloadTiming: payload?.timing,
        });
        const shouldAnimate = sig !== prevTriggerSigRef.current;
        if (!shouldAnimate && configSig === prevConfigSigRef.current) {
          return;
        }
        prevTriggerSigRef.current = sig;
        prevConfigSigRef.current = configSig;
        applyPayloadToDom(payload, shouldAnimate);
      }, [payload, teamSide, glowConfig, typographyConfig, timingConfig, applyPayloadToDom]);

      useEffect(() => {
        return () => clearTimers();
      }, [clearTimers]);

      return (
        <div
          ref={containerRef}
          data-ui-element="hud-takeover-countdown"
          className={`relative w-[10000px] max-w-none flex flex-col items-center justify-end text-center select-none pointer-events-none py-2 ${className}`}
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            opacity: payload ? 1 : 0,
            visibility: payload ? 'visible' : 'hidden',
          }}
        >
          <div
            ref={innerBoxRef}
            className="relative inline-flex flex-col items-center justify-end text-center w-max max-w-none px-8"
          >
            {/* Soft radial ambient glow behind typography */}
            <div
              ref={bloomRef}
              aria-hidden="true"
              className="absolute -inset-x-12 -inset-y-6 rounded-full pointer-events-none -z-10 transition-opacity duration-150"
            />

            {/* Top Line: JetBrains Mono Regular (400) — Static 'Takeover in...' (Team-colored + White Glowing Stroke) */}
            <div
              ref={topTextRef}
              data-role="takeover-top-regular-static"
              className="leading-none whitespace-nowrap text-center"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                fontWeight: 400,
                transform: 'none',
                paintOrder: 'stroke fill',
                display: payload?.topText ? 'block' : 'none',
              }}
            >
              {payload?.topText ?? ''}
            </div>

            {/* Bottom Line Wrapper: Receives scale3d pop animation independently */}
            <div
              ref={mainTextWrapRef}
              data-role="takeover-bottom-scale-wrapper"
              className="will-change-transform flex items-center justify-center"
              style={{
                transformOrigin: 'center center',
              }}
            >
              <div
                ref={mainTextRef}
                data-role="takeover-main-thin-countdown"
                className="leading-none whitespace-nowrap tabular-nums text-center"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontWeight: 100,
                }}
              >
                {payload?.mainText ?? ''}
              </div>
            </div>

            {/* Optional Sub-caption Pill */}
            <div
              ref={subTextRef}
              data-role="takeover-sub-caption"
              className="mt-2 px-3 py-0.5 rounded-full border bg-neutral-950/92 text-[11px] font-normal tracking-[0.14em] whitespace-nowrap"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                display: payload?.subText ? 'inline-flex' : 'none',
              }}
            >
              {payload?.subText ?? ''}
            </div>
          </div>
        </div>
      );
    }
  )
);

TakeoverCountdownHUD.displayName = 'TakeoverCountdownHUD';

