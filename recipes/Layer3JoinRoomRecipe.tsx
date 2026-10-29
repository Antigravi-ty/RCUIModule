import React, { useState, useEffect, useRef } from 'react';
import { useLayer3JoinRoomStoreBinding } from './hooks/useOnlineRecipesStoreBindings';
import { Eye, Wifi } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { InlineErrorNotice } from '../primitives/InlineErrorNotice';
import { SettingToggleRow } from '../compounds/SettingToggleRow';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import { dispatchOnlineRoomErrorNotification } from './Layer3OnlineWarmupRecipe';
import { OnlineRoomIdentityFields } from './online/OnlineRoomIdentityFields';
import {
  OnlineRoomCreationProgress,
  type CreationProgressStatus,
  type CreationStepSpec,
} from './online/OnlineRoomCreationProgress';

export const DEFAULT_JOIN_ROOM_STEPS: CreationStepSpec[] = [
  {
    step: 1,
    stageTitle: 'Validating Room Code & Key',
    description: 'Verifying room code syntax and preparing client authentication payload...',
    errorTitle: 'Invalid Room Code',
    errorDescription: 'Room code is empty or malformed. Please enter a valid room code.',
  },
  {
    step: 2,
    stageTitle: 'Connecting Signaling Relay',
    description: 'Establishing WebSocket handshake with signaling server (wss://relay.carsoccer.dev)...',
    errorTitle: 'Signaling Handshake Timed Out',
    errorDescription: 'Could not reach wss://relay.carsoccer.dev/signaling within 10s (ERR_CONNECTION_TIMED_OUT).',
  },
  {
    step: 3,
    stageTitle: 'Resolving Host Room Session',
    description: 'Looking up active host session and verifying room access key...',
    errorTitle: 'Room Not Found or Key Mismatch',
    errorDescription: 'No active room matched this code, or the room access key was rejected.',
  },
  {
    step: 4,
    stageTitle: 'Negotiating WebRTC ICE & DataChannel',
    description: 'Exchanging SDP offers, probing STUN/TURN candidates, and opening P2P channels...',
    errorTitle: 'ICE / NAT Traversal Failed',
    errorDescription: 'Could not establish peer-to-peer or TURN relay transport with the host.',
  },
  {
    step: 5,
    stageTitle: 'Synchronizing Arena & Joining Lobby',
    description: 'Receiving initial match snapshot, registering spectating relay preference, and entering lobby...',
    errorTitle: 'Lobby Sync Aborted',
    errorDescription: 'Host closed the lobby before initial state synchronization completed.',
  },
];

export interface JoinRoomConfig {
  playerName: string;
  roomCode: string;
  roomKey: string;
  allowSpectating: boolean;
}

export const DEFAULT_JOIN_ROOM_CONFIG: JoinRoomConfig = {
  playerName: `Player${Math.floor(1000 + Math.random() * 9000)}`,
  roomCode: String(Math.floor(1000 + Math.random() * 9000)),
  roomKey: '',
  allowSpectating: true,
};

export interface Layer3JoinRoomRecipeProps {
  isLight?: boolean;
  /** Controlled join room configuration */
  config?: Partial<JoinRoomConfig>;
  /** Alias for controlled config */
  settings?: Partial<JoinRoomConfig>;
  /** Initial join room configuration for uncontrolled mode */
  defaultConfig?: Partial<JoinRoomConfig>;
  /** Callback fired when any join room field changes */
  onChange?: (next: JoinRoomConfig, patch: Partial<JoinRoomConfig>) => void;
  /** Alias for onChange */
  onConfigChange?: (next: JoinRoomConfig, patch: Partial<JoinRoomConfig>) => void;
  defaultPlayerName?: string;
  defaultRoomCode?: string;
  defaultRoomKey?: string;
  defaultAllowSpectating?: boolean;
  onJoinRoom?: (config: JoinRoomConfig) => void;
  /** Controlled 5-step connection progress status */
  progressStatus?: CreationProgressStatus;
  /** Controlled current step (1..5) */
  currentStep?: number;
  /** Custom step specifications */
  steps?: CreationStepSpec[];
  onProgressStatusChange?: (status: CreationProgressStatus) => void;
  onCurrentStepChange?: (step: number) => void;
  onRetryJoin?: () => void;
  onCancelJoin?: () => void;
  onNavigateGarageSync?: () => void;
  onBack?: () => void;
}

/**
 * [Recipe] Layer 3 Join Room (Connect to Peer Lobby)
 * Simplified layout:
 * 1. Reuses top 2 rows from Host Match (`Player Name:` + `Not you?`, 50/50 `Room Code` + `Lock + Key` with `None` placeholder)
 * 2. `Allow Spectating` toggle (default: enabled / true) to support Daisy Chain Spectating relay and reduce Host upload load
 * 3. 5-step connection progress bar (`OnlineRoomCreationProgress`) when clicking `Join Room`
 * 4. Primary bottom action button: `Join Room`
 */
export const Layer3JoinRoomRecipe: React.FC<Layer3JoinRoomRecipeProps> = React.memo((rawProps) => {
  const {
  isLight = false,
  config: controlledConfigProp,
  settings: controlledSettingsProp,
  defaultConfig,
  onChange,
  onConfigChange,
  defaultPlayerName = DEFAULT_JOIN_ROOM_CONFIG.playerName,
  defaultRoomCode = DEFAULT_JOIN_ROOM_CONFIG.roomCode,
  defaultRoomKey = '',
  defaultAllowSpectating = true,
  onJoinRoom,
  progressStatus: controlledProgressStatus,
  currentStep: controlledCurrentStep,
  steps = DEFAULT_JOIN_ROOM_STEPS,
  onProgressStatusChange,
  onCurrentStepChange,
  onRetryJoin,
  onCancelJoin,
  onNavigateGarageSync,
  onBack = () => {},
} = useLayer3JoinRoomStoreBinding(rawProps);
  const { panels, simulateLayer3Error, setToken } = useMenuLayoutStore();
  const sizing = panels['layer3-join-room'];
  const { rowGap, paddingX } = useSettingActionRowStore();

  const [internalConfig, setInternalConfig] = useState<JoinRoomConfig>({
    playerName: defaultConfig?.playerName ?? defaultPlayerName,
    roomCode: defaultConfig?.roomCode ?? defaultRoomCode,
    roomKey: defaultConfig?.roomKey ?? defaultRoomKey,
    allowSpectating: defaultConfig?.allowSpectating ?? defaultAllowSpectating,
  });

  const controlledSource = controlledConfigProp ?? controlledSettingsProp;
  const resolvedConfig: JoinRoomConfig = {
    ...internalConfig,
    ...controlledSource,
  };

  const updateConfig = (patch: Partial<JoinRoomConfig>) => {
    const next: JoinRoomConfig = {
      ...resolvedConfig,
      ...patch,
    };
    if (controlledSource === undefined) {
      setInternalConfig(next);
    }
    onChange?.(next, patch);
    onConfigChange?.(next, patch);
  };

  const { playerName, roomCode, roomKey, allowSpectating } = resolvedConfig;
  const setPlayerName = (val: string) => updateConfig({ playerName: val });
  const setRoomCode = (val: string) => updateConfig({ roomCode: val });
  const setRoomKey = (val: string) => updateConfig({ roomKey: val });
  const setAllowSpectating = (val: boolean) => updateConfig({ allowSpectating: val });

  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  // 5-Step Connection Progress State
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

  const startJoinSequence = (willFail: boolean) => {
    clearStepTimer();
    const cleanCode = roomCode.trim();
    if (!cleanCode) {
      setCurrentStep(1);
      setProgressStatus('error');
      setToken('simulateLayer3Error', true);
      dispatchOnlineRoomErrorNotification();
      return;
    }

    if (controlledProgressStatus !== undefined) {
      onJoinRoom?.({
        playerName: playerName.trim() || DEFAULT_JOIN_ROOM_CONFIG.playerName,
        roomCode: cleanCode,
        roomKey,
        allowSpectating,
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
        if (next >= (steps?.length ?? 5)) {
          clearStepTimer();
          setProgressStatus('completed');
          onJoinRoom?.({
            playerName: playerName.trim() || DEFAULT_JOIN_ROOM_CONFIG.playerName,
            roomCode: cleanCode,
            roomKey,
            allowSpectating,
          });
          return steps?.length ?? 5;
        }
        return next;
      });
    }, 520);
  };

  const handleJoin = () => {
    startJoinSequence(simulateLayer3Error);
  };

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full select-none">
      <PanelHeader
        title="JOIN ROOM"
        onBack={onBack}
        isLight={isLight}
      />

      <PanelContent scrollable={true} className="flex flex-col justify-between gap-4">
        <div
          className="flex flex-col w-full"
          style={{ gap: `${Math.max(8, rowGap)}px` }}
        >
          <OnlineRoomIdentityFields
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
            roomCode={roomCode}
            onRoomCodeChange={setRoomCode}
            roomKey={roomKey}
            onRoomKeyChange={setRoomKey}
            showRandomize={false}
            onNotYouClick={onNavigateGarageSync}
            onHoverDesc={setHoveredDesc}
            isLight={isLight}
          />

          <SettingToggleRow
            icon={Eye}
            iconColor="text-emerald-400"
            title="Allow Spectating"
            description="Stay connected to signaling relay so spectators can daisy-chain through you and reduce host upload load."
            checked={allowSpectating}
            onChange={setAllowSpectating}
            bordered={false}
            showDescription={false}
            hoverDescription="Allow Spectating: Default ON. Keeps a lightweight signaling session so other spectators can daisy-chain through your client, saving Host P2P upload bandwidth."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />
        </div>

        <div
          style={{
            paddingLeft: `${Math.max(0, paddingX)}px`,
            paddingRight: `${Math.max(0, paddingX)}px`,
          }}
          className="flex flex-col gap-2 shrink-0"
        >
          {progressStatus !== 'idle' && (
            <OnlineRoomCreationProgress
              currentStep={currentStep}
              totalSteps={steps?.length ?? 5}
              steps={steps}
              status={progressStatus}
              onRetry={() => {
                onRetryJoin?.();
                startJoinSequence(false);
              }}
              onCancel={() => {
                clearStepTimer();
                setProgressStatus('idle');
                setCurrentStep(1);
                setToken('simulateLayer3Error', false);
                onCancelJoin?.();
              }}
              isLight={isLight}
            />
          )}

          {simulateLayer3Error && <InlineErrorNotice isLight={isLight} />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleJoin}
              onMouseEnter={() =>
                setHoveredDesc('Join Room: Connect to the target peer-to-peer room using the room code and key.')
              }
              onMouseLeave={() => setHoveredDesc(null)}
              className="flex-1 py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Wifi className="h-3.5 w-3.5" />
              <span>
                {progressStatus === 'running'
                  ? `Joining Room (${currentStep}/${steps?.length ?? 5})...`
                  : progressStatus === 'completed'
                  ? 'Connected · Reconnect'
                  : 'Join Room'}
              </span>
            </button>
          </div>
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Enter player name, room code, optional key, and spectating relay preference to join."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
});

Layer3JoinRoomRecipe.displayName = 'Layer3JoinRoomRecipe';
