import React from 'react';
import {
  Check,
  Play,
  Pause,
  FastForward,
  Download,
  Copy,
  Eye,
  LogOut,
  Sliders,
  Zap,
  Camera,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '../../../primitives/Badge';
import { Button } from '../../../primitives/Button';
import { SliderControl } from '../../../primitives/SliderControl';

export interface ReplayDirectorSnapshotAndKeyframePanelProps {
  liveSnapshot: any;
  liveCameraState: any;
  peaks: any;
  isGoalReplayActive: boolean;
  hasRetainedReplay: boolean;
  isImportedPreview: boolean;
  effectiveFrameId: number;
  effectiveFrameIdx: number;
  effectiveTotalFrames: number;
  effectivePaused: boolean;
  effectiveSpeed: number;
  effectiveProgress01: number;
  isFreeCam: boolean;
  freeCamFov: number;
  canExportReplay: boolean;
  copiedRefKeyframe: boolean;
  isLight: boolean;
  setFreeCamFov: (fov: number) => void;
  handleSeekToFrameIndex: (targetIdx: number) => void;
  handleToggleRecordedCameraMode: () => void;
  handleTogglePauseScrub: () => void;
  handleCycleSpeed: () => void;
  handleExitPreview: () => void;
  handleStartPreview: () => void;
  handleScrubNormalized: (norm01: number) => void;
  handleReferenceKeyframeFromHere: () => void;
  handleReturnToDirectorCam: () => void;
  handleExportReferenceKeyframeFile: () => void;
  handleCopyReferenceKeyframeJson: () => void;
}

export const ReplayDirectorSnapshotAndKeyframePanel: React.FC<
  ReplayDirectorSnapshotAndKeyframePanelProps
> = ({
  liveSnapshot,
  liveCameraState,
  peaks,
  isGoalReplayActive,
  hasRetainedReplay,
  isImportedPreview,
  effectiveFrameId,
  effectiveFrameIdx,
  effectiveTotalFrames,
  effectivePaused,
  effectiveSpeed,
  effectiveProgress01,
  isFreeCam,
  freeCamFov,
  canExportReplay,
  copiedRefKeyframe,
  isLight,
  setFreeCamFov,
  handleSeekToFrameIndex,
  handleToggleRecordedCameraMode,
  handleTogglePauseScrub,
  handleCycleSpeed,
  handleExitPreview,
  handleStartPreview,
  handleScrubNormalized,
  handleReferenceKeyframeFromHere,
  handleReturnToDirectorCam,
  handleExportReferenceKeyframeFile,
  handleCopyReferenceKeyframeJson,
}) => {
  const subPanelBg = isLight
    ? 'bg-white border-neutral-200'
    : 'bg-neutral-900/60 border-neutral-800/80';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  return (
    <div className={`p-2 rounded-lg border flex flex-col gap-1.5 font-mono text-[10px] ${subPanelBg}`}>
      {(liveSnapshot?.importedFileName || peaks) && (
        <div className="flex items-center justify-between gap-1.5 flex-wrap pb-1 border-b border-neutral-700/40 text-[9.5px]">
          <span
            className="truncate text-sky-300"
            title={liveSnapshot?.importedFileName || 'Live Goal Replay'}
          >
            Source: <b>{liveSnapshot?.importedFileName || 'Live Goal Replay'}</b>
          </span>
          {peaks && (
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => handleSeekToFrameIndex(peaks.maxEyeStep?.replayFrameIndex ?? 0)}
                title={`Click to seek to Peak Eye Step frame #${peaks.maxEyeStep?.frameId} (idx ${peaks.maxEyeStep?.replayFrameIndex})`}
                className="px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 cursor-pointer flex items-center gap-0.5"
              >
                <Zap className="h-2.5 w-2.5" />
                <span>
                  MaxStep #{peaks.maxEyeStep?.frameId} ({peaks.maxEyeStep?.valueUu}u)
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleSeekToFrameIndex(peaks.maxYawStep?.replayFrameIndex ?? 0)}
                title={`Click to seek to Peak Yaw Step frame #${peaks.maxYawStep?.frameId} (idx ${peaks.maxYawStep?.replayFrameIndex})`}
                className="px-1.5 py-0.5 rounded border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 cursor-pointer"
              >
                MaxYaw #{peaks.maxYawStep?.frameId} ({peaks.maxYawStep?.valueDeg}°)
              </button>
              <button
                type="button"
                onClick={() => handleSeekToFrameIndex(peaks.maxEyeAccel?.replayFrameIndex ?? 0)}
                title={`Click to seek to Peak Eye Jerk/Accel frame #${peaks.maxEyeAccel?.frameId} (idx ${peaks.maxEyeAccel?.replayFrameIndex})`}
                className="px-1.5 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 cursor-pointer"
              >
                MaxJerk #{peaks.maxEyeAccel?.frameId} ({peaks.maxEyeAccel?.valueUu}u)
              </button>
              {typeof liveSnapshot?.importedSummary?.totalYawPathDeg === 'number' && (
                <span
                  title={`Total cumulative yaw rotation path across replay (< 360° budget). Net yaw span: ${liveSnapshot?.importedSummary?.netYawSpanDeg ?? 0}°`}
                  className="px-1.5 py-0.5 rounded border border-violet-500/40 bg-violet-500/10 text-violet-300"
                >
                  TotalYaw {liveSnapshot.importedSummary.totalYawPathDeg}°
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span>
          {!isGoalReplayActive && hasRetainedReplay ? (
            <b className="text-emerald-400 mr-1">
              {isImportedPreview ? '[Imported]' : '[Last Replay]'}
            </b>
          ) : null}
          Frame ID: <b className="text-amber-400">#{effectiveFrameId}</b> · Idx:{' '}
          <b className="text-sky-400">
            {effectiveFrameIdx}/{Math.max(1, effectiveTotalFrames - 1)}
          </b>{' '}
          ({(effectiveFrameIdx / 120).toFixed(2)}s)
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {liveSnapshot?.hasRecordedCsvCamera && (
            <button
              type="button"
              onClick={handleToggleRecordedCameraMode}
              title="Toggle between exact recorded camera trajectory and live counterfactual tuner simulation"
              className={`px-1.5 py-0.5 rounded border text-[9.5px] font-bold flex items-center gap-1 cursor-pointer ${
                liveSnapshot.useRecordedCsvCamera
                  ? 'border-sky-500/60 bg-sky-500/15 text-sky-300'
                  : 'border-amber-500/60 bg-amber-500/15 text-amber-300'
              }`}
            >
              <Sliders className="h-2.5 w-2.5" />
              <span>{liveSnapshot.useRecordedCsvCamera ? 'Recorded Cam' : 'Live Tuner'}</span>
            </button>
          )}

          {isGoalReplayActive ? (
            <>
              <button
                type="button"
                onClick={handleTogglePauseScrub}
                className="px-2 py-0.5 rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {effectivePaused ? (
                  <Play className="h-2.5 w-2.5 text-emerald-400" />
                ) : (
                  <Pause className="h-2.5 w-2.5 text-amber-400" />
                )}
                <span>{effectivePaused ? '[P] Play' : '[P] Pause'}</span>
              </button>
              <button
                type="button"
                onClick={handleCycleSpeed}
                className="px-1.5 py-0.5 rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-sky-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <FastForward className="h-2.5 w-2.5" />
                <span>{effectiveSpeed}x</span>
              </button>
              <button
                type="button"
                onClick={handleExitPreview}
                title="Exit 3D Arena Replay Preview and return to live Freeplay"
                className="px-2 py-0.5 rounded border border-rose-500/50 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="h-2.5 w-2.5" />
                <span>Exit Preview</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleStartPreview}
              title="Preview and scrub this Goal Replay in the 3D Arena"
              className="px-2 py-0.5 rounded border border-emerald-500/50 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Eye className="h-2.5 w-2.5" />
              <span>Preview in Arena</span>
            </button>
          )}
        </div>
      </div>

      <div data-testid="replay-timeline-scrubber" className="w-full">
        <SliderControl
          label="SCRUB TIMELINE"
          value={Math.round(effectiveProgress01 * 1000)}
          min={0}
          max={1000}
          step={1}
          unit="‰"
          editable={true}
          showStepper={true}
          colorScheme="amber"
          isLight={isLight}
          onChange={(val) => handleScrubNormalized(val / 1000)}
        />
      </div>

      {liveSnapshot && (
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-0.5 text-[9.5px] border-t border-neutral-700/40">
          <span>
            Cam Eye (UU):{' '}
            <b>
              [{Math.round(liveSnapshot.cameraPose.dampedEyeUnreal[0])},{' '}
              {Math.round(liveSnapshot.cameraPose.dampedEyeUnreal[1])},{' '}
              {Math.round(liveSnapshot.cameraPose.dampedEyeUnreal[2])}]
            </b>
          </span>
          <span>
            LookAt (UU):{' '}
            <b>
              [{Math.round(liveSnapshot.cameraPose.dampedTargetUnreal[0])},{' '}
              {Math.round(liveSnapshot.cameraPose.dampedTargetUnreal[1])},{' '}
              {Math.round(liveSnapshot.cameraPose.dampedTargetUnreal[2])}]
            </b>
          </span>
          <span>
            Yaw / Pitch / Dist:{' '}
            <b className="text-emerald-400">
              {liveSnapshot.cameraPose.yawDeg.toFixed(1)}° /{' '}
              {liveSnapshot.cameraPose.pitchDeg.toFixed(1)}° /{' '}
              {Math.round(liveSnapshot.cameraPose.distanceToTarget)}u
            </b>
          </span>
          <span>
            Ball / Anchors:{' '}
            <b>
              C{liveSnapshot.lookahead.activeTouchCarIndex}
              {liveSnapshot.lookahead.nextTouchCarIndex >= 0
                ? `->C${liveSnapshot.lookahead.nextTouchCarIndex}`
                : ''}
              {(liveSnapshot.lookahead.interceptorCarIndex ?? -1) >= 0
                ? ` +OppC${liveSnapshot.lookahead.interceptorCarIndex}(${Math.round(
                    (liveSnapshot.lookahead.interceptorBlend ?? 0) * 100
                  )}%)`
                : ''}{' '}
              ({liveSnapshot.cars?.length || 1}c)
            </b>
          </span>
          <span>
            View Angle (Car/Ball/Opp):{' '}
            <b className="text-sky-300">
              {(liveSnapshot.cameraPose.carViewAngleDeg ?? 0).toFixed(1)}° /{' '}
              {(liveSnapshot.cameraPose.ballViewAngleDeg ?? 0).toFixed(1)}°
              {typeof liveSnapshot.cameraPose.interceptorViewAngleDeg === 'number'
                ? ` / ${liveSnapshot.cameraPose.interceptorViewAngleDeg.toFixed(1)}°`
                : ''}
            </b>
          </span>
          <span>
            Frame Step (Eye / Yaw):{' '}
            <b className="text-amber-300">
              {(liveSnapshot.cameraPose.eyeStepUu ?? 0).toFixed(1)}u /{' '}
              {(liveSnapshot.cameraPose.yawStepDeg ?? 0).toFixed(2)}°
            </b>
          </span>
        </div>
      )}

      {/* Reference Keyframe from Here (FreeCam Guidance Capture) */}
      <div className="mt-1 pt-1.5 border-t border-neutral-700/50 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Camera className="h-3 w-3 text-amber-400 shrink-0" />
            <span className="font-semibold text-[10px] text-amber-300">
              Reference Keyframe Guidance (Shift+F FreeCam)
            </span>
            {isFreeCam && (
              <Badge variant="amber" size="sm" isLight={isLight} className="text-[9px]">
                FREECAM ACTIVE · FOV {Math.round(freeCamFov)}°
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={handleReferenceKeyframeFromHere}
              title="Pause at this frame, switch into Free Camera (Shift+F), and initialize FreeCam position/aim from the current Director Camera pose"
              className="px-2 py-0.5 rounded border border-amber-500/60 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[9.5px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Camera className="h-2.5 w-2.5" />
              <span>Reference Keyframe from Here</span>
            </button>
            {isFreeCam && (
              <button
                type="button"
                onClick={handleReturnToDirectorCam}
                title="Exit FreeCam and snap back to Director AutoCam at this frame"
                className="px-1.5 py-0.5 rounded border border-sky-500/50 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-[9.5px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                <span>Back to Director Cam</span>
              </button>
            )}
          </div>
        </div>

        {isFreeCam && liveCameraState?.eyeUnreal && (
          <div className="flex flex-col gap-1 pt-0.5">
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px] text-amber-200/90">
              <span>
                Ref Eye (UU):{' '}
                <b>
                  [{Math.round(liveCameraState.eyeUnreal[0])},{' '}
                  {Math.round(liveCameraState.eyeUnreal[1])},{' '}
                  {Math.round(liveCameraState.eyeUnreal[2])}]
                </b>
              </span>
              <span>
                Ref Yaw / Pitch / FOV:{' '}
                <b>
                  {(liveCameraState.yawUnrealDeg ?? 0).toFixed(1)}° /{' '}
                  {(liveCameraState.pitchUnrealDeg ?? 0).toFixed(1)}° /{' '}
                  {Math.round(freeCamFov)}°
                </b>
              </span>
            </div>
            <div className={`text-[9px] ${mutedText}`}>
              Controls: <b>WASD</b> move · <b>I / Space</b> up · <b>M / V</b> down ·{' '}
              <b>Shift</b> boost · <b>Mouse Drag</b> aim · <b>- / =</b> or slider for FOV
            </div>
          </div>
        )}

        <SliderControl
          label={`Reference Camera FOV (${Math.round(freeCamFov)}°)`}
          description="Manual FOV for Reference Keyframe (shortcuts: - / = keys in FreeCam)"
          value={freeCamFov}
          min={30}
          max={130}
          step={1}
          unit="°"
          editable={true}
          showStepper={true}
          colorScheme="amber"
          isLight={isLight}
          onChange={(v) => setFreeCamFov(v)}
        />

        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
          <Button
            variant="secondary"
            size="sm"
            disabled={!canExportReplay}
            onClick={handleExportReferenceKeyframeFile}
            isLight={isLight}
            className="gap-1 px-2 py-0.5 text-[9.5px] font-bold"
            title="Download standalone Reference Keyframe JSON for this frame (includes FreeCam pose, FOV, corridor offsets, inverse ray weights, screen NDC composition, and delta vs AutoCam)"
          >
            <Download className="h-3 w-3 text-amber-400 shrink-0" />
            <span>Export Ref Keyframe (.json)</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            disabled={!canExportReplay}
            onClick={handleCopyReferenceKeyframeJson}
            isLight={isLight}
            className="gap-1 px-2 py-0.5 text-[9.5px]"
            title="Copy standalone Reference Keyframe JSON for this frame to clipboard"
          >
            {copiedRefKeyframe ? (
              <>
                <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                <span>Copied Ref Keyframe #{effectiveFrameId}!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-sky-400 shrink-0" />
                <span>Copy Ref Keyframe JSON</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
