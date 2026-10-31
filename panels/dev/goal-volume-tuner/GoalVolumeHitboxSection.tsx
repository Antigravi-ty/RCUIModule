import React from 'react';
import { Eye, Layers } from 'lucide-react';
import { SegmentedSwitch } from '../../../primitives/SegmentedSwitch';
import { ToggleSwitch } from '../../../primitives/ToggleSwitch';
import { SliderControl } from '../../../primitives/SliderControl';
import {
  updateGoalVolumeTunerConfig,
} from '../../../config/goalVolumeTunerConfig.js';

export type GoalBoxBounds = Record<string, any>;
export type GoalVolumeTunerConfig = Record<string, any>;

export type PresetTab = 'standard' | 'throwback';

export interface GoalVolumeHitboxSectionProps {
  cfg: GoalVolumeTunerConfig;
  stadiumPreset: string;
  selectedPreset: PresetTab;
  setSelectedPreset: (val: PresetTab) => void;
  currentBox: GoalBoxBounds;
  applyBoxPatch: (patch: Partial<GoalBoxBounds>) => void;
  r: number;
  triggerHalfWidthX: number;
  triggerMinY: number;
  triggerMaxY: number;
  triggerMaxZ: number;
  isLight: boolean;
  cardBg: string;
  mutedText: string;
}

export const GoalVolumeHitboxSection: React.FC<GoalVolumeHitboxSectionProps> = ({
  cfg,
  stadiumPreset,
  selectedPreset,
  setSelectedPreset,
  currentBox,
  applyBoxPatch,
  r,
  triggerHalfWidthX,
  triggerMinY,
  triggerMaxY,
  triggerMaxZ,
  isLight,
  cardBg,
  mutedText,
}) => (
  <>
          {/* 3D Hitbox Overlay Visibility Toggle (Default OFF) */}
          <div className={`p-2.5 rounded-xl border flex items-center justify-between shrink-0 ${cardBg}`}>
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <Eye className="h-4 w-4 text-sky-400 shrink-0" />
              <div className="flex flex-col leading-snug min-w-0">
                <span className="font-semibold text-xs truncate">
                  Show 3D Goal Volume Hitbox Overlay
                </span>
                <span className={`text-[10px] mt-0.5 truncate ${mutedText}`}>
                  Renders outer Goal Volume Box + inner Ball-Center Trigger Box for Blue &amp; Orange goals
                </span>
              </div>
            </div>
            <ToggleSwitch
              checked={Boolean(cfg.showHitboxVisual)}
              onCheckedChange={(checked) => updateGoalVolumeTunerConfig({ showHitboxVisual: checked })}
              isLight={isLight}
            />
          </div>

          {/* Arena Preset Selector */}
          <div className={`p-2.5 rounded-xl border flex flex-col gap-2 shrink-0 ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-semibold text-xs">Target Stadium Preset</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                Active Arena: {stadiumPreset.toUpperCase()}
              </span>
            </div>

            <SegmentedSwitch
              value={selectedPreset}
              onValueChange={(val) => setSelectedPreset(val as PresetTab)}
              options={[
                { value: 'standard', label: 'Standard Soccar (5120)' },
                { value: 'throwback', label: 'Throwback Stadium (4922)' },
              ]}
              size="sm"
              fullWidth
              isLight={isLight}
            />
          </div>

          {/* Dimension Sliders */}
          <div className={`p-2.5 rounded-xl border flex flex-col gap-2.5 shrink-0 ${cardBg}`}>
            <SliderControl
              label="Goal Half-Width X (halfWidthX)"
              description="Half-width of goal aperture from center X=0 (UU)"
              value={currentBox.halfWidthX}
              min={700}
              max={1200}
              step={0.5}
              editable={true}
              onChange={(val) => applyBoxPatch({ halfWidthX: val })}
              isLight={isLight}
            />

            <SliderControl
              label="Goal Line Plane Y (minY)"
              description="Front goal line plane distance from center Y=0 (UU)"
              value={currentBox.minY}
              min={4500}
              max={5400}
              step={0.5}
              editable={true}
              onChange={(val) => applyBoxPatch({ minY: val })}
              isLight={isLight}
            />

            <SliderControl
              label="Goal Back Plane Y (maxY)"
              description="Rear depth plane of the rectangular scoring volume (UU)"
              value={currentBox.maxY}
              min={5100}
              max={6200}
              step={1.0}
              editable={true}
              onChange={(val) => applyBoxPatch({ maxY: val })}
              isLight={isLight}
            />

            <SliderControl
              label="Crossbar Ceiling Height Z (maxZ)"
              description="Goal ceiling height from floor Z=0 (UU)"
              value={currentBox.maxZ}
              min={450}
              max={850}
              step={0.5}
              editable={true}
              onChange={(val) => applyBoxPatch({ maxZ: val })}
              isLight={isLight}
            />
          </div>

          {/* Computed Ball-Center Trigger Readout */}
          <div className={`p-2.5 rounded-xl border font-mono text-[10px] leading-relaxed shrink-0 ${cardBg}`}>
            <div className="font-sans font-bold text-[11px] mb-1">
              Computed Ball-Center Trigger Bounds (R = {r} UU)
            </div>
            <div>• Outer Volume X: ±{currentBox.halfWidthX.toFixed(2)} UU | Y: [{currentBox.minY.toFixed(2)}, {currentBox.maxY.toFixed(2)}] | Z: [0, {currentBox.maxZ.toFixed(2)}]</div>
            <div>• Trigger Center X: ±{triggerHalfWidthX.toFixed(2)} UU | Y: [{triggerMinY.toFixed(2)}, {triggerMaxY.toFixed(2)}] | Z: [0, {triggerMaxZ.toFixed(2)}]</div>
          </div>
  </>
);
