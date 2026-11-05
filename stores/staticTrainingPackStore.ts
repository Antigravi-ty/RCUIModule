import { create } from 'zustand';
import {
  type StaticTrainingPackMetadata,
  type StaticTrainingShotItem,
  type EditSubMode,
  type ActiveStaticTrainingPackBundle,
  MAX_SHOTS_PER_PACK,
  generateUUID,
  createDefaultShotItem,
  areShotItemsEqual,
  areShotListsEqual,
  buildActivePackBundle,
  listStaticTrainingPacks,
  loadStaticTrainingPackByUuid,
  saveStaticTrainingPackFull,
  deleteStaticTrainingPackByUuid,
  exportStaticTrainingPackRCSPack,
  importStaticTrainingPackFromFile,
} from './staticTrainingPackStorage';
import {
  type StaticPackSessionMode,
  type StaticTrainingPackRuntimeHandlers,
  type StaticTrainingShotWorkspaceStoreState,
  useStaticTrainingShotWorkspaceStore,
  getActiveEditItemVariable,
  setActiveEditItemVariable,
  mutateActiveEditItemVariable,
} from './staticTrainingShotWorkspaceStore';

export {
  type StaticTrainingPackMetadata,
  type StaticTrainingShotItem,
  type EditSubMode,
  type ActiveStaticTrainingPackBundle,
  type StaticPackSessionMode,
  type StaticTrainingPackRuntimeHandlers,
  MAX_SHOTS_PER_PACK,
  areShotItemsEqual,
  areShotListsEqual,
  buildActivePackBundle,
  useStaticTrainingShotWorkspaceStore,
  getActiveEditItemVariable,
  setActiveEditItemVariable,
  mutateActiveEditItemVariable,
};

export type StaticPackDownCounterOption = 1 | 2 | 3;

export interface StaticTrainingPackStoreState extends StaticTrainingShotWorkspaceStoreState {
  initialized: boolean;
  isLoading: boolean;
  packs: StaticTrainingPackMetadata[];
  selectedPackUuid: string | null;
  downCounterEnabled: boolean;
  downCounterValue: StaticPackDownCounterOption;

  initStore: () => Promise<void>;
  selectPack: (uuid: string) => Promise<void>;
  createPack: (title: string, description: string) => Promise<StaticTrainingPackMetadata>;
  updatePackInfo: (uuid: string, title: string, description: string) => Promise<void>;
  deletePack: (uuid: string) => Promise<void>;
  exportPackRCS: (uuid?: string) => Promise<string | null>;
  importPackRCS: (file: File) => Promise<StaticTrainingPackMetadata>;
  setDownCounterEnabled: (enabled: boolean) => void;
  setDownCounterValue: (val: StaticPackDownCounterOption) => void;
}

const ws = () => useStaticTrainingShotWorkspaceStore.getState();

export const useStaticTrainingPackStore = create<StaticTrainingPackStoreState>((set, get) => ({
  ...ws(),
  initialized: false,
  isLoading: false,
  packs: [],
  selectedPackUuid: null,
  downCounterEnabled: false,
  downCounterValue: 1,

  initStore: async () => {
    set({ isLoading: true });
    try {
      const packs = await listStaticTrainingPacks();
      const currentSelected = get().selectedPackUuid;
      const validSelected =
        currentSelected && packs.some((p) => p.uuid === currentSelected)
          ? currentSelected
          : packs[0]?.uuid ?? null;

      const activePack = ws().activePack;
      if (validSelected && (!activePack || activePack.uuid !== validSelected)) {
        const loaded = await loadStaticTrainingPackByUuid(validSelected);
        ws().loadPackIntoWorkspace(loaded.metadata, loaded.items);
      }

      set({
        initialized: true,
        isLoading: false,
        packs,
        selectedPackUuid: validSelected,
      });
    } catch (err) {
      console.error('[staticTrainingPackStore] Failed to init packs:', err);
      set({ isLoading: false, initialized: true });
    }
  },

  selectPack: async (uuid: string) => {
    const loaded = await loadStaticTrainingPackByUuid(uuid);
    ws().loadPackIntoWorkspace(loaded.metadata, loaded.items);
    set({ selectedPackUuid: uuid });
  },

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
    ws().loadPackIntoWorkspace(meta, [initialShot]);
    set({ packs, selectedPackUuid: uuid });
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
    if (ws().activePack?.uuid === uuid) {
      useStaticTrainingShotWorkspaceStore.setState((s) => ({
        activePack: buildActivePackBundle(updatedMeta, s.activeItems),
      }));
    }
    set({ packs });
  },

  deletePack: async (uuid: string) => {
    if (ws().isEditingItem && ws().activePack?.uuid === uuid) {
      setActiveEditItemVariable(null);
      useStaticTrainingShotWorkspaceStore.setState({
        isEditingItem: false,
        activeEditItemDraft: null,
      });
    }
    await deleteStaticTrainingPackByUuid(uuid);
    const packs = await listStaticTrainingPacks();
    const nextUuid = packs[0]?.uuid ?? null;
    if (nextUuid) {
      const loaded = await loadStaticTrainingPackByUuid(nextUuid);
      ws().loadPackIntoWorkspace(loaded.metadata, loaded.items);
    } else {
      ws().loadPackIntoWorkspace(null, []);
    }
    set({ packs, selectedPackUuid: nextUuid });
  },

  exportPackRCS: async (uuid?: string) => {
    const targetUuid = uuid || ws().activePack?.uuid || get().selectedPackUuid;
    if (!targetUuid) return null;
    const loaded = await loadStaticTrainingPackByUuid(targetUuid);
    if (!loaded.metadata) return null;
    return await exportStaticTrainingPackRCSPack(loaded.metadata, loaded.items);
  },

  importPackRCS: async (file: File) => {
    const { metadata, items } = await importStaticTrainingPackFromFile(file);
    const packs = await listStaticTrainingPacks();
    ws().loadPackIntoWorkspace(metadata, items);
    set({ packs, selectedPackUuid: metadata.uuid });
    return metadata;
  },

  beginEditSession: async (uuid: string) => {
    await ws().beginEditSession(uuid);
    set({ selectedPackUuid: uuid });
  },

  commitEditSessionToMainDb: async () => {
    const packs = await ws().commitEditSessionToMainDb();
    if (packs.length > 0) set({ packs });
    return packs;
  },

  setDownCounterEnabled: (enabled: boolean) => {
    set({ downCounterEnabled: Boolean(enabled) });
    if (ws().sessionMode === 'play') ws().resetCurrentShot();
  },

  setDownCounterValue: (val: StaticPackDownCounterOption) => {
    const clamped = (val === 1 || val === 2 || val === 3 ? val : 1) as StaticPackDownCounterOption;
    set({ downCounterValue: clamped });
    if (ws().sessionMode === 'play' && get().downCounterEnabled) ws().resetCurrentShot();
  },
}));

useStaticTrainingShotWorkspaceStore.subscribe((workspaceState) => {
  useStaticTrainingPackStore.setState({
    sessionMode: workspaceState.sessionMode,
    activePack: workspaceState.activePack,
    activeItems: workspaceState.activeItems,
    committedSessionItems: workspaceState.committedSessionItems,
    currentShotIndex: workspaceState.currentShotIndex,
    isEditingItem: workspaceState.isEditingItem,
    isEdgeInspectorExpanded: workspaceState.isEdgeInspectorExpanded,
    activeEditItemDraft: workspaceState.activeEditItemDraft,
    editSubMode: workspaceState.editSubMode,
    editVarVersion: workspaceState.editVarVersion,
    remainingTimeoutSec: workspaceState.remainingTimeoutSec,
    activeCountdownSec: workspaceState.activeCountdownSec,
    isShotLaunched: workspaceState.isShotLaunched,
    isOvertimeWaitGround: workspaceState.isOvertimeWaitGround,
    isReplayActive: workspaceState.isReplayActive,
    replayType: workspaceState.replayType,
    isFreeCamTrajectoryTesting: workspaceState.isFreeCamTrajectoryTesting,
    isTestingSingleShot: workspaceState.isTestingSingleShot,
    runtimeHandlers: workspaceState.runtimeHandlers,
  });
});
