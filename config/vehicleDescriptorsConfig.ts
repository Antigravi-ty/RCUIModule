export interface VehicleSurfaceMaterialSlot {
  slotName: string;
  label: string;
  mode: string;
  color: string;
  pearlColor: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  sheen: number;
  envMapIntensity: number;
  toonSteps: number;
  toonShadowMin: number;
  toonHighlightMax: number;
  toonSmooth: boolean;
  glbDefaultMetalness: number;
  glbDefaultRoughness: number;
}

export interface VehicleLampsConfig {
  frontColor: string;
  frontIntensity: number;
  frontToneMapped: boolean;
  tailIdleColor: string;
  tailIdleIntensity: number;
  brakeColor: string;
  brakeIntensity: number;
  brakeMinSpeed: number;
  brakeDecelEpsilon: number;
  tailToneMapped: boolean;
}

export interface VehicleDescriptor {
  id: string;
  name: string;
  aliases?: string[];
  hitboxPreset: string;
  modelUrl: string;
  rawBounds: {
    min: [number, number, number];
    max: [number, number, number];
    length: number;
    height: number;
    width: number;
    center: [number, number, number];
    roofTopY: number;
    rlHitboxTopY: number;
  };
  alignment: {
    scale: number;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
    centerOffset: [number, number, number];
  };
  wheelNames: string[];
  wheelAnchors: [number, number, number][];
  suspensionHeights: [number, number, number, number];
  boostOutlets: [number, number, number][];
  boostNozzleParams: {
    x: number;
    y: number;
    z: number;
    followChassisOffset: boolean;
  };
  surfaceMaterials: Record<string, VehicleSurfaceMaterialSlot>;
  lampsConfig: VehicleLampsConfig;
  colors: {
    default: {
      primary: number;
      realisticPrimary: number;
      pearl: number;
    };
  };
  [key: string]: unknown;
}

export const GLOBAL_VEHICLE_SURFACE_MATERIALS: Record<string, VehicleSurfaceMaterialSlot> = {
  body: {
    slotName: 'body',
    label: 'Body Shell (body)',
    mode: 'standard',
    color: '#bc8100',
    pearlColor: '#ff2a60',
    metalness: 0.7,
    roughness: 0.45,
    clearcoat: 1,
    clearcoatRoughness: 0.11,
    sheen: 0.7,
    envMapIntensity: 1,
    toonSteps: 4,
    toonShadowMin: 0.11,
    toonHighlightMax: 1,
    toonSmooth: false,
    glbDefaultMetalness: 0,
    glbDefaultRoughness: 0.5,
  },
  window: {
    slotName: 'window',
    label: 'Windshield & Glass (window)',
    mode: 'standard',
    color: '#727272',
    pearlColor: '#243044',
    metalness: 1,
    roughness: 0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
    sheen: 0.2,
    envMapIntensity: 1,
    toonSteps: 3,
    toonShadowMin: 0.08,
    toonHighlightMax: 0.85,
    toonSmooth: false,
    glbDefaultMetalness: 0,
    glbDefaultRoughness: 0.5,
  },
  border: {
    slotName: 'border',
    label: 'Trim & Chassis Skirt (border)',
    mode: 'standard',
    color: '#262626',
    pearlColor: '#282e38',
    metalness: 0,
    roughness: 0.7,
    clearcoat: 0,
    clearcoatRoughness: 0.3,
    sheen: 0.1,
    envMapIntensity: 0.9,
    toonSteps: 3,
    toonShadowMin: 0.1,
    toonHighlightMax: 0.8,
    toonSmooth: false,
    glbDefaultMetalness: 0,
    glbDefaultRoughness: 0.5,
  },
  metal: {
    slotName: 'metal',
    label: 'Rear Exhaust & Trim Metal (metal)',
    mode: 'standard',
    color: '#c9c9c9',
    pearlColor: '#6d788a',
    metalness: 1,
    roughness: 0.5,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
    sheen: 0.1,
    envMapIntensity: 1,
    toonSteps: 4,
    toonShadowMin: 0.15,
    toonHighlightMax: 1,
    toonSmooth: false,
    glbDefaultMetalness: 0,
    glbDefaultRoughness: 0.5,
  },
};

export const GLOBAL_VEHICLE_LAMPS_CONFIG: VehicleLampsConfig = {
  frontColor: '#ffefd5',
  frontIntensity: 1,
  frontToneMapped: false,
  tailIdleColor: '#5c0a0a',
  tailIdleIntensity: 0.85,
  brakeColor: '#ff2200',
  brakeIntensity: 1,
  brakeMinSpeed: 30,
  brakeDecelEpsilon: 0.25,
  tailToneMapped: false,
};

export const FENNEC_DESCRIPTOR: VehicleDescriptor = {
  id: 'fennec',
  name: 'Fennec',
  hitboxPreset: 'hitbox-octane',
  modelUrl: '/assets/vehicles/Fennec.glb',
  rawBounds: {
    min: [-62.3896, -13.8302, -35.7124],
    max: [78.0319, 33.4147, 35.7124],
    length: 140.4215,
    height: 47.2449,
    width: 71.4248,
    center: [7.8212, 9.7923, 0],
    roofTopY: 33.4147,
    rlHitboxTopY: 38.8346,
  },
  alignment: {
    scale: 1.0,
    scaleX: 1.0,
    scaleY: 1.0,
    scaleZ: 1.0,
    centerOffset: [-0.1, 1.6, 0],
  },
  wheelNames: [
    'wheel-front-right',
    'wheel-front-left',
    'wheel-rear-right',
    'wheel-rear-left',
  ],
  wheelAnchors: [
    [48.55, 26.9291, 12.5],
    [48.55, -26.9291, 12.5],
    [-36.68, 28.6221, 15.0],
    [-36.68, -28.6221, 15.0],
  ],
  suspensionHeights: [-4.5, -4.5, -2.0, -2.0],
  boostOutlets: [
    [-57.97, 10.57, 19.62],
    [-57.97, 10.57, -19.62],
  ],
  boostNozzleParams: {
    x: -57.87,
    y: 8.97,
    z: 19.62,
    followChassisOffset: true,
  },
  surfaceMaterials: GLOBAL_VEHICLE_SURFACE_MATERIALS,
  lampsConfig: GLOBAL_VEHICLE_LAMPS_CONFIG,
  colors: {
    default: {
      primary: 16734742,
      realisticPrimary: 16555020,
      pearl: 16724660,
    },
  },
};

export const INSIDIO_DESCRIPTOR: VehicleDescriptor = {
  id: 'insidio',
  name: 'Insidio',
  hitboxPreset: 'hitbox-hybrid',
  modelUrl: '/assets/vehicles/Insidio.glb',
  rawBounds: {
    min: [-59.8536, -10.7404, -39.3438],
    max: [79.8535, 31.1743, 39.3438],
    length: 139.7071,
    height: 41.9147,
    width: 78.6876,
    center: [10.0, 10.217, 0],
    roofTopY: 31.1743,
    rlHitboxTopY: 37.8346,
  },
  alignment: {
    scale: 1.0,
    scaleX: 1.0,
    scaleY: 1.0,
    scaleZ: 1.0,
    centerOffset: [0.2, -1.0, 0],
  },
  wheelNames: [
    'wheel-front-right',
    'wheel-front-left',
    'wheel-rear-right',
    'wheel-rear-left',
  ],
  wheelAnchors: [
    [48.8139, 26.9291, 12.5],
    [48.8139, -26.9291, 12.5],
    [-36.5145, 28.6221, 15.0],
    [-36.5145, -28.622, 15.0],
  ],
  suspensionHeights: [-4.5, -4.5, -2.0, -2.0],
  boostOutlets: [
    [-56.8, 9.25, 20.428],
    [-56.8, 9.25, -20.428],
  ],
  boostNozzleParams: {
    x: -57.0,
    y: 10.25,
    z: 20.4278,
    followChassisOffset: true,
  },
  surfaceMaterials: GLOBAL_VEHICLE_SURFACE_MATERIALS,
  lampsConfig: GLOBAL_VEHICLE_LAMPS_CONFIG,
  colors: {
    default: {
      primary: 3115263,
      realisticPrimary: 3115263,
      pearl: 58879,
    },
  },
};

export const RYZA_DESCRIPTOR: VehicleDescriptor = {
  id: 'ryza',
  name: 'Ryza',
  hitboxPreset: 'hitbox-octane',
  modelUrl: '/assets/vehicles/Ryza.glb',
  rawBounds: {
    min: [-63.7602, -12.6091, -38.4309],
    max: [78.9037, 37.3574, 38.4309],
    length: 142.6639,
    height: 49.9665,
    width: 76.8618,
    center: [7.5718, 12.3741, 0],
    roofTopY: 37.3574,
    rlHitboxTopY: 38.8346,
  },
  alignment: {
    scale: 1.0,
    scaleX: 1.0,
    scaleY: 1.0,
    scaleZ: 1.0,
    centerOffset: [0, 0, 0],
  },
  wheelNames: [
    'wheel-front-right',
    'wheel-front-left',
    'wheel-rear-right',
    'wheel-rear-left',
  ],
  wheelAnchors: [
    [50.25, 26.9291, 12.5],
    [50.25, -26.9291, 12.5],
    [-36.5, 28.6221, 15.0],
    [-36.5, -28.6221, 15.0],
  ],
  suspensionHeights: [-4.5, -4.5, -2.0, -2.0],
  boostOutlets: [
    [-55.5, 16.0, 10.0],
    [-55.5, 16.0, -10.0],
  ],
  boostNozzleParams: {
    x: -55.5,
    y: 16.0,
    z: 10.0,
    followChassisOffset: true,
  },
  surfaceMaterials: GLOBAL_VEHICLE_SURFACE_MATERIALS,
  lampsConfig: GLOBAL_VEHICLE_LAMPS_CONFIG,
  colors: {
    default: {
      primary: 16734742,
      realisticPrimary: 16555020,
      pearl: 16724660,
    },
  },
};

export const OCAR_DESCRIPTOR: VehicleDescriptor = {
  id: 'o-car',
  name: 'O-car',
  aliases: ['ocar', 'pooroctane'],
  hitboxPreset: 'hitbox-octane',
  modelUrl: '/src/assets/vehicles/PoorOctane.glb',
  rawBounds: {
    min: [-50.7022, -9.3495, -27.1233],
    max: [73.6787, 38.9327, 27.1644],
    length: 124.3809,
    height: 48.2822,
    width: 54.2877,
    center: [11.4883, 14.7916, 0.0206],
    roofTopY: 38.9327,
    rlHitboxTopY: 38.8346,
  },
  alignment: {
    scale: 1.0,
    scaleX: 1.0,
    scaleY: 1.0,
    scaleZ: 1.0,
    centerOffset: [0, 0, 0],
  },
  wheelNames: [
    'wheel-front-right',
    'wheel-front-left',
    'wheel-rear-right',
    'wheel-rear-left',
  ],
  wheelAnchors: [
    [48.55, 26.9291, 12.5],
    [48.55, -26.9291, 12.5],
    [-36.68, 28.6221, 15.0],
    [-36.68, -28.6221, 15.0],
  ],
  suspensionHeights: [-4.5, -4.5, -2.0, -2.0],
  boostOutlets: [
    [-55.5, 16.0, 10.0],
    [-55.5, 16.0, -10.0],
  ],
  boostNozzleParams: {
    x: -55.5,
    y: 16.0,
    z: 10.0,
    followChassisOffset: true,
  },
  surfaceMaterials: GLOBAL_VEHICLE_SURFACE_MATERIALS,
  lampsConfig: GLOBAL_VEHICLE_LAMPS_CONFIG,
  colors: {
    default: {
      primary: 16734742,
      realisticPrimary: 16555020,
      pearl: 16724660,
    },
  },
};

