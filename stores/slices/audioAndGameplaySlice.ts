import { type StateCreator } from 'zustand';
import { STORAGE_KEYS, safeStorage } from '../../config/storageHelpers';
import { getInitialTrajectory } from '../../config/trainingDefaults';
import { audioConfig } from '../../config/audioConfig';
import { loadStoredBgmPrefs } from '../../config/spatialAudioConfig';
import { type AppState } from '../appStoreTypes';

function getInitialAppAudio() {
  const cfg = audioConfig.config as Record<string, any>;
  const bgmPrefs = loadStoredBgmPrefs();
  const toPct = (v: unknown, defPct: number) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return defPct;
    return n <= 1.5
      ? Math.round(Math.max(0, Math.min(1, n)) * 100)
      : Math.round(Math.max(0, Math.min(100, n)));
  };
  const muteWhenUnfocused =
    cfg.continueAudioOnLostFocus !== undefined ? !cfg.continueAudioOnLostFocus : true;
  return {
    masterVolume: toPct(cfg.masterVolume, 100),
    engineVolume: toPct(cfg.engineVolume, 100),
    boostVolume: toPct(cfg.boostVolume, 80),
    bgmVolume: bgmPrefs.bgmVolume ?? 80,
    muteWhenUnfocused,
    continueAudioOnLostFocus: !muteWhenUnfocused,
    bassGain: Number.isFinite(Number(cfg.eqBass)) ? Number(cfg.eqBass) : 0,
    midGain: Number.isFinite(Number(cfg.eqMid)) ? Number(cfg.eqMid) : 0,
    trebleGain: Number.isFinite(Number(cfg.eqTreble)) ? Number(cfg.eqTreble) : 0,
    hrtfEnabled: cfg.spatialAudio !== undefined ? Boolean(cfg.spatialAudio) : true,
  };
}

export type AudioAndGameplaySlice = Pick<
  AppState,
  | 'audio'
  | 'gameplay'
  | 'trajectory'
  | 'resetGameplay'
  | 'updateAudio'
  | 'updateGameplay'
  | 'updateTrajectory'
>;

export const createAudioAndGameplaySlice: StateCreator<
  AppState,
  [],
  [],
  AudioAndGameplaySlice
> = (set, get) => ({
  audio: getInitialAppAudio(),
  gameplay: {
    goalRestart: true,
    unlimitedBoost: true,
    showCarHitbox: true,
    ballCamIndicator: true,
  },
  trajectory: getInitialTrajectory(),

  resetGameplay: () => {
    const next = {
      goalRestart: true,
      unlimitedBoost: true,
      showCarHitbox: true,
      ballCamIndicator: true,
    };
    get().bridge.onGameplayChange?.(next);
    set({ gameplay: next });
  },

  updateAudio: (patch) => {
    set((s) => {
      const nextAudio = { ...s.audio, ...patch };
      if (patch.muteWhenUnfocused !== undefined) {
        nextAudio.continueAudioOnLostFocus = !patch.muteWhenUnfocused;
      } else if (patch.continueAudioOnLostFocus !== undefined) {
        nextAudio.muteWhenUnfocused = !patch.continueAudioOnLostFocus;
      }
      if (patch.masterVolume !== undefined) {
        audioConfig.set('masterVolume', Math.max(0, Math.min(1, patch.masterVolume / 100)));
      }
      if (patch.engineVolume !== undefined) {
        audioConfig.set('engineVolume', Math.max(0, Math.min(1, patch.engineVolume / 100)));
      }
      if (patch.boostVolume !== undefined) {
        audioConfig.set('boostVolume', Math.max(0, Math.min(1, patch.boostVolume / 100)));
      }
      if (
        nextAudio.continueAudioOnLostFocus !== undefined &&
        (patch.muteWhenUnfocused !== undefined || patch.continueAudioOnLostFocus !== undefined)
      ) {
        audioConfig.set('continueAudioOnLostFocus', Boolean(nextAudio.continueAudioOnLostFocus));
      }
      if (patch.bassGain !== undefined) {
        audioConfig.set('eqBass', patch.bassGain);
      }
      if (patch.midGain !== undefined) {
        audioConfig.set('eqMid', patch.midGain);
      }
      if (patch.trebleGain !== undefined) {
        audioConfig.set('eqTreble', patch.trebleGain);
      }
      if (patch.hrtfEnabled !== undefined) {
        audioConfig.set('spatialAudio', Boolean(patch.hrtfEnabled));
      }
      get().bridge.onAudioChange?.(nextAudio);
      return { audio: nextAudio };
    });
  },

  updateGameplay: (patch) => {
    set((s) => {
      const nextGameplay = { ...s.gameplay, ...patch };
      get().bridge.onGameplayChange?.(nextGameplay);
      return { gameplay: nextGameplay };
    });
  },

  updateTrajectory: (patch) => {
    set((s) => {
      const nextTrajectory = { ...s.trajectory, ...patch };
      safeStorage.set(STORAGE_KEYS.TRAJECTORY, JSON.stringify(nextTrajectory));
      get().bridge.onTrajectoryChange?.(nextTrajectory);
      return { trajectory: nextTrajectory };
    });
  },
});
