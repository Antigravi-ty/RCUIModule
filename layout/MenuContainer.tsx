import React, { useRef } from 'react';
import { UI_SPACING } from '../tokens/spacing';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';

export interface MenuContainerProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  gapPx?: number;
  paddingPx?: number;
}

export const MenuContainer: React.FC<MenuContainerProps> = React.memo(({
  children,
  className = '',
  ariaLabel = 'Navigation Menu',
  gapPx,
  paddingPx,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { menuItemGap, menuContainerPadding } = useMenuLayoutStore();
  const resolvedGap = gapPx ?? menuItemGap;
  const resolvedPadding = paddingPx ?? menuContainerPadding;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const focusable = Array.from(containerRef.current.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
    if (!focusable.length) return;
    const currentIndex = focusable.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusable[(currentIndex + 1) % focusable.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusable[(currentIndex - 1 + focusable.length) % focusable.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusable[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      focusable[focusable.length - 1]?.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      role="menu"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      data-ui-element="menu-container"
      data-menu-container="true"
      style={{ gap: `${resolvedGap}px`, padding: `${resolvedPadding}px` }}
      className={`flex flex-col ${UI_SPACING.menu.gap} ${UI_SPACING.menu.container} w-full transition-colors ${className}`}
    >
      {children}
    </div>
  );
});
MenuContainer.displayName = 'MenuContainer';

export const MenuDivider: React.FC<{ isLight?: boolean; className?: string; marginYPx?: number }> = React.memo(
  ({ isLight = false, className = '', marginYPx }) => {
    const dividerMarginY = useMenuLayoutStore((s) => s.dividerMarginY);
    const resolvedMarginY = marginYPx ?? dividerMarginY;
    return (
      <hr
        style={{ marginTop: `${resolvedMarginY}px`, marginBottom: `${resolvedMarginY}px` }}
        className={`border-none h-px w-full shrink-0 ${isLight ? 'bg-neutral-200' : 'bg-neutral-800'} ${className}`}
      />
    );
  }
);
MenuDivider.displayName = 'MenuDivider';

export const MenuSectionTitle: React.FC<{ children: React.ReactNode; isLight?: boolean; className?: string }> = React.memo(
  ({ children, isLight = false, className = '' }) => (
    <div className={`px-1 py-1 text-[11px] font-bold uppercase tracking-wider select-none ${isLight ? 'text-neutral-500' : 'text-neutral-400'} ${className}`}>
      {children}
    </div>
  )
);
MenuSectionTitle.displayName = 'MenuSectionTitle';

export interface Layer1MainMenuHeaderProps {
  title: string;
  isLight: boolean;
  headerPaddingXPx: number;
  headerPaddingTopPx: number;
  headerPaddingBottomPx: number;
  fontFamily: string;
  fontSizePx: number;
  fontWeight: number;
  letterSpacingEm: number;
}

export const Layer1MainMenuHeader: React.FC<Layer1MainMenuHeaderProps> = React.memo(({
  title, isLight, headerPaddingXPx, headerPaddingTopPx, headerPaddingBottomPx,
  fontFamily, fontSizePx, fontWeight, letterSpacingEm,
}) => (
  <div
    data-ui-element="panel-header"
    data-panel-section="header"
    style={{
      paddingLeft: `${headerPaddingXPx}px`,
      paddingRight: `${headerPaddingXPx}px`,
      paddingTop: `${headerPaddingTopPx}px`,
      paddingBottom: `${headerPaddingBottomPx}px`,
    }}
    className={`border-b select-none text-center transition-colors ${
      isLight ? 'border-neutral-200/90 bg-neutral-50/70 text-neutral-900' : 'border-neutral-800/80 bg-neutral-900/60 text-white'
    }`}
  >
    <h1 style={{ fontFamily, fontSize: `${fontSizePx}px`, fontWeight, letterSpacing: `${letterSpacingEm}em` }} className="uppercase leading-tight">
      {title}
    </h1>
  </div>
));
Layer1MainMenuHeader.displayName = 'Layer1MainMenuHeader';

export interface Layer1MainMenuFooterProps {
  isLight: boolean;
  footerPaddingXPx: number;
  footerPaddingYPx: number;
  footerFontSizePx: number;
  dotColor: string;
  powerLabel: string;
  onJumpToPowerSave: () => void;
  actionIcon?: React.ReactNode;
}

export const Layer1MainMenuFooter: React.FC<Layer1MainMenuFooterProps> = React.memo(({
  isLight, footerPaddingXPx, footerPaddingYPx, footerFontSizePx, dotColor, powerLabel, onJumpToPowerSave, actionIcon,
}) => (
  <div
    data-ui-element="panel-footer"
    data-panel-section="footer"
    style={{
      paddingLeft: `${footerPaddingXPx}px`,
      paddingRight: `${footerPaddingXPx}px`,
      paddingTop: `${footerPaddingYPx}px`,
      paddingBottom: `${footerPaddingYPx}px`,
      fontSize: `${footerFontSizePx}px`,
    }}
    className={`border-t select-none flex items-center justify-between transition-colors shrink-0 mt-auto relative z-10 ${
      isLight ? 'border-neutral-200/90 text-neutral-600 bg-neutral-50/90' : 'border-neutral-800/80 text-neutral-400 bg-neutral-900/90'
    }`}
  >
    <div className="flex items-center gap-1.5 min-w-0">
      <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
      <span className="font-mono truncate">{powerLabel}</span>
    </div>
    <button
      type="button"
      onClick={onJumpToPowerSave}
      className={`flex items-center gap-1 font-mono shrink-0 font-medium transition-colors cursor-pointer outline-none ${
        isLight ? 'text-neutral-500 hover:text-amber-600' : 'text-neutral-400 hover:text-amber-400'
      }`}
      title="Jump directly to Settings -> Display (Menu Power Save)"
    >
      <span>click to change</span>
      {actionIcon}
    </button>
  </div>
));
Layer1MainMenuFooter.displayName = 'Layer1MainMenuFooter';

export interface Layer1TouchAgentSelectorProps {
  isLight: boolean;
  touchHeadlessMode?: boolean;
  selectedAgent: 'none' | 'necto' | 'nexto';
  onSelectAgent: (agent: 'none' | 'necto' | 'nexto') => void;
  botIcon?: React.ReactNode;
}

export const Layer1TouchAgentSelector: React.FC<Layer1TouchAgentSelectorProps> = React.memo(({
  isLight, touchHeadlessMode, selectedAgent, onSelectAgent, botIcon,
}) => (
  <div className={`p-3 rounded-xl border flex flex-col gap-2 font-mono ${
    isLight ? 'bg-neutral-100/90 border-neutral-300 text-neutral-800' : 'bg-neutral-900/80 border-neutral-700/80 text-neutral-200'
  }`}>
    <div className="flex items-center justify-between text-[11px]">
      <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
        {botIcon}
        <span>Touch Input Agent ({touchHeadlessMode ? '?touch=2' : '?touch=1'})</span>
      </span>
      <span className="text-[10px] opacity-75">Model Takeover</span>
    </div>
    <div className="grid grid-cols-3 gap-1.5">
      {(['none', 'necto', 'nexto'] as const).map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelectAgent(id)}
          className={`py-1.5 px-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
            selectedAgent === id
              ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
              : isLight
              ? 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-200'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          {id === 'none' ? 'No input' : id === 'necto' ? 'Necto' : 'Nexto'}
        </button>
      ))}
    </div>
  </div>
));
Layer1TouchAgentSelector.displayName = 'Layer1TouchAgentSelector';
