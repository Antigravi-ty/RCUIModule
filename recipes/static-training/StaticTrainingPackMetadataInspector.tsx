import React from 'react';
import {
  isVariationMatchingLatestPreset,
  resolveEffectiveRecommendedVariation,
} from '../../config/staticTrainingVariationTypes';
import type { StaticTrainingPackSummary } from './StaticTrainingPackFolderList';

export interface StaticTrainingPackMetadataInspectorProps {
  isLight: boolean;
  isDevMode: boolean;
  selectedMeta: StaticTrainingPackSummary | null;
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  isMetadataDirty: boolean;
  downCounterEnabled: boolean;
  setDownCounterEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
  downCounterValue: 1 | 2 | 3;
  setDownCounterValue: (val: 1 | 2 | 3) => void;
  confirmDeleteUuid: string | null;
  setConfirmDeleteUuid: (val: string | null) => void;
  applyNewKevpertBind?: boolean;
  onToggleApplyNewKevpertBind?: (val: boolean) => void;
  onSaveMetadata: () => void;
  onPlayPack: (meta: StaticTrainingPackSummary) => void;
  onEditPack: (meta: StaticTrainingPackSummary) => void;
  onExportPack: (meta: StaticTrainingPackSummary, editable?: boolean) => void;
  onDeletePack: (uuid: string) => void;
  onHoverDesc: (desc: string | null) => void;
}

export const StaticTrainingPackMetadataInspector: React.FC<
  StaticTrainingPackMetadataInspectorProps
> = ({
  isLight,
  isDevMode,
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
  applyNewKevpertBind = false,
  onToggleApplyNewKevpertBind,
  onSaveMetadata,
  onPlayPack,
  onEditPack,
  onExportPack,
  onDeletePack,
  onHoverDesc,
}) => {
  const rawRec = selectedMeta?.recommendedVariation ?? null;
  const effectiveRec = resolveEffectiveRecommendedVariation(rawRec, applyNewKevpertBind);
  const rawMatchesLatest = isVariationMatchingLatestPreset(rawRec);
  const effectiveMatchesLatest = isVariationMatchingLatestPreset(effectiveRec);

  return (
    <div
      className={`flex-1 min-h-0 flex flex-col justify-between rounded-xl border p-3.5 overflow-y-auto ${
        isLight ? 'bg-slate-900/[0.02] border-slate-900/10' : 'bg-white/[0.02] border-white/10'
      }`}
    >
      {selectedMeta ? (
        <>
          <div className="space-y-2.5">
            {/* Pack Metadata Header & Badges */}
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedMeta.code && (
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider border ${
                      isLight
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-700'
                        : 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300'
                    }`}
                  >
                    CODE: {selectedMeta.code}
                  </span>
                )}
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
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider border ${
                      effectiveMatchesLatest
                        ? isLight
                          ? 'bg-sky-500/15 border-sky-500/40 text-sky-700'
                          : 'bg-cyan-500/20 border-cyan-400/45 text-cyan-200'
                        : isLight
                          ? 'bg-violet-500/15 border-violet-500/40 text-violet-700'
                          : 'bg-violet-500/20 border-violet-400/40 text-violet-200'
                    }`}
                  >
                    {effectiveMatchesLatest
                      ? `Variance: ${effectiveRec.presetKey} (Boost ${effectiveRec.boostLimitOverride ?? 100})`
                      : `Variance Ready (Boost ${effectiveRec.boostLimitOverride ?? 100})`}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                    isLight ? 'bg-slate-900/5 text-slate-600' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {selectedMeta.itemCount} Shots
                </span>
              </div>

              {/* Apply Old vs Apply New Switch when pack has a Kevpert F-key preset */}
              {rawRec && rawRec.presetKey && rawRec.presetKey !== 'CUSTOM' && rawRec.presetKey !== 'custom' && onToggleApplyNewKevpertBind && (
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
                      ? 'bg-slate-900/[0.03] border-slate-900/10 text-slate-600'
                      : 'bg-white/[0.03] border-white/10 text-white/65'
                  }`}
                >
                  <span
                    className={
                      !applyNewKevpertBind
                        ? isLight
                          ? 'text-violet-700 font-extrabold'
                          : 'text-violet-300 font-extrabold'
                        : 'opacity-45'
                    }
                  >
                    Apply Old
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleApplyNewKevpertBind(!applyNewKevpertBind)}
                    className={`relative w-7 h-3.5 rounded-full transition-colors border ${
                      applyNewKevpertBind
                        ? isLight
                          ? 'bg-sky-500 border-sky-600'
                          : 'bg-cyan-500/50 border-cyan-400'
                        : isLight
                          ? 'bg-slate-300 border-slate-400'
                          : 'bg-white/15 border-white/25'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform ${
                        applyNewKevpertBind ? 'translate-x-3.5 left-0.5' : 'translate-x-0 left-0.5'
                      }`}
                    />
                  </button>
                  <span
                    className={
                      applyNewKevpertBind
                        ? isLight
                          ? 'text-sky-700 font-extrabold'
                          : 'text-cyan-300 font-extrabold'
                        : 'opacity-45'
                    }
                  >
                    Apply New
                  </span>
                </div>
              )}
            </div>

            <div>
              <label
                className={`block text-[10px] font-bold tracking-wider uppercase mb-1 ${
                  isLight ? 'text-slate-500' : 'text-white/50'
                }`}
              >
                PACK TITLE
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={80}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border outline-none transition-all ${
                  isLight
                    ? 'bg-white border-slate-900/15 text-slate-900 focus:border-sky-500'
                    : 'bg-black/30 border-white/15 text-white focus:border-cyan-400'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-[10px] font-bold tracking-wider uppercase mb-1 ${
                  isLight ? 'text-slate-500' : 'text-white/50'
                }`}
              >
                DESCRIPTION & NOTES
              </label>
              <textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={400}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none resize-none transition-all ${
                  isLight
                    ? 'bg-white border-slate-900/15 text-slate-800 focus:border-sky-500'
                    : 'bg-black/30 border-white/15 text-white/90 focus:border-cyan-400'
                }`}
              />
            </div>

            {isMetadataDirty && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onSaveMetadata}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    isLight
                      ? 'bg-sky-500 text-white border-sky-600 hover:bg-sky-600'
                      : 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50 hover:bg-cyan-500/35'
                  }`}
                >
                  Save Title & Description
                </button>
              </div>
            )}

            {/* DownCounter Configuration */}
            <div
              className={`rounded-lg border p-2.5 ${
                isLight
                  ? 'bg-slate-900/[0.03] border-slate-900/10'
                  : 'bg-white/[0.03] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDownCounterEnabled((prev) => !prev)}
                    onMouseEnter={() =>
                      onHoverDesc(
                        'Enable or disable the pre-shot countdown timer before ball & vehicle release.'
                      )
                    }
                    onMouseLeave={() => onHoverDesc(null)}
                    className={`w-8 h-4.5 rounded-full transition-colors relative border ${
                      downCounterEnabled
                        ? isLight
                          ? 'bg-sky-500 border-sky-600'
                          : 'bg-cyan-500/40 border-cyan-400'
                        : isLight
                          ? 'bg-slate-300 border-slate-400'
                          : 'bg-white/10 border-white/20'
                    }`}
                  >
                    <span
                      className={`block w-3 h-3 rounded-full bg-white shadow transition-transform ${
                        downCounterEnabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span
                    className={`text-[11px] font-bold tracking-wider uppercase ${
                      isLight ? 'text-slate-700' : 'text-white/80'
                    }`}
                  >
                    DownCounter
                  </span>
                </div>

                {downCounterEnabled && (
                  <div className="flex items-center gap-1">
                    {([1, 2, 3] as const).map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setDownCounterValue(sec)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                          downCounterValue === sec
                            ? isLight
                              ? 'bg-sky-500 text-white border-sky-600'
                              : 'bg-cyan-400/25 text-cyan-200 border-cyan-400/60'
                            : isLight
                              ? 'bg-white text-slate-600 border-slate-900/15 hover:bg-slate-100'
                              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2.5 border-t border-white/10 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onPlayPack(selectedMeta)}
                onMouseEnter={() =>
                  onHoverDesc(
                    'Enter Play Mode for this training pack. All menus will collapse and the Shot 1 countdown will begin.'
                  )
                }
                onMouseLeave={() => onHoverDesc(null)}
                className={`py-2 px-3 rounded-lg text-xs font-bold tracking-wider uppercase border transition-all flex items-center justify-center gap-1.5 ${
                  isLight
                    ? 'bg-sky-500 text-white border-sky-600 hover:bg-sky-600 shadow-sm'
                    : 'bg-cyan-500/25 text-cyan-200 border-cyan-400/55 hover:bg-cyan-500/35 shadow-[0_0_16px_rgba(34,211,238,0.18)]'
                }`}
              >
                <span>▶</span>
                <span>PLAY PACK</span>
              </button>

              <button
                type="button"
                onClick={() => onEditPack(selectedMeta)}
                onMouseEnter={() =>
                  onHoverDesc(
                    isDevMode
                      ? 'Open 6-Sub-Mode Item Edit Workspace for this pack (Dev Mode allows editing up to 50 shots).'
                      : 'Open 6-Sub-Mode Item Edit Workspace to customize ball & vehicle trajectories.'
                  )
                }
                onMouseLeave={() => onHoverDesc(null)}
                className={`py-2 px-3 rounded-lg text-xs font-bold tracking-wider uppercase border transition-all flex items-center justify-center gap-1.5 ${
                  isLight
                    ? 'bg-amber-500/15 text-amber-800 border-amber-500/40 hover:bg-amber-500/25'
                    : 'bg-amber-400/15 text-amber-200 border-amber-400/40 hover:bg-amber-400/25'
                }`}
              >
                <span>✎</span>
                <span>EDIT ITEMS</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onExportPack(selectedMeta, true)}
                onMouseEnter={() =>
                  onHoverDesc(
                    'Export this training pack as a native .RCSPack JSON file (or encrypted .RCSPackE in Dev Mode).'
                  )
                }
                onMouseLeave={() => onHoverDesc(null)}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition-all ${
                  isLight
                    ? 'bg-slate-900/5 border-slate-900/15 text-slate-700 hover:bg-slate-900/10'
                    : 'bg-white/5 border-white/15 text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                Export .RCSPack
              </button>

              {confirmDeleteUuid === selectedMeta.uuid ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDeletePack(selectedMeta.uuid)}
                    className="py-1.5 px-2.5 rounded-lg text-[10px] font-bold uppercase bg-rose-500 text-white border border-rose-600 hover:bg-rose-600 transition-all"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteUuid(null)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase border ${
                      isLight
                        ? 'bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-white/10 text-white/70 border-white/15'
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
                    onHoverDesc('Delete this training pack from local browser storage.')
                  }
                  onMouseLeave={() => onHoverDesc(null)}
                  className={`py-1.5 px-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition-all ${
                    isLight
                      ? 'bg-rose-500/10 border-rose-500/25 text-rose-700 hover:bg-rose-500/20'
                      : 'bg-rose-500/10 border-rose-400/25 text-rose-300 hover:bg-rose-500/20'
                  }`}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div
          className={`flex-1 flex items-center justify-center text-xs ${
            isLight ? 'text-slate-400' : 'text-white/40'
          }`}
        >
          Select or create a training pack to inspect.
        </div>
      )}
    </div>
  );
};
