/**
 * ballVisualConfig.ts
 * Pure ball visual configuration schema, defaults, and sanitization helpers.
 */

export interface BallVisualConfig {
  visible: boolean;
  opacity: number;
  temporaryOpacityOverride: number | null;
  depthWriteWhenTransparent: boolean;
  doubleSideWhenTransparent: boolean;
  wireframe: boolean;
  indicatorRingOpacity: number;
  goalDarkenJitterEnabled: boolean;
  [key: string]: any;
}

export const DEFAULT_BALL_VISUAL_CONFIG: Readonly<BallVisualConfig> = Object.freeze({
  visible: true,
  opacity: 1.0,
  temporaryOpacityOverride: null,
  depthWriteWhenTransparent: false,
  doubleSideWhenTransparent: false,
  wireframe: false,
  indicatorRingOpacity: 0.2,
  goalDarkenJitterEnabled: true,
});

export function normalizeTemporaryBallOpacityOverride(opacityOrNull: number | null | undefined): number | null {
  return typeof opacityOrNull === 'number' && Number.isFinite(opacityOrNull)
    ? Math.max(0.05, Math.min(1.0, opacityOrNull))
    : null;
}

export function sanitizeBallVisualConfig(
  raw: Partial<BallVisualConfig> | null | undefined,
  base: BallVisualConfig = DEFAULT_BALL_VISUAL_CONFIG
): BallVisualConfig {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    ...base,
    ...source,
    visible: typeof source.visible === 'boolean' ? source.visible : base.visible,
    opacity:
      typeof source.opacity === 'number' && Number.isFinite(source.opacity)
        ? Math.max(0.0, Math.min(1.0, source.opacity))
        : base.opacity,
    temporaryOpacityOverride:
      source.temporaryOpacityOverride !== undefined
        ? normalizeTemporaryBallOpacityOverride(source.temporaryOpacityOverride)
        : base.temporaryOpacityOverride,
    depthWriteWhenTransparent:
      typeof source.depthWriteWhenTransparent === 'boolean'
        ? source.depthWriteWhenTransparent
        : base.depthWriteWhenTransparent,
    doubleSideWhenTransparent:
      typeof source.doubleSideWhenTransparent === 'boolean'
        ? source.doubleSideWhenTransparent
        : base.doubleSideWhenTransparent,
    wireframe: typeof source.wireframe === 'boolean' ? source.wireframe : base.wireframe,
    indicatorRingOpacity:
      typeof source.indicatorRingOpacity === 'number' && Number.isFinite(source.indicatorRingOpacity)
        ? Math.max(0.0, Math.min(1.0, source.indicatorRingOpacity))
        : base.indicatorRingOpacity,
    goalDarkenJitterEnabled:
      typeof source.goalDarkenJitterEnabled === 'boolean'
        ? source.goalDarkenJitterEnabled
        : base.goalDarkenJitterEnabled,
  };
}
