import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHudStore } from '../stores/hudStore';
import { useAppStore } from '../stores/appStore';
import { useTelemetryData } from '../stores/perfTelemetryStore';
import { useNetworkDiagnosticsData } from '../stores/networkDiagnosticsStore';
import { useKickoffTrainingStore } from '../stores/kickoffTrainingStore';
import { useExperimentalMultiBotsStore } from '../stores/experimentalMultiBotsStore';
import { useReplayViewerStore } from '../stores/replayViewerStore';
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
  type CenterUpperInfoPayload,
} from './CenterUpperInfoHUD';

export interface InGameHUDProps {
  className?: string;
}

export const InGameHUD: React.FC<InGameHUDProps> = ({ className = '' }) => {
  const kickoffCountdown = useHudStore((s) => s.kickoffCountdown);
  const matchPhase = useHudStore((s) => s.matchPhase);
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
  const onlineSession = useAppStore((s) => s.onlineSession);
  const renderScale = useAppStore((s) => s.graphics?.renderScale ?? 100);

  const kickoffStore = useKickoffTrainingStore();
  const { data: perfSnap } = useTelemetryData(60, telemetryEnabled);
  const netSnap = useNetworkDiagnosticsData();

  const hudChannel = globalHudTransientChannel;

  // Layer 5E Kickoff Countdown (3 -> 2 -> 1 -> GO only; no winner or custom announcement)
  const [countdownPayload, setCountdownPayload] = useState<CenterUpperInfoPayload | null>(null);
  const prevCountdownRef = useRef<number>(-1);
  const countdownNonceRef = useRef<number>(1);
  const handleCountdownExpire = useCallback(() => {
    setCountdownPayload(null);
  }, []);

  useEffect(() => {
    if (matchMode === 'kickoff-training') {
      prevCountdownRef.current = kickoffCountdown;
      setCountdownPayload(null);
      return;
    }

    const prev = prevCountdownRef.current;
    const curr = kickoffCountdown;

    if (
      curr === 0 &&
      (matchPhase === 'goal' ||
        matchPhase === 'replay' ||
        matchPhase === 'ended' ||
        matchPhase === 'podium' ||
        matchPhase === 'freeplay' ||
        matchPhase === 'warmup')
    ) {
      prevCountdownRef.current = 0;
      setCountdownPayload(null);
      return;
    }

    if (curr === 3 || curr === 2 || curr === 1) {
      if (curr !== prev) {
        prevCountdownRef.current = curr;
        countdownNonceRef.current += 1;
        setCountdownPayload({
          variant: 'countdown',
          mainText: String(curr),
          triggerKey: countdownNonceRef.current,
        });
      }
      return;
    }

    if (
      (prev === 1 || prev === 2 || prev === 3) &&
      curr === 0 &&
      (matchPhase === 'playing' || isOvertime)
    ) {
      prevCountdownRef.current = 0;
      countdownNonceRef.current += 1;
      setCountdownPayload({
        variant: 'countdown',
        mainText: 'GO',
        triggerKey: countdownNonceRef.current,
      });
      return;
    }
  }, [kickoffCountdown, matchPhase, isOvertime, matchMode]);

  // 1. Push telemetry bar updates
  const isOnline =
    onlineSession.signalingConnected || (onlineSession.connectedPeers?.length ?? 0) > 0;
  useEffect(() => {
    if (!telemetryEnabled) return;
    hudChannel.setTelemetry({
      fps: Math.round(perfSnap?.fps || 120),
      refreshHz: Math.round(perfSnap?.refreshHz || 120),
      renderScalePct: Math.round(renderScale || 100),
      physicsRateHz: Math.round(perfSnap?.sim?.physicsRateHz || 120),
      baseLatencyMs: isOnline ? Math.round(netSnap.metrics?.rttMs || 0) : 0,
      extraLatencyMs: 0,
    });
  }, [
    hudChannel,
    telemetryEnabled,
    isOnline,
    renderScale,
    perfSnap,
    netSnap.metrics?.rttMs,
  ]);

  // 2. Demolish state flag (high-frequency remainingSeconds is pushed directly via globalHudTransientChannel)
  const isDemolished = isDemoed;

  // 3. Push scoreboard clock & score updates (Series always hidden: bestOf = 0)
  // Flip left/right sides so the local player's own team is always on the LEFT.
  const isOrangeLeft = localTeam === 1;
  const leftTeamColor = isOrangeLeft ? '#EA580C' : '#2563EB';
  const leftBarColor = isOrangeLeft ? '#F97316' : '#3B82F6';
  const rightTeamColor = isOrangeLeft ? '#2563EB' : '#EA580C';
  const rightBarColor = isOrangeLeft ? '#3B82F6' : '#F97316';
  const leftScore = isOrangeLeft ? orangeScore : blueScore;
  const rightScore = isOrangeLeft ? blueScore : orangeScore;

  // Overtime drop-banner only opens when overtime kickoff starts (not during 0s goal celebration/replay)
  const overtimeChinOpen = Boolean(
    isOvertime &&
      matchPhase !== 'goal' &&
      matchPhase !== 'replay' &&
      matchPhase !== 'podium' &&
      matchPhase !== 'ended'
  );
  const activeClockSec = overtimeChinOpen ? overtimeSeconds : remainingSeconds;
  useEffect(() => {
    hudChannel.setScoreboard({
      leftScore,
      rightScore,
      seconds: activeClockSec,
      isOvertime: overtimeChinOpen,
      overtimeChinOpen,
      overtimeChinText: 'OVERTIME',
      bestOf: 0,
      leftSeriesWins: 0,
      rightSeriesWins: 0,
      seriesResults: [],
    });
  }, [hudChannel, leftScore, rightScore, activeClockSec, overtimeChinOpen]);

  // 4. 4-Stage Choreography Signal State Machine:
  // - 'goal-replay-will-start': Bottom cockpit HUD (BallCam, Velocity+Flip, Boost) exits off-screen; Footer stays hidden.
  // - 'goal-replay-started': TemporalReplayFooterHUD slides up; EdgePlayerHudStrip enters 'goal-replay' mode.
  // - 'goal-replay-will-end': TemporalReplayFooterHUD slides down off-screen; Bottom cockpit stays retracted.
  // - 'kickoff-will-start': Bottom cockpit HUD slides back in; EdgePlayerHudStrip returns to 'player-live'.
  const bottomHudRetracted =
    choreographySignal === 'goal-replay-will-start' ||
    choreographySignal === 'goal-replay-started' ||
    choreographySignal === 'goal-replay-will-end' ||
    matchPhase === 'goal' ||
    matchPhase === 'replay';

  const replayFooterVisible =
    choreographySignal === 'goal-replay-started' && matchPhase === 'replay';

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
  const replayViewerState = useReplayViewerStore((s) => s.viewerState);
  const replayViewerTotalFrames = useReplayViewerStore((s) => s.totalFrames);
  const replayViewerFileName = useReplayViewerStore((s) => s.loadedFileName);
  const isReplayViewerActive = Boolean(
    replayViewerFileName &&
      replayViewerTotalFrames > 0 &&
      replayViewerState !== 'idle' &&
      replayViewerState !== 'intervening'
  );
  const isReplayViewerLoaded = Boolean(
    replayViewerFileName && replayViewerTotalFrames > 0 && replayViewerState !== 'idle'
  );

  const handleSelectPovSlot = useCallback(
    (slotKey: 1 | 2 | 3 | 4 | 5 | 6 | null) => {
      if (slotKey === null) {
        hudChannel.setRoster({ focusedSlotKey: null });
        if (isReplayViewerActive) {
          useReplayViewerStore.getState().runtimeHandlers.onSelectPovSlot?.(null);
        }
        const curHud = useHudStore.getState();
        if (curHud.onReplaySelectPovCar) {
          curHud.onReplaySelectPovCar(null);
        } else if (curHud.matchPhase === 'replay' && curHud.replayCameraMode !== 'director') {
          curHud.onReplayToggleCameraMode?.();
        }
        return;
      }

      const roster = hudChannel.getRoster();
      const allSlots = [...(roster.leftPlayers || []), ...(roster.rightPlayers || [])];
      const matchedByKey = allSlots.find(
        (s) => s && s.exists !== false && s.slotKey === slotKey
      );
      const fallbackSlot =
        slotKey <= 3 ? roster.leftPlayers[slotKey - 1] : roster.rightPlayers[slotKey - 4];
      const targetSlot = matchedByKey ?? fallbackSlot;
      const slotCarIndex =
        targetSlot && targetSlot.exists !== false && typeof targetSlot.carIndex === 'number'
          ? targetSlot.carIndex
          : null;

      if (isReplayViewerActive) {
        hudChannel.setRoster({ focusedSlotKey: slotKey });
        useReplayViewerStore.getState().runtimeHandlers.onSelectPovSlot?.(slotKey);
        return;
      }

      if (slotCarIndex !== null) {
        hudChannel.setRoster({ focusedSlotKey: slotKey });
        const curHud = useHudStore.getState();
        if (curHud.matchPhase === 'replay') {
          if (curHud.onReplaySelectPovCar) {
            curHud.onReplaySelectPovCar(slotCarIndex);
          } else {
            if (curHud.replayCameraMode === 'director') {
              curHud.onReplayToggleCameraMode?.();
            }
            useExperimentalMultiBotsStore.getState().setActiveCameraCarIndex(slotCarIndex);
          }
        } else if (matchMode === 'exp-multi-bots') {
          useExperimentalMultiBotsStore.getState().setActiveCameraCarIndex(slotCarIndex);
        }
      }
    },
    [hudChannel, matchMode, isReplayViewerActive]
  );

  // Bind 1-6 (player POV) and 7 (Director view) hotkeys during Goal Replay or Replay Viewer
  useEffect(() => {
    if (matchPhase !== 'replay' && !isReplayViewerActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      let keyNum = -1;
      if (e.code >= 'Digit0' && e.code <= 'Digit7') {
        keyNum = Number(e.code.replace('Digit', ''));
      } else if (e.code >= 'Numpad0' && e.code <= 'Numpad7') {
        keyNum = Number(e.code.replace('Numpad', ''));
      }

      if (keyNum === 7 || keyNum === 0) {
        if (matchPhase === 'replay') {
          e.preventDefault();
          handleSelectPovSlot(null);
        }
      } else if (keyNum >= 1 && keyNum <= 6) {
        e.preventDefault();
        handleSelectPovSlot(keyNum as 1 | 2 | 3 | 4 | 5 | 6);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [matchPhase, isReplayViewerActive, handleSelectPovSlot]);

  const showTopScoreboard =
    matchMode === 'match' ||
    matchMode === 'exp-multi-bots' ||
    (matchMode === 'online-warmup' && onlineSession.roomType === 'match') ||
    isReplayViewerLoaded;

  const showEdgeRosterStrips =
    showTopScoreboard && matchPhase !== 'podium' && matchPhase !== 'ended';

  return (
    <div
      data-ui-element="in-game-hud-layer"
      className={`absolute inset-0 pointer-events-none select-none z-[5] overflow-hidden ${className}`}
    >
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
              overtimeChinOpen={overtimeChinOpen}
              overtimeChinText="OVERTIME"
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
      </HudAnchorStage>
    </div>
  );
};
