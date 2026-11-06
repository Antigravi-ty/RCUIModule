import React from 'react';
import { Eye, Zap } from 'lucide-react';
import { useExperimentalMultiBotsStore } from '../../stores/experimentalMultiBotsStore';
import {
  getExpColorSwatch,
  type ExperimentalMultiBotsSlotConfig,
  type ExpPlayerParticipation,
  type ExpSpawnedCarInfo,
  type ExpSpeedMultiplier,
} from '../../stores/experimentalMultiBotsRosterUtils';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { Button } from '../../primitives/Button';
import { KeycapBadge } from '../../primitives/KeycapBadge';

export interface ExperimentalBotsCameraPovCardProps {
  isLight: boolean;
  cardBg: string;
  mutedText: string;
  playerParticipation: ExpPlayerParticipation;
  blueSlots: ExperimentalMultiBotsSlotConfig[];
  orangeSlots: ExperimentalMultiBotsSlotConfig[];
  spawnedCars: ExpSpawnedCarInfo[];
  activeCameraCarIndex: number;
  onSelectCameraCar: (carIndex: number) => void;
}

export const ExperimentalBotsCameraPovCard: React.FC<
  ExperimentalBotsCameraPovCardProps
> = ({
  isLight,
  cardBg,
  mutedText,
  playerParticipation,
  blueSlots,
  orangeSlots,
  spawnedCars,
  activeCameraCarIndex,
  onSelectCameraCar,
}) => {
  const carList =
    spawnedCars.length > 0
      ? spawnedCars
      : [
          ...blueSlots.map((s, i) => ({
            carIndex: i,
            keyNumber: i + 1,
            team: 0 as const,
            isPlayer: s.isPlayer,
            botType: s.botType,
            colorHex: getExpColorSwatch(s.colorSlot).hex,
            label: s.isPlayer ? 'PLAYER' : `${s.botType.toUpperCase()} #${i + 1}`,
          })),
          ...orangeSlots.map((s, i) => ({
            carIndex: blueSlots.length + i,
            keyNumber: blueSlots.length + i + 1,
            team: 1 as const,
            isPlayer: s.isPlayer,
            botType: s.botType,
            colorHex: getExpColorSwatch(s.colorSlot).hex,
            label: s.isPlayer
              ? 'PLAYER'
              : `${s.botType.toUpperCase()} #${blueSlots.length + i + 1}`,
          })),
        ];

  return (
    <div className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${cardBg}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-[11px] flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-amber-400" />
          <span>Camera POV Switcher (Keys 1–6)</span>
        </span>
        <span className={`text-[10px] font-mono ${mutedText}`}>
          {playerParticipation === 'none'
            ? 'Press 1-6 to switch bot POV'
            : 'Click to inspect car POV'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {carList.map((car) => {
          const isSelected = activeCameraCarIndex === car.carIndex;
          return (
            <button
              key={car.carIndex}
              type="button"
              onClick={() => onSelectCameraCar(car.carIndex)}
              className={`px-2 py-1.5 rounded-lg border flex items-center gap-1.5 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                  : isLight
                    ? 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                    : 'bg-neutral-900/70 hover:bg-neutral-800 border-neutral-700/70 text-neutral-300'
              }`}
            >
              <KeycapBadge label={String(car.keyNumber)} size="sm" isLight={isLight} />
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: car.colorHex }}
              />
              <span className="text-[10px] font-mono truncate">{car.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export interface ExperimentalBotsMatchControlsStateOverride {
  blueScore?: number;
  orangeScore?: number;
  remainingSec?: number;
  isOvertime?: boolean;
  matchPhase?: string;
  matchDurationSec?: number;
  speedMultiplier?: ExpSpeedMultiplier;
  unlimitedBoost?: boolean;
  disableGoalReplay?: boolean;
  onSetMatchDurationSec?: (sec: number) => void;
  onSetSpeedMultiplier?: (mult: ExpSpeedMultiplier) => void;
  onSetUnlimitedBoost?: (val: boolean) => void;
  onSetDisableGoalReplay?: (val: boolean) => void;
  onTriggerSandboxAction?: (
    action: 'reset_kickoff' | 'score_blue' | 'score_orange' | 'force_overtime' | 'end_match'
  ) => void;
}

export interface ExperimentalBotsMatchControlsCardProps {
  isLight: boolean;
  cardBg: string;
  mutedText: string;
  stateOverride?: ExperimentalBotsMatchControlsStateOverride;
}

export const ExperimentalBotsMatchControlsCard: React.FC<
  ExperimentalBotsMatchControlsCardProps
> = ({
  isLight,
  cardBg,
  mutedText,
  stateOverride,
}) => {
  const store = useExperimentalMultiBotsStore();
  const blueScore = stateOverride?.blueScore ?? store.blueScore;
  const orangeScore = stateOverride?.orangeScore ?? store.orangeScore;
  const remainingSec = stateOverride?.remainingSec ?? store.remainingSec;
  const isOvertime = stateOverride?.isOvertime ?? store.isOvertime;
  const matchPhase = stateOverride?.matchPhase ?? store.matchPhase;
  const matchDurationSec = stateOverride?.matchDurationSec ?? store.matchDurationSec;
  const speedMultiplier = stateOverride?.speedMultiplier ?? store.speedMultiplier;
  const unlimitedBoost = stateOverride?.unlimitedBoost ?? store.unlimitedBoost;
  const disableGoalReplay = stateOverride?.disableGoalReplay ?? store.disableGoalReplay;
  const onSetMatchDurationSec = stateOverride?.onSetMatchDurationSec ?? store.setMatchDurationSec;
  const onSetSpeedMultiplier = stateOverride?.onSetSpeedMultiplier ?? store.setSpeedMultiplier;
  const onSetUnlimitedBoost = stateOverride?.onSetUnlimitedBoost ?? store.setUnlimitedBoost;
  const onSetDisableGoalReplay = stateOverride?.onSetDisableGoalReplay ?? store.setDisableGoalReplay;
  const onTriggerSandboxAction = stateOverride?.onTriggerSandboxAction ?? store.triggerSandboxAction;

  const formatClock = (sec: number) => {
    const abs = Math.max(0, Math.floor(sec));
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return `${isOvertime ? '+' : ''}${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-[11px] flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span>Match Telemetry &amp; Controls</span>
        </span>
        <span className="text-[11px] font-mono font-bold text-amber-400">
          Blue {blueScore} — {orangeScore} Orange · {formatClock(remainingSec)} ({matchPhase})
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] ${mutedText}`}>Match Duration</span>
        <SegmentedSwitch
          value={String(matchDurationSec)}
          onChange={(v) => onSetMatchDurationSec(Number(v))}
          options={[
            { value: '90', label: '1:30' },
            { value: '180', label: '3:00' },
            { value: '300', label: '5:00' },
            { value: '600', label: '10:00' },
          ]}
          size="sm"
          isLight={isLight}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] ${mutedText}`}>Simulation Speed</span>
        <SegmentedSwitch
          value={String(speedMultiplier)}
          onChange={(v) => onSetSpeedMultiplier(Number(v) as ExpSpeedMultiplier)}
          options={[
            { value: '100', label: '1x' },
            { value: '200', label: '2x' },
            { value: '300', label: '3x' },
            { value: '400', label: '4x' },
          ]}
          size="sm"
          isLight={isLight}
        />
      </div>

      <div className="flex items-center justify-between gap-4 pt-0.5">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] ${mutedText}`}>Unlimited Boost</span>
          <ToggleSwitch
            checked={unlimitedBoost}
            onChange={(v) => onSetUnlimitedBoost(v)}
            isLight={isLight}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] ${mutedText}`}>Fast Goal Reset</span>
          <ToggleSwitch
            checked={disableGoalReplay}
            onChange={(v) => onSetDisableGoalReplay(v)}
            isLight={isLight}
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5 pt-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onTriggerSandboxAction('reset_kickoff')}
          isLight={isLight}
          className="text-[10px] py-1"
        >
          Reset Kickoff
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onTriggerSandboxAction('score_blue')}
          isLight={isLight}
          className="text-[10px] py-1"
        >
          +1 Blue Goal
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onTriggerSandboxAction('score_orange')}
          isLight={isLight}
          className="text-[10px] py-1"
        >
          +1 Orange Goal
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onTriggerSandboxAction('force_overtime')}
          isLight={isLight}
          className="text-[10px] py-1"
        >
          Force OT
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onTriggerSandboxAction('end_match')}
          isLight={isLight}
          className="text-[10px] py-1"
        >
          End Match
        </Button>
      </div>
    </div>
  );
};
