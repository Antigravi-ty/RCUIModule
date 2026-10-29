import React, { useState } from 'react';
import { SliderControl } from '../../primitives/SliderControl';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { DualGrabberSlider } from '../../primitives/DualGrabberSlider';
import { PacingOscilloscopeChart } from '../../charts/PacingOscilloscopeChart';
import { CounterfactualComparisonStrip } from './cards/CounterfactualComparisonStrip';
import { FloatingWindowToolbar } from '../FloatingWindowToolbar';

/**
 * 17. [Dev] Adaptive Clock Pacing & Deadband Tuner (`clock-pacing-tuner`)
 * Standalone L6 Floating Window Panel — uses L5 `PacingOscilloscopeChart` + L2 `CounterfactualComparisonStrip`.
 */
export const ClockPacingTunerFloatingWindow: React.FC<{ isLight?: boolean }> = React.memo(({ isLight = false }) => {
  const [step, setStep] = useState(0.01);
  const [pacingAlgorithm, setPacingAlgorithm] = useState<'adaptive' | 'fixed-lead'>('adaptive');
  const [targetLeadTicks, setTargetLeadTicks] = useState(2.0);
  const [deadbandRange, setDeadbandRange] = useState<[number, number]>([-2, 2]);
  const [kpGain, setKpGain] = useState(0.0025);
  const [maxRateShiftPct, setMaxRateShiftPct] = useState(2.0);

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      <FloatingWindowToolbar
        title="Adaptive 120Hz Clock Pacing & Deadband Controller"
        subtitle="Tunes proportional tick-rate dilation (±2%), hysteresis deadband, and counterfactual pacing"
        step={step}
        onStepChange={setStep}
        presets={['Tournament Lock', 'Wi-Fi Tolerant', 'Zero Dilation']}
        activePreset="Tournament Lock"
        onReset={() => {
          setTargetLeadTicks(2.0);
          setDeadbandRange([-2, 2]);
          setKpGain(0.0025);
          setMaxRateShiftPct(2.0);
        }}
        isLight={isLight}
      />

      <CounterfactualComparisonStrip
        title="Pacing Algorithm Counterfactual Simulator (Same Jitter Trace)"
        baselineLabel="Fixed Lead (+2t)"
        simulatedLabel={`Adaptive (±${maxRateShiftPct.toFixed(1)}%)`}
        statusBadgeText="OPTIMAL"
        statusVariant="success"
        metrics={[
          {
            id: 'starvation',
            label: 'Queue Starvation Rate',
            baselineValue: '0.42%',
            simulatedValue: '0.00%',
            deltaText: '-0.42%',
            lowerIsBetter: true,
            improved: true,
          },
          {
            id: 'p95-err',
            label: 'P95 Buffer Error',
            baselineValue: '0.91f',
            simulatedValue: '0.38f',
            deltaText: '-0.53f',
            lowerIsBetter: true,
            improved: true,
          },
          {
            id: 'rate-stddev',
            label: 'Physics Rate StdDev',
            baselineValue: '0.00Hz',
            simulatedValue: '0.42Hz',
            deltaText: '+0.42Hz',
            improved: 'neutral',
          },
        ]}
        isLight={isLight}
      />

      <PacingOscilloscopeChart
        height={215}
        deadbandOffsets={deadbandRange}
        isLight={isLight}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <SegmentedSwitch
          value={pacingAlgorithm}
          onValueChange={(v) => setPacingAlgorithm(v as typeof pacingAlgorithm)}
          options={[
            { value: 'adaptive', label: 'Adaptive PI Controller' },
            { value: 'fixed-lead', label: 'Fixed Lead Only' },
          ]}
          size="sm"
          isLight={isLight}
        />
        <SliderControl
          label="Target Input Lead (ticks)"
          value={targetLeadTicks}
          min={0.5}
          max={6.0}
          step={0.5}
          defaultValue={2.0}
          onChange={setTargetLeadTicks}
          isLight={isLight}
        />
        <div className="md:col-span-2">
          <DualGrabberSlider
            label="Buffer Error Hysteresis Deadband (ticks)"
            description="No clock speed adjustment when queue error remains inside [min, max]"
            min={-6}
            max={6}
            step={0.5}
            value={deadbandRange}
            onChange={setDeadbandRange}
            unit="t"
            isLight={isLight}
          />
        </div>
        <SliderControl
          label="Proportional Gain (Kp)"
          value={kpGain}
          min={0.0005}
          max={0.01}
          step={0.0005}
          defaultValue={0.0025}
          onChange={setKpGain}
          isLight={isLight}
        />
        <SliderControl
          label="Max Dilation Clamp (±%)"
          value={maxRateShiftPct}
          min={0.5}
          max={5.0}
          step={0.25}
          defaultValue={2.0}
          onChange={setMaxRateShiftPct}
          isLight={isLight}
        />
      </div>
    </div>
  );
});
ClockPacingTunerFloatingWindow.displayName = 'ClockPacingTunerFloatingWindow';
