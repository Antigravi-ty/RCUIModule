export type EditSubMode = 'car-heading' | 'car-speed' | 'ball-speed' | 'free-cam';

export interface StaticTrainingHudShot {
  car: {
    unlimitedBoost?: boolean;
    initialBoost?: number;
    snapToGround?: boolean;
    hasFlip?: boolean;
    speedFollowsHeading?: boolean;
  };
}

// ============================================================================
// Transient Channel Types (120Hz+ Zero-React-Rerender Pub/Sub)
// ============================================================================

export type SpeedTransientListener = (speed: number) => void;
export type BoostTransientListener = (amount: number, isUnlimited: boolean) => void;
export type BallCamTransientListener = (active: boolean) => void;
export type HudSpeedListener = SpeedTransientListener;
export type HudBoostListener = BoostTransientListener;
export type HudBallCamListener = BallCamTransientListener;

export type SeriesSlotWinner = 'left' | 'right' | 'none';

export interface StepperScoreboardState {
  leftScore: number;
  rightScore: number;
  scoreDigits: 2 | 3;
  seconds: number;
  isOvertime: boolean;
  overtimeChinOpen: boolean;
  overtimeChinText?: string;
  overtimeChinColor?: string;
  bestOf: 0 | 3 | 5 | 7;
  seriesTitle?: string;
  leftSeriesWins: number;
  rightSeriesWins: number;
  seriesResults: SeriesSlotWinner[];
}

export type HudRosterViewMode = 'player-live' | 'goal-replay' | 'spectator';

export type MatchHudChoreographySignal =
  | 'goal-replay-will-start'
  | 'goal-replay-started'
  | 'goal-replay-will-end'
  | 'kickoff-will-start';

export type EdgeDemoIndicatorVariant = 'bomb-svg' | 'cross';

export interface EdgeDemoIndicatorConfig {
  /** Demolish indicator style: 'bomb-svg' (packaged svgrepo-528868 bomb) or 'cross' (classic x) */
  variant: EdgeDemoIndicatorVariant;
  /** Primary stroke / text color (default '#EF4444') */
  color: string;
  /** SVG stroke width (default 1.75, range 0.8 - 3.2) */
  strokeWidth: number;
  /** SVG icon size in px (default 16, range 12 - 22) */
  sizePx: number;
  /** Outer glow color (default '#EF4444') */
  glowColor: string;
  /** Outer glow blur radius in px (default 6, range 0 - 20) */
  glowBlurPx: number;
  /** Outer glow intensity percentage (default 85, range 0 - 200) */
  glowIntensityPct: number;
}

export type EdgeSkipIndicatorVariant =
  | 'check'
  | 'disconnect'
  | 'packet-loss'
  | 'latency'
  | 'waiting';

export interface EdgeSkipIndicatorConfig {
  /** Default icon variant rendered inside the inward slot extension card (default 'check') */
  variant: EdgeSkipIndicatorVariant;
  /** Icon SVG stroke color (default '#10B981' — 2nd green swatch) */
  color: string;
  /** Icon SVG stroke width (default 2.0, range 1.0 - 4.0) */
  strokeWidth: number;
  /** Icon SVG size in px (default 24, range 10 - 34) */
  sizePx: number;
  /** Icon SVG drop-shadow glow color (default '#10B981') */
  glowColor: string;
  /** Icon SVG drop-shadow glow blur radius in px (default 6, range 0 - 20) */
  glowBlurPx: number;
  /** Icon SVG drop-shadow glow intensity percentage (default 110, range 0 - 200) */
  glowIntensityPct: number;
  /** Visible inward protrusion length past the player card edge in px (default 34, range 24 - 76) */
  protrudeWidthPx: number;
  /** Inner overlap width tucked underneath the player card in px so borders extend seamlessly from beneath the card (default 20, range 0 - 28) */
  underlapPx: number;
  /** Outer rounded corner radius of the extension card in px (default 9, range 0 - 18) */
  cardRadiusPx: number;
  /** Horizontal fine-tuning offset of the icon inside the protruding area in px (default 0, range -12 - 12) */
  iconOffsetXPx: number;
  /** Vertical fine-tuning offset of the icon inside the protruding area in px for optical vs mathematical center balance (default -1, range -12 - 12) */
  iconOffsetYPx: number;
  /** Slide-out push animation duration when activated in ms (default 220, range 0 - 600) */
  enterDurationMs: number;
  /** Slide-in retract animation duration when deactivated/reset in ms (default 160, faster than 300ms 1-2-3 contraction) */
  exitDurationMs: number;
  /** Automatically reset all slots' replaySkipReady state when 'kickoff-will-start' signal fires (default true) */
  autoResetOnKickoff: boolean;
}

export interface EdgePlayerSlotState {
  slotKey: 1 | 2 | 3 | 4 | 5 | 6;
  team: 'left' | 'right';
  name: string;
  boostAmount: number;
  /** Authoritative carIndex in the simulation corresponding to this HUD slot */
  carIndex?: number;
  /** Whether this player slot is active in the current match (e.g. 1v1, 2v2, 1v3, 2v3, 3v3, 2v4, 1v5) */
  exists?: boolean;
  isSelf?: boolean;
  isFocusedPov?: boolean;
  isDemolished?: boolean;
  demoRespawnRemainingSec?: number;
  /** Total respawn duration baseline in seconds (default RLConst::DEMO_RESPAWN_TIME = 3.0) */
  demoRespawnTotalSec?: number;
  /** Optional timestamp (performance.now()) when demolish started; if omitted/0, FIFO falls back to demoRespawnRemainingSec ascending */
  demolishedAtMs?: number;
  /** Whether this player's inward auxiliary extension card (Skip Replay / Network Status) is active */
  replaySkipReady?: boolean;
  /** Optional per-slot auxiliary icon variant override ('check' | 'disconnect' | 'packet-loss' | 'latency' | 'waiting') */
  skipIndicatorVariant?: EdgeSkipIndicatorVariant;
  /** Optional per-slot auxiliary icon color override */
  skipIndicatorColor?: string;
}

export interface EdgeRosterHudState {
  viewMode: HudRosterViewMode;
  focusedSlotKey: 1 | 2 | 3 | 4 | 5 | 6 | null;
  /**
   * When true (default), demolished opponents on the right side during `player-live`
   * automatically compact upward to the top slot (FIFO order by demolish time or remaining timer) instead of leaving empty gaps.
   */
  opponentDemoCompact?: boolean;
  /** Optional demolish indicator configuration (bomb-svg vs red cross, stroke width, color, outer glow) */
  demoIndicatorConfig?: EdgeDemoIndicatorConfig;
  /** Optional replay skip checkmark SVG configuration (size, stroke width, color, SVG glow) */
  skipIndicatorConfig?: EdgeSkipIndicatorConfig;
  leftPlayers: [EdgePlayerSlotState, EdgePlayerSlotState, EdgePlayerSlotState, ...EdgePlayerSlotState[]];
  rightPlayers: [EdgePlayerSlotState, EdgePlayerSlotState, EdgePlayerSlotState, ...EdgePlayerSlotState[]];
}

export type ScoreboardTransientListener = (state: StepperScoreboardState) => void;
export type RosterTransientListener = (state: EdgeRosterHudState) => void;

export interface FlipTransientState {
  hasFlip: boolean;
  /** Supports both 'expired' and RocketCompanion 'none' */
  status: 'grounded' | 'countdown' | 'unlimited' | 'expired' | 'none';
  remainingSeconds: number;
  maxSeconds?: number;
  /**
   * Optional multi-flip counter from RocketCompanion:
   * -1 = unlimited, 0 = none/expired, 1 = normal single dodge, 2+ = multi-flip (e.g. HAS FLIP ×2)
   */
  flipsRemaining?: number;
  wheelContacts?: [boolean, boolean, boolean, boolean];
}
export type FlipTransientListener = (state: FlipTransientState) => void;

export interface CompactTelemetryTransientSnapshot {
  fps: number;
  refreshHz: number;
  renderScalePct: number;
  physicsRateHz: number;
  baseLatencyMs: number;
  extraLatencyMs: number;
}
export type CompactTelemetryTransientListener = (snap: CompactTelemetryTransientSnapshot) => void;

export type KickoffKeyId = 'Shift' | 'Q' | 'A' | 'W' | 'S' | 'D' | 'E' | 'Boost' | 'Jump';

export interface KickoffTransientFrame {
  episodeTick: number;
  countdownRemainingTicks?: number;
  aiTouchTick?: number | null;
  playerTouchTick?: number | null;
  lastDeltaTicks?: number | null;
  requiredKeys?: Partial<Record<KickoffKeyId, boolean>>;
  playerKeys?: Partial<Record<KickoffKeyId, boolean>>;
}
export type KickoffTransientListener = (frame: KickoffTransientFrame) => void;

export interface ReplayBannerTransientState {
  replayProgress: number;
  replayFrameIndex: number;
  replayTotalFrames: number;
}
export type ReplayBannerTransientListener = (state: ReplayBannerTransientState) => void;

export interface TemporalReplayFooterTransientState {
  visible: boolean;
  scorerName: string;
  goalSpeed: string | number;
  assisterName?: string | null;
  teamAccentColor?: string;
  sideY?: number;
  centerY?: number;
}
export type TemporalReplayFooterTransientListener = (
  state: TemporalReplayFooterTransientState
) => void;
export type ReplayFooterTransientState = TemporalReplayFooterTransientState;
export type ReplayFooterTransientListener = TemporalReplayFooterTransientListener;

export interface DemolishHourglassTransientState {
  remainingSeconds: number;
  totalSeconds: number;
  active?: boolean;
  alwaysVisible?: boolean;
}
export type DemolishHourglassTransientListener = (
  state: DemolishHourglassTransientState
) => void;
export type RespawnTimerTransientState = DemolishHourglassTransientState;
export type RespawnTimerTransientListener = DemolishHourglassTransientListener;

export interface PitchMiniMapBallHitTransientEvent {
  id: number;
  normX: number;
  normY: number;
  speedKph: number;
  isMyTeam: boolean;
}

export interface PitchMiniMapTransientState {
  ballX: number;
  ballY: number;
  ballHitKph: number;
  isFlipped: boolean;
  flip180?: boolean;
  ballNormX?: number;
  ballNormY?: number;
  lastHitEvent?: PitchMiniMapBallHitTransientEvent;
}
export type PitchMiniMapTransientListener = (state: PitchMiniMapTransientState) => void;
export type MiniMapTransientState = PitchMiniMapTransientState;
export type MiniMapTransientListener = PitchMiniMapTransientListener;

export interface KickoffCountdownFlashTransientState {
  value: 4 | 3 | 2 | 1 | 0 | null;
  digit?: string;
  color?: string;
  sequenceId?: number;
}
export type KickoffCountdownFlashTransientListener = (
  state: KickoffCountdownFlashTransientState
) => void;
export type CountdownFlashTransientState = KickoffCountdownFlashTransientState;
export type CountdownFlashTransientListener = KickoffCountdownFlashTransientListener;

export interface HudTransientChannel {
  getSpeed: () => number;
  getBoost: () => { amount: number; isUnlimited: boolean };
  getBallCamActive: () => boolean;
  getScoreboard: () => StepperScoreboardState;
  getRoster: () => EdgeRosterHudState;
  getFlip: () => FlipTransientState;
  getFlipState: () => FlipTransientState;
  getTelemetry: () => CompactTelemetryTransientSnapshot;
  getTelemetrySnapshot: () => CompactTelemetryTransientSnapshot;
  getKickoffFrame: () => KickoffTransientFrame;
  getReplayBannerState: () => ReplayBannerTransientState;
  getReplayFooter: () => TemporalReplayFooterTransientState;
  getReplayFooterState: () => TemporalReplayFooterTransientState;
  getRespawnTimer: () => DemolishHourglassTransientState;
  getRespawnTimerState: () => DemolishHourglassTransientState;
  getMiniMap: () => PitchMiniMapTransientState;
  getMiniMapState: () => PitchMiniMapTransientState;
  getCountdownFlash: () => KickoffCountdownFlashTransientState;
  getCountdownFlashState: () => KickoffCountdownFlashTransientState;

  setSpeed: (speed: number) => void;
  setBoost: (amount: number, isUnlimited?: boolean) => void;
  setBallCamActive: (active: boolean) => void;
  toggleBallCam: () => boolean;
  setScoreboard: (partial: Partial<StepperScoreboardState>) => void;
  setRoster: (partial: Partial<EdgeRosterHudState>) => void;
  updatePlayerSlot: (
    slotKey: 1 | 2 | 3 | 4 | 5 | 6,
    patch: Partial<Omit<EdgePlayerSlotState, 'slotKey' | 'team'>>
  ) => void;
  setFlip: (state: Partial<FlipTransientState>) => void;
  setFlipState: (state: Partial<FlipTransientState>) => void;
  setTelemetry: (snap: Partial<CompactTelemetryTransientSnapshot>) => void;
  setTelemetrySnapshot: (snap: Partial<CompactTelemetryTransientSnapshot>) => void;
  setKickoffFrame: (frame: Partial<KickoffTransientFrame>) => void;
  setReplayBannerState: (patch: Partial<ReplayBannerTransientState>) => void;
  setReplayFooter: (patch: Partial<TemporalReplayFooterTransientState>) => void;
  setReplayFooterState: (patch: Partial<TemporalReplayFooterTransientState>) => void;
  setRespawnTimer: (patch: Partial<DemolishHourglassTransientState>) => void;
  setRespawnTimerState: (patch: Partial<DemolishHourglassTransientState>) => void;
  setMiniMap: (patch: Partial<PitchMiniMapTransientState>) => void;
  setMiniMapState: (patch: Partial<PitchMiniMapTransientState>) => void;
  triggerMiniMapBallHit: (
    hit: Omit<PitchMiniMapBallHitTransientEvent, 'id'> & { id?: number }
  ) => void;
  setCountdownFlash: (patch: Partial<KickoffCountdownFlashTransientState>) => void;
  setCountdownFlashState: (patch: Partial<KickoffCountdownFlashTransientState>) => void;

  subscribeSpeed: (listener: SpeedTransientListener) => () => void;
  subscribeBoost: (listener: BoostTransientListener) => () => void;
  subscribeBallCam: (listener: BallCamTransientListener) => () => void;
  subscribeScoreboard: (listener: ScoreboardTransientListener) => () => void;
  subscribeRoster: (listener: RosterTransientListener) => () => void;
  subscribeFlip: (listener: FlipTransientListener) => () => void;
  subscribeTelemetry: (listener: CompactTelemetryTransientListener) => () => void;
  subscribeKickoffFrame: (listener: KickoffTransientListener) => () => void;
  subscribeReplayBanner: (listener: ReplayBannerTransientListener) => () => void;
  subscribeReplayFooter: (listener: TemporalReplayFooterTransientListener) => () => void;
  subscribeRespawnTimer: (listener: DemolishHourglassTransientListener) => () => void;
  subscribeMiniMap: (listener: PitchMiniMapTransientListener) => () => void;
  subscribeCountdownFlash: (listener: KickoffCountdownFlashTransientListener) => () => void;
}

export const DEFAULT_DEMO_INDICATOR_CONFIG: EdgeDemoIndicatorConfig = {
  variant: 'bomb-svg', color: '#EF4444', strokeWidth: 1.75, sizePx: 16,
  glowColor: '#EF4444', glowBlurPx: 0, glowIntensityPct: 0,
};

export const DEFAULT_SKIP_INDICATOR_CONFIG: EdgeSkipIndicatorConfig = {
  variant: 'check', color: '#10B981', strokeWidth: 2, sizePx: 24,
  glowColor: '#10B981', glowBlurPx: 6, glowIntensityPct: 110,
  protrudeWidthPx: 34, underlapPx: 20, cardRadiusPx: 9,
  iconOffsetXPx: 0, iconOffsetYPx: -1, enterDurationMs: 220, exitDurationMs: 160,
  autoResetOnKickoff: true,
};

const VALID_SKIP_VARIANTS = new Set<EdgeSkipIndicatorVariant>(['check', 'disconnect', 'packet-loss', 'latency', 'waiting']);

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
    variant: typeof r.variant === 'string' && VALID_SKIP_VARIANTS.has(r.variant as EdgeSkipIndicatorVariant) ? r.variant : base.variant,
    color: typeof r.color === 'string' && r.color.trim().length > 0 ? r.color : base.color,
    strokeWidth: typeof r.strokeWidth === 'number' && Number.isFinite(r.strokeWidth) ? r.strokeWidth : base.strokeWidth,
    sizePx: typeof r.sizePx === 'number' && Number.isFinite(r.sizePx) ? r.sizePx : base.sizePx,
    glowColor:
      typeof r.glowColor === 'string' && r.glowColor.trim().length > 0
        ? r.glowColor
        : typeof r.color === 'string' && r.color.trim().length > 0 ? r.color : base.glowColor,
    glowBlurPx: typeof r.glowBlurPx === 'number' && Number.isFinite(r.glowBlurPx) ? r.glowBlurPx : base.glowBlurPx,
    glowIntensityPct: typeof r.glowIntensityPct === 'number' && Number.isFinite(r.glowIntensityPct) ? r.glowIntensityPct : base.glowIntensityPct,
    protrudeWidthPx: typeof r.protrudeWidthPx === 'number' && Number.isFinite(r.protrudeWidthPx) ? r.protrudeWidthPx : base.protrudeWidthPx,
    underlapPx: typeof r.underlapPx === 'number' && Number.isFinite(r.underlapPx) ? r.underlapPx : base.underlapPx,
    cardRadiusPx: typeof r.cardRadiusPx === 'number' && Number.isFinite(r.cardRadiusPx) ? r.cardRadiusPx : base.cardRadiusPx,
    iconOffsetXPx: typeof r.iconOffsetXPx === 'number' && Number.isFinite(r.iconOffsetXPx) ? r.iconOffsetXPx : base.iconOffsetXPx,
    iconOffsetYPx: typeof r.iconOffsetYPx === 'number' && Number.isFinite(r.iconOffsetYPx) ? r.iconOffsetYPx : base.iconOffsetYPx,
    enterDurationMs: typeof r.enterDurationMs === 'number' && Number.isFinite(r.enterDurationMs) ? r.enterDurationMs : base.enterDurationMs,
    exitDurationMs: typeof r.exitDurationMs === 'number' && Number.isFinite(r.exitDurationMs) ? r.exitDurationMs : base.exitDurationMs,
    autoResetOnKickoff: typeof r.autoResetOnKickoff === 'boolean' ? r.autoResetOnKickoff : base.autoResetOnKickoff,
  };
}

const makeInitialPlayer = (
  slotKey: 1 | 2 | 3 | 4 | 5 | 6,
  team: 'left' | 'right',
  name: string,
  boostAmount: number,
  isSelf = false
): EdgePlayerSlotState => ({
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
