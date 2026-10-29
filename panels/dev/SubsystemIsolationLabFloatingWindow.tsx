import React, { useState } from 'react';
import { FlaskConical, Play } from 'lucide-react';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { Badge } from '../../primitives/Badge';
import { Button } from '../../primitives/Button';
import { SliderControl } from '../../primitives/SliderControl';
import { KickoffDuelMatrixCard } from '../../compounds/KickoffDuelMatrixCard';
import { DemolishRespawnSlotMatrix } from './cards/DemolishRespawnSlotMatrix';
import { MultiTrackReplayTimeline } from '../../charts/MultiTrackReplayTimeline';
import { quickNotification } from '../../tokens/quickNotificationStore';

const SUBSYSTEM_BENCHES = [
  {
    id: 'probes',
    title: 'Bench 1 · 120Hz Physics & Raycast Probes',
    desc: 'Fires deterministic raycast bundles against arena curveline meshes & goalposts to verify normal continuity.',
    metrics: ['Normals Error: 0.0000°', 'Raycast Cost: 18 µs', 'Substeps: 4 / tick'],
  },
  {
    id: 'dual-world',
    title: 'Bench 2 · Multi-World Ghost Isolation',
    desc: 'Runs two independent WASM Bullet3 worlds in parallel (Primary Arena vs Translucent Ghost Horizon).',
    metrics: ['World A Hash: 0x9F4A2C01', 'World B Hash: 0x9F4A2C01', 'Heap Overhead: +1.8 MB'],
  },
  {
    id: 'state-replay',
    title: 'Bench 3 · Deterministic State Snapshot Replay',
    desc: 'Serializes and restores full 30-second ring buffer snapshots and verifies zero bit-drift after 3,600 ticks.',
    metrics: ['Snapshot Size: 1,420 B', 'Restore Latency: 42 µs', 'Bitwise Match: 100%'],
  },
  {
    id: 'incident-match',
    title: 'Bench 4 · 90s High-Density Incident Stress Match',
    desc: 'Spawns 6 bots in a 90s accelerated match to stress-test demolition particles, boost pickup events, and audio voice stealing.',
    metrics: ['Active Voices: 24 / 32', 'Demo Pool: 0 Allocs', 'Frame P99: 4.8 ms'],
  },
  {
    id: 'goal-replay',
    title: 'Bench 5 · Goal Replay Transition State Machine',
    desc: 'Isolates goal explosion impulse -> 3.5s slomo replay cut -> podium/kickoff respawn transition choreography.',
    metrics: ['Transition Drift: 0 ticks', 'Director Cut: Smooth', 'Audio Ducking: -6.0 dB'],
  },
] as const;

/**
 * 11. [Dev] Subsystem Isolation Lab (`subsystem-isolation-lab`)
 * Standalone L6 Floating Window Panel — 7 isolated benches including `KickoffDuelMatrixCard` & `DemolishRespawnSlotMatrix`.
 */
export const SubsystemIsolationLabFloatingWindow: React.FC<{
  isLight?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}> = React.memo(({ isLight = false, activeTab = 'probes', onTabChange }) => {
  const [benchRunning, setBenchRunning] = useState(true);
  const [stepTicks, setStepTicks] = useState(120);
  const [ghostCount, setGhostCount] = useState(3);
  const [autoVerifyHash, setAutoVerifyHash] = useState(true);

  const activeBench = SUBSYSTEM_BENCHES.find((b) => b.id === activeTab) ?? SUBSYSTEM_BENCHES[0];

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      {onTabChange && (
        <SegmentedSwitch
          value={activeTab}
          onValueChange={onTabChange}
          options={[
            { value: 'probes', label: 'Probes' },
            { value: 'dual-world', label: 'Multi Ghost' },
            { value: 'state-replay', label: 'State Replay' },
            { value: 'incident-match', label: '90s Match' },
            { value: 'goal-replay', label: 'Goal Replay' },
            { value: 'kickoff-duel', label: 'Kickoff Duel' },
            { value: 'demolish-respawn', label: 'Demolish & Respawn' },
          ]}
          size="sm"
          isLight={isLight}
        />
      )}

      {activeTab === 'kickoff-duel' ? (
        <KickoffDuelMatrixCard isLight={isLight} />
      ) : activeTab === 'demolish-respawn' ? (
        <DemolishRespawnSlotMatrix isLight={isLight} />
      ) : (
        <div
          className={`p-3.5 rounded-xl border flex flex-col gap-3 ${
            isLight ? 'bg-neutral-50 border-neutral-200 text-neutral-800' : 'bg-neutral-900/70 border-neutral-800 text-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-emerald-500" />
              <span className="font-bold text-xs">{activeBench.title}</span>
            </div>
            <Badge variant={benchRunning ? 'success' : 'warning'} isLight={isLight}>
              {benchRunning ? 'ISOLATED HARNESS ACTIVE' : 'PAUSED'}
            </Badge>
          </div>

          <p className="text-[11px] opacity-75 leading-relaxed">{activeBench.desc}</p>

          <div className="grid grid-cols-3 gap-2">
            {activeBench.metrics.map((m) => (
              <div
                key={m}
                className={`px-2.5 py-2 rounded-lg border font-mono text-[10px] font-semibold ${
                  isLight ? 'bg-white border-neutral-200 text-neutral-700' : 'bg-neutral-950 border-neutral-800 text-emerald-400'
                }`}
              >
                {m}
              </div>
            ))}
          </div>

          {activeTab === 'state-replay' && (
            <MultiTrackReplayTimeline
              fileName="Bench3_StateSnapshot_3600f.rcreplay"
              totalFrames={3600}
              initialCursorFrame={1440}
              isLight={isLight}
            />
          )}

          {activeTab === 'dual-world' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <SliderControl
                label="Parallel Ghost Worlds"
                value={ghostCount}
                min={1}
                max={8}
                step={1}
                defaultValue={3}
                onChange={setGhostCount}
                isLight={isLight}
              />
              <SliderControl
                label="Horizon Rollout Ticks"
                value={stepTicks}
                min={30}
                max={360}
                step={30}
                defaultValue={120}
                onChange={setStepTicks}
                isLight={isLight}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-500/15">
            <div className="flex items-center gap-3">
              <ToggleSwitch
                label="Run Isolated Tick Loop"
                checked={benchRunning}
                onCheckedChange={setBenchRunning}
                isLight={isLight}
              />
              <ToggleSwitch
                label="Auto-Verify State Hash"
                checked={autoVerifyHash}
                onCheckedChange={setAutoVerifyHash}
                isLight={isLight}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => quickNotification.info(`Reset ${activeBench.title} state.`)}
                isLight={isLight}
              >
                Reset Bench
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => quickNotification.success(`Executed 1,200-tick verification pass on ${activeBench.title}.`)}
                isLight={isLight}
              >
                <Play className="h-3.5 w-3.5 mr-1 inline" />
                Run 10s Verification
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
SubsystemIsolationLabFloatingWindow.displayName = 'SubsystemIsolationLabFloatingWindow';
