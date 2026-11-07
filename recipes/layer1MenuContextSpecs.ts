import React from 'react';
import type { SurfaceVariantMeta } from '../manifest/surfaceMetaTypes';
import {
  normalizeMainMenuContextMode,
  type MainMenuIconColorValue,
} from '../stores/mainMenuStyleStore';

export type CanonicalLayer1ContextVariation =
  | 'freeplay'
  | 'replay-viewer'
  | 'exhibition'
  | 'match-lobby-host'
  | 'match-lobby-client'
  | 'online-match-host'
  | 'online-match-client'
  | 'online-warmup-host'
  | 'online-warmup-client'
  | 'kickoff-training'
  | 'static-training-play'
  | 'static-training-edit'
  | 'dev-test-lab'
  | 'exp-multi-bots';

export type Layer1ContextVariation =
  | CanonicalLayer1ContextVariation
  | 'match'
  | 'custom-match-host'
  | 'custom-match-client';

export type Layer1MenuContextMode = Layer1ContextVariation;

export type Layer1ContextGroupId =
  | 'base'
  | 'singleplayer'
  | 'online-match'
  | 'online-warmup'
  | 'training'
  | 'developer';

export type Layer1CustomRowIconType =
  | 'gamepad-2'
  | 'house-cog'
  | 'user-round-cog'
  | 'info'
  | 'bot';

export interface Layer1ContextCustomRowSpec {
  slotId: 'play' | 'configure';
  title: string;
  subtitle: string;
  iconType: Layer1CustomRowIconType;
  iconColorToken?: MainMenuIconColorValue;
  iconColorClass?: string;
  actionType: 'play' | 'manage-room' | 'exp-multi-bots';
}

export interface Layer1ContextBottomRowSpec {
  slotId: 'leave';
  title: string;
  subtitle: string;
  iconColorClass: string;
  variant: 'secondary' | 'danger';
  actionType: 'return-freeplay' | 'leave-room' | 'exit-edit-mode';
}

export interface Layer1ContextMeta {
  id: CanonicalLayer1ContextVariation;
  label: string;
  shortLabel: string;
  tier: 'user' | 'developer';
  headerTitle: string;
  groupId: Layer1ContextGroupId;
  groupLabel: string;
  role?: 'host' | 'client';
  stage?: 'lobby' | 'match';
  description?: string;
  customActionRow?: Layer1ContextCustomRowSpec;
  showGarage: boolean;
  showSettings: boolean;
  showRestartMatch: boolean;
  bottomActionRow?: Layer1ContextBottomRowSpec;
}

export interface Layer1ContextGroupMeta {
  id: Layer1ContextGroupId;
  label: string;
  tier: 'user' | 'developer';
}

export const LAYER1_CONTEXT_GROUPS: Layer1ContextGroupMeta[] = [
  { id: 'base', label: 'Base · Free Play', tier: 'user' },
  { id: 'singleplayer', label: 'Singleplayer · Exhibition', tier: 'user' },
  { id: 'online-match', label: 'Online Match · Lobby & Match', tier: 'user' },
  { id: 'online-warmup', label: 'Online Warmup · Host & Client', tier: 'user' },
  { id: 'training', label: 'Training · Variants', tier: 'user' },
  { id: 'developer', label: 'Developer · Sandboxes', tier: 'developer' },
];

const PLAY_CUSTOM_ROW: Layer1ContextCustomRowSpec = {
  slotId: 'play',
  title: 'Play',
  subtitle: 'Single player bot & multiplayer matches',
  iconType: 'gamepad-2',
  actionType: 'play',
};

const LEAVE_ROOM_BOTTOM_ROW: Layer1ContextBottomRowSpec = {
  slotId: 'leave',
  title: 'Leave Room',
  subtitle: 'Disconnect session and return to Free Play',
  iconColorClass: 'text-rose-400',
  variant: 'secondary',
  actionType: 'leave-room',
};

const LEAVE_MATCH_BOTTOM_ROW: Layer1ContextBottomRowSpec = {
  slotId: 'leave',
  title: 'Leave Match',
  subtitle: 'Abandon match session and return to Free Play',
  iconColorClass: 'text-rose-400',
  variant: 'secondary',
  actionType: 'leave-room',
};

const makeExitFreeplayBottomRow = (subtitle: string): Layer1ContextBottomRowSpec => ({
  slotId: 'leave',
  title: 'Exit to Free Play',
  subtitle,
  iconColorClass: 'text-amber-400',
  variant: 'secondary',
  actionType: 'return-freeplay',
});

export const LAYER1_CONTEXT_VARIATIONS: Layer1ContextMeta[] = [
  {
    id: 'freeplay',
    label: 'Free Play (MENU)',
    shortLabel: 'Free Play',
    tier: 'user',
    headerTitle: 'MENU',
    groupId: 'base',
    groupLabel: 'Base',
    description: 'Base Free Play menu: Resume, Play, Garage, Settings',
    customActionRow: PLAY_CUSTOM_ROW,
    showGarage: true,
    showSettings: true,
    showRestartMatch: false,
  },
  {
    id: 'exhibition',
    label: 'Exhibition (EXHIBITION)',
    shortLabel: 'Exhibition',
    tier: 'user',
    headerTitle: 'EXHIBITION',
    groupId: 'singleplayer',
    groupLabel: 'Singleplayer',
    description: 'Singleplayer Exhibition match: Resume, Garage, Settings, Exit to Free Play',
    showGarage: true,
    showSettings: true,
    showRestartMatch: false,
    bottomActionRow: makeExitFreeplayBottomRow('Leave Exhibition match and return to Free Play'),
  },
  {
    id: 'match-lobby-host',
    label: 'Match Lobby — Host (MATCH LOBBY)',
    shortLabel: 'Match Lobby (Host)',
    tier: 'user',
    headerTitle: 'MATCH LOBBY',
    groupId: 'online-match',
    groupLabel: 'Online Match',
    role: 'host',
    stage: 'lobby',
    description: 'Match Lobby (Host): Resume, Configure Room (house-cog, blue), Garage, Settings, Leave Room',
    customActionRow: {
      slotId: 'configure',
      title: 'Configure Room',
      subtitle: 'Configure lobby ruleset, bot policies & connected players',
      iconType: 'house-cog',
      iconColorToken: 'sky',
      iconColorClass: 'text-sky-400',
      actionType: 'manage-room',
    },
    showGarage: true,
    showSettings: true,
    showRestartMatch: false,
    bottomActionRow: LEAVE_ROOM_BOTTOM_ROW,
  },
  {
    id: 'match-lobby-client',
    label: 'Match Lobby — Client (MATCH LOBBY)',
    shortLabel: 'Match Lobby (Client)',
    tier: 'user',
    headerTitle: 'MATCH LOBBY',
    groupId: 'online-match',
    groupLabel: 'Online Match',
    role: 'client',
    stage: 'lobby',
    description: 'Match Lobby (Client): Resume, Room Info (info, orange), Garage, Settings, Leave Room',
    customActionRow: {
      slotId: 'configure',
      title: 'Room Info',
      subtitle: 'Inspect lobby session, team roster & player status',
      iconType: 'info',
      iconColorToken: 'amber',
      iconColorClass: 'text-amber-400',
      actionType: 'manage-room',
    },
    showGarage: true,
    showSettings: true,
    showRestartMatch: false,
    bottomActionRow: LEAVE_ROOM_BOTTOM_ROW,
  },
  {
    id: 'online-match-host',
    label: 'Online Match — Host (ONLINE MATCH)',
    shortLabel: 'Online Match (Host)',
    tier: 'user',
    headerTitle: 'ONLINE MATCH',
    groupId: 'online-match',
    groupLabel: 'Online Match',
    role: 'host',
    stage: 'match',
    description: 'Online Match (Host): Resume, Match Admin (house-cog, blue), Settings, Leave Match (No Garage)',
    customActionRow: {
      slotId: 'configure',
      title: 'Match Admin',
      subtitle: 'Active match administration, bot policies & connected players',
      iconType: 'house-cog',
      iconColorToken: 'sky',
      iconColorClass: 'text-sky-400',
      actionType: 'manage-room',
    },
    showGarage: false,
    showSettings: true,
    showRestartMatch: false,
    bottomActionRow: LEAVE_MATCH_BOTTOM_ROW,
  },
  {
    id: 'online-match-client',
    label: 'Online Match — Client (ONLINE MATCH)',
    shortLabel: 'Online Match (Client)',
    tier: 'user',
    headerTitle: 'ONLINE MATCH',
    groupId: 'online-match',
    groupLabel: 'Online Match',
    role: 'client',
    stage: 'match',
    description: 'Online Match (Client): Resume, Room Info (info, orange), Settings, Leave Match (No Garage)',
    customActionRow: {
      slotId: 'configure',
      title: 'Room Info',
      subtitle: 'Inspect match settings, ping & connected players',
      iconType: 'info',
      iconColorToken: 'amber',
      iconColorClass: 'text-amber-400',
      actionType: 'manage-room',
    },
    showGarage: false,
    showSettings: true,
    showRestartMatch: false,
    bottomActionRow: LEAVE_MATCH_BOTTOM_ROW,
  },
  {
    id: 'online-warmup-host',
    label: 'Online Warmup — Host (ONLINE WARMUP)',
    shortLabel: 'Warmup (Host)',
    tier: 'user',
    headerTitle: 'ONLINE WARMUP',
    groupId: 'online-warmup',
    groupLabel: 'Online Warmup',
    role: 'host',
    description: 'Online Warmup (Host): Resume, Configure Room (house-cog, blue), Garage, Settings, Leave Room',
    customActionRow: {
      slotId: 'configure',
      title: 'Configure Room',
      subtitle: 'Room configuration panel & connected players',
      iconType: 'house-cog',
      iconColorToken: 'sky',
      iconColorClass: 'text-sky-400',
      actionType: 'manage-room',
    },
    showGarage: true,
    showSettings: true,
    showRestartMatch: false,
    bottomActionRow: LEAVE_ROOM_BOTTOM_ROW,
  },
  {
    id: 'online-warmup-client',
    label: 'Online Warmup — Client (ONLINE WARMUP)',
    shortLabel: 'Warmup (Client)',
    tier: 'user',
    headerTitle: 'ONLINE WARMUP',
    groupId: 'online-warmup',
    groupLabel: 'Online Warmup',
    role: 'client',
    description: 'Online Warmup (Client): Resume, Room Info (info, orange), Garage, Settings, Leave Room',
    customActionRow: {
      slotId: 'configure',
      title: 'Room Info',
      subtitle: 'Inspect room details & connection status',
      iconType: 'info',
      iconColorToken: 'amber',
      iconColorClass: 'text-amber-400',
      actionType: 'manage-room',
    },
    showGarage: true,
    showSettings: true,
    showRestartMatch: false,
    bottomActionRow: LEAVE_ROOM_BOTTOM_ROW,
  },
  {
    id: 'kickoff-training',
    label: 'Kickoff Training (KICKOFF TRAINING)',
    shortLabel: 'Kickoff Training',
    tier: 'user',
    headerTitle: 'KICKOFF TRAINING',
    groupId: 'training',
    groupLabel: 'Training',
    description: 'Kickoff Training: Resume, Garage, Settings, Exit to Free Play (No Play row)',
    showGarage: true,
    showSettings: true,
    showRestartMatch: false,
    bottomActionRow: makeExitFreeplayBottomRow('Leave Kickoff Training and return to Free Play'),
  },
  {
    id: 'static-training-play',
    label: 'Play Static Training (PLAY STATIC TRAINING)',
    shortLabel: 'Play Static Training',
    tier: 'user',
    headerTitle: 'PLAY STATIC TRAINING',
    groupId: 'training',
    groupLabel: 'Training',
    description: 'Play Static Training: Resume, Garage, Settings, Exit to Free Play',
    showGarage: true,
    showSettings: true,
    showRestartMatch: false,
    bottomActionRow: makeExitFreeplayBottomRow('Leave Play Static Training and return to Free Play'),
  },
  {
    id: 'static-training-edit',
    label: 'Edit Training Pack (EDIT TRAINING PACK)',
    shortLabel: 'Edit Training Pack',
    tier: 'user',
    headerTitle: 'EDIT TRAINING PACK',
    groupId: 'training',
    groupLabel: 'Training',
    description: 'Edit Training Pack: Resume, Garage, Settings, Exit Edit Mode',
    showGarage: true,
    showSettings: true,
    showRestartMatch: false,
    bottomActionRow: {
      slotId: 'leave',
      title: 'Exit Edit Mode',
      subtitle: 'Close Shot Inspector and return to Pack Browser',
      iconColorClass: 'text-rose-400',
      variant: 'danger',
      actionType: 'exit-edit-mode',
    },
  },
  {
    id: 'replay-viewer',
    label: 'Replay Viewer (REPLAY VIEWER)',
    shortLabel: 'Replay Viewer',
    tier: 'user',
    headerTitle: 'REPLAY VIEWER',
    groupId: 'training',
    groupLabel: 'Training',
    description: 'Replay Viewer: Resume, Garage, Settings, Exit to Free Play',
    showGarage: true,
    showSettings: true,
    showRestartMatch: false,
    bottomActionRow: makeExitFreeplayBottomRow('Leave Replay Viewer and return to Free Play'),
  },
  {
    id: 'dev-test-lab',
    label: 'Subsystem Isolation Lab (DEVELOPER TEST LAB)',
    shortLabel: 'Dev Test Lab',
    tier: 'developer',
    headerTitle: 'DEVELOPER TEST LAB',
    groupId: 'developer',
    groupLabel: 'Developer',
    customActionRow: PLAY_CUSTOM_ROW,
    showGarage: true,
    showSettings: true,
    showRestartMatch: false,
    bottomActionRow: makeExitFreeplayBottomRow('Close Developer Test Lab and return to Free Play'),
  },
  {
    id: 'exp-multi-bots',
    label: 'Experimental Multiple Bots (EXPERIMENTAL MULTI BOTS)',
    shortLabel: 'Exp Multi-Bots',
    tier: 'developer',
    headerTitle: 'EXPERIMENTAL MULTI BOTS',
    groupId: 'developer',
    groupLabel: 'Developer',
    customActionRow: {
      slotId: 'configure',
      title: 'Configure Match',
      subtitle: 'Reconfigure team rosters, bot policies, match duration & restart',
      iconType: 'bot',
      iconColorToken: 'emerald',
      iconColorClass: 'text-emerald-400',
      actionType: 'exp-multi-bots',
    },
    showGarage: true,
    showSettings: true,
    showRestartMatch: true,
    bottomActionRow: makeExitFreeplayBottomRow('Close Experimental Multiple Bots and return to Free Play'),
  },
];

export const LAYER1_SURFACE_VARIANTS: SurfaceVariantMeta[] =
  LAYER1_CONTEXT_VARIATIONS.map((meta) => ({
    variantId: meta.id,
    label: meta.label,
    description: meta.description ?? meta.label,
    storeOverrides: {
      mainMenuStyleStore: {
        previewContextMode: meta.id,
      },
    },
  }));

export const resolveLayer1ContextSpec = (
  rawCtx?: string | null
): Layer1ContextMeta => {
  const normalized = normalizeMainMenuContextMode(rawCtx);
  return (
    LAYER1_CONTEXT_VARIATIONS.find((item) => item.id === normalized) ??
    LAYER1_CONTEXT_VARIATIONS[0]
  );
};

export interface Layer1DerivedContextInputs {
  matchMode?: string;
  isHosting: boolean;
  isOnlineMatchRoom: boolean;
  hasActiveOnlineRoom: boolean;
  isExhibitionMode: boolean;
  replayViewerHasLoaded: boolean;
  staticTrainingSessionMode?: string;
  hasExtraBottomAction: boolean;
}

export function deriveLayer1ContextVariation(
  inputs: Layer1DerivedContextInputs
): CanonicalLayer1ContextVariation {
  const {
    matchMode,
    isHosting,
    isOnlineMatchRoom,
    hasActiveOnlineRoom,
    isExhibitionMode,
    replayViewerHasLoaded,
    staticTrainingSessionMode,
    hasExtraBottomAction,
  } = inputs;

  if (matchMode === 'match') {
    return hasActiveOnlineRoom
      ? isHosting ? 'online-match-host' : 'online-match-client'
      : 'exhibition';
  }
  if (matchMode === 'dev-test-lab') return 'dev-test-lab';
  if (matchMode === 'exp-multi-bots') return isExhibitionMode ? 'exhibition' : 'exp-multi-bots';
  if (matchMode === 'kickoff-training') return 'kickoff-training';
  if (matchMode === 'replay-viewer' || (matchMode === 'freeplay' && replayViewerHasLoaded)) {
    return 'replay-viewer';
  }
  if (matchMode === 'static-training-pack') {
    return staticTrainingSessionMode === 'edit' || hasExtraBottomAction
      ? 'static-training-edit'
      : 'static-training-play';
  }
  if (hasActiveOnlineRoom) {
    return isOnlineMatchRoom
      ? isHosting ? 'match-lobby-host' : 'match-lobby-client'
      : isHosting ? 'online-warmup-host' : 'online-warmup-client';
  }
  return 'freeplay';
}

export function resolveLayer1PowerSaveStatus(powerSave: string): {
  dotColor: string;
  powerLabel: string;
} {
  if (powerSave === 'extreme' || powerSave === 'freeze') {
    return { dotColor: 'bg-amber-500 animate-pulse', powerLabel: 'Power Saving: Extreme' };
  }
  if (powerSave === '15') {
    return { dotColor: 'bg-amber-400', powerLabel: 'Power Saving: 15 FPS' };
  }
  if (powerSave === 'disable' || powerSave === 'match') {
    return { dotColor: 'bg-emerald-500', powerLabel: 'Power Saving: Disable' };
  }
  return { dotColor: 'bg-emerald-400', powerLabel: 'Power Saving: 30 FPS' };
}

export type TouchInputAgentOption = 'none' | 'necto' | 'nexto';

export interface Layer1MainMenuBottomActionSpec {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}

export interface Layer1ScopedAppOverrides<TSizing = unknown> {
  contextVariation?: Layer1ContextVariation;
  contextMode?: Layer1ContextVariation;
  backgroundRenderPaused?: boolean;
  menuPowerSave?: 'extreme' | '15' | '30' | 'disable' | 'freeze' | 'match';
  extraBottomAction?: Layer1MainMenuBottomActionSpec | React.ReactNode;
  sizing?: TSizing;
  onResume?: () => void;
  onRestartMatch?: () => void;
  onReturnToFreeplay?: () => void;
  onNavigatePlay?: () => void;
  onNavigateGarage?: () => void;
  onNavigateSettings?: (targetTab?: string) => void;
  onNavigateManageRoom?: () => void;
  onNavigateExpMultiBotsConfig?: () => void;
  onLeaveRoom?: () => void;
  onExitEditMode?: () => void;
}
