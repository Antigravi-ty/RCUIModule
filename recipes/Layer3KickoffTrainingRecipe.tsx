import React, { useState } from 'react';
import { Check, Clock, Compass, Crosshair, Ghost, GraduationCap, Play, Zap } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { SettingToggleRow } from '../compounds/SettingToggleRow';
import { KICKOFF_TRAINING_PRESET } from '../stores/floatingPresets';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import { FloatingWindowCard } from './settings/components/FloatingWindowCard';

export type KickoffSubMode = 'instant' | 'easy-learning' | 'realistic';
export type KickoffAISpawnSide = 'same-position' | 'opposite-side';

export interface KickoffTrainingConfig {
  subMode: KickoffSubMode;
  aiSpawnSide: KickoffAISpawnSide;
  ghostMode: boolean;
  showRhythmHighway?: boolean;
}

export const DEFAULT_KICKOFF_TRAINING_CONFIG: KickoffTrainingConfig = {
  subMode: 'instant',
  aiSpawnSide: 'opposite-side',
  ghostMode: false,
  showRhythmHighway: true,
};

export interface Layer3KickoffTrainingRecipeProps {
  isLight?: boolean;
  /** Controlled kickoff training config */
  config?: Partial<KickoffTrainingConfig>;
  /** Alias for controlled config */
  settings?: Partial<KickoffTrainingConfig>;
  /** Initial kickoff training config for uncontrolled mode */
  defaultConfig?: Partial<KickoffTrainingConfig>;
  /** Callback fired when any kickoff training setting changes */
  onChange?: (
    next: KickoffTrainingConfig,
    patch: Partial<KickoffTrainingConfig>
  ) => void;
  /** Alias for onChange */
  onConfigChange?: (
    next: KickoffTrainingConfig,
    patch: Partial<KickoffTrainingConfig>
  ) => void;
  onStartTraining?: (config: KickoffTrainingConfig) => void;
  onBack?: () => void;
  className?: string;
}

const SUB_MODE_DESCRIPTIONS: Record<KickoffSubMode, string> = {
  instant:
    'Skips the 3-second countdown and resets immediately upon first ball touch for high-rep muscle memory.',
  'easy-learning':
    'Slows physics to 75% speed with step-by-step falling note guidance on the 9-lane receptor bar.',
  realistic:
    'Full 120Hz regulation countdown and post-kickoff follow-through against Nexto / recorded pro bots.',
};

const DRILL_MODE_CARDS: Array<{
  value: KickoffSubMode;
  label: string;
  icon: React.ElementType;
}> = [
  { value: 'instant', label: 'Instant', icon: Zap },
  { value: 'easy-learning', label: 'Easy Learning', icon: GraduationCap },
  { value: 'realistic', label: 'Realistic', icon: Clock },
];

/**
 * [Recipe] Layer 3 Kickoff Training Setup
 * 1. Drill Mode — small header + 3 selectable cards (Instant | Easy Learning | Realistic) with checkmark & inverted active state
 * 2. AI Spawn Position — inline SegmentedSwitch (Same Side | Opposite Side)
 * 3. Ghost Mode — single-line ToggleSwitch
 * 4. Kickoff Training (PPO) — single-line FloatingWindowCard spawner (Rhythm Note Highway toggle resides inside the Floating Window)
 * 5. Start Kickoff Drill — primary action button
 */
export const Layer3KickoffTrainingRecipe: React.FC<Layer3KickoffTrainingRecipeProps> = React.memo(({
  isLight = true,
  config: controlledConfigProp,
  settings: controlledSettingsProp,
  defaultConfig,
  onChange,
  onConfigChange,
  onStartTraining,
  onBack = () => {},
  className = '',
}) => {
  const [internalConfig, setInternalConfig] = useState<KickoffTrainingConfig>({
    ...DEFAULT_KICKOFF_TRAINING_CONFIG,
    ...defaultConfig,
  });

  const controlledSource = controlledConfigProp ?? controlledSettingsProp;
  const resolvedConfig: KickoffTrainingConfig = {
    ...internalConfig,
    ...controlledSource,
  };

  const updateConfig = (patch: Partial<KickoffTrainingConfig>) => {
    const next: KickoffTrainingConfig = {
      ...resolvedConfig,
      ...patch,
    };
    if (controlledSource === undefined) {
      setInternalConfig(next);
    }
    onChange?.(next, patch);
    onConfigChange?.(next, patch);
  };

  const { subMode, aiSpawnSide, ghostMode, showRhythmHighway } = resolvedConfig;
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const sizing = useMenuLayoutStore((s) => s.panels['layer3-kickoff-training']);
  const { titleFontSize, rowGap, paddingX } = useSettingActionRowStore();

  return (
    <PanelContainer
      isLight={isLight}
      sizing={sizing}
      className={`w-full select-none ${className}`}
    >
      <PanelHeader
        isLight={isLight}
        title="KICKOFF TRAINING SETUP"
        onBack={onBack}
      />

      <PanelContent scrollable={true} className="flex flex-col justify-between gap-3">
        <div
          data-layout="kickoff-training-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          {/* 1. Drill Mode (Small title + 3 selectable cards) */}
          <div
            className="flex flex-col gap-2 py-1"
            style={{ paddingLeft: `${paddingX}px`, paddingRight: `${paddingX}px` }}
          >
            <span
              className={`font-semibold tracking-tight leading-snug ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}
              style={{ fontSize: `${titleFontSize}px` }}
            >
              Drill Mode
            </span>
            <div className="grid grid-cols-3 gap-2">
              {DRILL_MODE_CARDS.map((card) => {
                const Icon = card.icon;
                const isSelected = subMode === card.value;
                return (
                  <button
                    key={card.value}
                    type="button"
                    onClick={() => updateConfig({ subMode: card.value })}
                    onMouseEnter={() => setHoveredDesc(SUB_MODE_DESCRIPTIONS[card.value])}
                    onMouseLeave={() => setHoveredDesc(null)}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? isLight
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                          : 'bg-white text-neutral-950 border-white shadow-sm'
                        : isLight
                          ? 'bg-neutral-100/80 hover:bg-neutral-200/70 text-neutral-800 border-neutral-300/80'
                          : 'bg-neutral-900/60 hover:bg-neutral-800/80 text-neutral-200 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isSelected
                            ? isLight
                              ? 'text-white'
                              : 'text-neutral-950'
                            : isLight
                              ? 'text-neutral-600'
                              : 'text-neutral-400'
                        }`}
                      />
                      <span className="text-xs font-bold tracking-tight truncate">
                        {card.label}
                      </span>
                    </div>
                    {isSelected && (
                      <Check
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isLight ? 'text-white' : 'text-neutral-950'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. AI Spawn Position */}
          <SettingSegmentedRow
            icon={Compass}
            iconColor="text-sky-400"
            title="AI Spawn Position"
            value={aiSpawnSide}
            onChange={(v) => updateConfig({ aiSpawnSide: v as KickoffAISpawnSide })}
            layout="inline"
            bordered={false}
            showDescription={false}
            options={[
              { label: 'Same Side', value: 'same-position' },
              { label: 'Opposite Side', value: 'opposite-side' },
            ]}
            hoverDescription="AI Spawn Position: Spawn AI bot on the same position as a shadow ghost or opposite side for 50/50 duels."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 3. Ghost Mode */}
          <SettingToggleRow
            icon={Ghost}
            iconColor="text-purple-400"
            title="Ghost Mode"
            checked={ghostMode}
            onChange={(nextGhost) => updateConfig({ ghostMode: nextGhost })}
            bordered={false}
            showDescription={false}
            hoverDescription="Ghost Mode: Disables physical car-to-car and AI ball collision to practice pure speedflip lines."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 4. Kickoff Spawn & Mirror Floating Window Launcher */}
          <FloatingWindowCard
            preset={KICKOFF_TRAINING_PRESET}
            icon={Crosshair}
            iconColor="text-amber-500"
            bordered={false}
            showDescription={false}
            hoverTooltip="Kickoff Training (PPO): Spawn floating window to configure exact kickoff spawn slots and PPO opponent mirror settings."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />
        </div>

        <button
          type="button"
          onClick={() =>
            onStartTraining?.({
              subMode,
              aiSpawnSide,
              ghostMode,
              showRhythmHighway,
            })
          }
          onMouseEnter={() =>
            setHoveredDesc('Enter 120Hz Kickoff Training arena with the selected drill configuration.')
          }
          onMouseLeave={() => setHoveredDesc(null)}
          className="mt-2 w-full py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Start Kickoff Drill</span>
        </button>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Configure countdown pacing, AI opponent spawn geometry, and kickoff training floating tools."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
});

Layer3KickoffTrainingRecipe.displayName = 'Layer3KickoffTrainingRecipe';
