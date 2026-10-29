import React, { useState } from 'react';
import { SliderControl } from '../../primitives/SliderControl';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { NameTagCalibrationMatrixCard } from './cards/NameTagCalibrationMatrixCard';
import { FloatingWindowToolbar } from '../FloatingWindowToolbar';

/**
 * 3. [Dev] 3D NameTag Occlusion & Scale Tuner (`name-tag-tuner`)
 * Standalone L6 Floating Window Panel — uses L2 `NameTagCalibrationMatrixCard`.
 */
export const NameTagTunerFloatingWindow: React.FC<{ isLight?: boolean }> = React.memo(({ isLight = false }) => {
  const [step, setStep] = useState(0.01);
  const [pillWidth, setPillWidth] = useState(208);
  const [pillHeight, setPillHeight] = useState(54);
  const [distanceExponent, setDistanceExponent] = useState(0.86);
  const [verticalOffsetUU, setVerticalOffsetUU] = useState(55);
  const [screenYOffsetPx, setScreenYOffsetPx] = useState(-14);
  const [depthOcclusionRay, setDepthOcclusionRay] = useState(true);

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      <FloatingWindowToolbar
        title="3D Vehicle NameTag & Distance Falloff Tuner"
        subtitle="Calibrates 6-car kickoff nameplate matrix, least-squares distance power-law & occlusion"
        step={step}
        onStepChange={setStep}
        presets={['RLCS Broadcast', 'High Contrast', 'Minimal Pill']}
        activePreset="RLCS Broadcast"
        onReset={() => {
          setPillWidth(208);
          setPillHeight(54);
          setDistanceExponent(0.86);
          setVerticalOffsetUU(55);
          setScreenYOffsetPx(-14);
        }}
        isLight={isLight}
      />

      <NameTagCalibrationMatrixCard
        pillWidth={pillWidth}
        pillHeight={pillHeight}
        distanceExponent={distanceExponent}
        verticalOffsetUU={verticalOffsetUU}
        screenYOffsetPx={screenYOffsetPx}
        onApplyFittedExponent={setDistanceExponent}
        isLight={isLight}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <SliderControl
          label="World Z Anchor Offset (UU)"
          value={verticalOffsetUU}
          min={20}
          max={120}
          step={1}
          defaultValue={55}
          onChange={setVerticalOffsetUU}
          isLight={isLight}
        />
        <SliderControl
          label="Screen-Space Y Bias (px)"
          value={screenYOffsetPx}
          min={-48}
          max={24}
          step={1}
          defaultValue={-14}
          onChange={setScreenYOffsetPx}
          isLight={isLight}
        />
        <SliderControl
          label="Distance Falloff Exponent"
          value={distanceExponent}
          min={0.4}
          max={1.4}
          step={step}
          defaultValue={0.86}
          onChange={setDistanceExponent}
          isLight={isLight}
        />
        <div
          className={`p-3 rounded-xl border flex items-center justify-between ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
          }`}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">Ball Occlusion Alpha Fade</span>
            <span className="text-[10px] opacity-65">Dim nameplate to 35% when behind ball</span>
          </div>
          <ToggleSwitch checked={depthOcclusionRay} onChange={setDepthOcclusionRay} ariaLabel="Ball Occlusion Alpha Fade" isLight={isLight} />
        </div>
      </div>
    </div>
  );
});
NameTagTunerFloatingWindow.displayName = 'NameTagTunerFloatingWindow';
