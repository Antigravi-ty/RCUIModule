import { create } from 'zustand';
import {
  DEFAULT_ANTHEM_ID,
  DEFAULT_RANDOM_ANTHEM_SCOPE,
  DEFAULT_RANDOM_ANTHEM_CATEGORY,
  DEFAULT_SPATIAL_AUDIO_TUNER_CONFIG,
  type RandomAnthemScope,
  type SpatialAudioTunerConfig,
  type StoredBgmPrefs,
  type BgmSceneConfig,
  loadStoredPlayerAnthem,
  saveStoredPlayerAnthem,
  loadStoredRandomAnthemPrefs,
  saveStoredRandomAnthemPrefs,
  loadStoredBgmPrefs,
  saveStoredBgmPrefs,
  loadStoredSpatialAudioTunerConfig,
  saveStoredSpatialAudioTunerConfig,
  parseBgmFileMetadata,
} from '../config/spatialAudioConfig';
import { audioConfig } from '../config/audioConfig.js';
import { updateReplayDirectorConfig } from '../config/replayDirectorConfig.js';

export interface BgmUploadedTrack {
  id: string;
  rawName: string;
  title: string;
  volume: string | null;
  trackNum: number | null;
  file: File;
}

export interface SpatialAudioRuntimeCallbacks {
  onPreviewAnthem?: (anthemId: string) => void;
  onStopPreviewAnthem?: () => void;
  onSelectBgmTrack?: (trackId: string) => void;
  onNextBgmTrack?: () => void;
  onPrevBgmTrack?: () => void;
  onToggleBgmPlayPause?: () => void;
  onBgmPrefsChanged?: () => void;
  onBgmFilesUploaded?: (tracks: BgmUploadedTrack[]) => void;
  onTunerConfigChanged?: (config: SpatialAudioTunerConfig) => void;
}

export interface SpatialAudioStoreState {
  // 1. Player Anthem State
  selectedAnthem: string;
  randomAnthemScope: RandomAnthemScope;
  randomAnthemCategory: string;
  isGarageAnthemTabActive: boolean;
  previewingAnthemId: string | null;
  activeGoalAnthemId: string | null;
  anthemLinearPhase: number;
  anthemBlend: number;
  isGoalReplaySkipped: boolean;

  // 2. Background Music State
  bgmEnabled: boolean;
  bgmVolume: number;
  bgmScenes: BgmSceneConfig;
  realisticBgmEnabled: boolean;
  bgmCategorizedMode: boolean;
  bgmDeselectedVolumes: string[];
  bgmDeselectedTrackNames: string[];
  bgmTracks: BgmUploadedTrack[];
  bgmVolumes: string[];
  bgmCurrentTrackId: string | null;
  bgmCurrentTrackTitle: string | null;
  bgmIsPlaying: boolean;
  bgmLinearPhase: number;
  bgmBlend: number;

  // 3. Spatial Audio Active Tuner State
  tunerConfig: SpatialAudioTunerConfig;

  // 4. Runtime Callbacks
  runtimeCallbacks: SpatialAudioRuntimeCallbacks;

  // Actions — Player Anthem
  setSelectedAnthem: (anthemId: string) => void;
  setRandomAnthemScope: (scope: RandomAnthemScope) => void;
  setRandomAnthemCategory: (category: string) => void;
  setGarageAnthemTabActive: (active: boolean) => void;
  togglePreviewAnthem: (anthemId: string) => void;
  stopPreviewAnthem: () => void;
  setPreviewingAnthemId: (anthemId: string | null) => void;
  setActiveGoalAnthemId: (anthemId: string | null) => void;
  setAnthemTransitionState: (linearPhase: number, blend: number) => void;
  setGoalReplaySkipped: (skipped: boolean) => void;

  // Actions — Background Music
  setBgmEnabled: (enabled: boolean) => void;
  setBgmVolume: (volume: number) => void;
  setBgmSceneEnabled: (sceneKey: keyof BgmSceneConfig, enabled: boolean) => void;
  toggleBgmScene: (sceneKey: keyof BgmSceneConfig) => void;
  setRealisticBgmEnabled: (enabled: boolean) => void;
  setBgmCategorizedMode: (categorized: boolean) => void;
  uploadBgmFiles: (files: FileList | File[]) => void;
  toggleBgmVolume: (volumeKey: string) => void;
  setAllBgmVolumes: (selected: boolean) => void;
  toggleBgmTrack: (rawName: string) => void;
  setAllBgmTracks: (selected: boolean, targetRawNames?: string[]) => void;
  playSpecificBgmTrack: (trackId: string) => void;
  nextBgmTrack: () => void;
  prevBgmTrack: () => void;
  toggleBgmPlayPause: () => void;
  setBgmPlaybackState: (patch: {
    currentTrackId?: string | null;
    currentTrackTitle?: string | null;
    isPlaying?: boolean;
  }) => void;
  setBgmTransitionState: (linearPhase: number, blend: number) => void;

  // Actions — Spatial Audio Tuner
  updateTunerConfig: (patch: Partial<SpatialAudioTunerConfig>) => void;
  resetTunerConfig: () => void;

  // Actions — Runtime Registration
  registerRuntimeCallbacks: (callbacks: SpatialAudioRuntimeCallbacks) => void;
}

const initialBgmPrefs = loadStoredBgmPrefs();
const initialRandomAnthemPrefs = loadStoredRandomAnthemPrefs();

function persistBgmPrefsFromState(state: {
  realisticBgmEnabled: boolean;
  bgmCategorizedMode: boolean;
  bgmDeselectedVolumes: string[];
  bgmDeselectedTrackNames: string[];
  bgmVolume: number;
  bgmScenes: BgmSceneConfig;
}) {
  const prefs: StoredBgmPrefs = {
    realisticBgmEnabled: state.realisticBgmEnabled,
    categorizedMode: state.bgmCategorizedMode,
    deselectedVolumes: state.bgmDeselectedVolumes,
    deselectedTrackNames: state.bgmDeselectedTrackNames,
    bgmVolume: state.bgmVolume,
    bgmScenes: state.bgmScenes,
  };
  saveStoredBgmPrefs(prefs);
}

const AUDIO_FILE_EXTENSIONS = /\.(mp3|wav|ogg|m4a|flac|aac|opus|webm)$/i;

export const useSpatialAudioStore = create<SpatialAudioStoreState>((set, get) => ({
  selectedAnthem: loadStoredPlayerAnthem() || DEFAULT_ANTHEM_ID,
  randomAnthemScope: initialRandomAnthemPrefs.scope || DEFAULT_RANDOM_ANTHEM_SCOPE,
  randomAnthemCategory: initialRandomAnthemPrefs.category || DEFAULT_RANDOM_ANTHEM_CATEGORY,
  isGarageAnthemTabActive: false,
  previewingAnthemId: null,
  activeGoalAnthemId: null,
  anthemLinearPhase: 0,
  anthemBlend: 0,
  isGoalReplaySkipped: false,

  bgmEnabled: false,
  bgmVolume: initialBgmPrefs.bgmVolume,
  bgmScenes: initialBgmPrefs.bgmScenes,
  realisticBgmEnabled: initialBgmPrefs.realisticBgmEnabled,
  bgmCategorizedMode: initialBgmPrefs.categorizedMode,
  bgmDeselectedVolumes: initialBgmPrefs.deselectedVolumes,
  bgmDeselectedTrackNames: initialBgmPrefs.deselectedTrackNames,
  bgmTracks: [],
  bgmVolumes: [],
  bgmCurrentTrackId: null,
  bgmCurrentTrackTitle: null,
  bgmIsPlaying: false,
  bgmLinearPhase: 1,
  bgmBlend: 1,

  tunerConfig: loadStoredSpatialAudioTunerConfig(),

  runtimeCallbacks: {},

  setSelectedAnthem: (anthemId) => {
    const normalized = saveStoredPlayerAnthem(anthemId);
    set({ selectedAnthem: normalized });
  },

  setRandomAnthemScope: (scope) => {
    const saved = saveStoredRandomAnthemPrefs({ scope });
    set({ randomAnthemScope: saved.scope });
    const { previewingAnthemId, runtimeCallbacks } = get();
    if (previewingAnthemId === 'random') {
      runtimeCallbacks.onPreviewAnthem?.('random');
    }
  },

  setRandomAnthemCategory: (category) => {
    const saved = saveStoredRandomAnthemPrefs({ category });
    set({ randomAnthemCategory: saved.category });
    const { previewingAnthemId, runtimeCallbacks } = get();
    if (previewingAnthemId === 'random') {
      runtimeCallbacks.onPreviewAnthem?.('random');
    }
  },

  setGarageAnthemTabActive: (active) => {
    const next = Boolean(active);
    if (get().isGarageAnthemTabActive === next) return;
    set({ isGarageAnthemTabActive: next });
    get().runtimeCallbacks.onBgmPrefsChanged?.();
  },

  togglePreviewAnthem: (anthemId) => {
    const { previewingAnthemId, runtimeCallbacks } = get();
    if (previewingAnthemId === anthemId || anthemId === 'none') {
      set({ previewingAnthemId: null });
      runtimeCallbacks.onStopPreviewAnthem?.();
    } else {
      set({ previewingAnthemId: anthemId });
      runtimeCallbacks.onPreviewAnthem?.(anthemId);
    }
  },

  stopPreviewAnthem: () => {
    const { previewingAnthemId, runtimeCallbacks } = get();
    if (previewingAnthemId !== null) {
      set({ previewingAnthemId: null });
    }
    runtimeCallbacks.onStopPreviewAnthem?.();
  },

  setPreviewingAnthemId: (anthemId) => {
    set({ previewingAnthemId: anthemId });
  },

  setActiveGoalAnthemId: (anthemId) => {
    set({ activeGoalAnthemId: anthemId });
  },

  setAnthemTransitionState: (linearPhase, blend) => {
    set({ anthemLinearPhase: linearPhase, anthemBlend: blend });
  },

  setGoalReplaySkipped: (skipped) => {
    set({ isGoalReplaySkipped: skipped });
  },

  setBgmEnabled: (enabled) => {
    set({ bgmEnabled: enabled });
    get().runtimeCallbacks.onBgmPrefsChanged?.();
  },

  setBgmVolume: (volume) => {
    const clamped = Math.max(0, Math.min(100, Math.round(Number(volume) || 0)));
    set((state) => {
      const next = { ...state, bgmVolume: clamped };
      persistBgmPrefsFromState(next);
      return { bgmVolume: clamped };
    });
    get().runtimeCallbacks.onBgmPrefsChanged?.();
  },

  setBgmSceneEnabled: (sceneKey, enabled) => {
    set((state) => {
      const nextScenes: BgmSceneConfig = {
        ...state.bgmScenes,
        [sceneKey]: Boolean(enabled),
      };
      const next = { ...state, bgmScenes: nextScenes };
      persistBgmPrefsFromState(next);
      return { bgmScenes: nextScenes };
    });
    get().runtimeCallbacks.onBgmPrefsChanged?.();
  },

  toggleBgmScene: (sceneKey) => {
    set((state) => {
      const nextScenes: BgmSceneConfig = {
        ...state.bgmScenes,
        [sceneKey]: !state.bgmScenes[sceneKey],
      };
      const next = { ...state, bgmScenes: nextScenes };
      persistBgmPrefsFromState(next);
      return { bgmScenes: nextScenes };
    });
    get().runtimeCallbacks.onBgmPrefsChanged?.();
  },

  setRealisticBgmEnabled: (realistic) => {
    set((state) => {
      const next = { ...state, realisticBgmEnabled: realistic };
      persistBgmPrefsFromState(next);
      return { realisticBgmEnabled: realistic };
    });
    get().runtimeCallbacks.onBgmPrefsChanged?.();
  },

  setBgmCategorizedMode: (categorized) => {
    set((state) => {
      const next = { ...state, bgmCategorizedMode: categorized };
      persistBgmPrefsFromState(next);
      return { bgmCategorizedMode: categorized };
    });
    get().runtimeCallbacks.onBgmPrefsChanged?.();
  },

  uploadBgmFiles: (fileList) => {
    const rawFiles = Array.from<File>(fileList as ArrayLike<File>).filter(
      (file) => file.type.startsWith('audio/') || AUDIO_FILE_EXTENSIONS.test(file.name)
    );
    if (rawFiles.length === 0) return;

    const parsedTracks: BgmUploadedTrack[] = rawFiles.map((file, idx) => {
      const meta = parseBgmFileMetadata(file.name);
      const isUncat = meta.vol === 'Uncategorized';
      return {
        id: `bgm-${idx}-${file.name}`,
        rawName: file.name,
        title: meta.cleanTitle,
        volume: isUncat ? null : meta.vol,
        trackNum: isUncat ? null : meta.trackNum,
        file,
      };
    });

    parsedTracks.sort((a, b) => {
      if (a.volume !== null && b.volume !== null) {
        if (a.volume !== b.volume) return Number(a.volume) - Number(b.volume);
        return (a.trackNum ?? 0) - (b.trackNum ?? 0);
      }
      if (a.volume !== null) return -1;
      if (b.volume !== null) return 1;
      return a.title.localeCompare(b.title);
    });

    const volumeSet = new Set<string>();
    let hasUncategorized = false;
    for (const t of parsedTracks) {
      if (t.volume !== null) {
        volumeSet.add(t.volume);
      } else {
        hasUncategorized = true;
      }
    }
    const sortedVolumes = Array.from(volumeSet).sort((a, b) => Number(a) - Number(b));
    if (hasUncategorized) {
      sortedVolumes.push('uncategorized');
    }

    const hasCategorizedVolumes = volumeSet.size > 0;

    set((state) => {
      const nextCategorizedMode = hasCategorizedVolumes ? state.bgmCategorizedMode : false;
      const next = {
        ...state,
        bgmTracks: parsedTracks,
        bgmVolumes: sortedVolumes,
        bgmCategorizedMode: nextCategorizedMode,
      };
      persistBgmPrefsFromState(next);
      return {
        bgmTracks: parsedTracks,
        bgmVolumes: sortedVolumes,
        bgmCategorizedMode: nextCategorizedMode,
      };
    });

    const { runtimeCallbacks } = get();
    runtimeCallbacks.onBgmFilesUploaded?.(parsedTracks);
    runtimeCallbacks.onBgmPrefsChanged?.();
  },

  toggleBgmVolume: (volumeKey) => {
    set((state) => {
      const exists = state.bgmDeselectedVolumes.includes(volumeKey);
      const nextDeselected = exists
        ? state.bgmDeselectedVolumes.filter((v) => v !== volumeKey)
        : [...state.bgmDeselectedVolumes, volumeKey];
      const next = { ...state, bgmDeselectedVolumes: nextDeselected };
      persistBgmPrefsFromState(next);
      return { bgmDeselectedVolumes: nextDeselected };
    });
    get().runtimeCallbacks.onBgmPrefsChanged?.();
  },

  setAllBgmVolumes: (selected) => {
    set((state) => {
      const nextDeselected = selected ? [] : [...state.bgmVolumes];
      const next = { ...state, bgmDeselectedVolumes: nextDeselected };
      persistBgmPrefsFromState(next);
      return { bgmDeselectedVolumes: nextDeselected };
    });
    get().runtimeCallbacks.onBgmPrefsChanged?.();
  },

  toggleBgmTrack: (rawName) => {
    set((state) => {
      const exists = state.bgmDeselectedTrackNames.includes(rawName);
      const nextDeselected = exists
        ? state.bgmDeselectedTrackNames.filter((n) => n !== rawName)
        : [...state.bgmDeselectedTrackNames, rawName];
      const next = { ...state, bgmDeselectedTrackNames: nextDeselected };
      persistBgmPrefsFromState(next);
      return { bgmDeselectedTrackNames: nextDeselected };
    });
    get().runtimeCallbacks.onBgmPrefsChanged?.();
  },

  setAllBgmTracks: (selected, targetRawNames) => {
    set((state) => {
      const scopeNames = targetRawNames ?? state.bgmTracks.map((t) => t.rawName);
      const scopeSet = new Set(scopeNames);
      let nextDeselected: string[];
      if (selected) {
        nextDeselected = state.bgmDeselectedTrackNames.filter((n) => !scopeSet.has(n));
      } else {
        const union = new Set([...state.bgmDeselectedTrackNames, ...scopeNames]);
        nextDeselected = Array.from(union);
      }
      const next = { ...state, bgmDeselectedTrackNames: nextDeselected };
      persistBgmPrefsFromState(next);
      return { bgmDeselectedTrackNames: nextDeselected };
    });
    get().runtimeCallbacks.onBgmPrefsChanged?.();
  },

  playSpecificBgmTrack: (trackId) => {
    get().runtimeCallbacks.onSelectBgmTrack?.(trackId);
  },

  nextBgmTrack: () => {
    get().runtimeCallbacks.onNextBgmTrack?.();
  },

  prevBgmTrack: () => {
    get().runtimeCallbacks.onPrevBgmTrack?.();
  },

  toggleBgmPlayPause: () => {
    get().runtimeCallbacks.onToggleBgmPlayPause?.();
  },

  setBgmPlaybackState: (patch) => {
    set((state) => ({
      bgmCurrentTrackId:
        patch.currentTrackId !== undefined ? patch.currentTrackId : state.bgmCurrentTrackId,
      bgmCurrentTrackTitle:
        patch.currentTrackTitle !== undefined ? patch.currentTrackTitle : state.bgmCurrentTrackTitle,
      bgmIsPlaying: patch.isPlaying !== undefined ? patch.isPlaying : state.bgmIsPlaying,
    }));
  },

  setBgmTransitionState: (linearPhase, blend) => {
    set({ bgmLinearPhase: linearPhase, bgmBlend: blend });
  },

  updateTunerConfig: (patch) => {
    const merged: SpatialAudioTunerConfig = {
      ...get().tunerConfig,
      ...patch,
    };
    const nextConfig = saveStoredSpatialAudioTunerConfig(merged);
    if (typeof patch.muteSignalAudioInGoalReplay === 'boolean') {
      try {
        audioConfig.set('muteSignalAudioInGoalReplay', nextConfig.muteSignalAudioInGoalReplay);
        updateReplayDirectorConfig({
          muteSignalAudioInGoalReplay: nextConfig.muteSignalAudioInGoalReplay,
        });
      } catch {
        // Ignore if unavailable
      }
    }
    set({ tunerConfig: nextConfig });
    get().runtimeCallbacks.onTunerConfigChanged?.(nextConfig);
  },

  resetTunerConfig: () => {
    const nextConfig: SpatialAudioTunerConfig = { ...DEFAULT_SPATIAL_AUDIO_TUNER_CONFIG };
    saveStoredSpatialAudioTunerConfig(nextConfig);
    try {
      audioConfig.set('muteSignalAudioInGoalReplay', nextConfig.muteSignalAudioInGoalReplay);
      updateReplayDirectorConfig({
        muteSignalAudioInGoalReplay: nextConfig.muteSignalAudioInGoalReplay,
      });
    } catch {
      // Ignore if unavailable
    }
    set({ tunerConfig: nextConfig });
    get().runtimeCallbacks.onTunerConfigChanged?.(nextConfig);
  },

  registerRuntimeCallbacks: (callbacks) => {
    set({ runtimeCallbacks: callbacks });
  },
}));

/**
 * Helper to compute the active filtered playlist of BGM tracks based on current store preferences.
 */
export function getFilteredBgmTracks(state: {
  bgmTracks: BgmUploadedTrack[];
  bgmCategorizedMode: boolean;
  bgmDeselectedVolumes: string[];
  bgmDeselectedTrackNames: string[];
}): BgmUploadedTrack[] {
  const deselectedVolumes = new Set(state.bgmDeselectedVolumes);
  const deselectedTracks = new Set(state.bgmDeselectedTrackNames);

  return state.bgmTracks.filter((track) => {
    if (deselectedTracks.has(track.rawName)) return false;
    if (state.bgmCategorizedMode) {
      const volKey = track.volume ?? 'uncategorized';
      if (deselectedVolumes.has(volKey)) return false;
    }
    return true;
  });
}
