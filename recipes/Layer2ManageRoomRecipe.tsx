import React, { useMemo, useState } from 'react';
import type { StandardSurfaceProps, SurfaceMeta } from '../manifest/surfaceMetaTypes';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { useAppStore } from '../stores/appStore';
import { useHudStore } from '../stores/hudStore';
import { floatingStore } from '../stores/floatingStore';
import { networkDiagnosticsStore, useNetworkDiagnosticsData } from '../stores/networkDiagnosticsStore';
import { NETWORK_MONITOR_PRESET } from '../stores/floatingPresets';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useScopedStore, useStoreSnapshotOverride } from '../stores/storeSnapshotScope';
import { DEFAULT_PANEL_SIZING } from '../tokens/menuLayoutTokens';
import { MatchLobbyRoomRecipe } from './online/MatchLobbyRoomRecipe';
import type { LobbyPlayerSlot, LobbyTeamAssignment } from './online/MatchLobbyTeamRosterSection';
import { DuringMatchRoomRecipe } from './online/DuringMatchRoomRecipe';
import type { ActiveMatchPlayer } from './online/DuringMatchClientRejoinControls';
import { OnlineWarmupRoomRecipe, type WarmupRoomPlayer } from './online/OnlineWarmupRoomRecipe';
import type { HostMatchBotPolicy, HostMatchDurationPreset, HostMatchTeamFormat } from './online/OnlineRoomConfigSummaryCard';
import type { SignalingHealthState } from './online/OnlineRoomTopStatusBar';

export type RoomStateMode = 'free-play' | 'match';
export type OnlineSessionContextId =
  | 'match-lobby-host'
  | 'match-lobby-client'
  | 'online-match-host'
  | 'online-match-client'
  | 'online-warmup-host'
  | 'online-warmup-client';

export const FORMAT_TO_GAME_MODE: Record<HostMatchTeamFormat, '1v1' | '2v2' | '3v3'> = {
  duel: '1v1', doubles: '2v2', standard: '3v3',
};
export const GAME_MODE_TO_FORMAT: Record<string, HostMatchTeamFormat> = {
  '1v1': 'duel', '2v2': 'doubles', '3v3': 'standard',
};

export interface OnlineRoomControlStateOverride {
  roomCode?: string;
  sessionContext?: OnlineSessionContextId;
  signalingState?: SignalingHealthState;
  onRefreshSignaling?: () => void | Promise<void>;
  localTeam?: LobbyTeamAssignment;
  onSwitchTeam?: (team: LobbyTeamAssignment) => void;
  teamFormat?: HostMatchTeamFormat;
  onChangeTeamFormat?: (format: HostMatchTeamFormat) => void;
  botPolicy?: HostMatchBotPolicy;
  onChangeBotPolicy?: (policy: HostMatchBotPolicy) => void;
  durationPreset?: HostMatchDurationPreset;
  onChangeDurationPreset?: (preset: HostMatchDurationPreset) => void;
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
  onStartMatch?: () => void;
  onEnterMatch?: () => void;
  onNavigateAdvancedSettings?: () => void;
  onOpenNetHud?: () => void;
  onCloseRoom?: () => void | Promise<void>;
}

export interface Layer2ManageRoomRecipeProps extends StandardSurfaceProps {
  developerMode?: boolean;
  topSlot?: React.ReactNode;
  sessionContext?: OnlineSessionContextId;
  onSessionContextChange?: (ctx: OnlineSessionContextId) => void;
  onCloseRoom?: () => void | Promise<void>;
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

export const SURFACE_META: SurfaceMeta = {
  id: 'recipe:Layer2ManageRoomRecipe',
  title: 'Online Room Control Hub',
  subtitle: '6-state online session control for Match Lobby, During Match, and Online Warmup (Host & Client)',
  icon: 'Radio',
  layer: 'layer2',
  menuGroup: 'menu-layer',
  defaultSizing: {
    width: 680,
    height: 620,
    minHeight: 420,
    maxHeight: 740,
    mode: 'adaptive',
  },
  variants: ONLINE_SESSION_CONTEXT_SPECS.map((spec) => ({
    variantId: spec.id,
    label: spec.shortLabel,
    description: spec.footerDefaultDesc,
    entryFile:
      spec.stage === 'lobby'
        ? 'recipes/online/MatchLobbyRoomRecipe.tsx'
        : spec.stage === 'during-match'
        ? 'recipes/online/DuringMatchRoomRecipe.tsx'
        : 'recipes/online/OnlineWarmupRoomRecipe.tsx',
    storeOverrides: {
      onlineRoomStore: { sessionContext: spec.id },
    },
  })),
};

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
 */
export const Layer2ManageRoomRecipe: React.FC<Layer2ManageRoomRecipeProps> = React.memo(({
  isLight = true,
  activeTab,
  onTabChange,
  onBack: propOnBack,
  onCloseRoom: propOnCloseRoom,
  topSlot,
  sessionContext: propSessionContext,
  onSessionContextChange,
  className = '',
  stateOverride,
}) => {
  const appState = useScopedStore('appStore', useAppStore);
  const scopedRoom = useStoreSnapshotOverride<OnlineRoomControlStateOverride>('onlineRoomStore');
  const overrides: OnlineRoomControlStateOverride = {
    ...scopedRoom,
    ...stateOverride,
  };

  const {
    onlineSession,
    setOnlineSession,
    matchMode,
    setMatchMode,
    bridge,
    goBack: storeGoBack,
    closeMenu,
    navigate,
  } = appState;
  const liveMatchPaused = useHudStore((s) => s.isPaused);
  const diagData = useNetworkDiagnosticsData();

  const derivedContext: OnlineSessionContextId = useMemo(() => {
    const isHost = Boolean(onlineSession?.isHosting);
    if (onlineSession?.roomType === 'warmup') {
      return isHost ? 'online-warmup-host' : 'online-warmup-client';
    }
    if (matchMode === 'match') {
      return isHost ? 'online-match-host' : 'online-match-client';
    }
    return isHost ? 'match-lobby-host' : 'match-lobby-client';
  }, [onlineSession?.isHosting, onlineSession?.roomType, matchMode]);

  const activeContextId = resolveOnlineSessionContextId(
    propSessionContext ?? activeTab ?? overrides.sessionContext ?? derivedContext
  );
  const activeSpec =
    ONLINE_SESSION_CONTEXT_SPECS.find((s) => s.id === activeContextId) ??
    ONLINE_SESSION_CONTEXT_SPECS[0];

  const [fallbackLocalTeam, setFallbackLocalTeam] = useState<LobbyTeamAssignment>('neutral');
  const localTeam: LobbyTeamAssignment =
    overrides.localTeam ?? onlineSession?.localTeam ?? fallbackLocalTeam;

  const teamFormat: HostMatchTeamFormat =
    overrides.teamFormat ??
    GAME_MODE_TO_FORMAT[onlineSession?.gameMode || '2v2'] ??
    'doubles';
  const botPolicy: HostMatchBotPolicy =
    overrides.botPolicy ??
    (onlineSession?.botFillMode === 'no_bots'
      ? 'none'
      : onlineSession?.botFillMode === 'bots_vs_humans'
      ? 'vs-ai'
      : onlineSession?.botFillMode === 'custom'
      ? 'custom'
      : 'auto-fill');
  const rawDurationSec = onlineSession?.matchDurationSeconds ?? 90;
  const durationPreset: HostMatchDurationPreset =
    overrides.durationPreset ??
    (rawDurationSec === 90
      ? '90'
      : rawDurationSec === 180
      ? '180'
      : rawDurationSec === 300
      ? '300'
      : 'custom');
  const customDurationSeconds = overrides.customDurationSeconds ?? rawDurationSec;

  const handleChangeTeamFormat =
    overrides.onChangeTeamFormat ??
    ((fmt: HostMatchTeamFormat) => {
      const nextGameMode = FORMAT_TO_GAME_MODE[fmt] || '2v2';
      setOnlineSession({ gameMode: nextGameMode });
      bridge.onSetOnlineGameMode?.(nextGameMode);
    });

  const handleChangeBotPolicy =
    overrides.onChangeBotPolicy ??
    ((pol: HostMatchBotPolicy) => {
      const nextBotFill =
        pol === 'none'
          ? 'no_bots'
          : pol === 'vs-ai'
          ? 'bots_vs_humans'
          : pol === 'custom'
          ? 'custom'
          : 'auto_fill';
      setOnlineSession({ botFillMode: nextBotFill });
      bridge.onSetOnlineBotFillMode?.(nextBotFill);
    });

  const handleChangeDurationPreset =
    overrides.onChangeDurationPreset ??
    ((preset: HostMatchDurationPreset) => {
      if (preset === 'custom') return;
      const secs = Number(preset) || 300;
      setOnlineSession({ matchDurationSeconds: secs });
      bridge.onSetOnlineMatchDuration?.(secs);
    });

  const handleChangeCustomDurationSeconds =
    overrides.onChangeCustomDurationSeconds ??
    ((secs: number) => {
      const clean = Math.max(0, Math.round(Number(secs) || 0));
      setOnlineSession({ matchDurationSeconds: clean });
      bridge.onSetOnlineMatchDuration?.(clean);
    });

  const handleSwitchTeam =
    overrides.onSwitchTeam ??
    ((team: LobbyTeamAssignment) => {
      setFallbackLocalTeam(team);
      setOnlineSession({ localTeam: team });
      const teamCode = team === 'blue' ? 0 : team === 'orange' ? 1 : 2;
      bridge.onSwitchOnlineRoleTeam?.('player', teamCode);
    });

  const handleKickPeer =
    overrides.onKickPeer ??
    ((peerId: string) => {
      const found = onlineSession?.connectedPeers?.find(
        (p) => String(p.id) === peerId || `car-${p.carIndex}` === peerId
      );
      if (found && typeof found.carIndex === 'number') {
        void bridge.onRemovePlayer?.(found.carIndex);
      }
    });

  const handleStartMatch =
    overrides.onStartMatch ??
    (() => {
      const targetDuration = onlineSession?.matchDurationSeconds ?? 90;
      setOnlineSession({
        roomType: 'match',
        gameMode: onlineSession?.gameMode || '3v3',
        botFillMode: onlineSession?.botFillMode || 'auto_fill',
        matchDurationSeconds: targetDuration,
      });
      bridge.onForceStartOnlineMatch?.(targetDuration);
      closeMenu();
    });

  const handleEnterMatch =
    overrides.onEnterMatch ??
    (() => {
      if (!onlineSession?.isHosting) {
        const nextReady = !onlineSession?.isReady;
        setOnlineSession({ isReady: nextReady });
        bridge.onSetClientReady?.(nextReady);
        if (matchMode === 'match') {
          const targetTeamCode = localTeam === 'orange' ? 1 : localTeam === 'blue' ? 0 : 2;
          bridge.onSwitchOnlineRoleTeam?.('player', targetTeamCode);
        }
      }
      closeMenu();
    });

  const handleOpenNetHud =
    overrides.onOpenNetHud ??
    (() => {
      floatingStore.spawnWindow({
        ...NETWORK_MONITOR_PRESET,
        startMinimized: false,
      });
    });

  const handleCloseRoom =
    propOnCloseRoom ??
    overrides.onCloseRoom ??
    (() => {
      if (bridge.onLeaveOnlineServer) {
        void bridge.onLeaveOnlineServer();
      }
      setMatchMode('freeplay');
    });

  const handleNavigateAdvanced =
    overrides.onNavigateAdvancedSettings ??
    (() => {
      onTabChange?.('exp-multi-bots');
      navigate('exp-multi-bots');
    });

  const onBack = propOnBack ?? storeGoBack;
  const signalingState: SignalingHealthState =
    overrides.signalingState ?? (onlineSession?.signalingConnected ? 'green' : 'yellow');
  const onRefreshSignaling =
    overrides.onRefreshSignaling ?? (() => bridge.onReconnectSignaling?.());
  const isMatchPaused = overrides.isMatchPaused ?? liveMatchPaused;
  const onTogglePause =
    overrides.onTogglePause ?? (() => bridge.onPauseOnlineMatch?.(!isMatchPaused, 3));

  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  void onSessionContextChange;

  const sizing = useMenuLayoutStore(
    (s) => s.panels?.['layer2-manage-room'] ?? DEFAULT_PANEL_SIZING['layer2-manage-room']
  );

  const rawRoomCode = overrides.roomCode ?? (onlineSession?.roomId || 'RL-8924');
  const resolvedRoomCode =
    activeSpec.stage === 'warmup' && rawRoomCode === 'RL-8924' ? 'TRN-409' : rawRoomCode;

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
            localTeam={localTeam}
            onSwitchTeam={handleSwitchTeam}
            peers={overrides.lobbyPeers}
            roomConfig={{
              roomCode: resolvedRoomCode,
              teamFormat,
              onChangeTeamFormat: handleChangeTeamFormat,
              botPolicy,
              onChangeBotPolicy: handleChangeBotPolicy,
              durationPreset,
              onChangeDurationPreset: handleChangeDurationPreset,
              customDurationSeconds,
              onChangeCustomDurationSeconds: handleChangeCustomDurationSeconds,
            }}
            utilities={{
              zeroGProbes:
                overrides.zeroGProbes ?? Boolean(diagData?.metrics?.zeroGFleetEnabled),
              onToggleZeroGProbes:
                overrides.onToggleZeroGProbes ??
                (() => void networkDiagnosticsStore.toggleZeroGFleet()),
              testSfx:
                overrides.testSfx ?? Boolean(diagData?.metrics?.testCarAudioEnabled),
              onToggleTestSfx:
                overrides.onToggleTestSfx ??
                (() => networkDiagnosticsStore.toggleTestCarAudio()),
              onResetBall: overrides.onResetBall ?? (() => bridge.onResetBall?.()),
              onOpenNetHud: handleOpenNetHud,
            }}
            actions={{
              onRefreshSignaling,
              onKickPeer: handleKickPeer,
              onStartMatch: handleStartMatch,
              onEnterMatch: handleEnterMatch,
              onNavigateAdvancedSettings: handleNavigateAdvanced,
              onStopOrLeave: handleCloseRoom,
            }}
            onHoverDesc={setHoveredDesc}
            isLight={isLight}
          />
        )}

        {activeSpec.stage === 'during-match' && (
          <DuringMatchRoomRecipe
            role={activeSpec.role}
            signalingState={signalingState}
            players={overrides.matchPlayers}
            isMatchPaused={isMatchPaused}
            roomConfig={{
              roomCode: resolvedRoomCode,
              teamFormat,
              botPolicy,
              durationPreset,
              customDurationSeconds,
            }}
            localTeam={localTeam}
            actions={{
              onRefreshSignaling,
              onKickPlayer: handleKickPeer,
              onTogglePause,
              onSwitchTeam: handleSwitchTeam,
              onEnterMatch: handleEnterMatch,
              onShutdownOrLeave: handleCloseRoom,
            }}
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
            players={overrides.warmupPlayers}
            onKickPlayer={handleKickPeer}
            onShutdownOrLeave={handleCloseRoom}
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
