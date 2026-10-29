import React, { useState, useEffect } from 'react';
import { useLayer2SettingsStoreBinding } from './hooks/useSettingsStoreBinding';
import {
  Gamepad2,
  Monitor,
  Info,
  Sliders,
  Terminal,
  Volume2,
} from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { UnderlineTabs, TabItem } from '../primitives/UnderlineTabs';
import { Badge } from '../primitives/Badge';
import { useMenuLayoutStore, DEFAULT_PANEL_SIZING } from '../stores/menuLayoutStore';
import type { PanelSizingConfig } from '../stores/menuLayoutStore';
import type { DiagnosticWindowPayload } from './settings/components/FloatingWindowCard';
import { GameplayTab, type GameplayConfig, type ClockPacingPriority, type BallOpacityMode } from './settings/tabs/GameplayTab';
import { AudioTab, type AudioConfig } from './settings/tabs/AudioTab';
import { DisplayTab, type GraphicsConfig, type MenuPowerSaveOption, type FpsTargetOption } from './settings/tabs/DisplayTab';
import { AdvancedTab, type AudioDebugTelemetryProps, type InputBufferTargetOption, type TelemetryOverlayConfig } from './settings/tabs/AdvancedTab';
import { DeveloperTab } from './settings/tabs/DeveloperTab';
import {
  Layer3BallTrajectoryRecipe,
  type TrajectoryConfig,
} from './Layer3BallTrajectoryRecipe';
import { Layer3TrainingRecipe } from './Layer3TrainingRecipe';
import {
  Layer3CameraRecipe,
  type CameraConfig,
} from './Layer3CameraRecipe';
import { Layer3KeybindingsRecipe } from './Layer3KeybindingsRecipe';

export type { DiagnosticWindowPayload } from './settings/components/FloatingWindowCard';
export type {
  GameplayConfig, ClockPacingPriority, AudioConfig, AudioDebugTelemetryProps,
  GraphicsConfig, MenuPowerSaveOption, FpsTargetOption, InputBufferTargetOption,
  TelemetryOverlayConfig, BallOpacityMode,
};
export type SettingsTabId = 'gameplay' | 'audio' | 'display' | 'advanced' | 'developer';

export interface Layer2SettingsRecipeProps extends AudioDebugTelemetryProps {
  isLight?: boolean;
  onBack?: () => void;
  onNavigateTrainingDetail?: () => void;
  onNavigateAudioDetail?: () => void;
  onNavigateKeybindingsDetail?: () => void;
  onNavigateTrajectoryDetail?: () => void;
  /** Alias for onNavigateTrajectoryDetail */
  onNavigateTrajectory?: () => void;
  onNavigateCameraDetail?: () => void;
  onNavigateAdvancedAudio?: () => void;
  onNavigateAdvancedController?: () => void;
  onNavigateEventAndTriggerer?: () => void;
  onNavigateExpMultiBots?: () => void;
  onNavigateDevSandboxes?: () => void;
  onNavigateDevSubsystemIsolation?: () => void;
  onNavigateDevActiveTuners?: () => void;
  onNavigateDevCalibratedPresets?: () => void;
  onNavigateDevUnderDevelopment?: () => void;
  onSpawnDiagnosticWindow?: (window: DiagnosticWindowPayload) => void;
  initialTab?: string;
  activeTab?: string;
  onTabChange?: (tab: SettingsTabId) => void;
  /** Whether Developer Mode is unlocked (controls visibility of 5th 'Developer' tab) */
  developerMode?: boolean;
  developerModeEnabled?: boolean;
  onDeveloperModeChange?: (unlocked: boolean) => void;
  onToggleDeveloperMode?: (unlocked: boolean) => void;
  touchControlsEnabled?: boolean;
  onToggleTouchControls?: (enabled: boolean) => void;
  backgroundRenderPaused?: boolean;
  onToggleBackgroundRender?: (paused: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAddPresetWindow?: (preset: any, e: React.MouseEvent<HTMLButtonElement>) => void;
  activeWindows?: unknown[];
  onClosePresetWindow?: (id: string) => void;
  onNavigateCameraSettings?: () => void;
  highlightSetting?: string | null;
  onClearHighlight?: () => void;

  // --- 1. Gameplay Tab controlled props ---
  gameplayConfig?: Partial<GameplayConfig>;
  defaultGameplayConfig?: Partial<GameplayConfig>;
  onGameplayConfigChange?: (next: GameplayConfig, patch: Partial<GameplayConfig>) => void;
  ballCamIndicator?: boolean;
  onBallCamIndicatorChange?: (enabled: boolean) => void;
  trajectoryEnabled?: boolean;
  onTrajectoryEnabledChange?: (enabled: boolean) => void;
  experiencePriority?: ClockPacingPriority;
  clockPacingPriority?: ClockPacingPriority;
  onExperiencePriorityChange?: (priority: ClockPacingPriority) => void;
  onClockPacingPriorityChange?: (priority: ClockPacingPriority) => void;

  // --- 2. Audio Tab controlled props ---
  audioConfig?: Partial<AudioConfig>;
  defaultAudioConfig?: Partial<AudioConfig>;
  onAudioConfigChange?: (next: AudioConfig, patch: Partial<AudioConfig>) => void;
  muteWhenUnfocused?: boolean;
  onMuteWhenUnfocusedChange?: (muted: boolean) => void;
  masterVolume?: number;
  onMasterVolumeChange?: (volume: number) => void;
  engineVolume?: number;
  onEngineVolumeChange?: (volume: number) => void;
  boostVolume?: number;
  onBoostVolumeChange?: (volume: number) => void;

  // --- 3. Display Tab controlled props ---
  graphicsConfig?: Partial<GraphicsConfig>;
  defaultGraphicsConfig?: Partial<GraphicsConfig>;
  onGraphicsConfigChange?: (next: GraphicsConfig, patch: Partial<GraphicsConfig>) => void;
  menuPowerSave?: MenuPowerSaveOption;
  onMenuPowerSaveChange?: (mode: MenuPowerSaveOption) => void;
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
  uiScale?: number;
  onUiScaleChange?: (scale: number) => void;
  maxSafeScale?: number;
  safeAreaMargin?: number;
  onSafeAreaMarginChange?: (margin: number) => void;
  limitFps?: boolean;
  onLimitFpsChange?: (limitFps: boolean) => void;
  maxFps?: number;
  onMaxFpsChange?: (maxFps: number) => void;
  fpsSelection?: FpsTargetOption;
  onFpsSelectionChange?: (selection: FpsTargetOption) => void;
  customFps?: number;
  onCustomFpsChange?: (fps: number) => void;
  renderScale?: number;
  onRenderScaleChange?: (scale: number) => void;

  // --- 4. Advanced Tab controlled props ---
  inputBufferTarget?: InputBufferTargetOption;
  defaultInputBufferTarget?: InputBufferTargetOption;
  onInputBufferTargetChange?: (target: InputBufferTargetOption) => void;
  inputBufferThreshold?: [number, number];
  defaultInputBufferThreshold?: [number, number];
  onInputBufferThresholdChange?: (threshold: [number, number]) => void;
  telemetryConfig?: Partial<TelemetryOverlayConfig>;
  defaultTelemetryConfig?: Partial<TelemetryOverlayConfig>;
  onTelemetryConfigChange?: (
    next: TelemetryOverlayConfig,
    patch: Partial<TelemetryOverlayConfig>
  ) => void;
  audioDebug?: AudioDebugTelemetryProps;

  // --- 5. Developer Tab controlled props ---
  ballOpacityMode?: BallOpacityMode;
  defaultBallOpacityMode?: BallOpacityMode;
  onBallOpacityModeChange?: (mode: BallOpacityMode) => void;
  observeSafeAreaBoundary?: boolean;
  defaultObserveSafeAreaBoundary?: boolean;
  onObserveSafeAreaBoundaryChange?: (observe: boolean) => void;

  // --- 6. Sub-view (Camera & Trajectory) controlled props ---
  cameraConfig?: Partial<CameraConfig>;
  onCameraConfigChange?: (next: CameraConfig, patch: Partial<CameraConfig>) => void;
  trajectoryConfig?: Partial<TrajectoryConfig>;
  onTrajectoryConfigChange?: (next: TrajectoryConfig, patch: Partial<TrajectoryConfig>) => void;

  sizing?: PanelSizingConfig;
}

/**
 * [Recipe] Layer 2 Settings Menu (Width: 680px, Height: 580px)
 * Matches RocketCompanion's authentic 5 icon+text tabs:
 * 1. Gameplay (`Gamepad2`)
 * 2. Audio (`Volume2`)
 * 3. Display (`Monitor`)
 * 4. Advanced (`Sliders`) — includes the Developer Settings bridge toggle
 * 5. Developer (`Terminal`) — visible when developerMode is true or activeTab === 'developer'
 */
export const Layer2SettingsRecipe: React.FC<Layer2SettingsRecipeProps> = (rawProps) => {
  const {
  isLight = false, onBack,
  onNavigateTrainingDetail, onNavigateKeybindingsDetail, onNavigateTrajectoryDetail, onNavigateTrajectory,
  onNavigateCameraDetail, onNavigateCameraSettings, onNavigateAudioDetail,
  onNavigateAdvancedAudio, onNavigateEventAndTriggerer, onNavigateExpMultiBots,
  onNavigateDevSandboxes, onNavigateDevSubsystemIsolation, onNavigateDevActiveTuners,
  onNavigateDevCalibratedPresets, onNavigateDevUnderDevelopment, onSpawnDiagnosticWindow,
  initialTab = 'gameplay', activeTab: controlledTab, onTabChange,
  developerMode: propDevMode, developerModeEnabled, onDeveloperModeChange, onToggleDeveloperMode,
  onNavigateAdvancedController,
  gameplayConfig, defaultGameplayConfig, onGameplayConfigChange,
  ballCamIndicator, onBallCamIndicatorChange, trajectoryEnabled, onTrajectoryEnabledChange,
  experiencePriority, clockPacingPriority, onExperiencePriorityChange, onClockPacingPriorityChange,
  audioConfig, defaultAudioConfig, onAudioConfigChange,
  muteWhenUnfocused, onMuteWhenUnfocusedChange, masterVolume, onMasterVolumeChange,
  engineVolume, onEngineVolumeChange, boostVolume, onBoostVolumeChange,
  graphicsConfig, defaultGraphicsConfig, onGraphicsConfigChange,
  theme, onThemeChange, uiScale, onUiScaleChange, maxSafeScale,
  safeAreaMargin, onSafeAreaMarginChange, limitFps, onLimitFpsChange,
  maxFps, onMaxFpsChange, fpsSelection, onFpsSelectionChange, customFps, onCustomFpsChange,
  renderScale, onRenderScaleChange, menuPowerSave, onMenuPowerSaveChange,
  highlightSetting, onClearHighlight,
  inputBufferTarget, defaultInputBufferTarget, onInputBufferTargetChange,
  inputBufferThreshold, defaultInputBufferThreshold, onInputBufferThresholdChange,
  telemetryConfig, defaultTelemetryConfig, onTelemetryConfigChange,
  audioDebug, audioDebugEnabled, onAudioDebugEnabledChange,
  masterRmsDb, masterPeakDb, activeVoices, maxVoices, loadedBuffers, totalBuffers,
  contextState, verdictText, probeStatusText, onPlayTestTone, onDumpConsole, onForceRecovery,
  ballOpacityMode, defaultBallOpacityMode, onBallOpacityModeChange,
  observeSafeAreaBoundary, defaultObserveSafeAreaBoundary, onObserveSafeAreaBoundaryChange,
  cameraConfig, onCameraConfigChange, trajectoryConfig, onTrajectoryConfigChange,
  sizing: propSizing,
} = useLayer2SettingsStoreBinding(rawProps);
  const resolvedPropDevMode = propDevMode ?? developerModeEnabled;
  const [internalSubView, setInternalSubView] = useState<
    null | 'trajectory' | 'training' | 'camera' | 'keybindings'
  >(null);

  const normalizeTab = (t?: string): SettingsTabId => {
    if (t === 'video') return 'display';
    if (
      t === 'gameplay' ||
      t === 'audio' ||
      t === 'display' ||
      t === 'advanced' ||
      t === 'developer'
    ) {
      return t;
    }
    return 'gameplay';
  };

  const [internalTab, setInternalTab] = useState<SettingsTabId>(() => normalizeTab(initialTab));
  const currentTab: SettingsTabId = controlledTab ? normalizeTab(controlledTab) : internalTab;

  useEffect(() => {
    if (initialTab && !controlledTab) {
      setInternalTab(normalizeTab(initialTab));
    }
  }, [initialTab, controlledTab]);

  const [internalDevMode, setInternalDevMode] = useState<boolean>(
    resolvedPropDevMode ?? (initialTab === 'developer' || controlledTab === 'developer')
  );
  const developerMode = resolvedPropDevMode ?? internalDevMode;

  const handleDeveloperModeChange = (next: boolean) => {
    setInternalDevMode(next);
    onDeveloperModeChange?.(next);
    onToggleDeveloperMode?.(next);
    if (!next && currentTab === 'developer') {
      setInternalTab('advanced');
      onTabChange?.('advanced');
    }
  };

  const handleTabChange = (t: string) => {
    const valid = normalizeTab(t);
    setInternalTab(valid);
    onTabChange?.(valid);
  };

  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  const storeSizing = useMenuLayoutStore(
    (s) => s.panels?.['layer2-settings'] ?? DEFAULT_PANEL_SIZING['layer2-settings']
  );
  const panelBodyPaddingX = useMenuLayoutStore((s) => s.panelBodyPaddingX ?? 18);
  const sizing = propSizing ?? storeSizing;

  const handleNavigateTrajectory = () => {
    const externalHandler = onNavigateTrajectoryDetail ?? onNavigateTrajectory;
    if (externalHandler) {
      externalHandler();
    } else {
      setInternalSubView('trajectory');
    }
  };

  const handleNavigateTraining = () => {
    if (onNavigateTrainingDetail) {
      onNavigateTrainingDetail();
    } else {
      setInternalSubView('training');
    }
  };

  const handleNavigateCamera = () => {
    const externalHandler = onNavigateCameraDetail ?? onNavigateCameraSettings;
    if (externalHandler) {
      externalHandler();
    } else {
      setInternalSubView('camera');
    }
  };

  const handleNavigateKeybindings = () => {
    if (onNavigateKeybindingsDetail) {
      onNavigateKeybindingsDetail();
    } else {
      setInternalSubView('keybindings');
    }
  };

  if (internalSubView === 'trajectory') {
    return (
      <Layer3BallTrajectoryRecipe
        isLight={isLight}
        developerMode={developerMode}
        config={trajectoryConfig}
        onChange={onTrajectoryConfigChange}
        onBack={() => setInternalSubView(null)}
        onCollapsePreview={() => setInternalSubView(null)}
      />
    );
  }

  if (internalSubView === 'training') {
    return (
      <Layer3TrainingRecipe
        isLight={isLight}
        onBack={() => setInternalSubView(null)}
        onNavigateTrajectory={() => setInternalSubView('trajectory')}
      />
    );
  }

  if (internalSubView === 'camera') {
    return (
      <Layer3CameraRecipe
        isLight={isLight}
        developerMode={developerMode}
        config={cameraConfig}
        onChange={onCameraConfigChange}
        onBack={() => setInternalSubView(null)}
      />
    );
  }

  if (internalSubView === 'keybindings') {
    return (
      <Layer3KeybindingsRecipe
        isLight={isLight}
        onBack={() => setInternalSubView(null)}
      />
    );
  }

  const tabs: TabItem[] = [
    { id: 'gameplay', label: 'Gameplay', icon: <Gamepad2 className="h-3.5 w-3.5" /> },
    { id: 'audio', label: 'Audio', icon: <Volume2 className="h-3.5 w-3.5" /> },
    { id: 'display', label: 'Display', icon: <Monitor className="h-3.5 w-3.5" /> },
    { id: 'advanced', label: 'Advanced', icon: <Sliders className="h-3.5 w-3.5" /> },
  ];

  if (developerMode || currentTab === 'developer') {
    tabs.push({
      id: 'developer',
      label: 'Developer',
      icon: <Terminal className="h-3.5 w-3.5" />,
    });
  }

  const defaultFooterDesc =
    currentTab === 'developer'
      ? 'Internal developer diagnostics, sandboxes, active tuners, and calibrated presets.'
      : currentTab === 'advanced'
      ? 'Manage engine telemetry overlays, floating diagnostics windows, and developer tools.'
      : currentTab === 'display'
      ? 'Tune display render resolution, frame rate targets, and arena visual fidelity.'
      : currentTab === 'audio'
      ? 'Adjust master, engine, and boost sound levels or background audio behavior.'
      : 'Configure gameplay mechanics, training mode, camera, key bindings, and ball trajectory predictor.';

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full">
      <PanelHeader
        title="SETTINGS"
        badge={
          currentTab === 'developer' ? (
            <Badge
              variant="amber"
              size="sm"
              isLight={isLight}
              className="font-mono text-[10px] font-semibold tracking-normal"
            >
              DEV MODE
            </Badge>
          ) : undefined
        }
        onBack={onBack}
        isLight={isLight}
      />

      <div
        style={{ paddingLeft: `${panelBodyPaddingX}px`, paddingRight: `${panelBodyPaddingX}px` }}
        className="pt-2 w-full shrink-0"
        data-ui-element="tabs-wrapper"
        data-panel-section="tabs"
      >
        <UnderlineTabs
          items={tabs}
          activeId={currentTab}
          onChange={handleTabChange}
          isLight={isLight}
          size="sm"
          fullWidth={true}
        />
      </div>

      <PanelContent scrollable>
        <div className="grid grid-cols-1 items-start w-full shrink-0">
          <div
            aria-hidden={currentTab !== 'gameplay'}
            inert={currentTab !== 'gameplay' ? true : undefined}
            className={`col-start-1 row-start-1 w-full ${
              currentTab === 'gameplay'
                ? 'visible opacity-100 pointer-events-auto z-10'
                : 'invisible opacity-0 pointer-events-none select-none z-0'
            }`}
          >
            <GameplayTab
              isLight={isLight}
              gameplayConfig={gameplayConfig}
              defaultGameplayConfig={defaultGameplayConfig}
              onGameplayConfigChange={onGameplayConfigChange}
              ballCamIndicator={ballCamIndicator}
              onBallCamIndicatorChange={onBallCamIndicatorChange}
              trajectoryEnabled={trajectoryEnabled}
              onTrajectoryEnabledChange={onTrajectoryEnabledChange}
              experiencePriority={experiencePriority}
              clockPacingPriority={clockPacingPriority}
              onExperiencePriorityChange={onExperiencePriorityChange}
              onClockPacingPriorityChange={onClockPacingPriorityChange}
              onNavigateTrainingDetail={handleNavigateTraining}
              onNavigateKeybindingsDetail={handleNavigateKeybindings}
              onNavigateTrajectoryDetail={handleNavigateTrajectory}
              onNavigateTrajectory={handleNavigateTrajectory}
              onNavigateCameraDetail={handleNavigateCamera}
              onHover={setHoveredDesc}
              onLeave={() => setHoveredDesc(null)}
            />
          </div>

          <div
            aria-hidden={currentTab !== 'audio'}
            inert={currentTab !== 'audio' ? true : undefined}
            className={`col-start-1 row-start-1 w-full ${
              currentTab === 'audio'
                ? 'visible opacity-100 pointer-events-auto z-10'
                : 'invisible opacity-0 pointer-events-none select-none z-0'
            }`}
          >
            <AudioTab
              isLight={isLight}
              developerMode={developerMode}
              audioConfig={audioConfig}
              defaultAudioConfig={defaultAudioConfig}
              onAudioConfigChange={onAudioConfigChange}
              muteWhenUnfocused={muteWhenUnfocused}
              onMuteWhenUnfocusedChange={onMuteWhenUnfocusedChange}
              masterVolume={masterVolume}
              onMasterVolumeChange={onMasterVolumeChange}
              engineVolume={engineVolume}
              onEngineVolumeChange={onEngineVolumeChange}
              boostVolume={boostVolume}
              onBoostVolumeChange={onBoostVolumeChange}
              onNavigateAudioDetail={onNavigateAudioDetail}
              onHover={setHoveredDesc}
              onLeave={() => setHoveredDesc(null)}
            />
          </div>

          <div
            aria-hidden={currentTab !== 'display'}
            inert={currentTab !== 'display' ? true : undefined}
            className={`col-start-1 row-start-1 w-full ${
              currentTab === 'display'
                ? 'visible opacity-100 pointer-events-auto z-10'
                : 'invisible opacity-0 pointer-events-none select-none z-0'
            }`}
          >
            <DisplayTab
              isLight={isLight}
              developerMode={developerMode}
              graphicsConfig={graphicsConfig}
              defaultGraphicsConfig={defaultGraphicsConfig}
              onGraphicsConfigChange={onGraphicsConfigChange}
              theme={theme}
              onThemeChange={onThemeChange}
              uiScale={uiScale}
              onUiScaleChange={onUiScaleChange}
              maxSafeScale={maxSafeScale}
              safeAreaMargin={safeAreaMargin}
              onSafeAreaMarginChange={onSafeAreaMarginChange}
              limitFps={limitFps}
              onLimitFpsChange={onLimitFpsChange}
              maxFps={maxFps}
              onMaxFpsChange={onMaxFpsChange}
              fpsSelection={fpsSelection}
              onFpsSelectionChange={onFpsSelectionChange}
              customFps={customFps}
              onCustomFpsChange={onCustomFpsChange}
              renderScale={renderScale}
              onRenderScaleChange={onRenderScaleChange}
              menuPowerSave={menuPowerSave}
              onMenuPowerSaveChange={onMenuPowerSaveChange}
              highlightSetting={highlightSetting}
              onClearHighlight={onClearHighlight}
              onHover={setHoveredDesc}
              onLeave={() => setHoveredDesc(null)}
            />
          </div>

          <div
            aria-hidden={currentTab !== 'advanced'}
            inert={currentTab !== 'advanced' ? true : undefined}
            className={`col-start-1 row-start-1 w-full ${
              currentTab === 'advanced'
                ? 'visible opacity-100 pointer-events-auto z-10'
                : 'invisible opacity-0 pointer-events-none select-none z-0'
            }`}
          >
            <AdvancedTab
              isLight={isLight}
              developerMode={developerMode}
              onDeveloperModeChange={handleDeveloperModeChange}
              onSpawnDiagnosticWindow={onSpawnDiagnosticWindow}
              inputBufferTarget={inputBufferTarget}
              defaultInputBufferTarget={defaultInputBufferTarget}
              onInputBufferTargetChange={onInputBufferTargetChange}
              inputBufferThreshold={inputBufferThreshold}
              defaultInputBufferThreshold={defaultInputBufferThreshold}
              onInputBufferThresholdChange={onInputBufferThresholdChange}
              telemetryConfig={telemetryConfig}
              defaultTelemetryConfig={defaultTelemetryConfig}
              onTelemetryConfigChange={onTelemetryConfigChange}
              audioDebug={audioDebug}
              audioDebugEnabled={audioDebugEnabled}
              onAudioDebugEnabledChange={onAudioDebugEnabledChange}
              masterRmsDb={masterRmsDb}
              masterPeakDb={masterPeakDb}
              activeVoices={activeVoices}
              maxVoices={maxVoices}
              loadedBuffers={loadedBuffers}
              totalBuffers={totalBuffers}
              contextState={contextState}
              verdictText={verdictText}
              probeStatusText={probeStatusText}
              onPlayTestTone={onPlayTestTone}
              onDumpConsole={onDumpConsole}
              onForceRecovery={onForceRecovery}
              onHover={setHoveredDesc}
              onLeave={() => setHoveredDesc(null)}
            />
          </div>

          {developerMode && (
            <div
              aria-hidden={currentTab !== 'developer'}
              inert={currentTab !== 'developer' ? true : undefined}
              className={`col-start-1 row-start-1 w-full ${
                currentTab === 'developer'
                  ? 'visible opacity-100 pointer-events-auto z-10'
                  : 'invisible opacity-0 pointer-events-none select-none z-0'
              }`}
            >
              <DeveloperTab
                isLight={isLight}
                ballOpacityMode={ballOpacityMode}
                defaultBallOpacityMode={defaultBallOpacityMode}
                onBallOpacityModeChange={onBallOpacityModeChange}
                observeSafeAreaBoundary={observeSafeAreaBoundary}
                defaultObserveSafeAreaBoundary={defaultObserveSafeAreaBoundary}
                onObserveSafeAreaBoundaryChange={onObserveSafeAreaBoundaryChange}
                onNavigateAdvancedAudio={onNavigateAdvancedAudio}
                onNavigateEventAndTriggerer={onNavigateEventAndTriggerer}
                onNavigateExpMultiBots={onNavigateExpMultiBots}
                onNavigateDevSandboxes={onNavigateDevSandboxes}
                onNavigateDevSubsystemIsolation={onNavigateDevSubsystemIsolation}
                onNavigateDevActiveTuners={onNavigateDevActiveTuners}
                onNavigateDevCalibratedPresets={onNavigateDevCalibratedPresets}
                onNavigateDevUnderDevelopment={onNavigateDevUnderDevelopment}
                onHover={setHoveredDesc}
                onLeave={() => setHoveredDesc(null)}
              />
            </div>
          )}
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription={defaultFooterDesc}
        hoveredDescription={hoveredDesc}
        icon={<Info className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
      />
    </PanelContainer>
  );
};
