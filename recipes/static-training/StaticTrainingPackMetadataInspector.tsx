import React from 'react';
import { Download, Pencil, Play, Save, Target, Trash2 } from 'lucide-react';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import type {
  StaticPackDownCounterOption,
  StaticTrainingPackSummary,
} from './StaticTrainingPackFolderList';

export interface StaticTrainingPackMetadataInspectorProps {
  isLight: boolean;
  selectedMeta: StaticTrainingPackSummary | null;
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  isMetadataDirty: boolean;
  downCounterEnabled: boolean;
  setDownCounterEnabled: (val: boolean) => void;
  downCounterValue: StaticPackDownCounterOption;
  setDownCounterValue: (val: StaticPackDownCounterOption) => void;
  confirmDeleteUuid: string | null;
  setConfirmDeleteUuid: (uuid: string | null) => void;
  onSaveMetadata: () => void;
  onPlayPack: (meta: StaticTrainingPackSummary) => void;
  onEditPack: (meta: StaticTrainingPackSummary) => void;
  onExportPack: (meta: StaticTrainingPackSummary) => void;
  onDeletePack: (uuid: string) => void;
  onHoverDesc: (desc: string | null) => void;
}

export const StaticTrainingPackMetadataInspector: React.FC<
  StaticTrainingPackMetadataInspectorProps
> = React.memo(
  ({
    isLight,
    selectedMeta,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    isMetadataDirty,
    downCounterEnabled,
    setDownCounterEnabled,
    downCounterValue,
    setDownCounterValue,
    confirmDeleteUuid,
    setConfirmDeleteUuid,
    onSaveMetadata,
    onPlayPack,
    onEditPack,
    onExportPack,
    onDeletePack,
    onHoverDesc,
  }) => {
    return (
      <div
        className={`flex-1 min-h-0 flex flex-col justify-between rounded-xl border p-3.5 overflow-y-auto ${
          isLight
            ? 'bg-white border-neutral-200/90 text-neutral-900'
            : 'bg-neutral-900/70 border-neutral-800 text-neutral-100'
        }`}
      >
        {selectedMeta ? (
          <>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider ${
                      isLight ? 'text-neutral-500' : 'text-neutral-400'
                    }`}
                  >
                    PACK METADATA • {selectedMeta.itemCount}{' '}
                    {selectedMeta.itemCount === 1 ? 'SCENARIO' : 'SCENARIOS'}
                  </span>
                  <span
                    className={`text-[10px] font-mono truncate max-w-[170px] ${
                      isLight ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                    title={`/static-training-pack/${selectedMeta.uuid}`}
                  >
                    ID: {selectedMeta.uuid.slice(0, 8)}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold opacity-70">Pack Name</label>
                    <button
                      type="button"
                      disabled={!isMetadataDirty}
                      onClick={onSaveMetadata}
                      onMouseEnter={() =>
                        onHoverDesc(
                          isMetadataDirty
                            ? 'Save updated Pack Name & Description to global metadata.'
                            : 'No unsaved metadata changes.'
                        )
                      }
                      onMouseLeave={() => onHoverDesc(null)}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[10px] font-bold transition-all ${
                        isMetadataDirty
                          ? isLight
                            ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-900 text-white cursor-pointer active:scale-95'
                            : 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-neutral-950 cursor-pointer active:scale-95'
                          : isLight
                          ? 'bg-neutral-100 border-neutral-200 text-neutral-400 opacity-50 cursor-not-allowed'
                          : 'bg-neutral-850 border-neutral-800 text-neutral-500 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <Save className="h-3 w-3" />
                      <span>Save</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none transition-colors ${
                      isLight
                        ? 'bg-neutral-50 focus:bg-white border-neutral-300 text-neutral-900'
                        : 'bg-neutral-850 focus:bg-neutral-800 border-neutral-700 text-neutral-100'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold opacity-70">Description</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none resize-none transition-colors ${
                      isLight
                        ? 'bg-neutral-50 focus:bg-white border-neutral-300 text-neutral-800'
                        : 'bg-neutral-850 focus:bg-neutral-800 border-neutral-700 text-neutral-200'
                    }`}
                  />
                </div>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex flex-col gap-2 ${
                  isLight
                    ? 'bg-neutral-50 border-neutral-200'
                    : 'bg-neutral-850/70 border-neutral-800'
                }`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setDownCounterEnabled(!downCounterEnabled)}
                  onMouseEnter={() =>
                    onHoverDesc(
                      'When OFF (default), shot starts on first driving input. When ON, holds stationary with 3/2/1 countdown beep + Go cue.'
                    )
                  }
                  onMouseLeave={() => onHoverDesc(null)}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">Pre-Launch Down Counter</span>
                    <span
                      className={`text-[10px] ${
                        isLight ? 'text-neutral-500' : 'text-neutral-400'
                      }`}
                    >
                      {downCounterEnabled
                        ? `Hold ${downCounterValue + 1}s (${downCounterValue}s beep -> GO, pre-input buffered)`
                        : 'Disabled (Instant launch on first driving input)'}
                    </span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ToggleSwitch
                      checked={downCounterEnabled}
                      onCheckedChange={(checked) => setDownCounterEnabled(checked)}
                      isLight={isLight}
                      variant="neutral"
                    />
                  </div>
                </div>

                {downCounterEnabled && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] font-medium opacity-80">
                      Countdown Seconds
                    </span>
                    <SegmentedSwitch
                      options={[
                        { value: '3', label: '3s' },
                        { value: '2', label: '2s' },
                        { value: '1', label: '1s (Default)' },
                      ]}
                      value={String(downCounterValue)}
                      onValueChange={(val) =>
                        setDownCounterValue(Number(val) as StaticPackDownCounterOption)
                      }
                      isLight={isLight}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-neutral-500/15 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onPlayPack(selectedMeta)}
                  onMouseEnter={() =>
                    onHoverDesc(
                      'Start playing this training pack. Hotkeys: [R] Reset Shot, [[] Prev Shot, []] Next Shot.'
                    )
                  }
                  onMouseLeave={() => onHoverDesc(null)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer active:scale-98 ${
                    isLight
                      ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-900 text-white shadow-xs'
                      : 'bg-white hover:bg-neutral-200 border-white text-neutral-900 shadow-xs'
                  }`}
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>PLAY PACK</span>
                </button>

                <button
                  type="button"
                  onClick={() => onEditPack(selectedMeta)}
                  onMouseEnter={() =>
                    onHoverDesc(
                      'Enter Edit Mode with Live Preview [TAB], 3D Car/Ball trajectory aiming, and Shot List reordering.'
                    )
                  }
                  onMouseLeave={() => onHoverDesc(null)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer active:scale-98 ${
                    isLight
                      ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-900'
                      : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-100'
                  }`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>EDIT PACK</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!isMetadataDirty}
                    onClick={onSaveMetadata}
                    onMouseEnter={() =>
                      onHoverDesc('Save global pack metadata (Pack Name & Description).')
                    }
                    onMouseLeave={() => onHoverDesc(null)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-[11px] font-semibold transition-all ${
                      isMetadataDirty
                        ? isLight
                          ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-900 text-white cursor-pointer'
                          : 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-neutral-950 font-bold cursor-pointer'
                        : isLight
                        ? 'bg-neutral-50 border-neutral-200 text-neutral-400 opacity-50 cursor-not-allowed'
                        : 'bg-neutral-850 border-neutral-800 text-neutral-500 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onExportPack(selectedMeta)}
                    onMouseEnter={() =>
                      onHoverDesc(
                        'Export this pack as a GZIP-compressed <Title>_<UUID>.RCSPack file.'
                      )
                    }
                    onMouseLeave={() => onHoverDesc(null)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                      isLight
                        ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                        : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export .RCSPack</span>
                  </button>
                </div>

                {confirmDeleteUuid === selectedMeta.uuid ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-red-500">
                      Confirm Delete?
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeletePack(selectedMeta.uuid)}
                      className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteUuid(null)}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-medium cursor-pointer ${
                        isLight
                          ? 'bg-neutral-100 border-neutral-300 text-neutral-700'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteUuid(selectedMeta.uuid)}
                    onMouseEnter={() =>
                      onHoverDesc(
                        'Delete this training pack (requires double-check confirmation).'
                      )
                    }
                    onMouseLeave={() => onHoverDesc(null)}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                      isLight
                        ? 'bg-red-50/70 hover:bg-red-100 border-red-200 text-red-700'
                        : 'bg-red-950/30 hover:bg-red-900/40 border-red-900/60 text-red-300'
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Pack</span>
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <Target className="h-8 w-8 mb-2" />
            <span className="text-xs font-semibold">Select or Create a Training Pack</span>
          </div>
        )}
      </div>
    );
  }
);
StaticTrainingPackMetadataInspector.displayName = 'StaticTrainingPackMetadataInspector';
