import React from 'react';
import {
  Activity,
  Copy,
  Terminal,
  Trash2,
} from 'lucide-react';
import { Card } from '../../layout/Card';
import {
  buildEmqxBridgeRuleSql,
  type SignalingLabCloudStatsView,
  type SignalingLabEndpointViewConfig,
  type SignalingLabPacketTraceItem,
} from './signalingLabTypes';

export interface SignalingLabLiveMonitorsSectionProps {
  isLight: boolean;
  showEmqxRuleGuide: boolean;
  copiedLabel: string | null;
  endpointConfig: SignalingLabEndpointViewConfig;
  traces: SignalingLabPacketTraceItem[];
  cloudStats: SignalingLabCloudStatsView | null | undefined;
  onCopyText: (text: string, label: string) => void;
  onClearTraces: () => void;
  onRefreshLogs: () => void;
  onHover: (desc: string | null) => void;
}

export const SignalingLabLiveMonitorsSection: React.FC<SignalingLabLiveMonitorsSectionProps> =
  React.memo(
    ({
      isLight,
      showEmqxRuleGuide,
      copiedLabel,
      endpointConfig,
      traces,
      cloudStats,
      onCopyText,
      onClearTraces,
      onRefreshLogs,
      onHover,
    }) => {
      const ruleSql = buildEmqxBridgeRuleSql(endpointConfig.topicNamespace);

      const copyBtnClass = `px-2 py-1 rounded border text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
        isLight
          ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
          : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
      }`;

      return (
        <>
          {/* Collapsible EMQX Data Integration Copy-Paste Guide */}
          {showEmqxRuleGuide && (
            <div
              className={`p-3 rounded-xl border flex flex-col gap-2 text-xs ${
                isLight
                  ? 'border-amber-500/35 bg-amber-500/10 text-amber-950'
                  : 'border-amber-400/30 bg-amber-500/10 text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`font-bold uppercase tracking-wider ${
                    isLight ? 'text-amber-800' : 'text-amber-300'
                  }`}
                >
                  EMQX Data Integration (Rule Engine + HTTP Server Action) Copy-Paste Config
                </span>
                {copiedLabel && (
                  <span
                    className={`font-semibold ${
                      isLight ? 'text-emerald-700' : 'text-emerald-400'
                    }`}
                  >
                    Copied {copiedLabel}!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div
                  className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                    isLight
                      ? 'bg-white/90 border-neutral-300 text-neutral-800'
                      : 'bg-neutral-950/70 border-neutral-800 text-neutral-200'
                  }`}
                >
                  <div className="truncate">
                    <span
                      className={`mr-2 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}
                    >
                      Webhook URL (POST):
                    </span>
                    <code
                      className={`font-mono font-semibold ${
                        isLight ? 'text-cyan-700' : 'text-cyan-300'
                      }`}
                    >
                      {endpointConfig.edgeFunctionBridgeUrl}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCopyText(endpointConfig.edgeFunctionBridgeUrl, 'Webhook URL')}
                    className={copyBtnClass}
                  >
                    <Copy className="h-3 w-3" /> Copy URL
                  </button>
                </div>

                <div
                  className={`p-2 rounded-lg border flex flex-col gap-1 ${
                    isLight
                      ? 'bg-white/90 border-neutral-300 text-neutral-800'
                      : 'bg-neutral-950/70 border-neutral-800 text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={isLight ? 'text-neutral-600' : 'text-neutral-400'}>
                      Rule SQL (Only triggers on{' '}
                      <code
                        className={`font-mono font-semibold ${
                          isLight ? 'text-amber-700' : 'text-amber-300'
                        }`}
                      >
                        brg/+
                      </code>
                      , never on{' '}
                      <code
                        className={`font-mono font-semibold ${
                          isLight ? 'text-emerald-700' : 'text-emerald-300'
                        }`}
                      >
                        dir/+
                      </code>
                      ):
                    </span>
                    <button
                      type="button"
                      onClick={() => onCopyText(ruleSql, 'Rule SQL')}
                      className={copyBtnClass}
                    >
                      <Copy className="h-3 w-3" /> Copy SQL
                    </button>
                  </div>
                  <pre
                    className={`text-[11px] font-mono overflow-x-auto leading-tight ${
                      isLight ? 'text-emerald-800' : 'text-emerald-300'
                    }`}
                  >
                    {ruleSql}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Dual Live Monitor: Browser Packet Trace + Cloud Edge Function Audit Log */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Left: Browser Packet Trace */}
            <Card
              isLight={isLight}
              variant="outlined"
              padding="sm"
              className="flex flex-col gap-1.5"
              onMouseEnter={() =>
                onHover(
                  'Client Packet Trace: Live browser-side log of outgoing/incoming E2EE dir/+ and brg/+ frames and ECDH SAS pairing verification.'
                )
              }
              onMouseLeave={() => onHover(null)}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                    isLight ? 'text-neutral-700' : 'text-neutral-300'
                  }`}
                >
                  <Terminal
                    className={`h-3.5 w-3.5 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`}
                  />
                  Client Packet Trace ({traces.length})
                </span>
                <button
                  type="button"
                  onClick={onClearTraces}
                  className={`text-[10px] inline-flex items-center gap-1 cursor-pointer transition-colors ${
                    isLight
                      ? 'text-neutral-500 hover:text-neutral-900'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              </div>

              <div className="h-44 overflow-y-auto flex flex-col gap-1 pr-1 font-mono text-[10px]">
                {traces.length === 0 ? (
                  <div
                    className={`py-8 text-center ${
                      isLight ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  >
                    Click any test button above to inspect live E2EE dir/brg frames.
                  </div>
                ) : (
                  traces.map((t) => (
                    <div
                      key={t.id}
                      className={`p-1.5 rounded border ${
                        t.ok
                          ? isLight
                            ? 'bg-neutral-50 border-neutral-200/90 text-neutral-800'
                            : 'bg-neutral-900/60 border-neutral-800 text-neutral-200'
                          : isLight
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-900'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`font-bold ${
                            isLight ? 'text-cyan-700' : 'text-cyan-300'
                          }`}
                        >
                          [{t.direction}] [{t.channel.toUpperCase()}] {t.relayId}
                        </span>
                        <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>
                          hop={t.hop} {t.latencyMs ? `· ${t.latencyMs}ms` : ''}
                        </span>
                      </div>
                      <div
                        className={`break-words mt-0.5 ${
                          isLight ? 'text-neutral-700' : 'text-neutral-300'
                        }`}
                      >
                        {t.summary}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Right: Cloud Edge Function Audit Log */}
            <Card
              isLight={isLight}
              variant="outlined"
              padding="sm"
              className="flex flex-col gap-1.5"
              onMouseEnter={() =>
                onHover(
                  'Cloud Edge Bridge Audit Log: Server-side audit ring buffer from the Supabase Edge Function bridge showing forwarded packets and dropped anti-loop events.'
                )
              }
              onMouseLeave={() => onHover(null)}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                    isLight ? 'text-neutral-700' : 'text-neutral-300'
                  }`}
                >
                  <Activity
                    className={`h-3.5 w-3.5 ${
                      isLight ? 'text-emerald-600' : 'text-emerald-400'
                    }`}
                  />
                  Cloud Edge Bridge Audit Log ({cloudStats?.logs.length ?? 0})
                </span>
                <button
                  type="button"
                  onClick={onRefreshLogs}
                  className={`text-[10px] font-semibold hover:underline cursor-pointer ${
                    isLight ? 'text-cyan-700' : 'text-cyan-300'
                  }`}
                >
                  Refresh
                </button>
              </div>

              <div className="h-44 overflow-y-auto flex flex-col gap-1 pr-1 font-mono text-[10px]">
                {!cloudStats || cloudStats.logs.length === 0 ? (
                  <div
                    className={`py-8 text-center ${
                      isLight ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  >
                    No cloud bridge events recorded yet.
                  </div>
                ) : (
                  cloudStats.logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-1.5 rounded border ${
                        log.status === 'forwarded' || log.status === 'self_test'
                          ? isLight
                            ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-neutral-800'
                            : 'bg-emerald-500/10 border-emerald-500/25 text-neutral-200'
                          : log.status === 'ignored'
                          ? isLight
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-900'
                            : 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                          : isLight
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-900'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold">
                          [{log.event}] from={log.comingFrom} -&gt;{' '}
                          {log.targets.join(',') || 'dropped'}
                        </span>
                        <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>
                          hop={log.hop} {log.latencyMs ? `· ${log.latencyMs}ms` : ''}
                        </span>
                      </div>
                      <div
                        className={`truncate mt-0.5 ${
                          isLight ? 'text-neutral-600' : 'text-neutral-400'
                        }`}
                      >
                        topic={log.topicHash} · {log.detail || log.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      );
    }
  );

SignalingLabLiveMonitorsSection.displayName = 'SignalingLabLiveMonitorsSection';
