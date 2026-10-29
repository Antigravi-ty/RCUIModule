import React, { useState } from 'react';
import { RotateCcw, Gauge, Eye, Keyboard, Sparkles, Play } from 'lucide-react';
import { SliderControl } from '../../primitives/SliderControl';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { Badge } from '../../primitives/Badge';
import { Button } from '../../primitives/Button';
import { quickNotification } from '../../tokens/quickNotificationStore';

const KICKOFF_SPAWNS = [
  { id: 'diag-right', index: 0, key: '1', shortLabel: 'Diag R', label: '1 · Diagonal Right' },
  { id: 'diag-left', index: 1, key: '2', shortLabel: 'Diag L', label: '2 · Diagonal Left' },
  { id: 'back-center', index: 2, key: '3', shortLabel: 'Center', label: '3 · Back Center' },
  { id: 'back-right', index: 3, key: '4', shortLabel: 'Back R', label: '4 · Back Off-Center Right' },
  { id: 'back-left', index: 4, key: '5', shortLabel: 'Back L', label: '5 · Back Off-Center Left' },
];

/**
 * 12. [Dev] Kickoff Spawn Slot & Mirror Configurator (`kickoff-training-config`)
 * Standalone L6 Floating Window Panel — 5-Slot Spawn Selector, Sub-Modes, Speed N/120Hz, Ghost/Solid Mode & First-Touch Benchmark.
 */
export const KickoffTrainingFloatingWindow: React.FC<{ isLight?: boolean }> = React.memo(({ isLight = false }) => {
  const [isInKickoffTraining, setIsInKickoffTraining] = useState(true);
  const [spawnIndex, setSpawnIndex] = useState(0);
  const [subMode, setSubMode] = useState<'instant' | 'easy-learning' | 'realistic'>('instant');
  const [realisticWaitTicks, setRealisticWaitTicks] = useState(180);
  const [speedPreset, setSpeedPreset] = useState<'100' | '50' | '25' | '75' | 'custom'>('100');
  const [customPhysicsRate, setCustomPhysicsRate] = useState(90);
  const [ghostPlacement, setGhostPlacement] = useState<'same' | 'opposite'>('same');
  const [ghostModeEnabled, setGhostModeEnabled] = useState(true);
  const [showGhostCar, setShowGhostCar] = useState(true);
  const [showGhostBall, setShowGhostBall] = useState(true);
  const [showKeyboardOverlay, setShowKeyboardOverlay] = useState(true);
  const [showFallingNotes, setShowFallingNotes] = useState(true);

  const isSameSideSolid = !ghostModeEnabled && ghostPlacement === 'same';
  const effectivePhysicsRate =
    speedPreset === 'custom'
      ? customPhysicsRate
      : Math.round((Number(speedPreset) / 100) * 120);

  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
    : 'bg-neutral-900/60 border-neutral-800 text-neutral-200';
  const subPanelBg = isLight
    ? 'bg-white border-neutral-200 text-neutral-800'
    : 'bg-neutral-950/50 border-neutral-800 text-neutral-200';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  return (
    <div className="p-3.5 flex flex-col gap-2.5 text-xs select-none">
      {/* Mode Status & Quick Launch / Reset Header */}
      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${cardBg}`}>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                isInKickoffTraining ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-bold text-xs truncate">
              {isInKickoffTraining ? 'Kickoff Training Active' : 'Kickoff Training Standby'}
            </span>
          </div>
          <span className={`text-[10px] font-mono truncate mt-0.5 ${mutedText}`}>
            {isInKickoffTraining
              ? 'Phase: SPRINT · Tick #144 (Step #36)'
              : 'Click Enter Mode to activate PPO Kickoff Training'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setIsInKickoffTraining(true);
              quickNotification.info('Reset Kickoff Spawn episode (R).');
            }}
            isLight={isLight}
          >
            {isInKickoffTraining ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 mr-1 inline" />
                <span>Reset</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 mr-1 inline fill-current" />
                <span>Enter Mode</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 1. Kickoff Spawn Position Selector (Hotkeys 1-5) */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <span className={`font-semibold text-[11px] uppercase tracking-wider ${mutedText}`}>
            Kickoff Spawn Position (Hotkeys 1–5)
          </span>
          <Badge variant="default" isLight={isLight}>
            {isSameSideSolid
              ? `You: ${KICKOFF_SPAWNS[spawnIndex]?.shortLabel} · AI: ${KICKOFF_SPAWNS[4 - spawnIndex]?.shortLabel}`
              : KICKOFF_SPAWNS[spawnIndex]?.label}
          </Badge>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {KICKOFF_SPAWNS.map((sp) => {
            const active = sp.index === spawnIndex;
            const disabled = isSameSideSolid && sp.index === 2;
            return (
              <button
                key={sp.id}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setSpawnIndex(sp.index)}
                className={`py-1.5 px-1 rounded-lg border font-mono text-[11px] font-bold flex flex-col items-center justify-center transition-all ${
                  disabled
                    ? 'opacity-40 cursor-not-allowed border-neutral-700/40'
                    : active
                    ? isLight
                      ? 'bg-neutral-900 border-neutral-900 text-white cursor-pointer'
                      : 'bg-white border-white text-neutral-950 cursor-pointer'
                    : isLight
                    ? 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700 cursor-pointer'
                    : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700 text-neutral-300 cursor-pointer'
                }`}
              >
                <span className="text-xs font-black">{sp.key}</span>
                <span className="text-[9px] opacity-75">{disabled ? 'N/A' : sp.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Kickoff Sub-Mode Selector (Instant / Easy Learning / Realistic) */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span className="font-semibold text-[11px]">Training Sub-Mode</span>
          </div>
          <Badge variant="info" isLight={isLight}>
            {subMode.toUpperCase()}
          </Badge>
        </div>

        <SegmentedSwitch
          value={subMode}
          size="sm"
          isLight={isLight}
          onValueChange={(val) => setSubMode(val as typeof subMode)}
          options={[
            { value: 'instant', label: 'Instant' },
            { value: 'easy-learning', label: 'Easy Learning' },
            { value: 'realistic', label: 'Realistic' },
          ]}
        />

        <p className={`text-[10px] leading-relaxed ${mutedText}`}>
          {subMode === 'instant' &&
            'Settles suspension via stepSilent(30), advances frame ID, and launches player + AI simultaneously on your first key press.'}
          {subMode === 'easy-learning' &&
            'Pauses physics whenever your input differs from the PPO model; match the highlighted keys to advance frame-by-frame.'}
          {subMode === 'realistic' &&
            'Runs a configurable KICKOFF_WILL_START countdown (in 0.25s / 30-frame steps up to 4.0s) before unlocking controls.'}
        </p>

        {subMode === 'realistic' && (
          <div className={`p-2.5 rounded-lg border ${subPanelBg}`}>
            <SliderControl
              label={`Countdown Wait (${(realisticWaitTicks / 120).toFixed(2)}s)`}
              description="Step: 0.25s (30 frames) · Max: 4.00s (480 frames)"
              value={realisticWaitTicks}
              min={30}
              max={480}
              step={30}
              unit="f"
              onChange={setRealisticWaitTicks}
              isLight={isLight}
            />
          </div>
        )}
      </div>

      {/* 3. Speed Control Segmented Control: 100% | 50% | 25% | 75% | Custom */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-semibold text-[11px]">Simulation Speed (N / 120 Hz)</span>
          </div>
          <Badge variant="default" isLight={isLight}>
            {effectivePhysicsRate}/120 ({((effectivePhysicsRate / 120) * 100).toFixed(1)}%)
          </Badge>
        </div>

        <SegmentedSwitch
          value={speedPreset}
          size="sm"
          isLight={isLight}
          onValueChange={(val) => setSpeedPreset(val as typeof speedPreset)}
          options={[
            { value: '100', label: '100%' },
            { value: '50', label: '50%' },
            { value: '25', label: '25%' },
            { value: '75', label: '75%' },
            { value: 'custom', label: 'Custom' },
          ]}
        />

        {speedPreset === 'custom' && (
          <div className={`p-2.5 rounded-lg border ${subPanelBg}`}>
            <SliderControl
              label={`Custom Rate (${((customPhysicsRate / 120) * 100).toFixed(1)}%)`}
              description="Exact 1/120 integer multiple (30Hz AI decision = 4 ticks)"
              value={customPhysicsRate}
              min={1}
              max={120}
              step={1}
              unit="/120"
              onChange={setCustomPhysicsRate}
              isLight={isLight}
            />
          </div>
        )}
      </div>

      {/* 4. Ghost Placement & Overlay Toggles */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-sky-400" />
            <span className="font-semibold text-[11px]">AI Ghost / Solid Opponent &amp; Overlay</span>
          </div>
          <span className={`font-mono text-[10px] ${mutedText}`}>Target: W + Boost + AirRollL</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className={`font-semibold ${mutedText}`}>AI Spawn Side</span>
            <span className={`font-mono ${mutedText}`}>
              {ghostPlacement === 'same'
                ? ghostModeEnabled
                  ? 'Same Position (Overlap)'
                  : `Mirror Partner (${KICKOFF_SPAWNS[spawnIndex]?.shortLabel} ↔ ${KICKOFF_SPAWNS[4 - spawnIndex]?.shortLabel})`
                : 'Opposite Half (180°)'}
            </span>
          </div>
          <SegmentedSwitch
            value={ghostPlacement}
            size="sm"
            isLight={isLight}
            onValueChange={(val) => setGhostPlacement(val as 'same' | 'opposite')}
            options={[
              { value: 'same', label: 'Same Position' },
              { value: 'opposite', label: 'Opposite Side' },
            ]}
          />
        </div>

        <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${subPanelBg}`}>
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[11px] font-semibold">
              {ghostModeEnabled ? 'Ghost Mode (No Collision)' : 'Solid Car Mode (Physical Collision)'}
            </span>
            <span className={`text-[9px] leading-tight truncate ${mutedText}`}>
              {ghostModeEnabled
                ? 'Translucent ghost car & ball in isolated world'
                : ghostPlacement === 'opposite'
                ? '1v1 physical kickoff: block/dunk or test slow kickoff'
                : 'Same-side physical kickoff (1↔5, 2↔4; pos 3 disabled)'}
            </span>
          </div>
          <ToggleSwitch checked={ghostModeEnabled} onCheckedChange={setGhostModeEnabled} isLight={isLight} />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${subPanelBg} ${
              !ghostModeEnabled ? 'opacity-50' : ''
            }`}
          >
            <span className="text-[11px] font-medium">Ghost Car Mesh</span>
            <ToggleSwitch
              checked={showGhostCar}
              onCheckedChange={setShowGhostCar}
              disabled={!ghostModeEnabled}
              isLight={isLight}
            />
          </div>

          <div
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${subPanelBg} ${
              !ghostModeEnabled ? 'opacity-50' : ''
            }`}
          >
            <span className="text-[11px] font-medium">Ghost Ball + Trail</span>
            <ToggleSwitch
              checked={showGhostBall}
              onCheckedChange={setShowGhostBall}
              disabled={!ghostModeEnabled}
              isLight={isLight}
            />
          </div>

          <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${subPanelBg}`}>
            <span className="text-[11px] font-medium flex items-center gap-1">
              <Keyboard className="h-3 w-3 text-emerald-400" />
              <span>Key Overlay</span>
            </span>
            <ToggleSwitch checked={showKeyboardOverlay} onCheckedChange={setShowKeyboardOverlay} isLight={isLight} />
          </div>

          <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${subPanelBg}`}>
            <span className="text-[11px] font-medium">Falling Notes</span>
            <ToggleSwitch checked={showFallingNotes} onCheckedChange={setShowFallingNotes} isLight={isLight} />
          </div>
        </div>
      </div>

      {/* Live First-Touch Benchmark Footer */}
      <div className={`px-3 py-2 rounded-xl border font-mono text-[10px] flex items-center justify-between ${cardBg}`}>
        <span>
          PPO AI Touch: <strong className="text-sky-400">1.875s (225f)</strong>
        </span>
        <span>
          Your Touch: <strong className="text-emerald-400">1.867s (224f · -1f Faster)</strong>
        </span>
      </div>
    </div>
  );
});
KickoffTrainingFloatingWindow.displayName = 'KickoffTrainingFloatingWindow';
