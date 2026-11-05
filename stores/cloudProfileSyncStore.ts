/**
 * cloudProfileSyncStore.ts
 * Zustand store orchestrating:
 *   1. User Cloud Profile Sync (Garage -> Sync tab) with Unified Flat Key-Value snapshots,
 *      immutable `userId` + mutable `username` / `password` / `alias` / `displayName`,
 *      commit-style hash IDs (`revHash`), and Git-style 3-Way Merge conflict resolution.
 *   2. Persistent live remote profile subscription controlled by `allowRemoteProfileDeployment`,
 *      with automatic real-time pull and automatic Conflict Dialogue pop-up.
 *   3. Developer Account Directory Management & Live Remote Profile Tuning (`SETTINGS # <alias>`).
 *   4. JSON Profile Backup Export for both local user and remote accounts.
 */

import { create } from 'zustand';
import {
  formatCloudCommitHash,
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
import { spatialAttenuationProfiles } from '../config/spatialAttenuationProfiles';
import { safeStorage } from '../config/storageHelpers';
import { loadStoredPlayerName, saveStoredPlayerName } from '../config/vehiclePresets';
import { syncConflictDialogueState } from '../recipes/garage/CloudProfileConflictDialogue';
import { useSettingsPacingStore } from '../recipes/settings/settingsPacingStore';
import { useAppStore } from './appStore';
import { useBotsLoadoutStore } from './botsLoadoutStore';
import { createCloudProfileRemoteTuningActions } from './cloudProfileRemoteTuningActions';
import {
  SYNCABLE_EXTRA_STORAGE_KEYS,
  applyUnifiedProfileSnapshot,
  collectUnifiedProfileSnapshot,
} from './cloudProfileSnapshotCollector';
import {
  buildResolvedConflictsSnapshot,
  evaluateIncomingDevSlotMerge,
  evaluateRecordMergeOnLogin,
  loadAllowRemoteProfileDeployment,
  loadSavedCloudUser,
  loadStoredDevAckState,
  saveAllowRemoteProfileDeployment,
  saveCloudUser,
  saveStoredDevAckState,
  shouldApplyIncomingDevSlot,
} from './cloudProfileSyncHelpers';
import { floatingStore } from './floatingStore';
import { useKickoffTrainingStore } from './kickoffTrainingStore';
import { useSpatialAudioStore } from './spatialAudioStore';
import { useStaticTrainingBallCamTunerStore } from './staticTrainingBallCamTunerStore';
import { viewportStore } from './viewportStore';

export type {
  CloudDevSlotRecord,
  CloudFetchedUserCompleteRecord,
  CloudProfileSyncBridgeCallbacks,
  CloudProfileSyncState,
  CloudSyncStatus,
  CloudUserSlotRecord,
  LoggedInCloudUser,
};

const initialSavedUser = loadSavedCloudUser();
const initialDevAck = initialSavedUser ? loadStoredDevAckState(initialSavedUser.userId) : null;

let bridgeCallbacks: CloudProfileSyncBridgeCallbacks | null = null;
let activeDevWatchUnsubscribe: (() => void) | null = null;
let activeWatchedUserKey = '';
let liveStoreSubscriptionsInitialized = false;
let remotePushDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let userAutoPushDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushedSnapshotJson = '';
let lastAppliedDevSnapshot: ProfileFlatSnapshot | null =
  initialDevAck?.appliedDevSnapshot ?? null;

function applySnapshotSafely(snapshot: ProfileFlatSnapshot): void {
  useCloudProfileSyncStore.setState({ isApplyingSnapshotInternally: true });
  try {
    applyUnifiedProfileSnapshot(snapshot);
  } finally {
    useCloudProfileSyncStore.setState({ isApplyingSnapshotInternally: false });
  }
}

function stopActiveDevSlotWatch(): void {
  activeWatchedUserKey = '';
  if (activeDevWatchUnsubscribe) {
    activeDevWatchUnsubscribe();
    activeDevWatchUnsubscribe = null;
  }
}

function attachDevSlotWatchIfAllowed(userId: string, username?: string): void {
  const state = useCloudProfileSyncStore.getState();
  if (!bridgeCallbacks || !state.allowRemoteProfileDeployment) {
    stopActiveDevSlotWatch();
    return;
  }

  const resolvedUsername = username || state.loggedInUser?.username || '';
  const watchKey = `${userId}:${resolvedUsername}`;
  if (activeDevWatchUnsubscribe && activeWatchedUserKey === watchKey) {
    return;
  }

  stopActiveDevSlotWatch();
  activeWatchedUserKey = watchKey;

  activeDevWatchUnsubscribe = bridgeCallbacks.watchUserDevSlot(
    userId,
    (devPayload, indexPayload) => {
      const cur = useCloudProfileSyncStore.getState();
      if (!cur.loggedInUser) return;
      const matchesUser =
        cur.loggedInUser.userId === userId ||
        (resolvedUsername && cur.loggedInUser.username === resolvedUsername);
      if (!matchesUser) return;
      if (!cur.allowRemoteProfileDeployment || cur.activeRemoteSession) return;
      if (
        !shouldApplyIncomingDevSlot(
          devPayload,
          cur.devRev,
          cur.devRevHash,
          cur.loggedInUser.userId
        )
      ) {
        return;
      }

      const mergeRes = evaluateIncomingDevSlotMerge({
        devPayload,
        previousAppliedDevSnapshot: lastAppliedDevSnapshot,
        currentLocalSnapshot: collectUnifiedProfileSnapshot(),
      });
      lastAppliedDevSnapshot = devPayload.snapshot;
      applySnapshotSafely(mergeRes.mergedSnapshot);
      lastPushedSnapshotJson = JSON.stringify(mergeRes.mergedSnapshot);

      const incomingHash = formatCloudCommitHash(devPayload.revHash, devPayload.rev);
      const resolvedUserId = indexPayload?.userId || cur.loggedInUser.userId;
      const snapName = mergeRes.mergedSnapshot['garage.displayName'];
      const nextUser: LoggedInCloudUser = {
        ...cur.loggedInUser,
        userId: resolvedUserId,
        username: indexPayload?.username || cur.loggedInUser.username,
        alias: indexPayload?.alias || cur.loggedInUser.alias,
        displayName:
          typeof snapName === 'string' && snapName.trim()
            ? snapName.trim()
            : indexPayload?.displayName || cur.loggedInUser.displayName,
      };
      saveCloudUser(nextUser);

      if (mergeRes.conflicts.length === 0) {
        saveStoredDevAckState(resolvedUserId, {
          devRev: devPayload.rev,
          devRevHash: incomingHash,
          appliedDevSnapshot: devPayload.snapshot,
        });
      }

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

      syncConflictDialogueState(mergeRes.conflicts.length, useCloudProfileSyncStore);
    },
    resolvedUsername
  );
}

export const useCloudProfileSyncStore = create<CloudProfileSyncState>((set, get) => ({
  available: false,
  canManageAccounts: false,
  source: 'public',
  loggedInUser: initialSavedUser,
  syncStatus: 'idle',
  statusMessage: null,
  errorMessage: null,
  lastSyncedAt: null,
  userRev: 0,
  userRevHash: 'none',
  devRev: initialDevAck?.devRev ?? 0,
  devRevHash: initialDevAck?.devRevHash ?? 'none',
  autoSyncEnabled: true,
  allowRemoteProfileDeployment: loadAllowRemoteProfileDeployment(),
  mergedBaseSnapshot: null,
  conflicts: [],
  accounts: [],
  isLoadingAccounts: false,
  activeRemoteSession: null,
  isApplyingSnapshotInternally: false,

  setCapabilityState: ({ available, canManageAccounts, source }) => {
    set({ available, canManageAccounts, source });
    const cur = get();
    if (available && cur.loggedInUser && cur.allowRemoteProfileDeployment && !cur.activeRemoteSession) {
      attachDevSlotWatchIfAllowed(cur.loggedInUser.userId, cur.loggedInUser.username);
    }
  },

  setBridgeCallbacks: (callbacks) => {
    bridgeCallbacks = callbacks;
    ensureLiveStoreSubscriptions();
    const cur = get();
    if (
      callbacks &&
      cur.available &&
      cur.loggedInUser &&
      cur.allowRemoteProfileDeployment &&
      !cur.activeRemoteSession
    ) {
      attachDevSlotWatchIfAllowed(cur.loggedInUser.userId, cur.loggedInUser.username);
    }
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
      attachDevSlotWatchIfAllowed(user.userId, user.username);
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
        previousAppliedDevSnapshot: lastAppliedDevSnapshot,
      });

      lastAppliedDevSnapshot = evaluated.appliedDevSnapshot;
      saveCloudUser(evaluated.userObj);
      applySnapshotSafely(evaluated.targetSnap);

      if (evaluated.conflicts.length === 0 && evaluated.devRev > 0) {
        saveStoredDevAckState(evaluated.userObj.userId, {
          devRev: evaluated.devRev,
          devRevHash: evaluated.devRevHash,
          appliedDevSnapshot: evaluated.appliedDevSnapshot,
        });
      }

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
          ackDevRev: evaluated.conflicts.length === 0 ? evaluated.devRev : undefined,
          ackDevRevHash: evaluated.conflicts.length === 0 ? evaluated.devRevHash : undefined,
        });
        nextUserRev = pub.rev;
        nextUserRevHash = pub.revHash;
      }

      lastPushedSnapshotJson = JSON.stringify(evaluated.targetSnap);
      attachDevSlotWatchIfAllowed(evaluated.userObj.userId, evaluated.userObj.username);

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

      syncConflictDialogueState(evaluated.conflicts.length, useCloudProfileSyncStore);
      return true;
    } catch (err) {
      const fallbackUser = get().loggedInUser;
      if (fallbackUser && get().allowRemoteProfileDeployment) {
        attachDevSlotWatchIfAllowed(fallbackUser.userId, fallbackUser.username);
      }
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
    syncConflictDialogueState(0, useCloudProfileSyncStore);
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
    const { loggedInUser, available, devRev, devRevHash } = get();
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
        ackDevRev: devRev > 0 ? devRev : undefined,
        ackDevRevHash: devRevHash !== 'none' ? devRevHash : undefined,
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
    const { conflicts, loggedInUser, devRev, devRevHash } = get();
    if (conflicts.length === 0) return;
    const resolvedSnap = buildResolvedConflictsSnapshot(
      collectUnifiedProfileSnapshot(),
      conflicts,
      mode
    );
    applySnapshotSafely(resolvedSnap);
    if (loggedInUser && devRev > 0) {
      saveStoredDevAckState(loggedInUser.userId, {
        devRev,
        devRevHash,
        appliedDevSnapshot: lastAppliedDevSnapshot ?? resolvedSnap,
      });
    }
    syncConflictDialogueState(0, useCloudProfileSyncStore);
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

  ...createCloudProfileRemoteTuningActions(set, get, {
    getBridge: () => bridgeCallbacks,
    applySnapshotSafely,
    getLastPushedSnapshotJson: () => lastPushedSnapshotJson,
    setLastPushedSnapshotJson: (json) => {
      lastPushedSnapshotJson = json;
    },
    clearRemotePushDebounceTimer: () => {
      if (remotePushDebounceTimer) {
        clearTimeout(remotePushDebounceTimer);
        remotePushDebounceTimer = null;
      }
    },
  }),
}));

const SYNCABLE_EXTRA_STORAGE_KEY_SET = new Set<string>(SYNCABLE_EXTRA_STORAGE_KEYS);

function scheduleLiveSyncFromStoreChange(): void {
  const state = useCloudProfileSyncStore.getState();
  if (state.isApplyingSnapshotInternally || !bridgeCallbacks) return;

  if (state.activeRemoteSession) {
    if (remotePushDebounceTimer) clearTimeout(remotePushDebounceTimer);
    remotePushDebounceTimer = setTimeout(() => {
      remotePushDebounceTimer = null;
      void useCloudProfileSyncStore.getState().pushActiveRemoteSessionNow();
    }, 80);
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
  useBotsLoadoutStore.subscribe(scheduleLiveSyncFromStoreChange);
  useKickoffTrainingStore.subscribe(scheduleLiveSyncFromStoreChange);
  useStaticTrainingBallCamTunerStore.subscribe(scheduleLiveSyncFromStoreChange);
  spatialAttenuationProfiles.subscribe(scheduleLiveSyncFromStoreChange);
  safeStorage.subscribe((key) => {
    if (SYNCABLE_EXTRA_STORAGE_KEY_SET.has(key)) {
      scheduleLiveSyncFromStoreChange();
    }
  });
}
