import React, { useState } from 'react';
import {
  useLayer3ExpMultiBotsStoreBinding,
  type Layer3ExpMultiBotsRecipeProps,
} from './hooks/useLayer3ExpMultiBotsBinding';
import { Card } from '../layout/Card';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { SegmentedSwitch } from '../primitives/SegmentedSwitch';
import { SliderControl } from '../primitives/SliderControl';
import { ToggleSwitch } from '../primitives/ToggleSwitch';
import {
  TeamRosterCard,
  TeamRosterSlotConfig,
  BotPolicyId,
  DEFAULT_BLUE_TEAM_SLOTS,
  DEFAULT_ORANGE_TEAM_SLOTS,
} from '../compounds/TeamRosterCard';
import {
  BOTPACK_9700488_POLICY_METAS,
  getExpBotPolicyMeta,
} from '../stores/experimentalMultiBotsRosterUtils';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';

export type Layer3ExpBotPackRecipeProps = Layer3ExpMultiBotsRecipeProps;

export const Layer3ExpBotPackRecipe: React.FC<Layer3ExpBotPackRecipeProps> = React.memo(
  (rawProps) => {
    const {
      isLight = true,
      defaultBlueSlots = DEFAULT_BLUE_TEAM_SLOTS,
      defaultOrangeSlots = DEFAULT_ORANGE_TEAM_SLOTS,
      blueSlots: controlledBlueSlots,
      orangeSlots: controlledOrangeSlots,
      colorPalette,
      activeCameraCarIndex: controlledActiveCameraCarIndex,
      activeBotpackShowcaseModel = 'chronos',
      matchDurationSec: controlledMatchDurationSec,
      simSpeedValue: controlledSimSpeedValue,
      unlimitedBoost: controlledUnlimitedBoost,
      disableGoalReplay: controlledDisableGoalReplay,
      lastTotalInferenceMs = 0,
      isInExpMode = false,
      onSelectBotpackShowcaseModel,
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
    } = useLayer3ExpMultiBotsStoreBinding(rawProps, 'botpack');

    const [internalBlueSlots, setInternalBlueSlots] =
      useState<TeamRosterSlotConfig[]>(defaultBlueSlots);
    const [internalOrangeSlots, setInternalOrangeSlots] =
      useState<TeamRosterSlotConfig[]>(defaultOrangeSlots);
    const [internalActiveCameraCarIndex, setInternalActiveCameraCarIndex] =
      useState<number>(0);
    const [internalMatchDurationSec, setInternalMatchDurationSec] =
      useState<number>(90);
    const [internalSimSpeed, setInternalSimSpeed] = useState<string>('1x');
    const [internalUnlimitedBoost, setInternalUnlimitedBoost] =
      useState<boolean>(false);
    const [internalDisableGoalReplay, setInternalDisableGoalReplay] =
      useState<boolean>(true);
    const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

    const blueSlots = controlledBlueSlots ?? internalBlueSlots;
    const orangeSlots = controlledOrangeSlots ?? internalOrangeSlots;
    const activeCameraCarIndex =
      controlledActiveCameraCarIndex ?? internalActiveCameraCarIndex;
    const matchDurationSec =
      controlledMatchDurationSec ?? internalMatchDurationSec;
    const simSpeedValue = controlledSimSpeedValue ?? internalSimSpeed;
    const unlimitedBoost = controlledUnlimitedBoost ?? internalUnlimitedBoost;
    const disableGoalReplay =
      controlledDisableGoalReplay ?? internalDisableGoalReplay;

    const sizing = useMenuLayoutStore((s) => s.panels['layer3-exp-botpack']);
    const totalCars = blueSlots.length + orangeSlots.length;
    const activeMeta = getExpBotPolicyMeta(
      activeBotpackShowcaseModel || blueSlots[0]?.botType || 'chronos'
    );

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
          title="EXPERIMENTAL BOT PACK #9700488 (8 NATIVE MODELS)"
          onBack={onBack}
          onRightAction={handleEnterOrRestart}
          rightActionLabel={isInExpMode ? 'Apply & Restart ↗' : 'Enter Game ↗'}
        />

        <PanelContent scrollable={true} className="flex flex-col gap-3">
          {/* Active BotPack Model & WASM SIMD128 Status Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-mono">
            <span className="text-emerald-400 font-bold">
              ● Active Showcase: {activeMeta.label} ({activeMeta.formatBadge})
            </span>
            <span className="text-sky-400 font-bold">
              ● WASM SIMD128 MatVec: READY
            </span>
            <span className={isLight ? 'text-neutral-600' : 'text-neutral-400'}>
              {isInExpMode
                ? `Active (${blueSlots.length}v${orangeSlots.length}) · Infer: ${lastTotalInferenceMs.toFixed(2)} ms`
                : `Recommended Format: ${blueSlots.length}v${orangeSlots.length}`}
            </span>
          </div>

          {/* 8 Models Spectate Showcase Selector */}
          <Card isLight={isLight} variant="outlined" className="p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold tracking-wider text-emerald-500">
                Experimental Bot Pack #9700488 — 8 Models Spectate Showcase
              </span>
              <span
                className={`text-[10px] font-mono ${
                  isLight ? 'text-neutral-500' : 'text-neutral-400'
                }`}
              >
                Select any model to configure max-format all-bots spectate (3v3 / 2v2 / 1v1)
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {BOTPACK_9700488_POLICY_METAS.map((m) => {
                const isSelected = activeBotpackShowcaseModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectBotpackShowcaseModel?.(m.id)}
                    onMouseEnter={() =>
                      setHoveredDesc(
                        `Configure ${m.label} (${m.formatBadge}) all-bots spectate match where every car runs ${m.label}.`
                      )
                    }
                    onMouseLeave={() => setHoveredDesc(null)}
                    className={`py-1.5 px-2 rounded-lg border text-[10px] font-mono font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-xs'
                        : isLight
                          ? 'bg-white hover:bg-emerald-500/10 border-neutral-200 text-neutral-700'
                          : 'bg-neutral-900 hover:bg-emerald-500/15 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    <span className="truncate max-w-full">{m.shortLabel}</span>
                    <span className="text-[9px] opacity-75">{m.formatBadge}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Blue & Orange Team Roster Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
            <div
              onMouseEnter={() =>
                setHoveredDesc(
                  'Blue Team Roster: Customize individual BotPack #9700488 policies, colors, or active POV.'
                )
              }
              onMouseLeave={() => setHoveredDesc(null)}
            >
              <TeamRosterCard
                team={0}
                slots={blueSlots}
                globalOffset={0}
                activeCameraCarIndex={activeCameraCarIndex}
                totalCars={totalCars}
                maxTeamSlots={activeMeta.maxPlayersPerTeam}
                maxTotalCars={activeMeta.maxPlayersPerTeam * 2}
                allowBotpackPolicies={true}
                colorPalette={colorPalette}
                onAddBot={
                  onAddBot ??
                  ((t, b) =>
                    setInternalBlueSlots((prev) => [
                      ...prev,
                      {
                        id: `${t}-${Date.now()}`,
                        team: t,
                        isPlayer: false,
                        botType: b,
                        colorSlot: 'sky',
                      },
                    ]))
                }
                onSelectCameraCar={onSelectCameraCar ?? setInternalActiveCameraCarIndex}
                onSetSlotBotType={
                  onSetSlotBotType ??
                  ((_, idx, b) =>
                    setInternalBlueSlots((prev) =>
                      prev.map((s, i) => (i === idx ? { ...s, botType: b } : s))
                    ))
                }
                onSetSlotColor={
                  onSetSlotColor ??
                  ((_, idx, c) =>
                    setInternalBlueSlots((prev) =>
                      prev.map((s, i) => (i === idx ? { ...s, colorSlot: c } : s))
                    ))
                }
                onRemoveSlot={
                  onRemoveSlot ??
                  ((_, idx) =>
                    setInternalBlueSlots((prev) => prev.filter((_, i) => i !== idx)))
                }
                isLight={isLight}
              />
            </div>

            <div
              onMouseEnter={() =>
                setHoveredDesc(
                  'Orange Team Roster: Customize individual BotPack #9700488 policies, colors, or active POV.'
                )
              }
              onMouseLeave={() => setHoveredDesc(null)}
            >
              <TeamRosterCard
                team={1}
                slots={orangeSlots}
                globalOffset={blueSlots.length}
                activeCameraCarIndex={activeCameraCarIndex}
                totalCars={totalCars}
                maxTeamSlots={activeMeta.maxPlayersPerTeam}
                maxTotalCars={activeMeta.maxPlayersPerTeam * 2}
                allowBotpackPolicies={true}
                colorPalette={colorPalette}
                onAddBot={
                  onAddBot ??
                  ((t, b) =>
                    setInternalOrangeSlots((prev) => [
                      ...prev,
                      {
                        id: `${t}-${Date.now()}`,
                        team: t,
                        isPlayer: false,
                        botType: b,
                        colorSlot: 'amber',
                      },
                    ]))
                }
                onSelectCameraCar={onSelectCameraCar ?? setInternalActiveCameraCarIndex}
                onSetSlotBotType={
                  onSetSlotBotType ??
                  ((_, idx, b) =>
                    setInternalOrangeSlots((prev) =>
                      prev.map((s, i) => (i === idx ? { ...s, botType: b } : s))
                    ))
                }
                onSetSlotColor={
                  onSetSlotColor ??
                  ((_, idx, c) =>
                    setInternalOrangeSlots((prev) =>
                      prev.map((s, i) => (i === idx ? { ...s, colorSlot: c } : s))
                    ))
                }
                onRemoveSlot={
                  onRemoveSlot ??
                  ((_, idx) =>
                    setInternalOrangeSlots((prev) => prev.filter((_, i) => i !== idx)))
                }
                isLight={isLight}
              />
            </div>
          </div>

          {/* Match Duration & Simulation Options */}
          <Card isLight={isLight} variant="outlined" className="p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Match Duration &amp; Simulation Options
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
                        ? 'bg-emerald-500 text-neutral-950 border-emerald-500'
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

          {/* Camera POV Switcher & Live Match Actions */}
          <Card isLight={isLight} variant="outlined" className="p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Camera POV Switcher (Keys 1–{totalCars}) &amp; Live Match Actions
              </span>
              <span className="text-[10px] font-mono text-emerald-500">
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
                `Apply & Restart ${activeMeta.label} (${blueSlots.length}v${orangeSlots.length}) BotPack #9700488 showcase.`
              )
            }
            onMouseLeave={() => setHoveredDesc(null)}
            className="mt-auto w-full py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0"
          >
            {isInExpMode
              ? `Apply & Restart Showcase (${activeMeta.shortLabel} · ${blueSlots.length}v${orangeSlots.length})`
              : `Enter Bot Pack Showcase (${activeMeta.shortLabel} · ${blueSlots.length}v${orangeSlots.length})`}
          </button>
        </PanelContent>

        <PanelFooter
          isLight={isLight}
          defaultDescription="Spectate the 8 native SafeTensors models from RLBot Pack #9700488 in their recommended match formats."
          hoveredDescription={hoveredDesc}
        />
      </PanelContainer>
    );
  }
);

Layer3ExpBotPackRecipe.displayName = 'Layer3ExpBotPackRecipe';
