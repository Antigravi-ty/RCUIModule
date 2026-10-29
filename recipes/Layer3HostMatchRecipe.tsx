import React, { useState, useEffect, useRef } from 'react';
import { useLayer3HostMatchStoreBinding } from './hooks/useOnlineRecipesStoreBindings';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Clock,
  Play,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { SliderControl } from '../primitives/SliderControl';
import { InlineErrorNotice } from '../primitives/InlineErrorNotice';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import { dispatchOnlineRoomErrorNotification } from './Layer3OnlineWarmupRecipe';
import { OnlineRoomIdentityFields } from './online/OnlineRoomIdentityFields';
import {
  OnlineRoomCreationProgress,
  type CreationProgressStatus,
  type CreationStepSpec,
} from './online/OnlineRoomCreationProgress';

export type HostMatchTeamFormat = 'standard' | 'doubles' | 'duel';
export type HostMatchBotPolicy = 'none' | 'auto-fill' | 'vs-ai' | 'custom';
export type HostMatchDurationPreset = '90' | '180' | '300' | 'custom';

export interface HostMatchConfig {
  playerName: string;
  roomCode: string;
  roomKey: string;
  teamFormat: HostMatchTeamFormat;
  botPolicy: HostMatchBotPolicy;
  durationPreset: HostMatchDurationPreset;
  customDurationSeconds: number;
}

export const DEFAULT_HOST_MATCH_CONFIG: HostMatchConfig = {
  playerName: `Player${Math.floor(1000 + Math.random() * 9000)}`,
  roomCode: String(Math.floor(1000 + Math.random() * 9000)),
  roomKey: '',
  teamFormat: 'doubles',
  botPolicy: 'auto-fill',
  durationPreset: '300',
  customDurationSeconds: 180,
};

export interface Layer3HostMatchRecipeProps {
  isLight?: boolean;
  developerMode?: boolean;
  /** Controlled host match configuration */
  config?: Partial<HostMatchConfig>;
  /** Alias for controlled config */
  settings?: Partial<HostMatchConfig>;
  /** Initial host match configuration for uncontrolled mode */
  defaultConfig?: Partial<HostMatchConfig>;
  /** Callback fired when any host match setting changes */
  onChange?: (next: HostMatchConfig, patch: Partial<HostMatchConfig>) => void;
  /** Alias for onChange */
  onConfigChange?: (next: HostMatchConfig, patch: Partial<HostMatchConfig>) => void;
  onStartHost?: (config: HostMatchConfig) => void;
  /** Controlled 5-step creation progress status */
  progressStatus?: CreationProgressStatus;
  /** Controlled current step (1..5) */
  currentStep?: number;
  /** Custom step specifications */
  steps?: CreationStepSpec[];
  onProgressStatusChange?: (status: CreationProgressStatus) => void;
  onCurrentStepChange?: (step: number) => void;
  onRetryHost?: () => void;
  onCancelHost?: () => void;
  onNavigateGarageSync?: () => void;
  onNavigateAdvancedSettings?: () => void;
  onBack?: () => void;
}

export const FORMAT_LABELS: Record<HostMatchTeamFormat, string> = {
  standard: 'Standard',
  doubles: 'Doubles',
  duel: 'Duel',
};

export const BOT_POLICY_LABELS: Record<HostMatchBotPolicy, string> = {
  none: 'No Bots',
  'auto-fill': 'Auto-Fill',
  'vs-ai': 'Vs AI',
  custom: 'Custom',
};

export const formatMatchDurationLabel = (seconds: number): string => {
  const clamped = Math.max(0, Math.min(300, Math.round(seconds)));
  if (clamped === 0) return '0:00 (OT)';
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * [Recipe] Layer 3 Host Match (Create & Host Online Lobby)
 * Updated layout:
 * 1. Player Name: + "Not you?" (jumps to Garage Sync)
 * 2. Room Code (left 50% + Randomize) | Lock + Key (right 50%, gray "None" placeholder)
 * 3. Current Configuration box (framed like Settings -> Advanced -> Show box):
 *    - Header: "Current Configuration" + "Edit" underlined disclosure button
 *    - Summary row: Format | Bot Policy | Duration
 *    - Expanded Edit drawer:
 *      - Team Format (Standard | Doubles | Duel)
 *      - Bot Fill Policy (No Bots | Auto-Fill | Vs AI | Custom)
 *      - Match Duration (1:30 | 3:00 | 5:00 | Custom -> 0s..300s slider)
 *      - Full-width "Advanced Settings" bar button
 * 4. 5-step creation progress bar on "Create & Host" (Stage Name left, X/5 right, Description below, Progress Bar at bottom, with Error Simulation)
 */
export const Layer3HostMatchRecipe: React.FC<Layer3HostMatchRecipeProps> = React.memo((rawProps) => {
  const {
  isLight = false, config: controlledConfigProp, settings: controlledSettingsProp,
  defaultConfig, onChange, onConfigChange, onBack = () => {}, onNavigateGarageSync,
  onNavigateAdvancedSettings, onStartHost, onCancelHost, onRetryHost,
  progressStatus: controlledProgressStatus, currentStep: controlledCurrentStep,
  onProgressStatusChange, onCurrentStepChange, steps,
} = useLayer3HostMatchStoreBinding(rawProps);
  const { panels, simulateLayer3Error, setToken } = useMenuLayoutStore();
  const sizing = panels['layer3-host-match'];
  const { titleFontSize, rowGap, paddingX } = useSettingActionRowStore();

  const [internalConfig, setInternalConfig] = useState<HostMatchConfig>({
    ...DEFAULT_HOST_MATCH_CONFIG,
    ...defaultConfig,
  });

  const controlledSource = controlledConfigProp ?? controlledSettingsProp;
  const resolvedConfig: HostMatchConfig = {
    ...internalConfig,
    ...controlledSource,
  };

  const updateConfig = (patch: Partial<HostMatchConfig>) => {
    const next: HostMatchConfig = {
      ...resolvedConfig,
      ...patch,
    };
    if (controlledSource === undefined) {
      setInternalConfig(next);
    }
    onChange?.(next, patch);
    onConfigChange?.(next, patch);
  };

  const { playerName, roomCode, roomKey, teamFormat, botPolicy, durationPreset, customDurationSeconds } = resolvedConfig;

  const setPlayerName = (val: string) => updateConfig({ playerName: val });
  const setRoomCode = (val: string) => updateConfig({ roomCode: val });
  const setRoomKey = (val: string) => updateConfig({ roomKey: val });
  const setTeamFormat = (val: HostMatchTeamFormat) => updateConfig({ teamFormat: val });
  const setBotPolicy = (val: HostMatchBotPolicy) => updateConfig({ botPolicy: val });
  const setDurationPreset = (val: HostMatchDurationPreset) => updateConfig({ durationPreset: val });
  const setCustomDurationSeconds = (val: number) => updateConfig({ customDurationSeconds: val });

  const [isEditingConfig, setIsEditingConfig] = useState<boolean>(false);
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

  const handleRandomizeCode = () => {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setRoomCode(code);
  };

  const resolvedDurationSeconds =
    durationPreset === 'custom' ? customDurationSeconds : Number(durationPreset);
  const durationSummaryText = formatMatchDurationLabel(resolvedDurationSeconds);

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
        title="HOST MATCH"
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
            isLight={isLight}
          />

          {/* 3. Current Configuration Disclosure Box */}
          <div
            style={{
              marginLeft: `${Math.max(0, paddingX)}px`,
              marginRight: `${Math.max(0, paddingX)}px`,
            }}
            data-ui-element="host-match-current-config-box"
            className={`rounded-xl border transition-colors ${
              isLight
                ? 'border-neutral-300/90 bg-neutral-100/55'
                : 'border-neutral-800 bg-neutral-900/45'
            }`}
          >
            {/* Box Header: Current Configuration + Edit */}
            <div className="flex items-center justify-between gap-3 px-3.5 pt-3 pb-2">
              <span
                style={{ fontSize: `${Math.max(13, titleFontSize)}px` }}
                className={`font-semibold tracking-tight ${
                  isLight ? 'text-neutral-900' : 'text-neutral-100'
                }`}
              >
                Current Configuration
              </span>

              <button
                type="button"
                onClick={() => setIsEditingConfig((prev) => !prev)}
                onMouseEnter={() =>
                  setHoveredDesc(
                    'Edit: Expand or collapse Team Format, Bot Fill Policy, Match Duration, and Advanced Settings.'
                  )
                }
                onMouseLeave={() => setHoveredDesc(null)}
                className={`inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4 decoration-1 cursor-pointer transition-colors ${
                  isEditingConfig
                    ? isLight
                      ? 'text-neutral-900 decoration-neutral-900'
                      : 'text-white decoration-white'
                    : isLight
                    ? 'text-neutral-600 hover:text-neutral-900 decoration-neutral-400 hover:decoration-neutral-800'
                    : 'text-neutral-300 hover:text-white decoration-neutral-500 hover:decoration-neutral-200'
                }`}
              >
                <span>Edit</span>
                {isEditingConfig ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* 3-Column Summary Strip: Format | Bot Policy | Duration */}
            <div className="grid grid-cols-3 gap-2 px-3.5 pb-3">
              {[
                { label: 'Format', val: FORMAT_LABELS[teamFormat], mono: false },
                { label: 'Bot Policy', val: BOT_POLICY_LABELS[botPolicy], mono: false },
                { label: 'Duration', val: durationSummaryText, mono: true },
              ].map((cell) => (
                <div
                  key={cell.label}
                  className={`flex flex-col gap-0.5 px-2.5 py-2 rounded-lg border ${
                    isLight ? 'bg-white/80 border-neutral-200/90' : 'bg-neutral-950/60 border-neutral-800/90'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    {cell.label}
                  </span>
                  <span
                    className={`text-xs ${cell.mono ? 'font-mono ' : ''}font-semibold truncate ${
                      isLight ? 'text-neutral-800' : 'text-neutral-100'
                    }`}
                  >
                    {cell.val}
                  </span>
                </div>
              ))}
            </div>

            {/* Expanded Editable Controls */}
            {isEditingConfig && (
              <div
                className={`flex flex-col px-2.5 pt-2.5 pb-3 border-t ${
                  isLight ? 'border-neutral-200/90' : 'border-neutral-800/90'
                }`}
                style={{ gap: `${Math.max(4, rowGap)}px` }}
              >
                {/* Team Format (3 options) */}
                <SettingSegmentedRow
                  icon={Users}
                  iconColor="text-sky-400"
                  title="Team Format"
                  value={teamFormat}
                  onChange={(v) => setTeamFormat(v as HostMatchTeamFormat)}
                  layout="inline"
                  bordered={false}
                  showDescription={false}
                  options={[{ value: 'standard', label: 'Standard' }, { value: 'doubles', label: 'Doubles' }, { value: 'duel', label: 'Duel' }]}
                  hoverDescription="Team Format: Standard (3v3), Doubles (2v2), or Duel (1v1) team slot allocation."
                  onHover={(desc) => desc && setHoveredDesc(desc)}
                  onLeave={() => setHoveredDesc(null)}
                  isLight={isLight}
                />

                {/* Bot Fill Policy (4 options) */}
                <SettingSegmentedRow
                  icon={Bot}
                  iconColor="text-rose-400"
                  title="Bot Fill Policy"
                  value={botPolicy}
                  onChange={(v) => setBotPolicy(v as HostMatchBotPolicy)}
                  layout="inline"
                  bordered={false}
                  showDescription={false}
                  options={[{ value: 'none', label: 'No Bots' }, { value: 'auto-fill', label: 'Auto-Fill' }, { value: 'vs-ai', label: 'Vs AI' }, { value: 'custom', label: 'Custom' }]}
                  hoverDescription="Bot Fill Policy: Control whether empty slots stay open, auto-fill with bots, or pit human party vs AI."
                  onHover={(desc) => desc && setHoveredDesc(desc)}
                  onLeave={() => setHoveredDesc(null)}
                  isLight={isLight}
                />

                {/* Match Duration (1:30 | 3:00 | 5:00 | Custom) */}
                <SettingSegmentedRow
                  icon={Clock}
                  iconColor="text-emerald-400"
                  title="Match Duration"
                  value={durationPreset}
                  onChange={(v) => setDurationPreset(v as HostMatchDurationPreset)}
                  layout="inline"
                  bordered={false}
                  showDescription={false}
                  options={[{ value: '90', label: '1:30' }, { value: '180', label: '3:00' }, { value: '300', label: '5:00' }, { value: 'custom', label: 'Custom' }]}
                  hoverDescription="Match Duration: Regulation clock length. Select Custom to set any duration from 0s (instant Overtime) up to 5:00."
                  onHover={(desc) => desc && setHoveredDesc(desc)}
                  onLeave={() => setHoveredDesc(null)}
                  isLight={isLight}
                />

                {/* Custom Duration Slider (0s .. 300s) */}
                {durationPreset === 'custom' && (
                  <div
                    className={`mx-2 my-1 px-3 py-2.5 rounded-xl border ${
                      isLight
                        ? 'bg-white/90 border-neutral-200/90'
                        : 'bg-neutral-950/70 border-neutral-800'
                    }`}
                    onMouseEnter={() =>
                      setHoveredDesc(
                        'Custom Match Duration: 0s to 300s (5 minutes). Setting 0s starts the match directly in Overtime.'
                      )
                    }
                    onMouseLeave={() => setHoveredDesc(null)}
                  >
                    <SliderControl
                      label={`Custom Duration (${formatMatchDurationLabel(customDurationSeconds)})`}
                      value={customDurationSeconds}
                      min={0}
                      max={300}
                      step={1}
                      unit="s"
                      editable={true}
                      colorScheme="amber"
                      onChange={setCustomDurationSeconds}
                      isLight={isLight}
                    />
                  </div>
                )}

                {/* Full-width Long Bar Button: Advanced Settings */}
                <div className="pt-1.5 px-1">
                  <button
                    type="button"
                    onClick={onNavigateAdvancedSettings}
                    onMouseEnter={() =>
                      setHoveredDesc(
                        'Advanced Settings: Configure custom bot counts, mutator physics presets, and simulation rules.'
                      )
                    }
                    onMouseLeave={() => setHoveredDesc(null)}
                    className={`w-full py-2 px-4 rounded-xl border text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-white hover:bg-neutral-200/70 border-neutral-300 text-neutral-800 shadow-2xs'
                        : 'bg-neutral-800/90 hover:bg-neutral-700/90 border-neutral-700 text-neutral-100'
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500" />
                    <span>Advanced Settings</span>
                  </button>
                </div>
              </div>
            )}
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
