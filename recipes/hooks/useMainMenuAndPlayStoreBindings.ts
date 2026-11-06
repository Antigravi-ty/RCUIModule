import React, { useState } from 'react';
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
import type { PanelSizingConfig } from '../../tokens/menuLayoutTokens';
import type {
  MainMenuStyleParams,
  MainMenuStyleVariant,
} from '../../stores/mainMenuStyleStore';
import type {
  PlayCardStyleParams,
  PlayCardStyleVariant,
} from '../../stores/playCardStyleStore';
import type {
  CanonicalLayer1ContextVariation,
  Layer1ContextVariation,
} from '../layer1MenuContextSpecs';

export type TouchInputAgentOption = 'none' | 'necto' | 'nexto';

export interface Layer1MainMenuRecipeProps {
  isLight?: boolean;
  showAdditionalPreviews?: boolean;
  /** Legacy matchMode prop OR full Layer1ContextVariation */
  matchMode?: Layer1ContextVariation | 'online-warmup' | 'static-training-pack';
  /** Explicit context variation (overrides matchMode if provided) */
  contextVariation?: Layer1ContextVariation;
  /** Alias for contextVariation */
  contextMode?: Layer1ContextVariation;
  /** Optional developer Touch Input Agent banner (?touch=1 / ?touch=2) */
  touchMode?: boolean;
  touchHeadlessMode?: boolean;
  /** Controlled Touch Input Agent takeover model ('none' | 'necto' | 'nexto') */
  touchInputAgent?: TouchInputAgentOption;
  /** Initial uncontrolled Touch Input Agent takeover model */
  defaultTouchInputAgent?: TouchInputAgentOption;
  /** Callback fired when Touch Input Agent model changes */
  onTouchInputAgentChange?: (agent: TouchInputAgentOption) => void;
  /** Background power saving mode ('extreme' | '15' | '30' | 'disable' | 'freeze' | 'match') */
  menuPowerSave?: 'extreme' | '15' | '30' | 'disable' | 'freeze' | 'match';
  /** Legacy boolean fallback for backgroundRenderPaused */
  backgroundRenderPaused?: boolean;
  onResume?: () => void;
  onRestartMatch?: () => void;
  onReturnToFreeplay?: () => void;
  onNavigatePlay?: () => void;
  onNavigateGarage?: () => void;
  onNavigateSettings?: (targetTab?: string) => void;
  onNavigatePreviews?: () => void;
  onNavigateManageRoom?: () => void;
  onNavigateRoomControl?: () => void;
  onNavigateTrainingConfig?: () => void;
  onNavigateKickoffConfig?: () => void;
  onNavigateStaticTrainingPack?: () => void;
  onNavigateExpMultiBots?: () => void;
  onNavigateExpMultiBotsConfig?: () => void;
  onOpenFloatingWindow?: (id: string) => void;
  onLeaveRoom?: () => void;
  onExitEditMode?: () => void;
  /** Optional extra bottom action (e.g. "Exit Edit Mode" when EdgeInspectorDrawer is active) */
  extraBottomAction?:
    | {
        title: string;
        subtitle?: string;
        icon?: React.ReactNode;
        variant?: 'primary' | 'secondary' | 'danger';
        onClick: () => void;
      }
    | React.ReactNode;
  /** Optional explicit sizing override; defaults to menuLayoutStore.panels['layer1-main'] */
  sizing?: PanelSizingConfig;
  /** Optional explicit row style variant override (decoupled from store when provided) */
  styleVariant?: MainMenuStyleVariant;
  /** Optional explicit row & shell style parameters override (decoupled from store when provided) */
  styleParams?: Partial<MainMenuStyleParams>;
  className?: string;
}

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

export interface Layer2GarageRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  initialTab?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  // Car Tab controlled props
  selectedCar?: string;
  defaultSelectedCar?: string;
  onSelectCar?: (carId: string) => void;
  // Paint Tab controlled props
  primaryTeam?: 'blue' | 'orange';
  defaultPrimaryTeam?: 'blue' | 'orange';
  onPrimaryTeamChange?: (team: 'blue' | 'orange') => void;
  paintFinish?: 'matte' | 'metallic';
  defaultPaintFinish?: 'matte' | 'metallic';
  onPaintFinishChange?: (finish: 'matte' | 'metallic') => void;
  blueOrder?: number[];
  defaultBlueOrder?: number[];
  onBlueOrderChange?: (next: number[]) => void;
  orangeOrder?: number[];
  defaultOrangeOrder?: number[];
  onOrangeOrderChange?: (next: number[]) => void;
  // Loadout (Materials) Tab controlled props
  materials?: VisualMaterialsConfig;
  onUpdateMaterials?: (partial: Partial<VisualMaterialsConfig>) => void;
  // Anthem Tab controlled props
  selectedAnthem?: string;
  defaultSelectedAnthem?: string;
  onSelectAnthem?: (anthemId: string) => void;
  /** Whether Anthem audio assets are available (default false -> renders Under Development placeholder) */
  anthemAvailable?: boolean;
}

export function useLayer1MainMenuStoreBinding(
  rawProps: Layer1MainMenuRecipeProps
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
  const replayViewerHasLoaded = useReplayViewerStore(
    (s) => Boolean((s.loadedFileName && s.totalFrames > 0) || s.viewerState !== 'idle')
  );
  const isNameTagTunerArenaActive = useNameTagTunerStore((s) => s.isTunerArenaActive);
  const rewinderState = useRewinderStore((s) => s.rewinderState);
  const { metrics: netDiagMetrics } = useNetworkDiagnosticsData();

  const activeDirectorCtrl = getActiveReplayTimelineController();
  const isDirectorPreviewActive = Boolean(
    activeDirectorCtrl?.sessionState?.isActive &&
      (activeDirectorCtrl?.sessionState?.isImportedPreview || activeDirectorCtrl?.sessionState?.isPersistent)
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
    derivedVariation = rawProps.extraBottomAction
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
    rawProps.onReturnToFreeplay ??
    (() => {
      useAppStore.getState().setMatchMode('freeplay');
      closeMenu();
      bridge.onReturnToFreeplay?.();
    });

  const resolvedExtraBottomAction =
    rawProps.extraBottomAction ??
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
      rawProps.contextVariation ?? rawProps.contextMode ?? derivedVariation,
    extraBottomAction: resolvedExtraBottomAction,
    touchMode: rawProps.touchMode ?? touchMode,
    touchHeadlessMode: rawProps.touchHeadlessMode ?? touchHeadlessMode,
    touchInputAgent: rawProps.touchInputAgent ?? touchInputAgent,
    onTouchInputAgentChange: rawProps.onTouchInputAgentChange ?? setTouchInputAgent,
    menuPowerSave: rawProps.menuPowerSave ?? menuPowerSave,
    onResume: rawProps.onResume ?? closeMenu,
    onReturnToFreeplay: handleReturnToFreeplay,
    onNavigatePlay: rawProps.onNavigatePlay ?? (() => navigate('play')),
    onNavigateGarage: rawProps.onNavigateGarage ?? (() => navigate('garage')),
    onNavigateSettings:
      rawProps.onNavigateSettings ??
      ((tab?: string) => {
        if (tab === 'display') {
          useAppStore.getState().setHighlightSetting('menu-power-save');
        }
        navigate('settings');
      }),
    onNavigateManageRoom:
      rawProps.onNavigateManageRoom ?? (() => navigate('manage-room')),
    onNavigateExpMultiBotsConfig:
      rawProps.onNavigateExpMultiBotsConfig ??
      (() => navigate('exp-multi-bots')),
  };
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

export function useLayer2GarageStoreBinding(
  rawProps: Layer2GarageRecipeProps
): Layer2GarageRecipeProps {
  const goBack = useAppStore((s) => s.goBack);
  const activeCar = useAppStore((s) => s.activeCar);
  const setActiveCar = useAppStore((s) => s.setActiveCar);
  const materials = useAppStore((s) => s.materials);
  const updateMaterials = useAppStore((s) => s.updateMaterials);
  const selectedAnthem = useSpatialAudioStore((s) => s.selectedAnthem);
  const setSelectedAnthem = useSpatialAudioStore((s) => s.setSelectedAnthem);
  const stopPreviewAnthem = useSpatialAudioStore((s) => s.stopPreviewAnthem);
  const colorPrefs = useAppStore((s) => s.colorPrefs);
  const setColorPrefs = useAppStore((s) => s.setColorPrefs);

  const saveAndBroadcastColors = (nextPrefs: StoredColorPrefs) => {
    setColorPrefs(nextPrefs);
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
      rawProps.onBack ??
      (() => {
        stopPreviewAnthem();
        goBack();
      }),
    onTabChange:
      rawProps.onTabChange ??
      ((tab: string) => {
        if (tab !== 'anthem') {
          stopPreviewAnthem();
        }
      }),
    selectedCar: rawProps.selectedCar ?? activeCar,
    onSelectCar: rawProps.onSelectCar ?? handleSelectCar,
    primaryTeam: rawProps.primaryTeam ?? colorPrefs.primaryTeam,
    onPrimaryTeamChange:
      rawProps.onPrimaryTeamChange ??
      ((team: 'blue' | 'orange') => saveAndBroadcastColors({ ...colorPrefs, primaryTeam: team })),
    paintFinish: rawProps.paintFinish ?? materials.paintFinish,
    onPaintFinishChange:
      rawProps.onPaintFinishChange ??
      ((paintFinish: 'matte' | 'metallic') => updateMaterials({ paintFinish })),
    blueOrder: rawProps.blueOrder ?? colorPrefs.blueOrder,
    onBlueOrderChange:
      rawProps.onBlueOrderChange ??
      ((blueOrder: number[]) => saveAndBroadcastColors({ ...colorPrefs, blueOrder })),
    orangeOrder: rawProps.orangeOrder ?? colorPrefs.orangeOrder,
    onOrangeOrderChange:
      rawProps.onOrangeOrderChange ??
      ((orangeOrder: number[]) => saveAndBroadcastColors({ ...colorPrefs, orangeOrder })),
    materials: rawProps.materials ?? {
      ...(materials as VisualMaterialsConfig),
      boostAudio: materials.boostAudio ?? 'rush',
    },
    onUpdateMaterials: rawProps.onUpdateMaterials ?? updateMaterials,
    selectedAnthem: rawProps.selectedAnthem ?? selectedAnthem,
    onSelectAnthem: rawProps.onSelectAnthem ?? setSelectedAnthem,
    anthemAvailable: rawProps.anthemAvailable ?? true,
  };
}
