/**
 * keyboardInputOverlayConfig.ts
 * Pure L1 types, default constants, and JSON normalization helpers for the
 * Keyboard Input Overlay floating window and 3D Car Nose Arrow renderer.
 */

export type NoseArrowColorSource = 'key-bg' | 'arrow-color' | 'custom';

export interface KeyboardInputOverlayConfig {
  /** Independent keyboard overlay opacity (1% - 500%). */
  keyboardOpacityPct: number;
  /** Multiplies keyboardOpacityPct with global floating window opacity on the window shell. */
  compensateGlobalOpacity: boolean;

  // --- Keycap Grid & Retro Bevel / Trapezoid Pressing Mechanics ---
  keyGapPx: number;
  keyBorderRadiusPx: number;
  trapezoidInsetXPct: number;
  trapezoidInsetYPct: number;
  pressShrinkXPct: number;
  pressShrinkYPct: number;
  bevelContrast: number;
  showKeyCornerLabels: boolean;

  // --- WASD Distinct Idle & Pressed Background Colors ---
  wIdleBgColor: string;
  wPressedBgColor: string;
  aIdleBgColor: string;
  aPressedBgColor: string;
  sIdleBgColor: string;
  sPressedBgColor: string;
  dIdleBgColor: string;
  dPressedBgColor: string;

  // --- Action Keys (Q, E, Slide, Boost, Jump) Unified Dark/Light Colors ---
  actionIdleBgDark: string;
  actionPressedBgDark: string;
  actionIconColorDark: string;
  actionIdleBgLight: string;
  actionPressedBgLight: string;
  actionIconColorLight: string;

  // --- WASD 2D/3D Beveled Overlay Arrow Parameters ---
  overlayArrowRotationOffsetDeg: number;
  overlayArrowFollowsCarAttitude: boolean;
  overlayArrowScale: number;
  overlayArrowExtrudeDepth: number;
  overlayArrowShadowIntensity: number;
  overlayArrowUseDistinctColors: boolean;
  overlayArrowUnifiedColor: string;
  wArrowColor: string;
  aArrowColor: string;
  sArrowColor: string;
  dArrowColor: string;

  // --- 3D Car Nose Arrows (Custom Training Pack Style on Hitbox Front Face Center) ---
  enableNoseArrowRendering: boolean;
  noseArrowColorSource: NoseArrowColorSource;
  noseWCustomColor: string;
  noseACustomColor: string;
  noseSCustomColor: string;
  noseDCustomColor: string;
  noseForwardOffsetUu: number;
  noseArrowTotalLengthUu: number;
  noseConeLengthUu: number;
  noseConeRadiusUu: number;
  noseTipRadiusUu: number;
  noseShaftRadiusUu: number;
  noseArrowOpacity: number;
  noseShadowOpacity: number;
  noseShadowScale: number;
  noseHaloScaleUu: number;
}

export const DEFAULT_KEYBOARD_INPUT_OVERLAY_CONFIG: Readonly<KeyboardInputOverlayConfig> =
  Object.freeze({
    keyboardOpacityPct: 100,
    compensateGlobalOpacity: true,

    keyGapPx: 6,
    keyBorderRadiusPx: 0,
    trapezoidInsetXPct: 12,
    trapezoidInsetYPct: 12,
    pressShrinkXPct: 6,
    pressShrinkYPct: 5,
    bevelContrast: 0.58,
    showKeyCornerLabels: true,

    // 4 distinctly differentiated colors for W (Emerald), A (Amber), S (Rose), D (Sky)
    wIdleBgColor: '#10b981',
    wPressedBgColor: '#047857',
    aIdleBgColor: '#f59e0b',
    aPressedBgColor: '#b45309',
    sIdleBgColor: '#f43f5e',
    sPressedBgColor: '#be123c',
    dIdleBgColor: '#0ea5e9',
    dPressedBgColor: '#0369a1',

    actionIdleBgDark: '#262626',
    actionPressedBgDark: '#141414',
    actionIconColorDark: '#f5f5f5',
    actionIdleBgLight: '#f5f5f5',
    actionPressedBgLight: '#d4d4d4',
    actionIconColorLight: '#171717',

    overlayArrowRotationOffsetDeg: 0,
    overlayArrowFollowsCarAttitude: true,
    overlayArrowScale: 0.78,
    overlayArrowExtrudeDepth: 3.2,
    overlayArrowShadowIntensity: 0.68,
    overlayArrowUseDistinctColors: false,
    overlayArrowUnifiedColor: '#ffffff',
    wArrowColor: '#ecfdf5',
    aArrowColor: '#fffbeb',
    sArrowColor: '#fff1f2',
    dArrowColor: '#f0f9ff',

    enableNoseArrowRendering: false,
    noseArrowColorSource: 'key-bg',
    noseWCustomColor: '#10b981',
    noseACustomColor: '#f59e0b',
    noseSCustomColor: '#f43f5e',
    noseDCustomColor: '#0ea5e9',
    noseForwardOffsetUu: 0,
    noseArrowTotalLengthUu: 85,
    noseConeLengthUu: 28,
    noseConeRadiusUu: 10,
    noseTipRadiusUu: 1.5,
    noseShaftRadiusUu: 3.8,
    noseArrowOpacity: 0.88,
    noseShadowOpacity: 0.55,
    noseShadowScale: 1.18,
    noseHaloScaleUu: 42,
  });

function numOr(val: unknown, fallback: number, min?: number, max?: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  let n = val;
  if (min !== undefined) n = Math.max(min, n);
  if (max !== undefined) n = Math.min(max, n);
  return n;
}

function strOr(val: unknown, fallback: string): string {
  return typeof val === 'string' && val.trim().length > 0 ? val.trim() : fallback;
}

function boolOr(val: unknown, fallback: boolean): boolean {
  return typeof val === 'boolean' ? val : fallback;
}

export function normalizeKeyboardInputOverlayConfig(
  raw?: Partial<KeyboardInputOverlayConfig> | null
): KeyboardInputOverlayConfig {
  const d = DEFAULT_KEYBOARD_INPUT_OVERLAY_CONFIG;
  const p = raw && typeof raw === 'object' ? raw : {};
  const sourceRaw = p.noseArrowColorSource;
  const noseArrowColorSource: NoseArrowColorSource =
    sourceRaw === 'key-bg' || sourceRaw === 'arrow-color' || sourceRaw === 'custom'
      ? sourceRaw
      : d.noseArrowColorSource;

  return {
    keyboardOpacityPct: numOr(p.keyboardOpacityPct, d.keyboardOpacityPct, 1, 1000),
    compensateGlobalOpacity: boolOr(p.compensateGlobalOpacity, d.compensateGlobalOpacity),

    keyGapPx: numOr(p.keyGapPx, d.keyGapPx, 0, 48),
    keyBorderRadiusPx: numOr(p.keyBorderRadiusPx, d.keyBorderRadiusPx, 0, 64),
    trapezoidInsetXPct: numOr(p.trapezoidInsetXPct, d.trapezoidInsetXPct, 0, 45),
    trapezoidInsetYPct: numOr(p.trapezoidInsetYPct, d.trapezoidInsetYPct, 0, 45),
    pressShrinkXPct: numOr(p.pressShrinkXPct, d.pressShrinkXPct, -20, 35),
    pressShrinkYPct: numOr(p.pressShrinkYPct, d.pressShrinkYPct, -20, 35),
    bevelContrast: numOr(p.bevelContrast, d.bevelContrast, 0, 1),
    showKeyCornerLabels: boolOr(p.showKeyCornerLabels, d.showKeyCornerLabels),

    wIdleBgColor: strOr(p.wIdleBgColor, d.wIdleBgColor),
    wPressedBgColor: strOr(p.wPressedBgColor, d.wPressedBgColor),
    aIdleBgColor: strOr(p.aIdleBgColor, d.aIdleBgColor),
    aPressedBgColor: strOr(p.aPressedBgColor, d.aPressedBgColor),
    sIdleBgColor: strOr(p.sIdleBgColor, d.sIdleBgColor),
    sPressedBgColor: strOr(p.sPressedBgColor, d.sPressedBgColor),
    dIdleBgColor: strOr(p.dIdleBgColor, d.dIdleBgColor),
    dPressedBgColor: strOr(p.dPressedBgColor, d.dPressedBgColor),

    actionIdleBgDark: strOr(p.actionIdleBgDark, d.actionIdleBgDark),
    actionPressedBgDark: strOr(p.actionPressedBgDark, d.actionPressedBgDark),
    actionIconColorDark: strOr(p.actionIconColorDark, d.actionIconColorDark),
    actionIdleBgLight: strOr(p.actionIdleBgLight, d.actionIdleBgLight),
    actionPressedBgLight: strOr(p.actionPressedBgLight, d.actionPressedBgLight),
    actionIconColorLight: strOr(p.actionIconColorLight, d.actionIconColorLight),

    overlayArrowRotationOffsetDeg: numOr(
      p.overlayArrowRotationOffsetDeg,
      d.overlayArrowRotationOffsetDeg,
      -360,
      360
    ),
    overlayArrowFollowsCarAttitude: boolOr(
      p.overlayArrowFollowsCarAttitude,
      d.overlayArrowFollowsCarAttitude
    ),
    overlayArrowScale: numOr(p.overlayArrowScale, d.overlayArrowScale, 0.2, 2.0),
    overlayArrowExtrudeDepth: numOr(
      p.overlayArrowExtrudeDepth,
      d.overlayArrowExtrudeDepth,
      0,
      12
    ),
    overlayArrowShadowIntensity: numOr(
      p.overlayArrowShadowIntensity,
      d.overlayArrowShadowIntensity,
      0,
      1
    ),
    overlayArrowUseDistinctColors: boolOr(
      p.overlayArrowUseDistinctColors,
      d.overlayArrowUseDistinctColors
    ),
    overlayArrowUnifiedColor: strOr(p.overlayArrowUnifiedColor, d.overlayArrowUnifiedColor),
    wArrowColor: strOr(p.wArrowColor, d.wArrowColor),
    aArrowColor: strOr(p.aArrowColor, d.aArrowColor),
    sArrowColor: strOr(p.sArrowColor, d.sArrowColor),
    dArrowColor: strOr(p.dArrowColor, d.dArrowColor),

    enableNoseArrowRendering: boolOr(p.enableNoseArrowRendering, d.enableNoseArrowRendering),
    noseArrowColorSource,
    noseWCustomColor: strOr(p.noseWCustomColor, d.noseWCustomColor),
    noseACustomColor: strOr(p.noseACustomColor, d.noseACustomColor),
    noseSCustomColor: strOr(p.noseSCustomColor, d.noseSCustomColor),
    noseDCustomColor: strOr(p.noseDCustomColor, d.noseDCustomColor),
    noseForwardOffsetUu: numOr(p.noseForwardOffsetUu, d.noseForwardOffsetUu, -200, 300),
    noseArrowTotalLengthUu: numOr(p.noseArrowTotalLengthUu, d.noseArrowTotalLengthUu, 15, 400),
    noseConeLengthUu: numOr(p.noseConeLengthUu, d.noseConeLengthUu, 6, 200),
    noseConeRadiusUu: numOr(p.noseConeRadiusUu, d.noseConeRadiusUu, 2, 80),
    noseTipRadiusUu: numOr(p.noseTipRadiusUu, d.noseTipRadiusUu, 0, 30),
    noseShaftRadiusUu: numOr(p.noseShaftRadiusUu, d.noseShaftRadiusUu, 0.5, 40),
    noseArrowOpacity: numOr(p.noseArrowOpacity, d.noseArrowOpacity, 0.05, 1.0),
    noseShadowOpacity: numOr(p.noseShadowOpacity, d.noseShadowOpacity, 0.0, 1.0),
    noseShadowScale: numOr(p.noseShadowScale, d.noseShadowScale, 1.01, 2.0),
    noseHaloScaleUu: numOr(p.noseHaloScaleUu, d.noseHaloScaleUu, 0, 250),
  };
}

/**
 * Resolves the 4 effective hex colors for the 3D Car Nose Arrows (W=Down, A=Left, S=Up, D=Right)
 * according to `noseArrowColorSource`.
 */
export function resolveNoseArrowHexColors(config: KeyboardInputOverlayConfig): {
  wHex: string;
  aHex: string;
  sHex: string;
  dHex: string;
} {
  if (config.noseArrowColorSource === 'arrow-color') {
    if (config.overlayArrowUseDistinctColors) {
      return {
        wHex: config.wArrowColor,
        aHex: config.aArrowColor,
        sHex: config.sArrowColor,
        dHex: config.dArrowColor,
      };
    }
    return {
      wHex: config.overlayArrowUnifiedColor,
      aHex: config.overlayArrowUnifiedColor,
      sHex: config.overlayArrowUnifiedColor,
      dHex: config.overlayArrowUnifiedColor,
    };
  }
  if (config.noseArrowColorSource === 'custom') {
    return {
      wHex: config.noseWCustomColor,
      aHex: config.noseACustomColor,
      sHex: config.noseSCustomColor,
      dHex: config.noseDCustomColor,
    };
  }
  return {
    wHex: config.wIdleBgColor,
    aHex: config.aIdleBgColor,
    sHex: config.sIdleBgColor,
    dHex: config.dIdleBgColor,
  };
}

let runtimeKeyboardOverlayConfig: KeyboardInputOverlayConfig = {
  ...DEFAULT_KEYBOARD_INPUT_OVERLAY_CONFIG,
};

export function getKeyboardInputOverlayConfig(): KeyboardInputOverlayConfig {
  return runtimeKeyboardOverlayConfig;
}

export function setKeyboardInputOverlayRuntimeConfig(
  next: KeyboardInputOverlayConfig
): void {
  runtimeKeyboardOverlayConfig = next;
}

