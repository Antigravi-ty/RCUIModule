import React, { useState, useMemo } from 'react';
import {
  Volume2,
  Download,
  Copy,
  Check,
  RotateCcw,
  Play,
  Square,
  Sliders,
} from 'lucide-react';
import { SliderControl } from '../../primitives/SliderControl';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { useSpatialAudioStore } from '../../stores/spatialAudioStore';
import { useSubsystemIsolationLabStore } from '../../stores/subsystemIsolationLabStore';
import {
  solveCubicBezier,
  type SpatialAudioTunerConfig,
} from '../../config/spatialAudioConfig';
import { SpatialAudioCurveCard } from './SpatialAudioCurveCard';

export interface SpatialAudioTunerFloatingWindowProps {
  isLight?: boolean;
  active?: boolean;
}

export const SpatialAudioTunerFloatingWindow: React.FC<
  SpatialAudioTunerFloatingWindowProps
> = ({ isLight = false, active = true }) => {
  const tunerConfig = useSpatialAudioStore((s) => s.tunerConfig);
  const updateTunerConfig = useSpatialAudioStore((s) => s.updateTunerConfig);
  const resetTunerConfig = useSpatialAudioStore((s) => s.resetTunerConfig);

  const selectedAnthem = useSpatialAudioStore((s) => s.selectedAnthem);
  const previewingAnthemId = useSpatialAudioStore((s) => s.previewingAnthemId);
  const activeGoalAnthemId = useSpatialAudioStore((s) => s.activeGoalAnthemId);
  const togglePreviewAnthem = useSpatialAudioStore((s) => s.togglePreviewAnthem);
  const anthemLinearPhase = useSpatialAudioStore((s) => s.anthemLinearPhase);
  const anthemBlend = useSpatialAudioStore((s) => s.anthemBlend);
  const bgmLinearPhase = useSpatialAudioStore((s) => s.bgmLinearPhase);
  const bgmBlend = useSpatialAudioStore((s) => s.bgmBlend);
  const bgmIsPlaying = useSpatialAudioStore((s) => s.bgmIsPlaying);

  const [copied, setCopied] = useState(false);

  const curveSvgPath = useMemo(() => {
    const pts: string[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const b = solveCubicBezier(
        u,
        tunerConfig.bzX1,
        tunerConfig.bzY1,
        tunerConfig.bzX2,
        tunerConfig.bzY2
      );
      const x = (u * 100).toFixed(2);
      const y = ((1 - b) * 100).toFixed(2);
      pts.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    return pts.join(' ');
  }, [
    tunerConfig.bzX1,
    tunerConfig.bzY1,
    tunerConfig.bzX2,
    tunerConfig.bzY2,
  ]);

  if (!active) return null;

  const testAnthemId =
    selectedAnthem && selectedAnthem !== 'none'
      ? selectedAnthem
      : 'MX_CelebrationStadium_Stingers_0001';
  const isAuditioning = previewingAnthemId !== null;

  const handleCopyJson = () => {
    const json = JSON.stringify(tunerConfig, null, 2);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(json).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadJson = () => {
    const json = JSON.stringify(tunerConfig, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spatial-audio-tuner-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const overrideModes: {
    id: SpatialAudioTunerConfig['overrideMode'];
    label: string;
  }[] = [
    { id: 'auto', label: 'Auto (Game State)' },
    { id: 'normal', label: 'Normal (0.0)' },
    { id: 'spatial', label: 'Spatial (1.0)' },
    { id: 'manual', label: 'Manual Scrub' },
  ];

  return (
    <div
      data-ui-interactive="true"
      className="flex flex-col gap-3 text-xs select-none"
    >
      {/* Header Status & Quick Audition Bar */}
      <div
        className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border ${
          isLight
            ? 'bg-neutral-100/90 border-neutral-200 text-neutral-700'
            : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex flex-col leading-snug truncate">
            <span className="font-semibold text-[11px] truncate">
              Stadium Spatial Audio & Non-Linear Transition Engine
            </span>
            <span className="text-[10px] text-neutral-400 truncate">
              Fast near Normal (0.0) · Slow near Spatial (1.0) · Default 2.0s
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => togglePreviewAnthem(testAnthemId, 'tuner-audition')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer shrink-0 ${
            isAuditioning
              ? 'bg-amber-500 text-neutral-950 border-amber-400'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
          }`}
        >
          {isAuditioning ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              <span>Stop Test</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>Test Stinger</span>
            </>
          )}
        </button>
      </div>

      {/* Live Directional Non-Linear Curve & Telemetry Card */}
      <SpatialAudioCurveCard
        isLight={isLight}
        tunerConfig={tunerConfig}
        curveSvgPath={curveSvgPath}
        anthemLinearPhase={anthemLinearPhase}
        anthemBlend={anthemBlend}
        bgmLinearPhase={bgmLinearPhase}
        bgmBlend={bgmBlend}
        bgmIsPlaying={bgmIsPlaying}
        activeGoalAnthemId={activeGoalAnthemId}
        previewingAnthemId={previewingAnthemId}
        overrideModes={overrideModes}
        updateTunerConfig={updateTunerConfig}
      />

      {/* Transition Duration & Directional Cubic-Bezier Sliders */}
      <div className="grid grid-cols-1 gap-2">
        <div className="grid grid-cols-2 gap-2">
          <SliderControl
            editable={true}
            allowOutOfBoundsInput={true}
            showStepper={false}
            colorScheme="amber"
            label="Spatial Transition (Default 2.0s)"
            unit="s"
            value={tunerConfig.transitionDurationSec}
            min={0.1}
            max={6.0}
            step={0.1}
            isLight={isLight}
            onChange={(v) =>
              updateTunerConfig({ transitionDurationSec: Math.max(0.1, v) })
            }
          />
          <SliderControl
            editable={true}
            allowOutOfBoundsInput={false}
            showStepper={false}
            colorScheme="amber"
            label="BGM Play/Pause Fade (Max 3.0s)"
            unit="s"
            value={tunerConfig.bgmFadeDurationSec ?? 2.0}
            min={0.1}
            max={3.0}
            step={0.1}
            isLight={isLight}
            onChange={(v) =>
              updateTunerConfig({
                bgmFadeDurationSec: Math.max(0.1, Math.min(3.0, v)),
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SliderControl
            editable={true}
            allowOutOfBoundsInput={false}
            showStepper={false}
            colorScheme="amber"
            label="Bezier P1.x (Normal)"
            unit=""
            value={tunerConfig.bzX1}
            min={0.01}
            max={0.99}
            step={0.01}
            isLight={isLight}
            onChange={(v) => updateTunerConfig({ bzX1: v })}
          />
          <SliderControl
            editable={true}
            allowOutOfBoundsInput={false}
            showStepper={false}
            colorScheme="amber"
            label="Bezier P1.y (Normal)"
            unit=""
            value={tunerConfig.bzY1}
            min={0.0}
            max={1.0}
            step={0.01}
            isLight={isLight}
            onChange={(v) => updateTunerConfig({ bzY1: v })}
          />
          <SliderControl
            editable={true}
            allowOutOfBoundsInput={false}
            showStepper={false}
            colorScheme="amber"
            label="Bezier P2.x (Spatial)"
            unit=""
            value={tunerConfig.bzX2}
            min={0.01}
            max={1.0}
            step={0.01}
            isLight={isLight}
            onChange={(v) => updateTunerConfig({ bzX2: v })}
          />
          <SliderControl
            editable={true}
            allowOutOfBoundsInput={false}
            showStepper={false}
            colorScheme="amber"
            label="Bezier P2.y (Spatial)"
            unit=""
            value={tunerConfig.bzY2}
            min={0.0}
            max={1.0}
            step={0.01}
            isLight={isLight}
            onChange={(v) => updateTunerConfig({ bzY2: v })}
          />
        </div>
      </div>

      {/* Stadium Reverb & Filter Parameters (Defaults from spaceaudio/new) */}
      <div
        className={`flex flex-col gap-2 p-2.5 rounded-xl border ${
          isLight
            ? 'bg-neutral-100/80 border-neutral-200'
            : 'bg-neutral-900/70 border-neutral-800'
        }`}
      >
        <div className="flex items-center gap-1.5 text-[11px] font-semibold">
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          <span>Stadium Filter & Reverb Parameters (spaceaudio/new)</span>
        </div>

        <SliderControl
          editable={true}
          allowOutOfBoundsInput={true}
          showStepper={false}
          colorScheme="amber"
          label="Low-Pass Cutoff (Spatial)"
          unit="Hz"
          value={tunerConfig.lpfMinFreq}
          min={400}
          max={16000}
          step={50}
          isLight={isLight}
          onChange={(v) => updateTunerConfig({ lpfMinFreq: v })}
        />

        <SliderControl
          editable={true}
          allowOutOfBoundsInput={true}
          showStepper={false}
          colorScheme="amber"
          label="High-Pass Cutoff (Spatial)"
          unit="Hz"
          value={tunerConfig.hpfMaxFreq}
          min={20}
          max={2000}
          step={25}
          isLight={isLight}
          onChange={(v) => updateTunerConfig({ hpfMaxFreq: v })}
        />

        <div className="grid grid-cols-3 gap-2">
          <SliderControl
            editable={true}
            allowOutOfBoundsInput={false}
            showStepper={false}
            colorScheme="amber"
            label="Wet Mix"
            unit="%"
            value={tunerConfig.wetMaxPct}
            min={0}
            max={100}
            step={1}
            isLight={isLight}
            onChange={(v) => updateTunerConfig({ wetMaxPct: v })}
          />
          <SliderControl
            editable={true}
            allowOutOfBoundsInput={true}
            showStepper={false}
            colorScheme="amber"
            label="Decay"
            unit="s"
            value={tunerConfig.decaySec}
            min={0.5}
            max={6.0}
            step={0.1}
            isLight={isLight}
            onChange={(v) => updateTunerConfig({ decaySec: v })}
          />
          <SliderControl
            editable={true}
            allowOutOfBoundsInput={true}
            showStepper={false}
            colorScheme="amber"
            label="Wet Boost"
            unit="x"
            value={tunerConfig.wetBoost}
            min={0.5}
            max={2.5}
            step={0.05}
            isLight={isLight}
            onChange={(v) => updateTunerConfig({ wetBoost: v })}
          />
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-neutral-700/30">
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-[11px] truncate">
              Mute Signal Audio in Goal Replay
            </span>
            <span
              className={`text-[10px] truncate ${
                isLight ? 'text-neutral-500' : 'text-neutral-400'
              }`}
            >
              Suppress kickoff 3-2-1 &amp; 10s/30s/60s timer signal cues during Goal Replay
            </span>
          </div>
          <ToggleSwitch
            checked={Boolean(tunerConfig.muteSignalAudioInGoalReplay ?? true)}
            onCheckedChange={(v) => {
              updateTunerConfig({ muteSignalAudioInGoalReplay: v });
              try {
                useSubsystemIsolationLabStore.getState().updateLiveTelemetry({
                  goalReplayMuteSignalAudio: v,
                });
              } catch {
                // Ignore if unavailable
              }
            }}
            isLight={isLight}
            variant="amber"
          />
        </div>
      </div>

      {/* Export / Copy / Reset Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDownloadJson}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
              isLight
                ? 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
                : 'bg-sky-500/15 border-sky-500/35 text-sky-300 hover:bg-sky-500/25'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
              isLight
                ? 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
                : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={resetTunerConfig}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
            isLight
              ? 'bg-neutral-100 border-neutral-300 text-neutral-600 hover:bg-neutral-200'
              : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset (2.0s)</span>
        </button>
      </div>
    </div>
  );
};
