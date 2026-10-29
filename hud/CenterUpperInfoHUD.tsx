import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';

export type CenterUpperInfoVariant = 'countdown' | 'winner' | 'announcement';

export type WinnerTeamPreset = 'blue' | 'orange' | 'custom';

export interface CenterUpperGlowConfig {
  /** Primary text fill color (e.g., Rocket League Yellow `#FFE600`) */
  textColor: string;
  /** Outer glow color (e.g., Rocket League Amber-Gold `#F59E0B`) */
  glowColor: string;
  /** Tight core outer glow blur radius in px (default `10`) */
  innerBlurPx: number;
  /** Mid-range outer glow blur radius in px (default `28`) */
  outerBlurPx: number;
  /** Wide atmospheric outer glow radius in px (default `56`) */
  ambientBlurPx: number;
  /** Overall outer glow intensity percentage (`0` – `200`, default `100`) */
  intensityPct: number;
  /** Optional top label text color override (defaults to `#FFFFFF` or `textColor`) */
  topLabelColor?: string;
  /** Optional top label glow color override (defaults to `glowColor`) */
  topLabelGlowColor?: string;
  /** Optional text stroke width in px (`0` = pure thin glyph, `0.5`–`3` = crisp outline) */
  strokeWidthPx?: number;
  /** Optional text stroke color */
  strokeColor?: string;
  /** Optional radial ambient backdrop bloom behind text (`0` – `100`, default `35`) */
  backdropBloomPct?: number;
}

export interface CenterUpperTypographyConfig {
  /** Main text (`JetBrains Mono Thin` 100) font size in px (default `84` for countdown, `68` for winner/announcement) */
  mainFontSizePx: number;
  /** Main text font weight (`100` Thin default, or `200`/`300`/`400`) */
  mainFontWeight: 100 | 200 | 300 | 400;
  /** Main text letter spacing in em (default `0.08`) */
  mainLetterSpacingEm: number;
  /** Top label (`JetBrains Mono Regular` 400) font size in px (default `24`) */
  topFontSizePx: number;
  /** Top label font weight (`400` Regular default, or `100`/`300`/`500`) */
  topFontWeight: 100 | 300 | 400 | 500;
  /** Top label letter spacing in em (default `0.28`) */
  topLetterSpacingEm: number;
  /** Vertical gap between top Regular label and bottom Thin main line in px (default `6`) */
  lineGapPx: number;
  /** Force uppercase rendering (default `true`) */
  uppercase: boolean;
  /** Italic slant for kinetic style (default `false`) */
  italic?: boolean;
}

export interface CenterUpperTimingConfig {
  /** Display duration per item/step in milliseconds (default `750` ms for countdown) */
  durationMs: number;
  /** Entry scale pop factor (default `1.22` for countdown, `1.08` for winner/announcement) */
  entryScale: number;
  /** Entry animation duration in ms (default `180`) */
  entryDurationMs: number;
  /** Exit fade-out duration at the tail of `durationMs` in ms (default `160`) */
  exitDurationMs: number;
  /** If true, keeps the information statically visible on screen for live parameter tuning */
  persistentInspect?: boolean;
}

export interface CenterUpperInfoPayload {
  /** Semantic category (`countdown` | `winner` | `announcement`) */
  variant: CenterUpperInfoVariant;
  /** Top line rendered in `JetBrains Mono Regular` (e.g., `'WINNER'`, `'MATCH STATUS'`, or empty `''` for single-line countdown) */
  topText?: string;
  /** Primary line rendered in `JetBrains Mono Thin` (e.g., `'3'`, `'2'`, `'1'`, `'GO!'`, `'BLUE TEAM'`, `'ORANGE TEAM'`, `'MATCH PAUSED'`) */
  mainText: string;
  /** Optional sub-caption pill or secondary note below the main text */
  subText?: string;
  /** Active glow configuration */
  glow?: Partial<CenterUpperGlowConfig>;
  /** Active typography configuration */
  typography?: Partial<CenterUpperTypographyConfig>;
  /** Active timing configuration */
  timing?: Partial<CenterUpperTimingConfig>;
  /** Unique trigger timestamp/nonce so identical consecutive steps re-trigger the entry animation */
  triggerKey?: number | string;
}

export type CenterUpperInfoListener = (payload: CenterUpperInfoPayload | null) => void;

export interface CenterUpperInfoHandle {
  /** Trigger an information flash / announcement imperatively with 0 React re-renders */
  triggerInfo: (payload: CenterUpperInfoPayload | null) => void;
}

export interface CenterUpperInfoHUDProps {
  /** Declarative information payload (`null` = hidden) */
  info?: CenterUpperInfoPayload | null;
  /** Default glow configuration (merged with `info.glow`) */
  glowConfig?: CenterUpperGlowConfig;
  /** Default typography configuration (merged with `info.typography`) */
  typographyConfig?: CenterUpperTypographyConfig;
  /** Default timing configuration (merged with `info.timing`) */
  timingConfig?: CenterUpperTimingConfig;
  /** Optional transient pub/sub channel listener */
  subscribeCenterInfo?: (listener: CenterUpperInfoListener) => () => void;
  /** Callback fired when a timed announcement finishes its `durationMs` window */
  onExpire?: () => void;
  className?: string;
}

export const DEFAULT_RL_COUNTDOWN_GLOW: CenterUpperGlowConfig = {
  textColor: '#FFE600', glowColor: '#F59E0B', innerBlurPx: 0, outerBlurPx: 28, ambientBlurPx: 0,
  intensityPct: 100, topLabelColor: '#FFFFFF', topLabelGlowColor: '#F59E0B', strokeWidthPx: 0, strokeColor: '#FFFBEB', backdropBloomPct: 0,
};

export const DEFAULT_WINNER_BLUE_GLOW: CenterUpperGlowConfig = {
  textColor: '#38BDF8', glowColor: '#0284C7', innerBlurPx: 0, outerBlurPx: 28, ambientBlurPx: 0,
  intensityPct: 100, topLabelColor: '#F8FAFC', topLabelGlowColor: '#38BDF8', strokeWidthPx: 0, strokeColor: '#E0F2FE', backdropBloomPct: 0,
};

export const DEFAULT_WINNER_ORANGE_GLOW: CenterUpperGlowConfig = {
  textColor: '#FB923C', glowColor: '#EA580C', innerBlurPx: 0, outerBlurPx: 28, ambientBlurPx: 0,
  intensityPct: 100, topLabelColor: '#FFF7ED', topLabelGlowColor: '#FB923C', strokeWidthPx: 0, strokeColor: '#FFEDD5', backdropBloomPct: 0,
};

export const DEFAULT_CENTER_UPPER_TYPOGRAPHY: CenterUpperTypographyConfig = {
  mainFontSizePx: 84, mainFontWeight: 100, mainLetterSpacingEm: 0,
  topFontSizePx: 24, topFontWeight: 400, topLetterSpacingEm: 0, lineGapPx: 6, uppercase: true, italic: false,
};

export const DEFAULT_CENTER_UPPER_TIMING: CenterUpperTimingConfig = {
  durationMs: 2000, entryScale: 1.5, entryDurationMs: 400, exitDurationMs: 400, persistentInspect: false,
};

/**
 * Converts a `#RRGGBB` hex string and alpha (`0` – `1`) to `rgba(r, g, b, a)`.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const clampedAlpha = Math.max(0, Math.min(1, Number(alpha.toFixed(3))));
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2] : clean;
  if (full.length === 6) {
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
    }
  }
  return `rgba(255, 230, 0, ${clampedAlpha})`;
}

/**
 * Builds a multi-stage Rocket League style Outer Glow `text-shadow` CSS string.
 * Combines a crisp core edge bloom, a mid-range neon aura, and a wide atmospheric halo.
 */
export function buildOuterGlowTextShadow(
  glowColor: string,
  innerBlurPx: number,
  outerBlurPx: number,
  ambientBlurPx: number,
  intensityPct: number
): string {
  if (intensityPct <= 0) return 'none';
  const mult = intensityPct / 100;
  const aCore = Math.min(1, 0.92 * mult);
  const aMid = Math.min(1, 0.68 * mult);
  const aWide = Math.min(1, 0.42 * mult);

  const layers: string[] = [];
  if (innerBlurPx > 0) {
    layers.push(`0 0 ${Math.round(innerBlurPx)}px ${hexToRgba(glowColor, aCore)}`);
  }
  if (outerBlurPx > 0) {
    layers.push(`0 0 ${Math.round(outerBlurPx)}px ${hexToRgba(glowColor, aMid)}`);
  }
  if (ambientBlurPx > 0) {
    layers.push(`0 0 ${Math.round(ambientBlurPx)}px ${hexToRgba(glowColor, aWide)}`);
  }
  return layers.length > 0 ? layers.join(', ') : 'none';
}

export const CenterUpperInfoHUD = React.memo(
  forwardRef<CenterUpperInfoHandle, CenterUpperInfoHUDProps>(
    ({ info = null, glowConfig = DEFAULT_RL_COUNTDOWN_GLOW, typographyConfig = DEFAULT_CENTER_UPPER_TYPOGRAPHY, timingConfig = DEFAULT_CENTER_UPPER_TIMING, subscribeCenterInfo, onExpire, className = '' }, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      const innerBoxRef = useRef<HTMLDivElement | null>(null);
      const bloomRef = useRef<HTMLDivElement | null>(null);
      const topTextRef = useRef<HTMLDivElement | null>(null);
      const mainTextRef = useRef<HTMLDivElement | null>(null);
      const subTextRef = useRef<HTMLDivElement | null>(null);
      const expireTimerRef = useRef<number | null>(null);
      const activeAnimRef = useRef<Animation | null>(null);
      const onExpireRef = useRef(onExpire);
      onExpireRef.current = onExpire;

      const clearTimers = useCallback(() => {
        if (expireTimerRef.current !== null) {
          window.clearTimeout(expireTimerRef.current);
          expireTimerRef.current = null;
        }
        if (activeAnimRef.current) {
          activeAnimRef.current.cancel();
          activeAnimRef.current = null;
        }
      }, []);

      const applyPayloadToDom = useCallback(
        (payload: CenterUpperInfoPayload | null, animateEntry: boolean) => {
          const rootEl = containerRef.current;
          const innerEl = innerBoxRef.current;
          const bloomEl = bloomRef.current;
          const topEl = topTextRef.current;
          const mainEl = mainTextRef.current;
          const subEl = subTextRef.current;
          if (!rootEl || !innerEl || !mainEl || !topEl || !bloomEl || !subEl) return;

          clearTimers();

          if (!payload || !payload.mainText) {
            rootEl.style.opacity = '0';
            rootEl.style.visibility = 'hidden';
            return;
          }

          const resolvedGlow: CenterUpperGlowConfig = {
            ...glowConfig,
            ...(payload.glow ?? {}),
          };
          const resolvedTypo: CenterUpperTypographyConfig = {
            ...typographyConfig,
            ...(payload.typography ?? {}),
          };
          const resolvedTiming: CenterUpperTimingConfig = {
            ...timingConfig,
            ...(payload.timing ?? {}),
          };

          rootEl.style.visibility = 'visible';
          rootEl.style.opacity = '1';
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

          const strokeW = resolvedGlow.strokeWidthPx ?? 1;
          const resolvedStrokeCol =
            resolvedGlow.strokeColor || resolvedGlow.glowColor || resolvedGlow.textColor;

          // 2. Top Line (`JetBrains Mono Regular` 400 — e.g. `WINNER`)
          const hasTopText = Boolean(payload.topText && payload.topText.trim().length > 0);
          if (hasTopText) {
            const topColor = resolvedGlow.topLabelColor || '#FFFFFF';
            const topGlowColor = resolvedGlow.topLabelGlowColor || resolvedGlow.glowColor;
            topEl.style.display = 'block';
            topEl.textContent = resolvedTypo.uppercase
              ? payload.topText!.toUpperCase()
              : payload.topText!;
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

          // 3. Main Line (`JetBrains Mono Thin` 100 — e.g. `3`, `2`, `1`, `GO`, `BLUE TEAM`, `WAITING FOR PLAYERS`)
          mainEl.textContent = resolvedTypo.uppercase
            ? payload.mainText.toUpperCase()
            : payload.mainText;
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

          if (strokeW > 0) {
            mainEl.style.webkitTextStroke = `${strokeW}px ${resolvedStrokeCol}`;
          } else {
            mainEl.style.webkitTextStroke = '0px transparent';
          }

          // 4. Optional Sub-caption (hidden by default unless explicitly non-empty)
          if (payload.subText && payload.subText.trim().length > 0) {
            subEl.style.display = 'inline-flex';
            subEl.textContent = resolvedTypo.uppercase
              ? payload.subText.toUpperCase()
              : payload.subText;
            subEl.style.color = resolvedGlow.topLabelColor || '#E2E8F0';
            subEl.style.borderColor = hexToRgba(resolvedGlow.glowColor, 0.45);
            subEl.style.boxShadow = `0 0 0 1px ${hexToRgba(resolvedGlow.glowColor, 0.25)}`;
          } else {
            subEl.style.display = 'none';
            subEl.textContent = '';
          }

          // 5. Kinetic Envelope Animation:
          // - Phase 1 (Entry Overshoot): `0 -> entryDurationMs` (default 400ms) shrinks from `entryScale` (default 1.5x) to 1.0x
          // - Phase 2 (Hold): stays at 1.0x until `durationMs` (default 2000ms)
          // - Phase 3 (Tail Fade-Out): after `durationMs`, fades out (`opacity: 1 -> 0`) over `exitDurationMs` (default 400ms)
          // - Any new datum arriving before `durationMs + exitDurationMs` calls `clearTimers()` above and overwrites immediately.
          const entryMs = Math.max(0, resolvedTiming.entryDurationMs);
          const holdMs = Math.max(entryMs, resolvedTiming.durationMs);
          const exitMs = Math.max(0, resolvedTiming.exitDurationMs);
          const totalTimelineMs = Math.max(1, holdMs + exitMs);
          const entryScale = resolvedTiming.entryScale;

          if (typeof rootEl.animate === 'function') {
            if (resolvedTiming.persistentInspect) {
              if (animateEntry && entryMs > 0) {
                activeAnimRef.current = rootEl.animate(
                  [
                    {
                      transform: `scale3d(${entryScale}, ${entryScale}, 1)`,
                      opacity: 1,
                    },
                    {
                      transform: 'scale3d(1, 1, 1)',
                      opacity: 1,
                    },
                  ],
                  {
                    duration: entryMs,
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    fill: 'forwards',
                  }
                );
              } else {
                rootEl.style.transform = 'scale3d(1, 1, 1)';
                rootEl.style.opacity = '1';
              }
            } else if (animateEntry) {
              const keyframes: Keyframe[] = [];
              const entryOffset = entryMs > 0 ? Math.min(1, entryMs / totalTimelineMs) : 0;
              const holdEndOffset = Math.min(1, holdMs / totalTimelineMs);

              if (entryOffset > 0) {
                keyframes.push({
                  offset: 0,
                  transform: `scale3d(${entryScale}, ${entryScale}, 1)`,
                  opacity: 1,
                  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                });
                keyframes.push({
                  offset: entryOffset,
                  transform: 'scale3d(1, 1, 1)',
                  opacity: 1,
                  easing: 'linear',
                });
              } else {
                keyframes.push({
                  offset: 0,
                  transform: 'scale3d(1, 1, 1)',
                  opacity: 1,
                  easing: 'linear',
                });
              }

              if (exitMs > 0 && holdEndOffset > entryOffset && holdEndOffset < 1) {
                keyframes.push({
                  offset: holdEndOffset,
                  transform: 'scale3d(1, 1, 1)',
                  opacity: 1,
                  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                });
              }

              if (exitMs > 0) {
                keyframes.push({
                  offset: 1,
                  transform: 'scale3d(1, 1, 1)',
                  opacity: 0,
                });
              } else if (entryOffset < 1) {
                keyframes.push({
                  offset: 1,
                  transform: 'scale3d(1, 1, 1)',
                  opacity: 1,
                });
              }

              activeAnimRef.current = rootEl.animate(keyframes, {
                duration: totalTimelineMs,
                easing: 'linear',
                fill: 'forwards',
              });

              expireTimerRef.current = window.setTimeout(() => {
                if (containerRef.current) {
                  containerRef.current.style.opacity = '0';
                  containerRef.current.style.visibility = 'hidden';
                }
                onExpireRef.current?.();
              }, totalTimelineMs);
            } else {
              // Live parameter slider tweak: show immediately at scale(1) and fade out after holdMs + exitMs
              const holdEndOffset = Math.min(1, holdMs / totalTimelineMs);
              const keyframes: Keyframe[] = [
                {
                  offset: 0,
                  transform: 'scale3d(1, 1, 1)',
                  opacity: 1,
                  easing: 'linear',
                },
              ];
              if (exitMs > 0 && holdEndOffset > 0 && holdEndOffset < 1) {
                keyframes.push({
                  offset: holdEndOffset,
                  transform: 'scale3d(1, 1, 1)',
                  opacity: 1,
                  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                });
              }
              keyframes.push({
                offset: 1,
                transform: 'scale3d(1, 1, 1)',
                opacity: exitMs > 0 ? 0 : 1,
              });

              activeAnimRef.current = rootEl.animate(keyframes, {
                duration: totalTimelineMs,
                easing: 'linear',
                fill: 'forwards',
              });

              expireTimerRef.current = window.setTimeout(() => {
                if (containerRef.current) {
                  containerRef.current.style.opacity = '0';
                  containerRef.current.style.visibility = 'hidden';
                }
                onExpireRef.current?.();
              }, totalTimelineMs);
            }
          }
        },
        [glowConfig, typographyConfig, timingConfig, clearTimers]
      );

      useImperativeHandle(
        ref,
        () => ({
          triggerInfo: (payload: CenterUpperInfoPayload | null) => {
            applyPayloadToDom(payload, true);
          },
        }),
        [applyPayloadToDom]
      );

      // Track last triggerKey/text so slider tweaks update styles in-place without restarting the pop animation on every pixel drag
      const prevTriggerSignatureRef = useRef<string>('');
      const prevConfigSignatureRef = useRef<string>('');

      useEffect(() => {
        const sig = info
          ? `${info.variant}::${info.topText ?? ''}::${info.mainText}::${info.triggerKey ?? ''}`
          : 'null';
        const configSig = JSON.stringify({
          glowConfig,
          typographyConfig,
          timingConfig,
          infoGlow: info?.glow,
          infoTypo: info?.typography,
          infoTiming: info?.timing,
        });
        const shouldAnimate = sig !== prevTriggerSignatureRef.current;
        if (!shouldAnimate && configSig === prevConfigSignatureRef.current) {
          return;
        }
        prevTriggerSignatureRef.current = sig;
        prevConfigSignatureRef.current = configSig;
        applyPayloadToDom(info, shouldAnimate);
      }, [info, glowConfig, typographyConfig, timingConfig, applyPayloadToDom]);

      useEffect(() => {
        if (!subscribeCenterInfo) return;
        return subscribeCenterInfo((payload) => {
          applyPayloadToDom(payload, true);
        });
      }, [subscribeCenterInfo, applyPayloadToDom]);

      useEffect(() => {
        return () => clearTimers();
      }, [clearTimers]);

      return (
        <div
          ref={containerRef}
          data-ui-element="hud-center-upper-info"
          data-variant={info?.variant ?? 'none'}
          className={`relative w-[10000px] max-w-none flex flex-col items-center justify-center text-center select-none pointer-events-none will-change-transform py-4 ${className}`}
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            transformOrigin: 'center center',
            opacity: info ? 1 : 0,
            visibility: info ? 'visible' : 'hidden',
          }}
        >
          <div
            ref={innerBoxRef}
            className="relative inline-flex flex-col items-center justify-center text-center w-max max-w-none px-8"
          >
            {/* Soft radial ambient glow behind typography (pure radial-gradient, 0 blur filter) */}
            <div
              ref={bloomRef}
              aria-hidden="true"
              className="absolute -inset-x-12 -inset-y-6 rounded-full pointer-events-none -z-10 transition-opacity duration-150"
            />

            {/* Top Line: JetBrains Mono Regular (400) — e.g. WINNER / SYSTEM STATUS */}
            <div
              ref={topTextRef}
              data-role="center-upper-top-regular"
              className="leading-none whitespace-nowrap text-center"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                fontWeight: 400,
                display: info?.topText ? 'block' : 'none',
              }}
            >
              {info?.topText ?? ''}
            </div>

            {/* Primary Line: JetBrains Mono Thin (100) — e.g. 3 / 2 / 1 / GO / BLUE TEAM / ORANGE TEAM / WAITING FOR PLAYERS */}
            <div
              ref={mainTextRef}
              data-role="center-upper-main-thin"
              className="leading-none whitespace-nowrap tabular-nums text-center"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                fontWeight: 100,
              }}
            >
              {info?.mainText ?? ''}
            </div>

            {/* Optional Sub-caption Pill (hidden by default) */}
            <div
              ref={subTextRef}
              data-role="center-upper-sub-caption"
              className="mt-2 px-3 py-0.5 rounded-full border bg-neutral-950/92 text-[11px] font-normal tracking-[0.22em] whitespace-nowrap"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                display: info?.subText ? 'inline-flex' : 'none',
              }}
            >
              {info?.subText ?? ''}
            </div>
          </div>
        </div>
      );
    }
  )
);

CenterUpperInfoHUD.displayName = 'CenterUpperInfoHUD';
