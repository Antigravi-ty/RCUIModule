import { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useHudStore } from '../../stores/hudStore';
import { floatingStore } from '../../stores/floatingStore';
import {
  networkDiagnosticsStore,
  useNetworkDiagnosticsData,
} from '../../stores/networkDiagnosticsStore';
import { NETWORK_MONITOR_PRESET } from '../../stores/floatingPresets';
import type {
  LobbyPlayerSlot,
  LobbyTeamAssignment,
} from '../online/MatchLobbyTeamRosterSection';
import type { ActiveMatchPlayer } from '../online/DuringMatchClientRejoinControls';
import type { WarmupRoomPlayer } from '../online/OnlineWarmupSubView';
import type { HostMatchTeamFormat } from '../online/OnlineRoomConfigSummaryCard';

export type OnlineSessionContextId =
  | 'match-lobby-host'
  | 'match-lobby-client'
  | 'online-match-host'
  | 'online-match-client'
  | 'online-warmup-host'
  | 'online-warmup-client';

export const FORMAT_TO_GAME_MODE: Record<HostMatchTeamFormat, '1v1' | '2v2' | '3v3'> = {
  duel: '1v1',
  doubles: '2v2',
  standard: '3v3',
};

export const GAME_MODE_TO_FORMAT: Record<string, HostMatchTeamFormat> = {
  '1v1': 'duel',
  '2v2': 'doubles',
  '3v3': 'standard',
};

export function useLayer2RoomHostControlBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const {
    onlineSession,
    setOnlineSession,
    matchMode,
    setMatchMode,
    bridge,
    goBack,
    closeMenu,
  } = useAppStore();
  const isMatchPaused = useHudStore((s) => s.isPaused);
  const diagData = useNetworkDiagnosticsData();

  const sessionContext: OnlineSessionContextId = useMemo(() => {
    const isHost = Boolean(onlineSession?.isHosting);
    if (onlineSession?.roomType === 'warmup') {
      return isHost ? 'online-warmup-host' : 'online-warmup-client';
    }
    if (matchMode === 'match') {
      return isHost ? 'online-match-host' : 'online-match-client';
    }
    return isHost ? 'match-lobby-host' : 'match-lobby-client';
  }, [onlineSession?.isHosting, onlineSession?.roomType, matchMode]);

  const [fallbackLocalTeam, setFallbackLocalTeam] = useState<LobbyTeamAssignment>('neutral');
  const localTeam: LobbyTeamAssignment = onlineSession?.localTeam ?? fallbackLocalTeam;

  const teamFormat: HostMatchTeamFormat =
    GAME_MODE_TO_FORMAT[onlineSession?.gameMode || '2v2'] || 'doubles';
  const botPolicy =
    onlineSession?.botFillMode === 'no_bots'
      ? 'none'
      : onlineSession?.botFillMode === 'bots_vs_humans'
      ? 'vs-ai'
      : onlineSession?.botFillMode === 'custom'
      ? 'custom'
      : 'auto-fill';
  const rawDurationSec = onlineSession?.matchDurationSeconds ?? 90;
  const durationPreset =
    rawDurationSec === 90
      ? '90'
      : rawDurationSec === 180
      ? '180'
      : rawDurationSec === 300
      ? '300'
      : 'custom';
  const customDurationSeconds = rawDurationSec;

  const handleChangeTeamFormat = (fmt: HostMatchTeamFormat) => {
    const nextGameMode = FORMAT_TO_GAME_MODE[fmt] || '2v2';
    setOnlineSession({ gameMode: nextGameMode });
    bridge.onSetOnlineGameMode?.(nextGameMode);
  };

  const handleChangeBotPolicy = (pol: 'none' | 'auto-fill' | 'vs-ai' | 'custom') => {
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
  };

  const handleChangeDurationPreset = (preset: '90' | '180' | '300' | 'custom') => {
    if (preset === 'custom') return;
    const secs = Number(preset) || 300;
    setOnlineSession({ matchDurationSeconds: secs });
    bridge.onSetOnlineMatchDuration?.(secs);
  };

  const handleChangeCustomDurationSeconds = (secs: number) => {
    const clean = Math.max(0, Math.round(Number(secs) || 0));
    setOnlineSession({ matchDurationSeconds: clean });
    bridge.onSetOnlineMatchDuration?.(clean);
  };

  const lobbyPeers: LobbyPlayerSlot[] | undefined = useMemo(() => {
    const peers = onlineSession?.connectedPeers;
    if (!peers) return [];
    return peers.map((p) => ({
      id: String(p.id || `car-${p.carIndex}`),
      name: p.name || `Car #${p.carIndex ?? 0}`,
      pingMs: Math.round(p.pingMs || 0),
      pairId: p.pairingCode,
      team: p.team === 1 ? 'orange' : p.team === 0 ? 'blue' : 'neutral',
      isHost: p.carIndex === 0 && !onlineSession?.isHosting,
    }));
  }, [onlineSession?.connectedPeers, onlineSession?.isHosting]);

  const matchPlayers: ActiveMatchPlayer[] | undefined = useMemo(() => {
    const peers = onlineSession?.connectedPeers;
    if (!peers) return [];
    return peers.map((p) => ({
      id: String(p.id || `car-${p.carIndex}`),
      name: p.name || `Car #${p.carIndex ?? 0}`,
      pingMs: Math.round(p.pingMs || 0),
      pairId: p.pairingCode,
      team: p.team === 1 ? 'orange' : 'blue',
      isHost: p.carIndex === 0 && !onlineSession?.isHosting,
      isBot: Boolean(p.isBot),
    }));
  }, [onlineSession?.connectedPeers, onlineSession?.isHosting]);

  const warmupPlayers: WarmupRoomPlayer[] | undefined = useMemo(() => {
    const peers = onlineSession?.connectedPeers;
    if (!peers) return [];
    return peers.map((p) => ({
      id: String(p.id || `car-${p.carIndex}`),
      name: p.name || `Car #${p.carIndex ?? 0}`,
      pingMs: Math.round(p.pingMs || 0),
      pairId: p.pairingCode,
      isHost: p.carIndex === 0 && !onlineSession?.isHosting,
    }));
  }, [onlineSession?.connectedPeers, onlineSession?.isHosting]);

  const handleKickPeer = (peerId: string) => {
    const found = onlineSession?.connectedPeers?.find(
      (p) => String(p.id) === peerId || `car-${p.carIndex}` === peerId
    );
    if (found && typeof found.carIndex === 'number') {
      void bridge.onRemovePlayer?.(found.carIndex);
    }
  };

  const handleSwitchTeam = (team: LobbyTeamAssignment) => {
    setFallbackLocalTeam(team);
    setOnlineSession({ localTeam: team });
    if (team === 'blue') {
      bridge.onSwitchOnlineRoleTeam?.('player', 0);
    } else if (team === 'orange') {
      bridge.onSwitchOnlineRoleTeam?.('player', 1);
    } else {
      bridge.onSwitchOnlineRoleTeam?.('player', 2);
    }
  };

  const handleStartMatch = () => {
    const targetDuration = onlineSession?.matchDurationSeconds ?? 90;
    setOnlineSession({
      roomType: 'match',
      gameMode: onlineSession?.gameMode || '3v3',
      botFillMode: onlineSession?.botFillMode || 'auto_fill',
      matchDurationSeconds: targetDuration,
    });
    bridge.onForceStartOnlineMatch?.(targetDuration);
    closeMenu();
  };

  const handleEnterMatch = () => {
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
  };

  const handleOpenNetHud = () => {
    floatingStore.spawnWindow({
      ...NETWORK_MONITOR_PRESET,
      startMinimized: false,
    });
  };

  const handleCloseRoom = async () => {
    if (bridge.onLeaveOnlineServer) {
      await bridge.onLeaveOnlineServer();
    }
    setMatchMode('freeplay');
  };

  return {
    ...rawProps,
    roomCode: props.roomCode ?? (onlineSession?.roomId || '8924'),
    sessionContext: props.sessionContext ?? sessionContext,
    signalingState:
      props.signalingState ??
      (onlineSession?.signalingConnected ? 'green' : 'yellow'),
    onRefreshSignaling:
      props.onRefreshSignaling ?? (() => bridge.onReconnectSignaling?.()),
    localTeam: props.localTeam ?? localTeam,
    onSwitchTeam: props.onSwitchTeam ?? handleSwitchTeam,
    teamFormat: props.teamFormat ?? teamFormat,
    onChangeTeamFormat: props.onChangeTeamFormat ?? handleChangeTeamFormat,
    botPolicy: props.botPolicy ?? botPolicy,
    onChangeBotPolicy: props.onChangeBotPolicy ?? handleChangeBotPolicy,
    durationPreset: props.durationPreset ?? durationPreset,
    onChangeDurationPreset: props.onChangeDurationPreset ?? handleChangeDurationPreset,
    customDurationSeconds: props.customDurationSeconds ?? customDurationSeconds,
    onChangeCustomDurationSeconds:
      props.onChangeCustomDurationSeconds ?? handleChangeCustomDurationSeconds,
    lobbyPeers: props.lobbyPeers ?? lobbyPeers,
    matchPlayers: props.matchPlayers ?? matchPlayers,
    warmupPlayers: props.warmupPlayers ?? warmupPlayers,
    onKickPeer: props.onKickPeer ?? handleKickPeer,
    zeroGProbes:
      props.zeroGProbes ?? Boolean(diagData?.metrics?.zeroGFleetEnabled),
    onToggleZeroGProbes:
      props.onToggleZeroGProbes ??
      (() => {
        void networkDiagnosticsStore.toggleZeroGFleet();
      }),
    testSfx: props.testSfx ?? Boolean(diagData?.metrics?.testCarAudioEnabled),
    onToggleTestSfx:
      props.onToggleTestSfx ??
      (() => {
        networkDiagnosticsStore.toggleTestCarAudio();
      }),
    onResetBall: props.onResetBall ?? (() => bridge.onResetBall?.()),
    isMatchPaused: props.isMatchPaused ?? isMatchPaused,
    onTogglePause:
      props.onTogglePause ?? (() => bridge.onPauseOnlineMatch?.(!isMatchPaused, 3)),
    onStartMatch: props.onStartMatch ?? handleStartMatch,
    onEnterMatch: props.onEnterMatch ?? handleEnterMatch,
    onOpenNetHud: props.onOpenNetHud ?? handleOpenNetHud,
    onCloseRoom: props.onCloseRoom ?? (() => void handleCloseRoom()),
    onBack: props.onBack ?? goBack,
  } as TProps;
}
