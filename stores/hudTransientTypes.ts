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
  /** Whether this player has voted to skip the Goal Replay (renders an inward-facing green SVG glow ready badge) */
  replaySkipReady?: boolean;
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
  leftPlayers: [EdgePlayerSlotState, EdgePlayerSlotState, EdgePlayerSlotState, ...EdgePlayerSlotState[]];
  rightPlayers: [EdgePlayerSlotState, EdgePlayerSlotState, EdgePlayerSlotState, ...EdgePlayerSlotState[]];
}

export type ScoreboardTransientListener = (state: StepperScoreboardState) => void;
export type RosterTransientListener = (state: EdgeRosterHudState) => void;

export interface FlipTransientState {
  hasFlip: boolean;
  /** Supports both UIStorybook 'expired' and RocketCompanion 'none' */
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
