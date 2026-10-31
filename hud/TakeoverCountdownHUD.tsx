import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useMemo,
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

export interface TakeoverVignetteCurve {
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
}

export interface TakeoverVignetteConfig {
  /** Whether the surrounding 4-edge vignette layer is enabled beneath the HUD */
  enabled: boolean;
  /** Vignette tint color (default `#000000`) */
  color: string;
  /** Edge peak intensity / opacity percentage (`0` – `100`, default `78`) */
  intensityPct: number;
  /** Clear center distance / inner start radius percentage from screen center (`0` – `95`, default `36`) */
  distancePct: number;
  /** Outer full-density reach percentage (`20` – `140`, default `100`) */
  outerReachPct: number;
  /** Non-linear Cubic-Bezier falloff curve from clear inner boundary (`0`) to outer edge (`1`) */
  curve: TakeoverVignetteCurve;
  /** Fade-in transition duration when entering `replacing-in` in ms (default `280`) */
  fadeInMs: number;
  /** Fade-out transition duration when `3-2-1` completes and HUD returns in ms (default `380`) */
  fadeOutMs: number;
}

export interface TakeoverLayoutConfig {
  /** Upward vertical offset in px relative to `bottom-center` (default `96`) */
  bottomOffsetPx: number;
}

export interface TakeoverHudPayload {
  /** Top static label rendered in `JetBrains Mono Regular` (`400`) — e.g. `'Take over in'` */
  topText: string;
  /** Bottom countdown text rendered in `JetBrains Mono Thin` (`100`) — e.g. `'3'`, `'2'`, `'1'` */
  mainText: string;
  /** Optional secondary sub-caption below countdown */
  subText?: string;
  /** Active glow configuration override */
  glow?: Partial<CenterUpperGlowConfig>;
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
  /** Glow configuration (shared with 5E `CenterUpperGlowConfig`) */
  glowConfig?: CenterUpperGlowConfig;
  /** Typography configuration (`uppercase: false` by default for Takeover) */
  typographyConfig?: CenterUpperTypographyConfig;
  /** Timing configuration (scale pop applies strictly to `mainText`, leaving `topText` stationary) */
  timingConfig?: CenterUpperTimingConfig;
  /** Callback fired when an individual step's hold + exit window completes */
  onStepExpire?: () => void;
  className?: string;
}

export const DEFAULT_TAKEOVER_GLOW: CenterUpperGlowConfig = {
  ...DEFAULT_RL_COUNTDOWN_GLOW,
};

export const DEFAULT_TAKEOVER_TYPOGRAPHY: CenterUpperTypographyConfig = {
  mainFontSizePx: 84,
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
  bottomOffsetPx: 96,
};

export const DEFAULT_TAKEOVER_VIGNETTE: TakeoverVignetteConfig = {
  enabled: true,
  color: '#000000',
  intensityPct: 78,
  distancePct: 36,
  outerReachPct: 100,
  curve: {
    p1x: 0.42,
    p1y: 0.0,
    p2x: 0.22,
    p2y: 1.0,
  },
  fadeInMs: 280,
  fadeOutMs: 380,
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
 * Builds a multi-stop radial gradient CSS string that follows the user's
 * `distancePct` (inner clear zone), `outerReachPct`, `intensityPct`, and `CubicBezier` falloff curve.
 */
export function buildTakeoverVignetteGradient(config: TakeoverVignetteConfig): string {
  if (!config.enabled || config.intensityPct <= 0) {
    return 'none';
  }
  const peakAlpha = Math.max(0, Math.min(1, config.intensityPct / 100));
  const innerStop = Math.max(0, Math.min(95, config.distancePct));
  const outerStop = Math.max(innerStop + 4, Math.min(150, config.outerReachPct));
  const span = outerStop - innerStop;

  const sampleFractions = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];
  const stops = sampleFractions.map((frac) => {
    const posPct = innerStop + frac * span;
    const curveFactor = evaluateCubicBezierAtX(frac, config.curve);
    const alpha = peakAlpha * curveFactor;
    return `${hexToRgba(config.color, alpha)} ${posPct.toFixed(1)}%`;
  });

  return `radial-gradient(ellipse at 50% 50%, ${hexToRgba(config.color, 0)} 0%, ${stops.join(', ')})`;
}

export interface TakeoverVignetteOverlayProps {
  config: TakeoverVignetteConfig;
  /** Whether the vignette is currently active (e.g., during `replacing-in` 3-2-1 countdown) */
  active: boolean;
  className?: string;
}

/**
 * TakeoverVignetteOverlay
 * Renders the 4-edge atmospheric vignette beneath the HUD layer (`z-10`, below `HudAnchorStage z-20`).
 * Parameterized by `intensityPct`, `distancePct`, `outerReachPct`, and `curve` (Cubic-Bezier).
 */
export const TakeoverVignetteOverlay: React.FC<TakeoverVignetteOverlayProps> = React.memo(
  ({ config, active, className = '' }) => {
    const gradientCss = useMemo(() => buildTakeoverVignetteGradient(config), [config]);
    const transitionMs = active ? config.fadeInMs : config.fadeOutMs;
    const isShown = active && config.enabled && config.intensityPct > 0;

    return (
      <div
        data-ui-element="hud-takeover-vignette"
        data-active={isShown ? 'true' : 'false'}
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none select-none z-10 transition-opacity ${className}`}
        style={{
          backgroundImage: gradientCss,
          opacity: isShown ? 1 : 0,
          transitionDuration: `${Math.max(0, transitionMs)}ms`,
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    );
  }
);

TakeoverVignetteOverlay.displayName = 'TakeoverVignetteOverlay';

/**
 * TakeoverCountdownHUD
 * Bottom-center anchored takeover countdown banner:
 * - Top line (`topText`, default `'Take over in'`): `JetBrains Mono Regular (400)`, strictly stationary (never scales or jumps).
 * - Bottom line (`mainText`, `'3' -> '2' -> '1'`): `JetBrains Mono Thin (100)`, receives the scale pop animation independently.
 * - Default `uppercase: false` so mixed-case `'Take over in'` renders naturally without forced uppercase.
 */
export const TakeoverCountdownHUD = React.memo(
  forwardRef<TakeoverCountdownHandle, TakeoverCountdownHUDProps>(
    (
      {
        payload = null,
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

          const resolvedGlow: CenterUpperGlowConfig = {
            ...glowConfig,
            ...(nextPayload.glow ?? {}),
          };
          const resolvedTypo: CenterUpperTypographyConfig = {
            ...typographyConfig,
            ...(nextPayload.typography ?? {}),
          };
          const resolvedTiming: CenterUpperTimingConfig = {
            ...timingConfig,
            ...(nextPayload.timing ?? {}),
          };

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

          // 2. Top Line (`JetBrains Mono Regular` 400 — e.g. `Take over in`)
          // Strictly stationary: never receives scale3d pop animation!
          const hasTopText = Boolean(nextPayload.topText && nextPayload.topText.trim().length > 0);
          if (hasTopText) {
            const topColor = resolvedGlow.topLabelColor || '#FFFFFF';
            const topGlowColor = resolvedGlow.topLabelGlowColor || resolvedGlow.glowColor;
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
            topEl.style.color = topColor;
            topEl.style.webkitTextStroke =
              strokeW > 0 ? `${Math.max(0.5, strokeW * 0.65)}px ${topGlowColor}` : '0px transparent';
            topEl.style.textShadow = buildOuterGlowTextShadow(
              topGlowColor,
              resolvedGlow.innerBlurPx > 0 ? Math.max(2, resolvedGlow.innerBlurPx * 0.65) : 0,
              resolvedGlow.outerBlurPx > 0 ? Math.max(4, resolvedGlow.outerBlurPx * 0.7) : 0,
              resolvedGlow.ambientBlurPx > 0 ? Math.max(8, resolvedGlow.ambientBlurPx * 0.65) : 0,
              resolvedGlow.intensityPct * 0.9
            );
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
        [glowConfig, typographyConfig, timingConfig, clearTimers]
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
          glowConfig,
          typographyConfig,
          timingConfig,
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
      }, [payload, glowConfig, typographyConfig, timingConfig, applyPayloadToDom]);

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

            {/* Top Line: JetBrains Mono Regular (400) — Static 'Take over in' (Never scales or jumps!) */}
            <div
              ref={topTextRef}
              data-role="takeover-top-regular-static"
              className="leading-none whitespace-nowrap text-center"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                fontWeight: 400,
                transform: 'none',
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
