/**
 * vehicleTunerConfig.ts
 * Pure configuration data, descriptors, and runtime tuning state for vehicles, wheels, anodized paint, and boost particles.
 */

import {
  GLOBAL_VEHICLE_SURFACE_MATERIALS,
  GLOBAL_VEHICLE_LAMPS_CONFIG,
  FENNEC_DESCRIPTOR,
  INSIDIO_DESCRIPTOR,
  RYZA_DESCRIPTOR,
  type VehicleSurfaceMaterialSlot,
  type VehicleLampsConfig,
  type VehicleDescriptor,
} from './vehicleDescriptorsConfig';

export {
  GLOBAL_VEHICLE_SURFACE_MATERIALS,
  GLOBAL_VEHICLE_LAMPS_CONFIG,
  FENNEC_DESCRIPTOR,
  INSIDIO_DESCRIPTOR,
  RYZA_DESCRIPTOR,
  type VehicleSurfaceMaterialSlot,
  type VehicleLampsConfig,
  type VehicleDescriptor,
};

export const DEFAULT_TEAM_COLORS = [3111891, 13857839];
export const DEFAULT_PLAYER_TEAM_INDEX = 0;

export interface VehiclePaintFinishPreset {
  mode: string;
  metalness: number;
  roughness: number;
}

export const VEHICLE_PAINT_FINISH_PRESETS: Record<string, VehiclePaintFinishPreset> = {
  matte: {
    mode: 'standard',
    metalness: 0.5,
    roughness: 0.85,
  },
  metallic: {
    mode: 'standard',
    metalness: 0.7,
    roughness: 0.45,
  },
};

export function applyVehiclePaintFinishPreset(finish: string): VehicleSurfaceMaterialSlot {
  const preset = VEHICLE_PAINT_FINISH_PRESETS[finish];
  if (preset && GLOBAL_VEHICLE_SURFACE_MATERIALS.body) {
    GLOBAL_VEHICLE_SURFACE_MATERIALS.body.mode = preset.mode;
    GLOBAL_VEHICLE_SURFACE_MATERIALS.body.metalness = preset.metalness;
    GLOBAL_VEHICLE_SURFACE_MATERIALS.body.roughness = preset.roughness;
  }
  return GLOBAL_VEHICLE_SURFACE_MATERIALS.body;
}

export function getActiveVehiclePaintFinishPreset(): 'matte' | 'metallic' {
  const body = GLOBAL_VEHICLE_SURFACE_MATERIALS.body;
  if (
    body &&
    Math.abs((body.metalness ?? 0.7) - VEHICLE_PAINT_FINISH_PRESETS.matte.metalness) < 0.05 &&
    Math.abs((body.roughness ?? 0.45) - VEHICLE_PAINT_FINISH_PRESETS.matte.roughness) < 0.05
  ) {
    return 'matte';
  }
  return 'metallic';
}

const vehicleRegistry = new Map<string, VehicleDescriptor>([
  ['fennec', FENNEC_DESCRIPTOR],
  ['insidio', INSIDIO_DESCRIPTOR],
  ['ryza', RYZA_DESCRIPTOR],
]);

export function registerVehicleDescriptor(descriptor: VehicleDescriptor): void {
  if (!descriptor || !descriptor.id) {
    throw new Error("Vehicle descriptor must include a valid unique 'id'");
  }
  vehicleRegistry.set(descriptor.id, descriptor);
  if (descriptor.aliases && Array.isArray(descriptor.aliases)) {
    for (const alias of descriptor.aliases) {
      vehicleRegistry.set(alias, descriptor);
    }
  }
}

export function getVehicleDescriptor(id: string): VehicleDescriptor | null {
  return vehicleRegistry.get(id) || null;
}

export function getAllVehicleDescriptors(): VehicleDescriptor[] {
  const unique = new Set(vehicleRegistry.values());
  return Array.from(unique);
}

export function hasVehicleDescriptor(id: string): boolean {
  return vehicleRegistry.has(id);
}

export function recomputeDescriptorBoostOutlets(
  descriptor: VehicleDescriptor | null | undefined
): [number, number, number][] | undefined {
  if (!descriptor || !descriptor.boostNozzleParams) return descriptor?.boostOutlets;
  const { x, y, z, followChassisOffset } = descriptor.boostNozzleParams;
  const offsetX = followChassisOffset ? (descriptor.alignment?.centerOffset?.[0] ?? 0) : 0;
  const offsetY = followChassisOffset ? (descriptor.alignment?.centerOffset?.[1] ?? 0) : 0;
  const offsetZ = followChassisOffset ? (descriptor.alignment?.centerOffset?.[2] ?? 0) : 0;

  descriptor.boostOutlets = [
    [Number((x + offsetX).toFixed(3)), Number((y + offsetY).toFixed(3)), Number((z + offsetZ).toFixed(3))],
    [Number((x + offsetX).toFixed(3)), Number((y + offsetY).toFixed(3)), Number((-z + offsetZ).toFixed(3))],
  ];
  return descriptor.boostOutlets;
}

export interface VehicleTunerRuntimeFlags {
  activeVehicleId: string;
  colorOverride: boolean;
  forceBoostPreview: boolean;
  forceBrakeLightPreview: boolean;
  brakePreviewMode: string;
  showNozzleGizmos: boolean;
  [key: string]: unknown;
}

export const vehicleTunerRuntimeFlags: VehicleTunerRuntimeFlags = {
  activeVehicleId: 'fennec',
  colorOverride: false,
  forceBoostPreview: false,
  forceBrakeLightPreview: false,
  brakePreviewMode: 'auto',
  showNozzleGizmos: false,
};

export function getVehicleTunerRuntimeFlags(): VehicleTunerRuntimeFlags {
  return { ...vehicleTunerRuntimeFlags };
}

export function setVehicleTunerRuntimeFlags(
  patch: Partial<VehicleTunerRuntimeFlags> = {}
): VehicleTunerRuntimeFlags {
  Object.assign(vehicleTunerRuntimeFlags, patch);
  return getVehicleTunerRuntimeFlags();
}

export interface WheelModifierConfig {
  mode: string;
  width: number;
  radiusScale: number;
  verticalOffsetY: number;
  outerRimRadiusPct: number;
  outerColor: string;
  innerColor: string;
  treadColor: string;
  treadShaderMode: string;
  treadRoughness: number;
  treadMetalness: number;
  sideShaderMode: string;
  sideRoughness: number;
  sideMetalness: number;
  innerRimFollowsOuter: boolean;
  innerRimRadiusPct: number;
  innerRimColor: string;
  innerRimShaderMode: string;
  innerRimRoughness: number;
  innerRimMetalness: number;
  innerShaderMode: string;
  innerRoughness: number;
  innerMetalness: number;
  shaderMode: string;
  roughness: number;
  metalness: number;
  [key: string]: unknown;
}

export const DEFAULT_WHEEL_MODIFIER_CONFIG: WheelModifierConfig = {
  mode: 'solid-cylinder',
  width: 6,
  radiusScale: 1,
  verticalOffsetY: 0,
  outerRimRadiusPct: 80,
  outerColor: '#737373',
  innerColor: '#000000',
  treadColor: '#000000',
  treadShaderMode: 'standard',
  treadRoughness: 1,
  treadMetalness: 0,
  sideShaderMode: 'standard',
  sideRoughness: 0.5,
  sideMetalness: 0.7,
  innerRimFollowsOuter: true,
  innerRimRadiusPct: 80,
  innerRimColor: '#737373',
  innerRimShaderMode: 'standard',
  innerRimRoughness: 0.5,
  innerRimMetalness: 0.7,
  innerShaderMode: 'standard',
  innerRoughness: 1,
  innerMetalness: 0,
  shaderMode: 'standard',
  roughness: 1,
  metalness: 0,
};

export const wheelModifierRuntimeConfig: WheelModifierConfig = {
  ...DEFAULT_WHEEL_MODIFIER_CONFIG,
};

export function getWheelModifierConfig(): WheelModifierConfig {
  return { ...wheelModifierRuntimeConfig };
}

export function setWheelModifierConfig(
  patch: Partial<WheelModifierConfig> = {}
): WheelModifierConfig {
  if (!patch) return getWheelModifierConfig();
  const nextConfig: Partial<WheelModifierConfig> = { ...patch };

  if (nextConfig.innerColor !== undefined && nextConfig.treadColor === undefined) {
    nextConfig.treadColor = nextConfig.innerColor;
  } else if (nextConfig.treadColor !== undefined && nextConfig.innerColor === undefined) {
    nextConfig.innerColor = nextConfig.treadColor;
  }

  if (nextConfig.innerShaderMode !== undefined && nextConfig.treadShaderMode === undefined) {
    nextConfig.treadShaderMode = nextConfig.innerShaderMode;
  } else if (nextConfig.treadShaderMode !== undefined && nextConfig.innerShaderMode === undefined) {
    nextConfig.innerShaderMode = nextConfig.treadShaderMode;
  }

  if (nextConfig.innerRoughness !== undefined && nextConfig.treadRoughness === undefined) {
    nextConfig.treadRoughness = nextConfig.innerRoughness;
  } else if (nextConfig.treadRoughness !== undefined && nextConfig.innerRoughness === undefined) {
    nextConfig.innerRoughness = nextConfig.treadRoughness;
  }

  if (nextConfig.innerMetalness !== undefined && nextConfig.treadMetalness === undefined) {
    nextConfig.treadMetalness = nextConfig.innerMetalness;
  } else if (nextConfig.treadMetalness !== undefined && nextConfig.innerMetalness === undefined) {
    nextConfig.innerMetalness = nextConfig.treadMetalness;
  }

  const hasExplicitSurfaceFields =
    nextConfig.treadShaderMode !== undefined ||
    nextConfig.sideShaderMode !== undefined ||
    nextConfig.innerShaderMode !== undefined ||
    nextConfig.innerRimShaderMode !== undefined ||
    nextConfig.treadRoughness !== undefined ||
    nextConfig.sideRoughness !== undefined ||
    nextConfig.innerRoughness !== undefined ||
    nextConfig.innerRimRoughness !== undefined ||
    nextConfig.treadMetalness !== undefined ||
    nextConfig.sideMetalness !== undefined ||
    nextConfig.innerMetalness !== undefined ||
    nextConfig.innerRimMetalness !== undefined;

  if (!hasExplicitSurfaceFields) {
    if (nextConfig.shaderMode !== undefined) {
      nextConfig.treadShaderMode = nextConfig.shaderMode;
      nextConfig.sideShaderMode = nextConfig.shaderMode;
      nextConfig.innerShaderMode = nextConfig.shaderMode;
      nextConfig.innerRimShaderMode = nextConfig.shaderMode;
    }
    if (nextConfig.roughness !== undefined) {
      nextConfig.treadRoughness = nextConfig.roughness;
      nextConfig.sideRoughness = nextConfig.roughness;
      nextConfig.innerRoughness = nextConfig.roughness;
      nextConfig.innerRimRoughness = nextConfig.roughness;
    }
    if (nextConfig.metalness !== undefined) {
      nextConfig.treadMetalness = nextConfig.metalness;
      nextConfig.sideMetalness = nextConfig.metalness;
      nextConfig.innerMetalness = nextConfig.metalness;
      nextConfig.innerRimMetalness = nextConfig.metalness;
    }
  }

  const shouldInnerFollowOuter =
    nextConfig.innerRimFollowsOuter !== undefined
      ? Boolean(nextConfig.innerRimFollowsOuter)
      : Boolean(wheelModifierRuntimeConfig.innerRimFollowsOuter ?? true);

  if (shouldInnerFollowOuter) {
    const targetPct = nextConfig.outerRimRadiusPct ?? wheelModifierRuntimeConfig.outerRimRadiusPct ?? 80;
    const targetColor = nextConfig.outerColor ?? wheelModifierRuntimeConfig.outerColor ?? '#737373';
    const targetShader = nextConfig.sideShaderMode ?? wheelModifierRuntimeConfig.sideShaderMode ?? 'standard';
    const targetRoughness = nextConfig.sideRoughness ?? wheelModifierRuntimeConfig.sideRoughness ?? 0.5;
    const targetMetalness = nextConfig.sideMetalness ?? wheelModifierRuntimeConfig.sideMetalness ?? 0.7;

    if (nextConfig.innerRimRadiusPct === undefined) nextConfig.innerRimRadiusPct = targetPct;
    if (nextConfig.innerRimColor === undefined) nextConfig.innerRimColor = targetColor;
    if (nextConfig.innerRimShaderMode === undefined) nextConfig.innerRimShaderMode = targetShader;
    if (nextConfig.innerRimRoughness === undefined) nextConfig.innerRimRoughness = targetRoughness;
    if (nextConfig.innerRimMetalness === undefined) nextConfig.innerRimMetalness = targetMetalness;
  }

  Object.assign(wheelModifierRuntimeConfig, nextConfig);
  return getWheelModifierConfig();
}

export interface AnodizedPaintTuning {
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  sheen: number;
  sheenRoughness: number;
  envMapIntensity: number;
  pearlFresnelPower: number;
  pearlBlendStrength: number;
  [key: string]: unknown;
}

export const anodizedPaintTuning: AnodizedPaintTuning = {
  roughness: 0.04,
  metalness: 0.76,
  clearcoat: 1.0,
  clearcoatRoughness: 0.11,
  sheen: 0.7,
  sheenRoughness: 0.24,
  envMapIntensity: 1.4,
  pearlFresnelPower: 1.35,
  pearlBlendStrength: 0.82,
};

type AnodizedPaintListener = (patch: Partial<AnodizedPaintTuning>, state: AnodizedPaintTuning) => void;
const anodizedPaintCallbacks: AnodizedPaintListener[] = [];

export function subscribeAnodizedPaintTuning(listener: AnodizedPaintListener): () => void {
  if (typeof listener !== 'function') return () => {};
  if (!anodizedPaintCallbacks.includes(listener)) {
    anodizedPaintCallbacks.push(listener);
  }
  return () => {
    const idx = anodizedPaintCallbacks.indexOf(listener);
    if (idx !== -1) anodizedPaintCallbacks.splice(idx, 1);
  };
}

export function getAnodizedPaintTuning(): AnodizedPaintTuning {
  return { ...anodizedPaintTuning };
}

export function updateAnodizedPaintTuning(
  patch: Partial<AnodizedPaintTuning> = {}
): AnodizedPaintTuning {
  if (!patch) return anodizedPaintTuning;
  Object.assign(anodizedPaintTuning, patch);
  for (const listener of anodizedPaintCallbacks) {
    try {
      listener(patch, anodizedPaintTuning);
    } catch (err) {
      console.warn('[vehicleTunerConfig] Anodized paint listener threw an error:', err);
    }
  }
  return anodizedPaintTuning;
}

export interface BoostParticleRuntimeConfig {
  detailPreset: string;
  trailSpawnMultiplier: number;
  trailLifeMultiplier: number;
  dualStreamEnabled: boolean;
  shortTrailSpawnMultiplier: number;
  shortTrailLifetime: number;
  shortTrailScaleRefLife: number;
  longTrailSpawnMultiplier: number;
  longTrailLifetime: number;
  smoothStreamTransition: boolean;
  distanceDecayEnabled: boolean;
  distanceDecayFalloff: number;
  drivePuffsEnabled: boolean;
  pointLightEnabled: boolean;
  bloomEnabled: boolean;
  [key: string]: unknown;
}

export const boostParticleRuntimeConfig: BoostParticleRuntimeConfig = {
  detailPreset: 'full',
  trailSpawnMultiplier: 1,
  trailLifeMultiplier: 1,
  dualStreamEnabled: true,
  shortTrailSpawnMultiplier: 1,
  shortTrailLifetime: 0.1,
  shortTrailScaleRefLife: 0.6,
  longTrailSpawnMultiplier: 0.1,
  longTrailLifetime: 2,
  smoothStreamTransition: true,
  distanceDecayEnabled: true,
  distanceDecayFalloff: 1200,
  drivePuffsEnabled: true,
  pointLightEnabled: false,
  bloomEnabled: false,
};

export function getBoostParticleRuntimeConfig(): BoostParticleRuntimeConfig {
  return { ...boostParticleRuntimeConfig };
}

const BOOST_PARTICLE_PRESETS: Record<string, Partial<BoostParticleRuntimeConfig>> = {
  none: { detailPreset: 'none', trailSpawnMultiplier: 0.0, trailLifeMultiplier: 0.5, shortTrailSpawnMultiplier: 0.0, longTrailSpawnMultiplier: 0.0, drivePuffsEnabled: false },
  low: { detailPreset: 'low', trailSpawnMultiplier: 0.4, trailLifeMultiplier: 0.65, shortTrailSpawnMultiplier: 0.6, shortTrailLifetime: 0.1, shortTrailScaleRefLife: 0.6, longTrailSpawnMultiplier: 0.05, longTrailLifetime: 1.4, drivePuffsEnabled: false },
  full: { detailPreset: 'full', trailSpawnMultiplier: 1, trailLifeMultiplier: 1, shortTrailSpawnMultiplier: 1, shortTrailLifetime: 0.1, shortTrailScaleRefLife: 0.6, longTrailSpawnMultiplier: 0.1, longTrailLifetime: 2, drivePuffsEnabled: true },
};

export function setBoostParticleRuntimeConfig(
  patch: Partial<BoostParticleRuntimeConfig> = {}
): BoostParticleRuntimeConfig {
  if (!patch) return boostParticleRuntimeConfig;
  if (patch.detailPreset && BOOST_PARTICLE_PRESETS[patch.detailPreset]) {
    Object.assign(boostParticleRuntimeConfig, BOOST_PARTICLE_PRESETS[patch.detailPreset]);
  }
  Object.assign(boostParticleRuntimeConfig, patch);
  return boostParticleRuntimeConfig;
}

type VehicleTunerListener = (payload: Record<string, unknown>) => void;
const vehicleTunerCallbacks: VehicleTunerListener[] = [];

export function subscribeVehicleTunerConfig(listener: VehicleTunerListener): () => boolean {
  if (typeof listener !== 'function') return () => false;
  if (!vehicleTunerCallbacks.includes(listener)) {
    vehicleTunerCallbacks.push(listener);
  }
  return () => {
    const idx = vehicleTunerCallbacks.indexOf(listener);
    if (idx === -1) return false;
    vehicleTunerCallbacks.splice(idx, 1);
    return true;
  };
}

export function notifyVehicleTunerConfigChange(payload: Record<string, unknown> = {}): void {
  for (const fn of vehicleTunerCallbacks) {
    try {
      fn(payload);
    } catch (err) {
      console.warn('[vehicleTunerConfig] Listener error:', err);
    }
  }
}
