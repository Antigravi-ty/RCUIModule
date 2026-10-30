import React, { useState } from 'react';
import {
  Code2,
  Router,
  Sliders,
  Activity,
  CirclePile,
  ChartNoAxesGantt,
  Settings2,
  ChevronsLeftRightEllipsis,
} from 'lucide-react';
import { SettingSegmentedRow } from '../../../compounds/SettingSegmentedRow';
import { SettingToggleRow } from '../../../compounds/SettingToggleRow';
import { SettingDeveloperStatusRow } from '../../../compounds/SettingDeveloperStatusRow';
import { FloatingWindowCard, type DiagnosticWindowPayload } from '../components/FloatingWindowCard';
import { DualGrabberSlider } from '../../../primitives/DualGrabberSlider';
import {
  AudioDebugSection,
  type AudioDebugTelemetryProps,
} from '../components/AudioDebugSection';
import { RealisticBgmSection } from '../components/RealisticBgmSection';
import {
  TelemetryConfigCard,
  DEFAULT_TELEMETRY_CONFIG_STATE,
  type TelemetryConfigState,
} from '../../../compounds/TelemetryConfigCard';
import {
  PERFORMANCE_MONITOR_PRESET,
  NETWORK_MONITOR_PRESET,
  FLOATING_WINDOW_OPACITY_PRESET,
} from '../../../stores/floatingPresets';
import { useFloatingStore } from '../../../stores/floatingStore';
import { useSettingActionRowStore } from '../../../stores/settingRowStore';
import {
  useSettingsPacingStore,
  type ClockPacingMode,
} from '../settingsPacingStore';

export type { ClockPacingMode } from '../settingsPacingStore';
export type { AudioDebugTelemetryProps } from '../components/AudioDebugSection';
export type { TelemetryConfigState } from '../../../compounds/TelemetryConfigCard';
export type TelemetryOverlayConfig = TelemetryConfigState;
export type InputBufferTargetOption = number;

export interface AdvancedTabProps extends AudioDebugTelemetryProps {
  isLight?: boolean;
  developerMode?: boolean;
  onDeveloperModeChange?: (unlocked: boolean) => void;
  allowRemoteProfileDeployment?: boolean;
  onAllowRemoteProfileDeploymentChange?: (enabled: boolean) => void;
  clockPacingMode?: ClockPacingMode;
  onClockPacingModeChange?: (mode: ClockPacingMode) => void;
  inputBufferTarget?: number;
  defaultInputBufferTarget?: number;
  onInputBufferTargetChange?: (target: number) => void;
  inputBufferThreshold?: [number, number];
  defaultInputBufferThreshold?: [number, number];
  onInputBufferThresholdChange?: (threshold: [number, number]) => void;
  telemetryConfig?: Partial<TelemetryConfigState>;
  defaultTelemetryConfig?: Partial<TelemetryConfigState>;
  onTelemetryConfigChange?: (
    next: TelemetryConfigState,
    patch: Partial<TelemetryConfigState>
  ) => void;
  audioDebug?: AudioDebugTelemetryProps;
  masterVolume?: number;
  onSpawnDiagnosticWindow?: (window: DiagnosticWindowPayload) => void;
  onHover: (desc: string) => void;
  onLeave: () => void;
}

/**
 * [Layer 2 Settings -> Advanced Tab]
 * Decoupled Advanced Settings layout:
 * 1. First Row: `Developer Settings` (`SettingDeveloperStatusRow`) — displays a gray `Disabled` badge by default,
 *    or a customizable `Active` badge (defaults to Amber orange) + colored icon when `developerMode` is enabled.
 * 2. Second Row: `Allow Remote Profile Deployment` (icon: `chevrons-left-right-ellipsis` / `ChevronsLeftRightEllipsis`, default: enabled)
 * 3. `Input Buffer` (renamed from `Input Buffer Pacing`, icon: `circle-pile` / `CirclePile`)
 * 4. `Input Buffer Target (α)` (icon: `chart-no-axes-gantt` / `ChartNoAxesGantt`) — shown only when `Input Buffer` is `'custom'`
 * 5. `Threshold Tolerance Deadband` (icon: `settings-2` / `Settings2`) — shown only when `Input Buffer` is `'custom'`
 * 6. `Performance Monitor` (renamed from `Live System Telemetry`)
 * 7. `Show Telemetry Summary` (`TelemetryConfigCard` with underlined `Show v` disclosure & framing variations)
 * 8. `Network Monitor` (renamed from `Network Diagnostics`)
 * 9. `Audio Debug Mode` & `Audio Pipeline Diagnostics & Recovery` (`AudioDebugSection` relocated from AudioTab)
 * 10. Last Row: `Floating Window Opacity` (controlled by `floatingOpacityOrder` token, defaults to `'last'`)
 */
export const AdvancedTab: React.FC<AdvancedTabProps> = ({
  isLight = false,
  developerMode: propDevMode,
  onDeveloperModeChange,
  allowRemoteProfileDeployment: propAllowRemoteProfile,
  onAllowRemoteProfileDeploymentChange,
  clockPacingMode: propClockPacingMode,
  onClockPacingModeChange,
  inputBufferTarget: propInputBufferTarget,
  onInputBufferTargetChange,
  inputBufferThreshold: propInputBufferThreshold,
  onInputBufferThresholdChange,
  telemetryConfig: propTelemetryConfig,
  defaultTelemetryConfig,
  onTelemetryConfigChange,
  audioDebug,
  audioDebugEnabled,
  onAudioDebugEnabledChange,
  masterRmsDb,
  masterPeakDb,
  activeVoices,
  maxVoices,
  loadedBuffers,
  totalBuffers,
  contextState,
  verdictText,
  probeStatusText,
  onPlayTestTone,
  onDumpConsole,
  onForceRecovery,
  masterVolume,
  onSpawnDiagnosticWindow,
  onHover,
  onLeave,
}) => {
  const [internalDevMode, setInternalDevMode] = useState(propDevMode ?? false);
  const developerMode = propDevMode ?? internalDevMode;

  const [internalAllowRemoteProfile, setInternalAllowRemoteProfile] = useState(
    propAllowRemoteProfile ?? true
  );
  const allowRemoteProfileDeployment = propAllowRemoteProfile ?? internalAllowRemoteProfile;

  const {
    clockPacingMode: storeClockPacingMode,
    inputBufferTarget: storeInputBufferTarget,
    inputBufferThreshold: storeInputBufferThreshold,
    setClockPacingMode,
    setInputBufferTarget,
    setInputBufferThreshold,
  } = useSettingsPacingStore();

  const clockPacingMode = propClockPacingMode ?? storeClockPacingMode;
  const inputBufferTarget = propInputBufferTarget ?? storeInputBufferTarget;
  const inputBufferThreshold = propInputBufferThreshold ?? storeInputBufferThreshold;

  const handleClockPacingModeChange = (next: ClockPacingMode) => {
    setClockPacingMode(next);
    onClockPacingModeChange?.(next);
  };

  const handleInputBufferTargetChange = (next: number) => {
    setInputBufferTarget(next);
    onInputBufferTargetChange?.(next);
  };

  const handleInputBufferThresholdChange = (next: [number, number]) => {
    setInputBufferThreshold(next);
    onInputBufferThresholdChange?.(next);
  };

  const [internalTelemetry, setInternalTelemetry] = useState<TelemetryConfigState>(() => ({
    ...DEFAULT_TELEMETRY_CONFIG_STATE,
    ...defaultTelemetryConfig,
  }));

  const telemetry: TelemetryConfigState = {
    ...internalTelemetry,
    ...propTelemetryConfig,
  };

  const handleUpdateTelemetry = (patch: Partial<TelemetryConfigState>) => {
    const next: TelemetryConfigState = { ...telemetry, ...patch };
    setInternalTelemetry(next);
    onTelemetryConfigChange?.(next, patch);
  };

  const { windows } = useFloatingStore();
  const isOpacityManagerActive = windows.some((w) => w.id === FLOATING_WINDOW_OPACITY_PRESET.id);

  const {
    rowGap,
    bordered: storeBordered,
    advancedBordered,
    advancedShowBadges,
    floatingOpacityOrder,
  } = useSettingActionRowStore();

  const resolvedBordered = storeBordered || advancedBordered;
  const isCustomPacing = clockPacingMode === 'custom';

  const handleToggleDeveloper = (next: boolean) => {
    setInternalDevMode(next);
    onDeveloperModeChange?.(next);
  };

  const handleToggleAllowRemoteProfile = (next: boolean) => {
    setInternalAllowRemoteProfile(next);
    onAllowRemoteProfileDeploymentChange?.(next);
  };

  const opacityManagerCard = (
    <FloatingWindowCard
      preset={FLOATING_WINDOW_OPACITY_PRESET}
      icon={Sliders}
      bordered={resolvedBordered}
      description="Opacity adjustment (1% - 100%) for all floating telemetry windows"
      hoverTooltip="Floating Window Opacity: Adjust transparency across all active floating windows. Minimum 1%."
      onSpawnDiagnosticWindow={onSpawnDiagnosticWindow}
      onHover={onHover}
      onLeave={onLeave}
      isLight={isLight}
    />
  );

  const renderOpacityAtFirst =
    floatingOpacityOrder === 'first' ||
    (floatingOpacityOrder === 'first-when-inactive' && !isOpacityManagerActive);

  const renderOpacityAtLast =
    floatingOpacityOrder === 'last' ||
    (floatingOpacityOrder === 'first-when-inactive' && isOpacityManagerActive);

  return (
    <div
      data-layout="advanced-settings-list"
      className="flex flex-col w-full"
      style={{ gap: `${rowGap}px` }}
    >
      {/* 1. First Position: Developer Settings Status Badge Row (Decoupled SettingDeveloperStatusRow) */}
      <SettingDeveloperStatusRow
        icon={Code2}
        title="Developer Settings"
        developerMode={developerMode}
        onDeveloperModeChange={handleToggleDeveloper}
        bordered={resolvedBordered}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 2. Second Position: Allow Remote Profile Deployment */}
      <SettingToggleRow
        icon={ChevronsLeftRightEllipsis}
        iconName="chevrons-left-right-ellipsis"
        title="Allow Remote Profile Deployment"
        description="Allow remote profile deployment and live configuration synchronization across sessions"
        hoverDescription="Allow Remote Profile Deployment: Permit remote profile deployment and live configuration synchronization from connected sessions."
        checked={allowRemoteProfileDeployment}
        onChange={handleToggleAllowRemoteProfile}
        bordered={resolvedBordered}
        onHover={(desc) => desc && onHover(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 2b. Realistic Background Music (Rendered when BGM folder is uploaded) */}
      <RealisticBgmSection
        bordered={resolvedBordered}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {renderOpacityAtFirst && opacityManagerCard}

      {/* 2. Input Buffer (Renamed from Input Buffer Pacing, Icon: circle-pile / CirclePile) */}
      <SettingSegmentedRow
        icon={CirclePile}
        iconName="circle-pile"
        title="Input Buffer"
        badge={
          advancedShowBadges ? (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold bg-amber-500/15 border-amber-500/30 text-amber-400">
              {clockPacingMode === 'custom' ? 'Custom' : 'GDC Pacing'}
            </span>
          ) : undefined
        }
        description={
          clockPacingMode === 'legacy'
            ? 'Legacy (Fixed 120Hz discrete steps): Automatic target & deadband via Gameplay Experience Priority.'
            : clockPacingMode === 'sts'
            ? 'STS (Variable Time Step): 2-tier Schmitt hysteresis fractional clock pacing with automatic parameters.'
            : clockPacingMode === 'csts'
            ? 'CSTS (Continuous Variable Time Step): Continuous PD rate control with automatic jitter target boost.'
            : 'Custom: Manually configure Input Buffer Target (α) and Threshold Tolerance Deadband below (forces Experience Priority to Custom).'
        }
        value={clockPacingMode}
        onChange={(val) => handleClockPacingModeChange(val as ClockPacingMode)}
        options={[
          { value: 'legacy', label: 'Legacy' },
          { value: 'sts', label: 'STS' },
          { value: 'csts', label: 'CSTS' },
          { value: 'custom', label: 'Custom' },
        ]}
        bordered={resolvedBordered}
        hoverDescription="Input Buffer: Select between Legacy, STS, CSTS (automatic parameters driven by Experience Priority), or Custom (reveals manual Input Buffer Target and Threshold Tolerance Deadband controls below and sets Gameplay Experience Priority to Custom)."
        onHover={(desc) => desc && onHover(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 3 & 4. Input Buffer Target (α) & Threshold Tolerance Deadband — displayed ONLY when Input Buffer is 'custom' */}
      {isCustomPacing && (
        <>
          <SettingSegmentedRow
            icon={ChartNoAxesGantt}
            iconName="chart-no-axes-gantt"
            title="Input Buffer Target (α)"
            badge={
              advancedShowBadges ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold bg-amber-500/15 border-amber-500/30 text-amber-400">
                  Target: {inputBufferTarget} Frame{inputBufferTarget > 1 ? 's' : ''}
                </span>
              ) : undefined
            }
            description="Authoritative server queue depth target. Recommended: 3 Frames for WebRTC peer-to-peer matches."
            value={String(inputBufferTarget)}
            onChange={(val) => handleInputBufferTargetChange(Number(val))}
            controlType="dropdown"
            bordered={resolvedBordered}
            options={[
              { value: '1', label: '1 Frame (LAN / 0ms)' },
              { value: '2', label: '2 Frames (Aggressive)' },
              { value: '3', label: '3 Frames (Default / Rec.)' },
              { value: '4', label: '4 Frames (Stable Jitter)' },
              { value: '5', label: '5 Frames (High Latency)' },
              { value: '6', label: '6 Frames (Max Buffer)' },
            ]}
            hoverDescription="Input Buffer Target (α): Target number of future input frames queued on the authoritative server to absorb packet arrival jitter."
            onHover={(desc) => desc && onHover(desc)}
            onLeave={onLeave}
            isLight={isLight}
          />

          <DualGrabberSlider
            icon={Settings2}
            iconName="settings-2"
            label="Threshold Tolerance Deadband"
            subtitle={`Allowed queue jitter around target α (${inputBufferTarget}). Catch-up triggers below, step skip triggers above.`}
            target={inputBufferTarget}
            value={inputBufferThreshold}
            onChange={handleInputBufferThresholdChange}
            bordered={resolvedBordered}
            isLight={isLight}
            onHover={() =>
              onHover(
                `Threshold Deadband: Defines the asymmetrical deadband [-α .. +α] around input buffer target α (${inputBufferTarget}).`
              )
            }
            onLeave={onLeave}
          />
        </>
      )}

      {/* 5. Performance Monitor */}
      <FloatingWindowCard
        preset={PERFORMANCE_MONITOR_PRESET}
        icon={Activity}
        bordered={resolvedBordered}
        description="Real-time CPU phase breakdown, physics simulation sub-ticks, and WebGL rendering pipeline metrics."
        hoverTooltip="Performance Monitor: Inspect live frame pacing, tick rate stability, CPU pipeline phases, and GPU draw calls in a dockable floating overlay."
        onSpawnDiagnosticWindow={onSpawnDiagnosticWindow}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 6. Show Telemetry Summary (TelemetryConfigCard with underlined Show v disclosure & framing variations) */}
      <TelemetryConfigCard
        telemetry={telemetry}
        onUpdateTelemetry={handleUpdateTelemetry}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 7. Network Monitor */}
      <FloatingWindowCard
        preset={NETWORK_MONITOR_PRESET}
        icon={Router}
        bordered={resolvedBordered}
        description="Real-time RTT & jitter oscilloscope, input buffer queue depth, and 20-minute session telemetry export."
        hoverTooltip="Network Monitor: Monitor live connection health, input buffer starvation/hysteresis curves, and export full 20-minute session telemetry (.json / .csv)."
        onSpawnDiagnosticWindow={onSpawnDiagnosticWindow}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 8. Audio Debug & Pipeline Diagnostics Section (Relocated from AudioTab) */}
      <AudioDebugSection
        audioDebugEnabled={audioDebug?.audioDebugEnabled ?? audioDebugEnabled}
        onAudioDebugEnabledChange={
          audioDebug?.onAudioDebugEnabledChange ?? onAudioDebugEnabledChange
        }
        masterRmsDb={audioDebug?.masterRmsDb ?? masterRmsDb}
        masterPeakDb={audioDebug?.masterPeakDb ?? masterPeakDb}
        activeVoices={audioDebug?.activeVoices ?? activeVoices}
        maxVoices={audioDebug?.maxVoices ?? maxVoices}
        loadedBuffers={audioDebug?.loadedBuffers ?? loadedBuffers}
        totalBuffers={audioDebug?.totalBuffers ?? totalBuffers}
        contextState={audioDebug?.contextState ?? contextState}
        verdictText={audioDebug?.verdictText ?? verdictText}
        probeStatusText={audioDebug?.probeStatusText ?? probeStatusText}
        onPlayTestTone={audioDebug?.onPlayTestTone ?? onPlayTestTone}
        onDumpConsole={audioDebug?.onDumpConsole ?? onDumpConsole}
        onForceRecovery={audioDebug?.onForceRecovery ?? onForceRecovery}
        masterVolume={masterVolume}
        bordered={resolvedBordered}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 9. Last Position: Floating Window Opacity */}
      {renderOpacityAtLast && opacityManagerCard}
    </div>
  );
};
