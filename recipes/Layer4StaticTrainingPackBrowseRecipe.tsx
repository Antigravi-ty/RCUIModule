import React, { useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { useLayer4StaticTrainingPackBrowseStoreBinding } from './hooks/useStaticTrainingStoreBindings';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { DEFAULT_PANEL_SIZING } from '../tokens/menuLayoutTokens';
import {
  StaticTrainingPackFolderList,
  type StaticPackDownCounterOption,
  type StaticTrainingPackSummary,
} from './static-training/StaticTrainingPackFolderList';
import { StaticTrainingPackToolbar } from './static-training/StaticTrainingPackToolbar';
import { StaticTrainingPackMetadataInspector } from './static-training/StaticTrainingPackMetadataInspector';
import { StaticTrainingVariationsModal } from './static-training/StaticTrainingVariationsModal';
import {
  DEFAULT_QUICK_VARIATION_TOGGLES,
  KEVPERT_LATEST_PRESETS,
  type KevpertPresetKey,
  type StaticTrainingQuickVariationToggles,
  type StaticTrainingVariationConfig,
} from '../config/staticTrainingVariationTypes';

export interface Layer4StaticTrainingPackVariationOverride {
  variationToggles?: StaticTrainingQuickVariationToggles;
  onUpdateVariationToggles?: (patch: Partial<StaticTrainingQuickVariationToggles>) => void;
  customVariation?: StaticTrainingVariationConfig;
  onUpdateCustomVariation?: (patch: Partial<StaticTrainingVariationConfig>) => void;
  onSelectKevpertPreset?: (key: KevpertPresetKey) => void;
}

export interface Layer4StaticTrainingPackBrowseStateOverride {
  packs?: StaticTrainingPackSummary[];
  selectedPackUuid?: string | null;
  onSelectPack?: (uuid: string) => void;
  defaultSelectedId?: string;
  defaultUseDownCounter?: boolean;
  downCounterEnabled?: boolean;
  onDownCounterEnabledChange?: (enabled: boolean) => void;
  downCounterValue?: StaticPackDownCounterOption;
  onDownCounterValueChange?: (val: StaticPackDownCounterOption) => void;
  variationOverride?: Layer4StaticTrainingPackVariationOverride;
  onCreatePack?: (title: string, description: string) => Promise<void> | void;
  onSavePackMetadata?: (uuid: string, title: string, description: string) => Promise<void> | void;
  onDeletePack?: (uuid: string) => Promise<void> | void;
  onImportPackFile?: (file: File) => Promise<void> | void;
  onImportBatchPackFiles?: (files: File[] | FileList) => Promise<number> | void;
  onExportPack?: (pack: StaticTrainingPackSummary, editable?: boolean) => Promise<void> | void;
  onExportBatchPacksZip?: (
    uuids: string[],
    bundleName: string,
    editable: boolean
  ) => Promise<string | null> | void;
}

export interface Layer4StaticTrainingPackBrowseRecipeProps {
  isLight?: boolean;
  isDevMode?: boolean;
  onBack?: () => void;
  onStartPlaySession?: (uuid: string) => void;
  onStartEditSession?: (uuid: string) => void;
  onPlayPack?: (pack: StaticTrainingPackSummary, useDownCounter: boolean) => void;
  onEditPack?: (pack: StaticTrainingPackSummary) => void;
  onImportPack?: () => void;
  stateOverride?: Layer4StaticTrainingPackBrowseStateOverride;
  className?: string;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function normalizePackSummary(raw: Partial<StaticTrainingPackSummary>, idx = 0): StaticTrainingPackSummary {
  const uuid = raw.uuid || raw.id || `pack-${idx + 1}`;
  const title = raw.title || raw.name || 'Untitled Training Pack';
  const description = raw.description ?? '';
  const itemCount = typeof raw.itemCount === 'number' ? raw.itemCount : typeof raw.shotCount === 'number' ? raw.shotCount : 1;
  const createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : 1740000000000;
  const updatedAt = typeof raw.updatedAt === 'number' ? raw.updatedAt : typeof raw.updatedAt === 'string' ? Date.parse(raw.updatedAt) || createdAt : createdAt;
  return { ...raw, uuid, id: uuid, title, name: title, description, itemCount, shotCount: itemCount, createdAt, updatedAt };
}

const DEFAULT_PACKS: StaticTrainingPackSummary[] = [
  { uuid: 'starter-aerial-striker-pack', title: 'Starter Aerial & Volley Pack', description: 'Starter static training pack featuring a midfield volley, a suspended kickoff-state aerial, and a backboard read.', itemCount: 3, tags: ['Local'], createdAt: 1740000000000, updatedAt: 1740000000000 },
  { uuid: 'wall-to-air-dribble-pack', title: 'Wall-to-Air Dribble Fundamentals', description: '12 progressive mid-field wall setups with top-corner goal mouth barrier masks.', itemCount: 12, tags: ['Local'], createdAt: 1739836800000, updatedAt: 1739836800000 },
  { uuid: 'backboard-double-tap-reads', title: 'Backboard Double Tap Reads', description: 'High-speed backboard clears and offensive double-tap angles with randomized initial impulse.', itemCount: 8, tags: ['Local'], createdAt: 1740009600000, updatedAt: 1740009600000 },
];

async function decodeRCSPackText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isGzip = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (isGzip && typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip');
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    return await new Response(stream).text();
  }
  return new TextDecoder().decode(bytes);
}

/**
 * [Recipe] Layer 4 Static Training Pack Browser (Width: 680px, 2-Column Layout)
 * Reused for both standard `STATIC TRAINING PACKS` and Developer Sandbox `STATIC TRAINING PACKS (DEV MODE)`.
 */
export const Layer4StaticTrainingPackBrowseRecipe: React.FC<
  Layer4StaticTrainingPackBrowseRecipeProps
> = React.memo((rawProps) => {
  const {
    isLight = false,
    isDevMode = false,
    packs: controlledPacks,
    selectedPackUuid: controlledSelectedUuid,
    onSelectPack,
    defaultSelectedId = 'starter-aerial-striker-pack',
    defaultUseDownCounter = false,
    downCounterEnabled: controlledDownCounterEnabled,
    onDownCounterEnabledChange,
    downCounterValue: controlledDownCounterValue,
    onDownCounterValueChange,
    variationToggles = DEFAULT_QUICK_VARIATION_TOGGLES,
    onUpdateVariationToggles = () => {},
    customVariation = KEVPERT_LATEST_PRESETS.F7,
    onUpdateCustomVariation = () => {},
    onSelectKevpertPreset = () => {},
    onCreatePack,
    onSavePackMetadata,
    onDeletePack,
    onImportPackFile,
    onImportBatchPackFiles,
    onExportBatchPacksZip,
    onBack = () => {},
    onStartPlaySession,
    onStartEditSession,
    onPlayPack,
    onEditPack,
    onImportPack,
    onExportPack,
    className = '',
  } = useLayer4StaticTrainingPackBrowseStoreBinding({
    ...rawProps.stateOverride,
    ...rawProps.stateOverride?.variationOverride,
    ...rawProps,
  });

  const sizing = useMenuLayoutStore(
    (s) =>
      s.panels?.['layer4-static-training-pack'] ??
      DEFAULT_PANEL_SIZING['layer4-static-training-pack']
  );

  const [internalPacks, setInternalPacks] = useState<StaticTrainingPackSummary[]>(() =>
    (controlledPacks ?? DEFAULT_PACKS).map((p, i) => normalizePackSummary(p, i))
  );

  useEffect(() => {
    if (controlledPacks) {
      setInternalPacks(controlledPacks.map((p, i) => normalizePackSummary(p, i)));
    }
  }, [controlledPacks]);

  const packs = controlledPacks
    ? controlledPacks.map((p, i) => normalizePackSummary(p, i))
    : internalPacks;

  const sortedPacks = [...packs].sort(
    (a, b) => Number(b.updatedAt ?? 0) - Number(a.updatedAt ?? 0)
  );

  const [internalSelectedUuid, setInternalSelectedUuid] = useState<string | null>(() => {
    const initial = (controlledPacks ?? DEFAULT_PACKS).map((p, i) =>
      normalizePackSummary(p, i)
    );
    const found = initial.find(
      (p) => p.uuid === defaultSelectedId || p.id === defaultSelectedId
    );
    return found?.uuid ?? initial[0]?.uuid ?? null;
  });

  const selectedPackUuid =
    controlledSelectedUuid !== undefined
      ? controlledSelectedUuid
      : internalSelectedUuid;

  const [internalDownCounterEnabled, setInternalDownCounterEnabled] =
    useState<boolean>(defaultUseDownCounter);
  const [internalDownCounterValue, setInternalDownCounterValue] =
    useState<StaticPackDownCounterOption>(1);

  const downCounterEnabled =
    controlledDownCounterEnabled !== undefined
      ? controlledDownCounterEnabled
      : internalDownCounterEnabled;
  const downCounterValue =
    controlledDownCounterValue !== undefined
      ? controlledDownCounterValue
      : internalDownCounterValue;

  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [confirmDeleteUuid, setConfirmDeleteUuid] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedMeta =
    sortedPacks.find((p) => p.uuid === selectedPackUuid) || sortedPacks[0] || null;

  useEffect(() => {
    if (selectedMeta) {
      setEditTitle(selectedMeta.title);
      setEditDescription(selectedMeta.description || '');
      setConfirmDeleteUuid(null);
    } else {
      setEditTitle('');
      setEditDescription('');
      setConfirmDeleteUuid(null);
    }
  }, [selectedMeta?.uuid, selectedMeta?.title, selectedMeta?.description]);

  const handleSelectPack = (uuid: string) => {
    setInternalSelectedUuid(uuid);
    onSelectPack?.(uuid);
  };

  const setDownCounterEnabled = (enabled: boolean) => {
    setInternalDownCounterEnabled(enabled);
    onDownCounterEnabledChange?.(enabled);
  };

  const setDownCounterValue = (val: StaticPackDownCounterOption) => {
    setInternalDownCounterValue(val);
    onDownCounterValueChange?.(val);
  };

  const handleCreateSubmit = async () => {
    const title = newTitle.trim() || 'Custom Training Pack';
    const desc = newDescription.trim();
    if (onCreatePack) {
      await onCreatePack(title, desc);
    } else {
      const now = Date.now();
      const created = normalizePackSummary({
        uuid: generateUUID(),
        title,
        description: desc,
        itemCount: 1,
        tags: ['Local'],
        createdAt: now,
        updatedAt: now,
      });
      setInternalPacks((prev) => [created, ...prev]);
      setInternalSelectedUuid(created.uuid);
    }
    setNewTitle('');
    setNewDescription('');
    setIsCreatingPack(false);
  };

  const isMetadataDirty = Boolean(
    selectedMeta &&
      (editTitle.trim() !== selectedMeta.title ||
        editDescription.trim() !== (selectedMeta.description || ''))
  );

  const handleSaveMetadata = async () => {
    if (!selectedMeta || !isMetadataDirty) return;
    const nextTitle = editTitle.trim() || 'Untitled Training Pack';
    const nextDesc = editDescription.trim();
    if (onSavePackMetadata) {
      await onSavePackMetadata(selectedMeta.uuid, nextTitle, nextDesc);
    } else {
      setInternalPacks((prev) =>
        prev.map((p) =>
          p.uuid === selectedMeta.uuid
            ? {
                ...p,
                title: nextTitle,
                name: nextTitle,
                description: nextDesc,
                updatedAt: Date.now(),
              }
            : p
        )
      );
    }
    setHoveredDesc('Saved pack metadata.');
  };

  const handleDeletePack = async (uuid: string) => {
    if (onDeletePack) {
      await onDeletePack(uuid);
    } else {
      setInternalPacks((prev) => {
        const remaining = prev.filter((p) => p.uuid !== uuid);
        if (selectedPackUuid === uuid) {
          setInternalSelectedUuid(remaining[0]?.uuid ?? null);
        }
        return remaining;
      });
    }
    setConfirmDeleteUuid(null);
  };

  const handleExportPack = async (
    pack: StaticTrainingPackSummary,
    editable = false
  ) => {
    if (onExportPack) {
      await onExportPack(pack, editable);
    }
    const safeTitle =
      (pack.title || 'TrainingPack')
        .trim()
        .replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'TrainingPack';
    const ext = editable ? 'RCSPackE' : 'RCSPack';
    const filename = `${safeTitle}_${pack.uuid}.${ext}`;
    setHoveredDesc(`Exported ${filename}`);
  };

  const handleBatchExportFiltered = async (
    filteredPacks: StaticTrainingPackSummary[],
    folderLabel: string,
    editable: boolean
  ) => {
    const uuids = filteredPacks.map((p) => p.uuid);
    if (uuids.length === 0) return;
    if (onExportBatchPacksZip) {
      const zipName = await onExportBatchPacksZip(uuids, folderLabel, editable);
      setHoveredDesc(
        `Exported ${uuids.length} packs from "${folderLabel}" as ${zipName || '.zip'}`
      );
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    try {
      if (onImportBatchPackFiles && (fileList.length > 1 || /\.zip$/i.test(fileList[0].name))) {
        const count = await onImportBatchPackFiles(fileList);
        setHoveredDesc(
          `Batch imported ${count || fileList.length} training pack(s) into VFS.`
        );
      } else if (onImportPackFile) {
        await onImportPackFile(fileList[0]);
        setHoveredDesc(`Imported pack from ${fileList[0].name}`);
      } else {
        const file = fileList[0];
        const text = await decodeRCSPackText(file);
        const parsed = JSON.parse(text);
        const rawMeta = parsed?.metadata || parsed || {};
        const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
        const now = Date.now();
        const imported = normalizePackSummary({
          uuid:
            typeof rawMeta.uuid === 'string' && rawMeta.uuid.trim()
              ? rawMeta.uuid.trim()
              : generateUUID(),
          title:
            typeof rawMeta.title === 'string' && rawMeta.title.trim()
              ? rawMeta.title.trim()
              : file.name.replace(/\.(rcspacke?|rlrcspack|gz|json)$/i, '') || 'Imported Pack',
          description:
            typeof rawMeta.description === 'string' ? rawMeta.description : '',
          itemCount:
            rawItems.length > 0
              ? rawItems.length
              : typeof rawMeta.itemCount === 'number'
              ? rawMeta.itemCount
              : 1,
          createdAt: now,
          updatedAt: now,
        });
        setInternalPacks((prev) => [
          imported,
          ...prev.filter((p) => p.uuid !== imported.uuid),
        ]);
        setInternalSelectedUuid(imported.uuid);
        onImportPack?.();
        setHoveredDesc(`Imported pack from ${file.name}`);
      }
    } catch (err: any) {
      setHoveredDesc(`Import failed: ${err?.message || 'Invalid training pack file'}`);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <PanelContainer
      width={sizing.width}
      height={sizing.targetHeight}
      isLight={isLight}
      className={`w-full select-none ${className}`}
    >
      <PanelHeader
        title={isDevMode ? 'STATIC TRAINING PACKS (DEV MODE)' : 'STATIC TRAINING PACKS'}
        onBack={onBack}
        isLight={isLight}
        showRightAction={isDevMode}
        onRightAction={isDevMode ? () => setIsVariationsModalOpen(true) : undefined}
        rightActionIcon={<Settings className="h-4 w-4" />}
        rightActionLabel="Training Variations"
        onRightActionHoverChange={(hovered) => {
          if (hovered) {
            setHoveredDesc(
              'Open Training Variations (Experimental): Configure BakkesMod / Kevpert F3–F12 presets, Ball/Car variance, and Quick Toggles.'
            );
          } else {
            setHoveredDesc(null);
          }
        }}
      />

      <PanelContent scrollable={false} className="flex flex-col gap-3 h-full overflow-hidden">
        <div className="grid grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
          <StaticTrainingPackFolderList
            isLight={isLight}
            packs={sortedPacks}
            selectedUuid={selectedMeta?.uuid}
            onSelectPack={handleSelectPack}
            onHoverDesc={setHoveredDesc}
            onBatchExportFiltered={(filtered, folderLabel, editable) =>
              void handleBatchExportFiltered(filtered, folderLabel, editable)
            }
          />

          <div className="col-span-7 flex flex-col gap-2.5 min-h-0 overflow-hidden">
            <StaticTrainingPackToolbar
              isLight={isLight}
              fileInputRef={fileInputRef}
              onImportClick={() => fileInputRef.current?.click()}
              onImportFileChange={(e) => void handleImportFile(e)}
              isCreatingPack={isCreatingPack}
              setIsCreatingPack={setIsCreatingPack}
              newTitle={newTitle}
              setNewTitle={setNewTitle}
              newDescription={newDescription}
              setNewDescription={setNewDescription}
              onCreateSubmit={() => void handleCreateSubmit()}
              onHoverDesc={setHoveredDesc}
            />

            <StaticTrainingPackMetadataInspector
              isLight={isLight}
              isDevMode={isDevMode}
              selectedMeta={selectedMeta}
              draft={{
                editTitle,
                setEditTitle,
                editDescription,
                setEditDescription,
                isMetadataDirty,
                onSaveMetadata: () => void handleSaveMetadata(),
              }}
              downCounter={{
                downCounterEnabled,
                setDownCounterEnabled,
                downCounterValue,
                setDownCounterValue,
              }}
              confirmDeleteUuid={confirmDeleteUuid}
              setConfirmDeleteUuid={setConfirmDeleteUuid}
              onPlayPack={(meta) => {
                onStartPlaySession?.(meta.uuid);
                onPlayPack?.(meta, downCounterEnabled);
              }}
              onEditPack={(meta) => {
                onStartEditSession?.(meta.uuid);
                onEditPack?.(meta);
              }}
              onExportPack={(meta, editable) => void handleExportPack(meta, editable)}
              onDeletePack={(uuid) => void handleDeletePack(uuid)}
              onHoverDesc={setHoveredDesc}
            />
          </div>
        </div>
      </PanelContent>

      {isDevMode && (
        <StaticTrainingVariationsModal
          isLight={isLight}
          isOpen={isVariationsModalOpen}
          onClose={() => setIsVariationsModalOpen(false)}
          toggles={variationToggles}
          onUpdateToggles={onUpdateVariationToggles}
          customVariation={customVariation}
          onUpdateCustomVariation={onUpdateCustomVariation}
          onSelectKevpertPreset={onSelectKevpertPreset}
          packRecommendedVariation={selectedMeta?.recommendedVariation}
          packTitle={selectedMeta?.title}
        />
      )}

      <PanelFooter
        isLight={isLight}
        defaultDescription={
          isDevMode
            ? 'Dev Mode: 134 built-in .RLRCSPack packs loaded • Click the top-right Gear icon for Training Variations (F3–F12 / Custom).'
            : 'Select a Static Training Pack on the left to Play, Edit, Export (.RCSPack / .RCSPackE), or Delete.'
        }
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
});
Layer4StaticTrainingPackBrowseRecipe.displayName = 'Layer4StaticTrainingPackBrowseRecipe';
export default Layer4StaticTrainingPackBrowseRecipe;
