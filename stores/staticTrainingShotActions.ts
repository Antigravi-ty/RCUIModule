import {
  type StaticTrainingPackMetadata,
  type StaticTrainingShotItem,
  MAX_SHOTS_PER_PACK,
  generateUUID,
  createDefaultShotItem,
  cloneShotItem,
  listStaticTrainingPacks,
  loadStaticTrainingPackByUuid,
  saveStaticTrainingPackFull,
  deleteStaticTrainingPackByUuid,
  saveEditWorkspacePackFull,
  saveSingleEditWorkspaceShotItem,
  exportStaticTrainingPackRCSPack,
  importStaticTrainingPackFromFile,
  exportSingleShotItemToJson,
  parseSingleShotItemFromJsonFile,
} from '../config/staticTrainingPackStorage';
import { floatingStore } from './floatingStore';
import {
  type StaticTrainingPackStoreState,
  type ActiveStaticTrainingPackBundle,
  type StaticPackSessionMode,
  getActiveEditItemVariable,
  setActiveEditItemVariable,
  buildActivePackBundle,
} from './staticTrainingPackStore';

export function createStaticTrainingShotActions(
  set: (
    partial:
      | Partial<StaticTrainingPackStoreState>
      | ((state: StaticTrainingPackStoreState) => Partial<StaticTrainingPackStoreState>)
  ) => void,
  get: () => StaticTrainingPackStoreState
) {
  return {
  createPack: async (title: string, description: string) => {
    const now = Date.now();
    const uuid = generateUUID();
    const initialShot = createDefaultShotItem(0);
    const meta: StaticTrainingPackMetadata = {
      uuid,
      title: (title || 'New Static Pack').trim() || 'New Static Pack',
      description: (description || '').trim(),
      createdAt: now,
      updatedAt: now,
      itemCount: 1,
    };
    await saveStaticTrainingPackFull(meta, [initialShot]);
    const packs = await listStaticTrainingPacks();
    const bundle = buildActivePackBundle(meta, [initialShot]);
    setActiveEditItemVariable(null);
    set({
      packs,
      selectedPackUuid: uuid,
      activePack: bundle,
      activeItems: [initialShot],
      committedSessionItems: [cloneShotItem(initialShot, 0)],
      currentShotIndex: 0,
      isEditingItem: false,
      activeEditItemDraft: null,
    });
    return meta;
  },

  updatePackInfo: async (uuid: string, title: string, description: string) => {
    const loaded = await loadStaticTrainingPackByUuid(uuid);
    if (!loaded.metadata) return;
    const updatedMeta: StaticTrainingPackMetadata = {
      ...loaded.metadata,
      title,
      description,
      updatedAt: Date.now(),
    };
    await saveStaticTrainingPackFull(updatedMeta, loaded.items);
    const packs = await listStaticTrainingPacks();
    set((state) => ({
      packs,
      activePack:
        state.activePack?.uuid === uuid
          ? buildActivePackBundle(updatedMeta, state.activeItems)
          : state.activePack,
    }));
  },

  deletePack: async (uuid: string) => {
    if (get().isEditingItem && get().activePack?.uuid === uuid) {
      setActiveEditItemVariable(null);
      set({ isEditingItem: false, activeEditItemDraft: null });
    }
    await deleteStaticTrainingPackByUuid(uuid);
    const packs = await listStaticTrainingPacks();
    const nextUuid = packs[0]?.uuid ?? null;
    let nextActivePack: ActiveStaticTrainingPackBundle | null = null;
    let nextActiveItems: StaticTrainingShotItem[] = [];
    if (nextUuid) {
      const loaded = await loadStaticTrainingPackByUuid(nextUuid);
      nextActiveItems = loaded.items;
      nextActivePack = buildActivePackBundle(loaded.metadata, loaded.items);
    }
    set({
      packs,
      selectedPackUuid: nextUuid,
      activePack: nextActivePack,
      activeItems: nextActiveItems,
      committedSessionItems: nextActiveItems.map((item, idx) => cloneShotItem(item, idx)),
      currentShotIndex: 0,
    });
  },

  exportPackRCS: async (uuid?: string) => {
    const targetUuid = uuid || get().activePack?.uuid || get().selectedPackUuid;
    if (!targetUuid) return null;
    const loaded = await loadStaticTrainingPackByUuid(targetUuid);
    if (!loaded.metadata) return null;
    return await exportStaticTrainingPackRCSPack(loaded.metadata, loaded.items);
  },

  importPackRCS: async (file: File) => {
    const { metadata, items } = await importStaticTrainingPackFromFile(file);
    const packs = await listStaticTrainingPacks();
    const bundle = buildActivePackBundle(metadata, items);
    setActiveEditItemVariable(null);
    set({
      packs,
      selectedPackUuid: metadata.uuid,
      activePack: bundle,
      activeItems: items,
      committedSessionItems: items.map((item, idx) => cloneShotItem(item, idx)),
      currentShotIndex: 0,
      isEditingItem: false,
      activeEditItemDraft: null,
    });
    return metadata;
  },

  setSessionMode: (mode: StaticPackSessionMode) => {
    set({ sessionMode: mode });
    get().runtimeHandlers.onSessionModeChanged?.(mode);
  },

  setEdgeInspectorExpanded: (expanded: boolean) => {
    const next = Boolean(expanded);
    if (next && !get().isEdgeInspectorExpanded) {
      floatingStore.triggerBatchMinimize();
    }
    set({ isEdgeInspectorExpanded: next });
  },

  toggleEdgeInspectorExpanded: () => {
    const next = !get().isEdgeInspectorExpanded;
    if (next) {
      floatingStore.triggerBatchMinimize();
    }
    set({ isEdgeInspectorExpanded: next });
  },

  setCurrentShotIndex: (index: number) => {
    const items = get().activePack?.items || get().activeItems || [];
    if (items.length === 0) return;
    const wrapped = ((index % items.length) + items.length) % items.length;
    set({
      currentShotIndex: wrapped,
      remainingTimeoutSec: items[wrapped]?.timeoutSeconds ?? 10,
    });
    get().runtimeHandlers.onShotChanged?.(wrapped);
  },

  nextShot: () => {
    const items = get().activePack?.items || get().activeItems || [];
    if (items.length === 0) return;
    const nextIdx = (get().currentShotIndex + 1) % items.length;
    get().setCurrentShotIndex(nextIdx);
  },

  prevShot: () => {
    const items = get().activePack?.items || get().activeItems || [];
    if (items.length === 0) return;
    const prevIdx = (get().currentShotIndex - 1 + items.length) % items.length;
    get().setCurrentShotIndex(prevIdx);
  },

  resetCurrentShot: () => {
    get().runtimeHandlers.onResetShotRequested?.();
  },

  addNewShot: async () => {
    const wasEditingItem = get().isEditingItem;
    if (wasEditingItem && get().isCurrentShotDirty()) {
      await get().saveCurrentShotToEditWorkspace();
    }
    const { activePack, activeItems } = get();
    if (!activePack || activeItems.length >= MAX_SHOTS_PER_PACK) return;
    const newIndex = activeItems.length;
    const newShot = createDefaultShotItem(newIndex);
    const nextItems = [...activeItems, newShot];
    const updatedMeta: StaticTrainingPackMetadata = {
      ...activePack.metadata,
      itemCount: nextItems.length,
      updatedAt: Date.now(),
    };
    await saveEditWorkspacePackFull(updatedMeta, nextItems);
    const bundle = buildActivePackBundle(updatedMeta, nextItems);
    if (wasEditingItem) {
      const draft = cloneShotItem(newShot, newIndex);
      setActiveEditItemVariable(cloneShotItem(draft, newIndex));
      set((state) => ({
        activePack: bundle,
        activeItems: nextItems,
        currentShotIndex: newIndex,
        activeEditItemDraft: draft,
        editVarVersion: state.editVarVersion + 1,
      }));
      const handlers = get().runtimeHandlers;
      handlers.onShotChanged?.(newIndex);
      handlers.onEditVariableMutated?.(draft);
    } else {
      set({
        activePack: bundle,
        activeItems: nextItems,
        currentShotIndex: newIndex,
      });
      get().runtimeHandlers.onShotChanged?.(newIndex);
    }
  },

  duplicateShot: async (index: number) => {
    if (get().isEditingItem && get().isCurrentShotDirty()) {
      await get().saveCurrentShotToEditWorkspace();
    }
    const { activePack, activeItems } = get();
    if (
      !activePack ||
      index < 0 ||
      index >= activeItems.length ||
      activeItems.length >= MAX_SHOTS_PER_PACK
    ) {
      return;
    }
    const source = activeItems[index];
    const duplicated = cloneShotItem(source, index + 1);
    duplicated.id = generateUUID();
    duplicated.name = `${source.name || `Shot ${index + 1}`} (Copy)`;
    const nextItems = [
      ...activeItems.slice(0, index + 1),
      duplicated,
      ...activeItems.slice(index + 1),
    ].map((item, idx) => ({ ...item, index: idx }));

    const updatedMeta: StaticTrainingPackMetadata = {
      ...activePack.metadata,
      itemCount: nextItems.length,
      updatedAt: Date.now(),
    };
    await saveEditWorkspacePackFull(updatedMeta, nextItems);
    const bundle = buildActivePackBundle(updatedMeta, nextItems);
    set({
      activePack: bundle,
      activeItems: nextItems,
      currentShotIndex: index + 1,
    });
    get().runtimeHandlers.onShotChanged?.(index + 1);
  },

  deleteShot: async (index: number) => {
    if (get().isEditingItem && get().isCurrentShotDirty()) {
      await get().saveCurrentShotToEditWorkspace();
    }
    const { activePack, activeItems, currentShotIndex } = get();
    if (!activePack || activeItems.length <= 1) return;
    const nextItems = activeItems
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, index: idx }));
    const nextIdx = Math.max(
      0,
      Math.min(nextItems.length - 1, currentShotIndex >= index ? currentShotIndex - 1 : currentShotIndex)
    );

    const updatedMeta: StaticTrainingPackMetadata = {
      ...activePack.metadata,
      itemCount: nextItems.length,
      updatedAt: Date.now(),
    };
    await saveEditWorkspacePackFull(updatedMeta, nextItems);
    const bundle = buildActivePackBundle(updatedMeta, nextItems);
    setActiveEditItemVariable(null);
    set({
      activePack: bundle,
      activeItems: nextItems,
      currentShotIndex: nextIdx,
      isEditingItem: false,
      activeEditItemDraft: null,
    });
    get().runtimeHandlers.onShotChanged?.(nextIdx);
  },

  reorderShot: async (fromIndex: number, toIndex: number) => {
    if (get().isEditingItem && get().isCurrentShotDirty()) {
      await get().saveCurrentShotToEditWorkspace();
    }
    const { activePack, activeItems } = get();
    if (
      !activePack ||
      fromIndex < 0 ||
      fromIndex >= activeItems.length ||
      toIndex < 0 ||
      toIndex >= activeItems.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    const copy = [...activeItems];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    const nextItems = copy.map((item, idx) => ({ ...item, index: idx }));

    const updatedMeta: StaticTrainingPackMetadata = {
      ...activePack.metadata,
      itemCount: nextItems.length,
      updatedAt: Date.now(),
    };
    await saveEditWorkspacePackFull(updatedMeta, nextItems);
    const bundle = buildActivePackBundle(updatedMeta, nextItems);
    set({
      activePack: bundle,
      activeItems: nextItems,
      currentShotIndex: toIndex,
    });
    get().runtimeHandlers.onShotChanged?.(toIndex);
  },

  enterItemEditMode: (index?: number) => {
    if (get().isEditingItem && get().isCurrentShotDirty()) {
      void get().saveCurrentShotToEditWorkspace();
    }
    const items = get().activePack?.items || get().activeItems || [];
    const targetIdx = typeof index === 'number' ? index : get().currentShotIndex;
    const targetItem = items[targetIdx];
    if (!targetItem) return;

    const draft = cloneShotItem(targetItem, targetIdx);
    setActiveEditItemVariable(cloneShotItem(draft, targetIdx));

    const nextSubMode =
      draft.car.speedFollowsHeading !== false && get().editSubMode === 'car-speed'
        ? 'car-heading'
        : get().editSubMode;

    set((state) => ({
      sessionMode: 'edit',
      currentShotIndex: targetIdx,
      isEditingItem: true,
      activeEditItemDraft: draft,
      editSubMode: nextSubMode,
      editVarVersion: state.editVarVersion + 1,
    }));

    const handlers = get().runtimeHandlers;
    handlers.onShotChanged?.(targetIdx);
    handlers.onEditVariableMutated?.(draft);
  },

  exportSingleShotJson: (index?: number) => {
    const { activePack, activeItems, currentShotIndex, isEditingItem } = get();
    const targetItem =
      isEditingItem && getActiveEditItemVariable() && index === undefined
        ? getActiveEditItemVariable()!
        : activeItems[typeof index === 'number' ? index : currentShotIndex];
    if (!targetItem) return null;
    return exportSingleShotItemToJson(targetItem, activePack?.title || 'StaticPack');
  },

  importSingleShotJson: async (file: File, index?: number) => {
    const { activePack, activeItems, currentShotIndex, isEditingItem } = get();
    const targetIdx = typeof index === 'number' ? index : currentShotIndex;
    const parsedItem = await parseSingleShotItemFromJsonFile(file, targetIdx);

    if (isEditingItem && targetIdx === currentShotIndex) {
      setActiveEditItemVariable(cloneShotItem(parsedItem, targetIdx));
      set((state) => ({
        activeEditItemDraft: cloneShotItem(parsedItem, targetIdx),
        editVarVersion: state.editVarVersion + 1,
      }));
      get().runtimeHandlers.onEditVariableMutated?.(parsedItem);
      return;
    }

    if (!activePack) return;
    const nextItems = activeItems.map((item, idx) => (idx === targetIdx ? parsedItem : item));
    await saveSingleEditWorkspaceShotItem(activePack.uuid, targetIdx, parsedItem, activePack.metadata);
    const bundle = buildActivePackBundle(activePack.metadata, nextItems);
    set({ activePack: bundle, activeItems: nextItems, currentShotIndex: targetIdx });
    get().runtimeHandlers.onShotChanged?.(targetIdx);
  },

  };
}
