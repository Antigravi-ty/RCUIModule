import React, { useState, useEffect } from 'react';
import {
  Camera,
  Compass,
  Eye,
  Download,
  Copy,
  Check,
  RotateCcw,
  ArrowLeftRight,
} from 'lucide-react';
import {
  useStaticTrainingBallCamTunerStore,
  DEFAULT_STATIC_TRAINING_BALL_CAM_TUNER_CONFIG,
} from '../../stores/staticTrainingBallCamTunerStore';
import { useStaticTrainingPackStore } from '../../stores/staticTrainingPackStore';
import {
  ballVisualRuntimeConfig,
  setTemporaryBallOpacityOverride,
} from '../../config/ballVisualConfig';
import { SliderControl } from '../../primitives/SliderControl';

export interface StaticTrainingBallCamTunerFloatingWindowProps {
  isLight?: boolean;
  active?: boolean;
}

export const StaticTrainingBallCamTunerFloatingWindow: React.FC<
  StaticTrainingBallCamTunerFloatingWindowProps
> = ({ isLight = false, active = true }) => {
  const {
    distance,
    height,
    angle,
    lateralOffset,
    editBallOpacity,
    enableEditOpacityOverride,
    expiredBallOpacity,
    arrowOpacity,
    shadowOpacity,
    shadowScale,
    haloScale,
    coneRadius,
    coneLength,
    tipRadius,
    shaftRadius,
    arrowBaseLength,
    arrowMaxExtraLength,
    arrowHeightOffset,
    arrowForwardOffset,
    updateConfig,
    switchLateralSide,
    resetDefaults,
  } = useStaticTrainingBallCamTunerStore();

  const sessionMode = useStaticTrainingPackStore((s) => s.sessionMode);
  const isTestingSingleShot = useStaticTrainingPackStore((s) => s.isTestingSingleShot);
  const editSubMode = useStaticTrainingPackStore((s) => s.editSubMode);
  const setEditSubMode = useStaticTrainingPackStore((s) => s.setEditSubMode);

  const [activeTab, setActiveTab] = useState<'arrow' | 'ballcam'>('arrow');
  const [copied, setCopied] = useState(false);

  const isInEditModeUntested = sessionMode === 'edit' && !isTestingSingleShot;
  const globalOpacity = Number(ballVisualRuntimeConfig.opacity ?? 0.7);
  const globalModeLabel =
    Math.abs(globalOpacity - 0.7) < 0.005
      ? '70%'
      : Math.abs(globalOpacity - 1.0) < 0.005
        ? '100%'
        : `Custom (${Math.round(globalOpacity * 100)}%)`;

  useEffect(() => {
    if (isInEditModeUntested) {
      (setTemporaryBallOpacityOverride as any)(
        enableEditOpacityOverride ? editBallOpacity : null
      );
    } else {
      setTemporaryBallOpacityOverride(null);
    }
  }, [isInEditModeUntested, enableEditOpacityOverride, editBallOpacity]);

  if (!active) return null;

  const buildExportPayload = () => ({
    directionArrow3D: {
      arrowOpacity,
      shadowOpacity,
      shadowScale,
      haloScale,
      coneRadius,
      coneLength,
      tipRadius,
      shaftRadius,
      arrowBaseLength,
      arrowMaxExtraLength,
      arrowHeightOffset,
      arrowForwardOffset,
    },
    expiredBallOpacity,
    relativeBallCamera: {
      distance,
      height,
      angle,
      lateralOffset,
    },
    editModeBallOpacity: {
      defaultOpacity: editBallOpacity,
      temporaryOverrideEnabled: enableEditOpacityOverride,
    },
  });

  const handleCopyJson = () => {
    const json = JSON.stringify(buildExportPayload(), null, 2);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(json).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadJson = () => {
    const json = JSON.stringify(buildExportPayload(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'static-training-visuals-tuner-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      data-ui-interactive="true"
      className="flex flex-col gap-3 text-xs select-none"
    >
      {/* Top Tab Switcher */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('arrow')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border font-bold text-[11px] transition-all cursor-pointer ${
            activeTab === 'arrow'
              ? isLight
                ? 'bg-cyan-600 border-cyan-700 text-white shadow-xs'
                : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-xs'
              : isLight
                ? 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>1. Direction Arrow & Expire</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ballcam')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border font-bold text-[11px] transition-all cursor-pointer ${
            activeTab === 'ballcam'
              ? isLight
                ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                : 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-xs'
              : isLight
                ? 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>2. Ball Cam & Edit Opacity</span>
        </button>
      </div>

      {activeTab === 'arrow' ? (
        <>
          {/* Expired Ball (0s Landed Boom) Opacity Section */}
          <div
            className={`flex flex-col gap-2 p-2.5 rounded-xl border ${
              isLight
                ? 'bg-neutral-100/80 border-neutral-200'
                : 'bg-neutral-900/70 border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span
                    className={`text-[11px] font-semibold ${
                      isLight ? 'text-neutral-800' : 'text-neutral-100'
                    }`}
                  >
                    Timeout Expired Ball Opacity (0s Landed Boom)
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    When timer hits 0s and ball touches ground (&ldquo;砰&rdquo;), ball opacity drops to {Math.round(expiredBallOpacity * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <SliderControl
              editable={true}
              allowOutOfBoundsInput={false}
              showStepper={false}
              colorScheme="amber"
              label="Expired Ball Opacity (0s Ground Impact)"
              unit=""
              value={expiredBallOpacity}
              min={0.1}
              max={1.0}
              step={0.05}
              isLight={isLight}
              onChange={(v) => updateConfig({ expiredBallOpacity: v })}
            />
          </div>

          {/* 3D Car Speed / Heading Direction Arrow Section */}
          <div
            className={`flex flex-col gap-2 p-2.5 rounded-xl border ${
              isLight
                ? 'bg-neutral-100/80 border-neutral-200'
                : 'bg-neutral-900/70 border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                3D Direction Arrow Shading, Shadow & Geometry
              </span>
              <span className="text-[10px] font-mono opacity-60">
                Real-time 3D Preview
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[340px] overflow-y-auto pr-1">
              <SliderControl
                editable={true}
                allowOutOfBoundsInput={false}
                showStepper={false}
                colorScheme="cyan"
                label="Arrow Body Opacity"
                unit=""
                value={arrowOpacity}
                min={0.15}
                max={1.0}
                step={0.02}
                isLight={isLight}
                onChange={(v) => updateConfig({ arrowOpacity: v })}
              />

              <SliderControl
                editable={true}
                allowOutOfBoundsInput={false}
                showStepper={false}
                colorScheme="cyan"
                label="Silhouette Shadow Opacity"
                unit=""
                value={shadowOpacity}
                min={0.0}
                max={0.95}
                step={0.02}
                isLight={isLight}
                onChange={(v) => updateConfig({ shadowOpacity: v })}
              />

              <SliderControl
                editable={true}
                allowOutOfBoundsInput={true}
                showStepper={false}
                colorScheme="cyan"
                label="Silhouette Shadow Thickness"
                unit="x"
                value={shadowScale}
                min={1.02}
                max={1.6}
                step={0.02}
                isLight={isLight}
                onChange={(v) => updateConfig({ shadowScale: v })}
              />

              <SliderControl
                editable={true}
                allowOutOfBoundsInput={true}
                showStepper={false}
                colorScheme="cyan"
                label="Contrast Halo Backdrop Size"
                unit="UU"
                value={haloScale}
                min={0}
                max={220}
                step={5}
                isLight={isLight}
                onChange={(v) => updateConfig({ haloScale: v })}
              />

              <SliderControl
                editable={true}
                allowOutOfBoundsInput={true}
                showStepper={false}
                colorScheme="amber"
                label="Cone Base Radius (锥体粗细)"
                unit="UU"
                value={coneRadius}
                min={6}
                max={55}
                step={1}
                isLight={isLight}
                onChange={(v) => updateConfig({ coneRadius: v })}
              />

              <SliderControl
                editable={true}
                allowOutOfBoundsInput={true}
                showStepper={false}
                colorScheme="amber"
                label="Cone Length (尖尖角长度)"
                unit="UU"
                value={coneLength}
                min={18}
                max={140}
                step={2}
                isLight={isLight}
                onChange={(v) => updateConfig({ coneLength: v })}
              />

              <SliderControl
                editable={true}
                allowOutOfBoundsInput={true}
                showStepper={false}
                colorScheme="amber"
                label="Tip Rounding Radius (尖角圆润度)"
                unit="UU"
                value={tipRadius}
                min={0}
                max={15}
                step={0.5}
                isLight={isLight}
                onChange={(v) => updateConfig({ tipRadius: v })}
              />

              <SliderControl
                editable={true}
                allowOutOfBoundsInput={true}
                showStepper={false}
                colorScheme="amber"
                label="Shaft Cylinder Radius (圆柱粗细)"
                unit="UU"
                value={shaftRadius}
                min={2}
                max={25}
                step={0.5}
                isLight={isLight}
                onChange={(v) => updateConfig({ shaftRadius: v })}
              />

              <SliderControl
                editable={true}
                allowOutOfBoundsInput={true}
                showStepper={false}
                colorScheme="cyan"
                label="Base Arrow Length (0 Speed)"
                unit="UU"
                value={arrowBaseLength}
                min={60}
                max={320}
                step={5}
                isLight={isLight}
                onChange={(v) => updateConfig({ arrowBaseLength: v })}
              />

              <SliderControl
                editable={true}
                allowOutOfBoundsInput={true}
                showStepper={false}
                colorScheme="cyan"
                label="Max Speed Extra Length"
                unit="UU"
                value={arrowMaxExtraLength}
                min={50}
                max={600}
                step={10}
                isLight={isLight}
                onChange={(v) => updateConfig({ arrowMaxExtraLength: v })}
              />

              <SliderControl
                editable={true}
                allowOutOfBoundsInput={true}
                showStepper={false}
                colorScheme="cyan"
                label="Vertical Height Offset (高度偏移)"
                unit="UU"
                value={arrowHeightOffset}
                min={-30}
                max={120}
                step={2}
                isLight={isLight}
                onChange={(v) => updateConfig({ arrowHeightOffset: v })}
              />

              <SliderControl
                editable={true}
                allowOutOfBoundsInput={true}
                showStepper={false}
                colorScheme="cyan"
                label="Forward Offset (前后指向位置)"
                unit="UU"
                value={arrowForwardOffset}
                min={-80}
                max={140}
                step={2}
                isLight={isLight}
                onChange={(v) => updateConfig({ arrowForwardOffset: v })}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Header Status Bar */}
          <div
            className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border ${
              isLight
                ? 'bg-neutral-100/90 border-neutral-200 text-neutral-700'
                : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Camera className="w-4 h-4 text-sky-400 shrink-0" />
              <div className="flex flex-col leading-snug truncate">
                <span className="font-semibold text-[11px] truncate">
                  Relative Ball Camera (Ball Speed Sub-Mode)
                </span>
                <span className="text-[10px] text-neutral-400 truncate">
                  Unbounded text input + Enter · [F] Switch Side
                </span>
              </div>
            </div>

            {sessionMode === 'edit' && editSubMode !== 'ball-speed' && (
              <button
                type="button"
                onClick={() => setEditSubMode('ball-speed')}
                className="px-2 py-1 rounded-md text-[10px] font-semibold bg-sky-500/20 border border-sky-500/40 text-sky-300 hover:bg-sky-500/30 transition-colors shrink-0"
              >
                Focus Ball Cam
              </button>
            )}
          </div>

          {/* Relative Ball Camera Sliders + Text Inputs */}
          <div className="grid grid-cols-1 gap-2">
            <SliderControl
              editable={true}
              allowOutOfBoundsInput={true}
              showStepper={false}
              colorScheme="amber"
              label="Distance"
              unit="UU"
              value={distance}
              min={50}
              max={1200}
              step={5}
              isLight={isLight}
              onChange={(v) => updateConfig({ distance: v })}
            />

            <SliderControl
              editable={true}
              allowOutOfBoundsInput={true}
              showStepper={false}
              colorScheme="amber"
              label="Height Offset"
              unit="UU"
              value={height}
              min={-200}
              max={800}
              step={5}
              isLight={isLight}
              onChange={(v) => updateConfig({ height: v })}
            />

            <SliderControl
              editable={true}
              allowOutOfBoundsInput={true}
              showStepper={false}
              colorScheme="amber"
              label="Pitch Angle Offset"
              unit="deg"
              value={angle}
              min={-90}
              max={90}
              step={0.5}
              isLight={isLight}
              onChange={(v) => updateConfig({ angle: v })}
            />

            <SliderControl
              editable={true}
              allowOutOfBoundsInput={true}
              showStepper={false}
              colorScheme="amber"
              label="Lateral Offset"
              unit="UU"
              value={lateralOffset}
              min={-400}
              max={400}
              step={5}
              isLight={isLight}
              extraAction={
                <button
                  type="button"
                  onClick={switchLateralSide}
                  title="Switch lateral offset side (Hotkey: F)"
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border transition-colors ${
                    isLight
                      ? 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
                      : 'bg-neutral-800 border-neutral-700 text-sky-300 hover:bg-neutral-700'
                  }`}
                >
                  <ArrowLeftRight className="w-2.5 h-2.5" />
                  <span>[F] Switch Side</span>
                </button>
              }
              onChange={(v) => updateConfig({ lateralOffset: v })}
            />
          </div>

          {/* Edit Mode Ball Opacity Temporary Override Section */}
          <div
            className={`flex flex-col gap-2 p-2.5 rounded-xl border ${
              isLight
                ? 'bg-neutral-100/80 border-neutral-200'
                : 'bg-neutral-900/70 border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span
                    className={`text-[11px] font-semibold ${
                      isLight ? 'text-neutral-800' : 'text-neutral-100'
                    }`}
                  >
                    Edit-Mode Ball Opacity (Temporary Override)
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Reverts to Follow Global ({globalModeLabel}) when testing [G] or playing
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  updateConfig({
                    enableEditOpacityOverride: !enableEditOpacityOverride,
                  })
                }
                className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold border transition-colors shrink-0 ${
                  enableEditOpacityOverride
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}
              >
                {enableEditOpacityOverride ? 'Override ON' : 'Follow Global'}
              </button>
            </div>

            <SliderControl
              editable={true}
              allowOutOfBoundsInput={true}
              showStepper={false}
              colorScheme="amber"
              label="Edit Mode Ball Opacity"
              unit=""
              value={editBallOpacity}
              min={0.05}
              max={1.0}
              step={0.05}
              disabled={!enableEditOpacityOverride}
              isLight={isLight}
              onChange={(v) => updateConfig({ editBallOpacity: v })}
            />

            <div className="flex items-center justify-between text-[10px] font-mono px-1 text-neutral-400">
              <span>
                Status:{' '}
                <strong
                  className={
                    isInEditModeUntested && enableEditOpacityOverride
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }
                >
                  {isInEditModeUntested && enableEditOpacityOverride
                    ? `Edit Override (${Math.round(editBallOpacity * 100)}%)`
                    : `Following Global (${globalModeLabel})`}
                </strong>
              </span>
              <span>
                Default: {DEFAULT_STATIC_TRAINING_BALL_CAM_TUNER_CONFIG.editBallOpacity.toFixed(2)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Export / Copy / Reset Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDownloadJson}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
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
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
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
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
            isLight
              ? 'bg-neutral-100 border-neutral-300 text-neutral-600 hover:bg-neutral-200'
              : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
