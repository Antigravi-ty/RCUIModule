import React from 'react';
import { Play, Trophy, Car, Settings, Keyboard, LogOut, RotateCcw } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { MenuContainer, MenuDivider, MenuSectionTitle } from '../layout/MenuContainer';
import { MenuItem } from '../compounds/MenuItem';
import { Badge } from '../primitives/Badge';

export interface Layer1MatchPostRecipeProps {
  isLight?: boolean;
  onRematch?: () => void;
  onNavigateStats?: () => void;
  onNavigateGarage?: () => void;
  onNavigateSettings?: () => void;
  onNavigateKeybindings?: () => void;
  onExitLobby?: () => void;
}

/**
 * [Recipe] Layer 1 Match Post / Post-Match Pause Menu (Width: 420px).
 */
export const Layer1MatchPostRecipe: React.FC<Layer1MatchPostRecipeProps> = ({
  isLight = false,
  onRematch,
  onNavigateStats,
  onNavigateGarage,
  onNavigateSettings,
  onNavigateKeybindings,
  onExitLobby,
}) => {
  return (
    <PanelContainer isLight={isLight} className="w-full max-w-[420px]">
      <PanelHeader
        title="MATCH SUMMARY"
        subtitle="Ranked 3v3 • Champion Arena"
        badge={
          <Badge variant="success" size="sm" dot isLight={isLight}>
            VICTORY 4 - 2
          </Badge>
        }
        isLight={isLight}
      />

      <PanelContent scrollable={false}>
        <MenuContainer ariaLabel="Match Post Menu">
          <MenuItem
            icon={<Play className="h-5 w-5" />}
            title="Next Match"
            subtitle="Search for next competitive queue"
            shortcut="ENTER"
            variant="primary"
            autoFocus
            onClick={onRematch}
            isLight={isLight}
          />

          <MenuItem
            icon={<Trophy className="h-5 w-5" />}
            title="Match Stats & Telemetry"
            subtitle="Goals, saves, MVPs & player telemetry"
            hasArrow
            onClick={onNavigateStats}
            isLight={isLight}
          />

          <MenuDivider isLight={isLight} />
          <MenuSectionTitle isLight={isLight}>Customization & Setup</MenuSectionTitle>

          <MenuItem
            icon={<Car className="h-5 w-5" />}
            title="Garage Loadout"
            subtitle="Change chassis, decals, wheels & boost"
            hasArrow
            onClick={onNavigateGarage}
            isLight={isLight}
          />

          <MenuItem
            icon={<Settings className="h-5 w-5" />}
            title="Game Settings"
            subtitle="Audio equalizer, graphics & camera"
            hasArrow
            onClick={onNavigateSettings}
            isLight={isLight}
          />

          <MenuItem
            icon={<Keyboard className="h-5 w-5" />}
            title="Key Controls"
            subtitle="Keyboard bindings & gamepad sensitivity"
            hasArrow
            onClick={onNavigateKeybindings}
            isLight={isLight}
          />

          <MenuDivider isLight={isLight} />

          <MenuItem
            icon={<LogOut className="h-5 w-5" />}
            title="Return to Lobby"
            subtitle="Leave current server to arena lobby"
            variant="danger"
            onClick={onExitLobby}
            isLight={isLight}
          />
        </MenuContainer>
      </PanelContent>

      <PanelFooter hint="ESC / B to Close" isLight={isLight}>
        <span>XP Earned: +1,450 XP (Tier 48)</span>
      </PanelFooter>
    </PanelContainer>
  );
};
