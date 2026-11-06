import React, { useState } from 'react';
import {
  Play, Gamepad2, Wrench, Settings, ArrowUpRight, RotateCcw,
  HouseCog, UserRoundCog, Info, LogOut, Bot,
} from 'lucide-react';
import type { StandardSurfaceProps, SurfaceMeta } from '../manifest/surfaceMetaTypes';
import { PanelContainer, PanelContent } from '../layout/Panel';
import { MainMenuRow } from '../layout/MainMenuRow';
import { MenuContainer, MenuDivider } from '../layout/MenuContainer';
import { useAppStore } from '../stores/appStore';
import { useExperimentalMultiBotsStore } from '../stores/experimentalMultiBotsStore';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useNameTagTunerStore } from '../stores/nameTagTunerStore';
import { useNetworkDiagnosticsData } from '../stores/networkDiagnosticsStore';
import { getActiveReplayTimelineController } from '../stores/replayDirectorStore';
import { useReplayViewerStore } from '../stores/replayViewerStore';
import { useRewinderStore } from '../stores/rewinderStore';
import { useStaticTrainingPackStore } from '../stores/staticTrainingPackStore';
import { useScopedStore, useStoreSnapshotOverride } from '../stores/storeSnapshotScope';
import { DEFAULT_PANEL_SIZING, type PanelSizingConfig } from '../tokens/menuLayoutTokens';
import {
  useMainMenuStyleStore,
  resolveMainMenuTitleTypography,
  type MainMenuStyleParams,
  type MainMenuStyleVariant,
} from '../stores/mainMenuStyleStore';
import {
  LAYER1_CONTEXT_VARIATIONS,
  LAYER1_CONTEXT_GROUPS,
  LAYER1_SURFACE_VARIANTS,
  resolveLayer1ContextSpec,
  type CanonicalLayer1ContextVariation,
  type Layer1ContextVariation,
  type Layer1MenuContextMode,
  type Layer1ContextMeta,
  type Layer1ContextGroupId,
  type Layer1ContextGroupMeta,
  type Layer1CustomRowIconType,
} from './layer1MenuContextSpecs';

export {
  LAYER1_CONTEXT_VARIATIONS,
  LAYER1_CONTEXT_GROUPS,
  LAYER1_SURFACE_VARIANTS,
  type CanonicalLayer1ContextVariation,
  type Layer1ContextVariation,
  type Layer1MenuContextMode,
  type Layer1ContextMeta,
  type Layer1ContextGroupId,
  type Layer1ContextGroupMeta,
};

export const SURFACE_META: SurfaceMeta = {
  id: 'recipe:Layer1MainMenuRecipe',
  title: 'Main Menu',
  subtitle: 'Root ESC pause & session context menu across 14 user and developer variations',
  icon: 'Menu',
  layer: 'layer1',
  menuGroup: 'menu-layer',
  defaultSizing: { width: 420, minHeight: 240, maxHeight: 540, mode: 'adaptive' },
  variants: LAYER1_SURFACE_VARIANTS,
};

export type TouchInputAgentOption = 'none' | 'necto' | 'nexto';

export interface Layer1MainMenuBottomActionSpec {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}

interface Layer1ScopedAppOverrides {
  contextVariation?: Layer1ContextVariation;
  contextMode?: Layer1ContextVariation;
  backgroundRenderPaused?: boolean;
  menuPowerSave?: 'extreme' | '15' | '30' | 'disable' | 'freeze' | 'match';
  extraBottomAction?: Layer1MainMenuBottomActionSpec | React.ReactNode;
  sizing?: PanelSizingConfig;
  onResume?: () => void;
  onRestartMatch?: () => void;
  onReturnToFreeplay?: () => void;
  onNavigatePlay?: () => void;
  onNavigateGarage?: () => void;
  onNavigateSettings?: (targetTab?: string) => void;
  onNavigateManageRoom?: () => void;
  onNavigateExpMultiBotsConfig?: () => void;
  onLeaveRoom?: () => void;
  onExitEditMode?: () => void;
}

export interface Layer1MainMenuRecipeProps extends StandardSurfaceProps {
  className?: string;
}

const renderCustomRowIcon = (iconType: Layer1CustomRowIconType, colorClass?: string): React.ReactNode => {
  const cls = `h-5 w-5 ${colorClass || ''}`.trim();
  switch (iconType) {
    case 'house-cog': return <HouseCog className={cls} />;
    case 'user-round-cog': return <UserRoundCog className={cls} />;
    case 'info': return <Info className={cls} />;
    case 'bot': return <Bot className={cls} />;
    case 'gamepad-2':
    default: return <Gamepad2 className={cls} />;
  }
};

export const Layer1MainMenuRecipe: React.FC<Layer1MainMenuRecipeProps> = ({
  isLight = false,
  activeTab,
  onTabChange,
  onBack,
  className = '',
}) => {
  const matchMode = useScopedStore('appStore', useAppStore, (s) => s.matchMode);
  const onlineSession = useScopedStore('appStore', useAppStore, (s) => s.onlineSession);
  const touchMode = useScopedStore('appStore', useAppStore, (s) => s.touchMode);
  const touchHeadlessMode = useScopedStore('appStore', useAppStore, (s) => s.touchHeadlessMode);
  const storeTouchInputAgent = useScopedStore('appStore', useAppStore, (s) => s.touchInputAgent);
  const setTouchInputAgent = useScopedStore('appStore', useAppStore, (s) => s.setTouchInputAgent);
  const storeMenuPowerSave = useScopedStore('appStore', useAppStore, (s) => s.graphics?.menuPowerSave);
  const navigate = useScopedStore('appStore', useAppStore, (s) => s.navigate);
  const closeMenu = useScopedStore('appStore', useAppStore, (s) => s.closeMenu);
  const bridge = useScopedStore('appStore', useAppStore, (s) => s.bridge);
  const appOverrides = useStoreSnapshotOverride<Layer1ScopedAppOverrides>('appStore');

  const isExhibitionMode = useScopedStore('experimentalMultiBotsStore', useExperimentalMultiBotsStore, (s) => s.isExhibitionMode);
  const replayViewerHasLoaded = useScopedStore('replayViewerStore', useReplayViewerStore, (s) =>
    Boolean((s.loadedFileName && s.totalFrames > 0) || s.viewerState !== 'idle')
  );
  const isNameTagTunerArenaActive = useScopedStore('nameTagTunerStore', useNameTagTunerStore, (s) => s.isTunerArenaActive);
  const rewinderState = useScopedStore('rewinderStore', useRewinderStore, (s) => s.rewinderState);
  const staticTrainingSessionMode = useScopedStore('staticTrainingPackStore', useStaticTrainingPackStore, (s) => s.sessionMode);
  const { metrics: netDiagMetrics } = useNetworkDiagnosticsData();

  const storeSizing = useScopedStore(
    'menuLayoutStore',
    useMenuLayoutStore,
    (s) => s.panels?.['layer1-main'] ?? DEFAULT_PANEL_SIZING['layer1-main']
  );
  const sizing = appOverrides?.sizing ?? storeSizing;

  const storeMenuStyle = useMainMenuStyleStore();
  const styleOverrides = useStoreSnapshotOverride<MainMenuStyleParams & { previewContextMode?: Layer1ContextVariation }>('mainMenuStyleStore');

  const mergedStyle: MainMenuStyleParams = {
    ...storeMenuStyle,
    ...(styleOverrides || {}),
    itemIconColors: { ...storeMenuStyle.itemIconColors, ...(styleOverrides?.itemIconColors || {}) },
  };
  const activeStyleVariant: MainMenuStyleVariant = styleOverrides?.variant ?? mergedStyle.variant;

  const [internalTouchInputAgent, setInternalTouchInputAgent] = useState<TouchInputAgentOption>('none');
  const touchInputAgent = storeTouchInputAgent ?? internalTouchInputAgent;
  const handleTouchInputAgentSelect = (next: TouchInputAgentOption) => {
    setInternalTouchInputAgent(next);
    setTouchInputAgent?.(next);
  };

  const activeDirectorCtrl = getActiveReplayTimelineController();
  const isDirectorPreviewActive = Boolean(
    activeDirectorCtrl?.sessionState?.isActive &&
      (activeDirectorCtrl?.sessionState?.isImportedPreview || activeDirectorCtrl?.sessionState?.isPersistent)
  );
  const isRewinderBlocking =
    rewinderState === 'paused-scrub' || rewinderState === 'rewinding' ||
    rewinderState === 'forwarding' || rewinderState === 'preroll-countdown';
  const hasFreeplaySubSceneOverride = Boolean(
    isNameTagTunerArenaActive || isDirectorPreviewActive || isRewinderBlocking || netDiagMetrics?.zeroGFleetEnabled
  );

  const isHosting = Boolean(onlineSession?.isHosting);
  const isOnlineMatchRoom = onlineSession?.roomType === 'match';
  const hasActiveOnlineRoom = matchMode === 'online-warmup' || Boolean(onlineSession?.roomId);

  let derivedVariation: CanonicalLayer1ContextVariation = 'freeplay';
  if (matchMode === 'match') {
    derivedVariation = hasActiveOnlineRoom ? (isHosting ? 'online-match-host' : 'online-match-client') : 'exhibition';
  } else if (matchMode === 'dev-test-lab') {
    derivedVariation = 'dev-test-lab';
  } else if (matchMode === 'exp-multi-bots') {
    derivedVariation = isExhibitionMode ? 'exhibition' : 'exp-multi-bots';
  } else if (matchMode === 'kickoff-training') {
    derivedVariation = 'kickoff-training';
  } else if (matchMode === 'replay-viewer' || (matchMode === 'freeplay' && replayViewerHasLoaded)) {
    derivedVariation = 'replay-viewer';
  } else if (matchMode === 'static-training-pack') {
    derivedVariation =
      staticTrainingSessionMode === 'edit' || Boolean(appOverrides?.extraBottomAction)
        ? 'static-training-edit'
        : 'static-training-play';
  } else if (hasActiveOnlineRoom) {
    derivedVariation = isOnlineMatchRoom
      ? isHosting ? 'match-lobby-host' : 'match-lobby-client'
      : isHosting ? 'online-warmup-host' : 'online-warmup-client';
  }

  const rawCtxInput =
    (activeTab as Layer1ContextVariation | undefined) ??
    styleOverrides?.previewContextMode ??
    appOverrides?.contextVariation ??
    appOverrides?.contextMode ??
    (derivedVariation !== 'freeplay' ? derivedVariation : storeMenuStyle.previewContextMode ?? 'freeplay');
  const ctxSpec = resolveLayer1ContextSpec(rawCtxInput);

  const handleResume = () => {
    if (appOverrides?.onResume) return appOverrides.onResume();
    if (onBack) return onBack();
    closeMenu();
  };

  const handleReturnToFreeplay = () => {
    if (appOverrides?.onReturnToFreeplay) return appOverrides.onReturnToFreeplay();
    if (onTabChange) return onTabChange('return-freeplay');
    useAppStore.getState().setMatchMode('freeplay');
    closeMenu();
    bridge?.onReturnToFreeplay?.();
  };

  const handleNavigatePlay = () => {
    if (appOverrides?.onNavigatePlay) return appOverrides.onNavigatePlay();
    if (onTabChange) return onTabChange('play');
    navigate('play');
  };

  const handleNavigateGarage = () => {
    if (appOverrides?.onNavigateGarage) return appOverrides.onNavigateGarage();
    if (onTabChange) return onTabChange('garage');
    navigate('garage');
  };

  const handleNavigateSettings = (targetTab?: string) => {
    if (appOverrides?.onNavigateSettings) return appOverrides.onNavigateSettings(targetTab);
    if (targetTab === 'display') useAppStore.getState().setHighlightSetting('menu-power-save');
    if (onTabChange) return onTabChange(targetTab ? `settings:${targetTab}` : 'settings');
    navigate('settings');
  };

  const handleCustomRowClick = () => {
    const actionType = ctxSpec.customActionRow?.actionType;
    if (actionType === 'manage-room') {
      if (appOverrides?.onNavigateManageRoom) return appOverrides.onNavigateManageRoom();
      if (onTabChange) return onTabChange('manage-room');
      navigate('manage-room');
    } else if (actionType === 'exp-multi-bots') {
      if (appOverrides?.onNavigateExpMultiBotsConfig) return appOverrides.onNavigateExpMultiBotsConfig();
      if (onTabChange) return onTabChange('exp-multi-bots');
      navigate('exp-multi-bots');
    } else {
      handleNavigatePlay();
    }
  };

  const handleRestartMatch = () => {
    if (appOverrides?.onRestartMatch) return appOverrides.onRestartMatch();
    if (onTabChange) return onTabChange('restart-match');
    bridge?.onRestartMatch?.();
  };

  const handleBottomRowClick = () => {
    const actionType = ctxSpec.bottomActionRow?.actionType;
    if (actionType === 'leave-room') {
      if (appOverrides?.onLeaveRoom) return appOverrides.onLeaveRoom();
      if (onTabChange) return onTabChange('leave-room');
      void bridge?.onLeaveOnlineServer?.();
      handleReturnToFreeplay();
    } else if (actionType === 'exit-edit-mode') {
      if (appOverrides?.onExitEditMode) return appOverrides.onExitEditMode();
      if (onTabChange) return onTabChange('exit-edit-mode');
      handleReturnToFreeplay();
    } else {
      handleReturnToFreeplay();
    }
  };

  const resolvedBottomAction: Layer1MainMenuBottomActionSpec | React.ReactNode | undefined =
    appOverrides?.extraBottomAction ??
    (ctxSpec.bottomActionRow
      ? {
          title: ctxSpec.bottomActionRow.title,
          subtitle: ctxSpec.bottomActionRow.subtitle,
          icon: <LogOut className={`h-5 w-5 ${ctxSpec.bottomActionRow.iconColorClass}`} />,
          variant: ctxSpec.bottomActionRow.variant,
          onClick: handleBottomRowClick,
        }
      : derivedVariation === 'freeplay' && hasFreeplaySubSceneOverride
      ? {
          title: 'Exit to Free Play',
          subtitle: 'Leave active arena preview and return to Free Play',
          variant: 'secondary',
          onClick: handleReturnToFreeplay,
        }
      : undefined);

  const powerSave =
    appOverrides?.menuPowerSave ?? storeMenuPowerSave ?? (appOverrides?.backgroundRenderPaused ? 'extreme' : '30');
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
    <PanelContainer isLight={isLight} sizing={sizing} className={`w-full shadow-2xl ${className}`}>
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
          isLight ? 'border-neutral-200/90 bg-neutral-50/70 text-neutral-900' : 'border-neutral-800/80 bg-neutral-900/60 text-white'
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

      <PanelContent
        scrollable={true}
        style={{
          paddingLeft: `${mergedStyle.contentPaddingXPx}px`,
          paddingRight: `${mergedStyle.contentPaddingXPx}px`,
          paddingTop: `${mergedStyle.contentPaddingYPx}px`,
          paddingBottom: `${mergedStyle.contentPaddingYPx}px`,
        }}
      >
        <MenuContainer ariaLabel="Main Game Menu" gapPx={mergedStyle.itemGapPx} paddingPx={mergedStyle.menuContainerPaddingPx}>
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
            onClick={handleResume}
            isLight={isLight}
          />

          {touchMode && (
            <div
              className={`p-3 rounded-xl border flex flex-col gap-2 font-mono ${
                isLight ? 'bg-neutral-100/90 border-neutral-300 text-neutral-800' : 'bg-neutral-900/80 border-neutral-700/80 text-neutral-200'
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
                {(['none', 'necto', 'nexto'] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleTouchInputAgentSelect(id)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                      touchInputAgent === id
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
          )}

          {mergedStyle.showDividers && <MenuDivider isLight={isLight} marginYPx={mergedStyle.dividerMarginYPx} />}

          {ctxSpec.customActionRow && (
            <MainMenuRow
              slotId={ctxSpec.customActionRow.slotId}
              icon={renderCustomRowIcon(ctxSpec.customActionRow.iconType, ctxSpec.customActionRow.iconColorClass)}
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

          {ctxSpec.showGarage && (
            <MainMenuRow
              slotId="garage"
              icon={<Wrench className="h-5 w-5" />}
              title="Garage"
              subtitle="Vehicle models, colours & player anthem"
              hasArrow
              styleVariant={activeStyleVariant}
              styleParams={mergedStyle}
              onClick={handleNavigateGarage}
              isLight={isLight}
            />
          )}

          {ctxSpec.showSettings && (
            <MainMenuRow
              slotId="settings"
              icon={<Settings className="h-5 w-5" />}
              title="Settings"
              subtitle="Gameplay, controls, video & sound"
              hasArrow
              styleVariant={activeStyleVariant}
              styleParams={mergedStyle}
              onClick={() => handleNavigateSettings()}
              isLight={isLight}
            />
          )}

          {ctxSpec.showRestartMatch && (
            <>
              {mergedStyle.showDividers && <MenuDivider isLight={isLight} marginYPx={mergedStyle.dividerMarginYPx} />}
              <MainMenuRow
                slotId="restart"
                icon={<RotateCcw className="h-5 w-5" />}
                title="Restart Match"
                subtitle="Reset score, clock and restart kickoff"
                variant="secondary"
                styleVariant={activeStyleVariant}
                styleParams={mergedStyle}
                onClick={handleRestartMatch}
                isLight={isLight}
              />
            </>
          )}

          {resolvedBottomAction &&
            (typeof resolvedBottomAction === 'object' && resolvedBottomAction !== null && 'title' in resolvedBottomAction ? (
              <>
                {mergedStyle.showDividers && <MenuDivider isLight={isLight} marginYPx={mergedStyle.dividerMarginYPx} />}
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
            isLight ? 'border-neutral-200/90 text-neutral-600 bg-neutral-50/90' : 'border-neutral-800/80 text-neutral-400 bg-neutral-900/90'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
            <span className="font-mono truncate">{powerLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => handleNavigateSettings('display')}
            className={`flex items-center gap-1 font-mono shrink-0 font-medium transition-colors cursor-pointer outline-none ${
              isLight ? 'text-neutral-500 hover:text-amber-600' : 'text-neutral-400 hover:text-amber-400'
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
