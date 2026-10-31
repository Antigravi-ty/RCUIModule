import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useKickoffTrainingStore } from '../../stores/kickoffTrainingStore';
import {
  useSubsystemIsolationLabStore,
  type DevTestLabTab,
} from '../../stores/subsystemIsolationLabStore';
import {
  useExperimentalMultiBotsStore,
  EXP_CAR_COLOR_PALETTE,
  type ExpPlayerParticipation,
  type ExpSpeedMultiplier,
} from '../../stores/experimentalMultiBotsStore';
import { floatingStore } from '../../stores/floatingStore';
import { EXPERIMENTAL_MULTI_BOTS_PRESET } from '../../stores/floatingPresets';
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
} from '../../config/audioConfig.js';
import type {
  TeamRosterSlotConfig,
  BotPolicyId,
  CarColorSwatch,
} from '../../compounds/TeamRosterCard';

export interface BoostPhaseSelectionState {
  start: string;
  loop: string;
  end: string;
}

export type LayerDevTestLabTab = DevTestLabTab | 'exp-multi-bots';

const EXP_SWATCH_PALETTE: CarColorSwatch[] = EXP_CAR_COLOR_PALETTE.map((c) => ({
  id: String(c.id),
  name: c.name,
  hex: c.hex,
}));

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
    onNavigateEventAndTriggerer:
      props.onNavigateEventAndTriggerer ??
      props.onNavigateEventTriggerer ??
      (() => navigate('event-and-triggerer')),
  } as TProps;
}

export function useLayer3DevSubsystemIsolationStoreBinding<
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
        navigate('exp-multi-bots-config');
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
        : null,
    onEnterBench: props.onEnterBench ?? handleEnterBench,
    onNavigateExpMultiBots:
      props.onNavigateExpMultiBots ??
      (() => navigate('exp-multi-bots-config')),
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

export function useLayer3ExpMultiBotsStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const {
    playerParticipation,
    blueSlots: storeBlueSlots,
    orangeSlots: storeOrangeSlots,
    activeCameraCarIndex,
    matchDurationSec,
    speedMultiplier,
    unlimitedBoost,
    disableGoalReplay,
    nextoLoaded,
    nectoLoaded,
    lastTotalInferenceMs,
    setPlayerParticipation,
    addBotToTeam,
    removeSlotFromTeam,
    setSlotBotType,
    setSlotColor,
    applyPresetRoster,
    setActiveCameraCarIndex,
    setMatchDurationSec,
    setSpeedMultiplier,
    setUnlimitedBoost,
    setDisableGoalReplay,
    startOrApplyMatch,
    triggerSandboxAction,
    preloadEngines,
  } = useExperimentalMultiBotsStore();

  useEffect(() => {
    preloadEngines?.();
  }, [preloadEngines]);

  const goBack = useAppStore((s) => s.goBack);
  const matchMode = useAppStore((s) => s.matchMode);
  const bridge = useAppStore((s) => s.bridge);
  const closeMenu = useAppStore((s) => s.closeMenu);
  const isInExpMode = matchMode === 'exp-multi-bots';

  const blueSlots: TeamRosterSlotConfig[] = storeBlueSlots.map((s) => ({
    id: s.id,
    team: s.team,
    isPlayer: s.isPlayer,
    botType: s.botType as BotPolicyId,
    colorSlot: String(s.colorSlot),
  }));

  const orangeSlots: TeamRosterSlotConfig[] = storeOrangeSlots.map((s) => ({
    id: s.id,
    team: s.team,
    isPlayer: s.isPlayer,
    botType: s.botType as BotPolicyId,
    colorSlot: String(s.colorSlot),
  }));

  const simSpeedValue =
    speedMultiplier === 200
      ? '2x'
      : speedMultiplier === 300
      ? '3x'
      : speedMultiplier === 400
      ? '4x'
      : '1x';

  const handleSimSpeedChange = (val: string) => {
    const mult: ExpSpeedMultiplier =
      val === '2x' ? 200 : val === '3x' ? 300 : val === '4x' ? 400 : 100;
    setSpeedMultiplier(mult);
  };

  const handleApplyFormatPreset = (preset: string) => {
    const map: Record<
      string,
      | '1v1-player'
      | '2v2-player'
      | '3v3-player'
      | '1v1-bots'
      | '2v2-bots'
      | '3v3-bots'
    > = {
      '1v1 +P': '1v1-player',
      '1v1 Bot': '1v1-bots',
      '2v2 +P': '2v2-player',
      '2v2 Bot': '2v2-bots',
      '3v3 +P': '3v3-player',
      '3v3 Bot': '3v3-bots',
    };
    const key = map[preset];
    if (key) {
      applyPresetRoster(key);
    }
  };

  const handleEnterGame = () => {
    if (props.onEnterGame) {
      props.onEnterGame();
      return;
    }
    floatingStore.setOpacity(70);
    const snap = floatingStore.getSnapshot();
    const exists =
      snap.windows.some((w) => w.id === EXPERIMENTAL_MULTI_BOTS_PRESET.id) ||
      snap.activeFlight?.preset?.id === EXPERIMENTAL_MULTI_BOTS_PRESET.id;
    if (!exists) {
      floatingStore.spawnWindow({
        ...EXPERIMENTAL_MULTI_BOTS_PRESET,
        startMinimized: true,
      });
    }
    if (isInExpMode) {
      startOrApplyMatch();
      closeMenu();
    } else {
      bridge.onStartExpMultiBots?.();
    }
  };

  return {
    ...rawProps,
    onBack: props.onBack ?? goBack,
    blueSlots: props.blueSlots ?? blueSlots,
    orangeSlots: props.orangeSlots ?? orangeSlots,
    colorPalette: props.colorPalette ?? EXP_SWATCH_PALETTE,
    activeCameraCarIndex: props.activeCameraCarIndex ?? activeCameraCarIndex,
    playerParticipation: props.playerParticipation ?? playerParticipation,
    matchDurationSec: props.matchDurationSec ?? matchDurationSec,
    simSpeedValue: props.simSpeedValue ?? simSpeedValue,
    unlimitedBoost: props.unlimitedBoost ?? unlimitedBoost,
    disableGoalReplay: props.disableGoalReplay ?? disableGoalReplay,
    nextoLoaded: props.nextoLoaded ?? nextoLoaded,
    nectoLoaded: props.nectoLoaded ?? nectoLoaded,
    lastTotalInferenceMs:
      props.lastTotalInferenceMs ?? lastTotalInferenceMs,
    isInExpMode: props.isInExpMode ?? isInExpMode,
    onSetPlayerParticipation:
      props.onSetPlayerParticipation ??
      ((v: ExpPlayerParticipation) => setPlayerParticipation(v)),
    onApplyFormatPreset:
      props.onApplyFormatPreset ?? handleApplyFormatPreset,
    onAddBot:
      props.onAddBot ?? ((team: 0 | 1, botType: BotPolicyId) => addBotToTeam(team, botType)),
    onSelectCameraCar: props.onSelectCameraCar ?? setActiveCameraCarIndex,
    onSetSlotBotType:
      props.onSetSlotBotType ??
      ((team: 0 | 1, slotIndex: number, botType: BotPolicyId) =>
        setSlotBotType(team, slotIndex, botType)),
    onSetSlotColor:
      props.onSetSlotColor ??
      ((team: 0 | 1, slotIndex: number, colorId: string | number) =>
        setSlotColor(team, slotIndex, Number(colorId))),
    onRemoveSlot: props.onRemoveSlot ?? removeSlotFromTeam,
    onSetMatchDurationSec:
      props.onSetMatchDurationSec ?? setMatchDurationSec,
    onSetSimSpeed: props.onSetSimSpeed ?? handleSimSpeedChange,
    onSetUnlimitedBoost: props.onSetUnlimitedBoost ?? setUnlimitedBoost,
    onSetDisableGoalReplay:
      props.onSetDisableGoalReplay ?? setDisableGoalReplay,
    onTriggerSandboxAction:
      props.onTriggerSandboxAction ?? triggerSandboxAction,
    onEnterGame: handleEnterGame,
  } as TProps;
}
