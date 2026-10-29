import React, { useState } from 'react';
import { Bot, Server, Wifi, PencilRuler, BookOpen, SlidersHorizontal } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { PlayModeCard } from '../layout/PlayModeCard';
import { useMenuLayoutStore } from '../tokens/menuLayoutStore';
import {
  usePlayCardStyleStore,
  type PlayCardStyleParams,
  type PlayCardStyleVariant,
} from '../tokens/playCardStyleStore';

export interface Layer2PlayRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  onSelectMode?: (modeId: string) => void;
  onSelectExhibition?: () => void;
  onSelectHostMatch?: () => void;
  onSelectJoinRoom?: () => void;
  onSelectSelfTraining?: () => void;
  /** Optional explicit card style variant override (decoupled from store when provided) */
  cardVariant?: PlayCardStyleVariant;
  /** Optional explicit card style parameters override (decoupled from store when provided) */
  cardStyleParams?: Partial<PlayCardStyleParams>;
}

export interface PlayModeDef {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  category: 'Match' | 'Training';
  badge: string;
  disabled?: boolean;
}

export const PLAY_MODES: PlayModeDef[] = [
  // Row 1: Exhibition | Host Match | Join Room
  {
    id: 'exhibition',
    title: 'Exhibition',
    subtitle: '1v1 / 2v2 / 3v3 scrimmage against Nexto & Necto RLBot policies',
    description:
      'Exhibition Match: Configure Solo 1v1, Double 2v2, or Standard 3v3 against Nexto or Necto AI policies.',
    icon: <Bot className="h-5 w-5 text-rose-500" />,
    category: 'Match',
    badge: '1v1 · 2v2 · 3v3',
  },
  {
    id: 'host-match',
    title: 'Host Match',
    subtitle: 'Create an authoritative 120Hz online lobby with custom ruleset',
    description:
      'Host Match (Layer 3): Configure Session Mode, Team Format, Bot Fill Policy, and Regulation Duration.',
    icon: <Server className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />,
    category: 'Match',
    badge: 'Host Lobby',
  },
  {
    id: 'join-room',
    title: 'Join Room',
    subtitle: 'Connect to an existing peer-to-peer room code via WebRTC',
    description:
      'Join Room (Layer 3): Enter a 4-digit or custom room code, pick your entry role, and connect at 120Hz.',
    icon: <Wifi className="h-5 w-5 text-emerald-500" />,
    category: 'Match',
    badge: 'WebRTC Client',
  },
  // Row 2: Self-Training | Host Training | Custom
  {
    id: 'self-training',
    title: 'Self-Training',
    subtitle: 'Free Play sandbox, Static Training Packs, Kickoff AI & Replay Viewer',
    description:
      'Self-Training Hub (Layer 3): Choose between Free Play, Static Training Packs (.RCSPack), Kickoff Training, and Replay Viewer.',
    icon: <PencilRuler className="h-5 w-5 text-amber-500" />,
    category: 'Training',
    badge: 'Solo Hub',
  },
  {
    id: 'online-training',
    title: 'Host Training',
    subtitle: 'Shared warmup arena with party members & live collisions',
    description:
      'Host Training: Shared multiplayer free play arena without regulation timer.',
    icon: <BookOpen className="h-5 w-5 text-sky-500" />,
    category: 'Training',
    badge: 'Coming Soon',
    disabled: true,
  },
  {
    id: 'advanced',
    title: 'Custom',
    subtitle: 'Experimental Multi-Bots (up to 3v3), mutators & physics sandboxes',
    description:
      'Custom Mode: Configure up to 3v3 Experimental Multi-Bots, custom mutators, and simulation speed.',
    icon: <SlidersHorizontal className="h-5 w-5 text-purple-500" />,
    category: 'Training',
    badge: 'Coming Soon',
    disabled: true,
  },
];

/**
 * [Recipe] Layer 2 Play / Mode Selection Menu
 * 2x3 Grid with unified Neutral + Warm Amber design language.
 * Row 1: Exhibition | Host Match | Join Room (Separate dedicated Layer 3 pages!)
 * Row 2: Self-Training | Host-Training | Advanced
 */
export const Layer2PlayRecipe: React.FC<Layer2PlayRecipeProps> = ({
  isLight = false,
  onBack = () => {},
  onSelectMode,
  onSelectExhibition,
  onSelectHostMatch,
  onSelectJoinRoom,
  onSelectSelfTraining,
  cardVariant,
  cardStyleParams,
}) => {
  const { panels } = useMenuLayoutStore();
  const sizing = panels['layer2-play'];
  const storeCardStyle = usePlayCardStyleStore();
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const mergedCardParams: PlayCardStyleParams = {
    ...storeCardStyle,
    ...(cardStyleParams || {}),
  };
  const activeVariant: PlayCardStyleVariant =
    cardVariant ?? cardStyleParams?.variant ?? storeCardStyle.variant;

  const handleCardClick = (modeId: string) => {
    if (modeId === 'exhibition' && onSelectExhibition) {
      onSelectExhibition();
      return;
    }
    if (modeId === 'host-match' && onSelectHostMatch) {
      onSelectHostMatch();
      return;
    }
    if (modeId === 'join-room' && onSelectJoinRoom) {
      onSelectJoinRoom();
      return;
    }
    if (modeId === 'self-training' && onSelectSelfTraining) {
      onSelectSelfTraining();
      return;
    }
    onSelectMode?.(modeId);
  };

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full">
      <PanelHeader
        title="PLAY"
        onBack={onBack}
        isLight={isLight}
      />

      <PanelContent scrollable>
        <div
          className="grid grid-cols-1 md:grid-cols-3 w-full"
          style={{ gap: `${mergedCardParams.gridGapPx}px` }}
        >
          {PLAY_MODES.map((mode) => (
            <PlayModeCard
              key={mode.id}
              id={mode.id}
              title={mode.title}
              subtitle={mode.subtitle}
              badge={mode.badge}
              badgeVariant={mode.category === 'Match' ? 'primary' : 'warning'}
              icon={mode.icon}
              disabled={mode.disabled}
              isLight={isLight}
              variant={activeVariant}
              styleParams={mergedCardParams}
              onClick={handleCardClick}
              onMouseEnter={() => setHoveredDesc(mode.description)}
              onMouseLeave={() => setHoveredDesc(null)}
            />
          ))}
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Select game mode, online host/join lobby, or training discipline."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
};

