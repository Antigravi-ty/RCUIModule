import {
  LAYER1_CONTEXT_VARIATIONS,
  type Layer1MenuContextMode,
} from './Layer1MainMenuRecipe';
import type { OnlineSessionContextId } from './Layer2RoomHostControlRecipe';
import type { CreationProgressStatus } from './online/OnlineRoomCreationProgress';
import type { HostMatchConfig } from './Layer3HostMatchRecipe';
import type { JoinRoomConfig } from './Layer3JoinRoomRecipe';
import type { HostTrainingGhostMode } from './Layer3HostTrainingRecipe';
import type { GarageTabId } from './Layer2GarageRecipe';
import type { SettingsTabId } from './Layer2SettingsRecipe';

export interface RecipeStateSnapshotSpec<TProps> {
  id: string;
  label: string;
  description: string;
  componentName?: string;
  sourceFile?: string;
  subViewFile?: string;
  props: TProps;
}

export const LAYER1_MAIN_MENU_STATES: RecipeStateSnapshotSpec<{
  contextMode: Layer1MenuContextMode;
}>[] = LAYER1_CONTEXT_VARIATIONS.map((meta) => ({
  id: meta.id,
  label: meta.label,
  description: meta.description ?? meta.label,
  componentName: 'Layer1MainMenuRecipe',
  sourceFile: 'src/ui-core/recipes/Layer1MainMenuRecipe.tsx',
  subViewFile: 'src/ui-core/recipes/layer1MenuContextSpecs.ts',
  props: { contextMode: meta.id },
}));

export const LAYER2_GARAGE_STATES: RecipeStateSnapshotSpec<{
  activeTab: GarageTabId;
}>[] = [
  {
    id: 'garage-car',
    label: '1. Car Body Selection',
    description: '7 vehicle chassis presets with Octane / Dominus / Plank / Hybrid hitbox archetype badges.',
    componentName: 'Layer2GarageRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2GarageRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/garage/GarageCarTab.tsx',
    props: { activeTab: 'car' },
  },
  {
    id: 'garage-paint',
    label: '2. Paint & Team Priority',
    description: 'Primary team preview, Matte/Metallic paint finish, and 6-slot Blue/Orange color preference order.',
    componentName: 'Layer2GarageRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2GarageRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/garage/GarageColorTab.tsx',
    props: { activeTab: 'paint' },
  },
  {
    id: 'garage-loadout',
    label: '3. Loadout & Visual FX',
    description: 'Ball visual style, demolition FX, boost trail visual, 4 boost audio variations, and luminance.',
    componentName: 'Layer2GarageRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2GarageRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/garage/GarageMaterialsTab.tsx',
    props: { activeTab: 'loadout' },
  },
  {
    id: 'garage-anthem',
    label: '4. Player Anthem',
    description: 'Goal celebration anthem selector and under-construction placeholder fallback.',
    componentName: 'Layer2GarageRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2GarageRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/garage/GarageAnthemTab.tsx',
    props: { activeTab: 'anthem' },
  },
  {
    id: 'garage-sync',
    label: '5. Cloud Profile Sync',
    description: 'Cross-device loadout and profile synchronization status tab.',
    componentName: 'Layer2GarageRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2GarageRecipe.tsx',
    props: { activeTab: 'sync' },
  },
];

export const LAYER2_SETTINGS_STATES: RecipeStateSnapshotSpec<{
  activeTab: SettingsTabId;
  developerMode?: boolean;
}>[] = [
  {
    id: 'settings-gameplay',
    label: '1. Gameplay Settings',
    description: 'Camera, Keybindings, Ball Cam Indicator, Trajectory Predictor, Training Config, and Clock Pacing priority.',
    componentName: 'Layer2SettingsRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2SettingsRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/settings/tabs/GameplayTab.tsx',
    props: { activeTab: 'gameplay', developerMode: true },
  },
  {
    id: 'settings-audio',
    label: '2. Audio Settings',
    description: 'Master, Engine, and Boost volume sliders, Acoustics & EQ entry, and background mute toggle.',
    componentName: 'Layer2SettingsRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2SettingsRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/settings/tabs/AudioTab.tsx',
    props: { activeTab: 'audio', developerMode: true },
  },
  {
    id: 'settings-display',
    label: '3. Display & Graphics',
    description: 'Theme toggle, UI Scale, Safe Area Margin, FPS limiter, Render Scale, and Menu Power Save mode.',
    componentName: 'Layer2SettingsRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2SettingsRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/settings/tabs/DisplayTab.tsx',
    props: { activeTab: 'display', developerMode: true },
  },
  {
    id: 'settings-advanced',
    label: '4. Advanced & Telemetry',
    description: 'Input buffer target/thresholds, HUD telemetry overlay configuration, user floating monitors, and Developer Mode unlock.',
    componentName: 'Layer2SettingsRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2SettingsRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/settings/tabs/AdvancedTab.tsx',
    props: { activeTab: 'advanced', developerMode: true },
  },
  {
    id: 'settings-developer',
    label: '5. Developer Hub',
    description: 'Subsystem Isolation Lab, Active Tuners, Calibrated Presets, Under Development, and Safe Area boundary observer.',
    componentName: 'Layer2SettingsRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2SettingsRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/settings/tabs/DeveloperTab.tsx',
    props: { activeTab: 'developer', developerMode: true },
  },
];

export const LAYER2_ROOM_HOST_CONTROL_STATES: RecipeStateSnapshotSpec<{
  sessionContext: OnlineSessionContextId;
}>[] = [
  {
    id: 'match-lobby-host',
    label: 'Match Lobby (Host)',
    description: 'Pre-match lobby managed by the room host with team slots, bot fill controls, and Start Match CTA.',
    componentName: 'Layer2RoomHostControlRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2RoomHostControlRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/MatchLobbyRoomRecipe.tsx',
    props: { sessionContext: 'match-lobby-host' },
  },
  {
    id: 'match-lobby-client',
    label: 'Match Lobby (Client)',
    description: 'Pre-match lobby viewed by a connected peer with team selection and daisy-chain spectating status.',
    componentName: 'Layer2RoomHostControlRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2RoomHostControlRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/MatchLobbyRoomRecipe.tsx',
    props: { sessionContext: 'match-lobby-client' },
  },
  {
    id: 'online-match-host',
    label: 'During Match (Host)',
    description: 'Live match room control for the host with pause toggle, spectator routing diagnostics, and server shutdown.',
    componentName: 'Layer2RoomHostControlRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2RoomHostControlRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/DuringMatchRoomRecipe.tsx',
    props: { sessionContext: 'online-match-host' },
  },
  {
    id: 'online-match-client',
    label: 'During Match (Client)',
    description: 'Live match room info for a connected client with pause request, relay status, and leave room action.',
    componentName: 'Layer2RoomHostControlRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2RoomHostControlRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/DuringMatchRoomRecipe.tsx',
    props: { sessionContext: 'online-match-client' },
  },
  {
    id: 'online-warmup-host',
    label: 'Online Warmup (Host)',
    description: 'Teamless warmup session control for the host with up to 6 active players and advanced management.',
    componentName: 'Layer2RoomHostControlRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2RoomHostControlRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/OnlineWarmupRoomRecipe.tsx',
    props: { sessionContext: 'online-warmup-host' },
  },
  {
    id: 'online-warmup-client',
    label: 'Online Warmup (Client)',
    description: 'Teamless warmup session info for a peer with client-side Ghost Mode toggle and leave room action.',
    componentName: 'Layer2RoomHostControlRecipe',
    sourceFile: 'src/ui-core/recipes/Layer2RoomHostControlRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/OnlineWarmupRoomRecipe.tsx',
    props: { sessionContext: 'online-warmup-client' },
  },
];

export const LAYER3_JOIN_ROOM_STATES: RecipeStateSnapshotSpec<{
  config?: Partial<JoinRoomConfig>;
  progressStatus: CreationProgressStatus;
  currentStep: number;
}>[] = [
  {
    id: 'idle',
    label: 'Idle Form',
    description: 'Initial join room form prior to initiating peer signaling handshake.',
    componentName: 'Layer3JoinRoomRecipe',
    sourceFile: 'src/ui-core/recipes/Layer3JoinRoomRecipe.tsx',
    props: { progressStatus: 'idle', currentStep: 1 },
  },
  {
    id: 'running-step-2',
    label: 'Step 2/5 · Signaling Handshake',
    description: 'Connecting to WebSocket signaling relay (wss://relay.carsoccer.dev).',
    componentName: 'Layer3JoinRoomRecipe',
    sourceFile: 'src/ui-core/recipes/Layer3JoinRoomRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/OnlineRoomCreationProgress.tsx',
    props: { progressStatus: 'running', currentStep: 2 },
  },
  {
    id: 'running-step-4',
    label: 'Step 4/5 · ICE & DataChannel',
    description: 'Negotiating WebRTC SDP offers and probing STUN/TURN candidates.',
    componentName: 'Layer3JoinRoomRecipe',
    sourceFile: 'src/ui-core/recipes/Layer3JoinRoomRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/OnlineRoomCreationProgress.tsx',
    props: { progressStatus: 'running', currentStep: 4 },
  },
  {
    id: 'completed',
    label: 'Step 5/5 · Connected',
    description: 'Arena snapshot synchronized and ready to enter peer lobby.',
    componentName: 'Layer3JoinRoomRecipe',
    sourceFile: 'src/ui-core/recipes/Layer3JoinRoomRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/OnlineRoomCreationProgress.tsx',
    props: { progressStatus: 'completed', currentStep: 5 },
  },
  {
    id: 'error-step-3',
    label: 'Step 3/5 · Error (Room Not Found)',
    description: 'Room lookup failed or access key was rejected during step 3.',
    componentName: 'Layer3JoinRoomRecipe',
    sourceFile: 'src/ui-core/recipes/Layer3JoinRoomRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/OnlineRoomCreationProgress.tsx',
    props: { progressStatus: 'error', currentStep: 3 },
  },
];

export const LAYER3_HOST_MATCH_STATES: RecipeStateSnapshotSpec<{
  config?: Partial<HostMatchConfig>;
  defaultEditingConfig?: boolean;
  progressStatus: CreationProgressStatus;
  currentStep: number;
}>[] = [
  {
    id: 'idle-collapsed',
    label: 'Idle (Summary Collapsed)',
    description: 'Default compact host match form showing 3-column configuration summary.',
    componentName: 'Layer3HostMatchRecipe',
    sourceFile: 'src/ui-core/recipes/Layer3HostMatchRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/OnlineRoomConfigSummaryCard.tsx',
    props: { defaultEditingConfig: false, progressStatus: 'idle', currentStep: 1 },
  },
  {
    id: 'idle-expanded',
    label: 'Idle (Configuration Expanded)',
    description: 'Expanded disclosure box showing Team Format, Bot Fill Policy, Match Duration, and Advanced Settings.',
    componentName: 'Layer3HostMatchRecipe',
    sourceFile: 'src/ui-core/recipes/Layer3HostMatchRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/OnlineRoomConfigSummaryCard.tsx',
    props: { defaultEditingConfig: true, progressStatus: 'idle', currentStep: 1 },
  },
  {
    id: 'running-step-3',
    label: 'Step 3/5 · Registering Room Code',
    description: 'Binding room access code and key on the peer discovery relay.',
    componentName: 'Layer3HostMatchRecipe',
    sourceFile: 'src/ui-core/recipes/Layer3HostMatchRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/OnlineRoomCreationProgress.tsx',
    props: { defaultEditingConfig: false, progressStatus: 'running', currentStep: 3 },
  },
  {
    id: 'completed',
    label: 'Step 5/5 · Room Created',
    description: 'Local 120Hz authority initialized and match lobby spawned.',
    componentName: 'Layer3HostMatchRecipe',
    sourceFile: 'src/ui-core/recipes/Layer3HostMatchRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/OnlineRoomCreationProgress.tsx',
    props: { defaultEditingConfig: false, progressStatus: 'completed', currentStep: 5 },
  },
  {
    id: 'error-step-3',
    label: 'Step 3/5 · Error (Code Conflict)',
    description: 'Room code conflict or relay rejection encountered during registration.',
    componentName: 'Layer3HostMatchRecipe',
    sourceFile: 'src/ui-core/recipes/Layer3HostMatchRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/OnlineRoomCreationProgress.tsx',
    props: { defaultEditingConfig: false, progressStatus: 'error', currentStep: 3 },
  },
];

export const LAYER3_HOST_TRAINING_STATES: RecipeStateSnapshotSpec<{
  defaultGhostMode?: HostTrainingGhostMode;
  progressStatus: CreationProgressStatus;
  currentStep: number;
}>[] = [
  {
    id: 'idle',
    label: 'Idle Form',
    description: 'Default host training setup with identity fields and Ghost Mode policy.',
    componentName: 'Layer3HostTrainingRecipe',
    sourceFile: 'src/ui-core/recipes/Layer3HostTrainingRecipe.tsx',
    props: { defaultGhostMode: 'automatically-enable', progressStatus: 'idle', currentStep: 1 },
  },
  {
    id: 'running-step-3',
    label: 'Step 3/5 · Registering Training Room',
    description: 'Registering shared training session code on signaling relay.',
    componentName: 'Layer3HostTrainingRecipe',
    sourceFile: 'src/ui-core/recipes/Layer3HostTrainingRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/OnlineRoomCreationProgress.tsx',
    props: { defaultGhostMode: 'automatically-enable', progressStatus: 'running', currentStep: 3 },
  },
  {
    id: 'completed',
    label: 'Step 5/5 · Training Room Ready',
    description: 'Shared training session initialized and ready for peers.',
    componentName: 'Layer3HostTrainingRecipe',
    sourceFile: 'src/ui-core/recipes/Layer3HostTrainingRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/OnlineRoomCreationProgress.tsx',
    props: { defaultGhostMode: 'manual', progressStatus: 'completed', currentStep: 5 },
  },
  {
    id: 'error-step-3',
    label: 'Step 3/5 · Error (Signaling Rejected)',
    description: 'Simulated signaling or registration failure on step 3.',
    componentName: 'Layer3HostTrainingRecipe',
    sourceFile: 'src/ui-core/recipes/Layer3HostTrainingRecipe.tsx',
    subViewFile: 'src/ui-core/recipes/online/OnlineRoomCreationProgress.tsx',
    props: { defaultGhostMode: 'automatically-enable', progressStatus: 'error', currentStep: 3 },
  },
];
