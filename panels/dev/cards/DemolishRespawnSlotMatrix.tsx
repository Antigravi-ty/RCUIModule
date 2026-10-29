import React, { useState } from 'react';
import {
  Skull,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { SliderControl } from '../../../primitives/SliderControl';
import { ToggleSwitch } from '../../../primitives/ToggleSwitch';
import { SegmentedSwitch } from '../../../primitives/SegmentedSwitch';
import { Badge } from '../../../primitives/Badge';

export interface RespawnSlotMeta {
  slotIndex: number;
  code: string;
  label: string;
  coordsBlue: string;
  coordsOrange: string;
  yawBlueDeg: number;
  yawOrangeDeg: number;
}

export interface DemolishRespawnSlotMatrixProps {
  isLight?: boolean;
}

const RESPAWN_SLOTS_LEFT_TO_RIGHT: RespawnSlotMeta[] = [
  { slotIndex: 0, code: 'SLOT 0', label: 'Outer-Left', coordsBlue: '(-2560, -3840, 17)', coordsOrange: '(2560, 3840, 17)', yawBlueDeg: 90, yawOrangeDeg: -90 },
  { slotIndex: 1, code: 'SLOT 1', label: 'Inner-Left', coordsBlue: '(-2048, -4608, 17)', coordsOrange: '(2048, 4608, 17)', yawBlueDeg: 90, yawOrangeDeg: -90 },
  { slotIndex: 2, code: 'SLOT 2', label: 'Inner-Right', coordsBlue: '(2048, -4608, 17)', coordsOrange: '(-2048, 4608, 17)', yawBlueDeg: 90, yawOrangeDeg: -90 },
  { slotIndex: 3, code: 'SLOT 3', label: 'Outer-Right', coordsBlue: '(2560, -3840, 17)', coordsOrange: '(-2560, 3840, 17)', yawBlueDeg: 90, yawOrangeDeg: -90 },
];

/**
 * [L2 Compound] DemolishRespawnSlotMatrix
 * Recreates RocketCompanion's DemolishRespawnBenchPanel (7th Subsystem Isolation Lab bench):
 * - 4-Slot Left-to-Right Respawn Ghost Selector from Player Camera Perspective
 * - Rising-Edge Steer Input Simulation (← Left / Right →)
 * - Obstacle Conflict Fallback & Wheel Local Y / Handedness Telemetry Readout
 */
export const DemolishRespawnSlotMatrix: React.FC<DemolishRespawnSlotMatrixProps> = React.memo(({
  isLight = false,
}) => {
  const [team, setTeam] = useState<'blue' | 'orange'>('blue');
  const [visualId, setVisualId] = useState<string>('octane');
  const [isDemolished, setIsDemolished] = useState(true);
  const [freezeTimer, setFreezeTimer] = useState(true);
  const [autoHoldDemo, setAutoHoldDemo] = useState(true);
  const [timerDurationSec, setTimerDurationSec] = useState(3.0);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [obstacleEnabled, setObstacleEnabled] = useState(false);
  const [obstacleSlot, setObstacleSlot] = useState(1);
  const [lastEdge, setLastEdge] = useState<string>('NONE (Default Random/Inner)');

  const effectiveSlotIndex =
    obstacleEnabled && selectedSlot === obstacleSlot
      ? (selectedSlot + 1) % 4
      : selectedSlot;
  const activeMeta = RESPAWN_SLOTS_LEFT_TO_RIGHT[effectiveSlotIndex] || RESPAWN_SLOTS_LEFT_TO_RIGHT[0];

  const handleSteerEdge = (dir: 'left' | 'right') => {
    if (dir === 'left') {
      const next = selectedSlot === 0 ? 1 : 0;
      setSelectedSlot(next);
      setLastEdge(`STEER_LEFT_EDGE → ${RESPAWN_SLOTS_LEFT_TO_RIGHT[next].label}`);
    } else {
      const next = selectedSlot === 3 ? 2 : 3;
      setSelectedSlot(next);
      setLastEdge(`STEER_RIGHT_EDGE → ${RESPAWN_SLOTS_LEFT_TO_RIGHT[next].label}`);
    }
  };

  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
    : 'bg-neutral-900/60 border-neutral-800 text-neutral-200';
  const subBg = isLight
    ? 'bg-white border-neutral-200'
    : 'bg-neutral-950/75 border-neutral-800';

  return (
    <div className="flex flex-col gap-2.5">
      {/* 1. Status & Trigger Bar */}
      <div className={`p-3 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Skull className="h-4 w-4 text-rose-400" />
            <span className="font-bold text-xs">
              Demolish &amp; Respawn Ghost Isolation Bench
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={isDemolished ? 'danger' : 'success'} size="sm" isLight={isLight}>
              {isDemolished
                ? `DEMOED · GHOST @ ${activeMeta.label.toUpperCase()}`
                : 'ALIVE ON PITCH'}
            </Badge>
            <button
              type="button"
              onClick={() => setIsDemolished(true)}
              className="px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border-rose-500/35 cursor-pointer"
            >
              Trigger Demolish
            </button>
            <button
              type="button"
              onClick={() => setIsDemolished(false)}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono flex items-center gap-1 cursor-pointer ${subBg}`}
            >
              <RotateCcw className="h-2.5 w-2.5" /> Force Respawn
            </button>
          </div>
        </div>

        {/* Simulated Rising-Edge Steer Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-800">
          <span className="text-[10px] font-mono opacity-75">
            Rising-Edge Steer Input: <strong className="text-amber-500">{lastEdge}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSteerEdge('left')}
              data-footer-desc="Simulate a rising-edge Left Steer [A / ←] press during demolition countdown to toggle between Inner-Left and Outer-Left slots."
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer ${subBg} hover:border-sky-500`}
            >
              <ArrowLeft className="h-3 w-3 text-sky-400" />
              <span>Steer Left Edge [A]</span>
            </button>
            <button
              type="button"
              onClick={() => handleSteerEdge('right')}
              data-footer-desc="Simulate a rising-edge Right Steer [D / →] press during demolition countdown to toggle between Inner-Right and Outer-Right slots."
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer ${subBg} hover:border-amber-500`}
            >
              <span>Steer Right Edge [D]</span>
              <ArrowRight className="h-3 w-3 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Visual 4-Slot Left-to-Right Layout from Player Camera Perspective */}
      <div className={`p-3 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="font-bold text-sky-400">
            4-Slot Respawn Matrix (Player Camera Left → Right Perspective)
          </span>
          <span className="opacity-70">
            Team: {team.toUpperCase()} · Yaw {team === 'blue' ? '90° (+Y)' : '-90° (-Y)'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RESPAWN_SLOTS_LEFT_TO_RIGHT.map((slot) => {
            const isSelected = selectedSlot === slot.slotIndex;
            const isBlocked = obstacleEnabled && obstacleSlot === slot.slotIndex;
            const isEffective = effectiveSlotIndex === slot.slotIndex;

            return (
              <button
                key={slot.slotIndex}
                type="button"
                onClick={() => {
                  setSelectedSlot(slot.slotIndex);
                  setLastEdge(`DIRECT_SELECT → ${slot.label}`);
                }}
                data-footer-desc={`Select respawn ${slot.code} (${slot.label}) at ${
                  team === 'blue' ? slot.coordsBlue : slot.coordsOrange
                }.`}
                className={`p-2 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                  isBlocked
                    ? 'border-rose-500/60 bg-rose-500/10'
                    : isEffective
                    ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-500/10'
                    : isSelected
                    ? 'border-amber-500 bg-amber-500/10'
                    : subBg
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono font-bold text-amber-500">
                    {slot.code}
                  </span>
                  {isBlocked ? (
                    <span className="px-1 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-400">
                      BLOCKED
                    </span>
                  ) : isEffective ? (
                    <span className="px-1 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                      GHOST ACTIVE
                    </span>
                  ) : null}
                </div>
                <span className="font-bold text-xs">{slot.label}</span>
                <span className="text-[9px] font-mono opacity-65 truncate">
                  {team === 'blue' ? slot.coordsBlue : slot.coordsOrange}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Team, Vehicle Archetype, Timer Hold & Obstacle Fallback Controls */}
      <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SegmentedSwitch
            size="sm"
            value={team}
            onValueChange={(v) => setTeam(v as 'blue' | 'orange')}
            options={[
              { value: 'blue', label: 'Blue Team (-Y Backboard)' },
              { value: 'orange', label: 'Orange Team (+Y Backboard)' },
            ]}
            isLight={isLight}
          />
          <SegmentedSwitch
            size="sm"
            value={visualId}
            onValueChange={setVisualId}
            options={[
              { value: 'octane', label: 'Octane' },
              { value: 'fennec', label: 'Fennec' },
              { value: 'dominus', label: 'Dominus' },
              { value: 'hitbox-octane', label: 'Hitbox Box' },
            ]}
            isLight={isLight}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <SliderControl
            label="Respawn Countdown Duration"
            value={timerDurationSec}
            min={1.0}
            max={10.0}
            step={0.5}
            unit="s"
            editable
            colorScheme="amber"
            onChange={setTimerDurationSec}
            isLight={isLight}
          />
          <div className="flex items-center justify-between gap-2 pt-3">
            <ToggleSwitch
              checked={freezeTimer}
              onCheckedChange={setFreezeTimer}
              label="Freeze Countdown"
              isLight={isLight}
            />
            <ToggleSwitch
              checked={autoHoldDemo}
              onCheckedChange={setAutoHoldDemo}
              label="Auto-Hold Ghost"
              isLight={isLight}
            />
          </div>
        </div>

        {/* Obstacle Conflict Fallback & Handedness Telemetry */}
        <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${subBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] font-bold">
                Spawn Obstacle Conflict Fallback Probe
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ToggleSwitch
                checked={obstacleEnabled}
                onCheckedChange={setObstacleEnabled}
                label="Block Slot"
                isLight={isLight}
              />
              {obstacleEnabled && (
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setObstacleSlot(s)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                        obstacleSlot === s
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold'
                          : 'border-neutral-300 dark:border-neutral-800 opacity-65'
                      }`}
                    >
                      #{s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pt-1 border-t border-neutral-200/60 dark:border-neutral-800">
            <div>
              <span className="opacity-60 block">Effective Slot</span>
              <span className="font-bold text-emerald-400">
                #{effectiveSlotIndex} ({activeMeta.label})
              </span>
            </div>
            <div>
              <span className="opacity-60 block">Handedness Basis</span>
              <span className="font-bold text-sky-400 flex items-center gap-1">
                <Compass className="h-3 w-3" /> det(R) = +1.000
              </span>
            </div>
            <div>
              <span className="opacity-60 block">Wheel Local Y</span>
              <span className="font-bold text-amber-400">FL/FR -0.42uu (Grounded)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

DemolishRespawnSlotMatrix.displayName = 'DemolishRespawnSlotMatrix';
