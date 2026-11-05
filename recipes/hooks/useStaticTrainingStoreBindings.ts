import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import {
  useStaticTrainingPackStore,
  getActiveEditItemVariable,
  mutateActiveEditItemVariable,
} from '../../stores/staticTrainingPackStore';
import type {
  StaticTrainingShotItem,
  EditSubMode,
} from '../static-training/staticTrainingTypes';
import type {
  StaticPackDownCounterOption,
  StaticTrainingPackSummary,
} from '../static-training/StaticTrainingPackFolderList';

import type {
  StaticTrainingVariationConfig,
  StaticTrainingQuickVariationToggles,
  KevpertPresetKey,
} from '../../config/staticTrainingVariationTypes';
import { DEFAULT_QUICK_VARIATION_TOGGLES, KEVPERT_LATEST_PRESETS } from '../../config/staticTrainingVariationTypes';

export interface Layer4StaticTrainingPackBrowseRecipeProps {
  isLight?: boolean;
  isDevMode?: boolean;
  packs?: StaticTrainingPackSummary[];
  selectedPackUuid?: string | null;
  onSelectPack?: (uuid: string) => void;
  defaultSelectedId?: string;
  defaultUseDownCounter?: boolean;
  downCounterEnabled?: boolean;
  onDownCounterEnabledChange?: (enabled: boolean) => void;
  downCounterValue?: StaticPackDownCounterOption;
  onDownCounterValueChange?: (val: StaticPackDownCounterOption) => void;
  variationToggles?: StaticTrainingQuickVariationToggles;
  onUpdateVariationToggles?: (patch: Partial<StaticTrainingQuickVariationToggles>) => void;
  customVariation?: StaticTrainingVariationConfig;
  onUpdateCustomVariation?: (patch: Partial<StaticTrainingVariationConfig>) => void;
  onSelectKevpertPreset?: (key: KevpertPresetKey) => void;
  onCreatePack?: (title: string, description: string) => Promise<void> | void;
  onSavePackMetadata?: (uuid: string, title: string, description: string) => Promise<void> | void;
  onDeletePack?: (uuid: string) => Promise<void> | void;
  onImportPackFile?: (file: File) => Promise<void> | void;
  onImportBatchPackFiles?: (files: File[] | FileList) => Promise<number> | void;
  onExportBatchPacksZip?: (
    uuids: string[],
    bundleName: string,
    editable: boolean
  ) => Promise<string | null> | void;
  onBack?: () => void;
  onStartPlaySession?: (uuid: string) => void;
  onStartEditSession?: (uuid: string) => void;
  onPlayPack?: (pack: StaticTrainingPackSummary, useDownCounter: boolean) => void;
  onEditPack?: (pack: StaticTrainingPackSummary) => void;
  onImportPack?: () => void;
  onExportPack?: (pack: StaticTrainingPackSummary, editable?: boolean) => Promise<void> | void;
  className?: string;
}

export interface StaticTrainingShotInspectorDrawerProps {
  isLight?: boolean;
  transparent?: boolean;
  packTitle?: string;
  /** Controlled or uncontrolled shots list */
  shots?: StaticTrainingShotItem[];
  onShotsChange?: (shots: StaticTrainingShotItem[]) => void;
  /** Optional active shot override (e.g. from fast in-memory edit variable) */
  currentShotOverride?: StaticTrainingShotItem | null;
  /** Controlled or uncontrolled selected shot index */
  selectedShotIndex?: number;
  onSelectedShotIndexChange?: (idx: number) => void;
  /** Controlled or uncontrolled item inspection state (false = full list, true = compressed rail + detail inspector) */
  isInspectingShot?: boolean;
  onInspectingShotChange?: (inspecting: boolean) => void;
  /** Controlled or uncontrolled 3D edit sub-mode */
  editSubMode?: EditSubMode;
  onEditSubModeChange?: (mode: EditSubMode) => void;
  /** Controlled or uncontrolled dirty flag for current shot */
  isDirty?: boolean;
  onMutateCurrentShot?: (updater: (draft: StaticTrainingShotItem) => void) => void;
  onSaveCurrentShot?: () => void | Promise<void>;
  onAddNewShot?: () => void | Promise<void>;
  onDuplicateShot?: (idx: number) => void | Promise<void>;
  onReorderShot?: (fromIdx: number, toIdx: number) => void | Promise<void>;
  onDeleteShot?: (idx: number) => void | Promise<void>;
  onExportSingleShot?: (idx: number) => void;
  onImportSingleShot?: (file: File) => void | Promise<void>;
  /** Callback when user clicks Collapse [TAB] in header */
  onCollapseDrawer?: () => void;
  /** Callback when user confirms Exit in the double-check dialogue */
  onExitSession?: (action: 'save' | 'ignore') => void | Promise<void>;
}

export function useLayer4StaticTrainingPackBrowseStoreBinding(
  rawProps: Layer4StaticTrainingPackBrowseRecipeProps
): Layer4StaticTrainingPackBrowseRecipeProps {
  const goBack = useAppStore((s) => s.goBack);
  const packs = useStaticTrainingPackStore((s) => s.packs);
  const selectedPackUuid = useStaticTrainingPackStore(
    (s) => s.selectedPackUuid
  );
  const initialized = useStaticTrainingPackStore((s) => s.initialized);
  const initStore = useStaticTrainingPackStore((s) => s.initStore);
  const selectPack = useStaticTrainingPackStore((s) => s.selectPack);
  const createPack = useStaticTrainingPackStore((s) => s.createPack);
  const updatePackInfo = useStaticTrainingPackStore((s) => s.updatePackInfo);
  const deletePack = useStaticTrainingPackStore((s) => s.deletePack);
  const exportPackRCS = useStaticTrainingPackStore((s) => s.exportPackRCS);
  const exportBatchPacksZip = useStaticTrainingPackStore((s) => s.exportBatchPacksZip);
  const importPackRCS = useStaticTrainingPackStore((s) => s.importPackRCS);
  const importBatchPacks = useStaticTrainingPackStore((s) => s.importBatchPacks);
  const seedDevBuiltInPacks = useStaticTrainingPackStore((s) => s.seedDevBuiltInPacks);
  const downCounterEnabled = useStaticTrainingPackStore(
    (s) => s.downCounterEnabled
  );
  const downCounterValue = useStaticTrainingPackStore(
    (s) => s.downCounterValue
  );
  const setDownCounterEnabled = useStaticTrainingPackStore(
    (s) => s.setDownCounterEnabled
  );
  const setDownCounterValue = useStaticTrainingPackStore(
    (s) => s.setDownCounterValue
  );
  const variationToggles = useStaticTrainingPackStore((s) => s.variationToggles);
  const customVariation = useStaticTrainingPackStore((s) => s.customVariation);
  const setVariationToggles = useStaticTrainingPackStore((s) => s.setVariationToggles);
  const setCustomVariation = useStaticTrainingPackStore((s) => s.setCustomVariation);
  const applyKevpertVariationPreset = useStaticTrainingPackStore(
    (s) => s.applyKevpertVariationPreset
  );

  useEffect(() => {
    if (!initialized) {
      void initStore();
    }
  }, [initialized, initStore]);

  useEffect(() => {
    if (rawProps.isDevMode && initialized) {
      void seedDevBuiltInPacks(false);
    }
  }, [rawProps.isDevMode, initialized, seedDevBuiltInPacks]);

  return {
    ...rawProps,
    packs: rawProps.packs ?? (packs.length > 0 ? packs : undefined),
    selectedPackUuid: rawProps.selectedPackUuid ?? selectedPackUuid,
    onSelectPack:
      rawProps.onSelectPack ??
      ((uuid: string) => {
        void selectPack(uuid);
      }),
    downCounterEnabled: rawProps.downCounterEnabled ?? downCounterEnabled,
    onDownCounterEnabledChange:
      rawProps.onDownCounterEnabledChange ?? setDownCounterEnabled,
    downCounterValue: rawProps.downCounterValue ?? downCounterValue,
    onDownCounterValueChange:
      rawProps.onDownCounterValueChange ?? setDownCounterValue,
    variationToggles: rawProps.variationToggles ?? variationToggles ?? DEFAULT_QUICK_VARIATION_TOGGLES,
    onUpdateVariationToggles: rawProps.onUpdateVariationToggles ?? setVariationToggles,
    customVariation: rawProps.customVariation ?? customVariation ?? KEVPERT_LATEST_PRESETS.F7,
    onUpdateCustomVariation: rawProps.onUpdateCustomVariation ?? setCustomVariation,
    onSelectKevpertPreset: rawProps.onSelectKevpertPreset ?? applyKevpertVariationPreset,
    onCreatePack:
      rawProps.onCreatePack ??
      (async (title: string, desc: string) => {
        await createPack(title, desc);
      }),
    onSavePackMetadata:
      rawProps.onSavePackMetadata ??
      (async (uuid: string, title: string, desc: string) => {
        await updatePackInfo(uuid, title, desc);
      }),
    onDeletePack:
      rawProps.onDeletePack ??
      (async (uuid: string) => {
        await deletePack(uuid);
      }),
    onExportPack:
      rawProps.onExportPack ??
      (async (pack: { uuid: string }, editable?: boolean) => {
        await exportPackRCS(pack.uuid, { editable: Boolean(editable) });
      }),
    onExportBatchPacksZip:
      rawProps.onExportBatchPacksZip ??
      (async (uuids: string[], bundleName: string, editable: boolean) => {
        return await exportBatchPacksZip(uuids, bundleName, { editable });
      }),
    onImportPackFile:
      rawProps.onImportPackFile ??
      (async (file: File) => {
        await importPackRCS(file);
      }),
    onImportBatchPackFiles:
      rawProps.onImportBatchPackFiles ??
      (async (files: File[] | FileList) => {
        const imported = await importBatchPacks(files);
        return imported.length;
      }),
    onBack: rawProps.onBack ?? goBack,
  };
}

export function useStaticTrainingShotInspectorDrawerStoreBinding(
  rawProps: StaticTrainingShotInspectorDrawerProps
): StaticTrainingShotInspectorDrawerProps {
  const activePack = useStaticTrainingPackStore((s) => s.activePack);
  const storeShotIndex = useStaticTrainingPackStore((s) => s.currentShotIndex);
  const storeIsEditingItem = useStaticTrainingPackStore((s) => s.isEditingItem);
  const storeEditSubMode = useStaticTrainingPackStore((s) => s.editSubMode);
  const editVarVersion = useStaticTrainingPackStore((s) => s.editVarVersion);

  const enterItemEditMode = useStaticTrainingPackStore(
    (s) => s.enterItemEditMode
  );
  const deselectEditShot = useStaticTrainingPackStore(
    (s) => s.deselectEditShot
  );
  const setStoreEditSubMode = useStaticTrainingPackStore(
    (s) => s.setEditSubMode
  );
  const addNewShot = useStaticTrainingPackStore((s) => s.addNewShot);
  const duplicateShot = useStaticTrainingPackStore((s) => s.duplicateShot);
  const deleteShot = useStaticTrainingPackStore((s) => s.deleteShot);
  const reorderShot = useStaticTrainingPackStore((s) => s.reorderShot);
  const exportSingleShotJson = useStaticTrainingPackStore(
    (s) => s.exportSingleShotJson
  );
  const importSingleShotJson = useStaticTrainingPackStore(
    (s) => s.importSingleShotJson
  );
  const isCurrentShotDirty = useStaticTrainingPackStore(
    (s) => s.isCurrentShotDirty
  );
  const saveCurrentShotToEditWorkspace = useStaticTrainingPackStore(
    (s) => s.saveCurrentShotToEditWorkspace
  );

  void editVarVersion;

  const isInspecting = rawProps.isInspectingShot ?? storeIsEditingItem;
  const currentShotOverride =
    rawProps.currentShotOverride !== undefined
      ? rawProps.currentShotOverride
      : isInspecting && !rawProps.shots
      ? getActiveEditItemVariable()
      : null;

  const handleMutateCurrentShot = (
    updater: (draft: StaticTrainingShotItem) => void
  ) => {
    if (rawProps.onMutateCurrentShot) {
      rawProps.onMutateCurrentShot(updater);
      return;
    }
    if (rawProps.onShotsChange && rawProps.shots) {
      const items = rawProps.shots;
      const selectedIndex = rawProps.selectedShotIndex ?? storeShotIndex;
      const safeIndex = Math.max(
        0,
        Math.min(Math.max(0, items.length - 1), selectedIndex)
      );
      const currentShot = items[safeIndex] || items[0] || null;
      if (!currentShot) return;
      const cloned: StaticTrainingShotItem = {
        ...currentShot,
        car: {
          ...currentShot.car,
          location: [...currentShot.car.location] as [number, number, number],
        },
        ball: {
          ...currentShot.ball,
          location: [...currentShot.ball.location] as [number, number, number],
          angularVelocity: [
            ...currentShot.ball.angularVelocity,
          ] as [number, number, number],
        },
      };
      updater(cloned);
      rawProps.onShotsChange(
        items.map((it, idx) => (idx === safeIndex ? cloned : it))
      );
      return;
    }
    mutateActiveEditItemVariable(updater);
  };

  return {
    ...rawProps,
    packTitle: rawProps.packTitle ?? activePack?.metadata.title ?? 'PACK',
    shots:
      rawProps.shots ??
      (activePack?.items && activePack.items.length > 0
        ? activePack.items
        : undefined),
    currentShotOverride,
    selectedShotIndex: rawProps.selectedShotIndex ?? storeShotIndex,
    onSelectedShotIndexChange: (idx: number) => {
      rawProps.onSelectedShotIndexChange?.(idx);
      if (!rawProps.shots && activePack) {
        enterItemEditMode(idx);
      }
    },
    isInspectingShot: isInspecting,
    onInspectingShotChange: (inspecting: boolean) => {
      rawProps.onInspectingShotChange?.(inspecting);
      if (!inspecting && !rawProps.shots && activePack) {
        void deselectEditShot();
      }
    },
    editSubMode: rawProps.editSubMode ?? storeEditSubMode,
    onEditSubModeChange: rawProps.onEditSubModeChange ?? setStoreEditSubMode,
    isDirty: rawProps.isDirty ?? (activePack ? isCurrentShotDirty() : undefined),
    onMutateCurrentShot: activePack ? handleMutateCurrentShot : rawProps.onMutateCurrentShot,
    onSaveCurrentShot:
      rawProps.onSaveCurrentShot ??
      (activePack ? saveCurrentShotToEditWorkspace : undefined),
    onAddNewShot: rawProps.onAddNewShot ?? (activePack ? addNewShot : undefined),
    onDuplicateShot:
      rawProps.onDuplicateShot ?? (activePack ? duplicateShot : undefined),
    onReorderShot:
      rawProps.onReorderShot ?? (activePack ? reorderShot : undefined),
    onDeleteShot: rawProps.onDeleteShot ?? (activePack ? deleteShot : undefined),
    onExportSingleShot:
      rawProps.onExportSingleShot ?? (activePack ? exportSingleShotJson : undefined),
    onImportSingleShot:
      rawProps.onImportSingleShot ?? (activePack ? importSingleShotJson : undefined),
  };
}
