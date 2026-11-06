import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_CENTER_UPPER_TIMING,
  DEFAULT_WINNER_BLUE_TEAM_CONFIG,
  type CenterUpperInfoPayload,
} from './CenterUpperInfoHUD';
import {
  DEFAULT_TAKEOVER_GLOW,
  DEFAULT_TAKEOVER_TIMING,
  DEFAULT_TAKEOVER_TYPOGRAPHY,
  type TakeoverHudPayload,
  type TakeoverTeamSide,
} from './TakeoverCountdownHUD';
import { useReplayViewerStore } from '../stores/replayViewerStore';
import { useReplayToRcsImporterStore } from '../stores/replayToRcsImporterStore';
import { useHudStore } from '../stores/hudStore';
import { useExperimentalMultiBotsStore } from '../stores/experimentalMultiBotsStore';
import type { HudTransientChannel } from '../stores/hudTransientTypes';

export function useCenterUpperCountdownChoreography(params: {
  kickoffCountdown: number;
  matchPhase: string;
  isPaused: boolean;
  winner: string | number | null;
  isOvertime: boolean;
  matchMode: string;
  roomType?: string;
}) {
  const {
    kickoffCountdown,
    matchPhase,
    isPaused,
    winner,
    isOvertime,
    matchMode,
    roomType,
  } = params;

  const [countdownPayload, setCountdownPayload] = useState<CenterUpperInfoPayload | null>(null);
  const prevCountdownRef = useRef<number>(-1);
  const prevEndedWinnerRef = useRef<string | number | null>(null);
  const countdownNonceRef = useRef<number>(1);
  const handleCountdownExpire = useCallback(() => {
    setCountdownPayload(null);
  }, []);

  useEffect(() => {
    if (matchMode === 'kickoff-training') {
      prevCountdownRef.current = kickoffCountdown;
      prevEndedWinnerRef.current = null;
      setCountdownPayload(null);
      return;
    }

    const isMatchContext =
      matchMode === 'match' ||
      matchMode === 'exp-multi-bots' ||
      (matchMode === 'online-warmup' && roomType === 'match');

    // 1. Winner Blue Team / Winner Orange Team announcement during 3s 'ended' window before 'podium'
    if (isMatchContext && matchPhase === 'ended' && winner !== null && winner !== undefined) {
      prevCountdownRef.current = 0;
      const isBlueWinner =
        winner === 0 ||
        String(winner).toUpperCase() === 'BLUE' ||
        String(winner).toUpperCase() === 'BLUE TEAM';
      const isOrangeWinner =
        winner === 1 ||
        String(winner).toUpperCase() === 'ORANGE' ||
        String(winner).toUpperCase() === 'ORANGE TEAM';
      if ((isBlueWinner || isOrangeWinner) && prevEndedWinnerRef.current !== winner) {
        prevEndedWinnerRef.current = winner;
        countdownNonceRef.current += 1;
        setCountdownPayload({
          variant: 'winner',
          winnerTeam: isOrangeWinner ? 'orange' : 'blue',
          winnerBlueConfig: DEFAULT_WINNER_BLUE_TEAM_CONFIG,
          topText: 'WINNER',
          mainText: isOrangeWinner ? 'ORANGE TEAM' : 'BLUE TEAM',
          timing: {
            ...DEFAULT_CENTER_UPPER_TIMING,
            durationMs: 2200,
            persistentInspect: false,
          },
          triggerKey: countdownNonceRef.current,
        });
      }
      return;
    }

    if (matchPhase !== 'ended') {
      prevEndedWinnerRef.current = null;
    }

    // 2. Match Paused (ADMIN CONTROL / MATCH PAUSED) when paused without active resume countdown
    const isAdminPaused = Boolean(
      isMatchContext && (isPaused || matchPhase === 'paused') && kickoffCountdown <= 0
    );
    if (isAdminPaused) {
      setCountdownPayload((prevPayload) => {
        if (
          prevPayload?.variant === 'announcement' &&
          prevPayload.mainText === 'MATCH PAUSED'
        ) {
          return prevPayload;
        }
        countdownNonceRef.current += 1;
        return {
          variant: 'announcement',
          topText: 'ADMIN CONTROL',
          mainText: 'MATCH PAUSED',
          timing: {
            ...DEFAULT_CENTER_UPPER_TIMING,
            persistentInspect: true,
          },
          triggerKey: countdownNonceRef.current,
        };
      });
      return;
    }

    setCountdownPayload((prevPayload) =>
      prevPayload?.variant === 'announcement' && prevPayload.mainText === 'MATCH PAUSED'
        ? null
        : prevPayload
    );

    const prev = prevCountdownRef.current;
    const curr = kickoffCountdown;

    if (
      curr === 0 &&
      (matchPhase === 'goal' ||
        matchPhase === 'replay' ||
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
  }, [
    kickoffCountdown,
    matchPhase,
    isPaused,
    winner,
    isOvertime,
    matchMode,
    roomType,
  ]);

  return { countdownPayload, handleCountdownExpire };
}

export function useTakeoverPrerollChoreography(params: {
  isReplayPreroll: boolean;
  isRewinderPreroll: boolean;
  replayPrerollSec: number;
  rewinderPrerollSec: number;
  replayDownCounterSec: number;
  rewinderDownCounterSec: number;
  takeoverTeam: TakeoverTeamSide;
}) {
  const {
    isReplayPreroll,
    isRewinderPreroll,
    replayPrerollSec,
    rewinderPrerollSec,
    replayDownCounterSec,
    rewinderDownCounterSec,
    takeoverTeam,
  } = params;

  const isTakeoverPreroll = isReplayPreroll || isRewinderPreroll;
  const [takeoverPayload, setTakeoverPayload] = useState<TakeoverHudPayload | null>(null);
  const takeoverSeqRef = useRef<number>(0);
  const lastTakeoverStepRef = useRef<number | null>(null);

  const handleTakeoverExpire = useCallback(() => {
    setTakeoverPayload(null);
  }, []);

  useEffect(() => {
    const activePrerollSec = isReplayPreroll
      ? replayPrerollSec
      : isRewinderPreroll
      ? rewinderPrerollSec
      : 0;
    const activeDownSec = isReplayPreroll
      ? replayDownCounterSec
      : isRewinderPreroll
      ? rewinderDownCounterSec
      : 0;
    const effectiveDownSec = Math.max(1, activeDownSec);

    if (isTakeoverPreroll) {
      if (activePrerollSec >= 1 && activePrerollSec <= effectiveDownSec + 1) {
        const displayDigit = Math.min(3, activePrerollSec);
        const isSilentLeadIn = activeDownSec > 0 && activePrerollSec > effectiveDownSec;
        const stepTiming = isSilentLeadIn
          ? {
              ...DEFAULT_TAKEOVER_TIMING,
              entryScale: 1,
              entryDurationMs: 0,
              persistentInspect: true,
            }
          : DEFAULT_TAKEOVER_TIMING;

        if (lastTakeoverStepRef.current !== activePrerollSec) {
          lastTakeoverStepRef.current = activePrerollSec;
          takeoverSeqRef.current += 1;
          setTakeoverPayload({
            topText: 'Takeover in...',
            mainText: String(displayDigit),
            subText: '',
            teamSide: takeoverTeam,
            glow: DEFAULT_TAKEOVER_GLOW,
            typography: DEFAULT_TAKEOVER_TYPOGRAPHY,
            timing: stepTiming,
            triggerKey: takeoverSeqRef.current,
          });
        } else {
          setTakeoverPayload((prev) =>
            prev && prev.teamSide !== takeoverTeam ? { ...prev, teamSide: takeoverTeam } : prev
          );
        }
      } else {
        lastTakeoverStepRef.current = null;
        setTakeoverPayload(null);
      }
      return;
    }

    lastTakeoverStepRef.current = null;
    setTakeoverPayload(null);
  }, [
    isTakeoverPreroll,
    isReplayPreroll,
    isRewinderPreroll,
    replayPrerollSec,
    rewinderPrerollSec,
    replayDownCounterSec,
    rewinderDownCounterSec,
    takeoverTeam,
  ]);

  return { isTakeoverPreroll, takeoverPayload, handleTakeoverExpire };
}

function dispatchReplayViewerSelectPovSlot(slotKey: 1 | 2 | 3 | 4 | 5 | 6 | null): void {
  const impState = useReplayToRcsImporterStore.getState();
  if (impState.viewerState !== 'idle' && impState.totalFrames > 0) {
    if (slotKey !== null) {
      impState.runtimeHandlers.onSelectPovSlot?.(slotKey);
    }
    return;
  }
  useReplayViewerStore.getState().runtimeHandlers.onSelectPovSlot?.(slotKey);
}

export function useReplayPovSlotHotkeys(params: {
  hudChannel: HudTransientChannel;
  matchMode: string;
  matchPhase: string;
  isReplayViewerActive: boolean;
  isReplayViewerLoaded?: boolean;
}) {
  const {
    hudChannel,
    matchMode,
    matchPhase,
    isReplayViewerActive,
    isReplayViewerLoaded = isReplayViewerActive,
  } = params;

  const handleSelectPovSlot = useCallback(
    (slotKey: 1 | 2 | 3 | 4 | 5 | 6 | null) => {
      if (slotKey === null) {
        hudChannel.setRoster({ focusedSlotKey: null });
        if (isReplayViewerLoaded) {
          dispatchReplayViewerSelectPovSlot(null);
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

      if (isReplayViewerLoaded) {
        hudChannel.setRoster({ focusedSlotKey: slotKey });
        dispatchReplayViewerSelectPovSlot(slotKey);
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
    [hudChannel, matchMode, isReplayViewerLoaded]
  );

  useEffect(() => {
    if (matchPhase !== 'replay' && !isReplayViewerLoaded) return;
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
  }, [matchPhase, isReplayViewerLoaded, handleSelectPovSlot]);

  return { handleSelectPovSlot };
}
