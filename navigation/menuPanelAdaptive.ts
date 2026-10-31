/**
 * Pure, zero-coupling Adaptive Intrinsic Measurement & Canvas Clamping Engine for Menu Panels (L4 Navigation).
 *
 * Migrates the 3-stage adaptive architecture from 6D Floating Windows (`FloatingWindowManager`,
 * `floatingWindowMinWidth`, `floatingWindowGeometry`) to 7A Menu Layer (`PanelContainer`):
 * 1. Intrinsic Content Height Detection (`measureNaturalElementHeight`):
 *    Measures the true un-stretched natural height of `Header + Tabs + Content + Footer + 2px border`
 *    without being fooled by `flex-1` or `justify-between` when the outer container is taller,
 *    or by scroll clipping when the outer container is compressed.
 * 2. Intrinsic Minimum-Width Probing (`measureMenuPanelIntrinsicDimensions`):
 *    Combines `Header` non-overlapping title width, `UnderlineTabs` single-line bar width, and
 *    `measureIntrinsicMinWidth` on `[data-panel-section="content"]` (1px binary search + 16px scrollbar reserve).
 * 3. Canvas Boundary Clamping & Dual-State Memory (`resolveClampedMenuPanelGeometry`):
 *    Requests the exact space the menu needs when the screen/canvas is large, and automatically
 *    compresses width/height (activating internal scroll) when the screen/canvas is small.
 */

import type { PanelSizingConfig } from '../stores/menuLayoutStore';
import type { ContainerBounds } from './floatingWindowGeometry';
import {
  measureIntrinsicMinWidth,
  SCROLLBAR_GUTTER_RESERVE_PX,
} from './floatingWindowMinWidth';

export type MenuPanelWidthAdaptiveMode = 'design-auto-expand' | 'intrinsic-min';

export interface MenuPanelIntrinsicMetrics {
  /** Exact natural non-scrolling total height of the menu panel (integer px) */
  intrinsicHeight: number;
  /** Exact minimum non-truncating, non-wrapping width of the menu panel incl. 16px scrollbar reserve (integer px) */
  autoMinWidth: number;
  /** Minimum width required by the content stage alone incl. scrollbar reserve (integer px) */
  contentMinWidth: number;
  /** Minimum width required by the header + tabs bars (integer px) */
  chromeMinWidth: number;
  /** Vertical scrollbar gutter reserved in autoMinWidth (integer px, default 16px) */
  scrollbarReservePx: number;
}

export interface ClampedMenuPanelGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  desiredWidth: number;
  desiredHeight: number;
  effectiveMinWidth: number;
  autoMinWidth: number;
  intrinsicHeight: number;
  scrollbarReservePx: number;
  isWidthSqueezed: boolean;
  isHeightSqueezed: boolean;
  modeLabel: string;
}

function getExplicitVerticalMargin(el: HTMLElement, style: CSSStyleDeclaration): number {
  const isTopAuto =
    el.classList.contains('mt-auto') ||
    el.getAttribute('data-panel-section') === 'footer';
  const isBottomAuto = el.classList.contains('mb-auto');
  const mt = isTopAuto ? 0 : parseFloat(style.marginTop) || 0;
  const mb = isBottomAuto ? 0 : parseFloat(style.marginBottom) || 0;
  return mt + mb;
}

function getVerticalPaddingAndBorder(style: CSSStyleDeclaration): number {
  return (
    (parseFloat(style.paddingTop) || 0) +
    (parseFloat(style.paddingBottom) || 0) +
    (parseFloat(style.borderTopWidth) || 0) +
    (parseFloat(style.borderBottomWidth) || 0)
  );
}

/**
 * Measures the natural un-stretched height of a flex/grid container's children
 * without being fooled by `flex-1` stretching, `mt-auto`, or `justify-between` empty space.
 */
export function measureNaturalElementHeight(el: HTMLElement, depth = 0): number {
  if (typeof window === 'undefined') return el.offsetHeight;
  const style = window.getComputedStyle(el);
  if (style.display === 'none') return 0;

  const padBorderY = getVerticalPaddingAndBorder(style);
  const visibleChildren: HTMLElement[] = [];
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i] as HTMLElement;
    const cStyle = window.getComputedStyle(child);
    if (
      cStyle.display === 'none' ||
      cStyle.position === 'absolute' ||
      cStyle.position === 'fixed'
    ) {
      continue;
    }
    visibleChildren.push(child);
  }

  if (visibleChildren.length === 0) {
    return Math.max(el.getBoundingClientRect().height, el.scrollHeight);
  }

  // Multi-column CSS Grid (e.g. Layer 4 .RCSPack Browser 12-col split view or Layer 2 Play 3-col grid)
  if (style.display === 'grid') {
    if (el.getAttribute('data-tab-envelope-grid') === 'true') {
      let maxTabH = 0;
      for (let i = 0; i < el.children.length; i++) {
        const tabWrapper = el.children[i] as HTMLElement;
        if (tabWrapper.getAttribute('data-envelope-exclude') === 'true') {
          continue;
        }
        const inner = tabWrapper.firstElementChild as HTMLElement | null;
        const rawTabH = inner
          ? measureNaturalElementHeight(inner, depth + 1)
          : tabWrapper.scrollHeight;
        const effectiveTabH = Math.min(rawTabH, 360);
        if (effectiveTabH > maxTabH) {
          maxTabH = effectiveTabH;
        }
      }
      if (maxTabH > 0) {
        el.style.setProperty('--tab-envelope-h', `${Math.floor(maxTabH)}px`);
        return padBorderY + maxTabH;
      }
    }

    const cols = style.gridTemplateColumns
      ? style.gridTemplateColumns.trim().split(/\s+/).length
      : 1;
    // If it is a 2-column split container with flex-grow (`grow min-h-0 overflow-hidden`),
    // measure each column's natural un-clipped height and take the maximum.
    const isStretchedSplitGrid =
      depth <= 2 &&
      (parseFloat(style.flexGrow) > 0 || el.classList.contains('grow')) &&
      visibleChildren.length === 2 &&
      cols >= 2;

    if (isStretchedSplitGrid) {
      let maxColH = 0;
      for (const col of visibleChildren) {
        const colStyle = window.getComputedStyle(col);
        const colH =
          measureNaturalElementHeight(col, depth + 1) +
          getExplicitVerticalMargin(col, colStyle);
        if (colH > maxColH) maxColH = colH;
      }
      return padBorderY + maxColH;
    }

    // Standard auto-sizing grid (e.g. PlayModeCard grid):
    // Its bounding rect height is already its exact natural grid height.
    return el.getBoundingClientRect().height;
  }

  const gapY = parseFloat(style.rowGap) || parseFloat(style.gap) || 0;
  let sumChildrenH = 0;

  for (const child of visibleChildren) {
    const cStyle = window.getComputedStyle(child);
    const marginY = getExplicitVerticalMargin(child, cStyle);
    const isFlexStretched =
      child.getAttribute('data-tab-envelope-grid') === 'true' ||
      parseFloat(cStyle.flexGrow) > 0 ||
      child.classList.contains('grow') ||
      child.classList.contains('flex-1') ||
      cStyle.overflowY === 'auto' ||
      cStyle.overflowY === 'scroll';

    if (depth < 3 && isFlexStretched && child.children.length > 0) {
      sumChildrenH += measureNaturalElementHeight(child, depth + 1) + marginY;
    } else {
      sumChildrenH += child.getBoundingClientRect().height + marginY;
    }
  }

  sumChildrenH += Math.max(0, visibleChildren.length - 1) * gapY;
  return padBorderY + sumChildrenH;
}

function measureTextContentWidth(el: HTMLElement): number {
  if (typeof document !== 'undefined' && document.createRange) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0) return Math.ceil(rect.width);
  }
  return Math.ceil(el.scrollWidth);
}

/**
 * Measures the minimum non-overlapping width required by PanelHeader and UnderlineTabs
 * without being fooled by block-level `<h1>` widths or `flex-1` stretched tab buttons.
 */
function measureChromeMinWidth(panelEl: HTMLElement): number {
  let minW = 300;

  const headerEl = panelEl.querySelector<HTMLElement>('[data-panel-section="header"]');
  if (headerEl) {
    const hStyle = window.getComputedStyle(headerEl);
    const padX =
      (parseFloat(hStyle.paddingLeft) || 0) + (parseFloat(hStyle.paddingRight) || 0);
    const titleEl = headerEl.querySelector<HTMLElement>('h1, h2');
    const titleW = titleEl ? measureTextContentWidth(titleEl) : 120;
    const buttons = headerEl.querySelectorAll<HTMLElement>('button');
    let maxBtnW = 0;
    buttons.forEach((btn) => {
      const bw = Math.ceil(btn.getBoundingClientRect().width);
      if (bw > maxBtnW) maxBtnW = bw;
    });
    const sideBtnReserve = buttons.length > 0 ? (maxBtnW + 12) * 2 : 0;
    const headerNeeded = titleW + sideBtnReserve + padX + 8;
    if (headerNeeded > minW) minW = headerNeeded;
  }

  const tablistEl = panelEl.querySelector<HTMLElement>('[role="tablist"]');
  if (tablistEl) {
    const parentStyle = tablistEl.parentElement
      ? window.getComputedStyle(tablistEl.parentElement)
      : null;
    const padX = parentStyle
      ? (parseFloat(parentStyle.paddingLeft) || 0) +
        (parseFloat(parentStyle.paddingRight) || 0)
      : 32;
    const tabs = tablistEl.querySelectorAll<HTMLElement>('[role="tab"]');
    let tabsSumW = 0;
    tabs.forEach((tab) => {
      const tabStyle = window.getComputedStyle(tab);
      const tabPadX =
        (parseFloat(tabStyle.paddingLeft) || 0) +
        (parseFloat(tabStyle.paddingRight) || 0);
      const tabGap = parseFloat(tabStyle.columnGap) || parseFloat(tabStyle.gap) || 4;
      let innerW = 0;
      let visibleSubCount = 0;
      for (let i = 0; i < tab.children.length; i++) {
        const sub = tab.children[i] as HTMLElement;
        const subStyle = window.getComputedStyle(sub);
        if (
          subStyle.display === 'none' ||
          subStyle.position === 'absolute' ||
          subStyle.position === 'fixed'
        ) {
          continue;
        }
        innerW += Math.ceil(sub.scrollWidth || sub.getBoundingClientRect().width);
        visibleSubCount++;
      }
      const naturalTabW =
        innerW + Math.max(0, visibleSubCount - 1) * tabGap + tabPadX + 4;
      tabsSumW += naturalTabW;
    });
    const tStyle = window.getComputedStyle(tablistEl);
    const gap = parseFloat(tStyle.columnGap) || parseFloat(tStyle.gap) || 0;
    const tabsNeeded =
      tabsSumW + Math.max(0, tabs.length - 1) * gap + padX + 8;
    if (tabsNeeded > minW) minW = tabsNeeded;
  }

  return Math.round(minW);
}

function measureTabEnvelopeMinWidth(contentEl: HTMLElement): number {
  const envelopeGrid = contentEl.querySelector<HTMLElement>(
    '[data-tab-envelope-grid="true"]'
  );
  if (!envelopeGrid) return 0;

  const cStyle = window.getComputedStyle(contentEl);
  const contentPadX =
    (parseFloat(cStyle.paddingLeft) || 0) + (parseFloat(cStyle.paddingRight) || 0);

  let maxInnerW = 0;

  for (let i = 0; i < envelopeGrid.children.length; i++) {
    const tabWrapper = envelopeGrid.children[i] as HTMLElement;
    if (tabWrapper.getAttribute('data-envelope-exclude') === 'true') {
      continue;
    }

    const rows = tabWrapper.querySelectorAll<HTMLElement>(
      '[data-ui-element="setting-action-row"]'
    );
    rows.forEach((row) => {
      const rStyle = window.getComputedStyle(row);
      const rowPadX =
        (parseFloat(rStyle.paddingLeft) || 0) +
        (parseFloat(rStyle.paddingRight) || 0) +
        (parseFloat(rStyle.borderLeftWidth) || 0) +
        (parseFloat(rStyle.borderRightWidth) || 0);
      const topLine = row.firstElementChild as HTMLElement | null;
      if (topLine && topLine.children.length >= 2) {
        const leftEl = topLine.children[0] as HTMLElement;
        const rightEl = topLine.children[topLine.children.length - 1] as HTMLElement;
        const titleSpan = leftEl.querySelector<HTMLElement>('span.font-semibold');
        const titleW = titleSpan ? measureTextContentWidth(titleSpan) : 110;
        const leftW = 26 + titleW + 8;
        const rightW = Math.ceil(
          rightEl.scrollWidth || rightEl.getBoundingClientRect().width
        );
        const rowNeeded = rowPadX + leftW + 12 + rightW;
        if (rowNeeded > maxInnerW) maxInnerW = rowNeeded;
      }
    });

    const queueLists = tabWrapper.querySelectorAll<HTMLElement>(
      '[data-component="priority-queue-list"]'
    );
    if (queueLists.length >= 2) {
      let maxCardW = 0;
      queueLists.forEach((card) => {
        const cardStyle = window.getComputedStyle(card);
        const cardPadX =
          (parseFloat(cardStyle.paddingLeft) || 0) +
          (parseFloat(cardStyle.paddingRight) || 0) +
          2;
        const listContainer = card.children[1] as HTMLElement | undefined;
        if (listContainer) {
          for (let j = 0; j < listContainer.children.length; j++) {
            const itemRow = listContainer.children[j] as HTMLElement;
            const leftGroup = itemRow.children[0] as HTMLElement | undefined;
            const rightGroup = itemRow.children[1] as HTMLElement | undefined;
            const nameSpan = leftGroup?.querySelector<HTMLElement>('span.truncate');
            const nameW = nameSpan ? measureTextContentWidth(nameSpan) : 72;
            const leftW = 46 + nameW;
            const rightW = rightGroup
              ? Math.ceil(rightGroup.getBoundingClientRect().width)
              : 118;
            const cardNeeded = cardPadX + 26 + leftW + 8 + rightW;
            if (cardNeeded > maxCardW) maxCardW = cardNeeded;
          }
        }
      });
      const twoColNeeded = maxCardW * 2 + 14;
      if (twoColNeeded > maxInnerW) maxInnerW = twoColNeeded;
    }

    const carGrid = tabWrapper.querySelector<HTMLElement>(
      '[data-ui-element="garage-tab-car"]'
    );
    if (carGrid) {
      let maxCarCardW = 0;
      for (let j = 0; j < carGrid.children.length; j++) {
        const btn = carGrid.children[j] as HTMLElement;
        const nameSpan = btn.querySelector<HTMLElement>('span.font-bold');
        const nameW = nameSpan ? measureTextContentWidth(nameSpan) : 64;
        const cardW = nameW + 32;
        if (cardW > maxCarCardW) maxCarCardW = cardW;
      }
      const fourColNeeded = maxCarCardW * 4 + 36;
      if (fourColNeeded > maxInnerW) maxInnerW = fourColNeeded;
    }
  }

  if (maxInnerW <= 0) return 0;
  return Math.min(640, Math.ceil(maxInnerW + contentPadX + 2));
}

/**
 * Synchronously measures both the natural non-scrolling height (`intrinsicHeight`) and
 * minimum non-truncating width (`autoMinWidth` + `16px` scrollbar reserve) of a rendered Menu Panel.
 */
export function measureMenuPanelIntrinsicDimensions(
  panelEl: HTMLElement,
  options?: {
    fallbackMinWidth?: number;
    tier?: 'user' | 'developer';
    measureWidth?: boolean;
  }
): MenuPanelIntrinsicMetrics {
  const fallbackMinW = Math.round(options?.fallbackMinWidth ?? 360);
  if (typeof window === 'undefined') {
    return {
      intrinsicHeight: 420,
      autoMinWidth: fallbackMinW,
      contentMinWidth: fallbackMinW,
      chromeMinWidth: 320,
      scrollbarReservePx: SCROLLBAR_GUTTER_RESERVE_PX,
    };
  }

  let totalH = 2; // +2px for top & bottom 1px outer border
  let contentEl: HTMLElement | null = null;

  for (let i = 0; i < panelEl.children.length; i++) {
    const child = panelEl.children[i] as HTMLElement;
    const cStyle = window.getComputedStyle(child);
    if (
      cStyle.display === 'none' ||
      cStyle.position === 'absolute' ||
      cStyle.position === 'fixed'
    ) {
      continue;
    }
    const marginY = getExplicitVerticalMargin(child, cStyle);
    if (child.getAttribute('data-panel-section') === 'content') {
      contentEl = child;
      totalH += measureNaturalElementHeight(child, 0) + marginY;
    } else {
      totalH += child.getBoundingClientRect().height + marginY;
    }
  }

  const intrinsicHeight = Math.max(120, Math.round(totalH));
  const chromeMinWidth = measureChromeMinWidth(panelEl);

  if (options?.measureWidth === false || !contentEl || contentEl.clientWidth <= 0) {
    const envelopeMinW = contentEl ? measureTabEnvelopeMinWidth(contentEl) : 0;
    const autoMinW = Math.max(fallbackMinW, chromeMinWidth, envelopeMinW);
    return {
      intrinsicHeight,
      autoMinWidth: autoMinW,
      contentMinWidth: Math.max(fallbackMinW, envelopeMinW),
      chromeMinWidth,
      scrollbarReservePx: SCROLLBAR_GUTTER_RESERVE_PX,
    };
  }

  const envelopeMinW = measureTabEnvelopeMinWidth(contentEl);
  const widthResult = measureIntrinsicMinWidth(contentEl, {
    isResizable: true,
    fallbackMinWidth: Math.max(Math.min(fallbackMinW, 340), envelopeMinW),
    tier: options?.tier,
    maxProbeWidth: 680,
  });

  const effectiveContentMinW = Math.max(widthResult.totalMinWidth, envelopeMinW);
  const autoMinWidth = Math.round(
    Math.max(chromeMinWidth, effectiveContentMinW)
  );

  return {
    intrinsicHeight,
    autoMinWidth,
    contentMinWidth: effectiveContentMinW,
    chromeMinWidth,
    scrollbarReservePx: widthResult.scrollbarReservePx,
  };
}

/**
 * Pure spatial constraint solver for 7A Menu Layer panels (with Dual-State Memory):
 * - Expands to claim the exact height & width the content needs when the canvas has space.
 * - Automatically compresses width & height (keeping all 4 corners inside `[margin, stage - margin]`)
 *   when the screen/canvas shrinks, and restores the full size as soon as space returns.
 */
export function resolveClampedMenuPanelGeometry(params: {
  sizing: PanelSizingConfig;
  intrinsicHeight?: number;
  autoMinWidth?: number;
  manualMinWidth?: number;
  widthMode?: MenuPanelWidthAdaptiveMode;
  stageBounds: ContainerBounds;
  margin?: number;
}): ClampedMenuPanelGeometry {
  const margin = params.margin ?? 16;
  const { sizing, stageBounds } = params;
  const widthMode = params.widthMode ?? 'design-auto-expand';

  const autoMinW = Math.round(
    params.autoMinWidth ?? Math.min(sizing.width, 400)
  );
  const effectiveMinWidth =
    params.manualMinWidth !== undefined && Number.isFinite(params.manualMinWidth)
      ? Math.max(260, Math.round(params.manualMinWidth))
      : autoMinW;

  const desiredWidth =
    params.manualMinWidth !== undefined || widthMode === 'intrinsic-min'
      ? effectiveMinWidth
      : Math.max(Math.round(sizing.width), effectiveMinWidth);

  const naturalH = Math.round(params.intrinsicHeight ?? sizing.targetHeight);
  const desiredHeight =
    sizing.mode === 'fixed'
      ? Math.round(sizing.targetHeight)
      : Math.max(
          Math.round(sizing.minHeight),
          Math.min(naturalH, Math.round(sizing.maxHeight))
        );

  const availW = Math.max(260, Math.floor(stageBounds.width - margin * 2));
  const availH = Math.max(180, Math.floor(stageBounds.height - margin * 2));

  const width = Math.min(desiredWidth, availW);
  const height = Math.min(desiredHeight, availH);

  const x = Math.max(margin, Math.round((stageBounds.width - width) / 2));
  const y = Math.max(margin, Math.round((stageBounds.height - height) / 2));

  const isWidthSqueezed = width < desiredWidth - 1;
  const isHeightSqueezed = height < naturalH - 2;

  const squeezeTag =
    isWidthSqueezed || isHeightSqueezed ? ' · Canvas-Squeezed' : '';
  const modeTag =
    sizing.mode === 'fixed'
      ? 'Fixed'
      : widthMode === 'intrinsic-min'
      ? 'Intrinsic Auto-Fit'
      : 'Auto-Fit';

  return {
    x,
    y,
    width,
    height,
    desiredWidth,
    desiredHeight,
    effectiveMinWidth,
    autoMinWidth: autoMinW,
    intrinsicHeight: naturalH,
    scrollbarReservePx: SCROLLBAR_GUTTER_RESERVE_PX,
    isWidthSqueezed,
    isHeightSqueezed,
    modeLabel: `${width}×${height}px (${modeTag}${squeezeTag})`,
  };
}
