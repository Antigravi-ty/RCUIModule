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
import { SignalingProfileSection } from '../components/SignalingProfileSection';
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
import { useAppStore } from '../../../stores/appStore';
import {
  useSettingsPacingStore,
  type ClockPacingMode,
} from '../settingsPacingStore';
export type TelemetryOverlayConfig = TelemetryConfigState;
export type InputBufferTargetOption = number;

export interface AdvancedTabProps {
  isLight?: boolean;
  developerMode?: boolean;
  onDeveloperModeChange?: (unlocked: boolean) => void;
  telemetryConfig?: Partial<TelemetryConfigState>;
  defaultTelemetryConfig?: Partial<TelemetryConfigState>;
  onTelemetryConfigChange?: (
    next: TelemetryConfigState,
    patch: Partial<TelemetryConfigState>
  ) => void;
  audioDebug?: AudioDebugTelemetryProps;
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
  telemetryConfig: propTelemetryConfig,
  defaultTelemetryConfig,
  onTelemetryConfigChange,
  audioDebug,
  onSpawnDiagnosticWindow,
  onHover,
  onLeave,
}) => {
  const storeDevMode = useAppStore((s) => s.developerMode);
  const storeTelemetry = useAppStore((s) => s.telemetry);
  const updateStoreTelemetry = useAppStore((s) => s.updateTelemetry);
  const setAppInputBufferTarget = useAppStore((s) => s.setInputBufferTarget);
  const setAppInputBufferThreshold = useAppStore((s) => s.setInputBufferThreshold);
  const masterVolume = useAppStore((s) => s.audio.masterVolume);

  const developerMode = propDevMode ?? storeDevMode ?? false;

  const [allowRemoteProfileDeployment, setAllowRemoteProfileDeployment] = useState(true);

  const {
    clockPacingMode,
    inputBufferTarget,
    inputBufferThreshold,
    setClockPacingMode,
    setInputBufferTarget,
    setInputBufferThreshold,
  } = useSettingsPacingStore();

  const handleClockPacingModeChange = (next: ClockPacingMode) => {
    setClockPacingMode(next);
  };

  const handleInputBufferTargetChange = (next: number) => {
    setInputBufferTarget(next);
    setAppInputBufferTarget(next);
  };

  const handleInputBufferThresholdChange = (next: [number, number]) => {
    setInputBufferThreshold(next);
    setAppInputBufferThreshold(next);
  };

  const [internalTelemetry, setInternalTelemetry] = useState<TelemetryConfigState>(() => ({
    ...DEFAULT_TELEMETRY_CONFIG_STATE,
    ...(storeTelemetry as unknown as Partial<TelemetryConfigState>),
    ...defaultTelemetryConfig,
  }));

  const telemetry: TelemetryConfigState = {
    ...internalTelemetry,
    ...(storeTelemetry as unknown as Partial<TelemetryConfigState>),
    ...propTelemetryConfig,
  };

  const handleUpdateTelemetry = (patch: Partial<TelemetryConfigState>) => {
    const next: TelemetryConfigState = { ...telemetry, ...patch };
    setInternalTelemetry(next);
    updateStoreTelemetry(patch as Parameters<typeof updateStoreTelemetry>[0]);
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
      {/* 1. First Position: Developer Settings Status Badge Row (Read-Only, URL Query Gated) */}
      <SettingDeveloperStatusRow
        icon={Code2}
        title="Developer Settings"
        developerMode={developerMode}
        interactiveToggle={false}
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
        onChange={setAllowRemoteProfileDeployment}
        bordered={resolvedBordered}
        onHover={(desc) => desc && onHover(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 2a. Signaling Credential Bundle (.rctbnspib) */}
      <SignalingProfileSection
        bordered={resolvedBordered}
        onHover={onHover}
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
        audioDebugEnabled={audioDebug?.audioDebugEnabled}
        onAudioDebugEnabledChange={audioDebug?.onAudioDebugEnabledChange}
        masterRmsDb={audioDebug?.masterRmsDb}
        masterPeakDb={audioDebug?.masterPeakDb}
        activeVoices={audioDebug?.activeVoices}
        maxVoices={audioDebug?.maxVoices}
        loadedBuffers={audioDebug?.loadedBuffers}
        totalBuffers={audioDebug?.totalBuffers}
        contextState={audioDebug?.contextState}
        verdictText={audioDebug?.verdictText}
        probeStatusText={audioDebug?.probeStatusText}
        onPlayTestTone={audioDebug?.onPlayTestTone}
        onDumpConsole={audioDebug?.onDumpConsole}
        onForceRecovery={audioDebug?.onForceRecovery}
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
