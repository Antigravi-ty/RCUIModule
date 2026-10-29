import React, { useState, useRef, useCallback } from 'react';
import {
  Keyboard,
  Gamepad2,
  RotateCcw,
  Check,
  Info,
} from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { SettingActionRow } from '../compounds/SettingActionRow';
import { useMenuLayoutStore, DEFAULT_PANEL_SIZING } from '../stores/menuLayoutStore';
import type { PanelSizingConfig } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import {
  ActionBinding,
  INITIAL_BINDINGS,
  GAMEPAD_QUICK_PRESETS,
  ListeningTarget,
  RemovableKeycap,
  ListeningSlot,
  KeybindingActionRow,
} from './keybinding/KeybindingSlots';
import {
  GAMEPAD_BUTTON_INDEX_MAP,
  normalizeKeyboardKey,
  useKeybindingCapture,
} from './keybinding/useKeybindingCapture';

export {
  type ActionBinding,
  INITIAL_BINDINGS,
  GAMEPAD_QUICK_PRESETS,
  type ListeningTarget,
  RemovableKeycap,
  ListeningSlot,
  KeybindingActionRow,
  GAMEPAD_BUTTON_INDEX_MAP,
  normalizeKeyboardKey,
  useKeybindingCapture,
};

export interface Layer3KeybindingsRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  onNavigateAdvancedController?: () => void;
  /** Alias for onNavigateAdvancedController */
  onNavigateAdvanced?: () => void;
  /**
   * If true, renders the full standalone PanelContainer shell with header and footer.
   * If false or omitted, renders the modular 3-column binding table suitable for embedding directly inside Settings.
   */
  standalone?: boolean;
  sizing?: PanelSizingConfig;
  className?: string;
}

const ACTION_CATEGORY_MAP: Record<string, 'Driving' | 'Aerial' | 'Camera' | 'Ball Control' | 'Session'> = {
  throttle: 'Driving',
  brake: 'Driving',
  'steer-left': 'Driving',
  'steer-right': 'Driving',
  boost: 'Driving',
  powerslide: 'Driving',
  jump: 'Aerial',
  'air-roll-left': 'Aerial',
  'air-roll-right': 'Aerial',
  'ball-cam': 'Camera',
  'rear-cam': 'Camera',
  pause: 'Session',
};

/**
 * [Recipe] ControlsBindingTable
 * Fully decoupled 3-Column Controls Mapping Table:
 * - Top Row: Advanced Controller Settings -> Configure (Deadzone & Curves)
 * - Category Filter Bar: All / Driving / Aerial / Camera / Ball Control / Session (left-aligned, evenly spaced) + Reset to Default (right-aligned)
 * - Col 1: Action (text only, no leading icon, aligned with Settings row title font size)
 * - Col 2: Keyboard binds (with Lucide Keyboard icon, unlimited binds, hover delete cross, '+' key capture)
 * - Col 3: Controller binds (with Lucide Gamepad2 icon, unlimited binds, hover delete cross, '+' button capture)
 */
export const ControlsBindingTable: React.FC<{
  isLight?: boolean;
  onNavigateAdvancedController?: () => void;
  onHover?: (desc: string | null) => void;
  onLeave?: () => void;
  className?: string;
}> = ({
  isLight = false,
  onNavigateAdvancedController,
  onHover,
  onLeave,
  className = '',
}) => {
  const [bindings, setBindings] = useState<ActionBinding[]>(INITIAL_BINDINGS);
  const [listeningTarget, setListeningTarget] = useState<ListeningTarget | null>(null);
  const [activeCategory, setActiveCategory] = useState<
    'All' | 'Driving' | 'Aerial' | 'Camera' | 'Ball Control' | 'Session'
  >('All');
  const [confirmReset, setConfirmReset] = useState(false);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const {
    rowGap,
    paddingX,
    paddingY,
    borderRadius,
    titleFontSize,
    buttonFontSize,
    buttonPaddingX,
    buttonPaddingY,
    buttonRadius,
  } = useSettingActionRowStore();

  const showFeedback = useCallback(
    (msg: string) => {
      onHover?.(msg);
    },
    [onHover]
  );

  useKeybindingCapture(listeningTarget, setBindings, setListeningTarget, showFeedback);

  const handleRemoveKey = (actionId: string, kind: 'keyboard' | 'gamepad', keyToRemove: string) => {
    setBindings((prev) =>
      prev.map((item) => {
        if (item.id === actionId) {
          return {
            ...item,
            [kind]: item[kind].filter((k) => k !== keyToRemove),
          };
        }
        return item;
      })
    );
    showFeedback(
      `Unbound ${kind === 'keyboard' ? 'keyboard' : 'controller'} input [${keyToRemove}].`
    );
  };

  const handleSelectGamepadPreset = (buttonName: string) => {
    if (!listeningTarget || listeningTarget.kind !== 'gamepad') return;

    setBindings((prev) =>
      prev.map((item) => {
        if (item.id === listeningTarget.actionId) {
          if (item.gamepad.includes(buttonName)) return item;
          return {
            ...item,
            gamepad: [...item.gamepad, buttonName],
          };
        }
        return item;
      })
    );

    showFeedback(`Bound controller button [${buttonName}].`);
    setListeningTarget(null);
  };

  const handleResetDefaults = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      showFeedback('Click again to confirm resetting all key bindings to default.');
      setTimeout(() => setConfirmReset(false), 2500);
      return;
    }
    setBindings(INITIAL_BINDINGS);
    setListeningTarget(null);
    setConfirmReset(false);
    showFeedback('Restored default keyboard and controller bindings.');
  };

  const categories: Array<'All' | 'Driving' | 'Aerial' | 'Camera' | 'Ball Control' | 'Session'> = [
    'All',
    'Driving',
    'Aerial',
    'Camera',
    'Ball Control',
    'Session',
  ];

  const filteredBindings =
    activeCategory === 'All'
      ? bindings
      : bindings.filter((b) => (ACTION_CATEGORY_MAP[b.id] ?? 'Session') === activeCategory);

  return (
    <div ref={tableRef} className={`flex flex-col w-full text-xs select-none gap-2 ${className}`}>
      {/* Top Entry Row: Advanced Controller Settings -> Configure */}
      <SettingActionRow
        icon={Gamepad2}
        iconColor="text-amber-500"
        title="Advanced Controller Settings"
        description="Response curves, axial/radial deadzones, dodge thresholds & input visualizer"
        hoverDescription="Configure analog stick response curves, axial/radial deadzones, dodge thresholds, and live input visualizer."
        buttonHoverDescription="Open Advanced Controller & Input Curves configuration."
        showDescription={false}
        bordered={false}
        actionLabel="Configure"
        onAction={() => onNavigateAdvancedController?.()}
        onHover={(desc) => onHover?.(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* Category Filter Pills (left-aligned) + Reset to Default (right-aligned), evenly spaced across full width */}
      <div
        style={{
          paddingLeft: `${Math.max(0, paddingX)}px`,
          paddingRight: `${Math.max(0, paddingX)}px`,
        }}
        className="flex items-center justify-between w-full"
      >
        {categories.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              onMouseEnter={() =>
                onHover?.(
                  cat === 'All'
                    ? 'Show all keyboard and controller action bindings.'
                    : `Filter bindings by ${cat} actions.`
                )
              }
              onMouseLeave={onLeave}
              style={{
                fontSize: `${buttonFontSize}px`,
                paddingLeft: `${Math.max(6, buttonPaddingX - 2)}px`,
                paddingRight: `${Math.max(6, buttonPaddingX - 2)}px`,
                paddingTop: `${buttonPaddingY}px`,
                paddingBottom: `${buttonPaddingY}px`,
                borderRadius: `${Math.max(0, buttonRadius)}px`,
              }}
              className={`shrink-0 font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap leading-tight active:scale-95 ${
                active
                  ? isLight
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-amber-500 text-neutral-950 font-bold shadow-2xs'
                  : isLight
                  ? 'bg-neutral-200/60 hover:bg-neutral-200/95 text-neutral-600 hover:text-neutral-900'
                  : 'bg-white/[0.06] hover:bg-white/[0.11] text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cat}
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleResetDefaults}
          onMouseEnter={() =>
            onHover?.('Restore all keyboard and controller bindings to their default values.')
          }
          onMouseLeave={onLeave}
          style={{
            fontSize: `${buttonFontSize}px`,
            paddingLeft: `${buttonPaddingX}px`,
            paddingRight: `${buttonPaddingX}px`,
            paddingTop: `${buttonPaddingY}px`,
            paddingBottom: `${buttonPaddingY}px`,
            borderRadius: `${Math.max(0, buttonRadius)}px`,
          }}
          className={`shrink-0 font-semibold border transition-all duration-150 cursor-pointer inline-flex items-center gap-1.5 leading-tight active:scale-95 whitespace-nowrap ${
            confirmReset
              ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-500 font-bold'
              : isLight
              ? 'bg-neutral-200/60 hover:bg-neutral-200/95 border-neutral-300/80 text-neutral-800'
              : 'bg-white/[0.06] hover:bg-white/[0.11] border-white/[0.10] hover:border-white/[0.16] text-neutral-200'
          }`}
          title="Reset all bindings to default"
        >
          {confirmReset ? (
            <Check
              style={{
                width: `${Math.max(11, buttonFontSize)}px`,
                height: `${Math.max(11, buttonFontSize)}px`,
              }}
              className="shrink-0"
            />
          ) : (
            <RotateCcw
              style={{
                width: `${Math.max(11, buttonFontSize)}px`,
                height: `${Math.max(11, buttonFontSize)}px`,
              }}
              className="shrink-0"
            />
          )}
          <span>{confirmReset ? 'Confirm Reset' : 'Reset to Default'}</span>
        </button>
      </div>

      {/* 3-Column Binding Table Header */}
      <div
        style={{
          paddingLeft: `${Math.max(0, paddingX)}px`,
          paddingRight: `${Math.max(0, paddingX)}px`,
        }}
        className={`grid grid-cols-12 items-center py-2 font-semibold text-xs tracking-wider uppercase border-b transition-colors ${
          isLight
            ? 'border-neutral-200/90 text-neutral-500'
            : 'border-neutral-800/80 text-neutral-400'
        }`}
      >
        <div className="col-span-5 flex items-center pr-2">
          <span>Action</span>
        </div>

        <div className="col-span-4 flex items-center gap-1.5 pr-2">
          <Keyboard className="h-3.5 w-3.5 text-sky-500 shrink-0" />
          <span>Keyboard</span>
        </div>

        <div className="col-span-3 flex items-center gap-1.5">
          <Gamepad2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span>Controller</span>
        </div>
      </div>

      {/* 3-Column Binding Table Body */}
      <div className="flex flex-col w-full" style={{ gap: `${rowGap}px` }}>
        {filteredBindings.map((b) => (
          <KeybindingActionRow
            key={b.id}
            binding={b}
            isLight={isLight}
            paddingX={paddingX}
            paddingY={paddingY}
            borderRadius={borderRadius}
            titleFontSize={titleFontSize}
            listeningTarget={listeningTarget}
            onStartListening={setListeningTarget}
            onRemoveKey={handleRemoveKey}
            onSelectGamepadPreset={handleSelectGamepadPreset}
            onHover={onHover}
            onLeave={onLeave}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * [Recipe] Layer3KeybindingsRecipe
 * Full-featured Keybinding Panel:
 * - If standalone: wraps the 3-column table inside PanelContainer with standard Header and Footer.
 * - If embedded inside Layer2SettingsRecipe: renders the ControlsBindingTable seamlessly without redundant wrapper.
 */
export const Layer3KeybindingsRecipe: React.FC<Layer3KeybindingsRecipeProps> = ({
  isLight = false,
  onBack = () => {},
  onNavigateAdvancedController,
  onNavigateAdvanced,
  standalone = false,
  sizing: propSizing,
  className = '',
}) => {
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  const storeSizing = useMenuLayoutStore(
    (s) => s.panels?.['layer3-keybindings'] ?? DEFAULT_PANEL_SIZING['layer3-keybindings']
  );
  const sizing = propSizing ?? storeSizing;
  const resolvedNavigateAdvanced = onNavigateAdvancedController ?? onNavigateAdvanced;

  if (!standalone) {
    return (
      <ControlsBindingTable
        isLight={isLight}
        onNavigateAdvancedController={resolvedNavigateAdvanced}
        onHover={setHoveredDesc}
        onLeave={() => setHoveredDesc(null)}
        className={className}
      />
    );
  }

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className={`w-full ${className}`}>
      <PanelHeader
        title="KEY BINDINGS"
        onBack={onBack}
        isLight={isLight}
      />

      <PanelContent scrollable>
        <ControlsBindingTable
          isLight={isLight}
          onNavigateAdvancedController={resolvedNavigateAdvanced}
          onHover={setHoveredDesc}
          onLeave={() => setHoveredDesc(null)}
        />
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Click [+] to bind a new keyboard key or controller button. Hover any keycap to unbind, or press ESC to cancel."
        hoveredDescription={hoveredDesc}
        icon={<Info className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
      />
    </PanelContainer>
  );
};
