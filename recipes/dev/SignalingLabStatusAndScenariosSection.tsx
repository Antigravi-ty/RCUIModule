import React from 'react';
import {
  Database,
  Play,
  Server,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../../layout/Card';
import type {
  SignalingLabEndpointViewConfig,
  SignalingLabProbeSummaryView,
  SignalingLabScenarioId,
} from './signalingLabTypes';

export interface SignalingLabStatusAndScenariosSectionProps {
  isLight: boolean;
  endpointConfig: SignalingLabEndpointViewConfig;
  probeSummary: SignalingLabProbeSummaryView | null;
  isBusy: boolean;
  onRunScenario: (scenario: SignalingLabScenarioId, label: string) => void;
  onHover: (desc: string | null) => void;
}

interface ScenarioButtonSpec {
  id: SignalingLabScenarioId;
  title: string;
  subtitle: React.ReactNode;
  actionLabel: string;
  hoverDesc: string;
  icon: 'play' | 'shield';
  lightClass: string;
  darkClass: string;
  lightTitleClass: string;
  darkTitleClass: string;
}

const SCENARIO_SPECS: readonly ScenarioButtonSpec[] = [
  {
    id: 'emqx-direct',
    title: '1. EMQX_1 <-> EMQX_1 Direct',
    subtitle: (
      <>
        Same-relay E2EE SDP/ICE on <code>dir/+</code> (0 Webhook)
      </>
    ),
    actionLabel: 'Testing EMQX_1 <-> EMQX_1 Direct (dir/+)...',
    hoverDesc:
      'Scenario 1 (EMQX_1 Direct): Two peers on EMQX_1 exchange E2EE AES-256-GCM SDP Offer/Answer directly on dir/<topicHash> with zero Edge Function webhook overhead.',
    icon: 'play',
    lightClass: 'bg-purple-500/[0.07] hover:bg-purple-500/[0.14] border-purple-500/30',
    darkClass: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-400/30',
    lightTitleClass: 'text-purple-800',
    darkTitleClass: 'text-purple-300',
  },
  {
    id: 'supabase-direct',
    title: '2. SUPABASE_1 <-> SUPABASE_1 Direct',
    subtitle: (
      <>
        Phoenix Broadcast E2EE SDP/ICE on <code>dir:+</code>
      </>
    ),
    actionLabel: 'Testing SUPABASE_1 <-> SUPABASE_1 Direct (dir:+)...',
    hoverDesc:
      'Scenario 2 (SUPABASE_1 Direct): Two peers on Supabase Realtime exchange E2EE SDP Offer/Answer over Phoenix Channel Broadcast on dir:<topicHash>.',
    icon: 'play',
    lightClass: 'bg-emerald-500/[0.07] hover:bg-emerald-500/[0.14] border-emerald-500/30',
    darkClass: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-400/30',
    lightTitleClass: 'text-emerald-800',
    darkTitleClass: 'text-emerald-300',
  },
  {
    id: 'bridge-sb-to-emqx',
    title: '3. Bridge: SUPABASE -> EMQX',
    subtitle: 'SB Client (brg) -> Edge (CNRCEdgeBridgeV2) -> EMQX (dir)',
    actionLabel: 'Testing SUPABASE_1 (brg) -> Edge Function -> EMQX_1 (dir)...',
    hoverDesc:
      'Scenario 3 (Island Bridge SB -> EMQX): Isolated Supabase client dispatches brg/<topicHash> to Edge Function, which publishes to EMQX_1 dir/<topicHash>.',
    icon: 'play',
    lightClass: 'bg-cyan-500/[0.07] hover:bg-cyan-500/[0.14] border-cyan-500/30',
    darkClass: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-400/30',
    lightTitleClass: 'text-cyan-800',
    darkTitleClass: 'text-cyan-300',
  },
  {
    id: 'bridge-emqx-to-sb',
    title: '4. Bridge: EMQX (Rule) -> SUPABASE',
    subtitle: 'EMQX Client (brg) -> EMQX Rule Webhook -> Edge -> SB (dir)',
    actionLabel: 'Testing EMQX_1 (brg) -> HTTP Action -> Edge -> SUPABASE_1 (dir)...',
    hoverDesc:
      'Scenario 4 (Island Bridge EMQX -> SB): Isolated EMQX_1 peer publishes to brg/<topicHash>, triggering EMQX HTTP Rule -> Edge Function -> Supabase Realtime Broadcast.',
    icon: 'play',
    lightClass: 'bg-amber-500/[0.07] hover:bg-amber-500/[0.14] border-amber-500/30',
    darkClass: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-400/30',
    lightTitleClass: 'text-amber-800',
    darkTitleClass: 'text-amber-300',
  },
  {
    id: 'bridge-bidirectional',
    title: '5. Full 2-Way Island Bridge',
    subtitle: 'Complete Offer + Answer across isolated EMQX & Supabase',
    actionLabel: 'Testing Full 2-Way Island Handshake (EMQX_1 <-> Edge <-> SUPABASE_1)...',
    hoverDesc:
      'Scenario 5 (Full Bidirectional Island Handshake): Complete E2EE SDP Offer (SB -> EMQX) and E2EE SDP Answer (EMQX -> SB) across isolated relays.',
    icon: 'play',
    lightClass: 'bg-indigo-500/[0.07] hover:bg-indigo-500/[0.14] border-indigo-500/30',
    darkClass: 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-400/30',
    lightTitleClass: 'text-indigo-800',
    darkTitleClass: 'text-indigo-300',
  },
  {
    id: 'anti-loop-torture',
    title: '6. Anti-Loop 4-Guard Torture',
    subtitle: 'Verifies BridgeUser, DirTopic, HopTTL=1 & MsgId Dedup',
    actionLabel: 'Running 4-Layer Anti-Loop Guard Verification...',
    hoverDesc:
      'Scenario 6 (Anti-Loop 4-Guard Torture): Sends 5 synthetic loop/replay vectors to verify BridgeUser filter, DirTopic rejection, HopTTL=1 cap, and _brgMsgId deduplication.',
    icon: 'shield',
    lightClass: 'bg-rose-500/[0.07] hover:bg-rose-500/[0.14] border-rose-500/30',
    darkClass: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-400/30',
    lightTitleClass: 'text-rose-800',
    darkTitleClass: 'text-rose-300',
  },
];

export const SignalingLabStatusAndScenariosSection: React.FC<
  SignalingLabStatusAndScenariosSectionProps
> = React.memo(
  ({ isLight, endpointConfig, probeSummary, isBusy, onRunScenario, onHover }) => {
    const cloudStats = probeSummary?.cloudStats;
    const maskVal = probeSummary?.computedMask ?? 0;

    const statusBadgeClass = (ok: boolean | undefined) =>
      ok
        ? isLight
          ? 'bg-emerald-500/15 text-emerald-800 border-emerald-500/35'
          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : isLight
        ? 'bg-rose-500/15 text-rose-800 border-rose-500/35'
        : 'bg-rose-500/20 text-rose-300 border-rose-500/30';

    const counterPillClass = isLight
      ? 'px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200/80 text-neutral-700'
      : 'px-1.5 py-0.5 rounded bg-neutral-900/70 border border-neutral-800 text-neutral-300';

    return (
      <>
        {/* 3 Relay & Bridge Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Card 1: EMQX_1 */}
          <Card
            isLight={isLight}
            variant="outlined"
            padding="sm"
            className="flex flex-col gap-1"
            onMouseEnter={() =>
              onHover(
                'EMQX_1 (Bit 3 = 8): MQTT over WebSocket relay slot with physical dir/+ (direct) and brg/+ (bridge trigger) topic separation.'
              )
            }
            onMouseLeave={() => onHover(null)}
          >
            <div className="flex items-center justify-between gap-1">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                  isLight ? 'text-neutral-800' : 'text-neutral-200'
                }`}
              >
                <Server
                  className={`h-3.5 w-3.5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`}
                />
                EMQX_1 (Bit 3 = 8)
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${statusBadgeClass(
                  probeSummary?.emqx1Ok
                )}`}
              >
                {probeSummary?.emqx1Ok
                  ? `ONLINE · ${probeSummary.emqx1RttMs}ms`
                  : probeSummary
                  ? 'OFFLINE'
                  : 'UNPROBED'}
              </span>
            </div>
            <div
              className={`text-[10px] font-mono truncate ${
                isLight ? 'text-neutral-500' : 'text-neutral-400'
              }`}
            >
              {endpointConfig.emqx1Url}
            </div>
            <div className={`text-[10px] ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
              User:{' '}
              <code
                className={`font-mono font-semibold ${
                  isLight ? 'text-neutral-800' : 'text-neutral-200'
                }`}
              >
                {endpointConfig.emqx1Username}
              </code>{' '}
              · ACL:{' '}
              <code
                className={`font-mono font-semibold ${
                  isLight ? 'text-emerald-700' : 'text-emerald-300'
                }`}
              >
                dir/+
              </code>{' '}
              &amp;{' '}
              <code
                className={`font-mono font-semibold ${
                  isLight ? 'text-amber-700' : 'text-amber-300'
                }`}
              >
                brg/+
              </code>
            </div>
          </Card>

          {/* Card 2: SUPABASE_1 */}
          <Card
            isLight={isLight}
            variant="outlined"
            padding="sm"
            className="flex flex-col gap-1"
            onMouseEnter={() =>
              onHover(
                'SUPABASE_1 (Bit 1 = 2): Zero-dependency Phoenix Channel WebSocket client using Supabase Realtime Broadcast with zero database tables.'
              )
            }
            onMouseLeave={() => onHover(null)}
          >
            <div className="flex items-center justify-between gap-1">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                  isLight ? 'text-neutral-800' : 'text-neutral-200'
                }`}
              >
                <Database
                  className={`h-3.5 w-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}
                />
                SUPABASE_1 (Bit 1 = 2)
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${statusBadgeClass(
                  probeSummary?.supabase1Ok
                )}`}
              >
                {probeSummary?.supabase1Ok
                  ? `ONLINE · ${probeSummary.supabase1RttMs}ms`
                  : probeSummary
                  ? 'OFFLINE'
                  : 'UNPROBED'}
              </span>
            </div>
            <div
              className={`text-[10px] font-mono truncate ${
                isLight ? 'text-neutral-500' : 'text-neutral-400'
              }`}
            >
              {endpointConfig.supabase1Url}
            </div>
            <div className={`text-[10px] ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
              Mode:{' '}
              <code
                className={`font-mono font-semibold ${
                  isLight ? 'text-emerald-700' : 'text-emerald-300'
                }`}
              >
                Realtime Broadcast (0 DB Tables)
              </code>
            </div>
          </Card>

          {/* Card 3: Cloud Edge Bridge & Anti-Loop Counters */}
          <Card
            isLight={isLight}
            variant="outlined"
            padding="sm"
            className="flex flex-col gap-1"
            onMouseEnter={() =>
              onHover(
                'Edge Bridge Stats: Displays the 4-bit connectivity mask, sample encoded room codes, and live Cloud Edge Function forwarding/anti-loop counters.'
              )
            }
            onMouseLeave={() => onHover(null)}
          >
            <div className="flex items-center justify-between gap-1">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                  isLight ? 'text-neutral-800' : 'text-neutral-200'
                }`}
              >
                <ShieldCheck
                  className={`h-3.5 w-3.5 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`}
                />
                EDGE BRIDGE STATS
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  isLight
                    ? 'bg-cyan-500/15 text-cyan-800 border-cyan-500/35'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}
              >
                MASK: 0x{maskVal.toString(16).toUpperCase()} ({maskVal.toString(2).padStart(4, '0')})
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px] mt-0.5">
              <div className={counterPillClass}>
                Fwd:{' '}
                <b className={isLight ? 'text-emerald-700' : 'text-emerald-300'}>
                  {cloudStats?.totalForwardedCount ?? 0}
                </b>
              </div>
              <div className={counterPillClass}>
                LoopBlk:{' '}
                <b className={isLight ? 'text-amber-700' : 'text-amber-300'}>
                  {cloudStats?.totalDroppedLoopCount ?? 0}
                </b>
              </div>
              <div className={counterPillClass}>
                WarmWS:{' '}
                <b className={isLight ? 'text-cyan-700' : 'text-cyan-300'}>
                  {cloudStats?.warmMqttConnections ?? 0}
                </b>
              </div>
            </div>
            <div
              className={`text-[10px] truncate ${
                isLight ? 'text-neutral-600' : 'text-neutral-400'
              }`}
            >
              Codes:{' '}
              <code
                className={`font-mono font-semibold ${
                  isLight ? 'text-cyan-700' : 'text-cyan-300'
                }`}
              >
                {probeSummary?.sampleRandomCode || '----'}
              </code>{' '}
              /{' '}
              <code
                className={`font-mono font-semibold ${
                  isLight ? 'text-cyan-700' : 'text-cyan-300'
                }`}
              >
                {probeSummary?.sampleCustomCode || 'rocket-a'}
              </code>
            </div>
          </Card>
        </div>

        {/* 6 One-Click Verification Scenario Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {SCENARIO_SPECS.map((spec) => (
            <button
              key={spec.id}
              type="button"
              disabled={isBusy}
              onClick={() => onRunScenario(spec.id, spec.actionLabel)}
              onMouseEnter={() => onHover(spec.hoverDesc)}
              onMouseLeave={() => onHover(null)}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 ${
                isLight ? spec.lightClass : spec.darkClass
              }`}
            >
              <span
                className={`text-xs font-bold inline-flex items-center gap-1.5 ${
                  isLight ? spec.lightTitleClass : spec.darkTitleClass
                }`}
              >
                {spec.icon === 'shield' ? (
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Play className="h-3 w-3 fill-current shrink-0" />
                )}
                <span className="truncate">{spec.title}</span>
              </span>
              <span
                className={`text-[10px] leading-snug ${
                  isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}
              >
                {spec.subtitle}
              </span>
            </button>
          ))}
        </div>
      </>
    );
  }
);

SignalingLabStatusAndScenariosSection.displayName = 'SignalingLabStatusAndScenariosSection';
