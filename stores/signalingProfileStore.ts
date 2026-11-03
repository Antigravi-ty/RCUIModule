import { create } from 'zustand';

export type SignalingProfileSource = 'none' | 'dev-private' | 'imported-bundle';

export interface SignalingRelayProbeViewItem {
  id: string;
  label: string;
  protocol: 'mqtt' | 'ws';
  ok: boolean;
  rttMs: number;
  error?: string;
}

export interface SignalingProfileExportSnapshot {
  suggestedFileName: string;
  serializedJson: string;
  pinCode: string;
  windowMinutes: number;
  expiresAtMs: number;
}

export interface SignalingProfileBridgeCallbacks {
  onImportBundle?: (rawContent: string, pinCode: string) => Promise<void>;
  onExportBundle?: (options: {
    pinCode?: string;
    windowMinutes?: number;
  }) => Promise<SignalingProfileExportSnapshot>;
  onClearBundle?: () => void;
  onVerifyRelays?: () => Promise<SignalingRelayProbeViewItem[]>;
}

export interface SignalingProfileStoreState {
  loaded: boolean;
  source: SignalingProfileSource;
  profileHash: string;
  relayCount: number;
  relayLabels: string[];
  turnServerCount: number;
  isBusy: boolean;
  isProbing: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
  probeResults: SignalingRelayProbeViewItem[];
  lastExport: SignalingProfileExportSnapshot | null;
  bridge: SignalingProfileBridgeCallbacks;

  syncStatus: (patch: {
    loaded: boolean;
    source: SignalingProfileSource;
    profileHash: string;
    relayCount: number;
    relayLabels: string[];
    turnServerCount: number;
  }) => void;
  registerBridge: (bridge: SignalingProfileBridgeCallbacks) => void;
  clearMessages: () => void;
  importBundle: (rawContent: string, pinCode: string) => Promise<boolean>;
  exportBundle: (options?: {
    pinCode?: string;
    windowMinutes?: number;
  }) => Promise<SignalingProfileExportSnapshot | null>;
  clearProfile: () => void;
  verifyRelays: () => Promise<void>;
}

export const useSignalingProfileStore = create<SignalingProfileStoreState>((set, get) => ({
  loaded: false,
  source: 'none',
  profileHash: '',
  relayCount: 0,
  relayLabels: [],
  turnServerCount: 0,
  isBusy: false,
  isProbing: false,
  statusMessage: null,
  errorMessage: null,
  probeResults: [],
  lastExport: null,
  bridge: {},

  syncStatus: (patch) => {
    set({
      loaded: patch.loaded,
      source: patch.source,
      profileHash: patch.profileHash,
      relayCount: patch.relayCount,
      relayLabels: patch.relayLabels,
      turnServerCount: patch.turnServerCount,
    });
  },

  registerBridge: (bridge) => {
    set((state) => ({
      bridge: { ...state.bridge, ...bridge },
    }));
  },

  clearMessages: () => {
    set({ statusMessage: null, errorMessage: null });
  },

  importBundle: async (rawContent, pinCode) => {
    const { onImportBundle } = get().bridge;
    if (!onImportBundle) {
      set({ errorMessage: 'Credential bundle bridge is not initialized.' });
      return false;
    }
    set({ isBusy: true, errorMessage: null, statusMessage: null });
    try {
      await onImportBundle(rawContent, pinCode);
      set({
        isBusy: false,
        statusMessage: 'Signaling credential bundle unlocked & saved to local storage.',
        errorMessage: null,
      });
      return true;
    } catch (err: any) {
      set({
        isBusy: false,
        errorMessage: err?.message || 'Failed to decrypt .rctbnspib bundle.',
        statusMessage: null,
      });
      return false;
    }
  },

  exportBundle: async (options = {}) => {
    const { onExportBundle } = get().bridge;
    if (!onExportBundle) {
      set({ errorMessage: 'Credential bundle export bridge is not initialized.' });
      return null;
    }
    set({ isBusy: true, errorMessage: null, statusMessage: null });
    try {
      const result = await onExportBundle(options);
      set({
        isBusy: false,
        lastExport: result,
        statusMessage: `Exported ${result.suggestedFileName} (valid for ${result.windowMinutes}m).`,
        errorMessage: null,
      });
      return result;
    } catch (err: any) {
      set({
        isBusy: false,
        errorMessage: err?.message || 'Failed to export .rctbnspib bundle.',
        statusMessage: null,
      });
      return null;
    }
  },

  clearProfile: () => {
    get().bridge.onClearBundle?.();
    set({
      probeResults: [],
      lastExport: null,
      statusMessage: 'Cleared imported signaling profile from local storage.',
      errorMessage: null,
    });
  },

  verifyRelays: async () => {
    const { onVerifyRelays } = get().bridge;
    if (!onVerifyRelays) return;
    set({ isProbing: true, errorMessage: null });
    try {
      const results = await onVerifyRelays();
      const reachable = results.filter((r) => r.ok).length;
      set({
        isProbing: false,
        probeResults: results,
        statusMessage: `Verified ${reachable}/${results.length} signaling relays reachable.`,
      });
    } catch (err: any) {
      set({
        isProbing: false,
        errorMessage: err?.message || 'Signaling relay probe failed.',
      });
    }
  },
}));

export const signalingProfileStore = {
  getState: () => useSignalingProfileStore.getState(),
  subscribe: useSignalingProfileStore.subscribe,
};
