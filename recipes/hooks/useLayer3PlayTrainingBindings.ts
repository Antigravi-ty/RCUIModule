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

export type BotDifficultyTier = 'nexto' | 'necto' | 'easy' | 'medium' | 'hard';
export type ExhibitionMatchFormat = '1v1' | '2v2' | '3v3';
export type ExhibitionDuration = '90' | '180' | '300' | '600' | 'unlimited';

export interface ExhibitionBotSetupConfig {
  format: ExhibitionMatchFormat;
  difficulty: BotDifficultyTier;
  duration: ExhibitionDuration;
}

export interface Layer3ExhibitionRecipeProps {
  isLight?: boolean;
  /** Controlled exhibition setup config */
  config?: Partial<ExhibitionBotSetupConfig>;
  /** Alias for controlled config */
  settings?: Partial<ExhibitionBotSetupConfig>;
  /** Initial exhibition setup config for uncontrolled mode */
  defaultConfig?: Partial<ExhibitionBotSetupConfig>;
  /** Callback fired when any exhibition setup field changes */
  onChange?: (
    next: ExhibitionBotSetupConfig,
    patch: Partial<ExhibitionBotSetupConfig>
  ) => void;
  /** Alias for onChange */
  onConfigChange?: (
    next: ExhibitionBotSetupConfig,
    patch: Partial<ExhibitionBotSetupConfig>
  ) => void;
  defaultDifficulty?: BotDifficultyTier;
  defaultFormat?: ExhibitionMatchFormat;
  defaultDuration?: ExhibitionDuration;
  difficultyOptions?: Array<{ label: string; value: BotDifficultyTier }>;
  durationOptions?: Array<{ label: string; value: ExhibitionDuration }>;
  onSelectDifficulty?: (difficulty: BotDifficultyTier, config?: ExhibitionBotSetupConfig) => void;
  onNavigateAdvancedMutators?: () => void;
  onBack?: () => void;
  className?: string;
}

export type SelfTrainingModeId =
  | 'free-play'
  | 'static-training-pack'
  | 'dynamic-training-pack'
  | 'kickoff-training'
  | 'replay-viewer';

export interface Layer3SelfTrainingRecipeProps {
  isLight?: boolean;
  onSelectMode?: (mode: SelfTrainingModeId) => void;
  onBack?: () => void;
  className?: string;
}

export type KickoffAISpawnSide = 'same-position' | 'opposite-side';

export interface KickoffTrainingConfig {
  subMode: KickoffSubMode;
  aiSpawnSide: KickoffAISpawnSide;
  ghostMode: boolean;
  showRhythmHighway?: boolean;
}

export interface Layer3KickoffTrainingRecipeProps {
  isLight?: boolean;
  /** Controlled kickoff training config */
  config?: Partial<KickoffTrainingConfig>;
  /** Alias for controlled config */
  settings?: Partial<KickoffTrainingConfig>;
  /** Initial kickoff training config for uncontrolled mode */
  defaultConfig?: Partial<KickoffTrainingConfig>;
  /** Callback fired when any kickoff training setting changes */
  onChange?: (
    next: KickoffTrainingConfig,
    patch: Partial<KickoffTrainingConfig>
  ) => void;
  /** Alias for onChange */
  onConfigChange?: (
    next: KickoffTrainingConfig,
    patch: Partial<KickoffTrainingConfig>
  ) => void;
  onStartTraining?: (config: KickoffTrainingConfig) => void;
  onBack?: () => void;
  className?: string;
}

export type { KickoffSubMode };

export function useLayer3ExhibitionStoreBinding(
  rawProps: Layer3ExhibitionRecipeProps
): Layer3ExhibitionRecipeProps {
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
    const initialDifficulty: BotDifficultyTier =
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
    difficulty: BotDifficultyTier,
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
    config: rawProps.config ?? rawProps.settings ?? (rawProps.defaultConfig ? undefined : config),
    onConfigChange: rawProps.onConfigChange ?? ((next: ExhibitionBotSetupConfig) => setConfig(next)),
    onSelectDifficulty: rawProps.onSelectDifficulty ?? handleStartExhibition,
    onNavigateAdvancedMutators:
      rawProps.onNavigateAdvancedMutators ??
      (() => navigate('exp-multi-bots')),
    onBack: rawProps.onBack ?? goBack,
  };
}

export function useLayer3SelfTrainingStoreBinding(
  rawProps: Layer3SelfTrainingRecipeProps
): Layer3SelfTrainingRecipeProps {
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
    onBack: rawProps.onBack ?? goBack,
    onSelectMode: rawProps.onSelectMode ?? handleSelectMode,
  };
}

export function useLayer3KickoffTrainingStoreBinding(
  rawProps: Layer3KickoffTrainingRecipeProps
): Layer3KickoffTrainingRecipeProps {
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
    subMode: subMode as KickoffSubMode,
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
    config: rawProps.config ?? rawProps.settings ?? (rawProps.defaultConfig ? undefined : config),
    onConfigChange: rawProps.onConfigChange ?? handleConfigChange,
    onStartTraining: rawProps.onStartTraining ?? handleStartTraining,
    onBack: rawProps.onBack ?? goBack,
  };
}
