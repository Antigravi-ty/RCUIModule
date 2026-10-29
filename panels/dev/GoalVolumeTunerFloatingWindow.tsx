import React, { useState } from 'react';
import { Target, Eye, Play, RotateCcw } from 'lucide-react';
import { SliderControl } from '../../primitives/SliderControl';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { Button } from '../../primitives/Button';
import { FloatingWindowToolbar } from '../FloatingWindowToolbar';
import { quickNotification } from '../../tokens/quickNotificationStore';

/**
 * 4. [Dev] Goal Volume & Blast Impulse Tuner (`goal-volume-tuner`)
 * Standalone L6 Floating Window Panel — includes Goal Explosion Preview & Camera Override.
 */
export const GoalVolumeTunerFloatingWindow: React.FC<{ isLight?: boolean }> = React.memo(({ isLight = false }) => {
  const [step, setStep] = useState(0.01);
  const [goalLineY, setGoalLineY] = useState(5120);
  const [ballRadiusMargin, setBallRadiusMargin] = useState(92.75);
  const [blastImpulse, setBlastImpulse] = useState(4200);
  const [blastFalloffExp, setBlastFalloffExp] = useState(1.65);
  const [showTriggerWireframe, setShowTriggerWireframe] = useState(true);
  const [cameraFocusMode, setCameraFocusMode] = useState<'none' | 'blue' | 'orange'>('orange');
  const [previewScorerTeam, setPreviewScorerTeam] = useState<'blue' | 'orange'>('blue');
  const [shockwaveParticleDensity, setShockwaveParticleDensity] = useState(1.0);

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      <FloatingWindowToolbar
        title="Goal Volume Box & Blast Radial Impulse Tuner"
        subtitle="Tunes goal-line Y plane threshold, blast wave impulse, and goal camera focus"
        step={step}
        onStepChange={setStep}
        presets={['Soccar Standard', 'Zero-G Blast', 'Instant Reset']}
        activePreset="Soccar Standard"
        onReset={() => {
          setGoalLineY(5120);
          setBallRadiusMargin(92.75);
          setBlastImpulse(4200);
          setBlastFalloffExp(1.65);
          setShockwaveParticleDensity(1.0);
        }}
        isLight={isLight}
      />

      {/* Live Goal Camera Focus & Trigger Explosion Action Card */}
      <div
        className={`p-3 rounded-xl border flex flex-col gap-2.5 ${
          isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-semibold">
            <Eye className="h-3.5 w-3.5 text-sky-400" />
            <span>Viewport Goal Mouth Focus Override</span>
          </div>
          <SegmentedSwitch
            size="sm"
            value={cameraFocusMode}
            onValueChange={(v) => setCameraFocusMode(v as typeof cameraFocusMode)}
            options={[
              { value: 'none', label: 'Free / Match Cam' },
              { value: 'blue', label: 'Focus Blue (-Y)' },
              { value: 'orange', label: 'Focus Orange (+Y)' },
            ]}
            isLight={isLight}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-500/15">
          <div className="flex items-center gap-2">
            <span className="text-[11px] opacity-75">Test Scorer:</span>
            <SegmentedSwitch
              size="sm"
              value={previewScorerTeam}
              onValueChange={(v) => setPreviewScorerTeam(v as 'blue' | 'orange')}
              options={[
                { value: 'blue', label: 'Blue Scorer' },
                { value: 'orange', label: 'Orange Scorer' },
              ]}
              isLight={isLight}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => quickNotification.info('Reset test ball to center spot (0, 0, 93).')}
              isLight={isLight}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1 inline" />
              Reset Ball
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                quickNotification.success(
                  `Triggered ${previewScorerTeam.toUpperCase()} Goal Explosion (${blastImpulse} UU/s radial impulse).`
                )
              }
              isLight={isLight}
            >
              <Play className="h-3.5 w-3.5 mr-1 inline" />
              Trigger Goal Blast
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <SliderControl
          label="Goal Line Plane |Y| (UU)"
          value={goalLineY}
          min={5050}
          max={5200}
          step={1}
          defaultValue={5120}
          onChange={setGoalLineY}
          isLight={isLight}
        />
        <SliderControl
          label="Full-Cross Ball Radius (UU)"
          value={ballRadiusMargin}
          min={80}
          max={110}
          step={step}
          defaultValue={92.75}
          onChange={setBallRadiusMargin}
          isLight={isLight}
        />
        <SliderControl
          label="Explosion Radial Impulse (UU/s)"
          value={blastImpulse}
          min={500}
          max={8000}
          step={50}
          defaultValue={4200}
          onChange={setBlastImpulse}
          isLight={isLight}
        />
        <SliderControl
          label="Radial Distance Falloff Exp"
          value={blastFalloffExp}
          min={0.5}
          max={3.0}
          step={step}
          defaultValue={1.65}
          onChange={setBlastFalloffExp}
          isLight={isLight}
        />
        <SliderControl
          label="Shockwave Ring Scale"
          value={shockwaveParticleDensity}
          min={0.2}
          max={2.5}
          step={step}
          defaultValue={1.0}
          onChange={setShockwaveParticleDensity}
          isLight={isLight}
        />
        <div
          className={`p-3 rounded-xl border flex items-center justify-between ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
          }`}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-amber-500" />
              <span>Render Goal AABB Volume Wireframe</span>
            </span>
            <span className="text-[10px] opacity-65">Show 3D trigger bounding box in viewport</span>
          </div>
          <ToggleSwitch checked={showTriggerWireframe} onChange={setShowTriggerWireframe} ariaLabel="Render Goal AABB Wireframe" isLight={isLight} />
        </div>
      </div>
    </div>
  );
});
GoalVolumeTunerFloatingWindow.displayName = 'GoalVolumeTunerFloatingWindow';
