import { RANK_ORDER_MAP } from '../../config/temTrainingPackParser';
import type { StaticTrainingVariationConfig } from '../../config/staticTrainingVariationTypes';

export type StaticPackDownCounterOption = 1 | 2 | 3;

export type StaticPackSortOrder = 'updated' | 'rank' | 'date' | 'title';

export type TopCategoryFilter = 'All' | 'Kevpert' | 'Psyonix' | 'Rank' | 'Others' | 'Native';

export interface StaticTrainingPackSummary {
  uuid: string;
  id?: string;
  title: string;
  name?: string;
  description: string;
  originalDescription?: string;
  itemCount: number;
  shotCount?: number;
  createdAt?: number;
  updatedAt?: number | string;
  tags?: string[];
  code?: string;
  creator?: string;
  creatorName?: string;
  releaseYearMonth?: string;
  rankTier?: string;
  sourcePackType?: 'RCSPack' | 'RCSPackE' | 'RLRCSPack';
  recommendedVariation?: StaticTrainingVariationConfig;
  isBuiltIn?: boolean;
  isBuiltInDevPack?: boolean;
}

export const PSYONIX_YEARS = ['2024', '2023', '2022'] as const;

export const PSYONIX_MONTH_DEFINITIONS: ReadonlyArray<{
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

export const RANK_SUBFOLDERS = [
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

export function hasTagCaseInsensitive(tags: string[] | undefined, target: string): boolean {
  if (!tags || tags.length === 0) return false;
  const lower = target.toLowerCase();
  return tags.some((t) => t.toLowerCase() === lower);
}

export function getEffectiveCreator(pack: StaticTrainingPackSummary): string {
  return (pack.creator || pack.creatorName || '').trim();
}

export function isKevpertPack(pack: StaticTrainingPackSummary): boolean {
  if (pack.tags && pack.tags.length > 0) {
    return hasTagCaseInsensitive(pack.tags, 'Kevpert');
  }
  const creator = getEffectiveCreator(pack);
  return (
    /kevpert|hampert|samuraipert/i.test(creator) ||
    /^kevpert\b/i.test(pack.title)
  );
}

export function isPsyonixPack(pack: StaticTrainingPackSummary): boolean {
  if (pack.tags && pack.tags.length > 0) {
    return hasTagCaseInsensitive(pack.tags, 'Psyonix');
  }
  const creator = getEffectiveCreator(pack);
  return (
    /psyonix/i.test(creator) ||
    /^psyonix\b/i.test(pack.title) ||
    /^(progression|ssl|gc|champion|diamond|platinum|gold|silver|bronze)\s+(pack|goals)\s+/i.test(
      pack.title.trim()
    )
  );
}

/**
 * Native packs are strictly `.RCSPack` or `.RCSPackE` packs (never `.RLRCSPack`).
 */
export function isNativePack(pack: StaticTrainingPackSummary): boolean {
  if (pack.sourcePackType === 'RLRCSPack') return false;
  if (pack.sourcePackType === 'RCSPack' || pack.sourcePackType === 'RCSPackE') {
    return true;
  }
  return hasTagCaseInsensitive(pack.tags, 'Native');
}

export function isOthersPack(pack: StaticTrainingPackSummary): boolean {
  if (hasTagCaseInsensitive(pack.tags, 'Others')) return true;
  if (isKevpertPack(pack) || isPsyonixPack(pack) || isNativePack(pack)) return false;
  return true;
}

export function normalizeRankLabel(rawRank: string | undefined): string | null {
  if (!rawRank) return null;
  const trimmed = rawRank.trim();
  if (/^(ssl|supersonic legend)$/i.test(trimmed)) return 'SSL';
  if (/^(gc|grand champion)$/i.test(trimmed)) return 'GC';
  for (const r of RANK_SUBFOLDERS) {
    if (r.toLowerCase() === trimmed.toLowerCase()) return r;
  }
  return null;
}

export function matchesRankSubfolder(pack: StaticTrainingPackSummary, rank: string): boolean {
  if (pack.tags && pack.tags.length > 0) {
    if (hasTagCaseInsensitive(pack.tags, rank)) return true;
    if (rank === 'SSL' && hasTagCaseInsensitive(pack.tags, 'Supersonic Legend')) return true;
    if (rank === 'GC' && hasTagCaseInsensitive(pack.tags, 'Grand Champion')) return true;
    return false;
  }
  if (!isPsyonixPack(pack)) return false;
  return normalizeRankLabel(pack.rankTier) === rank;
}

export function hasAnyRankTag(pack: StaticTrainingPackSummary): boolean {
  return RANK_SUBFOLDERS.some((rank) => matchesRankSubfolder(pack, rank));
}

export function matchesPsyonixYear(pack: StaticTrainingPackSummary, yr: string): boolean {
  if (pack.releaseYearMonth && pack.releaseYearMonth.startsWith(`${yr}-`)) return true;
  return (
    hasTagCaseInsensitive(pack.tags, yr) ||
    hasTagCaseInsensitive(pack.tags, `Psyonix ${yr}`)
  );
}

export function matchesPsyonixYearMonth(pack: StaticTrainingPackSummary, ymTag: string): boolean {
  if (pack.releaseYearMonth === ymTag) return true;
  return hasTagCaseInsensitive(pack.tags, ymTag);
}

export function filterAndSortTrainingPacks(params: {
  packs: StaticTrainingPackSummary[];
  topCategory: TopCategoryFilter;
  selectedPsyonixYear: string;
  selectedPsyonixYearMonth: string;
  selectedRank: string;
  searchQuery: string;
  sortOrder: StaticPackSortOrder;
}): StaticTrainingPackSummary[] {
  const {
    packs,
    topCategory,
    selectedPsyonixYear,
    selectedPsyonixYearMonth,
    selectedRank,
    searchQuery,
    sortOrder,
  } = params;
  const q = searchQuery.trim().toLowerCase();

  const filtered = packs.filter((p) => {
    if (topCategory === 'Kevpert' && !isKevpertPack(p)) return false;
    if (topCategory === 'Psyonix') {
      if (!isPsyonixPack(p)) return false;
      if (selectedPsyonixYear !== 'ALL' && !matchesPsyonixYear(p, selectedPsyonixYear)) {
        return false;
      }
      if (
        selectedPsyonixYearMonth !== 'ALL' &&
        !matchesPsyonixYearMonth(p, selectedPsyonixYearMonth)
      ) {
        return false;
      }
    }
    if (topCategory === 'Rank') {
      if (selectedRank === 'ALL') {
        if (!hasAnyRankTag(p)) return false;
      } else if (!matchesRankSubfolder(p, selectedRank)) {
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
        getEffectiveCreator(p),
        p.rankTier || '',
        ...(p.tags || []),
      ]
        .join(' ')
        .toLowerCase();
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
}
