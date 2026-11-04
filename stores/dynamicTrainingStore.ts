/**
 * dynamicTrainingStore.ts
 * Zustand store for Dynamic Training Pack scenarios, 4 bot fallback policies
 * ('keep-previous' | 'nexto' | 'necto' | 'disappear'), 4-second pre-roll countdown,
 * multi-car overdub recording, Retained Ghost Tape, and Kevpert/BakkesMod variance.
 */

import { create } from 'zustand';
import {
  type TrainingVarianceConfig,
  type TrainingVariancePresetId,
  type KevpertVarianceEra,
  DEFAULT_TRAINING_VARIANCE_CONFIG,
  buildVarianceConfigFromPreset,
  parseBakkesModBindString,
} from '../config/kevpertVariancePresets';
import {
  saveDynamicScenarioToVfs,
  loadAllDynamicScenariosFromVfs,
  exportDynamicScenariosArchiveJson,
  parseDynamicScenariosFromFile,
  type PersistedDynamicScenarioPayload,
} from './dynamicTrainingPackVfsStorage';

export type DynamicBotFallbackPolicy =
  | 'keep-previous'
  | 'nexto'
  | 'necto'
  | 'disappear';

export type DynamicScenarioCategory =
  | 'passing-play'
  | 'shadow-defense'
  | 'rebound-read'
  | 'replay-slice'
  | 'multi-car-overdub';

export type DynamicPlayPhase =
  | 'preroll-watch'
  | 'live-takeover'
  | 'goal'
  | 'expire';

export interface DynamicRecordedControlSample {
  throttle: number;
  steer: number;
  pitch: number;
  yaw: number;
  roll: number;
  jump: boolean;
  boost: boolean;
  handbrake: boolean;
}

export interface DynamicCarSlotSummary {
  slotIndex: number;
  team: 0 | 1;
  role: 'player' | 'teammate' | 'opponent';
  displayName: string;
  colorHex?: string;
  fallbackPolicy: DynamicBotFallbackPolicy;
  recordedTickCount?: number;
}

export interface DynamicTrainingScenarioSummary {
  id: string;
  title: string;
  description: string;
  category: DynamicScenarioCategory;
  prerollSeconds: number;
  timeoutSeconds: number;
  playerCarSlotIndex: number;
  recommendedKevpertPreset?: TrainingVariancePresetId;
  carSlots: DynamicCarSlotSummary[];
}

export interface DynamicTrainingLiveTelemetry {
  playPhase: DynamicPlayPhase;
  prerollRemainingSec: number;
  activeCountdownSec: number;
  remainingTimeoutSec: number;
  isRecordingOverdub: boolean;
  activePlayerSlot: number;
  retainedGhostLabel: string | null;
  lastEpisodeSeed: number;
}

export interface DynamicTrainingRuntimeHandlers {
  onScenarioChanged?: (scenarioId: string) => void;
  onResetScenarioRequested?: () => void;
  onSlotPolicyChanged?: (slotIndex: number, policy: DynamicBotFallbackPolicy) => void;
  onActivePlayerSlotChanged?: (slotIndex: number) => void;
  onPrerollSecondsChanged?: (seconds: number) => void;
  onToggleOverdubRecording?: (recording: boolean) => void;
  onPinGhostRequested?: () => void;
  onClearGhostRequested?: () => void;
  onExportActiveScenarioPayload?: () => PersistedDynamicScenarioPayload | null;
  onImportScenarioPayloads?: (payloads: PersistedDynamicScenarioPayload[]) => void;
}

const INITIAL_SCENARIO_SUMMARIES: DynamicTrainingScenarioSummary[] = [
  {
    id: 'dyn-infield-pass-disappear',
    title: 'Infield Pass -> Clean Volley (Disappear Policy)',
    description:
      'Teammate carries up the right wing during pre-roll, centers an infield pass, and despawns at 3-2-1 GO ("disappear" policy) for a zero-interference strike.',
    category: 'passing-play',
    prerollSeconds: 2.0,
    timeoutSeconds: 10,
    playerCarSlotIndex: 0,
    recommendedKevpertPreset: 'kevpert-f7',
    carSlots: [
      {
        slotIndex: 0,
        team: 0,
        role: 'player',
        displayName: 'You (Striker)',
        colorHex: '#38bdf8',
        fallbackPolicy: 'keep-previous',
      },
      {
        slotIndex: 1,
        team: 0,
        role: 'teammate',
        displayName: 'Passer Bot (Disappears @ GO)',
        colorHex: '#34d399',
        fallbackPolicy: 'disappear',
        recordedTickCount: 240,
      },
    ],
  },
  {
    id: 'dyn-shadow-defense-nexto',
    title: '1v1 Shadow Defense vs Live Nexto',
    description:
      'Watch the offensive buildup, hold W during 3-2-1, and take over shadow defense while the attacker hands off to live Nexto RLBot ("nexto" policy).',
    category: 'shadow-defense',
    prerollSeconds: 2.0,
    timeoutSeconds: 12,
    playerCarSlotIndex: 0,
    recommendedKevpertPreset: 'kevpert-f5',
    carSlots: [
      {
        slotIndex: 0,
        team: 0,
        role: 'player',
        displayName: 'You (Shadow Defender)',
        colorHex: '#38bdf8',
        fallbackPolicy: 'keep-previous',
      },
      {
        slotIndex: 1,
        team: 1,
        role: 'opponent',
        displayName: 'Attacker (Nexto @ GO)',
        colorHex: '#fb923c',
        fallbackPolicy: 'nexto',
        recordedTickCount: 240,
      },
    ],
  },
  {
    id: 'dyn-backboard-overload-necto',
    title: '2v1 Backboard Read vs Necto Keeper',
    description:
      'Teammate booms a high backboard setup ("keep-previous") while an Orange Necto goalkeeper ("necto" policy) defends the net.',
    category: 'rebound-read',
    prerollSeconds: 2.0,
    timeoutSeconds: 10,
    playerCarSlotIndex: 0,
    recommendedKevpertPreset: 'kevpert-f10',
    carSlots: [
      {
        slotIndex: 0,
        team: 0,
        role: 'player',
        displayName: 'You (2nd Man Aerial)',
        colorHex: '#38bdf8',
        fallbackPolicy: 'keep-previous',
      },
      {
        slotIndex: 1,
        team: 0,
        role: 'teammate',
        displayName: '1st Man Setup (Keep-Prev)',
        colorHex: '#34d399',
        fallbackPolicy: 'keep-previous',
        recordedTickCount: 240,
      },
      {
        slotIndex: 2,
        team: 1,
        role: 'opponent',
        displayName: 'Orange Keeper (Necto)',
        colorHex: '#f97316',
        fallbackPolicy: 'necto',
      },
    ],
  },
  {
    id: 'dyn-multi-car-overdub-lab',
    title: '3-Car Overdub & Replay-Slice Studio',
    description:
      'Record Car 0 pass, switch active slot to record Car 1 pressure, then practice as Car 2 with 4.0s pre-roll and any fallback policy.',
    category: 'multi-car-overdub',
    prerollSeconds: 4.0,
    timeoutSeconds: 12,
    playerCarSlotIndex: 0,
    recommendedKevpertPreset: 'kevpert-f11',
    carSlots: [
      {
        slotIndex: 0,
        team: 0,
        role: 'player',
        displayName: 'Slot 0 (Blue Striker)',
        colorHex: '#38bdf8',
        fallbackPolicy: 'keep-previous',
      },
      {
        slotIndex: 1,
        team: 0,
        role: 'teammate',
        displayName: 'Slot 1 (Blue Passer)',
        colorHex: '#2dd4bf',
        fallbackPolicy: 'disappear',
        recordedTickCount: 480,
      },
      {
        slotIndex: 2,
        team: 1,
        role: 'opponent',
        displayName: 'Slot 2 (Orange Defender)',
        colorHex: '#fb923c',
        fallbackPolicy: 'nexto',
      },
    ],
  },
];

export interface DynamicTrainingStoreState {
  vfsInitialized: boolean;
  scenarios: DynamicTrainingScenarioSummary[];
  selectedScenarioId: string;
  activePlayerSlotIndex: number;
  prerollSeconds: number;
  isRecordingOverdub: boolean;
  showRetainedGhost: boolean;
  varianceConfig: TrainingVarianceConfig;
  liveTelemetry: DynamicTrainingLiveTelemetry;
  runtimeHandlers: DynamicTrainingRuntimeHandlers;

  initVfsStore: () => Promise<void>;
  selectScenario: (scenarioId: string) => void;
  nextScenario: () => void;
  prevScenario: () => void;
  resetScenario: () => void;
  setActivePlayerSlotIndex: (slotIndex: number) => void;
  setCarSlotFallbackPolicy: (slotIndex: number, policy: DynamicBotFallbackPolicy) => void;
  setPrerollSeconds: (seconds: number) => void;
  toggleOverdubRecording: () => void;
  setVarianceConfig: (patch: Partial<TrainingVarianceConfig>) => void;
  applyKevpertVariancePreset: (presetId: TrainingVariancePresetId, era?: KevpertVarianceEra) => void;
  applyBakkesModBindString: (raw: string) => void;
  pinLastAttemptAsGhost: () => void;
  clearRetainedGhost: () => void;
  setShowRetainedGhost: (show: boolean) => void;
  saveActiveScenarioToVfs: () => Promise<void>;
  exportActiveScenarioRCDPack: () => void;
  importScenariosFromFile: (file: File) => Promise<number>;
  updateLiveTelemetry: (patch: Partial<DynamicTrainingLiveTelemetry>) => void;
  setRuntimeHandlers: (handlers: Partial<DynamicTrainingRuntimeHandlers>) => void;
}

export const useDynamicTrainingStore = create<DynamicTrainingStoreState>((set, get) => ({
  vfsInitialized: false,
  scenarios: INITIAL_SCENARIO_SUMMARIES,
  selectedScenarioId: INITIAL_SCENARIO_SUMMARIES[0].id,
  activePlayerSlotIndex: 0,
  prerollSeconds: 2.0,
  isRecordingOverdub: false,
  showRetainedGhost: true,
  varianceConfig: { ...DEFAULT_TRAINING_VARIANCE_CONFIG },
  liveTelemetry: {
    playPhase: 'preroll-watch',
    prerollRemainingSec: 2.0,
    activeCountdownSec: 2,
    remainingTimeoutSec: 10,
    isRecordingOverdub: false,
    activePlayerSlot: 0,
    retainedGhostLabel: null,
    lastEpisodeSeed: 1337,
  },
  runtimeHandlers: {},

  initVfsStore: async () => {
    if (get().vfsInitialized) return;
    set({ vfsInitialized: true });
    const persisted = await loadAllDynamicScenariosFromVfs();
    if (persisted.length === 0) return;
    get().runtimeHandlers.onImportScenarioPayloads?.(persisted);
    set((s) => {
      const merged = [...s.scenarios];
      for (const p of persisted) {
        const summary: DynamicTrainingScenarioSummary = {
          id: p.id,
          title: p.title,
          description: p.description,
          category: p.category,
          prerollSeconds: p.prerollSeconds,
          timeoutSeconds: p.timeoutSeconds,
          playerCarSlotIndex: p.playerCarSlotIndex,
          recommendedKevpertPreset: p.recommendedKevpertPreset,
          carSlots: p.carSlots.map((c) => ({
            slotIndex: c.slotIndex,
            team: c.team,
            role: c.role,
            displayName: c.displayName,
            colorHex: c.colorHex,
            fallbackPolicy: c.fallbackPolicy,
            recordedTickCount: c.recordedControls?.length ?? c.recordedTickCount,
          })),
        };
        const existingIdx = merged.findIndex((item) => item.id === summary.id);
        if (existingIdx >= 0) {
          merged[existingIdx] = summary;
        } else {
          merged.push(summary);
        }
      }
      return { scenarios: merged };
    });
  },

  selectScenario: (scenarioId: string) => {
    const found = get().scenarios.find((s) => s.id === scenarioId) || get().scenarios[0];
    if (!found) return;
    set({
      selectedScenarioId: found.id,
      activePlayerSlotIndex: found.playerCarSlotIndex,
      prerollSeconds: found.prerollSeconds,
      isRecordingOverdub: false,
    });
    get().runtimeHandlers.onScenarioChanged?.(found.id);
  },

  nextScenario: () => {
    const { scenarios, selectedScenarioId } = get();
    if (scenarios.length === 0) return;
    const idx = scenarios.findIndex((s) => s.id === selectedScenarioId);
    const next = scenarios[(idx + 1) % scenarios.length];
    if (next) get().selectScenario(next.id);
  },

  prevScenario: () => {
    const { scenarios, selectedScenarioId } = get();
    if (scenarios.length === 0) return;
    const idx = scenarios.findIndex((s) => s.id === selectedScenarioId);
    const prev = scenarios[(idx - 1 + scenarios.length) % scenarios.length];
    if (prev) get().selectScenario(prev.id);
  },

  resetScenario: () => {
    get().runtimeHandlers.onResetScenarioRequested?.();
  },

  setActivePlayerSlotIndex: (slotIndex: number) => {
    set({ activePlayerSlotIndex: slotIndex });
    get().runtimeHandlers.onActivePlayerSlotChanged?.(slotIndex);
  },

  setCarSlotFallbackPolicy: (slotIndex: number, policy: DynamicBotFallbackPolicy) => {
    const { selectedScenarioId } = get();
    set((s) => ({
      scenarios: s.scenarios.map((scen) =>
        scen.id !== selectedScenarioId
          ? scen
          : {
              ...scen,
              carSlots: scen.carSlots.map((slot) =>
                slot.slotIndex === slotIndex ? { ...slot, fallbackPolicy: policy } : slot,
              ),
            },
      ),
    }));
    get().runtimeHandlers.onSlotPolicyChanged?.(slotIndex, policy);
    void get().saveActiveScenarioToVfs();
  },

  setPrerollSeconds: (seconds: number) => {
    const clamped = Math.max(0, Math.min(8, Number(seconds) || 0));
    const { selectedScenarioId } = get();
    set((s) => ({
      prerollSeconds: clamped,
      scenarios: s.scenarios.map((scen) =>
        scen.id === selectedScenarioId ? { ...scen, prerollSeconds: clamped } : scen,
      ),
    }));
    get().runtimeHandlers.onPrerollSecondsChanged?.(clamped);
    void get().saveActiveScenarioToVfs();
  },

  toggleOverdubRecording: () => {
    const next = !get().isRecordingOverdub;
    set({ isRecordingOverdub: next });
    get().runtimeHandlers.onToggleOverdubRecording?.(next);
  },

  setVarianceConfig: (patch: Partial<TrainingVarianceConfig>) => {
    set((s) => ({
      varianceConfig: { ...s.varianceConfig, ...patch },
    }));
    get().runtimeHandlers.onResetScenarioRequested?.();
  },

  applyKevpertVariancePreset: (presetId: TrainingVariancePresetId, era?: KevpertVarianceEra) => {
    const current = get().varianceConfig;
    const nextConfig = buildVarianceConfigFromPreset(
      presetId,
      era ?? current.era,
      current.baseSeed,
    );
    set({ varianceConfig: nextConfig });
    get().runtimeHandlers.onResetScenarioRequested?.();
  },

  applyBakkesModBindString: (raw: string) => {
    const nextConfig = parseBakkesModBindString(raw, get().varianceConfig);
    set({ varianceConfig: nextConfig });
    get().runtimeHandlers.onResetScenarioRequested?.();
  },

  pinLastAttemptAsGhost: () => {
    get().runtimeHandlers.onPinGhostRequested?.();
  },

  clearRetainedGhost: () => {
    set((s) => ({
      liveTelemetry: { ...s.liveTelemetry, retainedGhostLabel: null },
    }));
    get().runtimeHandlers.onClearGhostRequested?.();
  },

  setShowRetainedGhost: (show: boolean) => {
    set({ showRetainedGhost: Boolean(show) });
  },

  saveActiveScenarioToVfs: async () => {
    const runtimePayload = get().runtimeHandlers.onExportActiveScenarioPayload?.();
    if (runtimePayload) {
      await saveDynamicScenarioToVfs(runtimePayload);
      return;
    }
    const { scenarios, selectedScenarioId } = get();
    const current = scenarios.find((s) => s.id === selectedScenarioId);
    if (current) {
      await saveDynamicScenarioToVfs(current);
    }
  },

  exportActiveScenarioRCDPack: () => {
    const runtimePayload = get().runtimeHandlers.onExportActiveScenarioPayload?.();
    const { scenarios, selectedScenarioId } = get();
    const fallback = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];
    const target = runtimePayload || fallback;
    if (!target) return;
    exportDynamicScenariosArchiveJson([target], `${target.id}.RCDPack`);
  },

  importScenariosFromFile: async (file: File) => {
    const imported = await parseDynamicScenariosFromFile(file);
    if (imported.length === 0) return 0;
    for (const p of imported) {
      await saveDynamicScenarioToVfs(p);
    }
    get().runtimeHandlers.onImportScenarioPayloads?.(imported);
    set((s) => {
      const merged = [...s.scenarios];
      for (const p of imported) {
        const summary: DynamicTrainingScenarioSummary = {
          id: p.id,
          title: p.title,
          description: p.description,
          category: p.category || 'multi-car-overdub',
          prerollSeconds: Number(p.prerollSeconds) || 2.0,
          timeoutSeconds: Number(p.timeoutSeconds) || 10,
          playerCarSlotIndex: Number(p.playerCarSlotIndex) || 0,
          recommendedKevpertPreset: p.recommendedKevpertPreset,
          carSlots: p.carSlots.map((c, idx) => ({
            slotIndex: typeof c.slotIndex === 'number' ? c.slotIndex : idx,
            team: c.team === 1 ? 1 : 0,
            role: c.role || 'teammate',
            displayName: c.displayName || `Slot ${idx + 1}`,
            colorHex: c.colorHex,
            fallbackPolicy: c.fallbackPolicy || 'keep-previous',
            recordedTickCount: c.recordedControls?.length ?? c.recordedTickCount,
          })),
        };
        const existingIdx = merged.findIndex((item) => item.id === summary.id);
        if (existingIdx >= 0) {
          merged[existingIdx] = summary;
        } else {
          merged.push(summary);
        }
      }
      const firstId = imported[0].id;
      return {
        scenarios: merged,
        selectedScenarioId: firstId,
      };
    });
    get().selectScenario(imported[0].id);
    return imported.length;
  },

  updateLiveTelemetry: (patch: Partial<DynamicTrainingLiveTelemetry>) => {
    set((s) => ({
      liveTelemetry: { ...s.liveTelemetry, ...patch },
    }));
  },

  setRuntimeHandlers: (handlers: Partial<DynamicTrainingRuntimeHandlers>) => {
    set((s) => ({
      runtimeHandlers: { ...s.runtimeHandlers, ...handlers },
    }));
  },
}));
