import React, { useState } from 'react';
import { SliderControl } from '../../primitives/SliderControl';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { ColorSwatchInput } from '../../compounds/TunerControls';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { FloatingWindowToolbar } from '../FloatingWindowToolbar';

/**
 * 8. [Dev] Vehicle Global FX & PBR Surface Tuner (`vehicle-global-fx-tuner`)
 * Standalone L6 Floating Window Panel — 3 complete sub-tabs (`surfaces`, `lamps-brake`, `boost-bloom`).
 */
export const VehicleGlobalFxTunerFloatingWindow: React.FC<{
  isLight?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}> = React.memo(({ isLight = false, activeTab = 'surfaces', onTabChange }) => {
  const [step, setStep] = useState(0.01);

  // Surfaces state
  const [clearcoatRoughness, setClearcoatRoughness] = useState(0.14);
  const [metallicFlake, setMetallicFlake] = useState(0.82);
  const [anodizedRimContrast, setAnodizedRimContrast] = useState(0.64);
  const [primaryPaintSwatch, setPrimaryPaintSwatch] = useState('#0ea5e9');

  // Lamps & Brake state
  const [brakeEmissiveGain, setBrakeEmissiveGain] = useState(3.4);
  const [headlampConeIntensity, setHeadlampConeIntensity] = useState(1.8);
  const [brakeColorSwatch, setBrakeColorSwatch] = useState('#ef4444');
  const [forceTestBraking, setForceTestBraking] = useState(false);

  // Boost & Bloom state
  const [boostPlumeScale, setBoostPlumeScale] = useState(1.25);
  const [bloomThreshold, setBloomThreshold] = useState(0.85);
  const [supersonicTrailWidth, setSupersonicTrailWidth] = useState(18.0);
  const [flameColorSwatch, setFlameColorSwatch] = useState('#f59e0b');
  const [forceTestBoost, setForceTestBoost] = useState(true);

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      <FloatingWindowToolbar
        title={`Vehicle PBR Surface, Lamps & Boost Bloom · ${activeTab.toUpperCase()}`}
        subtitle="Calibrates clearcoat paint, brake tail-lamp emissive nits, and boost plume bloom"
        step={step}
        onStepChange={setStep}
        presets={['Anodized Pearl', 'Matte Carbon', 'RLCS Broadcast']}
        activePreset="Anodized Pearl"
        onReset={() => {
          setClearcoatRoughness(0.14);
          setMetallicFlake(0.82);
          setBrakeEmissiveGain(3.4);
          setBoostPlumeScale(1.25);
        }}
        isLight={isLight}
      />

      {onTabChange && (
        <SegmentedSwitch
          value={activeTab}
          onValueChange={onTabChange}
          options={[
            { value: 'surfaces', label: 'Surfaces' },
            { value: 'lamps-brake', label: 'Lamps & Brake' },
            { value: 'boost-bloom', label: 'Boost & Bloom' },
          ]}
          size="sm"
          isLight={isLight}
        />
      )}

      {activeTab === 'surfaces' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <SliderControl
            label="Clearcoat Top-Layer Roughness"
            value={clearcoatRoughness}
            min={0.01}
            max={1.0}
            step={step}
            defaultValue={0.14}
            onChange={setClearcoatRoughness}
            isLight={isLight}
          />
          <SliderControl
            label="Metallic Flake Specular"
            value={metallicFlake}
            min={0.0}
            max={1.0}
            step={step}
            defaultValue={0.82}
            onChange={setMetallicFlake}
            isLight={isLight}
          />
          <SliderControl
            label="Chassis Fresnel Rim Contrast"
            value={anodizedRimContrast}
            min={0.0}
            max={1.5}
            step={step}
            defaultValue={0.64}
            onChange={setAnodizedRimContrast}
            isLight={isLight}
          />
          <ColorSwatchInput
            label="Primary Team Coat Albedo"
            value={primaryPaintSwatch}
            onChange={setPrimaryPaintSwatch}
            presets={['#0ea5e9', '#2563eb', '#10b981', '#f59e0b', '#f43f5e', '#a855f7']}
            isLight={isLight}
          />
        </div>
      )}

      {activeTab === 'lamps-brake' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <SliderControl
            label="Brake Tail-Lamp Emissive Gain"
            value={brakeEmissiveGain}
            min={0.5}
            max={8.0}
            step={step}
            defaultValue={3.4}
            onChange={setBrakeEmissiveGain}
            isLight={isLight}
          />
          <SliderControl
            label="Front Headlamp Emissive Gain"
            value={headlampConeIntensity}
            min={0.0}
            max={5.0}
            step={step}
            defaultValue={1.8}
            onChange={setHeadlampConeIntensity}
            isLight={isLight}
          />
          <ColorSwatchInput
            label="Tail-Lamp Emissive Tint"
            value={brakeColorSwatch}
            onChange={setBrakeColorSwatch}
            presets={['#ef4444', '#f97316', '#f43f5e', '#ec4899']}
            isLight={isLight}
          />
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-500/20">
            <div className="flex flex-col">
              <span className="font-semibold">Force Brake Lamp Preview (S Key)</span>
              <span className="text-[10px] opacity-65">Keep brake lights lit continuously in garage/arena</span>
            </div>
            <ToggleSwitch checked={forceTestBraking} onChange={setForceTestBraking} isLight={isLight} />
          </div>
        </div>
      )}

      {activeTab === 'boost-bloom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <SliderControl
            label="Nozzle Exhaust Plume Scale"
            value={boostPlumeScale}
            min={0.4}
            max={2.5}
            step={step}
            defaultValue={1.25}
            onChange={setBoostPlumeScale}
            isLight={isLight}
          />
          <SliderControl
            label="HDR Bloom Luminance Knee"
            value={bloomThreshold}
            min={0.2}
            max={2.0}
            step={step}
            defaultValue={0.85}
            onChange={setBloomThreshold}
            isLight={isLight}
          />
          <SliderControl
            label="Supersonic Wheel Trail Width (UU)"
            value={supersonicTrailWidth}
            min={6.0}
            max={36.0}
            step={0.5}
            defaultValue={18.0}
            onChange={setSupersonicTrailWidth}
            isLight={isLight}
          />
          <ColorSwatchInput
            label="Exhaust Core Flame Tint"
            value={flameColorSwatch}
            onChange={setFlameColorSwatch}
            presets={['#f59e0b', '#38bdf8', '#10b981', '#a855f7', '#f43f5e']}
            isLight={isLight}
          />
          <div className="md:col-span-2 flex items-center justify-between p-2.5 rounded-xl border border-neutral-500/20">
            <div className="flex flex-col">
              <span className="font-semibold">Continuous Boost Plume Test Bench</span>
              <span className="text-[10px] opacity-65">Emit full 120Hz exhaust particles while stationary</span>
            </div>
            <ToggleSwitch checked={forceTestBoost} onChange={setForceTestBoost} isLight={isLight} />
          </div>
        </div>
      )}
    </div>
  );
});
VehicleGlobalFxTunerFloatingWindow.displayName = 'VehicleGlobalFxTunerFloatingWindow';
