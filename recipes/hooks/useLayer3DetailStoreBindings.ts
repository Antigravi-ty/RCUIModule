import { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useExperimentalMultiBotsStore } from '../../stores/experimentalMultiBotsStore';
import {
  useKickoffTrainingStore,
  type KickoffSubMode,
} from '../../stores/kickoffTrainingStore';
import { useRewinderStore } from '../../stores/rewinderStore';
import { floatingStore } from '../../stores/floatingStore';
import {
  REPLAY_VIEWER_PRESET,
  REWINDER_CONFIGURATOR_PRESET,
} from '../../stores/floatingPresets';

export interface ExhibitionBotSetupConfig {
  format: '1v1' | '2v2' | '3v3';
  difficulty: string;
  duration: '90' | '180' | '300';
}

export type SelfTrainingModeId =
  | 'free-play'
  | 'static-training-pack'
  | 'dynamic-training-pack'
  | 'kickoff-training'
  | 'replay-viewer';

export interface KickoffTrainingConfig {
  subMode: KickoffSubMode;
  aiSpawnSide: 'opposite-side' | 'same-position';
  ghostMode: boolean;
  showRhythmHighway: boolean;
}

export function useLayer3ExhibitionStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const navigate = useAppStore((s) => s.navigate);
  const closeMenu = useAppStore((s) => s.closeMenu);
  const setMatchMode = useAppStore((s) => s.setMatchMode);
  const bridge = useAppStore((s) => s.bridge);
  const preloadEngines = useExperimentalMultiBotsStore((s) => s.preloadEngines);

  useEffect(() => {
    preloadEngines?.();
  }, [preloadEngines]);

  const [config, setConfig] = useState<ExhibitionBotSetupConfig>(() => {
    const expState = useExperimentalMultiBotsStore.getState();
    const initialFormat: ExhibitionBotSetupConfig['format'] =
      expState.exhibitionTeamSize === 'solo'
        ? '1v1'
        : expState.exhibitionTeamSize === 'double'
        ? '2v2'
        : '3v3';
    const initialDifficulty: ExhibitionBotSetupConfig['difficulty'] =
      expState.exhibitionBotId === 'nexto' ? 'nexto' : 'necto';
    const initialDuration: ExhibitionBotSetupConfig['duration'] =
      expState.matchDurationSec === 180
        ? '180'
        : expState.matchDurationSec === 300
        ? '300'
        : '90';
    return {
      format: initialFormat,
      difficulty: initialDifficulty,
      duration: initialDuration,
    };
  });

  const handleStartExhibition = (
    difficulty: ExhibitionBotSetupConfig['difficulty'],
    finalConfig = config
  ) => {
    const policy = difficulty === 'nexto' ? 'nexto' : 'necto';
    const durationSec = Number(finalConfig.duration) || 90;
    const teamSize =
      finalConfig.format === '1v1'
        ? 'solo'
        : finalConfig.format === '2v2'
        ? 'double'
        : 'standard';
    useExperimentalMultiBotsStore
      .getState()
      .configureExhibitionMatch(policy, durationSec, teamSize);
    setMatchMode('exp-multi-bots');
    closeMenu();
    bridge.onStartMatch?.(policy, durationSec, teamSize);
  };

  return {
    ...rawProps,
    config: props.config ?? props.settings ?? (props.defaultConfig ? undefined : config),
    onConfigChange: props.onConfigChange ?? ((next: ExhibitionBotSetupConfig) => setConfig(next)),
    onSelectDifficulty: props.onSelectDifficulty ?? handleStartExhibition,
    onNavigateAdvancedMutators:
      props.onNavigateAdvancedMutators ??
      (() => navigate('exp-multi-bots-config')),
    onBack: props.onBack ?? goBack,
  } as TProps;
}

export function useLayer3SelfTrainingStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const navigate = useAppStore((s) => s.navigate);
  const closeMenu = useAppStore((s) => s.closeMenu);
  const setMatchMode = useAppStore((s) => s.setMatchMode);
  const bridge = useAppStore((s) => s.bridge);
  const rewinderWindowOpen = useRewinderStore((s) => s.rewinderWindowOpen);

  const handleSelectMode = (mode: SelfTrainingModeId) => {
    if (mode === 'dynamic-training-pack') {
      return;
    }
    if (mode === 'free-play') {
      setMatchMode('freeplay');
      closeMenu();
      bridge.onReturnToFreeplay?.();
      if (rewinderWindowOpen) {
        floatingStore.spawnWindow({
          ...REWINDER_CONFIGURATOR_PRESET,
          startMinimized: true,
        });
      }
      return;
    }
    if (mode === 'static-training-pack') {
      navigate('static-training-pack');
      return;
    }
    if (mode === 'kickoff-training') {
      navigate('kickoff-training');
      return;
    }
    if (mode === 'replay-viewer') {
      setMatchMode('replay-viewer');
      closeMenu();
      if (bridge.onStartReplayViewer) {
        bridge.onStartReplayViewer();
      } else {
        floatingStore.spawnWindow({
          ...REPLAY_VIEWER_PRESET,
          startMinimized: false,
        });
      }
    }
  };

  return {
    ...rawProps,
    onBack: props.onBack ?? goBack,
    onSelectMode: props.onSelectMode ?? handleSelectMode,
  } as TProps;
}

export function useLayer3KickoffTrainingStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const closeMenu = useAppStore((s) => s.closeMenu);
  const setMatchMode = useAppStore((s) => s.setMatchMode);
  const bridge = useAppStore((s) => s.bridge);

  const {
    subMode,
    ghostPlacement,
    ghostModeEnabled,
    showKeyboardOverlay,
    setSubMode,
    setGhostPlacement,
    setGhostModeEnabled,
    setShowKeyboardOverlay,
  } = useKickoffTrainingStore();

  const config: KickoffTrainingConfig = {
    subMode,
    aiSpawnSide: ghostPlacement === 'same' ? 'same-position' : 'opposite-side',
    ghostMode: ghostModeEnabled,
    showRhythmHighway: showKeyboardOverlay,
  };

  const handleConfigChange = (
    _next: KickoffTrainingConfig,
    patch: Partial<KickoffTrainingConfig>
  ) => {
    if (patch.subMode !== undefined) setSubMode(patch.subMode);
    if (patch.aiSpawnSide !== undefined) {
      setGhostPlacement(patch.aiSpawnSide === 'same-position' ? 'same' : 'opposite');
    }
    if (patch.ghostMode !== undefined) setGhostModeEnabled(patch.ghostMode);
    if (patch.showRhythmHighway !== undefined) {
      setShowKeyboardOverlay(patch.showRhythmHighway);
    }
  };

  const handleStartTraining = (finalConfig: KickoffTrainingConfig) => {
    setSubMode(finalConfig.subMode);
    setGhostPlacement(finalConfig.aiSpawnSide === 'same-position' ? 'same' : 'opposite');
    setGhostModeEnabled(finalConfig.ghostMode);
    setMatchMode('kickoff-training');
    closeMenu();
    bridge.onStartKickoffTraining?.();
  };

  return {
    ...rawProps,
    config: props.config ?? props.settings ?? (props.defaultConfig ? undefined : config),
    onConfigChange: props.onConfigChange ?? handleConfigChange,
    onStartTraining: props.onStartTraining ?? handleStartTraining,
    onBack: props.onBack ?? goBack,
  } as TProps;
}

export function useLayer3TrainingStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const storeGameplay = useAppStore((s) => s.gameplay);
  const storeUpdateGameplay = useAppStore((s) => s.updateGameplay);

  return {
    ...rawProps,
    onBack: props.onBack ?? goBack,
    gameplay: props.gameplay ?? storeGameplay,
    onUpdateGameplay:
      props.onUpdateGameplay ??
      ((patch: Record<string, any>) =>
        storeUpdateGameplay({
          ...(patch as any),
          ...(patch.showCarHitbox !== undefined
            ? { showCarHitbox: Boolean(patch.showCarHitbox) }
            : {}),
        })),
  } as TProps;
}

export function useLayer3CameraStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const storeCamera = useAppStore((s) => s.camera);
  const storeUpdateCamera = useAppStore((s) => s.updateCamera);
  const storeResetCamera = useAppStore((s) => s.resetCamera);
  const setLivePreviewCollapsed = useAppStore((s) => s.setLivePreviewCollapsed);

  return {
    ...rawProps,
    onBack: props.onBack ?? goBack,
    config: props.config ?? props.settings ?? (props.defaultConfig ? undefined : storeCamera),
    onConfigChange:
      props.onConfigChange ?? ((_next: any, patch: any) => storeUpdateCamera(patch)),
    onReset: props.onReset ?? (() => storeResetCamera()),
    onCollapsePreview:
      props.onCollapsePreview ?? (() => setLivePreviewCollapsed(true)),
  } as TProps;
}

export function useLayer3BallTrajectoryStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const developerMode = useAppStore((s) => s.developerMode);
  const storeTrajectory = useAppStore((s) => s.trajectory);
  const storeUpdateTrajectory = useAppStore((s) => s.updateTrajectory);
  const setLivePreviewCollapsed = useAppStore((s) => s.setLivePreviewCollapsed);

  return {
    ...rawProps,
    onBack: props.onBack ?? goBack,
    developerMode: props.developerMode ?? developerMode,
    config:
      props.config ??
      props.settings ??
      (props.defaultConfig ? undefined : storeTrajectory),
    onChange: props.onChange ?? ((_next: any, patch: any) => storeUpdateTrajectory(patch)),
    onCollapsePreview:
      props.onCollapsePreview ?? (() => setLivePreviewCollapsed(true)),
  } as TProps;
}
