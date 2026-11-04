import React, { useState } from 'react';
import {
  CheckCircle2,
  GraphStar,
  Info,
  RefreshCw,
  Wifi,
  XCircle,
} from 'lucide-react';
import { Card } from '../layout/Card';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { DEFAULT_PANEL_SIZING } from '../tokens/menuLayoutTokens';
import {
  DEFAULT_PLACEHOLDER_ENDPOINT_CONFIG,
  type Layer4DevSignalingLabRecipeProps,
  type SignalingLabScenarioId,
} from './dev/signalingLabTypes';
import { SignalingLabStatusAndScenariosSection } from './dev/SignalingLabStatusAndScenariosSection';
import { SignalingLabLiveMonitorsSection } from './dev/SignalingLabLiveMonitorsSection';

export type {
  Layer4DevSignalingLabRecipeProps,
  SignalingLabCloudAuditLogItem,
  SignalingLabCloudStatsView,
  SignalingLabEndpointViewConfig,
  SignalingLabPacketTraceItem,
  SignalingLabProbeSummaryView,
  SignalingLabScenarioId,
} from './dev/signalingLabTypes';

/**
 * [Recipe] Layer 4 Developer -> Under Development -> 4+1 Signaling & Bridge Lab
 * Theme-adaptive (light & dark) interactive workbench for inspecting EMQX_1 + SUPABASE_1
 * physical dir/brg topic isolation, 4-bit connectivity mask, Edge Function bridge routing,
 * and 4-layer anti-loop guards.
 */
export const Layer4DevSignalingLabRecipe: React.FC<Layer4DevSignalingLabRecipeProps> = React.memo(
  ({
    isLight = false,
    onBack,
    sizing: propSizing,
    endpointConfig = DEFAULT_PLACEHOLDER_ENDPOINT_CONFIG,
    probeSummary = null,
    traces = [],
    roomCode: controlledRoomCode,
    onRoomCodeChange,
    roomPassword: controlledRoomPassword,
    onRoomPasswordChange,
    isBusy = false,
    activeActionLabel = null,
    lastResultBanner = null,
    onProbeAll,
    onCloudSelfTest,
    onRunScenario,
    onClearTraces,
  }) => {
    const [localRoomCode, setLocalRoomCode] = useState('rocket-a');
    const [localRoomPassword, setLocalRoomPassword] = useState('test1234');
    const [showEmqxRuleGuide, setShowEmqxRuleGuide] = useState(false);
    const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
    const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

    const roomCode = controlledRoomCode ?? localRoomCode;
    const setRoomCode = onRoomCodeChange ?? setLocalRoomCode;
    const roomPassword = controlledRoomPassword ?? localRoomPassword;
    const setRoomPassword = onRoomPasswordChange ?? setLocalRoomPassword;

    const storeSizing = useMenuLayoutStore(
      (s) =>
        s.panels?.['layer4-dev-signaling-lab'] ??
        DEFAULT_PANEL_SIZING['layer4-dev-signaling-lab']
    );
    const sizing = propSizing ?? storeSizing;

    const handleCopyText = (text: string, label: string) => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        void navigator.clipboard.writeText(text);
        setCopiedLabel(label);
        window.setTimeout(() => setCopiedLabel(null), 1800);
      }
    };

    const handleScenarioClick = (scenario: SignalingLabScenarioId, label: string) => {
      onRunScenario?.(scenario, label);
    };

    return (
      <PanelContainer isLight={isLight} sizing={sizing} className="w-full select-none">
        <PanelHeader
          title="4+1 SIGNALING & BRIDGE LAB"
          onBack={onBack}
          isLight={isLight}
        />

        <PanelContent scrollable className="flex flex-col gap-2.5 text-left">
          {/* Top Control & Namespace Toolbar Card */}
          <Card isLight={isLight} variant="outlined" padding="sm" className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <GraphStar
                  className={`h-4 w-4 shrink-0 ${
                    isLight ? 'text-cyan-600' : 'text-cyan-400'
                  }`}
                />
                <span
                  className={`text-xs font-bold uppercase tracking-wider truncate ${
                    isLight ? 'text-neutral-800' : 'text-neutral-200'
                  }`}
                >
                  4+1 Multi-Relay &amp; Edge Bridge Monitor
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border shrink-0 ${
                    isLight
                      ? 'bg-neutral-100 border-neutral-300 text-neutral-700'
                      : 'bg-neutral-800/80 border-neutral-700 text-neutral-300'
                  }`}
                >
                  NS: {endpointConfig.topicNamespace}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowEmqxRuleGuide((v) => !v)}
                onMouseEnter={() =>
                  setHoveredDesc(
                    'Toggle copy-paste configuration for EMQX Data Integration Rule SQL (brg/+ filter) and Edge Function Webhook URL.'
                  )
                }
                onMouseLeave={() => setHoveredDesc(null)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                  isLight
                    ? 'border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800'
                    : 'border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300'
                }`}
              >
                {showEmqxRuleGuide ? 'Hide EMQX HTTP Rule SQL' : 'EMQX HTTP Rule SQL'}
              </button>
            </div>

            {/* Room Code, Password & Primary Probe Actions */}
            <div
              className={`flex flex-wrap items-center justify-between gap-2 pt-2 border-t ${
                isLight ? 'border-neutral-200/80' : 'border-neutral-800'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className={`text-[11px] font-semibold ${
                    isLight ? 'text-neutral-600' : 'text-neutral-400'
                  }`}
                >
                  Room:
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className={`w-28 px-2 py-1 rounded-md border text-xs font-mono outline-none transition-colors ${
                    isLight
                      ? 'bg-white border-neutral-300 text-neutral-900 focus:border-cyan-600'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-100 focus:border-cyan-400'
                  }`}
                />
                <label
                  className={`text-[11px] font-semibold ${
                    isLight ? 'text-neutral-600' : 'text-neutral-400'
                  }`}
                >
                  Key:
                </label>
                <input
                  type="text"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  className={`w-24 px-2 py-1 rounded-md border text-xs font-mono outline-none transition-colors ${
                    isLight
                      ? 'bg-white border-neutral-300 text-neutral-900 focus:border-cyan-600'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-100 focus:border-cyan-400'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onProbeAll?.()}
                  onMouseEnter={() =>
                    setHoveredDesc(
                      'Concurrently probe EMQX_1 and SUPABASE_1 loopback RTTs, compute the 4-bit connectivity mask, and sync Cloud Edge Bridge stats.'
                    )
                  }
                  onMouseLeave={() => setHoveredDesc(null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                    isLight
                      ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                      : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                  }`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                  <span>Probe &amp; Sync Logs</span>
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onCloudSelfTest?.()}
                  onMouseEnter={() =>
                    setHoveredDesc(
                      'Invoke Cloud Edge Function self-test to verify server-side CNRCEdgeBridgeV2 MQTT ACL and Supabase Realtime Broadcast injection.'
                    )
                  }
                  onMouseLeave={() => setHoveredDesc(null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                    isLight
                      ? 'border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-800'
                      : 'border-cyan-400/40 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200'
                  }`}
                >
                  <Wifi className="h-3.5 w-3.5" />
                  <span>Cloud Self-Test (EMQX + SB)</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Status Cards + 6 One-Click Scenario Buttons */}
          <SignalingLabStatusAndScenariosSection
            isLight={isLight}
            endpointConfig={endpointConfig}
            probeSummary={probeSummary}
            isBusy={isBusy}
            onRunScenario={handleScenarioClick}
            onHover={setHoveredDesc}
          />

          {/* Active Action / Last Result Banner */}
          {(activeActionLabel || lastResultBanner) && (
            <div
              className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                activeActionLabel
                  ? isLight
                    ? 'bg-cyan-500/10 border-cyan-500/35 text-cyan-900'
                    : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-200'
                  : lastResultBanner?.ok
                  ? isLight
                    ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-900'
                    : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
                  : isLight
                  ? 'bg-rose-500/10 border-rose-500/35 text-rose-900'
                  : 'bg-rose-500/10 border-rose-400/30 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {activeActionLabel ? (
                  <RefreshCw
                    className={`h-4 w-4 animate-spin shrink-0 ${
                      isLight ? 'text-cyan-600' : 'text-cyan-400'
                    }`}
                  />
                ) : lastResultBanner?.ok ? (
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${
                      isLight ? 'text-emerald-600' : 'text-emerald-400'
                    }`}
                  />
                ) : (
                  <XCircle
                    className={`h-4 w-4 shrink-0 ${
                      isLight ? 'text-rose-600' : 'text-rose-400'
                    }`}
                  />
                )}
                <span className="truncate font-medium">
                  {activeActionLabel || lastResultBanner?.text}
                </span>
              </div>
            </div>
          )}

          {/* Collapsible EMQX Rule SQL + Dual Live Monitors */}
          <SignalingLabLiveMonitorsSection
            isLight={isLight}
            showEmqxRuleGuide={showEmqxRuleGuide}
            copiedLabel={copiedLabel}
            endpointConfig={endpointConfig}
            traces={traces}
            cloudStats={probeSummary?.cloudStats}
            onCopyText={handleCopyText}
            onClearTraces={() => onClearTraces?.()}
            onRefreshLogs={() => onProbeAll?.()}
            onHover={setHoveredDesc}
          />
        </PanelContent>

        <PanelFooter
          isLight={isLight}
          defaultDescription="4+1 Signaling & Cloud Bridge Verification Lab: Physical dir/brg topic isolation + 4-layer anti-loop protection."
          hoveredDescription={hoveredDesc}
          icon={<Info className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
        />
      </PanelContainer>
    );
  }
);

Layer4DevSignalingLabRecipe.displayName = 'Layer4DevSignalingLabRecipe';
