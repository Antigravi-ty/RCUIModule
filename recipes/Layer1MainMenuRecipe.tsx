import React, { useState } from 'react';
import {
  Play, Gamepad2, Wrench, Settings, ArrowUpRight, RotateCcw,
  HouseCog, UserRoundCog, Info, LogOut, Bot,
} from 'lucide-react';
import type { StandardSurfaceProps, SurfaceMeta } from '../manifest/surfaceMetaTypes';
import { PanelContainer, PanelContent } from '../layout/Panel';
import { MainMenuRow } from '../layout/MainMenuRow';
import {
  MenuContainer,
  MenuDivider,
  Layer1MainMenuHeader,
  Layer1MainMenuFooter,
  Layer1TouchAgentSelector,
} from '../layout/MenuContainer';
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
  LAYER1_SURFACE_VARIANTS,
  deriveLayer1ContextVariation,
  resolveLayer1ContextSpec,
  resolveLayer1PowerSaveStatus,
  type Layer1ContextVariation,
  type Layer1CustomRowIconType,
  type Layer1MainMenuBottomActionSpec,
  type Layer1ScopedAppOverrides,
  type TouchInputAgentOption,
} from './layer1MenuContextSpecs';

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
  const {
    matchMode, onlineSession, touchMode, touchHeadlessMode,
    touchInputAgent: storeTouchInputAgent, setTouchInputAgent,
    graphics, navigate, closeMenu, bridge,
  } = useScopedStore('appStore', useAppStore);
  const appOverrides = useStoreSnapshotOverride<Layer1ScopedAppOverrides<PanelSizingConfig>>('appStore');

  const isExhibitionMode = useScopedStore('experimentalMultiBotsStore', useExperimentalMultiBotsStore, (s) => s.isExhibitionMode);
  const replayViewerHasLoaded = useScopedStore('replayViewerStore', useReplayViewerStore, (s) =>
    Boolean((s.loadedFileName && s.totalFrames > 0) || s.viewerState !== 'idle')
  );
  const isNameTagTunerArenaActive = useScopedStore('nameTagTunerStore', useNameTagTunerStore, (s) => s.isTunerArenaActive);
  const rewinderState = useScopedStore('rewinderStore', useRewinderStore, (s) => s.rewinderState);
  const staticTrainingSessionMode = useScopedStore('staticTrainingPackStore', useStaticTrainingPackStore, (s) => s.sessionMode);
  const { metrics: netDiagMetrics } = useNetworkDiagnosticsData();

  const storeSizing = useScopedStore('menuLayoutStore', useMenuLayoutStore, (s) => s.panels?.['layer1-main'] ?? DEFAULT_PANEL_SIZING['layer1-main']);
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

  const activeDirectorSession = getActiveReplayTimelineController()?.sessionState;
  const isDirectorPreviewActive = Boolean(
    activeDirectorSession?.isActive && (activeDirectorSession?.isImportedPreview || activeDirectorSession?.isPersistent)
  );
  const isRewinderBlocking =
    rewinderState === 'paused-scrub' || rewinderState === 'rewinding' ||
    rewinderState === 'forwarding' || rewinderState === 'preroll-countdown';
  const hasFreeplaySubSceneOverride = Boolean(
    isNameTagTunerArenaActive || isDirectorPreviewActive || isRewinderBlocking || netDiagMetrics?.zeroGFleetEnabled
  );

  const derivedVariation = deriveLayer1ContextVariation({
    matchMode,
    isHosting: Boolean(onlineSession?.isHosting),
    isOnlineMatchRoom: onlineSession?.roomType === 'match',
    hasActiveOnlineRoom: matchMode === 'online-warmup' || Boolean(onlineSession?.roomId),
    isExhibitionMode: Boolean(isExhibitionMode),
    replayViewerHasLoaded: Boolean(replayViewerHasLoaded),
    staticTrainingSessionMode,
    hasExtraBottomAction: Boolean(appOverrides?.extraBottomAction),
  });

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

  const handleNavigateRoute = (route: 'play' | 'garage', overrideFn?: () => void) => {
    if (overrideFn) return overrideFn();
    if (onTabChange) return onTabChange(route);
    navigate(route);
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
      return onTabChange ? onTabChange('manage-room') : navigate('manage-room');
    }
    if (actionType === 'exp-multi-bots') {
      if (appOverrides?.onNavigateExpMultiBotsConfig) return appOverrides.onNavigateExpMultiBotsConfig();
      return onTabChange ? onTabChange('exp-multi-bots') : navigate('exp-multi-bots');
    }
    handleNavigateRoute('play', appOverrides?.onNavigatePlay);
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
    } else if (actionType === 'exit-edit-mode') {
      if (appOverrides?.onExitEditMode) return appOverrides.onExitEditMode();
      if (onTabChange) return onTabChange('exit-edit-mode');
    }
    handleReturnToFreeplay();
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
    appOverrides?.menuPowerSave ?? graphics?.menuPowerSave ?? (appOverrides?.backgroundRenderPaused ? 'extreme' : '30');
  const { dotColor, powerLabel } = resolveLayer1PowerSaveStatus(powerSave);
  const resolvedHeaderTypography = resolveMainMenuTitleTypography(
    mergedStyle.headerFontFamily,
    mergedStyle.headerFontWeight,
    storeMenuStyle.platformPreviewMode
  );

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className={`w-full shadow-2xl ${className}`}>
      <Layer1MainMenuHeader
        title={ctxSpec.headerTitle}
        isLight={isLight}
        headerPaddingXPx={mergedStyle.headerPaddingXPx}
        headerPaddingTopPx={mergedStyle.headerPaddingTopPx}
        headerPaddingBottomPx={mergedStyle.headerPaddingBottomPx}
        fontFamily={resolvedHeaderTypography.fontFamily}
        fontSizePx={mergedStyle.headerFontSizePx}
        fontWeight={resolvedHeaderTypography.fontWeight}
        letterSpacingEm={mergedStyle.headerLetterSpacingEm}
      />

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
            <Layer1TouchAgentSelector
              isLight={isLight}
              touchHeadlessMode={touchHeadlessMode}
              selectedAgent={touchInputAgent}
              onSelectAgent={handleTouchInputAgentSelect}
              botIcon={<Bot className="h-3.5 w-3.5" />}
            />
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
              onClick={() => handleNavigateRoute('garage', appOverrides?.onNavigateGarage)}
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
        <Layer1MainMenuFooter
          isLight={isLight}
          footerPaddingXPx={mergedStyle.footerPaddingXPx}
          footerPaddingYPx={mergedStyle.footerPaddingYPx}
          footerFontSizePx={mergedStyle.footerFontSizePx}
          dotColor={dotColor}
          powerLabel={powerLabel}
          onJumpToPowerSave={() => handleNavigateSettings('display')}
          actionIcon={<ArrowUpRight className="h-3 w-3 stroke-[2.5]" />}
        />
      )}
    </PanelContainer>
  );
};
