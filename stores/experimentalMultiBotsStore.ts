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
  computeExhibitionColorPrefsSync,
  computeUpdatedParticipationRoster,
  computeAddedBotRoster,
  computeRemovedSlotRoster,
  computeUpdatedSlotBotTypeRoster,
  computeSwappedSlotColorRoster,
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
    const { nextRoster, participationChanged } = computeExhibitionColorPrefsSync(state);
    set({
      ...nextRoster,
      savedMultiBotsRoster:
        state.activeSubMode === 'multi-bots' ? nextRoster : state.savedMultiBotsRoster,
    });
    if (triggerRuntime && state.matchActive) {
      if (participationChanged) {
        get().runtimeHandlers.onApplyRosterAndStart?.();
      } else {
        const nextParticipation = nextRoster.playerParticipation;
        get().runtimeHandlers.onHotSwapSlotColor?.(
          nextParticipation === 'orange' ? 1 : 0,
          0,
          (nextParticipation === 'orange'
            ? nextRoster.orangeSlots[0]
            : nextRoster.blueSlots[0]
          )?.colorSlot ?? 3
        );
      }
    }
  },

  setPlayerParticipation: (playerParticipation) => {
    const state = get();
    const nextRoster = computeUpdatedParticipationRoster(
      state.blueSlots,
      state.orangeSlots,
      playerParticipation
    );
    set({
      ...nextRoster,
      savedMultiBotsRoster:
        state.activeSubMode === 'multi-bots' ? nextRoster : state.savedMultiBotsRoster,
    });
    if (get().matchActive) {
      get().runtimeHandlers.onApplyRosterAndStart?.();
    }
  },

  addBotToTeam: (team, botType: ExpBotPolicyId = 'nexto') => {
    const state = get();
    const nextRoster = computeAddedBotRoster({
      blueSlots: state.blueSlots,
      orangeSlots: state.orangeSlots,
      playerParticipation: state.playerParticipation,
      activeCameraCarIndex: state.activeCameraCarIndex,
      team,
      botType,
    });
    if (!nextRoster) return;
    set({
      blueSlots: nextRoster.blueSlots,
      orangeSlots: nextRoster.orangeSlots,
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
    const nextRoster = computeRemovedSlotRoster({
      blueSlots: state.blueSlots,
      orangeSlots: state.orangeSlots,
      playerParticipation: state.playerParticipation,
      activeCameraCarIndex: state.activeCameraCarIndex,
      team,
      slotIndex,
    });
    if (!nextRoster) return;
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
    const nextRoster = computeUpdatedSlotBotTypeRoster({
      blueSlots: state.blueSlots,
      orangeSlots: state.orangeSlots,
      playerParticipation: state.playerParticipation,
      activeCameraCarIndex: state.activeCameraCarIndex,
      team,
      slotIndex,
      botType,
    });
    set({
      blueSlots: nextRoster.blueSlots,
      orangeSlots: nextRoster.orangeSlots,
      activeCameraCarIndex: nextRoster.activeCameraCarIndex,
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
    const nextRoster = computeSwappedSlotColorRoster({
      blueSlots: state.blueSlots,
      orangeSlots: state.orangeSlots,
      playerParticipation: state.playerParticipation,
      activeCameraCarIndex: state.activeCameraCarIndex,
      team,
      slotIndex,
      colorSlot,
    });
    if (!nextRoster) return;
    set({
      blueSlots: nextRoster.blueSlots,
      orangeSlots: nextRoster.orangeSlots,
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
