import { useSyncExternalStore } from 'react';
import { AccentColor, ACCENT_THEMES, AccentThemeToken } from './colors';
import { syncBridge as crossClientSync } from './syncBridge';

export interface AccentThemeState {
  accent: AccentColor;
  tokens: AccentThemeToken;
}

const STORAGE_KEY = 'ui-storybook-accent-theme-v2';

const safeStorage = {
  get: (k: string, fallback: string | null = null): string | null => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(k) ?? fallback : fallback;
    } catch {
      return fallback;
    }
  },
  set: (k: string, v: string): void => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
    } catch {
      // ignore
    }
  },
};

const getInitialAccent = (): AccentColor => {
  const saved = safeStorage.get(STORAGE_KEY);
  if (saved === 'amber' || saved === 'neutral' || saved === 'sky') {
    return saved;
  }
  // Default to neutral monochrome as requested
  return 'neutral';
};

const initialAccent = crossClientSync.get<AccentColor>('store:accent', getInitialAccent());

let state: AccentThemeState = {
  accent: initialAccent,
  tokens: ACCENT_THEMES[initialAccent] || ACCENT_THEMES.neutral,
};

const listeners = new Set<() => void>();
const notify = () => {
  listeners.forEach((l) => l());
};

crossClientSync.registerDefault<AccentColor>('store:accent', 'neutral');

crossClientSync.onReset((scopePrefix) => {
  if (scopePrefix && !'store:accent'.startsWith(scopePrefix)) return;
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  if (state.accent !== 'neutral') {
    state = {
      accent: 'neutral',
      tokens: ACCENT_THEMES.neutral,
    };
    notify();
  }
});

crossClientSync.subscribeKey<AccentColor>('store:accent', (remoteAccent) => {
  if (remoteAccent !== 'amber' && remoteAccent !== 'neutral' && remoteAccent !== 'sky') return;
  if (state.accent === remoteAccent) return;
  state = {
    accent: remoteAccent,
    tokens: ACCENT_THEMES[remoteAccent] || ACCENT_THEMES.neutral,
  };
  safeStorage.set(STORAGE_KEY, remoteAccent);
  notify();
});

export const accentStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setAccent: (accent: AccentColor) => {
    state = {
      accent,
      tokens: ACCENT_THEMES[accent] || ACCENT_THEMES.neutral,
    };
    safeStorage.set(STORAGE_KEY, accent);
    crossClientSync.set('store:accent', accent);
    notify();
  },
};

export const useAccentStore = () => {
  const snapshot = useSyncExternalStore(accentStore.subscribe, accentStore.getSnapshot);
  return {
    accent: snapshot.accent,
    tokens: snapshot.tokens,
    setAccent: accentStore.setAccent,
  };
};

