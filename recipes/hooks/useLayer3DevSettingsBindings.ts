import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useKickoffTrainingStore } from '../../stores/kickoffTrainingStore';
import { useExperimentalMultiBotsStore } from '../../stores/experimentalMultiBotsStore';
import {
  useSubsystemIsolationLabStore,
  type DevTestLabTab,
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

export interface BoostPhaseSelectionState {
  start: string;
  loop: string;
  end: string;
}

export type LayerDevTestLabTab = DevTestLabTab | 'exp-multi-bots' | 'exp-botpack-9700488';

export function useLayer3DevActiveTunersStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
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
    onBack: props.onBack ?? goBack,
    wsVerticalOffsetPct: props.wsVerticalOffsetPct ?? wsVerticalOffsetPct,
    onWsVerticalOffsetPctChange:
      props.onWsVerticalOffsetPctChange ?? setWsVerticalOffsetPct,
    carBallMode: props.carBallMode ?? carBallMode,
    onCarBallModeChange: props.onCarBallModeChange ?? handleCarBallModeChange,
    carCarMode: props.carCarMode ?? carCarMode,
    onCarCarModeChange: props.onCarCarModeChange ?? handleCarCarModeChange,
    boostSelection: props.boostSelection ?? boostSelection,
    onSelectBoostPhase: props.onSelectBoostPhase ?? handleSelectBoostPhase,
    onSelectAllBoostPhases:
      props.onSelectAllBoostPhases ?? handleSelectAllBoostPhases,
    onNavigateAdvancedAudio:
      props.onNavigateAdvancedAudio ?? (() => navigate('advanced-audio')),
    onNavigateEventTriggerRules:
      props.onNavigateEventTriggerRules ??
      (() => navigate('event-trigger-rules')),
  } as TProps;
}

export function useLayer3DevSandboxesStoreBinding<
  TProps extends object
>(rawProps: TProps): TProps {
  const props = rawProps as Record<string, any>;
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
      if (props.onNavigateExpMultiBots) {
        props.onNavigateExpMultiBots();
      } else {
        navigate('exp-multi-bots');
      }
      return;
    }

    if (tab === 'exp-botpack-9700488') {
      const expStore = useExperimentalMultiBotsStore.getState();
      const targetModel = expStore.activeBotpackShowcaseModel || 'ripple_v1_1';
      expStore.applyBotpack9700488Showcase(targetModel, true);
      if (matchMode === 'exp-multi-bots') {
        expStore.startOrApplyMatch();
        closeMenu();
      } else {
        bridge.onStartExpMultiBots?.();
      }
      return;
    }

    const labTab = tab as DevTestLabTab;
    setSelectedTab(labTab);
    applyAndRestartLab(labTab);
    if (props.onEnterBench) {
      props.onEnterBench(labTab);
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
    onBack: props.onBack ?? goBack,
    activeBenchId:
      props.activeBenchId !== undefined
        ? props.activeBenchId
        : isInDevLab
        ? activeTab
        : matchMode === 'exp-multi-bots' &&
          useExperimentalMultiBotsStore.getState().activeBotpackShowcaseModel
        ? 'exp-botpack-9700488'
        : null,
    onEnterBench: props.onEnterBench ?? handleEnterBench,
    onNavigateExpMultiBots:
      props.onNavigateExpMultiBots ??
      (() => navigate('exp-multi-bots')),
    onNavigateExpBotpack9700488:
      props.onNavigateExpBotpack9700488 ??
      (() => {
        const expStore = useExperimentalMultiBotsStore.getState();
        const targetModel = expStore.activeBotpackShowcaseModel || 'ripple_v1_1';
        expStore.applyBotpack9700488Showcase(targetModel, false);
        navigate('exp-multi-bots');
      }),
  } as TProps;
}

export function useLayer3DevUnderDevelopmentStoreBinding<
  TProps extends object
>(rawProps: TProps): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const underDev = useAppStore((s) => s.underDevelopment);
  const updateUnderDev = useAppStore((s) => s.updateUnderDevelopment);
  const closeMenu = useAppStore((s) => s.closeMenu);

  return {
    ...rawProps,
    onBack: props.onBack ?? goBack,
    threeWheelsEnabled:
      props.threeWheelsEnabled ?? Boolean(underDev?.threeWheelsEnabled),
    onThreeWheelsChange:
      props.onThreeWheelsChange ??
      ((enabled: boolean) => updateUnderDev({ threeWheelsEnabled: enabled })),
    onEnableAndDriveThreeWheels:
      props.onEnableAndDriveThreeWheels ?? closeMenu,
    stadiumPreset:
      props.stadiumPreset ?? (underDev?.stadiumPreset || 'standard'),
    onStadiumPresetChange:
      props.onStadiumPresetChange ??
      ((nextPreset: 'standard' | 'throwback') =>
        updateUnderDev({ stadiumPreset: nextPreset })),
    onLoadAndInspectThrowback: props.onLoadAndInspectThrowback ?? closeMenu,
    showCollisionOverlay:
      props.showCollisionOverlay ??
      Boolean(underDev?.showThrowbackCollisionOverlay),
    onShowCollisionOverlayChange:
      props.onShowCollisionOverlayChange ??
      ((visible: boolean) =>
        updateUnderDev({ showThrowbackCollisionOverlay: visible })),
    selectedCarIdx:
      props.selectedCarIdx ?? (underDev?.selectedBoostCarIndex ?? 0),
    onSelectedCarIdxChange:
      props.onSelectedCarIdxChange ??
      ((idx: number) =>
        updateUnderDev({
          selectedBoostCarIndex: Math.max(0, Math.min(7, Number(idx) || 0)),
        })),
    perCarBoostConfigs:
      props.perCarBoostConfigs ?? (underDev?.perCarBoostConfigs || {}),
    onPerCarBoostConfigsChange:
      props.onPerCarBoostConfigsChange ??
      ((next: Record<number, any>) => updateUnderDev({ perCarBoostConfigs: next })),
  } as TProps;
}
