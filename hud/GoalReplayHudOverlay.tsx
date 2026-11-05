import React, { useEffect } from 'react';
import { HudZone, HudSlot } from '../layout/HudAnchorStage';
import { useReplayViewerStore } from '../stores/replayViewerStore';
import { useRewinderStore } from '../stores/rewinderStore';
import type { HudTransientChannel } from '../stores/hudTransientTypes';
import { TemporalReplayFooterHUD } from './TemporalReplayFooterHUD';
import {
  TakeoverCountdownHUD,
  DEFAULT_TAKEOVER_GLOW,
  DEFAULT_TAKEOVER_TYPOGRAPHY,
  DEFAULT_TAKEOVER_TIMING,
  DEFAULT_TAKEOVER_LAYOUT,
  type TakeoverTeamSide,
} from './TakeoverCountdownHUD';
import { useTakeoverPrerollChoreography } from './useInGameHudChoreography';

export function useGoalReplayAndTakeoverHudState(params: {
  choreographySignal: string | null;
  matchPhase: string;
  localTeam: number;
}) {
  const { choreographySignal, matchPhase, localTeam } = params;

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

  const { isTakeoverPreroll } = useTakeoverPrerollChoreography({
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

  return {
    isTakeoverPreroll,
    bottomHudRetracted,
    isReplayViewerActive,
    isReplayViewerLoaded,
    isReplayViewerIntervening,
  };
}

export interface GoalReplayHudOverlayProps {
  isLight: boolean;
  hudChannel: HudTransientChannel;
  choreographySignal: string | null;
  matchPhase: string;
  localTeam: number;
  replayScorerName?: string | null;
  replayBallSpeedKph?: number | null;
  replayAssistName?: string | null;
  replayScorerTeam?: number | null;
}

/**
 * GoalReplayHudOverlay
 * Bottom HUD overlay subtree handling:
 * - Goal Replay temporal footer banner (`TemporalReplayFooterHUD`) & transient channel sync
 * - Auto-resetting player slot replay skip indicators (`replaySkipReady`) on `kickoff-will-start`
 * - Bottom-center upward offset Takeover Countdown banner (`TakeoverCountdownHUD`)
 */
export const GoalReplayHudOverlay: React.FC<GoalReplayHudOverlayProps> = ({
  isLight,
  hudChannel,
  choreographySignal,
  matchPhase,
  localTeam,
  replayScorerName,
  replayBallSpeedKph,
  replayAssistName,
  replayScorerTeam,
}) => {
  const replayViewerState = useReplayViewerStore((s) => s.viewerState);
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

  const { takeoverPayload, handleTakeoverExpire } = useTakeoverPrerollChoreography({
    isReplayPreroll,
    isRewinderPreroll,
    replayPrerollSec,
    rewinderPrerollSec,
    replayDownCounterSec,
    rewinderDownCounterSec,
    takeoverTeam,
  });

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

  return (
    <>
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
    </>
  );
};
