import React, { useState, useEffect } from 'react';
import {
  Download,
  Database,
  Activity,
  Server,
  Pause,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  FileArchive,
} from 'lucide-react';
import {
  networkDiagnosticsStore,
  useNetworkDiagnosticsData,
} from '../../stores/networkDiagnosticsStore';
import { useAppStore } from '../../stores/appStore';
import {
  globalPacingTelemetryRecorder,
  MAX_TELEMETRY_TICKS,
} from '../../stores/pacingTelemetryRecorder';
import {
  buildZipArchiveBytes,
  downloadNetworkTelemetryZip,
} from '../../stores/pacingTelemetryExporter';
export interface DiagnosticDumpFloatingWindowProps {
  isLight?: boolean;
  active?: boolean;
}

const RC_REPLAY_STATE_INPUT_STRIDE = 184;

const CAPACITY_PRESETS = [
  { label: '30s (3.6k)', frames: 3600 },
  { label: '90s (10.8k)', frames: 10800 },
  { label: '150s (18k)', frames: 18000 },
  { label: '300s (36k)', frames: 36000 },
];

function triggerZipDownload(bytes: Uint8Array, filename: string) {
  if (typeof document === 'undefined' || typeof Blob === 'undefined') return false;
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}

export const DiagnosticDumpFloatingWindow: React.FC<DiagnosticDumpFloatingWindowProps> = ({
  isLight = false,
  active = true,
}) => {
  const { metrics } = useNetworkDiagnosticsData();
  const [, setTickRefresh] = useState(0);

  const diag = metrics.diagnosticBuffers;
  const [maxClientFrames, setMaxClientFrames] = useState<number>(diag?.maxClientFrames || 36000);
  const [autoPauseOnOverflow, setAutoPauseOnOverflow] = useState<boolean>(
    diag?.autoPauseOnOverflow ?? true
  );
  const [includeClientReplay, setIncludeClientReplay] = useState<boolean>(true);
  const [includeReconcileTelemetry, setIncludeReconcileTelemetry] = useState<boolean>(true);
  const [includeServerReplay, setIncludeServerReplay] = useState<boolean>(true);
  const [lastExportStatus, setLastExportStatus] = useState<string | null>(null);

  useEffect(() => {
    useAppStore.getState().bridge.onEnsureNetworkDiagnostics?.();
  }, []);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setTickRefresh((v) => (v + 1) % 100000);
    }, 200);
    return () => window.clearInterval(id);
  }, [active]);

  const isOnlineSession = Boolean(diag?.isOnlineSession || metrics.connected);
  const isLobby = Boolean(diag?.isLobby);
  const matchState = String(diag?.matchState || 'FREEPLAY');
  const isHosting = Boolean(diag?.isHosting);

  const clientFrames: number = Number(diag?.clientFrames ?? 0);
  const clientRecordingActive: boolean = Boolean(diag?.clientRecordingActive);
  const clientOverflowPaused: boolean = Boolean(diag?.clientOverflowPaused);
  const effectiveMaxFrames = Number(diag?.maxClientFrames) || maxClientFrames || 36000;
  const clientCapacityPct = Math.min(100, (clientFrames / Math.max(1, effectiveMaxFrames)) * 100);
  const clientBytes = clientFrames * RC_REPLAY_STATE_INPUT_STRIDE;
  const clientMb = (clientBytes / (1024 * 1024)).toFixed(2);
  const clientDurationSec = (clientFrames / 120).toFixed(1);

  const recorder = globalPacingTelemetryRecorder;
  const telemetryTicks: number = Number(diag?.telemetryTicks ?? recorder?.count ?? 0);
  const telemetryCapacityPct = Math.min(100, (telemetryTicks / MAX_TELEMETRY_TICKS) * 100);
  const telemetrySummary = recorder?.getSummaryStats?.() || {};
  const telemetryDurationSec = (telemetryTicks / 120).toFixed(1);
  const telemetryApproxKb = ((telemetryTicks * 60) / 1024).toFixed(1);

  const serverFrames: number = Number(diag?.serverFrames ?? 0);
  const serverDurationSec = (serverFrames / 120).toFixed(1);
  const activeCarMask: number = Number(diag?.activeCarMask ?? 1);
  const activeSlots: number[] = [];
  for (let i = 0; i < 8; i++) { if (activeCarMask & (1 << i)) activeSlots.push(i); }

  let sessionStatusLabel = 'IDLE (SINGLEPLAYER — NO RECORDING)';
  let sessionStatusTone = isLight
    ? 'bg-neutral-100 border-neutral-300 text-neutral-700'
    : 'bg-neutral-850 border-neutral-700 text-neutral-300';

  if (isOnlineSession) {
    if (clientOverflowPaused) {
      sessionStatusLabel = 'PAUSED (CLIENT BUFFER OVERFLOW)';
      sessionStatusTone = 'bg-amber-950/40 border-amber-500/40 text-amber-300';
    } else if (!clientRecordingActive) {
      sessionStatusLabel = `PAUSED (${matchState})`;
      sessionStatusTone = 'bg-amber-950/30 border-amber-500/30 text-amber-300';
    } else if (isLobby) {
      sessionStatusLabel = 'RECORDING · LOBBY WARMUP (AUTO-CLEARS ON MATCH START)';
      sessionStatusTone = isLight
        ? 'bg-sky-50 border-sky-200 text-sky-900'
        : 'bg-sky-950/35 border-sky-500/40 text-sky-300';
    } else {
      sessionStatusLabel = `RECORDING · LIVE MATCH (${matchState})`;
      sessionStatusTone = isLight
        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
        : 'bg-emerald-950/35 border-emerald-500/40 text-emerald-300';
    }
  }

  const handleSelectMaxCapacity = (frames: number) => {
    setMaxClientFrames(frames);
    networkDiagnosticsStore.setDiagnosticMaxCapacity(frames);
  };

  const handleToggleAutoPauseOverflow = () => {
    const next = !autoPauseOnOverflow;
    setAutoPauseOnOverflow(next);
    networkDiagnosticsStore.setDiagnosticAutoPauseOverflow(next);
  };

  const handleToggleRecordingPause = () => {
    networkDiagnosticsStore.toggleDiagnosticRecordingPause();
    setTickRefresh((v) => v + 1);
  };

  const handleClearBuffersNow = () => {
    networkDiagnosticsStore.clearDiagnosticBuffers();
    (recorder as any)?.reset?.({
      mode: 'csts',
      priority: 'balanced',
      params: {},
    });
    setLastExportStatus('All client, telemetry & server diagnostic buffers cleared to 0.');
    setTickRefresh((v) => v + 1);
  };

  const handleExportUnifiedDumpZip = () => {
    const bridge = networkDiagnosticsStore.getSnapshot().bridge;
    if (bridge.onExportUnifiedDiagnosticDump) {
      const status = bridge.onExportUnifiedDiagnosticDump({
        includeClientReplay,
        includeReconcileTelemetry,
        includeServerReplay,
      });
      if (typeof status === 'string') setLastExportStatus(status);
      return;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const phaseSlug = !isOnlineSession ? 'offline' : isLobby ? 'lobby' : 'match';
    const entries: Array<{ name: string; data: Uint8Array | string }> = [];

    let exportedTelemetryTicks = 0;
    if (includeReconcileTelemetry && recorder && recorder.count > 0) {
      try {
        const metaObj =
          typeof recorder.toMetadataObject === 'function'
            ? recorder.toMetadataObject()
            : {
                schemaVersion: 'rc-network-telemetry-v2',
                exportedAt: new Date().toISOString(),
                summary: recorder.getSummaryStats?.() || {},
              };
        const csvText = recorder.toCsvString?.() || '';
        entries.push({
          name: 'reconcile-pacing-metadata.json',
          data: JSON.stringify(metaObj, null, 2),
        });
        if (csvText) {
          entries.push({
            name: 'reconcile-pacing-telemetry.csv',
            data: csvText,
          });
        }
        exportedTelemetryTicks = recorder.count;
      } catch (err) {
        console.warn('[DiagnosticDumpFloatingWindow] Failed to serialize reconcile telemetry:', err);
      }
    }

    const manifest = {
      schemaVersion: 'rc-diagnostic-dump-v1',
      exportedAtIso: new Date().toISOString(),
      session: {
        isOnlineSession,
        isHosting,
        isLobby,
        matchState,
        localPlayerCarIndex: diag?.localPlayerCarIndex ?? 0,
        activeCarSlots: activeSlots,
        scores: {
          blue: (diag as any)?.blueScore ?? 0,
          orange: (diag as any)?.orangeScore ?? 0,
        },
      },
      buffers: {
        clientPresentationReplay: {
          included: includeClientReplay,
          recordedFrames: clientFrames,
          exportedFrames: includeClientReplay ? clientFrames : 0,
          maxCapacityFrames: effectiveMaxFrames,
          overflowPaused: clientOverflowPaused,
          autoPauseOnOverflow,
          estimatedSizeMb: Number(clientMb),
        },
        reconcileAndPacingTelemetry: {
          included: includeReconcileTelemetry,
          recordedTicks: telemetryTicks,
          exportedTicks: exportedTelemetryTicks,
          maxCapacityTicks: MAX_TELEMETRY_TICKS,
          totalCorrections: metrics.corrections,
          mispredictions: metrics.mispredictions,
          lastReconcileErrorUu: metrics.lastErrorUu,
          maxReconcileErrorUu: metrics.maxErrorUu,
          starvationCount: telemetrySummary.starvationCount ?? 0,
          hardResyncCount: telemetrySummary.hardResyncCount ?? 0,
          rttMs: metrics.rttMs,
          jitterMs: metrics.jitterMs,
          inputBufferDepth: metrics.inputBufferDepth,
        },
        serverAuthoritativeReplay: {
          included: includeServerReplay,
          available: isHosting,
          recordedFrames: serverFrames,
          exportedFrames: includeServerReplay ? serverFrames : 0,
        },
      },
    };

    entries.unshift({
      name: 'diagnostic-manifest.json',
      data: JSON.stringify(manifest, null, 2),
    });

    const zipBytes = buildZipArchiveBytes(entries);
    const filename = `rc-diagnostic-dump-${phaseSlug}-${stamp}.zip`;
    triggerZipDownload(zipBytes, filename);
    const kb = (zipBytes.byteLength / 1024).toFixed(1);
    setLastExportStatus(
      `Exported ${filename} (${kb} KB · C:${clientFrames}f, T:${exportedTelemetryTicks}t, S:${serverFrames}f)`
    );
  };

  const handleExportStandaloneClientReplay = () => {
    if (clientFrames <= 0) {
      setLastExportStatus('No client presentation replay frames recorded yet.');
      return;
    }
    const status = networkDiagnosticsStore.getSnapshot().bridge.onExportStandaloneClientReplay?.();
    setLastExportStatus(
      typeof status === 'string'
        ? status
        : `Exporting Client Replay (${clientFrames} frames / ${clientDurationSec}s)...`
    );
  };

  const handleExportStandaloneTelemetry = () => {
    if (!recorder || recorder.count <= 0) {
      setLastExportStatus('No reconcile/pacing telemetry ticks recorded yet.');
      return;
    }
    (downloadNetworkTelemetryZip as any)(recorder, isLobby ? 'lobby-dump' : 'match-dump');
    setLastExportStatus(`Exported Reconcile & Pacing Telemetry (${telemetryTicks} ticks).`);
  };

  return (
    <div className="flex flex-col gap-2.5 h-full select-none text-xs overflow-y-auto pr-0.5">
      {/* 1. Live Session Recording State Banner */}
      <div className={`p-2.5 rounded-xl border flex items-center justify-between font-mono ${sessionStatusTone}`}>
        <div className="flex items-center gap-2 min-w-0">
          {clientOverflowPaused ? (
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          ) : isOnlineSession && clientRecordingActive ? (
            <Activity className="h-4 w-4 text-emerald-400 shrink-0 animate-pulse" />
          ) : (
            <Database className="h-4 w-4 text-neutral-400 shrink-0" />
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[11px] uppercase tracking-wide truncate">
              {sessionStatusLabel}
            </span>
            <span className="text-[10px] opacity-80 truncate">
              Active Slots: [{activeSlots.length > 0 ? activeSlots.join(', ') : 'none'}] (Mask 0x
              {activeCarMask.toString(16).toUpperCase().padStart(2, '0')}) · Local Car:{' '}
              {diag?.localPlayerCarIndex ?? 0}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggleRecordingPause}
          disabled={!isOnlineSession}
          className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-colors ${
            !isOnlineSession
              ? 'opacity-40 cursor-not-allowed border-neutral-700 text-neutral-500'
              : clientRecordingActive
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
          }`}
        >
          {clientRecordingActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {clientRecordingActive ? 'Pause' : 'Resume'}
        </button>
      </div>

      {/* 2. Live Buffer Gauges (Client Replay, Reconcile Telemetry, Server Replay) */}
      <div className="flex flex-col gap-2">
        {/* 2A. Client Presentation Replay Buffer */}
        <div
          className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-850/70 border-neutral-700/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold text-[11px]">Client Presentation Replay Buffer</span>
            </div>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                clientOverflowPaused
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
                  : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
              }`}
            >
              {clientFrames.toLocaleString()} / {effectiveMaxFrames.toLocaleString()} frames ({clientDurationSec}s · {clientMb} MB)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-700/50 overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                clientOverflowPaused || clientCapacityPct >= 95
                  ? 'bg-amber-400'
                  : 'bg-sky-400'
              }`}
              style={{ width: `${clientCapacityPct.toFixed(1)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
            <span>Stride: 1,856 B/frame (State + 8-Car Controls + Incidents + Signals)</span>
            <span>{clientCapacityPct.toFixed(1)}% used</span>
          </div>
        </div>

        {/* 2B. Reconcile & Clock Pacing Telemetry Buffer */}
        <div
          className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-850/70 border-neutral-700/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold text-[11px]">Reconcile & Pacing Telemetry</span>
            </div>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border bg-emerald-500/15 border-emerald-500/30 text-emerald-300">
              {telemetryTicks.toLocaleString()} / {MAX_TELEMETRY_TICKS.toLocaleString()} ticks ({telemetryDurationSec}s · ~{telemetryApproxKb} KB)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-700/50 overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-150"
              style={{ width: `${telemetryCapacityPct.toFixed(1)}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-1.5 pt-0.5 font-mono text-[10px]">
            <div className="p-1 rounded bg-neutral-900/50 border border-neutral-700/40 flex flex-col">
              <span className="text-neutral-400 text-[9px]">Reconcile Count</span>
              <span className="font-bold text-amber-300">{metrics.corrections}</span>
            </div>
            <div className="p-1 rounded bg-neutral-900/50 border border-neutral-700/40 flex flex-col">
              <span className="text-neutral-400 text-[9px]">Last / Max Err</span>
              <span className="font-bold text-rose-300">
                {metrics.lastErrorUu.toFixed(1)} / {metrics.maxErrorUu.toFixed(1)} UU
              </span>
            </div>
            <div className="p-1 rounded bg-neutral-900/50 border border-neutral-700/40 flex flex-col">
              <span className="text-neutral-400 text-[9px]">Starvations</span>
              <span className="font-bold text-sky-300">{telemetrySummary.starvationCount ?? 0}</span>
            </div>
            <div className="p-1 rounded bg-neutral-900/50 border border-neutral-700/40 flex flex-col">
              <span className="text-neutral-400 text-[9px]">Input Buf / RTT</span>
              <span className="font-bold text-emerald-300">
                {metrics.inputBufferDepth}t / {Math.round(metrics.rttMs)}ms
              </span>
            </div>
          </div>
        </div>

        {/* 2C. Server Authoritative Replay Buffer */}
        <div
          className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-850/70 border-neutral-700/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-violet-400" />
              <span className="font-semibold text-[11px]">Server Authoritative Replay (Host Worker)</span>
            </div>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border bg-violet-500/15 border-violet-500/30 text-violet-300">
              {isHosting
                ? `${serverFrames.toLocaleString()} frames (${serverDurationSec}s)`
                : 'Client Mode (N/A)'}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">
            {isHosting
              ? 'Records pure authoritative physics + lifecycle signals (zero client prediction garbage)'
              : 'Connected as remote client — Server Authoritative buffer resides on Host'}
          </span>
        </div>
      </div>

      {/* 3. Debug Parameters & Overflow Configuration */}
      <div
        className={`p-2.5 rounded-xl border flex flex-col gap-2 ${
          isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-850/70 border-neutral-700/70'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-semibold text-[11px]">Diagnostic Buffer & Dump Parameters</span>
          </div>
          <button
            type="button"
            onClick={handleClearBuffersNow}
            className="px-2 py-0.5 rounded border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Clear All to 0
          </button>
        </div>

        {/* Client Buffer Capacity Selector */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] text-neutral-400">
            <span>Client Replay Buffer Capacity Limit (Auto-Pauses on Overflow)</span>
            <button
              type="button"
              onClick={handleToggleAutoPauseOverflow}
              className={`px-1.5 py-0.5 rounded border font-mono text-[9px] ${
                autoPauseOnOverflow
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-neutral-700/40 border-neutral-600 text-neutral-400'
              }`}
            >
              Overflow Auto-Pause: {autoPauseOnOverflow ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {CAPACITY_PRESETS.map((preset) => {
              const selected = effectiveMaxFrames === preset.frames;
              return (
                <button
                  key={preset.frames}
                  type="button"
                  onClick={() => handleSelectMaxCapacity(preset.frames)}
                  className={`py-1 px-1.5 rounded-lg border font-mono text-[10px] transition-colors ${
                    selected
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold'
                      : isLight
                      ? 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                      : 'bg-neutral-900/60 border-neutral-700/60 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Included Tracks Toggles */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => setIncludeClientReplay((v) => !v)}
            className={`p-1.5 rounded-lg border text-left font-mono text-[10px] flex items-center justify-between ${
              includeClientReplay
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                : 'bg-neutral-900/40 border-neutral-700/50 text-neutral-500'
            }`}
          >
            <span className="truncate">Client Replay</span>
            <span>{includeClientReplay ? 'ON' : 'OFF'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIncludeReconcileTelemetry((v) => !v)}
            className={`p-1.5 rounded-lg border text-left font-mono text-[10px] flex items-center justify-between ${
              includeReconcileTelemetry
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-neutral-900/40 border-neutral-700/50 text-neutral-500'
            }`}
          >
            <span className="truncate">Reconcile Log</span>
            <span>{includeReconcileTelemetry ? 'ON' : 'OFF'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIncludeServerReplay((v) => !v)}
            className={`p-1.5 rounded-lg border text-left font-mono text-[10px] flex items-center justify-between ${
              includeServerReplay
                ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                : 'bg-neutral-900/40 border-neutral-700/50 text-neutral-500'
            }`}
          >
            <span className="truncate">Server Replay</span>
            <span>{includeServerReplay ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* 4. Anytime One-Click Export Actions */}
      <div className="flex flex-col gap-1.5 mt-auto">
        <button
          type="button"
          onClick={handleExportUnifiedDumpZip}
          className="w-full py-2.5 px-3 rounded-xl border border-sky-400/50 bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <FileArchive className="h-4 w-4 text-sky-300" />
          Export Unified Diagnostic Dump (.zip) Now
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={handleExportStandaloneClientReplay}
            className={`py-1.5 px-2 rounded-lg border font-mono text-[10px] flex items-center justify-center gap-1.5 transition-colors ${
              isLight
                ? 'bg-neutral-100 border-neutral-300 text-neutral-800 hover:bg-neutral-200'
                : 'bg-neutral-850 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <Download className="h-3 w-3 text-sky-400" />
            Client .rcreplay.gz ({clientFrames}f)
          </button>
          <button
            type="button"
            onClick={handleExportStandaloneTelemetry}
            className={`py-1.5 px-2 rounded-lg border font-mono text-[10px] flex items-center justify-center gap-1.5 transition-colors ${
              isLight
                ? 'bg-neutral-100 border-neutral-300 text-neutral-800 hover:bg-neutral-200'
                : 'bg-neutral-850 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <Download className="h-3 w-3 text-emerald-400" />
            Reconcile Telemetry .zip ({telemetryTicks}t)
          </button>
        </div>

        {lastExportStatus && (
          <div className="px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 font-mono text-[10px] flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <span className="truncate">{lastExportStatus}</span>
          </div>
        )}
      </div>
    </div>
  );
};
