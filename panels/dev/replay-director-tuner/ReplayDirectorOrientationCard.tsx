import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  Play,
  Pause,
  FastForward,
  Download,
  Copy,
  Crosshair,
  Upload,
} from 'lucide-react';
import {
  REPLAY_DIRECTOR_CONFIG,
  getActiveReplayTimelineController,
  subscribeActiveReplayTimelineController,
  exportActiveReplayDirectorDiagnosticPattern,
  importActiveReplayDirectorDiagnosticPattern,
  buildActiveReplayDirectorWindowDiagnostic,
  startActiveReplayDirectorPreview,
  exitActiveReplayDirectorPreview,
  setActiveReplayDirectorCsvCameraMode,
  enterActiveReplayDirectorReferenceFreeCam,
  exitActiveReplayDirectorReferenceFreeCam,
  getActiveReplayDirectorLiveCameraState,
  exportActiveReplayDirectorReferenceKeyframe,
} from '../../../config/replayDirectorConfig.js';
import { useHudStore } from '../../../stores/hudStore';
import { useAppStore } from '../../../stores/appStore';
import { useSubsystemIsolationLabStore } from '../../../stores/subsystemIsolationLabStore';
import { Badge } from '../../../primitives/Badge';
import { Button } from '../../../primitives/Button';
import { ReplayDirectorSnapshotAndKeyframePanel } from './ReplayDirectorSnapshotAndKeyframePanel';

export interface ReplayDirectorOrientationCardProps {
  isLight?: boolean;
}

export const ReplayDirectorOrientationCard: React.FC<ReplayDirectorOrientationCardProps> = ({
  isLight = false,
}) => {
  const [copiedWindowSnap, setCopiedWindowSnap] = useState(false);
  const [copiedRefKeyframe, setCopiedRefKeyframe] = useState(false);
  const [exportedFileMsg, setExportedFileMsg] = useState<string | null>(null);
  const [, setTickRevision] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isFreeCam = useAppStore((s) => s.isFreeCam);
  const freeCamFov = useAppStore((s) => s.freeCamFov);
  const setFreeCamFov = useAppStore((s) => s.setFreeCamFov);

  const matchPhase = useHudStore((s) => s.matchPhase);
  const replayProgress = useHudStore((s) => s.replayProgress);
  const replayFrameIndex = useHudStore((s) => s.replayFrameIndex);
  const replayTotalFrames = useHudStore((s) => s.replayTotalFrames);
  const replayPaused = useHudStore((s) => s.replayPaused);
  const replayPersistent = useHudStore((s) => s.replayPersistent);
  const replaySpeed = useHudStore((s) => s.replaySpeed);
  const replayCameraMode = useHudStore((s) => s.replayCameraMode);
  const replayScorerName = useHudStore((s) => s.replayScorerName);
  const replayScorerTeam = useHudStore((s) => s.replayScorerTeam);
  const replayBallSpeedKph = useHudStore((s) => s.replayBallSpeedKph);
  const replayAssistName = useHudStore((s) => s.replayAssistName);
  const onReplaySeekNormalized = useHudStore((s) => s.onReplaySeekNormalized);
  const onReplayTogglePause = useHudStore((s) => s.onReplayTogglePause);
  const onReplayCycleSpeed = useHudStore((s) => s.onReplayCycleSpeed);
  const onReplayToggleCameraMode = useHudStore((s) => s.onReplayToggleCameraMode);

  const devGoalReplayPhase = useSubsystemIsolationLabStore((s) => s.goalReplayPhase);
  const devGoalReplayCursor = useSubsystemIsolationLabStore((s) => s.goalReplayPlaybackCursor);
  const devGoalReplayTotal = useSubsystemIsolationLabStore((s) => s.goalReplayPlaybackTotal);
  const devGoalReplayPaused = useSubsystemIsolationLabStore((s) => s.goalReplayPaused);
  const devGoalReplaySpeed = useSubsystemIsolationLabStore((s) => s.goalReplaySpeed);
  const devRuntimeHandlers = useSubsystemIsolationLabStore((s) => s.runtimeHandlers);

  useEffect(() => {
    const unsubCtrl = subscribeActiveReplayTimelineController(() => {
      setTickRevision((r) => r + 1);
    });
    const interval = setInterval(() => {
      const ctrl = getActiveReplayTimelineController();
      if ((ctrl && ctrl.isActive) || useAppStore.getState().isFreeCam) {
        setTickRevision((r) => r + 1);
      }
    }, 100);
    return () => {
      unsubCtrl();
      clearInterval(interval);
    };
  }, []);

  const activeCtrl = getActiveReplayTimelineController();
  const isDevLabReplaying = devGoalReplayPhase === 'replaying';
  const isHudGoalReplay = matchPhase === 'replay';
  const isGoalReplayActive = Boolean(
    (activeCtrl && activeCtrl.isActive) || isHudGoalReplay || isDevLabReplaying
  );
  const hasRetainedReplay = Boolean(
    activeCtrl && ((activeCtrl.ActiveWindowCount ?? 0) > 0 || activeCtrl.hasRetainedReplay)
  );
  const isImportedPreview = Boolean(activeCtrl?.isImportedPreview);
  const canExportReplay = Boolean(isGoalReplayActive || hasRetainedReplay);
  const isPausePlayScrubActive = Boolean(
    isGoalReplayActive &&
      (activeCtrl?.isPersistent ||
        activeCtrl?.isPaused ||
        activeCtrl?.isScrubbing ||
        replayPersistent ||
        replayPaused ||
        devGoalReplayPaused)
  );

  const liveSnapshot =
    activeCtrl && (activeCtrl.isActive || hasRetainedReplay)
      ? activeCtrl.getCurrentFrameDiagnosticSnapshot()
      : null;
  const liveCameraState = canExportReplay ? getActiveReplayDirectorLiveCameraState() : null;

  const effectiveFrameIdx =
    liveSnapshot?.replayFrameIndex ??
    (isDevLabReplaying ? devGoalReplayCursor : replayFrameIndex) ??
    0;
  const effectiveTotalFrames =
    liveSnapshot?.totalReplayFrames ??
    (isDevLabReplaying ? devGoalReplayTotal : replayTotalFrames) ??
    1;
  const effectiveFrameId = liveSnapshot?.frameId ?? effectiveFrameIdx;
  const effectivePaused =
    activeCtrl?.isPaused ?? (isDevLabReplaying ? devGoalReplayPaused : replayPaused);
  const effectiveSpeed =
    activeCtrl?.playbackSpeed ?? (isDevLabReplaying ? devGoalReplaySpeed : replaySpeed) ?? 1.0;
  const effectiveProgress01 =
    effectiveTotalFrames > 1
      ? Math.max(0, Math.min(1, effectiveFrameIdx / (effectiveTotalFrames - 1)))
      : replayProgress || 0;

  const handleTogglePauseScrub = () => {
    if (isDevLabReplaying && devRuntimeHandlers.onGoalReplayTogglePause) {
      devRuntimeHandlers.onGoalReplayTogglePause();
    } else if (isGoalReplayActive && onReplayTogglePause) {
      onReplayTogglePause();
    } else if (activeCtrl && activeCtrl.isActive) {
      activeCtrl.togglePause();
    }
    setTickRevision((r) => r + 1);
  };

  const handleCycleSpeed = () => {
    if (isDevLabReplaying && devRuntimeHandlers.onGoalReplayCycleSpeed) {
      devRuntimeHandlers.onGoalReplayCycleSpeed();
    } else if (isGoalReplayActive && onReplayCycleSpeed) {
      onReplayCycleSpeed();
    } else if (activeCtrl && activeCtrl.isActive) {
      activeCtrl.cyclePlaybackSpeed();
    }
    setTickRevision((r) => r + 1);
  };

  const handleScrubNormalized = (norm01: number) => {
    if (isDevLabReplaying && devRuntimeHandlers.onGoalReplaySeekNormalized) {
      devRuntimeHandlers.onGoalReplaySeekNormalized(norm01);
    } else if (isGoalReplayActive && onReplaySeekNormalized) {
      onReplaySeekNormalized(norm01);
    } else if (activeCtrl && (activeCtrl.isActive || hasRetainedReplay)) {
      activeCtrl.seekToNormalized(norm01);
    }
    setTickRevision((r) => r + 1);
  };

  const handleSeekToFrameIndex = (targetIdx: number) => {
    const total = Math.max(2, effectiveTotalFrames);
    const norm01 = Math.max(0, Math.min(1, targetIdx / (total - 1)));
    handleScrubNormalized(norm01);
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = await importActiveReplayDirectorDiagnosticPattern(file, {
        fileName: file.name,
        autoStartPreview: true,
        useRecordedCsvCamera: false,
      });
      if (parsed) {
        setExportedFileMsg(
          `Imported ${file.name} (${parsed.activeFrames?.length || 0} frames) - 3D Preview active`
        );
      } else {
        setExportedFileMsg(`Failed to parse ${file.name}: invalid .rcgr.gz / CSV / JSON`);
      }
      setTimeout(() => setExportedFileMsg(null), 4000);
      setTickRevision((r) => r + 1);
    } catch (err) {
      console.warn('[ReplayDirectorTuner] Failed to read imported replay file:', err);
    }
  };

  const handleStartPreview = () => {
    const ok = startActiveReplayDirectorPreview({ loop: true, startPaused: false });
    if (ok) {
      setExportedFileMsg('Started 3D Arena Replay Preview (looping)');
      setTimeout(() => setExportedFileMsg(null), 2800);
    }
    setTickRevision((r) => r + 1);
  };

  const handleExitPreview = () => {
    if (isDevLabReplaying && devRuntimeHandlers.onGoalReplayTriggerScenario) {
      devRuntimeHandlers.onGoalReplayTriggerScenario('stop_replay');
    } else {
      exitActiveReplayDirectorPreview();
    }
    setExportedFileMsg('Exited 3D Arena Replay Preview (replay retained)');
    setTimeout(() => setExportedFileMsg(null), 2800);
    setTickRevision((r) => r + 1);
  };

  const handleToggleRecordedCameraMode = () => {
    const next = !liveSnapshot?.useRecordedCsvCamera;
    setActiveReplayDirectorCsvCameraMode(next);
    setTickRevision((r) => r + 1);
  };

  const handleExportContainer = () => {
    if (!canExportReplay) return;
    const res = exportActiveReplayDirectorDiagnosticPattern('rcgr');
    if (res?.filename) {
      setExportedFileMsg(`Exported ${res.filename}`);
      setTimeout(() => setExportedFileMsg(null), 3200);
    }
  };

  const handleCopyWindowDiagnostic = () => {
    if (!canExportReplay || !liveSnapshot) return;
    const windowDiag = buildActiveReplayDirectorWindowDiagnostic(15) || {
      schema: 'RocketCompanion.ReplayDirectorFrameWindowDiagnostic.v1',
      exportedAt: new Date().toISOString(),
      directorConfig: { ...REPLAY_DIRECTOR_CONFIG },
      selectedFrameDiagnostic: liveSnapshot,
    };
    const json = JSON.stringify(windowDiag, null, 2);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(json).catch((err) => {
        console.warn('[ReplayDirectorTuner] Failed to copy window diagnostic JSON to clipboard:', err);
      });
    }
    setCopiedWindowSnap(true);
    setTimeout(() => setCopiedWindowSnap(false), 1800);
  };

  const handleReferenceKeyframeFromHere = () => {
    if (!canExportReplay) return;
    const ok = enterActiveReplayDirectorReferenceFreeCam({ fov: freeCamFov });
    if (ok) {
      setExportedFileMsg(
        `Reference FreeCam initialized from Frame #${effectiveFrameId} — adjust view & FOV, then Export Reference JSON`
      );
      setTimeout(() => setExportedFileMsg(null), 3600);
    }
    setTickRevision((r) => r + 1);
  };

  const handleReturnToDirectorCam = () => {
    exitActiveReplayDirectorReferenceFreeCam();
    setExportedFileMsg(`Returned to Director Camera at Frame #${effectiveFrameId}`);
    setTimeout(() => setExportedFileMsg(null), 2600);
    setTickRevision((r) => r + 1);
  };

  const handleExportReferenceKeyframeFile = () => {
    if (!canExportReplay) return;
    const res = exportActiveReplayDirectorReferenceKeyframe({
      fovDeg: freeCamFov,
      download: true,
    });
    if (res?.filename) {
      setExportedFileMsg(`Exported Reference Keyframe: ${res.filename}`);
      setTimeout(() => setExportedFileMsg(null), 3600);
    }
  };

  const handleCopyReferenceKeyframeJson = () => {
    if (!canExportReplay) return;
    const res = exportActiveReplayDirectorReferenceKeyframe({
      fovDeg: freeCamFov,
      download: false,
    });
    if (res?.content && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(res.content).catch((err) => {
        console.warn('[ReplayDirectorTuner] Failed to copy Reference Keyframe JSON:', err);
      });
      setCopiedRefKeyframe(true);
      setTimeout(() => setCopiedRefKeyframe(false), 1800);
    }
  };

  const peaks = liveSnapshot?.anomalyPeaks || null;

  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
    : 'bg-neutral-850/60 border-neutral-700/60 text-neutral-200';
  const subPanelBg = isLight
    ? 'bg-white border-neutral-200'
    : 'bg-neutral-900/60 border-neutral-800/80';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  return (
    <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".rcgr.gz,.rcreplay.gz,.gz,.rcgr,.rcreplay,.csv,.json,application/gzip,text/csv,application/json"
        onChange={handleImportFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Crosshair className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          <span className="font-semibold text-[11px] truncate">
            Goal Replay Container (.rcgr.gz) &amp; Window Diagnostics
          </span>
        </div>
        <Badge
          variant={
            isImportedPreview && isGoalReplayActive
              ? 'sky'
              : isPausePlayScrubActive || hasRetainedReplay
                ? 'emerald'
                : isGoalReplayActive
                  ? 'amber'
                  : 'neutral'
          }
          size="sm"
          isLight={isLight}
          className="font-mono text-[9.5px] uppercase shrink-0"
        >
          {isImportedPreview && isGoalReplayActive
            ? 'RCGR PREVIEW ACTIVE'
            : isImportedPreview
              ? 'RCGR LOADED · READY'
              : isPausePlayScrubActive
                ? 'GOAL REPLAY PAUSED [P]'
                : isGoalReplayActive
                  ? 'GOAL REPLAY LIVE [P]'
                  : hasRetainedReplay
                    ? 'LAST REPLAY · EXPORT READY'
                    : 'IMPORT .RCGR.GZ OR SCORE'}
        </Badge>
      </div>

      {/* Relocated Goal Replay Pause & Playback Indicator Banner inside Replay Director Tuner */}
      <div
        data-testid="replay-director-pause-indicator"
        className={`px-2.5 py-1.5 rounded-lg border flex flex-col gap-1 font-mono text-[10px] ${
          isGoalReplayActive
            ? effectivePaused
              ? 'bg-amber-500/15 border-amber-500/45 text-amber-200'
              : 'bg-emerald-500/12 border-emerald-500/35 text-emerald-200'
            : subPanelBg
        }`}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                isGoalReplayActive
                  ? effectivePaused
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                    : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-neutral-500'
              }`}
            />
            <span className="font-extrabold tracking-wider uppercase text-[10px]">
              {isGoalReplayActive
                ? effectivePaused
                  ? 'GOAL REPLAY PAUSED'
                  : 'GOAL REPLAY LIVE'
                : 'GOAL REPLAY PAUSE [P] READY'}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              disabled={!isGoalReplayActive}
              onClick={handleTogglePauseScrub}
              className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 ${
                isGoalReplayActive
                  ? 'border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 cursor-pointer'
                  : 'border-neutral-800 bg-neutral-900/50 text-neutral-500 opacity-60 cursor-not-allowed'
              }`}
            >
              {effectivePaused ? (
                <Play className="h-2.5 w-2.5 text-emerald-400" />
              ) : (
                <Pause className="h-2.5 w-2.5 text-amber-400" />
              )}
              <span>{effectivePaused ? '[P] Play' : '[P] Pause'}</span>
            </button>

            {onReplayToggleCameraMode && (
              <button
                type="button"
                disabled={!isGoalReplayActive}
                onClick={() => onReplayToggleCameraMode?.()}
                className={`px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${
                  isGoalReplayActive
                    ? 'border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-amber-300 cursor-pointer'
                    : 'border-neutral-800 bg-neutral-900/50 text-neutral-500 opacity-60 cursor-not-allowed'
                }`}
              >
                Cam: {replayCameraMode === 'director' ? 'Director' : 'POV'}
              </button>
            )}

            <button
              type="button"
              disabled={!isGoalReplayActive}
              onClick={handleCycleSpeed}
              className={`px-1.5 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 ${
                isGoalReplayActive
                  ? 'border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-sky-300 cursor-pointer'
                  : 'border-neutral-800 bg-neutral-900/50 text-neutral-500 opacity-60 cursor-not-allowed'
              }`}
            >
              <FastForward className="h-2.5 w-2.5" />
              <span>{effectiveSpeed}x</span>
            </button>
          </div>
        </div>

        {(replayScorerName || typeof replayBallSpeedKph === 'number') && isGoalReplayActive && (
          <div className="flex items-center gap-2 flex-wrap text-[9.5px] pt-0.5 border-t border-neutral-700/40">
            {replayScorerName && (
              <span>
                Scorer:{' '}
                <b
                  className={
                    replayScorerTeam === 0
                      ? 'text-sky-400'
                      : replayScorerTeam === 1
                        ? 'text-amber-400'
                        : ''
                  }
                >
                  {replayScorerName}
                </b>
              </span>
            )}
            {typeof replayBallSpeedKph === 'number' && (
              <span>
                Speed: <b className="text-emerald-400">{replayBallSpeedKph} KM/H</b>
              </span>
            )}
            {replayAssistName && (
              <span>
                Assist: <b>{replayAssistName}</b>
              </span>
            )}
          </div>
        )}
      </div>

      {canExportReplay ? (
        <ReplayDirectorSnapshotAndKeyframePanel
          liveSnapshot={liveSnapshot}
          liveCameraState={liveCameraState}
          peaks={peaks}
          isGoalReplayActive={isGoalReplayActive}
          hasRetainedReplay={hasRetainedReplay}
          isImportedPreview={isImportedPreview}
          effectiveFrameId={effectiveFrameId}
          effectiveFrameIdx={effectiveFrameIdx}
          effectiveTotalFrames={effectiveTotalFrames}
          effectivePaused={effectivePaused}
          effectiveSpeed={effectiveSpeed}
          effectiveProgress01={effectiveProgress01}
          isFreeCam={isFreeCam}
          freeCamFov={freeCamFov}
          canExportReplay={canExportReplay}
          copiedRefKeyframe={copiedRefKeyframe}
          isLight={isLight}
          setFreeCamFov={setFreeCamFov}
          handleSeekToFrameIndex={handleSeekToFrameIndex}
          handleToggleRecordedCameraMode={handleToggleRecordedCameraMode}
          handleTogglePauseScrub={handleTogglePauseScrub}
          handleCycleSpeed={handleCycleSpeed}
          handleExitPreview={handleExitPreview}
          handleStartPreview={handleStartPreview}
          handleScrubNormalized={handleScrubNormalized}
          handleReferenceKeyframeFromHere={handleReferenceKeyframeFromHere}
          handleReturnToDirectorCam={handleReturnToDirectorCam}
          handleExportReferenceKeyframeFile={handleExportReferenceKeyframeFile}
          handleCopyReferenceKeyframeJson={handleCopyReferenceKeyframeJson}
        />
      ) : (
        <p className={`text-[10px] leading-snug ${mutedText}`}>
          Import any <b>.rcgr.gz</b> Goal Replay container (or legacy CSV/JSON) to immediately
          preview all cars, orientations, name tags, and camera paths in the 3D Arena, or score a
          Goal Replay to export.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            isLight={isLight}
            className="gap-1 px-2.5 py-1 text-[10px] font-bold"
            title="Import a .rcgr.gz (or .rcreplay.gz / .csv / .json) Goal Replay file to preview and scrub in the 3D Arena"
          >
            <Upload className="h-3 w-3 shrink-0" />
            <span>Import .rcgr.gz</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            disabled={!canExportReplay}
            onClick={handleExportContainer}
            isLight={isLight}
            className="gap-1 px-2.5 py-1 text-[10px] font-bold"
            title={
              canExportReplay
                ? 'Export Gzip-compressed .rcgr.gz containing full 8-car 448-float physics, orientations, name tags, directorConfig, and camera trajectory'
                : 'Available once a Goal Replay is active or imported'
            }
          >
            <Download className="h-3 w-3 text-emerald-400 shrink-0" />
            <span>Export .rcgr.gz</span>
          </Button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          disabled={!canExportReplay || !liveSnapshot}
          onClick={handleCopyWindowDiagnostic}
          isLight={isLight}
          className="gap-1 px-2 py-1 text-[10px]"
          title="Copy self-contained 31-frame window diagnostic (#id ±15 frames) + directorConfig + anomalyPeaks + touchTimeline to clipboard"
        >
          {copiedWindowSnap ? (
            <>
              <Check className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>Copied Window #{effectiveFrameId} ±15f!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 text-amber-400 shrink-0" />
              <span>Copy Window (#{effectiveFrameId} ±15f)</span>
            </>
          )}
        </Button>
      </div>

      {exportedFileMsg && (
        <div className="text-[10px] font-mono text-emerald-400 px-1 truncate">
          <Check className="h-3 w-3 inline mr-1" /> {exportedFileMsg}
        </div>
      )}
    </div>
  );
};
