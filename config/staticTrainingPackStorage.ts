/**
 * StaticTrainingPackStorage.ts
 * Path-keyed IndexedDB Virtual Filesystem (VFS) for Static Training Packs,
 * plus a dedicated Edit-Mode IndexedDB (`rc-static-pack-edit-db`) for isolated
 * Edit Session staging before committing or ignoring changes.
 */

import {
  type EditSubMode,
  type StaticTrainingCarConfig,
  type StaticTrainingBallConfig,
  type StaticTrainingShotItem,
  type StaticTrainingPackMetadata,
  type RCSPackArchive,
  EDIT_SUB_MODES_ORDER,
  MAX_SHOTS_PER_PACK,
  generateUUID,
  createDefaultShotItem,
  cloneShotItem,
  areShotItemsEqual,
  areShotListsEqual,
  createStarterShots,
} from './staticTrainingPackTypes';
import {
  exportStaticTrainingPackRCSPack,
  decodeRCSPackFilePayload,
  exportSingleShotItemToJson,
  parseSingleShotItemFromJsonFile,
} from './staticTrainingPackCodec';

export {
  type EditSubMode,
  type StaticTrainingCarConfig,
  type StaticTrainingBallConfig,
  type StaticTrainingShotItem,
  type StaticTrainingPackMetadata,
  type RCSPackArchive,
  EDIT_SUB_MODES_ORDER,
  MAX_SHOTS_PER_PACK,
  generateUUID,
  createDefaultShotItem,
  cloneShotItem,
  areShotItemsEqual,
  areShotListsEqual,
  exportStaticTrainingPackRCSPack,
  exportSingleShotItemToJson,
  parseSingleShotItemFromJsonFile,
};

import {
  type VfsNodeRecord,
  EDIT_VFS_STORE_NAME,
  memoryEditVfsFallback,
  buildMetaPath,
  buildItemPath,
  buildEditMetaPath,
  buildEditItemPath,
  openEditVfsDb,
  vfsPutNodes,
  vfsGetAllByCategory,
  vfsGetByUuid,
  vfsDeleteByUuid,
  editVfsPutNodes,
  editVfsGetByUuid,
} from './staticTrainingPackVfsDriver';

export {
  buildMetaPath,
  buildItemPath,
  buildEditMetaPath,
  buildEditItemPath,
};

export async function clearEditWorkspaceByUuid(uuid: string): Promise<void> {
  for (const [k, v] of memoryEditVfsFallback.entries()) {
    if (v.uuid === uuid) memoryEditVfsFallback.delete(k);
  }
  const db = await openEditVfsDb();
  if (!db) return;
  const records = await editVfsGetByUuid(uuid);
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(EDIT_VFS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(EDIT_VFS_STORE_NAME);
      for (const rec of records) {
        store.delete(rec.path);
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function saveEditWorkspacePackFull(
  metadata: StaticTrainingPackMetadata,
  items: StaticTrainingShotItem[]
): Promise<void> {
  await clearEditWorkspaceByUuid(metadata.uuid);
  const now = Date.now();
  const cappedItems = items.slice(0, MAX_SHOTS_PER_PACK);
  const normalizedItems = cappedItems.map((item, idx) => {
    const cloned = cloneShotItem(item, idx);
    cloned.index = idx;
    return cloned;
  });

  const updatedMeta: StaticTrainingPackMetadata = {
    ...metadata,
    itemCount: normalizedItems.length,
    updatedAt: now,
  };

  const nodes: VfsNodeRecord[] = [
    {
      path: buildEditMetaPath(updatedMeta.uuid),
      category: 'static-training-pack',
      uuid: updatedMeta.uuid,
      nodeType: 'metadata',
      updatedAt: now,
      data: updatedMeta,
    },
    ...normalizedItems.map((it, idx) => ({
      path: buildEditItemPath(updatedMeta.uuid, idx),
      category: 'static-training-pack' as const,
      uuid: updatedMeta.uuid,
      nodeType: 'item' as const,
      index: idx,
      updatedAt: now,
      data: it,
    })),
  ];

  await editVfsPutNodes(nodes);
}

export async function saveSingleEditWorkspaceShotItem(
  uuid: string,
  index: number,
  item: StaticTrainingShotItem,
  metadata?: StaticTrainingPackMetadata | null
): Promise<void> {
  const now = Date.now();
  const cloned = cloneShotItem(item, index);
  const nodes: VfsNodeRecord[] = [
    {
      path: buildEditItemPath(uuid, index),
      category: 'static-training-pack',
      uuid,
      nodeType: 'item',
      index,
      updatedAt: now,
      data: cloned,
    },
  ];

  if (metadata) {
    const updatedMeta: StaticTrainingPackMetadata = {
      ...metadata,
      updatedAt: now,
    };
    nodes.push({
      path: buildEditMetaPath(uuid),
      category: 'static-training-pack',
      uuid,
      nodeType: 'metadata',
      updatedAt: now,
      data: updatedMeta,
    });
  }

  await editVfsPutNodes(nodes);
}

export async function loadEditWorkspacePackByUuid(uuid: string): Promise<{
  metadata: StaticTrainingPackMetadata | null;
  items: StaticTrainingShotItem[];
}> {
  const records = await editVfsGetByUuid(uuid);
  let metadata: StaticTrainingPackMetadata | null = null;
  const items: StaticTrainingShotItem[] = [];

  for (const rec of records) {
    if (rec.nodeType === 'metadata' && rec.data) {
      metadata = rec.data as StaticTrainingPackMetadata;
    } else if (rec.nodeType === 'item' && rec.data) {
      items.push(cloneShotItem(rec.data, rec.index ?? rec.data.index ?? 0));
    }
  }

  items.sort((a, b) => a.index - b.index);
  items.forEach((it, idx) => {
    it.index = idx;
  });

  return { metadata, items: items.slice(0, MAX_SHOTS_PER_PACK) };
}

/* ============================================================================
 * Main Committed VFS Operations (`rc-virtual-fs-db`)
 * ========================================================================== */

/**
 * Lists all Static Training Pack metadata records sorted by updatedAt descending.
 * Seeds a default starter pack if the VFS is completely empty on first launch.
 */
export async function listStaticTrainingPacks(): Promise<StaticTrainingPackMetadata[]> {
  const records = await vfsGetAllByCategory('static-training-pack');
  const metas = records
    .filter((r) => r.nodeType === 'metadata' && r.data?.uuid)
    .map((r) => r.data as StaticTrainingPackMetadata)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  if (metas.length > 0) {
    return metas;
  }

  const starter = await seedDefaultStarterPack();
  return [starter];
}

export async function seedDefaultStarterPack(): Promise<StaticTrainingPackMetadata> {
  const uuid = 'starter-aerial-striker-pack';
  const now = Date.now();
  const shots = createStarterShots(uuid);
  const meta: StaticTrainingPackMetadata = {
    uuid,
    title: 'Fundamentals: Striker & Aerials',
    description:
      'Starter static training pack featuring a midfield volley, a suspended kickoff-state aerial, and a backboard read.',
    createdAt: now,
    updatedAt: now,
    itemCount: shots.length,
  };

  await saveStaticTrainingPackFull(meta, shots);
  return meta;
}

export async function loadStaticTrainingPackByUuid(uuid: string): Promise<{
  metadata: StaticTrainingPackMetadata | null;
  items: StaticTrainingShotItem[];
}> {
  const records = await vfsGetByUuid(uuid);
  let metadata: StaticTrainingPackMetadata | null = null;
  const items: StaticTrainingShotItem[] = [];

  for (const rec of records) {
    if (rec.nodeType === 'metadata' && rec.data) {
      metadata = rec.data as StaticTrainingPackMetadata;
    } else if (rec.nodeType === 'item' && rec.data) {
      items.push(cloneShotItem(rec.data, rec.index ?? rec.data.index ?? 0));
    }
  }

  items.sort((a, b) => a.index - b.index);
  const capped = items.slice(0, MAX_SHOTS_PER_PACK);
  capped.forEach((it, idx) => {
    it.index = idx;
  });

  return { metadata, items: capped };
}

/**
 * Saves an entire Static Training Pack (metadata + all items, capped at 99) into the IndexedDB VFS.
 */
export async function saveStaticTrainingPackFull(
  metadata: StaticTrainingPackMetadata,
  items: StaticTrainingShotItem[]
): Promise<void> {
  await vfsDeleteByUuid(metadata.uuid);
  const now = Date.now();
  const cappedItems = items.slice(0, MAX_SHOTS_PER_PACK);
  const normalizedItems = cappedItems.map((item, idx) => {
    const cloned = cloneShotItem(item, idx);
    cloned.index = idx;
    return cloned;
  });

  const updatedMeta: StaticTrainingPackMetadata = {
    ...metadata,
    itemCount: normalizedItems.length,
    updatedAt: now,
  };

  const nodes: VfsNodeRecord[] = [
    {
      path: buildMetaPath(updatedMeta.uuid),
      category: 'static-training-pack',
      uuid: updatedMeta.uuid,
      nodeType: 'metadata',
      updatedAt: now,
      data: updatedMeta,
    },
    ...normalizedItems.map((it, idx) => ({
      path: buildItemPath(updatedMeta.uuid, idx),
      category: 'static-training-pack' as const,
      uuid: updatedMeta.uuid,
      nodeType: 'item' as const,
      index: idx,
      updatedAt: now,
      data: it,
    })),
  ];

  await vfsPutNodes(nodes);
}

/**
 * Commits a single edited shot item to the main IndexedDB VFS.
 */
export async function saveSingleStaticTrainingShotItem(
  uuid: string,
  index: number,
  item: StaticTrainingShotItem,
  metadata?: StaticTrainingPackMetadata | null
): Promise<void> {
  const now = Date.now();
  const cloned = cloneShotItem(item, index);
  const nodes: VfsNodeRecord[] = [
    {
      path: buildItemPath(uuid, index),
      category: 'static-training-pack',
      uuid,
      nodeType: 'item',
      index,
      updatedAt: now,
      data: cloned,
    },
  ];

  if (metadata) {
    const updatedMeta: StaticTrainingPackMetadata = {
      ...metadata,
      updatedAt: now,
    };
    nodes.push({
      path: buildMetaPath(uuid),
      category: 'static-training-pack',
      uuid,
      nodeType: 'metadata',
      updatedAt: now,
      data: updatedMeta,
    });
  }

  await vfsPutNodes(nodes);
}

export async function deleteStaticTrainingPackByUuid(uuid: string): Promise<void> {
  await clearEditWorkspaceByUuid(uuid);
  await vfsDeleteByUuid(uuid);
}

/**
 * Imports a `.RCSPack` file (compressed or uncompressed JSON) and persists it into the VFS.
 */
export async function importStaticTrainingPackFromFile(
  file: File
): Promise<{ metadata: StaticTrainingPackMetadata; items: StaticTrainingShotItem[] }> {
  const { metadata, items } = await decodeRCSPackFilePayload(file);
  const capped = items.slice(0, MAX_SHOTS_PER_PACK);
  await saveStaticTrainingPackFull(metadata, capped);
  return { metadata: { ...metadata, itemCount: capped.length }, items: capped };
}
