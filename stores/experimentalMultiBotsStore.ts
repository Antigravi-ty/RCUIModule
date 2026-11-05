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
  extractExpRosterSnapshot,
  buildRosterMutationPatch,
  createGuardedExpRuntimeHandlers,
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

  runtimeHandlers: createGuardedExpRuntimeHandlers(
    {} as ExperimentalMultiBotsState['runtimeHandlers'],
    (prop) =>
      `[experimentalMultiBotsStore] Runtime handler "${prop}" was invoked before ExperimentalMultiBotsMode registered its handlers.`
  ),
  setRuntimeHandlers: (handlers) =>
    set((s) => ({
      runtimeHandlers: createGuardedExpRuntimeHandlers(
        { ...s.runtimeHandlers, ...handlers },
        (prop) => `[experimentalMultiBotsStore] Runtime handler "${prop}" is not registered in the current mode.`
      ),
    })),

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
        ? extractExpRosterSnapshot(state)
        : state.savedMultiBotsRoster;

    set({
      activeSubMode: 'multi-bots',
      isExhibitionMode: false,
      activeBotpackShowcaseModel: null,
      ...restored,
    });

    get().runtimeHandlers.onPreloadEngines?.();
    if (restartIfActive && get().matchActive) {
      get().runtimeHandlers.onApplyRosterAndStart?.();
    }
  },

  activateBotpackSubMode: (botType, restartIfActive = false) => {
    const state = get();
    const targetBot =
      botType ?? state.activeBotpackShowcaseModel ?? state.savedBotpackModel ?? 'chronos';
    get().applyBotpack9700488Showcase(targetBot, restartIfActive);
  },

  configureExhibitionMatch: (botId = 'necto', durationSec = 90, teamSize = 'standard') => {
    const state = get();
    const savedMultiBotsRoster =
      state.activeSubMode === 'multi-bots'
        ? extractExpRosterSnapshot(state)
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
      ...roster,
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

    set(buildRosterMutationPatch(state.activeSubMode, state.savedMultiBotsRoster, nextRoster));

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
    const { blueColors, orangeColors } = resolveGarageColorPrefs();
    let nextBlue = [...state.blueSlots];
    let nextOrange = [...state.orangeSlots];

    if (playerParticipation === 'blue' && nextBlue.length === 0) {
      nextBlue = [
        {
          id: `blue-${Date.now()}`,
          team: 0,
          isPlayer: true,
          botType: 'nexto',
          colorSlot: blueColors[0] ?? BLUE_DEFAULT_COLORS[0],
        },
      ];
    } else if (playerParticipation === 'orange' && nextOrange.length === 0) {
      nextOrange = [
        {
          id: `orange-${Date.now()}`,
          team: 1,
          isPlayer: true,
          botType: 'nexto',
          colorSlot: orangeColors[0] ?? ORANGE_DEFAULT_COLORS[0],
        },
      ];
    }

    const normalized = normalizeTeamPlayerFlags(nextBlue, nextOrange, playerParticipation);
    const defaultCameraIdx =
      playerParticipation === 'orange' ? normalized.blueSlots.length : 0;

    set(
      buildRosterMutationPatch(state.activeSubMode, state.savedMultiBotsRoster, {
        playerParticipation,
        blueSlots: normalized.blueSlots,
        orangeSlots: normalized.orangeSlots,
        activeCameraCarIndex: defaultCameraIdx,
      })
    );
    if (get().matchActive) {
      get().runtimeHandlers.onApplyRosterAndStart?.();
    }
  },

  addBotToTeam: (team, botType = 'nexto') => {
    const state = get();
    const targetSlots = team === 0 ? state.blueSlots : state.orangeSlots;
    const totalCars = state.blueSlots.length + state.orangeSlots.length;
    if (targetSlots.length >= 5 || totalCars >= 6) return;

    const colorSlot = pickUnusedColorSlot(state.blueSlots, state.orangeSlots, team);
    const newSlot: ExperimentalMultiBotsSlotConfig = {
      id: `${team === 0 ? 'blue' : 'orange'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      team,
      isPlayer: false,
      botType,
      colorSlot,
    };

    const nextBlue = team === 0 ? [...state.blueSlots, newSlot] : [...state.blueSlots];
    const nextOrange = team === 1 ? [...state.orangeSlots, newSlot] : [...state.orangeSlots];
    const normalized = normalizeTeamPlayerFlags(nextBlue, nextOrange, state.playerParticipation);

    set(
      buildRosterMutationPatch(state.activeSubMode, state.savedMultiBotsRoster, {
        playerParticipation: state.playerParticipation,
        blueSlots: normalized.blueSlots,
        orangeSlots: normalized.orangeSlots,
        activeCameraCarIndex: state.activeCameraCarIndex,
      })
    );
    get().runtimeHandlers.onPreloadEngines?.();
    if (get().matchActive) {
      get().runtimeHandlers.onApplyRosterAndStart?.();
    }
  },

  removeSlotFromTeam: (team, slotIndex) => {
    const state = get();
    const targetSlots = team === 0 ? state.blueSlots : state.orangeSlots;
    const otherSlots = team === 0 ? state.orangeSlots : state.blueSlots;
    if (targetSlots.length + otherSlots.length <= 1) return;

    const removedSlot = targetSlots[slotIndex];
    const updatedTarget = targetSlots.filter((_, idx) => idx !== slotIndex);
    let nextParticipation = state.playerParticipation;

    if (removedSlot?.isPlayer && updatedTarget.length === 0) {
      nextParticipation = 'none';
    }

    const nextBlue = team === 0 ? updatedTarget : [...state.blueSlots];
    const nextOrange = team === 1 ? updatedTarget : [...state.orangeSlots];
    const normalized = normalizeTeamPlayerFlags(nextBlue, nextOrange, nextParticipation);
    const totalCars = normalized.blueSlots.length + normalized.orangeSlots.length;
    const nextCamIdx = Math.min(state.activeCameraCarIndex, Math.max(0, totalCars - 1));

    set(
      buildRosterMutationPatch(state.activeSubMode, state.savedMultiBotsRoster, {
        playerParticipation: nextParticipation,
        blueSlots: normalized.blueSlots,
        orangeSlots: normalized.orangeSlots,
        activeCameraCarIndex: nextCamIdx,
      })
    );
    if (get().matchActive) {
      get().runtimeHandlers.onApplyRosterAndStart?.();
    }
  },

  setSlotBotType: (team, slotIndex, botType) => {
    const state = get();
    const targetSlots = team === 0 ? state.blueSlots : state.orangeSlots;
    const slot = targetSlots[slotIndex];
    if (!slot || slot.isPlayer) return;

    const meta = getExpBotPolicyMeta(botType);
    const maxPerTeam = meta.maxPlayersPerTeam;

    let nextBlue = state.blueSlots.map((s, idx) =>
      team === 0 && idx === slotIndex ? { ...s, botType } : s
    );
    let nextOrange = state.orangeSlots.map((s, idx) =>
      team === 1 && idx === slotIndex ? { ...s, botType } : s
    );

    if (nextBlue.length > maxPerTeam) nextBlue = nextBlue.slice(0, maxPerTeam);
    if (nextOrange.length > maxPerTeam) nextOrange = nextOrange.slice(0, maxPerTeam);

    const totalCars = nextBlue.length + nextOrange.length;
    const nextCamIdx = Math.min(state.activeCameraCarIndex, Math.max(0, totalCars - 1));

    set(
      buildRosterMutationPatch(state.activeSubMode, state.savedMultiBotsRoster, {
        playerParticipation: state.playerParticipation,
        blueSlots: nextBlue,
        orangeSlots: nextOrange,
        activeCameraCarIndex: nextCamIdx,
      })
    );

    get().runtimeHandlers.onPreloadEngines?.();
    get().runtimeHandlers.onHotSwapSlotBotType?.(team, slotIndex, botType);
  },

  setSlotColor: (team, slotIndex, colorSlot) => {
    const state = get();
    const targetSlots = team === 0 ? state.blueSlots : state.orangeSlots;
    const currentSlot = targetSlots[slotIndex];
    if (!currentSlot || currentSlot.colorSlot === colorSlot) return;

    const prevColor = currentSlot.colorSlot;
    const swapIfMatching = (slot: ExperimentalMultiBotsSlotConfig) =>
      slot.colorSlot === colorSlot ? { ...slot, colorSlot: prevColor } : slot;

    const nextBlue = state.blueSlots.map((slot, idx) =>
      team === 0 && idx === slotIndex ? { ...slot, colorSlot } : swapIfMatching(slot)
    );
    const nextOrange = state.orangeSlots.map((slot, idx) =>
      team === 1 && idx === slotIndex ? { ...slot, colorSlot } : swapIfMatching(slot)
    );

    set(
      buildRosterMutationPatch(state.activeSubMode, state.savedMultiBotsRoster, {
        playerParticipation: state.playerParticipation,
        blueSlots: nextBlue,
        orangeSlots: nextOrange,
        activeCameraCarIndex: state.activeCameraCarIndex,
      })
    );
    get().runtimeHandlers.onHotSwapSlotColor?.(team, slotIndex, colorSlot);
  },

  applyPresetRoster: (preset) => {
    const isPlayerPreset = preset.endsWith('-player');
    const countPerTeam = preset.startsWith('1v1') ? 1 : preset.startsWith('2v2') ? 2 : 3;
    const botPattern: ExpBotPolicyId[] =
      countPerTeam === 1
        ? ['nexto']
        : countPerTeam === 2
        ? ['nexto', 'necto']
        : ['nexto', 'necto', 'nexto'];
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
      ...roster,
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
      ...roster,
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
        ? extractExpRosterSnapshot(state)
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
    const maxCars = Math.max(
      1,
      state.spawnedCars.length || state.blueSlots.length + state.orangeSlots.length
    );
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
