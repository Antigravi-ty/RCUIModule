import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Lock,
  RotateCcw,
  Copy,
  Check,
  Download,
  Upload,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import {
  DEFAULT_TRAJECTORY_CONFIG,
  type TrajectoryRenderStyle,
  type TrajectoryUpdateMode,
} from '../../config/trainingDefaults';
import {
  ballTrajectoryTunerStore,
  useBallTrajectoryTunerStore,
} from '../../stores/ballTrajectoryTunerStore';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { SliderControl } from '../../primitives/SliderControl';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { quickNotification } from '../../stores/quickNotificationStore';

export interface BallTrajectoryTunerFloatingWindowProps {
  isLight?: boolean;
  active?: boolean;
}

export const BallTrajectoryTunerFloatingWindow: React.FC<
  BallTrajectoryTunerFloatingWindowProps
> = ({ isLight = false }) => {
  const trajectory = useAppStore((s) => s.trajectory);
  const updateTrajectory = useAppStore((s) => s.updateTrajectory);
  const { telemetry } = useBallTrajectoryTunerStore();
  const [copiedJson, setCopiedJson] = useState(false);
  const [importedJson, setImportedJson] = useState(false);

  const cfg = {
    ...DEFAULT_TRAJECTORY_CONFIG,
    ...trajectory,
  };

  const cardBg = isLight
    ? 'bg-neutral-50/90 border-neutral-200 text-neutral-800'
    : 'bg-neutral-850/60 border-neutral-700/60 text-neutral-200';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const handleCopyJson = async () => {
    const jsonStr = JSON.stringify(cfg, null, 2);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(jsonStr);
      } else if (typeof document !== 'undefined') {
        const ta = document.createElement('textarea');
        ta.value = jsonStr;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 1800);
    } catch (err) {
      console.warn('[BallTrajectoryPredictionLineTuner] Failed to copy JSON config:', err);
    }
  };

  const handleDownloadJson = () => {
    try {
      const jsonStr = JSON.stringify(cfg, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ball-trajectory-prediction-line-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('[BallTrajectoryPredictionLineTuner] Failed to export JSON file:', err);
    }
  };

  const handleImportJson = async () => {
    try {
      let text = '';
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        try {
          text = await navigator.clipboard.readText();
        } catch {
          // clipboard permission denied or unavailable
        }
      }
      if (!text.trim()) {
        quickNotification.warning('Copy TrajectoryConfig JSON to clipboard before clicking Import');
        return;
      }
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        updateTrajectory(parsed);
        setImportedJson(true);
        setTimeout(() => setImportedJson(false), 1800);
      }
    } catch (err) {
      console.warn('[BallTrajectoryPredictionLineTuner] Failed to import JSON:', err);
      quickNotification.error('Invalid Ball Trajectory JSON in clipboard');
    }
  };

  const handleReset = () => {
    updateTrajectory({ ...DEFAULT_TRAJECTORY_CONFIG });
    ballTrajectoryTunerStore.resetTelemetryCounters();
  };

  const updateBadge = (() => {
    switch (telemetry.lastUpdateKind) {
      case 'incremental-tail':
        return { label: 'INCREMENTAL (+1 TAIL)', cls: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/15' };
      case 'progressive-catchup':
        return { label: 'CATCH-UP (+N RAMP)', cls: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/15' };
      case 'full-car-hit':
        return { label: 'FULL (CAR-BALL HIT)', cls: 'text-amber-400 border-amber-500/40 bg-amber-500/15' };
      case 'full-deviation':
        return { label: 'FULL (POS DEVIATION)', cls: 'text-rose-400 border-rose-500/40 bg-rose-500/15' };
      case 'full-initial':
        return { label: 'FULL (WAKEUP)', cls: 'text-sky-400 border-sky-500/40 bg-sky-500/15' };
      case 'full-world-bounce':
        return { label: 'FULL (WORLD BOUNCE)', cls: 'text-amber-400 border-amber-500/40 bg-amber-500/15' };
      case 'full-forced':
        return { label: 'FULL (EVERY TICK)', cls: 'text-rose-400 border-rose-500/40 bg-rose-500/15' };
      case 'cached-tick':
        return { label: 'CACHED (0 WASM)', cls: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
      case 'static-preview':
        return { label: 'STATIC PREVIEW', cls: 'text-sky-400 border-sky-500/30 bg-sky-500/10' };
      default:
        return { label: 'SLEEPING / IDLE', cls: 'text-neutral-400 border-neutral-500/30 bg-neutral-500/10' };
    }
  })();

  const horizonSeconds = Number(((cfg.predictionTicks || 396) / 120).toFixed(1));
  const shadingPct = Math.round((cfg.shadingStrength ?? 0) * 100);
  const taperPct = Math.round((cfg.radiusTaper ?? 0) * 100);
  const fadePct = Math.round((cfg.horizonFade ?? 0) * 100);
  const opacityPct =
    (cfg.opacity ?? 0.5) <= 1.0
      ? Math.round((cfg.opacity ?? 0.5) * 100)
      : Math.round(cfg.opacity ?? 50);

  return (
    <div className="flex flex-col gap-2.5 select-none text-xs">
      {/* Header Card */}
      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${cardBg}`}>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs truncate">Ball Trajectory Prediction Line Tuner</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold shrink-0 ${
                cfg.enabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-neutral-500/15 border-neutral-500/30 text-neutral-400'
              }`}
            >
              {cfg.enabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>
          <span className={`text-[10px] mt-0.5 truncate ${mutedText}`}>
            WASM Incremental Tail (1/600 cost) · 3D Shaded Tube · Export JSON Defaults
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopyJson}
            title="Copy current TrajectoryConfig JSON to clipboard"
            className={`px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
              copiedJson
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : isLight
                  ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-300'
            }`}
          >
            {copiedJson ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span>{copiedJson ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadJson}
            title="Export parameters as ball-trajectory-prediction-line-config.json"
            className={`px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-300'
            }`}
          >
            <Download className="h-3 w-3" />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={handleImportJson}
            title="Import TrajectoryConfig JSON from clipboard"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              importedJson
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : isLight
                  ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-300'
            }`}
          >
            {importedJson ? <Check className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Reset trajectory parameters & telemetry counters to defaults"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-300'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <ToggleSwitch
            checked={Boolean(cfg.enabled)}
            onChange={(enabled) => updateTrajectory({ enabled })}
            isLight={isLight}
          />
        </div>
      </div>

      {/* Live 120Hz WASM Incremental vs Full Recompute Telemetry */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between border-b border-neutral-500/20 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-bold text-[11px]">Live 120Hz WASM & 3D Geometry Telemetry</span>
          </div>
          <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border font-semibold ${updateBadge.cls}`}>
            {updateBadge.label}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
          <div className="p-1.5 rounded-lg bg-black/20 border border-white/5 flex flex-col">
            <span className={mutedText}>WASM Step</span>
            <span className="font-bold text-emerald-400">
              {telemetry.wasmComputeTimeUs.toFixed(1)} µs
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-black/20 border border-white/5 flex flex-col">
            <span className={mutedText}>3D Mesh Build</span>
            <span className="font-bold text-sky-400">
              {telemetry.geometryBuildTimeUs.toFixed(1)} µs
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-black/20 border border-white/5 flex flex-col">
            <span className={mutedText}>Lookahead</span>
            <span className="font-bold text-amber-400">
              {telemetry.remainingSlices}/{telemetry.activeSlices}t
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-black/20 border border-white/5 flex flex-col">
            <span className={mutedText}>
              {cfg.renderStyle === 'tube-3d' ? '3D Triangles' : 'Line Segs'}
            </span>
            <span className="font-bold text-purple-400">{telemetry.primitiveCount}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
          <div className="px-1.5 py-1 rounded bg-black/15 border border-white/5 flex items-center justify-between">
            <span className={mutedText}>Inc Steps</span>
            <span className="font-bold text-emerald-400">{telemetry.incrementalStepCount}</span>
          </div>
          <div className="px-1.5 py-1 rounded bg-black/15 border border-white/5 flex items-center justify-between">
            <span className={mutedText}>Full Syncs</span>
            <span className="font-bold text-amber-400">{telemetry.fullRecomputeCount}</span>
          </div>
          <div className="px-1.5 py-1 rounded bg-black/15 border border-white/5 flex items-center justify-between">
            <span className={mutedText}>Car Hits</span>
            <span className="font-bold text-sky-400">{telemetry.carHitRecomputeCount}</span>
          </div>
          <div className="px-1.5 py-1 rounded bg-black/15 border border-white/5 flex items-center justify-between">
            <span className={mutedText}>Bounces</span>
            <span className="font-bold text-purple-400">{telemetry.bounceCount}</span>
          </div>
        </div>
      </div>

      {/* 1. WASM Incremental Prediction & Trigger Policy */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center gap-2 border-b border-neutral-500/20 pb-1.5">
          <Cpu className="h-4 w-4 text-emerald-400 shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-[11px]">1. WASM Incremental Prediction & Trigger Policy</span>
            <span className={`text-[10px] ${mutedText}`}>
              Floor & wall bounces are pre-simulated in WASM shadow arena without full recompute
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-semibold ${mutedText}`}>Prediction Horizon Mode</span>
          <SegmentedSwitch
            size="sm"
            fullWidth
            value={cfg.updateMode || 'continuous-incremental'}
            onValueChange={(val) =>
              updateTrajectory({ updateMode: val as TrajectoryUpdateMode })
            }
            isLight={isLight}
            options={[
              { value: 'continuous-incremental', label: 'Continuous Incremental (600t Tail)' },
              { value: 'event-snapshot', label: 'Snapshot (Shrinks)' },
              { value: 'full-every-tick', label: 'Full 600t/Tick' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/15 border border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold">Car-Ball Hit Trigger</span>
              <span className={`text-[9px] ${mutedText}`}>Recompute on 0x01 incident</span>
            </div>
            <ToggleSwitch
              checked={cfg.recomputeOnCarHit !== false}
              onChange={(recomputeOnCarHit) => updateTrajectory({ recomputeOnCarHit })}
              isLight={isLight}
            />
          </div>

          <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/15 border border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold">World Bounce Trigger</span>
              <span className={`text-[9px] ${mutedText}`}>Force full on wall/floor hit</span>
            </div>
            <ToggleSwitch
              checked={Boolean(cfg.recomputeOnWorldBounce)}
              onChange={(recomputeOnWorldBounce) =>
                updateTrajectory({ recomputeOnWorldBounce })
              }
              isLight={isLight}
            />
          </div>
        </div>

        <SliderControl
          label="Position Deviation Threshold"
          value={cfg.deviationThresholdUu ?? 5.0}
          min={1}
          max={50}
          step={0.5}
          unit=" UU"
          onChange={(deviationThresholdUu) => updateTrajectory({ deviationThresholdUu })}
          isLight={isLight}
        />

        <SliderControl
          label="Activation Velocity Threshold"
          value={cfg.velocityThresholdUu ?? 15}
          min={5}
          max={600}
          step={5}
          unit=" UU/s"
          onChange={(velocityThresholdUu) => updateTrajectory({ velocityThresholdUu })}
          isLight={isLight}
        />

        <SliderControl
          label="Catch-Up Step Budget (Ramp After Hit)"
          value={cfg.catchupTicksPerFrame ?? 20}
          min={2}
          max={120}
          step={1}
          unit="t/frame"
          onChange={(catchupTicksPerFrame) => updateTrajectory({ catchupTicksPerFrame })}
          isLight={isLight}
        />
      </div>

      {/* 2. 3D Volumetric Geometry & Spatial Depth Cues */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center gap-2 border-b border-neutral-500/20 pb-1.5">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-[11px]">2. 3D Volumetric Tube & Spatial Depth Perception</span>
            <span className={`text-[10px] ${mutedText}`}>
              Eliminates 1-tick round-cap overdraw & adds 3D cylinder shading + depth taper
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-semibold ${mutedText}`}>3D Rendering Backend</span>
          <SegmentedSwitch
            size="sm"
            fullWidth
            value={cfg.renderStyle || 'tube-3d'}
            onValueChange={(val) =>
              updateTrajectory({ renderStyle: val as TrajectoryRenderStyle })
            }
            isLight={isLight}
            options={[
              { value: 'tube-3d', label: '3D Shaded Tube (Zero Cap Overdraw)' },
              { value: 'decimated-line', label: 'Wide LineSegments2 (2D Flat)' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SliderControl
            label="Tick Sample Stride"
            value={cfg.sampleStride ?? 1}
            min={1}
            max={6}
            step={1}
            unit="x"
            onChange={(sampleStride) => updateTrajectory({ sampleStride })}
            isLight={isLight}
          />
          <SliderControl
            label="Tube Radial Sides"
            value={cfg.tubeRadialSegments ?? 6}
            min={4}
            max={8}
            step={2}
            unit=" sides"
            onChange={(tubeRadialSegments) => updateTrajectory({ tubeRadialSegments })}
            isLight={isLight}
          />
        </div>

        <SliderControl
          label="3D Cylindrical Shading Contrast"
          value={shadingPct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(pct) => updateTrajectory({ shadingStrength: pct / 100 })}
          isLight={isLight}
        />

        <div className="grid grid-cols-2 gap-2">
          <SliderControl
            label="Horizon Radius Taper"
            value={taperPct}
            min={0}
            max={85}
            step={5}
            unit="%"
            onChange={(pct) => updateTrajectory({ radiusTaper: pct / 100 })}
            isLight={isLight}
          />
          <SliderControl
            label="Horizon Distance Fade"
            value={fadePct}
            min={0}
            max={85}
            step={5}
            unit="%"
            onChange={(pct) => updateTrajectory({ horizonFade: pct / 100 })}
            isLight={isLight}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/15 border border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold">3D Bounce Rings</span>
              <span className={`text-[9px] ${mutedText}`}>Surface-aligned impact discs</span>
            </div>
            <ToggleSwitch
              checked={Boolean(cfg.showBounceMarkers)}
              onChange={(showBounceMarkers) => updateTrajectory({ showBounceMarkers })}
              isLight={isLight}
            />
          </div>

          <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/15 border border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold">Floor Altitude Drop Lines</span>
              <span className={`text-[9px] ${mutedText}`}>Vertical height + floor trace</span>
            </div>
            <ToggleSwitch
              checked={Boolean(cfg.showGroundProjection)}
              onChange={(showGroundProjection) =>
                updateTrajectory({ showGroundProjection })
              }
              isLight={isLight}
            />
          </div>
        </div>

        {cfg.showGroundProjection && (
          <SliderControl
            label="Altitude Drop Line Interval"
            value={cfg.dropLineIntervalTicks ?? 104}
            min={16}
            max={120}
            step={8}
            unit=" ticks"
            onChange={(dropLineIntervalTicks) =>
              updateTrajectory({ dropLineIntervalTicks })
            }
            isLight={isLight}
          />
        )}
      </div>

      {/* 3. Developer Thickness, Dash Styling & User Menu Permissions */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center gap-2 border-b border-neutral-500/20 pb-1.5">
          <Layers className="h-4 w-4 text-sky-400 shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-[11px]">3. Ribbon Dimensions & User Menu Access Control</span>
            <span className={`text-[10px] ${mutedText}`}>
              Calibrate developer baseline thickness/dashes & lock what normal users can modify
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SliderControl
            label="Line Thickness (% Ball)"
            value={cfg.thickness ?? 20}
            min={1}
            max={75}
            step={1}
            unit="%"
            onChange={(thickness) => updateTrajectory({ thickness })}
            isLight={isLight}
          />
          <SliderControl
            label="Line Opacity"
            value={opacityPct}
            min={5}
            max={100}
            step={5}
            unit="%"
            onChange={(pct) => updateTrajectory({ opacity: pct / 100 })}
            isLight={isLight}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <SliderControl
            label="Horizon"
            value={horizonSeconds}
            min={0.5}
            max={5.0}
            step={0.1}
            unit="s"
            onChange={(duration) =>
              updateTrajectory({
                duration,
                predictionTicks: Math.round(duration * 120),
              })
            }
            isLight={isLight}
          />
          <SliderControl
            label="Solid Dash"
            value={cfg.solidTicks ?? 50}
            min={5}
            max={240}
            step={5}
            unit="t"
            onChange={(solidTicks) => updateTrajectory({ solidTicks })}
            isLight={isLight}
          />
          <SliderControl
            label="Dash Gap"
            value={cfg.transparentTicks ?? 20}
            min={5}
            max={240}
            step={5}
            unit="t"
            onChange={(transparentTicks) => updateTrajectory({ transparentTicks })}
            isLight={isLight}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/15 border border-white/5">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold">Allow User Thickness Edit</span>
                <span className={`text-[9px] ${mutedText}`}>Default off (Developer-only)</span>
              </div>
            </div>
            <ToggleSwitch
              checked={Boolean(cfg.allowUserThicknessEdit)}
              onChange={(allowUserThicknessEdit) =>
                updateTrajectory({ allowUserThicknessEdit })
              }
              isLight={isLight}
            />
          </div>

          <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/15 border border-white/5">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-sky-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold">Allow User Dash Edit</span>
                <span className={`text-[9px] ${mutedText}`}>Solid/Gap sliders in User UI</span>
              </div>
            </div>
            <ToggleSwitch
              checked={cfg.allowUserDashEdit !== false}
              onChange={(allowUserDashEdit) => updateTrajectory({ allowUserDashEdit })}
              isLight={isLight}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BallTrajectoryTunerFloatingWindow;
