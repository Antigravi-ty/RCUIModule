import React, { useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import type { StandardSurfaceProps, SurfaceMeta } from '../manifest/surfaceMetaTypes';
import { resolveCalibratedSurfaceSizing } from '../manifest/surfaceCalibration';
import { useAppStore } from '../stores/appStore';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useStaticTrainingPackStore } from '../stores/staticTrainingPackStore';
import { useStoreSnapshotOverride } from '../stores/storeSnapshotScope';
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
import {
  DEFAULT_STATIC_TRAINING_PACKS,
  decodeRCSPackText,
  generatePackUUID,
  normalizePackSummary,
} from './static-training/staticTrainingPackFilterLogic';

export const SURFACE_META: SurfaceMeta = {
  id: 'recipe:Layer4StaticTrainingPackBrowseRecipe',
  title: 'Static Training Packs Browser',
  subtitle: '.RCSPack / .RCSPackE / .Tem 2-column pack manager, metadata editor, and Kevpert variations',
  icon: 'folder-open',
  layer: 'layer4',
  menuGroup: 'menu-layer',
  defaultSizing: {
    mode: 'fixed',
    width: 920,
    height: 740,
    minHeight: 320,
    maxHeight: 1120,
  },
  variants: [
    {
      variantId: 'user',
      label: 'Standard Pack Browser',
      description: '2-column Static Training Pack browser (.RCSPack / .RCSPackE)',
    },
    {
      variantId: 'dev',
      label: 'Dev Mode (.Tem Converter & Variations)',
      description: 'Includes .Tem original description inspector and Kevpert F3–F12 variations modal',
    },
  ],
};

export interface Layer4StaticTrainingPackBrowseStateOverride {
  defaultSelectedId?: string;
  defaultUseDownCounter?: boolean;
  packs?: StaticTrainingPackSummary[];
  selectedPackUuid?: string | null;
  onSelectPack?: (uuid: string) => void;
  downCounterEnabled?: boolean;
  onDownCounterEnabledChange?: (enabled: boolean) => void;
  downCounterValue?: StaticPackDownCounterOption;
  onDownCounterValueChange?: (val: StaticPackDownCounterOption) => void;
  variationToggles?: StaticTrainingQuickVariationToggles;
  onUpdateVariationToggles?: (patch: Partial<StaticTrainingQuickVariationToggles>) => void;
  customVariation?: StaticTrainingVariationConfig;
  onUpdateCustomVariation?: (patch: Partial<StaticTrainingVariationConfig>) => void;
  onSelectKevpertPreset?: (key: KevpertPresetKey) => void;
  onCreatePack?: (title: string, description: string) => void | Promise<unknown>;
  onSavePackMetadata?: (uuid: string, title: string, description: string) => void | Promise<void>;
  onUpdatePackTags?: (uuid: string, nextTags: string[]) => void | Promise<void>;
  onDeletePack?: (uuid: string) => void | Promise<void>;
  onImportPackFile?: (file: File) => void | Promise<unknown>;
  onImportBatchPackFiles?: (files: FileList | File[]) => void | Promise<number | void>;
  onExportBatchPacksZip?: (
    uuids: string[],
    bundleName: string,
    editable: boolean,
    formatOverride?: 'RCSPack' | 'RCSPackE' | 'RLRCSPack'
  ) => void | Promise<string | null | void>;
  onStartPlaySession?: (uuid: string) => void;
  onStartEditSession?: (uuid: string) => void | Promise<void>;
  onPlayPack?: (pack: StaticTrainingPackSummary, useDownCounter: boolean) => void;
  onEditPack?: (pack: StaticTrainingPackSummary) => void;
  onImportPack?: () => void;
  onExportPack?: (pack: StaticTrainingPackSummary, editable?: boolean) => void | Promise<void>;
}

export interface Layer4StaticTrainingPackBrowseRecipeProps extends StandardSurfaceProps {
  isDevMode?: boolean;
  stateOverride?: Layer4StaticTrainingPackBrowseStateOverride;
  className?: string;
}

export const Layer4StaticTrainingPackBrowseRecipe: React.FC<
  Layer4StaticTrainingPackBrowseRecipeProps
> = React.memo(({ isLight = false, isDevMode = false, onBack, stateOverride, className = '' }) => {
  const store = useStaticTrainingPackStore();
  const goBack = useAppStore((s) => s.goBack);
  const closeMenu = useAppStore((s) => s.closeMenu);
  const setMatchMode = useAppStore((s) => s.setMatchMode);
  const bridge = useAppStore((s) => s.bridge);
  const scopeOverride =
    useStoreSnapshotOverride<Layer4StaticTrainingPackBrowseStateOverride>(
      'staticTrainingPackStore'
    );
  const ov = { ...scopeOverride, ...stateOverride };

  const targetScope = isDevMode ? 'dev' : 'normal';
  const scopeInit = isDevMode ? store.devInitialized : store.initialized;
  const scopedPacks = isDevMode ? store.devPacks : store.normalPacks;
  const scopedSelectedUuid = isDevMode ? store.devSelectedPackUuid : store.normalSelectedPackUuid;

  useEffect(() => {
    void store.setStorageScope(targetScope);
    if (!scopeInit && !store.isLoading && !ov.packs) void store.initStore(targetScope);
  }, [targetScope, scopeInit, store.isLoading, ov.packs]);

  useEffect(() => {
    if (isDevMode && store.devInitialized && !ov.packs) {
      void store.seedDevBuiltInPacks(false);
    }
  }, [isDevMode, store.devInitialized, ov.packs]);

  const storeSizing = useMenuLayoutStore((s) => s.panels?.['layer4-static-training-pack']);
  const calibratedSizing = resolveCalibratedSurfaceSizing(SURFACE_META.id, SURFACE_META.defaultSizing);
  const sizing = storeSizing ?? {
    mode: calibratedSizing.mode === 'fixed' ? ('fixed' as const) : ('auto' as const),
    width: calibratedSizing.width,
    targetHeight: typeof calibratedSizing.height === 'number' ? calibratedSizing.height : 740,
    minHeight: calibratedSizing.minHeight ?? 320,
    maxHeight: calibratedSizing.maxHeight ?? 1120,
  };

  const controlledPacks = ov.packs ?? (scopedPacks.length > 0 ? scopedPacks : undefined);
  const [internalPacks, setInternalPacks] = useState<StaticTrainingPackSummary[]>(() =>
    (controlledPacks ?? DEFAULT_STATIC_TRAINING_PACKS).map((p, i) => normalizePackSummary(p, i))
  );

  useEffect(() => {
    if (controlledPacks) setInternalPacks(controlledPacks.map((p, i) => normalizePackSummary(p, i)));
  }, [controlledPacks]);

  const packs = React.useMemo(
    () => (controlledPacks ?? internalPacks).map((p, i) => normalizePackSummary(p, i)),
    [controlledPacks, internalPacks]
  );

  const defaultSelectedId = ov.defaultSelectedId ?? 'starter-aerial-striker-pack';
  const [internalSelectedUuid, setInternalSelectedUuid] = useState<string | null>(() => {
    const initial = (controlledPacks ?? DEFAULT_STATIC_TRAINING_PACKS).map((p, i) => normalizePackSummary(p, i));
    const found = initial.find((p) => p.uuid === defaultSelectedId || p.id === defaultSelectedId);
    return found?.uuid ?? initial[0]?.uuid ?? null;
  });

  const selectedPackUuid = ov.selectedPackUuid !== undefined ? ov.selectedPackUuid : scopedSelectedUuid ?? internalSelectedUuid;
  const downCounterEnabled = ov.downCounterEnabled ?? store.downCounterEnabled;
  const downCounterValue = ov.downCounterValue ?? store.downCounterValue;
  const setDownCounterEnabled = ov.onDownCounterEnabledChange ?? store.setDownCounterEnabled;
  const setDownCounterValue = ov.onDownCounterValueChange ?? store.setDownCounterValue;
  const variationToggles = ov.variationToggles ?? store.variationToggles ?? DEFAULT_QUICK_VARIATION_TOGGLES;
  const onUpdateVariationToggles = ov.onUpdateVariationToggles ?? store.setVariationToggles;
  const customVariation = ov.customVariation ?? store.customVariation ?? KEVPERT_LATEST_PRESETS.F7;
  const onUpdateCustomVariation = ov.onUpdateCustomVariation ?? store.setCustomVariation;
  const onSelectKevpertPreset = ov.onSelectKevpertPreset ?? store.applyKevpertVariationPreset;

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
    if (ov.onSelectPack) {
      ov.onSelectPack(uuid);
    } else if (scopedPacks.length > 0) {
      void store.selectPack(uuid, targetScope);
    } else {
      setInternalSelectedUuid(uuid);
    }
    setConfirmDeleteUuid(null);
  };

  const handleCreateSubmit = async () => {
    const title = newTitle.trim() || 'Custom Training Pack';
    const desc = newDescription.trim();
    if (ov.onCreatePack) {
      await ov.onCreatePack(title, desc);
    } else if (scopedPacks.length > 0) {
      await store.createPack(title, desc, targetScope);
    } else {
      const now = Date.now();
      const created = normalizePackSummary({
        uuid: generatePackUUID(),
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
    if (ov.onSavePackMetadata) {
      await ov.onSavePackMetadata(selectedMeta.uuid, trimmedTitle, trimmedDesc);
    } else if (scopedPacks.length > 0) {
      await store.updatePackInfo(selectedMeta.uuid, trimmedTitle, trimmedDesc, targetScope);
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
    if (ov.onUpdatePackTags) {
      await ov.onUpdatePackTags(uuid, nextTags);
    } else if (scopedPacks.length > 0) {
      await store.updatePackTags(uuid, nextTags, targetScope);
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
    if (ov.onDeletePack) {
      await ov.onDeletePack(uuid);
    } else if (scopedPacks.length > 0) {
      await store.deletePack(uuid, targetScope);
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
    if (ov.onExportPack) {
      await ov.onExportPack(pack, editable);
    } else {
      await store.exportPackRCS(pack.uuid, { editable }, targetScope);
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
    if (ov.onExportBatchPacksZip) {
      const zipName = await ov.onExportBatchPacksZip(
        uuids,
        folderLabel,
        editable,
        formatOverride
      );
      setHoveredDesc(
        `Exported ${uuids.length} packs from "${folderLabel}" as ${zipName || '.zip'}`
      );
      return;
    }
    const zipName = await store.exportBatchPacksZip(
      uuids,
      folderLabel,
      { editable, formatOverride },
      targetScope
    );
    setHoveredDesc(
      `Exported ${uuids.length} packs from "${folderLabel}" as ${zipName || '.zip'}`
    );
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    try {
      if (fileList.length > 1 || /\.zip$/i.test(fileList[0].name)) {
        if (ov.onImportBatchPackFiles) {
          const count = await ov.onImportBatchPackFiles(fileList);
          setHoveredDesc(
            `Batch imported ${count || fileList.length} training pack(s) into VFS.`
          );
        } else {
          const importedList = await store.importBatchPacks(fileList, targetScope);
          setHoveredDesc(
            `Batch imported ${importedList.length || fileList.length} training pack(s) into VFS.`
          );
        }
      } else if (ov.onImportPackFile) {
        await ov.onImportPackFile(fileList[0]);
        setHoveredDesc(`Imported pack from ${fileList[0].name}`);
      } else if (scopedPacks.length > 0) {
        await store.importPackRCS(fileList[0], targetScope);
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
              : generatePackUUID(),
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
        onBack={onBack ?? goBack}
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
              createDraft={{
                isCreatingPack,
                setIsCreatingPack,
                newTitle,
                setNewTitle,
                newDescription,
                setNewDescription,
                onCreateSubmit: () => void handleCreateSubmit(),
              }}
              onImportClick={() => {
                ov.onImportPack?.();
                fileInputRef.current?.click();
              }}
              onImportFileChange={(e) => void handleImportFile(e)}
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
              actions={{
                confirmDeleteUuid,
                setConfirmDeleteUuid,
                onPlayPack: (meta) => {
                  if (ov.onStartPlaySession) {
                    ov.onStartPlaySession(meta.uuid);
                  } else {
                    void store.selectPack(meta.uuid, targetScope).then(() => {
                      store.setSessionMode('play');
                      setMatchMode('static-training-pack');
                      bridge.onStartStaticTrainingPack?.('play');
                      closeMenu();
                    });
                  }
                  ov.onPlayPack?.(meta, downCounterEnabled);
                },
                onEditPack: (meta) => {
                  if (ov.onStartEditSession) {
                    void ov.onStartEditSession(meta.uuid);
                  } else {
                    void store.beginEditSession(meta.uuid, targetScope).then(() => {
                      setMatchMode('static-training-pack');
                      bridge.onStartStaticTrainingPack?.('edit');
                      closeMenu();
                    });
                  }
                  ov.onEditPack?.(meta);
                },
                onExportPack: (meta, editable) => void handleExportPack(meta, editable),
                onDeletePack: (uuid) => void handleDeletePack(uuid),
              }}
              applyNewKevpertBind={Boolean(variationToggles.applyNewKevpertBind)}
              onToggleApplyNewKevpertBind={(val) =>
                onUpdateVariationToggles({ applyNewKevpertBind: val })
              }
              onUpdatePackTags={(uuid, nextTags) => void handleUpdatePackTags(uuid, nextTags)}
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
export default Layer4StaticTrainingPackBrowseRecipe;
