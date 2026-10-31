import React, { useState, useMemo, useEffect } from 'react';
import { useLayer4AdvancedAudioStoreBinding } from './hooks/useLayer4StoreBindings';
import {
  ADVANCED_AUDIO_CATEGORIES,
  ADVANCED_AUDIO_DETAIL_CATALOG,
} from '../config/audioConfig.js';
import { Card } from '../layout/Card';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { SettingSliderRow } from '../compounds/SettingSliderRow';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';

export interface AudioDetailCatalogEntry {
  key: string;
  title: string;
  category: string;
  categoryLabel: string;
  assetHint: string;
  description: string;
}

export interface Layer4AdvancedAudioRecipeProps {
  isLight?: boolean;
  detailVolumes?: Record<string, number>;
  defaultDetailVolumes?: Record<string, number>;
  onDetailVolumeChange?: (key: string, volumePct: number) => void;
  onResetDetailVolumes?: () => void;
  onPreviewDetail?: (key: string) => void;
  onStopPreview?: () => void;
  onCopyJson?: () => { ok: boolean; bytes: number; count: number } | void;
  onExportJson?: () => { ok: boolean; bytes: number; count: number } | void;
  onBack?: () => void;
  className?: string;
}

function buildDefaultDetailVolumes(): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const item of ADVANCED_AUDIO_DETAIL_CATALOG as readonly AudioDetailCatalogEntry[]) {
    defaults[item.key] = 100;
  }
  return defaults;
}

const DEFAULT_DETAIL_VOLUMES = buildDefaultDetailVolumes();

export const Layer4AdvancedAudioRecipe: React.FC<Layer4AdvancedAudioRecipeProps> = React.memo((rawProps) => {
  const {
    isLight = false,
    detailVolumes: controlledVolumes,
    defaultDetailVolumes = DEFAULT_DETAIL_VOLUMES,
    onDetailVolumeChange,
    onResetDetailVolumes,
    onPreviewDetail,
    onStopPreview,
    onCopyJson,
    onExportJson,
    onBack = () => {},
    className = '',
  } = useLayer4AdvancedAudioStoreBinding(rawProps);

  const { rowGap } = useSettingActionRowStore();
  const [internalVolumes, setInternalVolumes] = useState<Record<string, number>>(defaultDetailVolumes);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewingKey, setPreviewingKey] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const volumes = controlledVolumes ?? internalVolumes;
  const sizing = useMenuLayoutStore((s) => s.panels['layer4-advanced-audio']);

  useEffect(() => {
    return () => {
      onStopPreview?.();
    };
  }, [onStopPreview]);

  const catalog = ADVANCED_AUDIO_DETAIL_CATALOG as readonly AudioDetailCatalogEntry[];

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: catalog.length };
    for (const item of catalog) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [catalog]);

  const modifiedCount = useMemo(() => {
    let count = 0;
    for (const item of catalog) {
      if ((volumes[item.key] ?? 100) !== 100) count++;
    }
    return count;
  }, [catalog, volumes]);

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const groups = new Map<string, { id: string; label: string; items: AudioDetailCatalogEntry[] }>();

    for (const item of catalog) {
      if (activeCategory !== 'all' && item.category !== activeCategory) continue;
      if (
        q &&
        !item.title.toLowerCase().includes(q) &&
        !item.key.toLowerCase().includes(q) &&
        !item.assetHint.toLowerCase().includes(q) &&
        !item.categoryLabel.toLowerCase().includes(q)
      ) {
        continue;
      }
      let grp = groups.get(item.category);
      if (!grp) {
        grp = { id: item.category, label: item.categoryLabel, items: [] };
        groups.set(item.category, grp);
      }
      grp.items.push(item);
    }

    return Array.from(groups.values());
  }, [catalog, activeCategory, searchQuery]);

  const handleVolumeChange = (key: string, nextVal: number) => {
    const clamped = Math.max(0, Math.min(500, Math.round(Number(nextVal) || 0)));
    if (controlledVolumes === undefined) {
      setInternalVolumes((prev) => ({ ...prev, [key]: clamped }));
    }
    onDetailVolumeChange?.(key, clamped);
  };

  const handleResetAll = () => {
    if (controlledVolumes === undefined) {
      setInternalVolumes(DEFAULT_DETAIL_VOLUMES);
    }
    onResetDetailVolumes?.();
  };

  const handlePreviewClick = (key: string) => {
    setPreviewingKey(key);
    onPreviewDetail?.(key);
    window.setTimeout(() => {
      setPreviewingKey((prev) => (prev === key ? null : prev));
    }, 1350);
  };

  const handleCopyClick = () => {
    const res = onCopyJson?.();
    const kb = res && typeof res === 'object' && res.bytes ? `${(res.bytes / 1024).toFixed(1)} KB` : 'JSON';
    setCopyFeedback(`Copied (${kb})`);
    window.setTimeout(() => setCopyFeedback(null), 1800);
  };

  const handleExportClick = () => {
    const res = onExportJson?.();
    const kb = res && typeof res === 'object' && res.bytes ? `${(res.bytes / 1024).toFixed(1)} KB` : 'JSON';
    setExportFeedback(`Exported (${kb})`);
    window.setTimeout(() => setExportFeedback(null), 1800);
  };

  return (
    <PanelContainer
      isLight={isLight}
      sizing={sizing}
      className={`w-full select-none ${className}`}
    >
      <PanelHeader
        isLight={isLight}
        title="ADVANCED AUDIO SETTINGS"
        onBack={onBack}
      />

      <PanelContent scrollable={true} className="flex flex-col gap-3">
        {/* Top Calibration Toolbar: Search, Category Filters, Copy/Export & Reset 100% */}
        <Card isLight={isLight} variant="outlined" className="p-3 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider">
                Per-Trigger Gain Calibration (0% – 500% · Default 100%)
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                  modifiedCount > 0
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : isLight
                    ? 'bg-neutral-100 border-neutral-300 text-neutral-600'
                    : 'bg-neutral-800/80 border-neutral-700 text-neutral-400'
                }`}
              >
                {modifiedCount > 0 ? `${modifiedCount} Tuned` : `${catalog.length} Unity`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyClick}
                onMouseEnter={() =>
                  setHoveredDesc(
                    'Copy full audioConfig JSON (all 44 volume multipliers and parameters) directly to system clipboard.'
                  )
                }
                onMouseLeave={() => setHoveredDesc(null)}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                  copyFeedback
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                    : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                }`}
              >
                {copyFeedback || 'Copy JSON'}
              </button>

              <button
                type="button"
                onClick={handleExportClick}
                onMouseEnter={() =>
                  setHoveredDesc(
                    'Download audioConfig.json file and copy full calibration payload to clipboard.'
                  )
                }
                onMouseLeave={() => setHoveredDesc(null)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider text-amber-500 cursor-pointer transition-colors"
              >
                {exportFeedback || 'Export JSON'}
              </button>

              <button
                type="button"
                onClick={handleResetAll}
                onMouseEnter={() =>
                  setHoveredDesc('Reset all 44 audio detail volume multipliers back to default 100%.')
                }
                onMouseLeave={() => setHoveredDesc(null)}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                    : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                }`}
              >
                Reset 100%
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {(ADVANCED_AUDIO_CATEGORIES as readonly { id: string; label: string }[]).map((cat) => {
                const isSelected = activeCategory === cat.id;
                const count = categoryCounts[cat.id] ?? 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold tracking-wide border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : isLight
                        ? 'bg-neutral-100/80 hover:bg-neutral-200/80 border-neutral-300/80 text-neutral-600'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-neutral-400'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter trigger or asset..."
              className={`px-2.5 py-1 rounded-md text-xs border outline-none w-44 transition-colors ${
                isLight
                  ? 'bg-white border-neutral-300 text-neutral-800 placeholder:text-neutral-400 focus:border-amber-500'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-200 placeholder:text-neutral-500 focus:border-amber-500'
              }`}
            />
          </div>
        </Card>

        {/* Fine-Grained Category Cards (No Leading Icons, Accurate Name + Preview + Slider + Enter Input) */}
        {filteredSections.map((section) => (
          <Card
            key={section.id}
            isLight={isLight}
            variant="outlined"
            className="p-3 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between px-1 pb-1 border-b border-neutral-500/15">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-neutral-700' : 'text-neutral-300'
                }`}
              >
                {section.label}
              </span>
              <span
                className={`text-[10px] font-mono ${
                  isLight ? 'text-neutral-500' : 'text-neutral-400'
                }`}
              >
                {section.items.length} {section.items.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            <div className="flex flex-col" style={{ gap: `${rowGap}px` }}>
              {section.items.map((item) => {
                const currentVal = volumes[item.key] ?? 100;
                const isPreviewing = previewingKey === item.key;
                const isModified = currentVal !== 100;

                return (
                  <SettingSliderRow
                    key={item.key}
                    title={item.title}
                    badge={
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                          isLight
                            ? 'bg-neutral-100 border-neutral-200 text-neutral-500'
                            : 'bg-white/[0.04] border-white/[0.08] text-neutral-400'
                        }`}
                      >
                        {item.assetHint}
                      </span>
                    }
                    min={0}
                    max={500}
                    step={1}
                    value={currentVal}
                    onChange={(val) => handleVolumeChange(item.key, val)}
                    unit="%"
                    layout="inline"
                    developerMode={true}
                    editable={true}
                    bordered={false}
                    showDescription={false}
                    colorScheme={isModified ? 'amber' : 'neutral'}
                    hoverDescription={`${item.title} (${item.key}): ${item.description} [Default: 100%, Range: 0%–500%]`}
                    onHover={(desc) => desc && setHoveredDesc(desc)}
                    onLeave={() => setHoveredDesc(null)}
                    isLight={isLight}
                    actionSlot={
                      <div className="flex items-center gap-1 shrink-0">
                        {isModified && (
                          <button
                            type="button"
                            onClick={() => handleVolumeChange(item.key, 100)}
                            onMouseEnter={() =>
                              setHoveredDesc(`Reset ${item.title} back to 100%.`)
                            }
                            onMouseLeave={() => setHoveredDesc(null)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono border cursor-pointer transition-colors ${
                              isLight
                                ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-600'
                                : 'bg-white/[0.05] hover:bg-white/[0.10] border-white/[0.10] text-neutral-400'
                            }`}
                          >
                            100%
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePreviewClick(item.key)}
                          onMouseEnter={() =>
                            setHoveredDesc(
                              `Preview "${item.title}" at ${currentVal}% gain (${item.assetHint}).`
                            )
                          }
                          onMouseLeave={() => setHoveredDesc(null)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border cursor-pointer transition-colors ${
                            isPreviewing
                              ? 'bg-amber-500/25 border-amber-500/50 text-amber-400'
                              : isLight
                              ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                              : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.12] text-neutral-200'
                          }`}
                        >
                          {isPreviewing ? 'Playing' : 'Preview'}
                        </button>
                      </div>
                    }
                  />
                );
              })}
            </div>
          </Card>
        ))}
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Calibrate individual audio triggers (0%–500%, default 100%), audition via Preview, press Enter to commit numeric input, and Copy/Export JSON."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
});

Layer4AdvancedAudioRecipe.displayName = 'Layer4AdvancedAudioRecipe';
