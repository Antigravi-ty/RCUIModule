import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sliders,
  Upload,
  Download,
  RotateCcw,
  Activity,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import {
  CLOCK_PACING_PRIORITY_PRESETS,
  type ClockPacingPriority,
  type ClockPacingParams,
} from '../../config/clockPacingConfig';
import { PacingOscilloscopeCanvas } from './clock-pacing-tuner/PacingOscilloscopeCanvas';
import {
  globalPacingTelemetryRecorder,
  simulatePacingOnRecordedTrace,
} from '../../stores/pacingTelemetryRecorder';
import {
  downloadNetworkTelemetryZip,
  parseImportedTelemetryFile,
  getImportedTelemetryPayload,
  setImportedTelemetryPayload,
} from '../../stores/pacingTelemetryExporter';

export interface ClockPacingTunerFloatingWindowProps {
  isLight?: boolean;
  active?: boolean;
}

import { ClockPacingParameterGroups } from './clock-pacing-tuner/ClockPacingParameterGroups';

export const ClockPacingTunerFloatingWindow: React.FC<ClockPacingTunerFloatingWindowProps> = ({
  isLight = false,
  active = true,
}) => {
  const clockPacingMode = useAppStore((s) => s.clockPacingMode);
  const setClockPacingMode = useAppStore((s) => s.setClockPacingMode);
  const customParams = useAppStore((s) => s.customClockPacingParams);
  const updateCustomParams = useAppStore((s) => s.updateCustomClockPacingParams);
  const resetCustomParams = useAppStore((s) => s.resetCustomClockPacingParams);

  const [importedTrace, setImportedTrace] = useState<any>(() => getImportedTelemetryPayload());
  const [useImportedSource, setUseImportedSource] = useState<boolean>(() => Boolean(getImportedTelemetryPayload()));
  const [windowSeconds, setWindowSeconds] = useState<number>(15);
  const [simRefreshTick, setSimRefreshTick] = useState<number>(0);
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Periodically refresh live trace What-If evaluation at 2Hz when inspecting live telemetry
  useEffect(() => {
    if (!active || useImportedSource) return;
    const id = window.setInterval(() => {
      setSimRefreshTick((v) => (v + 1) % 10000);
    }, 500);
    return () => window.clearInterval(id);
  }, [active, useImportedSource]);

  const recordedSummary = useMemo(() => {
    if (useImportedSource && importedTrace?.summary) {
      return importedTrace.summary;
    }
    return globalPacingTelemetryRecorder.getSummaryStats();
  }, [useImportedSource, importedTrace, simRefreshTick]);

  const windowSamples = Math.max(120, Math.round(windowSeconds * 120));

  // Run counterfactual What-If simulation across the active trace (imported archive or live buffer)
  const simulatedResult = useMemo(() => {
    const sourceTrace = useImportedSource && importedTrace ? importedTrace : globalPacingTelemetryRecorder;
    return simulatePacingOnRecordedTrace(sourceTrace, customParams, 'custom', windowSamples);
  }, [importedTrace, useImportedSource, customParams, simRefreshTick, windowSamples]);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const normalized: any = await parseImportedTelemetryFile(file);
      setImportedTelemetryPayload(normalized);
      setImportedTrace(normalized);
      setUseImportedSource(true);
      const len = normalized.columns.timeMs.length;
      setImportStatusMsg(`Loaded ${len} ticks (${(len / 120).toFixed(1)}s)`);
      setTimeout(() => setImportStatusMsg(null), 4000);
    } catch (err) {
      console.warn('[ClockPacingTunerFloatingWindow] Failed to parse imported telemetry file:', err);
      setImportStatusMsg('Failed to parse telemetry file (.zip/.json/.csv)');
    }
  };

  const applyPresetSeed = (priority: ClockPacingPriority) => {
    const seed = CLOCK_PACING_PRIORITY_PRESETS[priority];
    if (seed?.paramsPatch) {
      updateCustomParams({ ...seed.paramsPatch });
    }
  };

  const updateParam = <K extends keyof ClockPacingParams>(key: K, value: ClockPacingParams[K]) => {
    updateCustomParams({ [key]: value });
  };

  const simSummary = simulatedResult?.summary;
  const importedTickCount = importedTrace?.columns?.timeMs?.length ?? 0;

  return (
    <div className="flex flex-col gap-2 h-full select-none text-xs overflow-y-auto pr-0.5">
      {/* 1. Top Bar: Mode Status, Trace Source Selector & Import/Export Controls */}
      <div
        className={`p-2 rounded-xl border font-mono flex flex-wrap items-center justify-between gap-2 ${
          isLight ? 'bg-neutral-100 border-neutral-300 text-neutral-800' : 'bg-neutral-850 border-neutral-700 text-neutral-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-amber-400 shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[11px] uppercase tracking-wide">
                Pacing Controller & Counterfactual Simulator
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold border uppercase ${
                  clockPacingMode === 'custom'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                }`}
              >
                Active Mode: {clockPacingMode}
              </span>
            </div>
            <span className="text-[10px] opacity-75">
              {useImportedSource && importedTickCount > 0
                ? `Inspecting Imported Trace (${importedTickCount} ticks · ${(importedTickCount / 120).toFixed(1)}s)`
                : `Inspecting Live Session Buffer (${globalPacingTelemetryRecorder.count} ticks · ${(globalPacingTelemetryRecorder.count / 120).toFixed(1)}s)`}
              {importStatusMsg ? ` — ${importStatusMsg}` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.json,.csv,application/zip,application/json,text/csv"
            onChange={handleImportFile}
            className="hidden"
          />
          {importedTickCount > 0 && (
            <button
              type="button"
              onClick={() => setUseImportedSource((v) => !v)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                useImportedSource
                  ? 'bg-violet-500/25 border-violet-400 text-violet-200'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300'
              }`}
            >
              {useImportedSource ? 'Source: Imported Archive' : 'Source: Live Buffer'}
            </button>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer transition-colors ${
              isLight
                ? 'bg-violet-50 hover:bg-violet-100 border-violet-300 text-violet-800'
                : 'bg-violet-500/20 hover:bg-violet-500/30 border-violet-500/40 text-violet-300'
            }`}
          >
            <Upload className="h-3 w-3" />
            <span>Import .ZIP</span>
          </button>
          <button
            type="button"
            onClick={() => (downloadNetworkTelemetryZip as any)(globalPacingTelemetryRecorder, 'dev_tuner')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer transition-colors ${
              isLight
                ? 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-800'
                : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300'
            }`}
          >
            <Download className="h-3 w-3" />
            <span>Export .ZIP</span>
          </button>
        </div>
      </div>

      {/* 2. Counterfactual What-If Macro Summary Comparison Cards (Recorded Baseline vs Simulated Custom Parameters) */}
      <div className="grid grid-cols-6 gap-1.5 font-mono">
        <div className={`p-1.5 rounded-xl border flex flex-col ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-850/70 border-neutral-700/70'}`}>
          <span className="text-[9px] text-neutral-400 uppercase">Sim Starvations</span>
          <span className={`text-xs font-bold ${(simSummary?.starvationCount ?? 0) === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {simSummary ? `${simSummary.starvationCount} (${simSummary.starvationPct.toFixed(2)}%)` : '0 (0.00%)'}
          </span>
          <span className="text-[9px] text-neutral-500">
            Rec: {recordedSummary.starvationCount ?? 0} ({(recordedSummary.starvationPct ?? 0).toFixed(1)}%)
          </span>
        </div>

        <div className={`p-1.5 rounded-xl border flex flex-col ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-850/70 border-neutral-700/70'}`}>
          <span className="text-[9px] text-neutral-400 uppercase">Sim Hard Snaps</span>
          <span className={`text-xs font-bold ${(simSummary?.hardResyncCount ?? 0) === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {simSummary ? simSummary.hardResyncCount : 0}
          </span>
          <span className="text-[9px] text-neutral-500">
            Rec: {recordedSummary.hardResyncCount ?? 0}
          </span>
        </div>

        <div className={`p-1.5 rounded-xl border flex flex-col ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-850/70 border-neutral-700/70'}`}>
          <span className="text-[9px] text-neutral-400 uppercase">Switches / Min</span>
          <span className="text-xs font-bold text-amber-400">
            {simSummary ? simSummary.rateSwitchesPerMin.toFixed(1) : '0.0'}/m
          </span>
          <span className="text-[9px] text-neutral-500">
            Rec: {(recordedSummary.rateSwitchesPerMin ?? 0).toFixed(1)}/m
          </span>
        </div>

        <div className={`p-1.5 rounded-xl border flex flex-col ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-850/70 border-neutral-700/70'}`}>
          <span className="text-[9px] text-neutral-400 uppercase">P95 Buf Error</span>
          <span className="text-xs font-bold text-sky-400">
            {simSummary ? simSummary.p95BufferAbsError.toFixed(2) : '0.00'}f
          </span>
          <span className="text-[9px] text-neutral-500">
            Rec: {(recordedSummary.p95BufferAbsError ?? 0).toFixed(2)}f
          </span>
        </div>

        <div className={`p-1.5 rounded-xl border flex flex-col ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-850/70 border-neutral-700/70'}`}>
          <span className="text-[9px] text-neutral-400 uppercase">Rate StdDev</span>
          <span className="text-xs font-bold text-emerald-400">
            ±{simSummary ? simSummary.stdPhysicsRateHz.toFixed(2) : '0.00'}Hz
          </span>
          <span className="text-[9px] text-neutral-500">
            Rec: ±{(recordedSummary.stdPhysicsRateHz ?? 0).toFixed(2)}Hz
          </span>
        </div>

        <div className={`p-1.5 rounded-xl border flex flex-col ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-850/70 border-neutral-700/70'}`}>
          <span className="text-[9px] text-neutral-400 uppercase">50/50 Lead Cost</span>
          <span className="text-xs font-bold text-violet-400">
            +{simSummary ? simSummary.estimated5050LeadPenaltyMs.toFixed(1) : '0.0'}ms
          </span>
          <span className="text-[9px] text-neutral-500">
            Rec: +{(recordedSummary.estimated5050LeadPenaltyMs ?? 0).toFixed(1)}ms
          </span>
        </div>
      </div>

      {/* 3. 3-Pane Oscilloscope with Real-Time Violet What-If Overlay */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-1 font-mono text-[10px]">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-violet-400" />
            <span className="font-bold text-violet-300">
              Violet Curve = Counterfactual What-If Simulation under Current Sliders
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-neutral-400">Window:</span>
            {[5, 15, 30, 60].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setWindowSeconds(sec)}
                className={`px-1.5 py-0.2 rounded border cursor-pointer ${
                  windowSeconds === sec
                    ? 'bg-sky-500/25 border-sky-400 text-sky-200 font-bold'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        <PacingOscilloscopeCanvas
          windowSamples={windowSamples}
          deadbandOffsets={[customParams.deadbandCatchupOffset, customParams.deadbandSkipOffset]}
          simulatedPreview={simulatedResult?.previewWindow ?? null}
          importedColumns={useImportedSource && importedTrace?.columns ? importedTrace.columns : null}
          height={210}
        />
      </div>

      {/* 4. Seed Presets & Step Mode Bar */}
      <div
        className={`p-2 rounded-xl border font-mono flex flex-wrap items-center justify-between gap-1.5 ${
          isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-850/80 border-neutral-700/80'
        }`}
      >
        <div className="flex items-center gap-1 flex-wrap">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="text-[10px] text-neutral-400 mr-1">Seed from Priority:</span>
          {(
            [
              { id: 'low_latency_5050', label: '50/50 Accuracy' },
              { id: 'balanced', label: 'Balanced' },
              { id: 'anti_starvation', label: 'Anti-Starvation' },
              { id: 'rate_stability', label: 'Rate Stability' },
            ] as { id: ClockPacingPriority; label: string }[]
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPresetSeed(p.id)}
              className="px-2 py-0.5 rounded border text-[10px] font-semibold cursor-pointer bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-200 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {clockPacingMode !== 'custom' && (
            <button
              type="button"
              onClick={() => setClockPacingMode('custom')}
              className="flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer bg-amber-500/20 border-amber-500/40 text-amber-300"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Activate Custom</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => resetCustomParams()}
            className="flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] cursor-pointer bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      <ClockPacingParameterGroups
        customParams={customParams}
        isLight={isLight}
        updateParam={updateParam}
      />
    </div>
  );
};
