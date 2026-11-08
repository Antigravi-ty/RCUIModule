import React from 'react';
import { Crosshair, Play, Pause, Sparkles, X } from 'lucide-react';
import {
  evaluateDemolishShockwaveFrame,
  getDemolishLiveAnchors,
  resolveDemolishSimTargetUu,
  scrubDemolishShockwaveSim,
  setDemolishShockwaveConfig,
  stopDemolishShockwaveSim,
  triggerDemolishShockwaveSim,
  type DemolishShockwaveConfig,
  type DemolishShockwaveSimState,
  type DemolishSimAnchorMode,
} from '../../../config/demolishShockwaveConfig';
import { ToggleSwitch } from '../../../primitives/ToggleSwitch';

export interface DemolishShockwaveSimSectionProps {
  config: DemolishShockwaveConfig;
  sim: DemolishShockwaveSimState;
  isLight: boolean;
}

const COORD_PRESETS: ReadonlyArray<{ label: string; x: number; y: number; z: number }> = [
  { label: 'Center (0, 0, 45)', x: 0, y: 0, z: 45 },
  { label: 'Kickoff (0, -1500, 45)', x: 0, y: -1500, z: 45 },
  { label: 'Blue Box (0, -4200, 60)', x: 0, y: -4200, z: 60 },
  { label: 'Orange Box (0, 4200, 60)', x: 0, y: 4200, z: 60 },
  { label: 'Aerial Mid (0, 0, 450)', x: 0, y: 0, z: 450 },
];

const ANCHOR_OPTIONS: ReadonlyArray<{ id: DemolishSimAnchorMode; label: string }> = [
  { id: 'in-front-car', label: 'In Front of Car' },
  { id: 'local-car', label: 'At Local Car' },
  { id: 'ball', label: 'At Ball' },
  { id: 'custom-xyz', label: 'Custom XYZ' },
];

export const DemolishShockwaveSimAndScrubberSection: React.FC<
  DemolishShockwaveSimSectionProps
> = ({ config, sim, isLight }) => {
  const frame = evaluateDemolishShockwaveFrame(sim.normT, config);
  const resolvedUu = resolveDemolishSimTargetUu(config);

  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-900'
    : 'bg-neutral-900/60 border-neutral-700/60 text-neutral-100';
  const inputCls = isLight
    ? 'bg-white border-neutral-300 text-neutral-900'
    : 'bg-neutral-950 border-neutral-700 text-neutral-100';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const previewScale = 128 / 380;
  const previewPx = Math.max(4, Math.min(136, frame.size * previewScale));
  const hole = frame.innerHolePct;
  const feather = config.featherPct;
  const inStart = Math.max(0, hole - feather * (hole / 100));
  const inEnd = Math.min(100, hole + feather * (1 - hole / 100) * 0.5);
  const maskImage =
    hole <= 0.1
      ? 'none'
      : `radial-gradient(circle, transparent ${inStart.toFixed(1)}%, black ${inEnd.toFixed(1)}%)`;

  const [r, g, b] = frame.rgb;
  const glowSpread = (previewPx * 0.22 * frame.glowFactor).toFixed(1);
  const glowInset = (previewPx * 0.12 * frame.glowFactor).toFixed(1);
  const glowAlpha = Math.min(0.95, frame.glowFactor * 0.85).toFixed(2);
  const boxShadow =
    frame.glowFactor > 0.01
      ? `0 0 ${glowSpread}px rgba(${r},${g},${b},${glowAlpha}), inset 0 0 ${glowInset}px rgba(255,255,255,${glowAlpha})`
      : 'none';

  const handleSnapFromCar = () => {
    const a = getDemolishLiveAnchors();
    setDemolishShockwaveConfig({
      simAnchorMode: 'custom-xyz',
      simX: Math.round(a.carX),
      simY: Math.round(a.carY),
      simZ: Math.max(17, Math.round(a.carZ)),
    });
    triggerDemolishShockwaveSim();
  };

  const handleSnapFromBall = () => {
    const a = getDemolishLiveAnchors();
    setDemolishShockwaveConfig({
      simAnchorMode: 'custom-xyz',
      simX: Math.round(a.ballX),
      simY: Math.round(a.ballY),
      simZ: Math.max(40, Math.round(a.ballZ)),
    });
    triggerDemolishShockwaveSim();
  };

  const handleFrameStep = (deltaFrames: number) => {
    const nextFrame = Math.max(
      0,
      Math.min(frame.totalFrames120, frame.frameIndex120 + deltaFrames)
    );
    scrubDemolishShockwaveSim(nextFrame / frame.totalFrames120, false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-[11px]">
              Playback & 120 FPS Timeline Scrubber
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] ${mutedText}`}>Duration (s):</span>
            <input
              type="number"
              step={0.1}
              min={0.2}
              max={5.0}
              value={config.duration}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (Number.isFinite(val) && val >= 0.2) {
                  setDemolishShockwaveConfig({ duration: Math.min(5.0, val) });
                }
              }}
              className={`w-14 px-1.5 py-0.5 rounded border text-[11px] font-mono text-right ${inputCls}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => triggerDemolishShockwaveSim()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg font-semibold text-[11px] bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Play / Trigger 3D</span>
          </button>
          <button
            type="button"
            onClick={() =>
              sim.isPlaying
                ? stopDemolishShockwaveSim(false)
                : scrubDemolishShockwaveSim(sim.normT >= 0.999 ? 0 : sim.normT, true)
            }
            className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg font-medium text-[11px] border border-neutral-600/60 hover:bg-neutral-700/40 transition-colors cursor-pointer"
          >
            <Pause className="h-3.5 w-3.5" />
            <span>{sim.isPlaying ? 'Pause' : 'Resume'}</span>
          </button>
          <button
            type="button"
            onClick={() => stopDemolishShockwaveSim(true)}
            title="Clear 3D Arena Preview"
            className="flex items-center gap-1 py-1.5 px-2 rounded-lg font-medium text-[11px] border border-neutral-600/60 hover:bg-neutral-700/40 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear 3D</span>
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className={mutedText}>Frame Scrubber (120 FPS):</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleFrameStep(-1)}
                className="px-1.5 py-0.5 rounded border border-neutral-700 text-[10px] font-mono hover:bg-neutral-700/40 cursor-pointer"
              >
                -1F
              </button>
              <span className="font-mono font-bold text-emerald-400">
                F: {frame.frameIndex120}/{frame.totalFrames120} ({frame.elapsedSec.toFixed(3)}s)
              </span>
              <button
                type="button"
                onClick={() => handleFrameStep(1)}
                className="px-1.5 py-0.5 rounded border border-neutral-700 text-[10px] font-mono hover:bg-neutral-700/40 cursor-pointer"
              >
                +1F
              </button>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={frame.totalFrames120}
            value={frame.frameIndex120}
            onChange={(e) => {
              const f = parseInt(e.target.value, 10) || 0;
              scrubDemolishShockwaveSim(f / frame.totalFrames120, false);
            }}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        <div className="relative h-36 rounded-lg bg-[#0a0e17] border border-neutral-800 overflow-hidden flex items-center justify-center">
          <div
            style={{
              width: `${previewPx}px`,
              height: `${previewPx}px`,
              borderRadius: '50%',
              backgroundColor: frame.cssRgb,
              opacity: frame.opacity,
              WebkitMaskImage: maskImage,
              maskImage,
              boxShadow,
            }}
          />
          <div className="absolute top-1.5 left-2 flex flex-col text-[10px] font-mono text-neutral-300 bg-black/55 px-1.5 py-0.5 rounded">
            <span>Outer: {Math.round(frame.worldDiameterUu)} UU</span>
            <span>Hole: {frame.innerHolePct.toFixed(1)}%</span>
          </div>
          <div className="absolute top-1.5 right-2 flex flex-col items-end text-[10px] font-mono text-neutral-300 bg-black/55 px-1.5 py-0.5 rounded">
            <span>Alpha: {(frame.opacity * 100).toFixed(0)}%</span>
            <span>Glow: {frame.glowFactor.toFixed(2)}</span>
          </div>
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span>2D Ring Stage + Synced 3D Arena Preview</span>
            <span className="text-amber-400">
              3D Pos: ({resolvedUu.x}, {resolvedUu.y}, {resolvedUu.z}) UU
            </span>
          </div>
        </div>
      </div>

      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Crosshair className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span className="font-semibold text-[11px]">
              3D Arena Coordinate Simulation (UU)
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSnapFromCar}
              className="px-1.5 py-0.5 rounded border border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 text-[10px] font-medium cursor-pointer"
            >
              Snap Car XYZ
            </button>
            <button
              type="button"
              onClick={handleSnapFromBall}
              className="px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-[10px] font-medium cursor-pointer"
            >
              Snap Ball XYZ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {ANCHOR_OPTIONS.map((opt) => {
            const active = config.simAnchorMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setDemolishShockwaveConfig({ simAnchorMode: opt.id });
                  triggerDemolishShockwaveSim();
                }}
                className={`py-1 px-1.5 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                  active
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                    : 'border-neutral-700/60 text-neutral-400 hover:bg-neutral-800/50'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <label className="flex flex-col gap-0.5">
            <span className={`text-[10px] ${mutedText}`}>X (Side -4096..4096)</span>
            <input
              type="number"
              step={50}
              value={config.simAnchorMode === 'custom-xyz' ? config.simX : resolvedUu.x}
              onChange={(e) =>
                setDemolishShockwaveConfig({
                  simAnchorMode: 'custom-xyz',
                  simX: Math.max(-4096, Math.min(4096, Number(e.target.value) || 0)),
                })
              }
              className={`w-full px-1.5 py-1 rounded border font-mono text-[11px] ${inputCls}`}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className={`text-[10px] ${mutedText}`}>Y (Depth -5120..5120)</span>
            <input
              type="number"
              step={50}
              value={config.simAnchorMode === 'custom-xyz' ? config.simY : resolvedUu.y}
              onChange={(e) =>
                setDemolishShockwaveConfig({
                  simAnchorMode: 'custom-xyz',
                  simY: Math.max(-5120, Math.min(5120, Number(e.target.value) || 0)),
                })
              }
              className={`w-full px-1.5 py-1 rounded border font-mono text-[11px] ${inputCls}`}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className={`text-[10px] ${mutedText}`}>Z (Height 0..2044)</span>
            <input
              type="number"
              step={15}
              value={config.simAnchorMode === 'custom-xyz' ? config.simZ : resolvedUu.z}
              onChange={(e) =>
                setDemolishShockwaveConfig({
                  simAnchorMode: 'custom-xyz',
                  simZ: Math.max(0, Math.min(2044, Number(e.target.value) || 0)),
                })
              }
              className={`w-full px-1.5 py-1 rounded border font-mono text-[11px] ${inputCls}`}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-1">
          {COORD_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() =>
                triggerDemolishShockwaveSim({ x: preset.x, y: preset.y, z: preset.z })
              }
              className="px-1.5 py-0.5 rounded border border-neutral-700/70 hover:border-amber-500/50 hover:text-amber-300 text-[10px] font-mono transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-800/80">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px]">Auto-Loop</span>
            <ToggleSwitch
              checked={config.simAutoLoop}
              onChange={(val) => {
                setDemolishShockwaveConfig({ simAutoLoop: val });
                if (val && !sim.isPlaying) {
                  triggerDemolishShockwaveSim();
                }
              }}
              isLight={isLight}
            />
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px]">3D Reticle</span>
            <ToggleSwitch
              checked={config.simShowReticle}
              onChange={(val) => setDemolishShockwaveConfig({ simShowReticle: val })}
              isLight={isLight}
            />
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px]">Hide Car</span>
            <ToggleSwitch
              checked={config.simHideTargetCar}
              onChange={(val) => setDemolishShockwaveConfig({ simHideTargetCar: val })}
              isLight={isLight}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
