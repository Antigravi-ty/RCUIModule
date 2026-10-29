import React, { useState } from 'react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { DEFAULT_PANEL_SIZING, useMenuLayoutStore } from '../stores/menuLayoutStore';
import {
  MatchLobbyRoomView,
  type LobbyPlayerSlot,
  type LobbyTeamAssignment,
} from './online/MatchLobbyRoomRecipe';
import {
  DuringMatchRoomView,
  type ActiveMatchPlayer,
} from './online/DuringMatchRoomRecipe';
import {
  OnlineWarmupRoomView,
  type WarmupRoomPlayer,
} from './online/OnlineWarmupRoomRecipe';
import type { SignalingHealthState } from './online/OnlineRoomTopStatusBar';

export type RoomStateMode = 'free-play' | 'match';

export type OnlineSessionContextId =
  | 'match-lobby-host'
  | 'match-lobby-client'
  | 'online-match-host'
  | 'online-match-client'
  | 'online-warmup-host'
  | 'online-warmup-client';

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
    resolveHeaderTitle: () => 'CONFIGURE ROOM',
    footerDefaultDesc:
      'Match Lobby (Client): View Room Code & Pair ID, manage Daisy Chain Spectating relay, switch team, and manually enter match.',
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
      'During Match (Client): View Blue/Orange players in match, manage spectators relaying via you, ask to pause, or leave room.',
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

export interface Layer2RoomHostControlRecipeProps {
  isLight?: boolean;
  developerMode?: boolean;
  roomCode?: string;
  signalingState?: SignalingHealthState;
  onRefreshSignaling?: () => void | Promise<void>;
  localTeam?: LobbyTeamAssignment;
  onSwitchTeam?: (team: LobbyTeamAssignment) => void;
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
  topSlot?: React.ReactNode;
  defaultRoomState?: RoomStateMode;
  onRoomStateChange?: (state: RoomStateMode) => void;
  defaultMatchLengthMin?: number;
  onStartState?: (state: RoomStateMode, matchLengthMin: number) => void;
  /** Active online session context ('match-lobby-host' | 'match-lobby-client' | 'online-match-host' | 'online-match-client' | 'online-warmup-host' | 'online-warmup-client') */
  sessionContext?: OnlineSessionContextId;
  onSessionContextChange?: (ctx: OnlineSessionContextId) => void;
  onStartMatch?: () => void;
  onEnterMatch?: () => void;
  onNavigateAdvancedSettings?: () => void;
  onOpenNetHud?: () => void;
  onCloseRoom?: () => void;
  onBack?: () => void;
  className?: string;
}

/**
 * [Recipe] Layer 2 Online Session Room Control / Info (`Layer2RoomHostControlRecipe`)
 * Decoupled router that renders the exact view for each of the 6 online session states:
 * 1. `match-lobby-host` (`MatchLobbyRoomView` role="host")
 * 2. `match-lobby-client` (`MatchLobbyRoomView` role="client")
 * 3. `online-match-host` (`DuringMatchRoomView` role="host")
 * 4. `online-match-client` (`DuringMatchRoomView` role="client")
 * 5. `online-warmup-host` (`OnlineWarmupRoomView` role="host")
 * 6. `online-warmup-client` (`OnlineWarmupRoomView` role="client")
 */
export const Layer2RoomHostControlRecipe: React.FC<Layer2RoomHostControlRecipeProps> = React.memo(({
  isLight = true,
  roomCode = 'RL-8924',
  signalingState,
  onRefreshSignaling,
  localTeam,
  onSwitchTeam,
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
}) => {
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const activeContextId = controlledContext ?? 'match-lobby-host';
  const activeSpec =
    ONLINE_SESSION_CONTEXT_SPECS.find((s) => s.id === activeContextId) ??
    ONLINE_SESSION_CONTEXT_SPECS[0];

  const sizing = useMenuLayoutStore(
    (s) => s.panels?.['layer2-room-host-control'] ?? DEFAULT_PANEL_SIZING['layer2-room-host-control']
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
          <MatchLobbyRoomView
            role={activeSpec.role}
            roomCode={resolvedRoomCode}
            signalingState={signalingState}
            onRefreshSignaling={onRefreshSignaling}
            localTeam={localTeam}
            onSwitchTeam={onSwitchTeam}
            peers={lobbyPeers}
            onKickPeer={onKickPeer}
            zeroGProbes={zeroGProbes}
            onToggleZeroGProbes={onToggleZeroGProbes}
            testSfx={testSfx}
            onToggleTestSfx={onToggleTestSfx}
            onResetBall={onResetBall}
            onStartMatch={onStartMatch}
            onEnterMatch={onEnterMatch}
            onOpenNetHud={onOpenNetHud}
            onNavigateAdvancedSettings={onNavigateAdvancedSettings}
            onStopOrLeave={onCloseRoom}
            onHoverDesc={setHoveredDesc}
            isLight={isLight}
          />
        )}

        {activeSpec.stage === 'during-match' && (
          <DuringMatchRoomView
            role={activeSpec.role}
            roomCode={resolvedRoomCode}
            signalingState={signalingState}
            onRefreshSignaling={onRefreshSignaling}
            players={matchPlayers}
            onKickPlayer={onKickPeer}
            isMatchPaused={isMatchPaused}
            onTogglePause={onTogglePause}
            onOpenNetHud={onOpenNetHud}
            onShutdownOrLeave={onCloseRoom}
            onHoverDesc={setHoveredDesc}
            isLight={isLight}
          />
        )}

        {activeSpec.stage === 'warmup' && (
          <OnlineWarmupRoomView
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

Layer2RoomHostControlRecipe.displayName = 'Layer2RoomHostControlRecipe';
