import React from 'react';
import {
  Layer5StaticTrainingPackEditRecipe,
  openStaticTrainingExitConfirmDialogue as openPureStaticTrainingExitConfirmDialogue,
  type Layer5StaticTrainingPackEditRecipeProps,
} from './Layer5StaticTrainingPackEditRecipe';
import {
  formatShotSubtitle,
  type StaticTrainingShotItem,
} from './static-training/staticTrainingTypes';
import {
  useStaticTrainingPackStore,
  getActiveEditItemVariable,
  mutateActiveEditItemVariable,
} from '../stores/staticTrainingPackStore';

export { formatShotSubtitle };

export function openStaticTrainingExitConfirmDialogue(
  onExitConfirmed?: (action: 'save' | 'ignore') => void | Promise<void>
): void {
  openPureStaticTrainingExitConfirmDialogue(async (action) => {
    if (action === 'save') {
      await useStaticTrainingPackStore.getState().commitEditSessionToMainDb();
    } else {
      await useStaticTrainingPackStore.getState().discardEditSessionChanges();
    }
    await onExitConfirmed?.(action);
  });
}

export const promptExitStaticTrainingEditSession = openStaticTrainingExitConfirmDialogue;

export type StaticTrainingPackEditRecipeProps = Layer5StaticTrainingPackEditRecipeProps;

export const StaticTrainingPackEditRecipe: React.FC<StaticTrainingPackEditRecipeProps> = (
  props
) => {
  const activePack = useStaticTrainingPackStore((s) => s.activePack);
  const storeShotIndex = useStaticTrainingPackStore((s) => s.currentShotIndex);
  const storeIsEditingItem = useStaticTrainingPackStore((s) => s.isEditingItem);
  const storeEditSubMode = useStaticTrainingPackStore((s) => s.editSubMode);
  const editVarVersion = useStaticTrainingPackStore((s) => s.editVarVersion);

  const enterItemEditMode = useStaticTrainingPackStore((s) => s.enterItemEditMode);
  const deselectEditShot = useStaticTrainingPackStore((s) => s.deselectEditShot);
  const setStoreEditSubMode = useStaticTrainingPackStore((s) => s.setEditSubMode);
  const addNewShot = useStaticTrainingPackStore((s) => s.addNewShot);
  const duplicateShot = useStaticTrainingPackStore((s) => s.duplicateShot);
  const deleteShot = useStaticTrainingPackStore((s) => s.deleteShot);
  const reorderShot = useStaticTrainingPackStore((s) => s.reorderShot);
  const exportSingleShotJson = useStaticTrainingPackStore((s) => s.exportSingleShotJson);
  const importSingleShotJson = useStaticTrainingPackStore((s) => s.importSingleShotJson);
  const isCurrentShotDirty = useStaticTrainingPackStore((s) => s.isCurrentShotDirty);
  const saveCurrentShotToEditWorkspace = useStaticTrainingPackStore(
    (s) => s.saveCurrentShotToEditWorkspace
  );

  // Subscribe to editVarVersion so fast in-memory variable mutations re-render sliders smoothly
  void editVarVersion;

  const isInspecting = props.isInspectingShot ?? storeIsEditingItem;
  const currentShotOverride =
    props.currentShotOverride !== undefined
      ? props.currentShotOverride
      : isInspecting && !props.shots
      ? getActiveEditItemVariable()
      : null;

  const handleMutateCurrentShot = (updater: (draft: StaticTrainingShotItem) => void) => {
    if (props.onMutateCurrentShot) {
      props.onMutateCurrentShot(updater);
      return;
    }
    if (props.onShotsChange && props.shots) {
      const items = props.shots;
      const selectedIndex = props.selectedShotIndex ?? storeShotIndex;
      const safeIndex = Math.max(0, Math.min(Math.max(0, items.length - 1), selectedIndex));
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
          angularVelocity: [...currentShot.ball.angularVelocity] as [number, number, number],
        },
      };
      updater(cloned);
      props.onShotsChange(items.map((it, idx) => (idx === safeIndex ? cloned : it)));
      return;
    }
    mutateActiveEditItemVariable(updater);
  };

  return (
    <Layer5StaticTrainingPackEditRecipe
      {...props}
      packTitle={props.packTitle ?? activePack?.metadata.title ?? 'PACK'}
      shots={props.shots ?? activePack?.items ?? []}
      currentShotOverride={currentShotOverride}
      selectedShotIndex={props.selectedShotIndex ?? storeShotIndex}
      onSelectedShotIndexChange={(idx) => {
        props.onSelectedShotIndexChange?.(idx);
        if (!props.shots) {
          enterItemEditMode(idx);
        }
      }}
      isInspectingShot={isInspecting}
      onInspectingShotChange={(inspecting) => {
        props.onInspectingShotChange?.(inspecting);
        if (!inspecting && !props.shots) {
          void deselectEditShot();
        }
      }}
      editSubMode={props.editSubMode ?? storeEditSubMode}
      onEditSubModeChange={props.onEditSubModeChange ?? setStoreEditSubMode}
      isDirty={props.isDirty ?? isCurrentShotDirty()}
      onMutateCurrentShot={handleMutateCurrentShot}
      onSaveCurrentShot={props.onSaveCurrentShot ?? saveCurrentShotToEditWorkspace}
      onAddNewShot={props.onAddNewShot ?? addNewShot}
      onDuplicateShot={props.onDuplicateShot ?? duplicateShot}
      onReorderShot={props.onReorderShot ?? reorderShot}
      onDeleteShot={props.onDeleteShot ?? deleteShot}
      onExportSingleShot={props.onExportSingleShot ?? exportSingleShotJson}
      onImportSingleShot={props.onImportSingleShot ?? importSingleShotJson}
    />
  );
};
