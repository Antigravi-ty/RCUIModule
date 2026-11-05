import React, { useMemo, useState } from 'react';
import type { StaticTrainingVariationConfig } from '../../config/staticTrainingVariationTypes';

export type StaticPackDownCounterOption = 1 | 2 | 3;

export interface StaticTrainingPackSummary {
  uuid: string;
  id?: string;
  title: string;
  name?: string;
  description: string;
  itemCount: number;
  shotCount?: number;
  createdAt?: number;
  updatedAt?: number;
  tags?: string[];
  code?: string;
  creatorName?: string;
  sourcePackType?: 'RCSPack' | 'RCSPackE' | 'RLRCSPack';
  recommendedVariation?: StaticTrainingVariationConfig;
}

export interface StaticTrainingPackFolderListProps {
  isLight: boolean;
  packs: StaticTrainingPackSummary[];
  selectedUuid?: string | null;
  onSelectPack: (uuid: string) => void;
  onHoverDesc: (desc: string | null) => void;
  onBatchExportFiltered?: (
    packs: StaticTrainingPackSummary[],
    folderLabel: string,
    editable: boolean
  ) => void;
}

type TopCategoryFilter = 'All' | 'Kevpert' | 'Psyonix' | 'Rank' | 'Others' | 'Native';

const PSYONIX_YEARS = ['2024', '2023', '2022'] as const;

const PSYONIX_MONTH_DEFINITIONS: ReadonlyArray<{
  mm: string;
  shortLabel: string;
}> = [
  { mm: '01', shortLabel: 'Jan' },
  { mm: '02', shortLabel: 'Feb' },
  { mm: '03', shortLabel: 'Mar' },
  { mm: '04', shortLabel: 'Apr' },
  { mm: '05', shortLabel: 'May' },
  { mm: '06', shortLabel: 'June' },
  { mm: '07', shortLabel: 'July' },
  { mm: '08', shortLabel: 'Aug' },
  { mm: '09', shortLabel: 'Sept' },
  { mm: '10', shortLabel: 'Oct' },
  { mm: '11', shortLabel: 'Nov' },
  { mm: '12', shortLabel: 'Dec' },
];

const RANK_SUBFOLDERS = [
  'Progression',
  'SSL',
  'GC',
  'Champion',
  'Diamond',
  'Platinum',
  'Gold',
  'Silver',
  'Bronze',
] as const;

function hasTagCaseInsensitive(tags: string[] | undefined, target: string): boolean {
  if (!tags || tags.length === 0) return false;
  const lower = target.toLowerCase();
  return tags.some((t) => t.toLowerCase() === lower);
}

function isNativePack(pack: StaticTrainingPackSummary): boolean {
  if (hasTagCaseInsensitive(pack.tags, 'Native') || hasTagCaseInsensitive(pack.tags, 'Local')) {
    return true;
  }
  return Boolean(pack.sourcePackType && pack.sourcePackType !== 'RLRCSPack');
}

function isKevpertPack(pack: StaticTrainingPackSummary): boolean {
  return (
    hasTagCaseInsensitive(pack.tags, 'Kevpert') ||
    Boolean(pack.creatorName && /kevpert/i.test(pack.creatorName)) ||
    /^kevpert\b/i.test(pack.title)
  );
}

function isPsyonixPack(pack: StaticTrainingPackSummary): boolean {
  return (
    hasTagCaseInsensitive(pack.tags, 'Psyonix') ||
    Boolean(pack.creatorName && /psyonix/i.test(pack.creatorName)) ||
    /^psyonix\b/i.test(pack.title)
  );
}

function isOthersPack(pack: StaticTrainingPackSummary): boolean {
  if (isNativePack(pack)) return false;
  if (isKevpertPack(pack) || isPsyonixPack(pack)) return false;
  return true;
}

function hasAnyRankTag(pack: StaticTrainingPackSummary): boolean {
  return RANK_SUBFOLDERS.some((rank) => hasTagCaseInsensitive(pack.tags, rank));
}

export const StaticTrainingPackFolderList: React.FC<StaticTrainingPackFolderListProps> = ({
  isLight,
  packs,
  selectedUuid,
  onSelectPack,
  onHoverDesc,
  onBatchExportFiltered,
}) => {
  const [topCategory, setTopCategory] = useState<TopCategoryFilter>('All');
  const [selectedPsyonixYear, setSelectedPsyonixYear] = useState<string>('ALL');
  const [selectedPsyonixYearMonth, setSelectedPsyonixYearMonth] = useState<string>('ALL');
  const [selectedRank, setSelectedRank] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Top-level counts
  const categoryCounts = useMemo(() => {
    const counts: Record<TopCategoryFilter, number> = {
      All: packs.length,
      Kevpert: 0,
      Psyonix: 0,
      Rank: 0,
      Others: 0,
      Native: 0,
    };
    for (const p of packs) {
      if (isKevpertPack(p)) counts.Kevpert++;
      if (isPsyonixPack(p)) counts.Psyonix++;
      if (hasAnyRankTag(p)) counts.Rank++;
      if (isOthersPack(p)) counts.Others++;
      if (isNativePack(p)) counts.Native++;
    }
    return counts;
  }, [packs]);

  // Available Psyonix years and months within the selected year
  const psyonixYearCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const yr of PSYONIX_YEARS) map.set(yr, 0);
    for (const p of packs) {
      if (!isPsyonixPack(p)) continue;
      for (const yr of PSYONIX_YEARS) {
        if (hasTagCaseInsensitive(p.tags, yr)) {
          map.set(yr, (map.get(yr) || 0) + 1);
        }
      }
    }
    return map;
  }, [packs]);

  const psyonixMonthsForSelectedYear = useMemo(() => {
    if (selectedPsyonixYear === 'ALL') return [];
    const results: Array<{ ymTag: string; shortLabel: string; count: number }> = [];
    for (const def of PSYONIX_MONTH_DEFINITIONS) {
      const ymTag = `${selectedPsyonixYear}-${def.mm}`;
      let count = 0;
      for (const p of packs) {
        if (!isPsyonixPack(p)) continue;
        if (hasTagCaseInsensitive(p.tags, ymTag)) {
          count++;
        }
      }
      if (count > 0) {
        results.push({ ymTag, shortLabel: def.shortLabel, count });
      }
    }
    return results;
  }, [packs, selectedPsyonixYear]);

  // Rank counts
  const rankCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of RANK_SUBFOLDERS) map.set(r, 0);
    for (const p of packs) {
      for (const r of RANK_SUBFOLDERS) {
        if (hasTagCaseInsensitive(p.tags, r)) {
          map.set(r, (map.get(r) || 0) + 1);
        }
      }
    }
    return map;
  }, [packs]);

  // Filtered packs
  const filteredPacks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return packs.filter((p) => {
      if (topCategory === 'Kevpert' && !isKevpertPack(p)) return false;
      if (topCategory === 'Psyonix') {
        if (!isPsyonixPack(p)) return false;
        if (selectedPsyonixYear !== 'ALL' && !hasTagCaseInsensitive(p.tags, selectedPsyonixYear)) {
          return false;
        }
        if (
          selectedPsyonixYearMonth !== 'ALL' &&
          !hasTagCaseInsensitive(p.tags, selectedPsyonixYearMonth)
        ) {
          return false;
        }
      }
      if (topCategory === 'Rank') {
        if (selectedRank === 'ALL') {
          if (!hasAnyRankTag(p)) return false;
        } else if (!hasTagCaseInsensitive(p.tags, selectedRank)) {
          return false;
        }
      }
      if (topCategory === 'Others' && !isOthersPack(p)) return false;
      if (topCategory === 'Native' && !isNativePack(p)) return false;

      if (q) {
        const hay = [
          p.title,
          p.description,
          p.code || '',
          p.creatorName || '',
          ...(p.tags || []),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    packs,
    topCategory,
    selectedPsyonixYear,
    selectedPsyonixYearMonth,
    selectedRank,
    searchQuery,
  ]);

  const handleSelectTopCategory = (cat: TopCategoryFilter) => {
    setTopCategory(cat);
    if (cat !== 'Psyonix') {
      setSelectedPsyonixYear('ALL');
      setSelectedPsyonixYearMonth('ALL');
    }
    if (cat !== 'Rank') {
      setSelectedRank('ALL');
    }
  };

  const handleSelectPsyonixYear = (yr: string) => {
    setSelectedPsyonixYear(yr);
    setSelectedPsyonixYearMonth('ALL');
  };

  const activeFilterSummaryLabel = useMemo(() => {
    if (topCategory === 'Psyonix') {
      if (selectedPsyonixYearMonth !== 'ALL') return `Psyonix-${selectedPsyonixYearMonth}`;
      if (selectedPsyonixYear !== 'ALL') return `Psyonix-${selectedPsyonixYear}`;
      return 'Psyonix';
    }
    if (topCategory === 'Rank') {
      return selectedRank === 'ALL' ? 'Rank' : `Rank-${selectedRank}`;
    }
    return topCategory;
  }, [topCategory, selectedPsyonixYear, selectedPsyonixYearMonth, selectedRank]);

  const topCategoriesToShow: TopCategoryFilter[] = useMemo(() => {
    const base: TopCategoryFilter[] = ['All', 'Kevpert', 'Psyonix', 'Rank', 'Others'];
    if (categoryCounts.Native > 0) {
      base.push('Native');
    }
    return base;
  }, [categoryCounts.Native]);

  return (
    <div
      className={`col-span-6 flex flex-col rounded-xl border p-2.5 overflow-hidden ${
        isLight ? 'bg-slate-900/[0.02] border-slate-900/10' : 'bg-white/[0.02] border-white/10'
      }`}
    >
      {/* Search + Count Header */}
      <div className="flex items-center justify-between gap-2 mb-2 px-0.5 shrink-0">
        <span
          className={`text-[10px] font-bold tracking-wider uppercase shrink-0 ${
            isLight ? 'text-slate-500' : 'text-white/50'
          }`}
        >
          PACKS ({filteredPacks.length}/{packs.length})
        </span>
        <div className="flex items-center gap-1.5 flex-1 max-w-[230px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter title, code, tag..."
            className={`w-full px-2 py-0.5 rounded text-[10px] border outline-none transition-all ${
              isLight
                ? 'bg-white border-slate-900/15 text-slate-800 placeholder:text-slate-400 focus:border-sky-500/60'
                : 'bg-black/30 border-white/15 text-white placeholder:text-white/30 focus:border-cyan-400/60'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                isLight
                  ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              ×
            </button>
          )}
        </div>
        {onBatchExportFiltered && filteredPacks.length > 0 && (
          <button
            type="button"
            onClick={() => onBatchExportFiltered(filteredPacks, activeFilterSummaryLabel, true)}
            onMouseEnter={() =>
              onHoverDesc(
                `Batch export all ${filteredPacks.length} packs in the current "${activeFilterSummaryLabel}" view as a single JSON bundle.`
              )
            }
            onMouseLeave={() => onHoverDesc(null)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border transition-all shrink-0 ${
              isLight
                ? 'bg-emerald-500/10 border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/20'
                : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/25'
            }`}
          >
            Export ({filteredPacks.length})
          </button>
        )}
      </div>

      {/* Row 1: Primary Creator / Category Filter Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-1.5 shrink-0 no-scrollbar border-b border-white/5">
        {topCategoriesToShow.map((cat) => {
          const isActive = topCategory === cat;
          const count = categoryCounts[cat];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleSelectTopCategory(cat)}
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider whitespace-nowrap border transition-all ${
                isActive
                  ? isLight
                    ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                    : 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50 shadow-sm'
                  : isLight
                    ? 'bg-slate-900/[0.04] text-slate-600 border-slate-900/10 hover:bg-slate-900/[0.08]'
                    : 'bg-white/[0.04] text-white/55 border-white/10 hover:bg-white/[0.08] hover:text-white/80'
              }`}
            >
              {cat} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Row 2A: Psyonix Year Sub-Row (Only shown when Psyonix is selected) */}
      {topCategory === 'Psyonix' && (
        <div className="flex flex-col gap-1 mb-1.5 pb-1.5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <span
              className={`text-[8px] font-bold uppercase tracking-wider mr-1 shrink-0 ${
                isLight ? 'text-slate-400' : 'text-white/35'
              }`}
            >
              Year:
            </span>
            <button
              type="button"
              onClick={() => handleSelectPsyonixYear('ALL')}
              className={`px-2 py-0.5 rounded text-[8.5px] font-bold tracking-wider whitespace-nowrap border transition-all ${
                selectedPsyonixYear === 'ALL'
                  ? isLight
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-indigo-500/30 text-indigo-200 border-indigo-400/50'
                  : isLight
                    ? 'bg-slate-900/[0.03] text-slate-600 border-slate-900/10 hover:bg-slate-900/[0.07]'
                    : 'bg-white/[0.03] text-white/50 border-white/10 hover:bg-white/[0.07]'
              }`}
            >
              All Years
            </button>
            {PSYONIX_YEARS.map((yr) => {
              const cnt = psyonixYearCounts.get(yr) || 0;
              if (cnt === 0) return null;
              const isYrActive = selectedPsyonixYear === yr;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => handleSelectPsyonixYear(yr)}
                  className={`px-2 py-0.5 rounded text-[8.5px] font-bold tracking-wider whitespace-nowrap border transition-all ${
                    isYrActive
                      ? isLight
                        ? 'bg-indigo-600 text-white border-indigo-700'
                        : 'bg-indigo-500/30 text-indigo-200 border-indigo-400/50'
                      : isLight
                        ? 'bg-slate-900/[0.03] text-slate-600 border-slate-900/10 hover:bg-slate-900/[0.07]'
                        : 'bg-white/[0.03] text-white/50 border-white/10 hover:bg-white/[0.07]'
                  }`}
                >
                  {yr} <span className="opacity-70">({cnt})</span>
                </button>
              );
            })}
          </div>

          {/* Row 2B: Psyonix Month Sub-Row (Shown when a specific year is selected) */}
          {selectedPsyonixYear !== 'ALL' && psyonixMonthsForSelectedYear.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
              <span
                className={`text-[8px] font-bold uppercase tracking-wider mr-1 shrink-0 ${
                  isLight ? 'text-slate-400' : 'text-white/35'
                }`}
              >
                Month:
              </span>
              <button
                type="button"
                onClick={() => setSelectedPsyonixYearMonth('ALL')}
                className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold tracking-wider whitespace-nowrap border transition-all ${
                  selectedPsyonixYearMonth === 'ALL'
                    ? isLight
                      ? 'bg-sky-600 text-white border-sky-700'
                      : 'bg-cyan-500/30 text-cyan-200 border-cyan-400/50'
                    : isLight
                      ? 'bg-slate-900/[0.03] text-slate-600 border-slate-900/10 hover:bg-slate-900/[0.07]'
                      : 'bg-white/[0.03] text-white/50 border-white/10 hover:bg-white/[0.07]'
                }`}
              >
                All {selectedPsyonixYear}
              </button>
              {psyonixMonthsForSelectedYear.map((m) => {
                const isMonthActive = selectedPsyonixYearMonth === m.ymTag;
                return (
                  <button
                    key={m.ymTag}
                    type="button"
                    onClick={() => setSelectedPsyonixYearMonth(m.ymTag)}
                    title={`Filter by ${m.ymTag}`}
                    className={`px-2 py-0.5 rounded text-[8.5px] font-bold tracking-wider whitespace-nowrap border transition-all ${
                      isMonthActive
                        ? isLight
                          ? 'bg-sky-600 text-white border-sky-700'
                          : 'bg-cyan-500/30 text-cyan-200 border-cyan-400/50'
                        : isLight
                          ? 'bg-slate-900/[0.03] text-slate-600 border-slate-900/10 hover:bg-slate-900/[0.07]'
                          : 'bg-white/[0.03] text-white/50 border-white/10 hover:bg-white/[0.07]'
                    }`}
                  >
                    {m.shortLabel} <span className="opacity-70">({m.count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Row 2C: Rank Tier Sub-Row (Only shown when Rank is selected) */}
      {topCategory === 'Rank' && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-1.5 shrink-0 no-scrollbar border-b border-white/5">
          <button
            type="button"
            onClick={() => setSelectedRank('ALL')}
            className={`px-2 py-0.5 rounded text-[8.5px] font-bold tracking-wider whitespace-nowrap border transition-all ${
              selectedRank === 'ALL'
                ? isLight
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                : isLight
                  ? 'bg-slate-900/[0.03] text-slate-600 border-slate-900/10 hover:bg-slate-900/[0.07]'
                  : 'bg-white/[0.03] text-white/50 border-white/10 hover:bg-white/[0.07]'
            }`}
          >
            All Ranks
          </button>
          {RANK_SUBFOLDERS.map((rank) => {
            const cnt = rankCounts.get(rank) || 0;
            if (cnt === 0) return null;
            const isRankActive = selectedRank === rank;
            return (
              <button
                key={rank}
                type="button"
                onClick={() => setSelectedRank(rank)}
                className={`px-2 py-0.5 rounded text-[8.5px] font-bold tracking-wider whitespace-nowrap border transition-all ${
                  isRankActive
                    ? isLight
                      ? 'bg-amber-600 text-white border-amber-700'
                      : 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                    : isLight
                      ? 'bg-slate-900/[0.03] text-slate-600 border-slate-900/10 hover:bg-slate-900/[0.07]'
                      : 'bg-white/[0.03] text-white/50 border-white/10 hover:bg-white/[0.07]'
                }`}
              >
                {rank} <span className="opacity-70">({cnt})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Pack List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {filteredPacks.length === 0 ? (
          <div
            className={`py-8 text-center text-[11px] ${
              isLight ? 'text-slate-400' : 'text-white/35'
            }`}
          >
            No packs match the current filter.
          </div>
        ) : (
          filteredPacks.map((pack) => {
            const isSelected = pack.uuid === selectedUuid;
            const hasRecommendedVariance = Boolean(pack.recommendedVariation);
            const creatorCategoryBadge = isNativePack(pack)
              ? 'Native'
              : isKevpertPack(pack)
                ? 'Kevpert'
                : isPsyonixPack(pack)
                  ? 'Psyonix'
                  : 'Others';

            // Find rank or YYYY-MM tags to show in the subtle metadata line
            const extraBadges = (pack.tags || []).filter(
              (t) =>
                RANK_SUBFOLDERS.includes(t as (typeof RANK_SUBFOLDERS)[number]) ||
                /^\d{4}-\d{2}$/.test(t)
            );

            return (
              <button
                key={pack.uuid}
                type="button"
                onClick={() => onSelectPack(pack.uuid)}
                onMouseEnter={() =>
                  onHoverDesc(
                    pack.code
                      ? `[${pack.code}] ${pack.description || pack.title}`
                      : pack.description || pack.title
                  )
                }
                onMouseLeave={() => onHoverDesc(null)}
                className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all flex flex-col gap-1 ${
                  isSelected
                    ? isLight
                      ? 'bg-sky-500/15 border-sky-500/45 text-slate-900 shadow-sm'
                      : 'bg-cyan-500/15 border-cyan-400/45 text-white shadow-sm'
                    : isLight
                      ? 'bg-white/70 border-slate-900/10 text-slate-700 hover:bg-slate-900/[0.04]'
                      : 'bg-white/[0.025] border-white/5 text-white/75 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <span className="text-[11px] font-bold leading-snug break-words flex-1 min-w-0">
                    {pack.title}
                  </span>
                  <span
                    title={
                      hasRecommendedVariance
                        ? `Has Recommended Kevpert Variance (${pack.recommendedVariation?.presetKey || 'Custom'})`
                        : `${pack.itemCount} Shots`
                    }
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 border transition-colors ${
                      hasRecommendedVariance
                        ? isLight
                          ? 'bg-sky-500/20 text-sky-700 border-sky-500/45 font-bold shadow-[0_0_8px_rgba(14,165,233,0.2)]'
                          : 'bg-cyan-500/25 text-cyan-200 border-cyan-400/55 font-bold shadow-[0_0_8px_rgba(34,211,238,0.25)]'
                        : isSelected
                          ? isLight
                            ? 'bg-sky-500/15 text-sky-700 border-sky-500/30'
                            : 'bg-cyan-400/15 text-cyan-200 border-cyan-400/30'
                          : isLight
                            ? 'bg-slate-900/5 text-slate-500 border-transparent'
                            : 'bg-white/10 text-white/55 border-transparent'
                    }`}
                  >
                    {pack.itemCount} Shots
                  </span>
                </div>

                {/* Subtle metadata row */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1 flex-wrap min-w-0">
                    <span
                      className={`text-[8px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                        creatorCategoryBadge === 'Kevpert'
                          ? isLight
                            ? 'bg-violet-500/10 text-violet-700'
                            : 'bg-violet-400/15 text-violet-300'
                          : creatorCategoryBadge === 'Psyonix'
                            ? isLight
                              ? 'bg-indigo-500/10 text-indigo-700'
                              : 'bg-indigo-400/15 text-indigo-300'
                            : creatorCategoryBadge === 'Native'
                              ? isLight
                                ? 'bg-emerald-500/10 text-emerald-700'
                                : 'bg-emerald-400/15 text-emerald-300'
                              : isLight
                                ? 'bg-slate-900/5 text-slate-500'
                                : 'bg-white/5 text-white/45'
                      }`}
                    >
                      {creatorCategoryBadge}
                    </span>
                    {extraBadges.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className={`text-[8px] px-1 py-0.2 rounded font-medium ${
                          isLight
                            ? 'bg-slate-900/5 text-slate-500'
                            : 'bg-white/5 text-white/45'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {pack.code && (
                    <span
                      className={`text-[8.5px] font-mono shrink-0 ${
                        isLight ? 'text-slate-400' : 'text-white/35'
                      }`}
                    >
                      {pack.code}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
