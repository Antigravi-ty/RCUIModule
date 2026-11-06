import React, { useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import {
  useLayer4StaticTrainingPackBrowseStoreBinding,
  type Layer4StaticTrainingPackBrowseRecipeProps,
} from './hooks/useStaticTrainingStoreBindings';
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
} from '../config/staticTrainingVariationTypes';

export type { Layer4StaticTrainingPackBrowseRecipeProps };

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

function normalizePackSummary(
  raw: Partial<StaticTrainingPackSummary>,
  idx = 0
): StaticTrainingPackSummary {
  const uuid = raw.uuid || raw.id || `pack-${idx + 1}`;
  const title = raw.title || raw.name || 'Untitled Training Pack';
  const description = raw.description ?? '';
  const itemCount =
    typeof raw.itemCount === 'number'
      ? raw.itemCount
      : typeof raw.shotCount === 'number'
      ? raw.shotCount
      : 1;
  return {
    ...raw,
    uuid,
    id: raw.id || uuid,
    title,
    name: raw.name || title,
    description,
    itemCount,
    shotCount: itemCount,
  };
}

const DEFAULT_PACKS: StaticTrainingPackSummary[] = [
  {
    uuid: '8f3d20a1-7c4e-4b91-8e52-starter00001',
    id: 'starter-aerial-striker-pack',
    title: 'Fundamentals: Striker & Aerials',
    description:
      'Starter static training pack featuring a midfield volley, a suspended kickoff-state aerial, and a backboard read.',
    itemCount: 3,
    tags: ['Native'],
    createdAt: 1740000000000,
    updatedAt: 1740000000000,
  },
  {
    uuid: '9d8725b4-3c11-48f0-a210-12b49d8725b4',
    title: 'Wall-to-Air Dribble Mastery',
    description:
      '12 progressive mid-field wall setups with top-corner goal mouth barrier masks.',
    itemCount: 12,
    tags: ['Native'],
    createdAt: 1739836800000,
    updatedAt: 1739836800000,
  },
  {
    uuid: '4a1977e2-90d1-41c4-b812-4a1977e290d1',
    title: 'Double Tap & Backboard Reads',
    description:
      'High-speed backboard clears and offensive double-tap angles with randomized initial impulse.',
    itemCount: 8,
    tags: ['Native'],
    createdAt: 1740009600000,
    updatedAt: 1740009600000,
  },
];

async function decodeRCSPackText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const isGzip = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (isGzip && typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(bytes as unknown as BufferSource);
    writer.close();
    const resp = new Response(ds.readable);
    return await resp.text();
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
    onUpdatePackTags,
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

  const packs = React.useMemo(
    () =>
      (controlledPacks ?? internalPacks).map((p, i) => normalizePackSummary(p, i)),
    [controlledPacks, internalPacks]
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
    controlledDownCounterEnabled ?? internalDownCounterEnabled;
  const downCounterValue =
    controlledDownCounterValue ?? internalDownCounterValue;
  const setDownCounterEnabled =
    onDownCounterEnabledChange ?? setInternalDownCounterEnabled;
  const setDownCounterValue =
    onDownCounterValueChange ?? setInternalDownCounterValue;

  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [confirmDeleteUuid, setConfirmDeleteUuid] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMeta =
    packs.find((p) => p.uuid === selectedPackUuid) ?? packs[0] ?? null;

  useEffect(() => {
    if (selectedMeta) {
      setEditTitle(selectedMeta.title);
      setEditDescription(selectedMeta.description);
    }
    setConfirmDeleteUuid(null);
  }, [selectedMeta?.uuid, selectedMeta?.title, selectedMeta?.description]);

  const isMetadataDirty = Boolean(
    selectedMeta &&
      ((editTitle.trim() || 'Untitled Training Pack') !== selectedMeta.title ||
        editDescription.trim() !== (selectedMeta.description || ''))
  );

  const handleSelectPack = (uuid: string) => {
    if (onSelectPack) {
      onSelectPack(uuid);
    } else {
      setInternalSelectedUuid(uuid);
    }
    setConfirmDeleteUuid(null);
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
        tags: ['Native'],
        sourcePackType: 'RCSPackE',
        createdAt: now,
        updatedAt: now,
      });
      setInternalPacks((prev) => [created, ...prev]);
      setInternalSelectedUuid(created.uuid);
    }
    setNewTitle('');
    setNewDescription('');
    setIsCreatingPack(false);
    setHoveredDesc(`Created new training pack "${title}"`);
  };

  const handleSaveMetadata = async () => {
    if (!selectedMeta || !isMetadataDirty) return;
    const trimmedTitle = editTitle.trim() || 'Untitled Training Pack';
    const trimmedDesc = editDescription.trim();
    if (onSavePackMetadata) {
      await onSavePackMetadata(selectedMeta.uuid, trimmedTitle, trimmedDesc);
    } else {
      setInternalPacks((prev) =>
        prev.map((p) =>
          p.uuid === selectedMeta.uuid
            ? normalizePackSummary({
                ...p,
                title: trimmedTitle,
                name: trimmedTitle,
                description: trimmedDesc,
                updatedAt: Date.now(),
              })
            : p
        )
      );
    }
    setHoveredDesc(`Saved global metadata for "${trimmedTitle}"`);
  };

  const handleUpdatePackTags = async (uuid: string, nextTags: string[]) => {
    if (onUpdatePackTags) {
      await onUpdatePackTags(uuid, nextTags);
    } else {
      setInternalPacks((prev) =>
        prev.map((p) =>
          p.uuid === uuid
            ? normalizePackSummary({
                ...p,
                tags: nextTags,
                updatedAt: Date.now(),
              })
            : p
        )
      );
    }
  };

  const handleDeletePack = async (uuid: string) => {
    if (onDeletePack) {
      await onDeletePack(uuid);
    } else {
      setInternalPacks((prev) => {
        const next = prev.filter((p) => p.uuid !== uuid);
        if (internalSelectedUuid === uuid) {
          setInternalSelectedUuid(next[0]?.uuid ?? null);
        }
        return next;
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
    editable: boolean,
    formatOverride?: 'RCSPack' | 'RCSPackE' | 'RLRCSPack'
  ) => {
    const uuids = filteredPacks.map((p) => p.uuid);
    if (uuids.length === 0) return;
    if (onExportBatchPacksZip) {
      const zipName = await onExportBatchPacksZip(
        uuids,
        folderLabel,
        editable,
        formatOverride
      );
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
        if (!isDevMode && /\.(rlrcspack|tem)$/i.test(file.name)) {
          throw new Error('.RLRCSPack and .Tem packs can only be imported in Developer Mode.');
        }
        const text = await decodeRCSPackText(file);
        const parsed = JSON.parse(text);
        if (!isDevMode && parsed?.format === 'RLRCSPack') {
          throw new Error('.RLRCSPack packs can only be imported in Developer Mode.');
        }
        const rawMeta = parsed?.metadata || parsed || {};
        const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
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
          sourcePackType: /\.rlrcspack$/i.test(file.name)
            ? 'RLRCSPack'
            : /\.rcspacke$/i.test(file.name)
            ? 'RCSPackE'
            : 'RCSPack',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        setInternalPacks((prev) => [
          imported,
          ...prev.filter((p) => p.uuid !== imported.uuid),
        ]);
        setInternalSelectedUuid(imported.uuid);
        setHoveredDesc(`Imported pack from ${file.name}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid training pack file';
      setHoveredDesc(`Import failed: ${message}`);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <PanelContainer
      isLight={isLight}
      sizing={sizing}
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
        <div className="grid grid-cols-12 gap-3.5 grow min-h-0 overflow-hidden">
          <StaticTrainingPackFolderList
            isLight={isLight}
            isDevMode={isDevMode}
            applyNewKevpertBind={Boolean(variationToggles.applyNewKevpertBind)}
            packs={packs}
            selectedUuid={selectedMeta?.uuid}
            onSelectPack={handleSelectPack}
            onHoverDesc={setHoveredDesc}
            onBatchExportFiltered={(filtered, folderLabel, editable, formatOverride) =>
              void handleBatchExportFiltered(filtered, folderLabel, editable, formatOverride)
            }
          />

          <div className="col-span-6 flex flex-col gap-2.5 min-h-0 overflow-hidden">
            <StaticTrainingPackToolbar
              isLight={isLight}
              isDevMode={isDevMode}
              fileInputRef={fileInputRef}
              isCreatingPack={isCreatingPack}
              setIsCreatingPack={setIsCreatingPack}
              newTitle={newTitle}
              setNewTitle={setNewTitle}
              newDescription={newDescription}
              setNewDescription={setNewDescription}
              onImportClick={() => {
                onImportPack?.();
                fileInputRef.current?.click();
              }}
              onImportFileChange={(e) => void handleImportFile(e)}
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
              applyNewKevpertBind={Boolean(variationToggles.applyNewKevpertBind)}
              onToggleApplyNewKevpertBind={(val) =>
                onUpdateVariationToggles({ applyNewKevpertBind: val })
              }
              onUpdatePackTags={(uuid, nextTags) => void handleUpdatePackTags(uuid, nextTags)}
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
            ? 'Dev Mode: Batch import/export .Tem / .RCSPack / .RCSPackE / .zip • Click the top-right Gear icon for Training Variations (F3–F12 / Custom).'
            : 'Select a Static Training Pack on the left to Play, Edit, Export (.RCSPack / .RCSPackE), or Delete.'
        }
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
});

Layer4StaticTrainingPackBrowseRecipe.displayName = 'Layer4StaticTrainingPackBrowseRecipe';
