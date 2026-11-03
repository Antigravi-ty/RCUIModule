/**
 * driftwoodsConfig.ts
 * Schema definitions, config merging helpers, OKLCH perceptual color utilities,
 * and preset accessors for the Driftwoods stadium.
 * Raw configuration data is externalized to driftwoods.default.json, driftwoods.presets.json, and groundQ1Manifest.json.
 */

import defaultConfigJson from './driftwoods.default.json' with { type: 'json' };
import presetsJson from './driftwoods.presets.json' with { type: 'json' };
import groundQ1ManifestJson from './groundQ1Manifest.json' with { type: 'json' };

export type DriftwoodsGroundTextureMode = 'original' | 'q1-7gray';

export type DriftwoodsQ1LayerId = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';

export interface DriftwoodsQ1LayerColors {
  L0: string;
  L1: string;
  L2: string;
  L3: string;
  L4: string;
  L5: string;
  L6: string;
}

export interface DriftwoodsQ1LayerOpacities {
  L0: number;
  L1: number;
  L2: number;
  L3: number;
  L4: number;
  L5: number;
  L6: number;
}

import {
  type OklchColor,
  type OklabColor,
  type LinearRgbColor,
  hexToLinearRgb,
  linearRgbToHex,
  hexToOklab,
  oklabToLinearRgb,
  oklchToLinearRgb,
  oklchToHex,
  hexToOklch,
  setHexOklchLightness,
  mixDecalOverBaseOklab,
} from './driftwoodsColorMath';

export {
  type OklchColor,
  type OklabColor,
  type LinearRgbColor,
  hexToLinearRgb,
  linearRgbToHex,
  hexToOklab,
  oklabToLinearRgb,
  oklchToLinearRgb,
  oklchToHex,
  hexToOklch,
  setHexOklchLightness,
  mixDecalOverBaseOklab,
};

export interface DriftwoodsQ1LayerSpec {
  id: DriftwoodsQ1LayerId;
  name: string;
  centerGray: number;
  normalizedValue: number;
  grayRange: [number, number];
  normalizedRange: [number, number];
  defaultColor: string;
  defaultOpacity?: number;
}

export interface DriftwoodsQ1Manifest {
  texture: string;
  url: string;
  resolution: {
    width: number;
    height: number;
  };
  spatialMapping: {
    quadrant: string;
    uvOriginTopLeft: { u: number; v: number; worldX: number; worldY: number };
    uvExtentBottomRight: { u: number; v: number; worldX: number; worldY: number };
    worldBoundsUu: {
      x: [number, number];
      y: [number, number];
      goalDepthRangeY: [number, number];
    };
    wrapMode: string;
    uvFormula: { u: string; v: string };
  };
  layers: DriftwoodsQ1LayerSpec[];
}

export const GROUND_Q1_MANIFEST: DriftwoodsQ1Manifest =
  groundQ1ManifestJson as unknown as DriftwoodsQ1Manifest;

export const DEFAULT_Q1_LAYER_COLORS: DriftwoodsQ1LayerColors = {
  L0: '#1b4a00',
  L1: '#ffffff',
  L2: '#ffffff',
  L3: '#ffffff',
  L4: '#454545',
  L5: '#ffffff',
  L6: '#f87171',
};

export const DEFAULT_Q1_LAYER_OPACITIES: DriftwoodsQ1LayerOpacities = {
  L0: 1.0,
  L1: 0.5,
  L2: 0.4,
  L3: 0.5,
  L4: 0.3,
  L5: 0.7,
  L6: 0.3,
};

export interface DriftwoodsLayerConfig {
  color: string;
  roughness: number;
  metalness: number;
  opacity?: number;
  visible: boolean;
  wireframe: boolean;
  emissive?: string;
  emissiveIntensity?: number;
  useTeamColor?: boolean;
  oneWaySeeThrough?: boolean;
}

export interface DriftwoodsGroundConfig {
  textureMode?: DriftwoodsGroundTextureMode;
  groundColor: string;
  lineColor: string;
  lineOpacity?: number;
  q1Colors?: DriftwoodsQ1LayerColors;
  q1Opacities?: DriftwoodsQ1LayerOpacities;
  l4UseTeamColor?: boolean;
  l5UseTeamColor?: boolean;
  l6UseTeamColor?: boolean;
  oklchSyncEnabled?: boolean;
  oklchMarkingsLightness?: number;
  oklchTeamLightness?: number;
  oklchGoalLightness?: number;
  oklchGoalPostsGlowLightness?: number;
  oklchRampsUpperOuterLightness?: number;
  oklchHexLightness?: number;
  oklchTeamChroma?: number;
  oklchBlueHue?: number;
  oklchOrangeHue?: number;
  oklchGroundIndependentCH?: boolean;
  oklchGroundChroma?: number;
  oklchGroundBlueHue?: number;
  oklchGroundOrangeHue?: number;
  oklchGoalIndependentCH?: boolean;
  oklchGoalChroma?: number;
  oklchGoalBlueHue?: number;
  oklchGoalOrangeHue?: number;
  oklchGoalPostsGlowIndependentCH?: boolean;
  oklchGoalPostsGlowChroma?: number;
  oklchGoalPostsGlowBlueHue?: number;
  oklchGoalPostsGlowOrangeHue?: number;
  oklchRampsUpperOuterIndependentCH?: boolean;
  oklchRampsUpperOuterChroma?: number;
  oklchRampsUpperOuterBlueHue?: number;
  oklchRampsUpperOuterOrangeHue?: number;
  oklchHexIndependentCH?: boolean;
  oklchHexChroma?: number;
  oklchHexBlueHue?: number;
  oklchHexOrangeHue?: number;
  blueTeamLineColor?: string;
  orangeTeamLineColor?: string;
  q1ScaleX?: number;
  q1ScaleY?: number;
  q1OffsetX?: number;
  q1OffsetY?: number;
  roughness: number;
  metalness: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  linkScale: boolean;
  visible: boolean;
  wireframe: boolean;
  magFilter?: 'linear' | 'nearest';
  anisotropy?: number;
  lineThreshold?: number;
  lineSmoothness?: number;
  originalLineThreshold?: number;
  originalLineSmoothness?: number;
}

export interface DriftwoodsTunerConfig {
  fastDiffuse: boolean;
  specularAA?: boolean;
  specularAAStrength?: number;
  occlusionOpacity?: number;
  wallExteriorOcclusion?: boolean;
  goalDepthMaskEnabled?: boolean;
  goalMaskOffsetUu?: number;
  goalMaskGradientDistanceUu?: number;
  goalMaskBezierP1X?: number;
  goalMaskBezierP1Y?: number;
  goalMaskBezierP2X?: number;
  goalMaskBezierP2Y?: number;
  ground: DriftwoodsGroundConfig;
  ramps: DriftwoodsLayerConfig;
  rampsUpperOuter: DriftwoodsLayerConfig;
  rampsTrim: DriftwoodsLayerConfig;
  wallPosts: DriftwoodsLayerConfig;
  goalFrame: DriftwoodsLayerConfig;
  goalPosts: DriftwoodsLayerConfig;
  goalPostsGlow: DriftwoodsLayerConfig;
  walls: DriftwoodsLayerConfig;
  goalNet: DriftwoodsLayerConfig;
  hexes: DriftwoodsLayerConfig;
}

export interface DriftwoodsPreset {
  id: string;
  name: string;
  description: string;
  config: DriftwoodsTunerConfig;
}

export const DEFAULT_DRIFTWOODS_CONFIG: DriftwoodsTunerConfig =
  defaultConfigJson as DriftwoodsTunerConfig;

export const DRIFTWOODS_PRESETS: DriftwoodsPreset[] = [
  {
    id: 'q1-7gray-tactical',
    name: 'Q1 7-Layer Tactical Mask',
    description:
      '4-quadrant mirrored Q1 RGBA decal mask (2048x3000, 16x AF) with OKLCH perceptual palette & L0-L6 opacity.',
    config: DEFAULT_DRIFTWOODS_CONFIG,
  },
  {
    id: 'classic-wood',
    name: 'Classic Driftwoods (Original)',
    description:
      'Authentic Rocket League wooden ramps, golden trims, cyan glass, and lush green 2-color pitch.',
    config: {
      ...DEFAULT_DRIFTWOODS_CONFIG,
      ground: {
        ...DEFAULT_DRIFTWOODS_CONFIG.ground,
        textureMode: 'original',
        anisotropy: 16,
        originalLineThreshold: 0.0921,
        originalLineSmoothness: 0.0364,
      },
    },
  },
  ...(presetsJson as DriftwoodsPreset[]).map((preset) => ({
    ...preset,
    config: mergeDriftwoodsConfig(DEFAULT_DRIFTWOODS_CONFIG, {
      ...preset.config,
      ground: {
        ...DEFAULT_DRIFTWOODS_CONFIG.ground,
        ...preset.config.ground,
        textureMode: preset.config.ground?.textureMode ?? 'original',
        anisotropy: preset.config.ground?.anisotropy ?? 16,
        q1Colors: {
          ...DEFAULT_Q1_LAYER_COLORS,
          ...(preset.config.ground?.q1Colors || {}),
        },
        q1Opacities: {
          ...DEFAULT_Q1_LAYER_OPACITIES,
          ...(preset.config.ground?.q1Opacities || {}),
        },
      },
    }),
  })),
];

export function cloneDriftwoodsConfig(
  config: DriftwoodsTunerConfig = DEFAULT_DRIFTWOODS_CONFIG
): DriftwoodsTunerConfig {
  return JSON.parse(JSON.stringify(config));
}

export function mergeDriftwoodsConfig(
  base: DriftwoodsTunerConfig,
  patch?: Partial<DriftwoodsTunerConfig> | null
): DriftwoodsTunerConfig {
  if (!patch) return cloneDriftwoodsConfig(base);
  const baseQ1Colors = {
    ...DEFAULT_Q1_LAYER_COLORS,
    ...(base.ground?.q1Colors || {}),
  };
  const baseQ1Opacities = {
    ...DEFAULT_Q1_LAYER_OPACITIES,
    ...(base.ground?.q1Opacities || {}),
  };
  const baseRampsUpperOuter = base.rampsUpperOuter || DEFAULT_DRIFTWOODS_CONFIG.rampsUpperOuter;
  const baseGoalPostsGlow = base.goalPostsGlow || DEFAULT_DRIFTWOODS_CONFIG.goalPostsGlow;
  return {
    ...base,
    fastDiffuse: patch.fastDiffuse !== undefined ? Boolean(patch.fastDiffuse) : (base.fastDiffuse ?? true),
    specularAA:
      patch.specularAA !== undefined ? Boolean(patch.specularAA) : (base.specularAA ?? true),
    specularAAStrength:
      patch.specularAAStrength ?? base.specularAAStrength ?? 1.0,
    occlusionOpacity:
      patch.occlusionOpacity ?? base.occlusionOpacity ?? 0.4,
    wallExteriorOcclusion:
      patch.wallExteriorOcclusion !== undefined
        ? Boolean(patch.wallExteriorOcclusion)
        : (base.wallExteriorOcclusion ?? true),
    goalDepthMaskEnabled:
      patch.goalDepthMaskEnabled !== undefined
        ? Boolean(patch.goalDepthMaskEnabled)
        : (base.goalDepthMaskEnabled ?? true),
    goalMaskOffsetUu:
      patch.goalMaskOffsetUu ?? base.goalMaskOffsetUu ?? 250,
    goalMaskGradientDistanceUu:
      patch.goalMaskGradientDistanceUu ?? base.goalMaskGradientDistanceUu ?? 500,
    goalMaskBezierP1X:
      patch.goalMaskBezierP1X ?? base.goalMaskBezierP1X ?? 0.27,
    goalMaskBezierP1Y:
      patch.goalMaskBezierP1Y ?? base.goalMaskBezierP1Y ?? 0.06,
    goalMaskBezierP2X:
      patch.goalMaskBezierP2X ?? base.goalMaskBezierP2X ?? 0.26,
    goalMaskBezierP2Y:
      patch.goalMaskBezierP2Y ?? base.goalMaskBezierP2Y ?? 0.73,
    ground: patch.ground
      ? {
          ...base.ground,
          ...patch.ground,
          textureMode: patch.ground.textureMode ?? base.ground.textureMode ?? 'q1-7gray',
          lineOpacity: patch.ground.lineOpacity ?? base.ground.lineOpacity ?? 0.85,
          q1Colors: {
            ...baseQ1Colors,
            ...(patch.ground.q1Colors || {}),
          },
          q1Opacities: {
            ...baseQ1Opacities,
            ...(patch.ground.q1Opacities || {}),
          },
          l4UseTeamColor: patch.ground.l4UseTeamColor ?? base.ground.l4UseTeamColor ?? true,
          l5UseTeamColor: patch.ground.l5UseTeamColor ?? base.ground.l5UseTeamColor ?? true,
          l6UseTeamColor: patch.ground.l6UseTeamColor ?? base.ground.l6UseTeamColor ?? true,
          oklchSyncEnabled:
            patch.ground.oklchSyncEnabled ?? base.ground.oklchSyncEnabled ?? true,
          oklchMarkingsLightness:
            patch.ground.oklchMarkingsLightness ?? base.ground.oklchMarkingsLightness ?? 0.96,
          oklchTeamLightness:
            patch.ground.oklchTeamLightness ?? base.ground.oklchTeamLightness ?? 0.7,
          oklchGoalLightness:
            patch.ground.oklchGoalLightness ?? base.ground.oklchGoalLightness ?? 0.582,
          oklchGoalPostsGlowLightness:
            patch.ground.oklchGoalPostsGlowLightness ??
            base.ground.oklchGoalPostsGlowLightness ??
            0.65,
          oklchRampsUpperOuterLightness:
            patch.ground.oklchRampsUpperOuterLightness ??
            base.ground.oklchRampsUpperOuterLightness ??
            0.5,
          oklchHexLightness:
            patch.ground.oklchHexLightness ?? base.ground.oklchHexLightness ?? 0.65,
          oklchTeamChroma:
            patch.ground.oklchTeamChroma ?? base.ground.oklchTeamChroma ?? 0.19,
          oklchBlueHue: patch.ground.oklchBlueHue ?? base.ground.oklchBlueHue ?? 250,
          oklchOrangeHue: patch.ground.oklchOrangeHue ?? base.ground.oklchOrangeHue ?? 45,
          oklchGroundIndependentCH:
            patch.ground.oklchGroundIndependentCH ??
            base.ground.oklchGroundIndependentCH ??
            false,
          oklchGroundChroma:
            patch.ground.oklchGroundChroma ?? base.ground.oklchGroundChroma ?? 0.19,
          oklchGroundBlueHue:
            patch.ground.oklchGroundBlueHue ?? base.ground.oklchGroundBlueHue ?? 250,
          oklchGroundOrangeHue:
            patch.ground.oklchGroundOrangeHue ?? base.ground.oklchGroundOrangeHue ?? 45,
          oklchGoalIndependentCH:
            patch.ground.oklchGoalIndependentCH ?? base.ground.oklchGoalIndependentCH ?? false,
          oklchGoalChroma:
            patch.ground.oklchGoalChroma ?? base.ground.oklchGoalChroma ?? 0.19,
          oklchGoalBlueHue:
            patch.ground.oklchGoalBlueHue ?? base.ground.oklchGoalBlueHue ?? 250,
          oklchGoalOrangeHue:
            patch.ground.oklchGoalOrangeHue ?? base.ground.oklchGoalOrangeHue ?? 45,
          oklchGoalPostsGlowIndependentCH:
            patch.ground.oklchGoalPostsGlowIndependentCH ??
            base.ground.oklchGoalPostsGlowIndependentCH ??
            false,
          oklchGoalPostsGlowChroma:
            patch.ground.oklchGoalPostsGlowChroma ??
            base.ground.oklchGoalPostsGlowChroma ??
            0.19,
          oklchGoalPostsGlowBlueHue:
            patch.ground.oklchGoalPostsGlowBlueHue ??
            base.ground.oklchGoalPostsGlowBlueHue ??
            250,
          oklchGoalPostsGlowOrangeHue:
            patch.ground.oklchGoalPostsGlowOrangeHue ??
            base.ground.oklchGoalPostsGlowOrangeHue ??
            45,
          oklchRampsUpperOuterIndependentCH:
            patch.ground.oklchRampsUpperOuterIndependentCH ??
            base.ground.oklchRampsUpperOuterIndependentCH ??
            true,
          oklchRampsUpperOuterChroma:
            patch.ground.oklchRampsUpperOuterChroma ??
            base.ground.oklchRampsUpperOuterChroma ??
            0.1,
          oklchRampsUpperOuterBlueHue:
            patch.ground.oklchRampsUpperOuterBlueHue ??
            base.ground.oklchRampsUpperOuterBlueHue ??
            250,
          oklchRampsUpperOuterOrangeHue:
            patch.ground.oklchRampsUpperOuterOrangeHue ??
            base.ground.oklchRampsUpperOuterOrangeHue ??
            45,
          oklchHexIndependentCH:
            patch.ground.oklchHexIndependentCH ?? base.ground.oklchHexIndependentCH ?? true,
          oklchHexChroma:
            patch.ground.oklchHexChroma ?? base.ground.oklchHexChroma ?? 0.32,
          oklchHexBlueHue:
            patch.ground.oklchHexBlueHue ?? base.ground.oklchHexBlueHue ?? 250,
          oklchHexOrangeHue:
            patch.ground.oklchHexOrangeHue ?? base.ground.oklchHexOrangeHue ?? 45,
          blueTeamLineColor:
            patch.ground.blueTeamLineColor ?? base.ground.blueTeamLineColor ?? '#3fa3ff',
          orangeTeamLineColor:
            patch.ground.orangeTeamLineColor ?? base.ground.orangeTeamLineColor ?? '#fa6e1d',
          q1ScaleX: patch.ground.q1ScaleX ?? base.ground.q1ScaleX ?? 1,
          q1ScaleY: patch.ground.q1ScaleY ?? base.ground.q1ScaleY ?? 1,
          q1OffsetX: patch.ground.q1OffsetX ?? base.ground.q1OffsetX ?? 0,
          q1OffsetY: patch.ground.q1OffsetY ?? base.ground.q1OffsetY ?? 0,
          anisotropy: patch.ground.anisotropy ?? base.ground.anisotropy ?? 4,
          lineThreshold: patch.ground.lineThreshold ?? base.ground.lineThreshold ?? 0.35,
          lineSmoothness: patch.ground.lineSmoothness ?? base.ground.lineSmoothness ?? 0.15,
          originalLineThreshold:
            patch.ground.originalLineThreshold ?? base.ground.originalLineThreshold ?? 0.0921,
          originalLineSmoothness:
            patch.ground.originalLineSmoothness ?? base.ground.originalLineSmoothness ?? 0.0364,
        }
      : {
          ...base.ground,
          textureMode: base.ground.textureMode ?? 'q1-7gray',
          lineOpacity: base.ground.lineOpacity ?? 0.85,
          q1Colors: baseQ1Colors,
          q1Opacities: baseQ1Opacities,
          l4UseTeamColor: base.ground.l4UseTeamColor ?? true,
          l5UseTeamColor: base.ground.l5UseTeamColor ?? true,
          l6UseTeamColor: base.ground.l6UseTeamColor ?? true,
          oklchSyncEnabled: base.ground.oklchSyncEnabled ?? true,
          oklchMarkingsLightness: base.ground.oklchMarkingsLightness ?? 0.96,
          oklchTeamLightness: base.ground.oklchTeamLightness ?? 0.7,
          oklchGoalLightness: base.ground.oklchGoalLightness ?? 0.582,
          oklchGoalPostsGlowLightness: base.ground.oklchGoalPostsGlowLightness ?? 0.65,
          oklchRampsUpperOuterLightness: base.ground.oklchRampsUpperOuterLightness ?? 0.5,
          oklchHexLightness: base.ground.oklchHexLightness ?? 0.65,
          oklchTeamChroma: base.ground.oklchTeamChroma ?? 0.19,
          oklchBlueHue: base.ground.oklchBlueHue ?? 250,
          oklchOrangeHue: base.ground.oklchOrangeHue ?? 45,
          oklchGroundIndependentCH: base.ground.oklchGroundIndependentCH ?? false,
          oklchGroundChroma: base.ground.oklchGroundChroma ?? 0.19,
          oklchGroundBlueHue: base.ground.oklchGroundBlueHue ?? 250,
          oklchGroundOrangeHue: base.ground.oklchGroundOrangeHue ?? 45,
          oklchGoalIndependentCH: base.ground.oklchGoalIndependentCH ?? false,
          oklchGoalChroma: base.ground.oklchGoalChroma ?? 0.19,
          oklchGoalBlueHue: base.ground.oklchGoalBlueHue ?? 250,
          oklchGoalOrangeHue: base.ground.oklchGoalOrangeHue ?? 45,
          oklchGoalPostsGlowIndependentCH:
            base.ground.oklchGoalPostsGlowIndependentCH ?? false,
          oklchGoalPostsGlowChroma: base.ground.oklchGoalPostsGlowChroma ?? 0.19,
          oklchGoalPostsGlowBlueHue: base.ground.oklchGoalPostsGlowBlueHue ?? 250,
          oklchGoalPostsGlowOrangeHue: base.ground.oklchGoalPostsGlowOrangeHue ?? 45,
          oklchRampsUpperOuterIndependentCH:
            base.ground.oklchRampsUpperOuterIndependentCH ?? true,
          oklchRampsUpperOuterChroma: base.ground.oklchRampsUpperOuterChroma ?? 0.1,
          oklchRampsUpperOuterBlueHue: base.ground.oklchRampsUpperOuterBlueHue ?? 250,
          oklchRampsUpperOuterOrangeHue: base.ground.oklchRampsUpperOuterOrangeHue ?? 45,
          oklchHexIndependentCH: base.ground.oklchHexIndependentCH ?? true,
          oklchHexChroma: base.ground.oklchHexChroma ?? 0.32,
          oklchHexBlueHue: base.ground.oklchHexBlueHue ?? 250,
          oklchHexOrangeHue: base.ground.oklchHexOrangeHue ?? 45,
          blueTeamLineColor: base.ground.blueTeamLineColor ?? '#3fa3ff',
          orangeTeamLineColor: base.ground.orangeTeamLineColor ?? '#fa6e1d',
          q1ScaleX: base.ground.q1ScaleX ?? 1,
          q1ScaleY: base.ground.q1ScaleY ?? 1,
          q1OffsetX: base.ground.q1OffsetX ?? 0,
          q1OffsetY: base.ground.q1OffsetY ?? 0,
          anisotropy: base.ground.anisotropy ?? 4,
          lineThreshold: base.ground.lineThreshold ?? 0.35,
          lineSmoothness: base.ground.lineSmoothness ?? 0.15,
          originalLineThreshold: base.ground.originalLineThreshold ?? 0.0921,
          originalLineSmoothness: base.ground.originalLineSmoothness ?? 0.0364,
        },
    ramps: patch.ramps ? { ...base.ramps, ...patch.ramps } : { ...base.ramps },
    rampsUpperOuter: patch.rampsUpperOuter
      ? {
          ...baseRampsUpperOuter,
          ...patch.rampsUpperOuter,
          useTeamColor:
            patch.rampsUpperOuter.useTeamColor ?? baseRampsUpperOuter.useTeamColor ?? true,
          oneWaySeeThrough:
            patch.rampsUpperOuter.oneWaySeeThrough ?? baseRampsUpperOuter.oneWaySeeThrough ?? true,
        }
      : {
          ...baseRampsUpperOuter,
          useTeamColor: baseRampsUpperOuter.useTeamColor ?? true,
          oneWaySeeThrough: baseRampsUpperOuter.oneWaySeeThrough ?? true,
        },
    rampsTrim: patch.rampsTrim ? { ...base.rampsTrim, ...patch.rampsTrim } : { ...base.rampsTrim },
    wallPosts: patch.wallPosts ? { ...base.wallPosts, ...patch.wallPosts } : { ...base.wallPosts },
    goalFrame: patch.goalFrame
      ? {
          ...base.goalFrame,
          ...patch.goalFrame,
          useTeamColor: patch.goalFrame.useTeamColor ?? base.goalFrame.useTeamColor ?? false,
        }
      : {
          ...base.goalFrame,
          useTeamColor: base.goalFrame.useTeamColor ?? false,
        },
    goalPosts: patch.goalPosts
      ? {
          ...base.goalPosts,
          ...patch.goalPosts,
          useTeamColor: patch.goalPosts.useTeamColor ?? base.goalPosts.useTeamColor ?? false,
        }
      : {
          ...base.goalPosts,
          useTeamColor: base.goalPosts.useTeamColor ?? false,
        },
    goalPostsGlow: patch.goalPostsGlow
      ? {
          ...baseGoalPostsGlow,
          ...patch.goalPostsGlow,
          useTeamColor:
            patch.goalPostsGlow.useTeamColor ?? baseGoalPostsGlow.useTeamColor ?? true,
        }
      : {
          ...baseGoalPostsGlow,
          useTeamColor: baseGoalPostsGlow.useTeamColor ?? true,
        },
    walls: patch.walls ? { ...base.walls, ...patch.walls } : { ...base.walls },
    goalNet: patch.goalNet ? { ...base.goalNet, ...patch.goalNet } : { ...base.goalNet },
    hexes: patch.hexes ? { ...base.hexes, ...patch.hexes } : { ...base.hexes },
  };
}
