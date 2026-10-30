import { create } from 'zustand';
import { floatingStore } from './floatingStore';
import { FLOATING_WINDOW_OPACITY_PRESET } from './floatingPresets';
import {
  DEFAULT_DRIFTWOODS_CONFIG,
  cloneDriftwoodsConfig,
  mergeDriftwoodsConfig,
  type DriftwoodsTunerConfig,
} from '../config/driftwoodsConfig';
import { STORAGE_KEYS, safeStorage } from '../config/storageHelpers';
import { DEFAULT_CAMERA_SETTINGS } from '../config/cameraDefaults.js';
import { getInitialTheme } from '../config/themeConfig.js';
import { getInitialCar, loadStoredPlayerName } from '../config/vehiclePresets.js';
import {
  type ClockPacingMode,
  type ClockPacingPriority,
  type ClockPacingParams,
  DEFAULT_CLOCK_PACING_PARAMS,
  CLOCK_PACING_PRIORITY_PRESETS,
  resolveEffectiveClockPacingParams,
  saveCustomClockPacingParams,
  getInitialClockPacingMode,
  getInitialClockPacingPriority,
  getInitialCustomClockPacingParams,
} from '../config/clockPacingConfig';
import {
  type ActiveMenuRoute,
  ROUTE_PARENT_MAP,
  getMaterialsConfig,
  setMaterialsConfig,
  DEFAULT_MATERIALS_CONFIG,
  DEFAULT_TRAJECTORY_CONFIG,
  DEFAULT_BOOST_PAD_TUNER_CONFIG,
  DEFAULT_TELEMETRY_CONFIG,
  getInitialCamera,
  getInitialTrajectory,
  getInitialGraphics,
  getInitialMaterials,
  getInitialTelemetry,
  getInitialDeveloperMode,
  getInitialTouchMode,
  getInitialTouchHeadlessMode,
  type TouchInputAgentMode,
  getInitialBoostPadTuner,
  getInitialDriftwoodsTuner,
  getInitialInputBufferTarget,
  getInitialInputBufferThreshold,
} from '../config/uiConfig';
import { type AppState } from './appStoreTypes';
import { audioConfig } from '../config/audioConfig.js';
import { loadStoredBgmPrefs } from '../config/spatialAudioConfig';

function getInitialAppAudio() {
  const cfg = audioConfig.config as Record<string, any>;
  const bgmPrefs = loadStoredBgmPrefs();
  const toPct = (v: unknown, defPct: number) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return defPct;
    return n <= 1.5 ? Math.round(Math.max(0, Math.min(1, n)) * 100) : Math.round(Math.max(0, Math.min(100, n)));
  };
  const muteWhenUnfocused = cfg.continueAudioOnLostFocus !== undefined ? !cfg.continueAudioOnLostFocus : true;
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

export const initialTheme = getInitialTheme();
if (typeof document !== 'undefined') {
  document.documentElement.dataset.theme = initialTheme;
  document.documentElement.classList.toggle('light', initialTheme === 'light');
  document.documentElement.classList.toggle('dark', initialTheme === 'dark');
}

let lastToggleMenuTime = 0;
let lastExpMultiBotsParentRoute: 'main-menu' | 'settings' = 'settings';
let lastDevSubsystemIsolationParentRoute: 'settings' | 'dev-sandboxes' = 'dev-sandboxes';

export const useAppStore = create<AppState>((set, get) => ({
  isOpen: false,
  activeRoute: 'main-menu',
  transitionMode: 'fluid-morph',
  activeCar: getInitialCar(),
  theme: initialTheme,
  matchMode: 'freeplay',
  setMatchMode: (mode) => set({ matchMode: mode }),
  onlineSession: {
    isHosting: false,
    roomId: '',
    playerName: loadStoredPlayerName(),
    signalingConnected: false,
    roomType: 'match',
    gameMode: '3v3',
    botFillMode: 'auto_fill',
    matchDurationSeconds: 90,
    isReady: false,
    connectedPeers: [],
  },
  setOnlineSession: (session) =>
    set((s) => ({ onlineSession: { ...s.onlineSession, ...session } })),
  renderScale: getInitialGraphics().renderScale ?? 50,
  setRenderScale: (scale) => get().updateGraphics({ renderScale: scale }),

  camera: getInitialCamera(),

  graphics: getInitialGraphics(),

  audio: getInitialAppAudio(),

  gameplay: {
    goalRestart: true,
    unlimitedBoost: true,
    showCarHitbox: true,
    ballCamIndicator: true,
  },

  trajectory: getInitialTrajectory(),
  materials: getInitialMaterials(),
  telemetry: getInitialTelemetry(),
  boostPadTuner: getInitialBoostPadTuner(),
  driftwoodsTuner: getInitialDriftwoodsTuner(),
  underDevelopment: {
    threeWheelsEnabled: false,
    stadiumPreset: 'standard',
    showThrowbackCollisionOverlay: false,
    selectedBoostCarIndex: 0,
    perCarBoostConfigs: {
      0: { unlimitedBoost: true, boostCollectable: true, rechargeBoostEnabled: false, rechargeBoostPerSecond: 10.0, rechargeBoostDelay: 0.25 },
      1: { unlimitedBoost: true, boostCollectable: true, rechargeBoostEnabled: false, rechargeBoostPerSecond: 10.0, rechargeBoostDelay: 0.25 },
      2: { unlimitedBoost: true, boostCollectable: true, rechargeBoostEnabled: false, rechargeBoostPerSecond: 10.0, rechargeBoostDelay: 0.25 },
      3: { unlimitedBoost: true, boostCollectable: true, rechargeBoostEnabled: false, rechargeBoostPerSecond: 10.0, rechargeBoostDelay: 0.25 },
      4: { unlimitedBoost: true, boostCollectable: true, rechargeBoostEnabled: false, rechargeBoostPerSecond: 10.0, rechargeBoostDelay: 0.25 },
      5: { unlimitedBoost: true, boostCollectable: true, rechargeBoostEnabled: false, rechargeBoostPerSecond: 10.0, rechargeBoostDelay: 0.25 },
      6: { unlimitedBoost: true, boostCollectable: true, rechargeBoostEnabled: false, rechargeBoostPerSecond: 10.0, rechargeBoostDelay: 0.25 },
      7: { unlimitedBoost: true, boostCollectable: true, rechargeBoostEnabled: false, rechargeBoostPerSecond: 10.0, rechargeBoostDelay: 0.25 },
    },
  },

  highlightSetting: null,
  settingsTargetTab: 'gameplay',

  isLivePreviewCollapsed: false,
  bridge: {},

  developerMode: getInitialDeveloperMode(),
  setDeveloperMode: (mode) => {
    set({ developerMode: mode });
    if (mode) {
      const existing = floatingStore.getSnapshot().windows.some((w) => w.id === FLOATING_WINDOW_OPACITY_PRESET.id);
      if (!existing) {
        floatingStore.spawnWindow({
          ...FLOATING_WINDOW_OPACITY_PRESET,
          startMinimized: true,
        });
      }
    }
  },
  touchMode: getInitialTouchMode(),
  touchHeadlessMode: getInitialTouchHeadlessMode(),
  touchInputAgent: 'none',
  setTouchInputAgent: (agent: TouchInputAgentMode) => set({ touchInputAgent: agent }),
  clockPacingMode: getInitialClockPacingMode(),
  setClockPacingMode: (mode: ClockPacingMode) => {
    if (mode === 'custom' && !get().developerMode && get().clockPacingMode !== 'custom') {
      return;
    }
    safeStorage.set?.(STORAGE_KEYS.CLOCK_PACING, mode);
    set({ clockPacingMode: mode });
    const s = get();
    const effective = resolveEffectiveClockPacingParams(
      mode,
      s.clockPacingPriority,
      s.inputBufferTarget,
      s.inputBufferThreshold,
      s.customClockPacingParams
    );
    s.bridge.onClockPacingModeChange?.(mode);
    s.bridge.onClockPacingParamsChange?.(effective);
  },
  clockPacingPriority: getInitialClockPacingPriority(),
  setClockPacingPriority: (priority: ClockPacingPriority) => {
    const preset = CLOCK_PACING_PRIORITY_PRESETS[priority] || CLOCK_PACING_PRIORITY_PRESETS.balanced;
    const nextTarget = preset.targetBufferTicks;
    const nextThreshold: [number, number] = [preset.deadband[0], preset.deadband[1]];
    safeStorage.set?.(STORAGE_KEYS.CLOCK_PACING_PRIORITY, priority);
    safeStorage.set?.(STORAGE_KEYS.INPUT_BUFFER_TARGET, nextTarget);
    safeStorage.set?.(STORAGE_KEYS.INPUT_BUFFER_THRESHOLD, JSON.stringify(nextThreshold));
    set({
      clockPacingPriority: priority,
      inputBufferTarget: nextTarget,
      inputBufferThreshold: nextThreshold,
    });
    const s = get();
    const effective = resolveEffectiveClockPacingParams(
      s.clockPacingMode,
      priority,
      nextTarget,
      nextThreshold,
      s.customClockPacingParams
    );
    s.bridge.onClockPacingPriorityChange?.(priority);
    s.bridge.onInputBufferTargetChange?.(nextTarget);
    s.bridge.onInputBufferThresholdChange?.(nextThreshold);
    s.bridge.onClockPacingParamsChange?.(effective);
  },
  customClockPacingParams: getInitialCustomClockPacingParams(),
  updateCustomClockPacingParams: (patch: Partial<ClockPacingParams>) => {
    const current = get().customClockPacingParams;
    const nextCustom = saveCustomClockPacingParams({ ...current, ...patch });
    safeStorage.set?.(STORAGE_KEYS.CLOCK_PACING, 'custom');
    set({
      customClockPacingParams: nextCustom,
      clockPacingMode: 'custom',
    });
    const s = get();
    s.bridge.onClockPacingModeChange?.('custom');
    s.bridge.onClockPacingParamsChange?.(nextCustom);
  },
  resetCustomClockPacingParams: () => {
    const reset = saveCustomClockPacingParams({ ...DEFAULT_CLOCK_PACING_PARAMS });
    set({ customClockPacingParams: reset });
    const s = get();
    const effective = resolveEffectiveClockPacingParams(
      s.clockPacingMode,
      s.clockPacingPriority,
      s.inputBufferTarget,
      s.inputBufferThreshold,
      reset
    );
    s.bridge.onClockPacingParamsChange?.(effective);
  },
  inputBufferTarget: getInitialInputBufferTarget(),
  setInputBufferTarget: (target: number) => {
    const clamped = Math.max(1, Math.min(6, Math.round(target)));
    safeStorage.set?.(STORAGE_KEYS.INPUT_BUFFER_TARGET, clamped);
    const currentThreshold = get().inputBufferThreshold;
    const nextCatchup = Math.max(-clamped, Math.min(0, currentThreshold[0]));
    const nextSkip = Math.max(0, Math.min(clamped, currentThreshold[1]));
    const nextThreshold: [number, number] = [nextCatchup, nextSkip];
    safeStorage.set?.(STORAGE_KEYS.INPUT_BUFFER_THRESHOLD, JSON.stringify(nextThreshold));
    set({ inputBufferTarget: clamped, inputBufferThreshold: nextThreshold });
    const s = get();
    const effective = resolveEffectiveClockPacingParams(
      s.clockPacingMode,
      s.clockPacingPriority,
      clamped,
      nextThreshold,
      s.customClockPacingParams
    );
    s.bridge.onInputBufferTargetChange?.(clamped);
    s.bridge.onInputBufferThresholdChange?.(nextThreshold);
    s.bridge.onClockPacingParamsChange?.(effective);
  },
  inputBufferThreshold: getInitialInputBufferThreshold(),
  setInputBufferThreshold: (range: [number, number]) => {
    const alpha = get().inputBufferTarget;
    const catchup = Math.max(-alpha, Math.min(0, Math.round(range[0])));
    const skip = Math.max(0, Math.min(alpha, Math.round(range[1])));
    const clamped: [number, number] = [catchup, skip];
    safeStorage.set?.(STORAGE_KEYS.INPUT_BUFFER_THRESHOLD, JSON.stringify(clamped));
    set({ inputBufferThreshold: clamped });
    const s = get();
    const effective = resolveEffectiveClockPacingParams(
      s.clockPacingMode,
      s.clockPacingPriority,
      s.inputBufferTarget,
      clamped,
      s.customClockPacingParams
    );
    s.bridge.onInputBufferThresholdChange?.(clamped);
    s.bridge.onClockPacingParamsChange?.(effective);
  },
  resetGameplay: () => {
    const next = { goalRestart: true, unlimitedBoost: true, showCarHitbox: true, ballCamIndicator: true };
    get().bridge.onGameplayChange?.(next);
    set({ gameplay: next });
  },

  setHighlightSetting: (id) => set({ highlightSetting: id }),
  clearHighlightSetting: () => set({ highlightSetting: null }),
  setSettingsTargetTab: (tab) => set({ settingsTargetTab: tab }),

  setBridge: (bridge) => set((state) => ({ bridge: { ...state.bridge, ...bridge } })),

  openMenu: (route = 'main-menu') => {
    set({ isOpen: true, activeRoute: route, isLivePreviewCollapsed: false });
    get().bridge.onOverlayChange?.(true);
    floatingStore.triggerBatchMinimize();
  },

  closeMenu: () => {
    set({ isOpen: false, activeRoute: 'main-menu', isLivePreviewCollapsed: false });
    const b = get().bridge;
    b.onOverlayChange?.(false);
    b.onResume?.();
  },

  toggleMenu: () => {
    const now = Date.now();
    if (now - lastToggleMenuTime < 180) {
      return;
    }
    lastToggleMenuTime = now;
    const state = get();
    if (state.isOpen) {
      if (state.isLivePreviewCollapsed) {
        state.setLivePreviewCollapsed(false);
      } else {
        state.goBack();
      }
    } else {
      state.openMenu('main-menu');
    }
  },

  navigate: (route) => {
    const current = get().activeRoute;
    const wasCollapsed = get().isLivePreviewCollapsed;
    if (route === 'exp-multi-bots-config') {
      lastExpMultiBotsParentRoute = current === 'main-menu' ? 'main-menu' : 'settings';
    }
    set({ activeRoute: route, isLivePreviewCollapsed: false });
    floatingStore.triggerBatchMinimize();
    if (wasCollapsed) {
      get().bridge.onOverlayChange?.(true);
    }
  },

  goBack: () => {
    const current = get().activeRoute;
    const wasCollapsed = get().isLivePreviewCollapsed;
    if (current === 'exp-multi-bots-config') {
      set({ activeRoute: lastExpMultiBotsParentRoute, isLivePreviewCollapsed: false });
      floatingStore.triggerBatchMinimize();
      if (wasCollapsed) {
        get().bridge.onOverlayChange?.(true);
      }
      return;
    }
    const parent = ROUTE_PARENT_MAP[current];
    if (parent) {
      set({ activeRoute: parent, isLivePreviewCollapsed: false });
      floatingStore.triggerBatchMinimize();
      if (wasCollapsed) {
        get().bridge.onOverlayChange?.(true);
      }
    } else {
      get().closeMenu();
    }
  },

  setTransitionMode: (mode) => set({ transitionMode: mode }),

  setActiveCar: (carId) => {
    set({ activeCar: carId });
    safeStorage.set(STORAGE_KEYS.DISPLAY_SETTINGS, JSON.stringify({ vehiclePreset: carId, carVisual: carId }));
    get().bridge.onVehicleChange?.(carId);
  },

  setTheme: (theme) => {
    set({ theme });
    safeStorage.set(STORAGE_KEYS.UI_THEME, theme);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
      document.documentElement.classList.toggle('light', theme === 'light');
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },

  updateCamera: (patch) => {
    set((s) => {
      const nextCamera = { ...s.camera, ...patch };
      safeStorage.set(STORAGE_KEYS.CAMERA_SETTINGS, JSON.stringify(nextCamera));
      get().bridge.onCameraChange?.(nextCamera);
      return { camera: nextCamera };
    });
  },

  resetCamera: () => {
    set(() => {
      const reset = { ...DEFAULT_CAMERA_SETTINGS };
      safeStorage.set(STORAGE_KEYS.CAMERA_SETTINGS, JSON.stringify(reset));
      get().bridge.onCameraChange?.(reset);
      return { camera: reset };
    });
  },

  updateGraphics: (patch) => {
    const nextGraphics = { ...get().graphics, ...patch };
    safeStorage.set(STORAGE_KEYS.GRAPHICS_SETTINGS, JSON.stringify(nextGraphics));
    set((s) => ({
      graphics: nextGraphics,
      renderScale: patch.renderScale !== undefined ? patch.renderScale : s.renderScale,
    }));
    get().bridge.onGraphicsChange?.(nextGraphics);
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
      if (nextAudio.continueAudioOnLostFocus !== undefined && (patch.muteWhenUnfocused !== undefined || patch.continueAudioOnLostFocus !== undefined)) {
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

  updateMaterials: (patch) => {
    set((s) => {
      const nextMaterials = { ...s.materials, ...patch };
      setMaterialsConfig(nextMaterials);
      get().bridge.onMaterialsChange?.(nextMaterials);
      return { materials: nextMaterials };
    });
  },

  updateTelemetry: (patch) => {
    set((s) => {
      const nextTelemetry = { ...s.telemetry, ...patch };
      // If FPS is turned off, Screen Refresh Rate must also be turned off
      if (nextTelemetry.fpsMode === 'off') {
        nextTelemetry.refreshRateMode = 'off';
      }
      safeStorage.set(STORAGE_KEYS.TELEMETRY_SETTINGS, JSON.stringify(nextTelemetry));
      return { telemetry: nextTelemetry };
    });
  },

  updateBoostPadTuner: (patch) => {
    set((s) => {
      const next = { ...s.boostPadTuner, ...patch };
      safeStorage.set(STORAGE_KEYS.BOOST_PAD_TUNER, JSON.stringify(next));
      get().bridge.onBoostPadTunerChange?.(next);
      return { boostPadTuner: next };
    });
  },

  resetBoostPadTuner: () => {
    set(() => {
      safeStorage.set(STORAGE_KEYS.BOOST_PAD_TUNER, JSON.stringify(DEFAULT_BOOST_PAD_TUNER_CONFIG));
      get().bridge.onBoostPadTunerChange?.(DEFAULT_BOOST_PAD_TUNER_CONFIG);
      return { boostPadTuner: { ...DEFAULT_BOOST_PAD_TUNER_CONFIG } };
    });
  },

  updateDriftwoodsTuner: (patch) => {
    set((s) => {
      const next: DriftwoodsTunerConfig = mergeDriftwoodsConfig(s.driftwoodsTuner, patch);
      safeStorage.set(STORAGE_KEYS.DRIFTWOODS_TUNER, JSON.stringify(next));
      get().bridge.onDriftwoodsTunerChange?.(next);
      return { driftwoodsTuner: next };
    });
  },

  resetDriftwoodsTuner: () => {
    set(() => {
      const reset = cloneDriftwoodsConfig(DEFAULT_DRIFTWOODS_CONFIG);
      safeStorage.set(STORAGE_KEYS.DRIFTWOODS_TUNER, JSON.stringify(reset));
      get().bridge.onDriftwoodsTunerChange?.(reset);
      return { driftwoodsTuner: reset };
    });
  },

  applyDriftwoodsPreset: (preset) => {
    set(() => {
      const cloned = cloneDriftwoodsConfig(preset.config);
      safeStorage.set(STORAGE_KEYS.DRIFTWOODS_TUNER, JSON.stringify(cloned));
      get().bridge.onDriftwoodsTunerChange?.(cloned);
      return { driftwoodsTuner: cloned };
    });
  },

  updateUnderDevelopment: async (patch) => {
    const next = { ...get().underDevelopment, ...patch };
    set({ underDevelopment: next });
    await get().bridge.onUnderDevelopmentChange?.(next, patch);
  },

  isFreeCam: false,
  freeCamFov: 80,
  setFreeCam: (enabled: boolean) => {
    const shouldEnable = Boolean(enabled);
    set({ isFreeCam: shouldEnable });
    get().bridge.onFreeCamToggle?.(shouldEnable);
  },
  toggleFreeCam: () => {
    const next = !get().isFreeCam;
    set({ isFreeCam: next });
    get().bridge.onFreeCamToggle?.(next);
    return next;
  },
  setFreeCamFov: (fov: number) => {
    const safeFov = Math.max(10, Math.min(140, Number(fov) || 80));
    set({ freeCamFov: safeFov });
    get().bridge.onFreeCamFovChange?.(safeFov);
  },

  precisionStep: 0.001,
  setPrecisionStep: (step: number) => {
    set({ precisionStep: step });
  },

  setLivePreviewCollapsed: (collapsed) => {
    set({ isLivePreviewCollapsed: collapsed });
    const b = get().bridge;
    if (collapsed) {
      // Live preview collapsed: allow inputs to penetrate to Three.js canvas & unpause simulation
      b.onOverlayChange?.(false);
      b.onResume?.();
    } else {
      // Live preview restored: pause background game inputs, capture modal focus, and stow open floating windows
      b.onOverlayChange?.(true);
      floatingStore.triggerBatchMinimize();
    }
  }
}));
