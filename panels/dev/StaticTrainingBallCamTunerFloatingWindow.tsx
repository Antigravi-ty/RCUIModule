import React, { useState } from 'react';
import { Camera, Eye, Download, Copy, Check, RotateCcw, ArrowLeftRight } from 'lucide-react';
import { SliderControl } from '../../primitives/SliderControl';
import { quickNotification } from '../../tokens/quickNotificationStore';

/**
 * 2. [Dev] Static Training Ball Cam Tuner (`static-training-ball-cam-tuner`)
 * Standalone L6 Floating Window Panel — Relative Ball Camera + Edit-Mode Ball Opacity Override.
 */
export const StaticTrainingBallCamTunerFloatingWindow: React.FC<{ isLight?: boolean }> = React.memo(({ isLight = false }) => {
  const [distance, setDistance] = useState(320);
  const [height, setHeight] = useState(110);
  const [angle, setAngle] = useState(-6.5);
  const [lateralOffset, setLateralOffset] = useState(85);
  const [editBallOpacity, setEditBallOpacity] = useState(0.7);
  const [enableEditOpacityOverride, setEnableEditOpacityOverride] = useState(true);
  const [copied, setCopied] = useState(false);

  const resetDefaults = () => {
    setDistance(320);
    setHeight(110);
    setAngle(-6.5);
    setLateralOffset(85);
    setEditBallOpacity(0.7);
    setEnableEditOpacityOverride(true);
    quickNotification.info('Reset Static Training Ball-Cam parameters to defaults.');
  };

  const handleCopyJson = () => {
    const payload = {
      relativeBallCamera: { distance, height, angle, lateralOffset },
      editModeBallOpacity: {
        defaultOpacity: editBallOpacity,
        temporaryOverrideEnabled: enableEditOpacityOverride,
      },
    };
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    quickNotification.success('Copied Static Training Ball-Cam JSON.');
  };

  return (
    <div className="p-3.5 flex flex-col gap-3 text-xs select-none">
      {/* Header Status Bar */}
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border ${
          isLight
            ? 'bg-neutral-100/90 border-neutral-200 text-neutral-700'
            : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Camera className="w-4 h-4 text-sky-400 shrink-0" />
          <div className="flex flex-col leading-tight truncate">
            <span className="font-semibold text-[11px] truncate">
              Relative Ball Camera (Ball Speed Sub-Mode)
            </span>
            <span className="text-[10px] text-neutral-400 truncate">
              Unbounded text input + Enter · [F] Switch Side
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => quickNotification.info('Focused Ball Speed Sub-Mode camera.')}
          className="px-2 py-1 rounded-md text-[10px] font-semibold bg-sky-500/20 border border-sky-500/40 text-sky-400 hover:bg-sky-500/30 transition-colors shrink-0 cursor-pointer"
        >
          Focus Ball Cam
        </button>
      </div>

      {/* Relative Ball Camera Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <SliderControl
          label="Distance"
          unit=" UU"
          value={distance}
          min={50}
          max={1200}
          step={5}
          defaultValue={320}
          onChange={setDistance}
          isLight={isLight}
        />

        <SliderControl
          label="Height Offset"
          unit=" UU"
          value={height}
          min={-200}
          max={800}
          step={5}
          defaultValue={110}
          onChange={setHeight}
          isLight={isLight}
        />

        <SliderControl
          label="Pitch Angle Offset"
          unit="°"
          value={angle}
          min={-90}
          max={90}
          step={0.5}
          defaultValue={-6.5}
          onChange={setAngle}
          isLight={isLight}
        />

        <div className="flex flex-col gap-1.5">
          <SliderControl
            label="Lateral Offset"
            unit=" UU"
            value={lateralOffset}
            min={-400}
            max={400}
            step={5}
            defaultValue={85}
            onChange={setLateralOffset}
            isLight={isLight}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setLateralOffset((v) => -v)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
                  : 'bg-neutral-800 border-neutral-700 text-sky-300 hover:bg-neutral-700'
              }`}
            >
              <ArrowLeftRight className="w-2.5 h-2.5" />
              <span>[F] Switch Side ({lateralOffset >= 0 ? 'Right' : 'Left'})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Mode Ball Opacity Temporary Override Section */}
      <div
        className={`flex flex-col gap-2.5 p-3 rounded-xl border ${
          isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/70 border-neutral-800'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-semibold">
                Edit-Mode Ball Opacity (Temporary Override)
              </span>
              <span className="text-[10px] opacity-65">
                Reverts to Follow Global (70%) when testing [G] or playing
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEnableEditOpacityOverride((v) => !v)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold border transition-colors shrink-0 cursor-pointer ${
              enableEditOpacityOverride
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : isLight
                ? 'bg-neutral-100 border-neutral-300 text-neutral-600'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
            }`}
          >
            {enableEditOpacityOverride ? 'Override ON' : 'Follow Global'}
          </button>
        </div>

        <SliderControl
          label="Edit Mode Ball Opacity"
          value={editBallOpacity}
          min={0.05}
          max={1.0}
          step={0.05}
          defaultValue={0.7}
          disabled={!enableEditOpacityOverride}
          onChange={setEditBallOpacity}
          isLight={isLight}
        />

        <div className="flex items-center justify-between text-[10px] font-mono px-1 opacity-75">
          <span>
            Status:{' '}
            <strong className={enableEditOpacityOverride ? 'text-amber-400' : 'text-emerald-400'}>
              {enableEditOpacityOverride
                ? `Edit Override (${Math.round(editBallOpacity * 100)}%)`
                : 'Following Global (70%)'}
            </strong>
          </span>
          <span>Default: 0.70</span>
        </div>
      </div>

      {/* Export / Copy / Reset Footer */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => quickNotification.success('Exported static-training-ball-cam-config.json')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
              isLight
                ? 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
                : 'bg-sky-500/15 border-sky-500/35 text-sky-300 hover:bg-sky-500/25'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
              isLight
                ? 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
                : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={resetDefaults}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
            isLight
              ? 'bg-neutral-100 border-neutral-300 text-neutral-600 hover:bg-neutral-200'
              : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
});
StaticTrainingBallCamTunerFloatingWindow.displayName = 'StaticTrainingBallCamTunerFloatingWindow';
