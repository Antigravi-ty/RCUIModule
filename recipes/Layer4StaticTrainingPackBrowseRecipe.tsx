import React, { useEffect, useRef, useState } from 'react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { DEFAULT_PANEL_SIZING, useMenuLayoutStore } from '../stores/menuLayoutStore';
import {
  StaticTrainingPackFolderList,
  type StaticPackDownCounterOption,
  type StaticTrainingPackSummary,
} from './static-training/StaticTrainingPackFolderList';
import { StaticTrainingPackToolbar } from './static-training/StaticTrainingPackToolbar';
import { StaticTrainingPackMetadataInspector } from './static-training/StaticTrainingPackMetadataInspector';

export type { StaticPackDownCounterOption, StaticTrainingPackSummary };

export interface Layer4StaticTrainingPackBrowseRecipeProps {
  isLight?: boolean;
  packs?: StaticTrainingPackSummary[];
  selectedPackUuid?: string | null;
  onSelectPack?: (uuid: string) => void;
  defaultSelectedId?: string;
  defaultUseDownCounter?: boolean;
  downCounterEnabled?: boolean;
  onDownCounterEnabledChange?: (enabled: boolean) => void;
  downCounterValue?: StaticPackDownCounterOption;
  onDownCounterValueChange?: (val: StaticPackDownCounterOption) => void;
  onCreatePack?: (title: string, description: string) => Promise<void> | void;
  onSavePackMetadata?: (uuid: string, title: string, description: string) => Promise<void> | void;
  onDeletePack?: (uuid: string) => Promise<void> | void;
  onImportPackFile?: (file: File) => Promise<void> | void;
  onBack?: () => void;
  onStartPlaySession?: (uuid: string) => void;
  onStartEditSession?: (uuid: string) => void;
  onPlayPack?: (pack: StaticTrainingPackSummary, useDownCounter: boolean) => void;
  onEditPack?: (pack: StaticTrainingPackSummary) => void;
  onImportPack?: () => void;
  onExportPack?: (pack: StaticTrainingPackSummary) => Promise<void> | void;
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
    createdAt: 1740000000000,
    updatedAt: 1740000000000,
  },
  {
    uuid: '9d8725b4-3c11-48f0-a210-12b49d8725b4',
    title: 'Wall-to-Air Dribble Mastery',
    description:
      '12 progressive mid-field wall setups with top-corner goal mouth barrier masks.',
    itemCount: 12,
    createdAt: 1739836800000,
    updatedAt: 1739836800000,
  },
  {
    uuid: '4a1977e2-90d1-41c4-b812-4a1977e290d1',
    title: 'Double Tap & Backboard Reads',
    description:
      'High-speed backboard clears and offensive double-tap angles with randomized initial impulse.',
    itemCount: 8,
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
 * - Left column (5 cols): Folder / Training Packs list (`StaticTrainingPackFolderList`)
 * - Right column (7 cols):
 *   - Upper section: Import .RCSPack & Create Pack toolbar (`StaticTrainingPackToolbar`)
 *   - Lower section: Selected Pack Metadata & Actions (`StaticTrainingPackMetadataInspector`)
 */
export const Layer4StaticTrainingPackBrowseRecipe: React.FC<
  Layer4StaticTrainingPackBrowseRecipeProps
> = React.memo(({
  isLight = false,
  packs: controlledPacks,
  selectedPackUuid: controlledSelectedUuid,
  onSelectPack,
  defaultSelectedId = 'starter-aerial-striker-pack',
  defaultUseDownCounter = false,
  downCounterEnabled: controlledDownCounterEnabled,
  onDownCounterEnabledChange,
  downCounterValue: controlledDownCounterValue,
  onDownCounterValueChange,
  onCreatePack,
  onSavePackMetadata,
  onDeletePack,
  onImportPackFile,
  onBack = () => {},
  onStartPlaySession,
  onStartEditSession,
  onPlayPack,
  onEditPack,
  onImportPack,
  onExportPack,
  className = '',
}) => {
  const sizing = useMenuLayoutStore(
    (s) => s.panels?.['layer4-static-training-pack'] ?? DEFAULT_PANEL_SIZING['layer4-static-training-pack']
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
    const initial = (controlledPacks ?? DEFAULT_PACKS).map((p, i) => normalizePackSummary(p, i));
    const found = initial.find((p) => p.uuid === defaultSelectedId || p.id === defaultSelectedId);
    return found?.uuid ?? initial[0]?.uuid ?? null;
  });

  const selectedPackUuid =
    controlledSelectedUuid !== undefined ? controlledSelectedUuid : internalSelectedUuid;

  const [internalDownCounterEnabled, setInternalDownCounterEnabled] = useState<boolean>(
    defaultUseDownCounter
  );
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
    const desc = newDescription.trim() || 'Custom static training pack scenarios.';
    if (onCreatePack) {
      await onCreatePack(title, desc);
    } else {
      const now = Date.now();
      const created = normalizePackSummary({
        uuid: generateUUID(),
        title,
        description: desc,
        itemCount: 1,
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

  const handleExportPack = async (pack: StaticTrainingPackSummary) => {
    if (onExportPack) {
      await onExportPack(pack);
    }
    const safeTitle =
      (pack.title || 'TrainingPack')
        .trim()
        .replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'TrainingPack';
    const filename = `${safeTitle}_${pack.uuid}.RCSPack`;
    setHoveredDesc(`Exported ${filename}`);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (onImportPackFile) {
        await onImportPackFile(file);
        setHoveredDesc(`Imported pack from ${file.name}`);
      } else {
        const text = await decodeRCSPackText(file);
        const parsed = JSON.parse(text);
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
              : file.name.replace(/\.(rcspack|gz|json)$/i, '') || 'Imported Pack',
          description:
            typeof rawMeta.description === 'string'
              ? rawMeta.description
              : 'Imported .RCSPack static training pack archive.',
          itemCount:
            rawItems.length > 0
              ? rawItems.length
              : typeof rawMeta.itemCount === 'number'
              ? rawMeta.itemCount
              : 1,
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
    } catch (err: any) {
      setHoveredDesc(`Import failed: ${err?.message || 'Invalid .RCSPack file'}`);
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
        title="STATIC TRAINING PACKS"
        onBack={onBack}
        isLight={isLight}
      />

      <PanelContent scrollable={false} className="flex flex-col gap-3 h-full overflow-hidden">
        <div className="grid grid-cols-12 gap-3.5 grow min-h-0 overflow-hidden">
          <StaticTrainingPackFolderList
            isLight={isLight}
            packs={packs}
            selectedUuid={selectedMeta?.uuid}
            onSelectPack={handleSelectPack}
            onHoverDesc={setHoveredDesc}
          />

          <div className="col-span-7 flex flex-col gap-2.5 min-h-0 overflow-hidden">
            <StaticTrainingPackToolbar
              isLight={isLight}
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
              selectedMeta={selectedMeta}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              editDescription={editDescription}
              setEditDescription={setEditDescription}
              isMetadataDirty={isMetadataDirty}
              downCounterEnabled={downCounterEnabled}
              setDownCounterEnabled={setDownCounterEnabled}
              downCounterValue={downCounterValue}
              setDownCounterValue={setDownCounterValue}
              confirmDeleteUuid={confirmDeleteUuid}
              setConfirmDeleteUuid={setConfirmDeleteUuid}
              onSaveMetadata={() => void handleSaveMetadata()}
              onPlayPack={(meta) => {
                onStartPlaySession?.(meta.uuid);
                onPlayPack?.(meta, downCounterEnabled);
              }}
              onEditPack={(meta) => {
                onStartEditSession?.(meta.uuid);
                onEditPack?.(meta);
              }}
              onExportPack={(meta) => void handleExportPack(meta)}
              onDeletePack={(uuid) => void handleDeletePack(uuid)}
              onHoverDesc={setHoveredDesc}
            />
          </div>
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Select a Static Training Pack on the left to Play, Edit, Export (.RCSPack), or Delete."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
});

Layer4StaticTrainingPackBrowseRecipe.displayName = 'Layer4StaticTrainingPackBrowseRecipe';
