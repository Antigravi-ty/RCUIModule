import React, { useState } from 'react';
import { Play, Eye, RotateCcw, Zap, Users } from 'lucide-react';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { Badge } from '../../primitives/Badge';
import { Button } from '../../primitives/Button';
import { KeycapBadge } from '../../primitives/KeycapBadge';
import { TeamRosterCard, DEFAULT_BLUE_TEAM_SLOTS, DEFAULT_ORANGE_TEAM_SLOTS, TeamRosterSlotConfig, BotPolicyId, DEFAULT_CAR_COLOR_PALETTE } from '../../compounds/TeamRosterCard';
import { quickNotification } from '../../tokens/quickNotificationStore';

/**
 * 9. [Dev] Experimental Multi-Bots Roster (`experimental-multi-bots`)
 * Standalone L6 Floating Window Panel — uses L3 `TeamRosterCard` + SafeTensors Telemetry + POV Switcher + Match Controls.
 */
export const ExperimentalMultiBotsFloatingWindow: React.FC<{ isLight?: boolean }> = React.memo(({ isLight = false }) => {
  const [isInExpMode, setIsInExpMode] = useState(true);
  const [playerParticipation, setPlayerParticipation] = useState<'none' | 'blue' | 'orange'>('none');
  const [blueSlots, setBlueSlots] = useState<TeamRosterSlotConfig[]>(DEFAULT_BLUE_TEAM_SLOTS);
  const [orangeSlots, setOrangeSlots] = useState<TeamRosterSlotConfig[]>(DEFAULT_ORANGE_TEAM_SLOTS);
  const [activeCamCar, setActiveCamCar] = useState<number>(0);
  const [matchDurationSec, setMatchDurationSec] = useState<number>(300);
  const [speedMultiplier, setSpeedMultiplier] = useState<'100' | '200' | '300' | '400'>('100');
  const [unlimitedBoost, setUnlimitedBoost] = useState(false);
  const [fastGoalReset, setFastGoalReset] = useState(false);
  const [blueScore, setBlueScore] = useState(2);
  const [orangeScore, setOrangeScore] = useState(1);
  const [isOvertime, setIsOvertime] = useState(false);

  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
    : 'bg-neutral-900/60 border-neutral-800 text-neutral-200';
  const subPanelBg = isLight
    ? 'bg-white border-neutral-200 text-neutral-800'
    : 'bg-neutral-950/60 border-neutral-800 text-neutral-200';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const applyFormatPreset = (size: 1 | 2 | 3, withPlayer: boolean) => {
    setPlayerParticipation(withPlayer ? 'blue' : 'none');
    setBlueSlots(
      DEFAULT_BLUE_TEAM_SLOTS.slice(0, size).map((s, idx) =>
        idx === 0 && withPlayer ? { ...s, isPlayer: true } : { ...s, isPlayer: false }
      )
    );
    setOrangeSlots(DEFAULT_ORANGE_TEAM_SLOTS.slice(0, size));
    setActiveCamCar(0);
    quickNotification.info(`Applied ${size}v${size} ${withPlayer ? '+Player' : 'All-Bots'} roster.`);
  };

  const spawnedCars = [
    ...blueSlots.map((s, i) => ({
      carIndex: i,
      keyNumber: i + 1,
      colorHex: DEFAULT_CAR_COLOR_PALETTE.find((c) => c.id === s.colorSlot)?.hex ?? '#0ea5e9',
      label: s.isPlayer ? 'PLAYER' : `${s.botType.toUpperCase()} #${i + 1}`,
    })),
    ...orangeSlots.map((s, i) => ({
      carIndex: blueSlots.length + i,
      keyNumber: blueSlots.length + i + 1,
      colorHex: DEFAULT_CAR_COLOR_PALETTE.find((c) => c.id === s.colorSlot)?.hex ?? '#f59e0b',
      label: s.isPlayer ? 'PLAYER' : `${s.botType.toUpperCase()} #${blueSlots.length + i + 1}`,
    })),
  ];

  const formatClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${isOvertime ? '+' : ''}${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="p-3.5 flex flex-col gap-2.5 text-xs select-none">
      {/* 1. Top Status Bar & Mode Activation */}
      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${cardBg}`}>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                isInExpMode ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-bold text-xs truncate">
              {isInExpMode
                ? `Experimental Multiple Bots (${blueSlots.length}v${orangeSlots.length})`
                : 'Experimental Multiple Bots Standby'}
            </span>
          </div>
          <span className={`text-[10px] font-mono truncate mt-0.5 ${mutedText}`}>
            Native SafeTensors EARL Perceiver · Zero ONNX · Up to 3v3
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant={isInExpMode ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => {
              setIsInExpMode(true);
              quickNotification.success('Applied multi-bot roster & restarted match.');
            }}
            isLight={isLight}
          >
            {isInExpMode ? (
              <>
                <RotateCcw className="h-3 w-3 mr-1 inline" />
                <span>Apply &amp; Restart</span>
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

      {/* 2. Native Model Weights & Inference Telemetry Bar */}
      <div className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-2 ${subPanelBg}`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="success" isLight={isLight}>
            Nexto SafeTensors: READY
          </Badge>
          <Badge variant="success" isLight={isLight}>
            Necto SafeTensors: READY
          </Badge>
        </div>
        <span className="text-[10px] font-mono text-sky-400 shrink-0">
          Infer: {(0.28 * (blueSlots.length + orangeSlots.length)).toFixed(2)} ms
        </span>
      </div>

      {/* 3. Player Participation & 6 Quick Format Presets Bar */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-[11px] flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-sky-400" />
            <span>Player Participation</span>
          </span>
          <span className={`text-[10px] font-mono ${mutedText}`}>
            {playerParticipation === 'none'
              ? 'All-Bots Mode (Keys 1-6 switch POV)'
              : `Human Player on ${playerParticipation.toUpperCase()}`}
          </span>
        </div>

        <SegmentedSwitch
          value={playerParticipation}
          onValueChange={(v) => setPlayerParticipation(v as typeof playerParticipation)}
          options={[
            { value: 'none', label: 'No Player (Spectate)' },
            { value: 'blue', label: '+ Player (Blue)' },
            { value: 'orange', label: '+ Player (Orange)' },
          ]}
          size="sm"
          isLight={isLight}
        />

        <div className="grid grid-cols-6 gap-1.5">
          {[
            { label: '1v1 +P', size: 1 as const, p: true },
            { label: '2v2 +P', size: 2 as const, p: true },
            { label: '3v3 +P', size: 3 as const, p: true },
            { label: '1v1 Bot', size: 1 as const, p: false },
            { label: '2v2 Bot', size: 2 as const, p: false },
            { label: '3v3 Bot', size: 3 as const, p: false },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyFormatPreset(preset.size, preset.p)}
              className={`py-1 px-1.5 rounded-lg border text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                isLight
                  ? 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                  : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Bot Camera POV Hotkey Bar (1 - 6) */}
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
          {spawnedCars.map((car) => {
            const isSelected = activeCamCar === car.carIndex;
            return (
              <button
                key={car.carIndex}
                type="button"
                onClick={() => setActiveCamCar(car.carIndex)}
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

      {/* 5 & 6. Blue & Orange Team Roster Cards (L3 Compounds) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TeamRosterCard
          team={0}
          slots={blueSlots}
          globalOffset={0}
          activeCameraCarIndex={activeCamCar}
          totalCars={blueSlots.length + orangeSlots.length}
          onSelectCameraCar={setActiveCamCar}
          onAddBot={(_, policy: BotPolicyId) =>
            setBlueSlots((prev) => [
              ...prev,
              { id: `blue-${Date.now()}`, team: 0, isPlayer: false, botType: policy, colorSlot: 'sky' },
            ])
          }
          onRemoveSlot={(_, idx) => setBlueSlots((prev) => prev.filter((__, i) => i !== idx))}
          onSetSlotBotType={(_, idx, botType) =>
            setBlueSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, botType } : s)))
          }
          onSetSlotColor={(_, idx, colorSlot) =>
            setBlueSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, colorSlot } : s)))
          }
          isLight={isLight}
        />

        <TeamRosterCard
          team={1}
          slots={orangeSlots}
          globalOffset={blueSlots.length}
          activeCameraCarIndex={activeCamCar}
          totalCars={blueSlots.length + orangeSlots.length}
          onSelectCameraCar={setActiveCamCar}
          onAddBot={(_, policy: BotPolicyId) =>
            setOrangeSlots((prev) => [
              ...prev,
              { id: `orange-${Date.now()}`, team: 1, isPlayer: false, botType: policy, colorSlot: 'amber' },
            ])
          }
          onRemoveSlot={(_, idx) => setOrangeSlots((prev) => prev.filter((__, i) => i !== idx))}
          onSetSlotBotType={(_, idx, botType) =>
            setOrangeSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, botType } : s)))
          }
          onSetSlotColor={(_, idx, colorSlot) =>
            setOrangeSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, colorSlot } : s)))
          }
          isLight={isLight}
        />
      </div>

      {/* 7. Live Match Scoreboard, Speed Multiplier & Sandbox Triggers */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-[11px] flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Match Telemetry &amp; Controls</span>
          </span>
          <span className="text-[11px] font-mono font-bold text-amber-400">
            Blue {blueScore} — {orangeScore} Orange · {formatClock(matchDurationSec)} ({isOvertime ? 'OVERTIME' : 'ACTIVE'})
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className={`text-[11px] ${mutedText}`}>Match Duration</span>
          <SegmentedSwitch
            value={String(matchDurationSec)}
            onValueChange={(v) => setMatchDurationSec(Number(v))}
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
            value={speedMultiplier}
            onValueChange={(v) => setSpeedMultiplier(v as typeof speedMultiplier)}
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
          <ToggleSwitch label="Unlimited Boost" checked={unlimitedBoost} onCheckedChange={setUnlimitedBoost} isLight={isLight} />
          <ToggleSwitch label="Fast Goal Reset" checked={fastGoalReset} onCheckedChange={setFastGoalReset} isLight={isLight} />
        </div>

        <div className="grid grid-cols-5 gap-1.5 pt-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => quickNotification.info('Reset kickoff positions.')}
            isLight={isLight}
          >
            Reset Kickoff
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setBlueScore((s) => s + 1);
              quickNotification.info('Awarded +1 Blue Goal.');
            }}
            isLight={isLight}
          >
            +1 Blue Goal
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setOrangeScore((s) => s + 1);
              quickNotification.info('Awarded +1 Orange Goal.');
            }}
            isLight={isLight}
          >
            +1 Orange Goal
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setIsOvertime((o) => !o);
              quickNotification.info('Toggled Overtime state.');
            }}
            isLight={isLight}
          >
            Force OT
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setIsInExpMode(false);
              quickNotification.info('Ended Experimental Multi-Bots match.');
            }}
            isLight={isLight}
          >
            End Match
          </Button>
        </div>
      </div>
    </div>
  );
});
ExperimentalMultiBotsFloatingWindow.displayName = 'ExperimentalMultiBotsFloatingWindow';
