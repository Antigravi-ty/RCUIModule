import { create } from 'zustand';
import {
  type StaticTrainingPackMetadata,
  type StaticTrainingShotItem,
  type EditSubMode,
  type ActiveStaticTrainingPackBundle,
  MAX_SHOTS_PER_PACK,
  createDefaultShotItem,
  cloneShotItem,
  areShotItemsEqual,
  areShotListsEqual,
  buildActivePackBundle,
  computeEffectiveWorkspaceItems,
  computeNextEditSubMode,
  persistWorkspaceShotListMutation,
  duplicateWorkspaceShotAt,
  reorderWorkspaceShotAt,
  commitWorkspaceShotsToMainVfs,
  loadStaticTrainingPackByUuid,
  saveEditWorkspacePackFull,
  saveSingleEditWorkspaceShotItem,
  clearEditWorkspaceByUuid,
  exportSingleShotItemToJson,
  parseSingleShotItemFromJsonFile,
} from './staticTrainingPackStorage';
import { floatingStore } from './floatingStore';

export type StaticPackSessionMode = 'browse' | 'play' | 'edit';

export interface StaticTrainingPackRuntimeHandlers {
  onShotChanged?: (shotIndex: number) => void;
  onResetShotRequested?: () => void;
  onEditVariableMutated?: (draft: StaticTrainingShotItem) => void;
  onEditSubModeChanged?: (subMode: EditSubMode) => void;
  onSessionModeChanged?: (mode: StaticPackSessionMode) => void;
}

let activeEditItemVariable: StaticTrainingShotItem | null = null;

export function getActiveEditItemVariable(): StaticTrainingShotItem | null {
  return activeEditItemVariable;
}

export function setActiveEditItemVariable(item: StaticTrainingShotItem | null): void {
  activeEditItemVariable = item;
}

function createGuardedRuntimeHandlers<T extends object>(storeTag: string, rawHandlers: T): T {
  return new Proxy(rawHandlers, {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') return val;
      if (typeof prop === 'string' && prop.startsWith('on')) {
        return (..._args: unknown[]) => {
          console.warn(`[${storeTag}] Runtime handler "${prop}" was invoked before registration.`);
        };
      }
      return val;
    },
  });
}

export interface StaticTrainingShotWorkspaceStoreState {
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
  activeCountdownSec: number;
  isShotLaunched: boolean;
  isOvertimeWaitGround: boolean;
  isReplayActive: boolean;
  replayType: 'goal' | 'expire' | null;
  isFreeCamTrajectoryTesting: boolean;
  isTestingSingleShot: boolean;
  runtimeHandlers: StaticTrainingPackRuntimeHandlers;

  loadPackIntoWorkspace: (metadata: StaticTrainingPackMetadata | null, items: StaticTrainingShotItem[]) => void;
  setSessionMode: (mode: StaticPackSessionMode) => void;
  setEdgeInspectorExpanded: (expanded: boolean) => void;
  toggleEdgeInspectorExpanded: () => void;
  beginEditSession: (uuid: string) => Promise<void>;
  saveCurrentShotToEditWorkspace: () => Promise<void>;
  deselectEditShot: () => Promise<void>;
  isCurrentShotDirty: () => boolean;
  hasUnsavedEditSessionChanges: () => boolean;
  commitEditSessionToMainDb: () => Promise<StaticTrainingPackMetadata[]>;
  discardEditSessionChanges: () => Promise<void>;
  setCurrentShotIndex: (index: number) => void;
  nextShot: () => void;
  prevShot: () => void;
  resetCurrentShot: () => void;
  addNewShot: () => Promise<void>;
  duplicateShot: (index: number) => Promise<void>;
  deleteShot: (index: number) => Promise<void>;
  reorderShot: (fromIndex: number, toIndex: number) => Promise<void>;
  enterItemEditMode: (index?: number) => void;
  exportSingleShotJson: (index?: number) => string | null;
  importSingleShotJson: (file: File, index?: number) => Promise<void>;
  setEditSubMode: (subMode: EditSubMode) => void;
  cycleEditSubMode: (delta: 1 | -1) => EditSubMode;
  setFreeCamTrajectoryTesting: (active: boolean) => void;
  setTestingSingleShot: (active: boolean) => void;
  updateLiveTelemetry: (patch: Partial<StaticTrainingShotWorkspaceStoreState>) => void;
  setRuntimeHandlers: (handlers: Partial<StaticTrainingPackRuntimeHandlers>) => void;
}

export const useStaticTrainingShotWorkspaceStore = create<StaticTrainingShotWorkspaceStoreState>(
  (set, get) => ({
    sessionMode: 'play',
    activePack: null,
    activeItems: [],
    committedSessionItems: [],
    currentShotIndex: 0,
    isEditingItem: false,
    isEdgeInspectorExpanded: true,
    activeEditItemDraft: null,
    editSubMode: 'car-heading',
    editVarVersion: 0,
    remainingTimeoutSec: 10,
    activeCountdownSec: 0,
    isShotLaunched: false,
    isOvertimeWaitGround: false,
    isReplayActive: false,
    replayType: null,
    isFreeCamTrajectoryTesting: false,
    isTestingSingleShot: false,
    runtimeHandlers: createGuardedRuntimeHandlers<StaticTrainingPackRuntimeHandlers>(
      'staticTrainingShotWorkspaceStore',
      {}
    ),

    loadPackIntoWorkspace: (metadata, items) => {
      activeEditItemVariable = null;
      set({
        activePack: buildActivePackBundle(metadata, items),
        activeItems: items,
        committedSessionItems: items.map((it, idx) => cloneShotItem(it, idx)),
        currentShotIndex: 0,
        isEditingItem: false,
        activeEditItemDraft: null,
        isFreeCamTrajectoryTesting: false,
        isTestingSingleShot: false,
      });
    },

    setSessionMode: (mode) => {
      set({ sessionMode: mode });
      get().runtimeHandlers.onSessionModeChanged?.(mode);
    },

    setEdgeInspectorExpanded: (expanded) => {
      const next = Boolean(expanded);
      if (next && !get().isEdgeInspectorExpanded) floatingStore.triggerBatchMinimize();
      set({ isEdgeInspectorExpanded: next });
    },

    toggleEdgeInspectorExpanded: () => {
      const next = !get().isEdgeInspectorExpanded;
      if (next) floatingStore.triggerBatchMinimize();
      set({ isEdgeInspectorExpanded: next });
    },

    beginEditSession: async (uuid) => {
      const loaded = await loadStaticTrainingPackByUuid(uuid);
      if (!loaded.metadata) return;
      await saveEditWorkspacePackFull(loaded.metadata, loaded.items);
      activeEditItemVariable = null;
      const cloned = loaded.items.map((it, idx) => cloneShotItem(it, idx));
      set({
        sessionMode: 'edit',
        activePack: buildActivePackBundle(loaded.metadata, loaded.items),
        activeItems: cloned,
        committedSessionItems: cloned.map((it, idx) => cloneShotItem(it, idx)),
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
      const { activePack, activeItems, currentShotIndex, isEditingItem, activeEditItemDraft } = get();
      const draft = activeEditItemVariable || activeEditItemDraft;
      if (!isEditingItem || !activePack || !draft) return;
      const idx = Math.max(0, Math.min(activeItems.length - 1, currentShotIndex));
      const savedShot = cloneShotItem(draft, idx);
      activeEditItemVariable = cloneShotItem(savedShot, idx);
      const nextItems = activeItems.map((it, i) => (i === idx ? savedShot : it));
      const updatedMeta = { ...activePack.metadata, itemCount: nextItems.length, updatedAt: Date.now() };
      await saveSingleEditWorkspaceShotItem(activePack.uuid, idx, savedShot, updatedMeta);
      set((s) => ({
        activePack: buildActivePackBundle(updatedMeta, nextItems),
        activeItems: nextItems,
        activeEditItemDraft: cloneShotItem(savedShot, idx),
        editVarVersion: s.editVarVersion + 1,
      }));
    },

    deselectEditShot: async () => {
      if (get().isCurrentShotDirty()) await get().saveCurrentShotToEditWorkspace();
      activeEditItemVariable = null;
      set((s) => ({ isEditingItem: false, activeEditItemDraft: null, editVarVersion: s.editVarVersion + 1 }));
    },

    isCurrentShotDirty: () => {
      const { isEditingItem, activeEditItemDraft, activeItems, currentShotIndex } = get();
      const draft = activeEditItemVariable || activeEditItemDraft;
      if (!isEditingItem || !draft) return false;
      const saved = activeItems[currentShotIndex];
      return !saved || !areShotItemsEqual(draft, saved);
    },

    hasUnsavedEditSessionChanges: () => {
      const { activeItems, committedSessionItems, isEditingItem, activeEditItemDraft, currentShotIndex } = get();
      const effective = computeEffectiveWorkspaceItems(
        activeItems,
        isEditingItem,
        activeEditItemVariable || activeEditItemDraft,
        currentShotIndex
      );
      return !areShotListsEqual(effective, committedSessionItems);
    },

    commitEditSessionToMainDb: async () => {
      const { activePack, activeItems, isEditingItem, activeEditItemDraft, currentShotIndex } = get();
      if (!activePack) return [];
      const { packs, bundle, finalItems } = await commitWorkspaceShotsToMainVfs(
        activePack.metadata,
        activeItems,
        isEditingItem,
        activeEditItemVariable || activeEditItemDraft,
        currentShotIndex
      );
      activeEditItemVariable = null;
      set((s) => ({
        sessionMode: 'play',
        activePack: bundle,
        activeItems: finalItems,
        committedSessionItems: finalItems.map((item, idx) => cloneShotItem(item, idx)),
        isEditingItem: false,
        activeEditItemDraft: null,
        isFreeCamTrajectoryTesting: false,
        isTestingSingleShot: false,
        editVarVersion: s.editVarVersion + 1,
      }));
      get().runtimeHandlers.onSessionModeChanged?.('play');
      return packs;
    },

    discardEditSessionChanges: async () => {
      const { activePack } = get();
      if (!activePack) return;
      await clearEditWorkspaceByUuid(activePack.uuid);
      const loaded = await loadStaticTrainingPackByUuid(activePack.uuid);
      activeEditItemVariable = null;
      set((s) => ({
        sessionMode: 'play',
        activePack: buildActivePackBundle(loaded.metadata, loaded.items),
        activeItems: loaded.items,
        committedSessionItems: loaded.items.map((item, idx) => cloneShotItem(item, idx)),
        currentShotIndex: 0,
        isEditingItem: false,
        activeEditItemDraft: null,
        isFreeCamTrajectoryTesting: false,
        isTestingSingleShot: false,
        editVarVersion: s.editVarVersion + 1,
      }));
      get().runtimeHandlers.onSessionModeChanged?.('play');
    },

    setCurrentShotIndex: (index) => {
      const items = get().activePack?.items || get().activeItems || [];
      if (items.length === 0) return;
      const wrapped = ((index % items.length) + items.length) % items.length;
      set({ currentShotIndex: wrapped, remainingTimeoutSec: items[wrapped]?.timeoutSeconds ?? 10 });
      get().runtimeHandlers.onShotChanged?.(wrapped);
    },

    nextShot: () => {
      const items = get().activePack?.items || get().activeItems || [];
      if (items.length > 0) get().setCurrentShotIndex((get().currentShotIndex + 1) % items.length);
    },

    prevShot: () => {
      const items = get().activePack?.items || get().activeItems || [];
      if (items.length > 0) get().setCurrentShotIndex((get().currentShotIndex - 1 + items.length) % items.length);
    },

    resetCurrentShot: () => get().runtimeHandlers.onResetShotRequested?.(),

    addNewShot: async () => {
      const wasEditingItem = get().isEditingItem;
      if (wasEditingItem && get().isCurrentShotDirty()) await get().saveCurrentShotToEditWorkspace();
      const { activePack, activeItems } = get();
      if (!activePack || activeItems.length >= MAX_SHOTS_PER_PACK) return;
      const newIndex = activeItems.length;
      const newShot = createDefaultShotItem(newIndex);
      const { bundle, nextItems } = await persistWorkspaceShotListMutation(activePack.metadata, [
        ...activeItems,
        newShot,
      ]);
      if (wasEditingItem) {
        const draft = cloneShotItem(newShot, newIndex);
        activeEditItemVariable = cloneShotItem(draft, newIndex);
        set((s) => ({
          activePack: bundle,
          activeItems: nextItems,
          currentShotIndex: newIndex,
          activeEditItemDraft: draft,
          editVarVersion: s.editVarVersion + 1,
        }));
        get().runtimeHandlers.onShotChanged?.(newIndex);
        get().runtimeHandlers.onEditVariableMutated?.(draft);
      } else {
        set({ activePack: bundle, activeItems: nextItems, currentShotIndex: newIndex });
        get().runtimeHandlers.onShotChanged?.(newIndex);
      }
    },

    duplicateShot: async (index) => {
      if (get().isEditingItem && get().isCurrentShotDirty()) await get().saveCurrentShotToEditWorkspace();
      const { activePack, activeItems } = get();
      if (!activePack || index < 0 || index >= activeItems.length || activeItems.length >= MAX_SHOTS_PER_PACK) return;
      const { bundle, nextItems } = await duplicateWorkspaceShotAt(activePack.metadata, activeItems, index);
      set({ activePack: bundle, activeItems: nextItems, currentShotIndex: index + 1 });
      get().runtimeHandlers.onShotChanged?.(index + 1);
    },

    deleteShot: async (index) => {
      if (get().isEditingItem && get().isCurrentShotDirty()) await get().saveCurrentShotToEditWorkspace();
      const { activePack, activeItems, currentShotIndex } = get();
      if (!activePack || activeItems.length <= 1) return;
      const { bundle, nextItems } = await persistWorkspaceShotListMutation(
        activePack.metadata,
        activeItems.filter((_, idx) => idx !== index)
      );
      const nextIdx = Math.max(0, Math.min(nextItems.length - 1, currentShotIndex >= index ? currentShotIndex - 1 : currentShotIndex));
      activeEditItemVariable = null;
      set({ activePack: bundle, activeItems: nextItems, currentShotIndex: nextIdx, isEditingItem: false, activeEditItemDraft: null });
      get().runtimeHandlers.onShotChanged?.(nextIdx);
    },

    reorderShot: async (fromIndex, toIndex) => {
      if (get().isEditingItem && get().isCurrentShotDirty()) await get().saveCurrentShotToEditWorkspace();
      const { activePack, activeItems } = get();
      if (!activePack || fromIndex < 0 || fromIndex >= activeItems.length || toIndex < 0 || toIndex >= activeItems.length || fromIndex === toIndex) return;
      const { bundle, nextItems } = await reorderWorkspaceShotAt(activePack.metadata, activeItems, fromIndex, toIndex);
      set({ activePack: bundle, activeItems: nextItems, currentShotIndex: toIndex });
      get().runtimeHandlers.onShotChanged?.(toIndex);
    },

    enterItemEditMode: (index) => {
      if (get().isEditingItem && get().isCurrentShotDirty()) void get().saveCurrentShotToEditWorkspace();
      const items = get().activePack?.items || get().activeItems || [];
      const targetIdx = typeof index === 'number' ? index : get().currentShotIndex;
      const targetItem = items[targetIdx];
      if (!targetItem) return;
      const draft = cloneShotItem(targetItem, targetIdx);
      activeEditItemVariable = cloneShotItem(draft, targetIdx);
      const nextSubMode = draft.car.speedFollowsHeading !== false && get().editSubMode === 'car-speed' ? 'car-heading' : get().editSubMode;
      set((s) => ({ sessionMode: 'edit', currentShotIndex: targetIdx, isEditingItem: true, activeEditItemDraft: draft, editSubMode: nextSubMode, editVarVersion: s.editVarVersion + 1 }));
      get().runtimeHandlers.onShotChanged?.(targetIdx);
      get().runtimeHandlers.onEditVariableMutated?.(draft);
    },

    exportSingleShotJson: (index) => {
      const { activePack, activeItems, currentShotIndex, isEditingItem } = get();
      const targetItem = isEditingItem && activeEditItemVariable && index === undefined ? activeEditItemVariable : activeItems[typeof index === 'number' ? index : currentShotIndex];
      return targetItem ? exportSingleShotItemToJson(targetItem, activePack?.title || 'StaticPack') : null;
    },

    importSingleShotJson: async (file, index) => {
      const { activePack, activeItems, currentShotIndex, isEditingItem } = get();
      const targetIdx = typeof index === 'number' ? index : currentShotIndex;
      const parsedItem = await parseSingleShotItemFromJsonFile(file, targetIdx);
      if (isEditingItem && targetIdx === currentShotIndex) {
        activeEditItemVariable = cloneShotItem(parsedItem, targetIdx);
        set((s) => ({ activeEditItemDraft: cloneShotItem(parsedItem, targetIdx), editVarVersion: s.editVarVersion + 1 }));
        get().runtimeHandlers.onEditVariableMutated?.(parsedItem);
        return;
      }
      if (!activePack) return;
      const nextItems = activeItems.map((item, idx) => (idx === targetIdx ? parsedItem : item));
      await saveSingleEditWorkspaceShotItem(activePack.uuid, targetIdx, parsedItem, activePack.metadata);
      set({ activePack: buildActivePackBundle(activePack.metadata, nextItems), activeItems: nextItems, currentShotIndex: targetIdx });
      get().runtimeHandlers.onShotChanged?.(targetIdx);
    },

    setEditSubMode: (subMode) => {
      set({ editSubMode: subMode });
      get().runtimeHandlers.onEditSubModeChanged?.(subMode);
    },

    cycleEditSubMode: (delta) => {
      const currentItem = activeEditItemVariable || get().activeEditItemDraft || get().activePack?.items?.[get().currentShotIndex] || get().activeItems?.[get().currentShotIndex];
      const nextMode = computeNextEditSubMode(get().editSubMode, currentItem, delta);
      set({ editSubMode: nextMode });
      get().runtimeHandlers.onEditSubModeChanged?.(nextMode);
      return nextMode;
    },

    setFreeCamTrajectoryTesting: (active) => set({ isFreeCamTrajectoryTesting: Boolean(active) }),
    setTestingSingleShot: (active) => set({ isTestingSingleShot: Boolean(active) }),
    updateLiveTelemetry: (patch) => set((state) => ({ ...state, ...patch })),

    setRuntimeHandlers: (handlers) => {
      set((s) => ({
        runtimeHandlers: createGuardedRuntimeHandlers<StaticTrainingPackRuntimeHandlers>(
          'staticTrainingShotWorkspaceStore',
          { ...s.runtimeHandlers, ...handlers }
        ),
      }));
    },
  })
);

export function mutateActiveEditItemVariable(
  updater: (draft: StaticTrainingShotItem) => void
): StaticTrainingShotItem | null {
  const store = useStaticTrainingShotWorkspaceStore.getState();
  if (!activeEditItemVariable) {
    const items = store.activePack?.items || store.activeItems || [];
    const fallback = items[store.currentShotIndex] || items[0];
    if (!fallback) return null;
    activeEditItemVariable = cloneShotItem(fallback, store.currentShotIndex);
  }
  updater(activeEditItemVariable);
  const clonedDraft = cloneShotItem(activeEditItemVariable, store.currentShotIndex);
  activeEditItemVariable = clonedDraft;
  useStaticTrainingShotWorkspaceStore.setState((s) => ({
    editVarVersion: s.editVarVersion + 1,
    activeEditItemDraft: clonedDraft,
  }));
  store.runtimeHandlers.onEditVariableMutated?.(clonedDraft);
  return clonedDraft;
}
