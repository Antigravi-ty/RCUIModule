import React, { useState } from 'react';
import { SliderControl } from '../../primitives/SliderControl';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { ColorSwatchInput, TunerToggleRow, TunerSummaryStrip } from '../../compounds/TunerControls';
import { ParametricTrajectoryChart } from '../../charts/ParametricTrajectoryChart';
import { FloatingWindowToolbar } from '../FloatingWindowToolbar';

/**
 * 18. [Dev] Boost Pad Orb, Shader & Pickup FX Tuner (`boost-pad-tuner`)
 * Standalone L6 Floating Window Panel — 5 complete sub-tabs (`materials`, `shader`, `rotations`, `refill`, `collect-fx`).
 */
export const BoostPadTunerFloatingWindow: React.FC<{
  isLight?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}> = React.memo(({ isLight = false, activeTab = 'materials', onTabChange }) => {
  const [step, setStep] = useState(0.01);

  // Materials & Shader
  const [orbEmissiveGain, setOrbEmissiveGain] = useState(2.4);
  const [padBaseRoughness, setPadBaseRoughness] = useState(0.32);
  const [fresnelRimPower, setFresnelRimPower] = useState(2.8);
  const [corePulseHz, setCorePulseHz] = useState(1.6);
  const [orbCoreColor, setOrbCoreColor] = useState('#f59e0b');

  // Rotations & Bobbing
  const [orbSpinDegPerSec, setOrbSpinDegPerSec] = useState(110);
  const [bobAmplitudeUu, setBobAmplitudeUu] = useState(6.5);
  const [bobFrequencyHz, setBobFrequencyHz] = useState(0.85);

  // Refill Timers
  const [bigPadCooldownSec, setBigPadCooldownSec] = useState(10.0);
  const [smallPadCooldownSec, setSmallPadCooldownSec] = useState(4.0);
  const [showRadialPieSweep, setShowRadialPieSweep] = useState(true);

  // Collect FX Trajectory
  const [burstDurationMs, setBurstDurationMs] = useState(380);
  const [dropDistanceUu, setDropDistanceUu] = useState(125);
  const [ringExpandScale, setRingExpandScale] = useState(2.1);

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      <FloatingWindowToolbar
        title={`Boost Pad Shader & Pickup FX Tuner · ${activeTab.toUpperCase()}`}
        subtitle="Calibrates 100%/12% boost orb shader, rotation bobbing, cooldown pie, and magnetic suction"
        step={step}
        onStepChange={setStep}
        presets={['Standard Golden', 'High-Vis Neon', 'Minimal Competitive']}
        activePreset="Standard Golden"
        onReset={() => {
          setOrbEmissiveGain(2.4);
          setOrbSpinDegPerSec(110);
          setBurstDurationMs(380);
          setDropDistanceUu(125);
        }}
        isLight={isLight}
      />

      {onTabChange && (
        <SegmentedSwitch
          value={activeTab}
          onValueChange={onTabChange}
          options={[
            { value: 'materials', label: 'Materials' },
            { value: 'shader', label: 'Shader' },
            { value: 'rotations', label: 'Rotations' },
            { value: 'refill', label: 'Refill' },
            { value: 'collect-fx', label: 'Collect FX' },
          ]}
          size="sm"
          isLight={isLight}
        />
      )}

      {(activeTab === 'materials' || activeTab === 'shader') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <SliderControl
            label="Orb Core Emissive Gain"
            value={orbEmissiveGain}
            min={0.5}
            max={6.0}
            step={step}
            defaultValue={2.4}
            onChange={setOrbEmissiveGain}
            isLight={isLight}
          />
          <SliderControl
            label="Pedestal Metallic Roughness"
            value={padBaseRoughness}
            min={0.05}
            max={1.0}
            step={step}
            defaultValue={0.32}
            onChange={setPadBaseRoughness}
            isLight={isLight}
          />
          <SliderControl
            label="Hologram Fresnel Rim Exp"
            value={fresnelRimPower}
            min={0.5}
            max={6.0}
            step={step}
            defaultValue={2.8}
            onChange={setFresnelRimPower}
            isLight={isLight}
          />
          <SliderControl
            label="Shader Pulse Frequency (Hz)"
            value={corePulseHz}
            min={0.2}
            max={5.0}
            step={step}
            defaultValue={1.6}
            onChange={setCorePulseHz}
            isLight={isLight}
          />
          <div className="md:col-span-2">
            <ColorSwatchInput
              label="100% Full Boost Orb Albedo"
              value={orbCoreColor}
              onChange={setOrbCoreColor}
              presets={['#f59e0b', '#fbbf24', '#38bdf8', '#10b981', '#f43f5e']}
              isLight={isLight}
            />
          </div>
        </div>
      )}

      {activeTab === 'rotations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <SliderControl
            label="Orb Yaw Spin (°/s)"
            value={orbSpinDegPerSec}
            min={0}
            max={360}
            step={5}
            defaultValue={110}
            onChange={setOrbSpinDegPerSec}
            isLight={isLight}
          />
          <SliderControl
            label="Vertical Bob Amplitude (UU)"
            value={bobAmplitudeUu}
            min={0}
            max={20}
            step={step}
            defaultValue={6.5}
            onChange={setBobAmplitudeUu}
            isLight={isLight}
          />
          <SliderControl
            label="Vertical Bob Rate (Hz)"
            value={bobFrequencyHz}
            min={0.1}
            max={3.0}
            step={step}
            defaultValue={0.85}
            onChange={setBobFrequencyHz}
            isLight={isLight}
          />
        </div>
      )}

      {activeTab === 'refill' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <SliderControl
            label="Big Pad Respawn Time (s)"
            value={bigPadCooldownSec}
            min={2.0}
            max={20.0}
            step={0.5}
            defaultValue={10.0}
            onChange={setBigPadCooldownSec}
            isLight={isLight}
          />
          <SliderControl
            label="Small Pad Respawn Time (s)"
            value={smallPadCooldownSec}
            min={1.0}
            max={10.0}
            step={0.5}
            defaultValue={4.0}
            onChange={setSmallPadCooldownSec}
            isLight={isLight}
          />
          <div className="md:col-span-2 flex flex-col gap-2">
            <TunerToggleRow
              label="Render Ground Radial Cooldown Pie"
              description="Sweeps 0°→360° angular progress ring on pad base"
              checked={showRadialPieSweep}
              onChange={setShowRadialPieSweep}
              isLight={isLight}
            />
            <TunerSummaryStrip
              isLight={isLight}
              items={[
                { label: '100% Big Pad', value: `${bigPadCooldownSec.toFixed(1)}s` },
                { label: '12% Small Pad', value: `${smallPadCooldownSec.toFixed(1)}s` },
                { label: 'Pie Sweep', value: showRadialPieSweep ? 'ON' : 'OFF' },
              ]}
            />
          </div>
        </div>
      )}

      {activeTab === 'collect-fx' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <SliderControl
              label="Pickup Suction Duration (ms)"
              value={burstDurationMs}
              min={120}
              max={800}
              step={10}
              defaultValue={380}
              onChange={setBurstDurationMs}
              isLight={isLight}
            />
            <SliderControl
              label="Magnetic Suction Distance (UU)"
              value={dropDistanceUu}
              min={30}
              max={300}
              step={5}
              defaultValue={125}
              onChange={setDropDistanceUu}
              isLight={isLight}
            />
            <SliderControl
              label="Shockwave Ring Scale"
              value={ringExpandScale}
              min={1.0}
              max={4.0}
              step={step}
              defaultValue={2.1}
              onChange={setRingExpandScale}
              isLight={isLight}
            />
          </div>

          <ParametricTrajectoryChart
            title="Pickup Orb Magnetic Suction Trajectory"
            p1x={0.18}
            p1y={-0.65}
            p2x={0.32}
            p2y={1.0}
            durationMs={burstDurationMs}
            dropDistance={dropDistanceUu}
            unit="UU"
            isLight={isLight}
          />
        </>
      )}
    </div>
  );
});
BoostPadTunerFloatingWindow.displayName = 'BoostPadTunerFloatingWindow';
