import { create } from 'zustand';
import { syncBridge } from './syncBridge';
import {
  JETBRAINS_MONO_WEIGHT_OPTIONS,
  PLAY_CARD_ICON_COLOR_OPTIONS,
  isCustomPlayCardColor,
  resolvePlayCardIconColorClass,
  resolvePlayCardIconHex,
  hexToRgbTuple,
  rgbTupleToHex,
  type JetBrainsMonoFontWeight,
  type PlayCardIconColorToken,
  type PlayCardIconColorValue,
} from '../tokens/colors';

export type MainMenuIconColorToken = PlayCardIconColorToken;
export type MainMenuIconColorValue = PlayCardIconColorValue;

export {
  JETBRAINS_MONO_WEIGHT_OPTIONS,
  PLAY_CARD_ICON_COLOR_OPTIONS as MAIN_MENU_ICON_COLOR_OPTIONS,
  isCustomPlayCardColor as isCustomMainMenuColor,
  resolvePlayCardIconColorClass as resolveMainMenuIconColorClass,
  resolvePlayCardIconHex as resolveMainMenuIconHex,
  hexToRgbTuple,
  rgbTupleToHex,
  type JetBrainsMonoFontWeight,
};

/**
 * Three core visual archetypes for Layer 1 Main Menu (`MENU`) rows:
 * 1. 'large-clean-row' (Default): Clean single-line row [Icon + Large Title] inside outer frame, no description
 * 2. 'mono-watermark-row': Large JetBrains Mono title + Right oversized background watermark icon (~25-30% opacity), no description
 * 3. 'classic-descriptive-row': Classic two-line row [Icon Box + Title + Bottom Description]
 */
export type MainMenuStyleVariant =
  | 'large-clean-row'
  | 'mono-watermark-row'
  | 'classic-descriptive-row';

export type MainMenuFontFamilyMode = 'sans' | 'mono';

export type MainMenuRowAlignMode = 'left' | 'center' | 'space-between';

export type MainMenuResumeHighlightStyle =
  | 'solid-primary'
  | 'surface-card'
  | 'amber-accent';

export type MainMenuItemSlotId =
  | 'resume'
  | 'play'
  | 'garage'
  | 'settings'
  | 'configure'
  | 'restart'
  | 'leave';

export const MAIN_MENU_ITEM_SLOTS: {
  id: MainMenuItemSlotId;
  label: string;
  shortTitle: string;
}[] = [
  { id: 'resume', label: 'Resume (Return to Match)', shortTitle: 'Resume' },
  { id: 'play', label: 'Play (Mode Selection)', shortTitle: 'Play' },
  { id: 'garage', label: 'Garage (Vehicle Customization)', shortTitle: 'Garage' },
  { id: 'settings', label: 'Settings (System Preferences)', shortTitle: 'Settings' },
  { id: 'configure', label: 'Configure (Room / Training Setup)', shortTitle: 'Configure' },
  { id: 'restart', label: 'Restart (Restart Match)', shortTitle: 'Restart Match' },
  { id: 'leave', label: 'Leave / Exit (Leave Session)', shortTitle: 'Exit / Leave' },
];

export const DEFAULT_MAIN_MENU_ITEM_COLORS: Record<MainMenuItemSlotId, MainMenuIconColorValue> = {
  resume: 'neutral',
  play: 'amber',
  garage: 'sky',
  settings: 'emerald',
  configure: 'amber',
  restart: 'purple',
  leave: 'rose',
};

export interface MainMenuStyleParams {
  variant: MainMenuStyleVariant;
  conciseResumeLabel: boolean;
  showDescription: boolean;
  itemPaddingXPx: number;
  itemPaddingYPx: number;
  itemMinHeightPx: number;
  itemRadiusPx: number;
  itemBorderWidthPx: number;
  itemGapPx: number;
  showDividers: boolean;
  dividerMarginYPx: number;
  menuContainerPaddingPx: number;
  titleFontFamily: MainMenuFontFamilyMode;
  titleFontSizePx: number;
  titleFontWeight: JetBrainsMonoFontWeight;
  titleLetterSpacingEm: number;
  titleLineHeight: number;
  titleUppercase: boolean;
  descFontSizePx: number;
  descLineHeight: number;
  titleDescGapPx: number;
  showIcon: boolean;
  iconSizePx: number;
  iconStrokeWidth: number;
  showIconBox: boolean;
  iconBoxSizePx: number;
  iconBoxRadiusPx: number;
  iconTitleGapPx: number;
  rowContentAlign: MainMenuRowAlignMode;
  resumeHighlightStyle: MainMenuResumeHighlightStyle;
  showShortcutBadge: boolean;
  showRightArrow: boolean;
  rightArrowSizePx: number;
  headerFontFamily: MainMenuFontFamilyMode;
  headerFontSizePx: number;
  headerFontWeight: JetBrainsMonoFontWeight;
  headerLetterSpacingEm: number;
  headerPaddingXPx: number;
  headerPaddingTopPx: number;
  headerPaddingBottomPx: number;
  contentPaddingXPx: number;
  contentPaddingYPx: number;
  showFooter: boolean;
  footerPaddingXPx: number;
  footerPaddingYPx: number;
  footerFontSizePx: number;
  watermarkSizePx: number;
  watermarkOpacityPct: number;
  watermarkHoverOpacityPct: number;
  watermarkStrokeWidth: number;
  watermarkRotateDeg: number;
  watermarkOffsetXPx: number;
  watermarkOffsetYPx: number;
  usePerItemIconColors: boolean;
  itemIconColors: Record<MainMenuItemSlotId, MainMenuIconColorValue>;
}

export const MAIN_MENU_APPLE_SANS_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "JetBrains Mono", "SF Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

export const MAIN_MENU_JETBRAINS_MONO_STACK =
  '"JetBrains Mono", "SF Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

export const DEFAULT_MAIN_MENU_MONO_FALLBACK_WEIGHT: JetBrainsMonoFontWeight = 400;

export type MainMenuPlatformPreviewMode = 'auto' | 'apple' | 'non-apple-fallback';

export type MainMenuPreviewContextMode =
  | 'freeplay' | 'replay-viewer' | 'exhibition' | 'match-lobby-host' | 'match-lobby-client'
  | 'online-match-host' | 'online-match-client' | 'online-warmup-host' | 'online-warmup-client'
  | 'kickoff-training' | 'static-training-play' | 'static-training-edit' | 'dev-test-lab'
  | 'exp-multi-bots' | 'match' | 'custom-match-host' | 'custom-match-client';

const VALID_MAIN_MENU_CONTEXT_MODES = [
  'freeplay', 'replay-viewer', 'exhibition', 'match-lobby-host', 'match-lobby-client',
  'online-match-host', 'online-match-client', 'online-warmup-host', 'online-warmup-client',
  'kickoff-training', 'static-training-play', 'static-training-edit', 'dev-test-lab', 'exp-multi-bots',
] as const;

export const normalizeMainMenuContextMode = (
  raw?: string | null
): Exclude<MainMenuPreviewContextMode, 'match' | 'custom-match-host' | 'custom-match-client'> => {
  if (!raw) return 'freeplay';
  if (raw === 'match') return 'exhibition';
  if (raw === 'custom-match-host') return 'online-match-host';
  if (raw === 'custom-match-client') return 'online-match-client';
  if (raw === 'online-warmup') return 'online-warmup-host';
  if (raw === 'static-training-pack') return 'static-training-play';
  return (VALID_MAIN_MENU_CONTEXT_MODES as readonly string[]).includes(raw) ? (raw as any) : 'freeplay';
};

export const detectIsAppleDevice = (): boolean => {
  if (typeof navigator === 'undefined') return true;
  const navWithUAData = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = navWithUAData.userAgentData?.platform || navigator.platform || '';
  const ua = navigator.userAgent || '';
  return /(Mac|iPhone|iPod|iPad)/i.test(platform) || /(Macintosh|Mac OS X|iPhone|iPad|iPod)/i.test(ua);
};

export interface ResolvedMainMenuTypography {
  fontFamily: string;
  fontWeight: JetBrainsMonoFontWeight;
  isUsingMonoFallback: boolean;
}

export const resolveMainMenuTitleTypography = (
  fontFamilyMode: MainMenuFontFamilyMode,
  configuredWeight: JetBrainsMonoFontWeight,
  platformPreviewMode: MainMenuPlatformPreviewMode = 'auto',
  fallbackMonoWeight: JetBrainsMonoFontWeight = DEFAULT_MAIN_MENU_MONO_FALLBACK_WEIGHT
): ResolvedMainMenuTypography => {
  if (fontFamilyMode === 'mono') {
    return {
      fontFamily: MAIN_MENU_JETBRAINS_MONO_STACK,
      fontWeight: configuredWeight,
      isUsingMonoFallback: false,
    };
  }
  const isApple =
    platformPreviewMode === 'apple'
      ? true
      : platformPreviewMode === 'non-apple-fallback'
      ? false
      : detectIsAppleDevice();

  if (!isApple) {
    return {
      fontFamily: MAIN_MENU_JETBRAINS_MONO_STACK,
      fontWeight: fallbackMonoWeight,
      isUsingMonoFallback: true,
    };
  }
  return {
    fontFamily: MAIN_MENU_APPLE_SANS_STACK,
    fontWeight: configuredWeight,
    isUsingMonoFallback: false,
  };
};

export const MAIN_MENU_STYLE_CONFIG: MainMenuStyleParams = {
  variant: 'large-clean-row',
  conciseResumeLabel: true,
  showDescription: false,
  itemPaddingXPx: 18,
  itemPaddingYPx: 12,
  itemMinHeightPx: 50,
  itemRadiusPx: 12,
  itemBorderWidthPx: 1,
  itemGapPx: 12,
  showDividers: true,
  dividerMarginYPx: -5,
  menuContainerPaddingPx: 0,
  titleFontFamily: 'sans',
  titleFontSizePx: 24,
  titleFontWeight: 800,
  titleLetterSpacingEm: 0,
  titleLineHeight: 1,
  titleUppercase: false,
  descFontSizePx: 12,
  descLineHeight: 1.4,
  titleDescGapPx: 2,
  showIcon: true,
  iconSizePx: 20,
  iconStrokeWidth: 2,
  showIconBox: false,
  iconBoxSizePx: 36,
  iconBoxRadiusPx: 9,
  iconTitleGapPx: 12,
  rowContentAlign: 'left',
  resumeHighlightStyle: 'solid-primary',
  showShortcutBadge: true,
  showRightArrow: true,
  rightArrowSizePx: 16,
  headerFontFamily: 'sans',
  headerFontSizePx: 20,
  headerFontWeight: 800,
  headerLetterSpacingEm: 0.1,
  headerPaddingXPx: 24,
  headerPaddingTopPx: 20,
  headerPaddingBottomPx: 16,
  contentPaddingXPx: 24,
  contentPaddingYPx: 14,
  showFooter: true,
  footerPaddingXPx: 24,
  footerPaddingYPx: 14,
  footerFontSizePx: 11,
  watermarkSizePx: 68,
  watermarkOpacityPct: 26,
  watermarkHoverOpacityPct: 45,
  watermarkStrokeWidth: 1.6,
  watermarkRotateDeg: -12,
  watermarkOffsetXPx: 8,
  watermarkOffsetYPx: 0,
  usePerItemIconColors: false,
  itemIconColors: { ...DEFAULT_MAIN_MENU_ITEM_COLORS },
};

export const DEFAULT_MAIN_MENU_STYLE_PARAMS: MainMenuStyleParams = MAIN_MENU_STYLE_CONFIG;

export interface MainMenuStylePreset {
  id: string;
  label: string;
  subtitle: string;
  params: Partial<MainMenuStyleParams>;
}

export const MAIN_MENU_STYLE_PRESETS: MainMenuStylePreset[] = [
  {
    id: 'preset-clean-large-bare-icon',
    label: 'Preset 1 (Default) · Minimal Large Title + Pure Icon + Single-Border Row (No Description)',
    subtitle: 'Short Resume title · 24px Apple Sans Extra Bold (JetBrains Mono fallback) · No inner icon box',
    params: { ...MAIN_MENU_STYLE_CONFIG },
  },
  {
    id: 'preset-clean-large-boxed-icon',
    label: 'Preset 2 · Minimal Large Title + Framed Icon Box (No Description)',
    subtitle: 'Short Resume title · 18px Bold title · 36x36 framed icon box · No description subtitle',
    params: {
      variant: 'large-clean-row', conciseResumeLabel: true, showDescription: false,
      showIconBox: true, iconBoxSizePx: 36, iconBoxRadiusPx: 9,
      titleFontFamily: 'sans', titleFontSizePx: 18, titleFontWeight: 700,
      iconSizePx: 20, iconTitleGapPx: 12, itemMinHeightPx: 56, itemPaddingXPx: 16, itemPaddingYPx: 10,
      resumeHighlightStyle: 'solid-primary',
    },
  },
  {
    id: 'preset-clean-mono-bold',
    label: 'Preset 3 · JetBrains Mono Industrial Row (Mono 19px Extra Bold · No Description)',
    subtitle: 'Matches Play menu industrial typography: JetBrains Mono 19px Extra Bold + pure icon + semantic accent tint',
    params: {
      variant: 'large-clean-row', conciseResumeLabel: true, showDescription: false,
      showIconBox: false, titleFontFamily: 'mono', titleFontSizePx: 19, titleFontWeight: 800,
      titleLetterSpacingEm: -0.02, iconSizePx: 21, iconTitleGapPx: 14,
      itemMinHeightPx: 56, itemPaddingXPx: 18, itemPaddingYPx: 14,
      usePerItemIconColors: true, resumeHighlightStyle: 'solid-primary',
    },
  },
  {
    id: 'preset-clean-unified-surface',
    label: 'Preset 4 · Uniform Surface Card Row (Non-Inverted Resume · 20px Title)',
    subtitle: 'All rows share a uniform surface card background with 20px titles and semantic icon accents',
    params: {
      variant: 'large-clean-row', conciseResumeLabel: true, showDescription: false,
      showIconBox: false, titleFontFamily: 'sans', titleFontSizePx: 20, titleFontWeight: 700,
      iconSizePx: 22, iconTitleGapPx: 14, itemMinHeightPx: 56, itemPaddingXPx: 18, itemPaddingYPx: 14,
      resumeHighlightStyle: 'surface-card', usePerItemIconColors: true,
    },
  },
  {
    id: 'preset-mono-watermark-row',
    label: 'Preset 5 · Style 2: JetBrains Mono Title + Right 26% Watermark Icon',
    subtitle: 'Extends Play Card Style 3 to horizontal rows: left-aligned Mono title with a 68px tilted watermark icon on the right',
    params: {
      variant: 'mono-watermark-row', conciseResumeLabel: true, showDescription: false,
      titleFontFamily: 'mono', titleFontSizePx: 19, titleFontWeight: 800, titleLetterSpacingEm: -0.02,
      itemMinHeightPx: 58, itemPaddingXPx: 20, itemPaddingYPx: 14,
      watermarkSizePx: 68, watermarkOpacityPct: 26, watermarkHoverOpacityPct: 45, watermarkRotateDeg: -12,
      usePerItemIconColors: true, resumeHighlightStyle: 'surface-card',
    },
  },
  {
    id: 'preset-classic-with-description',
    label: 'Preset 6 · Style 3 (Legacy Reference): Includes Description Subtitle + Resume Match',
    subtitle: 'Retains the two-line layout with description subtitles and framed icon boxes for baseline comparison',
    params: {
      variant: 'classic-descriptive-row', conciseResumeLabel: false, showDescription: true,
      showIconBox: true, iconBoxSizePx: 36, iconBoxRadiusPx: 8,
      titleFontFamily: 'sans', titleFontSizePx: 14, titleFontWeight: 600, descFontSizePx: 12,
      iconSizePx: 20, iconTitleGapPx: 12, itemMinHeightPx: 52, itemPaddingXPx: 16, itemPaddingYPx: 10,
      itemGapPx: 4, dividerMarginYPx: 2, usePerItemIconColors: false, resumeHighlightStyle: 'solid-primary',
    },
  },
];

interface SyncedMainMenuStorePayload extends MainMenuStyleParams {
  platformPreviewMode: MainMenuPlatformPreviewMode;
  titleOffsetYPx: number;
  previewContextMode: MainMenuPreviewContextMode;
}

const DEFAULT_SYNCED_MAIN_MENU_PAYLOAD: SyncedMainMenuStorePayload = {
  ...DEFAULT_MAIN_MENU_STYLE_PARAMS,
  platformPreviewMode: 'auto',
  titleOffsetYPx: 0,
  previewContextMode: 'freeplay',
};

interface MainMenuStyleStore extends SyncedMainMenuStorePayload {
  setPlatformPreviewMode: (mode: MainMenuPlatformPreviewMode) => void;
  setTitleOffsetYPx: (offsetPx: number) => void;
  setPreviewContextMode: (ctx: MainMenuPreviewContextMode) => void;
  setParam: <K extends keyof MainMenuStyleParams>(key: K, value: MainMenuStyleParams[K]) => void;
  setVariant: (variant: MainMenuStyleVariant) => void;
  setItemIconColor: (slotId: MainMenuItemSlotId, color: MainMenuIconColorValue) => void;
  applyPreset: (params: Partial<MainMenuStyleParams>) => void;
  resetParams: () => void;
  exportConfigCode: () => string;
}

const SYNC_KEY = 'store:mainMenuStyle:v2';

let isApplyingRemote = false;

export const useMainMenuStyleStore = create<MainMenuStyleStore>((set, get) => {
  const initialSnapshot = syncBridge.get<Partial<SyncedMainMenuStorePayload>>(
    SYNC_KEY,
    DEFAULT_SYNCED_MAIN_MENU_PAYLOAD
  );
  const mergedInitial: SyncedMainMenuStorePayload = {
    ...DEFAULT_SYNCED_MAIN_MENU_PAYLOAD,
    ...(initialSnapshot || {}),
    previewContextMode: normalizeMainMenuContextMode(initialSnapshot?.previewContextMode),
    itemIconColors: {
      ...DEFAULT_MAIN_MENU_ITEM_COLORS,
      ...(initialSnapshot?.itemIconColors || {}),
    },
  };

  const broadcastState = (state: MainMenuStyleStore) => {
    if (isApplyingRemote) return;
    const payload: Partial<SyncedMainMenuStorePayload> = {};
    (
      Object.keys(DEFAULT_SYNCED_MAIN_MENU_PAYLOAD) as (keyof SyncedMainMenuStorePayload)[]
    ).forEach((k) => {
      (payload as Record<string, unknown>)[k] = state[k];
    });
    syncBridge.set(SYNC_KEY, payload);
  };

  return {
    ...mergedInitial,
    setPlatformPreviewMode: (mode) => {
      set({ platformPreviewMode: mode });
      broadcastState(get());
    },
    setTitleOffsetYPx: (offsetPx) => {
      set({ titleOffsetYPx: offsetPx });
      broadcastState(get());
    },
    setPreviewContextMode: (ctx) => {
      set({ previewContextMode: normalizeMainMenuContextMode(ctx) });
      broadcastState(get());
    },
    setParam: (key, value) => {
      set((prev) => {
        const patch: Partial<MainMenuStyleParams> = { [key]: value };
        if (key === 'showDescription' && value === true && prev.variant === 'large-clean-row') {
          patch.variant = 'classic-descriptive-row';
        } else if (
          key === 'showDescription' &&
          value === false &&
          prev.variant === 'classic-descriptive-row'
        ) {
          patch.variant = 'large-clean-row';
        }
        if (key === 'titleFontFamily' && value === 'mono' && prev.titleFontWeight === 800) {
          patch.titleFontWeight = DEFAULT_MAIN_MENU_MONO_FALLBACK_WEIGHT;
        } else if (
          key === 'titleFontFamily' &&
          value === 'sans' &&
          prev.titleFontWeight === DEFAULT_MAIN_MENU_MONO_FALLBACK_WEIGHT
        ) {
          patch.titleFontWeight = 800;
        }
        return patch as Partial<MainMenuStyleStore>;
      });
      broadcastState(get());
    },
    setVariant: (variant) => {
      set(() => {
        if (variant === 'classic-descriptive-row') {
          return {
            variant,
            showDescription: true,
          };
        }
        return {
          variant,
          showDescription: false,
        };
      });
      broadcastState(get());
    },
    setItemIconColor: (slotId, color) => {
      set((prev) => ({
        usePerItemIconColors: true,
        itemIconColors: {
          ...prev.itemIconColors,
          [slotId]: color,
        },
      }));
      broadcastState(get());
    },
    applyPreset: (params) => {
      set((prev) => ({
        ...prev,
        ...params,
        itemIconColors: {
          ...prev.itemIconColors,
          ...(params.itemIconColors || {}),
        },
      }));
      broadcastState(get());
    },
    resetParams: () => {
      set((prev) => ({
        ...DEFAULT_MAIN_MENU_STYLE_PARAMS,
        itemIconColors: { ...DEFAULT_MAIN_MENU_ITEM_COLORS },
        platformPreviewMode: 'auto',
        titleOffsetYPx: 0,
        previewContextMode: prev.previewContextMode || 'freeplay',
      }));
      broadcastState(get());
    },
    exportConfigCode: () => {
      const s = get();
      const exported: Record<string, unknown> = {};
      (Object.keys(DEFAULT_MAIN_MENU_STYLE_PARAMS) as (keyof MainMenuStyleParams)[]).forEach(
        (k) => {
          exported[k] = s[k];
        }
      );
      return `// Layer 1 Main Menu Style Configuration (src/tokens/mainMenuStyleStore.ts)\nexport const MAIN_MENU_STYLE_CONFIG: MainMenuStyleParams = ${JSON.stringify(
        exported,
        null,
        2
      )};`;
    },
  };
});

syncBridge.registerDefault(SYNC_KEY, DEFAULT_SYNCED_MAIN_MENU_PAYLOAD);

syncBridge.subscribeKey<Partial<SyncedMainMenuStorePayload>>(SYNC_KEY, (remote) => {
  if (!remote || typeof remote !== 'object') return;
  isApplyingRemote = true;
  try {
    useMainMenuStyleStore.setState((prev) => ({
      ...prev,
      ...remote,
      previewContextMode: normalizeMainMenuContextMode(
        remote.previewContextMode ?? prev.previewContextMode
      ),
      itemIconColors: {
        ...prev.itemIconColors,
        ...(remote.itemIconColors || {}),
      },
    }));
  } finally {
    isApplyingRemote = false;
  }
});
