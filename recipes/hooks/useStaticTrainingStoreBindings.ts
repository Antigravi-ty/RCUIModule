import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import {
  useStaticTrainingPackStore,
  getActiveEditItemVariable,
  mutateActiveEditItemVariable,
} from '../../stores/staticTrainingPackStore';
import type { StaticTrainingShotItem } from '../static-training/staticTrainingTypes';
import {
  DEFAULT_QUICK_VARIATION_TOGGLES,
  KEVPERT_LATEST_PRESETS,
} from '../../config/staticTrainingVariationTypes';

export function useLayer4StaticTrainingPackBrowseStoreBinding<
  TProps extends object
>(rawProps: TProps): TProps {
  const props = rawProps as Record<string, any>;
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
  const exportBatchPacksZip = useStaticTrainingPackStore(
    (s) => s.exportBatchPacksZip
  );
  const importPackRCS = useStaticTrainingPackStore((s) => s.importPackRCS);
  const importBatchPacks = useStaticTrainingPackStore(
    (s) => s.importBatchPacks
  );
  const seedDevBuiltInPacks = useStaticTrainingPackStore(
    (s) => s.seedDevBuiltInPacks
  );
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
  const variationToggles = useStaticTrainingPackStore(
    (s) => s.variationToggles
  );
  const customVariation = useStaticTrainingPackStore((s) => s.customVariation);
  const setVariationToggles = useStaticTrainingPackStore(
    (s) => s.setVariationToggles
  );
  const setCustomVariation = useStaticTrainingPackStore(
    (s) => s.setCustomVariation
  );
  const applyKevpertVariationPreset = useStaticTrainingPackStore(
    (s) => s.applyKevpertVariationPreset
  );

  useEffect(() => {
    if (!initialized) {
      void initStore();
    }
  }, [initialized, initStore]);

  useEffect(() => {
    if (props.isDevMode && initialized) {
      void seedDevBuiltInPacks(false);
    }
  }, [props.isDevMode, initialized, seedDevBuiltInPacks]);

  return {
    ...rawProps,
    packs: props.packs ?? (packs.length > 0 ? packs : undefined),
    selectedPackUuid: props.selectedPackUuid ?? selectedPackUuid,
    onSelectPack:
      props.onSelectPack ??
      ((uuid: string) => {
        void selectPack(uuid);
      }),
    downCounterEnabled: props.downCounterEnabled ?? downCounterEnabled,
    onDownCounterEnabledChange:
      props.onDownCounterEnabledChange ?? setDownCounterEnabled,
    downCounterValue: props.downCounterValue ?? downCounterValue,
    onDownCounterValueChange:
      props.onDownCounterValueChange ?? setDownCounterValue,
    variationToggles:
      props.variationToggles ??
      variationToggles ??
      DEFAULT_QUICK_VARIATION_TOGGLES,
    onUpdateVariationToggles:
      props.onUpdateVariationToggles ?? setVariationToggles,
    customVariation:
      props.customVariation ?? customVariation ?? KEVPERT_LATEST_PRESETS.F7,
    onUpdateCustomVariation:
      props.onUpdateCustomVariation ?? setCustomVariation,
    onSelectKevpertPreset:
      props.onSelectKevpertPreset ?? applyKevpertVariationPreset,
    onCreatePack:
      props.onCreatePack ??
      (async (title: string, desc: string) => {
        await createPack(title, desc);
      }),
    onSavePackMetadata:
      props.onSavePackMetadata ??
      (async (uuid: string, title: string, desc: string) => {
        await updatePackInfo(uuid, title, desc);
      }),
    onDeletePack:
      props.onDeletePack ??
      (async (uuid: string) => {
        await deletePack(uuid);
      }),
    onExportPack:
      props.onExportPack ??
      (async (pack: { uuid: string }, editable?: boolean) => {
        await exportPackRCS(pack.uuid, { editable: Boolean(editable) });
      }),
    onExportBatchPacksZip:
      props.onExportBatchPacksZip ??
      (async (uuids: string[], bundleName: string, editable: boolean) => {
        return await exportBatchPacksZip(uuids, bundleName, { editable });
      }),
    onImportPackFile:
      props.onImportPackFile ??
      (async (file: File) => {
        await importPackRCS(file);
      }),
    onImportBatchPackFiles:
      props.onImportBatchPackFiles ??
      (async (files: File[] | FileList) => {
        const imported = await importBatchPacks(files);
        return imported.length;
      }),
    onBack: props.onBack ?? goBack,
  } as TProps;
}

export function useLayer5StaticTrainingPackEditStoreBinding<
  TProps extends object
>(rawProps: TProps): TProps {
  const props = rawProps as Record<string, any>;
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

  const isInspecting = props.isInspectingShot ?? storeIsEditingItem;
  const currentShotOverride =
    props.currentShotOverride !== undefined
      ? props.currentShotOverride
      : isInspecting && !props.shots
      ? getActiveEditItemVariable()
      : null;

  const handleMutateCurrentShot = (
    updater: (draft: StaticTrainingShotItem) => void
  ) => {
    if (props.onMutateCurrentShot) {
      props.onMutateCurrentShot(updater);
      return;
    }
    if (props.onShotsChange && props.shots) {
      const items = props.shots as StaticTrainingShotItem[];
      const selectedIndex = props.selectedShotIndex ?? storeShotIndex;
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
      props.onShotsChange(
        items.map((it, idx) => (idx === safeIndex ? cloned : it))
      );
      return;
    }
    mutateActiveEditItemVariable(updater);
  };

  return {
    ...rawProps,
    packTitle: props.packTitle ?? activePack?.metadata.title ?? 'PACK',
    shots:
      props.shots ??
      (activePack?.items && activePack.items.length > 0
        ? activePack.items
        : undefined),
    currentShotOverride,
    selectedShotIndex: props.selectedShotIndex ?? storeShotIndex,
    onSelectedShotIndexChange: (idx: number) => {
      props.onSelectedShotIndexChange?.(idx);
      if (!props.shots && activePack) {
        enterItemEditMode(idx);
      }
    },
    isInspectingShot: isInspecting,
    onInspectingShotChange: (inspecting: boolean) => {
      props.onInspectingShotChange?.(inspecting);
      if (!inspecting && !props.shots && activePack) {
        void deselectEditShot();
      }
    },
    editSubMode: props.editSubMode ?? storeEditSubMode,
    onEditSubModeChange: props.onEditSubModeChange ?? setStoreEditSubMode,
    isDirty: props.isDirty ?? (activePack ? isCurrentShotDirty() : undefined),
    onMutateCurrentShot: activePack ? handleMutateCurrentShot : props.onMutateCurrentShot,
    onSaveCurrentShot:
      props.onSaveCurrentShot ??
      (activePack ? saveCurrentShotToEditWorkspace : undefined),
    onAddNewShot: props.onAddNewShot ?? (activePack ? addNewShot : undefined),
    onDuplicateShot:
      props.onDuplicateShot ?? (activePack ? duplicateShot : undefined),
    onReorderShot:
      props.onReorderShot ?? (activePack ? reorderShot : undefined),
    onDeleteShot: props.onDeleteShot ?? (activePack ? deleteShot : undefined),
    onExportSingleShot:
      props.onExportSingleShot ?? (activePack ? exportSingleShotJson : undefined),
    onImportSingleShot:
      props.onImportSingleShot ?? (activePack ? importSingleShotJson : undefined),
  } as TProps;
}
