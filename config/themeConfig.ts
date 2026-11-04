/**
 * themeConfig.ts
 * Centralized game theme configuration and reactive state pipeline.
 */

import { safeStorage, createLocalStorageStore, stringOrDefault, STORAGE_KEYS, UI_THEME_STORAGE_KEY } from './storageHelpers';

export type GameThemeId = 'realistic' | 'arcade';
export const THEMES: readonly GameThemeId[] = Object.freeze(['realistic', 'arcade']);
export const DEFAULT_THEME: GameThemeId = 'arcade';
export const THEME_STORAGE_KEY = STORAGE_KEYS.GAME_THEME;
export { UI_THEME_STORAGE_KEY };

export const themeSettingsStore = createLocalStorageStore<{ theme: GameThemeId }>(
  THEME_STORAGE_KEY,
  () => ({ theme: DEFAULT_THEME }),
  (target, source) => {
    target.theme = stringOrDefault(source.theme, THEMES, target.theme) as GameThemeId;
  }
);

let activeGameTheme: GameThemeId = themeSettingsStore.load().theme;

export function applyThemeToDocument(): void {
  if (typeof document !== 'undefined' && document.documentElement?.dataset) {
    document.documentElement.dataset.gameTheme = activeGameTheme;
  }
}

export function getTheme(): GameThemeId {
  return activeGameTheme;
}

export function setTheme(theme: GameThemeId | string, options: { persist?: boolean } = {}): void {
  if (!THEMES.includes(theme as GameThemeId)) return;
  const nextTheme = theme as GameThemeId;
  activeGameTheme = nextTheme;
  applyThemeToDocument();
  if (options.persist !== false) {
    themeSettingsStore.save({ theme: nextTheme });
  }
}

export function getInitialTheme(): 'light' | 'dark' {
  const saved = safeStorage.get(UI_THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return 'light';
}
