import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Monitor,
  Info,
  Sliders,
  Terminal,
  Volume2,
} from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { UnderlineTabs, TabItem } from '../primitives/UnderlineTabs';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useAppStore } from '../stores/appStore';
import { DEFAULT_PANEL_SIZING, type PanelSizingConfig } from '../tokens/menuLayoutTokens';
import type { DiagnosticWindowPayload } from './settings/components/FloatingWindowCard';
import { GameplayTab, type GameplayConfig } from './settings/tabs/GameplayTab';
import { AudioTab, type AudioConfig } from './settings/tabs/AudioTab';
import { DisplayTab, type GraphicsConfig } from './settings/tabs/DisplayTab';
import { AdvancedTab, type TelemetryOverlayConfig } from './settings/tabs/AdvancedTab';
import type { AudioDebugTelemetryProps } from './settings/components/AudioDebugSection';
import { DeveloperTab } from './settings/tabs/DeveloperTab';
import type { TrajectoryConfig } from './Layer3BallTrajectoryRecipe';
import type { CameraConfig } from './camera/cameraConfigSpecs';
import { SettingsSubViewRouter } from './settings/SettingsSubViewRouter';

export type SettingsTabId = 'gameplay' | 'audio' | 'display' | 'advanced' | 'developer';

export interface Layer2SettingsRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  onNavigateTrainingDetail?: () => void;
  onNavigateAudioDetail?: () => void;
  onNavigateKeybindingsDetail?: () => void;
  onNavigateTrajectoryDetail?: () => void;
  onNavigateCameraDetail?: () => void;
  onNavigateAdvancedAudio?: () => void;
  onNavigateEventTriggerRules?: () => void;
  onNavigateExpMultiBots?: () => void;
  onNavigateDevSandboxes?: () => void;
  onNavigateDevActiveTuners?: () => void;
  onNavigateDevCalibratedPresets?: () => void;
  onNavigateDevUnderDevelopment?: () => void;
  onSpawnDiagnosticWindow?: (window: DiagnosticWindowPayload) => void;
  initialTab?: string;
  activeTab?: string;
  onTabChange?: (tab: SettingsTabId) => void;
  /** Whether Developer Mode is unlocked (controls visibility of 5th 'Developer' tab) */
  developerMode?: boolean;
  onDeveloperModeChange?: (unlocked: boolean) => void;
  highlightSetting?: string | null;
  onClearHighlight?: () => void;

  // --- Structured domain config overrides (optional) ---
  gameplayConfig?: Partial<GameplayConfig>;
  audioConfig?: Partial<AudioConfig>;
  graphicsConfig?: Partial<GraphicsConfig>;
  telemetryConfig?: Partial<TelemetryOverlayConfig>;
  audioDebug?: AudioDebugTelemetryProps;
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
 *
 * Each tab slot binds directly to its own store slice (useAppStore, useViewportStore,
 * useSettingsPacingStore, useSpatialAudioStore) so Layer2SettingsRecipe remains a clean
 * layout & tab-routing shell without funnel prop-drilling.
 */
export const Layer2SettingsRecipe: React.FC<Layer2SettingsRecipeProps> = ({
  isLight = false,
  onBack: propOnBack,
  onNavigateTrainingDetail,
  onNavigateKeybindingsDetail,
  onNavigateTrajectoryDetail,
  onNavigateCameraDetail,
  onNavigateAudioDetail,
  onNavigateAdvancedAudio,
  onNavigateEventTriggerRules,
  onNavigateExpMultiBots,
  onNavigateDevSandboxes,
  onNavigateDevActiveTuners,
  onNavigateDevCalibratedPresets,
  onNavigateDevUnderDevelopment,
  onSpawnDiagnosticWindow,
  initialTab = 'gameplay',
  activeTab: controlledTab,
  onTabChange,
  developerMode: propDevMode,
  onDeveloperModeChange,
  highlightSetting,
  onClearHighlight,
  gameplayConfig,
  audioConfig,
  graphicsConfig,
  telemetryConfig,
  audioDebug,
  cameraConfig,
  onCameraConfigChange,
  trajectoryConfig,
  onTrajectoryConfigChange,
  sizing: propSizing,
}) => {
  const storeGoBack = useAppStore((s) => s.goBack);
  const storeDevMode = useAppStore((s) => s.developerMode);
  const setStoreDevMode = useAppStore((s) => s.setDeveloperMode);

  const onBack = propOnBack ?? storeGoBack;

  const [internalSubView, setInternalSubView] = useState<
    null | 'trajectory' | 'training' | 'camera' | 'keybindings'
  >(null);

  const normalizeTab = (t?: string): SettingsTabId => {
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
    propDevMode ?? storeDevMode ?? (initialTab === 'developer' || controlledTab === 'developer')
  );
  const developerMode = propDevMode ?? storeDevMode ?? internalDevMode;

  const handleDeveloperModeChange = (next: boolean) => {
    setInternalDevMode(next);
    setStoreDevMode(next);
    onDeveloperModeChange?.(next);
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
    if (onNavigateTrajectoryDetail) {
      onNavigateTrajectoryDetail();
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
    if (onNavigateCameraDetail) {
      onNavigateCameraDetail();
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

  if (internalSubView) {
    return (
      <SettingsSubViewRouter
        subView={internalSubView}
        isLight={isLight}
        developerMode={developerMode}
        trajectoryConfig={trajectoryConfig}
        onTrajectoryConfigChange={onTrajectoryConfigChange}
        cameraConfig={cameraConfig}
        onCameraConfigChange={onCameraConfigChange}
        onChangeSubView={setInternalSubView}
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
        <div
          className="grid grid-cols-1 items-start w-full shrink-0"
          data-tab-envelope-grid="true"
        >
          <div
            aria-hidden={currentTab !== 'gameplay'}
            inert={currentTab !== 'gameplay' ? true : undefined}
            data-tab-active={currentTab === 'gameplay' ? 'true' : 'false'}
            className={`col-start-1 row-start-1 w-full ${
              currentTab === 'gameplay'
                ? 'visible opacity-100 pointer-events-auto z-10'
                : 'invisible opacity-0 pointer-events-none select-none z-0 h-0 overflow-hidden'
            }`}
          >
            <GameplayTab
              isLight={isLight}
              gameplayConfig={gameplayConfig}
              onNavigateTrainingDetail={handleNavigateTraining}
              onNavigateKeybindingsDetail={handleNavigateKeybindings}
              onNavigateTrajectoryDetail={handleNavigateTrajectory}
              onNavigateCameraDetail={handleNavigateCamera}
              onHover={setHoveredDesc}
              onLeave={() => setHoveredDesc(null)}
            />
          </div>

          <div
            aria-hidden={currentTab !== 'audio'}
            inert={currentTab !== 'audio' ? true : undefined}
            data-tab-active={currentTab === 'audio' ? 'true' : 'false'}
            className={`col-start-1 row-start-1 w-full ${
              currentTab === 'audio'
                ? 'visible opacity-100 pointer-events-auto z-10'
                : 'invisible opacity-0 pointer-events-none select-none z-0 h-0 overflow-hidden'
            }`}
          >
            <AudioTab
              isLight={isLight}
              developerMode={developerMode}
              audioConfig={audioConfig}
              onNavigateAudioDetail={onNavigateAudioDetail}
              onHover={setHoveredDesc}
              onLeave={() => setHoveredDesc(null)}
            />
          </div>

          <div
            aria-hidden={currentTab !== 'display'}
            inert={currentTab !== 'display' ? true : undefined}
            data-tab-active={currentTab === 'display' ? 'true' : 'false'}
            className={`col-start-1 row-start-1 w-full ${
              currentTab === 'display'
                ? 'visible opacity-100 pointer-events-auto z-10'
                : 'invisible opacity-0 pointer-events-none select-none z-0 h-0 overflow-hidden'
            }`}
          >
            <DisplayTab
              isLight={isLight}
              developerMode={developerMode}
              graphicsConfig={graphicsConfig}
              highlightSetting={highlightSetting}
              onClearHighlight={onClearHighlight}
              onHover={setHoveredDesc}
              onLeave={() => setHoveredDesc(null)}
            />
          </div>

          <div
            aria-hidden={currentTab !== 'advanced'}
            inert={currentTab !== 'advanced' ? true : undefined}
            data-tab-active={currentTab === 'advanced' ? 'true' : 'false'}
            className={`col-start-1 row-start-1 w-full ${
              currentTab === 'advanced'
                ? 'visible opacity-100 pointer-events-auto z-10'
                : 'invisible opacity-0 pointer-events-none select-none z-0 h-0 overflow-hidden'
            }`}
          >
            <AdvancedTab
              isLight={isLight}
              developerMode={developerMode}
              onDeveloperModeChange={handleDeveloperModeChange}
              onSpawnDiagnosticWindow={onSpawnDiagnosticWindow}
              telemetryConfig={telemetryConfig}
              audioDebug={audioDebug}
              onHover={setHoveredDesc}
              onLeave={() => setHoveredDesc(null)}
            />
          </div>

          {developerMode && (
            <div
              aria-hidden={currentTab !== 'developer'}
              inert={currentTab !== 'developer' ? true : undefined}
              data-tab-active={currentTab === 'developer' ? 'true' : 'false'}
              className={`col-start-1 row-start-1 w-full ${
                currentTab === 'developer'
                  ? 'visible opacity-100 pointer-events-auto z-10'
                  : 'invisible opacity-0 pointer-events-none select-none z-0 h-0 overflow-hidden'
              }`}
            >
              <DeveloperTab
                isLight={isLight}
                onNavigateAdvancedAudio={onNavigateAdvancedAudio}
                onNavigateEventTriggerRules={onNavigateEventTriggerRules}
                onNavigateExpMultiBots={onNavigateExpMultiBots}
                onNavigateDevSandboxes={onNavigateDevSandboxes}
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
