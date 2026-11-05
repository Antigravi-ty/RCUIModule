import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Download, FolderOpen, Search, Target } from 'lucide-react';
import { Badge } from '../../primitives/Badge';
import { UI_RADIUS } from '../../tokens/radius';
import { RANK_ORDER_MAP } from '../../config/temTrainingPackParser';
import type { StaticTrainingVariationConfig } from '../../config/staticTrainingVariationTypes';

export type StaticPackDownCounterOption = 1 | 2 | 3;

export type StaticPackSortOrder = 'updated' | 'rank' | 'date' | 'title';

export interface StaticTrainingPackSummary {
  uuid: string;
  title: string;
  description: string;
  originalDescription?: string;
  itemCount: number;
  createdAt?: number;
  updatedAt?: number | string;
  id?: string;
  code?: string;
  name?: string;
  creator?: string;
  shotCount?: number;
  tags?: string[];
  releaseYearMonth?: string;
  rankTier?: string;
  sourcePackType?: 'RCSPack' | 'RCSPackE' | 'RLRCSPack';
  recommendedVariation?: StaticTrainingVariationConfig;
  isBuiltIn?: boolean;
  isBuiltInDevPack?: boolean;
}

export interface StaticTrainingPackFolderListProps {
  isLight: boolean;
  packs: StaticTrainingPackSummary[];
  selectedUuid: string | null | undefined;
  onSelectPack: (uuid: string) => void;
  onHoverDesc: (desc: string | null) => void;
  onBatchExportFiltered?: (
    filteredPacks: StaticTrainingPackSummary[],
    folderLabel: string,
    editable: boolean
  ) => void;
}

const PRIMARY_FOLDER_FILTERS = [
  'All',
  'Kevpert',
  'Psyonix',
  'Psyonix 2024',
  'Psyonix 2023',
  'Psyonix 2022',
  'Progression',
  'Community',
  'Local',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'Champion',
  'Grand Champion',
  'Supersonic Legend',
];

export const StaticTrainingPackFolderList: React.FC<StaticTrainingPackFolderListProps> = React.memo(
  ({
    isLight,
    packs,
    selectedUuid,
    onSelectPack,
    onHoverDesc,
    onBatchExportFiltered,
  }) => {
    const [activeFolderTag, setActiveFolderTag] = useState<string>('All');
    const [sortOrder, setSortOrder] = useState<StaticPackSortOrder>('updated');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Gather all available tags dynamically while keeping primary folders ordered
    const availableFolders = useMemo(() => {
      const counts = new Map<string, number>();
      counts.set('All', packs.length);
      for (const p of packs) {
        const tagList = p.tags || [];
        for (const t of tagList) {
          counts.set(t, (counts.get(t) || 0) + 1);
        }
      }
      const ordered: Array<{ tag: string; count: number }> = [];
      for (const key of PRIMARY_FOLDER_FILTERS) {
        const c = counts.get(key);
        if (key === 'All' || (c && c > 0)) {
          ordered.push({ tag: key, count: c || 0 });
        }
      }
      for (const [tag, count] of counts.entries()) {
        if (!PRIMARY_FOLDER_FILTERS.includes(tag) && count > 0) {
          ordered.push({ tag, count });
        }
      }
      return ordered;
    }, [packs]);

    const filteredAndSortedPacks = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      const filtered = packs.filter((p) => {
        if (activeFolderTag !== 'All') {
          const tags = p.tags || [];
          if (!tags.includes(activeFolderTag)) return false;
        }
        if (q) {
          const hay = `${p.title} ${p.code || ''} ${p.creator || ''} ${p.description || ''} ${(
            p.tags || []
          ).join(' ')}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      return [...filtered].sort((a, b) => {
        if (sortOrder === 'rank') {
          const rA = RANK_ORDER_MAP[a.rankTier || ''] ?? 99;
          const rB = RANK_ORDER_MAP[b.rankTier || ''] ?? 99;
          if (rA !== rB) return rA - rB;
          return a.title.localeCompare(b.title);
        }
        if (sortOrder === 'date') {
          const ymA = a.releaseYearMonth || '';
          const ymB = b.releaseYearMonth || '';
          if (ymA !== ymB) return ymB.localeCompare(ymA);
          return Number(b.createdAt || 0) - Number(a.createdAt || 0);
        }
        if (sortOrder === 'title') {
          return a.title.localeCompare(b.title);
        }
        return Number(b.updatedAt || 0) - Number(a.updatedAt || 0);
      });
    }, [packs, activeFolderTag, sortOrder, searchQuery]);

    const cycleSortOrder = () => {
      const order: StaticPackSortOrder[] = ['updated', 'rank', 'date', 'title'];
      const next = order[(order.indexOf(sortOrder) + 1) % order.length];
      setSortOrder(next);
    };

    const sortLabel =
      sortOrder === 'rank'
        ? 'Rank'
        : sortOrder === 'date'
        ? 'Date'
        : sortOrder === 'title'
        ? 'A–Z'
        : 'Recent';

    return (
      <div
        className={`col-span-5 flex flex-col rounded-xl border overflow-hidden min-h-0 ${
          isLight
            ? 'bg-neutral-50/70 border-neutral-200/90'
            : 'bg-neutral-900/50 border-neutral-800'
        }`}
      >
        {/* Header Bar with Sort & Batch Export */}
        <div
          className={`px-2.5 py-1.5 border-b flex items-center justify-between gap-1 text-[10px] font-bold tracking-wider uppercase shrink-0 ${
            isLight
              ? 'border-neutral-200 text-neutral-600 bg-neutral-100/60'
              : 'border-neutral-800 text-neutral-300 bg-neutral-900/80'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <FolderOpen className="h-3.5 w-3.5 opacity-70 shrink-0" />
            <span className="truncate">
              {activeFolderTag} ({filteredAndSortedPacks.length})
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={cycleSortOrder}
              onMouseEnter={() =>
                onHoverDesc(
                  `Current sort: ${sortLabel}. Click to cycle Order by Recent / Rank / Date / Title.`
                )
              }
              onMouseLeave={() => onHoverDesc(null)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-mono cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              }`}
            >
              <ArrowUpDown className="h-2.5 w-2.5" />
              <span>{sortLabel}</span>
            </button>

            {onBatchExportFiltered && filteredAndSortedPacks.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onBatchExportFiltered(
                    filteredAndSortedPacks,
                    activeFolderTag === 'All' ? 'AllPacks' : activeFolderTag,
                    true
                  )
                }
                onMouseEnter={() =>
                  onHoverDesc(
                    `Batch export all ${filteredAndSortedPacks.length} packs in "${activeFolderTag}" folder as a .zip archive.`
                  )
                }
                onMouseLeave={() => onHoverDesc(null)}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-mono cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                    : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                }`}
              >
                <Download className="h-2.5 w-2.5" />
                <span>.ZIP</span>
              </button>
            )}
          </div>
        </div>

        {/* Folder Tag Pills & Quick Search */}
        <div
          className={`px-2 py-1.5 border-b flex flex-col gap-1.5 shrink-0 ${
            isLight ? 'border-neutral-200/80 bg-white/50' : 'border-neutral-800/80 bg-neutral-900/40'
          }`}
        >
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
            {availableFolders.map(({ tag, count }) => {
              const active = activeFolderTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveFolderTag(tag)}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                    active
                      ? isLight
                        ? 'bg-neutral-900 border-neutral-900 text-white'
                        : 'bg-cyan-400 border-cyan-300 text-neutral-950'
                      : isLight
                      ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                      : 'bg-neutral-800/90 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                  }`}
                >
                  {tag} <span className="opacity-65">({count})</span>
                </button>
              );
            })}
          </div>

          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] ${
              isLight
                ? 'bg-white border-neutral-300 text-neutral-800'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-200'
            }`}
          >
            <Search className="h-3 w-3 opacity-50 shrink-0" />
            <input
              type="text"
              placeholder="Filter by title, code, creator, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-[10px]"
            />
          </div>
        </div>

        {/* Pack Items List */}
        <div className="flex flex-col gap-1.5 p-2 overflow-y-auto grow min-h-0">
          {filteredAndSortedPacks.map((pack) => {
            const isSelected = pack.uuid === selectedUuid;
            const fKeyBadge = pack.recommendedVariation?.presetKey;
            return (
              <button
                key={pack.uuid}
                type="button"
                onClick={() => onSelectPack(pack.uuid)}
                onMouseEnter={() =>
                  onHoverDesc(
                    `${pack.title} — ${pack.itemCount} shots (${
                      pack.description || 'No description'
                    })`
                  )
                }
                onMouseLeave={() => onHoverDesc(null)}
                className={`flex flex-col gap-1 p-2 text-left transition-all border cursor-pointer ${UI_RADIUS.md} ${
                  isSelected
                    ? isLight
                      ? 'bg-white border-neutral-900 shadow-xs text-neutral-900'
                      : 'bg-neutral-800 border-neutral-200 shadow-sm text-white'
                    : isLight
                    ? 'bg-white/60 hover:bg-white border-neutral-200/80 text-neutral-800'
                    : 'bg-neutral-850/60 hover:bg-neutral-800/80 border-neutral-800 text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-bold truncate">{pack.title}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {fKeyBadge && fKeyBadge !== 'CUSTOM' && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold ${
                          isLight
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {fKeyBadge}
                      </span>
                    )}
                    <Badge
                      variant={isSelected ? 'default' : 'neutral'}
                      size="sm"
                      isLight={isLight}
                      className="text-[9px] shrink-0"
                    >
                      {pack.itemCount} {pack.itemCount === 1 ? 'Shot' : 'Shots'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] truncate ${
                      isLight ? 'text-neutral-500' : 'text-neutral-400'
                    }`}
                  >
                    {pack.description || 'No description'}
                  </span>
                  {pack.rankTier && (
                    <span className="text-[9px] font-mono opacity-65 shrink-0">
                      {pack.rankTier}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {filteredAndSortedPacks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center px-3 opacity-60">
              <Target className="h-6 w-6 mb-2" />
              <span className="text-xs font-medium">No Matching Training Packs</span>
              <span className="text-[10px] mt-0.5">
                Switch folder tag or import .Tem / .RCSPack / .zip
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);
StaticTrainingPackFolderList.displayName = 'StaticTrainingPackFolderList';
