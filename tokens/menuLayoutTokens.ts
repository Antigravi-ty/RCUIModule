import {
  CANONICAL_PANEL_SIZING as CANONICAL_PANEL_SIZING_PRESETS,
  DEFAULT_PANEL_SIZING as DEFAULT_PANEL_SIZING_PRESETS,
  resolveMenuPanelSizing as resolveMenuPanelSizingPreset,
  type CanonicalMenuPanelId,
  type MenuPanelId,
  type PanelSizingConfig,
  type PanelSizingMode,
} from './menuPanelSizingPresets';

export type {
  CanonicalMenuPanelId,
  MenuPanelId,
  PanelSizingConfig,
  PanelSizingMode,
};

export type PanelHeaderBackBtnRadiusMode =
  | 'auto'
  | 'asymmetric-tl'
  | 'custom'
  | 'per-corner';

export type PanelHeaderBackBtnStyle = 'surface' | 'subtle' | 'ghost';

export type PanelHeaderBackBtnIdleTone = 'match-header' | 'muted-gray' | 'elevated';
export type PanelHeaderRightBtnTransform = 'none' | 'flip-x' | 'rotate-90';

export interface BackBtnResolvedGeometry {
  width: number;
  height: number;
  iconSize: number;
  concentricRadius: number;
  innerRadius: number;
  borderRadiusCss: string;
  rightBorderRadiusCss: string;
  radiusSummary: string;
}

export interface FloatingShellTokens {
  floatingOuterRadius: number;
  floatingHeaderPaddingX: number;
  floatingHeaderPaddingY: number;
  floatingHeaderTitleFontSize: number;
  floatingHeaderMinimizeBtnSize: number;
  floatingHeaderMinimizeBtnRadius: number;
  floatingBodyPaddingX: number;
  floatingBodyPaddingY: number;
  floatingFooterPaddingX: number;
  floatingFooterPaddingY: number;
  floatingFooterCornerReserveRightPx: number;
  floatingFooterFontSize: number;
}

export interface MenuLayoutTokens extends FloatingShellTokens {
  panels: Record<MenuPanelId, PanelSizingConfig>;
  dividerMarginY: number;
  menuItemGap: number;
  menuItemPaddingY: number;
  menuContainerPadding: number;
  panelContentPaddingY: number;
  showAdditionalPreviews: boolean;
  simulateLayer3Error: boolean;
  lockPanelPaddingX: boolean;
  panelHeaderPaddingX: number;
  panelHeaderPaddingY: number;
  panelHeaderTitleFontSize: number;
  lockPanelHeaderBackBtnAspect: boolean;
  panelHeaderBackBtnWidth: number;
  panelHeaderBackBtnHeight: number;
  panelHeaderBackBtnSize: number;
  panelHeaderBackBtnShowArrow: boolean;
  panelHeaderBackBtnShowLabel: boolean;
  panelHeaderBackBtnIdleTone: PanelHeaderBackBtnIdleTone;
  panelHeaderBackBtnStyle: PanelHeaderBackBtnStyle;
  panelHeaderBackBtnRadiusMode: PanelHeaderBackBtnRadiusMode;
  panelHeaderBackBtnRadius: number;
  panelHeaderBackBtnInnerRadius: number;
  panelHeaderBackBtnRadiusTL: number;
  panelHeaderBackBtnRadiusTR: number;
  panelHeaderBackBtnRadiusBR: number;
  panelHeaderBackBtnRadiusBL: number;
  panelHeaderShowRightBtn: boolean;
  panelHeaderRightBtnTransform: PanelHeaderRightBtnTransform;
  panelHeaderRightBtnExpandOnHover: boolean;
  panelOuterRadius: number;
  panelHeaderGap: number;
  panelBodyPaddingX: number;
  panelBodyPaddingY: number;
  panelFooterPaddingX: number;
  panelFooterPaddingY: number;
  panelFooterFontSize: number;
  panelFooterSplitRight: boolean;
  panelFooterRightDivider: boolean;
  panelFooterRightPaddingX: number;
  layer1Width: number;
  layer1Height: number;
  layer2Width: number;
  layer2Height: number;
  layer3Width: number;
  layer3Height: number;
}

export const CANONICAL_PANEL_SIZING: Record<CanonicalMenuPanelId, PanelSizingConfig> =
  CANONICAL_PANEL_SIZING_PRESETS;
export const DEFAULT_PANEL_SIZING: Record<MenuPanelId, PanelSizingConfig> =
  DEFAULT_PANEL_SIZING_PRESETS;
export const resolveMenuPanelSizing = resolveMenuPanelSizingPreset;

export const DEFAULT_FLOATING_SHELL_TOKENS: FloatingShellTokens = {
  floatingOuterRadius: 16,
  floatingHeaderPaddingX: 12,
  floatingHeaderPaddingY: 8,
  floatingHeaderTitleFontSize: 14,
  floatingHeaderMinimizeBtnSize: 22,
  floatingHeaderMinimizeBtnRadius: 6,
  floatingBodyPaddingX: 14,
  floatingBodyPaddingY: 14,
  floatingFooterPaddingX: 14,
  floatingFooterPaddingY: 6,
  floatingFooterCornerReserveRightPx: 24,
  floatingFooterFontSize: 11,
};

export const DEFAULT_PANEL_SHELL_TOKENS = {
  lockPanelPaddingX: false,
  panelHeaderPaddingX: 0,
  panelHeaderPaddingY: 0,
  panelHeaderTitleFontSize: 16,
  lockPanelHeaderBackBtnAspect: false,
  panelHeaderBackBtnWidth: 42,
  panelHeaderBackBtnHeight: 32,
  panelHeaderBackBtnSize: 32,
  panelHeaderBackBtnShowArrow: true,
  panelHeaderBackBtnShowLabel: false,
  panelHeaderBackBtnIdleTone: 'match-header' as PanelHeaderBackBtnIdleTone,
  panelHeaderBackBtnStyle: 'surface' as PanelHeaderBackBtnStyle,
  panelHeaderBackBtnRadiusMode: 'asymmetric-tl' as PanelHeaderBackBtnRadiusMode,
  panelHeaderBackBtnRadius: 7,
  panelHeaderBackBtnInnerRadius: 0,
  panelHeaderBackBtnRadiusTL: 10,
  panelHeaderBackBtnRadiusTR: 6,
  panelHeaderBackBtnRadiusBR: 6,
  panelHeaderBackBtnRadiusBL: 6,
  panelHeaderShowRightBtn: true,
  panelHeaderRightBtnTransform: 'none' as PanelHeaderRightBtnTransform,
  panelHeaderRightBtnExpandOnHover: false,
  panelOuterRadius: 16,
  panelHeaderGap: 10,
  panelBodyPaddingX: 16,
  panelBodyPaddingY: 14,
  panelFooterPaddingX: 16,
  panelFooterPaddingY: 6,
  panelFooterFontSize: 12,
  panelFooterSplitRight: false,
  panelFooterRightDivider: false,
  panelFooterRightPaddingX: 12,
  ...DEFAULT_FLOATING_SHELL_TOKENS,
};

export const resolvePanelHeaderBackBtnGeometry = (
  tokens: Pick<
    MenuLayoutTokens,
    | 'panelHeaderPaddingX'
    | 'panelHeaderPaddingY'
    | 'panelHeaderBackBtnWidth'
    | 'panelHeaderBackBtnHeight'
    | 'panelHeaderBackBtnRadiusMode'
    | 'panelHeaderBackBtnRadius'
    | 'panelHeaderBackBtnInnerRadius'
    | 'panelHeaderBackBtnRadiusTL'
    | 'panelHeaderBackBtnRadiusTR'
    | 'panelHeaderBackBtnRadiusBR'
    | 'panelHeaderBackBtnRadiusBL'
    | 'panelOuterRadius'
  >
): BackBtnResolvedGeometry => {
  const width = Math.max(12, tokens.panelHeaderBackBtnWidth);
  const height = Math.max(12, tokens.panelHeaderBackBtnHeight);
  const minDim = Math.min(width, height);
  const halfMinDim = Math.floor(minDim / 2);
  const iconSize = Math.max(10, Math.round(minDim * 0.54));

  const isFlushTopLeft = tokens.panelHeaderPaddingX === 0 && tokens.panelHeaderPaddingY === 0;
  const concentricRadius = isFlushTopLeft
    ? Math.max(0, Math.min(Math.max(width, height), tokens.panelOuterRadius))
    : Math.max(
        0,
        Math.min(
          halfMinDim,
          tokens.panelOuterRadius - Math.max(tokens.panelHeaderPaddingX, tokens.panelHeaderPaddingY)
        )
      );

  const innerRadius = Math.max(0, Math.min(halfMinDim, tokens.panelHeaderBackBtnInnerRadius));
  const customUniform = Math.max(0, tokens.panelHeaderBackBtnRadius);

  let borderRadiusCss: string;
  let rightBorderRadiusCss: string;
  let radiusSummary: string;

  switch (tokens.panelHeaderBackBtnRadiusMode) {
    case 'auto': {
      borderRadiusCss = `${concentricRadius}px`;
      rightBorderRadiusCss = `${concentricRadius}px`;
      radiusSummary = `${concentricRadius}px (Concentric)`;
      break;
    }
    case 'asymmetric-tl': {
      borderRadiusCss = `${concentricRadius}px ${innerRadius}px ${innerRadius}px ${innerRadius}px`;
      rightBorderRadiusCss = `${innerRadius}px ${concentricRadius}px ${innerRadius}px ${innerRadius}px`;
      radiusSummary =
        concentricRadius === innerRadius
          ? `${concentricRadius}px`
          : `${concentricRadius}/${innerRadius}/${innerRadius}/${innerRadius}px`;
      break;
    }
    case 'per-corner': {
      const tl = Math.max(0, tokens.panelHeaderBackBtnRadiusTL);
      const tr = Math.max(0, tokens.panelHeaderBackBtnRadiusTR);
      const br = Math.max(0, tokens.panelHeaderBackBtnRadiusBR);
      const bl = Math.max(0, tokens.panelHeaderBackBtnRadiusBL);
      borderRadiusCss = `${tl}px ${tr}px ${br}px ${bl}px`;
      rightBorderRadiusCss = `${tr}px ${tl}px ${bl}px ${br}px`;
      radiusSummary = `${tl}/${tr}/${br}/${bl}px`;
      break;
    }
    case 'custom':
    default: {
      borderRadiusCss = `${customUniform}px`;
      rightBorderRadiusCss = `${customUniform}px`;
      radiusSummary = `${customUniform}px (Custom)`;
      break;
    }
  }

  return {
    width,
    height,
    iconSize,
    concentricRadius,
    innerRadius,
    borderRadiusCss,
    rightBorderRadiusCss,
    radiusSummary,
  };
};

export function resolvePanelHeaderBtnSurfaceClasses(params: {
  isLight: boolean;
  disabled?: boolean;
  idleTone: PanelHeaderBackBtnIdleTone;
  btnStyle: PanelHeaderBackBtnStyle;
  isFlushDividerMode: boolean;
}): string {
  const { isLight, disabled = false, idleTone, btnStyle, isFlushDividerMode } = params;
  const borderColorClass = isLight
    ? 'border-neutral-200/90 hover:border-neutral-300'
    : 'border-neutral-800/80 hover:border-neutral-700';

  if (disabled) {
    if (idleTone === 'match-header' || btnStyle === 'ghost') {
      return `${isLight ? 'text-neutral-300' : 'text-neutral-600'} bg-transparent ${borderColorClass} opacity-50 cursor-not-allowed`;
    }
    if (idleTone === 'muted-gray' || btnStyle === 'subtle') {
      return `${isLight ? 'bg-neutral-200/40 text-neutral-300' : 'bg-neutral-900/50 text-neutral-600'} ${borderColorClass} opacity-50 cursor-not-allowed`;
    }
    return `${isLight ? 'bg-white/70 text-neutral-300' : 'bg-neutral-800/50 text-neutral-600'} ${borderColorClass} opacity-50 cursor-not-allowed`;
  }

  if (idleTone === 'match-header') {
    return isLight
      ? `bg-transparent hover:bg-neutral-200/80 active:bg-neutral-300/75 ${borderColorClass} text-neutral-500 hover:text-neutral-950 cursor-pointer`
      : `bg-transparent hover:bg-neutral-800/85 active:bg-neutral-700/80 ${borderColorClass} text-neutral-400 hover:text-white cursor-pointer`;
  }

  if (idleTone === 'muted-gray') {
    if (isFlushDividerMode) {
      return isLight
        ? `bg-neutral-200/50 hover:bg-neutral-200/95 active:bg-neutral-300/80 ${borderColorClass} text-neutral-500 hover:text-neutral-950 cursor-pointer`
        : `bg-neutral-900/65 hover:bg-neutral-800/90 active:bg-neutral-700/85 ${borderColorClass} text-neutral-400 hover:text-white cursor-pointer`;
    }
    return isLight
      ? 'bg-neutral-200/55 hover:bg-white border-neutral-300/75 hover:border-neutral-300 text-neutral-500 hover:text-neutral-950 shadow-2xs active:scale-95 cursor-pointer'
      : 'bg-neutral-800/55 hover:bg-neutral-700/90 border-neutral-700/50 hover:border-neutral-600 text-neutral-400 hover:text-white shadow-2xs active:scale-95 cursor-pointer';
  }

  if (isFlushDividerMode) {
    return isLight
      ? `bg-white/90 hover:bg-neutral-200/90 active:bg-neutral-300/80 ${borderColorClass} text-neutral-700 hover:text-neutral-950 cursor-pointer`
      : `bg-neutral-800/80 hover:bg-neutral-700/90 active:bg-neutral-600/80 ${borderColorClass} text-neutral-200 hover:text-white cursor-pointer`;
  }
  return isLight
    ? 'bg-white hover:bg-neutral-100 border-neutral-300/80 text-neutral-700 hover:text-neutral-950 shadow-2xs active:scale-95 cursor-pointer'
    : 'bg-neutral-800/85 hover:bg-neutral-700/90 border-neutral-700/60 text-neutral-200 hover:text-white shadow-2xs active:scale-95 cursor-pointer';
}

export const DEFAULT_MENU_LAYOUT_TOKENS: MenuLayoutTokens = {
  panels: DEFAULT_PANEL_SIZING,
  dividerMarginY: 2,
  menuItemGap: 4,
  menuItemPaddingY: 10,
  menuContainerPadding: 4,
  panelContentPaddingY: 14,
  showAdditionalPreviews: false,
  simulateLayer3Error: false,
  ...DEFAULT_PANEL_SHELL_TOKENS,
  layer1Width: DEFAULT_PANEL_SIZING['layer1-main'].width,
  layer1Height: DEFAULT_PANEL_SIZING['layer1-main'].targetHeight,
  layer2Width: DEFAULT_PANEL_SIZING['layer2-settings'].width,
  layer2Height: DEFAULT_PANEL_SIZING['layer2-settings'].targetHeight,
  layer3Width: DEFAULT_PANEL_SIZING['layer3-host-match'].width,
  layer3Height: DEFAULT_PANEL_SIZING['layer3-host-match'].targetHeight,
};
