import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useExperimentalMultiBotsStore } from '../../stores/experimentalMultiBotsStore';
import { useReplayViewerStore } from '../../stores/replayViewerStore';
import { useNameTagTunerStore } from '../../stores/nameTagTunerStore';
import { useRewinderStore } from '../../stores/rewinderStore';
import { useNetworkDiagnosticsData } from '../../stores/networkDiagnosticsStore';
import { useSpatialAudioStore } from '../../stores/spatialAudioStore';
import { getActiveReplayTimelineController } from '../../stores/replayDirectorStore';
import {
  garageSettingsStore,
  loadStoredColorPrefs,
  saveStoredColorPrefs,
} from '../../config/vehiclePresets';
import {
  BLUE_TEAM_COLORS,
  ORANGE_TEAM_COLORS,
} from '../garage/garageConstants';
import type { VisualMaterialsConfig } from '../garage/GarageLoadoutTab';
import { type StoredColorPrefs } from '../../config/uiConfig';
import type {
  PlayCardStyleParams,
  PlayCardStyleVariant,
} from '../../stores/playCardStyleStore';
import type { CanonicalLayer1ContextVariation } from '../layer1MenuContextSpecs';

export type TouchInputAgentOption = 'none' | 'necto' | 'nexto';

export interface Layer2PlayRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  onSelectMode?: (modeId: string) => void;
  onSelectExhibition?: () => void;
  onSelectHostMatch?: () => void;
  onSelectJoinRoom?: () => void;
  onSelectSelfTraining?: () => void;
  /** Optional explicit card style variant override (decoupled from store when provided) */
  cardVariant?: PlayCardStyleVariant;
  /** Optional explicit card style parameters override (decoupled from store when provided) */
  cardStyleParams?: Partial<PlayCardStyleParams>;
}

export type GarageTabId =
  | 'car'
  | 'paint'
  | 'loadout'
  | 'anthem'
  | 'sync'
  | 'colour'
  | 'materials'
  | 'player-name';

export function useLayer1MainMenuStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
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
  const replayViewerHasLoaded = useReplayViewerStore(
    (s) => Boolean((s.loadedFileName && s.totalFrames > 0) || s.viewerState !== 'idle')
  );
  const isNameTagTunerArenaActive = useNameTagTunerStore((s) => s.isTunerArenaActive);
  const rewinderState = useRewinderStore((s) => s.rewinderState);
  const { metrics: netDiagMetrics } = useNetworkDiagnosticsData();

  const activeDirectorCtrl = getActiveReplayTimelineController();
  const isDirectorPreviewActive = Boolean(
    activeDirectorCtrl?.isActive &&
      (activeDirectorCtrl?.isImportedPreview || activeDirectorCtrl?.isPersistent)
  );
  const isRewinderBlocking =
    rewinderState === 'paused-scrub' ||
    rewinderState === 'rewinding' ||
    rewinderState === 'forwarding' ||
    rewinderState === 'preroll-countdown';
  const hasFreeplaySubSceneOverride = Boolean(
    isNameTagTunerArenaActive ||
      isDirectorPreviewActive ||
      isRewinderBlocking ||
      netDiagMetrics?.zeroGFleetEnabled
  );

  const isHosting = Boolean(onlineSession?.isHosting);
  const isOnlineMatchRoom = onlineSession?.roomType === 'match';
  const hasActiveOnlineRoom =
    matchMode === 'online-warmup' || Boolean(onlineSession?.roomId);

  let derivedVariation: CanonicalLayer1ContextVariation = 'freeplay';
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
  } else if (
    matchMode === 'replay-viewer' ||
    (matchMode === 'freeplay' && replayViewerHasLoaded)
  ) {
    derivedVariation = 'replay-viewer';
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

  const handleReturnToFreeplay =
    props.onReturnToFreeplay ??
    (() => {
      useAppStore.getState().setMatchMode('freeplay');
      closeMenu();
      bridge.onReturnToFreeplay?.();
    });

  const resolvedExtraBottomAction =
    props.extraBottomAction ??
    (derivedVariation === 'freeplay' && hasFreeplaySubSceneOverride
      ? {
          title: 'Exit to Free Play',
          subtitle: 'Leave active arena preview and return to Free Play',
          variant: 'secondary' as const,
          onClick: handleReturnToFreeplay,
        }
      : undefined);

  return {
    ...rawProps,
    contextVariation:
      props.contextVariation ?? props.contextMode ?? derivedVariation,
    extraBottomAction: resolvedExtraBottomAction,
    touchMode: props.touchMode ?? touchMode,
    touchHeadlessMode: props.touchHeadlessMode ?? touchHeadlessMode,
    touchInputAgent: props.touchInputAgent ?? touchInputAgent,
    onTouchInputAgentChange: props.onTouchInputAgentChange ?? setTouchInputAgent,
    menuPowerSave: props.menuPowerSave ?? menuPowerSave,
    onResume: props.onResume ?? closeMenu,
    onReturnToFreeplay: handleReturnToFreeplay,
    onNavigatePlay: props.onNavigatePlay ?? (() => navigate('play')),
    onNavigateGarage: props.onNavigateGarage ?? (() => navigate('garage')),
    onNavigateSettings:
      props.onNavigateSettings ??
      ((tab?: string) => {
        if (tab === 'display') {
          useAppStore.getState().setHighlightSetting('menu-power-save');
        }
        navigate('settings');
      }),
    onNavigateManageRoom:
      props.onNavigateManageRoom ?? (() => navigate('manage-room')),
    onNavigateRoomControl:
      props.onNavigateRoomControl ?? (() => navigate('manage-room')),
    onNavigateExpMultiBotsConfig:
      props.onNavigateExpMultiBotsConfig ??
      (() => navigate('exp-multi-bots')),
    onNavigateExpMultiBots:
      props.onNavigateExpMultiBots ??
      (() => navigate('exp-multi-bots')),
  } as TProps;
}

export function useLayer2PlayStoreBinding(
  rawProps: Layer2PlayRecipeProps
): Layer2PlayRecipeProps {
  const navigate = useAppStore((s) => s.navigate);
  const goBack = useAppStore((s) => s.goBack);

  const onSelectExhibition =
    rawProps.onSelectExhibition ?? (() => navigate('exhibition'));
  const onSelectHostMatch =
    rawProps.onSelectHostMatch ?? (() => navigate('host-match'));
  const onSelectJoinRoom =
    rawProps.onSelectJoinRoom ?? (() => navigate('join-room'));
  const onSelectSelfTraining =
    rawProps.onSelectSelfTraining ?? (() => navigate('self-training'));

  return {
    ...rawProps,
    onBack: rawProps.onBack ?? goBack,
    onSelectExhibition,
    onSelectHostMatch,
    onSelectJoinRoom,
    onSelectSelfTraining,
    onSelectMode:
      rawProps.onSelectMode ??
      ((modeId: string) => {
        if (modeId === 'exhibition') onSelectExhibition();
        else if (modeId === 'host-match') onSelectHostMatch();
        else if (modeId === 'join-room') onSelectJoinRoom();
        else if (modeId === 'self-training') onSelectSelfTraining();
      }),
  };
}

export function useLayer2GarageStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const activeCar = useAppStore((s) => s.activeCar);
  const setActiveCar = useAppStore((s) => s.setActiveCar);
  const materials = useAppStore((s) => s.materials);
  const updateMaterials = useAppStore((s) => s.updateMaterials);
  const selectedAnthem = useSpatialAudioStore((s) => s.selectedAnthem);
  const setSelectedAnthem = useSpatialAudioStore((s) => s.setSelectedAnthem);
  const stopPreviewAnthem = useSpatialAudioStore((s) => s.stopPreviewAnthem);
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
    ...rawProps,
    onBack:
      props.onBack ??
      (() => {
        stopPreviewAnthem();
        goBack();
      }),
    onTabChange:
      props.onTabChange ??
      ((tab: string) => {
        if (tab !== 'anthem') {
          stopPreviewAnthem();
        }
      }),
    selectedCar: props.selectedCar ?? activeCar,
    onSelectCar: props.onSelectCar ?? handleSelectCar,
    primaryTeam: props.primaryTeam ?? colorPrefs.primaryTeam,
    onPrimaryTeamChange:
      props.onPrimaryTeamChange ??
      ((team: 'blue' | 'orange') => saveAndBroadcastColors({ ...colorPrefs, primaryTeam: team })),
    paintFinish: props.paintFinish ?? materials.paintFinish,
    onPaintFinishChange:
      props.onPaintFinishChange ??
      ((paintFinish: 'matte' | 'metallic') => updateMaterials({ paintFinish })),
    blueOrder: props.blueOrder ?? colorPrefs.blueOrder,
    onBlueOrderChange:
      props.onBlueOrderChange ??
      ((blueOrder: number[]) => saveAndBroadcastColors({ ...colorPrefs, blueOrder })),
    orangeOrder: props.orangeOrder ?? colorPrefs.orangeOrder,
    onOrangeOrderChange:
      props.onOrangeOrderChange ??
      ((orangeOrder: number[]) => saveAndBroadcastColors({ ...colorPrefs, orangeOrder })),
    materials: props.materials ?? {
      ...(materials as VisualMaterialsConfig),
      boostAudio: materials.boostAudio ?? 'rush',
    },
    onUpdateMaterials: props.onUpdateMaterials ?? updateMaterials,
    selectedAnthem: props.selectedAnthem ?? selectedAnthem,
    onSelectAnthem: props.onSelectAnthem ?? setSelectedAnthem,
    anthemAvailable: props.anthemAvailable ?? true,
  } as TProps;
}
