import React from 'react';
import { Database, Server, ShieldCheck } from 'lucide-react';
import { Card } from '../../layout/Card';
import type {
  CanonicalLabRelayId,
  SignalingLabEndpointViewConfig,
  SignalingLabProbeSummaryView,
  SignalingLabScenarioId,
} from './signalingLabTypes';

export interface DevSignalingRelayStatusGridProps {
  isLight: boolean;
  endpointConfig: SignalingLabEndpointViewConfig;
  probeSummary: SignalingLabProbeSummaryView | null;
  isBusy: boolean;
  customSourceRelay: CanonicalLabRelayId;
  onCustomSourceRelayChange: (next: CanonicalLabRelayId) => void;
  customTargetRelay: CanonicalLabRelayId;
  onCustomTargetRelayChange: (next: CanonicalLabRelayId) => void;
  onRunScenario: (scenario: SignalingLabScenarioId, label: string) => void;
  onHover: (desc: string | null) => void;
}

const CANONICAL_SLOT_KEYS: readonly CanonicalLabRelayId[] = [
  'emqx_cn',
  'emqx_gb',
  'supabase_jp',
  'supabase_sg',
];

export const DevSignalingRelayStatusGrid: React.FC<DevSignalingRelayStatusGridProps> = React.memo(
  ({
    isLight,
    endpointConfig,
    probeSummary,
    isBusy,
    customSourceRelay,
    onCustomSourceRelayChange,
    customTargetRelay,
    onCustomTargetRelayChange,
    onRunScenario,
    onHover,
  }) => {
    const maskVal = probeSummary?.computedMask ?? 0;
    const jpStats = probeSummary?.jpEdgeStats;
    const sgStats = probeSummary?.sgEdgeStats;

    const statusBadgeClass = (ok: boolean | undefined) =>
      ok
        ? isLight
          ? 'bg-emerald-500/15 text-emerald-800 border-emerald-500/35'
          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : isLight
        ? 'bg-rose-500/15 text-rose-800 border-rose-500/35'
        : 'bg-rose-500/20 text-rose-300 border-rose-500/30';

    const pillClass = isLight
      ? 'px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200/80 text-neutral-700'
      : 'px-1.5 py-0.5 rounded bg-neutral-900/70 border border-neutral-800 text-neutral-300';

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {CANONICAL_SLOT_KEYS.map((slotKey) => {
            const cfgSlot = endpointConfig.slots[slotKey];
            const probedSlot = probeSummary?.slots?.[slotKey];
            const isOnline = probedSlot?.ok;
            const rttMs = probedSlot?.rttMs ?? 0;
            const isMqtt = cfgSlot.protocol === 'mqtt';

            return (
              <Card
                key={slotKey}
                isLight={isLight}
                variant="outlined"
                padding="sm"
                className="flex flex-col gap-1"
                onMouseEnter={() =>
                  onHover(
                    `${cfgSlot.label} (Bit=${cfgSlot.bit}): ${cfgSlot.url} | Inbound Edge: ${cfgSlot.edgeNodeId}`
                  )
                }
                onMouseLeave={() => onHover(null)}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[11px] font-bold font-mono inline-flex items-center gap-1 ${
                      isLight ? 'text-neutral-800' : 'text-neutral-200'
                    }`}
                  >
                    {isMqtt ? (
                      <Server
                        className={`h-3.5 w-3.5 ${
                          isLight ? 'text-purple-600' : 'text-purple-400'
                        }`}
                      />
                    ) : (
                      <Database
                        className={`h-3.5 w-3.5 ${
                          isLight ? 'text-emerald-600' : 'text-emerald-400'
                        }`}
                      />
                    )}
                    {slotKey} ({cfgSlot.bit})
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${statusBadgeClass(
                      isOnline
                    )}`}
                  >
                    {isOnline ? `${rttMs}ms` : probeSummary ? 'ERR' : 'IDLE'}
                  </span>
                </div>
                <div
                  className={`text-[10px] font-mono truncate ${
                    isLight ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                >
                  {cfgSlot.url}
                </div>
                <div
                  className={`text-[10px] truncate ${
                    isLight ? 'text-neutral-600' : 'text-neutral-400'
                  }`}
                >
                  {isMqtt ? `User: ${cfgSlot.username}` : 'Phoenix Broadcast'} · Edge:{' '}
                  <b>{cfgSlot.edgeNodeId}</b>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Card isLight={isLight} variant="outlined" padding="sm" className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold inline-flex items-center gap-1 ${
                  isLight ? 'text-neutral-800' : 'text-neutral-200'
                }`}
              >
                <ShieldCheck
                  className={`h-3.5 w-3.5 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`}
                />
                JP EDGE BRIDGE (supabase_jp)
              </span>
              <span className="text-[10px] font-mono text-cyan-500 font-bold">
                emqx_cn + supabase_jp
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              <div className={pillClass}>Fwd: <b>{jpStats?.totalForwardedCount ?? 0}</b></div>
              <div className={pillClass}>Blk: <b>{jpStats?.totalDroppedLoopCount ?? 0}</b></div>
              <div className={pillClass}>Warm: <b>{jpStats?.warmMqttConnections ?? 0}</b></div>
            </div>
          </Card>

          <Card isLight={isLight} variant="outlined" padding="sm" className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold inline-flex items-center gap-1 ${
                  isLight ? 'text-neutral-800' : 'text-neutral-200'
                }`}
              >
                <ShieldCheck
                  className={`h-3.5 w-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}
                />
                SG EDGE BRIDGE (supabase_sg)
              </span>
              <span className="text-[10px] font-mono text-emerald-500 font-bold">
                emqx_gb + supabase_sg
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              <div className={pillClass}>Fwd: <b>{sgStats?.totalForwardedCount ?? 0}</b></div>
              <div className={pillClass}>Blk: <b>{sgStats?.totalDroppedLoopCount ?? 0}</b></div>
              <div className={pillClass}>Warm: <b>{sgStats?.warmMqttConnections ?? 0}</b></div>
            </div>
          </Card>

          <Card isLight={isLight} variant="outlined" padding="sm" className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold ${
                  isLight ? 'text-neutral-800' : 'text-neutral-200'
                }`}
              >
                MASK: 0x{maskVal.toString(16).toUpperCase()} ({maskVal.toString(2).padStart(4, '0')})
              </span>
              <span className={`text-[10px] font-mono ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>
                {probeSummary?.sampleRandomCode || '----'} / {probeSummary?.sampleCustomCode || 'rocket-f'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <select
                value={customSourceRelay}
                onChange={(e) => onCustomSourceRelayChange(e.target.value as CanonicalLabRelayId)}
                className={`px-1.5 py-0.5 rounded border font-mono ${
                  isLight
                    ? 'bg-white border-neutral-300 text-neutral-800'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-200'
                }`}
              >
                {CANONICAL_SLOT_KEYS.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
              <span>-&gt;</span>
              <select
                value={customTargetRelay}
                onChange={(e) => onCustomTargetRelayChange(e.target.value as CanonicalLabRelayId)}
                className={`px-1.5 py-0.5 rounded border font-mono ${
                  isLight
                    ? 'bg-white border-neutral-300 text-neutral-800'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-200'
                }`}
              >
                {CANONICAL_SLOT_KEYS.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  onRunScenario(
                    'bridge-custom-pair',
                    `Testing ${customSourceRelay} <-> ${customTargetRelay} 2-Way Handshake...`
                  )
                }
                className={`ml-auto px-2 py-0.5 rounded font-bold border cursor-pointer disabled:opacity-50 ${
                  isLight
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-800'
                    : 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200'
                }`}
              >
                Run Pair
              </button>
            </div>
          </Card>
        </div>
      </>
    );
  }
);

DevSignalingRelayStatusGrid.displayName = 'DevSignalingRelayStatusGrid';
