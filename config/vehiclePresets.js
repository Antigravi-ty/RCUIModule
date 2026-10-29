/**
 * vehiclePresets.js
 * Standard RocketSim vehicle hitbox presets, visual identifiers, and 3D whitebox car generator.
 * Decoupled from UI layer to eliminate inverted dependencies.
 */

import {
  STORAGE_KEYS,
  safeStorage,
  createLocalStorageStore,
  stringOrDefault
} from './storageHelpers.ts';
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
} from './vehicleConstants.js';

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
import { hasVehicleDescriptor } from './vehicleTunerConfig.js';
export { hasVehicleDescriptor };
export const STORAGE_KEY_DISPLAY_SETTINGS = STORAGE_KEYS.DISPLAY_SETTINGS;
export const COLOR_PREFS_KEY = STORAGE_KEYS.COLOR_PREFS;

export const COLOR_SLOT_HEX_MAP = Object.freeze({
  0: '#ff7043',
  1: '#66bb6a',
  2: '#ffc107',
  3: '#42a5f5',
  4: '#fd6e9d',
  5: '#ba68c8',
});

export const garageSettingsStore = createLocalStorageStore(
  STORAGE_KEY_DISPLAY_SETTINGS,
  () => ({ vehiclePreset: 'fennec', carVisual: 'fennec' }),
  (target, stored) => {
    target.vehiclePreset = stringOrDefault(
      stored.vehiclePreset || stored.carVisual,
      CAR_VISUAL_IDS,
      target.vehiclePreset
    );
    target.carVisual = target.vehiclePreset;
  }
);

export function getInitialCar() {
  return garageSettingsStore.load().vehiclePreset || 'fennec';
}

export function loadStoredColorPrefs() {
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

export function getPreferredColorSlot(prefs) {
  const effective = prefs ?? loadStoredColorPrefs();
  const slot = effective.primaryTeam === 'blue' ? effective.blueOrder?.[0] : effective.orangeOrder?.[0];
  return typeof slot === 'number' && COLOR_SLOT_HEX_MAP[slot] !== undefined ? slot : 2;
}

export function getPreferredColorHex(prefs) {
  const slot = getPreferredColorSlot(prefs);
  return COLOR_SLOT_HEX_MAP[slot] || '#ffc107';
}

export function saveStoredColorPrefs(nextPrefs) {
  const activeSlotId = getPreferredColorSlot(nextPrefs);
  safeStorage.set(COLOR_PREFS_KEY, JSON.stringify(nextPrefs));
  return activeSlotId;
}

export function generateRandomFourDigits() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function generateDefaultPlayerName() {
  return `Player${generateRandomFourDigits()}`;
}

export function loadStoredPlayerName(fallback) {
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

export function saveStoredPlayerName(name) {
  const trimmed = String(name || '').trim();
  if (trimmed) {
    safeStorage.set(STORAGE_KEYS.PLAYER_NAME, trimmed);
  }
}
