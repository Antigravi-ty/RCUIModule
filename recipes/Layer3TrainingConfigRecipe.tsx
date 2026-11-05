import React, { useState } from 'react';
import { Zap, Shield, History, CircleSlash2, Info } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { SettingToggleRow } from '../compounds/SettingToggleRow';
import { FloatingWindowCard } from './settings/components/FloatingWindowCard';
import { useAppStore } from '../stores/appStore';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { DEFAULT_PANEL_SIZING, type PanelSizingConfig } from '../tokens/menuLayoutTokens';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import {
  GOAL_BARRIER_CONFIGURATOR_PRESET,
  REWINDER_CONFIGURATOR_PRESET,
  type PresetConfig,
} from '../stores/floatingPresets';

export interface TrainingGameplayConfig {
  unlimitedBoost?: boolean;
  showCarHitbox?: boolean | string;
  goalRestart?: boolean;
}

export interface Layer3TrainingConfigRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  onNavigateTrajectory?: () => void;
  onAddPresetWindow?: (preset: PresetConfig, e: React.MouseEvent<HTMLButtonElement>) => void;
  activeWindows?: unknown[];
  onClosePresetWindow?: (id: string) => void;
  sizing?: PanelSizingConfig;
  gameplay?: TrainingGameplayConfig;
  onUpdateGameplay?: (patch: Partial<TrainingGameplayConfig>) => void;
}

/**
 * [Recipe] Layer 3 Training Configuration Panel (User Tier)
 * Organized into two explicit mode-scope sections so competitive modes (Exhibition & Multiplayer) remain isolated:
 * - Free Play Scope (Free Play Only):
 *   1. Boost: Inline SegmentedSwitch (Unlimited | Standard)
 *   2. Disable Goal Reset: ToggleSwitch
 *   3. Rewinder Configurator: FloatingWindowCard spawner
 * - Training Scope (Free Play, Static Training Pack & Kickoff Training):
 *   4. Goal Barrier Configurator: FloatingWindowCard spawner
 */
export const Layer3TrainingConfigRecipe: React.FC<Layer3TrainingConfigRecipeProps> = ({
  isLight = false,
  onBack: propOnBack,
  sizing: propSizing,
  gameplay: propGameplay,
  onUpdateGameplay: propOnUpdateGameplay,
}) => {
  const goBack = useAppStore((s) => s.goBack);
  const storeGameplay = useAppStore((s) => s.gameplay);
  const storeUpdateGameplay = useAppStore((s) => s.updateGameplay);

  const onBack = propOnBack ?? goBack;
  const controlledGameplay = propGameplay ?? storeGameplay;
  const onUpdateGameplay =
    propOnUpdateGameplay ??
    ((patch: Partial<TrainingGameplayConfig>) =>
      storeUpdateGameplay({
        ...(patch.unlimitedBoost !== undefined ? { unlimitedBoost: patch.unlimitedBoost } : {}),
        ...(patch.goalRestart !== undefined ? { goalRestart: patch.goalRestart } : {}),
        ...(patch.showCarHitbox !== undefined ? { showCarHitbox: Boolean(patch.showCarHitbox) } : {}),
      }));

  const storeSizing = useMenuLayoutStore(
    (s) => s.panels?.['layer3-training-config'] ?? DEFAULT_PANEL_SIZING['layer3-training-config']
  );
  const sizing = propSizing ?? storeSizing;
  const { rowGap } = useSettingActionRowStore();

  const [internalUnlimitedBoost, setInternalUnlimitedBoost] = useState(true);
  const [internalGoalRestart, setInternalGoalRestart] = useState(true);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const unlimitedBoost = controlledGameplay?.unlimitedBoost ?? internalUnlimitedBoost;
  const goalRestart = controlledGameplay?.goalRestart ?? internalGoalRestart;

  const handleSetUnlimitedBoost = (next: boolean) => {
    setInternalUnlimitedBoost(next);
    onUpdateGameplay?.({ unlimitedBoost: next });
  };

  const handleSetGoalRestart = (next: boolean) => {
    setInternalGoalRestart(next);
    onUpdateGameplay?.({ goalRestart: next });
  };

  const boostValue = unlimitedBoost ? 'unlimited' : 'standard';
  const sectionLabelClass = isLight
    ? 'text-neutral-500 border-neutral-200/80'
    : 'text-neutral-400 border-white/[0.08]';

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full">
      <PanelHeader title="TRAINING CONFIGURATION" onBack={onBack} isLight={isLight} />

      <PanelContent scrollable>
        <div
          data-layout="training-config-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          {/* Scope Group 1: Free Play Only */}
          <div
            className={`flex items-center justify-between px-3 pt-1 pb-1.5 border-b ${sectionLabelClass}`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Free Play Scope
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold bg-amber-500/15 border-amber-500/30 text-amber-400">
              Free Play Only
            </span>
          </div>

          {/* 1. Boost: Unlimited | Standard (Inline Segmented Control) */}
          <SettingSegmentedRow
            icon={Zap}
            iconName="zap"
            iconColor="text-amber-500"
            title="Boost"
            value={boostValue}
            onChange={(val) => handleSetUnlimitedBoost(val === 'unlimited')}
            layout="inline"
            bordered={false}
            showDescription={false}
            options={[
              { value: 'unlimited', label: 'Unlimited' },
              { value: 'standard', label: 'Standard' },
            ]}
            hoverDescription="Free Play Only: Choose between continuous unlimited boost refill or standard 100% capacity limitation in Free Play."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 2. Disable Goal Reset: ToggleSwitch with CircleSlash2 ('circle-slash-2') icon */}
          <SettingToggleRow
            icon={CircleSlash2}
            iconName="circle-slash-2"
            iconColor="text-rose-400"
            title="Disable Goal Reset"
            checked={!goalRestart}
            onChange={(disableReset) => handleSetGoalRestart(!disableReset)}
            bordered={false}
            showDescription={false}
            hoverDescription="Free Play Only: When enabled, scoring a goal in Free Play will not trigger goal replay or reset the ball to kickoff."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 3. Rewinder Configurator: Floating Window Spawner */}
          <FloatingWindowCard
            preset={REWINDER_CONFIGURATOR_PRESET}
            icon={History}
            iconColor="text-amber-500"
            bordered={false}
            showDescription={false}
            hoverTooltip="Free Play Only: Spawn the Rewinder Configurator floating window to record, scrub, rewind, and resume Free Play state history with hotkeys (O / P / [ / ] / G)."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* Scope Group 2: All Training Modes */}
          <div
            className={`flex items-center justify-between px-3 pt-2.5 pb-1.5 border-b ${sectionLabelClass}`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Training Scope
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold bg-sky-500/15 border-sky-500/30 text-sky-400">
              Free Play · Packs · Kickoff
            </span>
          </div>

          {/* 4. Goal Barrier Configurator: Floating Window Spawner */}
          <FloatingWindowCard
            preset={GOAL_BARRIER_CONFIGURATOR_PRESET}
            icon={Shield}
            iconColor="text-sky-500"
            bordered={false}
            showDescription={false}
            hoverTooltip="Training Scope: Spawn the Goal Barrier Configurator floating window to draw custom barrier regions in Free Play, Static Training Pack, and Kickoff Training (automatically bypassed in Exhibition & Multiplayer)."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Configure Free Play rules (boost, goal reset, rewinder) and Training goal barrier. Automatically bypassed in Exhibition & Multiplayer."
        hoveredDescription={hoveredDesc}
        icon={<Info className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
      />
    </PanelContainer>
  );
};
