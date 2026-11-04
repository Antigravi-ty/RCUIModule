import React, { useState } from 'react';
import {
  useLayer2ManageRoomBinding,
  type RoomStateMode,
  type OnlineSessionContextId,
} from './hooks/useLayer2ManageRoomBinding';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { DEFAULT_PANEL_SIZING } from '../tokens/menuLayoutTokens';
import { MatchLobbyRoomRecipe } from './online/MatchLobbyRoomRecipe';
import type {
  LobbyPlayerSlot,
  LobbyTeamAssignment,
} from './online/MatchLobbyTeamRosterSection';
import { DuringMatchRoomRecipe } from './online/DuringMatchRoomRecipe';
import type { ActiveMatchPlayer } from './online/DuringMatchClientRejoinControls';
import {
  OnlineWarmupRoomRecipe,
  type WarmupRoomPlayer,
} from './online/OnlineWarmupRoomRecipe';
import type { SignalingHealthState } from './online/OnlineRoomTopStatusBar';

export type {
  RoomStateMode,
  OnlineSessionContextId,
};

export interface OnlineRoomControlStateOverride {
  signalingState?: SignalingHealthState;
  onRefreshSignaling?: () => void | Promise<void>;
  localTeam?: LobbyTeamAssignment;
  onSwitchTeam?: (team: LobbyTeamAssignment) => void;
  teamFormat?: 'duel' | 'doubles' | 'standard';
  onChangeTeamFormat?: (format: 'duel' | 'doubles' | 'standard') => void;
  botPolicy?: 'none' | 'auto-fill' | 'vs-ai' | 'custom';
  onChangeBotPolicy?: (policy: 'none' | 'auto-fill' | 'vs-ai' | 'custom') => void;
  durationPreset?: '90' | '180' | '300' | 'custom';
  onChangeDurationPreset?: (preset: '90' | '180' | '300' | 'custom') => void;
  customDurationSeconds?: number;
  onChangeCustomDurationSeconds?: (seconds: number) => void;
  lobbyPeers?: LobbyPlayerSlot[];
  matchPlayers?: ActiveMatchPlayer[];
  warmupPlayers?: WarmupRoomPlayer[];
  onKickPeer?: (peerId: string) => void;
  zeroGProbes?: boolean;
  onToggleZeroGProbes?: () => void;
  testSfx?: boolean;
  onToggleTestSfx?: () => void;
  onResetBall?: () => void;
  isMatchPaused?: boolean;
  onTogglePause?: () => void;
  defaultRoomState?: RoomStateMode;
  onRoomStateChange?: (state: RoomStateMode) => void;
  defaultMatchLengthMin?: number;
  onStartState?: (state: RoomStateMode, matchLengthMin: number) => void;
  onSessionContextChange?: (ctx: OnlineSessionContextId) => void;
}

export interface Layer2ManageRoomRecipeProps extends OnlineRoomControlStateOverride {
  isLight?: boolean;
  developerMode?: boolean;
  roomCode?: string;
  topSlot?: React.ReactNode;
  /** Active online session context ('match-lobby-host' | 'match-lobby-client' | 'online-match-host' | 'online-match-client' | 'online-warmup-host' | 'online-warmup-client') */
  sessionContext?: OnlineSessionContextId;
  onStartMatch?: () => void;
  onEnterMatch?: () => void;
  onNavigateAdvancedSettings?: () => void;
  onOpenNetHud?: () => void;
  onCloseRoom?: () => void;
  onBack?: () => void;
  className?: string;
  stateOverride?: OnlineRoomControlStateOverride;
}

export interface OnlineSessionContextSpec {
  id: OnlineSessionContextId;
  shortLabel: string;
  stageLabel: string;
  role: 'host' | 'client';
  stage: 'lobby' | 'during-match' | 'warmup';
  resolveHeaderTitle: (roomCode: string) => string;
  footerDefaultDesc: string;
}

export const ONLINE_SESSION_CONTEXT_SPECS: OnlineSessionContextSpec[] = [
  {
    id: 'match-lobby-host',
    shortLabel: 'Match Lobby (Host)',
    stageLabel: 'Match Lobby · Host',
    role: 'host',
    stage: 'lobby',
    resolveHeaderTitle: () => 'CONFIGURE ROOM',
    footerDefaultDesc:
      'Configure Room (Match Lobby · Host): Copy room code, inspect Blue/Neutral/Orange teams & pre-assigned bots, switch team, start match, or edit rules.',
  },
  {
    id: 'match-lobby-client',
    shortLabel: 'Match Lobby (Client)',
    stageLabel: 'Match Lobby · Client',
    role: 'client',
    stage: 'lobby',
    resolveHeaderTitle: () => 'ROOM INFO',
    footerDefaultDesc:
      'Room Info (Match Lobby · Client): View Room Code & Pair ID, manage Daisy Chain Spectating relay, select team (Blue / Auto / Orange), and join match.',
  },
  {
    id: 'online-match-host',
    shortLabel: 'During Match (Host)',
    stageLabel: 'During Match · Host',
    role: 'host',
    stage: 'during-match',
    resolveHeaderTitle: (code) => `ONLINE MATCH · #${code}`,
    footerDefaultDesc:
      'During Match (Host): Inspect Blue/Orange players in match, diagnose spectator routes (from player vs Direct Host), request pause, or double-confirm server shutdown.',
  },
  {
    id: 'online-match-client',
    shortLabel: 'During Match (Client)',
    stageLabel: 'During Match · Client',
    role: 'client',
    stage: 'during-match',
    resolveHeaderTitle: (code) => `ONLINE MATCH · #${code}`,
    footerDefaultDesc:
      'During Match (Client): View Blue/Orange players in match, select team or replace a No Input player to join match, manage spectators relaying via you, ask to pause, or leave room.',
  },
  {
    id: 'online-warmup-host',
    shortLabel: 'Online Warmup (Host)',
    stageLabel: 'Online Warmup · Host',
    role: 'host',
    stage: 'warmup',
    resolveHeaderTitle: () => 'CONFIGURE ROOM',
    footerDefaultDesc:
      'Online Warmup (Host): Manage up to 6 players in room (no teams), inspect spectators, open Advanced Management, or shutdown server.',
  },
  {
    id: 'online-warmup-client',
    shortLabel: 'Online Warmup (Client)',
    stageLabel: 'Online Warmup · Client',
    role: 'client',
    stage: 'warmup',
    resolveHeaderTitle: () => 'ROOM INFO',
    footerDefaultDesc:
      'Online Warmup (Client): View online players and spectators via you, toggle client-only Ghost Mode, request modification, or leave room.',
  },
];

export const resolveOnlineSessionContextId = (
  rawCtx?: string | null
): OnlineSessionContextId => {
  switch (rawCtx) {
    case 'match-lobby-host':
    case 'match-lobby-client':
    case 'online-match-host':
    case 'online-match-client':
    case 'online-warmup-host':
    case 'online-warmup-client':
      return rawCtx;
    default:
      return 'match-lobby-host';
  }
};

/**
 * [Recipe] Layer 2 Online Session Manage Room (`Layer2ManageRoomRecipe`)
 * Decoupled router that renders the exact view for each of the 6 online session states:
 * 1. `match-lobby-host` (`MatchLobbyRoomView` role="host")
 * 2. `match-lobby-client` (`MatchLobbyRoomView` role="client")
 * 3. `online-match-host` (`DuringMatchRoomView` role="host")
 * 4. `online-match-client` (`DuringMatchRoomView` role="client")
 * 5. `online-warmup-host` (`OnlineWarmupRoomView` role="host")
 * 6. `online-warmup-client` (`OnlineWarmupRoomView` role="client")
 */
export const Layer2ManageRoomRecipe: React.FC<Layer2ManageRoomRecipeProps> = React.memo((rawProps) => {
  const {
    isLight = true,
    roomCode = 'RL-8924',
    signalingState,
    onRefreshSignaling,
    localTeam,
    onSwitchTeam,
    teamFormat,
    onChangeTeamFormat,
    botPolicy,
    onChangeBotPolicy,
    durationPreset,
    onChangeDurationPreset,
    customDurationSeconds,
    onChangeCustomDurationSeconds,
    lobbyPeers,
    matchPlayers,
    warmupPlayers,
    onKickPeer,
    zeroGProbes,
    onToggleZeroGProbes,
    testSfx,
    onToggleTestSfx,
    onResetBall,
    isMatchPaused,
    onTogglePause,
    topSlot,
    sessionContext: controlledContext,
    onStartMatch,
    onEnterMatch,
    onNavigateAdvancedSettings,
    onOpenNetHud,
    onCloseRoom,
    onBack = () => {},
    className = '',
  } = useLayer2ManageRoomBinding({ ...rawProps, ...rawProps.stateOverride });
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const activeContextId = controlledContext ?? 'match-lobby-host';
  const activeSpec =
    ONLINE_SESSION_CONTEXT_SPECS.find((s) => s.id === activeContextId) ??
    ONLINE_SESSION_CONTEXT_SPECS[0];

  const sizing = useMenuLayoutStore(
    (s) => s.panels?.['layer2-manage-room'] ?? DEFAULT_PANEL_SIZING['layer2-manage-room']
  );

  const resolvedRoomCode =
    activeSpec.stage === 'warmup' && roomCode === 'RL-8924' ? 'TRN-409' : roomCode;

  return (
    <PanelContainer
      isLight={isLight}
      sizing={sizing}
      className={`w-full select-none ${className}`}
    >
      <PanelHeader
        isLight={isLight}
        title={activeSpec.resolveHeaderTitle(resolvedRoomCode)}
        onBack={onBack}
      />

      <PanelContent scrollable={true} className="flex flex-col gap-3">
        {topSlot}

        {activeSpec.stage === 'lobby' && (
          <MatchLobbyRoomRecipe
            role={activeSpec.role}
            signalingState={signalingState}
            onRefreshSignaling={onRefreshSignaling}
            localTeam={localTeam}
            onSwitchTeam={onSwitchTeam}
            peers={lobbyPeers}
            onKickPeer={onKickPeer}
            roomConfig={{
              roomCode: resolvedRoomCode,
              teamFormat,
              onChangeTeamFormat,
              botPolicy,
              onChangeBotPolicy,
              durationPreset,
              onChangeDurationPreset,
              customDurationSeconds,
              onChangeCustomDurationSeconds,
            }}
            utilities={{
              zeroGProbes,
              onToggleZeroGProbes,
              testSfx,
              onToggleTestSfx,
              onResetBall,
              onOpenNetHud,
            }}
            onStartMatch={onStartMatch}
            onEnterMatch={onEnterMatch}
            onNavigateAdvancedSettings={onNavigateAdvancedSettings}
            onStopOrLeave={onCloseRoom}
            onHoverDesc={setHoveredDesc}
            isLight={isLight}
          />
        )}

        {activeSpec.stage === 'during-match' && (
          <DuringMatchRoomRecipe
            role={activeSpec.role}
            signalingState={signalingState}
            onRefreshSignaling={onRefreshSignaling}
            players={matchPlayers}
            onKickPlayer={onKickPeer}
            isMatchPaused={isMatchPaused}
            onTogglePause={onTogglePause}
            roomConfig={{
              roomCode: resolvedRoomCode,
              teamFormat,
              botPolicy,
              durationPreset,
              customDurationSeconds,
            }}
            localTeam={localTeam}
            onSwitchTeam={onSwitchTeam}
            onEnterMatch={onEnterMatch}
            onShutdownOrLeave={onCloseRoom}
            onHoverDesc={setHoveredDesc}
            isLight={isLight}
          />
        )}

        {activeSpec.stage === 'warmup' && (
          <OnlineWarmupRoomRecipe
            role={activeSpec.role}
            roomCode={resolvedRoomCode}
            signalingState={signalingState}
            onRefreshSignaling={onRefreshSignaling}
            players={warmupPlayers}
            onKickPlayer={onKickPeer}
            onShutdownOrLeave={onCloseRoom}
            onHoverDesc={setHoveredDesc}
            isLight={isLight}
          />
        )}
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription={activeSpec.footerDefaultDesc}
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
});

Layer2ManageRoomRecipe.displayName = 'Layer2ManageRoomRecipe';
