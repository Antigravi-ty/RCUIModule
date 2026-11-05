/**
 * cloudProfileSyncTypes.ts
 * Pure types and human-readable field label helpers for Unified Flat Cloud Profile Sync
 * and Git-style 3-Way Merge conflict resolution.
 */

export type ProfileFlatSnapshot = Record<string, unknown>;

export interface ProfileMergeConflictItem {
  key: string;
  label: string;
  baseValue: unknown;
  localValue: unknown;
  devValue: unknown;
  selectedSource: 'local' | 'dev';
}

export interface ProfileThreeWayMergeResult {
  mergedSnapshot: ProfileFlatSnapshot;
  autoAppliedDevKeys: string[];
  keptLocalKeys: string[];
  conflicts: ProfileMergeConflictItem[];
}

export interface CloudManagedAccountItem {
  userId: string;
  alias: string;
  password: string;
  passphraseHash: string;
  updatedAt: number;
  userRev: number;
  devRev: number;
}

export interface ActiveRemoteTuningSession {
  userId: string;
  alias: string;
  password: string;
  stashedLocalSnapshot: ProfileFlatSnapshot;
  baseTargetSnapshot: ProfileFlatSnapshot;
  existingIndex: CloudManagedAccountItem | null;
  startedAt: number;
  lastPushedAt: number | null;
  pushCount: number;
}

export interface CloudUserSlotRecord {
  rev: number;
  updatedAt: number;
  passphraseHash: string;
  snapshot: ProfileFlatSnapshot;
}

export interface CloudDevSlotRecord {
  rev: number;
  updatedAt: number;
  snapshot: ProfileFlatSnapshot;
  baseSnapshot: ProfileFlatSnapshot;
}

export interface CloudFetchedUserCompleteRecord {
  index: CloudManagedAccountItem | null;
  userSlot: CloudUserSlotRecord | null;
  devSlot: CloudDevSlotRecord | null;
}

export interface CloudProfileSyncBridgeCallbacks {
  fetchUserCompleteRecord: (
    userId: string,
    role: 'client' | 'dev'
  ) => Promise<CloudFetchedUserCompleteRecord>;
  publishUserProfileSlot: (params: {
    userId: string;
    alias?: string;
    password?: string;
    snapshot: ProfileFlatSnapshot;
    prevIndex?: CloudManagedAccountItem | null;
  }) => Promise<{ rev: number }>;
  publishDevProfileSlot: (params: {
    userId: string;
    alias?: string;
    password?: string;
    snapshot: ProfileFlatSnapshot;
    baseSnapshot: ProfileFlatSnapshot;
    prevIndex?: CloudManagedAccountItem | null;
  }) => Promise<{ rev: number }>;
  fetchAllAccounts: () => Promise<CloudManagedAccountItem[]>;
  upsertAccountDirectoryEntry: (params: {
    userId: string;
    alias: string;
    password: string;
    existingIndex?: CloudManagedAccountItem | null;
  }) => Promise<CloudManagedAccountItem>;
  deleteAccountDirectoryEntry: (userId: string) => Promise<void>;
  watchUserDevSlot: (
    userId: string,
    onUpdate: (
      devPayload: CloudDevSlotRecord,
      indexPayload: CloudManagedAccountItem | null
    ) => void
  ) => () => void;
  computePassphraseHash: (userId: string, password: string) => Promise<string>;
}

export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'conflict' | 'error';

export interface LoggedInCloudUser {
  userId: string;
  alias: string;
  password: string;
}

const FIELD_CATEGORY_PREFIX_LABELS: Record<string, string> = {
  'garage.': 'Garage Loadout',
  'camera.': 'Camera',
  'trajectory.': 'Ball Trajectory',
  'graphics.': 'Display & Graphics',
  'audio.': 'Audio & Acoustics',
  'gameplay.': 'Gameplay',
  'telemetry.': 'Telemetry Overlay',
  'pacing.': 'Clock Pacing & Buffer',
  'boostPad.': 'Boost Pad Tuner',
  'driftwoods.': 'Driftwoods Stadium',
  'floating.': 'Floating Windows',
  'storage.': 'Extended Config',
};

export function formatSyncFieldLabel(key: string): string {
  for (const [prefix, groupLabel] of Object.entries(FIELD_CATEGORY_PREFIX_LABELS)) {
    if (key.startsWith(prefix)) {
      const rest = key.slice(prefix.length);
      return `${groupLabel} · ${rest}`;
    }
  }
  return key;
}

export function formatSyncValuePreview(val: unknown): string {
  if (val === undefined) return 'Default';
  if (val === null) return 'null';
  if (typeof val === 'boolean') return val ? 'On (true)' : 'Off (false)';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return val.length > 36 ? `${val.slice(0, 33)}...` : val;
  try {
    const json = JSON.stringify(val);
    return json.length > 48 ? `${json.slice(0, 45)}...` : json;
  } catch {
    return String(val);
  }
}
