import React, { useState } from 'react';
import { useLayer1MainMenuStoreBinding } from './hooks/useMainMenuAndPlayStoreBindings';
import {
  Play,
  Gamepad2,
  Wrench,
  Settings,
  ArrowUpRight,
  RotateCcw,
  HouseCog,
  UserRoundCog,
  Info,
  LogOut,
  Bot,
} from 'lucide-react';
import { PanelContainer, PanelContent } from '../layout/Panel';
import { MainMenuRow } from '../layout/MainMenuRow';
import { MenuContainer, MenuDivider } from '../layout/MenuContainer';
import { useMenuLayoutStore, DEFAULT_PANEL_SIZING } from '../stores/menuLayoutStore';
import type { PanelSizingConfig } from '../stores/menuLayoutStore';
import {
  useMainMenuStyleStore,
  resolveMainMenuTitleTypography,
  type MainMenuStyleParams,
  type MainMenuStyleVariant,
} from '../stores/mainMenuStyleStore';
import {
  LAYER1_CONTEXT_VARIATIONS,
  LAYER1_CONTEXT_GROUPS,
  resolveLayer1ContextSpec,
  type CanonicalLayer1ContextVariation,
  type Layer1ContextVariation,
  type Layer1MenuContextMode,
  type Layer1ContextMeta,
  type Layer1ContextGroupId,
  type Layer1ContextGroupMeta,
  type Layer1CustomRowIconType,
} from './layer1MenuContextSpecs';
import {
  Layer1ContextGroupedSelector,
  type Layer1ContextGroupedSelectorProps,
} from './Layer1ContextGroupedSelector';

export {
  LAYER1_CONTEXT_VARIATIONS,
  LAYER1_CONTEXT_GROUPS,
  resolveLayer1ContextSpec,
  Layer1ContextGroupedSelector,
  type Layer1ContextGroupedSelectorProps,
  type CanonicalLayer1ContextVariation,
  type Layer1ContextVariation,
  type Layer1MenuContextMode,
  type Layer1ContextMeta,
  type Layer1ContextGroupId,
  type Layer1ContextGroupMeta,
};

export type TouchInputAgentOption = 'none' | 'necto' | 'nexto';

export interface Layer1MainMenuRecipeProps {
  isLight?: boolean;
  showAdditionalPreviews?: boolean;
  /** Legacy matchMode prop OR full Layer1ContextVariation */
  matchMode?: Layer1ContextVariation | 'online-warmup' | 'static-training-pack';
  /** Explicit context variation (overrides matchMode if provided) */
  contextVariation?: Layer1ContextVariation;
  /** Alias for contextVariation */
  contextMode?: Layer1ContextVariation;
  /** Optional developer Touch Input Agent banner (?touch=1 / ?touch=2) */
  touchMode?: boolean;
  touchHeadlessMode?: boolean;
  /** Controlled Touch Input Agent takeover model ('none' | 'necto' | 'nexto') */
  touchInputAgent?: TouchInputAgentOption;
  /** Initial uncontrolled Touch Input Agent takeover model */
  defaultTouchInputAgent?: TouchInputAgentOption;
  /** Callback fired when Touch Input Agent model changes */
  onTouchInputAgentChange?: (agent: TouchInputAgentOption) => void;
  /** Background power saving mode ('extreme' | '15' | '30' | 'disable' | 'freeze' | 'match') */
  menuPowerSave?: 'extreme' | '15' | '30' | 'disable' | 'freeze' | 'match';
  /** Legacy boolean fallback for backgroundRenderPaused */
  backgroundRenderPaused?: boolean;
  onResume?: () => void;
  onRestartMatch?: () => void;
  onReturnToFreeplay?: () => void;
  onNavigatePlay?: () => void;
  onNavigateGarage?: () => void;
  onNavigateSettings?: (targetTab?: string) => void;
  onNavigatePreviews?: () => void;
  onNavigateManageRoom?: () => void;
  onNavigateRoomControl?: () => void;
  onNavigateTrainingConfig?: () => void;
  onNavigateKickoffConfig?: () => void;
  onNavigateStaticTrainingPack?: () => void;
  onNavigateExpMultiBots?: () => void;
  onNavigateExpMultiBotsConfig?: () => void;
  onOpenFloatingWindow?: (id: string) => void;
  onLeaveRoom?: () => void;
  onExitEditMode?: () => void;
  /** Optional extra bottom action (e.g. "Exit Edit Mode" when EdgeInspectorDrawer is active) */
  extraBottomAction?:
    | {
        title: string;
        subtitle?: string;
        icon?: React.ReactNode;
        variant?: 'primary' | 'secondary' | 'danger';
        onClick: () => void;
      }
    | React.ReactNode;
  /** Optional explicit sizing override; defaults to menuLayoutStore.panels['layer1-main'] */
  sizing?: PanelSizingConfig;
  /** Optional explicit row style variant override (decoupled from store when provided) */
  styleVariant?: MainMenuStyleVariant;
  /** Optional explicit row & shell style parameters override (decoupled from store when provided) */
  styleParams?: Partial<MainMenuStyleParams>;
  className?: string;
}

const renderCustomRowIcon = (
  iconType: Layer1CustomRowIconType,
  colorClass?: string
): React.ReactNode => {
  const cls = `h-5 w-5 ${colorClass || ''}`.trim();
  switch (iconType) {
    case 'house-cog':
      return <HouseCog className={cls} />;
    case 'user-round-cog':
      return <UserRoundCog className={cls} />;
    case 'info':
      return <Info className={cls} />;
    case 'bot':
      return <Bot className={cls} />;
    case 'gamepad-2':
    default:
      return <Gamepad2 className={cls} />;
  }
};

/**
 * [Recipe] Layer 1 Main Menu (Root / Width: 420px)
 * Driven by decoupled per-context specs (`layer1MenuContextSpecs.ts`) and `MainMenuRow` (`useMainMenuStyleStore`).
 */
export const Layer1MainMenuRecipe: React.FC<Layer1MainMenuRecipeProps> = (rawProps) => {
  const {
  isLight = false,
  matchMode,
  contextVariation: propContextVariation,
  contextMode,
  touchMode = false,
  touchHeadlessMode = false,
  touchInputAgent: propTouchInputAgent,
  defaultTouchInputAgent = 'none',
  onTouchInputAgentChange,
  menuPowerSave,
  backgroundRenderPaused = false,
  onResume,
  onRestartMatch,
  onReturnToFreeplay,
  onNavigatePlay,
  onNavigateGarage,
  onNavigateSettings,
  onNavigateManageRoom: propNavigateManageRoom,
  onNavigateRoomControl,
  onNavigateExpMultiBotsConfig: propNavigateExpMultiBotsConfig,
  onNavigateExpMultiBots,
  onLeaveRoom,
  onExitEditMode,
  extraBottomAction,
  sizing: propSizing,
  styleVariant,
  styleParams,
  className = '',
} = useLayer1MainMenuStoreBinding(rawProps);
  const contextVariation = propContextVariation ?? contextMode;
  const onNavigateManageRoom = propNavigateManageRoom ?? onNavigateRoomControl;
  const onNavigateExpMultiBotsConfig = propNavigateExpMultiBotsConfig ?? onNavigateExpMultiBots;
  const storeSizing = useMenuLayoutStore(
    (s) => s.panels?.['layer1-main'] ?? DEFAULT_PANEL_SIZING['layer1-main']
  );
  const sizing = propSizing ?? storeSizing;

  const storeMenuStyle = useMainMenuStyleStore();
  const mergedStyle: MainMenuStyleParams = {
    ...storeMenuStyle,
    ...(styleParams || {}),
    itemIconColors: {
      ...storeMenuStyle.itemIconColors,
      ...(styleParams?.itemIconColors || {}),
    },
  };
  const activeStyleVariant: MainMenuStyleVariant =
    styleVariant ?? styleParams?.variant ?? mergedStyle.variant;

  const [internalTouchInputAgent, setInternalTouchInputAgent] =
    useState<TouchInputAgentOption>(defaultTouchInputAgent);
  const touchInputAgent = propTouchInputAgent ?? internalTouchInputAgent;

  const handleTouchInputAgentSelect = (next: TouchInputAgentOption) => {
    setInternalTouchInputAgent(next);
    onTouchInputAgentChange?.(next);
  };

  const rawCtxInput =
    contextVariation ?? matchMode ?? storeMenuStyle.previewContextMode ?? 'freeplay';
  const ctxSpec = resolveLayer1ContextSpec(rawCtxInput);

  const handleCustomRowClick = () => {
    const actionType = ctxSpec.customActionRow?.actionType;
    if (actionType === 'manage-room') {
      onNavigateManageRoom?.();
    } else if (actionType === 'exp-multi-bots') {
      onNavigateExpMultiBotsConfig?.();
    } else {
      onNavigatePlay?.();
    }
  };

  const handleBottomRowClick = () => {
    const actionType = ctxSpec.bottomActionRow?.actionType;
    if (actionType === 'leave-room') {
      (onLeaveRoom ?? onReturnToFreeplay)?.();
    } else if (actionType === 'exit-edit-mode') {
      (onExitEditMode ?? onReturnToFreeplay)?.();
    } else {
      onReturnToFreeplay?.();
    }
  };

  const resolvedBottomAction =
    extraBottomAction ??
    (ctxSpec.bottomActionRow
      ? {
          title: ctxSpec.bottomActionRow.title,
          subtitle: ctxSpec.bottomActionRow.subtitle,
          icon: <LogOut className={`h-5 w-5 ${ctxSpec.bottomActionRow.iconColorClass}`} />,
          variant: ctxSpec.bottomActionRow.variant,
          onClick: handleBottomRowClick,
        }
      : undefined);

  const powerSave = menuPowerSave ?? (backgroundRenderPaused ? 'extreme' : '30');
  let dotColor = 'bg-emerald-500';
  let powerLabel = 'Power Saving: 30 FPS';
  if (powerSave === 'extreme' || powerSave === 'freeze') {
    dotColor = 'bg-amber-500 animate-pulse';
    powerLabel = 'Power Saving: Extreme';
  } else if (powerSave === '15') {
    dotColor = 'bg-amber-400';
    powerLabel = 'Power Saving: 15 FPS';
  } else if (powerSave === '30') {
    dotColor = 'bg-emerald-400';
    powerLabel = 'Power Saving: 30 FPS';
  } else if (powerSave === 'disable' || powerSave === 'match') {
    dotColor = 'bg-emerald-500';
    powerLabel = 'Power Saving: Disable';
  }

  const resolvedHeaderTypography = resolveMainMenuTitleTypography(
    mergedStyle.headerFontFamily,
    mergedStyle.headerFontWeight,
    storeMenuStyle.platformPreviewMode
  );

  return (
    <PanelContainer
      isLight={isLight}
      sizing={sizing}
      className={`w-full shadow-2xl ${className}`}
    >
      {/* 1. TOP HEADER */}
      <div
        data-ui-element="panel-header"
        data-panel-section="header"
        style={{
          paddingLeft: `${mergedStyle.headerPaddingXPx}px`,
          paddingRight: `${mergedStyle.headerPaddingXPx}px`,
          paddingTop: `${mergedStyle.headerPaddingTopPx}px`,
          paddingBottom: `${mergedStyle.headerPaddingBottomPx}px`,
        }}
        className={`border-b select-none text-center transition-colors ${
          isLight
            ? 'border-neutral-200/90 bg-neutral-50/70 text-neutral-900'
            : 'border-neutral-800/80 bg-neutral-900/60 text-white'
        }`}
      >
        <h1
          style={{
            fontFamily: resolvedHeaderTypography.fontFamily,
            fontSize: `${mergedStyle.headerFontSizePx}px`,
            fontWeight: resolvedHeaderTypography.fontWeight,
            letterSpacing: `${mergedStyle.headerLetterSpacingEm}em`,
          }}
          className="uppercase leading-tight"
        >
          {ctxSpec.headerTitle}
        </h1>
      </div>

      {/* 2. CENTER CONTENT */}
      <PanelContent
        scrollable={true}
        style={{
          paddingLeft: `${mergedStyle.contentPaddingXPx}px`,
          paddingRight: `${mergedStyle.contentPaddingXPx}px`,
          paddingTop: `${mergedStyle.contentPaddingYPx}px`,
          paddingBottom: `${mergedStyle.contentPaddingYPx}px`,
        }}
      >
        <MenuContainer
          ariaLabel="Main Game Menu"
          gapPx={mergedStyle.itemGapPx}
          paddingPx={mergedStyle.menuContainerPaddingPx}
        >
          {/* Resume */}
          <MainMenuRow
            slotId="resume"
            icon={<Play className="h-5 w-5" />}
            title={mergedStyle.conciseResumeLabel ? 'Resume' : 'Resume Match'}
            subtitle="Return to active arena gameplay"
            shortcut="ESC"
            variant="primary"
            styleVariant={activeStyleVariant}
            styleParams={mergedStyle}
            autoFocus
            onClick={onResume}
            isLight={isLight}
          />

          {touchMode && (
            <div
              className={`p-3 rounded-xl border flex flex-col gap-2 font-mono ${
                isLight
                  ? 'bg-neutral-100/90 border-neutral-300 text-neutral-800'
                  : 'bg-neutral-900/80 border-neutral-700/80 text-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
                  <Bot className="h-3.5 w-3.5" />
                  <span>Touch Input Agent ({touchHeadlessMode ? '?touch=2' : '?touch=1'})</span>
                </span>
                <span className="text-[10px] opacity-75">Model Takeover</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'none', label: 'No input' },
                    { id: 'necto', label: 'Necto' },
                    { id: 'nexto', label: 'Nexto' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleTouchInputAgentSelect(opt.id)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                      touchInputAgent === opt.id
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                        : isLight
                        ? 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-200'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mergedStyle.showDividers && (
            <MenuDivider isLight={isLight} marginYPx={mergedStyle.dividerMarginYPx} />
          )}

          {/* Context-dependent primary action row (Play / Configure Room / Session Hub / Match Admin / Room Info / Configure Match) */}
          {ctxSpec.customActionRow && (
            <MainMenuRow
              slotId={ctxSpec.customActionRow.slotId}
              icon={renderCustomRowIcon(
                ctxSpec.customActionRow.iconType,
                ctxSpec.customActionRow.iconColorClass
              )}
              iconColorToken={ctxSpec.customActionRow.iconColorToken}
              title={ctxSpec.customActionRow.title}
              subtitle={ctxSpec.customActionRow.subtitle}
              hasArrow
              styleVariant={activeStyleVariant}
              styleParams={mergedStyle}
              onClick={handleCustomRowClick}
              isLight={isLight}
            />
          )}

          {/* Garage (Hidden during active Online Match stage where loadout switching is locked) */}
          {ctxSpec.showGarage && (
            <MainMenuRow
              slotId="garage"
              icon={<Wrench className="h-5 w-5" />}
              title="Garage"
              subtitle="Vehicle models, colours & player anthem"
              hasArrow
              styleVariant={activeStyleVariant}
              styleParams={mergedStyle}
              onClick={onNavigateGarage}
              isLight={isLight}
            />
          )}

          {/* Settings */}
          {ctxSpec.showSettings && (
            <MainMenuRow
              slotId="settings"
              icon={<Settings className="h-5 w-5" />}
              title="Settings"
              subtitle="Gameplay, controls, video & sound"
              hasArrow
              styleVariant={activeStyleVariant}
              styleParams={mergedStyle}
              onClick={() => onNavigateSettings?.()}
              isLight={isLight}
            />
          )}

          {/* Restart Match (Only when enabled in context spec, e.g., Developer Experimental Multi-Bots) */}
          {ctxSpec.showRestartMatch && (
            <>
              {mergedStyle.showDividers && (
                <MenuDivider isLight={isLight} marginYPx={mergedStyle.dividerMarginYPx} />
              )}
              <MainMenuRow
                slotId="restart"
                icon={<RotateCcw className="h-5 w-5" />}
                title="Restart Match"
                subtitle="Reset score, clock and restart kickoff"
                variant="secondary"
                styleVariant={activeStyleVariant}
                styleParams={mergedStyle}
                onClick={onRestartMatch}
                isLight={isLight}
              />
            </>
          )}

          {/* Bottom Exit / Leave Action (Leave Room / Leave Match / Exit to Free Play / Exit Edit Mode) */}
          {resolvedBottomAction &&
            (typeof resolvedBottomAction === 'object' &&
            resolvedBottomAction !== null &&
            'title' in resolvedBottomAction ? (
              <>
                {mergedStyle.showDividers && (
                  <MenuDivider isLight={isLight} marginYPx={mergedStyle.dividerMarginYPx} />
                )}
                <MainMenuRow
                  slotId="leave"
                  icon={resolvedBottomAction.icon || <LogOut className="h-5 w-5 text-rose-400" />}
                  title={resolvedBottomAction.title}
                  subtitle={resolvedBottomAction.subtitle}
                  variant={resolvedBottomAction.variant || 'danger'}
                  styleVariant={activeStyleVariant}
                  styleParams={mergedStyle}
                  onClick={resolvedBottomAction.onClick}
                  isLight={isLight}
                />
              </>
            ) : (
              resolvedBottomAction
            ))}
        </MenuContainer>
      </PanelContent>

      {/* 3. BOTTOM FOOTER: Render Pause Indicator + Settings Shortcut Link */}
      {mergedStyle.showFooter && (
        <div
          data-ui-element="panel-footer"
          data-panel-section="footer"
          style={{
            paddingLeft: `${mergedStyle.footerPaddingXPx}px`,
            paddingRight: `${mergedStyle.footerPaddingXPx}px`,
            paddingTop: `${mergedStyle.footerPaddingYPx}px`,
            paddingBottom: `${mergedStyle.footerPaddingYPx}px`,
            fontSize: `${mergedStyle.footerFontSizePx}px`,
          }}
          className={`border-t select-none flex items-center justify-between transition-colors shrink-0 mt-auto relative z-10 ${
            isLight
              ? 'border-neutral-200/90 text-neutral-600 bg-neutral-50/90'
              : 'border-neutral-800/80 text-neutral-400 bg-neutral-900/90'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
            <span className="font-mono truncate">{powerLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateSettings?.('display')}
            className={`flex items-center gap-1 font-mono shrink-0 font-medium transition-colors cursor-pointer outline-none ${
              isLight
                ? 'text-neutral-500 hover:text-amber-600'
                : 'text-neutral-400 hover:text-amber-400'
            }`}
            title="Jump directly to Settings -> Display (Menu Power Save)"
          >
            <span>click to change</span>
            <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
          </button>
        </div>
      )}
    </PanelContainer>
  );
};
