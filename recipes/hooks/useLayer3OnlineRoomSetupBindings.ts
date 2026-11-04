import { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useSignalingProfileStore } from '../../stores/signalingProfileStore';
import {
  generateDefaultPlayerName,
  loadStoredPlayerName,
  saveStoredPlayerName,
} from '../../config/vehiclePresets';
import {
  applyConnectivityMaskToRoomCode,
  finalizeHostRoomCode,
  generateRandomRoomCode,
  parseRoomCode,
} from '../../config/roomCodeConnectivityCodec';
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

export interface Layer3HostMatchStateOverride {
  steps?: CreationStepSpec[];
  onProgressStatusChange?: (status: CreationProgressStatus) => void;
  onCurrentStepChange?: (step: number) => void;
  onRetryHost?: () => void;
  onCancelHost?: () => void;
  onNavigateSignalingConfig?: () => void;
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
  /** Initial host match configuration for uncontrolled mode */
  defaultConfig?: Partial<HostMatchConfig>;
  /** Callback fired when any host match setting changes */
  onChange?: (next: HostMatchConfig, patch: Partial<HostMatchConfig>) => void;
  onStartHost?: (config: HostMatchConfig) => void;
  /** Controlled 5-step creation progress status */
  progressStatus?: CreationProgressStatus;
  /** Controlled current step (1..5) */
  currentStep?: number;
  onNavigateGarageSync?: () => void;
  onNavigateAdvancedSettings?: () => void;
  onBack?: () => void;
  stateOverride?: Layer3HostMatchStateOverride;
}

export type ResolvedLayer3HostMatchBinding = Omit<
  Layer3HostMatchRecipeProps,
  'stateOverride'
> &
  Layer3HostMatchStateOverride;

export interface Layer3JoinRoomStateOverride {
  steps?: CreationStepSpec[];
  onProgressStatusChange?: (status: CreationProgressStatus) => void;
  onCurrentStepChange?: (step: number) => void;
  onRetryJoin?: () => void;
  onCancelJoin?: () => void;
  onNavigateSignalingConfig?: () => void;
}

export interface Layer3JoinRoomRecipeProps {
  isLight?: boolean;
  /** Controlled join room configuration */
  config?: Partial<JoinRoomConfig>;
  /** Initial join room configuration for uncontrolled mode */
  defaultConfig?: Partial<JoinRoomConfig>;
  /** Callback fired when any join room field changes */
  onChange?: (next: JoinRoomConfig, patch: Partial<JoinRoomConfig>) => void;
  onJoinRoom?: (config: JoinRoomConfig) => void;
  /** Controlled 5-step connection progress status */
  progressStatus?: CreationProgressStatus;
  /** Controlled current step (1..5) */
  currentStep?: number;
  onNavigateGarageSync?: () => void;
  onBack?: () => void;
  stateOverride?: Layer3JoinRoomStateOverride;
}

export type ResolvedLayer3JoinRoomBinding = Omit<
  Layer3JoinRoomRecipeProps,
  'stateOverride'
> &
  Layer3JoinRoomStateOverride;

export function useLayer3HostMatchStoreBinding(
  rawProps: Layer3HostMatchRecipeProps
): ResolvedLayer3HostMatchBinding {
  const mergedProps: ResolvedLayer3HostMatchBinding = {
    ...rawProps.stateOverride,
    ...rawProps,
  };
  const goBack = useAppStore((s) => s.goBack);
  const navigate = useAppStore((s) => s.navigate);
  const closeMenu = useAppStore((s) => s.closeMenu);
  const setMatchMode = useAppStore((s) => s.setMatchMode);
  const setSettingsTargetTab = useAppStore((s) => s.setSettingsTargetTab);
  const setHighlightSetting = useAppStore((s) => s.setHighlightSetting);
  const onlineSession = useAppStore((s) => s.onlineSession);
  const setOnlineSession = useAppStore((s) => s.setOnlineSession);
  const bridge = useAppStore((s) => s.bridge);
  const hostMask = useSignalingProfileStore((s) => s.hostMask);
  const verifyRelays = useSignalingProfileStore((s) => s.verifyRelays);

  const [config, setConfig] = useState<HostMatchConfig>(() => ({
    playerName:
      onlineSession.playerName && onlineSession.playerName !== 'Host'
        ? onlineSession.playerName
        : loadStoredPlayerName(),
    roomCode:
      onlineSession.roomId || generateRandomRoomCode(hostMask),
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

  // Silent Pre-Probe on Host window mount: updates 4-bit hostMask and refreshes roomCode mask
  useEffect(() => {
    let cancelled = false;
    void verifyRelays().then((probedMask) => {
      if (cancelled) return;
      setConfig((prev) => ({
        ...prev,
        roomCode: applyConnectivityMaskToRoomCode(prev.roomCode, probedMask),
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [verifyRelays]);

  const [progressStatus, setProgressStatus] = useState<CreationProgressStatus>('idle');
  const [currentStep, setCurrentStep] = useState<number>(1);

  const resolvedRoomType: 'match' | 'warmup' =
    mergedProps.roomType === 'warmup' || onlineSession.roomType === 'warmup'
      ? 'warmup'
      : 'match';

  const handleStartHost = async (nextConfig: HostMatchConfig) => {
    const cleanName = nextConfig.playerName.trim() || generateDefaultPlayerName();
    saveStoredPlayerName(cleanName);
    const cleanRoom = finalizeHostRoomCode(nextConfig.roomCode, hostMask);
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
    ...mergedProps,
    roomType: mergedProps.roomType ?? resolvedRoomType,
    config: mergedProps.config ?? (mergedProps.defaultConfig ? undefined : config),
    onChange:
      mergedProps.onChange ??
      ((next: HostMatchConfig, patch: Partial<HostMatchConfig>) => {
        setConfig(next);
        if (next.playerName) {
          setOnlineSession({ playerName: next.playerName });
        }
        void patch;
      }),
    progressStatus:
      mergedProps.progressStatus ?? (bridge.onHostOnlineWarmup ? progressStatus : undefined),
    currentStep:
      mergedProps.currentStep ?? (bridge.onHostOnlineWarmup ? currentStep : undefined),
    onStartHost:
      mergedProps.onStartHost ?? ((cfg: HostMatchConfig) => void handleStartHost(cfg)),
    onRetryHost: mergedProps.onRetryHost ?? (() => void handleStartHost(config)),
    onCancelHost:
      mergedProps.onCancelHost ??
      (() => {
        setProgressStatus('idle');
        setCurrentStep(1);
        bridge.onLeaveOnlineServer?.();
      }),
    onNavigateGarageSync:
      mergedProps.onNavigateGarageSync ?? (() => navigate('garage')),
    onNavigateSignalingConfig:
      mergedProps.onNavigateSignalingConfig ??
      (() => {
        setSettingsTargetTab('advanced');
        setHighlightSetting('signaling-credential-bundle');
        navigate('settings');
      }),
    onBack: mergedProps.onBack ?? goBack,
  };
}

export function useLayer3JoinRoomStoreBinding(
  rawProps: Layer3JoinRoomRecipeProps
): ResolvedLayer3JoinRoomBinding {
  const mergedProps: ResolvedLayer3JoinRoomBinding = {
    ...rawProps.stateOverride,
    ...rawProps,
  };
  const goBack = useAppStore((s) => s.goBack);
  const navigate = useAppStore((s) => s.navigate);
  const closeMenu = useAppStore((s) => s.closeMenu);
  const setMatchMode = useAppStore((s) => s.setMatchMode);
  const setSettingsTargetTab = useAppStore((s) => s.setSettingsTargetTab);
  const setHighlightSetting = useAppStore((s) => s.setHighlightSetting);
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
    const parsed = parseRoomCode(nextConfig.roomCode);
    const cleanRoom = parsed?.canonicalRoomCode || nextConfig.roomCode.trim().toLowerCase();
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
    ...mergedProps,
    config: mergedProps.config ?? (mergedProps.defaultConfig ? undefined : config),
    onChange:
      mergedProps.onChange ??
      ((next: JoinRoomConfig) => {
        setConfig(next);
        if (next.playerName) {
          setOnlineSession({ playerName: next.playerName });
        }
      }),
    progressStatus:
      mergedProps.progressStatus ?? (bridge.onJoinOnlineWarmup ? progressStatus : undefined),
    currentStep:
      mergedProps.currentStep ?? (bridge.onJoinOnlineWarmup ? currentStep : undefined),
    onJoinRoom:
      mergedProps.onJoinRoom ?? ((cfg: JoinRoomConfig) => void handleJoinRoom(cfg)),
    onRetryJoin: mergedProps.onRetryJoin ?? (() => void handleJoinRoom(config)),
    onCancelJoin:
      mergedProps.onCancelJoin ??
      (() => {
        setProgressStatus('idle');
        setCurrentStep(1);
        bridge.onLeaveOnlineServer?.();
      }),
    onNavigateGarageSync:
      mergedProps.onNavigateGarageSync ?? (() => navigate('garage')),
    onNavigateSignalingConfig:
      mergedProps.onNavigateSignalingConfig ??
      (() => {
        setSettingsTargetTab('advanced');
        setHighlightSetting('signaling-credential-bundle');
        navigate('settings');
      }),
    onBack: mergedProps.onBack ?? goBack,
  };
}
