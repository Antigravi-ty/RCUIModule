export interface DiagnosticProbeTelemetry {
  carIndex: number;
  profile: string;
  label: string;
  pos: [number, number, number];
  angSpeedRad: number;
  isBoosting: boolean;
  posDriftUu: number;
  angVelErrorRad: number;
}

export interface NetworkMetrics {
  rttMs: number;
  uplinkMs: number;
  downlinkMs: number;
  jitterMs: number;
  clientLeadTicks: number;
  serverTick: number;
  clientTick: number;
  deltaTicks: number;
  mispredictions: number;
  corrections: number;
  packetLossPct: number;
  extraUplinkMs: number;
  extraDownlinkMs: number;
  extraRttMs: number;
  extraLatencyMs: number;
  burstDropEnabled: boolean;
  burstDropCount: number;
  burstPeriodMs: number;
  burstDurationMs: number;
  burstDurationPct: number;
  connected: boolean;
  inputBufferDepth: number;
  rollbackWindow: number;
  lastErrorUu: number;
  maxErrorUu: number;
  opponentRttMs: number;
  visualSmoothing: boolean;
  adjustStepMs: number;
  reportRates: string;
  stressPresetId: string;
  impairmentPresetId: string;
  qualityScore: number;
  qualityGrade: string;
  healthState: string;
  packetAgeMs: number;
  neutralFallbackActive: boolean;
  disconnectEvicted: boolean;
  zeroGFleetEnabled: boolean;
  zeroGAnchorMode: string;
  observationTarget: number;
  lobbyGhostMode: boolean;
  testCarAudioEnabled: boolean;
  probeTelemetry: DiagnosticProbeTelemetry[];
}

export interface NetworkDiagnosticsState {
  metrics: NetworkMetrics;
  reconcilerRef: any | null;
  channelRef: any | null;
  runtimeRef: any | null;
}

