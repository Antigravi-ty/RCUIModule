import React from 'react';
import { Code2 } from 'lucide-react';
import { SettingActionRow } from './SettingActionRow';
import {
  useSettingActionRowStore,
  type DevStatusAccentColor,
} from '../stores/settingRowStore';

export interface SettingDeveloperStatusRowProps {
  /** Primary row title (default: 'Developer Settings') */
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }> | React.ReactNode;
  iconName?: string;
  /** Whether Developer Mode is currently active */
  developerMode: boolean;
  /** Optional callback when the status row or badge is clicked (enabled when interactiveToggle is true) */
  onDeveloperModeChange?: (active: boolean) => void;
  /** Override active accent color ('emerald' = green, 'amber' = orange; defaults to store.devStatusAccentColor) */
  accentColor?: DevStatusAccentColor;
  /** Override whether clicking the row/badge toggles developerMode (defaults to store.devStatusInteractiveToggle) */
  interactiveToggle?: boolean;
  bordered?: boolean;
  showDescription?: boolean;
  hoverDescription?: string;
  onHover?: (desc: string) => void;
  onLeave?: () => void;
  isLight?: boolean;
  className?: string;
}

/**
 * [L1/L3 Decoupled Primitive] SettingDeveloperStatusRow
 * First row of Advanced Settings (`Developer Settings`):
 * - Replaces the right-side ToggleSwitch with a status Badge:
 *   - When `developerMode === false`: neutral gray `Disabled` badge and standard neutral leading icon.
 *   - When `developerMode === true`: customizable `Active` badge (`emerald` green or `amber` orange)
 *     and matching colored leading icon (`text-emerald-500` or `text-amber-500`).
 * - Shares `SettingActionRow` geometry (`paddingX`, `paddingY`, `titleFontSize`) so its right edge
 *   aligns 100% with all other controls in Advanced Settings.
 */
export const SettingDeveloperStatusRow: React.FC<SettingDeveloperStatusRowProps> = React.memo(({
  title = 'Developer Settings',
  description,
  icon = Code2,
  iconName,
  developerMode,
  onDeveloperModeChange,
  accentColor: propAccentColor,
  interactiveToggle: propInteractive,
  bordered,
  showDescription,
  hoverDescription,
  onHover,
  onLeave,
  isLight = false,
  className = '',
}) => {
  const store = useSettingActionRowStore();
  const resolvedAccent: DevStatusAccentColor = propAccentColor ?? store.devStatusAccentColor;
  const resolvedInteractive = propInteractive ?? store.devStatusInteractiveToggle;
  const resolvedBordered = bordered ?? (store.bordered || store.advancedBordered);

  const activeIconColorClass =
    resolvedAccent === 'emerald'
      ? isLight
        ? 'text-emerald-600'
        : 'text-emerald-400'
      : isLight
      ? 'text-amber-600'
      : 'text-amber-400';

  const badgeClass = developerMode
    ? resolvedAccent === 'emerald'
      ? isLight
        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700'
        : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
      : isLight
      ? 'bg-amber-500/15 border-amber-500/40 text-amber-700'
      : 'bg-amber-500/15 border-amber-500/35 text-amber-400'
    : isLight
    ? 'bg-neutral-200/75 border-neutral-300/90 text-neutral-500'
    : 'bg-neutral-800/90 border-neutral-700/90 text-neutral-400';

  const dotClass = developerMode
    ? resolvedAccent === 'emerald'
      ? 'bg-emerald-500'
      : 'bg-amber-500'
    : isLight
    ? 'bg-neutral-400'
    : 'bg-neutral-500';

  const resolvedDesc =
    description ??
    (developerMode
      ? 'Developer mode is active. Developer Settings tab and override tools are unlocked.'
      : 'Developer mode is disabled.');

  const resolvedHover =
    hoverDescription ??
    (developerMode
      ? 'Developer Settings is Active. The Developer tab in Settings and low-level parameter overrides are unlocked.'
      : 'Developer Settings is currently Disabled.');

  const handleTrigger = () => {
    if (resolvedInteractive && onDeveloperModeChange) {
      onDeveloperModeChange(!developerMode);
    }
  };

  return (
    <SettingActionRow
      icon={icon}
      iconName={iconName}
      iconColor={developerMode ? activeIconColorClass : undefined}
      title={title}
      description={resolvedDesc}
      bordered={resolvedBordered}
      showDescription={showDescription}
      onAction={resolvedInteractive && onDeveloperModeChange ? handleTrigger : undefined}
      hoverDescription={resolvedHover}
      onHover={onHover}
      onLeave={onLeave}
      isLight={isLight}
      className={className}
      rightSlot={
        <span
          role={resolvedInteractive && onDeveloperModeChange ? 'button' : undefined}
          tabIndex={resolvedInteractive && onDeveloperModeChange ? 0 : undefined}
          onClick={(e) => {
            if (resolvedInteractive && onDeveloperModeChange) {
              e.stopPropagation();
              handleTrigger();
            }
          }}
          onKeyDown={(e) => {
            if (
              resolvedInteractive &&
              onDeveloperModeChange &&
              (e.key === 'Enter' || e.key === ' ')
            ) {
              e.preventDefault();
              e.stopPropagation();
              handleTrigger();
            }
          }}
          style={{
            borderRadius: `${Math.max(4, store.buttonRadius)}px`,
            paddingLeft: `${Math.max(8, store.buttonPaddingX)}px`,
            paddingRight: `${Math.max(8, store.buttonPaddingX)}px`,
            paddingTop: `${Math.max(3, store.buttonPaddingY - 1)}px`,
            paddingBottom: `${Math.max(3, store.buttonPaddingY - 1)}px`,
            fontSize: `${Math.max(10, store.buttonFontSize - 1)}px`,
          }}
          className={`inline-flex items-center gap-1.5 font-mono font-semibold border tracking-wide transition-colors select-none shrink-0 ${
            resolvedInteractive && onDeveloperModeChange ? 'cursor-pointer active:scale-95' : ''
          } ${badgeClass}`}
          title={
            resolvedInteractive
              ? 'Click to toggle Developer Mode state (Active / Disabled)'
              : undefined
          }
        >
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} />
          <span>{developerMode ? 'Active' : 'Disabled'}</span>
        </span>
      }
    />
  );
});

SettingDeveloperStatusRow.displayName = 'SettingDeveloperStatusRow';
