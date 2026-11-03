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
} from '../config/staticTrainingPackTypes';
import {
  exportStaticTrainingPackRCSPack,
  decodeRCSPackFilePayload,
  exportSingleShotItemToJson,
  parseSingleShotItemFromJsonFile,
} from '../config/staticTrainingPackCodec';

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

export interface ActiveStaticTrainingPackBundle {
  uuid: string;
  title: string;
  description: string;
  itemCount: number;
  metadata: StaticTrainingPackMetadata;
  items: StaticTrainingShotItem[];
}

export function buildActivePackBundle(
  metadata: StaticTrainingPackMetadata | null,
  items: StaticTrainingShotItem[]
): ActiveStaticTrainingPackBundle | null {
  if (!metadata) return null;
  return {
    uuid: metadata.uuid,
    title: metadata.title,
    description: metadata.description,
    itemCount: items.length,
    metadata: { ...metadata, itemCount: items.length },
    items,
  };
}

export function computeEffectiveWorkspaceItems(
  activeItems: StaticTrainingShotItem[],
  isEditingItem: boolean,
  draft: StaticTrainingShotItem | null,
  currentShotIndex: number
): StaticTrainingShotItem[] {
  return isEditingItem && draft
    ? activeItems.map((it, i) => (i === currentShotIndex ? cloneShotItem(draft, i) : it))
    : activeItems;
}

export function computeNextEditSubMode(
  currentSubMode: EditSubMode,
  currentItem: StaticTrainingShotItem | null | undefined,
  delta: 1 | -1
): EditSubMode {
  const alignsSpeedWithNose = currentItem?.car?.speedFollowsHeading !== false;
  const order: EditSubMode[] = alignsSpeedWithNose
    ? ['car-heading', 'ball-speed', 'free-cam']
    : EDIT_SUB_MODES_ORDER;
  const currentIndex = order.indexOf(currentSubMode);
  const baseIdx = currentIndex >= 0 ? currentIndex : 0;
  const nextIdx = ((baseIdx + delta) % order.length + order.length) % order.length;
  return order[nextIdx];
}

export async function persistWorkspaceShotListMutation(
  metadata: StaticTrainingPackMetadata,
  nextItems: StaticTrainingShotItem[]
): Promise<{
  updatedMeta: StaticTrainingPackMetadata;
  bundle: ActiveStaticTrainingPackBundle | null;
  nextItems: StaticTrainingShotItem[];
}> {
  const normalized = nextItems.slice(0, MAX_SHOTS_PER_PACK).map((item, idx) => ({
    ...item,
    index: idx,
  }));
  const updatedMeta: StaticTrainingPackMetadata = {
    ...metadata,
    itemCount: normalized.length,
    updatedAt: Date.now(),
  };
  await saveEditWorkspacePackFull(updatedMeta, normalized);
  return {
    updatedMeta,
    bundle: buildActivePackBundle(updatedMeta, normalized),
    nextItems: normalized,
  };
}

export async function duplicateWorkspaceShotAt(
  metadata: StaticTrainingPackMetadata,
  activeItems: StaticTrainingShotItem[],
  index: number
) {
  const source = activeItems[index];
  const duplicated = cloneShotItem(source, index + 1);
  duplicated.id = generateUUID();
  duplicated.name = `${source.name || `Shot ${index + 1}`} (Copy)`;
  return persistWorkspaceShotListMutation(metadata, [
    ...activeItems.slice(0, index + 1),
    duplicated,
    ...activeItems.slice(index + 1),
  ]);
}

export async function reorderWorkspaceShotAt(
  metadata: StaticTrainingPackMetadata,
  activeItems: StaticTrainingShotItem[],
  fromIndex: number,
  toIndex: number
) {
  const copy = [...activeItems];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return persistWorkspaceShotListMutation(metadata, copy);
}

export async function commitWorkspaceShotsToMainVfs(
  metadata: StaticTrainingPackMetadata,
  activeItems: StaticTrainingShotItem[],
  isEditingItem: boolean,
  draft: StaticTrainingShotItem | null,
  currentShotIndex: number
): Promise<{
  packs: StaticTrainingPackMetadata[];
  bundle: ActiveStaticTrainingPackBundle | null;
  finalItems: StaticTrainingShotItem[];
}> {
  const finalItems = computeEffectiveWorkspaceItems(
    activeItems,
    isEditingItem,
    draft,
    currentShotIndex
  )
    .slice(0, MAX_SHOTS_PER_PACK)
    .map((it, idx) => cloneShotItem(it, idx));
  const updatedMeta: StaticTrainingPackMetadata = {
    ...metadata,
    itemCount: finalItems.length,
    updatedAt: Date.now(),
  };
  await saveStaticTrainingPackFull(updatedMeta, finalItems);
  await clearEditWorkspaceByUuid(metadata.uuid);
  const packs = await listStaticTrainingPacks();
  return {
    packs,
    bundle: buildActivePackBundle(updatedMeta, finalItems),
    finalItems,
  };
}

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
  const normalizedItems = items.slice(0, MAX_SHOTS_PER_PACK).map((item, idx) => {
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
    nodes.push({
      path: buildEditMetaPath(uuid),
      category: 'static-training-pack',
      uuid,
      nodeType: 'metadata',
      updatedAt: now,
      data: { ...metadata, updatedAt: now },
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

export async function listStaticTrainingPacks(): Promise<StaticTrainingPackMetadata[]> {
  const records = await vfsGetAllByCategory('static-training-pack');
  const metas = records
    .filter((r) => r.nodeType === 'metadata' && r.data?.uuid)
    .map((r) => r.data as StaticTrainingPackMetadata)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  if (metas.length > 0) return metas;
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

export async function saveStaticTrainingPackFull(
  metadata: StaticTrainingPackMetadata,
  items: StaticTrainingShotItem[]
): Promise<void> {
  await vfsDeleteByUuid(metadata.uuid);
  const now = Date.now();
  const normalizedItems = items.slice(0, MAX_SHOTS_PER_PACK).map((item, idx) => {
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
    nodes.push({
      path: buildMetaPath(uuid),
      category: 'static-training-pack',
      uuid,
      nodeType: 'metadata',
      updatedAt: now,
      data: { ...metadata, updatedAt: now },
    });
  }

  await vfsPutNodes(nodes);
}

export async function deleteStaticTrainingPackByUuid(uuid: string): Promise<void> {
  await clearEditWorkspaceByUuid(uuid);
  await vfsDeleteByUuid(uuid);
}

export async function importStaticTrainingPackFromFile(
  file: File
): Promise<{ metadata: StaticTrainingPackMetadata; items: StaticTrainingShotItem[] }> {
  const { metadata, items } = await decodeRCSPackFilePayload(file);
  const capped = items.slice(0, MAX_SHOTS_PER_PACK);
  await saveStaticTrainingPackFull(metadata, capped);
  return { metadata: { ...metadata, itemCount: capped.length }, items: capped };
}
