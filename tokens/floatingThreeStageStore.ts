import { create } from 'zustand';
import { syncBridge as crossClientSync } from './syncBridge';
import { createFloatingStore } from './floatingStore';
import {
  useMenuLayoutStore,
  type PanelHeaderBackBtnIdleTone,
  type PanelHeaderBackBtnRadiusMode,
  type PanelHeaderBackBtnStyle,
} from './menuLayoutStore';

/**
 * Isolated Floating Window Store specifically for the 6D+ 3-Stage Floating Window Variation Lab.
 * 100% decoupled from 6D (`floatingSandboxStore`) and 7A (`floatingStore`).
 */
export const floatingThreeStageSandboxStore = createFloatingStore(
  'store:floating:sandbox-6d-plus-3stage-v2'
);

export type FloatingShellVariant =
  | 'three-stage-split-footer-grip'
  | 'three-stage-panel'
  | 'two-stage-l2-header'
  | 'classic-6d-baseline';

export type FloatingHeaderLeftSlotMode = 'none' | 'category-icon' | 'back-button';

export type FloatingHeaderTitleAlign = 'center' | 'left';

export type FloatingHeaderRightActionMode =
  | 'minimize-only'
  | 'minimize-and-pin'
  | 'minimize-and-close';

export type FloatingHeaderRightIconStyle = 'minus' | 'minimize-2';

export type FloatingFooterRightSlotMode =
  | 'carved-resize-grip'
  | 'live-dimensions'
  | 'shortcut-badge'
  | 'none';

export type FloatingResizeHandleStyle =
  | 'corner-arc'
  | 'corner-arc-dots'
  | 'corner-double-arc'
  | 'corner-pill-arc'
  | 'corner-dots'
  | 'footer-carved-slot'
  | 'invisible-edges-and-corner'
  | 'both-slot-and-edges';

export type FloatingCornerArcColorMode = 'neutral' | 'amber' | 'sky' | 'emerald';

export type FloatingContentOverflowMode = 'scroll-y' | 'auto-fit-height';

export interface FloatingThreeStageConfig {
  /** High-level variation archetype */
  variant: FloatingShellVariant;
  /** Whether to pull Stage 1/2/3 padding & button geometry live from L2 `useMenuLayoutStore` */
  syncWithGlobalL2Shell: boolean;

  // ── Stage 1: Header ──
  headerPaddingX: number;
  headerPaddingY: number;
  headerTitleFontSize: number;
  headerTitleAlign: FloatingHeaderTitleAlign;
  headerLeftSlotMode: FloatingHeaderLeftSlotMode;
  headerRightActionMode: FloatingHeaderRightActionMode;
  headerRightIconStyle: FloatingHeaderRightIconStyle;
  headerBtnWidth: number;
  headerBtnHeight: number;
  headerBtnRadiusMode: PanelHeaderBackBtnRadiusMode;
  headerBtnCustomRadius: number;
  headerBtnInnerRadius: number;
  headerBtnRadiusTL: number;
  headerBtnRadiusTR: number;
  headerBtnRadiusBR: number;
  headerBtnRadiusBL: number;
  headerBtnIdleTone: PanelHeaderBackBtnIdleTone;
  headerBtnStyle: PanelHeaderBackBtnStyle;
  headerBtnExpandOnHover: boolean;
  outerRadius: number;

  // ── Stage 2: Content Body & Sub-Navigation ──
  bodyPaddingX: number;
  bodyPaddingY: number;
  showSubTabsBar: boolean;
  showFloatingToolbar: boolean;
  contentOverflowMode: FloatingContentOverflowMode;

  // ── Stage 3: Footer & Hover Description Linkage ──
  showFooter: boolean;
  footerPaddingX: number;
  footerPaddingY: number;
  footerFontSize: number;
  footerHoverLinkage: boolean;
  footerRightSlotMode: FloatingFooterRightSlotMode;
  footerRightDivider: boolean;
  footerRightPaddingX: number;

  // ── Resize & Curved Corner Dragger Physics ──
  resizable: boolean;
  resizeHandleStyle: FloatingResizeHandleStyle;
  enableRightEdgeResize: boolean;
  enableBottomEdgeResize: boolean;
  /** When false (default), maximum width & height are completely unrestricted during resize */
  limitMaxSize: boolean;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  showResizeHudOverlay: boolean;
  showStageAnatomyBorders: boolean;

  // ── Bottom-Right Curved Corner Dragger Parameters ──
  /** Automatically match arc radius to `outerRadius - cornerArcInset` for 100% concentric curvature */
  cornerArcConcentric: boolean;
  /** Explicit arc radius in px (or resolved concentric radius) */
  cornerArcRadius: number;
  /** Inset distance in px from the bottom-right window border to the arc centerline */
  cornerArcInset: number;
  /** Angular sweep of the corner arc in degrees (centered at 45°) */
  cornerArcSweepDeg: number;
  /** Stroke thickness (in px) for arc lines, or dot diameter scale for arc-dots */
  cornerArcStrokeWidth: number;
  /** Idle opacity (15%..100%) of the bottom-right corner dragger; becomes 100% on hover/drag */
  cornerArcIdleOpacity: number;
  /** Color tone of the corner dragger */
  cornerArcColorMode: FloatingCornerArcColorMode;
}

/**
 * Solidified from user-calibrated `CALIBRATED_FLOATING_THREE_STAGE_CONFIG`
 * + unrestricted max size (`limitMaxSize: false`)
 * + natural concentric bottom-right curved arc dragger (`resizeHandleStyle: 'corner-arc'`).
 */
export const DEFAULT_FLOATING_THREE_STAGE_CONFIG: FloatingThreeStageConfig = {
  variant: 'three-stage-split-footer-grip',
  syncWithGlobalL2Shell: false,

  // Stage 1: User-calibrated clean classic floating window header
  headerPaddingX: 12,
  headerPaddingY: 8,
  headerTitleFontSize: 14,
  headerTitleAlign: 'left',
  headerLeftSlotMode: 'category-icon',
  headerRightActionMode: 'minimize-only',
  headerRightIconStyle: 'minus',
  headerBtnWidth: 22,
  headerBtnHeight: 22,
  headerBtnRadiusMode: 'custom',
  headerBtnCustomRadius: 6,
  headerBtnInnerRadius: 0,
  headerBtnRadiusTL: 10,
  headerBtnRadiusTR: 6,
  headerBtnRadiusBR: 6,
  headerBtnRadiusBL: 6,
  headerBtnIdleTone: 'match-header',
  headerBtnStyle: 'surface',
  headerBtnExpandOnHover: false,
  outerRadius: 16,

  // Stage 2: Content body
  bodyPaddingX: 14,
  bodyPaddingY: 12,
  showSubTabsBar: true,
  showFloatingToolbar: false,
  contentOverflowMode: 'scroll-y',

  // Stage 3: Clean full-width bottom footer with hover description linkage
  showFooter: true,
  footerPaddingX: 14,
  footerPaddingY: 6,
  footerFontSize: 11,
  footerHoverLinkage: true,
  footerRightSlotMode: 'none',
  footerRightDivider: false,
  footerRightPaddingX: 10,

  // Resize: Unrestricted max W×H + Bottom-Right Curved Arc Dragger
  resizable: true,
  resizeHandleStyle: 'corner-arc',
  enableRightEdgeResize: false,
  enableBottomEdgeResize: false,
  limitMaxSize: false,
  minWidth: 300,
  minHeight: 190,
  maxWidth: 900,
  maxHeight: 620,
  showResizeHudOverlay: false,
  showStageAnatomyBorders: false,

  // Curved Corner Dragger defaults
  cornerArcConcentric: true,
  cornerArcRadius: 12,
  cornerArcInset: 4,
  cornerArcSweepDeg: 68,
  cornerArcStrokeWidth: 2.4,
  cornerArcIdleOpacity: 60,
  cornerArcColorMode: 'neutral',
};

export interface FloatingThreeStagePreset {
  id: string;
  code: string;
  label: string;
  subtitle: string;
  patch: Partial<FloatingThreeStageConfig>;
}

export const FLOATING_THREE_STAGE_PRESETS: FloatingThreeStagePreset[] = [
  {
    id: 'var-calibrated-corner-arc',
    code: 'Variation 1 (Default Single-Arc Dragger)',
    label: 'Classic Floating Window + Footer + Bottom-Right Concentric Single-Arc Dragger (Unbounded)',
    subtitle:
      'Calibrated compact header + hover description footer + single concentric corner arc resize handle matching the 16px outer radius.',
    patch: {
      ...DEFAULT_FLOATING_THREE_STAGE_CONFIG,
      resizeHandleStyle: 'corner-arc',
      cornerArcConcentric: true,
      cornerArcInset: 4,
      cornerArcSweepDeg: 68,
      cornerArcStrokeWidth: 2.4,
      limitMaxSize: false,
    },
  },
  {
    id: 'var-calibrated-arc-dots',
    code: 'Variation 2 (Arc Three-Dot Dragger)',
    label: 'Classic Floating Window + Footer + Concentric Arc Three-Dot Dragger',
    subtitle:
      'Replaces rigid right-angle dots with three dots distributed along the bottom-right concentric arc.',
    patch: {
      ...DEFAULT_FLOATING_THREE_STAGE_CONFIG,
      resizeHandleStyle: 'corner-arc-dots',
      cornerArcConcentric: true,
      cornerArcInset: 4.5,
      cornerArcSweepDeg: 64,
      cornerArcStrokeWidth: 2.6,
      limitMaxSize: false,
    },
  },
  {
    id: 'var-calibrated-double-arc',
    code: 'Variation 3 (Dual Concentric-Arc Dragger)',
    label: 'Classic Floating Window + Footer + Dual Concentric-Arc Grip',
    subtitle:
      'Uses parallel inner and outer concentric arcs in the bottom-right corner for tactile grip and corner alignment.',
    patch: {
      ...DEFAULT_FLOATING_THREE_STAGE_CONFIG,
      resizeHandleStyle: 'corner-double-arc',
      cornerArcConcentric: true,
      cornerArcInset: 3.5,
      cornerArcSweepDeg: 72,
      cornerArcStrokeWidth: 2.0,
      limitMaxSize: false,
    },
  },
  {
    id: 'var-calibrated-pill-arc',
    code: 'Variation 4 (High-Contrast Pill-Arc Dragger)',
    label: 'Classic Floating Window + Footer + Embossed Pill-Arc Handle',
    subtitle:
      'Provides a recessed pill-arc handle in the bottom-right corner for maximum resize affordance.',
    patch: {
      ...DEFAULT_FLOATING_THREE_STAGE_CONFIG,
      resizeHandleStyle: 'corner-pill-arc',
      cornerArcConcentric: true,
      cornerArcInset: 4,
      cornerArcSweepDeg: 70,
      cornerArcStrokeWidth: 3.0,
      cornerArcIdleOpacity: 75,
      limitMaxSize: false,
    },
  },
  {
    id: 'var-l2-flush-header-3stage',
    code: 'Variation 5 (L2 Flush Header + Arc Dragger)',
    label: 'L2 Centered Flush Header (42x32 Flush Divider) + Footer + Concentric Arc Dragger',
    subtitle:
      'Uses the L2 PanelHeader flush divider header and centered uppercase title paired with a footer and corner arc handle.',
    patch: {
      ...DEFAULT_FLOATING_THREE_STAGE_CONFIG,
      headerPaddingX: 0,
      headerPaddingY: 0,
      headerTitleAlign: 'center',
      headerBtnWidth: 42,
      headerBtnHeight: 32,
      headerBtnRadiusMode: 'asymmetric-tl',
      headerBtnInnerRadius: 0,
      resizeHandleStyle: 'corner-arc',
      limitMaxSize: false,
    },
  },
  {
    id: 'var-classic-6d-baseline',
    code: 'Baseline (6D Original No-Footer Reference)',
    label: 'Current 6D Baseline Reference (No Footer + Classic Corner Dots)',
    subtitle:
      'Restores the baseline 6D FloatingWindowManager layout without a footer for direct A/B comparison.',
    patch: {
      ...DEFAULT_FLOATING_THREE_STAGE_CONFIG,
      variant: 'classic-6d-baseline',
      showFooter: false,
      resizeHandleStyle: 'corner-dots',
      limitMaxSize: false,
    },
  },
];

const STORAGE_KEY = 'ui-storybook-floating-three-stage-v2';
const SYNC_KEY = 'store:floatingThreeStage:v2';

const loadSavedConfig = (): FloatingThreeStageConfig => {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_FLOATING_THREE_STAGE_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FLOATING_THREE_STAGE_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_FLOATING_THREE_STAGE_CONFIG,
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
    };
  } catch {
    return { ...DEFAULT_FLOATING_THREE_STAGE_CONFIG };
  }
};

const saveConfig = (cfg: FloatingThreeStageConfig) => {
  if (!crossClientSync.isApplyingRemote()) {
    crossClientSync.set(SYNC_KEY, cfg);
  }
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // ignore storage errors
  }
};

export interface FloatingThreeStageStore extends FloatingThreeStageConfig {
  setParam: <K extends keyof FloatingThreeStageConfig>(
    key: K,
    value: FloatingThreeStageConfig[K]
  ) => void;
  updateParams: (patch: Partial<FloatingThreeStageConfig>) => void;
  applyPreset: (presetId: string) => void;
  pullFromGlobalL2Shell: () => void;
  resetConfig: () => void;
  exportConfigCode: () => string;
}

const initialConfig: FloatingThreeStageConfig = {
  ...DEFAULT_FLOATING_THREE_STAGE_CONFIG,
  ...crossClientSync.get<FloatingThreeStageConfig>(SYNC_KEY, loadSavedConfig()),
};

const extractPureConfig = (s: FloatingThreeStageConfig): FloatingThreeStageConfig => ({
  variant: s.variant,
  syncWithGlobalL2Shell: s.syncWithGlobalL2Shell,
  headerPaddingX: s.headerPaddingX,
  headerPaddingY: s.headerPaddingY,
  headerTitleFontSize: s.headerTitleFontSize,
  headerTitleAlign: s.headerTitleAlign,
  headerLeftSlotMode: s.headerLeftSlotMode,
  headerRightActionMode: s.headerRightActionMode,
  headerRightIconStyle: s.headerRightIconStyle,
  headerBtnWidth: s.headerBtnWidth,
  headerBtnHeight: s.headerBtnHeight,
  headerBtnRadiusMode: s.headerBtnRadiusMode,
  headerBtnCustomRadius: s.headerBtnCustomRadius,
  headerBtnInnerRadius: s.headerBtnInnerRadius,
  headerBtnRadiusTL: s.headerBtnRadiusTL,
  headerBtnRadiusTR: s.headerBtnRadiusTR,
  headerBtnRadiusBR: s.headerBtnRadiusBR,
  headerBtnRadiusBL: s.headerBtnRadiusBL,
  headerBtnIdleTone: s.headerBtnIdleTone,
  headerBtnStyle: s.headerBtnStyle,
  headerBtnExpandOnHover: s.headerBtnExpandOnHover,
  outerRadius: s.outerRadius,
  bodyPaddingX: s.bodyPaddingX,
  bodyPaddingY: s.bodyPaddingY,
  showSubTabsBar: s.showSubTabsBar,
  showFloatingToolbar: s.showFloatingToolbar,
  contentOverflowMode: s.contentOverflowMode,
  showFooter: s.showFooter,
  footerPaddingX: s.footerPaddingX,
  footerPaddingY: s.footerPaddingY,
  footerFontSize: s.footerFontSize,
  footerHoverLinkage: s.footerHoverLinkage,
  footerRightSlotMode: s.footerRightSlotMode,
  footerRightDivider: s.footerRightDivider,
  footerRightPaddingX: s.footerRightPaddingX,
  resizable: s.resizable,
  resizeHandleStyle: s.resizeHandleStyle,
  enableRightEdgeResize: s.enableRightEdgeResize,
  enableBottomEdgeResize: s.enableBottomEdgeResize,
  limitMaxSize: s.limitMaxSize,
  minWidth: s.minWidth,
  minHeight: s.minHeight,
  maxWidth: s.maxWidth,
  maxHeight: s.maxHeight,
  showResizeHudOverlay: s.showResizeHudOverlay,
  showStageAnatomyBorders: s.showStageAnatomyBorders,
  cornerArcConcentric: s.cornerArcConcentric,
  cornerArcRadius: s.cornerArcRadius,
  cornerArcInset: s.cornerArcInset,
  cornerArcSweepDeg: s.cornerArcSweepDeg,
  cornerArcStrokeWidth: s.cornerArcStrokeWidth,
  cornerArcIdleOpacity: s.cornerArcIdleOpacity,
  cornerArcColorMode: s.cornerArcColorMode,
});

export const useFloatingThreeStageStore = create<FloatingThreeStageStore>((set, get) => ({
  ...initialConfig,

  setParam: (key, value) => {
    set((state) => {
      const next = extractPureConfig({
        ...state,
        [key]: value,
      });
      saveConfig(next);
      return next;
    });
  },

  updateParams: (patch) => {
    set((state) => {
      const next = extractPureConfig({
        ...state,
        ...patch,
      });
      saveConfig(next);
      return next;
    });
  },

  applyPreset: (presetId) => {
    const found = FLOATING_THREE_STAGE_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    set((state) => {
      const next = extractPureConfig({
        ...state,
        ...found.patch,
      });
      saveConfig(next);
      return next;
    });
  },

  pullFromGlobalL2Shell: () => {
    const l2 = useMenuLayoutStore.getState();
    set((state) => {
      const next = extractPureConfig({
        ...state,
        headerPaddingX: l2.panelHeaderPaddingX,
        headerPaddingY: l2.panelHeaderPaddingY,
        headerTitleFontSize: l2.panelHeaderTitleFontSize,
        headerBtnWidth: l2.panelHeaderBackBtnWidth,
        headerBtnHeight: l2.panelHeaderBackBtnHeight,
        headerBtnRadiusMode: l2.panelHeaderBackBtnRadiusMode,
        headerBtnCustomRadius: l2.panelHeaderBackBtnRadius,
        headerBtnInnerRadius: l2.panelHeaderBackBtnInnerRadius,
        headerBtnRadiusTL: l2.panelHeaderBackBtnRadiusTL,
        headerBtnRadiusTR: l2.panelHeaderBackBtnRadiusTR,
        headerBtnRadiusBR: l2.panelHeaderBackBtnRadiusBR,
        headerBtnRadiusBL: l2.panelHeaderBackBtnRadiusBL,
        headerBtnIdleTone: l2.panelHeaderBackBtnIdleTone,
        headerBtnStyle: l2.panelHeaderBackBtnStyle,
        headerBtnExpandOnHover: l2.panelHeaderRightBtnExpandOnHover,
        outerRadius: l2.panelOuterRadius,
        bodyPaddingX: l2.panelBodyPaddingX,
        bodyPaddingY: l2.panelBodyPaddingY,
        footerPaddingX: l2.panelFooterPaddingX,
        footerPaddingY: l2.panelFooterPaddingY,
        footerFontSize: l2.panelFooterFontSize,
        footerRightDivider: l2.panelFooterRightDivider,
        footerRightPaddingX: l2.panelFooterRightPaddingX,
      });
      saveConfig(next);
      return next;
    });
  },

  resetConfig: () => {
    const next = { ...DEFAULT_FLOATING_THREE_STAGE_CONFIG };
    saveConfig(next);
    set(next);
  },

  exportConfigCode: () => {
    const cfg = extractPureConfig(get());
    return `// Calibrated 6D+ 3-Stage Floating Window Variation Config\nexport const CALIBRATED_FLOATING_THREE_STAGE_CONFIG = ${JSON.stringify(
      cfg,
      null,
      2
    )} as const;`;
  },
}));

crossClientSync.subscribeKey<FloatingThreeStageConfig>(SYNC_KEY, (remote) => {
  if (!remote || typeof remote !== 'object') return;
  useFloatingThreeStageStore.setState({
    ...DEFAULT_FLOATING_THREE_STAGE_CONFIG,
    ...remote,
  });
});
