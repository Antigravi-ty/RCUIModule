import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import {
  generateDefaultPlayerName,
  generateRandomFourDigits,
  loadStoredPlayerName,
  saveStoredPlayerName,
} from '../../config/vehiclePresets';
import type { HostMatchConfig } from '../online/OnlineRoomConfigSummaryCard';
import type {
  CreationProgressStatus,
  CreationStepSpec,
} from '../online/OnlineRoomCreationProgress';
import {
  FORMAT_TO_GAME_MODE,
  GAME_MODE_TO_FORMAT,
} from './useLayer2ManageRoomBinding';

export interface JoinRoomConfig {
  playerName: string;
  roomCode: string;
  roomKey: string;
  allowSpectating: boolean;
}

export interface Layer3HostMatchRecipeProps {
  isLight?: boolean;
  developerMode?: boolean;
  /** Room type context ('match' | 'warmup') used to derive default panel header title */
  roomType?: 'match' | 'warmup';
  /** Optional explicit panel header title override */
  title?: string;
  /** Initial expanded state for the Current Configuration disclosure card */
  defaultEditingConfig?: boolean;
  /** Controlled host match configuration */
  config?: Partial<HostMatchConfig>;
  /** Alias for controlled config */
  settings?: Partial<HostMatchConfig>;
  /** Initial host match configuration for uncontrolled mode */
  defaultConfig?: Partial<HostMatchConfig>;
  /** Callback fired when any host match setting changes */
  onChange?: (next: HostMatchConfig, patch: Partial<HostMatchConfig>) => void;
  /** Alias for onChange */
  onConfigChange?: (next: HostMatchConfig, patch: Partial<HostMatchConfig>) => void;
  onStartHost?: (config: HostMatchConfig) => void;
  /** Controlled 5-step creation progress status */
  progressStatus?: CreationProgressStatus;
  /** Controlled current step (1..5) */
  currentStep?: number;
  /** Custom step specifications */
  steps?: CreationStepSpec[];
  onProgressStatusChange?: (status: CreationProgressStatus) => void;
  onCurrentStepChange?: (step: number) => void;
  onRetryHost?: () => void;
  onCancelHost?: () => void;
  onNavigateGarageSync?: () => void;
  onNavigateAdvancedSettings?: () => void;
  onBack?: () => void;
}

export interface Layer3JoinRoomRecipeProps {
  isLight?: boolean;
  /** Controlled join room configuration */
  config?: Partial<JoinRoomConfig>;
  /** Alias for controlled config */
  settings?: Partial<JoinRoomConfig>;
  /** Initial join room configuration for uncontrolled mode */
  defaultConfig?: Partial<JoinRoomConfig>;
  /** Callback fired when any join room field changes */
  onChange?: (next: JoinRoomConfig, patch: Partial<JoinRoomConfig>) => void;
  /** Alias for onChange */
  onConfigChange?: (next: JoinRoomConfig, patch: Partial<JoinRoomConfig>) => void;
  defaultPlayerName?: string;
  defaultRoomCode?: string;
  defaultRoomKey?: string;
  defaultAllowSpectating?: boolean;
  onJoinRoom?: (config: JoinRoomConfig) => void;
  /** Controlled 5-step connection progress status */
  progressStatus?: CreationProgressStatus;
  /** Controlled current step (1..5) */
  currentStep?: number;
  /** Custom step specifications */
  steps?: CreationStepSpec[];
  onProgressStatusChange?: (status: CreationProgressStatus) => void;
  onCurrentStepChange?: (step: number) => void;
  onRetryJoin?: () => void;
  onCancelJoin?: () => void;
  onNavigateGarageSync?: () => void;
  onBack?: () => void;
}

export function useLayer3HostMatchStoreBinding(
  rawProps: Layer3HostMatchRecipeProps
): Layer3HostMatchRecipeProps {
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
    rawProps.roomType === 'warmup' || onlineSession.roomType === 'warmup'
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
    roomType: rawProps.roomType ?? resolvedRoomType,
    config: rawProps.config ?? rawProps.settings ?? (rawProps.defaultConfig ? undefined : config),
    onConfigChange:
      rawProps.onConfigChange ??
      ((next: HostMatchConfig, patch: Partial<HostMatchConfig>) => {
        setConfig(next);
        if (next.playerName) {
          setOnlineSession({ playerName: next.playerName });
        }
        void patch;
      }),
    progressStatus:
      rawProps.progressStatus ?? (bridge.onHostOnlineWarmup ? progressStatus : undefined),
    currentStep:
      rawProps.currentStep ?? (bridge.onHostOnlineWarmup ? currentStep : undefined),
    onStartHost: rawProps.onStartHost ?? ((cfg: HostMatchConfig) => void handleStartHost(cfg)),
    onRetryHost: rawProps.onRetryHost ?? (() => void handleStartHost(config)),
    onCancelHost:
      rawProps.onCancelHost ??
      (() => {
        setProgressStatus('idle');
        setCurrentStep(1);
        bridge.onLeaveOnlineServer?.();
      }),
    onNavigateGarageSync:
      rawProps.onNavigateGarageSync ?? (() => navigate('garage')),
    onBack: rawProps.onBack ?? goBack,
  };
}

export function useLayer3JoinRoomStoreBinding(
  rawProps: Layer3JoinRoomRecipeProps
): Layer3JoinRoomRecipeProps {
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
    config: rawProps.config ?? rawProps.settings ?? (rawProps.defaultConfig ? undefined : config),
    onConfigChange:
      rawProps.onConfigChange ??
      ((next: JoinRoomConfig) => {
        setConfig(next);
        if (next.playerName) {
          setOnlineSession({ playerName: next.playerName });
        }
      }),
    progressStatus:
      rawProps.progressStatus ?? (bridge.onJoinOnlineWarmup ? progressStatus : undefined),
    currentStep:
      rawProps.currentStep ?? (bridge.onJoinOnlineWarmup ? currentStep : undefined),
    onJoinRoom: rawProps.onJoinRoom ?? ((cfg: JoinRoomConfig) => void handleJoinRoom(cfg)),
    onRetryJoin: rawProps.onRetryJoin ?? (() => void handleJoinRoom(config)),
    onCancelJoin:
      rawProps.onCancelJoin ??
      (() => {
        setProgressStatus('idle');
        setCurrentStep(1);
        bridge.onLeaveOnlineServer?.();
      }),
    onNavigateGarageSync:
      rawProps.onNavigateGarageSync ?? (() => navigate('garage')),
    onBack: rawProps.onBack ?? goBack,
  };
}
