import React, { useEffect } from 'react';
import {
  Layer4StaticTrainingPackBrowseRecipe,
  type StaticPackDownCounterOption,
} from './Layer4StaticTrainingPackBrowseRecipe';
import { useStaticTrainingPackStore } from '../stores/staticTrainingPackStore';

export type { StaticPackDownCounterOption };

export interface StaticTrainingPackBrowseRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  onStartPlaySession?: (uuid: string) => void;
  onStartEditSession?: (uuid: string) => void;
  className?: string;
}

/**
 * [Adapter] Layer 4 Static Training Pack Browser
 * Connects useStaticTrainingPackStore (IndexedDB VFS) to pure Layer4StaticTrainingPackBrowseRecipe.
 */
export const StaticTrainingPackBrowseRecipe: React.FC<StaticTrainingPackBrowseRecipeProps> = ({
  isLight = false,
  onBack,
  onStartPlaySession,
  onStartEditSession,
  className = '',
}) => {
  const packs = useStaticTrainingPackStore((s) => s.packs);
  const selectedPackUuid = useStaticTrainingPackStore((s) => s.selectedPackUuid);
  const initialized = useStaticTrainingPackStore((s) => s.initialized);
  const initStore = useStaticTrainingPackStore((s) => s.initStore);
  const selectPack = useStaticTrainingPackStore((s) => s.selectPack);
  const createPack = useStaticTrainingPackStore((s) => s.createPack);
  const updatePackInfo = useStaticTrainingPackStore((s) => s.updatePackInfo);
  const deletePack = useStaticTrainingPackStore((s) => s.deletePack);
  const exportPackRCS = useStaticTrainingPackStore((s) => s.exportPackRCS);
  const importPackRCS = useStaticTrainingPackStore((s) => s.importPackRCS);
  const downCounterEnabled = useStaticTrainingPackStore((s) => s.downCounterEnabled);
  const downCounterValue = useStaticTrainingPackStore((s) => s.downCounterValue);
  const setDownCounterEnabled = useStaticTrainingPackStore((s) => s.setDownCounterEnabled);
  const setDownCounterValue = useStaticTrainingPackStore((s) => s.setDownCounterValue);

  useEffect(() => {
    if (!initialized) {
      void initStore();
    }
  }, [initialized, initStore]);

  return (
    <Layer4StaticTrainingPackBrowseRecipe
      isLight={isLight}
      packs={packs}
      selectedPackUuid={selectedPackUuid}
      onSelectPack={(uuid) => {
        void selectPack(uuid);
      }}
      downCounterEnabled={downCounterEnabled}
      onDownCounterEnabledChange={setDownCounterEnabled}
      downCounterValue={downCounterValue}
      onDownCounterValueChange={setDownCounterValue}
      onCreatePack={async (title, desc) => {
        await createPack(title, desc);
      }}
      onSavePackMetadata={async (uuid, title, desc) => {
        await updatePackInfo(uuid, title, desc);
      }}
      onDeletePack={async (uuid) => {
        await deletePack(uuid);
      }}
      onExportPack={async (pack) => {
        await exportPackRCS(pack.uuid);
      }}
      onImportPackFile={async (file) => {
        await importPackRCS(file);
      }}
      onBack={onBack}
      onStartPlaySession={onStartPlaySession}
      onStartEditSession={onStartEditSession}
      className={className}
    />
  );
};
