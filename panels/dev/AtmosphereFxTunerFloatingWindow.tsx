import React, { useState } from 'react';
import { SliderControl } from '../../primitives/SliderControl';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { ColorSwatchInput } from '../../compounds/TunerControls';
import { CubicBezierCurveEditor, CubicBezierValue } from '../../charts/CubicBezierCurveEditor';
import { FloatingWindowToolbar } from '../FloatingWindowToolbar';

/**
 * 10. [Dev] Arena Atmosphere, Skybox & Goal Pulse Tuner (`atmosphere-fx-tuner`)
 * Standalone L6 Floating Window Panel — 4 complete sub-tabs (`wall-pulse`, `shadows`, `skybox`, `ball`).
 */
export const AtmosphereFxTunerFloatingWindow: React.FC<{
  isLight?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}> = React.memo(({ isLight = false, activeTab = 'wall-pulse', onTabChange }) => {
  const [step, setStep] = useState(0.01);

  // Wall & Pulse state
  const [pulseWaveSpeed, setPulseWaveSpeed] = useState(2800);
  const [hexWallMaxOpacity, setHexWallMaxOpacity] = useState(0.65);
  const [pulseRingThickness, setPulseRingThickness] = useState(140);
  const [pulseColorBlue, setPulseColorBlue] = useState('#0ea5e9');
  const [pulseColorOrange, setPulseColorOrange] = useState('#f59e0b');
  const [pulseBezier, setPulseBezier] = useState<CubicBezierValue>({
    p1x: 0.22,
    p1y: 1.0,
    p2x: 0.36,
    p2y: 1.0,
  });

  // Shadows state
  const [sunElevationDeg, setSunElevationDeg] = useState(52);
  const [sunAzimuthDeg, setSunAzimuthDeg] = useState(-34);
  const [shadowMapSize, setShadowMapSize] = useState<'2048' | '4096'>('4096');
  const [shadowSoftness, setShadowSoftness] = useState(1.25);
  const [contactAoIntensity, setContactAoIntensity] = useState(0.55);

  // Skybox state
  const [skyZenithColor, setSkyZenithColor] = useState('#0b192c');
  const [skyHorizonColor, setSkyHorizonColor] = useState('#1e3a5f');
  const [lowerHemisphereDarkness, setLowerHemisphereDarkness] = useState(0.82);
  const [cloudDriftSpeed, setCloudDriftSpeed] = useState(0.35);
  const [enableAuxAuroraLayer, setEnableAuxAuroraLayer] = useState(true);

  // Ball (70%) state
  const [globalBallOpacity, setGlobalBallOpacity] = useState(0.7);
  const [seamEmissiveGain, setSeamEmissiveGain] = useState(1.4);
  const [ballFresnelPower, setBallFresnelPower] = useState(2.6);
  const [depthWriteTranslucent, setDepthWriteTranslucent] = useState(true);

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      <FloatingWindowToolbar
        title={`Atmosphere, Wall Pulse & Skybox Tuner · ${activeTab.toUpperCase()}`}
        subtitle="Calibrates wall hex-grid pulse, single-sun shadows, full-sphere skybox & 70% translucent ball"
        step={step}
        onStepChange={setStep}
        presets={['Mannfield Night', 'Champions Field', 'Utopia Dusk']}
        activePreset="Mannfield Night"
        onReset={() => {
          setPulseWaveSpeed(2800);
          setHexWallMaxOpacity(0.65);
          setSunElevationDeg(52);
          setGlobalBallOpacity(0.7);
        }}
        isLight={isLight}
      />

      {onTabChange && (
        <SegmentedSwitch
          value={activeTab}
          onValueChange={onTabChange}
          options={[
            { value: 'wall-pulse', label: 'Wall & Pulse' },
            { value: 'shadows', label: 'Shadows' },
            { value: 'skybox', label: 'Skybox' },
            { value: 'ball', label: 'Ball (70%)' },
          ]}
          size="sm"
          isLight={isLight}
        />
      )}

      {activeTab === 'wall-pulse' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <SliderControl
              label="Goal Pulse Wave Speed (UU/s)"
              value={pulseWaveSpeed}
              min={800}
              max={6000}
              step={50}
              defaultValue={2800}
              onChange={setPulseWaveSpeed}
              isLight={isLight}
            />
            <SliderControl
              label="Wall Hex Peak Opacity"
              value={hexWallMaxOpacity}
              min={0.1}
              max={1.0}
              step={step}
              defaultValue={0.65}
              onChange={setHexWallMaxOpacity}
              isLight={isLight}
            />
            <SliderControl
              label="Pulse Wavefront Width (UU)"
              value={pulseRingThickness}
              min={40}
              max={400}
              step={10}
              defaultValue={140}
              onChange={setPulseRingThickness}
              isLight={isLight}
            />
            <div className="grid grid-cols-2 gap-2">
              <ColorSwatchInput
                label="Blue Pulse Tint"
                value={pulseColorBlue}
                onChange={setPulseColorBlue}
                presets={['#0ea5e9', '#38bdf8', '#2563eb', '#06b6d4']}
                isLight={isLight}
              />
              <ColorSwatchInput
                label="Orange Pulse Tint"
                value={pulseColorOrange}
                onChange={setPulseColorOrange}
                presets={['#f59e0b', '#fb923c', '#ef4444', '#eab308']}
                isLight={isLight}
              />
            </div>
          </div>

          <CubicBezierCurveEditor
            title="Goal Pulse Two-Stage Fade-Out Envelope"
            p1x={pulseBezier.p1x}
            p1y={pulseBezier.p1y}
            p2x={pulseBezier.p2x}
            p2y={pulseBezier.p2y}
            onChange={setPulseBezier}
            isLight={isLight}
          />
        </>
      )}

      {activeTab === 'shadows' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <SliderControl
            label="Sun Elevation Angle (°)"
            value={sunElevationDeg}
            min={15}
            max={88}
            step={1}
            defaultValue={52}
            onChange={setSunElevationDeg}
            isLight={isLight}
          />
          <SliderControl
            label="Sun Azimuth Angle (°)"
            value={sunAzimuthDeg}
            min={-180}
            max={180}
            step={1}
            defaultValue={-34}
            onChange={setSunAzimuthDeg}
            isLight={isLight}
          />
          <SliderControl
            label="PCF Penumbra Softness"
            value={shadowSoftness}
            min={0.2}
            max={4.0}
            step={step}
            defaultValue={1.25}
            onChange={setShadowSoftness}
            isLight={isLight}
          />
          <SliderControl
            label="Under-Chassis Contact AO"
            value={contactAoIntensity}
            min={0.0}
            max={1.0}
            step={step}
            defaultValue={0.55}
            onChange={setContactAoIntensity}
            isLight={isLight}
          />
          <div className="md:col-span-2 flex items-center justify-between p-2.5 rounded-xl border border-neutral-500/20">
            <span className="font-semibold">Cascaded Shadow Map Resolution</span>
            <SegmentedSwitch
              size="sm"
              value={shadowMapSize}
              onValueChange={(v) => setShadowMapSize(v as '2048' | '4096')}
              options={[
                { value: '2048', label: '2048² (Balanced)' },
                { value: '4096', label: '4096² (Ultra Sharp)' },
              ]}
              isLight={isLight}
            />
          </div>
        </div>
      )}

      {activeTab === 'skybox' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <ColorSwatchInput
            label="Zenith Dome Color"
            value={skyZenithColor}
            onChange={setSkyZenithColor}
            presets={['#0b192c', '#090d16', '#1e1b4b', '#162447']}
            isLight={isLight}
          />
          <ColorSwatchInput
            label="Horizon Haze Color"
            value={skyHorizonColor}
            onChange={setSkyHorizonColor}
            presets={['#1e3a5f', '#312e81', '#0f766e', '#7c2d12']}
            isLight={isLight}
          />
          <SliderControl
            label="Lower Hemisphere Ground Falloff"
            value={lowerHemisphereDarkness}
            min={0.1}
            max={1.0}
            step={step}
            defaultValue={0.82}
            onChange={setLowerHemisphereDarkness}
            isLight={isLight}
          />
          <SliderControl
            label="Procedural Cloud Drift Rate"
            value={cloudDriftSpeed}
            min={0.0}
            max={2.0}
            step={step}
            defaultValue={0.35}
            onChange={setCloudDriftSpeed}
            isLight={isLight}
          />
          <div className="md:col-span-2 flex items-center justify-between p-2.5 rounded-xl border border-neutral-500/20">
            <div className="flex flex-col">
              <span className="font-semibold">Auxiliary Upper-Dome Aurora Ribbon</span>
              <span className="text-[10px] opacity-65">Subtle volumetric rim glow above stadium roof</span>
            </div>
            <ToggleSwitch checked={enableAuxAuroraLayer} onChange={setEnableAuxAuroraLayer} isLight={isLight} />
          </div>
        </div>
      )}

      {activeTab === 'ball' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <SliderControl
            label="Global Ball Shell Opacity"
            description="Default 0.70 (70%) so car behind ball remains visible"
            value={globalBallOpacity}
            min={0.15}
            max={1.0}
            step={0.05}
            defaultValue={0.7}
            onChange={setGlobalBallOpacity}
            isLight={isLight}
          />
          <SliderControl
            label="Panel Seam Emissive Gain"
            value={seamEmissiveGain}
            min={0.2}
            max={4.0}
            step={step}
            defaultValue={1.4}
            onChange={setSeamEmissiveGain}
            isLight={isLight}
          />
          <SliderControl
            label="Rim Fresnel Highlight Power"
            value={ballFresnelPower}
            min={0.5}
            max={6.0}
            step={step}
            defaultValue={2.6}
            onChange={setBallFresnelPower}
            isLight={isLight}
          />
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-500/20">
            <div className="flex flex-col">
              <span className="font-semibold">Two-Pass Backface Depth Sorting</span>
              <span className="text-[10px] opacity-65">Eliminates translucent self-overlap artifacts</span>
            </div>
            <ToggleSwitch checked={depthWriteTranslucent} onChange={setDepthWriteTranslucent} isLight={isLight} />
          </div>
        </div>
      )}
    </div>
  );
});
AtmosphereFxTunerFloatingWindow.displayName = 'AtmosphereFxTunerFloatingWindow';
