import React, { useState } from 'react';
import {
  Disc,
  Flame,
  Sparkles,
  Volume2,
  Sun,
  Wand2,
} from 'lucide-react';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { SettingSegmentedRow } from '../../compounds/SettingSegmentedRow';
import { useSettingActionRowStore } from '../../tokens/settingRowStore';

export interface VisualMaterialsConfig {
  ballStyle: 'football' | 'rocket-league';
  demolishedEffect: 'toon' | 'smoke';
  boostVisual: 'cartoon' | 'gold-rush';
  boostAudio: 'rush' | 'standard' | 'flamethrower' | 'plasma';
  boostFlameLuminance: 'balanced' | 'dynamic';
  boostPlumeLuminance: 'min' | 'balanced' | 'dynamic' | 'hdr';
}

export const DEFAULT_VISUAL_MATERIALS: VisualMaterialsConfig = {
  ballStyle: 'football',
  demolishedEffect: 'smoke',
  boostVisual: 'gold-rush',
  boostAudio: 'rush',
  boostFlameLuminance: 'balanced',
  boostPlumeLuminance: 'balanced',
};

export interface MaterialOptionRowProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  onHover: () => void;
  onLeave: () => void;
  isLight?: boolean;
  disabled?: boolean;
}

export const MaterialOptionRow: React.FC<MaterialOptionRowProps> = ({
  label,
  value,
  onChange,
  options,
  onHover,
  onLeave,
  isLight = false,
  disabled = false,
}) => {
  return (
    <div
      className={`flex items-center justify-between w-full py-1.5 px-3 rounded-lg transition-colors select-none ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:bg-neutral-500/10 cursor-pointer'
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <span
        className={`text-xs font-semibold truncate ${
          disabled
            ? 'opacity-60 text-neutral-400'
            : isLight
            ? 'text-neutral-800'
            : 'text-neutral-200'
        }`}
      >
        {label}
      </span>
      <div className="shrink-0 w-64 sm:w-80">
        <SegmentedSwitch
          value={value}
          onValueChange={onChange}
          options={options}
          size="sm"
          fullWidth
          isLight={isLight}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export interface GarageMaterialsTabProps {
  materials?: VisualMaterialsConfig;
  onUpdateMaterials?: (partial: Partial<VisualMaterialsConfig>) => void;
  onHoverDesc?: (text: string | null) => void;
  isLight?: boolean;
}

export const GarageMaterialsTab: React.FC<GarageMaterialsTabProps> = ({
  materials: propMaterials,
  onUpdateMaterials,
  onHoverDesc,
  isLight = false,
}) => {
  const { rowGap } = useSettingActionRowStore();
  const [internalMaterials, setInternalMaterials] = useState<VisualMaterialsConfig>(
    DEFAULT_VISUAL_MATERIALS
  );
  const materials = propMaterials ?? internalMaterials;

  const updateMaterials = (partial: Partial<VisualMaterialsConfig>) => {
    setInternalMaterials((prev) => ({ ...prev, ...partial }));
    onUpdateMaterials?.(partial);
  };

  const setHoveredDesc = (desc: string) => onHoverDesc?.(desc);
  const onLeave = () => onHoverDesc?.(null);

  return (
    <div className="flex flex-col py-1" style={{ gap: `${rowGap}px` }}>
      <SettingSegmentedRow
        icon={Disc}
        iconColor="text-sky-400"
        title="Ball Style"
        value="football"
        onValueChange={() => {}}
        options={[{ value: 'football', label: 'Football' }]}
        disabled={true}
        isLight={isLight}
        onMouseEnter={() =>
          setHoveredDesc('Ball style is locked to the classic geodesic football.')
        }
        onMouseLeave={onLeave}
      />

      <SettingSegmentedRow
        icon={Flame}
        iconColor="text-rose-400"
        title="Demolition Effect"
        value={materials.demolishedEffect}
        onValueChange={(val) =>
          updateMaterials({ demolishedEffect: val as 'toon' | 'smoke' })
        }
        options={[
          { value: 'toon', label: 'Toon' },
          { value: 'smoke', label: 'Smoke' },
        ]}
        isLight={isLight}
        onMouseEnter={() =>
          setHoveredDesc(
            'Selects supersonic collision demolition aesthetic (toon burst vs volumetric smoke plume).'
          )
        }
        onMouseLeave={onLeave}
      />

      <SettingSegmentedRow
        icon={Sparkles}
        iconColor="text-amber-400"
        title="Boost Trail Effect"
        value={materials.boostVisual}
        onValueChange={(val) =>
          updateMaterials({ boostVisual: val as 'cartoon' | 'gold-rush' })
        }
        options={[
          { value: 'cartoon', label: 'Cartoon' },
          { value: 'gold-rush', label: 'Gold Rush' },
        ]}
        isLight={isLight}
        onMouseEnter={() =>
          setHoveredDesc(
            'Selects personal rocket booster particle and trail rendering style (Cartoon vs Gold Rush).'
          )
        }
        onMouseLeave={onLeave}
      />

      <SettingSegmentedRow
        icon={Volume2}
        iconColor="text-emerald-400"
        title="Boosted Audio Effect"
        value={materials.boostAudio}
        onValueChange={(val) =>
          updateMaterials({
            boostAudio: val as 'rush' | 'standard' | 'flamethrower' | 'plasma',
          })
        }
        options={[
          { value: 'rush', label: 'Gold Rush' },
          { value: 'standard', label: 'Standard' },
          { value: 'flamethrower', label: 'Flame Thrower' },
          { value: 'plasma', label: 'Plasma' },
        ]}
        isLight={isLight}
        onMouseEnter={() =>
          setHoveredDesc(
            'Selects personal boost audio preset across ignition, sustain loop, and release phases (Preset All).'
          )
        }
        onMouseLeave={onLeave}
      />

      <SettingSegmentedRow
        icon={Sun}
        iconColor="text-orange-400"
        title="Boost Flame Luminance"
        value={materials.boostFlameLuminance}
        onValueChange={(val) =>
          updateMaterials({
            boostFlameLuminance: val as 'balanced' | 'dynamic',
          })
        }
        options={[
          { value: 'balanced', label: 'Balanced (1.0x)' },
          { value: 'dynamic', label: 'Dynamic Angle' },
        ]}
        disabled={materials.boostVisual !== 'gold-rush'}
        isLight={isLight}
        onMouseEnter={() =>
          setHoveredDesc(
            materials.boostVisual === 'gold-rush'
              ? 'Adjusts vehicle nozzle flame intensity: Balanced steady 1.0x vs original perspective Dynamic.'
              : 'Flame luminance is locked to balanced preset when using Cartoon boost.'
          )
        }
        onMouseLeave={onLeave}
      />

      <SettingSegmentedRow
        icon={Wand2}
        iconColor="text-purple-400"
        title="Gold Rush Plume Luminance"
        value={materials.boostPlumeLuminance}
        onValueChange={(val) =>
          updateMaterials({
            boostPlumeLuminance: val as 'min' | 'balanced' | 'dynamic' | 'hdr',
          })
        }
        options={[
          { value: 'min', label: 'Minimum' },
          { value: 'balanced', label: 'Balanced' },
          { value: 'dynamic', label: 'Dynamic' },
          { value: 'hdr', label: 'Vivid HDR' },
        ]}
        disabled={materials.boostVisual !== 'gold-rush'}
        isLight={isLight}
        onMouseEnter={() =>
          setHoveredDesc(
            materials.boostVisual === 'gold-rush'
              ? 'Adjusts Gold Rush exhaust plume and spark particle luminance: Minimum, Balanced 1.0x, Dynamic angle, or Vivid HDR.'
              : 'Plume luminance is locked to balanced preset when using Cartoon boost.'
          )
        }
        onMouseLeave={onLeave}
      />
    </div>
  );
};
