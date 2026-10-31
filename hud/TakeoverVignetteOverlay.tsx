import React, { useEffect, useRef } from 'react';

export type TakeoverVignetteRenderMode = 'sdf-smooth' | 'css-inset' | 'hybrid';

export interface TakeoverVignetteCurve {
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
}

export interface TakeoverVignetteConfig {
  /** Whether the surrounding 4-edge rounded-rectangle vignette layer is enabled beneath the HUD */
  enabled: boolean;
  /** Rendering engine mode: 'sdf-smooth' (scene-safe continuous SDF + dither), 'css-inset' (reference CSS box-shadow), or 'hybrid' */
  renderMode?: TakeoverVignetteRenderMode;
  /** Symmetric/master Top & Bottom vertical depth percentage (0 - 140, default 58) */
  depthYPct?: number;
  /** Independent Top edge vertical depth percentage (0 - 140, defaults to depthYPct ?? 58) */
  depthTopPct?: number;
  /** Independent Bottom edge vertical depth percentage (0 - 140, defaults to depthYPct ?? 58) */
  depthBottomPct?: number;
  /** Vertical offset in px shifting the vignette opening (default 0; +px shifts opening upward for shorter top & taller bottom) */
  verticalOffsetPx?: number;
  /** Independent Left/Right horizontal depth percentage (0 - 100, default 17) */
  depthXPct?: number;
  /** Continuous feathering blur range in px (20 - 350, default 164) */
  blurPx?: number;
  /** Inner opening (t=0 at distancePct) RGB tint color (default '#000000') */
  innerColor?: string;
  /** Inner opening (t=0 at distancePct) alpha / opacity percentage (0 - 100, default 0) */
  innerIntensityPct?: number;
  /** Outer edge (t=1 at outerReachPct) RGB tint color (default '#000000') */
  color: string;
  /** Outer edge (t=1 at outerReachPct) peak intensity / opacity percentage (0 - 100, default 100) */
  intensityPct: number;
  /** Clear center rounded-rectangle distance percentage from screen center (0 - 95, default 40) */
  distancePct: number;
  /** Outer full-density reach percentage (20 - 160, default 160) */
  outerReachPct: number;
  /** Non-linear Cubic-Bezier falloff curve from inner boundary (0) to outer edge (1) */
  curve: TakeoverVignetteCurve;
  /** Fade-in transition duration when entering replacing-in in ms (default 280) */
  fadeInMs: number;
  /** Fade-out transition duration when 3-2-1 completes and HUD returns in ms (default 380) */
  fadeOutMs: number;
  /** Corner radius of the rounded-rectangle vignette in px (default 0) */
  cornerRadiusPx?: number;
}

export const DEFAULT_TAKEOVER_VIGNETTE: TakeoverVignetteConfig = {
  enabled: true,
  renderMode: 'sdf-smooth',
  depthYPct: 58,
  depthTopPct: 58,
  depthBottomPct: 58,
  verticalOffsetPx: 0,
  depthXPct: 17,
  blurPx: 164,
  innerColor: '#000000',
  innerIntensityPct: 0,
  color: '#000000',
  intensityPct: 100,
  distancePct: 40,
  outerReachPct: 160,
  curve: {
    p1x: 0.36,
    p1y: 0.0,
    p2x: 0.22,
    p2y: 1.0,
  },
  fadeInMs: 280,
  fadeOutMs: 380,
  cornerRadiusPx: 0,
};

export function parseHexToRgbTuple(hex: string): [number, number, number] {
  const clean = (hex || '#000000').replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [
      Number.isFinite(r) ? r : 0,
      Number.isFinite(g) ? g : 0,
      Number.isFinite(b) ? b : 0,
    ];
  }
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [
    Number.isFinite(r) ? r : 0,
    Number.isFinite(g) ? g : 0,
    Number.isFinite(b) ? b : 0,
  ];
}

export function formatVignetteEndpointRgba(hex: string, alphaPct: number): string {
  const [r, g, b] = parseHexToRgbTuple(hex);
  const a = Math.max(0, Math.min(1, alphaPct / 100));
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

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

export interface VignetteAxisGeometry {
  blurPx: number;
  depthXPct: number;
  depthYPct: number;
  depthTopPct: number;
  depthBottomPct: number;
  verticalOffsetPx: number;
  offsetX: number;
  offsetY: number;
  offsetTop: number;
  offsetBottom: number;
  cornerRadiusPx: number;
}

/**
 * Maps independent X/Y (plus Top/Bottom asymmetric) depth percentages, vertical offset (px),
 * and feather blur (px) to outward geometric box offsets so shallower axes push their border
 * outside the viewport clip frame without creating corner miter creases.
 */
export function computeVignetteAxisOffsets(
  config: TakeoverVignetteConfig
): VignetteAxisGeometry {
  const blurPx = Math.max(20, Math.min(450, config.blurPx ?? 164));
  const depthXPct = Math.max(0, Math.min(140, config.depthXPct ?? 17));
  const depthYPct = Math.max(0, Math.min(160, config.depthYPct ?? 58));
  const depthTopPct = Math.max(0, Math.min(160, config.depthTopPct ?? depthYPct));
  const depthBottomPct = Math.max(0, Math.min(160, config.depthBottomPct ?? depthYPct));
  const verticalOffsetPx = Math.max(-360, Math.min(360, config.verticalOffsetPx ?? 0));
  const cornerRadiusPx = Math.max(0, Math.min(240, config.cornerRadiusPx ?? 0));
  const scale = blurPx * 0.012;
  const offsetX = (100 - depthXPct) * scale;
  const offsetY = (100 - depthYPct) * scale;
  const offsetTop = (100 - depthTopPct) * scale + verticalOffsetPx;
  const offsetBottom = (100 - depthBottomPct) * scale - verticalOffsetPx;
  return {
    blurPx,
    depthXPct,
    depthYPct,
    depthTopPct,
    depthBottomPct,
    verticalOffsetPx,
    offsetX,
    offsetY,
    offsetTop,
    offsetBottom,
    cornerRadiusPx,
  };
}

/**
 * Builds a smooth 4-edge gradient CSS string between Inner RGBA (t=0) and Outer RGBA (t=1).
 */
export function buildTakeoverVignetteGradient(config: TakeoverVignetteConfig): string {
  const innerAlpha = Math.max(0, Math.min(1, (config.innerIntensityPct ?? 0) / 100));
  const outerAlpha = Math.max(0, Math.min(1, config.intensityPct / 100));
  if (!config.enabled || (innerAlpha <= 0 && outerAlpha <= 0)) {
    return 'none';
  }
  const innerRgb = parseHexToRgbTuple(config.innerColor ?? config.color ?? '#000000');
  const outerRgb = parseHexToRgbTuple(config.color ?? '#000000');
  const innerStop = Math.max(0, Math.min(95, config.distancePct));
  const outerStop = Math.max(innerStop + 4, Math.min(160, config.outerReachPct));
  const span = outerStop - innerStop;

  const sampleFractions = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
  const buildEdgeStops = (depthScale: number) =>
    sampleFractions
      .map((frac) => {
        const distFromCenterPct = innerStop + frac * span;
        const posFromEdgePct = Math.max(0, (50 - distFromCenterPct * 0.5) * depthScale);
        const curveFactor = evaluateCubicBezierAtX(frac, config.curve);
        const r = Math.round(innerRgb[0] + (outerRgb[0] - innerRgb[0]) * curveFactor);
        const g = Math.round(innerRgb[1] + (outerRgb[1] - innerRgb[1]) * curveFactor);
        const b = Math.round(innerRgb[2] + (outerRgb[2] - innerRgb[2]) * curveFactor);
        const alpha = Math.min(1, (innerAlpha + (outerAlpha - innerAlpha) * curveFactor) * depthScale);
        return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)}) ${posFromEdgePct.toFixed(1)}%`;
      })
      .reverse()
      .join(', ');

  const baseDepthY = config.depthYPct ?? 58;
  const depthTopScale = Math.max(0.1, (config.depthTopPct ?? baseDepthY) / 100);
  const depthBottomScale = Math.max(0.1, (config.depthBottomPct ?? baseDepthY) / 100);
  const depthXScale = Math.max(0.1, (config.depthXPct ?? 17) / 100);
  const topStops = buildEdgeStops(depthTopScale);
  const bottomStops = buildEdgeStops(depthBottomScale);
  const xStops = buildEdgeStops(depthXScale);
  const centerStopRgba = `rgba(${innerRgb[0]}, ${innerRgb[1]}, ${innerRgb[2]}, ${innerAlpha.toFixed(3)})`;
  return [
    `linear-gradient(to bottom, ${topStops}, ${centerStopRgba} 50%)`,
    `linear-gradient(to top, ${bottomStops}, ${centerStopRgba} 50%)`,
    `linear-gradient(to right, ${xStops}, ${centerStopRgba} 50%)`,
    `linear-gradient(to left, ${xStops}, ${centerStopRgba} 50%)`,
  ].join(', ');
}

const LUT_SIZE = 1024;

function buildBezierLut(curve: TakeoverVignetteCurve): Float32Array {
  const lut = new Float32Array(LUT_SIZE);
  for (let i = 0; i < LUT_SIZE; i++) {
    const t = i / (LUT_SIZE - 1);
    lut[i] = evaluateCubicBezierAtX(t, curve);
  }
  return lut;
}

export interface TakeoverVignetteOverlayProps {
  config: TakeoverVignetteConfig;
  /** Whether the vignette is currently active (e.g., during replacing-in 3-2-1 countdown) */
  active: boolean;
  className?: string;
}

/**
 * TakeoverVignetteOverlay
 * Renders a seamless, zero-staircase rounded-rectangle vignette beneath the HUD layer (z-10, below HudAnchorStage z-20).
 * Combines symmetric X and asymmetric Top/Bottom Y outward geometric depth offsets (depthXPct, depthYPct, depthTopPct,
 * depthBottomPct, verticalOffsetPx, blurPx, cornerRadiusPx) with Dual RGBA endpoint interpolation, Cubic-Bezier falloff,
 * and 8-bit anti-banding triangular dithering.
 */
export const TakeoverVignetteOverlay: React.FC<TakeoverVignetteOverlayProps> = React.memo(
  ({ config, active, className = '' }) => {
    const frameRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const stageSizeRef = useRef<{ width: number; height: number }>({
      width: 960,
      height: 540,
    });

    const transitionMs = active ? config.fadeInMs : config.fadeOutMs;
    const innerAlpha = Math.max(0, Math.min(1, (config.innerIntensityPct ?? 0) / 100));
    const outerAlpha = Math.max(0, Math.min(1, config.intensityPct / 100));
    const isShown = active && config.enabled && (outerAlpha > 0 || innerAlpha > 0);
    const renderMode: TakeoverVignetteRenderMode = config.renderMode ?? 'sdf-smooth';

    const innerHex = config.innerColor ?? config.color ?? '#000000';
    const outerHex = config.color ?? '#000000';
    const innerRgb = parseHexToRgbTuple(innerHex);
    const outerRgb = parseHexToRgbTuple(outerHex);

    const { blurPx, offsetX, offsetTop, offsetBottom, cornerRadiusPx } =
      computeVignetteAxisOffsets(config);

    const useCanvasLayer = renderMode === 'sdf-smooth' || renderMode === 'hybrid';
    const useCssInsetLayer = renderMode === 'css-inset' || renderMode === 'hybrid';

    useEffect(() => {
      if (!useCanvasLayer) return;
      const frameEl = frameRef.current;
      const canvasEl = canvasRef.current;
      if (!frameEl || !canvasEl) return;

      const paintSdfCanvas = (stageW: number, stageH: number) => {
        const w = Math.max(64, stageW);
        const h = Math.max(64, stageH);
        const aspect = w / h;
        const texH = 270;
        const texW = Math.max(120, Math.min(640, Math.round(texH * aspect)));

        if (canvasEl.width !== texW || canvasEl.height !== texH) {
          canvasEl.width = texW;
          canvasEl.height = texH;
        }

        const ctx = canvasEl.getContext('2d');
        if (!ctx) return;

        const imgData = ctx.createImageData(texW, texH);
        const data = imgData.data;
        const lut = buildBezierLut(config.curve);

        const halfW = w * 0.5;
        const halfH = h * 0.5;

        // Expanded outer box half-extents and vertical center shift for asymmetric Top/Bottom + Vertical Offset
        const expHalfW = Math.max(32, halfW + offsetX);
        const expHalfH = Math.max(32, halfH + (offsetTop + offsetBottom) * 0.5);
        const yBoxCenter = (offsetBottom - offsetTop) * 0.5;

        // Inward feather span modulated by blurPx and distancePct
        const distPct = Math.max(0, Math.min(95, config.distancePct ?? 40));
        const openScale = (100 - distPct) / 40;
        const featherSpan = Math.max(8, 1.5 * blurPx * openScale);

        // Clear inner opening half-extents
        const innerHalfW = Math.max(0, expHalfW - featherSpan);
        const innerHalfH = Math.max(0, expHalfH - featherSpan);

        // Inner contour corner radius naturally rounds by feather dispersion so 4 corners have zero diagonal creases
        const effCornerRadius = Math.min(
          Math.max(0, Math.min(innerHalfW, innerHalfH)),
          cornerRadiusPx + featherSpan * 0.38
        );

        const boxCoreW = Math.max(0, innerHalfW - effCornerRadius);
        const boxCoreH = Math.max(0, innerHalfH - effCornerRadius);

        const reachScale = Math.max(0.25, (config.outerReachPct ?? 160) / 100);
        const invFeatherReach = 1 / Math.max(1, featherSpan * reachScale);

        const alphaScale = renderMode === 'hybrid' ? 0.68 : 1.0;
        const a0 = innerAlpha * 255 * alphaScale;
        const a1 = outerAlpha * 255 * alphaScale;
        const da = a1 - a0;

        const r0 = innerRgb[0];
        const g0 = innerRgb[1];
        const b0 = innerRgb[2];
        const dr = outerRgb[0] - r0;
        const dg = outerRgb[1] - g0;
        const db = outerRgb[2] - b0;

        const scaleX = w / texW;
        const scaleY = h / texH;
        const lutMax = LUT_SIZE - 1;

        let ptr = 0;
        for (let py = 0; py < texH; py++) {
          const y = (py + 0.5) * scaleY - halfH - yBoxCenter;
          const ay = y < 0 ? -y : y;
          const qy = ay - boxCoreH;
          const qyPos = qy > 0 ? qy : 0;
          const qyPosSq = qyPos * qyPos;

          for (let px = 0; px < texW; px++) {
            const x = (px + 0.5) * scaleX - halfW;
            const ax = x < 0 ? -x : x;
            const qx = ax - boxCoreW;
            const qxPos = qx > 0 ? qx : 0;

            const outsideDist = Math.sqrt(qxPos * qxPos + qyPosSq);
            const insideMax = qx > qy ? qx : qy;
            const insideDist = insideMax < 0 ? insideMax : 0;
            const sdf = outsideDist + insideDist - effCornerRadius;

            let rawT = 0;
            if (sdf > 0) {
              rawT = sdf * invFeatherReach;
              if (rawT > 1) rawT = 1;
            }

            // Linearly interpolate within the 1024-entry Cubic-Bezier LUT
            const lutPos = rawT * lutMax;
            const lutIdx = lutPos | 0;
            const lutFrac = lutPos - lutIdx;
            const c0 = lut[lutIdx];
            const c1 = lutIdx < lutMax ? lut[lutIdx + 1] : c0;
            const curveVal = c0 + (c1 - c0) * lutFrac;

            // Deterministic sub-LSB triangular PDF dither to eliminate 8-bit Mach banding on dark arenas
            const seed = (px * 374761393 + py * 668265263) ^ 0x5bf03635;
            const h1 = ((seed ^ (seed >> 13)) * 1274126177) & 255;
            const h2 = (((seed >> 8) ^ (seed >> 19)) * 1911520717) & 255;
            const dither = ((h1 - h2) / 255) * 0.85;

            const r = r0 + dr * curveVal + dither;
            const g = g0 + dg * curveVal + dither;
            const b = b0 + db * curveVal + dither;
            const a = a0 + da * curveVal + dither;

            data[ptr] = r < 0 ? 0 : r > 255 ? 255 : r | 0;
            data[ptr + 1] = g < 0 ? 0 : g > 255 ? 255 : g | 0;
            data[ptr + 2] = b < 0 ? 0 : b > 255 ? 255 : b | 0;
            data[ptr + 3] = a < 0 ? 0 : a > 255 ? 255 : a | 0;
            ptr += 4;
          }
        }

        ctx.putImageData(imgData, 0, 0);
      };

      const rect = frameEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        stageSizeRef.current = { width: rect.width, height: rect.height };
      }
      paintSdfCanvas(stageSizeRef.current.width, stageSizeRef.current.height);

      if (typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          if (cr.width > 0 && cr.height > 0) {
            const prev = stageSizeRef.current;
            if (
              Math.abs(cr.width - prev.width) >= 2 ||
              Math.abs(cr.height - prev.height) >= 2
            ) {
              stageSizeRef.current = { width: cr.width, height: cr.height };
              paintSdfCanvas(cr.width, cr.height);
            }
          }
        }
      });
      ro.observe(frameEl);
      return () => ro.disconnect();
    }, [
      useCanvasLayer,
      renderMode,
      blurPx,
      offsetX,
      offsetTop,
      offsetBottom,
      cornerRadiusPx,
      config.distancePct,
      config.outerReachPct,
      config.curve.p1x,
      config.curve.p1y,
      config.curve.p2x,
      config.curve.p2y,
      innerHex,
      outerHex,
      innerAlpha,
      outerAlpha,
    ]);

    // Reference HTML CSS inset box-shadow geometry
    const cssShadowAlpha = renderMode === 'hybrid' ? outerAlpha * 0.55 : outerAlpha;
    const distDelta = 60 - Math.max(0, Math.min(95, config.distancePct ?? 40));
    const cssSpreadPx = Math.round((distDelta / 60) * (blurPx * 0.35));
    const cssInsetBoxShadow =
      cssSpreadPx !== 0
        ? `inset 0 0 ${blurPx}px ${cssSpreadPx}px rgba(${outerRgb[0]}, ${outerRgb[1]}, ${outerRgb[2]}, ${cssShadowAlpha.toFixed(3)})`
        : `inset 0 0 ${blurPx}px rgba(${outerRgb[0]}, ${outerRgb[1]}, ${outerRgb[2]}, ${cssShadowAlpha.toFixed(3)})`;

    return (
      <div
        ref={frameRef}
        data-ui-element="hud-takeover-vignette"
        data-vignette-shape="rounded-rect"
        data-vignette-mode={renderMode}
        data-active={isShown ? 'true' : 'false'}
        aria-hidden="true"
        className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-10 transition-opacity ${className}`}
        style={{
          opacity: isShown ? 1 : 0,
          transitionDuration: `${Math.max(0, transitionMs)}ms`,
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          transform: 'translateZ(0)',
        }}
      >
        {useCanvasLayer && (
          <canvas
            ref={canvasRef}
            className="w-full h-full block pointer-events-none"
            style={{
              transform: 'translateZ(0)',
            }}
          />
        )}

        {useCssInsetLayer && (
          <div
            data-role="vignette-inner-box-shadow"
            className="absolute pointer-events-none"
            style={{
              left: `${(-offsetX).toFixed(1)}px`,
              right: `${(-offsetX).toFixed(1)}px`,
              top: `${(-offsetTop).toFixed(1)}px`,
              bottom: `${(-offsetBottom).toFixed(1)}px`,
              width: `calc(100% + ${(offsetX * 2).toFixed(1)}px)`,
              height: `calc(100% + ${(offsetTop + offsetBottom).toFixed(1)}px)`,
              borderRadius: `${cornerRadiusPx}px`,
              backgroundColor:
                renderMode === 'css-inset' && innerAlpha > 0
                  ? `rgba(${innerRgb[0]}, ${innerRgb[1]}, ${innerRgb[2]}, ${innerAlpha.toFixed(3)})`
                  : 'transparent',
              boxShadow: cssInsetBoxShadow,
              willChange: 'transform, box-shadow',
            }}
          />
        )}
      </div>
    );
  }
);

TakeoverVignetteOverlay.displayName = 'TakeoverVignetteOverlay';
