import { type StateCreator } from 'zustand';
import { floatingStore } from '../floatingStore';
import { STORAGE_KEYS, safeStorage } from '../../config/storageHelpers';
import { getInitialTheme } from '../../config/themeConfig';
import { getInitialCar, loadStoredPlayerName } from '../../config/vehiclePresets';
import { ROUTE_PARENT_MAP } from '../../config/uiConfig';
import { type AppState } from '../appStoreTypes';

export const initialTheme = getInitialTheme();

let lastToggleMenuTime = 0;
let lastExpMultiBotsParentRoute: 'main-menu' | 'settings' = 'settings';

export type NavigationAndCarSlice = Pick<
  AppState,
  | 'isOpen'
  | 'activeRoute'
  | 'transitionMode'
  | 'activeCar'
  | 'theme'
  | 'highlightSetting'
  | 'settingsTargetTab'
  | 'isLivePreviewCollapsed'
  | 'bridge'
  | 'setHighlightSetting'
  | 'clearHighlightSetting'
  | 'setSettingsTargetTab'
  | 'setBridge'
  | 'openMenu'
  | 'closeMenu'
  | 'toggleMenu'
  | 'navigate'
  | 'goBack'
  | 'setTransitionMode'
  | 'setActiveCar'
  | 'setTheme'
  | 'setLivePreviewCollapsed'
  | 'matchMode'
  | 'setMatchMode'
  | 'onlineSession'
  | 'setOnlineSession'
>;

export const createNavigationAndCarSlice: StateCreator<
  AppState,
  [],
  [],
  NavigationAndCarSlice
> = (set, get) => ({
  isOpen: false,
  activeRoute: 'main-menu',
  transitionMode: 'fluid-morph',
  activeCar: getInitialCar(),
  theme: initialTheme,
  highlightSetting: null,
  settingsTargetTab: 'gameplay',
  isLivePreviewCollapsed: false,
  bridge: {},

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
    safeStorage.set(
      STORAGE_KEYS.DISPLAY_SETTINGS,
      JSON.stringify({ vehiclePreset: carId, carVisual: carId })
    );
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

  setLivePreviewCollapsed: (collapsed) => {
    set({ isLivePreviewCollapsed: collapsed });
    const b = get().bridge;
    if (collapsed) {
      b.onOverlayChange?.(false);
      b.onResume?.();
    } else {
      b.onOverlayChange?.(true);
      floatingStore.triggerBatchMinimize();
    }
  },

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
    localTeam: 'neutral',
    isReady: false,
    connectedPeers: [],
  },
  setOnlineSession: (session) =>
    set((s) => ({ onlineSession: { ...s.onlineSession, ...session } })),
});
