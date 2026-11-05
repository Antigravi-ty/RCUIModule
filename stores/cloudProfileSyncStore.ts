/**
 * cloudProfileSyncStore.ts
 * Zustand store orchestrating:
 *   1. User Cloud Profile Sync (Garage -> Sync tab) with Unified Flat Key-Value snapshots,
 *      immutable `userId` + mutable `username` / `password` / `alias` / `displayName`,
 *      commit-style hash IDs (`revHash`), and Git-style 3-Way Merge conflict resolution.
 *   2. Persistent live remote profile subscription controlled by `allowRemoteProfileDeployment`.
 *   3. Developer Account Directory Management & Live Remote Profile Tuning (`SETTINGS # <alias>`).
 *   4. JSON Profile Backup Export for both local user and remote accounts.
 */

import { create } from 'zustand';
import {
  computeProfileThreeWayMerge,
  formatCloudCommitHash,
  isDeepEqualJsonValue,
  normalizeCloudUsername,
} from '../config/cloudProfileMergePipeline';
import {
  type CloudDevSlotRecord,
  type CloudFetchedUserCompleteRecord,
  type CloudProfileSyncBridgeCallbacks,
  type CloudProfileSyncState,
  type CloudSyncStatus,
  type CloudUserSlotRecord,
  type LoggedInCloudUser,
  type ProfileFlatSnapshot,
} from '../config/cloudProfileSyncTypes';
import { loadStoredPlayerName, saveStoredPlayerName } from '../config/vehiclePresets';
import { useSettingsPacingStore } from '../recipes/settings/settingsPacingStore';
import { useAppStore } from './appStore';
import { applyUnifiedProfileSnapshot, collectUnifiedProfileSnapshot } from './cloudProfileSnapshotCollector';
import {
  buildResolvedConflictsSnapshot,
  buildUpdatedIndexAfterRemotePush,
  evaluateRecordMergeOnLogin,
  evaluateRemoteTuningSessionFromRecord,
  loadAllowRemoteProfileDeployment,
  loadSavedCloudUser,
  performLocalUserBackupExport,
  performRemoteAccountBackupExport,
  saveAllowRemoteProfileDeployment,
  saveCloudUser,
  shouldApplyIncomingDevSlot,
} from './cloudProfileSyncHelpers';
import { floatingStore } from './floatingStore';
import { useSpatialAudioStore } from './spatialAudioStore';
import { viewportStore } from './viewportStore';

export type { CloudDevSlotRecord, CloudFetchedUserCompleteRecord, CloudProfileSyncBridgeCallbacks, CloudProfileSyncState, CloudSyncStatus, CloudUserSlotRecord, LoggedInCloudUser };

let bridgeCallbacks: CloudProfileSyncBridgeCallbacks | null = null;
let activeDevWatchUnsubscribe: (() => void) | null = null;
let liveStoreSubscriptionsInitialized = false;
let remotePushDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let userAutoPushDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushedSnapshotJson = '';

function applySnapshotSafely(snapshot: ProfileFlatSnapshot): void {
  useCloudProfileSyncStore.setState({ isApplyingSnapshotInternally: true });
  try {
    applyUnifiedProfileSnapshot(snapshot);
  } finally {
    useCloudProfileSyncStore.setState({ isApplyingSnapshotInternally: false });
  }
}

function stopActiveDevSlotWatch(): void {
  if (activeDevWatchUnsubscribe) {
    activeDevWatchUnsubscribe();
    activeDevWatchUnsubscribe = null;
  }
}

function attachDevSlotWatchIfAllowed(userId: string): void {
  stopActiveDevSlotWatch();
  const state = useCloudProfileSyncStore.getState();
  if (!bridgeCallbacks || !state.allowRemoteProfileDeployment) return;

  activeDevWatchUnsubscribe = bridgeCallbacks.watchUserDevSlot(
    userId,
    (devPayload, indexPayload) => {
      const cur = useCloudProfileSyncStore.getState();
      if (!cur.loggedInUser || cur.loggedInUser.userId !== userId) return;
      if (!cur.allowRemoteProfileDeployment || cur.activeRemoteSession) return;
      if (!shouldApplyIncomingDevSlot(devPayload, cur.devRev, cur.devRevHash)) return;

      const mergeRes = computeProfileThreeWayMerge(
        devPayload.baseSnapshot,
        collectUnifiedProfileSnapshot(),
        devPayload.snapshot
      );
      applySnapshotSafely(mergeRes.mergedSnapshot);
      lastPushedSnapshotJson = JSON.stringify(mergeRes.mergedSnapshot);

      const incomingHash = formatCloudCommitHash(devPayload.revHash, devPayload.rev);
      const snapName = mergeRes.mergedSnapshot['garage.displayName'];
      const nextUser: LoggedInCloudUser = {
        ...cur.loggedInUser,
        username: indexPayload?.username || cur.loggedInUser.username,
        alias: indexPayload?.alias || cur.loggedInUser.alias,
        displayName:
          typeof snapName === 'string' && snapName.trim()
            ? snapName.trim()
            : indexPayload?.displayName || cur.loggedInUser.displayName,
      };
      saveCloudUser(nextUser);

      useCloudProfileSyncStore.setState({
        loggedInUser: nextUser,
        devRev: devPayload.rev,
        devRevHash: incomingHash,
        mergedBaseSnapshot: mergeRes.mergedSnapshot,
        conflicts: mergeRes.conflicts,
        syncStatus: mergeRes.conflicts.length > 0 ? 'conflict' : 'synced',
        lastSyncedAt: Date.now(),
        statusMessage:
          mergeRes.conflicts.length > 0
            ? `${mergeRes.conflicts.length} conflict(s) detected from developer commit #${incomingHash}.`
            : `Applied live developer commit #${incomingHash} (${mergeRes.autoAppliedDevKeys.length} field(s)).`,
      });
    }
  );
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
  userRevHash: 'none',
  devRev: 0,
  devRevHash: 'none',
  autoSyncEnabled: true,
  allowRemoteProfileDeployment: loadAllowRemoteProfileDeployment(),
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

  setAllowRemoteProfileDeployment: (enabled) => {
    const next = Boolean(enabled);
    saveAllowRemoteProfileDeployment(next);
    set({ allowRemoteProfileDeployment: next });
    const user = get().loggedInUser;
    if (!next) {
      stopActiveDevSlotWatch();
      set({ statusMessage: 'Live remote profile deployment paused (manual sync only).' });
    } else if (user && get().available && bridgeCallbacks) {
      attachDevSlotWatchIfAllowed(user.userId);
      void get().pullUserCloudProfile(true);
    }
  },

  updateUserDisplayName: async (displayName) => {
    const clean = String(displayName || '').trim().slice(0, 24) || loadStoredPlayerName();
    saveStoredPlayerName(clean);
    useAppStore.getState().setOnlineSession({ playerName: clean });

    const currentUser = get().loggedInUser;
    if (currentUser) {
      const updatedUser: LoggedInCloudUser = { ...currentUser, displayName: clean };
      saveCloudUser(updatedUser);
      set({
        loggedInUser: updatedUser,
        statusMessage: `Updated Multiplayer Display Name to "${clean}".`,
      });
      if (get().available && bridgeCallbacks) {
        await get().pushUserCloudProfile();
      }
    }
  },

  loginAndSyncUser: async (usernameInput, password, forceIncludeDevSlot = false) => {
    const normalizedInput = normalizeCloudUsername(usernameInput);
    const trimmedPassword = password.trim();
    if (!normalizedInput || !trimmedPassword) {
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
      statusMessage: `Connecting to cloud profile "@${normalizedInput}"...`,
    });

    try {
      const record = await bridgeCallbacks.fetchUserCompleteRecord(normalizedInput, 'client');
      const resolvedUserId = record.index?.userId || normalizedInput;
      const [hashByUserId, hashByUsername] = await Promise.all([
        bridgeCallbacks.computePassphraseHash(resolvedUserId, trimmedPassword),
        bridgeCallbacks.computePassphraseHash(normalizedInput, trimmedPassword),
      ]);

      const expectedHash = record.index?.passphraseHash || record.userSlot?.passphraseHash || '';
      const expectedPlainPassword = record.index?.password || '';
      if (
        expectedHash &&
        expectedHash !== hashByUserId &&
        expectedHash !== hashByUsername &&
        (!expectedPlainPassword || expectedPlainPassword !== trimmedPassword)
      ) {
        set({
          syncStatus: 'error',
          errorMessage: 'Incorrect password for this cloud account.',
          statusMessage: null,
        });
        return false;
      }

      const evaluated = evaluateRecordMergeOnLogin({
        usernameInput: normalizedInput,
        trimmedPassword,
        record,
        currentLocalSnapshot: collectUnifiedProfileSnapshot(),
        allowRemoteDeployment: get().allowRemoteProfileDeployment || forceIncludeDevSlot,
      });

      saveCloudUser(evaluated.userObj);
      applySnapshotSafely(evaluated.targetSnap);

      let nextUserRev = evaluated.userRev;
      let nextUserRevHash = evaluated.userRevHash;

      if (!record.userSlot || evaluated.autoAppliedCount > 0) {
        const pub = await bridgeCallbacks.publishUserProfileSlot({
          userId: evaluated.userObj.userId,
          username: evaluated.userObj.username,
          alias: evaluated.userObj.alias,
          displayName: evaluated.userObj.displayName,
          password: trimmedPassword,
          snapshot: evaluated.targetSnap,
          prevIndex: record.index,
        });
        nextUserRev = pub.rev;
        nextUserRevHash = pub.revHash;
      }

      lastPushedSnapshotJson = JSON.stringify(evaluated.targetSnap);
      attachDevSlotWatchIfAllowed(evaluated.userObj.userId);

      set({
        loggedInUser: evaluated.userObj,
        userRev: nextUserRev,
        userRevHash: nextUserRevHash,
        devRev: evaluated.devRev,
        devRevHash: evaluated.devRevHash,
        mergedBaseSnapshot: evaluated.targetSnap,
        conflicts: evaluated.conflicts,
        syncStatus: evaluated.conflicts.length > 0 ? 'conflict' : 'synced',
        lastSyncedAt: Date.now(),
        errorMessage: null,
        statusMessage:
          evaluated.conflicts.length > 0
            ? `Synced with ${evaluated.conflicts.length} conflict(s) requiring resolution.`
            : evaluated.autoAppliedCount > 0
              ? `Merged ${evaluated.autoAppliedCount} developer setting(s) (commit #${nextUserRevHash}).`
              : `Synced @${evaluated.userObj.username} (commit #${nextUserRevHash}).`,
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
    stopActiveDevSlotWatch();
    saveCloudUser(null);
    set({
      loggedInUser: null,
      syncStatus: 'idle',
      statusMessage: 'Signed out of cloud profile sync.',
      errorMessage: null,
      conflicts: [],
    });
  },

  pullUserCloudProfile: async (forceIncludeDevSlot = true) => {
    const user = get().loggedInUser;
    if (!user) return false;
    return get().loginAndSyncUser(
      user.username || user.userId,
      user.password,
      forceIncludeDevSlot
    );
  },

  pushUserCloudProfile: async () => {
    const { loggedInUser, available } = get();
    if (!loggedInUser || !bridgeCallbacks || !available) return false;
    set({ syncStatus: 'syncing', errorMessage: null });
    try {
      const snapshot = collectUnifiedProfileSnapshot();
      const snapName = snapshot['garage.displayName'];
      const liveDisplayName =
        typeof snapName === 'string' && snapName.trim()
          ? snapName.trim()
          : loggedInUser.displayName;
      const record = await bridgeCallbacks.fetchUserCompleteRecord(loggedInUser.userId, 'client');
      const pub = await bridgeCallbacks.publishUserProfileSlot({
        userId: loggedInUser.userId,
        username: loggedInUser.username,
        alias: record.index?.alias || loggedInUser.alias,
        displayName: liveDisplayName,
        password: loggedInUser.password,
        snapshot,
        prevIndex: record.index,
      });
      lastPushedSnapshotJson = JSON.stringify(snapshot);
      const updatedUser: LoggedInCloudUser = {
        ...loggedInUser,
        displayName: liveDisplayName,
        alias: record.index?.alias || loggedInUser.alias,
      };
      saveCloudUser(updatedUser);
      set({
        loggedInUser: updatedUser,
        userRev: pub.rev,
        userRevHash: pub.revHash,
        mergedBaseSnapshot: snapshot,
        syncStatus: 'synced',
        lastSyncedAt: Date.now(),
        statusMessage: `Pushed local settings to cloud (commit #${pub.revHash}).`,
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
    const resolvedSnap = buildResolvedConflictsSnapshot(
      collectUnifiedProfileSnapshot(),
      conflicts,
      mode
    );
    applySnapshotSafely(resolvedSnap);
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

  upsertAccount: async (username, password, alias, displayName, explicitUserId) => {
    const cleanUsername = normalizeCloudUsername(username);
    const trimmedPassword = password.trim();
    const trimmedAlias = alias.trim() || cleanUsername;
    if (!cleanUsername || !trimmedPassword || !bridgeCallbacks) return false;

    try {
      const existing =
        (explicitUserId
          ? get().accounts.find((a) => a.userId === explicitUserId)
          : get().accounts.find(
              (a) => a.username === cleanUsername || a.userId === cleanUsername
            )) ?? null;
      const item = await bridgeCallbacks.upsertAccountDirectoryEntry({
        userId: explicitUserId || existing?.userId,
        username: cleanUsername,
        alias: trimmedAlias,
        displayName: displayName?.trim() || existing?.displayName || trimmedAlias,
        password: trimmedPassword,
        existingIndex: existing,
      });
      set((state) => ({
        accounts: [...state.accounts.filter((a) => a.userId !== item.userId), item].sort((a, b) =>
          a.username.localeCompare(b.username)
        ),
        statusMessage: `Saved account @${item.username} (#${item.alias}, ID: ${item.userId}).`,
        errorMessage: null,
      }));
      return true;
    } catch (err) {
      set({ errorMessage: err instanceof Error ? err.message : 'Failed to save account.' });
      return false;
    }
  },

  deleteAccount: async (userId) => {
    const cleanId = String(userId || '').trim();
    if (!cleanId || !bridgeCallbacks) return false;
    try {
      await bridgeCallbacks.deleteAccountDirectoryEntry(cleanId);
      set((state) => ({
        accounts: state.accounts.filter((a) => a.userId !== cleanId),
        statusMessage: `Removed account (${cleanId}) from cloud directory.`,
      }));
      return true;
    } catch (err) {
      set({ errorMessage: err instanceof Error ? err.message : 'Failed to delete account.' });
      return false;
    }
  },

  startRemoteTuningSession: async (account) => {
    const targetId = String(account.userId || account.username || '').trim();
    if (!targetId || !bridgeCallbacks || !get().available) return false;

    const existingSession = get().activeRemoteSession;
    const stashedLocalSnapshot = existingSession
      ? existingSession.stashedLocalSnapshot
      : collectUnifiedProfileSnapshot();

    set({
      syncStatus: 'syncing',
      errorMessage: null,
      statusMessage: `Syncing latest user data for #${account.alias || targetId}...`,
    });

    try {
      const record = await bridgeCallbacks.fetchUserCompleteRecord(targetId, 'dev');
      const { session, effectiveTargetSnap, initialHash } = evaluateRemoteTuningSessionFromRecord({
        account,
        targetId,
        record,
        fallbackSnapshot: collectUnifiedProfileSnapshot(),
        stashedLocalSnapshot,
      });

      applySnapshotSafely(effectiveTargetSnap);
      lastPushedSnapshotJson = JSON.stringify(effectiveTargetSnap);

      set({
        activeRemoteSession: session,
        syncStatus: 'synced',
        statusMessage: `Remote tuning active for #${session.alias} (@${session.username}, base commit #${initialHash}).`,
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
        username: session.username,
        alias: session.alias,
        displayName: session.displayName,
        password: session.password,
        snapshot: currentSnap,
        baseSnapshot: session.baseTargetSnapshot,
        prevIndex: session.existingIndex,
      });

      set((state) => {
        if (!state.activeRemoteSession || state.activeRemoteSession.userId !== session.userId) {
          return state;
        }
        const nextIndex = buildUpdatedIndexAfterRemotePush({
          userId: session.userId,
          username: session.username,
          alias: session.alias,
          displayName: session.displayName,
          password: session.password,
          existingIndex: state.activeRemoteSession.existingIndex,
          devRev: pub.rev,
          devRevHash: pub.revHash,
          snapshot: currentSnap,
        });
        return {
          devRev: pub.rev,
          devRevHash: pub.revHash,
          lastSyncedAt: Date.now(),
          statusMessage: `Deployed live commit #${pub.revHash} to #${session.alias}.`,
          activeRemoteSession: {
            ...state.activeRemoteSession,
            existingIndex: nextIndex,
            lastPushedAt: Date.now(),
            pushCount: state.activeRemoteSession.pushCount + 1,
            lastCommitHash: pub.revHash,
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
          username: session.username,
          alias: session.alias,
          displayName: session.displayName,
          password: session.password,
          snapshot: finalSnap,
          baseSnapshot: session.baseTargetSnapshot,
          prevIndex: session.existingIndex,
        });
      } catch {
        // Always restore developer local state even if final flush fails
      }
    }

    set({ activeRemoteSession: null });
    applySnapshotSafely(session.stashedLocalSnapshot);
    lastPushedSnapshotJson = JSON.stringify(session.stashedLocalSnapshot);

    set({
      syncStatus: 'idle',
      statusMessage: `Exited remote profile #${session.alias} and restored local configuration.`,
    });
    useAppStore.getState().navigate('dev-remote-profile');
    void get().refreshAccounts();
  },

  exportLocalUserProfileBackup: () => {
    const state = get();
    const filename = performLocalUserBackupExport({
      snapshot: collectUnifiedProfileSnapshot(),
      loggedInUser: state.loggedInUser,
      userRev: state.userRev,
      userRevHash: state.userRevHash,
      devRev: state.devRev,
      devRevHash: state.devRevHash,
    });
    set({ statusMessage: `Exported profile backup "${filename}".`, errorMessage: null });
    return filename;
  },

  exportRemoteAccountProfileBackup: async (account) => {
    if (!bridgeCallbacks || !get().available) {
      set({ errorMessage: 'Cloud profile transport is not available.' });
      return false;
    }
    try {
      const filename = await performRemoteAccountBackupExport(
        bridgeCallbacks,
        account,
        collectUnifiedProfileSnapshot()
      );
      set({
        statusMessage: `Exported backup "${filename}" for #${account.alias} (@${account.username}).`,
        errorMessage: null,
      });
      return true;
    } catch (err) {
      set({
        errorMessage: err instanceof Error ? err.message : 'Failed to export remote profile backup.',
      });
      return false;
    }
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
    }, 180);
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
    }, 650);
  }
}

function ensureLiveStoreSubscriptions(): void {
  if (liveStoreSubscriptionsInitialized) return;
  liveStoreSubscriptionsInitialized = true;
  useAppStore.subscribe(scheduleLiveSyncFromStoreChange);
  floatingStore.subscribe(scheduleLiveSyncFromStoreChange);
  useSpatialAudioStore.subscribe(scheduleLiveSyncFromStoreChange);
  viewportStore.subscribe(scheduleLiveSyncFromStoreChange);
  useSettingsPacingStore.subscribe(scheduleLiveSyncFromStoreChange);
}
