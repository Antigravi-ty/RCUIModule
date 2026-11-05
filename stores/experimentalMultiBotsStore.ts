import { create } from 'zustand';
import {
  EXP_CAR_COLOR_PALETTE,
  EXP_BOT_POLICY_METAS,
  LEGACY_EXP_BOT_POLICY_METAS,
  BOTPACK_9700488_POLICY_METAS,
  getExpBotPolicyMeta,
  getExpColorSwatch,
  BLUE_DEFAULT_COLORS,
  ORANGE_DEFAULT_COLORS,
  resolveGarageColorPrefs,
  buildTeamSlotsFromColorPrefs,
  buildAsymmetricTeamSlotsFromColorPrefs,
  pickUnusedColorSlot,
  normalizeTeamPlayerFlags,
  type ExpBotPolicyId,
  type ExpBotPolicyMeta,
  type ExpSubMode,
  type ExpRosterSnapshot,
  type ExpPlayerParticipation,
  type ExpSpeedMultiplier,
  type ExpColorSwatch,
  type ExperimentalMultiBotsSlotConfig,
  type ExpSpawnedCarInfo,
} from './experimentalMultiBotsRosterUtils';

export {
  EXP_CAR_COLOR_PALETTE,
  EXP_BOT_POLICY_METAS,
  LEGACY_EXP_BOT_POLICY_METAS,
  BOTPACK_9700488_POLICY_METAS,
  getExpBotPolicyMeta,
  getExpColorSwatch,
  type ExpBotPolicyId,
  type ExpBotPolicyMeta,
  type ExpSubMode,
  type ExpRosterSnapshot,
  type ExpPlayerParticipation,
  type ExpSpeedMultiplier,
  type ExpColorSwatch,
  type ExperimentalMultiBotsSlotConfig,
  type ExpSpawnedCarInfo,
};

export interface ExperimentalMultiBotsState {
  // Roster & Player Configuration
  activeSubMode: ExpSubMode;
  savedMultiBotsRoster: ExpRosterSnapshot;
  savedBotpackModel: ExpBotPolicyId;
  playerParticipation: ExpPlayerParticipation; // 'none' (Spectate Bots), 'blue', or 'orange'
  blueSlots: ExperimentalMultiBotsSlotConfig[]; // Up to 5 slots on Team Blue (0)
  orangeSlots: ExperimentalMultiBotsSlotConfig[]; // Up to 5 slots on Team Orange (1)
  activeBotpackShowcaseModel: ExpBotPolicyId | null;

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
  activateMultiBotsSubMode: (restartIfActive?: boolean) => void;
  activateBotpackSubMode: (botType?: ExpBotPolicyId, restartIfActive?: boolean) => void;
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
  applyAsymmetricPresetRoster: (
    blueCount: number,
    orangeCount: number,
    participationOverride?: ExpPlayerParticipation
  ) => void;
  applyBotpack9700488Showcase: (botType: ExpBotPolicyId, restartIfActive?: boolean) => void;
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

const initialRoster = buildTeamSlotsFromColorPrefs(3, ['nexto', 'necto', 'nexto']);

export const useExperimentalMultiBotsStore = create<ExperimentalMultiBotsState>((set, get) => ({
  activeSubMode: 'multi-bots',
  savedMultiBotsRoster: initialRoster,
  savedBotpackModel: 'chronos',
  playerParticipation: initialRoster.playerParticipation,
  blueSlots: initialRoster.blueSlots,
  orangeSlots: initialRoster.orangeSlots,
  activeBotpackShowcaseModel: null,

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

  setIsExhibitionMode: (isExhibitionMode) =>
    set((s) => ({
      isExhibitionMode,
      activeSubMode: isExhibitionMode
        ? 'exhibition'
        : s.activeSubMode === 'exhibition'
        ? 'multi-bots'
        : s.activeSubMode,
    })),

  activateMultiBotsSubMode: (restartIfActive = false) => {
    const state = get();
    const restored =
      state.activeSubMode === 'multi-bots'
        ? {
            playerParticipation: state.playerParticipation,
            blueSlots: state.blueSlots,
            orangeSlots: state.orangeSlots,
            activeCameraCarIndex: state.activeCameraCarIndex,
          }
        : state.savedMultiBotsRoster;

    set({
      activeSubMode: 'multi-bots',
      isExhibitionMode: false,
      activeBotpackShowcaseModel: null,
      playerParticipation: restored.playerParticipation,
      blueSlots: restored.blueSlots,
      orangeSlots: restored.orangeSlots,
      activeCameraCarIndex: restored.activeCameraCarIndex,
    });

    get().runtimeHandlers.onPreloadEngines?.();
    if (restartIfActive && get().matchActive) {
      get().runtimeHandlers.onApplyRosterAndStart?.();
    }
  },

  activateBotpackSubMode: (botType, restartIfActive = false) => {
    const state = get();
    const targetBot = botType ?? state.activeBotpackShowcaseModel ?? state.savedBotpackModel ?? 'chronos';
    get().applyBotpack9700488Showcase(targetBot, restartIfActive);
  },

  configureExhibitionMatch: (botId = 'necto', durationSec = 90, teamSize = 'standard') => {
    const state = get();
    const savedMultiBotsRoster =
      state.activeSubMode === 'multi-bots'
        ? {
            playerParticipation: state.playerParticipation,
            blueSlots: state.blueSlots,
            orangeSlots: state.orangeSlots,
            activeCameraCarIndex: state.activeCameraCarIndex,
          }
        : state.savedMultiBotsRoster;
    const resolvedBotId: ExpBotPolicyId = botId === 'nexto' ? 'nexto' : 'necto';
    const resolvedDuration = Math.max(30, Math.min(900, Math.round(Number(durationSec) || 90)));
    const countPerTeam = teamSize === 'standard' ? 3 : teamSize === 'double' ? 2 : 1;
    const roster = buildTeamSlotsFromColorPrefs(countPerTeam, resolvedBotId);

    set({
      activeSubMode: 'exhibition',
      savedMultiBotsRoster,
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

    const nextRoster: ExpRosterSnapshot = {
      playerParticipation: nextParticipation,
      blueSlots: nextBlue,
      orangeSlots: nextOrange,
      activeCameraCarIndex: nextCamIdx,
    };

    set({
      ...nextRoster,
      savedMultiBotsRoster:
        state.activeSubMode === 'multi-bots' ? nextRoster : state.savedMultiBotsRoster,
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

    const nextRoster: ExpRosterSnapshot = {
      playerParticipation,
      blueSlots: normalized.blueSlots,
      orangeSlots: normalized.orangeSlots,
      activeCameraCarIndex: defaultCameraIdx,
    };

    set({
      ...nextRoster,
      savedMultiBotsRoster:
        state.activeSubMode === 'multi-bots' ? nextRoster : state.savedMultiBotsRoster,
    });
    if (get().matchActive) {
      get().runtimeHandlers.onApplyRosterAndStart?.();
    }
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

    const nextRoster: ExpRosterSnapshot = {
      playerParticipation: state.playerParticipation,
      blueSlots: normalized.blueSlots,
      orangeSlots: normalized.orangeSlots,
      activeCameraCarIndex: state.activeCameraCarIndex,
    };

    set({
      blueSlots: normalized.blueSlots,
      orangeSlots: normalized.orangeSlots,
      savedMultiBotsRoster:
        state.activeSubMode === 'multi-bots' ? nextRoster : state.savedMultiBotsRoster,
    });
    get().runtimeHandlers.onPreloadEngines?.();
    if (get().matchActive) {
      get().runtimeHandlers.onApplyRosterAndStart?.();
    }
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
    const nextCamIdx = Math.min(state.activeCameraCarIndex, Math.max(0, totalCars - 1));

    const nextRoster: ExpRosterSnapshot = {
      playerParticipation: nextParticipation,
      blueSlots: normalized.blueSlots,
      orangeSlots: normalized.orangeSlots,
      activeCameraCarIndex: nextCamIdx,
    };

    set({
      ...nextRoster,
      savedMultiBotsRoster:
        state.activeSubMode === 'multi-bots' ? nextRoster : state.savedMultiBotsRoster,
    });
    if (get().matchActive) {
      get().runtimeHandlers.onApplyRosterAndStart?.();
    }
  },

  setSlotBotType: (team, slotIndex, botType) => {
    const state = get();
    const meta = getExpBotPolicyMeta(botType);
    const maxCap = meta.maxPlayersPerTeam;

    const updateFn = (list: ExperimentalMultiBotsSlotConfig[]) =>
      list.map((slot, idx) => (idx === slotIndex ? { ...slot, botType } : slot));

    let nextBlue = team === 0 ? updateFn(state.blueSlots) : [...state.blueSlots];
    let nextOrange = team === 1 ? updateFn(state.orangeSlots) : [...state.orangeSlots];

    // Enforce maxPlayersPerTeam when selecting format-constrained models (e.g., Kira 1v1, Dice 2v2)
    if (maxCap < 3) {
      if (nextBlue.length > maxCap) nextBlue = nextBlue.slice(0, maxCap);
      if (nextOrange.length > maxCap) nextOrange = nextOrange.slice(0, maxCap);
    }

    const totalCars = nextBlue.length + nextOrange.length;
    const nextCamIdx = Math.min(state.activeCameraCarIndex, Math.max(0, totalCars - 1));
    const nextRoster: ExpRosterSnapshot = {
      playerParticipation: state.playerParticipation,
      blueSlots: nextBlue,
      orangeSlots: nextOrange,
      activeCameraCarIndex: nextCamIdx,
    };

    set({
      blueSlots: nextBlue,
      orangeSlots: nextOrange,
      activeCameraCarIndex: nextCamIdx,
      savedMultiBotsRoster:
        state.activeSubMode === 'multi-bots' ? nextRoster : state.savedMultiBotsRoster,
    });

    get().runtimeHandlers.onPreloadEngines?.();
    if (get().matchActive) {
      get().runtimeHandlers.onApplyRosterAndStart?.();
    }
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

    const nextRoster: ExpRosterSnapshot = {
      playerParticipation: state.playerParticipation,
      blueSlots: nextBlue,
      orangeSlots: nextOrange,
      activeCameraCarIndex: state.activeCameraCarIndex,
    };

    set({
      blueSlots: nextBlue,
      orangeSlots: nextOrange,
      savedMultiBotsRoster:
        state.activeSubMode === 'multi-bots' ? nextRoster : state.savedMultiBotsRoster,
    });
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
      activeSubMode: 'multi-bots',
      savedMultiBotsRoster: roster,
      isExhibitionMode: false,
      activeBotpackShowcaseModel: null,
      playerParticipation: roster.playerParticipation,
      blueSlots: roster.blueSlots,
      orangeSlots: roster.orangeSlots,
      activeCameraCarIndex: roster.activeCameraCarIndex,
    });
    if (get().matchActive) {
      get().runtimeHandlers.onApplyRosterAndStart?.();
    }
  },

  applyAsymmetricPresetRoster: (blueCount, orangeCount, participationOverride) => {
    const state = get();
    const botPattern: ExpBotPolicyId[] = ['nexto', 'necto', 'nexto'];
    const roster = buildAsymmetricTeamSlotsFromColorPrefs(
      blueCount,
      orangeCount,
      botPattern,
      participationOverride !== undefined ? participationOverride : state.playerParticipation
    );

    set({
      activeSubMode: 'multi-bots',
      savedMultiBotsRoster: roster,
      isExhibitionMode: false,
      activeBotpackShowcaseModel: null,
      playerParticipation: roster.playerParticipation,
      blueSlots: roster.blueSlots,
      orangeSlots: roster.orangeSlots,
      activeCameraCarIndex: roster.activeCameraCarIndex,
    });
    get().runtimeHandlers.onPreloadEngines?.();
    if (get().matchActive) {
      get().runtimeHandlers.onApplyRosterAndStart?.();
    }
  },

  applyBotpack9700488Showcase: (botType, restartIfActive = true) => {
    const state = get();
    const savedMultiBotsRoster =
      state.activeSubMode === 'multi-bots'
        ? {
            playerParticipation: state.playerParticipation,
            blueSlots: state.blueSlots,
            orangeSlots: state.orangeSlots,
            activeCameraCarIndex: state.activeCameraCarIndex,
          }
        : state.savedMultiBotsRoster;

    const meta = getExpBotPolicyMeta(botType);
    const countPerTeam = meta.maxPlayersPerTeam;
    const roster = buildTeamSlotsFromColorPrefs(countPerTeam, meta.id, 'none');

    set({
      activeSubMode: 'botpack',
      savedMultiBotsRoster,
      savedBotpackModel: meta.id,
      isExhibitionMode: false,
      activeBotpackShowcaseModel: meta.id,
      playerParticipation: 'none',
      blueSlots: roster.blueSlots,
      orangeSlots: roster.orangeSlots,
      activeCameraCarIndex: 0,
    });

    get().runtimeHandlers.onPreloadEngines?.();
    if (restartIfActive && get().matchActive) {
      get().runtimeHandlers.onApplyRosterAndStart?.();
    }
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
