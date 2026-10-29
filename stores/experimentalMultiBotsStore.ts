import { create } from 'zustand';
import { loadStoredColorPrefs } from '../config/vehiclePresets.js';

export type ExpBotPolicyId = 'nexto' | 'necto' | 'heuristic';
export type ExpPlayerParticipation = 'none' | 'blue' | 'orange';
export type ExpSpeedMultiplier = 100 | 200 | 300 | 400;

export interface ExpColorSwatch {
  id: number;
  name: string;
  hex: string;
  preferredTeam: 0 | 1;
}

/**
 * Standard 6-color swatch palette matching CAR_COLOR_SLOTS in vehicleConstants.js.
 */
export const EXP_CAR_COLOR_PALETTE: readonly ExpColorSwatch[] = Object.freeze([
  { id: 3, name: 'Blue', hex: '#42a5f5', preferredTeam: 0 },
  { id: 1, name: 'Green', hex: '#66bb6a', preferredTeam: 0 },
  { id: 5, name: 'Purple', hex: '#ba68c8', preferredTeam: 0 },
  { id: 0, name: 'Red', hex: '#ff7043', preferredTeam: 1 },
  { id: 2, name: 'Yellow', hex: '#ffc107', preferredTeam: 1 },
  { id: 4, name: 'Pink', hex: '#fd6e9d', preferredTeam: 1 },
]);

export function getExpColorSwatch(colorSlot: number): ExpColorSwatch {
  return (
    EXP_CAR_COLOR_PALETTE.find((s) => s.id === colorSlot) ||
    EXP_CAR_COLOR_PALETTE[0]
  );
}

export interface ExperimentalMultiBotsSlotConfig {
  id: string;
  team: 0 | 1;
  isPlayer: boolean;
  botType: ExpBotPolicyId;
  colorSlot: number;
}

export interface ExpSpawnedCarInfo {
  carIndex: number;
  keyNumber: number; // 1..6 shortcut key
  team: 0 | 1;
  teamSlotIndex: number;
  isPlayer: boolean;
  botType: ExpBotPolicyId;
  colorSlot: number;
  colorHex: string;
  colorName: string;
  label: string;
}

const BLUE_DEFAULT_COLORS = [3, 1, 5, 0, 2];
const ORANGE_DEFAULT_COLORS = [0, 2, 4, 3, 1];

function resolveGarageColorPrefs(): {
  primaryTeam: 'blue' | 'orange';
  blueColors: number[];
  orangeColors: number[];
} {
  const prefs = loadStoredColorPrefs?.() || {
    primaryTeam: 'blue',
    blueOrder: [3, 1, 5],
    orangeOrder: [0, 2, 4],
  };
  const primaryTeam: 'blue' | 'orange' =
    prefs.primaryTeam === 'orange' ? 'orange' : 'blue';
  const rawBlue = Array.isArray(prefs.blueOrder) ? prefs.blueOrder : [];
  const rawOrange = Array.isArray(prefs.orangeOrder) ? prefs.orangeOrder : [];
  const blueColors = [
    ...rawBlue,
    ...BLUE_DEFAULT_COLORS.filter((c) => !rawBlue.includes(c)),
  ];
  const orangeColors = [
    ...rawOrange,
    ...ORANGE_DEFAULT_COLORS.filter((c) => !rawOrange.includes(c)),
  ];
  return { primaryTeam, blueColors, orangeColors };
}

function buildTeamSlotsFromColorPrefs(
  countPerTeam: number,
  botType: ExpBotPolicyId | ExpBotPolicyId[],
  participationOverride?: ExpPlayerParticipation
): {
  playerParticipation: ExpPlayerParticipation;
  blueSlots: ExperimentalMultiBotsSlotConfig[];
  orangeSlots: ExperimentalMultiBotsSlotConfig[];
  activeCameraCarIndex: number;
} {
  const { primaryTeam, blueColors, orangeColors } = resolveGarageColorPrefs();
  const playerParticipation: ExpPlayerParticipation =
    participationOverride !== undefined ? participationOverride : primaryTeam;
  const resolveBot = (i: number): ExpBotPolicyId =>
    Array.isArray(botType) ? botType[i % botType.length] : botType;

  const blueSlots: ExperimentalMultiBotsSlotConfig[] = Array.from(
    { length: countPerTeam },
    (_, i) => ({
      id: `blue-${i}`,
      team: 0 as const,
      isPlayer: playerParticipation === 'blue' && i === 0,
      botType: resolveBot(i),
      colorSlot: blueColors[i] ?? BLUE_DEFAULT_COLORS[i],
    })
  );

  const orangeSlots: ExperimentalMultiBotsSlotConfig[] = Array.from(
    { length: countPerTeam },
    (_, i) => ({
      id: `orange-${i}`,
      team: 1 as const,
      isPlayer: playerParticipation === 'orange' && i === 0,
      botType: resolveBot(i),
      colorSlot: orangeColors[i] ?? ORANGE_DEFAULT_COLORS[i],
    })
  );

  const activeCameraCarIndex =
    playerParticipation === 'orange' ? countPerTeam : 0;

  return {
    playerParticipation,
    blueSlots,
    orangeSlots,
    activeCameraCarIndex,
  };
}

function pickUnusedColorSlot(
  blueSlots: ExperimentalMultiBotsSlotConfig[],
  orangeSlots: ExperimentalMultiBotsSlotConfig[],
  preferredTeam: 0 | 1
): number {
  const used = new Set<number>();
  blueSlots.forEach((s) => used.add(s.colorSlot));
  orangeSlots.forEach((s) => used.add(s.colorSlot));

  const { blueColors, orangeColors } = resolveGarageColorPrefs();
  const preferredOrder =
    preferredTeam === 0
      ? [...blueColors, ...orangeColors]
      : [...orangeColors, ...blueColors];

  for (const c of preferredOrder) {
    if (!used.has(c)) return c;
  }
  return preferredOrder[0];
}

function normalizeTeamPlayerFlags(
  blueSlots: ExperimentalMultiBotsSlotConfig[],
  orangeSlots: ExperimentalMultiBotsSlotConfig[],
  participation: ExpPlayerParticipation
): { blueSlots: ExperimentalMultiBotsSlotConfig[]; orangeSlots: ExperimentalMultiBotsSlotConfig[] } {
  const nextBlue = blueSlots.map((slot, idx) => ({
    ...slot,
    team: 0 as const,
    isPlayer: participation === 'blue' && idx === 0,
  }));
  const nextOrange = orangeSlots.map((slot, idx) => ({
    ...slot,
    team: 1 as const,
    isPlayer: participation === 'orange' && idx === 0,
  }));
  return { blueSlots: nextBlue, orangeSlots: nextOrange };
}

export interface ExperimentalMultiBotsState {
  // Roster & Player Configuration
  playerParticipation: ExpPlayerParticipation; // 'none' (Spectate Bots), 'blue', or 'orange'
  blueSlots: ExperimentalMultiBotsSlotConfig[]; // Up to 5 slots on Team Blue (0)
  orangeSlots: ExperimentalMultiBotsSlotConfig[]; // Up to 5 slots on Team Orange (1)

  // Camera & Match Settings
  isExhibitionMode: boolean;
  exhibitionTeamSize: 'solo' | 'double' | 'standard';
  exhibitionBotId: ExpBotPolicyId;
  activeCameraCarIndex: number; // 0..5 (switched via keys 1..6 when no player or spectating)
  matchDurationSec: number;
  speedMultiplier: ExpSpeedMultiplier;
  unlimitedBoost: boolean;
  disableGoalReplay: boolean;

  // Live Match & Telemetry State
  matchActive: boolean;
  matchPhase: string;
  kickoffCountdownSec: number;
  blueScore: number;
  orangeScore: number;
  remainingSec: number;
  isOvertime: boolean;
  nextoLoaded: boolean;
  nectoLoaded: boolean;
  lastTotalInferenceMs: number;
  spawnedCars: ExpSpawnedCarInfo[];

  // Actions
  setIsExhibitionMode: (isExhibition: boolean) => void;
  configureExhibitionMatch: (
    botId: ExpBotPolicyId,
    durationSec?: number,
    teamSize?: 'solo' | 'double' | 'standard'
  ) => void;
  syncExhibitionFromColorPrefs: (triggerRuntime?: boolean) => void;
  setPlayerParticipation: (participation: ExpPlayerParticipation) => void;
  addBotToTeam: (team: 0 | 1, botType?: ExpBotPolicyId) => void;
  removeSlotFromTeam: (team: 0 | 1, slotIndex: number) => void;
  setSlotBotType: (team: 0 | 1, slotIndex: number, botType: ExpBotPolicyId) => void;
  setSlotColor: (team: 0 | 1, slotIndex: number, colorSlot: number) => void;
  applyPresetRoster: (
    preset: '1v1-player' | '2v2-player' | '3v3-player' | '1v1-bots' | '2v2-bots' | '3v3-bots'
  ) => void;
  setMatchDurationSec: (sec: number) => void;
  setActiveCameraCarIndex: (carIndex: number) => void;
  setSpeedMultiplier: (mult: ExpSpeedMultiplier) => void;
  setUnlimitedBoost: (unlimited: boolean) => void;
  setDisableGoalReplay: (disable: boolean) => void;
  startOrApplyMatch: () => void;
  triggerSandboxAction: (
    action: 'reset_kickoff' | 'score_blue' | 'score_orange' | 'force_overtime' | 'end_match'
  ) => void;
  preloadEngines?: () => void;
  updateLiveTelemetry: (patch: Partial<ExperimentalMultiBotsState>) => void;

  // Runtime Bridge Handlers
  runtimeHandlers: {
    onApplyRosterAndStart?: () => void;
    onSelectCameraCar?: (carIndex: number) => void;
    onSpeedMultiplierChange?: (mult: ExpSpeedMultiplier) => void;
    onUnlimitedBoostChange?: (unlimited: boolean) => void;
    onTriggerAction?: (
      action: 'reset_kickoff' | 'score_blue' | 'score_orange' | 'force_overtime' | 'end_match'
    ) => void;
    onHotSwapSlotBotType?: (team: 0 | 1, slotIndex: number, botType: ExpBotPolicyId) => void;
    onHotSwapSlotColor?: (team: 0 | 1, slotIndex: number, colorSlot: number) => void;
    onPreloadEngines?: () => void;
  };
  setRuntimeHandlers: (handlers: Partial<ExperimentalMultiBotsState['runtimeHandlers']>) => void;
}

const initialRoster = buildTeamSlotsFromColorPrefs(3, 'necto');

export const useExperimentalMultiBotsStore = create<ExperimentalMultiBotsState>((set, get) => ({
  playerParticipation: initialRoster.playerParticipation,
  blueSlots: initialRoster.blueSlots,
  orangeSlots: initialRoster.orangeSlots,

  isExhibitionMode: false,
  exhibitionTeamSize: 'standard',
  exhibitionBotId: 'necto',
  activeCameraCarIndex: initialRoster.activeCameraCarIndex,
  matchDurationSec: 90,
  speedMultiplier: 100,
  unlimitedBoost: false,
  disableGoalReplay: false,

  matchActive: false,
  matchPhase: 'kickoff (3)',
  kickoffCountdownSec: 3,
  blueScore: 0,
  orangeScore: 0,
  remainingSec: 90,
  isOvertime: false,
  nextoLoaded: false,
  nectoLoaded: false,
  lastTotalInferenceMs: 0,
  spawnedCars: [],

  runtimeHandlers: new Proxy({} as ExperimentalMultiBotsState['runtimeHandlers'], {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return val;
      }
      if (typeof prop === 'string' && prop.startsWith('on')) {
        return (..._args: unknown[]) => {
          console.warn(
            `[experimentalMultiBotsStore] Runtime handler "${prop}" was invoked before ExperimentalMultiBotsMode registered its handlers.`
          );
        };
      }
      return val;
    },
  }),
  setRuntimeHandlers: (handlers) =>
    set((s) => {
      const merged = { ...s.runtimeHandlers, ...handlers };
      return {
        runtimeHandlers: new Proxy(merged, {
          get(target, prop, receiver) {
            const val = Reflect.get(target, prop, receiver);
            if (typeof val === 'function') {
              return val;
            }
            if (typeof prop === 'string' && prop.startsWith('on')) {
              return (..._args: unknown[]) => {
                console.warn(
                  `[experimentalMultiBotsStore] Runtime handler "${prop}" is not registered in the current mode.`
                );
              };
            }
            return val;
          },
        }),
      };
    }),

  setIsExhibitionMode: (isExhibitionMode) => set({ isExhibitionMode }),

  configureExhibitionMatch: (botId = 'necto', durationSec = 90, teamSize = 'standard') => {
    const resolvedBotId: ExpBotPolicyId = botId === 'nexto' ? 'nexto' : 'necto';
    const resolvedDuration = Math.max(30, Math.min(900, Math.round(Number(durationSec) || 90)));
    const countPerTeam = teamSize === 'standard' ? 3 : teamSize === 'double' ? 2 : 1;
    const roster = buildTeamSlotsFromColorPrefs(countPerTeam, resolvedBotId);

    set({
      isExhibitionMode: true,
      exhibitionTeamSize: teamSize,
      exhibitionBotId: resolvedBotId,
      playerParticipation: roster.playerParticipation,
      blueSlots: roster.blueSlots,
      orangeSlots: roster.orangeSlots,
      activeCameraCarIndex: roster.activeCameraCarIndex,
      matchDurationSec: resolvedDuration,
      remainingSec: resolvedDuration,
      speedMultiplier: 100,
      unlimitedBoost: false,
      disableGoalReplay: false,
    });
  },

  syncExhibitionFromColorPrefs: (triggerRuntime = true) => {
    const state = get();
    const { primaryTeam, blueColors, orangeColors } = resolveGarageColorPrefs();
    const nextParticipation: ExpPlayerParticipation =
      state.playerParticipation === 'none' && !state.isExhibitionMode
        ? 'none'
        : primaryTeam;
    const prevParticipation = state.playerParticipation;

    const nextBlue = state.blueSlots.map((slot, i) => ({
      ...slot,
      team: 0 as const,
      isPlayer: nextParticipation === 'blue' && i === 0,
      colorSlot: blueColors[i] ?? slot.colorSlot,
    }));
    const nextOrange = state.orangeSlots.map((slot, i) => ({
      ...slot,
      team: 1 as const,
      isPlayer: nextParticipation === 'orange' && i === 0,
      colorSlot: orangeColors[i] ?? slot.colorSlot,
    }));
    const nextCamIdx =
      nextParticipation === 'orange'
        ? nextBlue.length
        : nextParticipation === 'blue'
        ? 0
        : state.activeCameraCarIndex;

    set({
      playerParticipation: nextParticipation,
      blueSlots: nextBlue,
      orangeSlots: nextOrange,
      activeCameraCarIndex: nextCamIdx,
    });

    if (triggerRuntime && state.matchActive) {
      if (prevParticipation !== nextParticipation) {
        get().runtimeHandlers.onApplyRosterAndStart?.();
      } else {
        get().runtimeHandlers.onHotSwapSlotColor?.(
          nextParticipation === 'orange' ? 1 : 0,
          0,
          (nextParticipation === 'orange' ? nextOrange[0] : nextBlue[0])?.colorSlot ?? 3
        );
      }
    }
  },

  setPlayerParticipation: (playerParticipation) => {
    const state = get();
    let blue = [...state.blueSlots];
    let orange = [...state.orangeSlots];

    if (playerParticipation === 'blue' && blue.length === 0) {
      blue = [
        {
          id: `blue-${Date.now()}`,
          team: 0,
          isPlayer: true,
          botType: 'nexto',
          colorSlot: pickUnusedColorSlot(blue, orange, 0),
        },
      ];
    } else if (playerParticipation === 'orange' && orange.length === 0) {
      orange = [
        {
          id: `orange-${Date.now()}`,
          team: 1,
          isPlayer: true,
          botType: 'nexto',
          colorSlot: pickUnusedColorSlot(blue, orange, 1),
        },
      ];
    }

    const normalized = normalizeTeamPlayerFlags(blue, orange, playerParticipation);
    const defaultCameraIdx =
      playerParticipation === 'orange' ? normalized.blueSlots.length : 0;

    set({
      playerParticipation,
      blueSlots: normalized.blueSlots,
      orangeSlots: normalized.orangeSlots,
      activeCameraCarIndex: defaultCameraIdx,
    });
  },

  addBotToTeam: (team, botType = 'nexto') => {
    const state = get();
    const targetList = team === 0 ? state.blueSlots : state.orangeSlots;
    const totalCars = state.blueSlots.length + state.orangeSlots.length;
    if (targetList.length >= 5 || totalCars >= 6) return;

    const newColor = pickUnusedColorSlot(state.blueSlots, state.orangeSlots, team);
    const newSlot: ExperimentalMultiBotsSlotConfig = {
      id: `${team === 0 ? 'blue' : 'orange'}-${Date.now()}-${targetList.length}`,
      team,
      isPlayer: false,
      botType,
      colorSlot: newColor,
    };

    const nextBlue = team === 0 ? [...state.blueSlots, newSlot] : [...state.blueSlots];
    const nextOrange = team === 1 ? [...state.orangeSlots, newSlot] : [...state.orangeSlots];
    const normalized = normalizeTeamPlayerFlags(
      nextBlue,
      nextOrange,
      state.playerParticipation
    );

    set({
      blueSlots: normalized.blueSlots,
      orangeSlots: normalized.orangeSlots,
    });
  },

  removeSlotFromTeam: (team, slotIndex) => {
    const state = get();
    const targetList = team === 0 ? state.blueSlots : state.orangeSlots;
    const otherList = team === 0 ? state.orangeSlots : state.blueSlots;

    // Keep at least 1 car in the arena
    if (targetList.length + otherList.length <= 1) return;
    if (slotIndex < 0 || slotIndex >= targetList.length) return;

    const removedSlot = targetList[slotIndex];
    let nextParticipation = state.playerParticipation;
    if (removedSlot.isPlayer) {
      nextParticipation = 'none';
    }

    const updatedTarget = targetList.filter((_, idx) => idx !== slotIndex);
    const nextBlue = team === 0 ? updatedTarget : [...state.blueSlots];
    const nextOrange = team === 1 ? updatedTarget : [...state.orangeSlots];
    const normalized = normalizeTeamPlayerFlags(nextBlue, nextOrange, nextParticipation);
    const totalCars = normalized.blueSlots.length + normalized.orangeSlots.length;

    set({
      playerParticipation: nextParticipation,
      blueSlots: normalized.blueSlots,
      orangeSlots: normalized.orangeSlots,
      activeCameraCarIndex: Math.min(state.activeCameraCarIndex, Math.max(0, totalCars - 1)),
    });
  },

  setSlotBotType: (team, slotIndex, botType) => {
    const state = get();
    const updateFn = (list: ExperimentalMultiBotsSlotConfig[]) =>
      list.map((slot, idx) => (idx === slotIndex ? { ...slot, botType } : slot));

    if (team === 0) {
      set({ blueSlots: updateFn(state.blueSlots) });
    } else {
      set({ orangeSlots: updateFn(state.orangeSlots) });
    }
    get().runtimeHandlers.onHotSwapSlotBotType?.(team, slotIndex, botType);
  },

  setSlotColor: (team, slotIndex, colorSlot) => {
    const state = get();
    const currentList = team === 0 ? state.blueSlots : state.orangeSlots;
    const prevColor = currentList[slotIndex]?.colorSlot ?? 0;
    if (prevColor === colorSlot) return;

    // Swap color with any other slot currently using colorSlot so all 6 slots remain unique
    const swapIfMatching = (slot: ExperimentalMultiBotsSlotConfig) =>
      slot.colorSlot === colorSlot ? { ...slot, colorSlot: prevColor } : slot;

    const nextBlue = state.blueSlots.map((slot, idx) =>
      team === 0 && idx === slotIndex ? { ...slot, colorSlot } : swapIfMatching(slot)
    );
    const nextOrange = state.orangeSlots.map((slot, idx) =>
      team === 1 && idx === slotIndex ? { ...slot, colorSlot } : swapIfMatching(slot)
    );

    set({ blueSlots: nextBlue, orangeSlots: nextOrange });
    get().runtimeHandlers.onHotSwapSlotColor?.(team, slotIndex, colorSlot);
  },

  applyPresetRoster: (preset) => {
    const isPlayerPreset =
      preset === '1v1-player' || preset === '2v2-player' || preset === '3v3-player';
    let countPerTeam = 3;

    if (preset === '1v1-player' || preset === '1v1-bots') {
      countPerTeam = 1;
    } else if (preset === '2v2-player' || preset === '2v2-bots') {
      countPerTeam = 2;
    } else {
      countPerTeam = 3;
    }

    const botPattern: ExpBotPolicyId[] = ['nexto', 'necto', 'nexto'];
    const roster = buildTeamSlotsFromColorPrefs(
      countPerTeam,
      botPattern,
      isPlayerPreset ? undefined : 'none'
    );

    set({
      playerParticipation: roster.playerParticipation,
      blueSlots: roster.blueSlots,
      orangeSlots: roster.orangeSlots,
      activeCameraCarIndex: roster.activeCameraCarIndex,
    });
  },

  setMatchDurationSec: (sec) => {
    const clamped = Math.max(0, Math.min(900, Math.round(Number(sec) || 0)));
    set({ matchDurationSec: clamped });
  },

  setActiveCameraCarIndex: (carIndex) => {
    const state = get();
    const maxCars = Math.max(1, state.spawnedCars.length || state.blueSlots.length + state.orangeSlots.length);
    const clamped = Math.max(0, Math.min(maxCars - 1, carIndex));
    set({ activeCameraCarIndex: clamped });
    get().runtimeHandlers.onSelectCameraCar?.(clamped);
  },

  setSpeedMultiplier: (speedMultiplier) => {
    set({ speedMultiplier });
    get().runtimeHandlers.onSpeedMultiplierChange?.(speedMultiplier);
  },

  setUnlimitedBoost: (unlimitedBoost) => {
    set({ unlimitedBoost });
    get().runtimeHandlers.onUnlimitedBoostChange?.(unlimitedBoost);
  },

  setDisableGoalReplay: (disableGoalReplay) => {
    set({ disableGoalReplay });
  },

  startOrApplyMatch: () => {
    get().runtimeHandlers.onApplyRosterAndStart?.();
  },

  triggerSandboxAction: (action) => {
    get().runtimeHandlers.onTriggerAction?.(action);
  },

  preloadEngines: () => {
    get().runtimeHandlers.onPreloadEngines?.();
  },

  updateLiveTelemetry: (patch) => set((s) => ({ ...s, ...patch })),
}));
