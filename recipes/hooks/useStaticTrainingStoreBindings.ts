import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import {
  useStaticTrainingPackStore,
  getActiveEditItemVariable,
  mutateActiveEditItemVariable,
} from '../../stores/staticTrainingPackStore';
import type { Layer4StaticTrainingPackBrowseRecipeProps } from '../Layer4StaticTrainingPackBrowseRecipe';
import type { Layer5StaticTrainingPackEditRecipeProps } from '../Layer5StaticTrainingPackEditRecipe';
import type { StaticTrainingShotItem } from '../static-training/staticTrainingTypes';

export function useLayer4StaticTrainingPackBrowseStoreBinding(
  props: Layer4StaticTrainingPackBrowseRecipeProps
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
  const importPackRCS = useStaticTrainingPackStore((s) => s.importPackRCS);
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

  useEffect(() => {
    if (!initialized) {
      void initStore();
    }
  }, [initialized, initStore]);

  return {
    ...props,
    packs: props.packs ?? (packs.length > 0 ? packs : undefined),
    selectedPackUuid: props.selectedPackUuid ?? selectedPackUuid,
    onSelectPack:
      props.onSelectPack ??
      ((uuid) => {
        void selectPack(uuid);
      }),
    downCounterEnabled: props.downCounterEnabled ?? downCounterEnabled,
    onDownCounterEnabledChange:
      props.onDownCounterEnabledChange ?? setDownCounterEnabled,
    downCounterValue: props.downCounterValue ?? downCounterValue,
    onDownCounterValueChange:
      props.onDownCounterValueChange ?? setDownCounterValue,
    onCreatePack:
      props.onCreatePack ??
      (async (title, desc) => {
        await createPack(title, desc);
      }),
    onSavePackMetadata:
      props.onSavePackMetadata ??
      (async (uuid, title, desc) => {
        await updatePackInfo(uuid, title, desc);
      }),
    onDeletePack:
      props.onDeletePack ??
      (async (uuid) => {
        await deletePack(uuid);
      }),
    onExportPack:
      props.onExportPack ??
      (async (pack) => {
        await exportPackRCS(pack.uuid);
      }),
    onImportPackFile:
      props.onImportPackFile ??
      (async (file) => {
        await importPackRCS(file);
      }),
    onBack: props.onBack ?? goBack,
  };
}

export function useLayer5StaticTrainingPackEditStoreBinding(
  props: Layer5StaticTrainingPackEditRecipeProps
): Layer5StaticTrainingPackEditRecipeProps {
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
      const items = props.shots;
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
    ...props,
    packTitle: props.packTitle ?? activePack?.metadata.title ?? 'PACK',
    shots:
      props.shots ??
      (activePack?.items && activePack.items.length > 0
        ? activePack.items
        : undefined),
    currentShotOverride,
    selectedShotIndex: props.selectedShotIndex ?? storeShotIndex,
    onSelectedShotIndexChange: (idx) => {
      props.onSelectedShotIndexChange?.(idx);
      if (!props.shots && activePack) {
        enterItemEditMode(idx);
      }
    },
    isInspectingShot: isInspecting,
    onInspectingShotChange: (inspecting) => {
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
  };
}
