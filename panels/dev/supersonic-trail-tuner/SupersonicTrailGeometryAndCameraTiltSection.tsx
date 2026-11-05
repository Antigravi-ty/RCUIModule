import React from 'react';
import {
  updateSupersonicTrailConfig,
  type SupersonicTrailConfig,
  type SupersonicTrailOrientationMode,
} from '../../../config/supersonicTrailConfig';
import { SegmentedSwitch } from '../../../primitives/SegmentedSwitch';
import { SliderControl } from '../../../primitives/SliderControl';

export interface SupersonicTrailGeometryAndCameraTiltSectionProps {
  cfg: SupersonicTrailConfig;
  isLight: boolean;
}

export const SupersonicTrailGeometryAndCameraTiltSection: React.FC<
  SupersonicTrailGeometryAndCameraTiltSectionProps
> = ({ cfg, isLight }) => {
  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-900'
    : 'bg-neutral-900/60 border-neutral-700/60 text-neutral-100';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  return (
    <div className={`p-2.5 rounded-xl border flex flex-col gap-2 shrink-0 ${cardBg}`}>
      <span className="font-bold text-[11px] text-purple-400 border-b border-neutral-500/20 pb-1">
        3. Taper Geometry, Surface Lift &amp; View-Adaptive Camera Tilt
      </span>

      <div className="flex flex-col gap-1">
        <span className={`text-[10px] font-semibold ${mutedText}`}>Ribbon Orientation Mode</span>
        <SegmentedSwitch
          value={cfg.orientationMode}
          onValueChange={(val) =>
            updateSupersonicTrailConfig({
              orientationMode: val as SupersonicTrailOrientationMode,
            })
          }
          options={[
            { value: 'surface-aligned', label: 'Adaptive (Hug Near / Stand Far)' },
            { value: 'flat-ground', label: 'Pure Flat Surface' },
            { value: 'camera-facing', label: 'Full Camera Billboard' },
          ]}
          size="sm"
          fullWidth
          isLight={isLight}
        />
      </div>

      {cfg.orientationMode === 'surface-aligned' && (
        <div className="p-2 rounded-lg border border-purple-500/25 bg-purple-500/5 flex flex-col gap-2">
          <SliderControl
            label="Camera-Assisted Tilt Strength"
            description="Rotates ribbon around path tangent when drifting/angled or viewing distant cars, hinging upward from the ground"
            value={cfg.cameraTiltStrength ?? 0.88}
            min={0.0}
            max={1.0}
            step={0.02}
            editable={true}
            onChange={(cameraTiltStrength) =>
              updateSupersonicTrailConfig({ cameraTiltStrength })
            }
            isLight={isLight}
          />

          <SliderControl
            label="Near Ground-Hug Distance"
            description="Within this camera distance, straight-behind view stays flat on the ground"
            value={cfg.tiltNearDistUu ?? 260}
            min={100}
            max={800}
            step={20}
            unit=" UU"
            editable={true}
            onChange={(tiltNearDistUu) => updateSupersonicTrailConfig({ tiltNearDistUu })}
            isLight={isLight}
          />

          <SliderControl
            label="Far Upright Stand Distance"
            description="Beyond this distance, ribbons tilt upright toward camera for clear long-range visibility"
            value={cfg.tiltFarDistUu ?? 1350}
            min={500}
            max={4000}
            step={50}
            unit=" UU"
            editable={true}
            onChange={(tiltFarDistUu) => updateSupersonicTrailConfig({ tiltFarDistUu })}
            isLight={isLight}
          />
        </div>
      )}

      <SliderControl
        label="Head Width (Thick Front)"
        value={cfg.headWidthUu}
        min={2.0}
        max={32.0}
        step={0.5}
        unit=" UU"
        editable={true}
        onChange={(headWidthUu) => updateSupersonicTrailConfig({ headWidthUu })}
        isLight={isLight}
      />

      <SliderControl
        label="Tail Width (Thin Tip)"
        value={cfg.tailWidthUu}
        min={0.0}
        max={16.0}
        step={0.25}
        unit=" UU"
        editable={true}
        onChange={(tailWidthUu) => updateSupersonicTrailConfig({ tailWidthUu })}
        isLight={isLight}
      />

      <SliderControl
        label="Width Taper Exponent"
        value={cfg.widthTaperCurve}
        min={0.3}
        max={3.0}
        step={0.05}
        editable={true}
        onChange={(widthTaperCurve) => updateSupersonicTrailConfig({ widthTaperCurve })}
        isLight={isLight}
      />

      <SliderControl
        label="Overall Trail Opacity"
        value={cfg.opacity}
        min={0.05}
        max={1.0}
        step={0.01}
        editable={true}
        onChange={(opacity) => updateSupersonicTrailConfig({ opacity })}
        isLight={isLight}
      />

      <SliderControl
        label="Alpha Fade-Out Curve"
        value={cfg.fadeCurve}
        min={0.3}
        max={3.0}
        step={0.05}
        editable={true}
        onChange={(fadeCurve) => updateSupersonicTrailConfig({ fadeCurve })}
        isLight={isLight}
      />

      <SliderControl
        label="Surface Normal Lift Offset"
        description="Base offset along contact normal to prevent z-fighting on ground/ramps"
        value={cfg.surfaceLiftUu}
        min={0.2}
        max={10.0}
        step={0.2}
        unit=" UU"
        editable={true}
        onChange={(surfaceLiftUu) => updateSupersonicTrailConfig({ surfaceLiftUu })}
        isLight={isLight}
      />
    </div>
  );
};
