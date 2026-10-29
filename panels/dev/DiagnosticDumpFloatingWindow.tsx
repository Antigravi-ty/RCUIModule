import React, { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Button } from '../../primitives/Button';
import { RingBufferCapacityGaugeCard } from './cards/RingBufferCapacityGaugeCard';
import { quickNotification } from '../../tokens/quickNotificationStore';

/**
 * 1. [Dev] Diagnostic Dump Exporter (`diagnostic-dump-exporter`)
 * Standalone L6 Floating Window Panel — uses L2 `RingBufferCapacityGaugeCard`.
 */
export const DiagnosticDumpFloatingWindow: React.FC<{ isLight?: boolean }> = React.memo(({ isLight = false }) => {
  const [selectedCapacity, setSelectedCapacity] = useState<number>(36000);
  const [autoPauseOnOverflow, setAutoPauseOnOverflow] = useState<boolean>(true);
  const [includeState, setIncludeState] = useState<boolean>(true);
  const [includeIncidents, setIncludeIncidents] = useState<boolean>(true);
  const [includeSignals, setIncludeSignals] = useState<boolean>(true);
  const [includeAudio, setIncludeAudio] = useState<boolean>(true);
  const [usedFrames, setUsedFrames] = useState<number>(14280);

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      <RingBufferCapacityGaugeCard
        buffers={[
          {
            id: 'state',
            label: 'Track A · Physics & Input Ring Buffer',
            subtitle: '120Hz rigid-body state + controller bitmask',
            usedFrames,
            maxFrames: selectedCapacity,
            fps: 120,
            estimatedBytesPerFrame: 128,
            colorScheme: 'sky',
            included: includeState,
            onToggleInclude: setIncludeState,
          },
          {
            id: 'incident',
            label: 'Track B · Collision & Impulse Incidents',
            subtitle: 'Sparse event stream (0x01..0x0F)',
            usedFrames: Math.round(usedFrames * 0.04),
            maxFrames: 4096,
            fps: 120,
            estimatedBytesPerFrame: 48,
            colorScheme: 'amber',
            included: includeIncidents,
            onToggleInclude: setIncludeIncidents,
          },
          {
            id: 'signal',
            label: 'Track C · Match State Signals',
            subtitle: 'Kickoff / Goal / Overtime state transitions',
            usedFrames: 42,
            maxFrames: 1024,
            fps: 120,
            estimatedBytesPerFrame: 32,
            colorScheme: 'emerald',
            included: includeSignals,
            onToggleInclude: setIncludeSignals,
          },
          {
            id: 'audio',
            label: 'Track D · WebAudio Spatial Bus Telemetry',
            subtitle: 'Voice steals, gain envelopes & HRTF panner states',
            usedFrames: Math.round(usedFrames * 0.25),
            maxFrames: 12000,
            fps: 60,
            estimatedBytesPerFrame: 64,
            colorScheme: 'violet',
            included: includeAudio,
            onToggleInclude: setIncludeAudio,
          },
        ]}
        selectedCapacityFrames={selectedCapacity}
        onSelectCapacityFrames={(frames) => {
          setSelectedCapacity(frames);
          setUsedFrames((prev) => Math.min(prev, frames));
        }}
        autoPauseOnOverflow={autoPauseOnOverflow}
        onToggleAutoPauseOnOverflow={setAutoPauseOnOverflow}
        isLight={isLight}
      />

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setUsedFrames(0);
            quickNotification.info('Cleared all ring buffer diagnostic tracks.');
          }}
          isLight={isLight}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1 inline" />
          Clear Ring Buffers
        </Button>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => quickNotification.info('Captured instant 120Hz memory snapshot.')}
            isLight={isLight}
          >
            Capture Snapshot
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() =>
              quickNotification.success(
                `Exported RC_DiagnosticDump_${selectedCapacity}f.json.gz`
              )
            }
            isLight={isLight}
          >
            <Download className="h-3.5 w-3.5 mr-1 inline" />
            Export .json.gz Bundle
          </Button>
        </div>
      </div>
    </div>
  );
});
DiagnosticDumpFloatingWindow.displayName = 'DiagnosticDumpFloatingWindow';
