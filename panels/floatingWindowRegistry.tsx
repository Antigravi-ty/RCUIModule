import React from 'react';

// 6 User Floating Windows (Canonical UI-Aligned Filenames)
import { ReplayViewerFloatingWindow } from './user/ReplayViewerFloatingWindow';
import { GoalBarrierConfiguratorFloatingWindow } from './user/GoalBarrierConfiguratorFloatingWindow';
import { RewinderConfiguratorFloatingWindow } from './user/RewinderConfiguratorFloatingWindow';
import { NetworkMonitorFloatingWindow } from './user/NetworkMonitorFloatingWindow';
import { PerformanceMonitorFloatingWindow } from './user/PerformanceMonitorFloatingWindow';
import { FloatingWindowOpacityFloatingWindow } from './user/FloatingWindowOpacityFloatingWindow';

// 22 Developer Floating Windows (Canonical UI-Aligned Filenames)
import { DiagnosticDumpFloatingWindow } from './dev/DiagnosticDumpFloatingWindow';
import { StaticTrainingBallCamTunerFloatingWindow } from './dev/StaticTrainingBallCamTunerFloatingWindow';
import { NameTagTunerFloatingWindow } from './dev/NameTagTunerFloatingWindow';
import { GoalVolumeTunerFloatingWindow } from './dev/GoalVolumeTunerFloatingWindow';
import { ReplayDirectorTunerFloatingWindow } from './dev/ReplayDirectorTunerFloatingWindow';
import { ReachabilityTunerFloatingWindow } from './dev/ReachabilityTunerFloatingWindow';
import { BallTrajectoryTunerFloatingWindow } from './dev/BallTrajectoryTunerFloatingWindow';
import { VehicleModelOffsetTunerFloatingWindow } from './dev/VehicleModelOffsetTunerFloatingWindow';
import { VehicleGlobalFxTunerFloatingWindow } from './dev/VehicleGlobalFxTunerFloatingWindow';
import { ExperimentalMultiBotsFloatingWindow } from './dev/ExperimentalMultiBotsFloatingWindow';
import { ExperimentalBotPackFloatingWindow } from './dev/ExperimentalBotPackFloatingWindow';
import { AtmosphereFxTunerFloatingWindow } from './dev/AtmosphereFxTunerFloatingWindow';
import { SubsystemIsolationLabFloatingWindow } from './dev/SubsystemIsolationLabFloatingWindow';
import { KickoffTrainingFloatingWindow } from './dev/KickoffTrainingFloatingWindow';
import { EventStreamOBFloatingWindow } from './dev/EventStreamOBFloatingWindow';
import { DualArenaDeterminismHarnessFloatingWindow } from './dev/DualArenaDeterminismHarnessFloatingWindow';
import { CameraDeterminismFloatingWindow } from './dev/CameraDeterminismFloatingWindow';
import { NetworkStressInjectionFloatingWindow } from './dev/NetworkStressInjectionFloatingWindow';
import { ClockPacingTunerFloatingWindow } from './dev/ClockPacingTunerFloatingWindow';
import { BoostPadTunerFloatingWindow } from './dev/BoostPadTunerFloatingWindow';
import { DriftwoodsTunerFloatingWindow } from './dev/DriftwoodsTunerFloatingWindow';
import { SpatialAudioTunerFloatingWindow } from './dev/SpatialAudioTunerFloatingWindow';
import { EngineAudioTunerFloatingWindow } from './dev/EngineAudioTunerFloatingWindow';
import { BotsLoadoutFloatingWindow } from './dev/BotsLoadoutFloatingWindow';
import { SyncAllGhostTrainingFloatingWindow } from './dev/SyncAllGhostTrainingFloatingWindow';

export interface RenderFloatingWindowPanelOptions {
  isLight?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export interface FloatingWindowDescriptor {
  id: string;
  category: 'user' | 'developer';
  hasHeaderTabs?: boolean;
  render: (options: RenderFloatingWindowPanelOptions) => React.ReactNode;
}

/**
 * Declarative, low-coupling descriptor map for all Floating Windows.
 * Allows host applications (like RocketCompanion) to mount any floating window panel
 * via a single registry lookup without cascading switch statements.
 */
export const FLOATING_WINDOW_DESCRIPTORS: Record<string, FloatingWindowDescriptor> = {
  // --- 6 Normal User Floating Windows ---
  'replay-viewer': {
    id: 'replay-viewer',
    category: 'user',
    render: ({ isLight = false }) => <ReplayViewerFloatingWindow isLight={isLight} />,
  },
  'goal-barrier-configurator': {
    id: 'goal-barrier-configurator',
    category: 'user',
    render: ({ isLight = false }) => <GoalBarrierConfiguratorFloatingWindow isLight={isLight} />,
  },
  'rewinder-configurator': {
    id: 'rewinder-configurator',
    category: 'user',
    render: ({ isLight = false }) => <RewinderConfiguratorFloatingWindow isLight={isLight} />,
  },
  'network-monitor': {
    id: 'network-monitor',
    category: 'user',
    render: ({ isLight = false }) => <NetworkMonitorFloatingWindow isLight={isLight} />,
  },
  'performance-monitor': {
    id: 'performance-monitor',
    category: 'user',
    render: ({ isLight = false }) => <PerformanceMonitorFloatingWindow isLight={isLight} />,
  },
  'floating-window-opacity': {
    id: 'floating-window-opacity',
    category: 'user',
    render: ({ isLight = false }) => <FloatingWindowOpacityFloatingWindow isLight={isLight} />,
  },

  // --- Developer-Only Floating Windows ---
  'diagnostic-dump': {
    id: 'diagnostic-dump',
    category: 'developer',
    render: ({ isLight = false }) => <DiagnosticDumpFloatingWindow isLight={isLight} />,
  },
  'static-training-ball-cam-tuner': {
    id: 'static-training-ball-cam-tuner',
    category: 'developer',
    render: ({ isLight = false }) => <StaticTrainingBallCamTunerFloatingWindow isLight={isLight} />,
  },
  'name-tag-tuner': {
    id: 'name-tag-tuner',
    category: 'developer',
    render: ({ isLight = false }) => <NameTagTunerFloatingWindow isLight={isLight} />,
  },
  'goal-volume-tuner': {
    id: 'goal-volume-tuner',
    category: 'developer',
    render: ({ isLight = false }) => <GoalVolumeTunerFloatingWindow isLight={isLight} />,
  },
  'replay-director-tuner': {
    id: 'replay-director-tuner',
    category: 'developer',
    render: ({ isLight = false }) => <ReplayDirectorTunerFloatingWindow isLight={isLight} />,
  },
  'reachability-tuner': {
    id: 'reachability-tuner',
    category: 'developer',
    render: ({ isLight = false }) => <ReachabilityTunerFloatingWindow isLight={isLight} />,
  },
  'ball-trajectory-tuner': {
    id: 'ball-trajectory-tuner',
    category: 'developer',
    render: ({ isLight = false }) => <BallTrajectoryTunerFloatingWindow isLight={isLight} />,
  },
  'vehicle-model-offset-tuner': {
    id: 'vehicle-model-offset-tuner',
    category: 'developer',
    hasHeaderTabs: true,
    render: ({ isLight = false, activeTab, onTabChange }) => (
      <VehicleModelOffsetTunerFloatingWindow
        isLight={isLight}
        activeTab={activeTab as any}
        onTabChange={onTabChange as any}
      />
    ),
  },
  'vehicle-global-fx-tuner': {
    id: 'vehicle-global-fx-tuner',
    category: 'developer',
    hasHeaderTabs: true,
    render: ({ isLight = false, activeTab, onTabChange }) => (
      <VehicleGlobalFxTunerFloatingWindow
        isLight={isLight}
        activeTab={activeTab as any}
        onTabChange={onTabChange as any}
      />
    ),
  },
  'experimental-multi-bots': {
    id: 'experimental-multi-bots',
    category: 'developer',
    render: ({ isLight = false }) => <ExperimentalMultiBotsFloatingWindow isLight={isLight} />,
  },
  'experimental-bot-pack': {
    id: 'experimental-bot-pack',
    category: 'developer',
    render: ({ isLight = false }) => <ExperimentalBotPackFloatingWindow isLight={isLight} />,
  },
  'atmosphere-fx-tuner': {
    id: 'atmosphere-fx-tuner',
    category: 'developer',
    hasHeaderTabs: true,
    render: ({ isLight = false, activeTab, onTabChange }) => (
      <AtmosphereFxTunerFloatingWindow
        isLight={isLight}
        activeTab={activeTab as any}
        onTabChange={onTabChange as any}
      />
    ),
  },
  'subsystem-isolation-lab': {
    id: 'subsystem-isolation-lab',
    category: 'developer',
    hasHeaderTabs: true,
    render: ({ isLight = false, activeTab, onTabChange }) => (
      <SubsystemIsolationLabFloatingWindow
        isLight={isLight}
        activeTab={activeTab as any}
        onTabChange={onTabChange as any}
      />
    ),
  },
  'kickoff-training': {
    id: 'kickoff-training',
    category: 'developer',
    render: ({ isLight = false }) => <KickoffTrainingFloatingWindow isLight={isLight} />,
  },
  'event-stream-ob': {
    id: 'event-stream-ob',
    category: 'developer',
    render: ({ isLight = false }) => <EventStreamOBFloatingWindow isLight={isLight} />,
  },
  'dual-arena-determinism-harness': {
    id: 'dual-arena-determinism-harness',
    category: 'developer',
    render: ({ isLight = false }) => <DualArenaDeterminismHarnessFloatingWindow isLight={isLight} />,
  },
  'camera-determinism': {
    id: 'camera-determinism',
    category: 'developer',
    render: ({ isLight = false }) => <CameraDeterminismFloatingWindow isLight={isLight} />,
  },
  'network-stress-injection': {
    id: 'network-stress-injection',
    category: 'developer',
    render: ({ isLight = false }) => <NetworkStressInjectionFloatingWindow isLight={isLight} />,
  },
  'clock-pacing-tuner': {
    id: 'clock-pacing-tuner',
    category: 'developer',
    render: ({ isLight = false }) => <ClockPacingTunerFloatingWindow isLight={isLight} />,
  },
  'boost-pad-tuner': {
    id: 'boost-pad-tuner',
    category: 'developer',
    hasHeaderTabs: true,
    render: ({ isLight = false, activeTab, onTabChange }) => (
      <BoostPadTunerFloatingWindow
        isLight={isLight}
        activeTab={activeTab as any}
        onTabChange={onTabChange as any}
      />
    ),
  },
  'driftwoods-tuner': {
    id: 'driftwoods-tuner',
    category: 'developer',
    hasHeaderTabs: true,
    render: ({ isLight = false, activeTab, onTabChange }) => (
      <DriftwoodsTunerFloatingWindow
        isLight={isLight}
        activeTab={activeTab as any}
        onTabChange={onTabChange as any}
      />
    ),
  },
  'spatial-audio-tuner': {
    id: 'spatial-audio-tuner',
    category: 'developer',
    render: ({ isLight = false }) => <SpatialAudioTunerFloatingWindow isLight={isLight} />,
  },
  'engine-audio-tuner': {
    id: 'engine-audio-tuner',
    category: 'developer',
    render: ({ isLight = false }) => <EngineAudioTunerFloatingWindow isLight={isLight} />,
  },
  'bots-loadout': {
    id: 'bots-loadout',
    category: 'developer',
    render: ({ isLight = false }) => <BotsLoadoutFloatingWindow isLight={isLight} />,
  },
  'syncall-ghost-training': {
    id: 'syncall-ghost-training',
    category: 'developer',
    render: ({ isLight = false }) => <SyncAllGhostTrainingFloatingWindow isLight={isLight} />,
  },
};

/**
 * [L6 Floating Window Registry]
 * Maps any of the 28 `RocketCompanion` Floating Window preset IDs (6 User + 22 Developer)
 * to its normalized, low-coupling L6 Floating Window Panel.
 */
export function renderFloatingWindowPanel(
  id: string,
  options: RenderFloatingWindowPanelOptions = {}
): React.ReactNode {
  const descriptor = FLOATING_WINDOW_DESCRIPTORS[id];
  return descriptor ? descriptor.render(options) : null;
}
