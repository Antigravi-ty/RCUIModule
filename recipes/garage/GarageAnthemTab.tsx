import React, { useState, useMemo, useEffect } from 'react';
import { Check, Music, Volume2, VolumeX, Shuffle } from 'lucide-react';
import { Badge } from '../../primitives/Badge';
import { UnderConstructionPlaceholder } from '../../primitives/UnderConstructionPlaceholder';
import { ANTHEMS, ANTHEM_CATEGORIES } from './garageConstants';
import { useSpatialAudioStore } from '../../stores/spatialAudioStore';

export interface GarageAnthemTabProps {
  selectedAnthem: string;
  onSelectAnthem: (anthemId: string) => void;
  /** Whether goal anthem audio assets are available. Defaults to true now that Anthems M4A pack is bundled. */
  anthemAvailable?: boolean;
  onHoverDesc?: (desc: string | null) => void;
  isLight?: boolean;
}

export const GarageAnthemTab: React.FC<GarageAnthemTabProps> = ({
  selectedAnthem,
  onSelectAnthem,
  anthemAvailable = true,
  onHoverDesc,
  isLight = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const previewingAnthemId = useSpatialAudioStore((s) => s.previewingAnthemId);
  const togglePreviewAnthem = useSpatialAudioStore((s) => s.togglePreviewAnthem);
  const stopPreviewAnthem = useSpatialAudioStore((s) => s.stopPreviewAnthem);

  useEffect(() => {
    return () => {
      stopPreviewAnthem();
    };
  }, [stopPreviewAnthem]);

  const filteredAnthems = useMemo(() => {
    if (selectedCategory === 'all') {
      return ANTHEMS;
    }
    return ANTHEMS.filter(
      (item) => item.id === 'none' || item.category === selectedCategory
    );
  }, [selectedCategory]);

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

  const activeAnthemObj =
    ANTHEMS.find((a) => a.id === selectedAnthem) ?? ANTHEMS[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Header status bar */}
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${isLight ? 'text-neutral-700' : 'text-neutral-300'}`}>
          Player Goal Anthem ({activeAnthemObj?.title ?? 'No Anthem'})
        </span>
        <div className="flex items-center gap-1.5">
          {previewingAnthemId && (
            <Badge variant="amber" size="sm" isLight={isLight}>
              Previewing Audio
            </Badge>
          )}
          <Badge variant="primary" size="sm" isLight={isLight}>
            58 Stingers Ready
          </Badge>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
        {ANTHEM_CATEGORIES.map((cat) => {
          const isCatActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 border ${
                isCatActive
                  ? isLight
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 border-neutral-200'
                  : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-400 border-neutral-700/70'
              }`}
              title={cat.arenaName}
            >
              {cat.id === 'all' ? 'All (58)' : cat.label}
            </button>
          );
        })}
      </div>

      {/* Anthem Rows */}
      <div className="flex flex-col gap-1.5">
        {filteredAnthems.map((item) => {
          const isSelected = selectedAnthem === item.id;
          const isNone = item.id === 'none';
          const isRandom = item.id === 'random';
          const isPreviewing = !isNone && previewingAnthemId === item.id;

          return (
            <div
              key={item.id}
              onMouseEnter={() =>
                onHoverDesc?.(
                  isNone
                    ? 'No Anthem (Muted): Disable Goal Replay player anthem playback.'
                    : `Click speaker icon to ${
                        isPreviewing ? 'stop previewing' : 'preview'
                      } "${item.title}". Click name to select as your Goal Replay Anthem.`
                )
              }
              onMouseLeave={() => onHoverDesc?.(null)}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isSelected
                  ? isLight
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/40 text-neutral-900 shadow-xs'
                    : 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/50 text-white shadow-md'
                  : isLight
                  ? 'bg-neutral-50 hover:bg-white border-neutral-200 text-neutral-800'
                  : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700/80 text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Speaker Preview Toggle Button (or Muted icon for No Anthem) */}
                {isNone ? (
                  <button
                    type="button"
                    onClick={() => {
                      stopPreviewAnthem();
                      onSelectAnthem(item.id);
                    }}
                    aria-label="No Anthem (Muted)"
                    title="No Anthem (Muted)"
                    className={`p-2 rounded-lg border transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-neutral-700 text-white border-neutral-600'
                        : isLight
                        ? 'bg-white border-neutral-200 text-neutral-400 hover:text-neutral-700'
                        : 'bg-neutral-900 border-neutral-700 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <VolumeX className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePreviewAnthem(item.id);
                    }}
                    aria-label={
                      isPreviewing ? `Stop previewing ${item.title}` : `Preview ${item.title}`
                    }
                    title={isPreviewing ? 'Click to stop preview' : 'Click to preview anthem'}
                    data-preview-active={isPreviewing ? 'true' : 'false'}
                    className={`p-2 rounded-lg border transition-all cursor-pointer shrink-0 ${
                      isPreviewing
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 ring-2 ring-amber-400/50 shadow-sm'
                        : isLight
                        ? 'bg-white hover:bg-amber-50 border-neutral-200 hover:border-amber-400 text-neutral-600 hover:text-amber-600'
                        : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 hover:border-amber-500/60 text-neutral-400 hover:text-amber-400'
                    }`}
                  >
                    <Volume2
                      className={`h-4 w-4 transition-transform ${
                        isPreviewing ? 'scale-110 animate-pulse' : ''
                      }`}
                    />
                  </button>
                )}

                {/* Clickable Name / Metadata Region to Select Anthem */}
                <button
                  type="button"
                  onClick={() => {
                    if (isNone) {
                      stopPreviewAnthem();
                    }
                    onSelectAnthem(item.id);
                  }}
                  className="flex items-center justify-between flex-1 min-w-0 text-left cursor-pointer py-0.5"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs truncate">{item.title}</span>
                      {isRandom && (
                        <Shuffle className="h-3 w-3 text-amber-400 shrink-0" />
                      )}
                      {isPreviewing && (
                        <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          Playing
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] truncate ${
                        isLight ? 'text-neutral-500' : 'text-neutral-400'
                      }`}
                    >
                      {item.artist}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      size="sm"
                      variant={isSelected ? 'amber' : 'neutral'}
                      isLight={isLight}
                    >
                      {item.tag}
                    </Badge>
                    <span className="font-mono text-[11px] opacity-70 w-10 text-right">
                      {item.duration}
                    </span>
                    <div className="w-4 flex items-center justify-center">
                      {isSelected && (
                        <Check className="h-4 w-4 text-amber-500 stroke-[3]" />
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
