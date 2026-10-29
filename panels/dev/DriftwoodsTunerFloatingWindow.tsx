import React, { useState } from 'react';
import { SliderControl } from '../../primitives/SliderControl';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { ColorSwatchInput, UVTransformControl, UVTransformState } from '../../compounds/TunerControls';
import { OklchPerceptualPaletteLinker } from './cards/OklchPerceptualPaletteLinker';
import { FloatingWindowToolbar } from '../FloatingWindowToolbar';

/**
 * 19. [Dev] Driftwoods Arena PBR & Grass Tuner (`driftwoods-tuner`)
 * Standalone L6 Floating Window Panel — uses L2 `OklchPerceptualPaletteLinker`.
 */
export const DriftwoodsTunerFloatingWindow: React.FC<{
  isLight?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}> = React.memo(({ isLight = false, activeTab = 'ground', onTabChange }) => {
  const [step, setStep] = useState(0.01);
  const [grassBladeHeight, setGrassBladeHeight] = useState(14.5);
  const [mowingStripeContrast, setMowingStripeContrast] = useState(0.22);
  const [groundRoughness, setGroundRoughness] = useState(0.78);
  const [grassAlbedo, setGrassAlbedo] = useState('#2b5c34');
  const [uvState, setUvState] = useState<UVTransformState>({
    scaleX: 16,
    scaleY: 24,
    offsetX: 0,
    offsetY: 0,
    linkScale: false,
  });
  const [glassWallOpacity, setGlassWallOpacity] = useState(0.18);
  const [anisotropySamples, setAnisotropySamples] = useState(8);

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      <FloatingWindowToolbar
        title={`Driftwoods Arena PBR & OKLCH Tuner · ${activeTab.toUpperCase()}`}
        subtitle="Tunes OKLCH perceptual palette harmony, turf mowing stripes, and glass wall shaders"
        step={step}
        onStepChange={setStep}
        presets={['Driftwoods Daylight', 'Dusk Golden', 'Tournament High-FPS']}
        activePreset="Driftwoods Daylight"
        onReset={() => {
          setGrassBladeHeight(14.5);
          setMowingStripeContrast(0.22);
          setGroundRoughness(0.78);
          setGlassWallOpacity(0.18);
          setAnisotropySamples(8);
        }}
        isLight={isLight}
      />

      {onTabChange && (
        <SegmentedSwitch
          value={activeTab}
          onValueChange={onTabChange}
          options={[
            { value: 'ground', label: 'Ground & Grass' },
            { value: 'surfaces', label: 'Surfaces' },
            { value: 'transparent', label: 'Transparent' },
            { value: 'performance', label: 'Performance' },
          ]}
          size="sm"
          isLight={isLight}
        />
      )}

      {activeTab === 'ground' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <SliderControl
              label="Grass Blade Shell Height (UU)"
              value={grassBladeHeight}
              min={2}
              max={30}
              step={step}
              defaultValue={14.5}
              onChange={setGrassBladeHeight}
              isLight={isLight}
            />
            <SliderControl
              label="Mowing Stripe Albedo Contrast"
              value={mowingStripeContrast}
              min={0}
              max={0.6}
              step={step}
              defaultValue={0.22}
              onChange={setMowingStripeContrast}
              isLight={isLight}
            />
            <SliderControl
              label="Turf Micro-Roughness"
              value={groundRoughness}
              min={0.1}
              max={1.0}
              step={step}
              defaultValue={0.78}
              onChange={setGroundRoughness}
              isLight={isLight}
            />
            <ColorSwatchInput
              label="Turf Base Albedo"
              value={grassAlbedo}
              onChange={setGrassAlbedo}
              presets={['#2b5c34', '#1f4d2b', '#366938', '#426b2c', '#1b3b2b']}
              isLight={isLight}
            />
          </div>
          <UVTransformControl
            title="Pitch Turf Tiling & Stripe UV Matrix"
            value={uvState}
            onChange={(patch) => setUvState((prev) => ({ ...prev, ...patch }))}
            isLight={isLight}
          />
        </>
      )}

      {activeTab === 'surfaces' && (
        <OklchPerceptualPaletteLinker isLight={isLight} />
      )}

      {activeTab === 'transparent' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <SliderControl
            label="Arena Glass Wall Opacity"
            value={glassWallOpacity}
            min={0.02}
            max={0.6}
            step={step}
            defaultValue={0.18}
            onChange={setGlassWallOpacity}
            isLight={isLight}
          />
          <SliderControl
            label="Curved Corner Fresnel Power"
            value={groundRoughness}
            min={0.5}
            max={5.0}
            step={step}
            defaultValue={2.4}
            onChange={setGroundRoughness}
            isLight={isLight}
          />
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <SliderControl
            label="Anisotropic Filtering Samples"
            value={anisotropySamples}
            min={1}
            max={16}
            step={1}
            defaultValue={8}
            onChange={setAnisotropySamples}
            isLight={isLight}
          />
          <SliderControl
            label="Shadow Map Cascade Split"
            value={mowingStripeContrast}
            min={0.1}
            max={0.9}
            step={step}
            defaultValue={0.5}
            onChange={setMowingStripeContrast}
            isLight={isLight}
          />
        </div>
      )}
    </div>
  );
});
DriftwoodsTunerFloatingWindow.displayName = 'DriftwoodsTunerFloatingWindow';
