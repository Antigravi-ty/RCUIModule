import React, { useState } from 'react';
import { SliderControl } from '../../primitives/SliderControl';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { EventFilterMatrix, EventCatalogEntry } from '../../compounds/TunerControls';
import { EventImpulseScatterChart, CollisionImpulseEvent } from '../../charts/EventImpulseScatterChart';

const INITIAL_COLLISION_EVENTS: CollisionImpulseEvent[] = [
  { id: 'ev-1', ageSec: 0.35, value: 1920, type: 'car-ball', label: 'Power Clear (108 KM/H)' },
  { id: 'ev-2', ageSec: 0.95, value: 640, type: 'car-world', label: 'Wall Side Scrape' },
  { id: 'ev-3', ageSec: 1.65, value: 2240, type: 'goalpost', label: 'Crossbar Ping!' },
  { id: 'ev-4', ageSec: 2.30, value: 1380, type: 'car-ball', label: 'Aerial Redirect' },
  { id: 'ev-5', ageSec: 3.15, value: 420, type: 'car-world', label: 'Landing Wheel Tap' },
  { id: 'ev-6', ageSec: 4.10, value: 1750, type: 'car-ball', label: 'Diagonal Kickoff First Touch' },
];

const EVENT_CATALOG: EventCatalogEntry[] = [
  { hex: '0x01', id: 'car-ball', name: 'Car ↔ Ball Impact' },
  { hex: '0x02', id: 'car-world', name: 'Chassis ↔ Arena Wall' },
  { hex: '0x03', id: 'goalpost', name: 'Ball ↔ Goalpost Metallic' },
  { hex: '0x04', id: 'demolition', name: 'Supersonic Demolition' },
];

/**
 * 13. [Dev] Collision Event Stream & Audio Threshold (`event-stream-ob`)
 * Standalone L6 Floating Window Panel — uses L5 `EventImpulseScatterChart` + Parameter/Time Window controls + L1 `EventFilterMatrix`.
 */
export const EventStreamOBFloatingWindow: React.FC<{ isLight?: boolean }> = React.memo(({ isLight = false }) => {
  const [events, setEvents] = useState<CollisionImpulseEvent[]>(INITIAL_COLLISION_EVENTS);
  const [activeParam, setActiveParam] = useState<'impulse' | 'relSpeed' | 'normalRelVel' | 'speed' | 'z'>('impulse');
  const [quickFilter, setQuickFilter] = useState<'all' | 'car-ball' | 'car-world'>('all');
  const [threshold, setThreshold] = useState<number>(750);
  const [timeWindowSec, setTimeWindowSec] = useState<number>(5.0);
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({
    '0x01': true,
    '0x02': true,
    '0x03': true,
    '0x04': true,
  });

  const filteredEvents = events.filter((e) => {
    if (e.ageSec > timeWindowSec) return false;
    if (quickFilter === 'car-ball' && e.type !== 'car-ball') return false;
    if (quickFilter === 'car-world' && e.type !== 'car-world') return false;
    return true;
  });

  const peakInView = filteredEvents.reduce((max, e) => Math.max(max, e.value), 0);
  const lastValue = filteredEvents[0]?.value ?? 0;

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      {/* 1. Header Parameter & Quick Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold opacity-75">Telemetry Axis:</span>
          <select
            value={activeParam}
            onChange={(e) => setActiveParam(e.target.value as typeof activeParam)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold outline-none cursor-pointer transition-colors ${
              isLight
                ? 'bg-neutral-100 border-neutral-300 text-neutral-800'
                : 'bg-neutral-800 border-neutral-700 text-neutral-200'
            }`}
          >
            <option value="impulse">Impulse (Force)</option>
            <option value="relSpeed">Relative Speed</option>
            <option value="normalRelVel">Normal Rel Vel</option>
            <option value="speed">Speed</option>
            <option value="z">Coordinate Z</option>
          </select>
        </div>

        <SegmentedSwitch
          value={quickFilter}
          onValueChange={(v) => setQuickFilter(v as typeof quickFilter)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'car-ball', label: 'Ball' },
            { value: 'car-world', label: 'World' },
          ]}
          size="sm"
          isLight={isLight}
        />
      </div>

      {/* 2. Scatter Plot Viewport */}
      <EventImpulseScatterChart
        events={filteredEvents}
        threshold={threshold}
        timeWindowSec={timeWindowSec}
        onThresholdChange={setThreshold}
        onClear={() => setEvents([])}
        height={160}
        isLight={isLight}
      />

      {/* 3. Stat Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div
          className={`p-2 rounded-xl border flex flex-col gap-0.5 ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
          }`}
        >
          <span className="text-[10px] text-neutral-400 font-mono">Total Hits</span>
          <span className="text-sm font-mono font-bold text-sky-400">{filteredEvents.length}</span>
        </div>

        <div
          className={`p-2 rounded-xl border flex flex-col gap-0.5 ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
          }`}
        >
          <span className="text-[10px] text-neutral-400 font-mono">Last Value</span>
          <span className="text-sm font-mono font-bold text-amber-400">{lastValue.toFixed(1)}</span>
        </div>

        <div
          className={`p-2 rounded-xl border flex flex-col gap-0.5 ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
          }`}
        >
          <span className="text-[10px] text-neutral-400 font-mono">Peak In-View</span>
          <span className="text-sm font-mono font-bold text-emerald-400">{peakInView.toFixed(1)}</span>
        </div>
      </div>

      {/* 4. Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <SliderControl
          label="Acoustic Impulse Gate Threshold (N·s)"
          description="Impulses below threshold are suppressed"
          value={threshold}
          min={50}
          max={2400}
          step={25}
          defaultValue={750}
          onChange={setThreshold}
          isLight={isLight}
        />
        <SliderControl
          label="Rolling Time Window (s)"
          description="Visible scatter plot history window"
          value={timeWindowSec}
          min={1.0}
          max={10.0}
          step={0.5}
          defaultValue={5.0}
          onChange={setTimeWindowSec}
          isLight={isLight}
        />
      </div>

      <EventFilterMatrix
        title="Collision Bus Hex Filter (0x01..0x04)"
        items={EVENT_CATALOG}
        selectedMap={selectedMap}
        onToggleItem={(hex) =>
          setSelectedMap((prev) => ({ ...prev, [hex.toLowerCase()]: !prev[hex.toLowerCase()] }))
        }
        onSelectAll={() => setSelectedMap({ '0x01': true, '0x02': true, '0x03': true, '0x04': true })}
        onDeselectAll={() => setSelectedMap({ '0x01': false, '0x02': false, '0x03': false, '0x04': false })}
        isLight={isLight}
      />
    </div>
  );
});
EventStreamOBFloatingWindow.displayName = 'EventStreamOBFloatingWindow';
