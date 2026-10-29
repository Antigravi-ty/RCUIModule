import React, { useState } from 'react';
import { WifiOff, Zap } from 'lucide-react';
import { SliderControl } from '../../primitives/SliderControl';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { Button } from '../../primitives/Button';
import { FloatingWindowToolbar } from '../FloatingWindowToolbar';
import { quickNotification } from '../../tokens/quickNotificationStore';

/**
 * 16. [Dev] Network Stress & Jitter Injection (`network-stress-injection`)
 * Standalone L6 Floating Window Panel — includes Burst Spike & Out-of-Order Reorder simulation.
 */
export const NetworkStressInjectionFloatingWindow: React.FC<{ isLight?: boolean }> = React.memo(({ isLight = false }) => {
  const [step, setStep] = useState(1);
  const [enabled, setEnabled] = useState(false);
  const [baseLatencyMs, setBaseLatencyMs] = useState(45);
  const [jitterStdMs, setJitterStdMs] = useState(12);
  const [packetLossPct, setPacketLossPct] = useState(2.5);
  const [reorderPct, setReorderPct] = useState(1.0);
  const [burstDropTicks, setBurstDropTicks] = useState(8);

  const applyProfile = (name: string, rtt: number, jitter: number, loss: number, reorder: number) => {
    setEnabled(true);
    setBaseLatencyMs(rtt);
    setJitterStdMs(jitter);
    setPacketLossPct(loss);
    setReorderPct(reorder);
    quickNotification.info(`Applied "${name}" network stress profile.`);
  };

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      <FloatingWindowToolbar
        title="Synthetic WebRTC Packet Loss & Jitter Injector"
        subtitle="Simulates asymmetric RTT, Gilbert-Elliott burst drops, and packet reordering"
        step={step}
        onStepChange={setStep}
        presets={['Clean LAN (0ms)', 'Wi-Fi Contention', '4G Cellular Burst', 'Trans-Oceanic']}
        activePreset="Wi-Fi Contention"
        onSelectPreset={(preset) => {
          if (preset.startsWith('Clean')) applyProfile(preset, 0, 0, 0, 0);
          else if (preset.startsWith('Wi-Fi')) applyProfile(preset, 38, 14, 1.5, 0.8);
          else if (preset.startsWith('4G')) applyProfile(preset, 85, 32, 4.5, 2.5);
          else applyProfile(preset, 145, 8, 0.5, 0.2);
        }}
        onReset={() => {
          setEnabled(false);
          setBaseLatencyMs(0);
          setJitterStdMs(0);
          setPacketLossPct(0);
          setReorderPct(0);
          setBurstDropTicks(0);
        }}
        isLight={isLight}
      />

      <div
        className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
          enabled
            ? isLight
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            : isLight
            ? 'bg-neutral-50 border-neutral-200'
            : 'bg-neutral-900/60 border-neutral-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <WifiOff className={`h-4 w-4 ${enabled ? 'text-amber-500' : 'text-neutral-400'}`} />
          <div className="flex flex-col">
            <span className="font-bold">
              {enabled ? 'Stress Interceptor ACTIVE on Loopback DataChannel' : 'Stress Interceptor Bypassed (0ms Native)'}
            </span>
            <span className="text-[10px] font-mono opacity-75">
              Effective RTT: ~{enabled ? baseLatencyMs * 2 : 0}ms ±{enabled ? jitterStdMs : 0}ms · Loss: {enabled ? packetLossPct : 0}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              quickNotification.warning(`Injected 250ms lag spike (${burstDropTicks} dropped frames).`)
            }
            isLight={isLight}
          >
            <Zap className="h-3.5 w-3.5 mr-1 inline text-amber-500" />
            Pulse 250ms Spike
          </Button>
          <ToggleSwitch checked={enabled} onChange={setEnabled} ariaLabel="Enable Network Stress Interceptor" isLight={isLight} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <SliderControl
          label="One-Way Base Latency (ms)"
          value={baseLatencyMs}
          min={0}
          max={250}
          step={5}
          defaultValue={45}
          onChange={setBaseLatencyMs}
          isLight={isLight}
        />
        <SliderControl
          label="PDV Jitter StdDev (±ms)"
          value={jitterStdMs}
          min={0}
          max={80}
          step={1}
          defaultValue={12}
          onChange={setJitterStdMs}
          isLight={isLight}
        />
        <SliderControl
          label="Random Packet Loss (%)"
          value={packetLossPct}
          min={0}
          max={25}
          step={0.5}
          defaultValue={2.5}
          onChange={setPacketLossPct}
          isLight={isLight}
        />
        <SliderControl
          label="Out-of-Order Reorder (%)"
          value={reorderPct}
          min={0}
          max={15}
          step={0.5}
          defaultValue={1.0}
          onChange={setReorderPct}
          isLight={isLight}
        />
        <div className="md:col-span-2">
          <SliderControl
            label="Gilbert-Elliott Burst Drop Length (ticks)"
            description="Consecutive 120Hz input packets dropped during a burst event"
            value={burstDropTicks}
            min={0}
            max={30}
            step={1}
            defaultValue={8}
            onChange={setBurstDropTicks}
            isLight={isLight}
          />
        </div>
      </div>
    </div>
  );
});
NetworkStressInjectionFloatingWindow.displayName = 'NetworkStressInjectionFloatingWindow';
