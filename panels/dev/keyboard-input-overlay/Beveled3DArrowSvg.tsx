import React from 'react';

export interface Beveled3DArrowSvgProps {
  /** Rotation angle in degrees (0 = pointing Up, 90 = pointing Right, 180 = Down, -90 = Left) */
  angleDeg: number;
  /** Primary face color of the arrow (hex or CSS color) */
  color: string;
  /** Scale multiplier inside the keycap (0.3 .. 1.5, default 0.78) */
  scale?: number;
  /** 3D extrusion depth in SVG viewBox units (0 .. 12, default 3.2) */
  extrudeDepth?: number;
  /** Shadow / bevel contrast strength (0.0 .. 1.0, default 0.68) */
  shadowIntensity?: number;
  /** Whether the parent keycap is currently pressed (slightly shifts extrusion depth) */
  isPressed?: boolean;
}

/**
 * 2.5D / 3D Beveled Directional Arrow inspired by `BallLocatorArrow.ts` (`createBallLocatorArrowMesh`).
 *
 * Uses the exact 7-vertex arrow polygon from `BallLocatorArrow.ts` (oriented with tip pointing Up at 0 deg)
 * and renders:
 * 1. A soft radial clarity halo backdrop
 * 2. Extruded 3D side bevel walls along the light/shadow vector so the arrow has genuine volumetric depth
 *    at any 360-degree camera-projected attitude angle
 * 3. A top specular bevel highlight and lit front face
 */
export const Beveled3DArrowSvg: React.FC<Beveled3DArrowSvgProps> = React.memo(
  ({
    angleDeg,
    color,
    scale = 0.78,
    extrudeDepth = 3.2,
    shadowIntensity = 0.68,
    isPressed = false,
  }) => {
    const safeScale = Math.max(0.25, Math.min(1.6, scale));
    const depth = Math.max(0, Math.min(10, extrudeDepth * (isPressed ? 0.65 : 1.0)));
    const shadowAlpha = Math.max(0, Math.min(0.95, shadowIntensity * 0.85));
    const highlightAlpha = Math.max(0, Math.min(0.9, shadowIntensity * 0.65));

    // Convert world-screen light offset (bottom-right extrusion in screen space) into local rotated arrow coordinates
    // so that as the arrow rotates 360 degrees, the 3D extrusion & shadow stay consistently lit from top-left!
    const rad = (-angleDeg * Math.PI) / 180;
    const screenDx = depth * 0.55;
    const screenDy = depth * 0.82;
    const localDx = screenDx * Math.cos(rad) - screenDy * Math.sin(rad);
    const localDy = screenDx * Math.sin(rad) + screenDy * Math.cos(rad);

    // Canonical BallLocatorArrow 7-vertex shape rotated so tip is at (0, -8.5) (pointing Up at 0 deg):
    // Tip: (0, -8.5), Right Wing Outer: (5.6, -1.5), Right Shaft Top: (2.5, -1.5),
    // Right Shaft Base: (2.5, 7.5), Left Shaft Base: (-2.5, 7.5),
    // Left Shaft Top: (-2.5, -1.5), Left Wing Outer: (-5.6, -1.5)
    const frontPoints = '0,-8.5 5.6,-1.5 2.5,-1.5 2.5,7.5 -2.5,7.5 -2.5,-1.5 -5.6,-1.5';

    const ex = (x: number) => (x + localDx).toFixed(2);
    const ey = (y: number) => (y + localDy).toFixed(2);
    const backPoints = `${ex(0)},${ey(-8.5)} ${ex(5.6)},${ey(-1.5)} ${ex(2.5)},${ey(-1.5)} ${ex(2.5)},${ey(7.5)} ${ex(-2.5)},${ey(7.5)} ${ex(-2.5)},${ey(-1.5)} ${ex(-5.6)},${ey(-1.5)}`;

    return (
      <svg
        viewBox="-16 -16 32 32"
        className="w-full h-full overflow-visible pointer-events-none select-none"
        style={{
          transform: `rotate(${angleDeg.toFixed(1)}deg) scale(${safeScale.toFixed(3)})`,
          filter:
            shadowIntensity > 0.02
              ? `drop-shadow(0px ${(1.8 * shadowIntensity).toFixed(1)}px ${(2.8 * shadowIntensity).toFixed(1)}px rgba(0,0,0,${(shadowAlpha * 0.75).toFixed(2)}))`
              : undefined,
        }}
      >
        {/* 1. Extruded 3D Shadow / Bevel Side Volume */}
        {depth > 0.05 && (
          <>
            <polygon
              points={backPoints}
              fill={`rgba(8, 10, 16, ${shadowAlpha.toFixed(3)})`}
              stroke={`rgba(8, 10, 16, ${shadowAlpha.toFixed(3)})`}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Connecting 3D bevel side quads between front & extruded back */}
            <polygon
              points={`0,-8.5 5.6,-1.5 ${ex(5.6)},${ey(-1.5)} ${ex(0)},${ey(-8.5)}`}
              fill={`rgba(12, 16, 24, ${(shadowAlpha * 0.9).toFixed(3)})`}
            />
            <polygon
              points={`2.5,-1.5 2.5,7.5 ${ex(2.5)},${ey(7.5)} ${ex(2.5)},${ey(-1.5)}`}
              fill={`rgba(10, 14, 22, ${(shadowAlpha * 0.92).toFixed(3)})`}
            />
            <polygon
              points={`2.5,7.5 -2.5,7.5 ${ex(-2.5)},${ey(7.5)} ${ex(2.5)},${ey(7.5)}`}
              fill={`rgba(6, 8, 14, ${shadowAlpha.toFixed(3)})`}
            />
            <polygon
              points={`-5.6,-1.5 0,-8.5 ${ex(0)},${ey(-8.5)} ${ex(-5.6)},${ey(-1.5)}`}
              fill={`rgba(20, 24, 34, ${(shadowAlpha * 0.78).toFixed(3)})`}
            />
          </>
        )}

        {/* 2. Main Beveled Arrow Face */}
        <polygon
          points={frontPoints}
          fill={color}
          stroke={`rgba(0, 0, 0, ${(shadowAlpha * 0.7).toFixed(3)})`}
          strokeWidth="0.85"
          strokeLinejoin="round"
        />

        {/* 3. Inner Top-Left Bevel Specular Highlight Ridge for 3D Relief */}
        {highlightAlpha > 0.02 && (
          <polyline
            points="-4.2,-1.9 0,-7.2 4.2,-1.9"
            fill="none"
            stroke={`rgba(255, 255, 255, ${highlightAlpha.toFixed(3)})`}
            strokeWidth="1.05"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    );
  }
);

Beveled3DArrowSvg.displayName = 'Beveled3DArrowSvg';
export default Beveled3DArrowSvg;
