import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { Ghost, Play } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { InlineErrorNotice } from '../primitives/InlineErrorNotice';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import { dispatchOnlineRoomErrorNotification } from './Layer3OnlineWarmupRecipe';
import { OnlineRoomIdentityFields } from './online/OnlineRoomIdentityFields';
import {
  OnlineRoomCreationProgress,
  type CreationProgressStatus,
} from './online/OnlineRoomCreationProgress';

export type HostTrainingGhostMode = 'automatically-enable' | 'manual';

export interface HostTrainingConfig {
  playerName: string;
  roomCode: string;
  roomKey: string;
  ghostMode: HostTrainingGhostMode;
}

export interface Layer3HostTrainingRecipeProps {
  isLight?: boolean;
  defaultConfig?: Partial<HostTrainingConfig>;
  defaultGhostMode?: HostTrainingGhostMode;
  progressStatus?: CreationProgressStatus;
  currentStep?: number;
  onStartTraining?: (config: HostTrainingConfig) => void;
  onNavigateGarageSync?: () => void;
  onBack?: () => void;
  className?: string;
}

/**
 * [Recipe] Layer 3 Host Training
 * Simplified online co-op training host setup:
 * 1. Player Name: + "Not you?" (jumps to Garage Sync)
 * 2. Room Code (left half + Randomize) | Lock + Key (right half, placeholder "None")
 * 3. Ghost Mode — inline SegmentedSwitch (Automatically Enable | Manual)
 * 4. Create & Host — 5-step progress bar + primary action button
 */
export const Layer3HostTrainingRecipe: React.FC<Layer3HostTrainingRecipeProps> = React.memo(({
  isLight = true,
  defaultConfig,
  defaultGhostMode,
  progressStatus: controlledProgressStatus,
  currentStep: controlledCurrentStep,
  onStartTraining,
  onNavigateGarageSync,
  onBack: propOnBack,
  className = '',
}) => {
  const storeGoBack = useAppStore((s) => s.goBack);
  const onBack = propOnBack ?? storeGoBack;
  const [playerName, setPlayerName] = useState<string>(
    defaultConfig?.playerName ?? `Player${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [roomCode, setRoomCode] = useState<string>(
    defaultConfig?.roomCode ?? String(Math.floor(1000 + Math.random() * 9000))
  );
  const [roomKey, setRoomKey] = useState<string>(
    defaultConfig?.roomKey ?? ''
  );
  const [ghostMode, setGhostMode] = useState<HostTrainingGhostMode>(
    defaultGhostMode ?? defaultConfig?.ghostMode ?? 'automatically-enable'
  );
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const { panels, simulateLayer3Error, setToken } = useMenuLayoutStore();
  const sizing = panels['layer3-host-training'];
  const { rowGap, paddingX } = useSettingActionRowStore();

  // 5-Step Creation Progress State
  const [internalProgressStatus, setProgressStatus] = useState<CreationProgressStatus>('idle');
  const [internalCurrentStep, setCurrentStep] = useState<number>(1);
  const progressStatus = controlledProgressStatus ?? internalProgressStatus;
  const currentStep = controlledCurrentStep ?? internalCurrentStep;
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

  const handleRandomizeCode = () => {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setRoomCode(code);
  };

  const startStepSequence = (willFail: boolean) => {
    clearStepTimer();
    const cleanCode = roomCode.trim();
    if (!cleanCode) {
      setCurrentStep(3);
      setProgressStatus('error');
      setToken('simulateLayer3Error', true);
      dispatchOnlineRoomErrorNotification();
      return;
    }

    setToken('simulateLayer3Error', false);
    setCurrentStep(1);
    setProgressStatus('running');

    stepTimerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
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
          onStartTraining?.({
            playerName: playerName.trim() || `Player${Math.floor(1000 + Math.random() * 9000)}`,
            roomCode: cleanCode,
            roomKey,
            ghostMode,
          });
          return 5;
        }
        return next;
      });
    }, 520);
  };

  return (
    <PanelContainer
      isLight={isLight}
      sizing={sizing}
      className={`w-full select-none ${className}`}
    >
      <PanelHeader
        isLight={isLight}
        title="HOST TRAINING"
        onBack={onBack}
      />

      <PanelContent scrollable={true} className="flex flex-col justify-between gap-3">
        <div
          data-layout="host-training-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          {/* 1 & 2. Shared Identity & Room Code / Key */}
          <OnlineRoomIdentityFields
            isLight={isLight}
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
            roomCode={roomCode}
            onRoomCodeChange={setRoomCode}
            roomKey={roomKey}
            onRoomKeyChange={setRoomKey}
            showRandomize={true}
            onRandomizeRoomCode={handleRandomizeCode}
            onNotYouClick={onNavigateGarageSync}
            onHoverDesc={setHoveredDesc}
          />

          {/* 3. Ghost Mode (2 Options: Automatically Enable | Manual) */}
          <SettingSegmentedRow
            icon={Ghost}
            iconColor="text-purple-400"
            title="Ghost Mode"
            value={ghostMode}
            onChange={(v) => setGhostMode(v as HostTrainingGhostMode)}
            layout="inline"
            bordered={false}
            showDescription={false}
            options={[
              { label: 'Automatically Enable', value: 'automatically-enable' },
              { label: 'Manual', value: 'manual' },
            ]}
            hoverDescription="Ghost Mode: Choose Automatically Enable to phase car collisions automatically, or Manual so clients can toggle Ghost Mode individually."
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
          className="flex flex-col gap-2 shrink-0 pt-1"
        >
          {progressStatus !== 'idle' && (
            <OnlineRoomCreationProgress
              currentStep={currentStep}
              totalSteps={5}
              status={progressStatus}
              onRetry={() => startStepSequence(false)}
              onCancel={() => {
                clearStepTimer();
                setProgressStatus('idle');
                setCurrentStep(1);
                setToken('simulateLayer3Error', false);
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
                setHoveredDesc('Create & Host: Launch the 5-step shared training session initialization.')
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
        defaultDescription="Configure room identity and ghost collision rules for shared online training."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
});

Layer3HostTrainingRecipe.displayName = 'Layer3HostTrainingRecipe';
