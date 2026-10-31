import React from 'react';

export type PackagedSvgIconId =
  | 'bomb-emoji'
  | 'replay-skip-check'
  | 'crossbar-outline'
  | 'crossbar-solid'
  | 'bounce-outline'
  | 'bounce-solid'
  | 'high-five'
  | 'tactics'
  | 'tactics-square'
  | 'strategy'
  | 'jet-thrust';

export type PackagedSvgId = PackagedSvgIconId;

export interface BounceSvgOptions {
  /** Render both trajectory and ground platform as solid single lines while ball stays outlined */
  solidTrajectoryAndPlatform?: boolean;
  /** Render the V-shaped bounce trajectory as a solid single line instead of hollow double-outline */
  solidTrajectory?: boolean;
  /** Render the bottom ground platform bar as a solid single line instead of hollow double-outline */
  solidPlatform?: boolean;
  /** Keep false (default) for normal outlined ball, or true for solid ball */
  solidBall?: boolean;
}

export interface HighFiveSvgOptions {
  /** Toggle 1: Show top 3 + bottom 3 = 6 action spark lines (default true) */
  showSparks?: boolean;
  /** Toggle 2: Fill left hand solid (/, default false) */
  fillLeftHand?: boolean;
  /** Toggle 3: Fill right hand solid (/, default false) */
  fillRightHand?: boolean;
}

export interface TacticsSvgOptions {
  /** Use 1:1 square variation with angled diagonal playmaker arrow (default false = original 6112985) */
  squareVariation?: boolean;
  /** Custom arrow tilt angle in degrees when in square variation (default -18) */
  arrowTiltDeg?: number;
}

export interface StrategySvgOptions {
  /** Toggle 1: Convert Top-Left X marker into a Circle O (default false = X) */
  topLeftCircle?: boolean;
  /** Toggle 2: Convert Bottom-Right X marker into a Circle O (default false = X) */
  bottomRightCircle?: boolean;
}

export interface CrossbarSvgOptions {
  /** Variant shorthand ('outline' = 7267515, 'solid' = 7267457) */
  variant?: 'outline' | 'solid';
  /** Use solid goalpost & solid ball (7267457) instead of outlined goalpost & ball (7267515) */
  solidFrame?: boolean;
  /** Show top 3 impact spark lines (default true) */
  showSparks?: boolean;
  /** Show bottom 2 diagonal rebound lines inside goal (default true) */
  showReboundLines?: boolean;
}

export interface PackagedSvgStyleProps {
  /** Icon bounding box width & height in px (default 24) */
  size?: number;
  /** Primary stroke/fill color (default 'currentColor') */
  color?: string;
  /**
   * Stroke width / weight control:
   * - For `bomb-emoji` (24x24 stroke icon): direct SVG `strokeWidth` (default `1.5`, range `0.8` - `3.2`)
   * - For Noun Project 5120x5120 contour icons: `1.5` is native weight (`0` extra stroke), `> 1.5` adds bold contour expansion
   */
  strokeWidth?: number;
  /** Outer glow color (e.g. `#EF4444` or `#FFE600`) */
  glowColor?: string;
  /** Outer glow blur radius in px (default `0` = off) */
  glowBlurPx?: number;
  /** Outer glow intensity percentage (`0` - `200`, default `100`) */
  glowIntensityPct?: number;
  className?: string;
  style?: React.CSSProperties;
}

export interface PackagedSvgIconProps extends PackagedSvgStyleProps {
  name?: PackagedSvgIconId;
  icon?: PackagedSvgIconId;
  bounceOptions?: BounceSvgOptions;
  highFiveOptions?: HighFiveSvgOptions;
  tacticsOptions?: TacticsSvgOptions;
  strategyOptions?: StrategySvgOptions;
  crossbarOptions?: CrossbarSvgOptions;
}

export interface PackagedSvgCatalogEntry {
  id: PackagedSvgIconId;
  title: string;
  subtitle: string;
  sourceUrl: string;
  category: 'match-hud-5a' | 'stats-event-5f';
  defaultEventTitle: string;
  defaultCapsuleText: string;
  defaultFootnoteText: string;
}

export const PACKAGED_SVG_CATALOG: PackagedSvgCatalogEntry[] = [
  {
    id: 'bomb-emoji',
    title: 'Bomb Emoji (528868)',
    subtitle: '5A Match HUD demolished player slot icon with adjustable stroke width, color, and outer glow',
    sourceUrl: 'https://www.svgrepo.com/svg/528868/bomb-emoji',
    category: 'match-hud-5a',
    defaultEventTitle: 'DEMOLITION',
    defaultCapsuleText: '+25 PTS · BOOM',
    defaultFootnoteText: 'SUPERSONIC IMPACT · 3.0S RESPAWN',
  },
  {
    id: 'replay-skip-check',
    title: 'Replay Skip Ready Checkmark',
    subtitle: '5A Match HUD inward half-rounded card checkmark with adjustable stroke width, color, and outer glow',
    sourceUrl: 'https://lucide.dev/icons/check',
    category: 'match-hud-5a',
    defaultEventTitle: 'SKIP REPLAY',
    defaultCapsuleText: 'READY',
    defaultFootnoteText: 'GOAL REPLAY SKIP VOTE CONFIRMED',
  },
  {
    id: 'crossbar-outline',
    title: 'Crossbar Outlined (7267515)',
    subtitle: '5F Stats Event · Outlined crossbar impact and rebound spark icon',
    sourceUrl: 'https://thenounproject.com/icon/crossbar-7267515/',
    category: 'stats-event-5f',
    defaultEventTitle: 'CROSSBAR HIT',
    defaultCapsuleText: '118 KM/H',
    defaultFootnoteText: 'UPPER 90 WOODWORK DEFLECTION',
  },
  {
    id: 'crossbar-solid',
    title: 'Crossbar Solid (7267457)',
    subtitle: '5F Stats Event · Filled crossbar and solid ball impact spark icon',
    sourceUrl: 'https://thenounproject.com/icon/crossbar-7267457/',
    category: 'stats-event-5f',
    defaultEventTitle: 'BAR DOWN',
    defaultCapsuleText: '+10 SHOT',
    defaultFootnoteText: 'CROSSBAR IMPACT DETECTED',
  },
  {
    id: 'bounce-solid',
    title: 'Bounce Solid-Line (7384294 Single-Line Variant)',
    subtitle: '5F Stats Event · Single-line solid trajectory and ground platform with outlined ball',
    sourceUrl: 'https://thenounproject.com/icon/bounce-7384294/',
    category: 'stats-event-5f',
    defaultEventTitle: 'BOUNCE SHOT',
    defaultCapsuleText: '×1.4 APEX',
    defaultFootnoteText: 'SINGLE-BOUNCE HALF-VOLLEY TIMING',
  },
  {
    id: 'bounce-outline',
    title: 'Bounce Outlined (7384294 Original Outlined)',
    subtitle: '5F Stats Event · Original double-line outlined bounce trajectory and platform',
    sourceUrl: 'https://thenounproject.com/icon/bounce-7384294/',
    category: 'stats-event-5f',
    defaultEventTitle: 'SURFACE BOUNCE',
    defaultCapsuleText: 'GROUND CLEAR',
    defaultFootnoteText: 'PITCH BOUNCE TRAJECTORY',
  },
  {
    id: 'high-five',
    title: 'High Five (1154833 · 8 Toggle Combinations)',
    subtitle: '5F Stats Event · Supports 3 toggles (burst lines / solid left hand / solid right hand) for 8 combinations',
    sourceUrl: 'https://thenounproject.com/icon/high-five-1154833/',
    category: 'stats-event-5f',
    defaultEventTitle: 'HIGH FIVE',
    defaultCapsuleText: '+50 TEAMWORK',
    defaultFootnoteText: 'POST-GOAL AERIAL BUMP WITH TEAMMATE',
  },
  {
    id: 'tactics-square',
    title: 'Tactics Playmaker Square (6112985 Square Diagonal Variant)',
    subtitle: '5F Stats Event · 1:1 square symmetric composition with diagonal tactical arrow',
    sourceUrl: 'https://thenounproject.com/icon/tactics-6112985/',
    category: 'stats-event-5f',
    defaultEventTitle: 'PLAYMAKER',
    defaultCapsuleText: '+25 ASSIST',
    defaultFootnoteText: 'KEY TACTICAL PASS · 3RD ASSIST',
  },
  {
    id: 'tactics',
    title: 'Tactics Playmaker Original (6112985 Original)',
    subtitle: '5F Stats Event · Original horizontal S-curve tactical arrow with X/O positioning markers',
    sourceUrl: 'https://thenounproject.com/icon/tactics-6112985/',
    category: 'stats-event-5f',
    defaultEventTitle: 'TACTICAL PASS',
    defaultCapsuleText: 'INFIELD FEED',
    defaultFootnoteText: 'PLAYMAKER SEQUENCE COMPLETED',
  },
  {
    id: 'strategy',
    title: 'Strategy Board (6112585 · 4 Marker Combinations)',
    subtitle: '5F Stats Event · Supports 2 toggles (top-left X-to-O / bottom-right X-to-O) for 4 tactical board states',
    sourceUrl: 'https://thenounproject.com/icon/strategy-6112585/',
    category: 'stats-event-5f',
    defaultEventTitle: 'TACTICAL ROTATION',
    defaultCapsuleText: 'CENTER BALL',
    defaultFootnoteText: 'ZONE COVERAGE & STRATEGIC POSITIONING',
  },
];

function hexToRgbaSafe(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, Number(alpha.toFixed(3))));
  const clean = (hex || '').replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }
  return `rgba(239, 68, 68, ${a})`;
}

/**
 * Builds a single-pass CSS `filter: drop-shadow(...)` string for SVG outer glow
 * (avoids stacked multi-pass drop-shadow filters that cause scroll repaint jank on dense SVG grids).
 */
export function buildSvgDropShadowFilter(
  glowColor?: string,
  glowBlurPx = 0,
  glowIntensityPct = 100
): string {
  if (!glowColor || glowBlurPx <= 0 || glowIntensityPct <= 0) return 'none';
  const mult = glowIntensityPct / 100;
  const alpha = Math.min(1, 0.85 * mult);
  const blur = Math.max(1, Math.round(glowBlurPx * 0.85));
  return `drop-shadow(0 0 ${blur}px ${hexToRgbaSafe(glowColor, alpha)})`;
}

export function computeContourStroke5120(strokeWidth = 1.5): number {
  const delta = strokeWidth - 1.5;
  if (delta <= 0.05) return 0;
  return Math.round(delta * 55);
}

export const SVG_VECTOR_PATHS = {
  "crossbar_7267515": {
    "sparksTop": [
      "M2935 4091 c-11 -5 -31 -21 -45 -36 -25 -27 -25 -27 -25 -226 l0 -199 33 -32 c28 -28 39 -33 82 -33 43 0 54 5 82 33 l33 32 0 200 0 200 -31 31 c-33 33 -92 46 -129 30z",
      "M2235 3831 c-45 -20 -70 -60 -70 -112 l0 -49 141 -141 c133 -133 144 -141 186 -146 42 -5 49 -2 84 30 35 32 39 40 39 86 l0 51 -141 141 c-126 126 -145 141 -180 145 -21 2 -48 0 -59 -5z",
      "M3615 3831 c-11 -5 -81 -71 -155 -145 l-135 -136 0 -50 c0 -43 5 -54 33 -82 28 -28 39 -33 82 -33 l50 0 142 143 143 142 0 50 c0 42 -5 54 -31 81 -33 33 -92 46 -129 30z"
    ],
    "outerGoalAndBall": "M2883 3225 c-74 -20 -147 -59 -197 -105 l-43 -40 -931 -2 c-922 -3 -931 -3 -958 -24 -15 -11 -37 -33 -48 -48 -21 -27 -21 -33 -21 -986 0 -953 0 -959 21 -986 11 -15 33 -37 48 -48 26 -20 40 -21 285 -21 l258 0 37 29 c68 52 66 27 66 731 l0 635 665 0 665 0 48 -25 c138 -71 306 -71 444 0 46 24 53 25 273 25 l225 0 2 -649 c3 -638 3 -650 24 -677 11 -15 33 -37 48 -48 26 -20 40 -21 285 -21 l258 0 37 29 c70 53 66 -3 66 1026 0 1029 4 973 -66 1026 l-37 29 -490 3 -490 3 -43 39 c-110 101 -286 144 -431 105z",
    "ballInnerCutout": "M3090 2979 c153 -69 196 -252 88 -375 -54 -61 -94 -79 -178 -79 -61 0 -82 5 -112 23 -137 85 -169 254 -70 364 73 81 182 108 272 67z",
    "goalLeftInnerCutout": "M2522 2773 c-2 -38 3 -92 11 -120 l14 -53 -643 -2 c-631 -3 -643 -3 -670 -24 -15 -11 -37 -33 -48 -48 -21 -27 -21 -39 -24 -677 l-2 -649 -120 0 -120 0 0 820 0 820 803 0 802 0 -3 -67z",
    "goalRightInnerCutout": "M4200 2020 l0 -820 -120 0 -120 0 -2 649 c-3 638 -3 650 -24 677 -50 67 -56 69 -278 72 l-203 3 14 52 c8 29 13 82 11 120 l-3 67 363 0 362 0 0 -820z",
    "reboundLinesBottom": [
      "M2275 2211 c-11 -5 -67 -57 -125 -115 -105 -106 -105 -106 -105 -156 0 -43 5 -54 33 -82 28 -28 39 -33 82 -33 l50 0 112 113 113 112 0 50 c0 42 -5 54 -31 81 -33 33 -92 46 -129 30z",
      "M2775 2111 c-11 -5 -171 -161 -355 -345 l-335 -336 0 -50 c0 -43 5 -54 33 -82 28 -28 39 -33 82 -33 l50 0 342 343 343 342 0 50 c0 42 -5 54 -31 81 -33 33 -92 46 -129 30z"
    ]
  },
  "crossbar_7267457": {
    "sparksTop": [
      "M3015 3891 c-11 -5 -31 -21 -45 -36 -25 -27 -25 -27 -25 -226 l0 -199 33 -32 c28 -28 39 -33 82 -33 43 0 54 5 82 33 l33 32 0 200 0 200 -31 31 c-33 33 -92 46 -129 30z",
      "M2315 3631 c-45 -20 -70 -60 -70 -112 l0 -50 147 -146 147 -146 47 6 c69 7 109 50 109 117 l0 50 -141 141 c-126 126 -145 141 -180 145 -21 2 -48 0 -59 -5z",
      "M3695 3631 c-11 -5 -81 -71 -155 -145 l-135 -136 0 -50 c0 -43 5 -54 33 -82 28 -28 39 -33 82 -33 l50 0 142 143 143 142 0 50 c0 42 -5 54 -31 81 -33 33 -92 46 -129 30z"
    ],
    "ballSolid": "M2930 3031 c-48 -16 -105 -49 -132 -78 -127 -136 -90 -354 76 -441 42 -22 64 -26 126 -26 62 0 84 4 126 26 166 87 203 305 76 441 -60 64 -196 103 -272 78z",
    "goalLeftSolid": "M975 2866 c-37 -16 -70 -52 -84 -89 -8 -19 -11 -284 -11 -823 l0 -794 160 0 160 0 2 665 3 665 33 32 32 33 670 3 670 2 -14 28 c-32 63 -45 194 -27 260 l10 32 -787 0 c-634 -1 -793 -3 -817 -14z",
    "goalRightSolid": "M3432 2843 c14 -51 4 -167 -20 -230 l-20 -52 229 -3 229 -3 32 -33 33 -32 3 -665 2 -665 160 0 160 0 0 795 c0 881 3 839 -66 891 l-37 29 -358 3 -358 3 11 -38z",
    "reboundLinesBottom": [
      "M2275 2211 c-11 -5 -67 -57 -125 -115 -105 -106 -105 -106 -105 -156 0 -43 5 -54 33 -82 28 -28 39 -33 82 -33 l50 0 112 113 113 112 0 50 c0 42 -5 54 -31 81 -33 33 -92 46 -129 30z",
      "M2775 2111 c-32 -14 -679 -669 -689 -697 -13 -39 1 -88 35 -120 25 -24 39 -29 80 -29 l49 0 342 343 343 342 0 50 c0 42 -5 54 -31 81 -33 33 -92 46 -129 30z"
    ]
  },
  "bounce_7384294": {
    "outerContour": "M3870 4283 c-44 -7 -144 -45 -184 -70 -106 -67 -192 -179 -228 -296 -17 -57 -20 -86 -16 -170 4 -65 12 -120 24 -152 l19 -49 -196 -196 c-270 -268 -441 -485 -619 -782 -180 -300 -350 -700 -425 -998 -9 -36 -18 -71 -21 -79 -2 -8 -27 23 -58 73 -141 224 -348 419 -582 548 -44 25 -180 88 -302 141 -235 103 -281 114 -340 83 -97 -51 -117 -184 -37 -255 17 -15 76 -47 131 -70 303 -133 391 -175 467 -224 208 -136 353 -300 471 -535 25 -50 46 -94 46 -97 0 -3 -302 -5 -670 -5 -657 0 -670 0 -690 -20 -18 -18 -20 -33 -20 -140 0 -107 2 -122 20 -140 20 -20 33 -20 1900 -20 1867 0 1880 0 1900 20 18 18 20 33 20 140 0 107 -2 122 -20 140 -20 20 -33 20 -1010 20 l-991 0 14 28 c8 15 24 72 36 127 168 751 556 1422 1122 1935 l75 69 70 -26 c408 -150 815 243 674 651 -59 171 -199 300 -371 341 -60 14 -151 18 -209 8z",
    "ballInnerCutout": "M4125 4132 c205 -97 290 -336 190 -538 -125 -255 -470 -300 -661 -86 -13 15 -39 56 -56 92 -31 61 -33 71 -33 170 0 93 3 111 27 163 51 109 158 197 275 227 71 18 186 5 258 -28z",
    "trajectoryInnerCutout": "M3463 3246 c-165 -160 -288 -299 -408 -460 -317 -429 -535 -903 -655 -1422 -16 -69 -36 -137 -45 -150 -23 -36 -74 -64 -116 -64 -62 0 -96 33 -158 155 -94 182 -158 272 -284 398 -155 155 -277 229 -622 377 -185 80 -216 100 -199 128 6 9 20 18 31 20 23 3 414 -162 521 -220 247 -136 483 -382 613 -640 51 -101 91 -123 142 -75 19 17 32 52 57 157 169 714 563 1386 1114 1898 l99 93 28 -27 28 -26 -146 -142z",
    "platformInnerCutout": "M4360 990 l0 -40 -1800 0 -1800 0 0 40 0 40 1800 0 1800 0 0 -40z"
  },
  "high_five_1154833": {
    "sparksTop": [
      "M1687 4832 c-10 -10 -17 -29 -17 -43 0 -32 169 -529 188 -551 24 -28 78 -23 99 9 17 26 16 30 -72 291 -50 146 -98 275 -108 288 -22 29 -67 32 -90 6z",
      "M2498 4753 c-8 -10 -46 -103 -83 -206 l-68 -188 20 -27 c22 -30 73 -41 91 -20 17 21 142 373 142 401 0 51 -69 78 -102 40z",
      "M1085 4300 c-21 -23 -23 -67 -4 -85 36 -34 346 -225 366 -225 51 0 82 70 46 102 -46 40 -348 228 -368 228 -12 0 -30 -9 -40 -20z"
    ],
    "sparksBottom": [
      "M3720 1155 c-23 -27 -15 -67 18 -95 17 -14 103 -65 191 -114 172 -95 200 -101 223 -51 24 53 9 68 -180 175 -180 102 -225 117 -252 85z",
      "M3280 880 c-11 -11 -20 -29 -20 -41 0 -11 48 -137 107 -281 113 -275 121 -288 178 -274 15 4 30 17 36 33 9 24 -4 61 -96 288 -59 143 -116 268 -127 278 -27 22 -53 22 -78 -3z",
      "M2792 753 c-14 -12 -39 -80 -78 -212 -54 -180 -57 -195 -43 -220 17 -30 63 -40 92 -19 20 15 127 358 127 407 0 52 -58 78 -98 44z"
    ],
    "handsOuterContour": "M3787 4076 c-63 -23 -157 -109 -157 -144 0 -20 -15 -14 -44 17 -40 42 -120 74 -183 73 -145 -1 -241 -85 -298 -259 -9 -29 -19 -53 -21 -53 -3 0 -26 16 -51 35 -116 89 -279 73 -377 -36 -45 -50 -42 -42 -185 -444 -35 -99 -40 -107 -49 -85 -70 178 -90 219 -126 258 -61 66 -107 86 -196 87 -65 0 -82 -4 -129 -30 -29 -16 -60 -40 -68 -52 -15 -23 -33 -31 -33 -14 0 33 -77 186 -112 222 -105 108 -275 110 -377 5 l-34 -35 -27 43 c-48 75 -140 125 -230 126 -142 0 -270 -133 -270 -279 0 -41 8 -72 38 -148 l21 -52 -58 1 c-148 2 -268 -129 -264 -288 1 -41 38 -144 188 -524 102 -260 184 -474 182 -476 -2 -2 -59 30 -128 72 -144 87 -200 108 -268 102 -100 -10 -201 -93 -230 -188 -27 -91 -5 -198 55 -268 38 -45 201 -180 484 -403 455 -357 537 -408 740 -460 260 -65 565 -7 805 154 77 52 204 175 251 243 l36 52 72 -38 c170 -92 436 -136 631 -106 185 28 332 91 492 213 279 211 826 666 856 711 59 90 63 214 11 299 -83 134 -229 168 -424 99 -52 -18 -112 -41 -134 -50 -29 -13 -37 -14 -34 -4 3 7 72 195 154 418 139 378 149 410 149 475 0 165 -120 282 -284 276 -44 -1 -52 1 -47 14 52 138 55 217 11 305 -61 119 -212 180 -338 136z",
    "rightHandInnerCutout": "M3960 3941 c50 -26 80 -74 80 -127 0 -31 -32 -130 -109 -336 -228 -613 -262 -714 -252 -742 23 -59 91 -53 117 10 8 19 66 178 129 351 70 194 123 325 137 340 33 36 71 53 118 53 77 0 141 -62 142 -139 0 -29 -49 -176 -172 -509 l-172 -468 -64 -23 -63 -23 -83 21 c-189 48 -334 16 -504 -113 -83 -62 -99 -94 -64 -131 31 -33 50 -32 102 8 178 136 274 161 433 116 123 -35 115 -36 310 41 99 39 218 87 265 107 96 40 199 54 249 33 16 -6 41 -28 55 -48 35 -52 41 -99 21 -150 -15 -36 -54 -72 -259 -240 -573 -470 -656 -533 -761 -583 -250 -120 -556 -113 -808 19 -52 27 -66 39 -61 51 37 92 57 156 75 243 18 86 20 125 16 243 -7 186 -22 240 -191 672 l-137 353 106 301 c58 167 113 314 121 328 24 39 62 63 110 69 55 6 96 -11 134 -55 49 -56 44 -90 -65 -397 -52 -148 -95 -279 -95 -291 0 -31 46 -67 74 -59 33 9 40 24 101 197 153 433 268 743 285 768 25 34 78 59 127 59 76 0 143 -68 143 -145 0 -26 -49 -182 -136 -435 -147 -425 -148 -428 -92 -459 25 -14 29 -14 54 4 21 16 46 75 135 330 225 642 243 688 268 718 47 56 119 71 181 38z",
    "leftHandInnerCutout": "M1189 3622 c33 -27 49 -64 218 -503 178 -462 200 -509 239 -509 22 0 54 38 54 64 0 13 -59 178 -131 367 -73 189 -134 365 -137 390 -9 93 51 159 144 159 51 0 93 -20 119 -57 15 -22 99 -229 211 -523 41 -107 91 -236 110 -286 40 -103 64 -125 112 -102 47 23 41 54 -64 323 -53 138 -99 268 -102 291 -5 48 14 90 58 128 61 51 178 28 215 -43 30 -59 433 -1117 451 -1186 28 -106 26 -360 -4 -470 -99 -359 -388 -619 -753 -676 -91 -14 -262 -6 -344 16 -177 48 -284 122 -1006 702 -133 106 -154 137 -147 215 6 58 31 96 79 121 63 33 95 22 332 -121 120 -73 227 -132 239 -132 28 0 58 28 58 55 0 11 -101 276 -225 587 -124 312 -225 581 -225 598 0 149 181 198 268 72 10 -15 70 -160 132 -322 62 -162 120 -303 128 -312 8 -10 26 -18 39 -18 27 0 63 32 63 57 0 9 -47 136 -104 282 -181 462 -266 690 -266 715 0 125 143 196 239 118z"
  },
  "tactics_6112985": {
    "xMark": "M2579 4067 c-63 -42 -86 -125 -53 -190 9 -18 74 -91 145 -162 l129 -131 -116 -114 c-136 -134 -174 -188 -174 -242 0 -102 95 -173 195 -147 32 9 69 39 177 147 l138 136 138 -136 c108 -106 147 -138 178 -147 124 -33 229 85 183 206 -6 15 -71 89 -144 163 l-135 136 130 129 c72 71 137 144 145 161 32 68 13 142 -48 188 -27 21 -45 26 -92 26 l-58 0 -147 -145 -146 -145 -104 106 c-58 58 -127 124 -153 145 -43 34 -55 39 -101 39 -38 0 -62 -6 -87 -23z",
    "sCurveArrow": "M965 3006 c-66 -29 -105 -106 -90 -175 9 -44 63 -97 110 -110 26 -7 163 -11 382 -11 375 0 404 -4 510 -65 28 -16 178 -157 358 -335 359 -356 402 -388 590 -443 62 -18 106 -20 403 -24 l334 -5 -130 -131 c-138 -141 -159 -176 -149 -247 6 -50 33 -85 83 -110 93 -46 122 -28 401 252 127 128 238 249 248 268 10 20 20 66 23 108 8 125 3 133 -272 411 -132 134 -255 249 -273 257 -127 55 -251 -63 -203 -193 6 -15 73 -90 148 -165 l137 -138 -306 0 c-338 0 -378 5 -478 62 -39 22 -158 132 -381 352 -295 292 -332 325 -405 363 -161 84 -178 86 -620 90 -313 2 -396 0 -420 -11z",
    "oOuter": "M1291 2129 c-343 -89 -516 -464 -363 -784 68 -140 182 -241 331 -292 96 -33 242 -32 348 2 168 53 299 183 360 356 34 97 36 240 4 339 -92 291 -388 456 -680 379z",
    "oInner": "M1521 1825 c62 -22 101 -55 134 -116 39 -70 42 -170 8 -235 -66 -124 -221 -176 -341 -115 -45 23 -97 74 -119 116 -25 47 -29 147 -8 201 50 130 193 196 326 149z",
    "squareXMark": "M2914 4042 c-63 -42 -86 -125 -53 -190 9 -18 74 -91 145 -162 l129 -131 -116 -114 c-136 -134 -174 -188 -174 -242 0 -102 95 -173 195 -147 32 9 69 39 177 147 l138 136 138 -136 c108 -106 147 -138 178 -147 124 -33 229 85 183 206 -6 15 -71 89 -144 163 l-135 136 130 129 c72 71 137 144 145 161 32 68 13 142 -48 188 -27 21 -45 26 -92 26 l-58 0 -147 -145 -146 -145 -104 106 c-58 58 -127 124 -153 145 -43 34 -55 39 -101 39 -38 0 -62 -6 -87 -23z",
    "squareOOuter": "M1361 2094 c-343 -89 -516 -464 -363 -784 68 -140 182 -241 331 -292 96 -33 242 -32 348 2 168 53 299 183 360 356 34 97 36 240 4 339 -92 291 -388 456 -680 379z",
    "squareOInner": "M1591 1790 c62 -22 101 -55 134 -116 39 -70 42 -170 8 -235 -66 -124 -221 -176 -341 -115 -45 23 -97 74 -119 116 -25 47 -29 147 -8 201 50 130 193 196 326 149z"
  },
  "strategy_6112585": {
    "topLeftX": "M1252 4020 c-62 -38 -88 -116 -62 -187 6 -15 71 -89 145 -163 l135 -135 -120 -120 c-65 -66 -130 -138 -144 -159 -52 -81 -21 -184 67 -220 42 -18 53 -19 95 -8 41 11 66 31 184 150 l138 136 142 -141 c134 -132 146 -142 190 -148 64 -10 126 20 156 74 24 42 28 100 11 134 -6 12 -72 84 -147 159 l-136 137 141 144 c115 117 143 150 148 180 20 108 -45 187 -153 187 -61 0 -70 -6 -232 -167 l-125 -123 -130 131 c-72 72 -142 137 -157 145 -39 20 -107 18 -146 -6z",
    "mainArrowOuter": "M2892 3920 c-100 -62 -96 -204 8 -264 32 -19 56 -21 273 -26 l237 -5 -703 -703 -704 -704 -51 26 c-108 55 -280 72 -411 41 -89 -21 -194 -79 -268 -148 -131 -123 -194 -264 -194 -438 0 -184 50 -309 176 -435 128 -130 256 -184 433 -184 177 0 309 55 433 179 122 122 179 260 179 434 0 91 -18 173 -56 257 l-25 54 703 703 c387 387 706 703 710 703 5 0 8 -109 8 -242 0 -225 2 -245 20 -276 61 -100 210 -95 263 8 16 32 17 67 15 405 l-3 370 -33 67 c-36 73 -86 123 -167 166 l-50 27 -380 3 c-366 2 -381 2 -413 -18z",
    "mainArrowOInner": "M1827 1959 c70 -34 106 -71 140 -147 29 -61 34 -145 15 -213 -35 -118 -160 -212 -285 -213 -165 -1 -294 112 -313 275 -17 144 81 284 226 324 73 19 140 12 217 -26z",
    "bottomRightX": "M3097 2178 c-40 -24 -77 -86 -77 -131 0 -51 23 -84 158 -219 l136 -138 -136 -138 c-75 -75 -141 -150 -147 -165 -27 -69 5 -154 68 -186 91 -47 146 -22 311 144 l124 125 141 -139 c115 -115 147 -140 178 -146 51 -10 101 1 135 30 40 34 55 75 50 136 -5 50 -7 53 -149 195 l-144 144 137 137 c75 76 141 148 147 160 18 35 13 104 -9 141 -40 65 -133 92 -198 58 -15 -8 -85 -73 -157 -145 l-129 -131 -131 130 c-166 164 -220 188 -308 138z",
    "topLeftOOuter": "M1546 4069 c-343 -89 -516 -464 -363 -784 68 -140 182 -241 331 -292 96 -33 242 -32 348 2 168 53 299 183 360 356 34 97 36 240 4 339 -92 291 -388 456 -680 379z",
    "topLeftOInner": "M1776 3765 c62 -22 101 -55 134 -116 39 -70 42 -170 8 -235 -66 -124 -221 -176 -341 -115 -45 23 -97 74 -119 116 -25 47 -29 147 -8 201 50 130 193 196 326 149z",
    "bottomRightOOuter": "M3386 2229 c-343 -89 -516 -464 -363 -784 68 -140 182 -241 331 -292 96 -33 242 -32 348 2 168 53 299 183 360 356 34 97 36 240 4 339 -92 291 -388 456 -680 379z",
    "bottomRightOInner": "M3616 1925 c62 -22 101 -55 134 -116 39 -70 42 -170 8 -235 -66 -124 -221 -176 -341 -115 -45 23 -97 74 -119 116 -25 47 -29 147 -8 201 50 130 193 196 326 149z"
  },
  "jet_4873540": {
    "bodyPath": "M3915 4414 c-87 -13 -243 -47 -320 -69 -279 -81 -631 -249 -921 -440 -62 -40 -121 -78 -132 -84 -12 -6 -211 -29 -444 -51 -233 -22 -458 -47 -502 -55 -149 -30 -279 -87 -416 -183 -84 -58 -588 -557 -606 -599 -33 -77 -3 -172 66 -208 38 -20 76 -19 470 10 184 14 338 25 341 25 3 0 1 -28 -4 -61 -19 -116 16 -281 85 -398 36 -61 690 -729 809 -827 127 -104 263 -149 426 -142 99 5 103 4 103 -16 0 -12 -12 -183 -26 -380 l-27 -359 23 -44 c40 -75 124 -109 195 -79 25 11 114 91 258 234 323 320 410 431 478 606 56 144 67 216 110 676 l42 445 82 130 c267 423 420 770 497 1129 17 81 22 136 22 281 2 393 -53 453 -419 460 -88 2 -173 1 -190 -1z m273 -320 c21 -6 22 -11 22 -108 0 -530 -383 -1263 -1076 -2061 -207 -239 -251 -270 -389 -270 -138 1 -131 -4 -558 423 -423 424 -421 421 -421 552 0 126 34 182 192 321 763 673 1411 1049 1951 1134 91 14 241 19 279 9z m-2198 -692 c-25 -20 -115 -98 -200 -173 l-155 -136 -175 -12 c-96 -6 -209 -15 -250 -18 l-75 -5 75 76 c133 136 259 217 402 256 70 19 285 47 378 49 l45 1 -45 -38z m1549 -1667 c-31 -301 -80 -416 -257 -597 -58 -60 -106 -107 -107 -106 -2 2 6 109 16 238 10 129 18 240 19 245 0 6 32 47 71 90 40 44 117 133 171 198 55 65 101 117 103 115 1 -2 -6 -84 -16 -183z",
    "windowPath": "M2968 3439 c-119 -28 -251 -135 -306 -249 -152 -315 80 -690 428 -690 216 0 411 149 465 355 42 161 1 324 -112 446 -97 104 -206 150 -352 148 -47 -1 -103 -5 -123 -10z m201 -329 c42 -21 81 -85 81 -133 0 -73 -60 -141 -134 -152 -121 -18 -215 97 -171 211 33 87 134 120 224 74z",
    "flamePath": "M1328 1980 c-169 -29 -337 -128 -454 -267 -148 -178 -249 -388 -300 -624 -26 -122 -27 -381 -1 -424 48 -79 149 -104 219 -55 178 126 192 131 463 164 289 35 371 59 496 142 184 122 307 326 308 513 3 247 -193 479 -460 545 -68 17 -190 19 -271 6z m252 -337 c49 -21 114 -84 143 -136 52 -97 -28 -254 -174 -340 -62 -36 -136 -53 -340 -77 -97 -11 -207 -29 -245 -40 -38 -10 -70 -17 -72 -15 -15 14 77 255 129 338 133 212 268 302 439 294 46 -2 92 -11 120 -24z"
  }
} as const;
