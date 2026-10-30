import { createStaticTrainingShotActions } from './staticTrainingShotActions';
import { create } from 'zustand';
import {
  type StaticTrainingPackMetadata,
  type StaticTrainingShotItem,
  type EditSubMode,
  EDIT_SUB_MODES_ORDER,
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
  importStaticTrainingPackFromFile,
  exportSingleShotItemToJson,
  parseSingleShotItemFromJsonFile,
} from '../config/staticTrainingPackStorage';
import { floatingStore } from './floatingStore';

export {
  type StaticTrainingPackMetadata,
  type StaticTrainingShotItem,
  type EditSubMode,
  MAX_SHOTS_PER_PACK,
  areShotItemsEqual,
  areShotListsEqual,
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

/**
 * Fast in-memory variable holding the active shot item during Item Edit Mode.
 * Mutated directly at 60-120Hz during keyboard/mouse manipulation.
 */
let activeEditItemVariable: StaticTrainingShotItem | null = null;

export function getActiveEditItemVariable(): StaticTrainingShotItem | null {
  return activeEditItemVariable;
}

export function setActiveEditItemVariable(item: StaticTrainingShotItem | null): void {
  activeEditItemVariable = item;
}

export function mutateActiveEditItemVariable(
  updater: (draft: StaticTrainingShotItem) => void
): StaticTrainingShotItem | null {
  const store = useStaticTrainingPackStore.getState();
  if (!activeEditItemVariable) {
    const items = store.activePack?.items || store.activeItems || [];
    const fallback = items[store.currentShotIndex] || items[0];
    if (!fallback) return null;
    activeEditItemVariable = cloneShotItem(fallback, store.currentShotIndex);
  }
  updater(activeEditItemVariable);
  const clonedDraft = cloneShotItem(activeEditItemVariable, store.currentShotIndex);
  activeEditItemVariable = clonedDraft;
  useStaticTrainingPackStore.setState((state) => ({
    editVarVersion: state.editVarVersion + 1,
    activeEditItemDraft: clonedDraft,
  }));
  const handlers = store.runtimeHandlers;
  handlers.onEditVariableMutated?.(clonedDraft);
  return clonedDraft;
}

function createGuardedRuntimeHandlers<T extends object>(storeTag: string, rawHandlers: T): T {
  return new Proxy(rawHandlers, {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return val;
      }
      if (typeof prop === 'string' && prop.startsWith('on')) {
        return (..._args: unknown[]) => {
          console.warn(
            `[${storeTag}] Runtime handler "${prop}" was invoked before StaticTrainingPackMode registered its handlers.`
          );
        };
      }
      return val;
    },
  });
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

export interface StaticTrainingPackRuntimeHandlers {
  onShotChanged?: (shotIndex: number) => void;
  onResetShotRequested?: () => void;
  onEditVariableMutated?: (draft: StaticTrainingShotItem) => void;
  onEditSubModeChanged?: (subMode: EditSubMode) => void;
  onSessionModeChanged?: (mode: StaticPackSessionMode) => void;
}

export interface StaticTrainingPackStoreState {
  initialized: boolean;
  isLoading: boolean;
  packs: StaticTrainingPackMetadata[];
  selectedPackUuid: string | null;

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

  downCounterEnabled: boolean;
  downCounterValue: StaticPackDownCounterOption;

  remainingTimeoutSec: number;
  activeCountdownSec: number;
  isShotLaunched: boolean;
  isOvertimeWaitGround: boolean;
  isReplayActive: boolean;
  replayType: 'goal' | 'expire' | null;
  isFreeCamTrajectoryTesting: boolean;
  isTestingSingleShot: boolean;

  runtimeHandlers: StaticTrainingPackRuntimeHandlers;

  initStore: () => Promise<void>;
  selectPack: (uuid: string) => Promise<void>;
  createPack: (title: string, description: string) => Promise<StaticTrainingPackMetadata>;
  updatePackInfo: (uuid: string, title: string, description: string) => Promise<void>;
  deletePack: (uuid: string) => Promise<void>;
  exportPackRCS: (uuid?: string) => Promise<string | null>;
  importPackRCS: (file: File) => Promise<StaticTrainingPackMetadata>;

  setSessionMode: (mode: StaticPackSessionMode) => void;
  setEdgeInspectorExpanded: (expanded: boolean) => void;
  toggleEdgeInspectorExpanded: () => void;
  beginEditSession: (uuid: string) => Promise<void>;
  saveCurrentShotToEditWorkspace: () => Promise<void>;
  deselectEditShot: () => Promise<void>;
  isCurrentShotDirty: () => boolean;
  hasUnsavedEditSessionChanges: () => boolean;
  commitEditSessionToMainDb: () => Promise<void>;
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

  setDownCounterEnabled: (enabled: boolean) => void;
  setDownCounterValue: (val: StaticPackDownCounterOption) => void;
  setFreeCamTrajectoryTesting: (active: boolean) => void;
  setTestingSingleShot: (active: boolean) => void;
  updateLiveTelemetry: (
    patch: Partial<{
      remainingTimeoutSec: number;
      activeCountdownSec: number;
      isShotLaunched: boolean;
      isOvertimeWaitGround: boolean;
      isReplayActive: boolean;
      replayType: 'goal' | 'expire' | null;
      isFreeCamTrajectoryTesting: boolean;
      isTestingSingleShot: boolean;
    }>
  ) => void;
  setRuntimeHandlers: (handlers: Partial<StaticTrainingPackRuntimeHandlers>) => void;
}

export const useStaticTrainingPackStore = create<StaticTrainingPackStoreState>((set, get) => ({
  initialized: false,
  isLoading: false,
  packs: [],
  selectedPackUuid: null,

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

  downCounterEnabled: false,
  downCounterValue: 1,

  remainingTimeoutSec: 10,
  activeCountdownSec: 0,
  isShotLaunched: false,
  isOvertimeWaitGround: false,
  isReplayActive: false,
  replayType: null,
  isFreeCamTrajectoryTesting: false,
  isTestingSingleShot: false,

  runtimeHandlers: createGuardedRuntimeHandlers<StaticTrainingPackRuntimeHandlers>(
    'staticTrainingPackStore',
    {}
  ),

  initStore: async () => {
    set({ isLoading: true });
    try {
      const packs = await listStaticTrainingPacks();
      const currentSelected = get().selectedPackUuid;
      const validSelected =
        currentSelected && packs.some((p) => p.uuid === currentSelected)
          ? currentSelected
          : packs[0]?.uuid ?? null;

      let activePack = get().activePack;
      let activeItems = get().activeItems;
      if (validSelected && (!activePack || activePack.uuid !== validSelected)) {
        const loaded = await loadStaticTrainingPackByUuid(validSelected);
        activeItems = loaded.items;
        activePack = buildActivePackBundle(loaded.metadata, loaded.items);
      }

      set({
        initialized: true,
        isLoading: false,
        packs,
        selectedPackUuid: validSelected,
        activePack,
        activeItems,
        committedSessionItems: activeItems.map((it, idx) => cloneShotItem(it, idx)),
      });
    } catch (err) {
      console.error('[staticTrainingPackStore] Failed to init packs:', err);
      set({ isLoading: false, initialized: true });
    }
  },

  selectPack: async (uuid: string) => {
    const loaded = await loadStaticTrainingPackByUuid(uuid);
    const bundle = buildActivePackBundle(loaded.metadata, loaded.items);
    activeEditItemVariable = null;
    set({
      selectedPackUuid: uuid,
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

  beginEditSession: async (uuid: string) => {
    const loaded = await loadStaticTrainingPackByUuid(uuid);
    if (!loaded.metadata) return;
    await saveEditWorkspacePackFull(loaded.metadata, loaded.items);
    const bundle = buildActivePackBundle(loaded.metadata, loaded.items);
    activeEditItemVariable = null;
    set({
      selectedPackUuid: uuid,
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
    const { activePack, activeItems, currentShotIndex, isEditingItem } = get();
    const draft = activeEditItemVariable || get().activeEditItemDraft;
    if (!isEditingItem || !activePack || !draft) return;

    const idx = Math.max(0, Math.min(activeItems.length - 1, currentShotIndex));
    const savedShot = cloneShotItem(draft, idx);
    activeEditItemVariable = cloneShotItem(savedShot, idx);
    const nextItems = activeItems.map((it, i) => (i === idx ? savedShot : it));
    const updatedMeta: StaticTrainingPackMetadata = {
      ...activePack.metadata,
      itemCount: nextItems.length,
      updatedAt: Date.now(),
    };

    await saveSingleEditWorkspaceShotItem(activePack.uuid, idx, savedShot, updatedMeta);
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
    activeEditItemVariable = null;
    set((s) => ({
      isEditingItem: false,
      activeEditItemDraft: null,
      editVarVersion: s.editVarVersion + 1,
    }));
  },

  isCurrentShotDirty: () => {
    const { isEditingItem, activeEditItemDraft, activeItems, currentShotIndex } = get();
    const draft = activeEditItemVariable || activeEditItemDraft;
    if (!isEditingItem || !draft) return false;
    const saved = activeItems[currentShotIndex];
    if (!saved) return true;
    return !areShotItemsEqual(draft, saved);
  },

  hasUnsavedEditSessionChanges: () => {
    const { activeItems, committedSessionItems, isEditingItem, activeEditItemDraft, currentShotIndex } = get();
    const draft = activeEditItemVariable || activeEditItemDraft;
    const effectiveItems =
      isEditingItem && draft
        ? activeItems.map((it, i) => (i === currentShotIndex ? cloneShotItem(draft, i) : it))
        : activeItems;
    return !areShotListsEqual(effectiveItems, committedSessionItems);
  },

  commitEditSessionToMainDb: async () => {
    const { activePack, activeItems, isEditingItem, activeEditItemDraft, currentShotIndex } = get();
    if (!activePack) return;
    const draft = activeEditItemVariable || activeEditItemDraft;
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

    await saveStaticTrainingPackFull(updatedMeta, finalItems);
    await clearEditWorkspaceByUuid(activePack.uuid);
    const packs = await listStaticTrainingPacks();
    const bundle = buildActivePackBundle(updatedMeta, finalItems);

    activeEditItemVariable = null;
    set((state) => ({
      packs,
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
    const { activePack } = get();
    if (!activePack) return;
    await clearEditWorkspaceByUuid(activePack.uuid);
    const loaded = await loadStaticTrainingPackByUuid(activePack.uuid);
    const bundle = buildActivePackBundle(loaded.metadata, loaded.items);
    activeEditItemVariable = null;
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

  ...createStaticTrainingShotActions(set, get, {
    getActiveEditItemVariable,
    setActiveEditItemVariable,
    buildActivePackBundle,
  }),

  setEditSubMode: (subMode: EditSubMode) => {
    set({ editSubMode: subMode });
    get().runtimeHandlers.onEditSubModeChanged?.(subMode);
  },

  cycleEditSubMode: (delta: 1 | -1) => {
    const currentSubMode = get().editSubMode;
    const currentItem =
      activeEditItemVariable ||
      get().activeEditItemDraft ||
      get().activePack?.items?.[get().currentShotIndex] ||
      get().activeItems?.[get().currentShotIndex];
    const alignsSpeedWithNose = currentItem?.car?.speedFollowsHeading !== false;
    const order: EditSubMode[] = alignsSpeedWithNose
      ? ['car-heading', 'ball-speed', 'free-cam']
      : EDIT_SUB_MODES_ORDER;
    const currentIndex = order.indexOf(currentSubMode);
    const baseIdx = currentIndex >= 0 ? currentIndex : 0;
    const nextIdx = ((baseIdx + delta) % order.length + order.length) % order.length;
    const nextMode = order[nextIdx];
    set({ editSubMode: nextMode });
    get().runtimeHandlers.onEditSubModeChanged?.(nextMode);
    return nextMode;
  },

  setDownCounterEnabled: (enabled: boolean) => {
    set({ downCounterEnabled: Boolean(enabled) });
    if (get().sessionMode === 'play') {
      get().resetCurrentShot();
    }
  },

  setDownCounterValue: (val: StaticPackDownCounterOption) => {
    const clamped = (val === 1 || val === 2 || val === 3 ? val : 1) as StaticPackDownCounterOption;
    set({ downCounterValue: clamped });
    if (get().sessionMode === 'play' && get().downCounterEnabled) {
      get().resetCurrentShot();
    }
  },

  setFreeCamTrajectoryTesting: (active: boolean) => {
    set({ isFreeCamTrajectoryTesting: Boolean(active) });
  },

  setTestingSingleShot: (active: boolean) => {
    set({ isTestingSingleShot: Boolean(active) });
  },

  updateLiveTelemetry: (patch) => {
    set((state) => ({ ...state, ...patch }));
  },

  setRuntimeHandlers: (handlers) => {
    set((s) => ({
      runtimeHandlers: createGuardedRuntimeHandlers<StaticTrainingPackRuntimeHandlers>(
        'staticTrainingPackStore',
        { ...s.runtimeHandlers, ...handlers }
      ),
    }));
  },
}));
