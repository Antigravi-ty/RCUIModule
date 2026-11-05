/**
 * cloudProfileMergePipeline.ts
 * Pure Git-style 3-Way Merge (devBase vs local/user vs dev) and flat key-value normalization
 * for Cloud Profile Sync.
 *
 * Merge Rules per field key K:
 *   1. If dev[K] === devBase[K]: Developer did not modify K in their push -> keep local[K].
 *   2. If local[K] === devBase[K]: User did not modify K since base -> auto-apply dev[K].
 *   3. If local[K] === dev[K]: Both modified K to the exact same value -> keep local[K] (no conflict).
 *   4. Otherwise (local[K] !== devBase[K] && dev[K] !== devBase[K] && local[K] !== dev[K]):
 *      True 3-Way Conflict! Surface in `conflicts` so the user can choose My Value vs Developer Value.
 */

import {
  formatSyncFieldLabel,
  type ProfileFlatSnapshot,
  type ProfileMergeConflictItem,
  type ProfileThreeWayMergeResult,
} from './cloudProfileSyncTypes.ts';

export function isDeepEqualJsonValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null || typeof a !== 'object') return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function flattenNestedConfigObject(
  prefix: string,
  obj: Record<string, any> | null | undefined,
  target: ProfileFlatSnapshot = {}
): ProfileFlatSnapshot {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return target;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || typeof v === 'function') continue;
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flattenNestedConfigObject(fullKey, v as Record<string, any>, target);
    } else {
      target[fullKey] = v;
    }
  }
  return target;
}

export function unflattenConfigPrefix<T extends Record<string, any>>(
  snapshot: ProfileFlatSnapshot,
  prefix: string,
  baseDefaults: T
): T {
  const clone: Record<string, any> = JSON.parse(JSON.stringify(baseDefaults));
  const dotPrefix = `${prefix}.`;

  for (const [fullKey, val] of Object.entries(snapshot)) {
    if (!fullKey.startsWith(dotPrefix) || val === undefined) continue;
    const pathParts = fullKey.slice(dotPrefix.length).split('.');
    let cursor = clone;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
        cursor[part] = {};
      }
      cursor = cursor[part];
    }
    cursor[pathParts[pathParts.length - 1]] = val;
  }

  return clone as T;
}

export function computeProfileThreeWayMerge(
  baseSnapshot: ProfileFlatSnapshot | null | undefined,
  localSnapshot: ProfileFlatSnapshot,
  remoteDevSnapshot: ProfileFlatSnapshot | null | undefined
): ProfileThreeWayMergeResult {
  if (!remoteDevSnapshot || Object.keys(remoteDevSnapshot).length === 0) {
    return {
      mergedSnapshot: { ...localSnapshot },
      autoAppliedDevKeys: [],
      keptLocalKeys: Object.keys(localSnapshot),
      conflicts: [],
    };
  }

  const effectiveBase = baseSnapshot && Object.keys(baseSnapshot).length > 0
    ? baseSnapshot
    : localSnapshot;

  const allKeys = new Set<string>([
    ...Object.keys(effectiveBase),
    ...Object.keys(localSnapshot),
    ...Object.keys(remoteDevSnapshot),
  ]);

  const mergedSnapshot: ProfileFlatSnapshot = {};
  const autoAppliedDevKeys: string[] = [];
  const keptLocalKeys: string[] = [];
  const conflicts: ProfileMergeConflictItem[] = [];

  for (const key of Array.from(allKeys).sort()) {
    const baseVal = effectiveBase[key];
    const localVal = localSnapshot[key];
    const devVal = remoteDevSnapshot[key];

    const devChanged = !isDeepEqualJsonValue(devVal, baseVal);
    const localChanged = !isDeepEqualJsonValue(localVal, baseVal);

    if (!devChanged) {
      if (localVal !== undefined) {
        mergedSnapshot[key] = localVal;
        keptLocalKeys.push(key);
      }
      continue;
    }

    if (!localChanged || isDeepEqualJsonValue(localVal, devVal)) {
      if (devVal !== undefined) {
        mergedSnapshot[key] = devVal;
      }
      autoAppliedDevKeys.push(key);
      continue;
    }

    // Both local and developer changed this key to different values -> conflict!
    mergedSnapshot[key] = localVal;
    conflicts.push({
      key,
      label: formatSyncFieldLabel(key),
      baseValue: baseVal,
      localValue: localVal,
      devValue: devVal,
      selectedSource: 'dev',
    });
  }

  return {
    mergedSnapshot,
    autoAppliedDevKeys,
    keptLocalKeys,
    conflicts,
  };
}
