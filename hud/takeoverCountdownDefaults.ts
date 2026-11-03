import {
  type CenterUpperGlowConfig,
  type CenterUpperTypographyConfig,
  type CenterUpperTimingConfig,
  DEFAULT_RL_COUNTDOWN_GLOW,
  buildOuterGlowTextShadow,
  hexToRgba,
} from './CenterUpperInfoHUD';

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
