import React, { useRef, useId } from 'react';
import { motion } from 'framer-motion';
import { UI_EASING } from '../tokens/spacing';
import { useUnderlineTabsStore, type UnderlineTabsFontFamily, type UnderlineTabsFontWeight } from '../tokens/underlineTabsStore';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface UnderlineTabsProps {
  items?: TabItem[];
  tabs?: TabItem[];
  activeId: string;
  onChange?: (id: string) => void;
  onSelect?: (id: string) => void;
  id?: string;
  isLight?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /**
   * If true, tabs expand to fill the full container width with symmetric equal spacing (Apple symmetric switch style).
   * Defaults to useUnderlineTabsStore.fullWidth (true).
   */
  fullWidth?: boolean;
  /**
   * Color class for the sliding underline indicator.
   * Defaults to warm orange/amber ('bg-amber-500'), avoiding harsh blue.
   */
  indicatorColor?: string;
  /** Optional per-instance override for tab label font size in px (defaults to useUnderlineTabsStore.fontSize) */
  fontSize?: number;
  /** Optional per-instance override for leading SVG icon size in px (defaults to useUnderlineTabsStore.iconSize) */
  iconSize?: number;
  /** Optional per-instance override for gap between icon and label in px (defaults to useUnderlineTabsStore.iconGap) */
  iconGap?: number;
  /** Optional per-instance override for horizontal padding in px (defaults to useUnderlineTabsStore.paddingX) */
  paddingX?: number;
  /** Optional per-instance override for vertical padding in px (defaults to useUnderlineTabsStore.paddingY) */
  paddingY?: number;
  /** Optional per-instance override for bottom underline thickness in px (defaults to useUnderlineTabsStore.indicatorHeight) */
  indicatorHeight?: number;
  /** Optional per-instance override for whether tab icons are shown (defaults to useUnderlineTabsStore.showIcons) */
  showIcons?: boolean;
  /** Optional per-instance override for font family ('sans' | 'mono') */
  fontFamily?: UnderlineTabsFontFamily;
  /** Optional per-instance override for active tab font weight */
  activeFontWeight?: UnderlineTabsFontWeight;
  /** Optional per-instance override for inactive tab font weight */
  inactiveFontWeight?: UnderlineTabsFontWeight;
}

/**
 * UnderlineTabs
 * Apple / Linear style navigation tabs with a fluid sliding underline indicator.
 * - Consumes live typography, icon sizing, and spacing tokens from `useUnderlineTabsStore`
 *   so tuning in L1.1 (`TabsPage` `#l1-underline-tabs`), L6 (`RecipesPage`), or L7 (`7A Menu Layer`)
 *   synchronizes globally across all panels while supporting per-instance prop overrides.
 * - Width-invariant typography: active bold state uses hidden font reservation so tab width NEVER jitters or expands.
 * - Scoped layoutId via useId() allows multiple instances to coexist safely without layout jumping.
 * - Supports keyboard arrow keys (ArrowLeft / ArrowRight) for seamless roving focus.
 */
export const UnderlineTabs: React.FC<UnderlineTabsProps> = React.memo(({
  items: propItems,
  tabs,
  activeId,
  onChange: propOnChange,
  onSelect,
  id,
  isLight = false,
  className = '',
  fullWidth: propFullWidth,
  indicatorColor = 'bg-amber-500',
  fontSize: propFontSize,
  iconSize: propIconSize,
  iconGap: propIconGap,
  paddingX: propPaddingX,
  paddingY: propPaddingY,
  indicatorHeight: propIndicatorHeight,
  showIcons: propShowIcons,
  fontFamily: propFontFamily,
  activeFontWeight: propActiveFontWeight,
  inactiveFontWeight: propInactiveFontWeight,
}) => {
  const store = useUnderlineTabsStore();

  const resolvedFontSize = propFontSize ?? store.fontSize;
  const resolvedIconSize = propIconSize ?? store.iconSize;
  const resolvedIconGap = propIconGap ?? store.iconGap;
  const resolvedPadX = propPaddingX ?? store.paddingX;
  const resolvedPadY = propPaddingY ?? store.paddingY;
  const resolvedIndicatorHeight = propIndicatorHeight ?? store.indicatorHeight;
  const resolvedShowIcons = propShowIcons ?? store.showIcons;
  const resolvedFullWidth = propFullWidth ?? store.fullWidth;
  const resolvedFontFamily = propFontFamily ?? store.fontFamily;
  const resolvedActiveWeight = Number(propActiveFontWeight ?? store.activeFontWeight) || 600;
  const resolvedInactiveWeight = Number(propInactiveFontWeight ?? store.inactiveFontWeight) || 500;
  const reservationWeight = Math.max(resolvedActiveWeight, resolvedInactiveWeight);

  const items = propItems || tabs || [];
  const onChange = (nextId: string) => {
    propOnChange?.(nextId);
    onSelect?.(nextId);
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const instanceId = id || reactId;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const enabledItems = items.filter((item) => !item.disabled);
    const currentIndex = enabledItems.findIndex((item) => item.id === activeId);
    if (currentIndex === -1) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (currentIndex + 1) % enabledItems.length;
      onChange(enabledItems[next].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
      onChange(enabledItems[prev].id);
    }
  };

  const renderTabIcon = (iconNode: React.ReactNode) => {
    if (!iconNode || !resolvedShowIcons) return null;
    if (React.isValidElement(iconNode)) {
      const el = iconNode as React.ReactElement<{
        style?: React.CSSProperties;
        width?: number;
        height?: number;
      }>;
      return React.cloneElement(el, {
        width: resolvedIconSize,
        height: resolvedIconSize,
        style: {
          ...(el.props?.style || {}),
          width: `${resolvedIconSize}px`,
          height: `${resolvedIconSize}px`,
        },
      });
    }
    return iconNode;
  };

  return (
    <div
      ref={containerRef}
      role="tablist"
      data-ui-element="underline-tabs"
      onKeyDown={handleKeyDown}
      className={`relative flex items-center border-b ${
        resolvedFullWidth ? 'w-full' : ''
      } ${
        resolvedFontFamily === 'mono' ? 'font-mono' : 'font-sans'
      } ${
        isLight ? 'border-neutral-200' : 'border-neutral-800'
      } ${className}`}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        const renderedIcon = renderTabIcon(tab.icon);
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            style={{
              fontSize: `${resolvedFontSize}px`,
              paddingLeft: `${resolvedPadX}px`,
              paddingRight: `${resolvedPadX}px`,
              paddingTop: `${resolvedPadY}px`,
              paddingBottom: `${resolvedPadY}px`,
              gap: `${resolvedIconGap}px`,
            }}
            className={`group relative flex items-center transition-colors duration-150 outline-none select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed leading-tight ${
              resolvedFullWidth ? 'flex-1 min-w-0 justify-center' : 'shrink-0'
            }`}
          >
            {renderedIcon && (
              <span
                style={{
                  width: `${resolvedIconSize}px`,
                  height: `${resolvedIconSize}px`,
                }}
                className={`inline-flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? isLight
                      ? 'text-neutral-900'
                      : 'text-white'
                    : isLight
                    ? 'text-neutral-400 group-hover:text-neutral-600'
                    : 'text-neutral-500 group-hover:text-neutral-300'
                }`}
              >
                {renderedIcon}
              </span>
            )}

            {/* Zero-shift text wrapper: permanent bold ghost reservation ensures exact constant width */}
            <span className="relative inline-flex flex-col items-center justify-center truncate">
              <span
                style={{
                  fontWeight: isActive ? resolvedActiveWeight : resolvedInactiveWeight,
                }}
                className={`truncate transition-colors ${
                  isActive
                    ? isLight
                      ? 'text-neutral-900'
                      : 'text-white'
                    : isLight
                    ? 'text-neutral-500 group-hover:text-neutral-800'
                    : 'text-neutral-400 group-hover:text-neutral-200'
                }`}
              >
                {tab.label}
              </span>
              <span
                style={{ fontWeight: reservationWeight }}
                className="invisible h-0 select-none pointer-events-none truncate"
                aria-hidden="true"
              >
                {tab.label}
              </span>
            </span>

            {tab.badge && <span className="shrink-0 ml-1">{tab.badge}</span>}

            {/* Sliding Underline Indicator: Warm orange/amber by default, uniquely scoped */}
            {isActive && (
              <motion.div
                layoutId={`underline-tabs-active-indicator-${instanceId}`}
                layoutDependency={activeId}
                style={{ height: `${resolvedIndicatorHeight}px` }}
                className={`absolute bottom-0 left-0 right-0 ${indicatorColor} rounded-full`}
                transition={UI_EASING.spring.tactile}
              />
            )}
          </button>
        );
      })}
    </div>
  );
});

UnderlineTabs.displayName = 'UnderlineTabs';
