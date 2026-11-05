import {
  isDeepEqualJsonValue,
  normalizeCloudUsername,
} from '../../config/cloudProfileMergePipeline';
import type {
  CloudProfileSyncBridgeCallbacks,
  CloudProfileSyncState,
  ProfileFlatSnapshot,
} from '../../config/cloudProfileSyncTypes';
import { useAppStore } from '../appStore';
import { collectUnifiedProfileSnapshot } from '../cloudProfileSnapshotCollector';
import {
  buildUpdatedIndexAfterRemotePush,
  evaluateRemoteTuningSessionFromRecord,
  performLocalUserBackupExport,
  performRemoteAccountBackupExport,
} from '../cloudProfileSyncPipeline';

type StoreSet = (
  partial:
    | Partial<CloudProfileSyncState>
    | ((state: CloudProfileSyncState) => Partial<CloudProfileSyncState>)
) => void;
type StoreGet = () => CloudProfileSyncState;

export interface RemoteTuningActionDeps {
  getBridge: () => CloudProfileSyncBridgeCallbacks | null;
  applySnapshotSafely: (snapshot: ProfileFlatSnapshot) => void;
  getLastPushedSnapshotJson: () => string;
  setLastPushedSnapshotJson: (json: string) => void;
  clearRemotePushDebounceTimer: () => void;
}

export function createCloudProfileRemoteTuningActions(
  set: StoreSet,
  get: StoreGet,
  deps: RemoteTuningActionDeps
): Pick<
  CloudProfileSyncState,
  | 'refreshAccounts'
  | 'upsertAccount'
  | 'deleteAccount'
  | 'startRemoteTuningSession'
  | 'pushActiveRemoteSessionNow'
  | 'exitRemoteTuningSession'
  | 'exportLocalUserProfileBackup'
  | 'exportRemoteAccountProfileBackup'
> {
  let remotePushInFlight = false;
  let remotePushQueued = false;

  return {
    refreshAccounts: async () => {
      const bridge = deps.getBridge();
      if (!bridge || !get().available) return;
      set({ isLoadingAccounts: true, errorMessage: null });
      try {
        const list = await bridge.fetchAllAccounts();
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
      const bridge = deps.getBridge();
      if (!cleanUsername || !trimmedPassword || !bridge) return false;

      try {
        const existing =
          (explicitUserId
            ? get().accounts.find((a) => a.userId === explicitUserId)
            : get().accounts.find(
                (a) => a.username === cleanUsername || a.userId === cleanUsername
              )) ?? null;
        const item = await bridge.upsertAccountDirectoryEntry({
          userId: explicitUserId || existing?.userId,
          username: cleanUsername,
          alias: trimmedAlias,
          displayName: displayName?.trim() || existing?.displayName || trimmedAlias,
          password: trimmedPassword,
          existingIndex: existing,
        });
        set((state) => ({
          accounts: [...state.accounts.filter((a) => a.userId !== item.userId), item].sort(
            (a, b) => a.username.localeCompare(b.username)
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
      const bridge = deps.getBridge();
      if (!cleanId || !bridge) return false;
      try {
        await bridge.deleteAccountDirectoryEntry(cleanId);
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
      const bridge = deps.getBridge();
      if (!targetId || !bridge || !get().available) return false;

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
        const record = await bridge.fetchUserCompleteRecord(targetId, 'dev');
        const { session, effectiveTargetSnap, initialHash } =
          evaluateRemoteTuningSessionFromRecord({
            account,
            targetId,
            record,
            fallbackSnapshot: collectUnifiedProfileSnapshot(),
            stashedLocalSnapshot,
          });

        deps.applySnapshotSafely(effectiveTargetSnap);
        deps.setLastPushedSnapshotJson(JSON.stringify(effectiveTargetSnap));

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
      const bridge = deps.getBridge();
      if (!session || !bridge || get().isApplyingSnapshotInternally) return false;

      if (remotePushInFlight) {
        remotePushQueued = true;
        return true;
      }

      const currentSnap = collectUnifiedProfileSnapshot();
      const currentJson = JSON.stringify(currentSnap);
      if (currentJson === deps.getLastPushedSnapshotJson()) return true;
      deps.setLastPushedSnapshotJson(currentJson);

      remotePushInFlight = true;
      try {
        const latestSession = get().activeRemoteSession ?? session;
        const pub = await bridge.publishDevProfileSlot({
          userId: latestSession.userId,
          username: latestSession.username,
          alias: latestSession.alias,
          displayName: latestSession.displayName,
          password: latestSession.password,
          snapshot: currentSnap,
          baseSnapshot: latestSession.baseTargetSnapshot,
          prevIndex: latestSession.existingIndex,
        });

        set((state) => {
          if (
            !state.activeRemoteSession ||
            state.activeRemoteSession.userId !== latestSession.userId
          ) {
            return state;
          }
          const nextIndex = buildUpdatedIndexAfterRemotePush({
            userId: latestSession.userId,
            username: latestSession.username,
            alias: latestSession.alias,
            displayName: latestSession.displayName,
            password: latestSession.password,
            existingIndex: state.activeRemoteSession.existingIndex,
            devRev: pub.rev,
            devRevHash: pub.revHash,
            snapshot: currentSnap,
          });
          return {
            devRev: pub.rev,
            devRevHash: pub.revHash,
            lastSyncedAt: Date.now(),
            statusMessage: `Deployed live commit #${pub.revHash} to #${latestSession.alias}.`,
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
      } finally {
        remotePushInFlight = false;
        if (remotePushQueued) {
          remotePushQueued = false;
          void get().pushActiveRemoteSessionNow();
        }
      }
    },

    exitRemoteTuningSession: async () => {
      const session = get().activeRemoteSession;
      if (!session) return;

      deps.clearRemotePushDebounceTimer();

      const finalSnap = collectUnifiedProfileSnapshot();
      const bridge = deps.getBridge();
      if (
        bridge &&
        !isDeepEqualJsonValue(finalSnap, session.baseTargetSnapshot) &&
        JSON.stringify(finalSnap) !== deps.getLastPushedSnapshotJson()
      ) {
        try {
          await bridge.publishDevProfileSlot({
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
      deps.applySnapshotSafely(session.stashedLocalSnapshot);
      deps.setLastPushedSnapshotJson(JSON.stringify(session.stashedLocalSnapshot));

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
      const bridge = deps.getBridge();
      if (!bridge || !get().available) {
        set({ errorMessage: 'Cloud profile transport is not available.' });
        return false;
      }
      try {
        const filename = await performRemoteAccountBackupExport(
          bridge,
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
          errorMessage:
            err instanceof Error ? err.message : 'Failed to export remote profile backup.',
        });
        return false;
      }
    },
  };
}
