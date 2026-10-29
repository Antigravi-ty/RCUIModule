import {
  LAYER1_CONTEXT_VARIATIONS,
  type Layer1MenuContextMode,
} from './Layer1MainMenuRecipe';
import type { OnlineSessionContextId } from './Layer2RoomHostControlRecipe';
import type { CreationProgressStatus } from './online/OnlineRoomCreationProgress';
import type { HostMatchConfig } from './Layer3HostMatchRecipe';
import type { JoinRoomConfig } from './Layer3JoinRoomRecipe';
import type { HostTrainingGhostMode } from './Layer3HostTrainingRecipe';

export interface RecipeStateSnapshotSpec<TProps> {
  id: string;
  label: string;
  description: string;
  props: TProps;
}

export const LAYER1_MAIN_MENU_STATES: RecipeStateSnapshotSpec<{
  contextMode: Layer1MenuContextMode;
}>[] = LAYER1_CONTEXT_VARIATIONS.map((meta) => ({
  id: meta.id,
  label: meta.label,
  description: meta.description ?? meta.label,
  props: { contextMode: meta.id },
}));

export const LAYER2_ROOM_HOST_CONTROL_STATES: RecipeStateSnapshotSpec<{
  sessionContext: OnlineSessionContextId;
}>[] = [
  {
    id: 'match-lobby-host',
    label: 'Match Lobby (Host)',
    description: 'Pre-match lobby managed by the room host with team slots, bot fill controls, and Start Match CTA.',
    props: { sessionContext: 'match-lobby-host' },
  },
  {
    id: 'match-lobby-client',
    label: 'Match Lobby (Client)',
    description: 'Pre-match lobby viewed by a connected peer with team selection and daisy-chain spectating status.',
    props: { sessionContext: 'match-lobby-client' },
  },
  {
    id: 'online-match-host',
    label: 'During Match (Host)',
    description: 'Live match room control for the host with pause toggle, spectator routing diagnostics, and server shutdown.',
    props: { sessionContext: 'online-match-host' },
  },
  {
    id: 'online-match-client',
    label: 'During Match (Client)',
    description: 'Live match room info for a connected client with pause request, relay status, and leave room action.',
    props: { sessionContext: 'online-match-client' },
  },
  {
    id: 'online-warmup-host',
    label: 'Online Warmup (Host)',
    description: 'Teamless warmup session control for the host with up to 6 active players and advanced management.',
    props: { sessionContext: 'online-warmup-host' },
  },
  {
    id: 'online-warmup-client',
    label: 'Online Warmup (Client)',
    description: 'Teamless warmup session info for a peer with client-side Ghost Mode toggle and leave room action.',
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
    props: { progressStatus: 'idle', currentStep: 1 },
  },
  {
    id: 'running-step-2',
    label: 'Step 2/5 · Signaling Handshake',
    description: 'Connecting to WebSocket signaling relay (wss://relay.carsoccer.dev).',
    props: { progressStatus: 'running', currentStep: 2 },
  },
  {
    id: 'running-step-4',
    label: 'Step 4/5 · ICE & DataChannel',
    description: 'Negotiating WebRTC SDP offers and probing STUN/TURN candidates.',
    props: { progressStatus: 'running', currentStep: 4 },
  },
  {
    id: 'completed',
    label: 'Step 5/5 · Connected',
    description: 'Arena snapshot synchronized and ready to enter peer lobby.',
    props: { progressStatus: 'completed', currentStep: 5 },
  },
  {
    id: 'error-step-3',
    label: 'Step 3/5 · Error (Room Not Found)',
    description: 'Room lookup failed or access key was rejected during step 3.',
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
    props: { defaultEditingConfig: false, progressStatus: 'idle', currentStep: 1 },
  },
  {
    id: 'idle-expanded',
    label: 'Idle (Configuration Expanded)',
    description: 'Expanded disclosure box showing Team Format, Bot Fill Policy, Match Duration, and Advanced Settings.',
    props: { defaultEditingConfig: true, progressStatus: 'idle', currentStep: 1 },
  },
  {
    id: 'running-step-3',
    label: 'Step 3/5 · Registering Room Code',
    description: 'Binding room access code and key on the peer discovery relay.',
    props: { defaultEditingConfig: false, progressStatus: 'running', currentStep: 3 },
  },
  {
    id: 'completed',
    label: 'Step 5/5 · Room Created',
    description: 'Local 120Hz authority initialized and match lobby spawned.',
    props: { defaultEditingConfig: false, progressStatus: 'completed', currentStep: 5 },
  },
  {
    id: 'error-step-3',
    label: 'Step 3/5 · Error (Code Conflict)',
    description: 'Room code conflict or relay rejection encountered during registration.',
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
    props: { defaultGhostMode: 'automatically-enable', progressStatus: 'idle', currentStep: 1 },
  },
  {
    id: 'running-step-3',
    label: 'Step 3/5 · Registering Training Room',
    description: 'Registering shared training session code on signaling relay.',
    props: { defaultGhostMode: 'automatically-enable', progressStatus: 'running', currentStep: 3 },
  },
  {
    id: 'completed',
    label: 'Step 5/5 · Training Room Ready',
    description: 'Shared training session initialized and ready for peers.',
    props: { defaultGhostMode: 'manual', progressStatus: 'completed', currentStep: 5 },
  },
  {
    id: 'error-step-3',
    label: 'Step 3/5 · Error (Signaling Rejected)',
    description: 'Simulated signaling or registration failure on step 3.',
    props: { defaultGhostMode: 'automatically-enable', progressStatus: 'error', currentStep: 3 },
  },
];
