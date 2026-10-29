import React, { useState } from 'react';
import { useLayer3DevSubsystemIsolationStoreBinding } from './hooks/useDevRecipesStoreBindings';
import {
  Bot,
  Radio,
  Layers,
  History,
  Zap,
  Film,
  Swords,
  Skull,
  Play,
  Info,
} from 'lucide-react';
import {
  PanelContainer,
  PanelHeader,
  PanelContent,
  PanelFooter,
} from '../layout/Panel';
import { SettingActionRow } from '../compounds/SettingActionRow';
import { useMenuLayoutStore, DEFAULT_PANEL_SIZING } from '../stores/menuLayoutStore';
import type { PanelSizingConfig } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import { floatingStore } from '../stores/floatingStore';
import {
  SUBSYSTEM_ISOLATION_LAB_PRESET,
  EXPERIMENTAL_MULTI_BOTS_PRESET,
} from '../stores/floatingPresets';

export type DevTestLabTab =
  | 'probes'
  | 'dual-world'
  | 'state-replay'
  | 'incident-match'
  | 'goal-replay'
  | 'kickoff-duel'
  | 'demolish-respawn'
  | 'exp-multi-bots';

export interface Layer3DevSubsystemIsolationRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  activeBenchId?: DevTestLabTab | null;
  onEnterBench?: (tab: DevTestLabTab) => void;
  onLaunchIsolationTab?: (tab: DevTestLabTab) => void;
  onNavigateSubsystemIsolation?: () => void;
  onNavigateMultiBots?: () => void;
  onNavigateExpMultiBots?: () => void;
  sizing?: PanelSizingConfig;
}

interface SubsystemCardMeta {
  id: DevTestLabTab;
  title: string;
  summary: string;
  details: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
}

const SUBSYSTEM_BENCHES: SubsystemCardMeta[] = [
  {
    id: 'probes',
    title: 'Physics & Hover Probes',
    summary: 'Verify isolated angular torque (0G QE) and 1G vertical PID hover control.',
    details:
      'Physics & Hover Probes (0G QE · 1G Z-Hover): Isolates vehicle rigid-body attitude control and PID thrust stabilization before full arena flight tests.',
    icon: Radio,
    iconColor: 'text-amber-400',
  },
  {
    id: 'dual-world',
    title: 'Multi-World Ghost Isolation',
    summary: 'Run 2 to 4 independent RocketSim physics worlds rendered simultaneously as ghosts.',
    details:
      'Multi-World Ghost Isolation (2..4 Parallel Worlds): Verifies multi-instance WASM memory isolation, independent tick stepping, and ghost vehicle visual synchronization.',
    icon: Layers,
    iconColor: 'text-sky-400',
  },
  {
    id: 'state-replay',
    title: 'State Replay & TAS Rewinder',
    summary: 'Record 120Hz physics snapshots, scrub backward/forward, import/export & resume.',
    details:
      'State Replay & TAS Rewinder (RingBuffer · Scrubbing): Verifies deterministic RocketSim snapshot serialization, timeline scrubbing ([ / ]), and countdown takeover.',
    icon: History,
    iconColor: 'text-emerald-400',
  },
  {
    id: 'incident-match',
    title: '90s Match & Overtime MVP',
    summary: 'Verify regulation clock countdown, 0:00 airborne ball hold, and Overtime sudden death.',
    details:
      '90s Match & Overtime MVP (MatchController · OT): Isolates match state machine transitions, kickoff countdown freezes, and sudden-death victory triggers.',
    icon: Zap,
    iconColor: 'text-purple-400',
  },
  {
    id: 'goal-replay',
    title: 'Goal Incident Replay & Podium',
    summary: 'Test goal explosion delay, focal director replay with touch slow-mo, and MVP podium.',
    details:
      'Goal Incident Replay & Podium (Director Cam · Slow-Mo): Verifies ReplayTimelineController camera lookahead on scoring touches, speed ramps, and post-match celebration.',
    icon: Film,
    iconColor: 'text-rose-400',
  },
  {
    id: 'kickoff-duel',
    title: '4-Model Kickoff Duel Bench',
    summary: 'Benchmark Nexto, Necto, Kickoff PPO & Speedflip across all 5 kickoff spawn slots.',
    details:
      '4-Model Kickoff Duel Bench (10 Pairings × 5 Slots): Verifies SafeTensors model inference, kickoff spawn mirroring, and per-tick action diagnostics.',
    icon: Swords,
    iconColor: 'text-orange-400',
  },
  {
    id: 'demolish-respawn',
    title: 'Demolish & Respawn Ghost Bench',
    summary: 'Simulate demolish countdown, Left (A) / Right (D) slot selection, and ghost wheel placement.',
    details:
      'Demolish & Respawn Ghost Bench (Left/Right · Ghost Wheels): Isolates left-handed coordinate spawn slot mapping (0..3), RespawnGhostPreview wheel suspension height, and conflict fallback.',
    icon: Skull,
    iconColor: 'text-red-400',
  },
  {
    id: 'exp-multi-bots',
    title: 'Experimental Multiple Bots Mode',
    summary: 'Configure Blue & Orange rosters up to 3v3 with Native SafeTensors Nexto & Necto bots.',
    details:
      'Experimental Multiple Bots Mode (Up to 3v3 · Native SafeTensors): Multi-agent Nexto & Necto bot rosters, team & time config, and live POV switching (Keys 1–6).',
    icon: Bot,
    iconColor: 'text-emerald-400',
  },
];

/**
 * [Recipe] Layer 3 Sandboxes — Isolated Subsystem Selector
 * Unified borderless single-line SettingActionRow list with tinted leading icons and inline [Play + Enter] buttons.
 */
export const Layer3DevSubsystemIsolationRecipe: React.FC<Layer3DevSubsystemIsolationRecipeProps> = (rawProps) => {
  const {
  isLight = false,
  onBack,
  activeBenchId = null,
  onEnterBench,
  onLaunchIsolationTab,
  onNavigateExpMultiBots,
  sizing: propSizing,
} = useLayer3DevSubsystemIsolationStoreBinding(rawProps);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const storeSizing = useMenuLayoutStore(
    (s) =>
      s.panels?.['layer3-dev-subsystem-isolation'] ??
      DEFAULT_PANEL_SIZING['layer3-dev-subsystem-isolation']
  );
  const sizing = propSizing ?? storeSizing;

  const {
    rowGap,
    buttonFontSize,
    buttonPaddingX,
    buttonPaddingY,
    buttonRadius,
  } = useSettingActionRowStore();

  const handleLaunchSubsystem = (
    tab: DevTestLabTab,
    sourceEl?: HTMLElement | null
  ) => {
    if (tab === 'exp-multi-bots' && onNavigateExpMultiBots) {
      onNavigateExpMultiBots();
      return;
    }

    const targetPreset =
      tab === 'exp-multi-bots'
        ? EXPERIMENTAL_MULTI_BOTS_PRESET
        : SUBSYSTEM_ISOLATION_LAB_PRESET;

    floatingStore.setOpacity(70);
    const snap = floatingStore.getSnapshot();
    const exists =
      snap.windows.some((w) => w.id === targetPreset.id) ||
      snap.activeFlight?.preset?.id === targetPreset.id;
    if (!exists && typeof document !== 'undefined') {
      const containerEl =
        document.getElementById('game-ui-viewport-host') || document.body;
      if (sourceEl && containerEl) {
        floatingStore.spawnWithFlight(
          targetPreset,
          sourceEl,
          containerEl
        );
      } else {
        floatingStore.spawnWindow({
          ...targetPreset,
          startMinimized: true,
        });
      }
    }
    if (onEnterBench) {
      onEnterBench(tab);
    } else {
      onLaunchIsolationTab?.(tab);
    }
  };

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full">
      <PanelHeader title="SANDBOXES" onBack={onBack} isLight={isLight} />

      <PanelContent scrollable>
        <div
          data-layout="sandboxes-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          {SUBSYSTEM_BENCHES.map((bench) => {
            const isRunning = activeBenchId === bench.id;
            return (
              <SettingActionRow
                key={bench.id}
                icon={bench.icon}
                iconColor={bench.iconColor}
                title={bench.title}
                description={bench.summary}
                bordered={false}
                showDescription={false}
                hoverDescription={bench.details}
                onAction={() => handleLaunchSubsystem(bench.id)}
                onHover={setHoveredDesc}
                onLeave={() => setHoveredDesc(null)}
                isLight={isLight}
                rightSlot={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLaunchSubsystem(bench.id, e.currentTarget);
                    }}
                    style={{
                      fontSize: `${buttonFontSize}px`,
                      paddingLeft: `${buttonPaddingX}px`,
                      paddingRight: `${buttonPaddingX}px`,
                      paddingTop: `${buttonPaddingY}px`,
                      paddingBottom: `${buttonPaddingY}px`,
                      borderRadius: `${Math.max(0, buttonRadius)}px`,
                    }}
                    className={`shrink-0 font-semibold border transition-all duration-150 cursor-pointer inline-flex items-center gap-1.5 leading-tight active:scale-95 whitespace-nowrap ${
                      isLight
                        ? 'bg-neutral-200/60 group-hover:bg-neutral-200/95 hover:!bg-neutral-300/90 border-neutral-300/80 text-neutral-800'
                        : 'bg-white/[0.06] group-hover:bg-white/[0.11] hover:!bg-white/[0.16] border-white/[0.10] group-hover:border-white/[0.16] text-neutral-200'
                    }`}
                  >
                    <Play
                      style={{
                        width: `${Math.max(11, buttonFontSize)}px`,
                        height: `${Math.max(11, buttonFontSize)}px`,
                      }}
                      className="fill-current shrink-0"
                    />
                    <span>{isRunning ? 'Restart' : 'Enter'}</span>
                  </button>
                }
              />
            );
          })}
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Select an isolated subsystem to enter its dedicated test environment."
        hoveredDescription={hoveredDesc}
        icon={<Info className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
      />
    </PanelContainer>
  );
};
