/**
 * cloudProfileSyncStore.ts
 * Zustand store orchestrating:
 *   1. User Cloud Profile Sync (Garage -> Sync tab) with Unified Flat Key-Value snapshots
 *      and Git-style 3-Way Merge conflict detection & resolution.
 *   2. Developer Account Directory Management (Manage Accounts: username / password / alias).
 *   3. Developer Live Remote Profile Tuning ("Set Others Profile" -> `SETTINGS # <alias>`
 *      with automatic stashing/restoration of developer local state and live MQTT `dev` slot push).
 */

import { create } from 'zustand';
import {
  computeProfileThreeWayMerge,
  isDeepEqualJsonValue,
} from '../config/cloudProfileMergePipeline';
import {
  type ActiveRemoteTuningSession,
  type CloudDevSlotRecord,
  type CloudFetchedUserCompleteRecord,
  type CloudManagedAccountItem,
  type CloudProfileSyncBridgeCallbacks,
  type CloudSyncStatus,
  type CloudUserSlotRecord,
  type LoggedInCloudUser,
  type ProfileFlatSnapshot,
  type ProfileMergeConflictItem,
} from '../config/cloudProfileSyncTypes';
import { safeStorage } from '../config/storageHelpers';
import { saveStoredPlayerName } from '../config/vehiclePresets';
import { useAppStore } from './appStore';
import { type SignalingProfileSource } from './signalingProfileStore';
import {
  applyUnifiedProfileSnapshot,
  collectUnifiedProfileSnapshot,
} from './cloudProfileSnapshotCollector';
import { floatingStore } from './floatingStore';
import { useSpatialAudioStore } from './spatialAudioStore';
import { viewportStore } from './viewportStore';

export type {
  CloudDevSlotRecord,
  CloudFetchedUserCompleteRecord,
  CloudProfileSyncBridgeCallbacks,
  CloudSyncStatus,
  CloudUserSlotRecord,
  LoggedInCloudUser,
};

const CLOUD_AUTH_STORAGE_KEY = 'rc_cloud_profile_auth_v1';

export interface CloudProfileSyncState {
  available: boolean;
  canManageAccounts: boolean;
  source: SignalingProfileSource;
  loggedInUser: LoggedInCloudUser | null;
  syncStatus: CloudSyncStatus;
  statusMessage: string | null;
  errorMessage: string | null;
  lastSyncedAt: number | null;
  userRev: number;
  devRev: number;
  autoSyncEnabled: boolean;
  mergedBaseSnapshot: ProfileFlatSnapshot | null;
  conflicts: ProfileMergeConflictItem[];
  accounts: CloudManagedAccountItem[];
  isLoadingAccounts: boolean;
  activeRemoteSession: ActiveRemoteTuningSession | null;
  isApplyingSnapshotInternally: boolean;

  setCapabilityState: (params: {
    available: boolean;
    canManageAccounts: boolean;
    source: SignalingProfileSource;
  }) => void;
  setBridgeCallbacks: (callbacks: CloudProfileSyncBridgeCallbacks | null) => void;
  setAutoSyncEnabled: (enabled: boolean) => void;

  loginAndSyncUser: (username: string, password: string) => Promise<boolean>;
  logoutUser: () => void;
  pullUserCloudProfile: () => Promise<boolean>;
  pushUserCloudProfile: () => Promise<boolean>;

  selectConflictSource: (key: string, source: 'local' | 'dev') => void;
  resolveConflicts: (mode: 'selected' | 'all-local' | 'all-dev') => Promise<void>;

  refreshAccounts: () => Promise<void>;
  upsertAccount: (username: string, password: string, alias: string) => Promise<boolean>;
  deleteAccount: (userId: string) => Promise<boolean>;

  startRemoteTuningSession: (account: {
    userId: string;
    alias?: string;
    password?: string;
  }) => Promise<boolean>;
  pushActiveRemoteSessionNow: () => Promise<boolean>;
  exitRemoteTuningSession: () => Promise<void>;
}

let bridgeCallbacks: CloudProfileSyncBridgeCallbacks | null = null;
let activeDevWatchUnsubscribe: (() => void) | null = null;
let liveStoreSubscriptionsInitialized = false;
let remotePushDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let userAutoPushDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushedSnapshotJson = '';

const sanitizeUserId = (raw: string): string =>
  raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

function loadSavedCloudUser(): LoggedInCloudUser | null {
  try {
    const raw = safeStorage.get(CLOUD_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === 'string' && typeof parsed.password === 'string') {
      return {
        userId: parsed.userId,
        alias: typeof parsed.alias === 'string' && parsed.alias ? parsed.alias : parsed.userId,
        password: parsed.password,
      };
    }
  } catch {
    // Ignore malformed saved auth
  }
  return null;
}

function saveCloudUser(user: LoggedInCloudUser | null): void {
  if (!user) {
    safeStorage.remove(CLOUD_AUTH_STORAGE_KEY);
  } else {
    safeStorage.set(CLOUD_AUTH_STORAGE_KEY, JSON.stringify(user));
  }
}

export const useCloudProfileSyncStore = create<CloudProfileSyncState>((set, get) => ({
  available: false,
  canManageAccounts: false,
  source: 'public',
  loggedInUser: loadSavedCloudUser(),
  syncStatus: 'idle',
  statusMessage: null,
  errorMessage: null,
  lastSyncedAt: null,
  userRev: 0,
  devRev: 0,
  autoSyncEnabled: true,
  mergedBaseSnapshot: null,
  conflicts: [],
  accounts: [],
  isLoadingAccounts: false,
  activeRemoteSession: null,
  isApplyingSnapshotInternally: false,

  setCapabilityState: ({ available, canManageAccounts, source }) =>
    set({ available, canManageAccounts, source }),

  setBridgeCallbacks: (callbacks) => {
    bridgeCallbacks = callbacks;
    ensureLiveStoreSubscriptions();
  },

  setAutoSyncEnabled: (enabled) => set({ autoSyncEnabled: enabled }),

  loginAndSyncUser: async (username, password) => {
    const userId = sanitizeUserId(username);
    const trimmedPassword = password.trim();
    if (!userId || !trimmedPassword) {
      set({ syncStatus: 'error', errorMessage: 'Enter a valid username and password.' });
      return false;
    }
    if (!bridgeCallbacks || !get().available) {
      set({ syncStatus: 'error', errorMessage: 'Cloud profile credentials are not active.' });
      return false;
    }

    set({
      syncStatus: 'syncing',
      errorMessage: null,
      statusMessage: `Connecting to cloud profile "${userId}"...`,
    });

    try {
      const [record, computedHash] = await Promise.all([
        bridgeCallbacks.fetchUserCompleteRecord(userId, 'client'),
        bridgeCallbacks.computePassphraseHash(userId, trimmedPassword),
      ]);

      const expectedHash = record.index?.passphraseHash || record.userSlot?.passphraseHash || '';
      const expectedPlainPassword = record.index?.password || '';
      if (
        expectedHash &&
        expectedHash !== computedHash &&
        (!expectedPlainPassword || expectedPlainPassword !== trimmedPassword)
      ) {
        set({
          syncStatus: 'error',
          errorMessage: 'Incorrect password for this cloud username.',
          statusMessage: null,
        });
        return false;
      }

      const resolvedAlias = record.index?.alias?.trim() || username.trim();
      const userObj: LoggedInCloudUser = { userId, alias: resolvedAlias, password: trimmedPassword };
      saveCloudUser(userObj);
      saveStoredPlayerName(resolvedAlias);
      useAppStore.getState().setOnlineSession({ playerName: resolvedAlias });

      const currentLocal = collectUnifiedProfileSnapshot();
      const baselineUserSnap = record.userSlot?.snapshot ?? currentLocal;
      let targetSnap = baselineUserSnap;
      let conflicts: ProfileMergeConflictItem[] = [];
      let autoAppliedCount = 0;

      if (record.devSlot?.snapshot && Object.keys(record.devSlot.snapshot).length > 0) {
        const mergeResult = computeProfileThreeWayMerge(
          record.devSlot.baseSnapshot,
          baselineUserSnap,
          record.devSlot.snapshot
        );
        targetSnap = mergeResult.mergedSnapshot;
        conflicts = mergeResult.conflicts;
        autoAppliedCount = mergeResult.autoAppliedDevKeys.length;
      }

      set({ isApplyingSnapshotInternally: true });
      try {
        applyUnifiedProfileSnapshot(targetSnap);
      } finally {
        set({ isApplyingSnapshotInternally: false });
      }

      let nextUserRev = record.userSlot?.rev ?? record.index?.userRev ?? 0;
      const nextDevRev = record.devSlot?.rev ?? record.index?.devRev ?? 0;

      if (!record.userSlot || autoAppliedCount > 0) {
        const pub = await bridgeCallbacks.publishUserProfileSlot({
          userId,
          alias: resolvedAlias,
          password: trimmedPassword,
          snapshot: targetSnap,
          prevIndex: record.index,
        });
        nextUserRev = pub.rev;
      }

      lastPushedSnapshotJson = JSON.stringify(targetSnap);

      if (activeDevWatchUnsubscribe) {
        activeDevWatchUnsubscribe();
      }
      activeDevWatchUnsubscribe = bridgeCallbacks.watchUserDevSlot(
        userId,
        (devPayload, indexPayload) => {
          const state = get();
          if (!state.loggedInUser || state.loggedInUser.userId !== userId) return;
          if (state.activeRemoteSession || devPayload.rev <= state.devRev) return;

          const mergeRes = computeProfileThreeWayMerge(
            devPayload.baseSnapshot,
            collectUnifiedProfileSnapshot(),
            devPayload.snapshot
          );

          set({ isApplyingSnapshotInternally: true });
          try {
            applyUnifiedProfileSnapshot(mergeRes.mergedSnapshot);
          } finally {
            set({ isApplyingSnapshotInternally: false });
          }
          lastPushedSnapshotJson = JSON.stringify(mergeRes.mergedSnapshot);

          set({
            devRev: devPayload.rev,
            mergedBaseSnapshot: mergeRes.mergedSnapshot,
            conflicts: mergeRes.conflicts,
            syncStatus: mergeRes.conflicts.length > 0 ? 'conflict' : 'synced',
            lastSyncedAt: Date.now(),
            statusMessage:
              mergeRes.conflicts.length > 0
                ? `${mergeRes.conflicts.length} conflict(s) detected from developer update.`
                : `Applied live developer update (v${devPayload.rev}, ${mergeRes.autoAppliedDevKeys.length} field(s)).`,
          });

          if (indexPayload?.alias && indexPayload.alias !== state.loggedInUser.alias) {
            saveStoredPlayerName(indexPayload.alias);
            useAppStore.getState().setOnlineSession({ playerName: indexPayload.alias });
          }
        }
      );

      set({
        loggedInUser: userObj,
        userRev: nextUserRev,
        devRev: nextDevRev,
        mergedBaseSnapshot: targetSnap,
        conflicts,
        syncStatus: conflicts.length > 0 ? 'conflict' : 'synced',
        lastSyncedAt: Date.now(),
        errorMessage: null,
        statusMessage:
          conflicts.length > 0
            ? `Synced with ${conflicts.length} conflict(s) requiring resolution.`
            : autoAppliedCount > 0
              ? `Synced & merged ${autoAppliedCount} developer-tuned setting(s).`
              : `Synced profile "${resolvedAlias}" (rev #${nextUserRev}).`,
      });
      return true;
    } catch (err) {
      set({
        syncStatus: 'error',
        errorMessage: err instanceof Error ? err.message : 'Cloud sync failed.',
        statusMessage: null,
      });
      return false;
    }
  },

  logoutUser: () => {
    if (activeDevWatchUnsubscribe) {
      activeDevWatchUnsubscribe();
      activeDevWatchUnsubscribe = null;
    }
    saveCloudUser(null);
    set({
      loggedInUser: null,
      syncStatus: 'idle',
      statusMessage: 'Signed out of cloud profile sync.',
      errorMessage: null,
      conflicts: [],
    });
  },

  pullUserCloudProfile: async () => {
    const user = get().loggedInUser;
    return user ? get().loginAndSyncUser(user.userId, user.password) : false;
  },

  pushUserCloudProfile: async () => {
    const { loggedInUser, available } = get();
    if (!loggedInUser || !bridgeCallbacks || !available) return false;
    set({ syncStatus: 'syncing', errorMessage: null });
    try {
      const snapshot = collectUnifiedProfileSnapshot();
      const record = await bridgeCallbacks.fetchUserCompleteRecord(loggedInUser.userId, 'client');
      const pub = await bridgeCallbacks.publishUserProfileSlot({
        userId: loggedInUser.userId,
        alias: loggedInUser.alias,
        password: loggedInUser.password,
        snapshot,
        prevIndex: record.index,
      });
      lastPushedSnapshotJson = JSON.stringify(snapshot);
      set({
        userRev: pub.rev,
        mergedBaseSnapshot: snapshot,
        syncStatus: 'synced',
        lastSyncedAt: Date.now(),
        statusMessage: `Pushed local settings to cloud (rev #${pub.rev}).`,
      });
      return true;
    } catch (err) {
      set({
        syncStatus: 'error',
        errorMessage: err instanceof Error ? err.message : 'Failed to push profile.',
      });
      return false;
    }
  },

  selectConflictSource: (key, source) =>
    set((state) => ({
      conflicts: state.conflicts.map((item) =>
        item.key === key ? { ...item, selectedSource: source } : item
      ),
    })),

  resolveConflicts: async (mode) => {
    const { conflicts, loggedInUser } = get();
    if (conflicts.length === 0) return;

    const resolvedSnap: ProfileFlatSnapshot = { ...collectUnifiedProfileSnapshot() };
    for (const conflict of conflicts) {
      const pick =
        mode === 'all-local' ? 'local' : mode === 'all-dev' ? 'dev' : conflict.selectedSource;
      const chosenValue = pick === 'local' ? conflict.localValue : conflict.devValue;
      if (chosenValue === undefined) {
        delete resolvedSnap[conflict.key];
      } else {
        resolvedSnap[conflict.key] = chosenValue;
      }
    }

    set({ isApplyingSnapshotInternally: true });
    try {
      applyUnifiedProfileSnapshot(resolvedSnap);
    } finally {
      set({ isApplyingSnapshotInternally: false });
    }

    set({
      conflicts: [],
      mergedBaseSnapshot: resolvedSnap,
      syncStatus: 'synced',
      statusMessage: 'Resolved all profile conflicts and synced to cloud.',
    });

    if (loggedInUser && bridgeCallbacks) {
      await get().pushUserCloudProfile();
    }
  },

  refreshAccounts: async () => {
    if (!bridgeCallbacks || !get().available) return;
    set({ isLoadingAccounts: true, errorMessage: null });
    try {
      const list = await bridgeCallbacks.fetchAllAccounts();
      set({ accounts: list, isLoadingAccounts: false });
    } catch (err) {
      set({
        isLoadingAccounts: false,
        errorMessage: err instanceof Error ? err.message : 'Failed to load accounts.',
      });
    }
  },

  upsertAccount: async (username, password, alias) => {
    const userId = sanitizeUserId(username);
    const trimmedPassword = password.trim();
    const trimmedAlias = alias.trim() || userId;
    if (!userId || !trimmedPassword || !bridgeCallbacks) return false;

    try {
      const existing = get().accounts.find((a) => a.userId === userId) ?? null;
      const item = await bridgeCallbacks.upsertAccountDirectoryEntry({
        userId,
        alias: trimmedAlias,
        password: trimmedPassword,
        existingIndex: existing,
      });
      set((state) => ({
        accounts: [...state.accounts.filter((a) => a.userId !== userId), item].sort((a, b) =>
          a.userId.localeCompare(b.userId)
        ),
        statusMessage: `Saved account "${userId}" (#${trimmedAlias}).`,
        errorMessage: null,
      }));
      return true;
    } catch (err) {
      set({ errorMessage: err instanceof Error ? err.message : 'Failed to save account.' });
      return false;
    }
  },

  deleteAccount: async (userId) => {
    const cleanId = sanitizeUserId(userId);
    if (!cleanId || !bridgeCallbacks) return false;
    try {
      await bridgeCallbacks.deleteAccountDirectoryEntry(cleanId);
      set((state) => ({
        accounts: state.accounts.filter((a) => a.userId !== cleanId),
        statusMessage: `Removed account "${cleanId}" from cloud directory.`,
      }));
      return true;
    } catch (err) {
      set({ errorMessage: err instanceof Error ? err.message : 'Failed to delete account.' });
      return false;
    }
  },

  startRemoteTuningSession: async (account) => {
    const userId = sanitizeUserId(account.userId);
    if (!userId || !bridgeCallbacks || !get().available) return false;

    const existingSession = get().activeRemoteSession;
    const stashedLocalSnapshot = existingSession
      ? existingSession.stashedLocalSnapshot
      : collectUnifiedProfileSnapshot();

    set({
      syncStatus: 'syncing',
      errorMessage: null,
      statusMessage: `Loading remote profile for #${account.alias || userId}...`,
    });

    try {
      const record = await bridgeCallbacks.fetchUserCompleteRecord(userId, 'dev');
      const resolvedAlias = account.alias?.trim() || record.index?.alias?.trim() || userId;
      const resolvedPassword = account.password?.trim() || record.index?.password?.trim() || '';
      const userSnap = record.userSlot?.snapshot ?? collectUnifiedProfileSnapshot();
      const effectiveTargetSnap =
        record.devSlot?.snapshot && Object.keys(record.devSlot.snapshot).length > 0
          ? computeProfileThreeWayMerge(
              record.devSlot.baseSnapshot,
              userSnap,
              record.devSlot.snapshot
            ).mergedSnapshot
          : userSnap;

      set({ isApplyingSnapshotInternally: true });
      try {
        applyUnifiedProfileSnapshot(effectiveTargetSnap);
      } finally {
        set({ isApplyingSnapshotInternally: false });
      }
      lastPushedSnapshotJson = JSON.stringify(effectiveTargetSnap);

      set({
        activeRemoteSession: {
          userId,
          alias: resolvedAlias,
          password: resolvedPassword,
          stashedLocalSnapshot,
          baseTargetSnapshot: userSnap,
          existingIndex: record.index,
          startedAt: Date.now(),
          lastPushedAt: null,
          pushCount: 0,
        },
        syncStatus: 'synced',
        statusMessage: `Remote tuning active for #${resolvedAlias} (${userId}).`,
      });

      useAppStore.getState().navigate('settings');
      return true;
    } catch (err) {
      set({
        syncStatus: 'error',
        errorMessage:
          err instanceof Error ? err.message : 'Failed to enter remote tuning session.',
      });
      return false;
    }
  },

  pushActiveRemoteSessionNow: async () => {
    const session = get().activeRemoteSession;
    if (!session || !bridgeCallbacks || get().isApplyingSnapshotInternally) return false;

    const currentSnap = collectUnifiedProfileSnapshot();
    const currentJson = JSON.stringify(currentSnap);
    if (currentJson === lastPushedSnapshotJson) return true;
    lastPushedSnapshotJson = currentJson;

    try {
      const pub = await bridgeCallbacks.publishDevProfileSlot({
        userId: session.userId,
        alias: session.alias,
        password: session.password,
        snapshot: currentSnap,
        baseSnapshot: session.baseTargetSnapshot,
        prevIndex: session.existingIndex,
      });

      set((state) => {
        if (!state.activeRemoteSession || state.activeRemoteSession.userId !== session.userId) {
          return state;
        }
        return {
          devRev: pub.rev,
          lastSyncedAt: Date.now(),
          statusMessage: `Pushed live update to #${session.alias} (dev rev #${pub.rev}).`,
          activeRemoteSession: {
            ...state.activeRemoteSession,
            existingIndex: {
              userId: session.userId,
              alias: session.alias,
              password: session.password,
              passphraseHash: state.activeRemoteSession.existingIndex?.passphraseHash ?? '',
              updatedAt: Date.now(),
              userRev: state.activeRemoteSession.existingIndex?.userRev ?? 0,
              devRev: pub.rev,
            },
            lastPushedAt: Date.now(),
            pushCount: state.activeRemoteSession.pushCount + 1,
          },
        };
      });
      return true;
    } catch (err) {
      set({
        errorMessage:
          err instanceof Error ? err.message : 'Failed to push remote developer profile.',
      });
      return false;
    }
  },

  exitRemoteTuningSession: async () => {
    const session = get().activeRemoteSession;
    if (!session) return;

    if (remotePushDebounceTimer) {
      clearTimeout(remotePushDebounceTimer);
      remotePushDebounceTimer = null;
    }

    const finalSnap = collectUnifiedProfileSnapshot();
    if (
      bridgeCallbacks &&
      !isDeepEqualJsonValue(finalSnap, session.baseTargetSnapshot) &&
      JSON.stringify(finalSnap) !== lastPushedSnapshotJson
    ) {
      try {
        await bridgeCallbacks.publishDevProfileSlot({
          userId: session.userId,
          alias: session.alias,
          password: session.password,
          snapshot: finalSnap,
          baseSnapshot: session.baseTargetSnapshot,
          prevIndex: session.existingIndex,
        });
      } catch {
        // Always restore developer local state even if final flush fails
      }
    }

    set({ isApplyingSnapshotInternally: true, activeRemoteSession: null });
    try {
      applyUnifiedProfileSnapshot(session.stashedLocalSnapshot);
    } finally {
      set({ isApplyingSnapshotInternally: false });
    }
    lastPushedSnapshotJson = JSON.stringify(session.stashedLocalSnapshot);

    set({
      syncStatus: 'idle',
      statusMessage: `Exited remote profile #${session.alias} and restored local configuration.`,
    });

    useAppStore.getState().navigate('dev-remote-profile');
    void get().refreshAccounts();
  },
}));

function scheduleLiveSyncFromStoreChange(): void {
  const state = useCloudProfileSyncStore.getState();
  if (state.isApplyingSnapshotInternally || !bridgeCallbacks) return;

  if (state.activeRemoteSession) {
    if (remotePushDebounceTimer) clearTimeout(remotePushDebounceTimer);
    remotePushDebounceTimer = setTimeout(() => {
      remotePushDebounceTimer = null;
      void useCloudProfileSyncStore.getState().pushActiveRemoteSessionNow();
    }, 220);
    return;
  }

  if (state.loggedInUser && state.autoSyncEnabled && state.conflicts.length === 0) {
    if (userAutoPushDebounceTimer) clearTimeout(userAutoPushDebounceTimer);
    userAutoPushDebounceTimer = setTimeout(() => {
      userAutoPushDebounceTimer = null;
      const curState = useCloudProfileSyncStore.getState();
      if (!curState.loggedInUser || curState.activeRemoteSession) return;
      const snap = collectUnifiedProfileSnapshot();
      if (JSON.stringify(snap) === lastPushedSnapshotJson) return;
      void curState.pushUserCloudProfile();
    }, 900);
  }
}

function ensureLiveStoreSubscriptions(): void {
  if (liveStoreSubscriptionsInitialized) return;
  liveStoreSubscriptionsInitialized = true;
  useAppStore.subscribe(scheduleLiveSyncFromStoreChange);
  floatingStore.subscribe(scheduleLiveSyncFromStoreChange);
  useSpatialAudioStore.subscribe(scheduleLiveSyncFromStoreChange);
  viewportStore.subscribe(scheduleLiveSyncFromStoreChange);
}
