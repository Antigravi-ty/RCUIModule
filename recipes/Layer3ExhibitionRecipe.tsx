import React, { useState } from 'react';
import { Bot, Clock, Play, SlidersHorizontal, Users } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';

export type BotDifficultyTier = 'nexto' | 'necto' | 'easy' | 'medium' | 'hard';
export type ExhibitionMatchFormat = '1v1' | '2v2' | '3v3';
export type ExhibitionDuration = '90' | '180' | '300' | '600' | 'unlimited';

export interface ExhibitionBotSetupConfig {
  format: ExhibitionMatchFormat;
  difficulty: BotDifficultyTier;
  duration: ExhibitionDuration;
}

export const DEFAULT_EXHIBITION_CONFIG: ExhibitionBotSetupConfig = {
  format: '3v3',
  difficulty: 'necto',
  duration: '90',
};

export interface Layer3ExhibitionRecipeProps {
  isLight?: boolean;
  /** Controlled exhibition setup config */
  config?: Partial<ExhibitionBotSetupConfig>;
  /** Alias for controlled config */
  settings?: Partial<ExhibitionBotSetupConfig>;
  /** Initial exhibition setup config for uncontrolled mode */
  defaultConfig?: Partial<ExhibitionBotSetupConfig>;
  /** Callback fired when any exhibition setup field changes */
  onChange?: (
    next: ExhibitionBotSetupConfig,
    patch: Partial<ExhibitionBotSetupConfig>
  ) => void;
  /** Alias for onChange */
  onConfigChange?: (
    next: ExhibitionBotSetupConfig,
    patch: Partial<ExhibitionBotSetupConfig>
  ) => void;
  defaultDifficulty?: BotDifficultyTier;
  defaultFormat?: ExhibitionMatchFormat;
  defaultDuration?: ExhibitionDuration;
  difficultyOptions?: Array<{ label: string; value: BotDifficultyTier }>;
  durationOptions?: Array<{ label: string; value: ExhibitionDuration }>;
  onSelectDifficulty?: (difficulty: BotDifficultyTier, config?: ExhibitionBotSetupConfig) => void;
  onNavigateAdvancedMutators?: () => void;
  onBack?: () => void;
  className?: string;
}

const DIFFICULTY_DESCRIPTIONS: Record<BotDifficultyTier, string> = {
  easy: 'Rookie Bot: Relaxed throttle pacing, no aerials, ideal for basic ball-cam tracking.',
  medium: 'Pro Bot: Standard ground powershots, front-flip kickoffs, and basic boost collection.',
  hard: 'All-Star (Necto): Fast aerials, wall play, shadow defense, and consistent 50/50 challenges.',
  necto: 'All-Star (Necto ONNX): Fast aerials, wall play, shadow defense, and consistent 50/50 challenges.',
  nexto: 'Grand Champion (Nexto ONNX): Full 120Hz neural policy with flicks, air dribbles, and speedflips.',
};

const DEFAULT_DIFFICULTY_OPTIONS: Array<{ label: string; value: BotDifficultyTier }> = [
  { label: 'Nexto', value: 'nexto' },
  { label: 'Necto', value: 'necto' },
];

const DEFAULT_DURATION_OPTIONS: Array<{ label: string; value: ExhibitionDuration }> = [
  { label: '1:30', value: '90' },
  { label: '3:00', value: '180' },
  { label: '5:00', value: '300' },
];

/**
 * [Recipe] Layer 3 Exhibition Match Setup
 * Streamlined borderless rows sharing unified Settings row typography & spacing:
 * 1. Team Format — inline SegmentedSwitch (Duel | Doubles | Standard)
 * 2. Bot Difficulty — inline SegmentedSwitch (Nexto | Necto)
 * 3. Match Duration — inline SegmentedSwitch (1:30 | 3:00 | 5:00)
 * 4. Advanced Settings — full-width long bar button (disabled)
 * 5. Start Exhibition Match — primary action button
 */
export const Layer3ExhibitionRecipe: React.FC<Layer3ExhibitionRecipeProps> = React.memo(({
  isLight = true,
  config: controlledConfigProp,
  settings: controlledSettingsProp,
  defaultConfig,
  onChange,
  onConfigChange,
  defaultDifficulty = 'necto',
  defaultFormat = '3v3',
  defaultDuration = '90',
  difficultyOptions = DEFAULT_DIFFICULTY_OPTIONS,
  durationOptions = DEFAULT_DURATION_OPTIONS,
  onSelectDifficulty,
  onNavigateAdvancedMutators: _onNavigateAdvancedMutators,
  onBack = () => {},
  className = '',
}) => {
  const [internalConfig, setInternalConfig] = useState<ExhibitionBotSetupConfig>({
    format: defaultConfig?.format ?? defaultFormat,
    difficulty: defaultConfig?.difficulty ?? defaultDifficulty,
    duration: defaultConfig?.duration ?? defaultDuration,
  });

  const controlledSource = controlledConfigProp ?? controlledSettingsProp;
  const resolvedConfig: ExhibitionBotSetupConfig = {
    ...internalConfig,
    ...controlledSource,
  };

  const updateConfig = (patch: Partial<ExhibitionBotSetupConfig>) => {
    const next: ExhibitionBotSetupConfig = {
      ...resolvedConfig,
      ...patch,
    };
    if (controlledSource === undefined) {
      setInternalConfig(next);
    }
    onChange?.(next, patch);
    onConfigChange?.(next, patch);
  };

  const { format, difficulty: selectedDiff, duration } = resolvedConfig;
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const sizing = useMenuLayoutStore((s) => s.panels['layer3-exhibition']);
  const { rowGap, paddingX } = useSettingActionRowStore();

  return (
    <PanelContainer
      isLight={isLight}
      sizing={sizing}
      className={`w-full select-none ${className}`}
    >
      <PanelHeader
        isLight={isLight}
        title="EXHIBITION MATCH SETUP"
        onBack={onBack}
      />

      <PanelContent scrollable={true} className="flex flex-col justify-between gap-3">
        <div
          data-layout="exhibition-setup-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          {/* 1. Team Format */}
          <SettingSegmentedRow
            icon={Users}
            iconColor="text-sky-400"
            title="Team Format"
            value={format}
            onChange={(v) => updateConfig({ format: v as ExhibitionMatchFormat })}
            layout="inline"
            bordered={false}
            showDescription={false}
            options={[
              { label: 'Duel', value: '1v1' },
              { label: 'Doubles', value: '2v2' },
              { label: 'Standard', value: '3v3' },
            ]}
            hoverDescription="Select standard 1v1 Duel, 2v2 Doubles, or 3v3 Standard team size."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 2. Bot Difficulty */}
          <SettingSegmentedRow
            icon={Bot}
            iconColor="text-rose-400"
            title="Bot Difficulty"
            value={selectedDiff}
            onChange={(v) => updateConfig({ difficulty: v as BotDifficultyTier })}
            layout="inline"
            bordered={false}
            showDescription={false}
            options={difficultyOptions}
            hoverDescription={DIFFICULTY_DESCRIPTIONS[selectedDiff] ?? DIFFICULTY_DESCRIPTIONS.necto}
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 3. Match Duration */}
          <SettingSegmentedRow
            icon={Clock}
            iconColor="text-amber-500"
            title="Match Duration"
            value={duration}
            onChange={(v) => updateConfig({ duration: v as ExhibitionDuration })}
            layout="inline"
            bordered={false}
            showDescription={false}
            options={durationOptions}
            hoverDescription="Regulation timer length before sudden-death Overtime (+0:00)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 4. Full-width Long Bar Button: Advanced Settings (Disabled) */}
          <div
            style={{
              paddingLeft: `${Math.max(0, paddingX)}px`,
              paddingRight: `${Math.max(0, paddingX)}px`,
            }}
            className="pt-2"
          >
            <button
              type="button"
              disabled={true}
              aria-disabled="true"
              onMouseEnter={() =>
                setHoveredDesc(
                  'Advanced Settings: Configure asymmetric 1v2/1v3 bot counts, per-slot policies, and physics mutators.'
                )
              }
              onMouseLeave={() => setHoveredDesc(null)}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-colors opacity-50 cursor-not-allowed ${
                isLight
                  ? 'bg-neutral-100 border-neutral-300 text-neutral-500 shadow-2xs'
                  : 'bg-neutral-800/60 border-neutral-700/70 text-neutral-500'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500/60" />
              <span>Advanced Settings</span>
            </button>
          </div>
        </div>

        {/* Primary Launch CTA */}
        <button
          type="button"
          onClick={() =>
            onSelectDifficulty?.(selectedDiff, {
              format,
              difficulty: selectedDiff,
              duration,
            })
          }
          onMouseEnter={() =>
            setHoveredDesc('Launch offline 120Hz Exhibition Match with the selected AI policy and format.')
          }
          onMouseLeave={() => setHoveredDesc(null)}
          className="mt-2 w-full py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Start Exhibition Match</span>
        </button>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Select team format, RLBot neural policy difficulty, and regulation duration."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
});

Layer3ExhibitionRecipe.displayName = 'Layer3ExhibitionRecipe';
