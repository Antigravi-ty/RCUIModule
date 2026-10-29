import React, { useState } from 'react';
import { Car } from 'lucide-react';
import { SliderControl } from '../../primitives/SliderControl';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { CameraSwivelSimulatorCard } from '../../compounds/CameraSwivelSimulatorCard';
import { ReferenceImageOverlayController } from './cards/ReferenceImageOverlayController';
import { FloatingWindowToolbar } from '../FloatingWindowToolbar';

/**
 * 7. [Dev] Vehicle Model Offset & Hitbox Tuner (`vehicle-model-offset-tuner`)
 * Standalone L6 Floating Window Panel — uses L2 `CameraSwivelSimulatorCard` & `ReferenceImageOverlayController`.
 */
export const VehicleModelOffsetTunerFloatingWindow: React.FC<{
  isLight?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}> = React.memo(({ isLight = false, activeTab = 'hitbox-align', onTabChange }) => {
  const [step, setStep] = useState(0.01);
  const [chassisPreset, setChassisPreset] = useState<'octane' | 'dominus' | 'fennec'>('octane');
  const [meshOffsetX, setMeshOffsetX] = useState(0.0);
  const [meshOffsetY, setMeshOffsetY] = useState(-13.88);
  const [meshOffsetZ, setMeshOffsetZ] = useState(-17.0);
  const [frontAxleRadius, setFrontAxleRadius] = useState(12.5);
  const [rearAxleRadius, setRearAxleRadius] = useState(13.5);
  const [suspensionRestLength, setSuspensionRestLength] = useState(38.2);
  const [showBulletBox, setShowBulletBox] = useState(true);
  const [showRefOverlay, setShowRefOverlay] = useState(false);

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      <FloatingWindowToolbar
        title={`Vehicle Hitbox & Wheel Rig Tuner · ${
          activeTab === 'wheel-modifier' ? 'Wheel Modifiers' : 'Hitbox Alignment'
        }`}
        subtitle="Aligns glTF visual chassis to canonical Bullet3 OBB and calibrates 2D reference overlay"
        step={step}
        onStepChange={setStep}
        presets={['Octane Standard', 'Dominus Long', 'Fennec Box']}
        activePreset="Octane Standard"
        onReset={() => {
          setMeshOffsetX(0.0);
          setMeshOffsetY(-13.88);
          setMeshOffsetZ(-17.0);
          setFrontAxleRadius(12.5);
          setRearAxleRadius(13.5);
          setSuspensionRestLength(38.2);
        }}
        isLight={isLight}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedSwitch
          value={chassisPreset}
          onValueChange={(v) => setChassisPreset(v as typeof chassisPreset)}
          options={[
            { value: 'octane', label: 'Octane (118×84×36 UU)' },
            { value: 'dominus', label: 'Dominus (128×83×31 UU)' },
            { value: 'fennec', label: 'Fennec (Octane Spec)' },
          ]}
          size="sm"
          isLight={isLight}
        />

        <div className="flex items-center gap-2">
          <ToggleSwitch
            checked={showRefOverlay}
            onCheckedChange={setShowRefOverlay}
            label="2D Reference Overlay"
            isLight={isLight}
          />
          {onTabChange && (
            <SegmentedSwitch
              value={activeTab}
              onValueChange={onTabChange}
              options={[
                { value: 'hitbox-align', label: 'Hitbox Align' },
                { value: 'wheel-modifier', label: 'Wheel Modifiers' },
              ]}
              size="sm"
              isLight={isLight}
            />
          )}
        </div>
      </div>

      {showRefOverlay && <ReferenceImageOverlayController isLight={isLight} />}

      {activeTab === 'wheel-modifier' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <SliderControl
            label="Front Wheel Radius (UU)"
            value={frontAxleRadius}
            min={8.0}
            max={20.0}
            step={step}
            defaultValue={12.5}
            onChange={setFrontAxleRadius}
            isLight={isLight}
          />
          <SliderControl
            label="Rear Wheel Radius (UU)"
            value={rearAxleRadius}
            min={8.0}
            max={20.0}
            step={step}
            defaultValue={13.5}
            onChange={setRearAxleRadius}
            isLight={isLight}
          />
          <SliderControl
            label="Suspension Rest Travel (UU)"
            value={suspensionRestLength}
            min={20.0}
            max={55.0}
            step={step}
            defaultValue={38.2}
            onChange={setSuspensionRestLength}
            isLight={isLight}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <SliderControl
            label="Mesh Offset X (UU)"
            value={meshOffsetX}
            min={-30}
            max={30}
            step={step}
            defaultValue={0.0}
            onChange={setMeshOffsetX}
            isLight={isLight}
          />
          <SliderControl
            label="Mesh Offset Y (UU)"
            value={meshOffsetY}
            min={-40}
            max={40}
            step={step}
            defaultValue={-13.88}
            onChange={setMeshOffsetY}
            isLight={isLight}
          />
          <SliderControl
            label="Mesh Offset Z (UU)"
            value={meshOffsetZ}
            min={-40}
            max={40}
            step={step}
            defaultValue={-17.0}
            onChange={setMeshOffsetZ}
            isLight={isLight}
          />
        </div>
      )}

      <div
        className={`p-3 rounded-xl border flex items-center justify-between ${
          isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
        }`}
      >
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold flex items-center gap-1.5">
            <Car className="h-3.5 w-3.5 text-sky-500" />
            <span>Overlay Canonical Bullet3 Hitbox Wireframe + CoM Cross</span>
          </span>
          <span className="text-[10px] opacity-65">Draws exact physics collision OBB & wheel raycast contact points</span>
        </div>
        <ToggleSwitch checked={showBulletBox} onChange={setShowBulletBox} ariaLabel="Overlay Hitbox Wireframe" isLight={isLight} />
      </div>

      {/* L4 Camera Swivel & Ground-Clearance Solver Card */}
      <CameraSwivelSimulatorCard isLight={isLight} />
    </div>
  );
});
VehicleModelOffsetTunerFloatingWindow.displayName = 'VehicleModelOffsetTunerFloatingWindow';
