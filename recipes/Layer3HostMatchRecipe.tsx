import React, { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import type { StandardSurfaceProps, SurfaceMeta } from '../manifest/surfaceMetaTypes';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { InlineErrorNotice } from '../primitives/InlineErrorNotice';
import { useAppStore } from '../stores/appStore';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import { useSignalingProfileStore } from '../stores/signalingProfileStore';
import {
  useScopedStore,
  useStoreSnapshotOverride,
} from '../stores/storeSnapshotScope';
import {
  generateDefaultPlayerName,
  loadStoredPlayerName,
  saveStoredPlayerName,
} from '../config/vehiclePresets';
import {
  applyConnectivityMaskToRoomCode,
  finalizeHostRoomCode,
} from '../config/roomCodeConnectivityCodec';
import {
  FORMAT_TO_GAME_MODE,
  GAME_MODE_TO_FORMAT,
} from './Layer2ManageRoomRecipe';
import { OnlineRoomIdentityFields } from './online/OnlineRoomIdentityFields';
import {
  OnlineRoomCreationProgress,
  dispatchOnlineRoomErrorNotification,
  type CreationProgressStatus,
  type CreationStepSpec,
} from './online/OnlineRoomCreationProgress';
import {
  OnlineRoomConfigSummaryCard,
  type HostMatchBotPolicy,
  type HostMatchConfig,
  type HostMatchDurationPreset,
  type HostMatchTeamFormat,
} from './online/OnlineRoomConfigSummaryCard';

export interface Layer3HostMatchStateOverride {
  roomType?: 'match' | 'warmup';
  title?: string;
  defaultEditingConfig?: boolean;
  config?: Partial<HostMatchConfig>;
  defaultConfig?: Partial<HostMatchConfig>;
  onChange?: (next: HostMatchConfig, patch: Partial<HostMatchConfig>) => void;
  onStartHost?: (config: HostMatchConfig) => void;
  progressStatus?: CreationProgressStatus;
  currentStep?: number;
  steps?: CreationStepSpec[];
  onProgressStatusChange?: (status: CreationProgressStatus) => void;
  onCurrentStepChange?: (step: number) => void;
  onRetryHost?: () => void;
  onCancelHost?: () => void;
  onNavigateGarageSync?: () => void;
  onNavigateSignalingConfig?: () => void;
  onNavigateAdvancedSettings?: () => void;
}

export interface Layer3HostMatchRecipeProps extends StandardSurfaceProps {
  developerMode?: boolean;
  roomType?: 'match' | 'warmup';
  title?: string;
  defaultEditingConfig?: boolean;
  progressStatus?: CreationProgressStatus;
  currentStep?: number;
  stateOverride?: Layer3HostMatchStateOverride;
}

export const SURFACE_META: SurfaceMeta = {
  id: 'recipe:Layer3HostMatchRecipe',
  title: 'Host Match (Create Room)',
  subtitle: 'Create & host online peer-to-peer match lobby with 5-step initialization sequence',
  icon: 'Play',
  layer: 'layer3',
  menuGroup: 'menu-layer',
  defaultSizing: {
    width: 520,
    height: 500,
    minHeight: 220,
    maxHeight: 680,
    mode: 'adaptive',
  },
  variants: [
    {
      variantId: 'idle-collapsed',
      label: 'Idle (Summary Collapsed)',
      description: 'Default compact host match form showing 3-column configuration summary.',
      entryFile: 'recipes/online/OnlineRoomConfigSummaryCard.tsx',
      storeOverrides: {
        onlineRoomStore: { defaultEditingConfig: false, progressStatus: 'idle', currentStep: 1 },
      },
    },
    {
      variantId: 'idle-expanded',
      label: 'Idle (Configuration Expanded)',
      description: 'Expanded disclosure box showing Team Format, Bot Fill Policy, Match Duration, and Advanced Settings.',
      entryFile: 'recipes/online/OnlineRoomConfigSummaryCard.tsx',
      storeOverrides: {
        onlineRoomStore: { defaultEditingConfig: true, progressStatus: 'idle', currentStep: 1 },
      },
    },
    {
      variantId: 'running-step-3',
      label: 'Step 3/5 · Registering Room Code',
      description: 'Binding room access code and key on the peer discovery relay.',
      entryFile: 'recipes/online/OnlineRoomCreationProgress.tsx',
      storeOverrides: {
        onlineRoomStore: { defaultEditingConfig: false, progressStatus: 'running', currentStep: 3 },
      },
    },
    {
      variantId: 'completed',
      label: 'Step 5/5 · Room Created',
      description: 'Local 120Hz authority initialized and match lobby spawned.',
      entryFile: 'recipes/online/OnlineRoomCreationProgress.tsx',
      storeOverrides: {
        onlineRoomStore: { defaultEditingConfig: false, progressStatus: 'completed', currentStep: 5 },
      },
    },
    {
      variantId: 'error-step-3',
      label: 'Step 3/5 · Error (Code Conflict)',
      description: 'Room code conflict or relay rejection encountered during registration.',
      entryFile: 'recipes/online/OnlineRoomCreationProgress.tsx',
      storeOverrides: {
        onlineRoomStore: { defaultEditingConfig: false, progressStatus: 'error', currentStep: 3 },
      },
    },
  ],
};

export const DEFAULT_HOST_MATCH_CONFIG: HostMatchConfig = {
  playerName: `Player${Math.floor(1000 + Math.random() * 9000)}`,
  roomCode: '',
  roomKey: '',
  teamFormat: 'doubles',
  botPolicy: 'auto-fill',
  durationPreset: '300',
  customDurationSeconds: 180,
};

/**
 * [Recipe] Layer 3 Host Match (Create & Host Online Lobby)
 */
export const Layer3HostMatchRecipe: React.FC<Layer3HostMatchRecipeProps> = React.memo(({
  isLight = false,
  roomType: propRoomType,
  title: propTitle,
  defaultEditingConfig: propDefaultEditing,
  progressStatus: propProgressStatus,
  currentStep: propCurrentStep,
  onBack: propOnBack,
  stateOverride,
}) => {
  const appState = useScopedStore('appStore', useAppStore);
  const scopedRoom = useStoreSnapshotOverride<Layer3HostMatchStateOverride>('onlineRoomStore');
  const overrides: Layer3HostMatchStateOverride = {
    ...scopedRoom,
    ...stateOverride,
  };

  const {
    goBack: storeGoBack,
    navigate,
    closeMenu,
    setMatchMode,
    setSettingsTargetTab,
    setHighlightSetting,
    onlineSession,
    setOnlineSession,
    bridge,
  } = appState;

  const hostMask = useSignalingProfileStore((s) => s.hostMask);
  const verifyRelays = useSignalingProfileStore((s) => s.verifyRelays);
  const { panels, simulateLayer3Error, setToken } = useMenuLayoutStore();
  const sizing = panels['layer3-host-match'];
  const { paddingX } = useSettingActionRowStore();

  const resolvedRoomType: 'match' | 'warmup' =
    propRoomType ??
    overrides.roomType ??
    (onlineSession?.roomType === 'warmup' ? 'warmup' : 'match');
  const title = propTitle ?? overrides.title;
  const defaultEditingConfig =
    propDefaultEditing ?? overrides.defaultEditingConfig ?? false;
  const onBack = propOnBack ?? storeGoBack;

  const [internalConfig, setInternalConfig] = useState<HostMatchConfig>(() => ({
    ...DEFAULT_HOST_MATCH_CONFIG,
    playerName:
      onlineSession?.playerName && onlineSession.playerName !== 'Host'
        ? onlineSession.playerName
        : loadStoredPlayerName(),
    roomCode: onlineSession?.roomId || '',
    roomKey: onlineSession?.password || '',
    teamFormat: GAME_MODE_TO_FORMAT[onlineSession?.gameMode || '2v2'] || 'doubles',
    botPolicy:
      onlineSession?.botFillMode === 'no_bots'
        ? 'none'
        : onlineSession?.botFillMode === 'bots_vs_humans'
        ? 'vs-ai'
        : 'auto-fill',
    durationPreset:
      onlineSession?.matchDurationSeconds === 90
        ? '90'
        : onlineSession?.matchDurationSeconds === 180
        ? '180'
        : onlineSession?.matchDurationSeconds === 300
        ? '300'
        : 'custom',
    customDurationSeconds: onlineSession?.matchDurationSeconds ?? 180,
    ...overrides.defaultConfig,
  }));

  useEffect(() => {
    let cancelled = false;
    void verifyRelays().then((probedMask) => {
      if (cancelled) return;
      setInternalConfig((prev) => ({
        ...prev,
        roomCode: prev.roomCode.trim()
          ? applyConnectivityMaskToRoomCode(prev.roomCode, probedMask)
          : '',
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [verifyRelays]);

  const resolvedConfig: HostMatchConfig = {
    ...internalConfig,
    ...overrides.config,
  };

  const updateConfig = (patch: Partial<HostMatchConfig>) => {
    const next: HostMatchConfig = {
      ...resolvedConfig,
      ...patch,
    };
    if (overrides.config === undefined) {
      setInternalConfig(next);
    }
    if (next.playerName) {
      setOnlineSession({ playerName: next.playerName });
    }
    overrides.onChange?.(next, patch);
  };

  const {
    playerName,
    roomCode,
    roomKey,
    teamFormat,
    botPolicy,
    durationPreset,
    customDurationSeconds,
  } = resolvedConfig;

  const [isEditingConfig, setIsEditingConfig] = useState<boolean>(defaultEditingConfig);
  useEffect(() => {
    setIsEditingConfig(Boolean(defaultEditingConfig));
  }, [defaultEditingConfig]);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const [internalProgressStatus, setInternalProgressStatus] =
    useState<CreationProgressStatus>('idle');
  const [internalCurrentStep, setInternalCurrentStep] = useState<number>(1);
  const controlledProgressStatus = propProgressStatus ?? overrides.progressStatus;
  const controlledCurrentStep = propCurrentStep ?? overrides.currentStep;
  const progressStatus = controlledProgressStatus ?? internalProgressStatus;
  const currentStep = controlledCurrentStep ?? internalCurrentStep;

  const setProgressStatus = (status: CreationProgressStatus) => {
    if (controlledProgressStatus === undefined) {
      setInternalProgressStatus(status);
    }
    overrides.onProgressStatusChange?.(status);
  };

  const setCurrentStep = (stepOrUpdater: number | ((prev: number) => number)) => {
    const nextStep =
      typeof stepOrUpdater === 'function' ? stepOrUpdater(currentStep) : stepOrUpdater;
    if (controlledCurrentStep === undefined) {
      setInternalCurrentStep(nextStep);
    }
    overrides.onCurrentStepChange?.(nextStep);
  };

  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearStepTimer = () => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  };

  useEffect(() => () => clearStepTimer(), []);

  const resolvedDurationSeconds =
    durationPreset === 'custom' ? customDurationSeconds : Number(durationPreset);

  const commitHostLaunch = (cleanCode: string) => {
    const cleanName = playerName.trim() || generateDefaultPlayerName();
    saveStoredPlayerName(cleanName);
    const botFillMode =
      botPolicy === 'none'
        ? 'no_bots'
        : botPolicy === 'vs-ai'
        ? 'bots_vs_humans'
        : botPolicy === 'custom'
        ? 'custom'
        : 'auto_fill';
    const gameMode = FORMAT_TO_GAME_MODE[teamFormat] || '2v2';
    const finalConfig: HostMatchConfig = {
      playerName: cleanName,
      roomCode: cleanCode,
      roomKey,
      teamFormat,
      botPolicy,
      durationPreset,
      customDurationSeconds: resolvedDurationSeconds,
    };

    setOnlineSession({
      playerName: cleanName,
      roomId: cleanCode,
      password: roomKey || undefined,
      roomType: resolvedRoomType,
      gameMode,
      botFillMode,
      matchDurationSeconds: resolvedDurationSeconds,
    });

    if (overrides.onStartHost) {
      overrides.onStartHost(finalConfig);
      return;
    }

    if (bridge.onHostOnlineWarmup) {
      void bridge
        .onHostOnlineWarmup({
          roomId: cleanCode,
          password: roomKey || undefined,
          playerName: cleanName,
          roomType: resolvedRoomType,
          gameMode,
          botFillMode,
          durationSeconds: resolvedDurationSeconds,
          lobbyMode: resolvedRoomType === 'match',
        })
        .then((ok) => {
          if (ok) {
            setMatchMode('online-warmup');
            closeMenu();
          } else {
            setProgressStatus('error');
          }
        });
    }
  };

  const startStepSequence = (willFail: boolean) => {
    clearStepTimer();
    const cleanCode = finalizeHostRoomCode(roomCode, hostMask);
    if (cleanCode !== roomCode) {
      updateConfig({ roomCode: cleanCode });
    }

    if (controlledProgressStatus !== undefined) {
      commitHostLaunch(cleanCode);
      return;
    }

    setToken('simulateLayer3Error', false);
    setInternalCurrentStep(1);
    setProgressStatus('running');

    stepTimerRef.current = setInterval(() => {
      setInternalCurrentStep((prev) => {
        const next = prev + 1;
        overrides.onCurrentStepChange?.(next);
        if (willFail && next === 3) {
          clearStepTimer();
          setProgressStatus('error');
          setToken('simulateLayer3Error', true);
          dispatchOnlineRoomErrorNotification();
          return 3;
        }
        if (next >= 5) {
          clearStepTimer();
          setProgressStatus('completed');
          commitHostLaunch(cleanCode);
          return 5;
        }
        return next;
      });
    }, 520);
  };

  const handleNavigateGarageSync =
    overrides.onNavigateGarageSync ?? (() => navigate('garage'));
  const handleNavigateSignalingConfig =
    overrides.onNavigateSignalingConfig ??
    (() => {
      setSettingsTargetTab('advanced');
      setHighlightSetting('signaling-credential-bundle');
      navigate('settings');
    });
  const handleNavigateAdvancedSettings =
    overrides.onNavigateAdvancedSettings ?? (() => navigate('exp-multi-bots'));

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full select-none">
      <PanelHeader
        title={title ?? (resolvedRoomType === 'warmup' ? 'HOST ONLINE WARMUP' : 'HOST MATCH')}
        onBack={onBack}
        isLight={isLight}
      />

      <PanelContent scrollable={true} className="flex flex-col justify-between gap-3">
        <div data-layout="host-match-list" className="flex flex-col w-full gap-3">
          <OnlineRoomIdentityFields
            identity={{
              playerName,
              onPlayerNameChange: (val) => updateConfig({ playerName: val }),
              roomCode,
              onRoomCodeChange: (val) => updateConfig({ roomCode: val }),
              roomKey,
              onRoomKeyChange: (val) => updateConfig({ roomKey: val }),
            }}
            showRandomize={true}
            onNotYouClick={handleNavigateGarageSync}
            onSignalingConfigClick={handleNavigateSignalingConfig}
            onHoverDesc={setHoveredDesc}
            isLight={isLight}
          />

          <div
            style={{
              marginLeft: `${Math.max(0, paddingX)}px`,
              marginRight: `${Math.max(0, paddingX)}px`,
            }}
            data-ui-element="host-match-current-config-box"
          >
            <OnlineRoomConfigSummaryCard
              title="Current Configuration"
              teamFormat={teamFormat}
              botPolicy={botPolicy}
              durationPreset={durationPreset}
              customDurationSeconds={customDurationSeconds}
              handlers={{
                onChangeTeamFormat: (val) => updateConfig({ teamFormat: val }),
                onChangeBotPolicy: (val) => updateConfig({ botPolicy: val }),
                onChangeDurationPreset: (val) => updateConfig({ durationPreset: val }),
                onChangeCustomDurationSeconds: (val) =>
                  updateConfig({ customDurationSeconds: val }),
              }}
              editor={{
                editable: true,
                isEditing: isEditingConfig,
                onToggleEditing: () => setIsEditingConfig((prev) => !prev),
                onNavigateAdvancedSettings: handleNavigateAdvancedSettings,
              }}
              onHoverDesc={setHoveredDesc}
              isLight={isLight}
            />
          </div>
        </div>

        <div
          style={{
            paddingLeft: `${Math.max(0, paddingX)}px`,
            paddingRight: `${Math.max(0, paddingX)}px`,
          }}
          className="flex flex-col gap-2 shrink-0 pt-1"
        >
          {progressStatus !== 'idle' && (
            <OnlineRoomCreationProgress
              currentStep={currentStep}
              totalSteps={overrides.steps?.length ?? 5}
              steps={overrides.steps}
              status={progressStatus}
              onRetry={() => {
                overrides.onRetryHost?.();
                startStepSequence(false);
              }}
              onCancel={() => {
                clearStepTimer();
                setProgressStatus('idle');
                setCurrentStep(1);
                setToken('simulateLayer3Error', false);
                bridge.onLeaveOnlineServer?.();
                overrides.onCancelHost?.();
              }}
              isLight={isLight}
            />
          )}

          {simulateLayer3Error && <InlineErrorNotice isLight={isLight} />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => startStepSequence(simulateLayer3Error)}
              onMouseEnter={() =>
                setHoveredDesc(
                  'Create & Host: Launch the 5-step room initialization sequence (Authority -> Signaling -> Room Code -> ICE -> Lobby).'
                )
              }
              onMouseLeave={() => setHoveredDesc(null)}
              className="flex-1 py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>
                {progressStatus === 'running'
                  ? `Creating Room (${currentStep}/5)...`
                  : progressStatus === 'completed'
                  ? 'Room Created · Restart Sequence'
                  : 'Create & Host'}
              </span>
            </button>
          </div>
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Configure player identity, room code & key, and match configuration."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
});

Layer3HostMatchRecipe.displayName = 'Layer3HostMatchRecipe';
