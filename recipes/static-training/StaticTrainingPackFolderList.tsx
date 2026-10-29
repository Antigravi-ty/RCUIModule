import React from 'react';
import { FolderOpen, Target } from 'lucide-react';
import { Badge } from '../../primitives/Badge';
import { UI_RADIUS } from '../../tokens/radius';

export type StaticPackDownCounterOption = 1 | 2 | 3;

export interface StaticTrainingPackSummary {
  uuid: string;
  title: string;
  description: string;
  itemCount: number;
  createdAt?: number;
  updatedAt?: number | string;
  id?: string;
  code?: string;
  name?: string;
  creator?: string;
  shotCount?: number;
  tags?: string[];
  isBuiltIn?: boolean;
}

export interface StaticTrainingPackFolderListProps {
  isLight: boolean;
  packs: StaticTrainingPackSummary[];
  selectedUuid: string | null | undefined;
  onSelectPack: (uuid: string) => void;
  onHoverDesc: (desc: string | null) => void;
}

export const StaticTrainingPackFolderList: React.FC<StaticTrainingPackFolderListProps> = React.memo(
  ({ isLight, packs, selectedUuid, onSelectPack, onHoverDesc }) => {
    return (
      <div
        className={`col-span-5 flex flex-col rounded-xl border overflow-hidden min-h-0 ${
          isLight
            ? 'bg-neutral-50/70 border-neutral-200/90'
            : 'bg-neutral-900/50 border-neutral-800'
        }`}
      >
        <div
          className={`px-3 py-2 border-b flex items-center justify-between text-[11px] font-bold tracking-wider uppercase shrink-0 ${
            isLight
              ? 'border-neutral-200 text-neutral-500 bg-neutral-100/60'
              : 'border-neutral-800 text-neutral-400 bg-neutral-900/80'
          }`}
        >
          <span>Training Packs ({packs.length})</span>
          <FolderOpen className="h-3.5 w-3.5 opacity-60" />
        </div>

        <div className="flex flex-col gap-1.5 p-2 overflow-y-auto grow min-h-0">
          {packs.map((pack) => {
            const isSelected = pack.uuid === selectedUuid;
            return (
              <button
                key={pack.uuid}
                type="button"
                onClick={() => onSelectPack(pack.uuid)}
                onMouseEnter={() =>
                  onHoverDesc(
                    `${pack.title} — ${pack.itemCount} shots (${pack.description || 'No description'})`
                  )
                }
                onMouseLeave={() => onHoverDesc(null)}
                className={`flex flex-col gap-1 p-2.5 text-left transition-all border cursor-pointer ${UI_RADIUS.md} ${
                  isSelected
                    ? isLight
                      ? 'bg-white border-neutral-900 shadow-xs text-neutral-900'
                      : 'bg-neutral-800 border-neutral-200 shadow-sm text-white'
                    : isLight
                    ? 'bg-white/60 hover:bg-white border-neutral-200/80 text-neutral-800'
                    : 'bg-neutral-850/60 hover:bg-neutral-800/80 border-neutral-800 text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold truncate">{pack.title}</span>
                  <Badge
                    variant={isSelected ? 'default' : 'neutral'}
                    size="sm"
                    isLight={isLight}
                    className="text-[9px] shrink-0"
                  >
                    {pack.itemCount} {pack.itemCount === 1 ? 'Shot' : 'Shots'}
                  </Badge>
                </div>
                <span
                  className={`text-[10px] line-clamp-1 ${
                    isLight ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                >
                  {pack.description || 'No description'}
                </span>
              </button>
            );
          })}

          {packs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center px-3 opacity-60">
              <Target className="h-6 w-6 mb-2" />
              <span className="text-xs font-medium">No Training Packs</span>
              <span className="text-[10px] mt-0.5">Click Create Pack or Import .RCSPack</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);
StaticTrainingPackFolderList.displayName = 'StaticTrainingPackFolderList';
