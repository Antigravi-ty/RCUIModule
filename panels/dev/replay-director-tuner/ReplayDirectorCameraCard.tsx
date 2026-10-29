import React, { useState } from 'react';
import { Camera, Clock, Eye, Sliders } from 'lucide-react';
import {
  REPLAY_DIRECTOR_CONFIG,
  DEFAULT_REPLAY_DIRECTOR_CONFIG,
} from '../../../config/replayDirectorConfig.js';
import { SliderControl } from '../../../primitives/SliderControl';
import { UnderlineTabs } from '../../../primitives/UnderlineTabs';

type DirectorTabId = 'framing' | 'lookahead' | 'slowmo';

export interface ReplayDirectorCameraCardProps {
  cfg: typeof REPLAY_DIRECTOR_CONFIG;
  onParamChange: (key: keyof typeof REPLAY_DIRECTOR_CONFIG, val: number) => void;
  isLight?: boolean;
}

export const ReplayDirectorCameraCard: React.FC<ReplayDirectorCameraCardProps> = ({
  cfg,
  onParamChange,
  isLight = false,
}) => {
  const [activeTab, setActiveTab] = useState<DirectorTabId>('framing');

  const subPanelBg = isLight
    ? 'bg-white border-neutral-200'
    : 'bg-neutral-900/60 border-neutral-800/80';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const tabs = [
    {
      id: 'framing',
      label: 'Corridor & Damping',
      icon: <Camera className="h-3.5 w-3.5" />,
    },
    {
      id: 'lookahead',
      label: '2-Touch Lookahead',
      icon: <Eye className="h-3.5 w-3.5" />,
    },
    {
      id: 'slowmo',
      label: 'Slow-Mo Windows',
      icon: <Clock className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      <UnderlineTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as DirectorTabId)}
        isLight={isLight}
      />

      {activeTab === 'framing' && (
        <div className={`p-2.5 rounded-xl border flex flex-col gap-2.5 ${subPanelBg}`}>
          <div className="flex items-center justify-between border-b border-neutral-700/30 pb-1">
            <span className="text-[11px] font-semibold flex items-center gap-1.5 text-amber-400">
              <Sliders className="h-3.5 w-3.5" />
              <span>Smoothing & Transition Damping</span>
            </span>
            <span className={`text-[10px] font-mono ${mutedText}`}>1/s exp decay</span>
          </div>

          <SliderControl
            label={`Eye Translation Damping (${cfg.eyeDampingRate.toFixed(1)} /s)`}
            description={`Camera position smoothing rate (default ${DEFAULT_REPLAY_DIRECTOR_CONFIG.eyeDampingRate})`}
            value={cfg.eyeDampingRate}
            min={0.5}
            max={15.0}
            step={0.1}
            unit="/s"
            editable={true}
            showStepper={true}
            colorScheme="amber"
            isLight={isLight}
            onChange={(v) => onParamChange('eyeDampingRate', v)}
          />

          <SliderControl
            label={`Gaze LookAt Damping (${cfg.gazeDampingRate.toFixed(1)} /s)`}
            description={`Camera pan/tilt aim smoothing rate (default ${DEFAULT_REPLAY_DIRECTOR_CONFIG.gazeDampingRate})`}
            value={cfg.gazeDampingRate}
            min={1.0}
            max={20.0}
            step={0.25}
            unit="/s"
            editable={true}
            showStepper={true}
            colorScheme="amber"
            isLight={isLight}
            onChange={(v) => onParamChange('gazeDampingRate', v)}
          />

          <SliderControl
            label={`Striker Switch Cross-Fade (${(cfg.strikerSwitchDampingRate ?? 4.2).toFixed(1)} /s)`}
            description="Smooths target & standoff transition when active touch car switches (lower = gentler switch)"
            value={cfg.strikerSwitchDampingRate ?? 4.2}
            min={0.5}
            max={15.0}
            step={0.2}
            unit="/s"
            editable={true}
            showStepper={true}
            colorScheme="amber"
            isLight={isLight}
            onChange={(v) => onParamChange('strikerSwitchDampingRate', v)}
          />

          <div className="flex items-center justify-between border-b border-neutral-700/30 pb-1 pt-1">
            <span className="text-[11px] font-semibold flex items-center gap-1.5 text-sky-400">
              <Camera className="h-3.5 w-3.5" />
              <span>Corridor & Goal-Box Distances (UU)</span>
            </span>
            <span className={`text-[10px] font-mono ${mutedText}`}>Unreal Units</span>
          </div>

          <SliderControl
            label={`Corridor Back Dist Start (${Math.round(cfg.corridorBackDistStart)} UU)`}
            description="Follow distance behind composite midpoint at start of replay"
            value={cfg.corridorBackDistStart}
            min={300}
            max={1800}
            step={20}
            unit="UU"
            editable={true}
            showStepper={true}
            colorScheme="neutral"
            isLight={isLight}
            onChange={(v) => onParamChange('corridorBackDistStart', v)}
          />

          <SliderControl
            label={`Corridor Back Dist End (${Math.round(cfg.corridorBackDistEnd)} UU)`}
            description="Follow distance behind composite midpoint near goal"
            value={cfg.corridorBackDistEnd}
            min={250}
            max={1500}
            step={20}
            unit="UU"
            editable={true}
            showStepper={true}
            colorScheme="neutral"
            isLight={isLight}
            onChange={(v) => onParamChange('corridorBackDistEnd', v)}
          />

          <SliderControl
            label={`Corridor Lateral Side Offset (${Math.round(cfg.corridorSideDistBase)} UU)`}
            description="Lateral offset toward open interior of the arena"
            value={cfg.corridorSideDistBase}
            min={0}
            max={1400}
            step={25}
            unit="UU"
            editable={true}
            showStepper={true}
            colorScheme="neutral"
            isLight={isLight}
            onChange={(v) => onParamChange('corridorSideDistBase', v)}
          />

          <SliderControl
            label={`Goal-Box Showcase Settle Dist (${Math.round(cfg.goalBoxShowcaseDist)} UU)`}
            description="Hovering distance in front of the goal line as the ball enters the net"
            value={cfg.goalBoxShowcaseDist}
            min={500}
            max={2400}
            step={50}
            unit="UU"
            editable={true}
            showStepper={true}
            colorScheme="neutral"
            isLight={isLight}
            onChange={(v) => onParamChange('goalBoxShowcaseDist', v)}
          />
        </div>
      )}

      {activeTab === 'lookahead' && (
        <div className={`p-2.5 rounded-xl border flex flex-col gap-2.5 ${subPanelBg}`}>
          <div className="flex items-center justify-between border-b border-neutral-700/30 pb-1">
            <span className="text-[11px] font-semibold flex items-center gap-1.5 text-emerald-400">
              <Eye className="h-3.5 w-3.5" />
              <span>Two-Touch Lookahead & Striker Weighting</span>
            </span>
          </div>

          <SliderControl
            label={`Striker Car Midpoint Max Weight (${Math.round(cfg.carMidpointMaxWeight * 100)}%)`}
            description="Max weight of active touch car in Car-Ball composite midpoint (0% = pure ball cam)"
            value={cfg.carMidpointMaxWeight}
            min={0.0}
            max={0.75}
            step={0.02}
            editable={true}
            showStepper={true}
            colorScheme="amber"
            isLight={isLight}
            onChange={(v) => onParamChange('carMidpointMaxWeight', v)}
          />

          <SliderControl
            label={`Post-Touch Striker Hold (${cfg.touchHoldAfterSeconds.toFixed(2)}s)`}
            description="How long to continue framing the current striker after ball impact before switching to T2"
            value={cfg.touchHoldAfterSeconds}
            min={0.0}
            max={1.2}
            step={0.05}
            unit="s"
            editable={true}
            showStepper={true}
            colorScheme="neutral"
            isLight={isLight}
            onChange={(v) => onParamChange('touchHoldAfterSeconds', v)}
          />

          <SliderControl
            label={`2-Touch Lookahead Horizon (${cfg.twoTouchLookaheadSeconds.toFixed(2)}s)`}
            description="Maximum lookahead window to anticipate the next scoring-team touch (T2)"
            value={cfg.twoTouchLookaheadSeconds}
            min={0.5}
            max={5.0}
            step={0.1}
            unit="s"
            editable={true}
            showStepper={true}
            colorScheme="neutral"
            isLight={isLight}
            onChange={(v) => onParamChange('twoTouchLookaheadSeconds', v)}
          />

          <SliderControl
            label={`2-Touch Anticipation Weight (${Math.round(cfg.twoTouchAnticipationWeight * 100)}%)`}
            description="How strongly the camera pre-leans toward the upcoming 2nd touch (T2)"
            value={cfg.twoTouchAnticipationWeight}
            min={0.0}
            max={0.65}
            step={0.02}
            editable={true}
            showStepper={true}
            colorScheme="amber"
            isLight={isLight}
            onChange={(v) => onParamChange('twoTouchAnticipationWeight', v)}
          />
        </div>
      )}

      {activeTab === 'slowmo' && (
        <div className={`p-2.5 rounded-xl border flex flex-col gap-2.5 ${subPanelBg}`}>
          <div className="flex items-center justify-between border-b border-neutral-700/30 pb-1">
            <span className="text-[11px] font-semibold flex items-center gap-1.5 text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              <span>1. Final Touch Impact Slow-Mo Window</span>
            </span>
          </div>

          <SliderControl
            label={`Pre-Last-Touch Window (${cfg.lastTouchSlowMoPreSeconds.toFixed(2)}s)`}
            description="Slow-mo start before final scoring touch"
            value={cfg.lastTouchSlowMoPreSeconds}
            min={0.0}
            max={2.0}
            step={0.05}
            unit="s"
            editable={true}
            showStepper={true}
            colorScheme="amber"
            isLight={isLight}
            onChange={(v) => onParamChange('lastTouchSlowMoPreSeconds', v)}
          />

          <SliderControl
            label={`Post-Last-Touch Window (${cfg.lastTouchSlowMoPostSeconds.toFixed(2)}s)`}
            description="Slow-mo hold after final scoring touch"
            value={cfg.lastTouchSlowMoPostSeconds}
            min={0.0}
            max={1.5}
            step={0.05}
            unit="s"
            editable={true}
            showStepper={true}
            colorScheme="amber"
            isLight={isLight}
            onChange={(v) => onParamChange('lastTouchSlowMoPostSeconds', v)}
          />

          <SliderControl
            label={`Last-Touch Speed Scale (${Math.round(cfg.lastTouchSlowMoScale * 100)}%)`}
            description="Playback speed multiplier during final touch plateau (1.0 = disable slow-mo)"
            value={cfg.lastTouchSlowMoScale}
            min={0.2}
            max={1.0}
            step={0.05}
            editable={true}
            showStepper={true}
            colorScheme="amber"
            isLight={isLight}
            onChange={(v) => onParamChange('lastTouchSlowMoScale', v)}
          />

          <div className="flex items-center justify-between border-b border-neutral-700/30 pb-1 pt-1">
            <span className="text-[11px] font-semibold flex items-center gap-1.5 text-sky-400">
              <Clock className="h-3.5 w-3.5" />
              <span>2. Goal-Line Crossing Slow-Mo Window</span>
            </span>
          </div>

          <SliderControl
            label={`Pre-Goal-Line Window (${cfg.goalLineSlowMoPreSeconds.toFixed(2)}s)`}
            description="Slow-mo start before ball crosses the goal line"
            value={cfg.goalLineSlowMoPreSeconds}
            min={0.0}
            max={1.5}
            step={0.05}
            unit="s"
            editable={true}
            showStepper={true}
            colorScheme="neutral"
            isLight={isLight}
            onChange={(v) => onParamChange('goalLineSlowMoPreSeconds', v)}
          />

          <SliderControl
            label={`Post-Goal-Line Window (${cfg.goalLineSlowMoPostSeconds.toFixed(2)}s)`}
            description="Slow-mo hold after ball crosses the goal line"
            value={cfg.goalLineSlowMoPostSeconds}
            min={0.0}
            max={1.5}
            step={0.05}
            unit="s"
            editable={true}
            showStepper={true}
            colorScheme="neutral"
            isLight={isLight}
            onChange={(v) => onParamChange('goalLineSlowMoPostSeconds', v)}
          />

          <SliderControl
            label={`Goal-Line Speed Scale (${Math.round(cfg.goalLineSlowMoScale * 100)}%)`}
            description="Playback speed multiplier during goal-line crossing plateau (1.0 = disable)"
            value={cfg.goalLineSlowMoScale}
            min={0.2}
            max={1.0}
            step={0.05}
            editable={true}
            showStepper={true}
            colorScheme="neutral"
            isLight={isLight}
            onChange={(v) => onParamChange('goalLineSlowMoScale', v)}
          />
        </div>
      )}
    </div>
  );
};
