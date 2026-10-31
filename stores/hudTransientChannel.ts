/**
 * hudTransientChannel.ts
 * Zero-dependency, zero-React-rerender transient pub/sub channel for both 120Hz continuous
 * AND low-frequency discrete HUD metrics & GPU compositor animations.
 */
import type {
  SpeedTransientListener, BoostTransientListener, BallCamTransientListener,
  StepperScoreboardState, EdgeDemoIndicatorConfig, EdgeSkipIndicatorConfig,
  EdgeRosterHudState, FlipTransientState, CompactTelemetryTransientSnapshot,
  KickoffTransientFrame, ReplayBannerTransientState, TemporalReplayFooterTransientState,
  DemolishHourglassTransientState, PitchMiniMapTransientState,
  KickoffCountdownFlashTransientState, HudTransientChannel,
} from './hudTransientTypes';
export * from './hudTransientTypes';

export const DEFAULT_DEMO_INDICATOR_CONFIG: EdgeDemoIndicatorConfig = {
  variant: 'bomb-svg', color: '#EF4444', strokeWidth: 1.75, sizePx: 16,
  glowColor: '#EF4444', glowBlurPx: 0, glowIntensityPct: 0,
};

export const DEFAULT_SKIP_INDICATOR_CONFIG: EdgeSkipIndicatorConfig = {
  color: '#10B981', strokeWidth: 2.5, sizePx: 18,
  glowColor: '#10B981', glowBlurPx: 6, glowIntensityPct: 110,
};

export function resolveDemoIndicatorConfig(
  raw?: Partial<EdgeDemoIndicatorConfig> | unknown,
  fallback: EdgeDemoIndicatorConfig = DEFAULT_DEMO_INDICATOR_CONFIG
): EdgeDemoIndicatorConfig {
  const base = fallback && typeof fallback === 'object' ? fallback : DEFAULT_DEMO_INDICATOR_CONFIG;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...base };
  const r = raw as Partial<EdgeDemoIndicatorConfig>;
  return {
    variant: r.variant === 'cross' || r.variant === 'bomb-svg' ? r.variant : base.variant,
    color: typeof r.color === 'string' && r.color.trim().length > 0 ? r.color : base.color,
    strokeWidth: typeof r.strokeWidth === 'number' && Number.isFinite(r.strokeWidth) ? r.strokeWidth : base.strokeWidth,
    sizePx: typeof r.sizePx === 'number' && Number.isFinite(r.sizePx) ? r.sizePx : base.sizePx,
    glowColor:
      typeof r.glowColor === 'string' && r.glowColor.trim().length > 0
        ? r.glowColor
        : typeof r.color === 'string' && r.color.trim().length > 0 ? r.color : base.glowColor,
    glowBlurPx: typeof r.glowBlurPx === 'number' && Number.isFinite(r.glowBlurPx) ? r.glowBlurPx : base.glowBlurPx,
    glowIntensityPct: typeof r.glowIntensityPct === 'number' && Number.isFinite(r.glowIntensityPct) ? r.glowIntensityPct : base.glowIntensityPct,
  };
}

export function resolveSkipIndicatorConfig(
  raw?: Partial<EdgeSkipIndicatorConfig> | unknown,
  fallback: EdgeSkipIndicatorConfig = DEFAULT_SKIP_INDICATOR_CONFIG
): EdgeSkipIndicatorConfig {
  const base = fallback && typeof fallback === 'object' ? fallback : DEFAULT_SKIP_INDICATOR_CONFIG;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...base };
  const r = raw as Partial<EdgeSkipIndicatorConfig>;
  return {
    color: typeof r.color === 'string' && r.color.trim().length > 0 ? r.color : base.color,
    strokeWidth: typeof r.strokeWidth === 'number' && Number.isFinite(r.strokeWidth) ? r.strokeWidth : base.strokeWidth,
    sizePx: typeof r.sizePx === 'number' && Number.isFinite(r.sizePx) ? r.sizePx : base.sizePx,
    glowColor:
      typeof r.glowColor === 'string' && r.glowColor.trim().length > 0
        ? r.glowColor
        : typeof r.color === 'string' && r.color.trim().length > 0 ? r.color : base.glowColor,
    glowBlurPx: typeof r.glowBlurPx === 'number' && Number.isFinite(r.glowBlurPx) ? r.glowBlurPx : base.glowBlurPx,
    glowIntensityPct: typeof r.glowIntensityPct === 'number' && Number.isFinite(r.glowIntensityPct) ? r.glowIntensityPct : base.glowIntensityPct,
  };
}

const makeInitialPlayer = (
  slotKey: 1 | 2 | 3 | 4 | 5 | 6,
  team: 'left' | 'right',
  name: string,
  boostAmount: number,
  isSelf = false
) => ({
  slotKey, team, name, boostAmount, exists: true, isSelf, isFocusedPov: isSelf,
  isDemolished: false, demoRespawnRemainingSec: 0, demoRespawnTotalSec: 3.0, demolishedAtMs: 0,
  replaySkipReady: false,
});

export const DEFAULT_INITIAL_ROSTER: EdgeRosterHudState = {
  viewMode: 'player-live',
  focusedSlotKey: 1,
  opponentDemoCompact: true,
  demoIndicatorConfig: { ...DEFAULT_DEMO_INDICATOR_CONFIG },
  skipIndicatorConfig: { ...DEFAULT_SKIP_INDICATOR_CONFIG },
  leftPlayers: [
    makeInitialPlayer(1, 'left', 'You (Octane_99)', 85, true),
    makeInitialPlayer(2, 'left', 'Zen_Master_RL', 42),
    makeInitialPlayer(3, 'left', 'Vatira_Pro_LongName', 100),
  ],
  rightPlayers: [
    makeInitialPlayer(4, 'right', 'Firstkiller_NA', 64),
    makeInitialPlayer(5, 'right', 'BeastMode_Fennec', 18),
    makeInitialPlayer(6, 'right', 'Daniel_SSG_Apex', 90),
  ],
};

function createTopic<T extends object>(_topicKey: string, initialState: T) {
  const listeners = new Set<(state: T) => void>();
  const state = initialState;

  const notify = () => {
    for (const fn of listeners) fn(state);
  };

  const subscribe = (listener: (state: T) => void) => {
    listeners.add(listener);
    listener(state);
    return () => {
      listeners.delete(listener);
    };
  };

  const patchShallow = (patch: Partial<T>): boolean => {
    let dirty = false;
    for (const key in patch) {
      const nextVal = patch[key];
      if (nextVal !== undefined && state[key] !== nextVal) {
        state[key] = nextVal as T[Extract<keyof T, string>];
        dirty = true;
      }
    }
    if (dirty) notify();
    return dirty;
  };

  return { state, notify, subscribe, patchShallow };
}

export function createHudTransientChannel(initial?: {
  speed?: number;
  boostAmount?: number;
  isUnlimitedBoost?: boolean;
  ballCamActive?: boolean;
  scoreboard?: Partial<StepperScoreboardState>;
  roster?: Partial<EdgeRosterHudState>;
  flipState?: Partial<FlipTransientState>;
  telemetry?: Partial<CompactTelemetryTransientSnapshot>;
  kickoffFrame?: Partial<KickoffTransientFrame>;
  replayBanner?: Partial<ReplayBannerTransientState>;
  replayFooter?: Partial<TemporalReplayFooterTransientState>;
  respawnTimer?: Partial<DemolishHourglassTransientState>;
  miniMap?: Partial<PitchMiniMapTransientState>;
  countdownFlash?: Partial<KickoffCountdownFlashTransientState>;
}): HudTransientChannel {
  let currentSpeed = initial?.speed ?? 0;
  let currentBoost = initial?.boostAmount ?? 100;
  let currentUnlimited = Boolean(initial?.isUnlimitedBoost);
  let currentBallCam = initial?.ballCamActive ?? true;

  const speedListeners = new Set<SpeedTransientListener>();
  const boostListeners = new Set<BoostTransientListener>();
  const ballCamListeners = new Set<BallCamTransientListener>();

  const scoreboard = createTopic<StepperScoreboardState>('hud:scoreboard', {
    leftScore: initial?.scoreboard?.leftScore ?? 2,
    rightScore: initial?.scoreboard?.rightScore ?? 2,
    scoreDigits: initial?.scoreboard?.scoreDigits ?? 2,
    seconds: initial?.scoreboard?.seconds ?? 164,
    isOvertime: initial?.scoreboard?.isOvertime ?? false,
    overtimeChinOpen: initial?.scoreboard?.overtimeChinOpen ?? false,
    overtimeChinText: initial?.scoreboard?.overtimeChinText ?? 'OVERTIME',
    bestOf: initial?.scoreboard?.bestOf ?? 5,
    seriesTitle: initial?.scoreboard?.seriesTitle,
    leftSeriesWins: initial?.scoreboard?.leftSeriesWins ?? 2,
    rightSeriesWins: initial?.scoreboard?.rightSeriesWins ?? 1,
    seriesResults: initial?.scoreboard?.seriesResults ?? ['left', 'right', 'left', 'none', 'none'],
  });

  const roster = createTopic<EdgeRosterHudState>('hud:roster', {
    viewMode: initial?.roster?.viewMode ?? DEFAULT_INITIAL_ROSTER.viewMode,
    focusedSlotKey:
      initial?.roster?.focusedSlotKey !== undefined
        ? initial.roster.focusedSlotKey
        : DEFAULT_INITIAL_ROSTER.focusedSlotKey,
    opponentDemoCompact:
      initial?.roster?.opponentDemoCompact ?? DEFAULT_INITIAL_ROSTER.opponentDemoCompact ?? true,
    demoIndicatorConfig: resolveDemoIndicatorConfig(initial?.roster?.demoIndicatorConfig),
    skipIndicatorConfig: resolveSkipIndicatorConfig(initial?.roster?.skipIndicatorConfig),
    leftPlayers: (initial?.roster?.leftPlayers ?? DEFAULT_INITIAL_ROSTER.leftPlayers).map((p) => ({
      ...p,
    })) as EdgeRosterHudState['leftPlayers'],
    rightPlayers: (initial?.roster?.rightPlayers ?? DEFAULT_INITIAL_ROSTER.rightPlayers).map(
      (p) => ({ ...p })
    ) as EdgeRosterHudState['rightPlayers'],
  });

  const flip = createTopic<FlipTransientState>('hud:flip', {
    hasFlip: initial?.flipState?.hasFlip ?? true,
    status: initial?.flipState?.status ?? 'grounded',
    remainingSeconds: initial?.flipState?.remainingSeconds ?? 1.25,
    maxSeconds: initial?.flipState?.maxSeconds ?? 1.25,
    flipsRemaining: initial?.flipState?.flipsRemaining ?? 1,
    wheelContacts: initial?.flipState?.wheelContacts ?? [true, true, true, true],
  });

  const telemetry = createTopic<CompactTelemetryTransientSnapshot>('hud:telemetry', {
    fps: initial?.telemetry?.fps ?? 120,
    refreshHz: initial?.telemetry?.refreshHz ?? 120,
    renderScalePct: initial?.telemetry?.renderScalePct ?? 100,
    physicsRateHz: initial?.telemetry?.physicsRateHz ?? 120.0,
    baseLatencyMs: initial?.telemetry?.baseLatencyMs ?? 18,
    extraLatencyMs: initial?.telemetry?.extraLatencyMs ?? 0,
  });

  const kickoff = createTopic<KickoffTransientFrame>('hud:kickoff', {
    episodeTick: initial?.kickoffFrame?.episodeTick ?? 0,
    countdownRemainingTicks: initial?.kickoffFrame?.countdownRemainingTicks ?? 0,
    aiTouchTick: initial?.kickoffFrame?.aiTouchTick ?? null,
    playerTouchTick: initial?.kickoffFrame?.playerTouchTick ?? null,
    lastDeltaTicks: initial?.kickoffFrame?.lastDeltaTicks ?? null,
    requiredKeys: initial?.kickoffFrame?.requiredKeys ?? {},
    playerKeys: initial?.kickoffFrame?.playerKeys ?? {},
  });

  const replayBanner = createTopic<ReplayBannerTransientState>('hud:replayBanner', {
    replayProgress: initial?.replayBanner?.replayProgress ?? 0.42,
    replayFrameIndex: initial?.replayBanner?.replayFrameIndex ?? 151,
    replayTotalFrames: initial?.replayBanner?.replayTotalFrames ?? 360,
  });

  const replayFooter = createTopic<TemporalReplayFooterTransientState>('hud:replayFooter', {
    visible: initial?.replayFooter?.visible ?? true,
    scorerName: initial?.replayFooter?.scorerName ?? 'Swabbie',
    goalSpeed: initial?.replayFooter?.goalSpeed ?? '118KPH',
    assisterName:
      initial?.replayFooter?.assisterName !== undefined
        ? initial.replayFooter.assisterName
        : 'Beast',
    teamAccentColor: initial?.replayFooter?.teamAccentColor ?? '#edce0b',
    sideY: initial?.replayFooter?.sideY ?? -16,
    centerY: initial?.replayFooter?.centerY ?? 47,
  });

  const respawnTimer = createTopic<DemolishHourglassTransientState>('hud:respawnTimer', {
    remainingSeconds: initial?.respawnTimer?.remainingSeconds ?? 3.0,
    totalSeconds: initial?.respawnTimer?.totalSeconds ?? 3.0,
    active: initial?.respawnTimer?.active ?? true,
    alwaysVisible: initial?.respawnTimer?.alwaysVisible ?? true,
  });

  const miniMap = createTopic<PitchMiniMapTransientState>('hud:miniMap', {
    ballX: initial?.miniMap?.ballX ?? 62,
    ballY: initial?.miniMap?.ballY ?? 34,
    ballHitKph: initial?.miniMap?.ballHitKph ?? 114,
    isFlipped: initial?.miniMap?.isFlipped ?? false,
    flip180: initial?.miniMap?.flip180 ?? false,
    ballNormX: initial?.miniMap?.ballNormX ?? 0.36,
    ballNormY: initial?.miniMap?.ballNormY ?? 0.32,
    lastHitEvent: initial?.miniMap?.lastHitEvent ?? {
      id: 1,
      normX: 0.36,
      normY: 0.32,
      speedKph: 102,
      isMyTeam: true,
    },
  });

  const countdownFlash = createTopic<KickoffCountdownFlashTransientState>('hud:countdownFlash', {
    value: initial?.countdownFlash?.value !== undefined ? initial.countdownFlash.value : 3,
    digit: initial?.countdownFlash?.digit ?? '4',
    color: initial?.countdownFlash?.color ?? '#ef4444',
    sequenceId: initial?.countdownFlash?.sequenceId ?? 1,
  });

  const setFlipImpl = (patch: Partial<FlipTransientState>) => {
    const s = flip.state;
    let dirty = false;
    if (patch.hasFlip !== undefined && patch.hasFlip !== s.hasFlip) {
      s.hasFlip = patch.hasFlip;
      dirty = true;
    }
    if (patch.status !== undefined && patch.status !== s.status) {
      s.status = patch.status;
      dirty = true;
    }
    if (patch.remainingSeconds !== undefined) {
      // 120Hz (1/120s ≈ 0.008333s)  0.001s 0.01s 
      const rounded = Math.max(0, Math.round(patch.remainingSeconds * 1000) / 1000);
      if (Math.abs(rounded - s.remainingSeconds) >= 0.002) {
        s.remainingSeconds = rounded;
        dirty = true;
      }
    }
    if (patch.maxSeconds !== undefined && patch.maxSeconds !== s.maxSeconds) {
      s.maxSeconds = patch.maxSeconds;
      dirty = true;
    }
    if (patch.flipsRemaining !== undefined && patch.flipsRemaining !== s.flipsRemaining) {
      s.flipsRemaining = patch.flipsRemaining;
      dirty = true;
    }
    if (patch.wheelContacts !== undefined) {
      const prev = s.wheelContacts;
      const next = patch.wheelContacts;
      if (
        !prev ||
        prev[0] !== next[0] ||
        prev[1] !== next[1] ||
        prev[2] !== next[2] ||
        prev[3] !== next[3]
      ) {
        s.wheelContacts = [next[0], next[1], next[2], next[3]];
        dirty = true;
      }
    }
    if (dirty) flip.notify();
  };

  const setTelemetryImpl = (patch: Partial<CompactTelemetryTransientSnapshot>) => {
    const s = telemetry.state;
    let dirty = false;
    const roundAssign = (
      k: 'fps' | 'refreshHz' | 'renderScalePct' | 'baseLatencyMs' | 'extraLatencyMs',
      val: number | undefined
    ) => {
      if (val === undefined) return;
      const v = Math.round(val);
      if (v !== s[k]) {
        s[k] = v;
        dirty = true;
      }
    };
    roundAssign('fps', patch.fps);
    roundAssign('refreshHz', patch.refreshHz);
    roundAssign('renderScalePct', patch.renderScalePct);
    roundAssign('baseLatencyMs', patch.baseLatencyMs);
    roundAssign('extraLatencyMs', patch.extraLatencyMs);
    if (patch.physicsRateHz !== undefined) {
      const v = Math.round(patch.physicsRateHz * 10) / 10;
      if (Math.abs(v - s.physicsRateHz) >= 0.05) {
        s.physicsRateHz = v;
        dirty = true;
      }
    }
    if (dirty) telemetry.notify();
  };

  const setRespawnTimerImpl = (patch: Partial<DemolishHourglassTransientState>) => {
    const s = respawnTimer.state;
    let dirty = false;
    if (patch.remainingSeconds !== undefined) {
      const clamped = Math.max(0, Math.round(patch.remainingSeconds * 1000) / 1000);
      if (Math.abs(clamped - s.remainingSeconds) >= 0.002) {
        s.remainingSeconds = clamped;
        dirty = true;
      }
    }
    if (patch.totalSeconds !== undefined && patch.totalSeconds !== s.totalSeconds) {
      s.totalSeconds = patch.totalSeconds;
      dirty = true;
    }
    if (patch.active !== undefined && patch.active !== s.active) {
      s.active = patch.active;
      dirty = true;
    }
    if (patch.alwaysVisible !== undefined && patch.alwaysVisible !== s.alwaysVisible) {
      s.alwaysVisible = patch.alwaysVisible;
      dirty = true;
    }
    if (dirty) respawnTimer.notify();
  };

  const setReplayFooterImpl = (patch: Partial<TemporalReplayFooterTransientState>) => {
    replayFooter.patchShallow(patch);
  };

  const setMiniMapImpl = (patch: Partial<PitchMiniMapTransientState>) => {
    Object.assign(miniMap.state, patch);
    miniMap.notify();
  };

  const setCountdownFlashImpl = (patch: Partial<KickoffCountdownFlashTransientState>) => {
    const s = countdownFlash.state;
    if (patch.value !== undefined) s.value = patch.value;
    if (patch.digit !== undefined) s.digit = patch.digit;
    if (patch.color !== undefined) s.color = patch.color;
    s.sequenceId = patch.sequenceId ?? (s.sequenceId ?? 0) + 1;
    countdownFlash.notify();
  };

  return {
    getSpeed: () => currentSpeed,
    getBoost: () => ({ amount: currentBoost, isUnlimited: currentUnlimited }),
    getBallCamActive: () => currentBallCam,
    getScoreboard: () => scoreboard.state,
    getRoster: () => roster.state,
    getFlip: () => flip.state,
    getFlipState: () => flip.state,
    getTelemetry: () => telemetry.state,
    getTelemetrySnapshot: () => telemetry.state,
    getKickoffFrame: () => kickoff.state,
    getReplayBannerState: () => replayBanner.state,
    getReplayFooter: () => replayFooter.state,
    getReplayFooterState: () => replayFooter.state,
    getRespawnTimer: () => respawnTimer.state,
    getRespawnTimerState: () => respawnTimer.state,
    getMiniMap: () => miniMap.state,
    getMiniMapState: () => miniMap.state,
    getCountdownFlash: () => countdownFlash.state,
    getCountdownFlashState: () => countdownFlash.state,

    setSpeed: (rawSpeed: number) => {
      const clamped = Math.max(0, Math.min(2300, Math.round(Math.abs(rawSpeed || 0) * 10) / 10));
      if (Math.abs(clamped - currentSpeed) < 0.05) return;
      currentSpeed = clamped;
      for (const fn of speedListeners) fn(currentSpeed);
    },

    setBoost: (rawAmount: number, isUnlimited = currentUnlimited) => {
      const clamped = Math.max(0, Math.min(100, Math.round(rawAmount || 0)));
      const unlim = Boolean(isUnlimited);
      if (clamped === currentBoost && unlim === currentUnlimited) return;
      currentBoost = clamped;
      currentUnlimited = unlim;
      for (const fn of boostListeners) fn(currentBoost, currentUnlimited);
    },

    setBallCamActive: (active: boolean) => {
      const next = Boolean(active);
      if (next === currentBallCam) return;
      currentBallCam = next;
      for (const fn of ballCamListeners) fn(currentBallCam);
    },

    toggleBallCam: () => {
      currentBallCam = !currentBallCam;
      for (const fn of ballCamListeners) fn(currentBallCam);
      return currentBallCam;
    },

    setScoreboard: (partial: Partial<StepperScoreboardState>) => {
      Object.assign(scoreboard.state, partial);
      scoreboard.notify();
    },

    setRoster: (partial: Partial<EdgeRosterHudState>) => {
      const s = roster.state;
      if (partial.viewMode !== undefined) s.viewMode = partial.viewMode;
      if (partial.opponentDemoCompact !== undefined) {
        s.opponentDemoCompact = partial.opponentDemoCompact;
      }
      if (partial.demoIndicatorConfig !== undefined) {
        s.demoIndicatorConfig = resolveDemoIndicatorConfig(
          partial.demoIndicatorConfig,
          resolveDemoIndicatorConfig(s.demoIndicatorConfig)
        );
      }
      if (partial.skipIndicatorConfig !== undefined) {
        s.skipIndicatorConfig = resolveSkipIndicatorConfig(
          partial.skipIndicatorConfig,
          resolveSkipIndicatorConfig(s.skipIndicatorConfig)
        );
      }
      if (partial.focusedSlotKey !== undefined) {
        s.focusedSlotKey = partial.focusedSlotKey;
        for (const p of s.leftPlayers) {
          p.isFocusedPov = partial.focusedSlotKey !== null && p.slotKey === partial.focusedSlotKey;
        }
        for (const p of s.rightPlayers) {
          p.isFocusedPov = partial.focusedSlotKey !== null && p.slotKey === partial.focusedSlotKey;
        }
      }
      if (partial.leftPlayers) s.leftPlayers = partial.leftPlayers;
      if (partial.rightPlayers) s.rightPlayers = partial.rightPlayers;
      roster.notify();
    },

    updatePlayerSlot: (slotKey, patch) => {
      let slot =
        roster.state.leftPlayers.find((p) => p.slotKey === slotKey) ??
        roster.state.rightPlayers.find((p) => p.slotKey === slotKey);
      if (!slot) {
        const list = slotKey <= 3 ? roster.state.leftPlayers : roster.state.rightPlayers;
        slot = list[slotKey <= 3 ? slotKey - 1 : slotKey - 4];
      }
      if (!slot) return;
      let dirty = false;
      for (const key in patch) {
        const k = key as keyof typeof patch;
        const nextVal = patch[k];
        if (nextVal !== undefined && slot[k] !== nextVal) {
          (slot as any)[k] = nextVal;
          dirty = true;
        }
      }
      if (dirty) roster.notify();
    },

    setFlip: setFlipImpl,
    setFlipState: setFlipImpl,
    setTelemetry: setTelemetryImpl,
    setTelemetrySnapshot: setTelemetryImpl,

    setKickoffFrame: (patch: Partial<KickoffTransientFrame>) => {
      Object.assign(kickoff.state, patch);
      kickoff.notify();
    },

    setReplayBannerState: (patch: Partial<ReplayBannerTransientState>) => {
      const s = replayBanner.state;
      let dirty = false;
      if (
        patch.replayProgress !== undefined &&
        Math.abs(patch.replayProgress - s.replayProgress) >= 0.0005
      ) {
        s.replayProgress = patch.replayProgress;
        dirty = true;
      }
      if (patch.replayFrameIndex !== undefined && patch.replayFrameIndex !== s.replayFrameIndex) {
        s.replayFrameIndex = patch.replayFrameIndex;
        dirty = true;
      }
      if (patch.replayTotalFrames !== undefined && patch.replayTotalFrames !== s.replayTotalFrames) {
        s.replayTotalFrames = patch.replayTotalFrames;
        dirty = true;
      }
      if (dirty) replayBanner.notify();
    },

    setReplayFooter: setReplayFooterImpl,
    setReplayFooterState: setReplayFooterImpl,
    setRespawnTimer: setRespawnTimerImpl,
    setRespawnTimerState: setRespawnTimerImpl,
    setMiniMap: setMiniMapImpl,
    setMiniMapState: setMiniMapImpl,

    triggerMiniMapBallHit: (hit) => {
      const s = miniMap.state;
      s.ballNormX = hit.normX;
      s.ballNormY = hit.normY;
      s.ballX = hit.normX * 100;
      s.ballY = hit.normY * 100;
      s.ballHitKph = hit.speedKph;
      s.lastHitEvent = {
        id: hit.id ?? Date.now() + Math.random(),
        normX: hit.normX,
        normY: hit.normY,
        speedKph: hit.speedKph,
        isMyTeam: hit.isMyTeam,
      };
      miniMap.notify();
    },

    setCountdownFlash: setCountdownFlashImpl,
    setCountdownFlashState: setCountdownFlashImpl,

    subscribeSpeed: (listener: SpeedTransientListener) => {
      speedListeners.add(listener);
      listener(currentSpeed);
      return () => {
        speedListeners.delete(listener);
      };
    },
    subscribeBoost: (listener: BoostTransientListener) => {
      boostListeners.add(listener);
      listener(currentBoost, currentUnlimited);
      return () => {
        boostListeners.delete(listener);
      };
    },
    subscribeBallCam: (listener: BallCamTransientListener) => {
      ballCamListeners.add(listener);
      listener(currentBallCam);
      return () => {
        ballCamListeners.delete(listener);
      };
    },
    subscribeScoreboard: scoreboard.subscribe,
    subscribeRoster: roster.subscribe,
    subscribeFlip: flip.subscribe,
    subscribeTelemetry: telemetry.subscribe,
    subscribeKickoffFrame: kickoff.subscribe,
    subscribeReplayBanner: replayBanner.subscribe,
    subscribeReplayFooter: replayFooter.subscribe,
    subscribeRespawnTimer: respawnTimer.subscribe,
    subscribeMiniMap: miniMap.subscribe,
    subscribeCountdownFlash: countdownFlash.subscribe,
  };
}

export const globalHudTransientChannel = createHudTransientChannel();
