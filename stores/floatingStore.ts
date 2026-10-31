import { useSyncExternalStore } from 'react';
import type { PresetConfig } from './floatingPresets';
import { syncBridge as crossClientSync } from './syncBridge';

export type { PresetConfig };
export type FloatingWindowConfig = PresetConfig;

export interface FloatingStorePersistenceHooks {
  getInitialOpacity?: () => number;
  onSaveOpacity?: (opacity: number) => void;
}

let persistenceHooks: FloatingStorePersistenceHooks = {};

export function configureFloatingStorePersistence(hooks: FloatingStorePersistenceHooks): void {
  persistenceHooks = { ...persistenceHooks, ...hooks };
}

const getDefaultFloatingOpacity = (): number => {
  if (persistenceHooks.getInitialOpacity) {
    const val = persistenceHooks.getInitialOpacity();
    if (typeof val === 'number' && Number.isFinite(val)) {
      return Math.max(1, Math.min(100, Math.round(val)));
    }
  }
  return 85;
};

export interface FloatingWindowItem {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  /** Optional manually calibrated minWidth (strictly integer 1px unit) overriding auto-detection */
  manualMinWidth?: number;
  /** Auto-detected minimum width (integer 1px unit, including scrollbar reserve) reported by FloatingWindowManager */
  autoMinWidth?: number;
  /** Vertical scrollbar width reserved in minWidth (integer 1px unit, 16px for resizable windows) */
  scrollbarReservePx?: number;
  minHeight?: number;
  /** Optional manually calibrated minHeight (strictly integer 1px unit) overriding preset minHeight */
  manualMinHeight?: number;
  /** Intrinsic full content height (Header + Content + Footer + 2px border) reported by FloatingWindowManager */
  intrinsicMaxHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  autoFitHeight?: boolean;
  /** True once the user explicitly resizes the window via corner handle */
  userAdjustedSize?: boolean;
  isMinimized: boolean;
  position?: { x: number; y: number };
  resizable?: boolean;
  singleton?: boolean;
  defaultCenter?: boolean;
}

export interface FlyingGhostState {
  id: string;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  destX: number;
  destY: number;
  preset: PresetConfig;
  targetHadStack: boolean;
}

export interface FloatingWindowState {
  /** Map of registered floating windows */
  windows: FloatingWindowItem[];
  /** Order of windows for z-index layering (last is on top) */
  windowOrder: string[];
  /** Whether the stack tray dropdown in top-right is open */
  isStackTrayOpen: boolean;
  /** Whether the stack icon itself in top-right is dismissed by user (when window count == 0) */
  isStackDismissed: boolean;
  /** Currently active (focused) restored window id */
  focusedWindowId: string | null;
  /** Currently active spawning flight animation to top-right Stack */
  activeFlight: FlyingGhostState | null;
  /** Counter signal to trigger animated batch minimization of all open windows */
  batchMinimizeSignal: number;
  /** Global opacity (1..100%) applied to floating windows */
  opacity: number;
}

const DEFAULT_FLOATING_STATE: FloatingWindowState = {
  windows: [],
  windowOrder: [],
  isStackTrayOpen: false,
  isStackDismissed: true,
  focusedWindowId: null,
  activeFlight: null,
  batchMinimizeSignal: 0,
  opacity: getDefaultFloatingOpacity(),
};

const normalizeFloatingState = (raw?: Partial<FloatingWindowState> | null): FloatingWindowState => ({
  ...DEFAULT_FLOATING_STATE,
  ...(raw && typeof raw === 'object' ? raw : {}),
  windows: Array.isArray(raw?.windows) ? raw.windows : [],
  windowOrder: Array.isArray(raw?.windowOrder) ? raw.windowOrder : [],
  opacity: typeof raw?.opacity === 'number' ? raw.opacity : getDefaultFloatingOpacity(),
});

export function createFloatingStore(syncKey: string) {
  let state: FloatingWindowState = normalizeFloatingState(
    crossClientSync.get<FloatingWindowState>(syncKey, DEFAULT_FLOATING_STATE)
  );

  const listeners = new Set<() => void>();
  const notify = () => {
    if (!crossClientSync.isApplyingRemote()) {
      crossClientSync.set(syncKey, state);
    }
    listeners.forEach((l) => l());
  };

  crossClientSync.subscribeKey<FloatingWindowState>(syncKey, (remote) => {
    if (!remote || typeof remote !== 'object') return;
    state = normalizeFloatingState(remote);
    listeners.forEach((l) => l());
  });

  crossClientSync.onReset((scopePrefix) => {
    if (scopePrefix && !syncKey.startsWith(scopePrefix)) return;
    state = {
      windows: [],
      windowOrder: [],
      isStackTrayOpen: false,
      isStackDismissed: true,
      focusedWindowId: null,
      activeFlight: null,
      batchMinimizeSignal: 0,
      opacity: 85,
    };
    listeners.forEach((l) => l());
  });

  const store = {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  /** Add a new floating window (default: restored or minimized depending on parameters) */
  spawnWindow: (item: Omit<FloatingWindowItem, 'isMinimized'> & { startMinimized?: boolean }) => {
    const shouldMinimize = item.startMinimized ?? false;
    const existing = state.windows.find((w) => w.id === item.id);
    if (existing) {
      const nextMinimized = shouldMinimize ? true : false;
      const nextOrder = nextMinimized
        ? state.windowOrder.filter((id) => id !== item.id)
        : state.windowOrder.filter((id) => id !== item.id).concat(item.id);
      state = {
        ...state,
        windows: state.windows.map((w) => (w.id === item.id ? { ...w, isMinimized: nextMinimized } : w)),
        windowOrder: nextOrder,
        isStackDismissed: false,
        focusedWindowId: nextMinimized
          ? state.focusedWindowId === item.id
            ? null
            : state.focusedWindowId
          : item.id,
        isStackTrayOpen: false,
      };
      notify();
      return;
    }

    const isCenter = item.id === 'floating-window-opacity' || item.defaultCenter;
    let defaultPos = {
      x: 40 + (state.windows.length % 5) * 32,
      y: 40 + (state.windows.length % 5) * 32,
    };
    if (isCenter && typeof window !== 'undefined') {
      const w = item.width ?? 360;
      const h = item.height ?? 123;
      defaultPos = {
        x: Math.max(20, Math.round((window.innerWidth - w) / 2)),
        y: Math.max(20, Math.round((window.innerHeight - h) / 2)),
      };
    }

    const newItem: FloatingWindowItem = {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      category: item.category,
      width: item.width ?? 440,
      height: item.height ?? 300,
      minWidth: item.minWidth,
      manualMinWidth: item.manualMinWidth,
      minHeight: item.minHeight,
      manualMinHeight: item.manualMinHeight,
      maxWidth: item.maxWidth,
      maxHeight: item.maxHeight,
      autoFitHeight: item.autoFitHeight,
      userAdjustedSize: item.userAdjustedSize ?? false,
      isMinimized: shouldMinimize,
      position: item.position ?? defaultPos,
      resizable: item.resizable ?? true,
      singleton: item.singleton,
      defaultCenter: item.defaultCenter,
    };

    const nextOrder = newItem.isMinimized
      ? state.windowOrder
      : state.windowOrder.filter((id) => id !== newItem.id).concat(newItem.id);

    state = {
      ...state,
      windows: [...state.windows, newItem],
      windowOrder: nextOrder,
      isStackDismissed: false,
      focusedWindowId: newItem.isMinimized ? state.focusedWindowId : newItem.id,
    };
    notify();
  },
  /** Bring window to top of stacking order */
  bringToFront: (id: string) => {
    if (state.focusedWindowId === id && state.windowOrder[state.windowOrder.length - 1] === id) {
      return;
    }
    const nextOrder = state.windowOrder.filter((item) => item !== id).concat(id);
    state = {
      ...state,
      windowOrder: nextOrder,
      focusedWindowId: id,
    };
    notify();
  },
  /** Update recorded window position (strictly integer 1px units) */
  updatePosition: (id: string, position: { x: number; y: number }) => {
    const pos = { x: Math.round(position.x), y: Math.round(position.y) };
    state = {
      ...state,
      windows: state.windows.map((w) => (w.id === id ? { ...w, position: pos } : w)),
    };
    notify();
  },
  /** Update recorded window dimensions (strictly integer 1px units) */
  updateSize: (id: string, size: { width: number; height: number }, userAdjusted = false) => {
    const roundedW = Math.round(size.width);
    const roundedH = Math.round(size.height);
    state = {
      ...state,
      windows: state.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              width: roundedW,
              height: roundedH,
              userAdjustedSize: userAdjusted ? true : w.userAdjustedSize,
            }
          : w
      ),
    };
    notify();
  },
  /** Update manually calibrated minWidth (strictly integer 1px unit, or undefined to reset to auto-detect) */
  updateMinWidth: (id: string, manualMinWidth: number | undefined) => {
    const roundedMinW =
      manualMinWidth !== undefined && Number.isFinite(manualMinWidth)
        ? Math.max(240, Math.round(manualMinWidth))
        : undefined;
    state = {
      ...state,
      windows: state.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              manualMinWidth: roundedMinW,
              width:
                roundedMinW !== undefined && w.width !== undefined
                  ? Math.max(roundedMinW, Math.round(w.width))
                  : w.width,
            }
          : w
      ),
    };
    notify();
  },
  /** Update manually calibrated minHeight (strictly integer 1px unit, or undefined to reset to preset minHeight) */
  updateMinHeight: (id: string, manualMinHeight: number | undefined) => {
    const roundedMinH =
      manualMinHeight !== undefined && Number.isFinite(manualMinHeight)
        ? Math.max(72, Math.round(manualMinHeight))
        : undefined;
    state = {
      ...state,
      windows: state.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              manualMinHeight: roundedMinH,
              height:
                roundedMinH !== undefined && w.height !== undefined
                  ? Math.max(roundedMinH, Math.round(w.height))
                  : w.height,
            }
          : w
      ),
    };
    notify();
  },
  /** Record auto-detected intrinsic minWidth, scrollbar reserve, and intrinsicMaxHeight (strictly integer 1px units) */
  reportIntrinsicMetrics: (
    id: string,
    metrics: {
      autoMinWidth?: number;
      scrollbarReservePx?: number;
      intrinsicMaxHeight?: number;
    }
  ) => {
    const target = state.windows.find((w) => w.id === id);
    if (!target) return;
    const autoMinW =
      metrics.autoMinWidth !== undefined
        ? Math.round(metrics.autoMinWidth)
        : target.autoMinWidth;
    const reservePx =
      metrics.scrollbarReservePx !== undefined
        ? Math.round(metrics.scrollbarReservePx)
        : target.scrollbarReservePx;
    const intrinsicMaxH =
      metrics.intrinsicMaxHeight !== undefined
        ? Math.round(metrics.intrinsicMaxHeight)
        : target.intrinsicMaxHeight;
    if (
      target.autoMinWidth === autoMinW &&
      target.scrollbarReservePx === reservePx &&
      target.intrinsicMaxHeight === intrinsicMaxH
    ) {
      return;
    }
    state = {
      ...state,
      windows: state.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              autoMinWidth: autoMinW,
              scrollbarReservePx: reservePx,
              intrinsicMaxHeight: intrinsicMaxH,
            }
          : w
      ),
    };
    notify();
  },
  /** Minimize a window to the top-right stack icon */
  minimizeWindow: (id: string) => {
    state = {
      ...state,
      windows: state.windows.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)),
      windowOrder: state.windowOrder.filter((winId) => winId !== id),
      isStackDismissed: false,
      isStackTrayOpen: false,
      focusedWindowId: state.focusedWindowId === id ? null : state.focusedWindowId,
    };
    notify();
  },
  /** Restore a window from the stack tray */
  restoreWindow: (id: string) => {
    const nextOrder = state.windowOrder.filter((winId) => winId !== id).concat(id);
    state = {
      ...state,
      windows: state.windows.map((w) => (w.id === id ? { ...w, isMinimized: false } : w)),
      windowOrder: nextOrder,
      focusedWindowId: id,
      isStackTrayOpen: false,
    };
    notify();
  },
  /** Close and destroy a window permanently */
  closeWindow: (id: string) => {
    const nextWindows = state.windows.filter((w) => w.id !== id);
    const nextOrder = state.windowOrder.filter((wId) => wId !== id);
    const remainingMinimized = nextWindows.filter((w) => w.isMinimized).length;
    state = {
      ...state,
      windows: nextWindows,
      windowOrder: nextOrder,
      isStackTrayOpen: remainingMinimized > 0 ? state.isStackTrayOpen : false,
      focusedWindowId: state.focusedWindowId === id ? null : state.focusedWindowId,
    };
    notify();
  },
  /** Toggle stack tray list dropdown */
  toggleStackTray: () => {
    const minimizedCount = state.windows.filter((w) => w.isMinimized).length;
    if (minimizedCount === 0) return;
    state = {
      ...state,
      isStackTrayOpen: !state.isStackTrayOpen,
    };
    notify();
  },
  setStackTrayOpen: (open: boolean) => {
    const minimizedCount = state.windows.filter((w) => w.isMinimized).length;
    if (open && minimizedCount === 0) return;
    state = {
      ...state,
      isStackTrayOpen: open,
    };
    notify();
  },
  /** Dismiss stack icon only when 0 minimized windows remain */
  dismissStack: () => {
    const minimizedCount = state.windows.filter((w) => w.isMinimized).length;
    if (minimizedCount === 0) {
      state = {
        ...state,
        isStackDismissed: true,
        isStackTrayOpen: false,
      };
      notify();
    }
  },
  /** Reset or clear all windows */
  clearAll: () => {
    state = {
      ...state,
      windows: [],
      windowOrder: [],
      isStackTrayOpen: false,
      isStackDismissed: true,
      focusedWindowId: null,
      activeFlight: null,
      batchMinimizeSignal: 0,
    };
    notify();
  },
  /** Set global opacity (1..100%) for floating windows */
  setOpacity: (opacity: number) => {
    const clamped = Math.max(1, Math.min(100, Math.round(opacity)));
    persistenceHooks.onSaveOpacity?.(clamped);
    state = {
      ...state,
      opacity: clamped,
    };
    notify();
  },
  /** Start flying animation from source button to top-right Stack */
  spawnWithFlight: (preset: PresetConfig, sourceEl: HTMLElement, containerEl: HTMLElement) => {
    const srcRect = sourceEl.getBoundingClientRect();
    const contRect = containerEl.getBoundingClientRect();

    const startX = Math.round(srcRect.left - contRect.left);
    const startY = Math.round(srcRect.top - contRect.top);
    const startW = Math.round(srcRect.width);
    const startH = Math.round(srcRect.height);

    // Dest position: top-4 right-4 in container (h-10 w-10 = 40x40, top: 16px, right: 16px)
    const destX = Math.max(16, Math.round(contRect.width - 56));
    const destY = 16;

    const minimizedCount = state.windows.filter((w) => w.isMinimized).length;
    // Stack icon is already present if not dismissed or holding minimized items
    const hasStack = !(state.isStackDismissed && minimizedCount === 0);

    const flightId = `${preset.id}-${Date.now()}`;

    state = {
      ...state,
      activeFlight: {
        id: flightId,
        startX,
        startY,
        startW,
        startH,
        destX,
        destY,
        preset,
        targetHadStack: hasStack,
      },
    };
    notify();
  },
  /** Batch minimize all currently open floating windows with 3-phase collective collapse animation */
  triggerBatchMinimize: () => {
    const hasOpen = state.windows.some((w) => !w.isMinimized);
    if (!hasOpen) return;
    state = {
      ...state,
      batchMinimizeSignal: state.batchMinimizeSignal + 1,
      isStackDismissed: false, // Ensure stack icon appears at top-right to receive collapsed windows
      isStackTrayOpen: false,
    };
    notify();
  },
    /** Minimize all currently open floating windows into the stack icon (defaults to animation) */
    minimizeAllWindows: (immediate = false) => {
      const hasOpen = state.windows.some((w) => !w.isMinimized);
      if (!hasOpen) return;
      if (!immediate) {
        store.triggerBatchMinimize();
        return;
      }
      state = {
        ...state,
        windows: state.windows.map((w) => ({ ...w, isMinimized: true })),
        windowOrder: [],
        focusedWindowId: null,
        isStackTrayOpen: false,
        isStackDismissed: false,
      };
      notify();
    },
    /** Complete flying animation and commit minimized window into store */
    completeFlight: () => {
      if (!state.activeFlight) return;
      const { preset } = state.activeFlight;

      const isSingleton = preset.singleton ?? false;
      const winId = isSingleton ? preset.id : `${preset.id}-${Date.now().toString().slice(-4)}`;

      // If singleton already exists, minimize it and focus it
      const existingIndex = state.windows.findIndex((w) => w.id === winId);
      let nextWindows = state.windows;

      if (existingIndex >= 0) {
        nextWindows = state.windows.map((w, idx) =>
          idx === existingIndex ? { ...w, isMinimized: true } : w
        );
      } else {
        const newItem: FloatingWindowItem = {
          id: winId,
          title: preset.title,
          subtitle: preset.summary,
          category: preset.category,
          width: preset.width,
          height: preset.height,
          minWidth: preset.minWidth,
          minHeight: preset.minHeight,
          maxWidth: preset.maxWidth,
          maxHeight: preset.maxHeight,
          autoFitHeight: preset.autoFitHeight,
          isMinimized: true,
          resizable: preset.resizable,
          position: {
            x: 40 + (state.windows.length % 5) * 32,
            y: 40 + (state.windows.length % 5) * 32,
          },
        };
        nextWindows = [...state.windows, newItem];
      }

      state = {
        ...state,
        windows: nextWindows,
        isStackDismissed: false,
        activeFlight: null,
      };
      notify();
    },
    cancelFlight: () => {
      if (!state.activeFlight) return;
      state = {
        ...state,
        activeFlight: null,
      };
      notify();
    },
  };

  return store;
}

export type FloatingStoreInstance = ReturnType<typeof createFloatingStore>;

/** Primary Floating Window Store for 7A Menu Layer Sandbox & L6 Menu Recipes (starts empty, isolated from 6D) */
export const floatingStore = createFloatingStore('store:floating:menu-layer-v3');

/** Dedicated isolated Floating Window Store for 6D Floating Window Inspector/Stack Sandbox */
export const floatingSandboxStore = createFloatingStore('store:floating:sandbox-6d-v3');

export const useFloatingStore = (customStore: FloatingStoreInstance = floatingStore) => {
  const snapshot = useSyncExternalStore(customStore.subscribe, customStore.getSnapshot);
  const minimizedCount = snapshot.windows.filter((w) => w.isMinimized).length;
  const totalCount = snapshot.windows.length;

  return {
    windows: snapshot.windows,
    windowOrder: snapshot.windowOrder,
    isStackTrayOpen: snapshot.isStackTrayOpen,
    isStackDismissed: snapshot.isStackDismissed,
    focusedWindowId: snapshot.focusedWindowId,
    activeFlight: snapshot.activeFlight,
    batchMinimizeSignal: snapshot.batchMinimizeSignal,
    opacity: snapshot.opacity ?? 85,
    minimizedCount,
    totalCount,
    spawnWindow: customStore.spawnWindow,
    spawnWithFlight: customStore.spawnWithFlight,
    completeFlight: customStore.completeFlight,
    cancelFlight: customStore.cancelFlight,
    bringToFront: customStore.bringToFront,
    updatePosition: customStore.updatePosition,
    updateSize: customStore.updateSize,
    updateMinWidth: customStore.updateMinWidth,
    updateMinHeight: customStore.updateMinHeight,
    reportIntrinsicMetrics: customStore.reportIntrinsicMetrics,
    minimizeWindow: customStore.minimizeWindow,
    minimizeAllWindows: customStore.minimizeAllWindows,
    triggerBatchMinimize: customStore.triggerBatchMinimize,
    restoreWindow: customStore.restoreWindow,
    closeWindow: customStore.closeWindow,
    toggleStackTray: customStore.toggleStackTray,
    setStackTrayOpen: customStore.setStackTrayOpen,
    dismissStack: customStore.dismissStack,
    clearAll: customStore.clearAll,
    setOpacity: customStore.setOpacity,
  };
};

export function toggleFloatingPreset(preset: PresetConfig) {
  const existing = floatingStore.getSnapshot().windows.find((w) => w.id === preset.id);
  if (existing) {
    if (!existing.isMinimized) {
      floatingStore.minimizeWindow(preset.id);
    }
  } else {
    floatingStore.spawnWindow({
      ...preset,
      startMinimized: true,
    });
  }
}

