/**
 * vehiclePresets.ts
 * Standard RocketSim vehicle hitbox presets, visual identifiers, and color preference persistence.
 * Decoupled from UI layer to eliminate inverted dependencies.
 */

import {
  STORAGE_KEYS,
  safeStorage,
  createLocalStorageStore,
  stringOrDefault
} from './storageHelpers';
import {
  HITBOX_PRESETS,
  CAR_VISUAL_IDS,
  CAR_VISUAL_OPTIONS,
  CAR_VISUAL_CATALOG,
  HITBOX_INDEX_TO_ID,
  normalizeVisualId,
  encodeVisualIdIndex,
  decodeVisualIdIndex,
  resolveHitboxIndex,
  decodeHitboxIndex
} from './vehicleConstants';

export {
  HITBOX_PRESETS,
  CAR_VISUAL_IDS,
  CAR_VISUAL_OPTIONS,
  CAR_VISUAL_CATALOG,
  HITBOX_INDEX_TO_ID,
  normalizeVisualId,
  encodeVisualIdIndex,
  decodeVisualIdIndex,
  resolveHitboxIndex,
  decodeHitboxIndex,
};
import { hasVehicleDescriptor } from './vehicleTunerConfig';
export { hasVehicleDescriptor };

export const STORAGE_KEY_DISPLAY_SETTINGS = STORAGE_KEYS.DISPLAY_SETTINGS;
export const COLOR_PREFS_KEY = STORAGE_KEYS.COLOR_PREFS;

export const COLOR_SLOT_HEX_MAP: Readonly<Record<number, string>> = Object.freeze({
  0: '#ff7043',
  1: '#66bb6a',
  2: '#ffc107',
  3: '#42a5f5',
  4: '#fd6e9d',
  5: '#ba68c8',
});

export interface GarageSettingsState {
  vehiclePreset: string;
  carVisual: string;
}

export const DEFAULT_GARAGE_SETTINGS_CONFIG: GarageSettingsState = {
  vehiclePreset: 'fennec',
  carVisual: 'fennec',
};

export const garageSettingsStore = createLocalStorageStore<GarageSettingsState>(
  STORAGE_KEY_DISPLAY_SETTINGS,
  () => ({ ...DEFAULT_GARAGE_SETTINGS_CONFIG }),
  (target, stored) => {
    target.vehiclePreset = stringOrDefault(
      stored.vehiclePreset || stored.carVisual,
      CAR_VISUAL_IDS,
      target.vehiclePreset
    );
    target.carVisual = target.vehiclePreset;
  }
);

export function getInitialCar(): string {
  return garageSettingsStore.load().vehiclePreset || 'fennec';
}

export interface StoredColorPrefs {
  primaryTeam: 'blue' | 'orange';
  blueOrder: number[];
  orangeOrder: number[];
}

export function loadStoredColorPrefs(): StoredColorPrefs {
  try {
    const raw = safeStorage.get(COLOR_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.blueOrder) && Array.isArray(parsed.orangeOrder)) {
        return {
          primaryTeam: parsed.primaryTeam === 'blue' ? 'blue' : 'orange',
          blueOrder: parsed.blueOrder,
          orangeOrder: parsed.orangeOrder,
        };
      }
    }
  } catch (err) {
    console.warn('[vehiclePresets] Failed to load stored color preferences:', err);
  }
  return {
    primaryTeam: 'orange',
    orangeOrder: [2, 4, 0],
    blueOrder: [1, 5, 3],
  };
}

export function getPreferredColorSlot(
  prefs?: StoredColorPrefs | null,
  assignedTeam?: 0 | 1 | null
): number {
  const effective =
    prefs && (prefs.primaryTeam === 'blue' || prefs.primaryTeam === 'orange')
      ? prefs
      : loadStoredColorPrefs();
  const targetTeam =
    assignedTeam === 0 || assignedTeam === 1
      ? assignedTeam
      : effective.primaryTeam === 'blue'
      ? 0
      : 1;
  const slot = targetTeam === 0 ? effective.blueOrder?.[0] : effective.orangeOrder?.[0];
  const fallbackSlot = targetTeam === 0 ? 3 : 2;
  return typeof slot === 'number' && COLOR_SLOT_HEX_MAP[slot] !== undefined ? slot : fallbackSlot;
}

export function getPreferredColorHex(
  prefs?: StoredColorPrefs | null,
  assignedTeam?: 0 | 1 | null
): string {
  const slot = getPreferredColorSlot(prefs, assignedTeam);
  return COLOR_SLOT_HEX_MAP[slot] || (assignedTeam === 0 ? '#42a5f5' : '#ffc107');
}

export function getPreferredFreeplayTeam(prefs?: StoredColorPrefs | null): 0 | 1 {
  const effective =
    prefs && (prefs.primaryTeam === 'blue' || prefs.primaryTeam === 'orange')
      ? prefs
      : loadStoredColorPrefs();
  return effective.primaryTeam === 'orange' ? 1 : 0;
}

export function saveStoredColorPrefs(nextPrefs: StoredColorPrefs): number {
  const activeSlotId = getPreferredColorSlot(nextPrefs);
  safeStorage.set(COLOR_PREFS_KEY, JSON.stringify(nextPrefs));
  return activeSlotId;
}

export function generateRandomFourDigits(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function generateDefaultPlayerName(): string {
  return `Player${generateRandomFourDigits()}`;
}

export function loadStoredPlayerName(fallback?: string): string {
  const saved = safeStorage.get(STORAGE_KEYS.PLAYER_NAME);
  if (saved && saved.trim()) {
    const trimmed = saved.trim().substring(0, 24);
    if (
      trimmed !== 'Host' &&
      trimmed !== 'Player' &&
      trimmed !== 'Player_01' &&
      trimmed !== 'Player_02'
    ) {
      return trimmed;
    }
  }
  const resolved =
    fallback &&
    fallback !== 'Host' &&
    fallback !== 'Player' &&
    fallback !== 'Player_01' &&
    fallback !== 'Player_02'
      ? fallback
      : generateDefaultPlayerName();
  safeStorage.set(STORAGE_KEYS.PLAYER_NAME, resolved);
  return resolved;
}

export function saveStoredPlayerName(name: string): void {
  const trimmed = String(name || '').trim();
  if (trimmed) {
    safeStorage.set(STORAGE_KEYS.PLAYER_NAME, trimmed);
  }
}
