export const EDIT_VFS_STORE_NAME = 'edit_vfs_nodes';
export const memoryEditVfsFallback = new Map<string, VfsNodeRecord>();
export interface VfsNodeRecord {
  path: string;
  category: 'static-training-pack' | 'replay' | 'dynamic-training-pack';
  uuid: string;
  nodeType: 'metadata' | 'item' | 'blob';
  index?: number;
  updatedAt: number;
  data: any;
}

const VFS_DB_NAME = 'rc-virtual-fs-db';
const VFS_DB_VERSION = 1;
const VFS_STORE_NAME = 'vfs_nodes';

const EDIT_VFS_DB_NAME = 'rc-static-pack-edit-db';
const EDIT_VFS_DB_VERSION = 1;

const memoryVfsFallback = new Map<string, VfsNodeRecord>();

export function buildMetaPath(uuid: string): string {
  return `/static-training-pack/${uuid}/metadata`;
}

export function buildItemPath(uuid: string, index: number): string {
  return `/static-training-pack/${uuid}/items/${index}`;
}

export function buildEditMetaPath(uuid: string): string {
  return `/static-training-pack-edit/${uuid}/metadata`;
}

export function buildEditItemPath(uuid: string, index: number): string {
  return `/static-training-pack-edit/${uuid}/items/${index}`;
}

export function openNamedDb(dbName: string, version: number, storeName: string): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    console.warn('[StaticTrainingPackStorage] IndexedDB is undefined in this environment; using in-memory VFS fallback.');
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(dbName, version);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'path' });
          store.createIndex('by_category', 'category', { unique: false });
          store.createIndex('by_uuid', 'uuid', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        console.warn(`[StaticTrainingPackStorage] IndexedDB (${dbName}) open failed, using memory fallback:`, req.error);
        resolve(null);
      };
    } catch (err) {
      console.warn(`[StaticTrainingPackStorage] IndexedDB (${dbName}) exception, using memory fallback:`, err);
      resolve(null);
    }
  });
}

export function openVfsDb(): Promise<IDBDatabase | null> {
  return openNamedDb(VFS_DB_NAME, VFS_DB_VERSION, VFS_STORE_NAME);
}

export function openEditVfsDb(): Promise<IDBDatabase | null> {
  return openNamedDb(EDIT_VFS_DB_NAME, EDIT_VFS_DB_VERSION, EDIT_VFS_STORE_NAME);
}

export async function vfsPutNodes(nodes: VfsNodeRecord[]): Promise<void> {
  for (const node of nodes) {
    memoryVfsFallback.set(node.path, node);
  }
  const db = await openVfsDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(VFS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(VFS_STORE_NAME);
      for (const node of nodes) {
        store.put(node);
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        console.warn('[StaticTrainingPackStorage] vfsPutNodes IndexedDB transaction failed, retaining nodes in memory fallback:', tx.error);
        db.close();
        resolve();
      };
    } catch (err) {
      console.warn('[StaticTrainingPackStorage] vfsPutNodes IndexedDB exception, retaining nodes in memory fallback:', err);
      db.close();
      resolve();
    }
  });
}

export async function vfsGetAllByCategory(
  category: 'static-training-pack' | 'replay' | 'dynamic-training-pack'
): Promise<VfsNodeRecord[]> {
  const db = await openVfsDb();
  if (!db) {
    return Array.from(memoryVfsFallback.values()).filter((n) => n.category === category);
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(VFS_STORE_NAME, 'readonly');
      const store = tx.objectStore(VFS_STORE_NAME);
      const idx = store.index('by_category');
      const req = idx.getAll(category);
      req.onsuccess = () => {
        const res = Array.isArray(req.result) ? (req.result as VfsNodeRecord[]) : [];
        db.close();
        resolve(res);
      };
      req.onerror = () => {
        console.warn(`[StaticTrainingPackStorage] vfsGetAllByCategory("${category}") failed, falling back to memoryVfsFallback:`, req.error);
        db.close();
        resolve(Array.from(memoryVfsFallback.values()).filter((n) => n.category === category));
      };
    } catch (err) {
      console.warn(`[StaticTrainingPackStorage] vfsGetAllByCategory("${category}") exception, falling back to memoryVfsFallback:`, err);
      db.close();
      resolve(Array.from(memoryVfsFallback.values()).filter((n) => n.category === category));
    }
  });
}

export async function vfsGetByUuid(uuid: string): Promise<VfsNodeRecord[]> {
  const db = await openVfsDb();
  if (!db) {
    return Array.from(memoryVfsFallback.values()).filter((n) => n.uuid === uuid);
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(VFS_STORE_NAME, 'readonly');
      const store = tx.objectStore(VFS_STORE_NAME);
      const idx = store.index('by_uuid');
      const req = idx.getAll(uuid);
      req.onsuccess = () => {
        const res = Array.isArray(req.result) ? (req.result as VfsNodeRecord[]) : [];
        db.close();
        resolve(res);
      };
      req.onerror = () => {
        console.warn(`[StaticTrainingPackStorage] vfsGetByUuid("${uuid}") failed, falling back to memoryVfsFallback:`, req.error);
        db.close();
        resolve(Array.from(memoryVfsFallback.values()).filter((n) => n.uuid === uuid));
      };
    } catch (err) {
      console.warn(`[StaticTrainingPackStorage] vfsGetByUuid("${uuid}") exception, falling back to memoryVfsFallback:`, err);
      db.close();
      resolve(Array.from(memoryVfsFallback.values()).filter((n) => n.uuid === uuid));
    }
  });
}

export async function vfsDeleteByUuid(uuid: string): Promise<void> {
  for (const [k, v] of memoryVfsFallback.entries()) {
    if (v.uuid === uuid) memoryVfsFallback.delete(k);
  }
  const db = await openVfsDb();
  if (!db) return;
  const records = await vfsGetByUuid(uuid);
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(VFS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(VFS_STORE_NAME);
      for (const rec of records) {
        store.delete(rec.path);
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        console.warn(`[StaticTrainingPackStorage] vfsDeleteByUuid("${uuid}") IndexedDB transaction failed:`, tx.error);
        db.close();
        resolve();
      };
    } catch (err) {
      console.warn(`[StaticTrainingPackStorage] vfsDeleteByUuid("${uuid}") IndexedDB exception:`, err);
      db.close();
      resolve();
    }
  });
}

/* ============================================================================
 * Dedicated Edit-Mode IndexedDB Operations (`rc-static-pack-edit-db`)
 * ========================================================================== */

export async function editVfsPutNodes(nodes: VfsNodeRecord[]): Promise<void> {
  for (const node of nodes) {
    memoryEditVfsFallback.set(node.path, node);
  }
  const db = await openEditVfsDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(EDIT_VFS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(EDIT_VFS_STORE_NAME);
      for (const node of nodes) {
        store.put(node);
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

export async function editVfsGetByUuid(uuid: string): Promise<VfsNodeRecord[]> {
  const db = await openEditVfsDb();
  if (!db) {
    return Array.from(memoryEditVfsFallback.values()).filter((n) => n.uuid === uuid);
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(EDIT_VFS_STORE_NAME, 'readonly');
      const store = tx.objectStore(EDIT_VFS_STORE_NAME);
      const idx = store.index('by_uuid');
      const req = idx.getAll(uuid);
      req.onsuccess = () => {
        const res = Array.isArray(req.result) ? (req.result as VfsNodeRecord[]) : [];
        db.close();
        resolve(res);
      };
      req.onerror = () => {
        db.close();
        resolve(Array.from(memoryEditVfsFallback.values()).filter((n) => n.uuid === uuid));
      };
    } catch {
      db.close();
      resolve(Array.from(memoryEditVfsFallback.values()).filter((n) => n.uuid === uuid));
    }
  });
}

