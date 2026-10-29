import React, { useState } from 'react';
import {
  Play,
  Pause,
  FastForward,
  Upload,
  Download,
  Copy,
  Camera,
  Crosshair,
  LogOut,
  Zap,
} from 'lucide-react';
import { SliderControl } from '../../../primitives/SliderControl';
import { Badge } from '../../../primitives/Badge';
import { quickNotification } from '../../../tokens/quickNotificationStore';

export interface AnomalyPeakChip {
  id: string;
  frame: number;
  label: string;
  deltaDeg: number;
}

export interface ReplayDirectorKeyframeInspectorProps {
  isLight?: boolean;
}

const ANOMALY_PEAK_CHIPS: AnomalyPeakChip[] = [
  { id: 'peak-1', frame: 184, label: 'Kickoff Pinch Spike', deltaDeg: 14.2 },
  { id: 'peak-2', frame: 412, label: 'Backboard Double-Touch', deltaDeg: 21.8 },
  { id: 'peak-3', frame: 668, label: 'Goal Line Impulse', deltaDeg: 9.6 },
];

/**
 * [L2 Compound] ReplayDirectorKeyframeInspector
 * Recreates RocketCompanion's ReplayDirectorOrientationCard:
 * - .rcgr.gz & Director Pattern CSV import/export
 * - 3D Arena Preview transport (Play/Pause/Scrub/Speed/Exit)
 * - Anomaly Peak Seek Chips (±15f window diagnostic)
 * - "Reference Keyframe from Here" FreeCam orientation & FOV capture
 */
export const ReplayDirectorKeyframeInspector: React.FC<ReplayDirectorKeyframeInspectorProps> = React.memo(({
  isLight = false,
}) => {
  const [isPreviewActive, setIsPreviewActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [cursorFrame, setCursorFrame] = useState(412);
  const totalFrames = 780;
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [csvCameraMode, setCsvCameraMode] = useState<'director-live' | 'recorded-csv' | 'freecam-ref'>('director-live');
  const [freeCamFov, setFreeCamFov] = useState(98);
  const [windowHalfSpan, setWindowHalfSpan] = useState(15);

  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
    : 'bg-neutral-900/60 border-neutral-800 text-neutral-200';
  const subBg = isLight
    ? 'bg-white border-neutral-200'
    : 'bg-neutral-950/75 border-neutral-800';

  const cycleSpeed = () => {
    const speeds = [0.25, 0.5, 1.0, 2.0];
    const next = speeds[(speeds.indexOf(speedMultiplier) + 1) % speeds.length];
    setSpeedMultiplier(next);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* 1. .rcgr.gz / CSV Pattern Container Import & 3D Arena Preview Transport */}
      <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-bold text-[11px]">
              .rcgr.gz Goal Replay Container &amp; 3D Arena Preview
            </span>
            <Badge variant={isPreviewActive ? 'success' : 'neutral'} size="sm" isLight={isLight}>
              {isPreviewActive ? `FRAME ${cursorFrame}/${totalFrames}` : 'IDLE'}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setIsPreviewActive(true);
                quickNotification.success('Loaded goal_replay_sample.rcgr.gz (780 frames).');
              }}
              data-footer-desc="Import a compressed .rcgr.gz Goal Replay container or Director Pattern CSV into the 3D Arena."
              className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-semibold flex items-center gap-1 cursor-pointer ${subBg}`}
            >
              <Upload className="h-3 w-3 text-sky-400" />
              <span>Import .rcgr.gz / CSV</span>
            </button>

            <button
              type="button"
              onClick={() =>
                quickNotification.info('Exported calibrated .rcgr.gz container & director trace.')
              }
              className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-semibold flex items-center gap-1 cursor-pointer ${subBg}`}
            >
              <Download className="h-3 w-3 text-emerald-400" />
              <span>Export .rcgr.gz</span>
            </button>
          </div>
        </div>

        {/* Transport Bar + Camera Source Switcher */}
        <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${subBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-neutral-950 font-mono font-bold text-[10px] flex items-center gap-1 cursor-pointer"
              >
                {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                type="button"
                onClick={cycleSpeed}
                className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer ${cardBg}`}
              >
                <FastForward className="h-3 w-3 text-sky-400" />
                <span>{speedMultiplier}×</span>
              </button>

              {isPreviewActive && (
                <button
                  type="button"
                  onClick={() => setIsPreviewActive(false)}
                  className="px-2 py-1 rounded-lg border border-rose-500/35 bg-rose-500/10 text-rose-400 text-[10px] font-mono font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Exit Preview</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'director-live', label: 'Live AutoCam' },
                  { id: 'recorded-csv', label: 'CSV Pattern' },
                  { id: 'freecam-ref', label: 'FreeCam Ref' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setCsvCameraMode(mode.id)}
                  className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-semibold cursor-pointer transition-colors ${
                    csvCameraMode === mode.id
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                      : 'border-neutral-300 dark:border-neutral-800 opacity-70'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <SliderControl
            label="Replay Frame Scrubber"
            value={cursorFrame}
            min={0}
            max={totalFrames}
            step={1}
            unit="f"
            editable
            colorScheme="amber"
            onChange={(v) => {
              setIsPaused(true);
              setCursorFrame(v);
            }}
            isLight={isLight}
          />
        </div>

        {/* Anomaly Peak Seek Chips & ±15f Window Diagnostic */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="opacity-70">
              Anomaly Peak Seek Chips (±{windowHalfSpan}f Window Diagnostic):
            </span>
            <button
              type="button"
              onClick={() =>
                quickNotification.info(
                  `Copied ±${windowHalfSpan}f window diagnostic around Frame #${cursorFrame} to clipboard.`
                )
              }
              className="text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Copy className="h-2.5 w-2.5" /> Copy ±{windowHalfSpan}f Window JSON
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {ANOMALY_PEAK_CHIPS.map((peak) => {
              const active = Math.abs(cursorFrame - peak.frame) <= windowHalfSpan;
              return (
                <button
                  key={peak.id}
                  type="button"
                  onClick={() => {
                    setIsPaused(true);
                    setCursorFrame(peak.frame);
                  }}
                  data-footer-desc={`Seek to anomaly peak [${peak.label}] at Frame #${peak.frame} (Angular Δ = ${peak.deltaDeg}°).`}
                  className={`px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 cursor-pointer transition-colors ${
                    active
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold'
                      : subBg
                  }`}
                >
                  <Crosshair className="h-2.5 w-2.5 text-amber-500" />
                  <span>f#{peak.frame}</span>
                  <span className="opacity-75">{peak.label}</span>
                  <span className="text-rose-400">Δ{peak.deltaDeg}°</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Reference Keyframe from Here (FreeCam Guidance Capture) */}
      <div className={`p-3 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-bold text-[11px]">
              Reference Keyframe from Here (FreeCam Capture)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setCsvCameraMode('freecam-ref');
                quickNotification.success(
                  `Captured FreeCam Reference Keyframe at Frame #${cursorFrame} (FOV ${freeCamFov}°).`
                );
              }}
              data-footer-desc="Capture current FreeCam eye position, quaternion orientation, and FOV as a Reference Keyframe."
              className="px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border-emerald-500/35 cursor-pointer"
            >
              Capture Keyframe @ f#{cursorFrame}
            </button>
            <button
              type="button"
              onClick={() =>
                quickNotification.info('Exported standalone Reference Keyframe JSON.')
              }
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono cursor-pointer ${subBg}`}
            >
              Export Keyframe JSON
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <SliderControl
            label="FreeCam Reference FOV"
            value={freeCamFov}
            min={65}
            max={120}
            step={1}
            unit="°"
            editable
            colorScheme="emerald"
            onChange={setFreeCamFov}
            isLight={isLight}
          />
          <SliderControl
            label="Diagnostic Window Half-Span"
            value={windowHalfSpan}
            min={5}
            max={60}
            step={5}
            unit="f"
            editable
            colorScheme="sky"
            onChange={setWindowHalfSpan}
            isLight={isLight}
          />
        </div>
      </div>
    </div>
  );
});

ReplayDirectorKeyframeInspector.displayName = 'ReplayDirectorKeyframeInspector';
