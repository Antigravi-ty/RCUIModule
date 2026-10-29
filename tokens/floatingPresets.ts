export type FloatingWindowTier = 'user' | 'developer';
export type FloatingWindowVisibilityTier = FloatingWindowTier;

export interface FloatingWindowTabMeta {
  id: string;
  label: string;
}

export interface PresetConfig {
  id: string;
  title: string;
  category: string;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  /** When true (default for user windows), default height and maxHeight dynamically track intrinsic content height so there is no vertical scrolling by default and no empty bottom void when resizing taller */
  autoFitHeight?: boolean;
  resizable: boolean;
  singleton?: boolean;
  defaultCenter?: boolean;
  tier?: FloatingWindowTier;
  summary?: string;
  menuEntryPath?: string;
  tabs?: FloatingWindowTabMeta[];
  component?: string;
  sourcePath?: string;
}

// ============================================================================
// 1. NORMAL USER FLOATING WINDOWS (6 Total — Strictly User-Visible)
// ============================================================================

export const REPLAY_VIEWER_PRESET: PresetConfig = {
  id: 'replay-viewer',
  title: 'RC Replay Viewer',
  category: 'ReplayViewer',
  width: 472,
  height: 456,
  minWidth: 471,
  minHeight: 220,
  autoFitHeight: true,
  resizable: true,
  singleton: true,
  tier: 'user',
  summary: 'Multi-track replay timeline scrubber, camera mode switcher, and speed flow controls.',
  menuEntryPath: 'Play -> RC Replay Viewer',
};

export const GOAL_BARRIER_CONFIGURATOR_PRESET: PresetConfig = {
  id: 'goal-barrier-configurator',
  title: 'Goal Barrier Configurator',
  category: 'GoalBarrier',
  width: 440,
  height: 462,
  minWidth: 418,
  minHeight: 240,
  autoFitHeight: true,
  resizable: true,
  singleton: true,
  tier: 'user',
  summary: 'Interactive 2D goal barrier boolean rectangle designer with Orange/Blue/Both target selection.',
  menuEntryPath: 'Settings -> Gameplay -> Training Mode Configuration',
};

export const REWINDER_CONFIGURATOR_PRESET: PresetConfig = {
  id: 'rewinder-configurator',
  title: 'Rewinder Configurator',
  category: 'Rewinder',
  width: 505,
  height: 367,
  minWidth: 505,
  minHeight: 220,
  autoFitHeight: true,
  resizable: true,
  singleton: true,
  tier: 'user',
  summary: 'Free Play state history recorder, timeline scrubber ([ / ]), and countdown takeover.',
  menuEntryPath: 'Settings -> Gameplay -> Training Mode Configuration',
};

export const NETWORK_MONITOR_PRESET: PresetConfig = {
  id: 'network-monitor',
  title: 'Network Monitor',
  category: 'Network',
  width: 480,
  height: 477,
  minWidth: 446,
  minHeight: 240,
  autoFitHeight: true,
  resizable: true,
  singleton: true,
  tier: 'user',
  summary: 'Real-time RTT & jitter oscilloscope, input buffer queue depth, and 20-minute session telemetry export.',
  menuEntryPath: 'Settings -> Advanced -> Network Monitor',
};

export const PERFORMANCE_MONITOR_PRESET: PresetConfig = {
  id: 'performance-monitor',
  title: 'Performance Monitor',
  category: 'Diagnostic',
  width: 480,
  height: 801,
  minWidth: 441,
  minHeight: 260,
  autoFitHeight: true,
  resizable: true,
  singleton: true,
  tier: 'user',
  summary: 'Real-time CPU 6-phase breakdown, physics simulation sub-ticks, and WebGL rendering pipeline metrics.',
  menuEntryPath: 'Settings -> Advanced -> Performance Monitor',
};

export const FLOATING_WINDOW_OPACITY_PRESET: PresetConfig = {
  id: 'floating-window-opacity',
  title: 'Floating Window Opacity',
  category: 'System',
  width: 360,
  height: 123,
  minWidth: 343,
  minHeight: 115,
  autoFitHeight: true,
  resizable: false,
  singleton: true,
  defaultCenter: true,
  tier: 'user',
  summary: 'Global opacity adjustment (1% - 100%) for all active floating telemetry windows.',
  menuEntryPath: 'Settings -> Advanced -> Floating Window Opacity',
};

// ============================================================================
// 2. DEVELOPER-ONLY FLOATING WINDOWS (19 Total — Strictly Developer-Only)
// ============================================================================

export const DIAGNOSTIC_DUMP_PRESET: PresetConfig = {
  id: 'diagnostic-dump',
  title: 'Export Diagnostic Dump',
  category: 'DiagnosticDump',
  width: 480,
  height: 580,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Live Client Replay, Reconcile & Pacing Telemetry, and Server Replay buffer gauges + one-click .zip dump.',
  menuEntryPath: 'Settings -> Developer -> Active Tuners & Diagnostics',
};

export const STATIC_TRAINING_BALL_CAM_TUNER_PRESET: PresetConfig = {
  id: 'static-training-ball-cam-tuner',
  title: 'Static Training Ball Camera & Opacity Tuner',
  category: 'TrainingBallCam',
  width: 460,
  height: 580,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Relative ball camera (Distance, Height, Angle, Lateral Offset) and Edit-Mode 70% Ball Opacity override.',
  menuEntryPath: 'Settings -> Developer -> Active Tuners & Diagnostics',
};

export const NAME_TAG_TUNER_PRESET: PresetConfig = {
  id: 'name-tag-tuner',
  title: 'Multiplayer Name Tag Tuner',
  category: 'NameTagTuner',
  width: 480,
  height: 620,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: '208x54 horizontal pill name cards, distance curve gamma, 50UU+6px offset, and 6-car kickoff arena.',
  menuEntryPath: 'Settings -> Developer -> Calibrated Presets',
};

export const GOAL_VOLUME_TUNER_PRESET: PresetConfig = {
  id: 'goal-volume-tuner',
  title: 'Goal Volume Hitbox Active Tuner',
  category: 'GoalVolumeTuner',
  width: 470,
  height: 580,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Goal Volume Hitbox 3D wireframe overlay, Standard & Throwback AABB calibration & JSON export.',
  menuEntryPath: 'Settings -> Developer -> Active Tuners & Diagnostics',
};

export const REPLAY_DIRECTOR_TUNER_PRESET: PresetConfig = {
  id: 'replay-director-tuner',
  title: 'Replay Director Camera & Slow-Mo Tuner',
  category: 'ReplayDirector',
  width: 485,
  height: 640,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: '.rcgr.gz Goal Replay container export/import, 3D Arena preview, anomaly peak seek chips & +-15f window.',
  menuEntryPath: 'Settings -> Developer -> Active Tuners & Diagnostics',
};

export const REACHABILITY_TUNER_PRESET: PresetConfig = {
  id: 'reachability-tuner',
  title: 'Reachability & Intercept Tuner',
  category: 'Reachability',
  width: 470,
  height: 600,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Ground 1s/2s/3s Isochrone LUT (Boost=0), Boost-Driven 3D Horn & Optimal Intercept 3D Cross.',
  menuEntryPath: 'Settings -> Developer -> Active Tuners & Diagnostics',
};

export const VEHICLE_MODEL_OFFSET_TUNER_PRESET: PresetConfig = {
  id: 'vehicle-model-offset-tuner',
  title: 'Vehicle Model & Offset Tuner',
  category: 'VehicleOffsetTuner',
  width: 480,
  height: 620,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Per-vehicle Hitbox & Align, Wheel Hub Anchors & Dual Boost Exhaust Nozzle Offsets (Fennec & Insidio).',
  menuEntryPath: 'Settings -> Developer -> Active Tuners & Diagnostics',
  tabs: [
    { id: 'hitbox', label: 'Hitbox & Align' },
    { id: 'wheel-anchors', label: 'Wheel Anchors' },
    { id: 'boost-nozzles', label: 'Boost Nozzles' },
  ],
};

export const VEHICLE_GLOBAL_FX_TUNER_PRESET: PresetConfig = {
  id: 'vehicle-global-fx-tuner',
  title: 'Vehicle Global Surfaces & FX Tuner',
  category: 'VehicleGlobalFx',
  width: 480,
  height: 620,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Universal Surfaces & Paint, Head/Brake Lamps, 3-Face Solid Cylinder Wheels & Boost FX.',
  menuEntryPath: 'Settings -> Developer -> Calibrated Presets',
  tabs: [
    { id: 'surfaces', label: 'Surfaces & Paint' },
    { id: 'lights', label: 'Lights & Lamps' },
    { id: 'wheels', label: 'Wheels (7uu)' },
    { id: 'boost-fx', label: 'Boost FX' },
  ],
};

export const EXPERIMENTAL_MULTI_BOTS_PRESET: PresetConfig = {
  id: 'experimental-multi-bots',
  title: 'Experimental Multiple Bots Mode',
  category: 'ExperimentalBots',
  width: 490,
  height: 620,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Live floating controller for up to 3v3 Native SafeTensors Nexto/Necto POV switching & inference telemetry.',
  menuEntryPath: 'Settings -> Developer -> Sandboxes & Isolation Labs',
};

export const ATMOSPHERE_FX_TUNER_PRESET: PresetConfig = {
  id: 'atmosphere-fx-tuner',
  title: 'Atmosphere & FX Tuner',
  category: 'AtmosphereFx',
  width: 480,
  height: 580,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Wall & Pulse (Cubic-Bezier Fade-Out Curve), Single-Sun Sharp Shadows, Full-Sphere Skybox & 70% Ball.',
  menuEntryPath: 'Settings -> Developer -> Calibrated Presets',
  tabs: [
    { id: 'wall-pulse', label: 'Wall & Pulse' },
    { id: 'shadows', label: 'Shadows' },
    { id: 'skybox', label: 'Skybox' },
    { id: 'ball', label: 'Ball (70%)' },
  ],
};

export const SUBSYSTEM_ISOLATION_LAB_PRESET: PresetConfig = {
  id: 'subsystem-isolation-lab',
  title: 'Subsystem Isolation & MVP Lab',
  category: 'DeveloperLab',
  width: 470,
  height: 560,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: '7 isolated test benches: Probes, Multi-World Ghost, State Replay, 90s Match, Goal Replay, Kickoff Duel & Demolish Respawn.',
  menuEntryPath: 'Settings -> Developer -> Sandboxes & Isolation Labs',
  tabs: [
    { id: 'probes', label: 'Probes' },
    { id: 'dual-world', label: 'Multi Ghost' },
    { id: 'state-replay', label: 'State Replay' },
    { id: 'incident-match', label: '90s Match' },
    { id: 'goal-replay', label: 'Goal Replay' },
    { id: 'kickoff-duel', label: 'Kickoff Duel' },
    { id: 'demolish-respawn', label: 'Demolish & Respawn' },
  ],
};

export const KICKOFF_TRAINING_PRESET: PresetConfig = {
  id: 'kickoff-training',
  title: 'Kickoff Training (PPO)',
  category: 'Training',
  width: 460,
  height: 595,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Kickoff sub-modes, realistic wait (0.25s steps), N/120 speed & W/S rhythm overlay offset.',
  menuEntryPath: 'Settings -> Developer -> Active Tuners & Diagnostics',
};

export const EVENT_STREAM_OB_PRESET: PresetConfig = {
  id: 'event-stream-ob',
  title: 'Event Stream OB',
  category: 'Observer',
  width: 460,
  height: 420,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Real-time physics collision observer, impulse scatter chart & audio threshold visualizer.',
  menuEntryPath: 'Settings -> Developer -> Active Tuners & Diagnostics',
};

export const DUAL_ARENA_DETERMINISM_HARNESS_PRESET: PresetConfig = {
  id: 'dual-arena-determinism-harness',
  title: 'Dual-Arena Determinism Harness',
  category: 'Determinism',
  width: 440,
  height: 420,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Bit-exact parallel RocketSim physics rollback verification & desync delta monitoring.',
  menuEntryPath: 'Settings -> Developer -> Active Tuners & Diagnostics',
};

export const CAMERA_DETERMINISM_PRESET: PresetConfig = {
  id: 'camera-determinism',
  title: 'Camera Deterministic Harness',
  category: 'CameraDeterminism',
  width: 460,
  height: 460,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Side-by-side comparison between Legacy WASM & Clean JS camera with 600+600f CSV auto-capture.',
  menuEntryPath: 'Settings -> Developer -> Active Tuners & Diagnostics',
};

export const NETWORK_STRESS_INJECTION_PRESET: PresetConfig = {
  id: 'network-stress-injection',
  title: 'Network Stress Injection',
  category: 'NetworkLab',
  width: 480,
  height: 520,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Asymmetric uplink/downlink delay, jitter, packet loss & burst drop injection + 2-Car 0G probes.',
  menuEntryPath: 'Settings -> Developer -> Active Tuners & Diagnostics',
};

export const CLOCK_PACING_TUNER_PRESET: PresetConfig = {
  id: 'clock-pacing-tuner',
  title: 'Input Buffer & Clock Pacing Tuner',
  category: 'PacingTuner',
  width: 580,
  height: 640,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Low-level STS/CSTS hysteresis, PD gains, RTT bias compensation, trace import & What-If simulator.',
  menuEntryPath: 'Settings -> Developer -> Active Tuners & Diagnostics',
};

export const BOOST_PAD_TUNER_PRESET: PresetConfig = {
  id: 'boost-pad-tuner',
  title: 'Boost Pad Visual Tuner',
  category: 'Graphics',
  width: 460,
  height: 540,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Upward gradient opacity, midpoint falloff curve & Big Pad floating orb geometry.',
  menuEntryPath: 'Settings -> Developer -> Calibrated Presets',
  tabs: [
    { id: 'shader-orb', label: 'Shader & Orb' },
    { id: 'materials', label: 'Materials' },
    { id: 'rotations', label: 'Rotations' },
    { id: 'refilling', label: 'Refilling' },
    { id: 'collect-fx', label: 'Collect FX' },
  ],
};

export const DRIFTWOODS_TUNER_PRESET: PresetConfig = {
  id: 'driftwoods-tuner',
  title: 'Driftwoods Stadium Tuner',
  category: 'Graphics',
  width: 480,
  height: 560,
  resizable: true,
  singleton: true,
  tier: 'developer',
  summary: 'Ground dynamic dual-color UV mask, 8-mesh PBR palette, 0.20 Hex Shield & Lite Lambert mode.',
  menuEntryPath: 'Settings -> Developer -> Calibrated Presets',
  tabs: [
    { id: 'ground', label: 'Ground' },
    { id: 'surfaces', label: 'Surfaces' },
    { id: 'transparent', label: 'Transparent' },
    { id: 'performance', label: 'Performance' },
  ],
};

export const USER_PRESET_WINDOWS: PresetConfig[] = [
  REPLAY_VIEWER_PRESET,
  GOAL_BARRIER_CONFIGURATOR_PRESET,
  REWINDER_CONFIGURATOR_PRESET,
  NETWORK_MONITOR_PRESET,
  PERFORMANCE_MONITOR_PRESET,
  FLOATING_WINDOW_OPACITY_PRESET,
];

export const DEV_PRESET_WINDOWS: PresetConfig[] = [
  DIAGNOSTIC_DUMP_PRESET,
  STATIC_TRAINING_BALL_CAM_TUNER_PRESET,
  NAME_TAG_TUNER_PRESET,
  GOAL_VOLUME_TUNER_PRESET,
  REPLAY_DIRECTOR_TUNER_PRESET,
  REACHABILITY_TUNER_PRESET,
  VEHICLE_MODEL_OFFSET_TUNER_PRESET,
  VEHICLE_GLOBAL_FX_TUNER_PRESET,
  EXPERIMENTAL_MULTI_BOTS_PRESET,
  ATMOSPHERE_FX_TUNER_PRESET,
  SUBSYSTEM_ISOLATION_LAB_PRESET,
  KICKOFF_TRAINING_PRESET,
  EVENT_STREAM_OB_PRESET,
  DUAL_ARENA_DETERMINISM_HARNESS_PRESET,
  CAMERA_DETERMINISM_PRESET,
  NETWORK_STRESS_INJECTION_PRESET,
  CLOCK_PACING_TUNER_PRESET,
  BOOST_PAD_TUNER_PRESET,
  DRIFTWOODS_TUNER_PRESET,
];

export const PRESET_WINDOWS: PresetConfig[] = [
  ...USER_PRESET_WINDOWS,
  ...DEV_PRESET_WINDOWS,
];
