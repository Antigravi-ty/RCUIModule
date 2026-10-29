import React, { useState } from 'react';
import { useLayer3TrainingStoreBinding } from './hooks/useLayer3DetailStoreBindings';
import { Zap, Box, Shield, History, CircleSlash2, Info } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { SettingToggleRow } from '../compounds/SettingToggleRow';
import { FloatingWindowCard } from './settings/components/FloatingWindowCard';
import { useMenuLayoutStore, DEFAULT_PANEL_SIZING } from '../stores/menuLayoutStore';
import type { PanelSizingConfig } from '../stores/menuLayoutStore';
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

export interface Layer3TrainingRecipeProps {
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
 * Streamlined borderless 5-row configuration panel sharing unified Settings row typography & spacing:
 * 1. Boost: Inline SegmentedSwitch (Unlimited | Standard) with colored Zap icon
 * 2. Show Hitbox: ToggleSwitch with colored Box icon
 * 3. Disable Goal Reset: ToggleSwitch with colored CircleSlash2 ('circle-slash-2') icon
 * 4. Goal Barrier Configurator: Single-line FloatingWindowCard spawner with colored Shield icon
 * 5. Rewinder Configurator: Single-line FloatingWindowCard spawner with colored History icon
 */
export const Layer3TrainingRecipe: React.FC<Layer3TrainingRecipeProps> = (rawProps) => {
  const {
  isLight = false,
  onBack,
  sizing: propSizing,
  gameplay: controlledGameplay,
  onUpdateGameplay,
} = useLayer3TrainingStoreBinding(rawProps);
  const storeSizing = useMenuLayoutStore(
    (s) => s.panels?.['layer3-training'] ?? DEFAULT_PANEL_SIZING['layer3-training']
  );
  const sizing = propSizing ?? storeSizing;
  const { rowGap } = useSettingActionRowStore();

  const [internalUnlimitedBoost, setInternalUnlimitedBoost] = useState(true);
  const [internalShowCarHitbox, setInternalShowCarHitbox] = useState(false);
  const [internalGoalRestart, setInternalGoalRestart] = useState(true);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const unlimitedBoost = controlledGameplay?.unlimitedBoost ?? internalUnlimitedBoost;
  const showCarHitbox = Boolean(controlledGameplay?.showCarHitbox ?? internalShowCarHitbox);
  const goalRestart = controlledGameplay?.goalRestart ?? internalGoalRestart;

  const handleSetUnlimitedBoost = (next: boolean) => {
    setInternalUnlimitedBoost(next);
    onUpdateGameplay?.({ unlimitedBoost: next });
  };

  const handleSetShowCarHitbox = (next: boolean) => {
    setInternalShowCarHitbox(next);
    onUpdateGameplay?.({ showCarHitbox: next });
  };

  const handleSetGoalRestart = (next: boolean) => {
    setInternalGoalRestart(next);
    onUpdateGameplay?.({ goalRestart: next });
  };

  const boostValue = unlimitedBoost ? 'unlimited' : 'standard';

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full">
      <PanelHeader title="TRAINING CONFIGURATION" onBack={onBack} isLight={isLight} />

      <PanelContent scrollable>
        <div
          data-layout="training-config-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
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
            hoverDescription="Choose between continuous unlimited boost refill or standard 100% capacity limitation in practice."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 2. Show Hitbox: ToggleSwitch */}
          <SettingToggleRow
            icon={Box}
            iconName="box"
            iconColor="text-emerald-500"
            title="Show Hitbox"
            checked={showCarHitbox}
            onChange={handleSetShowCarHitbox}
            bordered={false}
            showDescription={false}
            hoverDescription="Draws accurate 3D oriented bounding box (OBB) collision wireframe around the vehicle in real time."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 3. Disable Goal Reset: ToggleSwitch with CircleSlash2 ('circle-slash-2') icon */}
          <SettingToggleRow
            icon={CircleSlash2}
            iconName="circle-slash-2"
            iconColor="text-rose-400"
            title="Disable Goal Reset"
            checked={!goalRestart}
            onChange={(disableReset) => handleSetGoalRestart(!disableReset)}
            bordered={false}
            showDescription={false}
            hoverDescription="When enabled, scoring a goal will not trigger goal replay or reset the ball to kickoff, allowing continuous practice."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 4. Goal Barrier Configurator: Floating Window Spawner */}
          <FloatingWindowCard
            preset={GOAL_BARRIER_CONFIGURATOR_PRESET}
            icon={Shield}
            iconColor="text-sky-500"
            bordered={false}
            showDescription={false}
            hoverTooltip="Spawn the Goal Barrier Configurator floating window to draw custom rectangular barrier regions with boolean union/subtraction and native RocketSim collision."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 5. Rewinder Configurator: Floating Window Spawner */}
          <FloatingWindowCard
            preset={REWINDER_CONFIGURATOR_PRESET}
            icon={History}
            iconColor="text-amber-500"
            bordered={false}
            showDescription={false}
            hoverTooltip="Spawn the Rewinder Configurator floating window to record, scrub, rewind, and resume free play state history with hotkeys (O / P / [ / ] / G)."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Configure free play boost rules, hitbox overlay, goal reset, goal barrier, and rewinder."
        hoveredDescription={hoveredDesc}
        icon={<Info className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
      />
    </PanelContainer>
  );
};
