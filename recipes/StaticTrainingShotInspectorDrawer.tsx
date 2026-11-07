import React, { useState, useRef } from 'react';
import { Info } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { KeycapBadge } from '../primitives/KeycapBadge';
import { CollapsibleNumberedRailList } from '../compounds/CollapsibleNumberedRailList';
import { dialogue } from '../compounds/dialogue/dialogueStore';
import {
  INITIAL_TRAINING_SHOTS,
  MAX_SHOTS_PER_PACK,
  createDefaultShotItem,
  formatShotSubtitle,
  type EditSubMode,
  type StaticTrainingShotItem,
} from './static-training/staticTrainingTypes';
import { StaticTrainingShotInspectorView } from './static-training/StaticTrainingShotInspectorView';
import {
  useStaticTrainingPackStore,
  getActiveEditItemVariable,
  mutateActiveEditItemVariable,
} from '../stores/staticTrainingPackStore';
import { useStoreSnapshotOverride } from '../stores/storeSnapshotScope';
import type { SurfaceMeta, StandardSurfaceProps } from '../manifest/surfaceMetaTypes';

export const SURFACE_META: SurfaceMeta = {
  id: 'recipe:StaticTrainingShotInspectorDrawer',
  title: 'Static Training Shot Inspector',
  layer: 'layer4',
  menuGroup: 'menu-layer',
  defaultSizing: { mode: 'fixed', width: 520, height: 680, minHeight: 320, maxHeight: 1080 },
};

export interface StaticTrainingShotInspectorStateOverride {
  packTitle?: string;
  shots?: StaticTrainingShotItem[];
  onShotsChange?: (shots: StaticTrainingShotItem[]) => void;
  selectedShotIndex?: number;
  onSelectedShotIndexChange?: (idx: number) => void;
  isInspectingShot?: boolean;
  onInspectingShotChange?: (inspecting: boolean) => void;
  editSubMode?: EditSubMode;
  onEditSubModeChange?: (mode: EditSubMode) => void;
  currentShotOverride?: StaticTrainingShotItem | null;
  isDirty?: boolean;
  onMutateCurrentShot?: (updater: (draft: StaticTrainingShotItem) => void) => void;
  onSaveCurrentShot?: () => void | Promise<void>;
  onAddNewShot?: () => void | Promise<void>;
  onDuplicateShot?: (idx: number) => void | Promise<void>;
  onReorderShot?: (fromIdx: number, toIdx: number) => void | Promise<void>;
  onDeleteShot?: (idx: number) => void | Promise<void>;
  onExportSingleShot?: (idx: number) => void;
  onImportSingleShot?: (file: File) => void | Promise<void>;
  onExitSession?: (action: 'save' | 'ignore') => void | Promise<void>;
}

export interface StaticTrainingShotInspectorDrawerProps extends StandardSurfaceProps {
  transparent?: boolean;
  packTitle?: string;
  /** Callback when user clicks Collapse [TAB] in header */
  onCollapseDrawer?: () => void;
  stateOverride?: StaticTrainingShotInspectorStateOverride;
}

/**
 * Standalone helper to spawn the Exit Edit Mode confirmation dialogue (`Save / Ignore / Cancel`).
 * Designed to be triggered from the independent Main Menu (`ESC`) rather than coupling an Exit button into the Edge Inspector header.
 */
export function openStaticTrainingExitConfirmDialogue(
  onConfirm?: (action: 'save' | 'ignore') => void | Promise<void>
): void {
  dialogue.show({
    id: 'static-training-exit-edit-confirm',
    title: 'EXIT EDIT MODE',
    tone: 'warning',
    icon: 'triangle-alert',
    maxWidth: 500,
    content: 'Do you want to save your previous edits before exiting Edit Mode?',
    buttons: [
      {
        label: 'Save',
        variant: 'primary',
        onClick: async () => {
          await onConfirm?.('save');
        },
      },
      {
        label: 'Ignore',
        variant: 'danger',
        onClick: async () => {
          await onConfirm?.('ignore');
        },
      },
      {
        label: 'Cancel',
        variant: 'outline',
      },
    ],
  });
}

/**
 * [L6 Recipe] StaticTrainingShotInspectorDrawer
 *
 * Specialized inner content drawer for Static Training Pack Edit Mode (Six Echo / 6E):
 * - Header Left: Clean title (no Back button — clicking the active `#number` in the rail toggles between Full Shot List and Detail Rail).
 * - Header Right: Only `Collapse [TAB]` button (`Exit Edit Mode` lives inside the decoupled `[ESC]` Main Menu).
 * - Body: `CollapsibleNumberedRailList` — clicking a shot compresses the list from right to left into a narrow `#01..#99` rail,
 *   morphs the 4 top action buttons into compact `+` (black) and `?` (orange) icons, and slides in `StaticTrainingShotInspectorView`.
 *   Clicking the currently active `#number` in the rail expands back to the full Shot List.
 * - Footer: Displays live hover descriptions from any option or control in the list or detail inspector.
 */
export const StaticTrainingShotInspectorDrawer: React.FC<StaticTrainingShotInspectorDrawerProps> = ({
  isLight = false,
  transparent = true,
  packTitle: propPackTitle,
  onCollapseDrawer,
  stateOverride,
}) => {
  const scopeOverride =
    useStoreSnapshotOverride<StaticTrainingShotInspectorStateOverride>('staticTrainingShotInspector');
  const ov = { ...scopeOverride, ...stateOverride };

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
  void editVarVersion;

  const packTitle = propPackTitle ?? ov.packTitle ?? activePack?.metadata.title ?? 'Aerial Striker Pack';
  const controlledShots =
    ov.shots ?? (activePack?.items && activePack.items.length > 0 ? activePack.items : undefined);
  const onShotsChange = ov.onShotsChange;
  const controlledInspecting = ov.isInspectingShot ?? storeIsEditingItem;
  const currentShotOverride =
    ov.currentShotOverride !== undefined
      ? ov.currentShotOverride
      : controlledInspecting && !ov.shots
      ? getActiveEditItemVariable()
      : null;
  const controlledIndex = ov.selectedShotIndex ?? storeShotIndex;
  const onSelectedShotIndexChange = (idx: number) => {
    ov.onSelectedShotIndexChange?.(idx);
    if (!ov.shots && activePack) enterItemEditMode(idx);
  };
  const onInspectingShotChange = (inspecting: boolean) => {
    ov.onInspectingShotChange?.(inspecting);
    if (!inspecting && !ov.shots && activePack) void deselectEditShot();
  };
  const controlledSubMode = ov.editSubMode ?? storeEditSubMode;
  const onEditSubModeChange = ov.onEditSubModeChange ?? setStoreEditSubMode;
  const controlledIsDirty = ov.isDirty ?? (activePack ? isCurrentShotDirty() : undefined);

  const onMutateCurrentShot =
    ov.onMutateCurrentShot ??
    (activePack && !ov.shots
      ? (updater: (draft: StaticTrainingShotItem) => void) => mutateActiveEditItemVariable(updater)
      : undefined);
  const onSaveCurrentShot =
    ov.onSaveCurrentShot ?? (activePack ? saveCurrentShotToEditWorkspace : undefined);
  const onAddNewShot = ov.onAddNewShot ?? (activePack ? addNewShot : undefined);
  const onDuplicateShot = ov.onDuplicateShot ?? (activePack ? duplicateShot : undefined);
  const onReorderShot = ov.onReorderShot ?? (activePack ? reorderShot : undefined);
  const onDeleteShot = ov.onDeleteShot ?? (activePack ? deleteShot : undefined);
  const onExportSingleShot = ov.onExportSingleShot ?? (activePack ? exportSingleShotJson : undefined);
  const onImportSingleShot = ov.onImportSingleShot ?? (activePack ? importSingleShotJson : undefined);

  const [internalShots, setInternalShots] = useState<StaticTrainingShotItem[]>(
    INITIAL_TRAINING_SHOTS
  );
  const [internalIndex, setInternalIndex] = useState<number>(0);
  const [internalInspecting, setInternalInspecting] = useState<boolean>(false);
  const [internalSubMode, setInternalSubMode] = useState<EditSubMode>('car-heading');
  const [internalIsDirty, setInternalIsDirty] = useState<boolean>(false);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const items = controlledShots ?? internalShots;
  const setItems = (next: StaticTrainingShotItem[]) => {
    if (onShotsChange) onShotsChange(next);
    else setInternalShots(next);
  };

  const selectedIndex = controlledIndex ?? internalIndex;
  const setSelectedIndex = (idx: number) => {
    if (onSelectedShotIndexChange) onSelectedShotIndexChange(idx);
    else setInternalIndex(idx);
  };

  const isInspecting = controlledInspecting ?? internalInspecting;
  const setIsInspecting = (val: boolean) => {
    if (onInspectingShotChange) onInspectingShotChange(val);
    else setInternalInspecting(val);
  };

  const editSubMode = controlledSubMode ?? internalSubMode;
  const setEditSubMode = (mode: EditSubMode) => {
    if (onEditSubModeChange) onEditSubModeChange(mode);
    else setInternalSubMode(mode);
  };

  const isDirty = controlledIsDirty ?? internalIsDirty;

  const safeIndex = Math.max(0, Math.min(Math.max(0, items.length - 1), selectedIndex));
  const currentShot = currentShotOverride || items[safeIndex] || items[0] || null;

  const handleBackToShotList = () => {
    setIsInspecting(false);
    setHoveredDesc('Returned to full Shot List view.');
  };

  const handleSelectShot = (idx: number) => {
    if (isInspecting && idx === safeIndex) {
      handleBackToShotList();
      return;
    }
    setSelectedIndex(idx);
    setIsInspecting(true);
  };

  const handleMutateCurrentShot = (updater: (draft: StaticTrainingShotItem) => void) => {
    if (onMutateCurrentShot) {
      onMutateCurrentShot(updater);
      return;
    }
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
    const next = items.map((it, idx) => (idx === safeIndex ? cloned : it));
    setItems(next);
    setInternalIsDirty(true);
  };

  const handleAddNewShot = async () => {
    if (items.length >= MAX_SHOTS_PER_PACK) return;
    const newIdx = items.length;
    if (onAddNewShot) {
      await onAddNewShot();
      setHoveredDesc(`Created #${String(newIdx + 1).padStart(2, '0')} (Shot ${newIdx + 1}).`);
      return;
    }
    const newShot = createDefaultShotItem(newIdx);
    const next = [...items, newShot];
    setItems(next);
    setSelectedIndex(newIdx);
    setInternalIsDirty(true);
    setHoveredDesc(`Created #${String(newIdx + 1).padStart(2, '0')} (${newShot.name}).`);
  };

  const handleDuplicateShot = async (idx: number) => {
    if (items.length >= MAX_SHOTS_PER_PACK) return;
    if (onDuplicateShot) {
      await onDuplicateShot(idx);
      setHoveredDesc(
        `Duplicated #${String(idx + 1).padStart(2, '0')} -> #${String(idx + 2).padStart(2, '0')}.`
      );
      return;
    }
    const source = items[idx] || currentShot;
    if (!source) return;
    const copy: StaticTrainingShotItem = {
      ...source,
      id: `shot-${Date.now()}-${idx + 1}`,
      name: `${source.name} (Copy)`,
      car: {
        ...source.car,
        location: [...source.car.location] as [number, number, number],
      },
      ball: {
        ...source.ball,
        location: [...source.ball.location] as [number, number, number],
        angularVelocity: [...source.ball.angularVelocity] as [number, number, number],
      },
    };
    const next = [
      ...items.slice(0, idx + 1),
      copy,
      ...items.slice(idx + 1),
    ].map((it, i) => ({ ...it, index: i }));
    setItems(next);
    setSelectedIndex(idx + 1);
    setInternalIsDirty(true);
    setHoveredDesc(
      `Duplicated #${String(idx + 1).padStart(2, '0')} -> #${String(idx + 2).padStart(2, '0')}.`
    );
  };

  const handleReorderShot = async (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length || fromIdx === toIdx) return;
    if (onReorderShot) {
      await onReorderShot(fromIdx, toIdx);
      return;
    }
    const copy = [...items];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    const next = copy.map((it, i) => ({ ...it, index: i }));
    setItems(next);
    setSelectedIndex(toIdx);
    setInternalIsDirty(true);
  };

  const handleDeleteShot = async (idx: number) => {
    if (items.length <= 1) return;
    if (onDeleteShot) {
      await onDeleteShot(idx);
      setHoveredDesc(`Deleted shot #${String(idx + 1).padStart(2, '0')}.`);
      return;
    }
    const next = items
      .filter((_, i) => i !== idx)
      .map((it, i) => ({ ...it, index: i }));
    const nextIdx = Math.max(
      0,
      Math.min(next.length - 1, safeIndex >= idx ? safeIndex - 1 : safeIndex)
    );
    setItems(next);
    setSelectedIndex(nextIdx);
    setInternalIsDirty(true);
    setHoveredDesc(`Deleted shot #${String(idx + 1).padStart(2, '0')}.`);
  };

  const handleExportSingleShot = (idx: number) => {
    const target = items[idx];
    if (!target) return;
    onExportSingleShot?.(idx);
    setHoveredDesc(`Exported #${String(idx + 1).padStart(2, '0')} (${target.name}).json`);
  };

  const handleImportSingleShot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (onImportSingleShot) {
        await onImportSingleShot(file);
      }
      setHoveredDesc(`Imported shot configuration from ${file.name}.`);
    } catch (err: any) {
      console.error('[StaticTrainingShotInspectorDrawer] Failed to import shot JSON:', err);
      setHoveredDesc(`Failed to import shot JSON: ${err?.message || 'Invalid JSON'}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleShowHelp = () => {
    dialogue.show({
      id: 'static-training-editor-help',
      title: 'HELP',
      tone: 'info',
      icon: 'circle-help',
      maxWidth: 620,
      content: (
        <div className="flex flex-col gap-2.5 text-left text-xs leading-relaxed">
          <div className="font-semibold text-amber-500">
            Static Training Pack 3D Editor Controls & Shortcuts
          </div>
          <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px]">
            <div>
              <span className="font-bold text-sky-500">[TAB]</span> : Collapse / Expand Edge Inspector Drawer to manipulate the 3D scene directly.
            </div>
            <div>
              <span className="font-bold text-sky-500">[ESC]</span> : Open / Close in-game Main Menu (select <span className="text-rose-400">Exit Edit Mode</span> inside the menu to save or discard session edits).
            </div>
            <div>
              <span className="font-bold text-sky-500">[9] / [0] or Right-Click</span> : Cycle between the Edit Sub-Modes (Car Heading, Car Speed, Ball Speed, Free Camera).
            </div>
            <div>
              <span className="font-bold text-sky-500">[W / A / S / D]</span> : Move the active target horizontally (Car in Car modes, Ball in Ball mode, Camera in Free Cam).
            </div>
            <div>
              <span className="font-bold text-sky-500">[Space] / [V]</span> : Move Up / Move Down. Pressing [V] at ground level snaps the car to ground (60-frame suspension settle).
            </div>
            <div>
              <span className="font-bold text-sky-500">[Mouse Drag]</span> : Aim 3D direction (Car Nose Heading + Pitch, Car Velocity Yaw + Pitch, Ball Velocity Yaw + Pitch, or Free Cam Look).
            </div>
            <div>
              <span className="font-bold text-sky-500">[Q] / [E]</span> : Adjust Car Air Roll angle in Car Heading mode.
            </div>
            <div>
              <span className="font-bold text-sky-500">[O] / [P]</span> : Decrease / Increase Car Boost amount (press [P] at 100 to enable Unlimited Boost INF).
            </div>
            <div>
              <span className="font-bold text-sky-500">[[] / []]</span> : Decrease / Increase launch speed. Pressing [[] at 0 Ball Speed toggles Kickoff Freeze.
            </div>
            <div>
              <span className="font-bold text-sky-500">[F]</span> : Switch relative ball camera horizontal lateral offset side (flips between right +offset and left -offset).
            </div>
            <div>
              <span className="font-bold text-emerald-500">[T]</span> : Toggle trajectory preview test in any Edit sub-mode (launches Car & Ball while keeping the camera at its unlaunched viewpoint).
            </div>
            <div>
              <span className="font-bold text-emerald-500">[G]</span> : Test Single Shot in playable 3D arena (press [G] again to return to editor).
            </div>
          </div>
        </div>
      ),
      buttons: [
        {
          label: 'Got It',
          variant: 'primary',
        },
      ],
    });
  };

  const railItems = items.map((shot, idx) => {
    const effectiveShot = idx === safeIndex && currentShot ? currentShot : shot;
    return {
      id: effectiveShot.id || String(idx),
      index: idx,
      title: effectiveShot.name,
      subtitle: formatShotSubtitle(effectiveShot),
    };
  });

  return (
    <PanelContainer
      isLight={isLight}
      transparent={transparent}
      className="w-full h-full"
    >
      {/* Slim Top Header: Left = Clean title (no Back button), Right = Collapse [TAB] */}
      <PanelHeader
        title={
          isInspecting
            ? `EDIT SHOT #${String(safeIndex + 1).padStart(2, '0')} · ${currentShot?.name || packTitle}`
            : `EDIT: ${packTitle}`
        }
        isLight={isLight}
        className="!pl-3 !pr-2 !py-2"
        titleClassName="!text-xs !font-bold tracking-wider"
        rightElement={
          onCollapseDrawer ? (
            <button
              type="button"
              data-header-button="collapse-tab"
              onClick={onCollapseDrawer}
              onMouseEnter={() =>
                setHoveredDesc(
                  'Press TAB or click to collapse Edge Inspector Drawer to the side pill without darkening the 3D arena.'
                )
              }
              onMouseLeave={() => setHoveredDesc(null)}
              className={`h-7 flex items-center gap-1.5 pl-2.5 pr-[3px] py-[3px] rounded-lg border text-xs transition-colors cursor-pointer select-none active:scale-95 ${
                isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800 shadow-2xs'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200 shadow-2xs'
              }`}
            >
              <span
                className={`text-[11px] font-sans font-medium leading-none ${
                  isLight ? 'text-neutral-700' : 'text-neutral-300'
                }`}
              >
                Collapse
              </span>
              <KeycapBadge
                shortcut="TAB"
                size="sm"
                isLight={isLight}
                className="h-5 !min-h-[20px] !py-0 !px-1.5 !rounded-[5px]"
              />
            </button>
          ) : undefined
        }
      />

      <PanelContent
        scrollable={false}
        className="!p-3 flex flex-col gap-2.5 h-full min-h-0 overflow-hidden"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportSingleShot}
          className="hidden"
        />

        <CollapsibleNumberedRailList
          isCollapsedToRail={isInspecting}
          items={railItems}
          selectedIndex={safeIndex}
          maxItems={MAX_SHOTS_PER_PACK}
          collapsedRailWidth={60}
          isLight={isLight}
          onSelectItem={handleSelectShot}
          onAddNew={() => void handleAddNewShot()}
          onImport={() => fileInputRef.current?.click()}
          onShowHelp={handleShowHelp}
          onDuplicate={(idx) => void handleDuplicateShot(idx)}
          onReorder={(fromIdx, toIdx) => void handleReorderShot(fromIdx, toIdx)}
          onExportItem={handleExportSingleShot}
          onDeleteItem={(idx) => void handleDeleteShot(idx)}
          onHoverDescription={setHoveredDesc}
          detailContent={
            currentShot ? (
              <StaticTrainingShotInspectorView
                isLight={isLight}
                currentShot={currentShot}
                editSubMode={editSubMode}
                isDirty={isDirty}
                onChangeSubMode={setEditSubMode}
                onMutateShot={handleMutateCurrentShot}
                onSaveShot={() => {
                  if (onSaveCurrentShot) {
                    void onSaveCurrentShot();
                  } else {
                    setInternalIsDirty(false);
                  }
                }}
                onHoverDesc={setHoveredDesc}
              />
            ) : null
          }
        />
      </PanelContent>

      <PanelFooter isLight={isLight} className="!px-3 !py-2">
        <div className="flex items-center gap-2 w-full text-xs truncate">
          <Info className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span
            className={`truncate transition-colors duration-150 ${
              hoveredDesc
                ? isLight
                  ? 'text-neutral-900 font-medium'
                  : 'text-neutral-100 font-medium'
                : isLight
                ? 'text-neutral-500'
                : 'text-neutral-400'
            }`}
          >
            {hoveredDesc ||
              'Click active #number to toggle List/Detail · [TAB] Collapse Drawer · [ESC] Main Menu.'}
          </span>
        </div>
      </PanelFooter>
    </PanelContainer>
  );
};
