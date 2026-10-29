import React from 'react';
import {
  Barrel,
  FileVideoCamera,
  Play,
  Stone,
  UsersRoundCollaboration,
} from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { MenuContainer } from '../layout/MenuContainer';
import { MainMenuRow } from '../layout/MainMenuRow';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import {
  useMainMenuStyleStore,
  type MainMenuItemSlotId,
} from '../stores/mainMenuStyleStore';

export type SelfTrainingModeId =
  | 'free-play'
  | 'static-training-pack'
  | 'dynamic-training-pack'
  | 'kickoff-training'
  | 'replay-viewer';

export interface SelfTrainingOption {
  id: SelfTrainingModeId;
  slotId: MainMenuItemSlotId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary';
  hasArrow?: boolean;
  disabled?: boolean;
}

export const SELF_TRAINING_OPTIONS: SelfTrainingOption[] = [
  {
    id: 'free-play',
    slotId: 'resume',
    title: 'Free Play',
    subtitle: 'Unlimited boost solo arena with instant ball reset & trajectory lines',
    icon: <Play className="h-5 w-5" />,
    variant: 'primary',
    hasArrow: false,
  },
  {
    id: 'static-training-pack',
    slotId: 'play',
    title: 'Static Training Pack',
    subtitle: 'Browse, import, and practice .RCSPack custom shot sequences',
    icon: <Stone className="h-5 w-5" />,
    hasArrow: true,
  },
  {
    id: 'dynamic-training-pack',
    slotId: 'garage',
    title: 'Dynamic Training Pack',
    subtitle: 'Adaptive multi-agent scenarios with reactive bot passes and defense',
    icon: <UsersRoundCollaboration className="h-5 w-5" />,
    hasArrow: false,
    disabled: true,
  },
  {
    id: 'kickoff-training',
    slotId: 'settings',
    title: 'Kickoff Training',
    subtitle: '5 regulation spawn slots with 120Hz rhythm highway & PPO mirror bot',
    icon: <Barrel className="h-5 w-5" />,
    hasArrow: true,
  },
  {
    id: 'replay-viewer',
    slotId: 'play',
    title: 'Replay Viewer',
    subtitle: 'Multi-track timeline scrubbing, POV switching & TAS take-over',
    icon: <FileVideoCamera className="h-5 w-5" />,
    hasArrow: true,
  },
];

export interface Layer3SelfTrainingRecipeProps {
  isLight?: boolean;
  onSelectMode?: (mode: SelfTrainingModeId) => void;
  onBack?: () => void;
  className?: string;
}

/**
 * [Recipe] Layer 3 Self-Training Hub
 * Vertically stacked menu rows matching Layer 1 Main Menu style:
 * 1. Free Play (`Play` right arrow icon)
 * 2. Static Training Pack (`Stone` / `stone`)
 * 3. Dynamic Training Pack (`UsersRoundCollaboration` / `users-round-collaboration`)
 * 4. Kickoff Training (`Barrel` / `barrel`)
 * 5. Replay Viewer (`FileVideoCamera` / `file-video-camera`)
 */
export const Layer3SelfTrainingRecipe: React.FC<Layer3SelfTrainingRecipeProps> = React.memo(({
  isLight = true,
  onSelectMode,
  onBack = () => {},
  className = '',
}) => {
  const sizing = useMenuLayoutStore((s) => s.panels['layer3-self-training']);
  const menuStyle = useMainMenuStyleStore();

  return (
    <PanelContainer
      isLight={isLight}
      sizing={sizing}
      className={`w-full select-none ${className}`}
    >
      <PanelHeader
        isLight={isLight}
        title="SELF-TRAINING"
        onBack={onBack}
      />

      <PanelContent
        scrollable={true}
        style={{
          paddingLeft: `${menuStyle.contentPaddingXPx}px`,
          paddingRight: `${menuStyle.contentPaddingXPx}px`,
          paddingTop: `${menuStyle.contentPaddingYPx}px`,
          paddingBottom: `${menuStyle.contentPaddingYPx}px`,
        }}
      >
        <MenuContainer
          ariaLabel="Self-Training Menu"
          gapPx={menuStyle.itemGapPx}
          paddingPx={menuStyle.menuContainerPaddingPx}
        >
          {SELF_TRAINING_OPTIONS.map((opt) => (
            <MainMenuRow
              key={opt.id}
              id={opt.id}
              slotId={opt.slotId}
              title={opt.title}
              subtitle={opt.subtitle}
              icon={opt.icon}
              variant={opt.variant ?? 'secondary'}
              hasArrow={opt.hasArrow}
              disabled={opt.disabled}
              isLight={isLight}
              styleVariant={menuStyle.variant}
              styleParams={menuStyle}
              onClick={() => {
                if (opt.disabled) return;
                onSelectMode?.(opt.id);
              }}
            />
          ))}
        </MenuContainer>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Select a solo training discipline or replay analysis tool."
      />
    </PanelContainer>
  );
});

Layer3SelfTrainingRecipe.displayName = 'Layer3SelfTrainingRecipe';
