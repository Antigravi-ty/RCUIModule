import React, { useState } from 'react';
import { Film } from 'lucide-react';
import { SliderControl } from '../../primitives/SliderControl';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { ReplayDirectorKeyframeInspector } from './cards/ReplayDirectorKeyframeInspector';
import { FloatingWindowToolbar } from '../FloatingWindowToolbar';

/**
 * 5. [Dev] Replay Director Camera Tuner (`replay-director-tuner`)
 * Standalone L6 Floating Window Panel — uses L2 `ReplayDirectorKeyframeInspector`.
 */
export const ReplayDirectorTunerFloatingWindow: React.FC<{ isLight?: boolean }> = React.memo(({ isLight = false }) => {
  const [step, setStep] = useState(0.01);
  const [preGoalLeadSec, setPreGoalLeadSec] = useState(3.2);
  const [postGoalHoldSec, setPostGoalHoldSec] = useState(1.8);
  const [orbitAngularSpeed, setOrbitAngularSpeed] = useState(24.0);
  const [playbackSlomoRatio, setPlaybackSlomoRatio] = useState(0.65);
  const [autoCutToScorerPov, setAutoCutToScorerPov] = useState(true);

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      <FloatingWindowToolbar
        title="Goal Replay Director & Keyframe Camera Tuner"
        subtitle="Tunes keyframe insets (L/R/B/T), Look-At framing weights, and slomo timing"
        step={step}
        onStepChange={setStep}
        presets={['Broadcast TV', 'Scorer POV Lock', 'Cinematic Crane']}
        activePreset="Broadcast TV"
        onReset={() => {
          setPreGoalLeadSec(3.2);
          setPostGoalHoldSec(1.8);
          setOrbitAngularSpeed(24.0);
          setPlaybackSlomoRatio(0.65);
        }}
        isLight={isLight}
      />

      <ReplayDirectorKeyframeInspector isLight={isLight} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <SliderControl
          label="Pre-Goal Rewind Lead (s)"
          value={preGoalLeadSec}
          min={1.0}
          max={6.0}
          step={step}
          defaultValue={3.2}
          onChange={setPreGoalLeadSec}
          isLight={isLight}
        />
        <SliderControl
          label="Post-Explosion Hold (s)"
          value={postGoalHoldSec}
          min={0.5}
          max={4.0}
          step={step}
          defaultValue={1.8}
          onChange={setPostGoalHoldSec}
          isLight={isLight}
        />
        <SliderControl
          label="Goal-Mouth Orbit Rate (°/s)"
          value={orbitAngularSpeed}
          min={0}
          max={90}
          step={1}
          defaultValue={24.0}
          onChange={setOrbitAngularSpeed}
          isLight={isLight}
        />
        <SliderControl
          label="Impact Slomo Dilation"
          value={playbackSlomoRatio}
          min={0.2}
          max={1.0}
          step={step}
          defaultValue={0.65}
          onChange={setPlaybackSlomoRatio}
          isLight={isLight}
        />
        <div
          className={`md:col-span-2 p-3 rounded-xl border flex items-center justify-between ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
          }`}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5 text-purple-400" />
              <span>Auto-Cut to Scorer POV on Final Touch</span>
            </span>
            <span className="text-[10px] opacity-65">Switch from tripod director to scorer 0.6s before touch</span>
          </div>
          <ToggleSwitch checked={autoCutToScorerPov} onChange={setAutoCutToScorerPov} ariaLabel="Auto-Cut to Scorer POV" isLight={isLight} />
        </div>
      </div>
    </div>
  );
});
ReplayDirectorTunerFloatingWindow.displayName = 'ReplayDirectorTunerFloatingWindow';
