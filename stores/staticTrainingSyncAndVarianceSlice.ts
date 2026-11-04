import {
  type TrainingVarianceConfig,
  type TrainingVariancePresetId,
  type KevpertVarianceEra,
  buildVarianceConfigFromPreset,
  parseBakkesModBindString,
} from '../config/kevpertVariancePresets';
import type { EditSubMode, StaticTrainingShotItem } from './staticTrainingPackStorage';
import type { StaticPackSessionMode } from './staticTrainingShotActions';

export type TrainingSyncAuthorityMode =
  | 'driver-demo'
  | 'retain-ghost-practice'
  | 'free-practice';

export interface SyncAllTrainingTelemetryState {
  authority: {
    localPeerId: string;
    isHost: boolean;
    driverPeerId: string;
    isLocalDriver: boolean;
    authorityMode: TrainingSyncAuthorityMode;
    autoApproveControlRequest: boolean;
    isCameraLinked: boolean;
    pendingRequestPeerId: string | null;
    leaseSeq: number;
  };
  ghostTelemetry: {
    isRecording: boolean;
    currentRecordingFrames: number;
    hasLastAttemptTape: boolean;
    lastAttemptFrameCount: number;
    lastAttemptDurationSec: number;
    pinnedTapeCount: number;
    activePlaybackFrame: number;
    ghostPlaybackEnabled: boolean;
    showGhostCar: boolean;
    showGhostBall: boolean;
    ghostOpacity: number;
    ghostPlacement: 'same' | 'opposite';
    pinnedTapesMeta: Array<{
      tapeId: string;
      label: string;
      authorName: string;
      episodeId: string;
      shotIndex: number;
      frameCount: number;
      durationSec: number;
      paletteIndex?: number;
    }>;
  };
  transferProgress?: {
    artifactHash: string;
    artifactName: string;
    receivedChunks: number;
    totalChunks: number;
    receivedBytes: number;
    totalBytes: number;
    complete: boolean;
  } | null;
  activeEpisodeId: string;
  remoteDriverFramesReceived: number;
}

export interface StaticTrainingPackRuntimeHandlers {
  onShotChanged?: (shotIndex: number) => void;
  onResetShotRequested?: () => void;
  onEditVariableMutated?: (draft: StaticTrainingShotItem) => void;
  onEditSubModeChanged?: (subMode: EditSubMode) => void;
  onSessionModeChanged?: (mode: StaticPackSessionMode) => void;
  onPinGhostRequested?: () => void;
  onClearGhostRequested?: () => void;
  onRetainDisplayAsGhost?: (opts?: {
    replaceExisting?: boolean;
    label?: string;
    switchToStudentPractice?: boolean;
    studentPeerId?: string;
  }) => unknown;
  onClearPinnedGhosts?: () => void;
  onRemovePinnedGhost?: (tapeId: string) => void;
  onToggleGhostPlayback?: (enabled?: boolean) => void;
  onSetGhostPlacement?: (placement: 'same' | 'opposite') => void;
  onSetGhostOpacity?: (opacity: number) => void;
  onSelectTrainingAuthorityMode?: (mode: TrainingSyncAuthorityMode) => void;
  onSetAutoApproveControlRequest?: (enabled: boolean) => void;
  onRequestTrainingControl?: (mode?: TrainingSyncAuthorityMode) => void;
  onTakeBackTrainingControl?: (mode?: TrainingSyncAuthorityMode) => void;
  onSetTrainingCameraLinked?: (linked: boolean) => void;
}

export interface StaticTrainingVarianceStoreSlice {
  sessionMode: StaticPackSessionMode;
  varianceConfig: TrainingVarianceConfig;
  shotAttemptCounter: number;
  retainedGhostLabel: string | null;
  showRetainedGhost: boolean;
  runtimeHandlers: StaticTrainingPackRuntimeHandlers;
  resetCurrentShot: () => void;
}

export function createStaticTrainingVarianceActions<
  TState extends StaticTrainingVarianceStoreSlice
>(
  set: (
    partial:
      | Partial<StaticTrainingVarianceStoreSlice>
      | ((state: TState) => Partial<StaticTrainingVarianceStoreSlice>)
  ) => void,
  get: () => TState
) {
  return {
    setVarianceConfig: (patch: Partial<TrainingVarianceConfig>) => {
      set((s) => ({
        varianceConfig: { ...s.varianceConfig, ...patch },
        shotAttemptCounter: s.shotAttemptCounter + 1,
      }));
      if (get().sessionMode === 'play') {
        get().resetCurrentShot();
      }
    },

    applyKevpertVariancePreset: (
      presetId: TrainingVariancePresetId,
      era?: KevpertVarianceEra
    ) => {
      const current = get().varianceConfig;
      const nextConfig = buildVarianceConfigFromPreset(
        presetId,
        era ?? current.era,
        current.baseSeed
      );
      set((s) => ({
        varianceConfig: nextConfig,
        shotAttemptCounter: s.shotAttemptCounter + 1,
      }));
      if (get().sessionMode === 'play') {
        get().resetCurrentShot();
      }
    },

    applyBakkesModBindString: (raw: string) => {
      const nextConfig = parseBakkesModBindString(raw, get().varianceConfig);
      set((s) => ({
        varianceConfig: nextConfig,
        shotAttemptCounter: s.shotAttemptCounter + 1,
      }));
      if (get().sessionMode === 'play') {
        get().resetCurrentShot();
      }
    },

    pinLastAttemptAsGhost: () => {
      const handlers = get().runtimeHandlers;
      if (typeof handlers.onPinGhostRequested === 'function') {
        handlers.onPinGhostRequested();
      } else {
        handlers.onRetainDisplayAsGhost?.({
          replaceExisting: true,
          switchToStudentPractice: false,
        });
      }
    },

    clearRetainedGhost: () => {
      set({ retainedGhostLabel: null });
      const handlers = get().runtimeHandlers;
      if (typeof handlers.onClearGhostRequested === 'function') {
        handlers.onClearGhostRequested();
      } else {
        handlers.onClearPinnedGhosts?.();
      }
    },

    setShowRetainedGhost: (show: boolean) => {
      const enabled = Boolean(show);
      set({ showRetainedGhost: enabled });
      get().runtimeHandlers.onToggleGhostPlayback?.(enabled);
    },
  };
}
