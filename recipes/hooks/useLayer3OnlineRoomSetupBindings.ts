import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import {
  generateDefaultPlayerName,
  generateRandomFourDigits,
  loadStoredPlayerName,
  saveStoredPlayerName,
} from '../../config/vehiclePresets';
import type { HostMatchConfig } from '../online/OnlineRoomConfigSummaryCard';
import type { CreationProgressStatus } from '../online/OnlineRoomCreationProgress';
import {
  FORMAT_TO_GAME_MODE,
  GAME_MODE_TO_FORMAT,
} from './useLayer2RoomHostControlBinding';

export interface JoinRoomConfig {
  playerName: string;
  roomCode: string;
  roomKey: string;
  allowSpectating: boolean;
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

  const resolvedRoomType: 'match' | 'warmup' =
    props.roomType === 'warmup' || onlineSession.roomType === 'warmup'
      ? 'warmup'
      : 'match';

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
      roomType: resolvedRoomType,
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
          roomType: resolvedRoomType,
          gameMode,
          botFillMode,
          durationSeconds: durationSec,
          lobbyMode: resolvedRoomType === 'match',
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
    roomType: props.roomType ?? resolvedRoomType,
    config: props.config ?? (props.defaultConfig ? undefined : config),
    onChange:
      props.onChange ??
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
