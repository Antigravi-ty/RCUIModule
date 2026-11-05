import React, { useEffect } from 'react';
import { useHudStore } from '../stores/hudStore';
import { useAppStore } from '../stores/appStore';
import { useTelemetryData } from '../stores/perfTelemetryStore';
import { useNetworkDiagnosticsData } from '../stores/networkDiagnosticsStore';
import { useKickoffTrainingStore } from '../stores/kickoffTrainingStore';
import { useReplayViewerStore } from '../stores/replayViewerStore';
import { useRewinderStore } from '../stores/rewinderStore';
import {
  HudAnchorStage,
  HudZone,
  HudSlot,
  HudRelativeAnchor,
} from '../layout/HudAnchorStage';
import { globalHudTransientChannel } from '../stores/hudTransientChannel';
import { StepperScoreboardHUD } from './StepperScoreboardHUD';
import { EdgePlayerHudStrip } from './EdgePlayerHudStrip';
import { BallCameraIndicator } from './BallCameraIndicator';
import { VelocityProgressBar } from './VelocityProgressBar';
import { CircularBoostGauge } from './CircularBoostGauge';
import { CompactTelemetryBarHUD } from './CompactTelemetryBarHUD';
import { FlipIndicatorPillHUD } from './FlipIndicatorPillHUD';
import { TemporalReplayFooterHUD } from './TemporalReplayFooterHUD';
import { DemolishHourglassTimerHUD } from './DemolishHourglassTimerHUD';
import { KickoffRhythmOverlayHUD } from './KickoffRhythmOverlayHUD';
import {
  CenterUpperInfoHUD,
  DEFAULT_RL_COUNTDOWN_GLOW,
  DEFAULT_CENTER_UPPER_TYPOGRAPHY,
  DEFAULT_CENTER_UPPER_TIMING,
} from './CenterUpperInfoHUD';
import {
  TakeoverCountdownHUD,
  DEFAULT_TAKEOVER_GLOW,
  DEFAULT_TAKEOVER_TYPOGRAPHY,
  DEFAULT_TAKEOVER_TIMING,
  DEFAULT_TAKEOVER_LAYOUT,
  type TakeoverTeamSide,
} from './TakeoverCountdownHUD';
import {
  TakeoverVignetteOverlay,
  DEFAULT_TAKEOVER_VIGNETTE,
} from './TakeoverVignetteOverlay';
import {
  useCenterUpperCountdownChoreography,
  useTakeoverPrerollChoreography,
  useReplayPovSlotHotkeys,
} from './useInGameHudChoreography';

export interface InGameHUDProps {
  className?: string;
}

export const InGameHUD: React.FC<InGameHUDProps> = ({ className = '' }) => {
  const kickoffCountdown = useHudStore((s) => s.kickoffCountdown);
  const matchPhase = useHudStore((s) => s.matchPhase);
  const isPaused = useHudStore((s) => s.isPaused);
  const winner = useHudStore((s) => s.winner);
  const isOvertime = useHudStore((s) => s.isOvertime);
  const localTeam = useHudStore((s) => s.localTeam);
  const blueScore = useHudStore((s) => s.blueScore);
  const orangeScore = useHudStore((s) => s.orangeScore);
  const remainingSeconds = useHudStore((s) => s.remainingSeconds);
  const overtimeSeconds = useHudStore((s) => s.overtimeSeconds);
  const choreographySignal = useHudStore((s) => s.choreographySignal);
  const replayScorerName = useHudStore((s) => s.replayScorerName);
  const replayBallSpeedKph = useHudStore((s) => s.replayBallSpeedKph);
  const replayAssistName = useHudStore((s) => s.replayAssistName);
  const replayScorerTeam = useHudStore((s) => s.replayScorerTeam);
  const ballCamActive = useHudStore((s) => s.ballCamActive);
  const ballCamShortcut = useHudStore((s) => s.ballCamShortcut);
  const toggleBallCam = useHudStore((s) => s.toggleBallCam);
  const boostAmount = useHudStore((s) => s.boostAmount);
  const isUnlimited = useHudStore((s) => s.isUnlimited);
  const isDemoed = useHudStore((s) => s.isDemoed);
  const hasFlip = useHudStore((s) => s.hasFlip);
  const flipStatus = useHudStore((s) => s.flipStatus);
  const flipsRemaining = useHudStore((s) => s.flipsRemaining);

  const theme = useAppStore((s) => s.theme);
  const menuOpen = useAppStore((s) => s.isOpen);
  const isLight = theme === 'light';

  const matchMode = useAppStore((s) => s.matchMode);
  const showBallCamIndicator = useAppStore((s) => s.gameplay.ballCamIndicator);
  const telemetry = useAppStore((s) => s.telemetry);
  const telemetryEnabled = Boolean(telemetry?.alwaysShow);
  const pauseTelemetryInPowerSave = telemetry?.pauseTelemetryInPowerSave !== false;
  const menuPowerSave = useAppStore((s) => s.graphics?.menuPowerSave ?? '30');
  const isLivePreviewCollapsed = useAppStore((s) => s.isLivePreviewCollapsed);
  const activeRoute = useAppStore((s) => s.activeRoute);
  const onlineSession = useAppStore((s) => s.onlineSession);
  const renderScale = useAppStore((s) => s.graphics?.renderScale ?? 100);

  const [isWindowMinimized, setIsWindowMinimized] = React.useState<boolean>(() =>
    typeof document !== 'undefined' ? Boolean(document.hidden) : false
  );
  const [isWindowFocused, setIsWindowFocused] = React.useState<boolean>(() =>
    typeof document !== 'undefined'
      ? !document.hidden && (typeof document.hasFocus === 'function' ? document.hasFocus() : true)
      : true
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const syncFocus = () => {
      const minimized = Boolean(document.hidden);
      const focused =
        !minimized && (typeof document.hasFocus === 'function' ? document.hasFocus() : true);
      setIsWindowMinimized(minimized);
      setIsWindowFocused(focused);
    };
    window.addEventListener('blur', syncFocus);
    window.addEventListener('focus', syncFocus);
    document.addEventListener('visibilitychange', syncFocus);
    return () => {
      window.removeEventListener('blur', syncFocus);
      window.removeEventListener('focus', syncFocus);
      document.removeEventListener('visibilitychange', syncFocus);
    };
  }, []);

  const isLivePreviewDockCollapsed =
    Boolean(menuOpen) &&
    Boolean(isLivePreviewCollapsed) &&
    (activeRoute === 'trajectory' || activeRoute === 'camera');
  const isPowerSaveMenuOpen = Boolean(menuOpen) && !isLivePreviewDockCollapsed;
  const isFpsPausedIndicator = isWindowMinimized || isPowerSaveMenuOpen || !isWindowFocused;
  const isPowerSaveModeEnabled = String(menuPowerSave) !== 'match' && String(menuPowerSave) !== 'disable';
  const isPowerSaveActive =
    isWindowMinimized ||
    isFpsPausedIndicator ||
    (isPowerSaveModeEnabled && (isPowerSaveMenuOpen || !isWindowFocused));
  const shouldPollTelemetry =
    telemetryEnabled && !(pauseTelemetryInPowerSave && isPowerSaveActive);

  const kickoffStore = useKickoffTrainingStore();
  const { data: perfSnap } = useTelemetryData(60, shouldPollTelemetry);
  const netSnap = useNetworkDiagnosticsData();

  const hudChannel = globalHudTransientChannel;

  // Layer 5E CenterUpperInfoHUD: Kickoff Countdown (3 -> 2 -> 1 -> GO), Match Paused, and Winner Blue/Orange Team
  const { countdownPayload, handleCountdownExpire } = useCenterUpperCountdownChoreography({
    kickoffCountdown,
    matchPhase,
    isPaused: Boolean(isPaused),
    winner: winner ?? null,
    isOvertime,
    matchMode,
    roomType: onlineSession.roomType,
  });

  // 1. Push telemetry bar updates
  const isOnline =
    onlineSession.signalingConnected || (onlineSession.connectedPeers?.length ?? 0) > 0;
  useEffect(() => {
    if (!shouldPollTelemetry || !perfSnap || (perfSnap.fps <= 0 && perfSnap.frameMs <= 0)) return;
    hudChannel.setTelemetry({
      fps: Math.round(perfSnap.fps || 120),
      refreshHz: Math.round(perfSnap.refreshHz || 120),
      renderScalePct: Math.round(renderScale || 100),
      physicsRateHz: Math.round(perfSnap.sim?.physicsRateHz || 120),
      baseLatencyMs: isOnline ? Math.round(netSnap.metrics?.rttMs || 0) : 0,
      extraLatencyMs: 0,
    });
  }, [
    hudChannel,
    shouldPollTelemetry,
    isOnline,
    renderScale,
    perfSnap,
    netSnap.metrics?.rttMs,
  ]);

  // 2. Demolish state flag (high-frequency remainingSeconds is pushed directly via globalHudTransientChannel)
  const isDemolished = isDemoed;

  const isLobbyPhase =
    matchPhase === 'lobby' ||
    (matchMode === 'online-warmup' && onlineSession.roomType === 'match');

  // 3. Push scoreboard clock & score updates (Series always hidden: bestOf = 0)
  // Flip left/right sides so the local player's own team is always on the LEFT.
  const isOrangeLeft = isLobbyPhase
    ? onlineSession.localTeam === 'orange' ||
      (onlineSession.localTeam !== 'blue' && localTeam === 1)
    : localTeam === 1;
  const leftTeamColor = isOrangeLeft ? '#EA580C' : '#2563EB';
  const leftBarColor = isOrangeLeft ? '#F97316' : '#3B82F6';
  const rightTeamColor = isOrangeLeft ? '#2563EB' : '#EA580C';
  const rightBarColor = isOrangeLeft ? '#3B82F6' : '#F97316';
  const leftScore = isLobbyPhase ? 0 : isOrangeLeft ? orangeScore : blueScore;
  const rightScore = isLobbyPhase ? 0 : isOrangeLeft ? blueScore : orangeScore;

  // Overtime drop-banner only opens when overtime kickoff starts (not during 0s goal celebration/replay)
  const overtimeChinOpen = Boolean(
    isOvertime &&
      !isLobbyPhase &&
      matchPhase !== 'goal' &&
      matchPhase !== 'replay' &&
      matchPhase !== 'podium' &&
      matchPhase !== 'ended'
  );
  const phaseChinOpen = overtimeChinOpen || isLobbyPhase;
  const phaseChinText = overtimeChinOpen ? 'OVERTIME' : isLobbyPhase ? 'LOBBY' : 'OVERTIME';
  const phaseChinColor = overtimeChinOpen ? '#DC2626' : isLobbyPhase ? '#52525B' : undefined;
  const activeClockSec = overtimeChinOpen
    ? overtimeSeconds
    : isLobbyPhase
    ? (onlineSession.matchDurationSeconds ?? remainingSeconds)
    : remainingSeconds;
  useEffect(() => {
    hudChannel.setScoreboard({
      leftScore,
      rightScore,
      seconds: activeClockSec,
      isOvertime: overtimeChinOpen,
      overtimeChinOpen: phaseChinOpen,
      overtimeChinText: phaseChinText,
      overtimeChinColor: phaseChinColor,
      bestOf: 0,
      leftSeriesWins: 0,
      rightSeriesWins: 0,
      seriesResults: [],
    });
  }, [
    hudChannel,
    leftScore,
    rightScore,
    activeClockSec,
    overtimeChinOpen,
    phaseChinOpen,
    phaseChinText,
    phaseChinColor,
  ]);

  // 4. 4-Stage Choreography Signal State Machine + Layer 5G Takeover Preroll State:
  const replayViewerState = useReplayViewerStore((s) => s.viewerState);
  const replayViewerTotalFrames = useReplayViewerStore((s) => s.totalFrames);
  const replayViewerFileName = useReplayViewerStore((s) => s.loadedFileName);
  const replayPrerollSec = useReplayViewerStore((s) => s.prerollRemainingSec);
  const replayDownCounterSec = useReplayViewerStore((s) => s.downCounterSec);
  const activePovTeam = useReplayViewerStore((s) => s.activePovTeam);

  const rewinderState = useRewinderStore((s) => s.rewinderState);
  const rewinderPrerollSec = useRewinderStore((s) => s.rewinderPrerollRemainingSec);
  const rewinderDownCounterSec = useRewinderStore((s) => s.rewinderDownCounterSec);

  const isReplayPreroll = replayViewerState === 'preroll-countdown';
  const isRewinderPreroll = rewinderState === 'preroll-countdown';

  const takeoverTeam: TakeoverTeamSide =
    (isReplayPreroll || replayViewerState === 'intervening' ? activePovTeam : localTeam) === 1
      ? 'orange'
      : 'blue';

  const { isTakeoverPreroll, takeoverPayload, handleTakeoverExpire } =
    useTakeoverPrerollChoreography({
      isReplayPreroll,
      isRewinderPreroll,
      replayPrerollSec,
      rewinderPrerollSec,
      replayDownCounterSec,
      rewinderDownCounterSec,
      takeoverTeam,
    });

  const bottomHudRetracted =
    choreographySignal === 'goal-replay-will-start' ||
    choreographySignal === 'goal-replay-started' ||
    choreographySignal === 'goal-replay-will-end' ||
    matchPhase === 'goal' ||
    matchPhase === 'replay' ||
    isTakeoverPreroll;

  const replayFooterVisible =
    choreographySignal === 'goal-replay-started' && matchPhase === 'replay';

  useEffect(() => {
    if (choreographySignal === 'kickoff-will-start') {
      const skipCfg = hudChannel.getRoster().skipIndicatorConfig;
      if (skipCfg?.autoResetOnKickoff !== false) {
        ([1, 2, 3, 4, 5, 6] as const).forEach((slotKey) => {
          hudChannel.updatePlayerSlot(slotKey, { replaySkipReady: false });
        });
      }
    }
  }, [choreographySignal, hudChannel]);

  useEffect(() => {
    hudChannel.setReplayFooter({
      visible: replayFooterVisible,
      scorerName: replayScorerName || 'SCORER',
      goalSpeed: replayBallSpeedKph ?? 100,
      assisterName: replayAssistName,
      teamAccentColor: replayScorerTeam === 1 ? '#F97316' : '#3B82F6',
    });
  }, [
    hudChannel,
    replayFooterVisible,
    replayScorerName,
    replayBallSpeedKph,
    replayAssistName,
    replayScorerTeam,
  ]);

  // 6. Push kickoff rhythm overlay frame updates
  const showKickoffOverlay =
    matchMode === 'kickoff-training' && kickoffStore.showKeyboardOverlay;
  useEffect(() => {
    if (!showKickoffOverlay) return;
    hudChannel.setKickoffFrame({
      episodeTick: kickoffStore.episodeTick,
      countdownRemainingTicks: kickoffStore.countdownRemainingTicks,
      aiTouchTick: kickoffStore.aiTouchTick,
      playerTouchTick: kickoffStore.playerTouchTick,
      lastDeltaTicks: kickoffStore.lastDeltaTicks,
      requiredKeys: kickoffStore.requiredKeys,
      playerKeys: kickoffStore.playerKeys,
    });
  }, [
    hudChannel,
    showKickoffOverlay,
    kickoffStore.episodeTick,
    kickoffStore.countdownRemainingTicks,
    kickoffStore.aiTouchTick,
    kickoffStore.playerTouchTick,
    kickoffStore.lastDeltaTicks,
    kickoffStore.requiredKeys,
    kickoffStore.playerKeys,
  ]);

  // 7. Handle POV slot selection from EdgePlayerHudStrip in Replay / Spectator / Replay Viewer mode
  // Keys 1-6 select player slots 1-6; Key 7 (null) returns to Director camera view.
  const isReplayViewerActive = Boolean(
    replayViewerFileName &&
      replayViewerTotalFrames > 0 &&
      replayViewerState !== 'idle' &&
      replayViewerState !== 'preroll-countdown' &&
      replayViewerState !== 'intervening'
  );
  const isReplayViewerLoaded = Boolean(
    replayViewerFileName && replayViewerTotalFrames > 0 && replayViewerState !== 'idle'
  );
  const isReplayViewerIntervening = Boolean(
    isReplayViewerLoaded &&
      (replayViewerState === 'preroll-countdown' || replayViewerState === 'intervening')
  );

  const { handleSelectPovSlot } = useReplayPovSlotHotkeys({
    hudChannel,
    matchMode,
    matchPhase,
    isReplayViewerActive,
  });

  const showTopScoreboard =
    matchMode === 'match' ||
    matchMode === 'exp-multi-bots' ||
    (matchMode === 'online-warmup' && onlineSession.roomType === 'match') ||
    isReplayViewerLoaded;

  const showEdgeRosterStrips =
    showTopScoreboard && !isLobbyPhase && matchPhase !== 'podium' && matchPhase !== 'ended';

  return (
    <div
      data-ui-element="in-game-hud-layer"
      className={`absolute inset-0 pointer-events-none select-none z-[5] overflow-hidden ${className}`}
    >
      {/* Layer 5G Takeover Atmospheric Vignette Layer (beneath HudAnchorStage) */}
      <TakeoverVignetteOverlay
        config={DEFAULT_TAKEOVER_VIGNETTE}
        active={isTakeoverPreroll}
      />

      {/* Layer 5A Spatial Choreography Stage */}
      <HudAnchorStage
        strategy="reserve"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        {/* 1. TOP-LEFT ZONE: Compact Telemetry Bar (56px reserved) + Left Team [1-3] Edge Strip */}
        <HudZone anchor="top-left" flush>
          <HudSlot
            visible={telemetryEnabled}
            mode="reserve"
            reservedHeight={56}
            innerClassName="h-[56px] flex items-center pl-3"
          >
            {telemetryEnabled && (
              <CompactTelemetryBarHUD
                isLight={isLight}
                subscribeTelemetry={hudChannel.subscribeTelemetry}
              />
            )}
          </HudSlot>

          {showEdgeRosterStrips && (
            <EdgePlayerHudStrip
              side="left"
              viewMode={isReplayViewerIntervening ? 'player-live' : undefined}
              teamColor={leftTeamColor}
              barColor={leftBarColor}
              isLight={isLight}
              onSelectSlot={handleSelectPovSlot}
              subscribeRoster={hudChannel.subscribeRoster}
            />
          )}
        </HudZone>

        {/* 2. TOP-CENTER ZONE: Stepper Scoreboard (bestOf=0) + Kickoff Rhythm */}
        <HudZone anchor="top-center" flush gap={12} zIndexClassName="z-40">
          {showTopScoreboard && (
            <StepperScoreboardHUD
              isLight={isLight}
              leftScore={leftScore}
              rightScore={rightScore}
              leftTeamColor={leftTeamColor}
              rightTeamColor={rightTeamColor}
              seconds={activeClockSec}
              isOvertime={overtimeChinOpen}
              overtimeChinOpen={phaseChinOpen}
              overtimeChinText={phaseChinText}
              overtimeChinColor={phaseChinColor}
              bestOf={0}
              leftSeriesWins={0}
              rightSeriesWins={0}
              seriesResults={[]}
              subscribeScoreboard={hudChannel.subscribeScoreboard}
            />
          )}

          {showKickoffOverlay && (
            <KickoffRhythmOverlayHUD
              isLight={isLight}
              subMode={kickoffStore.subMode}
              phase={kickoffStore.phase}
              spawnIndex={kickoffStore.spawnIndex}
              onSelectSpawn={(idx) => {
                kickoffStore.setSpawnIndex(idx);
              }}
              showFallingNotes={kickoffStore.showFallingNotes}
              wsVerticalOffsetPct={kickoffStore.wsVerticalOffsetPct}
              episodeTick={kickoffStore.episodeTick}
              countdownRemainingTicks={kickoffStore.countdownRemainingTicks}
              subscribeKickoffFrame={hudChannel.subscribeKickoffFrame}
            />
          )}
        </HudZone>

        {/* 2.5. UPPER-CENTER ZONE: Layer 5E Kickoff Countdown (`3 -> 2 -> 1 -> GO` only) */}
        <HudZone anchor="upper-center" zIndexClassName="z-40">
          <HudSlot visible={true} mode="reserve">
            <CenterUpperInfoHUD
              info={countdownPayload}
              glowConfig={DEFAULT_RL_COUNTDOWN_GLOW}
              typographyConfig={DEFAULT_CENTER_UPPER_TYPOGRAPHY}
              timingConfig={DEFAULT_CENTER_UPPER_TIMING}
              onExpire={handleCountdownExpire}
            />
          </HudSlot>
        </HudZone>

        {/* 3. TOP-RIGHT ZONE: Right Team [4-6] Edge Strip (below 56px top band) */}
        <HudZone anchor="top-right" flush>
          {showEdgeRosterStrips && (
            <div className="pt-[56px]">
              <EdgePlayerHudStrip
                side="right"
                viewMode={isReplayViewerIntervening ? 'player-live' : undefined}
                teamColor={rightTeamColor}
                barColor={rightBarColor}
                isLight={isLight}
                onSelectSlot={handleSelectPovSlot}
                subscribeRoster={hudChannel.subscribeRoster}
              />
            </div>
          )}
        </HudZone>

        {/* 4. BOTTOM-LEFT ZONE: Ball Camera Indicator (exits left on goal-replay-will-start, re-enters on kickoff-will-start) */}
        <HudZone anchor="bottom-left">
          <HudSlot
            visible={showBallCamIndicator && !menuOpen && !bottomHudRetracted}
            mode="reserve"
            exitOffset="translate3d(-140%, 0, 0)"
          >
            <BallCameraIndicator
              active={ballCamActive}
              shortcut={ballCamShortcut}
              subscribeBallCam={hudChannel.subscribeBallCam}
              isLight={isLight}
              onToggle={toggleBallCam}
            />
          </HudSlot>
        </HudZone>

        {/* 5. BOTTOM-CENTER ZONE: Velocity Progress Bar + Flip Indicator Pill + Demolish Hourglass Timer */}
        <HudZone anchor="bottom-center">
          <HudSlot
            visible={!bottomHudRetracted}
            mode="reserve"
            exitOffset="translate3d(0, 220%, 0)"
          >
            <HudRelativeAnchor
              placement="top"
              align="start"
              gap={8}
              floating
              attachment={
                <div className="flex flex-col items-start gap-1.5 bg-transparent pointer-events-none">
                  {isDemolished && (
                    <DemolishHourglassTimerHUD
                      remainingSeconds={hudChannel.getRespawnTimer().remainingSeconds}
                      totalSeconds={3.0}
                      subscribeRespawnTimer={hudChannel.subscribeRespawnTimer}
                      alwaysVisible={false}
                      width={210}
                      height={28}
                      isLight={isLight}
                      className="bg-transparent"
                    />
                  )}
                  <FlipIndicatorPillHUD
                    isLight={isLight}
                    hasFlip={hasFlip}
                    status={flipStatus}
                    remainingSeconds={hudChannel.getFlip().remainingSeconds}
                    maxSeconds={1.25}
                    flipsRemaining={flipsRemaining}
                    subscribeFlip={hudChannel.subscribeFlip}
                  />
                </div>
              }
            >
              <div className="w-[360px] max-w-[42vw]">
                <VelocityProgressBar
                  speed={hudChannel.getSpeed()}
                  subscribeSpeed={hudChannel.subscribeSpeed}
                  width="100%"
                  height={16}
                />
              </div>
            </HudRelativeAnchor>
          </HudSlot>
        </HudZone>

        {/* 6. BOTTOM-RIGHT ZONE: Circular Boost Gauge (exits right on goal-replay-will-start, re-enters on kickoff-will-start) */}
        <HudZone anchor="bottom-right" flush className="pb-4">
          <HudSlot
            visible={!bottomHudRetracted}
            mode="reserve"
            exitOffset="translate3d(140%, 0, 0)"
            innerClassName="pr-5"
          >
            <CircularBoostGauge
              amount={boostAmount}
              isUnlimited={isUnlimited}
              subscribeBoost={hudChannel.subscribeBoost}
              isLight={isLight}
            />
          </HudSlot>
        </HudZone>

        {/* 7. GOAL REPLAY BOTTOM FOOTER: TemporalReplayFooterHUD (enters on goal-replay-started, exits on goal-replay-will-end) */}
        <TemporalReplayFooterHUD
          isLight={isLight}
          subscribeReplayFooter={hudChannel.subscribeReplayFooter}
        />

        {/* 8. BOTTOM-CENTER UPWARD OFFSET: Layer 5G Takeover Countdown Banner */}
        <HudZone
          anchor="bottom-center"
          flush
          zIndexClassName="z-40"
          style={{ bottom: `${DEFAULT_TAKEOVER_LAYOUT.bottomOffsetPx}px` }}
        >
          <HudSlot visible={Boolean(takeoverPayload)} mode="reserve">
            <TakeoverCountdownHUD
              payload={takeoverPayload}
              teamSide={takeoverTeam}
              glowConfig={DEFAULT_TAKEOVER_GLOW}
              typographyConfig={DEFAULT_TAKEOVER_TYPOGRAPHY}
              timingConfig={DEFAULT_TAKEOVER_TIMING}
              onStepExpire={handleTakeoverExpire}
            />
          </HudSlot>
        </HudZone>
      </HudAnchorStage>
    </div>
  );
};
