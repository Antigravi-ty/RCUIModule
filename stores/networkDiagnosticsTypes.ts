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

export interface DiagnosticBufferSnapshot {
  isOnlineSession: boolean;
  isLobby: boolean;
  matchState: string;
  isHosting: boolean;
  localPlayerCarIndex: number;
  activeCarMask: number;
  clientFrames: number;
  clientRecordingActive: boolean;
  clientOverflowPaused: boolean;
  maxClientFrames: number;
  autoPauseOnOverflow: boolean;
  telemetryTicks: number;
  maxTelemetryTicks: number;
  starvationCount: number;
  hardResyncCount: number;
  serverFrames: number;
}

export interface DiagnosticDumpExportOptions {
  includeClientReplay: boolean;
  includeReconcileTelemetry: boolean;
  includeServerReplay: boolean;
}

export interface NetworkDiagnosticsBridge {
  onToggleZeroGFleet?: (enabled: boolean, anchorMode: string) => void | Promise<void>;
  onSampleZeroGFleetTelemetry?: () => DiagnosticProbeTelemetry[];
  onSetZeroGAnchorMode?: (anchorMode: string) => void | Promise<void>;
  onSetObservationTarget?: (targetCarIndex: number) => void;
  onSetTestCarAudioEnabled?: (enabled: boolean) => void;
  onSetLobbyGhostMode?: (enabled: boolean) => void;
  onDumpNextPacket?: () => void;
  onDumpLatestPacket?: () => void;
  onTriggerBurstDrop?: (count: number) => void;
  onSetDiagnosticMaxCapacity?: (frames: number) => void;
  onSetDiagnosticAutoPauseOverflow?: (enabled: boolean) => void;
  onToggleDiagnosticRecordingPause?: (recordingActive: boolean) => void;
  onClearDiagnosticBuffers?: () => void;
  onExportUnifiedDiagnosticDump?: (options: DiagnosticDumpExportOptions) => string | void;
  onExportStandaloneClientReplay?: () => string | void;
  onExportStandaloneTelemetry?: () => string | void;
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
  diagnosticBuffers: DiagnosticBufferSnapshot;
}

export interface NetworkDiagnosticsState {
  metrics: NetworkMetrics;
  reconcilerRef: any | null;
  channelRef: any | null;
  bridge: NetworkDiagnosticsBridge;
}

export const DEFAULT_DIAGNOSTIC_BUFFER_SNAPSHOT: DiagnosticBufferSnapshot = {
  isOnlineSession: false,
  isLobby: false,
  matchState: 'FREEPLAY',
  isHosting: false,
  localPlayerCarIndex: 0,
  activeCarMask: 0x03,
  clientFrames: 4320,
  clientRecordingActive: true,
  clientOverflowPaused: false,
  maxClientFrames: 36000,
  autoPauseOnOverflow: true,
  telemetryTicks: 4320,
  maxTelemetryTicks: 36000,
  starvationCount: 0,
  hardResyncCount: 0,
  serverFrames: 4320,
};

