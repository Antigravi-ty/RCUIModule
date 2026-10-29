import React, { useState } from 'react';
import { useLayer4AdvancedAudioStoreBinding } from './hooks/useLayer4StoreBindings';
import { Flame, Disc, Trophy, Speaker } from 'lucide-react';
import { Card } from '../layout/Card';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { SettingSliderRow } from '../compounds/SettingSliderRow';
import { PhaseVariationMatrix, PhaseVariationItem, PhaseVariationSelection, VariationPhaseId, DEFAULT_BOOST_VARIATION_ITEMS } from '../compounds/PhaseVariationMatrix';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';

export const DEFAULT_RUMBLE_VARIATION_ITEMS: PhaseVariationItem[] = [
  { id: 'combustion', label: 'Low Combustion', isDefault: true },
  { id: 'crackle', label: 'Exhaust Crackle' },
  { id: 'afterburner', label: 'Afterburner Pop' },
];

export const AUDIO_VOLUME_GROUPS = [
  { id: 'vehicle-boost', label: 'Vehicle & Boost Turbine Mix', icon: Flame, iconColor: 'text-amber-400' },
  { id: 'ball-arena', label: 'Ball & Arena Collisions Mix', icon: Disc, iconColor: 'text-sky-400' },
  { id: 'stingers-fanfare', label: 'Goal Stingers & Fanfare Mix', icon: Trophy, iconColor: 'text-emerald-400' },
  { id: 'ui-ambient', label: 'UI & Stadium Ambient Mix', icon: Speaker, iconColor: 'text-purple-400' },
] as const;

export interface Layer4AdvancedAudioRecipeProps {
  isLight?: boolean;
  boostSelection?: PhaseVariationSelection;
  defaultBoostSelection?: PhaseVariationSelection;
  rumbleSelection?: PhaseVariationSelection;
  defaultRumbleSelection?: PhaseVariationSelection;
  groupVolumes?: Record<string, number>;
  defaultGroupVolumes?: Record<string, number>;
  onBoostPhaseChange?: (variationId: string, phase: VariationPhaseId) => void;
  onBoostAllChange?: (variationId: string) => void;
  onRumblePhaseChange?: (variationId: string, phase: VariationPhaseId) => void;
  onRumbleAllChange?: (variationId: string) => void;
  onGroupVolumeChange?: (groupId: string, volumePct: number) => void;
  onResetGroupVolumes?: () => void;
  onExportJson?: () => void;
  onChange?: (config: {
    boostSelection: PhaseVariationSelection;
    rumbleSelection: PhaseVariationSelection;
  }) => void;
  onBack?: () => void;
  className?: string;
}

const DEFAULT_GROUP_VOLUMES: Record<string, number> = {
  'vehicle-boost': 100,
  'ball-arena': 100,
  'stingers-fanfare': 100,
  'ui-ambient': 100,
};

export const Layer4AdvancedAudioRecipe: React.FC<Layer4AdvancedAudioRecipeProps> = React.memo((rawProps) => {
  const {
  isLight = true,
  boostSelection: controlledBoostSelection,
  defaultBoostSelection = { start: 'rush', loop: 'rush', end: 'rush' },
  rumbleSelection: controlledRumbleSelection,
  defaultRumbleSelection = {
    start: 'combustion',
    loop: 'combustion',
    end: 'combustion',
  },
  groupVolumes: controlledGroupVolumes,
  defaultGroupVolumes = DEFAULT_GROUP_VOLUMES,
  onBoostPhaseChange,
  onBoostAllChange,
  onRumblePhaseChange,
  onRumbleAllChange,
  onGroupVolumeChange,
  onResetGroupVolumes,
  onExportJson,
  onChange,
  onBack = () => {},
  className = '',
} = useLayer4AdvancedAudioStoreBinding(rawProps);
  const { rowGap } = useSettingActionRowStore();
  const [internalBoostSelection, setInternalBoostSelection] =
    useState<PhaseVariationSelection>(defaultBoostSelection);
  const [internalRumbleSelection, setInternalRumbleSelection] =
    useState<PhaseVariationSelection>(defaultRumbleSelection);
  const [internalGroupVolumes, setInternalGroupVolumes] =
    useState<Record<string, number>>(defaultGroupVolumes);
  const [exportedNotice, setExportedNotice] = useState(false);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const boostSelection = controlledBoostSelection ?? internalBoostSelection;
  const rumbleSelection = controlledRumbleSelection ?? internalRumbleSelection;
  const groupVolumes = controlledGroupVolumes ?? internalGroupVolumes;

  const sizing = useMenuLayoutStore((s) => s.panels['layer4-advanced-audio']);

  const handleBoostPhase = (variationId: string, phase: VariationPhaseId) => {
    const next = { ...boostSelection, [phase]: variationId };
    if (controlledBoostSelection === undefined) setInternalBoostSelection(next);
    onBoostPhaseChange?.(variationId, phase);
    onChange?.({ boostSelection: next, rumbleSelection });
  };

  const handleBoostAll = (variationId: string) => {
    const next = { start: variationId, loop: variationId, end: variationId };
    if (controlledBoostSelection === undefined) setInternalBoostSelection(next);
    onBoostAllChange?.(variationId);
    onChange?.({ boostSelection: next, rumbleSelection });
  };

  const handleRumblePhase = (variationId: string, phase: VariationPhaseId) => {
    const next = { ...rumbleSelection, [phase]: variationId };
    if (controlledRumbleSelection === undefined) setInternalRumbleSelection(next);
    onRumblePhaseChange?.(variationId, phase);
    onChange?.({ boostSelection, rumbleSelection: next });
  };

  const handleRumbleAll = (variationId: string) => {
    const next = { start: variationId, loop: variationId, end: variationId };
    if (controlledRumbleSelection === undefined) setInternalRumbleSelection(next);
    onRumbleAllChange?.(variationId);
    onChange?.({ boostSelection, rumbleSelection: next });
  };

  const handleGroupVolume = (groupId: string, val: number) => {
    if (controlledGroupVolumes === undefined) {
      setInternalGroupVolumes((prev) => ({ ...prev, [groupId]: val }));
    }
    onGroupVolumeChange?.(groupId, val);
  };

  const handleReset100 = () => {
    if (controlledGroupVolumes === undefined) {
      setInternalGroupVolumes(DEFAULT_GROUP_VOLUMES);
    }
    onResetGroupVolumes?.();
  };

  const handleExportJson = () => {
    onExportJson?.();
    setExportedNotice(true);
    setTimeout(() => setExportedNotice(false), 1600);
  };

  return (
    <PanelContainer
      isLight={isLight}
      sizing={sizing}
      className={`w-full select-none ${className}`}
    >
      <PanelHeader
        isLight={isLight}
        title="ADVANCED AUDIO SYNTHESIS POOL"
        onBack={onBack}
      />

      <PanelContent scrollable={true} className="flex flex-col gap-3.5">
        {/* Top Action Bar & 4 Audio Volume Groups (0% - 500%) */}
        <Card isLight={isLight} variant="outlined" className="p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Audio Bus Gain Multipliers (0% – 500%)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportJson}
                onMouseEnter={() => setHoveredDesc('Export active audio bus gains and synthesis pool matrix to JSON.')}
                onMouseLeave={() => setHoveredDesc(null)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider text-amber-500 cursor-pointer"
              >
                {exportedNotice ? 'Copied JSON!' : 'Export JSON'}
              </button>
              <button
                type="button"
                onClick={handleReset100}
                onMouseEnter={() => setHoveredDesc('Reset all 4 audio bus gain multipliers back to unity 100%.')}
                onMouseLeave={() => setHoveredDesc(null)}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                  isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                    : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                }`}
              >
                Reset 100%
              </button>
            </div>
          </div>

          <div className="flex flex-col" style={{ gap: `${rowGap}px` }}>
            {AUDIO_VOLUME_GROUPS.map((grp) => (
              <SettingSliderRow
                key={grp.id}
                icon={grp.icon}
                iconColor={grp.iconColor}
                title={grp.label}
                min={0}
                max={500}
                step={5}
                value={groupVolumes[grp.id] ?? 100}
                onChange={(val) => handleGroupVolume(grp.id, val)}
                unit="%"
                layout="inline"
                developerMode={true}
                editable={true}
                isLight={isLight}
              />
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
          <div
            onMouseEnter={() =>
              setHoveredDesc('Boost Rocket Sample Pool: Assign independent Start, Sustain Loop, and Tail Release variations.')
            }
            onMouseLeave={() => setHoveredDesc(null)}
          >
            <PhaseVariationMatrix
              title="Boost Rocket Sample Pool (4 Sets × 3 Phases)"
              subtitle="Select Ignition Start, Sustain Loop, and Tail Release variations"
              badgeText="4 Sets · M4A"
              variations={DEFAULT_BOOST_VARIATION_ITEMS}
              defaultVariationId="rush"
              selection={boostSelection}
              onSelectPhase={handleBoostPhase}
              onSelectAllPhases={handleBoostAll}
              isLight={isLight}
            />
          </div>

          <div
            onMouseEnter={() =>
              setHoveredDesc('Sub-Harmonic Rumble Pool: Configure low-frequency body resonance layers mixed beneath the turbine loop.')
            }
            onMouseLeave={() => setHoveredDesc(null)}
          >
            <PhaseVariationMatrix
              title="Sub-Harmonic Rumble Pool (3 Sets × 3 Phases)"
              subtitle="Configure low-frequency body resonance layers mixed beneath the turbine loop"
              badgeText="3 Sets · DSP"
              variations={DEFAULT_RUMBLE_VARIATION_ITEMS}
              defaultVariationId="combustion"
              selection={rumbleSelection}
              onSelectPhase={handleRumblePhase}
              onSelectAllPhases={handleRumbleAll}
              isLight={isLight}
            />
          </div>
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Configure 0–500% bus gain multipliers and Start / Loop / End sample variations."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
});

Layer4AdvancedAudioRecipe.displayName = 'Layer4AdvancedAudioRecipe';
