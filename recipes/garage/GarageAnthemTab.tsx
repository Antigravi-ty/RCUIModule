import React from 'react';
import { Check, Music, Shuffle, Volume2 } from 'lucide-react';
import { Badge } from '../../primitives/Badge';
import { UnderConstructionPlaceholder } from '../../primitives/UnderConstructionPlaceholder';
import { ANTHEMS } from './garageConstants';

export interface GarageAnthemTabProps {
  selectedAnthem: string;
  onSelectAnthem: (anthemId: string) => void;
  /** Whether goal anthem audio assets are available. When false, renders Under Development placeholder. */
  anthemAvailable?: boolean;
  onHoverDesc?: (desc: string | null) => void;
  isLight?: boolean;
}

export const GarageAnthemTab: React.FC<GarageAnthemTabProps> = ({
  selectedAnthem,
  onSelectAnthem,
  anthemAvailable = false,
  onHoverDesc,
  isLight = false,
}) => {
  if (!anthemAvailable) {
    return (
      <UnderConstructionPlaceholder
        title="Player Goal Anthem Under Development"
        description="Goal celebration anthems, MVP audio tracks, and custom soundtrack packs are currently under development."
        badge="UNDER DEVELOPMENT"
        icon={<Music className="h-5 w-5 stroke-[2]" />}
        isLight={isLight}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${isLight ? 'text-neutral-700' : 'text-neutral-300'}`}>
          Player Goal Anthem (Goal & MVP Celebrations)
        </span>
        <Badge variant="primary" size="sm" isLight={isLight}>
          Audio Preview Ready
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        {ANTHEMS.map((item) => {
          const isSelected = selectedAnthem === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectAnthem(item.id)}
              onMouseEnter={() =>
                onHoverDesc?.(`Goal Anthem: ${item.title} (${item.artist} · ${item.duration}).`)
              }
              onMouseLeave={() => onHoverDesc?.(null)}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? isLight
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/40 text-neutral-900 shadow-xs'
                    : 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/50 text-white shadow-md'
                  : isLight
                  ? 'bg-neutral-50 hover:bg-white border-neutral-200 text-neutral-800'
                  : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700/80 text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${
                  isSelected ? 'bg-amber-500 text-white border-amber-500' : isLight ? 'bg-white border-neutral-200' : 'bg-neutral-900 border-neutral-700'
                }`}>
                  {item.id === 'random' ? <Shuffle className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs">{item.title}</span>
                  <span className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    {item.artist}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge size="sm" variant={isSelected ? 'amber' : 'neutral'} isLight={isLight}>
                  {item.tag}
                </Badge>
                <span className="font-mono text-[11px] opacity-70">{item.duration}</span>
                {isSelected && <Check className="h-4 w-4 text-amber-500 ml-1 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
