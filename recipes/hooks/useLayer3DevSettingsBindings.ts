import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useKickoffTrainingStore } from '../../stores/kickoffTrainingStore';
import { useExperimentalMultiBotsStore } from '../../stores/experimentalMultiBotsStore';
import {
  useSubsystemIsolationLabStore,
  type DevTestLabTab as IsolationDevTestLabTab,
} from '../../stores/subsystemIsolationLabStore';
import {
  audioConfig,
  DEFAULT_BOOST_VARIATION,
  setCarBallSoundMode,
  setCarCarSoundMode,
  setBoostStartVariation,
  setBoostLoopVariation,
  setBoostEndVariation,
  setAllBoostAudioVariations,
  previewBoostAudioVariation,
} from '../../config/audioConfig';
import type { PanelSizingConfig } from '../../tokens/menuLayoutTokens';
import type { PerCarBoostConfig } from '../dev/PerCarBoostConfigSection';

export interface BoostPhaseSelectionState {
  start: string;
  loop: string;
  end: string;
}

export interface Layer3DevActiveTunersRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  onNavigateAdvancedAudio?: () => void;
  onNavigateEventTriggerRules?: () => void;
  onNavigateEventAndTriggerer?: () => void;
  onNavigateEventTriggerer?: () => void;
  wsVerticalOffsetPct?: number;
  onWsVerticalOffsetPctChange?: (val: number) => void;
  carBallMode?: string;
  onCarBallModeChange?: (mode: string) => void;
  carCarMode?: string;
  onCarCarModeChange?: (mode: string) => void;
  boostSelection?: BoostPhaseSelectionState;
  onSelectBoostPhase?: (variationId: string, phase: 'start' | 'loop' | 'end') => void;
  onSelectAllBoostPhases?: (variationId: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAddPresetWindow?: (preset: any, e: React.MouseEvent<HTMLButtonElement>) => void;
  activeWindows?: unknown[];
  onClosePresetWindow?: (id: string) => void;
  sizing?: PanelSizingConfig;
}

export type DevTestLabTab =
  | IsolationDevTestLabTab
  | 'exp-multi-bots'
  | 'exp-botpack-9700488'
  | 'tem-pack-converter'
  | 'replay-to-rcs-importer';

export type LayerDevTestLabTab = DevTestLabTab;

export interface Layer3DevSandboxesRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  activeBenchId?: DevTestLabTab | null;
  onEnterBench?: (tab: DevTestLabTab) => void;
  onLaunchIsolationTab?: (tab: DevTestLabTab) => void;
  onNavigateSubsystemIsolation?: () => void;
  onNavigateMultiBots?: () => void;
  onNavigateExpMultiBots?: () => void;
  onNavigateExpBotpack9700488?: () => void;
  onNavigateTemPackConverter?: () => void;
  sizing?: PanelSizingConfig;
}

export interface Layer3DevUnderDevelopmentRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  onNavigateSignalingLab?: () => void;
  threeWheelsEnabled?: boolean;
  onThreeWheelsChange?: (enabled: boolean) => void;
  onEnableAndDriveThreeWheels?: () => void;
  stadiumPreset?: 'standard' | 'throwback';
  onStadiumPresetChange?: (preset: 'standard' | 'throwback') => void;
  onLoadAndInspectThrowback?: () => void;
  showCollisionOverlay?: boolean;
  onShowCollisionOverlayChange?: (visible: boolean) => void;
  selectedCarIdx?: number;
  onSelectedCarIdxChange?: (idx: number) => void;
  perCarBoostConfigs?: Record<number, PerCarBoostConfig>;
  onPerCarBoostConfigsChange?: (next: Record<number, PerCarBoostConfig>) => void;
  sizing?: PanelSizingConfig;
}

export function useLayer3DevActiveTunersStoreBinding(
  rawProps: Layer3DevActiveTunersRecipeProps
): Layer3DevActiveTunersRecipeProps {
  const goBack = useAppStore((s) => s.goBack);
  const navigate = useAppStore((s) => s.navigate);
  const wsVerticalOffsetPct = useKickoffTrainingStore((s) => s.wsVerticalOffsetPct);
  const setWsVerticalOffsetPct = useKickoffTrainingStore(
    (s) => s.setWsVerticalOffsetPct
  );

  const [carBallMode, setCarBallMode] = useState<string>(
    () => String(audioConfig.get('carBallSoundMode') || 'vehicle_body')
  );
  const [carCarMode, setCarCarMode] = useState<string>(
    () => String(audioConfig.get('carCarSoundMode') || 'vehicle_detail')
  );
  const [boostSelection, setBoostSelection] = useState<BoostPhaseSelectionState>(
    () => ({
      start: String(
        audioConfig.get('boostStartVariation') || DEFAULT_BOOST_VARIATION
      ),
      loop: String(
        audioConfig.get('boostLoopVariation') || DEFAULT_BOOST_VARIATION
      ),
      end: String(
        audioConfig.get('boostEndVariation') || DEFAULT_BOOST_VARIATION
      ),
    })
  );

  useEffect(() => {
    const handleSettingsChanged = () => {
      setCarBallMode(
        String(audioConfig.get('carBallSoundMode') || 'vehicle_body')
      );
      setCarCarMode(
        String(audioConfig.get('carCarSoundMode') || 'vehicle_detail')
      );
      setBoostSelection({
        start: String(
          audioConfig.get('boostStartVariation') || DEFAULT_BOOST_VARIATION
        ),
        loop: String(
          audioConfig.get('boostLoopVariation') || DEFAULT_BOOST_VARIATION
        ),
        end: String(
          audioConfig.get('boostEndVariation') || DEFAULT_BOOST_VARIATION
        ),
      });
    };
    const unsub = audioConfig.subscribe(handleSettingsChanged);
    return () => {
      unsub();
    };
  }, []);

  const handleCarBallModeChange = (mode: string) => {
    setCarBallMode(mode);
    setCarBallSoundMode(mode);
  };

  const handleCarCarModeChange = (mode: string) => {
    setCarCarMode(mode);
    setCarCarSoundMode(mode);
  };

  const handleSelectBoostPhase = (
    variationId: string,
    phase: 'start' | 'loop' | 'end'
  ) => {
    const next = { ...boostSelection, [phase]: variationId };
    setBoostSelection(next);
    if (next.start === next.loop && next.loop === next.end) {
      useAppStore
        .getState()
        .updateMaterials({
          boostAudio: variationId as
            | 'rush'
            | 'standard'
            | 'flamethrower'
            | 'plasma',
        });
    }
    if (phase === 'start') {
      setBoostStartVariation(variationId);
    } else if (phase === 'loop') {
      setBoostLoopVariation(variationId);
    } else {
      setBoostEndVariation(variationId);
    }
    previewBoostAudioVariation(variationId, phase);
  };

  const handleSelectAllBoostPhases = (variationId: string) => {
    setBoostSelection({
      start: variationId,
      loop: variationId,
      end: variationId,
    });
    setAllBoostAudioVariations(variationId);
    useAppStore
      .getState()
      .updateMaterials({
        boostAudio: variationId as
          | 'rush'
          | 'standard'
          | 'flamethrower'
          | 'plasma',
      });
    previewBoostAudioVariation(variationId, 'start');
  };

  return {
    ...rawProps,
    onBack: rawProps.onBack ?? goBack,
    wsVerticalOffsetPct: rawProps.wsVerticalOffsetPct ?? wsVerticalOffsetPct,
    onWsVerticalOffsetPctChange:
      rawProps.onWsVerticalOffsetPctChange ?? setWsVerticalOffsetPct,
    carBallMode: rawProps.carBallMode ?? carBallMode,
    onCarBallModeChange: rawProps.onCarBallModeChange ?? handleCarBallModeChange,
    carCarMode: rawProps.carCarMode ?? carCarMode,
    onCarCarModeChange: rawProps.onCarCarModeChange ?? handleCarCarModeChange,
    boostSelection: rawProps.boostSelection ?? boostSelection,
    onSelectBoostPhase: rawProps.onSelectBoostPhase ?? handleSelectBoostPhase,
    onSelectAllBoostPhases:
      rawProps.onSelectAllBoostPhases ?? handleSelectAllBoostPhases,
    onNavigateAdvancedAudio:
      rawProps.onNavigateAdvancedAudio ?? (() => navigate('advanced-audio')),
    onNavigateEventTriggerRules:
      rawProps.onNavigateEventTriggerRules ??
      rawProps.onNavigateEventAndTriggerer ??
      rawProps.onNavigateEventTriggerer ??
      (() => navigate('event-trigger-rules')),
  };
}

export function useLayer3DevSandboxesStoreBinding(
  rawProps: Layer3DevSandboxesRecipeProps
): Layer3DevSandboxesRecipeProps {
  const { activeTab, setSelectedTab, applyAndRestartLab } =
    useSubsystemIsolationLabStore();
  const matchMode = useAppStore((s) => s.matchMode);
  const bridge = useAppStore((s) => s.bridge);
  const closeMenu = useAppStore((s) => s.closeMenu);
  const navigate = useAppStore((s) => s.navigate);
  const goBack = useAppStore((s) => s.goBack);
  const isInDevLab = matchMode === 'dev-test-lab';

  const handleEnterBench = (tab: LayerDevTestLabTab) => {
    if (tab === 'exp-multi-bots') {
      const expStore = useExperimentalMultiBotsStore.getState();
      expStore.activateMultiBotsSubMode(true);
      if (matchMode === 'exp-multi-bots') {
        expStore.startOrApplyMatch();
        closeMenu();
      } else {
        bridge.onStartExpMultiBots?.();
      }
      return;
    }

    if (tab === 'exp-botpack-9700488') {
      const expStore = useExperimentalMultiBotsStore.getState();
      expStore.activateBotpackSubMode(undefined, true);
      if (matchMode === 'exp-multi-bots') {
        expStore.startOrApplyMatch();
        closeMenu();
      } else {
        bridge.onStartExpMultiBots?.();
      }
      return;
    }

    if (tab === 'tem-pack-converter') {
      navigate('dev-tem-pack-converter');
      return;
    }

    if (tab === 'replay-to-rcs-importer') {
      if (bridge.onStartReplayToRcsImporter) {
        bridge.onStartReplayToRcsImporter();
      } else {
        closeMenu();
      }
      return;
    }

    const labTab = tab as IsolationDevTestLabTab;
    setSelectedTab(labTab);
    applyAndRestartLab(labTab);
    if (rawProps.onEnterBench) {
      rawProps.onEnterBench(tab);
      return;
    }
    if (isInDevLab) {
      closeMenu();
    } else {
      bridge.onStartDevTestLab?.();
    }
  };

  return {
    ...rawProps,
    onBack: rawProps.onBack ?? goBack,
    activeBenchId:
      rawProps.activeBenchId !== undefined
        ? rawProps.activeBenchId
        : isInDevLab
        ? activeTab
        : matchMode === 'exp-multi-bots'
        ? useExperimentalMultiBotsStore.getState().activeSubMode === 'botpack'
          ? 'exp-botpack-9700488'
          : 'exp-multi-bots'
        : null,
    onEnterBench: rawProps.onEnterBench ?? handleEnterBench,
    onNavigateExpMultiBots:
      rawProps.onNavigateExpMultiBots ??
      (() => {
        const expStore = useExperimentalMultiBotsStore.getState();
        expStore.activateMultiBotsSubMode(false);
        navigate('exp-multi-bots');
      }),
    onNavigateExpBotpack9700488:
      rawProps.onNavigateExpBotpack9700488 ??
      (() => {
        const expStore = useExperimentalMultiBotsStore.getState();
        expStore.activateBotpackSubMode(undefined, false);
        navigate('exp-botpack-9700488');
      }),
    onNavigateTemPackConverter:
      rawProps.onNavigateTemPackConverter ??
      (() => {
        navigate('dev-tem-pack-converter');
      }),
  };
}

export function useLayer3DevUnderDevelopmentStoreBinding(
  rawProps: Layer3DevUnderDevelopmentRecipeProps
): Layer3DevUnderDevelopmentRecipeProps {
  const goBack = useAppStore((s) => s.goBack);
  const navigate = useAppStore((s) => s.navigate);
  const underDev = useAppStore((s) => s.underDevelopment);
  const updateUnderDev = useAppStore((s) => s.updateUnderDevelopment);
  const closeMenu = useAppStore((s) => s.closeMenu);

  return {
    ...rawProps,
    onBack: rawProps.onBack ?? goBack,
    onNavigateSignalingLab:
      rawProps.onNavigateSignalingLab ?? (() => navigate('dev-signaling-lab')),
    threeWheelsEnabled:
      rawProps.threeWheelsEnabled ?? Boolean(underDev?.threeWheelsEnabled),
    onThreeWheelsChange:
      rawProps.onThreeWheelsChange ??
      ((enabled: boolean) => updateUnderDev({ threeWheelsEnabled: enabled })),
    onEnableAndDriveThreeWheels:
      rawProps.onEnableAndDriveThreeWheels ?? closeMenu,
    stadiumPreset:
      rawProps.stadiumPreset ?? (underDev?.stadiumPreset || 'standard'),
    onStadiumPresetChange:
      rawProps.onStadiumPresetChange ??
      ((nextPreset: 'standard' | 'throwback') =>
        updateUnderDev({ stadiumPreset: nextPreset })),
    onLoadAndInspectThrowback: rawProps.onLoadAndInspectThrowback ?? closeMenu,
    showCollisionOverlay:
      rawProps.showCollisionOverlay ??
      Boolean(underDev?.showThrowbackCollisionOverlay),
    onShowCollisionOverlayChange:
      rawProps.onShowCollisionOverlayChange ??
      ((visible: boolean) =>
        updateUnderDev({ showThrowbackCollisionOverlay: visible })),
    selectedCarIdx:
      rawProps.selectedCarIdx ?? (underDev?.selectedBoostCarIndex ?? 0),
    onSelectedCarIdxChange:
      rawProps.onSelectedCarIdxChange ??
      ((idx: number) =>
        updateUnderDev({
          selectedBoostCarIndex: Math.max(0, Math.min(7, Number(idx) || 0)),
        })),
    perCarBoostConfigs:
      rawProps.perCarBoostConfigs ??
      ((underDev?.perCarBoostConfigs as Record<number, PerCarBoostConfig> | undefined) || {}),
    onPerCarBoostConfigsChange:
      rawProps.onPerCarBoostConfigsChange ??
      ((next: Record<number, PerCarBoostConfig>) =>
        updateUnderDev({ perCarBoostConfigs: next })),
  };
}
