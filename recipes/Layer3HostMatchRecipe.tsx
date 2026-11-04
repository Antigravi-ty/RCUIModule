import React, { useState, useEffect, useRef } from 'react';
import {
  useLayer3HostMatchStoreBinding,
  type Layer3HostMatchRecipeProps,
  type Layer3HostMatchStateOverride,
} from './hooks/useLayer3OnlineRoomSetupBindings';
import { Play } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { InlineErrorNotice } from '../primitives/InlineErrorNotice';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import { useSignalingProfileStore } from '../stores/signalingProfileStore';
import { finalizeHostRoomCode } from '../config/roomCodeConnectivityCodec';
import { OnlineRoomIdentityFields } from './online/OnlineRoomIdentityFields';
import {
  OnlineRoomCreationProgress,
  dispatchOnlineRoomErrorNotification,
  type CreationProgressStatus,
} from './online/OnlineRoomCreationProgress';
import {
  OnlineRoomConfigSummaryCard,
  type HostMatchBotPolicy,
  type HostMatchConfig,
  type HostMatchDurationPreset,
  type HostMatchTeamFormat,
} from './online/OnlineRoomConfigSummaryCard';

export type { Layer3HostMatchRecipeProps, Layer3HostMatchStateOverride };

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
 * Updated layout:
 * 1. Player Name: + "Not you?" (jumps to Garage Sync)
 * 2. Room Code (left 50% + Randomize) | Lock + Key (right 50%, gray "None" placeholder)
 * 3. Current Configuration box (OnlineRoomConfigSummaryCard):
 *    - Header: "Current Configuration" + disclosure toggle
 *    - Summary row: Format | Bot Policy | Duration
 *    - Expanded Edit drawer: Team Format, Bot Fill Policy, Match Duration, Advanced Settings
 * 4. 5-step creation progress bar on "Create & Host"
 */
export const Layer3HostMatchRecipe: React.FC<Layer3HostMatchRecipeProps> = React.memo((rawProps) => {
  const {
    isLight = false,
    roomType = 'match',
    title,
    defaultEditingConfig = false,
    config: controlledConfigProp,
    defaultConfig,
    onChange,
    onBack = () => {},
    onNavigateGarageSync,
    onNavigateSignalingConfig,
    onNavigateAdvancedSettings,
    onStartHost,
    onCancelHost,
    onRetryHost,
    progressStatus: controlledProgressStatus,
    currentStep: controlledCurrentStep,
    onProgressStatusChange,
    onCurrentStepChange,
    steps,
  } = useLayer3HostMatchStoreBinding(rawProps);
  const { panels, simulateLayer3Error, setToken } = useMenuLayoutStore();
  const sizing = panels['layer3-host-match'];
  const { paddingX } = useSettingActionRowStore();

  const [internalConfig, setInternalConfig] = useState<HostMatchConfig>({
    ...DEFAULT_HOST_MATCH_CONFIG,
    ...defaultConfig,
  });

  const resolvedConfig: HostMatchConfig = {
    ...internalConfig,
    ...controlledConfigProp,
  };

  const updateConfig = (patch: Partial<HostMatchConfig>) => {
    const next: HostMatchConfig = {
      ...resolvedConfig,
      ...patch,
    };
    if (controlledConfigProp === undefined) {
      setInternalConfig(next);
    }
    onChange?.(next, patch);
  };

  const { playerName, roomCode, roomKey, teamFormat, botPolicy, durationPreset, customDurationSeconds } = resolvedConfig;

  const setPlayerName = (val: string) => updateConfig({ playerName: val });
  const setRoomCode = (val: string) => updateConfig({ roomCode: val });
  const setRoomKey = (val: string) => updateConfig({ roomKey: val });
  const setTeamFormat = (val: HostMatchTeamFormat) => updateConfig({ teamFormat: val });
  const setBotPolicy = (val: HostMatchBotPolicy) => updateConfig({ botPolicy: val });
  const setDurationPreset = (val: HostMatchDurationPreset) => updateConfig({ durationPreset: val });
  const setCustomDurationSeconds = (val: number) => updateConfig({ customDurationSeconds: val });

  const [isEditingConfig, setIsEditingConfig] = useState<boolean>(defaultEditingConfig);
  useEffect(() => {
    setIsEditingConfig(Boolean(defaultEditingConfig));
  }, [defaultEditingConfig]);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  // 5-Step Creation Progress State
  const [internalProgressStatus, setInternalProgressStatus] = useState<CreationProgressStatus>('idle');
  const [internalCurrentStep, setInternalCurrentStep] = useState<number>(1);
  const progressStatus = controlledProgressStatus ?? internalProgressStatus;
  const currentStep = controlledCurrentStep ?? internalCurrentStep;

  const setProgressStatus = (status: CreationProgressStatus) => {
    if (controlledProgressStatus === undefined) {
      setInternalProgressStatus(status);
    }
    onProgressStatusChange?.(status);
  };

  const setCurrentStep = (stepOrUpdater: number | ((prev: number) => number)) => {
    const nextStep =
      typeof stepOrUpdater === 'function' ? stepOrUpdater(currentStep) : stepOrUpdater;
    if (controlledCurrentStep === undefined) {
      setInternalCurrentStep(nextStep);
    }
    onCurrentStepChange?.(nextStep);
  };

  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearStepTimer = () => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearStepTimer();
  }, []);

  const hostMask = useSignalingProfileStore((s) => s.hostMask);
  const resolvedDurationSeconds =
    durationPreset === 'custom' ? customDurationSeconds : Number(durationPreset);

  const startStepSequence = (willFail: boolean) => {
    clearStepTimer();
    const cleanCode = finalizeHostRoomCode(roomCode, hostMask);
    if (cleanCode !== roomCode) {
      setRoomCode(cleanCode);
    }

    if (controlledProgressStatus !== undefined) {
      onStartHost?.({
        playerName: playerName.trim() || DEFAULT_HOST_MATCH_CONFIG.playerName,
        roomCode: cleanCode,
        roomKey,
        teamFormat,
        botPolicy,
        durationPreset,
        customDurationSeconds: resolvedDurationSeconds,
      });
      return;
    }

    setToken('simulateLayer3Error', false);
    setInternalCurrentStep(1);
    setProgressStatus('running');

    stepTimerRef.current = setInterval(() => {
      setInternalCurrentStep((prev) => {
        const next = prev + 1;
        onCurrentStepChange?.(next);
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
          onStartHost?.({
            playerName: playerName.trim() || DEFAULT_HOST_MATCH_CONFIG.playerName,
            roomCode: cleanCode, roomKey, teamFormat, botPolicy, durationPreset,
            customDurationSeconds: resolvedDurationSeconds,
          });
          return 5;
        }
        return next;
      });
    }, 520);
  };

  const handleCreateHost = () => {
    startStepSequence(simulateLayer3Error);
  };

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full select-none">
      <PanelHeader
        title={title ?? (roomType === 'warmup' ? 'HOST ONLINE WARMUP' : 'HOST MATCH')}
        onBack={onBack}
        isLight={isLight}
      />

      <PanelContent scrollable={true} className="flex flex-col justify-between gap-3">
        <div
          data-layout="host-match-list"
          className="flex flex-col w-full gap-3"
        >
          {/* 1 & 2. Player Name + Room Code / Key */}
          <OnlineRoomIdentityFields
            identity={{
              playerName,
              onPlayerNameChange: setPlayerName,
              roomCode,
              onRoomCodeChange: setRoomCode,
              roomKey,
              onRoomKeyChange: setRoomKey,
            }}
            showRandomize={true}
            onNotYouClick={onNavigateGarageSync}
            onSignalingConfigClick={onNavigateSignalingConfig}
            onHoverDesc={setHoveredDesc}
            isLight={isLight}
          />

          {/* 3. Current Configuration Disclosure Box */}
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
              onChangeTeamFormat={setTeamFormat}
              botPolicy={botPolicy}
              onChangeBotPolicy={setBotPolicy}
              durationPreset={durationPreset}
              onChangeDurationPreset={setDurationPreset}
              customDurationSeconds={customDurationSeconds}
              onChangeCustomDurationSeconds={setCustomDurationSeconds}
              editable={true}
              isEditing={isEditingConfig}
              onToggleEditing={() => setIsEditingConfig((prev) => !prev)}
              onNavigateAdvancedSettings={onNavigateAdvancedSettings}
              onHoverDesc={setHoveredDesc}
              isLight={isLight}
            />
          </div>
        </div>

        {/* Bottom Primary CTA + 5-Step Creation Progress + Optional Error Notice */}
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
              totalSteps={steps?.length ?? 5}
              steps={steps}
              status={progressStatus}
              onRetry={() => {
                onRetryHost?.();
                startStepSequence(false);
              }}
              onCancel={() => {
                clearStepTimer();
                setProgressStatus('idle');
                setCurrentStep(1);
                setToken('simulateLayer3Error', false);
                onCancelHost?.();
              }}
              isLight={isLight}
            />
          )}

          {simulateLayer3Error && <InlineErrorNotice isLight={isLight} />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateHost}
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
