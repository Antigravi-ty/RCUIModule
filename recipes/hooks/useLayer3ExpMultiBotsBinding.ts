import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import {
  useExperimentalMultiBotsStore,
  EXP_CAR_COLOR_PALETTE,
  type ExpPlayerParticipation,
  type ExpSpeedMultiplier,
} from '../../stores/experimentalMultiBotsStore';
import { floatingStore } from '../../stores/floatingStore';
import {
  EXPERIMENTAL_MULTI_BOTS_PRESET,
  EXPERIMENTAL_BOT_PACK_PRESET,
} from '../../stores/devFloatingPresets';
import type {
  TeamRosterSlotConfig,
  BotPolicyId,
  CarColorSwatch,
} from '../../compounds/TeamRosterCard';

export interface Layer3ExpMultiBotsRecipeProps {
  isLight?: boolean;
  defaultBlueSlots?: TeamRosterSlotConfig[];
  defaultOrangeSlots?: TeamRosterSlotConfig[];
  blueSlots?: TeamRosterSlotConfig[];
  orangeSlots?: TeamRosterSlotConfig[];
  colorPalette?: CarColorSwatch[];
  activeCameraCarIndex?: number;
  activeBotpackShowcaseModel?: BotPolicyId | null;
  playerParticipation?: 'none' | 'blue' | 'orange';
  matchDurationSec?: number;
  simSpeedValue?: string;
  unlimitedBoost?: boolean;
  disableGoalReplay?: boolean;
  nextoLoaded?: boolean;
  nectoLoaded?: boolean;
  lastTotalInferenceMs?: number;
  isInExpMode?: boolean;
  onSelectBotpackShowcaseModel?: (botType: BotPolicyId) => void;
  onSetPlayerParticipation?: (mode: 'none' | 'blue' | 'orange') => void;
  onApplyFormatPreset?: (preset: string) => void;
  onAddBot?: (team: 0 | 1, botType: BotPolicyId) => void;
  onSelectCameraCar?: (carIndex: number) => void;
  onSetSlotBotType?: (team: 0 | 1, slotIndex: number, botType: BotPolicyId) => void;
  onSetSlotColor?: (team: 0 | 1, slotIndex: number, colorId: string) => void;
  onRemoveSlot?: (team: 0 | 1, slotIndex: number) => void;
  onSetMatchDurationSec?: (sec: number) => void;
  onSetSimSpeed?: (val: string) => void;
  onSetUnlimitedBoost?: (val: boolean) => void;
  onSetDisableGoalReplay?: (val: boolean) => void;
  onTriggerSandboxAction?: (
    action: 'reset_kickoff' | 'score_blue' | 'score_orange' | 'force_overtime'
  ) => void;
  onStartSimulation?: (config: {
    blueSlots: TeamRosterSlotConfig[];
    orangeSlots: TeamRosterSlotConfig[];
    activeCameraCarIndex: number;
  }) => void;
  onLaunchFloatingControl?: () => void;
  onEnterGame?: () => void;
  onBack?: () => void;
  className?: string;
}

const EXP_SWATCH_PALETTE: CarColorSwatch[] = EXP_CAR_COLOR_PALETTE.map((c) => ({
  id: String(c.id),
  name: c.name,
  hex: c.hex,
}));

export function useLayer3ExpMultiBotsStoreBinding(
  rawProps: Layer3ExpMultiBotsRecipeProps
): Layer3ExpMultiBotsRecipeProps {
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
    if (rawProps.onEnterGame) {
      rawProps.onEnterGame();
      return;
    }
    floatingStore.setOpacity(70);
    const isBotpackShowcase = Boolean(
      useExperimentalMultiBotsStore.getState().activeBotpackShowcaseModel
    );
    const targetPreset = isBotpackShowcase
      ? EXPERIMENTAL_BOT_PACK_PRESET
      : EXPERIMENTAL_MULTI_BOTS_PRESET;
    const otherPreset = isBotpackShowcase
      ? EXPERIMENTAL_MULTI_BOTS_PRESET
      : EXPERIMENTAL_BOT_PACK_PRESET;
    floatingStore.closeWindow(otherPreset.id);

    const snap = floatingStore.getSnapshot();
    const exists =
      snap.windows.some((w) => w.id === targetPreset.id) ||
      snap.activeFlight?.preset?.id === targetPreset.id;
    if (!exists) {
      floatingStore.spawnWindow({
        ...targetPreset,
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
    onBack: rawProps.onBack ?? goBack,
    blueSlots: rawProps.blueSlots ?? blueSlots,
    orangeSlots: rawProps.orangeSlots ?? orangeSlots,
    colorPalette: rawProps.colorPalette ?? EXP_SWATCH_PALETTE,
    activeCameraCarIndex: rawProps.activeCameraCarIndex ?? activeCameraCarIndex,
    playerParticipation: rawProps.playerParticipation ?? playerParticipation,
    matchDurationSec: rawProps.matchDurationSec ?? matchDurationSec,
    simSpeedValue: rawProps.simSpeedValue ?? simSpeedValue,
    unlimitedBoost: rawProps.unlimitedBoost ?? unlimitedBoost,
    disableGoalReplay: rawProps.disableGoalReplay ?? disableGoalReplay,
    nextoLoaded: rawProps.nextoLoaded ?? nextoLoaded,
    nectoLoaded: rawProps.nectoLoaded ?? nectoLoaded,
    lastTotalInferenceMs:
      rawProps.lastTotalInferenceMs ?? lastTotalInferenceMs,
    isInExpMode: rawProps.isInExpMode ?? isInExpMode,
    activeBotpackShowcaseModel:
      rawProps.activeBotpackShowcaseModel ?? activeBotpackShowcaseModel,
    onSelectBotpackShowcaseModel:
      rawProps.onSelectBotpackShowcaseModel ??
      ((botType: BotPolicyId) => applyBotpack9700488Showcase(botType, true)),
    onSetPlayerParticipation:
      rawProps.onSetPlayerParticipation ??
      ((v: ExpPlayerParticipation) => setPlayerParticipation(v)),
    onApplyFormatPreset:
      rawProps.onApplyFormatPreset ?? handleApplyFormatPreset,
    onAddBot:
      rawProps.onAddBot ?? ((team: 0 | 1, botType: BotPolicyId) => addBotToTeam(team, botType)),
    onSelectCameraCar: rawProps.onSelectCameraCar ?? setActiveCameraCarIndex,
    onSetSlotBotType:
      rawProps.onSetSlotBotType ??
      ((team: 0 | 1, slotIndex: number, botType: BotPolicyId) =>
        setSlotBotType(team, slotIndex, botType)),
    onSetSlotColor:
      rawProps.onSetSlotColor ??
      ((team: 0 | 1, slotIndex: number, colorId: string) =>
        setSlotColor(team, slotIndex, Number(colorId))),
    onRemoveSlot: rawProps.onRemoveSlot ?? removeSlotFromTeam,
    onSetMatchDurationSec:
      rawProps.onSetMatchDurationSec ?? setMatchDurationSec,
    onSetSimSpeed: rawProps.onSetSimSpeed ?? handleSimSpeedChange,
    onSetUnlimitedBoost: rawProps.onSetUnlimitedBoost ?? setUnlimitedBoost,
    onSetDisableGoalReplay:
      rawProps.onSetDisableGoalReplay ?? setDisableGoalReplay,
    onTriggerSandboxAction:
      rawProps.onTriggerSandboxAction ?? triggerSandboxAction,
    onEnterGame: handleEnterGame,
  };
}
