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
  exportBatchStaticTrainingPacksZip,
  decodeRCSPackFilePayload,
  decodeMultiOrZipPackFiles,
  exportSingleShotItemToJson,
  parseSingleShotItemFromJsonFile,
  type ExportRCSPackOptions,
} from '../config/staticTrainingPackCodec';
import {
  type VfsNodeRecord,
  type StaticTrainingPackStorageScope,
  EDIT_VFS_STORE_NAME,
  memoryEditVfsFallback,
  resolveScopeCategory,
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
  type EditSubMode,
  type StaticTrainingCarConfig,
  type StaticTrainingBallConfig,
  type StaticTrainingShotItem,
  type StaticTrainingPackMetadata,
  type RCSPackArchive,
  type ExportRCSPackOptions,
  type StaticTrainingPackStorageScope,
  EDIT_SUB_MODES_ORDER,
  MAX_SHOTS_PER_PACK,
  generateUUID,
  createDefaultShotItem,
  cloneShotItem,
  areShotItemsEqual,
  areShotListsEqual,
  exportStaticTrainingPackRCSPack,
  exportBatchStaticTrainingPacksZip,
  decodeMultiOrZipPackFiles,
  exportSingleShotItemToJson,
  parseSingleShotItemFromJsonFile,
  buildMetaPath,
  buildItemPath,
  buildEditMetaPath,
  buildEditItemPath,
};

export type StaticPackDownCounterOption = 1 | 2 | 3;
export type StaticPackSessionMode = 'browse' | 'play' | 'edit';

export interface ActiveStaticTrainingPackBundle {
  uuid: string;
  title: string;
  description: string;
  itemCount: number;
  metadata: StaticTrainingPackMetadata;
  items: StaticTrainingShotItem[];
}

export interface StaticTrainingPackRuntimeHandlers {
  onShotChanged?: (shotIndex: number) => void;
  onResetShotRequested?: () => void;
  onEditVariableMutated?: (draft: StaticTrainingShotItem) => void;
  onEditSubModeChanged?: (subMode: EditSubMode) => void;
  onSessionModeChanged?: (mode: StaticPackSessionMode) => void;
}

export interface StaticTrainingShotActionHelpers {
  getActiveEditItemVariable: () => StaticTrainingShotItem | null;
  setActiveEditItemVariable: (item: StaticTrainingShotItem | null) => void;
  buildActivePackBundle: (
    metadata: StaticTrainingPackMetadata | null,
    items: StaticTrainingShotItem[]
  ) => ActiveStaticTrainingPackBundle | null;
}

export interface StaticTrainingShotStoreState {
  initialized: boolean;
  devInitialized: boolean;
  isLoading: boolean;
  storageScope: StaticTrainingPackStorageScope;
  packs: StaticTrainingPackMetadata[];
  normalPacks: StaticTrainingPackMetadata[];
  devPacks: StaticTrainingPackMetadata[];
  selectedPackUuid: string | null;
  normalSelectedPackUuid: string | null;
  devSelectedPackUuid: string | null;
  sessionMode: StaticPackSessionMode;
  activePack: ActiveStaticTrainingPackBundle | null;
  activeItems: StaticTrainingShotItem[];
  committedSessionItems: StaticTrainingShotItem[];
  currentShotIndex: number;
  isEditingItem: boolean;
  isEdgeInspectorExpanded: boolean;
  activeEditItemDraft: StaticTrainingShotItem | null;
  editSubMode: EditSubMode;
  editVarVersion: number;
  remainingTimeoutSec: number;
  isFreeCamTrajectoryTesting: boolean;
  isTestingSingleShot: boolean;
  isShotMirrored?: boolean;
  runtimeHandlers: StaticTrainingPackRuntimeHandlers;
  setCurrentShotIndex: (index: number) => void;
  isCurrentShotDirty: () => boolean;
  saveCurrentShotToEditWorkspace: () => Promise<void>;
}

export function buildScopePackStatePatch(
  scope: StaticTrainingPackStorageScope,
  packs: StaticTrainingPackMetadata[],
  selectedUuid: string | null,
  isActiveScope: boolean
): Partial<StaticTrainingShotStoreState> {
  return {
    ...(scope === 'dev'
      ? { devPacks: packs, devSelectedPackUuid: selectedUuid }
      : { normalPacks: packs, normalSelectedPackUuid: selectedUuid }),
    ...(isActiveScope ? { packs, selectedPackUuid: selectedUuid } : {}),
  };
}

export function isDevRlRcsPackMetadata(
  meta: Partial<StaticTrainingPackMetadata> | null | undefined
): boolean {
  if (!meta) return false;
  return Boolean(meta.isBuiltInDevPack) || meta.sourcePackType === 'RLRCSPack';
}

function buildPackNodes(
  metadata: StaticTrainingPackMetadata,
  items: StaticTrainingShotItem[],
  scope: StaticTrainingPackStorageScope,
  metaPathBuilder: (uuid: string, scope: StaticTrainingPackStorageScope) => string,
  itemPathBuilder: (uuid: string, idx: number, scope: StaticTrainingPackStorageScope) => string
): VfsNodeRecord[] {
  const now = Date.now();
  const category = resolveScopeCategory(scope);
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
  return [
    {
      path: metaPathBuilder(updatedMeta.uuid, scope),
      category,
      uuid: updatedMeta.uuid,
      nodeType: 'metadata',
      updatedAt: now,
      data: updatedMeta as unknown as Record<string, unknown>,
    },
    ...normalizedItems.map((it, idx) => ({
      path: itemPathBuilder(updatedMeta.uuid, idx, scope),
      category,
      uuid: updatedMeta.uuid,
      nodeType: 'item' as const,
      index: idx,
      updatedAt: now,
      data: it as unknown as Record<string, unknown>,
    })),
  ];
}

function buildSingleShotNodes(
  uuid: string,
  index: number,
  item: StaticTrainingShotItem,
  metadata: StaticTrainingPackMetadata | null | undefined,
  scope: StaticTrainingPackStorageScope,
  metaPathBuilder: (uuid: string, scope: StaticTrainingPackStorageScope) => string,
  itemPathBuilder: (uuid: string, idx: number, scope: StaticTrainingPackStorageScope) => string
): VfsNodeRecord[] {
  const now = Date.now();
  const category = resolveScopeCategory(scope);
  const cloned = cloneShotItem(item, index);
  const nodes: VfsNodeRecord[] = [
    {
      path: itemPathBuilder(uuid, index, scope),
      category,
      uuid,
      nodeType: 'item',
      index,
      updatedAt: now,
      data: cloned as unknown as Record<string, unknown>,
    },
  ];
  if (metadata) {
    nodes.push({
      path: metaPathBuilder(uuid, scope),
      category,
      uuid,
      nodeType: 'metadata',
      updatedAt: now,
      data: { ...metadata, updatedAt: now } as unknown as Record<string, unknown>,
    });
  }
  return nodes;
}

function parsePackRecords(records: VfsNodeRecord[]): {
  metadata: StaticTrainingPackMetadata | null;
  items: StaticTrainingShotItem[];
} {
  let metadata: StaticTrainingPackMetadata | null = null;
  const items: StaticTrainingShotItem[] = [];
  for (const rec of records) {
    if (rec.nodeType === 'metadata' && rec.data) {
      metadata = rec.data as unknown as StaticTrainingPackMetadata;
    } else if (rec.nodeType === 'item' && rec.data) {
      const rawItem = rec.data as unknown as StaticTrainingShotItem;
      items.push(cloneShotItem(rawItem, rec.index ?? rawItem.index ?? 0));
    }
  }
  items.sort((a, b) => a.index - b.index);
  const capped = items.slice(0, MAX_SHOTS_PER_PACK);
  capped.forEach((it, idx) => {
    it.index = idx;
  });
  return { metadata, items: capped };
}

export async function clearEditWorkspaceByUuid(
  uuid: string,
  scope?: StaticTrainingPackStorageScope
): Promise<void> {
  const targetCategory = scope ? resolveScopeCategory(scope) : null;
  for (const [k, v] of memoryEditVfsFallback.entries()) {
    if (v.uuid === uuid && (!targetCategory || v.category === targetCategory)) {
      memoryEditVfsFallback.delete(k);
    }
  }
  const db = await openEditVfsDb();
  if (!db) return;
  const records = await editVfsGetByUuid(uuid, scope);
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
  items: StaticTrainingShotItem[],
  scope: StaticTrainingPackStorageScope = 'normal'
): Promise<void> {
  await clearEditWorkspaceByUuid(metadata.uuid, scope);
  await editVfsPutNodes(buildPackNodes(metadata, items, scope, buildEditMetaPath, buildEditItemPath));
}

export async function saveSingleEditWorkspaceShotItem(
  uuid: string,
  index: number,
  item: StaticTrainingShotItem,
  metadata?: StaticTrainingPackMetadata | null,
  scope: StaticTrainingPackStorageScope = 'normal'
): Promise<void> {
  await editVfsPutNodes(buildSingleShotNodes(uuid, index, item, metadata, scope, buildEditMetaPath, buildEditItemPath));
}

export async function loadEditWorkspacePackByUuid(
  uuid: string,
  scope: StaticTrainingPackStorageScope = 'normal'
): Promise<{
  metadata: StaticTrainingPackMetadata | null;
  items: StaticTrainingShotItem[];
}> {
  return parsePackRecords(await editVfsGetByUuid(uuid, scope));
}

export async function listStaticTrainingPacks(
  scope: StaticTrainingPackStorageScope = 'normal'
): Promise<StaticTrainingPackMetadata[]> {
  const category = resolveScopeCategory(scope);
  const records = await vfsGetAllByCategory(category, scope);
  const rawMetas = records
    .filter((r) => r.nodeType === 'metadata' && r.data && typeof r.data.uuid === 'string')
    .map((r) => r.data as unknown as StaticTrainingPackMetadata);

  if (scope === 'normal') {
    const leakedDevUuids: string[] = [];
    const cleanNormalMetas: StaticTrainingPackMetadata[] = [];
    for (const meta of rawMetas) {
      if (isDevRlRcsPackMetadata(meta)) {
        leakedDevUuids.push(meta.uuid);
      } else {
        cleanNormalMetas.push(meta);
      }
    }
    for (const devUuid of leakedDevUuids) {
      await vfsDeleteByUuid(devUuid, 'normal');
    }
    cleanNormalMetas.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (cleanNormalMetas.length > 0) {
      return cleanNormalMetas;
    }
    return [await seedDefaultStarterPack('normal')];
  }

  return rawMetas.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function seedDefaultStarterPack(
  scope: StaticTrainingPackStorageScope = 'normal'
): Promise<StaticTrainingPackMetadata> {
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
    sourcePackType: 'RCSPackE',
    tags: ['Native'],
  };

  await saveStaticTrainingPackFull(meta, shots, scope);
  return meta;
}

export async function loadStaticTrainingPackByUuid(
  uuid: string,
  scope: StaticTrainingPackStorageScope = 'normal'
): Promise<{
  metadata: StaticTrainingPackMetadata | null;
  items: StaticTrainingShotItem[];
}> {
  let records = await vfsGetByUuid(uuid, scope);
  if (records.length === 0) {
    records = await vfsGetByUuid(uuid, scope === 'dev' ? 'normal' : 'dev');
  }
  return parsePackRecords(records);
}

export async function saveStaticTrainingPackFull(
  metadata: StaticTrainingPackMetadata,
  items: StaticTrainingShotItem[],
  scope: StaticTrainingPackStorageScope = 'normal'
): Promise<void> {
  await vfsDeleteByUuid(metadata.uuid, scope);
  await vfsPutNodes(buildPackNodes(metadata, items, scope, buildMetaPath, buildItemPath), scope);
}

export async function saveSingleStaticTrainingShotItem(
  uuid: string,
  index: number,
  item: StaticTrainingShotItem,
  metadata?: StaticTrainingPackMetadata | null,
  scope: StaticTrainingPackStorageScope = 'normal'
): Promise<void> {
  await vfsPutNodes(buildSingleShotNodes(uuid, index, item, metadata, scope, buildMetaPath, buildItemPath), scope);
}

export async function deleteStaticTrainingPackByUuid(
  uuid: string,
  scope: StaticTrainingPackStorageScope = 'normal'
): Promise<void> {
  await clearEditWorkspaceByUuid(uuid, scope);
  await vfsDeleteByUuid(uuid, scope);
}

export async function importStaticTrainingPackFromFile(
  file: File,
  scope: StaticTrainingPackStorageScope = 'normal'
): Promise<{ metadata: StaticTrainingPackMetadata; items: StaticTrainingShotItem[] }> {
  const { metadata, items } = await decodeRCSPackFilePayload(file, {
    allowDevFormats: scope === 'dev',
  });
  const capped = items.slice(0, MAX_SHOTS_PER_PACK);
  await saveStaticTrainingPackFull(metadata, capped, scope);
  return { metadata: { ...metadata, itemCount: capped.length }, items: capped };
}

export async function importBatchStaticTrainingPacksFromFiles(
  files: File[] | FileList,
  scope: StaticTrainingPackStorageScope = 'normal'
): Promise<StaticTrainingPackMetadata[]> {
  const decodedList = await decodeMultiOrZipPackFiles(files, {
    allowDevFormats: scope === 'dev',
  });
  const importedMetas: StaticTrainingPackMetadata[] = [];
  for (const entry of decodedList) {
    const capped = entry.items.slice(0, MAX_SHOTS_PER_PACK);
    await saveStaticTrainingPackFull(entry.metadata, capped, scope);
    importedMetas.push({ ...entry.metadata, itemCount: capped.length });
  }
  return importedMetas;
}

export async function ensureBuiltInDevPacksSeeded(_forceReseed = false): Promise<number> {
  return 0;
}
