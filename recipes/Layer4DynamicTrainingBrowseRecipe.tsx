/**
 * Layer4DynamicTrainingBrowseRecipe.tsx
 * Layer 4 Browser & Configurator for Dynamic Training Packs (Multi-Car Setup,
 * 4s Pre-Roll + 3-2-1 Takeover, 4 Non-Active Car Fallback Policies
 * ['keep-previous' | 'nexto' | 'necto' | 'disappear'], Multi-Car Overdub Recording,
 * and Kevpert / BakkesMod Seeded Training Variance).
 */

import React, { useEffect, useRef, useState } from 'react';
import { Bot, Clock, Disc, Download, Play, Upload, Users } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { Badge } from '../primitives/Badge';
import { SegmentedSwitch } from '../primitives/SegmentedSwitch';
import { UI_RADIUS } from '../tokens/radius';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { DEFAULT_PANEL_SIZING } from '../tokens/menuLayoutTokens';
import {
  useDynamicTrainingStore,
  type DynamicBotFallbackPolicy,
} from '../stores/dynamicTrainingStore';
import { KevpertVarianceInspectorCard } from './static-training/KevpertVarianceInspectorCard';

export interface Layer4DynamicTrainingBrowseRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  onStartDynamicSession?: (scenarioId: string) => void;
  className?: string;
}

const POLICY_OPTIONS: { value: DynamicBotFallbackPolicy; label: string }[] = [
  { value: 'keep-previous', label: 'Keep-Prev' },
  { value: 'nexto', label: 'Nexto' },
  { value: 'necto', label: 'Necto' },
  { value: 'disappear', label: 'Disappear' },
];

export const Layer4DynamicTrainingBrowseRecipe: React.FC<
  Layer4DynamicTrainingBrowseRecipeProps
> = React.memo(({ isLight = false, onBack = () => {}, onStartDynamicSession, className = '' }) => {
  const sizing = useMenuLayoutStore(
    (s) =>
      s.panels?.['layer4-static-training-pack'] ??
      DEFAULT_PANEL_SIZING['layer4-static-training-pack'],
  );

  const scenarios = useDynamicTrainingStore((s) => s.scenarios);
  const selectedScenarioId = useDynamicTrainingStore((s) => s.selectedScenarioId);
  const selectScenario = useDynamicTrainingStore((s) => s.selectScenario);
  const activePlayerSlotIndex = useDynamicTrainingStore((s) => s.activePlayerSlotIndex);
  const setActivePlayerSlotIndex = useDynamicTrainingStore((s) => s.setActivePlayerSlotIndex);
  const setCarSlotFallbackPolicy = useDynamicTrainingStore((s) => s.setCarSlotFallbackPolicy);
  const prerollSeconds = useDynamicTrainingStore((s) => s.prerollSeconds);
  const setPrerollSeconds = useDynamicTrainingStore((s) => s.setPrerollSeconds);
  const isRecordingOverdub = useDynamicTrainingStore((s) => s.isRecordingOverdub);
  const toggleOverdubRecording = useDynamicTrainingStore((s) => s.toggleOverdubRecording);
  const varianceConfig = useDynamicTrainingStore((s) => s.varianceConfig);
  const applyKevpertVariancePreset = useDynamicTrainingStore((s) => s.applyKevpertVariancePreset);
  const setVarianceConfig = useDynamicTrainingStore((s) => s.setVarianceConfig);
  const applyBakkesModBindString = useDynamicTrainingStore((s) => s.applyBakkesModBindString);
  const showRetainedGhost = useDynamicTrainingStore((s) => s.showRetainedGhost);
  const setShowRetainedGhost = useDynamicTrainingStore((s) => s.setShowRetainedGhost);
  const pinLastAttemptAsGhost = useDynamicTrainingStore((s) => s.pinLastAttemptAsGhost);
  const clearRetainedGhost = useDynamicTrainingStore((s) => s.clearRetainedGhost);
  const retainedGhostLabel = useDynamicTrainingStore((s) => s.liveTelemetry.retainedGhostLabel);
  const initVfsStore = useDynamicTrainingStore((s) => s.initVfsStore);
  const exportActiveScenarioRCDPack = useDynamicTrainingStore((s) => s.exportActiveScenarioRCDPack);
  const importScenariosFromFile = useDynamicTrainingStore((s) => s.importScenariosFromFile);

  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void initVfsStore();
  }, [initVfsStore]);

  const selectedScenario =
    scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0] || null;

  return (
    <PanelContainer
      width={sizing?.width ?? 680}
      height={sizing?.targetHeight ?? 540}
      sizing={sizing}
      isLight={isLight}
      className={className}
    >
      <PanelHeader title="Dynamic Training Pack" onBack={onBack} isLight={isLight} />

      <PanelContent className="overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-3.5 h-full min-h-0">
          {/* Left Column (5 cols): Dynamic Scenarios List */}
          <div
            className={`col-span-5 flex flex-col rounded-xl border overflow-hidden min-h-0 ${
              isLight
                ? 'bg-neutral-50/70 border-neutral-200/90'
                : 'bg-neutral-900/50 border-neutral-800'
            }`}
          >
            <div
              className={`px-3 py-2 border-b flex items-center justify-between text-[11px] font-bold tracking-wider uppercase shrink-0 ${
                isLight
                  ? 'border-neutral-200 text-neutral-500 bg-neutral-100/60'
                  : 'border-neutral-800 text-neutral-400 bg-neutral-900/80'
              }`}
            >
              <span>Dynamic Scenarios ({scenarios.length})</span>
              <div className="flex items-center gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".RCDPack,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importScenariosFromFile(f);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  title="Import .RCDPack / JSON into IndexedDB VFS"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 rounded hover:bg-neutral-500/20 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5 opacity-75" />
                </button>
                <button
                  type="button"
                  title="Export active scenario as .RCDPack"
                  onClick={() => exportActiveScenarioRCDPack()}
                  className="p-1 rounded hover:bg-neutral-500/20 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 opacity-75" />
                </button>
                <Users className="h-3.5 w-3.5 opacity-60" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 p-2 overflow-y-auto grow min-h-0">
              {scenarios.map((scen) => {
                const isSelected = scen.id === selectedScenario?.id;
                return (
                  <button
                    key={scen.id}
                    type="button"
                    onClick={() => selectScenario(scen.id)}
                    onMouseEnter={() => setHoveredDesc(scen.description)}
                    onMouseLeave={() => setHoveredDesc(null)}
                    className={`flex flex-col gap-1 p-2.5 text-left transition-all border cursor-pointer ${UI_RADIUS.md} ${
                      isSelected
                        ? isLight
                          ? 'bg-white border-neutral-900 shadow-xs text-neutral-900'
                          : 'bg-neutral-800 border-neutral-200 shadow-sm text-white'
                        : isLight
                        ? 'bg-white/60 hover:bg-white border-neutral-200/80 text-neutral-800'
                        : 'bg-neutral-850/60 hover:bg-neutral-800/80 border-neutral-800 text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold truncate">{scen.title}</span>
                      <Badge
                        variant={isSelected ? 'default' : 'neutral'}
                        size="sm"
                        isLight={isLight}
                        className="text-[9px] shrink-0"
                      >
                        {scen.carSlots.length} Cars
                      </Badge>
                    </div>
                    <span
                      className={`text-[10px] line-clamp-2 ${
                        isLight ? 'text-neutral-500' : 'text-neutral-400'
                      }`}
                    >
                      {scen.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column (7 cols): Multi-Car Role Slots, Fallback Policies & Kevpert Variance */}
          <div
            className={`col-span-7 flex flex-col justify-between rounded-xl border p-3.5 overflow-y-auto min-h-0 ${
              isLight
                ? 'bg-white border-neutral-200/90 text-neutral-900'
                : 'bg-neutral-900/70 border-neutral-800 text-neutral-100'
            }`}
          >
            {selectedScenario && (
              <>
                <div className="flex flex-col gap-2.5">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold">{selectedScenario.title}</span>
                      <span className="text-[10px] font-mono opacity-60">
                        Timeout: {selectedScenario.timeoutSeconds}s
                      </span>
                    </div>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        isLight ? 'text-neutral-600' : 'text-neutral-400'
                      }`}
                    >
                      {selectedScenario.description}
                    </p>
                  </div>

                  {/* Pre-Roll Observation Duration */}
                  <div
                    className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                      isLight
                        ? 'bg-neutral-50 border-neutral-200'
                        : 'bg-neutral-850/70 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold">
                          Pre-Roll Watch → 3-2-1 Takeover
                        </span>
                        <span className="text-[9px] opacity-65">
                          Hold [W] during countdown for seamless momentum handoff
                        </span>
                      </div>
                    </div>
                    <SegmentedSwitch
                      options={[
                        { value: '0', label: '0s' },
                        { value: '2', label: '2.0s' },
                        { value: '4', label: '4.0s (480f)' },
                      ]}
                      value={String(prerollSeconds)}
                      onValueChange={(v) => setPrerollSeconds(Number(v))}
                      isLight={isLight}
                      size="sm"
                    />
                  </div>

                  {/* Multi-Car Slots & 4 Bot Fallback Policies */}
                  <div
                    className={`p-2.5 rounded-lg border flex flex-col gap-2 ${
                      isLight
                        ? 'bg-neutral-50 border-neutral-200'
                        : 'bg-neutral-850/70 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bot className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[11px] font-semibold">
                          Car Slots & Post-Tape Fallback Policy
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={toggleOverdubRecording}
                        onMouseEnter={() =>
                          setHoveredDesc(
                            'Overdub Recording: Drive the selected car slot to record a custom pass/defense tape, then switch slots to practice against it!',
                          )
                        }
                        onMouseLeave={() => setHoveredDesc(null)}
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                          isRecordingOverdub
                            ? 'bg-rose-500/25 border-rose-400 text-rose-300 animate-pulse'
                            : isLight
                            ? 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        <Disc className="h-2.5 w-2.5" />
                        <span>{isRecordingOverdub ? 'REC Overdub ON' : 'Record Overdub'}</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {selectedScenario.carSlots.map((slot) => {
                        const isPlayer = slot.slotIndex === activePlayerSlotIndex;
                        return (
                          <div
                            key={slot.slotIndex}
                            className={`px-2 py-1.5 rounded border flex items-center justify-between gap-2 ${
                              isPlayer
                                ? isLight
                                  ? 'bg-sky-50 border-sky-300'
                                  : 'bg-sky-500/10 border-sky-500/40'
                                : isLight
                                ? 'bg-white border-neutral-200'
                                : 'bg-neutral-900/70 border-neutral-800'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setActivePlayerSlotIndex(slot.slotIndex)}
                              title="Click to control this car slot as Player"
                              className="flex items-center gap-1.5 text-left cursor-pointer min-w-0"
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    slot.colorHex || (slot.team === 0 ? '#38bdf8' : '#fb923c'),
                                }}
                              />
                              <span className="text-[11px] font-bold truncate">
                                #{slot.slotIndex + 1} {slot.displayName}
                              </span>
                              {isPlayer && (
                                <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 text-[9px] font-mono font-bold">
                                  YOU
                                </span>
                              )}
                            </button>

                            {!isPlayer && (
                              <SegmentedSwitch
                                options={POLICY_OPTIONS}
                                value={slot.fallbackPolicy}
                                onValueChange={(val) =>
                                  setCarSlotFallbackPolicy(
                                    slot.slotIndex,
                                    val as DynamicBotFallbackPolicy,
                                  )
                                }
                                isLight={isLight}
                                size="sm"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Kevpert / BakkesMod Seeded Variance Card */}
                  <KevpertVarianceInspectorCard
                    isLight={isLight}
                    varianceConfig={varianceConfig}
                    onSelectPreset={applyKevpertVariancePreset}
                    onPatchVariance={setVarianceConfig}
                    onApplyBindString={applyBakkesModBindString}
                    retainedGhostLabel={retainedGhostLabel}
                    showRetainedGhost={showRetainedGhost}
                    onToggleShowGhost={setShowRetainedGhost}
                    onPinLastAttemptGhost={pinLastAttemptAsGhost}
                    onClearGhost={clearRetainedGhost}
                    onHoverDesc={setHoveredDesc}
                  />
                </div>

                <div className="pt-2.5 border-t border-neutral-500/15 mt-2">
                  <button
                    type="button"
                    onClick={() => onStartDynamicSession?.(selectedScenario.id)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-xs font-bold transition-all cursor-pointer active:scale-98 ${
                      isLight
                        ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-900 text-white shadow-xs'
                        : 'bg-white hover:bg-neutral-200 border-white text-neutral-900 shadow-xs'
                    }`}
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>LAUNCH DYNAMIC SCENARIO</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        rightSlot={<span>[R] Reset · [[ / ]] Prev/Next · [1/2/3] Slot · [G] Pin Ghost</span>}
      >
        {hoveredDesc ||
          'Configure multi-car fallback policies (keep-previous / nexto / necto / disappear), pre-roll window, and Kevpert variance.'}
      </PanelFooter>
    </PanelContainer>
  );
});

Layer4DynamicTrainingBrowseRecipe.displayName = 'Layer4DynamicTrainingBrowseRecipe';
