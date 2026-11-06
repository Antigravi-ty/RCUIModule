import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Code2,
  Plus,
  Save,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import {
  isVariationMatchingLatestPreset,
  resolveEffectiveRecommendedVariation,
} from '../../config/staticTrainingVariationTypes';
import type {
  StaticPackDownCounterOption,
  StaticTrainingPackSummary,
} from './StaticTrainingPackFolderList';
import { StaticTrainingPackInspectorActions } from './StaticTrainingPackInspectorActions';

export interface StaticTrainingPackMetadataDraft {
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  isMetadataDirty: boolean;
  onSaveMetadata: () => void;
}

export interface StaticTrainingPackDownCounterControl {
  downCounterEnabled: boolean;
  setDownCounterEnabled: (val: boolean) => void;
  downCounterValue: StaticPackDownCounterOption;
  setDownCounterValue: (val: StaticPackDownCounterOption) => void;
}

export interface StaticTrainingPackMetadataInspectorProps {
  isLight: boolean;
  isDevMode?: boolean;
  selectedMeta: StaticTrainingPackSummary | null;
  draft: StaticTrainingPackMetadataDraft;
  downCounter: StaticTrainingPackDownCounterControl;
  confirmDeleteUuid: string | null;
  setConfirmDeleteUuid: (val: string | null) => void;
  applyNewKevpertBind?: boolean;
  onToggleApplyNewKevpertBind?: (val: boolean) => void;
  onUpdatePackTags?: (uuid: string, nextTags: string[]) => void;
  onPlayPack: (meta: StaticTrainingPackSummary) => void;
  onEditPack: (meta: StaticTrainingPackSummary) => void;
  onExportPack: (meta: StaticTrainingPackSummary, editable: boolean) => void;
  onDeletePack: (uuid: string) => void;
  onHoverDesc: (desc: string | null) => void;
}

export const StaticTrainingPackMetadataInspector: React.FC<
  StaticTrainingPackMetadataInspectorProps
> = React.memo(
  ({
    isLight,
    isDevMode = false,
    selectedMeta,
    draft: {
      editTitle,
      setEditTitle,
      editDescription,
      setEditDescription,
      isMetadataDirty,
      onSaveMetadata,
    },
    downCounter: {
      downCounterEnabled,
      setDownCounterEnabled,
      downCounterValue,
      setDownCounterValue,
    },
    confirmDeleteUuid,
    setConfirmDeleteUuid,
    applyNewKevpertBind = false,
    onToggleApplyNewKevpertBind,
    onUpdatePackTags,
    onPlayPack,
    onEditPack,
    onExportPack,
    onDeletePack,
    onHoverDesc,
  }) => {
    const [showOriginalDescription, setShowOriginalDescription] = useState(false);
    const [newTagInput, setNewTagInput] = useState('');

    const rawRec = selectedMeta?.recommendedVariation ?? null;
    const effectiveRec = resolveEffectiveRecommendedVariation(rawRec, applyNewKevpertBind);
    const rawMatchesLatest = isVariationMatchingLatestPreset(rawRec);
    const effectiveMatchesLatest = isVariationMatchingLatestPreset(effectiveRec);

    const currentTags = selectedMeta?.tags ?? [];

    const handleAddTag = () => {
      if (!selectedMeta || !onUpdatePackTags) return;
      const cleaned = newTagInput.trim().replace(/^#+/, '').trim();
      if (!cleaned) return;
      if (currentTags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
        setNewTagInput('');
        return;
      }
      const nextTags = [...currentTags, cleaned];
      onUpdatePackTags(selectedMeta.uuid, nextTags);
      setNewTagInput('');
      onHoverDesc(`Added tag #${cleaned}`);
    };

    const handleRemoveTag = (tagToRemove: string) => {
      if (!selectedMeta || !onUpdatePackTags) return;
      const nextTags = currentTags.filter((t) => t !== tagToRemove);
      onUpdatePackTags(selectedMeta.uuid, nextTags);
      onHoverDesc(`Removed tag #${tagToRemove}`);
    };

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
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider ${
                      isLight ? 'text-neutral-500' : 'text-neutral-400'
                    }`}
                  >
                    {selectedMeta.sourcePackType || 'RCSPACK'} • {selectedMeta.itemCount}{' '}
                    {selectedMeta.itemCount === 1 ? 'SCENARIO' : 'SCENARIOS'}
                  </span>
                  <span
                    className={`text-[10px] font-mono truncate max-w-[210px] ${
                      isLight ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                    title={`/static-training-pack/${selectedMeta.uuid}`}
                  >
                    {selectedMeta.code
                      ? `Code: ${selectedMeta.code}`
                      : `ID: ${selectedMeta.uuid.slice(0, 8)}`}
                  </span>
                </div>

                {/* Tags & Recommended Variance Badge Row + Apply Old / Apply New Toggle */}
                {(isDevMode || currentTags.length > 0 || effectiveRec) && (
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1">
                      {effectiveRec && (
                        <span
                          onMouseEnter={() =>
                            onHoverDesc(
                              effectiveMatchesLatest
                                ? `Recommended Kevpert Keybinding (${effectiveRec.presetKey}): Speed [${effectiveRec.ballSpeedModifierPct[0]}%, ${effectiveRec.ballSpeedModifierPct[1]}%], Ball XY [${effectiveRec.ballLocationModifierXY[0]}, ${effectiveRec.ballLocationModifierXY[1]}], Car Vel ${
                                    effectiveRec.vehicleSpeedRange
                                      ? `[${effectiveRec.vehicleSpeedRange[0]}, ${effectiveRec.vehicleSpeedRange[1]}]`
                                      : 'Default'
                                  }, Boost Limit ${effectiveRec.boostLimitOverride ?? 'Default'}`
                                : `Historical Video Description Variance (${rawRec?.presetKey || 'Custom'}): Speed [${effectiveRec.ballSpeedModifierPct[0]}%, ${effectiveRec.ballSpeedModifierPct[1]}%], Ball XY [${effectiveRec.ballLocationModifierXY[0]}, ${effectiveRec.ballLocationModifierXY[1]}], Car Vel ${
                                    effectiveRec.vehicleSpeedRange
                                      ? `[${effectiveRec.vehicleSpeedRange[0]}, ${effectiveRec.vehicleSpeedRange[1]}]`
                                      : 'Default'
                                  }, Boost Limit ${effectiveRec.boostLimitOverride ?? 'Default'}`
                            )
                          }
                          onMouseLeave={() => onHoverDesc(null)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                            effectiveMatchesLatest
                              ? isLight
                                ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                                : 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40'
                              : isLight
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : 'bg-purple-950/70 text-purple-300 border border-purple-500/40'
                          }`}
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>
                            {effectiveMatchesLatest
                              ? `Variance: ${effectiveRec.presetKey} (B:${effectiveRec.boostLimitOverride ?? 100})`
                              : `Variance Ready (B:${effectiveRec.boostLimitOverride ?? 100})`}
                          </span>
                        </span>
                      )}
                      {currentTags.map((tag) => (
                        <span
                          key={tag}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                            isLight
                              ? 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                              : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                          }`}
                        >
                          <span>#{tag}</span>
                          {isDevMode && onUpdatePackTags && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              onMouseEnter={() => onHoverDesc(`Remove tag #${tag}`)}
                              onMouseLeave={() => onHoverDesc(null)}
                              className="opacity-60 hover:opacity-100 hover:text-rose-400 cursor-pointer"
                              aria-label={`Remove tag ${tag}`}
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </span>
                      ))}
                      {isDevMode && onUpdatePackTags && (
                        <div
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] ${
                            isLight
                              ? 'bg-neutral-50 border-neutral-300 text-neutral-800'
                              : 'bg-neutral-900 border-neutral-700 text-neutral-200'
                          }`}
                        >
                          <input
                            type="text"
                            placeholder="+ tag"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                            className="w-14 bg-transparent outline-none text-[9px] font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleAddTag}
                            onMouseEnter={() =>
                              onHoverDesc('Developer Mode: Add a custom folder/filter tag to this pack.')
                            }
                            onMouseLeave={() => onHoverDesc(null)}
                            className="opacity-70 hover:opacity-100 hover:text-cyan-400 cursor-pointer"
                            aria-label="Add tag"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {rawRec &&
                      rawRec.presetKey &&
                      rawRec.presetKey !== 'CUSTOM' &&
                      rawRec.presetKey !== 'custom' &&
                      onToggleApplyNewKevpertBind && (
                        <div
                          onMouseEnter={() =>
                            onHoverDesc(
                              rawMatchesLatest
                                ? `This pack's video description variance already matches Kevpert's latest ${rawRec.presetKey} keybinding.`
                                : `OFF (Apply Old): Uses the exact BakkesMod variance parameters from this pack's original YouTube video description. ON (Apply New): Overrides with Kevpert's latest ${rawRec.presetKey} keybinding parameters.`
                            )
                          }
                          onMouseLeave={() => onHoverDesc(null)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[8.5px] font-bold tracking-wider uppercase ${
                            isLight
                              ? 'bg-neutral-50 border-neutral-200 text-neutral-600'
                              : 'bg-neutral-850 border-neutral-700 text-neutral-300'
                          }`}
                        >
                          <span
                            className={
                              !applyNewKevpertBind
                                ? isLight
                                  ? 'text-neutral-900 font-extrabold'
                                  : 'text-white font-extrabold'
                                : 'opacity-45'
                            }
                          >
                            Apply Old
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleApplyNewKevpertBind(!applyNewKevpertBind)}
                            className={`relative w-7 h-3.5 rounded-full transition-colors border cursor-pointer ${
                              applyNewKevpertBind
                                ? isLight
                                  ? 'bg-neutral-900 border-neutral-900'
                                  : 'bg-cyan-500/60 border-cyan-400'
                                : isLight
                                  ? 'bg-neutral-300 border-neutral-400'
                                  : 'bg-neutral-700 border-neutral-600'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform ${
                                applyNewKevpertBind
                                  ? 'translate-x-3.5 left-0.5'
                                  : 'translate-x-0 left-0.5'
                              }`}
                            />
                          </button>
                          <span
                            className={
                              applyNewKevpertBind
                                ? isLight
                                  ? 'text-neutral-900 font-extrabold'
                                  : 'text-cyan-300 font-extrabold'
                                : 'opacity-45'
                            }
                          >
                            Apply New
                          </span>
                        </div>
                      )}
                  </div>
                )}

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
                  <label className="text-[10px] font-semibold opacity-70">
                    Description (Default: $Code by $CreatorName)
                  </label>
                  <textarea
                    rows={2}
                    placeholder={
                      selectedMeta.code && (selectedMeta.creator || selectedMeta.creatorName)
                        ? `${selectedMeta.code} by ${selectedMeta.creator || selectedMeta.creatorName}`
                        : 'Optional pack description...'
                    }
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none resize-none transition-colors ${
                      isLight
                        ? 'bg-neutral-50 focus:bg-white border-neutral-300 text-neutral-800'
                        : 'bg-neutral-850 focus:bg-neutral-800 border-neutral-700 text-neutral-200'
                    }`}
                  />
                </div>

                {/* Dev Mode Original Description (.Tem / RLRCSPack unmapped properties) */}
                {isDevMode && selectedMeta.originalDescription && (
                  <div
                    className={`rounded-lg border overflow-hidden ${
                      isLight
                        ? 'bg-neutral-50 border-neutral-200'
                        : 'bg-neutral-950/60 border-neutral-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setShowOriginalDescription((v) => !v)}
                      onMouseEnter={() =>
                        onHoverDesc(
                          'Developer Mode: Inspect unmapped .Tem / RLRCSPack metadata and round extras.'
                        )
                      }
                      onMouseLeave={() => onHoverDesc(null)}
                      className="w-full px-2.5 py-1.5 flex items-center justify-between text-[10px] font-mono font-bold cursor-pointer hover:bg-neutral-500/10"
                    >
                      <span className="flex items-center gap-1.5 text-cyan-400">
                        <Code2 className="h-3.5 w-3.5" />
                        <span>
                          Original Description (RLRCSPack .Tem Extras •{' '}
                          {(selectedMeta.originalDescription.length / 1024).toFixed(2)} KB)
                        </span>
                      </span>
                      {showOriginalDescription ? (
                        <ChevronUp className="h-3.5 w-3.5 opacity-70" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                      )}
                    </button>
                    {showOriginalDescription && (
                      <pre
                        className={`p-2.5 text-[10px] font-mono overflow-x-auto max-h-36 border-t select-text ${
                          isLight
                            ? 'bg-white border-neutral-200 text-neutral-700'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        {selectedMeta.originalDescription}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>

            <StaticTrainingPackInspectorActions
              isLight={isLight}
              selectedMeta={selectedMeta}
              downCounterEnabled={downCounterEnabled}
              setDownCounterEnabled={setDownCounterEnabled}
              downCounterValue={downCounterValue}
              setDownCounterValue={setDownCounterValue}
              confirmDeleteUuid={confirmDeleteUuid}
              setConfirmDeleteUuid={setConfirmDeleteUuid}
              onPlayPack={onPlayPack}
              onEditPack={onEditPack}
              onExportPack={onExportPack}
              onDeletePack={onDeletePack}
              onHoverDesc={onHoverDesc}
            />
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
