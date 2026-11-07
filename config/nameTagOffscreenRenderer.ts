/**
 * nameTagOffscreenRenderer.ts
 * 2D Canvas renderer for Offscreen Car Indicators (circle + directional arrow + boost fill + aerial alert).
 */

import {
  DEFAULT_NAME_TAG_CONFIG,
  type NameTagConfig,
} from './nameTagConfig';
import {
  clampRayToRoiBoundary2D,
  computeOffscreenRoiBounds2D,
  drawAerialClimbInwardRing2D,
  drawAerialClimbOuterGlow2D,
  hexToRgba,
  mixHexColors,
  parseHexRgb,
  resolveActiveBoostFillColor,
  resolveAerialClimbInwardFillFraction,
  resolveCarColorPalette,
  resolveUnfilledBaseHexColor,
  type NameTagRoiBounds2D,
} from './nameTagColorAndRoiMath';

export {
  clampRayToRoiBoundary2D,
  computeOffscreenRoiBounds2D,
  drawAerialClimbInwardRing2D,
  drawAerialClimbOuterGlow2D,
  hexToRgba,
  mixHexColors,
  parseHexRgb,
  resolveActiveBoostFillColor,
  resolveAerialClimbInwardFillFraction,
  resolveCarColorPalette,
  resolveUnfilledBaseHexColor,
  type NameTagRoiBounds2D,
};

export interface NameTagOffscreenIndicatorCard2D {
  carIndex: number;
  team: 0 | 1;
  cameraDistanceSq: number;
  centerX: number;
  centerY: number;
  angleRad: number;
  circleRadiusPx: number;
  arrowLengthPx: number;
  arrowBaseWidthPx: number;
  arrowGapPx: number;
  borderW: number;
  opacity: number;
  bgOpacity: number;
  bgColor: string;
  borderColor: string;
  textColor?: string;
  labelText?: string;
  fontFamilyCss?: string;
  fontWeight?: number;
  showBoostCircle: boolean;
  showArrow: boolean;
  boostBorderVisible: boolean;
  boostFraction: number;
  boostBorderColor: string;
  aerialClimbGlowVisible: boolean;
}

export function drawOffscreenIndicatorCard2D(
  ctx: CanvasRenderingContext2D,
  indicator: NameTagOffscreenIndicatorCard2D,
  config: Pick<
    NameTagConfig,
    | 'boostIndicatorMode'
    | 'boostFillOpacity'
    | 'boostUnfilledBgOpacity'
    | 'boostShowHorizonLine'
    | 'aerialClimbGlowColor'
    | 'aerialClimbGlowRadiusPx'
    | 'aerialClimbGlowOpacity'
  >
): void {
  const {
    centerX,
    centerY,
    angleRad,
    circleRadiusPx,
    arrowLengthPx,
    arrowBaseWidthPx,
    arrowGapPx,
    borderW,
    opacity,
    bgOpacity,
    bgColor,
    borderColor,
    showBoostCircle,
    showArrow,
    boostBorderVisible,
    boostFraction,
    boostBorderColor,
    aerialClimbGlowVisible,
  } = indicator;

  if (!showBoostCircle && !showArrow) return;

  const clampedBoost = Math.max(0, Math.min(1, boostFraction));
  const boostFillAlpha = Math.max(
    0.05,
    Math.min(1, config.boostFillOpacity ?? DEFAULT_NAME_TAG_CONFIG.boostFillOpacity)
  );
  const unfilledAlpha = Math.max(
    0,
    Math.min(
      1,
      config.boostUnfilledBgOpacity ?? DEFAULT_NAME_TAG_CONFIG.boostUnfilledBgOpacity
    )
  );
  const showHorizon =
    config.boostShowHorizonLine ?? DEFAULT_NAME_TAG_CONFIG.boostShowHorizonLine;

  const alertColor =
    config.aerialClimbGlowColor || DEFAULT_NAME_TAG_CONFIG.aerialClimbGlowColor;
  const alertOpacity = Math.max(
    0.1,
    Math.min(
      1.0,
      Number(config.aerialClimbGlowOpacity) ??
        DEFAULT_NAME_TAG_CONFIG.aerialClimbGlowOpacity
    )
  );

  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  const perpX = -sinA;
  const perpY = cosA;

  const baseDist = showBoostCircle ? circleRadiusPx + arrowGapPx : 0;
  const tipDist = baseDist + arrowLengthPx;
  const halfBaseW = arrowBaseWidthPx * 0.5;

  const tipX = centerX + cosA * tipDist;
  const tipY = centerY + sinA * tipDist;
  const baseCenterX = centerX + cosA * baseDist;
  const baseCenterY = centerY + sinA * baseDist;
  const baseLeftX = baseCenterX + perpX * halfBaseW;
  const baseLeftY = baseCenterY + perpY * halfBaseW;
  const baseRightX = baseCenterX - perpX * halfBaseW;
  const baseRightY = baseCenterY - perpY * halfBaseW;

  ctx.save();
  ctx.globalAlpha = opacity;

  if (showBoostCircle) {
    const circleDia = circleRadiusPx * 2;
    const unfilledHex = resolveUnfilledBaseHexColor(bgColor);
    const activeFillHex = resolveActiveBoostFillColor(bgColor, boostBorderColor);

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadiusPx, 0, Math.PI * 2);
    ctx.clip();

    if (boostBorderVisible) {
      ctx.fillStyle = hexToRgba(unfilledHex, unfilledAlpha);
      ctx.fillRect(
        centerX - circleRadiusPx,
        centerY - circleRadiusPx,
        circleDia,
        circleDia
      );

      if (clampedBoost > 0.001) {
        const fillH = circleDia * clampedBoost;
        const fillTop = centerY + circleRadiusPx - fillH;
        ctx.fillStyle = hexToRgba(activeFillHex, boostFillAlpha);
        ctx.fillRect(centerX - circleRadiusPx, fillTop, circleDia, fillH);

        if (showHorizon && clampedBoost > 0.02 && clampedBoost < 0.98) {
          ctx.beginPath();
          ctx.moveTo(centerX - circleRadiusPx, fillTop);
          ctx.lineTo(centerX + circleRadiusPx, fillTop);
          ctx.lineWidth = Math.max(1.25, borderW * 0.55);
          ctx.strokeStyle = boostBorderColor;
          ctx.stroke();
        }
      }
    } else {
      ctx.fillStyle = hexToRgba(bgColor, bgOpacity);
      ctx.fillRect(
        centerX - circleRadiusPx,
        centerY - circleRadiusPx,
        circleDia,
        circleDia
      );
    }

    if (aerialClimbGlowVisible) {
      drawAerialClimbInwardRing2D(ctx, centerX, centerY, circleRadiusPx, config);
    }
    ctx.restore();

    if (borderW > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, circleRadiusPx, 0, Math.PI * 2);
      ctx.lineWidth = borderW;
      ctx.strokeStyle = aerialClimbGlowVisible
        ? hexToRgba(alertColor, alertOpacity)
        : borderColor;
      ctx.stroke();

      if (!aerialClimbGlowVisible && boostBorderVisible && clampedBoost > 0.001) {
        const outerExtent = circleRadiusPx + borderW;
        const fillH = circleDia * clampedBoost;
        const fillTop = centerY + circleRadiusPx - fillH;
        const clipTop =
          clampedBoost >= 0.999 ? centerY - outerExtent : fillTop;
        const clipBottom = centerY + outerExtent;

        ctx.save();
        ctx.beginPath();
        ctx.rect(
          centerX - outerExtent,
          clipTop,
          outerExtent * 2,
          Math.max(0, clipBottom - clipTop)
        );
        ctx.clip();

        ctx.beginPath();
        ctx.arc(centerX, centerY, circleRadiusPx, 0, Math.PI * 2);
        ctx.lineWidth = borderW;
        ctx.strokeStyle = boostBorderColor;
        ctx.stroke();
        ctx.restore();
      }
    }

    if (indicator.labelText) {
      const fontPx = Math.max(9, circleRadiusPx * 0.72);
      const fontFamily =
        indicator.fontFamilyCss ||
        '"JetBrains Mono", "SF Mono", ui-monospace, monospace';
      const weight = indicator.fontWeight || 700;
      ctx.save();
      ctx.font = `${weight} ${fontPx.toFixed(1)}px ${fontFamily}`;
      ctx.fillStyle = indicator.textColor || '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = 3;
      ctx.fillText(
        indicator.labelText,
        centerX,
        centerY + fontPx * 0.04,
        circleRadiusPx * 1.65
      );
      ctx.restore();
    }
  }

  if (showArrow) {
    const arrowFillHex = aerialClimbGlowVisible
      ? alertColor
      : boostBorderVisible && clampedBoost > 0.02
        ? resolveActiveBoostFillColor(bgColor, boostBorderColor)
        : bgColor;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(baseLeftX, baseLeftY);
    ctx.lineTo(baseRightX, baseRightY);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(
      arrowFillHex,
      aerialClimbGlowVisible
        ? alertOpacity
        : boostBorderVisible
          ? Math.max(bgOpacity, boostFillAlpha * 0.9)
          : bgOpacity
    );
    ctx.fill();

    if (borderW > 0) {
      ctx.lineWidth = Math.max(1.25, borderW * 0.75);
      ctx.strokeStyle = aerialClimbGlowVisible
        ? hexToRgba(alertColor, alertOpacity)
        : boostBorderVisible && clampedBoost > 0.02
          ? boostBorderColor
          : borderColor;
      ctx.stroke();
    }
  }

  ctx.restore();
}
