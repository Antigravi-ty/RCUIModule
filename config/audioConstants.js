import { STORAGE_KEYS } from './storageHelpers.ts';

// Audio Asset Definitions (100% Unified under /assets/audio/)
export const BALL_HIT_AUDIO_FILES = Object.freeze([
  "/assets/audio/impacts/vehicle-body-01.m4a",
  "/assets/audio/impacts/vehicle-body-02.m4a",
  "/assets/audio/impacts/vehicle-body-03.m4a",
  "/assets/audio/impacts/vehicle-body-04.m4a"
]);

export const VEHICLE_ACCENT_AUDIO_FILE = "/assets/audio/impacts/vehicle-accent-01.m4a";

export const VEHICLE_DETAIL_AUDIO_FILES = Object.freeze([
  "/assets/audio/impacts/vehicle-detail-01.m4a",
  "/assets/audio/impacts/vehicle-detail-02.m4a",
  "/assets/audio/impacts/vehicle-detail-03.m4a",
  "/assets/audio/impacts/vehicle-detail-04.m4a",
  "/assets/audio/impacts/vehicle-detail-05.m4a",
  "/assets/audio/impacts/vehicle-detail-06.m4a"
]);

export const SIDEWALL_HIT_AUDIO_FILES = Object.freeze([
  "/assets/audio/sidewallhit/SFX_Impacts_0200.m4a",
  "/assets/audio/sidewallhit/SFX_Impacts_0216.m4a",
  "/assets/audio/sidewallhit/SFX_Impacts_0259.m4a",
  "/assets/audio/sidewallhit/SFX_Impacts_0378.m4a",
  "/assets/audio/sidewallhit/SFX_Impacts_0627.m4a"
]);

export const SFX_CAR_COLLISION_FILE = "/assets/audio/sfx_car_collision.m4a";
export const BOOST_COLLECT_FILE = "/assets/audio/boost_collect.m4a";
export const GOAL_SCORED_FILE = "/assets/audio/sfx_goal_poof.m4a";
export const BALL_ROLLING_FILE = "/assets/audio/ballrolling.m4a";
export const BALL_FLYING_FILE = "/assets/audio/ballflying.m4a";
export const SUPERSONIC_STATE_FILE = "/assets/audio/sfx_state_supersonic.m4a";
export const ERROR_NO_BOOST_FILE = "/assets/audio/sfx_error_no_boost.m4a";
export const MATCH_60S_FILE = "/assets/audio/match_60_seconds_left.m4a";
export const MATCH_30S_FILE = "/assets/audio/match_30_seconds_left.m4a";
export const MATCH_COUNTDOWN_FILE = "/assets/audio/match_countdown_321.m4a";
export const TRAINING_COUNTDOWN_FILE = "/assets/audio/training_countdown.m4a";
export const MATCH_10S_COUNTDOWN_FILE = "/assets/audio/match_countdown_10s.m4a";
export const MATCH_OVERTIME_FILE = "/assets/audio/match_entering_overtime.m4a";
export const MATCH_START_GO_FILE = "/assets/audio/match_start_go.m4a";
export const ENDGAME_FILE = "/assets/audio/endgame.m4a";

export const CROSSBAR_PING_AUDIO_FILES = Object.freeze([
  "/assets/audio/crossbar_ping/ping-01.m4a",
  "/assets/audio/crossbar_ping/ping-02.m4a",
  "/assets/audio/crossbar_ping/ping-03.m4a",
  "/assets/audio/crossbar_ping/ping-04.m4a",
  "/assets/audio/crossbar_ping/ping-05.m4a",
  "/assets/audio/crossbar_ping/ping-06.m4a"
]);

export const CROSSBAR_PING_SMALL_AUDIO_FILES = Object.freeze([
  "/assets/audio/crossbar_ping/ping-small-01.m4a",
  "/assets/audio/crossbar_ping/ping-small-02.m4a",
  "/assets/audio/crossbar_ping/ping-small-03.m4a",
  "/assets/audio/crossbar_ping/ping-small-04.m4a",
  "/assets/audio/crossbar_ping/ping-small-05.m4a",
  "/assets/audio/crossbar_ping/ping-small-06.m4a"
]);

// Real device / production vehicle and impact audio assets
export const JUMP_AUDIO_FILES = Object.freeze([
  "/assets/audio/vehicle/jump-01.m4a",
  "/assets/audio/vehicle/jump-02.m4a",
  "/assets/audio/vehicle/jump-03.m4a",
  "/assets/audio/vehicle/jump-04.m4a"
]);

export const DOUBLE_JUMP_AUDIO_FILES = Object.freeze([
  "/assets/audio/vehicle/double-jump-01.m4a",
  "/assets/audio/vehicle/double-jump-02.m4a",
  "/assets/audio/vehicle/double-jump-03.m4a",
  "/assets/audio/vehicle/double-jump-04.m4a"
]);

export const DODGE_AUDIO_FILES = Object.freeze([
  "/assets/audio/vehicle/dodge-01.m4a",
  "/assets/audio/vehicle/dodge-02.m4a",
  "/assets/audio/vehicle/dodge-03.m4a",
  "/assets/audio/vehicle/dodge-04.m4a"
]);

export const RESET_AUDIO_FILE = "/assets/audio/events/reset.m4a";
export const GOALPOST_AUDIO_FILE = CROSSBAR_PING_AUDIO_FILES[0];

export const WHEEL_IMPACT_AUDIO_FILES = Object.freeze([
  "/assets/audio/vehicle/wheel-impact-01.m4a",
  "/assets/audio/vehicle/wheel-impact-02.m4a",
  "/assets/audio/vehicle/wheel-impact-03.m4a",
  "/assets/audio/vehicle/wheel-impact-04.m4a"
]);

export const SUPERSONIC_ENTER_AUDIO_FILES = Object.freeze([
  "/assets/audio/vehicle/supersonic-enter-a.m4a",
  "/assets/audio/vehicle/supersonic-enter-b.m4a",
  "/assets/audio/vehicle/supersonic-enter-c.m4a"
]);

export const SUPERSONIC_LOOP_AUDIO_FILE = "/assets/audio/vehicle/supersonic-loop.m4a";
export const BOOST_START_AUDIO_FILE = "/assets/audio/boost/rush/start.m4a";
export const BOOST_LOOP_AUDIO_FILE = "/assets/audio/boost/rush/loop.m4a";
export const BOOST_RELEASE_AUDIO_FILE = "/assets/audio/boost/rush/release.m4a";
export const TRAINING_BALL_EXPIRE_FILE = "/assets/audio/training_ball_expire.m4a";

export const DEFAULT_BOOST_VARIATION = 'rush';

export const BOOST_AUDIO_VARIATIONS = Object.freeze([
  {
    id: 'rush',
    label: 'Gold Rush',
    start: '/assets/audio/boost/rush/start.m4a',
    loop: '/assets/audio/boost/rush/loop.m4a',
    end: '/assets/audio/boost/rush/release.m4a',
  },
  {
    id: 'standard',
    label: 'Standard',
    start: '/assets/audio/boost/standard/start.m4a',
    loop: '/assets/audio/boost/standard/loop.m4a',
    end: '/assets/audio/boost/standard/release.m4a',
  },
  {
    id: 'flamethrower',
    label: 'Flamethrower',
    start: '/assets/audio/boost/flamethrower/start.m4a',
    loop: '/assets/audio/boost/flamethrower/loop.m4a',
    end: '/assets/audio/boost/flamethrower/end.m4a',
  },
  {
    id: 'plasma',
    label: 'Plasma',
    start: '/assets/audio/boost/plasma/start.m4a',
    loop: '/assets/audio/boost/plasma/loop.m4a',
    end: '/assets/audio/boost/plasma/end.m4a',
  },
]);

import staticAudioConfig from './audioConfig.json' with { type: 'json' };

export const CONSOLE_LOG_EVENT_CATALOG = Object.freeze([
  { type: 0x01, hex: '0x01', id: 'CAR_BALL_HIT', name: 'Car-Ball Hit', category: 'Incident' },
  { type: 0x02, hex: '0x02', id: 'CAR_CAR_BUMP', name: 'Car-Car Bump', category: 'Incident' },
  { type: 0x03, hex: '0x03', id: 'CAR_CAR_DEMO', name: 'Car Demolition', category: 'Incident' },
  { type: 0x04, hex: '0x04', id: 'BALL_WORLD_HIT', name: 'Ball-World Collision', category: 'Incident' },
  { type: 0x05, hex: '0x05', id: 'BALL_GOALPOST_HIT', name: 'Ball-Goalpost Collision', category: 'Incident' },
  { type: 0x06, hex: '0x06', id: 'CAR_JUMP', name: 'Single Jump', category: 'Incident' },
  { type: 0x07, hex: '0x07', id: 'CAR_DOUBLE_JUMP', name: 'Double Jump', category: 'Incident' },
  { type: 0x08, hex: '0x08', id: 'CAR_DODGE', name: 'Dodge / Flip', category: 'Incident' },
  { type: 0x09, hex: '0x09', id: 'CAR_SUPERSONIC_ENTER', name: 'Supersonic Entry', category: 'Incident' },
  { type: 0x0A, hex: '0x0a', id: 'BOOST_PICKUP', name: 'Boost Pad Pickup', category: 'Incident' },
  { type: 0x0B, hex: '0x0b', id: 'BOOST_SPAWN', name: 'Boost Pad Respawn', category: 'Incident' },
  { type: 0x0C, hex: '0x0c', id: 'CAR_BOOST_START', name: 'Car Boost Start', category: 'Incident' },
  { type: 0x0D, hex: '0x0d', id: 'CAR_BOOST_STOP', name: 'Car Boost Stop', category: 'Incident' },
  { type: 0x0E, hex: '0x0e', id: 'GOAL_SCORED', name: 'Goal Scored', category: 'Incident' },
  { type: 0x0F, hex: '0x0f', id: 'FLIP_RESET_GAINED', name: 'Flip Reset Gained', category: 'Incident' },
  { type: 0x10, hex: '0x10', id: 'BALL_STATE_CHANGE', name: 'Ball State Change', category: 'Incident' },
  { type: 0x11, hex: '0x11', id: 'POSSESSION_CHANGE', name: 'Possession Change', category: 'Incident' },

  { type: 0x80, hex: '0x80', id: 'MATCH_START', name: 'Match Start', category: 'Signal' },
  { type: 0x81, hex: '0x81', id: 'KICKOFF_PREPARE', name: 'Kickoff Prepare', category: 'Signal' },
  { type: 0x82, hex: '0x82', id: 'KICKOFF_GO', name: 'Kickoff Go', category: 'Signal' },
  { type: 0x83, hex: '0x83', id: 'COUNTDOWN_TICK', name: 'Countdown Tick', category: 'Signal' },
  { type: 0x84, hex: '0x84', id: 'MATCH_PAUSE', name: 'Match Pause', category: 'Signal' },
  { type: 0x85, hex: '0x85', id: 'MATCH_RESUME', name: 'Match Resume', category: 'Signal' },
  { type: 0x86, hex: '0x86', id: 'OVERTIME_START', name: 'Overtime Start', category: 'Signal' },
  { type: 0x87, hex: '0x87', id: 'MATCH_END', name: 'Match End', category: 'Signal' },
  { type: 0x88, hex: '0x88', id: 'REPLAY_START', name: 'Replay Start', category: 'Signal' },
  { type: 0x89, hex: '0x89', id: 'REPLAY_END', name: 'Replay End', category: 'Signal' },
]);

export function createDefaultLogEventFilter() {
  const filter = {};
  for (const item of CONSOLE_LOG_EVENT_CATALOG) {
    filter[item.hex.toLowerCase()] = false;
  }
  return filter;
}

export function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

export function clampVolume(v) {
  return Math.max(0, Math.min(5.0, Number(v) || 0));
}

export function dbToLinear(dB) {
  return Math.pow(10, dB / 20);
}

export const AUDIO_SETTINGS_KEY = STORAGE_KEYS.AUDIO_SETTINGS;
export const AUDIO_SETTINGS_CHANGED_EVENT = 'audio-settings-changed';

export const ADVANCED_AUDIO_CATEGORIES = Object.freeze([
  { id: 'all', label: 'All Details' },
  { id: 'suites', label: 'Master & Music Suites' },
  { id: 'signals', label: 'Match & Training Signals' },
  { id: 'incidents', label: 'Physics Incidents & Collisions' },
  { id: 'vehicle', label: 'Vehicle Actions & Powertrain' },
  { id: 'loops_ui', label: 'Ball Loops & UI Feedback' },
]);

export const ADVANCED_AUDIO_DETAIL_CATALOG = Object.freeze([
  // 1. Master & Music Suites
  {
    key: 'masterVolume',
    title: 'Master Output Gain',
    category: 'suites',
    categoryLabel: 'Master & Music Suites',
    assetHint: 'AudioMixer Master Bus',
    description: 'Global master output gain multiplier applied across all game audio buses.',
  },
  {
    key: 'anthemVolume',
    title: 'Player Anthem Suite (All Goal Stingers)',
    category: 'suites',
    categoryLabel: 'Master & Music Suites',
    assetHint: 'anthems/*.m4a · Unified Suite',
    description: 'Unified output level for the entire Player Anthem goal stinger and preview suite.',
  },
  {
    key: 'bgmBusVolume',
    title: 'Background Music Suite (Full Soundtrack)',
    category: 'suites',
    categoryLabel: 'Master & Music Suites',
    assetHint: 'bgm/*.m4a · Unified Suite',
    description: 'Unified output level for the entire Background Music soundtrack bus.',
  },

  // 2. Match & Training Signals
  {
    key: 'signalVolume',
    title: 'Match & Training Signal Bus Master',
    category: 'signals',
    categoryLabel: 'Match & Training Signals',
    assetHint: 'SignalAudioEngine Bus',
    description: 'Master bus multiplier for all kickoff, timer, overtime, and training broadcast signals.',
  },
  {
    key: 'countdown321Volume',
    title: 'Kickoff 3-2-1 Countdown Tick',
    category: 'signals',
    categoryLabel: 'Match & Training Signals',
    assetHint: 'match_countdown_321.m4a · 0x83',
    description: 'Volume level for each 3, 2, 1 kickoff countdown tick in matches.',
  },
  {
    key: 'matchStartGoVolume',
    title: 'Kickoff Go! Signal',
    category: 'signals',
    categoryLabel: 'Match & Training Signals',
    assetHint: 'match_start_go.m4a · 0x82',
    description: 'Volume level for the Go! signal played when kickoff lock releases.',
  },
  {
    key: 'trainingCountdownVolume',
    title: 'Training Countdown Tick',
    category: 'signals',
    categoryLabel: 'Match & Training Signals',
    assetHint: 'training_countdown.m4a',
    description: 'Volume level for countdown ticks in Kickoff Training and Static Training Packs.',
  },
  {
    key: 'trainingBallExpireVolume',
    title: 'Training Shot / Ball Expire',
    category: 'signals',
    categoryLabel: 'Match & Training Signals',
    assetHint: 'training_ball_expire.m4a',
    description: 'Volume level when a training shot timer expires or ball touches ground at 0s.',
  },
  {
    key: 'alert60sVolume',
    title: '60 Seconds Remaining Alert',
    category: 'signals',
    categoryLabel: 'Match & Training Signals',
    assetHint: 'match_60_seconds_left.m4a',
    description: 'Volume level for the 60 seconds remaining broadcast cue.',
  },
  {
    key: 'alert30sVolume',
    title: '30 Seconds Remaining Alert',
    category: 'signals',
    categoryLabel: 'Match & Training Signals',
    assetHint: 'match_30_seconds_left.m4a',
    description: 'Volume level for the 30 seconds remaining broadcast cue.',
  },
  {
    key: 'countdown10sVolume',
    title: 'Final 10-Second Countdown Tick',
    category: 'signals',
    categoryLabel: 'Match & Training Signals',
    assetHint: 'match_countdown_10s.m4a',
    description: 'Volume level for the 10-second final match countdown ticks (10 down to 1).',
  },
  {
    key: 'overtimeVolume',
    title: 'Entering Overtime Signal',
    category: 'signals',
    categoryLabel: 'Match & Training Signals',
    assetHint: 'match_entering_overtime.m4a · 0x86',
    description: 'Volume level for the Entering Overtime broadcast stinger.',
  },
  {
    key: 'endgameVolume',
    title: 'Match Ended / Podium Stinger',
    category: 'signals',
    categoryLabel: 'Match & Training Signals',
    assetHint: 'endgame.m4a · 0x87',
    description: 'Volume level for the final match end / podium stinger.',
  },

  // 3. Physics Incidents & Collisions
  {
    key: 'ballCollisionVolume',
    title: 'Ball & Arena Collision Bus Master',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'IncidentAudioEngine Bus',
    description: 'Master bus multiplier applied across all ball-car and ball-arena collision impacts.',
  },
  {
    key: 'carBallHitVolume',
    title: 'Car-Ball Hit (Vehicle Body 01–04)',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'impacts/vehicle-body-01..04.m4a · 0x01',
    description: 'Volume level for car-ball impacts using the 4-sample Vehicle Body pool.',
  },
  {
    key: 'carBallAccentVolume',
    title: 'Car-Ball Hit (Vehicle Accent)',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'impacts/vehicle-accent-01.m4a · 0x01',
    description: 'Volume level for car-ball impacts when Vehicle Accent mode is active.',
  },
  {
    key: 'carCarCollisionVolume',
    title: 'Car-Car Bump (Vehicle Detail 01–06)',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'impacts/vehicle-detail-01..06.m4a · 0x02',
    description: 'Volume level for car-to-car bumps using the 6-sample Vehicle Detail pool.',
  },
  {
    key: 'carCarSfxCollisionVolume',
    title: 'Car-Car Bump (SFX Collision)',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'sfx_car_collision.m4a · 0x02',
    description: 'Volume level for car-to-car bumps when SoundFX Collision mode is active.',
  },
  {
    key: 'carDemoVolume',
    title: 'Car Demolition Explosion',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'sfx_goal_poof.m4a (0.85x) · 0x03',
    description: 'Volume level for high-speed car demolition explosions.',
  },
  {
    key: 'ballFloorHitVolume',
    title: 'Ball Floor / Ground Impact',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'impacts/vehicle-body-01..03.m4a · 0x04',
    description: 'Volume level when the ball impacts the stadium turf / floor.',
  },
  {
    key: 'ballNetHitVolume',
    title: 'Ball Sidewall / Backboard / Ceiling Impact',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'sidewallhit/SFX_Impacts_*.m4a · 0x04',
    description: 'Volume level when the ball impacts sidewalls, backboards, ceiling, or 45-degree corners.',
  },
  {
    key: 'ballRampHitVolume',
    title: 'Ball Ramp & Transition Curve Impact',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'impacts/vehicle-body-01..03.m4a · 0x04',
    description: 'Volume level when the ball impacts bottom/top wall transition ramps.',
  },
  {
    key: 'goalpostHitVolume',
    title: 'Crossbar & Goalpost Ping (High-Speed Large 01–06)',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'crossbar_ping/ping-01..06.m4a · 0x05',
    description: 'Volume level for high-speed (>= 1400 uu/s) metallic crossbar and goalpost pings.',
  },
  {
    key: 'goalpostSmallHitVolume',
    title: 'Crossbar & Goalpost Ping (Low-Speed Small 01–06)',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'crossbar_ping/ping-small-01..06.m4a · 0x05',
    description: 'Volume level for softer (< 1400 uu/s) crossbar and goalpost pings.',
  },
  {
    key: 'boostCollectVolume',
    title: 'Boost Pad Pickup / Collect',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'boost_collect.m4a · 0x0a',
    description: 'Volume level when collecting small or full boost pads on the field.',
  },
  {
    key: 'goalScoredVolume',
    title: 'Goal Scored Explosion (Poof)',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'sfx_goal_poof.m4a · 0x0e',
    description: 'Volume level for the goal explosion impact sound.',
  },
  {
    key: 'flipResetVolume',
    title: 'Flip Reset Gained',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'events/reset.m4a · 0x0f',
    description: 'Volume level for the cue played when all 4 wheels contact the ball mid-air.',
  },
  {
    key: 'wheelImpactVolume',
    title: 'Wheel Landing / Suspension Impact (01–04)',
    category: 'incidents',
    categoryLabel: 'Physics Incidents & Collisions',
    assetHint: 'vehicle/wheel-impact-01..04.m4a',
    description: 'Volume level for chassis suspension and wheel landing impacts.',
  },

  // 4. Vehicle Actions & Powertrain
  {
    key: 'vehicleSelfVolume',
    title: 'Self Vehicle Perspective Bus',
    category: 'vehicle',
    categoryLabel: 'Vehicle Actions & Powertrain',
    assetHint: 'VehicleAudioEmitter Self Bus',
    description: 'Master gain multiplier for the local player vehicle audio perspective.',
  },
  {
    key: 'engineVolume',
    title: 'Electric Motor Synth (EMotorSynth)',
    category: 'vehicle',
    categoryLabel: 'Vehicle Actions & Powertrain',
    assetHint: 'EMotorSynth 11-Harmonic DSP',
    description: 'Volume level for the procedural electric motor whine synthesizer.',
  },
  {
    key: 'boostVolume',
    title: 'Boost Bus Master',
    category: 'vehicle',
    categoryLabel: 'Vehicle Actions & Powertrain',
    assetHint: 'Boost Master Bus',
    description: 'Master multiplier across Boost Start, Sustain Loop, Tail Release, and Pickup.',
  },
  {
    key: 'boostStartVolume',
    title: 'Boost Ignition Start',
    category: 'vehicle',
    categoryLabel: 'Vehicle Actions & Powertrain',
    assetHint: 'boost/*/start.m4a · 0x0c',
    description: 'Volume level for the initial rocket boost ignition burst.',
  },
  {
    key: 'boostLoopVolume',
    title: 'Boost Sustain Loop',
    category: 'vehicle',
    categoryLabel: 'Vehicle Actions & Powertrain',
    assetHint: 'boost/*/loop.m4a',
    description: 'Volume level for the continuous rocket boost turbine sustain loop.',
  },
  {
    key: 'boostReleaseVolume',
    title: 'Boost Tail Release / End',
    category: 'vehicle',
    categoryLabel: 'Vehicle Actions & Powertrain',
    assetHint: 'boost/*/release|end.m4a · 0x0d',
    description: 'Volume level for the exhaust tail release when releasing boost.',
  },
  {
    key: 'jumpVolume',
    title: 'Single Jump (01–04)',
    category: 'vehicle',
    categoryLabel: 'Vehicle Actions & Powertrain',
    assetHint: 'vehicle/jump-01..04.m4a · 0x06',
    description: 'Volume level for first-jump pneumatic bursts.',
  },
  {
    key: 'doubleJumpVolume',
    title: 'Double Jump (01–04)',
    category: 'vehicle',
    categoryLabel: 'Vehicle Actions & Powertrain',
    assetHint: 'vehicle/double-jump-01..04.m4a · 0x07',
    description: 'Volume level for neutral aerial double-jump bursts.',
  },
  {
    key: 'dodgeVolume',
    title: 'Dodge / Directional Flip (01–04)',
    category: 'vehicle',
    categoryLabel: 'Vehicle Actions & Powertrain',
    assetHint: 'vehicle/dodge-01..04.m4a · 0x08',
    description: 'Volume level for directional dodge and flip impulse bursts.',
  },
  {
    key: 'supersonicEnterVolume',
    title: 'Supersonic Entry Burst (A/B/C)',
    category: 'vehicle',
    categoryLabel: 'Vehicle Actions & Powertrain',
    assetHint: 'vehicle/supersonic-enter-a..c.m4a · 0x09',
    description: 'Volume level for the sonic boom burst when crossing the supersonic threshold.',
  },
  {
    key: 'supersonicLoopVolume',
    title: 'Supersonic Wind Sustain Loop',
    category: 'vehicle',
    categoryLabel: 'Vehicle Actions & Powertrain',
    assetHint: 'vehicle/supersonic-loop.m4a',
    description: 'Volume level for the continuous 3D vehicle supersonic wind loop.',
  },
  {
    key: 'supersonicStateVolume',
    title: 'Supersonic State Ambience',
    category: 'vehicle',
    categoryLabel: 'Vehicle Actions & Powertrain',
    assetHint: 'sfx_state_supersonic.m4a',
    description: 'Volume level for the stereo supersonic state ambience layer.',
  },

  // 5. Continuous Ball Loops & UI Feedback
  {
    key: 'ballRollingVolume',
    title: 'Ball Surface Rolling Loop',
    category: 'loops_ui',
    categoryLabel: 'Ball Loops & UI Feedback',
    assetHint: 'ballrolling.m4a',
    description: 'Volume level for the continuous 3D ball surface rolling loop on floor and walls.',
  },
  {
    key: 'ballFlyingVolume',
    title: 'Ball Aerial Falling Loop',
    category: 'loops_ui',
    categoryLabel: 'Ball Loops & UI Feedback',
    assetHint: 'ballflying.m4a',
    description: 'Volume level for the downward aerial ball falling wind loop.',
  },
  {
    key: 'errorNoBoostVolume',
    title: 'No Boost Empty Trigger',
    category: 'loops_ui',
    categoryLabel: 'Ball Loops & UI Feedback',
    assetHint: 'sfx_error_no_boost.m4a',
    description: 'Volume level for the empty tank click when pressing boost at 0 boost.',
  },
  {
    key: 'uiClickVolume',
    title: 'UI Button Click Feedback',
    category: 'loops_ui',
    categoryLabel: 'Ball Loops & UI Feedback',
    assetHint: 'sfx_error_no_boost.m4a (2.0x)',
    description: 'Volume level for interactive UI button click feedback.',
  },
]);

export const DEFAULT_AUDIO_CONFIG = Object.freeze({
  ...staticAudioConfig,
  carBallSoundMode: 'vehicle_body',
  carCarSoundMode: 'vehicle_detail',
  boostStartVariation: DEFAULT_BOOST_VARIATION,
  boostLoopVariation: DEFAULT_BOOST_VARIATION,
  boostEndVariation: DEFAULT_BOOST_VARIATION,
  spatialPanningModel: 'equalpower',
  distanceModel: 'smoothstep',
  distanceUnitScale: 0.01,
  rolloffMinDistance: 400.0,
  rolloffMaxDistance: 13000.0,
  minAudibleGainFloor: 0.15,
  airAbsorptionDamping: 0.0,
  muteSignalAudioInGoalReplay: true,
  logEventFilter: createDefaultLogEventFilter(),
});

export const DEFAULT_AUDIO_SETTINGS = DEFAULT_AUDIO_CONFIG;
