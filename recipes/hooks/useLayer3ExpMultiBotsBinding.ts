import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import {
  useExperimentalMultiBotsStore,
  EXP_CAR_COLOR_PALETTE,
  type ExpPlayerParticipation,
  type ExpSpeedMultiplier,
} from '../../stores/experimentalMultiBotsStore';
import { floatingStore } from '../../stores/floatingStore';
import { EXPERIMENTAL_MULTI_BOTS_PRESET } from '../../stores/devFloatingPresets';
import type {
  TeamRosterSlotConfig,
  BotPolicyId,
  CarColorSwatch,
} from '../../compounds/TeamRosterCard';

const EXP_SWATCH_PALETTE: CarColorSwatch[] = EXP_CAR_COLOR_PALETTE.map((c) => ({
  id: String(c.id),
  name: c.name,
  hex: c.hex,
}));

export function useLayer3ExpMultiBotsStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const {
    playerParticipation,
    blueSlots: storeBlueSlots,
    orangeSlots: storeOrangeSlots,
    activeBotpackShowcaseModel,
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
    applyBotpack9700488Showcase,
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
    activeBotpackShowcaseModel:
      props.activeBotpackShowcaseModel ?? activeBotpackShowcaseModel,
    onSelectBotpackShowcaseModel:
      props.onSelectBotpackShowcaseModel ??
      ((botType: BotPolicyId) => applyBotpack9700488Showcase(botType, true)),
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
