import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import {
  CenterUpperGlowConfig,
  CenterUpperTypographyConfig,
  CenterUpperTimingConfig,
  DEFAULT_RL_COUNTDOWN_GLOW,
  buildOuterGlowTextShadow,
  hexToRgba,
} from './CenterUpperInfoHUD';
export * from './TakeoverVignetteOverlay';

export type TakeoverCountdownStep = '3' | '2' | '1' | 'complete';

export type TakeoverSignal = 'replacing-in' | 'takeover-complete';

export type TakeoverTeamSide = 'blue' | 'orange';

export interface TakeoverLayoutConfig {
  /** Upward vertical offset in px relative to bottom-center (default 0) */
  bottomOffsetPx: number;
}

export interface TakeoverTopLabelStyleConfig {
  /** Whether top label (Takeover in...) uses team-specific fill color (Blue vs Orange) */
  useTeamColor?: boolean;
  /** Blue team top label font fill color (default '#38BDF8') */
  blueTeamColor?: string;
  /** Orange team top label font fill color (default '#FB923C') */
  orangeTeamColor?: string;
  /** Top label stroke color (default '#000000') */
  strokeColor?: string;
  /** Top label stroke width in px (default 0.5) */
  strokeWidthPx?: number;
  /** Top label outer glow color (default '#000000') */
  glowColor?: string;
  /** Top label tight core glow blur in px (default 6) */
  innerBlurPx?: number;
  /** Top label outer glow blur in px (default 0) */
  outerBlurPx?: number;
  /** Top label ambient glow blur in px (default 28) */
  ambientBlurPx?: number;
  /** Top label glow intensity percentage (0 - 200, default 100) */
  glowIntensityPct?: number;
}

export interface TakeoverGlowConfig extends CenterUpperGlowConfig {
  /** Team-colored + stroke/glow overrides for the stationary top label (Takeover in...) */
  topLabelStyle?: TakeoverTopLabelStyleConfig;
}

export interface TakeoverHudPayload {
  /** Top static label rendered in JetBrains Mono Regular (400) - e.g. 'Takeover in...' */
  topText: string;
  /** Bottom countdown text rendered in JetBrains Mono Thin (100) - e.g. '3', '2', '1' */
  mainText: string;
  /** Optional secondary sub-caption below countdown */
  subText?: string;
  /** Active player team side ('blue' | 'orange') for team-colored top label */
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
  /** Active takeover payload (null = hidden) */
  payload?: TakeoverHudPayload | null;
  /** Active team side ('blue' | 'orange', default 'blue') */
  teamSide?: TakeoverTeamSide;
  /** Glow configuration (shared with 5E CenterUpperGlowConfig + topLabelStyle) */
  glowConfig?: TakeoverGlowConfig;
  /** Typography configuration (uppercase: false by default for Takeover) */
  typographyConfig?: CenterUpperTypographyConfig;
  /** Timing configuration (scale pop applies strictly to mainText, leaving topText stationary) */
  timingConfig?: CenterUpperTimingConfig;
  /** Callback fired when an individual step's hold + exit window completes */
  onStepExpire?: () => void;
  className?: string;
}

export const DEFAULT_TAKEOVER_TOP_LABEL_STYLE: Required<TakeoverTopLabelStyleConfig> = {
  useTeamColor: true,
  blueTeamColor: '#38BDF8',
  orangeTeamColor: '#FB923C',
  strokeColor: '#000000',
  strokeWidthPx: 0.5,
  glowColor: '#000000',
  innerBlurPx: 6,
  outerBlurPx: 0,
  ambientBlurPx: 28,
  glowIntensityPct: 100,
};

export const DEFAULT_TAKEOVER_GLOW: TakeoverGlowConfig = {
  ...DEFAULT_RL_COUNTDOWN_GLOW,
  textColor: '#FFE600',
  glowColor: '#FFE600',
  innerBlurPx: 0,
  outerBlurPx: 28,
  ambientBlurPx: 0,
  intensityPct: 100,
  topLabelColor: '#FFFFFF',
  topLabelGlowColor: '#F59E0B',
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
  bottomOffsetPx: 0,
};

/**
 * Resolves the top label (Takeover in...) fill color, stroke, and outer glow shadow
 * based on the player's team side ('blue' | 'orange') and TakeoverGlowConfig.
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
  const strokeColor = style.strokeColor || '#000000';
  const strokeCss =
    strokeWidthPx > 0 ? `${strokeWidthPx}px ${strokeColor}` : '0px transparent';

  const glowShadow = buildOuterGlowTextShadow(
    style.glowColor || strokeColor,
    style.innerBlurPx,
    style.outerBlurPx,
    style.ambientBlurPx,
    style.glowIntensityPct
  );

  // Pair crisp perimeter outline halo with the soft outer glow so team color glyphs stay legible on all arenas
  const crispHalo =
    strokeWidthPx > 0
      ? `0 0 2px ${hexToRgba(strokeColor, 0.95)}, 0 0 5px ${hexToRgba(strokeColor, 0.75)}`
      : '';
  const textShadowCss =
    [crispHalo, glowShadow !== 'none' ? glowShadow : ''].filter(Boolean).join(', ') ||
    'none';

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
 * - Top line (topText, default 'Takeover in...'): JetBrains Mono Regular (400), strictly stationary (never scales or jumps),
 *   rendered in the player's team color (Blue vs Orange) with stroke and outer glow.
 * - Bottom line (mainText, '3' -> '2' -> '1'): JetBrains Mono Thin (100), receives the scale pop animation independently.
 * - Default uppercase: false so mixed-case 'Takeover in...' renders naturally without forced uppercase.
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

          // 2. Top Line (JetBrains Mono Regular 400 - e.g. Takeover in...)
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

          // 3. Bottom Countdown Line (JetBrains Mono Thin 100 - 3, 2, 1)
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

          // 5. Kinetic Scale Pop strictly on mainWrapEl (3 -> 2 -> 1), while topEl stays rock-solid
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

            {/* Top Line: JetBrains Mono Regular (400) - Static 'Takeover in...' */}
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
