import { loadStoredColorPrefs } from '../config/vehiclePresets';

export type ExpBotPolicyId =
  | 'nexto'
  | 'necto'
  | 'heuristic'
  | 'chronos'
  | 'dice'
  | 'ducky'
  | 'fury'
  | 'galactus'
  | 'kira'
  | 'rain'
  | 'ripple_v1_1';

export interface ExpBotPolicyMeta {
  id: ExpBotPolicyId;
  label: string;
  shortLabel: string;
  maxPlayersPerTeam: 1 | 2 | 3;
  formatBadge: '1v1' | '2v2' | '3v3';
  category: 'legacy' | 'botpack_9700488';
}

export const EXP_BOT_POLICY_METAS: readonly ExpBotPolicyMeta[] = Object.freeze([
  { id: 'nexto', label: 'Nexto', shortLabel: 'Nexto', maxPlayersPerTeam: 3, formatBadge: '3v3', category: 'legacy' },
  { id: 'necto', label: 'Necto', shortLabel: 'Necto', maxPlayersPerTeam: 3, formatBadge: '3v3', category: 'legacy' },
  { id: 'heuristic', label: 'Heuristic', shortLabel: 'Heuristic', maxPlayersPerTeam: 3, formatBadge: '3v3', category: 'legacy' },
  { id: 'chronos', label: 'Chronos v2.1', shortLabel: 'Chronos', maxPlayersPerTeam: 3, formatBadge: '3v3', category: 'botpack_9700488' },
  { id: 'dice', label: 'Dice', shortLabel: 'Dice', maxPlayersPerTeam: 2, formatBadge: '2v2', category: 'botpack_9700488' },
  { id: 'ducky', label: 'Ducky', shortLabel: 'Ducky', maxPlayersPerTeam: 3, formatBadge: '3v3', category: 'botpack_9700488' },
  { id: 'fury', label: 'Fury', shortLabel: 'Fury', maxPlayersPerTeam: 3, formatBadge: '3v3', category: 'botpack_9700488' },
  { id: 'galactus', label: 'Galactus v2', shortLabel: 'Galactus', maxPlayersPerTeam: 3, formatBadge: '3v3', category: 'botpack_9700488' },
  { id: 'kira', label: 'Kira', shortLabel: 'Kira', maxPlayersPerTeam: 1, formatBadge: '1v1', category: 'botpack_9700488' },
  { id: 'rain', label: 'Rain', shortLabel: 'Rain', maxPlayersPerTeam: 3, formatBadge: '3v3', category: 'botpack_9700488' },
  { id: 'ripple_v1_1', label: 'Ripple v1.1', shortLabel: 'Ripple 1.1', maxPlayersPerTeam: 3, formatBadge: '3v3', category: 'botpack_9700488' },
]);

export const LEGACY_EXP_BOT_POLICY_METAS: readonly ExpBotPolicyMeta[] = Object.freeze(
  EXP_BOT_POLICY_METAS.filter((m) => m.category === 'legacy')
);

export const BOTPACK_9700488_POLICY_METAS: readonly ExpBotPolicyMeta[] = Object.freeze(
  EXP_BOT_POLICY_METAS.filter((m) => m.category === 'botpack_9700488')
);

export function getExpBotPolicyMeta(botType: string): ExpBotPolicyMeta {
  return (
    EXP_BOT_POLICY_METAS.find((m) => m.id === botType) ||
    EXP_BOT_POLICY_METAS[0]
  );
}

export type ExpPlayerParticipation = 'none' | 'blue' | 'orange';
export type ExpSpeedMultiplier = 100 | 200 | 300 | 400;
export type ExpSubMode = 'multi-bots' | 'botpack' | 'exhibition';

export interface ExpColorSwatch {
  id: number;
  name: string;
  hex: string;
  preferredTeam: 0 | 1;
}

/**
 * Standard 6-color swatch palette matching CAR_COLOR_SLOTS in vehicleConstants.ts.
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

export const BLUE_DEFAULT_COLORS = [3, 1, 5, 0, 2];
export const ORANGE_DEFAULT_COLORS = [0, 2, 4, 3, 1];

export function resolveGarageColorPrefs(): {
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

export interface ExpRosterSnapshot {
  playerParticipation: ExpPlayerParticipation;
  blueSlots: ExperimentalMultiBotsSlotConfig[];
  orangeSlots: ExperimentalMultiBotsSlotConfig[];
  activeCameraCarIndex: number;
}

export function buildAsymmetricTeamSlotsFromColorPrefs(
  blueCount: number,
  orangeCount: number,
  botType: ExpBotPolicyId | ExpBotPolicyId[],
  participationOverride?: ExpPlayerParticipation
): ExpRosterSnapshot {
  const { primaryTeam, blueColors, orangeColors } = resolveGarageColorPrefs();
  const clampedBlue = Math.max(0, Math.min(5, blueCount));
  const clampedOrange = Math.max(0, Math.min(6 - clampedBlue, Math.min(5, orangeCount)));
  let playerParticipation: ExpPlayerParticipation =
    participationOverride !== undefined ? participationOverride : primaryTeam;
  if (playerParticipation === 'blue' && clampedBlue === 0) {
    playerParticipation = clampedOrange > 0 ? 'orange' : 'none';
  } else if (playerParticipation === 'orange' && clampedOrange === 0) {
    playerParticipation = clampedBlue > 0 ? 'blue' : 'none';
  }
  const resolveBot = (i: number): ExpBotPolicyId =>
    Array.isArray(botType) ? botType[i % botType.length] : botType;

  const blueSlots: ExperimentalMultiBotsSlotConfig[] = Array.from(
    { length: clampedBlue },
    (_, i) => ({
      id: `blue-${i}`,
      team: 0 as const,
      isPlayer: playerParticipation === 'blue' && i === 0,
      botType: resolveBot(i),
      colorSlot: blueColors[i] ?? BLUE_DEFAULT_COLORS[i],
    })
  );

  const orangeSlots: ExperimentalMultiBotsSlotConfig[] = Array.from(
    { length: clampedOrange },
    (_, i) => ({
      id: `orange-${i}`,
      team: 1 as const,
      isPlayer: playerParticipation === 'orange' && i === 0,
      botType: resolveBot(i),
      colorSlot: orangeColors[i] ?? ORANGE_DEFAULT_COLORS[i],
    })
  );

  const activeCameraCarIndex =
    playerParticipation === 'orange' ? clampedBlue : 0;

  return {
    playerParticipation,
    blueSlots,
    orangeSlots,
    activeCameraCarIndex,
  };
}

export function buildTeamSlotsFromColorPrefs(
  countPerTeam: number,
  botType: ExpBotPolicyId | ExpBotPolicyId[],
  participationOverride?: ExpPlayerParticipation
): ExpRosterSnapshot {
  return buildAsymmetricTeamSlotsFromColorPrefs(
    countPerTeam,
    countPerTeam,
    botType,
    participationOverride
  );
}

export function pickUnusedColorSlot(
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

export function normalizeTeamPlayerFlags(
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

export function computeExhibitionColorPrefsSync(params: {
  playerParticipation: ExpPlayerParticipation;
  isExhibitionMode: boolean;
  blueSlots: ExperimentalMultiBotsSlotConfig[];
  orangeSlots: ExperimentalMultiBotsSlotConfig[];
  activeCameraCarIndex: number;
}): {
  nextRoster: ExpRosterSnapshot;
  participationChanged: boolean;
} {
  const { primaryTeam, blueColors, orangeColors } = resolveGarageColorPrefs();
  const nextParticipation: ExpPlayerParticipation =
    params.playerParticipation === 'none' && !params.isExhibitionMode
      ? 'none'
      : primaryTeam;
  const nextBlue = params.blueSlots.map((slot, i) => ({
    ...slot,
    team: 0 as const,
    isPlayer: nextParticipation === 'blue' && i === 0,
    colorSlot: blueColors[i] ?? slot.colorSlot,
  }));
  const nextOrange = params.orangeSlots.map((slot, i) => ({
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
      : params.activeCameraCarIndex;

  return {
    nextRoster: {
      playerParticipation: nextParticipation,
      blueSlots: nextBlue,
      orangeSlots: nextOrange,
      activeCameraCarIndex: nextCamIdx,
    },
    participationChanged: params.playerParticipation !== nextParticipation,
  };
}

export function computeUpdatedParticipationRoster(
  blueSlots: ExperimentalMultiBotsSlotConfig[],
  orangeSlots: ExperimentalMultiBotsSlotConfig[],
  playerParticipation: ExpPlayerParticipation
): ExpRosterSnapshot {
  let blue = [...blueSlots];
  let orange = [...orangeSlots];

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

  return {
    playerParticipation,
    blueSlots: normalized.blueSlots,
    orangeSlots: normalized.orangeSlots,
    activeCameraCarIndex: defaultCameraIdx,
  };
}

export function computeAddedBotRoster(params: {
  blueSlots: ExperimentalMultiBotsSlotConfig[];
  orangeSlots: ExperimentalMultiBotsSlotConfig[];
  playerParticipation: ExpPlayerParticipation;
  activeCameraCarIndex: number;
  team: 0 | 1;
  botType: ExpBotPolicyId;
}): ExpRosterSnapshot | null {
  const targetList = params.team === 0 ? params.blueSlots : params.orangeSlots;
  const totalCars = params.blueSlots.length + params.orangeSlots.length;
  if (targetList.length >= 5 || totalCars >= 6) return null;

  const newColor = pickUnusedColorSlot(params.blueSlots, params.orangeSlots, params.team);
  const newSlot: ExperimentalMultiBotsSlotConfig = {
    id: `${params.team === 0 ? 'blue' : 'orange'}-${Date.now()}-${targetList.length}`,
    team: params.team,
    isPlayer: false,
    botType: params.botType,
    colorSlot: newColor,
  };

  const nextBlue = params.team === 0 ? [...params.blueSlots, newSlot] : [...params.blueSlots];
  const nextOrange = params.team === 1 ? [...params.orangeSlots, newSlot] : [...params.orangeSlots];
  const normalized = normalizeTeamPlayerFlags(
    nextBlue,
    nextOrange,
    params.playerParticipation
  );

  return {
    playerParticipation: params.playerParticipation,
    blueSlots: normalized.blueSlots,
    orangeSlots: normalized.orangeSlots,
    activeCameraCarIndex: params.activeCameraCarIndex,
  };
}

export function computeRemovedSlotRoster(params: {
  blueSlots: ExperimentalMultiBotsSlotConfig[];
  orangeSlots: ExperimentalMultiBotsSlotConfig[];
  playerParticipation: ExpPlayerParticipation;
  activeCameraCarIndex: number;
  team: 0 | 1;
  slotIndex: number;
}): ExpRosterSnapshot | null {
  const targetList = params.team === 0 ? params.blueSlots : params.orangeSlots;
  const otherList = params.team === 0 ? params.orangeSlots : params.blueSlots;

  if (targetList.length + otherList.length <= 1) return null;
  if (params.slotIndex < 0 || params.slotIndex >= targetList.length) return null;

  const removedSlot = targetList[params.slotIndex];
  const nextParticipation = removedSlot.isPlayer ? 'none' : params.playerParticipation;

  const updatedTarget = targetList.filter((_, idx) => idx !== params.slotIndex);
  const nextBlue = params.team === 0 ? updatedTarget : [...params.blueSlots];
  const nextOrange = params.team === 1 ? updatedTarget : [...params.orangeSlots];
  const normalized = normalizeTeamPlayerFlags(nextBlue, nextOrange, nextParticipation);
  const totalCars = normalized.blueSlots.length + normalized.orangeSlots.length;
  const nextCamIdx = Math.min(params.activeCameraCarIndex, Math.max(0, totalCars - 1));

  return {
    playerParticipation: nextParticipation,
    blueSlots: normalized.blueSlots,
    orangeSlots: normalized.orangeSlots,
    activeCameraCarIndex: nextCamIdx,
  };
}

export function computeUpdatedSlotBotTypeRoster(params: {
  blueSlots: ExperimentalMultiBotsSlotConfig[];
  orangeSlots: ExperimentalMultiBotsSlotConfig[];
  playerParticipation: ExpPlayerParticipation;
  activeCameraCarIndex: number;
  team: 0 | 1;
  slotIndex: number;
  botType: ExpBotPolicyId;
}): ExpRosterSnapshot {
  const meta = getExpBotPolicyMeta(params.botType);
  const maxCap = meta.maxPlayersPerTeam;

  const updateFn = (list: ExperimentalMultiBotsSlotConfig[]) =>
    list.map((slot, idx) => (idx === params.slotIndex ? { ...slot, botType: params.botType } : slot));

  let nextBlue = params.team === 0 ? updateFn(params.blueSlots) : [...params.blueSlots];
  let nextOrange = params.team === 1 ? updateFn(params.orangeSlots) : [...params.orangeSlots];

  if (maxCap < 3) {
    if (nextBlue.length > maxCap) nextBlue = nextBlue.slice(0, maxCap);
    if (nextOrange.length > maxCap) nextOrange = nextOrange.slice(0, maxCap);
  }

  const totalCars = nextBlue.length + nextOrange.length;
  const nextCamIdx = Math.min(params.activeCameraCarIndex, Math.max(0, totalCars - 1));

  return {
    playerParticipation: params.playerParticipation,
    blueSlots: nextBlue,
    orangeSlots: nextOrange,
    activeCameraCarIndex: nextCamIdx,
  };
}

export function computeSwappedSlotColorRoster(params: {
  blueSlots: ExperimentalMultiBotsSlotConfig[];
  orangeSlots: ExperimentalMultiBotsSlotConfig[];
  playerParticipation: ExpPlayerParticipation;
  activeCameraCarIndex: number;
  team: 0 | 1;
  slotIndex: number;
  colorSlot: number;
}): ExpRosterSnapshot | null {
  const currentList = params.team === 0 ? params.blueSlots : params.orangeSlots;
  const prevColor = currentList[params.slotIndex]?.colorSlot ?? 0;
  if (prevColor === params.colorSlot) return null;

  const swapIfMatching = (slot: ExperimentalMultiBotsSlotConfig) =>
    slot.colorSlot === params.colorSlot ? { ...slot, colorSlot: prevColor } : slot;

  const nextBlue = params.blueSlots.map((slot, idx) =>
    params.team === 0 && idx === params.slotIndex
      ? { ...slot, colorSlot: params.colorSlot }
      : swapIfMatching(slot)
  );
  const nextOrange = params.orangeSlots.map((slot, idx) =>
    params.team === 1 && idx === params.slotIndex
      ? { ...slot, colorSlot: params.colorSlot }
      : swapIfMatching(slot)
  );

  return {
    playerParticipation: params.playerParticipation,
    blueSlots: nextBlue,
    orangeSlots: nextOrange,
    activeCameraCarIndex: params.activeCameraCarIndex,
  };
}
