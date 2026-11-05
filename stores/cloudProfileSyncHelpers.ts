/**
 * cloudProfileSyncHelpers.ts
 * Persistence, identity resolution, and snapshot merge helpers for `cloudProfileSyncStore`.
 */

import {
  exportManagedAccountBackup,
  exportUserBackupFromLoggedInState,
} from '../config/cloudProfileBackupExporter';
import {
  computeCommitHashSync,
  computeProfileThreeWayMerge,
  formatCloudCommitHash,
  generateCloudUserId,
  normalizeCloudUsername,
} from '../config/cloudProfileMergePipeline';
import {
  type ActiveRemoteTuningSession,
  type CloudDevSlotRecord,
  type CloudFetchedUserCompleteRecord,
  type CloudManagedAccountItem,
  type CloudProfileSyncBridgeCallbacks,
  type LoggedInCloudUser,
  type ProfileFlatSnapshot,
  type ProfileMergeConflictItem,
} from '../config/cloudProfileSyncTypes';
import { safeStorage } from '../config/storageHelpers';
import { loadStoredPlayerName } from '../config/vehiclePresets';

const CLOUD_AUTH_STORAGE_KEY = 'rc_cloud_profile_auth_v1';
const ALLOW_REMOTE_DEPLOY_STORAGE_KEY = 'rc_allow_remote_profile_deployment_v1';

export function loadSavedCloudUser(): LoggedInCloudUser | null {
  try {
    const raw = safeStorage.get(CLOUD_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === 'string' && typeof parsed.password === 'string') {
      const username =
        typeof parsed.username === 'string' && parsed.username
          ? normalizeCloudUsername(parsed.username)
          : normalizeCloudUsername(parsed.userId);
      const alias =
        typeof parsed.alias === 'string' && parsed.alias.trim()
          ? parsed.alias.trim()
          : username;
      const displayName =
        typeof parsed.displayName === 'string' && parsed.displayName.trim()
          ? parsed.displayName.trim()
          : loadStoredPlayerName();
      return {
        userId: parsed.userId,
        username,
        alias,
        displayName,
        password: parsed.password,
      };
    }
  } catch {
    // Ignore malformed saved auth
  }
  return null;
}

export function saveCloudUser(user: LoggedInCloudUser | null): void {
  if (!user) {
    safeStorage.remove(CLOUD_AUTH_STORAGE_KEY);
  } else {
    safeStorage.set(CLOUD_AUTH_STORAGE_KEY, JSON.stringify(user));
  }
}

export function loadAllowRemoteProfileDeployment(): boolean {
  const raw = safeStorage.get(ALLOW_REMOTE_DEPLOY_STORAGE_KEY);
  if (raw === 'false') return false;
  if (raw === 'true') return true;
  return true;
}

export function saveAllowRemoteProfileDeployment(enabled: boolean): void {
  safeStorage.set(ALLOW_REMOTE_DEPLOY_STORAGE_KEY, enabled ? 'true' : 'false');
}

export interface EvaluatedCloudLoginMerge {
  userObj: LoggedInCloudUser;
  targetSnap: ProfileFlatSnapshot;
  conflicts: ProfileMergeConflictItem[];
  autoAppliedCount: number;
  userRev: number;
  userRevHash: string;
  devRev: number;
  devRevHash: string;
}

export function evaluateRecordMergeOnLogin(params: {
  usernameInput: string;
  trimmedPassword: string;
  record: CloudFetchedUserCompleteRecord;
  currentLocalSnapshot: ProfileFlatSnapshot;
  allowRemoteDeployment: boolean;
}): EvaluatedCloudLoginMerge {
  const {
    usernameInput,
    trimmedPassword,
    record,
    currentLocalSnapshot,
    allowRemoteDeployment,
  } = params;

  const normalizedUsername = normalizeCloudUsername(usernameInput);
  const resolvedUserId =
    record.index?.userId ||
    (normalizedUsername.startsWith('u_')
      ? normalizedUsername
      : generateCloudUserId(normalizedUsername));
  const resolvedUsername =
    record.index?.username ? normalizeCloudUsername(record.index.username) : normalizedUsername;
  const resolvedAlias = record.index?.alias?.trim() || resolvedUsername;

  const baselineUserSnap = record.userSlot?.snapshot ?? currentLocalSnapshot;
  let targetSnap: ProfileFlatSnapshot = { ...baselineUserSnap };
  let conflicts: ProfileMergeConflictItem[] = [];
  let autoAppliedCount = 0;

  if (
    allowRemoteDeployment &&
    record.devSlot?.snapshot &&
    Object.keys(record.devSlot.snapshot).length > 0
  ) {
    const mergeResult = computeProfileThreeWayMerge(
      record.devSlot.baseSnapshot,
      baselineUserSnap,
      record.devSlot.snapshot
    );
    targetSnap = mergeResult.mergedSnapshot;
    conflicts = mergeResult.conflicts;
    autoAppliedCount = mergeResult.autoAppliedDevKeys.length;
  }

  const snapshotDisplayName =
    typeof targetSnap['garage.displayName'] === 'string' &&
    targetSnap['garage.displayName'].trim()
      ? targetSnap['garage.displayName'].trim()
      : '';
  const resolvedDisplayName =
    snapshotDisplayName ||
    record.index?.displayName?.trim() ||
    loadStoredPlayerName();

  targetSnap['garage.displayName'] = resolvedDisplayName;

  const userRev = record.userSlot?.rev ?? record.index?.userRev ?? 0;
  const devRev = record.devSlot?.rev ?? record.index?.devRev ?? 0;
  const userRevHash = formatCloudCommitHash(
    record.userSlot?.revHash ?? record.index?.userRevHash,
    userRev
  );
  const devRevHash = formatCloudCommitHash(
    record.devSlot?.revHash ?? record.index?.devRevHash,
    devRev
  );

  const userObj: LoggedInCloudUser = {
    userId: resolvedUserId,
    username: resolvedUsername,
    alias: resolvedAlias,
    displayName: resolvedDisplayName,
    password: trimmedPassword,
  };

  return {
    userObj,
    targetSnap,
    conflicts,
    autoAppliedCount,
    userRev,
    userRevHash,
    devRev,
    devRevHash,
  };
}

export function shouldApplyIncomingDevSlot(
  devPayload: CloudDevSlotRecord,
  currentDevRev: number,
  currentDevRevHash: string
): boolean {
  const incomingHash = formatCloudCommitHash(devPayload.revHash, devPayload.rev);
  if (devPayload.rev > currentDevRev) return true;
  if (
    devPayload.rev === currentDevRev &&
    incomingHash !== currentDevRevHash &&
    incomingHash !== 'none'
  ) {
    return true;
  }
  return false;
}

export function buildUpdatedIndexAfterRemotePush(params: {
  userId: string;
  username: string;
  alias: string;
  displayName: string;
  password: string;
  existingIndex: CloudManagedAccountItem | null;
  devRev: number;
  devRevHash: string;
  snapshot: ProfileFlatSnapshot;
}): CloudManagedAccountItem {
  const {
    userId,
    username,
    alias,
    displayName,
    password,
    existingIndex,
    devRev,
    devRevHash,
    snapshot,
  } = params;
  const userRev = existingIndex?.userRev ?? 0;
  const userRevHash =
    existingIndex?.userRevHash ||
    (userRev > 0 ? computeCommitHashSync(snapshot, userRev, userId) : 'none');
  return {
    userId,
    username: username || existingIndex?.username || userId,
    alias: alias || existingIndex?.alias || username || userId,
    displayName:
      displayName ||
      (typeof snapshot['garage.displayName'] === 'string'
        ? String(snapshot['garage.displayName'])
        : existingIndex?.displayName || alias || userId),
    password: password || existingIndex?.password || '',
    passphraseHash: existingIndex?.passphraseHash ?? '',
    updatedAt: Date.now(),
    userRev,
    userRevHash,
    devRev,
    devRevHash,
  };
}

export function evaluateRemoteTuningSessionFromRecord(params: {
  account: {
    userId: string;
    username?: string;
    alias?: string;
    displayName?: string;
    password?: string;
  };
  targetId: string;
  record: CloudFetchedUserCompleteRecord;
  fallbackSnapshot: ProfileFlatSnapshot;
  stashedLocalSnapshot: ProfileFlatSnapshot;
}): {
  session: ActiveRemoteTuningSession;
  effectiveTargetSnap: ProfileFlatSnapshot;
  initialHash: string;
} {
  const { account, targetId, record, fallbackSnapshot, stashedLocalSnapshot } = params;
  const resolvedUserId = record.index?.userId || targetId;
  const resolvedUsername =
    account.username || record.index?.username || normalizeCloudUsername(targetId);
  const resolvedAlias = account.alias?.trim() || record.index?.alias?.trim() || resolvedUsername;
  const resolvedDisplayName =
    account.displayName?.trim() || record.index?.displayName?.trim() || resolvedAlias;
  const resolvedPassword = account.password?.trim() || record.index?.password?.trim() || '';
  const userSnap = record.userSlot?.snapshot ?? fallbackSnapshot;
  const effectiveTargetSnap =
    record.devSlot?.snapshot && Object.keys(record.devSlot.snapshot).length > 0
      ? computeProfileThreeWayMerge(
          record.devSlot.baseSnapshot,
          userSnap,
          record.devSlot.snapshot
        ).mergedSnapshot
      : userSnap;

  const initialHash = formatCloudCommitHash(
    record.devSlot?.revHash ?? record.userSlot?.revHash,
    record.devSlot?.rev || record.userSlot?.rev || 0
  );

  return {
    session: {
      userId: resolvedUserId,
      username: resolvedUsername,
      alias: resolvedAlias,
      displayName: resolvedDisplayName,
      password: resolvedPassword,
      stashedLocalSnapshot,
      baseTargetSnapshot: userSnap,
      existingIndex: record.index,
      startedAt: Date.now(),
      lastPushedAt: null,
      pushCount: 0,
      lastCommitHash: initialHash !== 'none' ? initialHash : null,
    },
    effectiveTargetSnap,
    initialHash,
  };
}

export function buildResolvedConflictsSnapshot(
  currentSnapshot: ProfileFlatSnapshot,
  conflicts: ProfileMergeConflictItem[],
  mode: 'selected' | 'all-local' | 'all-dev'
): ProfileFlatSnapshot {
  const resolvedSnap: ProfileFlatSnapshot = { ...currentSnapshot };
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
  return resolvedSnap;
}

export function performLocalUserBackupExport(params: {
  snapshot: ProfileFlatSnapshot;
  loggedInUser: LoggedInCloudUser | null;
  userRev: number;
  userRevHash: string;
  devRev: number;
  devRevHash: string;
}): string {
  const { snapshot, loggedInUser, userRev, userRevHash, devRev, devRevHash } = params;
  const activeHash =
    userRevHash !== 'none' ? userRevHash : devRevHash !== 'none' ? devRevHash : null;
  return exportUserBackupFromLoggedInState(snapshot, loggedInUser, userRev, devRev, activeHash);
}

export async function performRemoteAccountBackupExport(
  bridge: CloudProfileSyncBridgeCallbacks,
  account: CloudManagedAccountItem,
  fallbackSnapshot: ProfileFlatSnapshot
): Promise<string> {
  const record = await bridge.fetchUserCompleteRecord(account.userId, 'dev');
  const baseSnap = record.userSlot?.snapshot ?? fallbackSnapshot;
  const mergedSnap =
    record.devSlot?.snapshot && Object.keys(record.devSlot.snapshot).length > 0
      ? computeProfileThreeWayMerge(
          record.devSlot.baseSnapshot,
          baseSnap,
          record.devSlot.snapshot
        ).mergedSnapshot
      : baseSnap;
  const activeHash =
    record.devSlot?.revHash ||
    record.userSlot?.revHash ||
    account.devRevHash ||
    account.userRevHash;
  return exportManagedAccountBackup(account, mergedSnap, activeHash);
}
