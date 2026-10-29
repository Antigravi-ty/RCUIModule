import React, { useState } from 'react';
import { Card } from '../layout/Card';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { SegmentedSwitch } from '../primitives/SegmentedSwitch';
import { SliderControl } from '../primitives/SliderControl';
import { ToggleSwitch } from '../primitives/ToggleSwitch';
import { TeamRosterCard, TeamRosterSlotConfig, BotPolicyId, CarColorSwatch, DEFAULT_BLUE_TEAM_SLOTS, DEFAULT_ORANGE_TEAM_SLOTS } from '../compounds/TeamRosterCard';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';

export interface Layer3ExpMultiBotsRecipeProps {
  isLight?: boolean;
  defaultBlueSlots?: TeamRosterSlotConfig[];
  defaultOrangeSlots?: TeamRosterSlotConfig[];
  blueSlots?: TeamRosterSlotConfig[];
  orangeSlots?: TeamRosterSlotConfig[];
  colorPalette?: CarColorSwatch[];
  activeCameraCarIndex?: number;
  playerParticipation?: 'none' | 'blue' | 'orange';
  matchDurationSec?: number;
  simSpeedValue?: string;
  unlimitedBoost?: boolean;
  disableGoalReplay?: boolean;
  nextoLoaded?: boolean;
  nectoLoaded?: boolean;
  lastTotalInferenceMs?: number;
  isInExpMode?: boolean;
  onSetPlayerParticipation?: (mode: 'none' | 'blue' | 'orange') => void;
  onApplyFormatPreset?: (preset: string) => void;
  onAddBot?: (team: 0 | 1, botType: BotPolicyId) => void;
  onSelectCameraCar?: (carIndex: number) => void;
  onSetSlotBotType?: (team: 0 | 1, slotIndex: number, botType: BotPolicyId) => void;
  onSetSlotColor?: (team: 0 | 1, slotIndex: number, colorId: string) => void;
  onRemoveSlot?: (team: 0 | 1, slotIndex: number) => void;
  onSetMatchDurationSec?: (sec: number) => void;
  onSetSimSpeed?: (val: string) => void;
  onSetUnlimitedBoost?: (val: boolean) => void;
  onSetDisableGoalReplay?: (val: boolean) => void;
  onTriggerSandboxAction?: (
    action: 'reset_kickoff' | 'score_blue' | 'score_orange' | 'force_overtime'
  ) => void;
  onStartSimulation?: (config: {
    blueSlots: TeamRosterSlotConfig[];
    orangeSlots: TeamRosterSlotConfig[];
    activeCameraCarIndex: number;
  }) => void;
  onLaunchFloatingControl?: () => void;
  onEnterGame?: () => void;
  onBack?: () => void;
  className?: string;
}

export const Layer3ExpMultiBotsRecipe: React.FC<Layer3ExpMultiBotsRecipeProps> = React.memo(({
  isLight = true,
  defaultBlueSlots = DEFAULT_BLUE_TEAM_SLOTS,
  defaultOrangeSlots = DEFAULT_ORANGE_TEAM_SLOTS,
  blueSlots: controlledBlueSlots,
  orangeSlots: controlledOrangeSlots,
  colorPalette,
  activeCameraCarIndex: controlledActiveCameraCarIndex,
  playerParticipation: controlledPlayerParticipation,
  matchDurationSec: controlledMatchDurationSec,
  simSpeedValue: controlledSimSpeedValue,
  unlimitedBoost: controlledUnlimitedBoost,
  disableGoalReplay: controlledDisableGoalReplay,
  nextoLoaded = true,
  nectoLoaded = true,
  lastTotalInferenceMs = 0,
  isInExpMode = false,
  onSetPlayerParticipation,
  onApplyFormatPreset,
  onAddBot,
  onSelectCameraCar,
  onSetSlotBotType,
  onSetSlotColor,
  onRemoveSlot,
  onSetMatchDurationSec,
  onSetSimSpeed,
  onSetUnlimitedBoost,
  onSetDisableGoalReplay,
  onTriggerSandboxAction,
  onStartSimulation,
  onLaunchFloatingControl,
  onEnterGame,
  onBack = () => {},
  className = '',
}) => {
  const [internalBlueSlots, setInternalBlueSlots] = useState<TeamRosterSlotConfig[]>(defaultBlueSlots);
  const [internalOrangeSlots, setInternalOrangeSlots] = useState<TeamRosterSlotConfig[]>(defaultOrangeSlots);
  const [internalActiveCameraCarIndex, setInternalActiveCameraCarIndex] = useState<number>(0);
  const [internalPlayerParticipation, setInternalPlayerParticipation] = useState<'none' | 'blue' | 'orange'>('blue');
  const [internalMatchDurationSec, setInternalMatchDurationSec] = useState<number>(300);
  const [internalSimSpeed, setInternalSimSpeed] = useState<string>('1x');
  const [internalUnlimitedBoost, setInternalUnlimitedBoost] = useState<boolean>(false);
  const [internalDisableGoalReplay, setInternalDisableGoalReplay] = useState<boolean>(true);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const blueSlots = controlledBlueSlots ?? internalBlueSlots;
  const orangeSlots = controlledOrangeSlots ?? internalOrangeSlots;
  const activeCameraCarIndex = controlledActiveCameraCarIndex ?? internalActiveCameraCarIndex;
  const playerParticipation = controlledPlayerParticipation ?? internalPlayerParticipation;
  const matchDurationSec = controlledMatchDurationSec ?? internalMatchDurationSec;
  const simSpeedValue = controlledSimSpeedValue ?? internalSimSpeed;
  const unlimitedBoost = controlledUnlimitedBoost ?? internalUnlimitedBoost;
  const disableGoalReplay = controlledDisableGoalReplay ?? internalDisableGoalReplay;

  const sizing = useMenuLayoutStore((s) => s.panels['layer3-exp-multi-bots']);
  const totalCars = blueSlots.length + orangeSlots.length;

  const makeSlots = (team: 0 | 1, count: number, includePlayer: boolean): TeamRosterSlotConfig[] =>
    Array.from({ length: count }, (_, idx) => ({
      id: `slot-${team}-${idx}-${Date.now()}`,
      team,
      isPlayer: includePlayer && idx === 0,
      botType: 'nexto' as BotPolicyId,
      colorSlot: team === 0 ? 'sky' : 'amber',
    }));

  const applyFormatPreset = (preset: string) => {
    if (onApplyFormatPreset) {
      onApplyFormatPreset(preset);
      return;
    }
    const hasPlayer = preset.includes('+P');
    const size = preset.startsWith('1v1') ? 1 : preset.startsWith('2v2') ? 2 : 3;
    const nextParticipation = hasPlayer
      ? playerParticipation === 'none'
        ? 'blue'
        : playerParticipation
      : 'none';
    setInternalPlayerParticipation(nextParticipation);
    setInternalBlueSlots(makeSlots(0, size, nextParticipation === 'blue'));
    setInternalOrangeSlots(makeSlots(1, size, nextParticipation === 'orange'));
    setInternalActiveCameraCarIndex(0);
  };

  const handleParticipationChange = (mode: 'none' | 'blue' | 'orange') => {
    if (onSetPlayerParticipation) {
      onSetPlayerParticipation(mode);
      return;
    }
    setInternalPlayerParticipation(mode);
    setInternalBlueSlots((prev) =>
      prev.map((s, idx) => ({ ...s, isPlayer: mode === 'blue' && idx === 0 }))
    );
    setInternalOrangeSlots((prev) =>
      prev.map((s, idx) => ({ ...s, isPlayer: mode === 'orange' && idx === 0 }))
    );
  };

  const handleAddBot = (team: 0 | 1, botType: BotPolicyId) => {
    if (onAddBot) {
      onAddBot(team, botType);
      return;
    }
    const newSlot: TeamRosterSlotConfig = {
      id: `slot-${team}-${Date.now()}`,
      team,
      isPlayer: false,
      botType,
      colorSlot: team === 0 ? 'sky' : 'amber',
    };
    if (team === 0) {
      setInternalBlueSlots((prev) => (prev.length < 3 ? [...prev, newSlot] : prev));
    } else {
      setInternalOrangeSlots((prev) => (prev.length < 3 ? [...prev, newSlot] : prev));
    }
  };

  const handleSetSlotBotType = (team: 0 | 1, slotIndex: number, botType: BotPolicyId) => {
    if (onSetSlotBotType) {
      onSetSlotBotType(team, slotIndex, botType);
      return;
    }
    const updater = (prev: TeamRosterSlotConfig[]) =>
      prev.map((s, idx) => (idx === slotIndex ? { ...s, botType } : s));
    if (team === 0) setInternalBlueSlots(updater);
    else setInternalOrangeSlots(updater);
  };

  const handleSetSlotColor = (team: 0 | 1, slotIndex: number, colorId: string) => {
    if (onSetSlotColor) {
      onSetSlotColor(team, slotIndex, colorId);
      return;
    }
    const updater = (prev: TeamRosterSlotConfig[]) =>
      prev.map((s, idx) => (idx === slotIndex ? { ...s, colorSlot: colorId } : s));
    if (team === 0) setInternalBlueSlots(updater);
    else setInternalOrangeSlots(updater);
  };

  const handleRemoveSlot = (team: 0 | 1, slotIndex: number) => {
    if (onRemoveSlot) {
      onRemoveSlot(team, slotIndex);
      return;
    }
    if (totalCars <= 1) return;
    if (team === 0) {
      setInternalBlueSlots((prev) => prev.filter((_, idx) => idx !== slotIndex));
    } else {
      setInternalOrangeSlots((prev) => prev.filter((_, idx) => idx !== slotIndex));
    }
  };

  const handleEnterOrRestart = () => {
    onStartSimulation?.({ blueSlots, orangeSlots, activeCameraCarIndex });
    onLaunchFloatingControl?.();
    onEnterGame?.();
  };

  return (
    <PanelContainer
      isLight={isLight}
      sizing={sizing}
      className={`w-full select-none ${className}`}
    >
      <PanelHeader
        isLight={isLight}
        title="EXPERIMENTAL MULTI-BOTS (UP TO 3V3)"
        onBack={onBack}
        onRightAction={handleEnterOrRestart}
        rightActionLabel={isInExpMode ? 'Apply & Restart ↗' : 'Enter Game ↗'}
      />

      <PanelContent scrollable={true} className="flex flex-col gap-3">
        {/* SafeTensors Model Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-mono">
          <span className={nextoLoaded ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            ● Nexto SafeTensors: {nextoLoaded ? 'READY' : 'LOADING'}
          </span>
          <span className={nectoLoaded ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            ● Necto SafeTensors: {nectoLoaded ? 'READY' : 'LOADING'}
          </span>
          <span className={isLight ? 'text-neutral-600' : 'text-neutral-400'}>
            {isInExpMode
              ? `Active (${blueSlots.length}v${orangeSlots.length}) · Infer: ${lastTotalInferenceMs.toFixed(2)} ms`
              : `Active Cars: ${totalCars}/6`}
          </span>
        </div>

        {/* Player Participation & Format Presets */}
        <Card isLight={isLight} variant="outlined" className="p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Player Participation & Format Presets
            </span>
            <SegmentedSwitch
              size="sm"
              isLight={isLight}
              options={[
                { label: 'No Player', value: 'none' },
                { label: '+ Player (Blue)', value: 'blue' },
                { label: '+ Player (Orange)', value: 'orange' },
              ]}
              value={playerParticipation}
              onValueChange={(v) => handleParticipationChange(v as 'none' | 'blue' | 'orange')}
            />
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {(['1v1 +P', '1v1 Bot', '2v2 +P', '2v2 Bot', '3v3 +P', '3v3 Bot'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyFormatPreset(preset)}
                onMouseEnter={() => setHoveredDesc(`Quickly configure ${preset} roster layout.`)}
                onMouseLeave={() => setHoveredDesc(null)}
                className={`py-1.5 px-2 rounded-lg border text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-amber-500/10 border-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-amber-500/15 border-neutral-800 text-neutral-300'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </Card>

        {/* Blue & Orange Team Roster Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
          <div
            onMouseEnter={() =>
              setHoveredDesc('Blue Team Roster: Add up to 3 slots, switch Nexto/Necto/Heuristic policies, or select active POV.')
            }
            onMouseLeave={() => setHoveredDesc(null)}
          >
            <TeamRosterCard
              team={0}
              slots={blueSlots}
              globalOffset={0}
              activeCameraCarIndex={activeCameraCarIndex}
              totalCars={totalCars}
              colorPalette={colorPalette}
              onAddBot={handleAddBot}
              onSelectCameraCar={onSelectCameraCar ?? setInternalActiveCameraCarIndex}
              onSetSlotBotType={handleSetSlotBotType}
              onSetSlotColor={handleSetSlotColor}
              onRemoveSlot={handleRemoveSlot}
              isLight={isLight}
            />
          </div>

          <div
            onMouseEnter={() =>
              setHoveredDesc('Orange Team Roster: Add up to 3 slots, switch Nexto/Necto/Heuristic policies, or select active POV.')
            }
            onMouseLeave={() => setHoveredDesc(null)}
          >
            <TeamRosterCard
              team={1}
              slots={orangeSlots}
              globalOffset={blueSlots.length}
              activeCameraCarIndex={activeCameraCarIndex}
              totalCars={totalCars}
              colorPalette={colorPalette}
              onAddBot={handleAddBot}
              onSelectCameraCar={onSelectCameraCar ?? setInternalActiveCameraCarIndex}
              onSetSlotBotType={handleSetSlotBotType}
              onSetSlotColor={handleSetSlotColor}
              onRemoveSlot={handleRemoveSlot}
              isLight={isLight}
            />
          </div>
        </div>

        {/* Match Duration & Simulation Options */}
        <Card isLight={isLight} variant="outlined" className="p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Match Duration & Simulation Options
            </span>
            <div className="flex items-center gap-1">
              {[
                { label: '1:30', sec: 90 },
                { label: '3:00', sec: 180 },
                { label: '5:00', sec: 300 },
                { label: '10:00', sec: 600 },
              ].map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => (onSetMatchDurationSec ?? setInternalMatchDurationSec)(d.sec)}
                  className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold cursor-pointer ${
                    matchDurationSec === d.sec
                      ? 'bg-amber-500 text-neutral-950 border-amber-500'
                      : isLight
                      ? 'bg-white border-neutral-300 text-neutral-700'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <SliderControl
            label="Custom Match Duration"
            min={30}
            max={900}
            step={30}
            value={matchDurationSec}
            onChange={onSetMatchDurationSec ?? setInternalMatchDurationSec}
            unit="s"
            isLight={isLight}
          />

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">Simulation Speed</span>
            <SegmentedSwitch
              size="sm"
              isLight={isLight}
              options={[
                { label: '1x', value: '1x' },
                { label: '2x', value: '2x' },
                { label: '3x', value: '3x' },
                { label: '4x', value: '4x' },
              ]}
              value={simSpeedValue}
              onValueChange={onSetSimSpeed ?? setInternalSimSpeed}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ToggleSwitch
              label="Unlimited Boost"
              checked={unlimitedBoost}
              onCheckedChange={onSetUnlimitedBoost ?? setInternalUnlimitedBoost}
              isLight={isLight}
            />
            <ToggleSwitch
              label="Fast Goal Reset"
              checked={disableGoalReplay}
              onCheckedChange={onSetDisableGoalReplay ?? setInternalDisableGoalReplay}
              isLight={isLight}
            />
          </div>
        </Card>

        {/* Camera POV Switcher (Keys 1-6) & Live Match Actions */}
        <Card isLight={isLight} variant="outlined" className="p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Camera POV Switcher (Keys 1–{totalCars}) & Live Match Actions
            </span>
            <span className="text-[10px] font-mono text-amber-500">
              Active POV: Car #{activeCameraCarIndex + 1}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { label: 'Reset Kickoff', action: 'reset_kickoff' },
                { label: '+1 Blue Goal', action: 'score_blue' },
                { label: '+1 Orange Goal', action: 'score_orange' },
                { label: 'Force OT', action: 'force_overtime' },
              ] as const
            ).map((act) => (
              <button
                key={act.label}
                type="button"
                onClick={() => onTriggerSandboxAction?.(act.action)}
                className={`py-1.5 px-2 rounded-lg border text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        </Card>

        <button
          type="button"
          onClick={handleEnterOrRestart}
          onMouseEnter={() =>
            setHoveredDesc(
              `Apply & Restart ${blueSlots.length}v${orangeSlots.length} multi-bot simulation (Active POV: Car #${activeCameraCarIndex + 1}).`
            )
          }
          onMouseLeave={() => setHoveredDesc(null)}
          className="mt-auto w-full py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0"
        >
          {isInExpMode
            ? `Apply & Restart Game (${blueSlots.length}v${orangeSlots.length})`
            : `Enter Game (${blueSlots.length}v${orangeSlots.length})`}
        </button>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Configure up to 3v3 Native SafeTensors Nexto & Necto bot rosters and select active camera POV."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
});

Layer3ExpMultiBotsRecipe.displayName = 'Layer3ExpMultiBotsRecipe';
