import { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useHudStore } from '../../stores/hudStore';
import { floatingStore } from '../../stores/floatingStore';
import {
  networkDiagnosticsStore,
  useNetworkDiagnosticsData,
} from '../../stores/networkDiagnosticsStore';
import { NETWORK_MONITOR_PRESET } from '../../stores/floatingPresets';
import {
  generateDefaultPlayerName,
  generateRandomFourDigits,
  loadStoredPlayerName,
  saveStoredPlayerName,
} from '../../config/vehiclePresets.js';
import type { LobbyPlayerSlot, LobbyTeamAssignment } from '../online/MatchLobbyRoomRecipe';
import type { ActiveMatchPlayer } from '../online/DuringMatchRoomRecipe';
import type { WarmupRoomPlayer } from '../online/OnlineWarmupRoomRecipe';
import type {
  HostMatchConfig,
  HostMatchTeamFormat,
} from '../online/OnlineRoomConfigSummaryCard';
import type { SignalingHealthState } from '../online/OnlineRoomTopStatusBar';
import type { CreationProgressStatus } from '../online/OnlineRoomCreationProgress';

export type OnlineSessionContextId =
  | 'match-lobby-host'
  | 'match-lobby-client'
  | 'online-match-host'
  | 'online-match-client'
  | 'online-warmup-host'
  | 'online-warmup-client';

export interface JoinRoomConfig {
  playerName: string;
  roomCode: string;
  roomKey: string;
  allowSpectating: boolean;
}

const FORMAT_TO_GAME_MODE: Record<HostMatchTeamFormat, '1v1' | '2v2' | '3v3'> = {
  duel: '1v1',
  doubles: '2v2',
  standard: '3v3',
};

const GAME_MODE_TO_FORMAT: Record<string, HostMatchTeamFormat> = {
  '1v1': 'duel',
  '2v2': 'doubles',
  '3v3': 'standard',
};

export function useLayer2RoomHostControlStoreBinding<TProps extends object>(
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

  const [localTeam, setLocalTeam] = useState<LobbyTeamAssignment>('neutral');

  const lobbyPeers: LobbyPlayerSlot[] | undefined = useMemo(() => {
    const peers = onlineSession?.connectedPeers;
    if (!peers || peers.length === 0) return undefined;
    return peers.map((p) => ({
      id: String(p.id || `car-${p.carIndex}`),
      name: p.name || `Car #${p.carIndex ?? 0}`,
      pingMs: Math.round(p.pingMs || 0),
      team: p.team === 1 ? 'orange' : p.team === 0 ? 'blue' : 'neutral',
      isHost: false,
    }));
  }, [onlineSession?.connectedPeers]);

  const matchPlayers: ActiveMatchPlayer[] | undefined = useMemo(() => {
    const peers = onlineSession?.connectedPeers;
    if (!peers || peers.length === 0) return undefined;
    return peers.map((p) => ({
      id: String(p.id || `car-${p.carIndex}`),
      name: p.name || `Car #${p.carIndex ?? 0}`,
      pingMs: Math.round(p.pingMs || 0),
      team: p.team === 1 ? 'orange' : 'blue',
      isHost: false,
    }));
  }, [onlineSession?.connectedPeers]);

  const warmupPlayers: WarmupRoomPlayer[] | undefined = useMemo(() => {
    const peers = onlineSession?.connectedPeers;
    if (!peers || peers.length === 0) return undefined;
    return peers.map((p) => ({
      id: String(p.id || `car-${p.carIndex}`),
      name: p.name || `Car #${p.carIndex ?? 0}`,
      pingMs: Math.round(p.pingMs || 0),
      isHost: false,
    }));
  }, [onlineSession?.connectedPeers]);

  const handleKickPeer = (peerId: string) => {
    const found = onlineSession?.connectedPeers?.find(
      (p) => String(p.id) === peerId || `car-${p.carIndex}` === peerId
    );
    if (found && typeof found.carIndex === 'number') {
      void bridge.onRemovePlayer?.(found.carIndex);
    }
  };

  const handleSwitchTeam = (team: LobbyTeamAssignment) => {
    setLocalTeam(team);
    if (team === 'blue') {
      bridge.onSwitchOnlineRoleTeam?.('player', 0);
    } else if (team === 'orange') {
      bridge.onSwitchOnlineRoleTeam?.('player', 1);
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
  };

  const handleEnterMatch = () => {
    if (!onlineSession?.isHosting) {
      bridge.onSetClientReady?.(!onlineSession?.isReady);
    }
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

export function useLayer3HostMatchStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const navigate = useAppStore((s) => s.navigate);
  const closeMenu = useAppStore((s) => s.closeMenu);
  const setMatchMode = useAppStore((s) => s.setMatchMode);
  const onlineSession = useAppStore((s) => s.onlineSession);
  const setOnlineSession = useAppStore((s) => s.setOnlineSession);
  const bridge = useAppStore((s) => s.bridge);

  const [config, setConfig] = useState<HostMatchConfig>(() => ({
    playerName:
      onlineSession.playerName && onlineSession.playerName !== 'Host'
        ? onlineSession.playerName
        : loadStoredPlayerName(),
    roomCode: onlineSession.roomId || generateRandomFourDigits(),
    roomKey: onlineSession.password || '',
    teamFormat: GAME_MODE_TO_FORMAT[onlineSession.gameMode || '2v2'] || 'doubles',
    botPolicy:
      onlineSession.botFillMode === 'no_bots'
        ? 'none'
        : onlineSession.botFillMode === 'bots_vs_humans'
        ? 'vs-ai'
        : 'auto-fill',
    durationPreset:
      onlineSession.matchDurationSeconds === 90
        ? '90'
        : onlineSession.matchDurationSeconds === 180
        ? '180'
        : onlineSession.matchDurationSeconds === 300
        ? '300'
        : 'custom',
    customDurationSeconds: onlineSession.matchDurationSeconds ?? 150,
  }));

  const [progressStatus, setProgressStatus] = useState<CreationProgressStatus>('idle');
  const [currentStep, setCurrentStep] = useState<number>(1);

  const handleStartHost = async (nextConfig: HostMatchConfig) => {
    const cleanName = nextConfig.playerName.trim() || generateDefaultPlayerName();
    saveStoredPlayerName(cleanName);
    const cleanRoom = nextConfig.roomCode.trim() || generateRandomFourDigits();
    const durationSec =
      nextConfig.durationPreset === 'custom'
        ? nextConfig.customDurationSeconds
        : Number(nextConfig.durationPreset) || 300;
    const botFillMode =
      nextConfig.botPolicy === 'none'
        ? 'no_bots'
        : nextConfig.botPolicy === 'vs-ai'
        ? 'bots_vs_humans'
        : nextConfig.botPolicy === 'custom'
        ? 'custom'
        : 'auto_fill';
    const gameMode = FORMAT_TO_GAME_MODE[nextConfig.teamFormat] || '2v2';

    setOnlineSession({
      playerName: cleanName,
      roomId: cleanRoom,
      password: nextConfig.roomKey || undefined,
      roomType: 'match',
      gameMode,
      botFillMode,
      matchDurationSeconds: durationSec,
    });

    if (bridge.onHostOnlineWarmup) {
      setProgressStatus('running');
      setCurrentStep(2);
      try {
        setCurrentStep(3);
        const ok = await bridge.onHostOnlineWarmup({
          roomId: cleanRoom,
          password: nextConfig.roomKey || undefined,
          playerName: cleanName,
          roomType: 'match',
          gameMode,
          botFillMode,
          durationSeconds: durationSec,
          lobbyMode: true,
        });
        if (ok) {
          setCurrentStep(5);
          setProgressStatus('completed');
          setMatchMode('online-warmup');
          closeMenu();
        } else {
          setProgressStatus('error');
        }
      } catch {
        setProgressStatus('error');
      }
    }
  };

  return {
    ...rawProps,
    config: props.config ?? props.settings ?? (props.defaultConfig ? undefined : config),
    onConfigChange:
      props.onConfigChange ??
      ((next: HostMatchConfig, patch: Partial<HostMatchConfig>) => {
        setConfig(next);
        if (next.playerName) {
          setOnlineSession({ playerName: next.playerName });
        }
        void patch;
      }),
    progressStatus:
      props.progressStatus ?? (bridge.onHostOnlineWarmup ? progressStatus : undefined),
    currentStep:
      props.currentStep ?? (bridge.onHostOnlineWarmup ? currentStep : undefined),
    onStartHost: props.onStartHost ?? ((cfg: HostMatchConfig) => void handleStartHost(cfg)),
    onRetryHost: props.onRetryHost ?? (() => void handleStartHost(config)),
    onCancelHost:
      props.onCancelHost ??
      (() => {
        setProgressStatus('idle');
        setCurrentStep(1);
        bridge.onLeaveOnlineServer?.();
      }),
    onNavigateGarageSync:
      props.onNavigateGarageSync ?? (() => navigate('garage')),
    onBack: props.onBack ?? goBack,
  } as TProps;
}

export function useLayer3JoinRoomStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const navigate = useAppStore((s) => s.navigate);
  const closeMenu = useAppStore((s) => s.closeMenu);
  const setMatchMode = useAppStore((s) => s.setMatchMode);
  const onlineSession = useAppStore((s) => s.onlineSession);
  const setOnlineSession = useAppStore((s) => s.setOnlineSession);
  const bridge = useAppStore((s) => s.bridge);

  const [config, setConfig] = useState<JoinRoomConfig>(() => ({
    playerName:
      onlineSession.playerName && onlineSession.playerName !== 'Host'
        ? onlineSession.playerName
        : loadStoredPlayerName(),
    roomCode: onlineSession.roomId || '',
    roomKey: onlineSession.password || '',
    allowSpectating: true,
  }));

  const [progressStatus, setProgressStatus] = useState<CreationProgressStatus>('idle');
  const [currentStep, setCurrentStep] = useState<number>(1);

  const handleJoinRoom = async (nextConfig: JoinRoomConfig) => {
    const cleanName = nextConfig.playerName.trim() || generateDefaultPlayerName();
    saveStoredPlayerName(cleanName);
    const cleanRoom = nextConfig.roomCode.trim();
    if (!cleanRoom) {
      setCurrentStep(1);
      setProgressStatus('error');
      return;
    }

    setOnlineSession({
      playerName: cleanName,
      roomId: cleanRoom,
      password: nextConfig.roomKey || undefined,
    });

    if (bridge.onJoinOnlineWarmup) {
      setProgressStatus('running');
      setCurrentStep(2);
      try {
        setCurrentStep(3);
        const ok = await bridge.onJoinOnlineWarmup({
          roomId: cleanRoom,
          password: nextConfig.roomKey || undefined,
          playerName: cleanName,
        });
        if (ok) {
          setCurrentStep(5);
          setProgressStatus('completed');
          setMatchMode('online-warmup');
          closeMenu();
        } else {
          setProgressStatus('error');
        }
      } catch {
        setProgressStatus('error');
      }
    }
  };

  return {
    ...rawProps,
    config: props.config ?? props.settings ?? (props.defaultConfig ? undefined : config),
    onConfigChange:
      props.onConfigChange ??
      ((next: JoinRoomConfig) => {
        setConfig(next);
        if (next.playerName) {
          setOnlineSession({ playerName: next.playerName });
        }
      }),
    progressStatus:
      props.progressStatus ?? (bridge.onJoinOnlineWarmup ? progressStatus : undefined),
    currentStep:
      props.currentStep ?? (bridge.onJoinOnlineWarmup ? currentStep : undefined),
    onJoinRoom: props.onJoinRoom ?? ((cfg: JoinRoomConfig) => void handleJoinRoom(cfg)),
    onRetryJoin: props.onRetryJoin ?? (() => void handleJoinRoom(config)),
    onCancelJoin:
      props.onCancelJoin ??
      (() => {
        setProgressStatus('idle');
        setCurrentStep(1);
        bridge.onLeaveOnlineServer?.();
      }),
    onNavigateGarageSync:
      props.onNavigateGarageSync ?? (() => navigate('garage')),
    onBack: props.onBack ?? goBack,
  } as TProps;
}
