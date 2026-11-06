import {
  type StaticTrainingPackMetadata,
  type StaticTrainingShotItem,
  type EditSubMode,
  type ExportRCSPackOptions,
  type StaticTrainingPackStorageScope,
  MAX_SHOTS_PER_PACK,
  generateUUID,
  createDefaultShotItem,
  cloneShotItem,
  areShotItemsEqual,
  areShotListsEqual,
  listStaticTrainingPacks,
  loadStaticTrainingPackByUuid,
  saveStaticTrainingPackFull,
  deleteStaticTrainingPackByUuid,
  saveEditWorkspacePackFull,
  saveSingleEditWorkspaceShotItem,
  clearEditWorkspaceByUuid,
  exportStaticTrainingPackRCSPack,
  exportBatchStaticTrainingPacksZip,
  importStaticTrainingPackFromFile,
  importBatchStaticTrainingPacksFromFiles,
  ensureBuiltInDevPacksSeeded,
} from './staticTrainingPackStorage';
import { floatingStore } from './floatingStore';

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

export function createStaticTrainingPackCollectionActions<TState extends StaticTrainingShotStoreState>(
  set: (
    partial: Partial<StaticTrainingShotStoreState> | ((state: TState) => Partial<StaticTrainingShotStoreState>)
  ) => void,
  get: () => TState,
  helpers: StaticTrainingShotActionHelpers
) {
  const { getActiveEditItemVariable, setActiveEditItemVariable, buildActivePackBundle } = helpers;

  const initStore = async (scope: StaticTrainingPackStorageScope = get().storageScope) => {
    set({ isLoading: true });
    try {
      if (scope === 'dev') await ensureBuiltInDevPacksSeeded(false);
      const packs = await listStaticTrainingPacks(scope);
      const currentSelected = scope === 'dev' ? get().devSelectedPackUuid : get().normalSelectedPackUuid;
      const validSelected =
        currentSelected && packs.some((p) => p.uuid === currentSelected)
          ? currentSelected
          : packs[0]?.uuid ?? null;

      let activePack = get().activePack;
      let activeItems = get().activeItems;
      if (validSelected && (!activePack || activePack.uuid !== validSelected)) {
        const loaded = await loadStaticTrainingPackByUuid(validSelected, scope);
        activeItems = loaded.items;
        activePack = buildActivePackBundle(loaded.metadata, loaded.items);
      }

      set({
        ...(scope === 'dev' ? { devInitialized: true } : { initialized: true }),
        isLoading: false,
        storageScope: scope,
        ...buildScopePackStatePatch(scope, packs, validSelected, true),
        activePack,
        activeItems,
        committedSessionItems: activeItems.map((it, idx) => cloneShotItem(it, idx)),
      });
    } catch (err) {
      console.error('[staticTrainingPackStore] Failed to init packs:', err);
      set({ isLoading: false, ...(scope === 'dev' ? { devInitialized: true } : { initialized: true }) });
    }
  };

  return {
    initStore,

    setStorageScope: async (scope: StaticTrainingPackStorageScope) => {
      const prevScope = get().storageScope;
      const isScopeInitialized = scope === 'dev' ? get().devInitialized : get().initialized;
      if (!isScopeInitialized) {
        await initStore(scope);
        return;
      }
      const packs = await listStaticTrainingPacks(scope);
      const savedSelected = scope === 'dev' ? get().devSelectedPackUuid : get().normalSelectedPackUuid;
      const validSelected =
        savedSelected && packs.some((p) => p.uuid === savedSelected)
          ? savedSelected
          : packs[0]?.uuid ?? null;

      let activePack = get().activePack;
      let activeItems = get().activeItems;
      if (prevScope !== scope || (validSelected && (!activePack || activePack.uuid !== validSelected))) {
        if (validSelected) {
          const loaded = await loadStaticTrainingPackByUuid(validSelected, scope);
          activeItems = loaded.items;
          activePack = buildActivePackBundle(loaded.metadata, loaded.items);
        } else {
          activeItems = [];
          activePack = null;
        }
      }

      set({
        storageScope: scope,
        ...buildScopePackStatePatch(scope, packs, validSelected, true),
        activePack,
        activeItems,
        committedSessionItems: activeItems.map((it, idx) => cloneShotItem(it, idx)),
      });
    },

    selectPack: async (uuid: string, scope: StaticTrainingPackStorageScope = get().storageScope) => {
      const loaded = await loadStaticTrainingPackByUuid(uuid, scope);
      const bundle = buildActivePackBundle(loaded.metadata, loaded.items);
      setActiveEditItemVariable(null);
      set({
        storageScope: scope,
        selectedPackUuid: uuid,
        ...(scope === 'dev' ? { devSelectedPackUuid: uuid } : { normalSelectedPackUuid: uuid }),
        activePack: bundle,
        activeItems: loaded.items,
        committedSessionItems: loaded.items.map((it, idx) => cloneShotItem(it, idx)),
        currentShotIndex: 0,
        isEditingItem: false,
        activeEditItemDraft: null,
        isFreeCamTrajectoryTesting: false,
        isTestingSingleShot: false,
      });
    },

    beginEditSession: async (uuid: string, scope: StaticTrainingPackStorageScope = get().storageScope) => {
      const loaded = await loadStaticTrainingPackByUuid(uuid, scope);
      if (!loaded.metadata) return;
      await saveEditWorkspacePackFull(loaded.metadata, loaded.items, scope);
      const bundle = buildActivePackBundle(loaded.metadata, loaded.items);
      setActiveEditItemVariable(null);
      set({
        storageScope: scope,
        selectedPackUuid: uuid,
        ...(scope === 'dev' ? { devSelectedPackUuid: uuid } : { normalSelectedPackUuid: uuid }),
        sessionMode: 'edit',
        activePack: bundle,
        activeItems: loaded.items.map((it, idx) => cloneShotItem(it, idx)),
        committedSessionItems: loaded.items.map((it, idx) => cloneShotItem(it, idx)),
        currentShotIndex: 0,
        isEditingItem: false,
        isEdgeInspectorExpanded: true,
        activeEditItemDraft: null,
        isFreeCamTrajectoryTesting: false,
        isTestingSingleShot: false,
      });
      floatingStore.triggerBatchMinimize();
      get().runtimeHandlers.onSessionModeChanged?.('edit');
    },

    saveCurrentShotToEditWorkspace: async () => {
      const { activePack, activeItems, currentShotIndex, isEditingItem, storageScope } = get();
      const draft = getActiveEditItemVariable() || get().activeEditItemDraft;
      if (!isEditingItem || !activePack || !draft) return;

      const idx = Math.max(0, Math.min(activeItems.length - 1, currentShotIndex));
      const savedShot = cloneShotItem(draft, idx);
      setActiveEditItemVariable(cloneShotItem(savedShot, idx));
      const nextItems = activeItems.map((it, i) => (i === idx ? savedShot : it));
      const updatedMeta: StaticTrainingPackMetadata = {
        ...activePack.metadata,
        itemCount: nextItems.length,
        updatedAt: Date.now(),
      };

      await saveSingleEditWorkspaceShotItem(activePack.uuid, idx, savedShot, updatedMeta, storageScope);
      const bundle = buildActivePackBundle(updatedMeta, nextItems);

      set((s) => ({
        activePack: bundle,
        activeItems: nextItems,
        activeEditItemDraft: cloneShotItem(savedShot, idx),
        editVarVersion: s.editVarVersion + 1,
      }));
    },

    deselectEditShot: async () => {
      if (get().isCurrentShotDirty()) {
        await get().saveCurrentShotToEditWorkspace();
      }
      setActiveEditItemVariable(null);
      set((s) => ({ isEditingItem: false, activeEditItemDraft: null, editVarVersion: s.editVarVersion + 1 }));
    },

    isCurrentShotDirty: () => {
      const { isEditingItem, activeEditItemDraft, activeItems, currentShotIndex } = get();
      const draft = getActiveEditItemVariable() || activeEditItemDraft;
      if (!isEditingItem || !draft) return false;
      const saved = activeItems[currentShotIndex];
      if (!saved) return true;
      return !areShotItemsEqual(draft, saved);
    },

    hasUnsavedEditSessionChanges: () => {
      const { activeItems, committedSessionItems, isEditingItem, activeEditItemDraft, currentShotIndex } = get();
      const draft = getActiveEditItemVariable() || activeEditItemDraft;
      const effectiveItems =
        isEditingItem && draft
          ? activeItems.map((it, i) => (i === currentShotIndex ? cloneShotItem(draft, i) : it))
          : activeItems;
      return !areShotListsEqual(effectiveItems, committedSessionItems);
    },

    commitEditSessionToMainDb: async () => {
      const { activePack, activeItems, isEditingItem, activeEditItemDraft, currentShotIndex, storageScope } = get();
      if (!activePack) return;
      const draft = getActiveEditItemVariable() || activeEditItemDraft;
      const finalItems = (
        isEditingItem && draft
          ? activeItems.map((it, i) => (i === currentShotIndex ? cloneShotItem(draft, i) : it))
          : activeItems
      )
        .slice(0, MAX_SHOTS_PER_PACK)
        .map((it, idx) => cloneShotItem(it, idx));

      const updatedMeta: StaticTrainingPackMetadata = {
        ...activePack.metadata,
        itemCount: finalItems.length,
        updatedAt: Date.now(),
      };

      await saveStaticTrainingPackFull(updatedMeta, finalItems, storageScope);
      await clearEditWorkspaceByUuid(activePack.uuid, storageScope);
      const packs = await listStaticTrainingPacks(storageScope);
      const bundle = buildActivePackBundle(updatedMeta, finalItems);

      setActiveEditItemVariable(null);
      set((state) => ({
        ...buildScopePackStatePatch(storageScope, packs, activePack.uuid, true),
        sessionMode: 'play',
        activePack: bundle,
        activeItems: finalItems,
        committedSessionItems: finalItems.map((item, idx) => cloneShotItem(item, idx)),
        isEditingItem: false,
        activeEditItemDraft: null,
        isFreeCamTrajectoryTesting: false,
        isTestingSingleShot: false,
        editVarVersion: state.editVarVersion + 1,
      }));
      get().runtimeHandlers.onSessionModeChanged?.('play');
    },

    discardEditSessionChanges: async () => {
      const { activePack, storageScope } = get();
      if (!activePack) return;
      await clearEditWorkspaceByUuid(activePack.uuid, storageScope);
      const loaded = await loadStaticTrainingPackByUuid(activePack.uuid, storageScope);
      const bundle = buildActivePackBundle(loaded.metadata, loaded.items);
      setActiveEditItemVariable(null);
      set((state) => ({
        sessionMode: 'play',
        activePack: bundle,
        activeItems: loaded.items,
        committedSessionItems: loaded.items.map((item, idx) => cloneShotItem(item, idx)),
        currentShotIndex: 0,
        isEditingItem: false,
        activeEditItemDraft: null,
        isFreeCamTrajectoryTesting: false,
        isTestingSingleShot: false,
        editVarVersion: state.editVarVersion + 1,
      }));
      get().runtimeHandlers.onSessionModeChanged?.('play');
    },

    createPack: async (
      title: string,
      description: string,
      scope: StaticTrainingPackStorageScope = get().storageScope
    ) => {
      const now = Date.now();
      const uuid = generateUUID();
      const initialShot = createDefaultShotItem(0);
      const meta: StaticTrainingPackMetadata = {
        uuid,
        title: (title || 'New Static Pack').trim() || 'New Static Pack',
        description: (description || '').trim(),
        tags: ['Local'],
        sourcePackType: 'RCSPackE',
        createdAt: now,
        updatedAt: now,
        itemCount: 1,
      };
      await saveStaticTrainingPackFull(meta, [initialShot], scope);
      const packs = await listStaticTrainingPacks(scope);
      const bundle = buildActivePackBundle(meta, [initialShot]);
      setActiveEditItemVariable(null);
      set({
        ...buildScopePackStatePatch(scope, packs, uuid, get().storageScope === scope),
        activePack: bundle,
        activeItems: [initialShot],
        committedSessionItems: [cloneShotItem(initialShot, 0)],
        currentShotIndex: 0,
        isEditingItem: false,
        activeEditItemDraft: null,
      });
      return meta;
    },

    updatePackInfo: async (
      uuid: string,
      title: string,
      description: string,
      scope: StaticTrainingPackStorageScope = get().storageScope
    ) => {
      const loaded = await loadStaticTrainingPackByUuid(uuid, scope);
      if (!loaded.metadata) return;
      const updatedMeta: StaticTrainingPackMetadata = {
        ...loaded.metadata,
        title,
        description,
        updatedAt: Date.now(),
      };
      await saveStaticTrainingPackFull(updatedMeta, loaded.items, scope);
      const packs = await listStaticTrainingPacks(scope);
      const selectedUuid = scope === 'dev' ? get().devSelectedPackUuid : get().normalSelectedPackUuid;
      set((state) => ({
        ...buildScopePackStatePatch(scope, packs, selectedUuid, state.storageScope === scope),
        activePack:
          state.activePack?.uuid === uuid
            ? buildActivePackBundle(updatedMeta, state.activeItems)
            : state.activePack,
      }));
    },

    deletePack: async (uuid: string, scope: StaticTrainingPackStorageScope = get().storageScope) => {
      if (get().isEditingItem && get().activePack?.uuid === uuid) {
        setActiveEditItemVariable(null);
        set({ isEditingItem: false, activeEditItemDraft: null });
      }
      await deleteStaticTrainingPackByUuid(uuid, scope);
      const packs = await listStaticTrainingPacks(scope);
      const nextUuid = packs[0]?.uuid ?? null;
      let nextActivePack: ActiveStaticTrainingPackBundle | null = null;
      let nextActiveItems: StaticTrainingShotItem[] = [];
      if (nextUuid) {
        const loaded = await loadStaticTrainingPackByUuid(nextUuid, scope);
        nextActiveItems = loaded.items;
        nextActivePack = buildActivePackBundle(loaded.metadata, loaded.items);
      }
      set({
        ...buildScopePackStatePatch(scope, packs, nextUuid, get().storageScope === scope),
        activePack: nextActivePack,
        activeItems: nextActiveItems,
        committedSessionItems: nextActiveItems.map((item, idx) => cloneShotItem(item, idx)),
        currentShotIndex: 0,
      });
    },

    exportPackRCS: async (
      uuid?: string,
      options?: ExportRCSPackOptions,
      scope: StaticTrainingPackStorageScope = get().storageScope
    ) => {
      const targetUuid = uuid || get().activePack?.uuid || get().selectedPackUuid;
      if (!targetUuid) return null;
      const loaded = await loadStaticTrainingPackByUuid(targetUuid, scope);
      if (!loaded.metadata) return null;
      return await exportStaticTrainingPackRCSPack(loaded.metadata, loaded.items, options);
    },

    exportBatchPacksZip: async (
      uuids: string[],
      bundleName = 'TrainingPacks',
      options?: ExportRCSPackOptions,
      scope: StaticTrainingPackStorageScope = get().storageScope
    ) => {
      const loadedList: Array<{ metadata: StaticTrainingPackMetadata; items: StaticTrainingShotItem[] }> = [];
      for (const uuid of uuids) {
        const loaded = await loadStaticTrainingPackByUuid(uuid, scope);
        if (loaded.metadata) {
          loadedList.push({ metadata: loaded.metadata, items: loaded.items });
        }
      }
      if (loadedList.length === 0) return null;
      return await exportBatchStaticTrainingPacksZip(loadedList, bundleName, options);
    },

    importPackRCS: async (file: File, scope: StaticTrainingPackStorageScope = get().storageScope) => {
      const metas = await importBatchStaticTrainingPacksFromFiles([file], scope);
      if (metas.length === 0) {
        const single = await importStaticTrainingPackFromFile(file, scope);
        metas.push(single.metadata);
      }
      const targetMeta = metas[0];
      const loaded = await loadStaticTrainingPackByUuid(targetMeta.uuid, scope);
      const packs = await listStaticTrainingPacks(scope);
      setActiveEditItemVariable(null);
      set({
        ...buildScopePackStatePatch(scope, packs, targetMeta.uuid, get().storageScope === scope),
        activePack: buildActivePackBundle(loaded.metadata || targetMeta, loaded.items),
        activeItems: loaded.items,
        committedSessionItems: loaded.items.map((item, idx) => cloneShotItem(item, idx)),
        currentShotIndex: 0,
        isEditingItem: false,
        activeEditItemDraft: null,
      });
      return targetMeta;
    },

    importBatchPacks: async (
      files: File[] | FileList,
      scope: StaticTrainingPackStorageScope = get().storageScope
    ) => {
      const metas = await importBatchStaticTrainingPacksFromFiles(files, scope);
      if (metas.length === 0) return [];
      const targetMeta = metas[0];
      const loaded = await loadStaticTrainingPackByUuid(targetMeta.uuid, scope);
      const packs = await listStaticTrainingPacks(scope);
      setActiveEditItemVariable(null);
      set({
        ...buildScopePackStatePatch(scope, packs, targetMeta.uuid, get().storageScope === scope),
        activePack: buildActivePackBundle(loaded.metadata || targetMeta, loaded.items),
        activeItems: loaded.items,
        committedSessionItems: loaded.items.map((item, idx) => cloneShotItem(item, idx)),
        currentShotIndex: 0,
        isEditingItem: false,
        activeEditItemDraft: null,
      });
      return metas;
    },

    seedDevBuiltInPacks: async (forceReseed = false) => {
      const seededCount = await ensureBuiltInDevPacksSeeded(forceReseed);
      if (seededCount > 0 || forceReseed || !get().devInitialized) {
        const packs = await listStaticTrainingPacks('dev');
        const currentSelected = get().devSelectedPackUuid;
        const validSelected =
          currentSelected && packs.some((p) => p.uuid === currentSelected)
            ? currentSelected
            : packs[0]?.uuid ?? null;
        const isDevActive = get().storageScope === 'dev';
        let activePack = get().activePack;
        let activeItems = get().activeItems;
        if (isDevActive && validSelected && (!activePack || activePack.uuid !== validSelected)) {
          const loaded = await loadStaticTrainingPackByUuid(validSelected, 'dev');
          activeItems = loaded.items;
          activePack = buildActivePackBundle(loaded.metadata, loaded.items);
        }
        set({
          devInitialized: true,
          ...buildScopePackStatePatch('dev', packs, validSelected, isDevActive),
          ...(isDevActive
            ? {
                activePack,
                activeItems,
                committedSessionItems: activeItems.map((it, idx) => cloneShotItem(it, idx)),
              }
            : {}),
        });
      }
      return seededCount;
    },

    importConvertedTemBundle: async (
      metadata: StaticTrainingPackMetadata,
      items: StaticTrainingShotItem[],
      scope: StaticTrainingPackStorageScope = 'dev'
    ) => {
      const normalizedItems = (items.length > 0 ? items : [createDefaultShotItem(0)])
        .slice(0, MAX_SHOTS_PER_PACK)
        .map((it, idx) => cloneShotItem(it, idx));
      const finalMeta: StaticTrainingPackMetadata = {
        ...metadata,
        itemCount: normalizedItems.length,
        updatedAt: Date.now(),
      };
      await saveStaticTrainingPackFull(finalMeta, normalizedItems, scope);
      const packs = await listStaticTrainingPacks(scope);
      setActiveEditItemVariable(null);
      set({
        ...buildScopePackStatePatch(scope, packs, finalMeta.uuid, get().storageScope === scope),
        activePack: buildActivePackBundle(finalMeta, normalizedItems),
        activeItems: normalizedItems,
        committedSessionItems: normalizedItems.map((item, idx) => cloneShotItem(item, idx)),
        currentShotIndex: 0,
        isEditingItem: false,
        activeEditItemDraft: null,
      });
      return finalMeta;
    },
  };
}
