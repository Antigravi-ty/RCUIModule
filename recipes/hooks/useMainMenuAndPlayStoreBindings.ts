import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useExperimentalMultiBotsStore } from '../../stores/experimentalMultiBotsStore';
import { garageSettingsStore } from '../../config/vehiclePresets.js';
import {
  BLUE_TEAM_COLORS,
  ORANGE_TEAM_COLORS,
} from '../garage/garageConstants';
import {
  type StoredColorPrefs,
  loadStoredColorPrefs,
  saveStoredColorPrefs,
} from '../../config/uiConfig';
import type {
  Layer1MainMenuRecipeProps,
  Layer1ContextVariation,
} from '../Layer1MainMenuRecipe';
import type { Layer2PlayRecipeProps } from '../Layer2PlayRecipe';
import type { Layer2GarageRecipeProps } from '../Layer2GarageRecipe';

export function useLayer1MainMenuStoreBinding(
  props: Layer1MainMenuRecipeProps
): Layer1MainMenuRecipeProps {
  const matchMode = useAppStore((s) => s.matchMode);
  const onlineSession = useAppStore((s) => s.onlineSession);
  const touchMode = useAppStore((s) => s.touchMode);
  const touchHeadlessMode = useAppStore((s) => s.touchHeadlessMode);
  const touchInputAgent = useAppStore((s) => s.touchInputAgent);
  const setTouchInputAgent = useAppStore((s) => s.setTouchInputAgent);
  const menuPowerSave = useAppStore((s) => s.graphics?.menuPowerSave);
  const navigate = useAppStore((s) => s.navigate);
  const closeMenu = useAppStore((s) => s.closeMenu);
  const bridge = useAppStore((s) => s.bridge);
  const isExhibitionMode = useExperimentalMultiBotsStore((s) => s.isExhibitionMode);

  const isHosting = Boolean(onlineSession?.isHosting);
  const isOnlineMatchRoom = onlineSession?.roomType === 'match';
  const hasActiveOnlineRoom =
    matchMode === 'online-warmup' || Boolean(onlineSession?.roomId);

  let derivedVariation: Layer1ContextVariation = 'freeplay';
  if (matchMode === 'match') {
    if (hasActiveOnlineRoom) {
      derivedVariation = isHosting ? 'online-match-host' : 'online-match-client';
    } else {
      derivedVariation = 'exhibition';
    }
  } else if (matchMode === 'dev-test-lab') {
    derivedVariation = 'dev-test-lab';
  } else if (matchMode === 'exp-multi-bots') {
    derivedVariation = isExhibitionMode ? 'exhibition' : 'exp-multi-bots';
  } else if (matchMode === 'kickoff-training') {
    derivedVariation = 'kickoff-training';
  } else if (matchMode === 'static-training-pack') {
    derivedVariation = props.extraBottomAction
      ? 'static-training-edit'
      : 'static-training-play';
  } else if (hasActiveOnlineRoom) {
    if (isOnlineMatchRoom) {
      derivedVariation = isHosting ? 'match-lobby-host' : 'match-lobby-client';
    } else {
      derivedVariation = isHosting ? 'online-warmup-host' : 'online-warmup-client';
    }
  }

  return {
    ...props,
    contextVariation:
      props.contextVariation ?? props.contextMode ?? derivedVariation,
    touchMode: props.touchMode ?? touchMode,
    touchHeadlessMode: props.touchHeadlessMode ?? touchHeadlessMode,
    touchInputAgent: props.touchInputAgent ?? touchInputAgent,
    onTouchInputAgentChange: props.onTouchInputAgentChange ?? setTouchInputAgent,
    menuPowerSave: props.menuPowerSave ?? menuPowerSave,
    onResume: props.onResume ?? closeMenu,
    onReturnToFreeplay:
      props.onReturnToFreeplay ??
      (() => {
        useAppStore.getState().setMatchMode('freeplay');
        closeMenu();
        bridge.onReturnToFreeplay?.();
      }),
    onNavigatePlay: props.onNavigatePlay ?? (() => navigate('play')),
    onNavigateGarage: props.onNavigateGarage ?? (() => navigate('garage')),
    onNavigateSettings:
      props.onNavigateSettings ??
      ((tab) => {
        if (tab === 'display') {
          useAppStore.getState().setHighlightSetting('menu-power-save');
        }
        navigate('settings');
      }),
    onNavigateManageRoom:
      props.onNavigateManageRoom ?? (() => navigate('room-host-control')),
    onNavigateExpMultiBotsConfig:
      props.onNavigateExpMultiBotsConfig ??
      (() => navigate('exp-multi-bots-config')),
  };
}

export function useLayer2PlayStoreBinding(
  props: Layer2PlayRecipeProps
): Layer2PlayRecipeProps {
  const navigate = useAppStore((s) => s.navigate);
  const goBack = useAppStore((s) => s.goBack);

  const onSelectExhibition =
    props.onSelectExhibition ?? (() => navigate('exhibition'));
  const onSelectHostMatch =
    props.onSelectHostMatch ?? (() => navigate('host-match'));
  const onSelectJoinRoom =
    props.onSelectJoinRoom ?? (() => navigate('join-room'));
  const onSelectSelfTraining =
    props.onSelectSelfTraining ?? (() => navigate('self-training'));

  return {
    ...props,
    onBack: props.onBack ?? goBack,
    onSelectExhibition,
    onSelectHostMatch,
    onSelectJoinRoom,
    onSelectSelfTraining,
    onSelectMode:
      props.onSelectMode ??
      ((modeId) => {
        if (modeId === 'exhibition') onSelectExhibition();
        else if (modeId === 'host-match') onSelectHostMatch();
        else if (modeId === 'join-room') onSelectJoinRoom();
        else if (modeId === 'self-training') onSelectSelfTraining();
      }),
  };
}

export function useLayer2GarageStoreBinding(
  props: Layer2GarageRecipeProps
): Layer2GarageRecipeProps {
  const goBack = useAppStore((s) => s.goBack);
  const activeCar = useAppStore((s) => s.activeCar);
  const setActiveCar = useAppStore((s) => s.setActiveCar);
  const materials = useAppStore((s) => s.materials);
  const updateMaterials = useAppStore((s) => s.updateMaterials);
  const [selectedAnthem, setSelectedAnthem] = useState<string>('default');
  const [colorPrefs, setColorPrefs] = useState<StoredColorPrefs>(loadStoredColorPrefs);

  const saveAndBroadcastColors = (nextPrefs: StoredColorPrefs) => {
    setColorPrefs(nextPrefs);
    const activeSlotId = saveStoredColorPrefs(nextPrefs);
    useExperimentalMultiBotsStore.getState().syncExhibitionFromColorPrefs?.();
    const allColors = [...BLUE_TEAM_COLORS, ...ORANGE_TEAM_COLORS];
    const found = allColors.find((c) => c.id === activeSlotId);
    if (found) {
      const bridge = useAppStore.getState().bridge;
      bridge?.onColorChange?.(found.hex, found.id);
    }
  };

  const handleSelectCar = (carId: string) => {
    setActiveCar(carId);
    try {
      garageSettingsStore.save({ vehiclePreset: carId, carVisual: carId });
    } catch {
      // ignore storage error
    }
  };

  return {
    ...props,
    onBack: props.onBack ?? goBack,
    selectedCar: props.selectedCar ?? activeCar,
    onSelectCar: props.onSelectCar ?? handleSelectCar,
    primaryTeam: props.primaryTeam ?? colorPrefs.primaryTeam,
    onPrimaryTeamChange:
      props.onPrimaryTeamChange ??
      ((team) => saveAndBroadcastColors({ ...colorPrefs, primaryTeam: team })),
    paintFinish: props.paintFinish ?? materials.paintFinish,
    onPaintFinishChange:
      props.onPaintFinishChange ??
      ((paintFinish) => updateMaterials({ paintFinish })),
    blueOrder: props.blueOrder ?? colorPrefs.blueOrder,
    onBlueOrderChange:
      props.onBlueOrderChange ??
      ((blueOrder) => saveAndBroadcastColors({ ...colorPrefs, blueOrder })),
    orangeOrder: props.orangeOrder ?? colorPrefs.orangeOrder,
    onOrangeOrderChange:
      props.onOrangeOrderChange ??
      ((orangeOrder) => saveAndBroadcastColors({ ...colorPrefs, orangeOrder })),
    materials: props.materials ?? {
      ...materials,
      boostAudio: materials.boostAudio ?? 'rush',
    },
    onUpdateMaterials: props.onUpdateMaterials ?? updateMaterials,
    selectedAnthem: props.selectedAnthem ?? selectedAnthem,
    onSelectAnthem: props.onSelectAnthem ?? setSelectedAnthem,
  };
}
