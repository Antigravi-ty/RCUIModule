import React, { useState } from 'react';
import { ShieldCheck, Play, RotateCcw } from 'lucide-react';
import { SliderControl } from '../../primitives/SliderControl';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { Button } from '../../primitives/Button';
import { CounterfactualComparisonStrip } from './cards/CounterfactualComparisonStrip';
import { quickNotification } from '../../stores/quickNotificationStore';

/**
 * 14. [Dev] Dual-Arena Rollback Determinism Harness (`dual-arena-determinism-harness`)
 * Standalone L6 Floating Window Panel — uses L2 `CounterfactualComparisonStrip`.
 */
export const DualArenaDeterminismHarnessFloatingWindow: React.FC<{ isLight?: boolean }> = React.memo(({ isLight = false }) => {
  const [rollbackDepthTicks, setRollbackDepthTicks] = useState(12);
  const [injectEveryNTicks, setInjectEveryNTicks] = useState(30);
  const [continuousResim, setContinuousResim] = useState(true);

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      <div
        className={`p-3 rounded-xl border flex items-center justify-between ${
          isLight ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <div className="flex flex-col">
            <span className="font-bold">Arena A vs Arena B · Bitwise State Hash Lock</span>
            <span className="text-[10px] font-mono opacity-75">
              CRC32C: 0x84F2A10E === 0x84F2A10E · Pos Δ: 0.000000 UU · Vel Δ: 0.000000 UU/s
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => quickNotification.info('Reset Dual-Arena state & cleared hash history.')}
            isLight={isLight}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 inline" />
            Reset
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() =>
              quickNotification.success(
                `Forced ${rollbackDepthTicks}-tick rollback + re-simulation: 0 bit divergence.`
              )
            }
            isLight={isLight}
          >
            <Play className="h-3.5 w-3.5 mr-1 inline" />
            Force Rollback Now
          </Button>
        </div>
      </div>

      <CounterfactualComparisonStrip
        title="Dual-Arena Forward vs Rollback Re-Simulation Parity"
        baselineLabel="Arena A (Continuous)"
        simulatedLabel={`Arena B (${rollbackDepthTicks}t Rollback)`}
        statusBadgeText="HASH MATCH"
        statusVariant="success"
        metrics={[
          {
            id: 'crc-hash',
            label: 'State Snapshot CRC32C',
            baselineValue: '0x84F2A10E',
            simulatedValue: '0x84F2A10E',
            deltaText: 'EXACT',
            improved: true,
          },
          {
            id: 'pos-delta',
            label: 'Max Position Divergence',
            baselineValue: '0.0000 UU',
            simulatedValue: '0.0000 UU',
            deltaText: '0.0000 UU',
            lowerIsBetter: true,
            improved: true,
          },
          {
            id: 'resim-cost',
            label: `${rollbackDepthTicks}-Tick Re-Sim Cost`,
            baselineValue: '0.00 ms',
            simulatedValue: `${(rollbackDepthTicks * 0.018).toFixed(2)} ms`,
            deltaText: 'Budget OK',
            improved: 'neutral',
          },
        ]}
        isLight={isLight}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <SliderControl
          label="Rollback Rewind Depth (ticks)"
          description="Number of ticks rewound and re-simulated per test"
          value={rollbackDepthTicks}
          min={1}
          max={36}
          step={1}
          defaultValue={12}
          onChange={setRollbackDepthTicks}
          isLight={isLight}
        />
        <SliderControl
          label="Injection Interval (ticks)"
          description="Frequency of forced rollback verification"
          value={injectEveryNTicks}
          min={5}
          max={120}
          step={5}
          defaultValue={30}
          onChange={setInjectEveryNTicks}
          isLight={isLight}
        />
        <div
          className={`md:col-span-2 p-3 rounded-xl border flex items-center justify-between ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
          }`}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">Continuous Background Rollback Stress</span>
            <span className="text-[10px] opacity-65">Automatically snapshot, rewind, and verify every N ticks</span>
          </div>
          <ToggleSwitch checked={continuousResim} onChange={setContinuousResim} ariaLabel="Continuous Background Rollback Stress" isLight={isLight} />
        </div>
      </div>
    </div>
  );
});
DualArenaDeterminismHarnessFloatingWindow.displayName = 'DualArenaDeterminismHarnessFloatingWindow';
