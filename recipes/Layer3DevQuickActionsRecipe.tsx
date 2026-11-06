import React, { useEffect, useState } from 'react';
import { Box, CircleDot, Compass, Flame, Info, Tag, Users, Zap } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { SettingToggleRow } from '../compounds/SettingToggleRow';
import { FloatingWindowCard } from './settings/components/FloatingWindowCard';
import { NAME_TAG_TUNER_PRESET } from '../stores/devFloatingPresets';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import { useAppStore } from '../stores/appStore';
import {
  activateNameTagOffscreenForDeveloperMode,
  useNameTagTunerStore,
} from '../stores/nameTagTunerStore';
import type { NameTagBoostBorderAudience } from '../config/nameTagConfig';
import { DEFAULT_PANEL_SIZING, type PanelSizingConfig } from '../tokens/menuLayoutTokens';

export interface Layer3DevQuickActionsRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  sizing?: PanelSizingConfig;
}

/**
 * [Recipe] Layer 3 Developer — Developer Quick Actions (`zap`)
 * Quick-access toggles for developer features that auto-activate when Developer Mode is enabled
 * (such as the Off-Screen Edge Indicator) and can also be deployed to non-developer accounts
 * via Remote Profile Management (Cloud Profile Sync).
 */
export const Layer3DevQuickActionsRecipe: React.FC<Layer3DevQuickActionsRecipeProps> = ({
  isLight = false,
  onBack: propOnBack,
  sizing: propSizing,
}) => {
  const goBack = useAppStore((s) => s.goBack);
  const developerMode = useAppStore((s) => s.developerMode);
  const showAllCarHitboxes = useAppStore((s) => s.gameplay.showAllCarHitboxes ?? false);
  const updateGameplay = useAppStore((s) => s.updateGameplay);
  const { config, updateConfig } = useNameTagTunerStore();
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  useEffect(() => {
    if (developerMode) {
      activateNameTagOffscreenForDeveloperMode();
    }
  }, [developerMode]);

  const onBack = propOnBack ?? goBack;
  const storeSizing = useMenuLayoutStore(
    (s) =>
      s.panels?.['layer3-dev-quick-actions'] ??
      DEFAULT_PANEL_SIZING['layer3-dev-quick-actions']
  );
  const sizing = propSizing ?? storeSizing;
  const { rowGap } = useSettingActionRowStore();

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full">
      <PanelHeader title="DEVELOPER QUICK ACTIONS" onBack={onBack} isLight={isLight} />

      <PanelContent scrollable>
        <div
          data-layout="dev-quick-actions-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          {/* 1. Show All Car Hitboxes */}
          <SettingToggleRow
            icon={Box}
            title="Show All Car Hitboxes"
            description="Render wireframe physics collision boxes on all vehicles in the arena"
            checked={showAllCarHitboxes}
            onChange={(checked) => updateGameplay({ showAllCarHitboxes: checked })}
            hoverDescription="Show All Car Hitboxes: Override POV-only hitbox visibility and display physics collision boxes on every vehicle in the arena."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 2. On-Screen Circle Name Tag Mode (X/W/E · A/M/Z) */}
          <SettingToggleRow
            icon={CircleDot}
            title="On-Screen Circle Name Tag Mode (X/W/E · A/M/Z)"
            description="Replace horizontal name tag pills with fixed-size boost circles & 1-letter match slot codes"
            checked={config.cardDisplayMode === 'circle'}
            onChange={(checked) =>
              updateConfig({ cardDisplayMode: checked ? 'circle' : 'pill' })
            }
            hoverDescription="On-Screen Circle Name Tag Mode: Replaces all on-screen name cards with circular boost indicators and fixed match slot codes (Team 1: X, W, E · Team 2: A, M, Z)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 3. Off-Screen Indicator (Auto-activated in Developer Mode; deployable via Cloud Profile) */}
          <SettingToggleRow
            icon={Compass}
            iconName="compass"
            title="Off-Screen Indicator"
            description="Auto-enabled in Developer Mode · Bottom-up boost circle & directional arrow for off-screen cars (syncable via Cloud Profile)"
            checked={config.offscreenIndicatorEnabled}
            onChange={(checked) => updateConfig({ offscreenIndicatorEnabled: checked })}
            hoverDescription="Off-Screen Indicator: Automatically activated when Developer Mode is enabled. Toggle off at any time, or push to other users via Remote Profile Management."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 4. Off-Screen Target Audience */}
          <SettingSegmentedRow
            icon={Users}
            iconName="users"
            title="Off-Screen Target Audience"
            description="Teammates Only (default) · All Cars · Hidden"
            value={config.offscreenAudience}
            onChange={(val) =>
              updateConfig({ offscreenAudience: val as NameTagBoostBorderAudience })
            }
            options={[
              { value: 'teammates', label: 'Teammates' },
              { value: 'all', label: 'All Cars' },
              { value: 'none', label: 'Hidden' },
            ]}
            hoverDescription="Off-Screen Target Audience: Choose whether off-screen edge indicators track Teammates Only or All Cars."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 5. Off-Screen Aerial Climb Alert */}
          <SettingToggleRow
            icon={Flame}
            iconName="flame"
            title="Off-Screen Aerial Climb Alert"
            description="Display solid inward yellow alert ring on off-screen circle when a tracked car is climbing"
            checked={config.aerialClimbAlertEnabled}
            onChange={(checked) => updateConfig({ aerialClimbAlertEnabled: checked })}
            hoverDescription="Off-Screen Aerial Climb Alert: Highlights the off-screen boost circle when a tracked car is airborne and climbing."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 6. Quick Spawner for Multiplayer Name Tag Tuner */}
          <FloatingWindowCard
            preset={NAME_TAG_TUNER_PRESET}
            icon={Tag}
            iconColor="text-sky-400"
            badge="Calibrated · 5 Tabs"
            badgeClass="bg-sky-500/15 border-sky-500/30 text-sky-400"
            description="Open full Multiplayer Name Tag Tuner floating window to inspect or fine-tune pill, boost, off-screen ROI, and 3D scaling"
            hoverTooltip="Multiplayer Name Tag Tuner: Spawn floating window for full Name Tag & Off-Screen Indicator calibration."
            onHover={(desc) => setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Developer quick actions auto-activated in Developer Mode and deployable to remote profiles."
        hoveredDescription={hoveredDesc}
        icon={<Info className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
      />
    </PanelContainer>
  );
};
