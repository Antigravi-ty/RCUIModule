import React, { useState } from 'react';
import {
  FolderOpen,
  Image as ImageIcon,
  Link2,
  Unlink2,
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { SliderControl } from '../../../primitives/SliderControl';
import { ToggleSwitch } from '../../../primitives/ToggleSwitch';
import { quickNotification } from '../../../stores/quickNotificationStore';

export interface ReferenceOverlaySample {
  name: string;
  resolution: string;
}

export interface ReferenceImageOverlayControllerProps {
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  isLight?: boolean;
}

const SAMPLE_REFERENCE_IMAGES: ReferenceOverlaySample[] = [
  { name: 'octane_side_ortho_1080p.png', resolution: '1920x1080' },
  { name: 'octane_top_hitbox_1080p.png', resolution: '1920x1080' },
  { name: 'fennec_wheel_hub_1440p.png', resolution: '2560x1440' },
  { name: 'insidio_rear_nozzle_1440p.png', resolution: '2560x1440' },
];

/**
 * [L2 Compound] ReferenceImageOverlayController
 * Recreates RocketCompanion's ReferenceOverlayCard + HitboxReferenceOverlayLayer controls
 * inside VehicleModelOffsetTunerFloatingWindow.
 */
export const ReferenceImageOverlayController: React.FC<ReferenceImageOverlayControllerProps> = React.memo(({
  enabled: propEnabled,
  onEnabledChange,
  isLight = false,
}) => {
  const [localEnabled, setLocalEnabled] = useState(false);
  const [resFilter, setResFilter] = useState<'ALL' | '1920x1080' | '2560x1440'>('ALL');
  const [activeIdx, setActiveIdx] = useState(0);
  const [opacity, setOpacity] = useState(0.55);
  const [lockScale, setLockScale] = useState(true);
  const [scaleX, setScaleX] = useState(1.0);
  const [scaleY, setScaleY] = useState(1.0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [invertImage, setInvertImage] = useState(false);

  const enabled = propEnabled ?? localEnabled;

  const filtered = SAMPLE_REFERENCE_IMAGES.filter(
    (img) => resFilter === 'ALL' || img.resolution === resFilter
  );
  const currentImg = filtered[activeIdx % Math.max(1, filtered.length)] || SAMPLE_REFERENCE_IMAGES[0];

  const handleScaleX = (v: number) => {
    setScaleX(v);
    if (lockScale) setScaleY(v);
  };

  const handleScaleY = (v: number) => {
    setScaleY(v);
    if (lockScale) setScaleX(v);
  };

  const handleReset = () => {
    setOpacity(0.55);
    setScaleX(1.0);
    setScaleY(1.0);
    setOffsetX(0);
    setOffsetY(0);
    setInvertImage(false);
    quickNotification.show('Reset reference overlay alignment profile.');
  };

  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
    : 'bg-neutral-900/60 border-neutral-800 text-neutral-200';
  const subBg = isLight
    ? 'bg-white border-neutral-200'
    : 'bg-neutral-950/70 border-neutral-800';

  return (
    <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${cardBg}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-sky-400" />
          <span className="font-bold text-[11px]">
            0. Reference Image Folder Overlay &amp; Calibration (z-[4])
          </span>
        </div>
        <ToggleSwitch
          checked={enabled}
          onCheckedChange={(v) => {
            setLocalEnabled(v);
            onEnabledChange?.(v);
          }}
          label={enabled ? 'Overlay Active' : 'Overlay Off'}
          isLight={isLight}
        />
      </div>

      {/* Folder Selector + Resolution Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              quickNotification.info('Loaded 4 reference calibration screenshots from /ref_captures.')
            }
            data-footer-desc="Select a local folder of PNG/WebP vehicle reference captures for 1:1 hitbox overlay alignment."
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer ${subBg}`}
          >
            <FolderOpen className="h-3 w-3 text-amber-500" />
            <span>ref_captures/ ({SAMPLE_REFERENCE_IMAGES.length})</span>
          </button>

          {(['ALL', '1920x1080', '2560x1440'] as const).map((res) => (
            <button
              key={res}
              type="button"
              onClick={() => {
                setResFilter(res);
                setActiveIdx(0);
              }}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono cursor-pointer transition-colors ${
                resFilter === res
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 font-bold'
                  : isLight
                  ? 'bg-white border-neutral-200 text-neutral-500'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400'
              }`}
            >
              {res}
            </button>
          ))}
        </div>

        {/* Image Stepper */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setActiveIdx((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length))
            }
            className={`p-1 rounded-lg border cursor-pointer ${subBg}`}
            title="Previous Reference Image"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span className="px-2 py-0.5 text-[10px] font-mono truncate max-w-[170px]">
            {currentImg.name}
          </span>
          <button
            type="button"
            onClick={() => setActiveIdx((i) => (i + 1) % Math.max(1, filtered.length))}
            className={`p-1 rounded-lg border cursor-pointer ${subBg}`}
            title="Next Reference Image"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Transform Controls */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${subBg}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono opacity-70">
            Profile [{currentImg.resolution}] · Scale({scaleX.toFixed(2)}, {scaleY.toFixed(2)}) · Offset({offsetX}, {offsetY}px)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLockScale((v) => !v)}
              className={`px-2 py-0.5 rounded border text-[10px] font-mono flex items-center gap-1 cursor-pointer ${
                lockScale
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/35'
                  : 'border-neutral-300 dark:border-neutral-700 text-neutral-400'
              }`}
              title="Lock Aspect Ratio ScaleX = ScaleY"
            >
              {lockScale ? <Link2 className="h-2.5 w-2.5" /> : <Unlink2 className="h-2.5 w-2.5" />}
              <span>{lockScale ? '1:1 Locked' : 'Unlinked'}</span>
            </button>
            <ToggleSwitch
              checked={invertImage}
              onCheckedChange={setInvertImage}
              label="Invert"
              isLight={isLight}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <SliderControl
            label="Overlay Opacity"
            value={opacity}
            min={0.05}
            max={1.0}
            step={0.05}
            editable
            colorScheme="sky"
            onChange={setOpacity}
            isLight={isLight}
          />
          <SliderControl
            label="Scale X"
            value={scaleX}
            min={0.25}
            max={2.5}
            step={0.01}
            editable
            colorScheme="amber"
            onChange={handleScaleX}
            isLight={isLight}
          />
          <SliderControl
            label="Scale Y"
            value={scaleY}
            min={0.25}
            max={2.5}
            step={0.01}
            editable
            colorScheme="amber"
            onChange={handleScaleY}
            isLight={isLight}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <SliderControl
            label="Screen Offset X (px)"
            value={offsetX}
            min={-400}
            max={400}
            step={1}
            unit="px"
            editable
            colorScheme="emerald"
            onChange={setOffsetX}
            isLight={isLight}
          />
          <SliderControl
            label="Screen Offset Y (px)"
            value={offsetY}
            min={-300}
            max={300}
            step={1}
            unit="px"
            editable
            colorScheme="emerald"
            onChange={setOffsetY}
            isLight={isLight}
          />
        </div>

        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-neutral-200/60 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => quickNotification.info('Copied reference overlay profile JSON.')}
            className="px-2 py-0.5 rounded border text-[10px] font-mono flex items-center gap-1 cursor-pointer border-neutral-300 dark:border-neutral-700 hover:text-sky-400"
          >
            <Copy className="h-2.5 w-2.5" /> Copy Profile JSON
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-2 py-0.5 rounded border text-[10px] font-mono flex items-center gap-1 cursor-pointer border-neutral-300 dark:border-neutral-700 hover:text-rose-400"
          >
            <RotateCcw className="h-2.5 w-2.5" /> Reset Profile
          </button>
        </div>
      </div>
    </div>
  );
});

ReferenceImageOverlayController.displayName = 'ReferenceImageOverlayController';
