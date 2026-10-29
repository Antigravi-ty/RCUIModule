import React, { useEffect, useState } from 'react';
import { RotateCcw, Tag } from 'lucide-react';
import {
  computeAdaptiveNameTagWidthPx,
  formatNameTagDisplayText,
  getNameTagTelemetrySnapshot,
  resolveNameTagCornerRadiusPx,
  resolveNameTagFontFamilyCss,
  type NameTagFontFamily,
  type NameTagFontWeight,
  type NameTagTelemetrySnapshot,
} from '../../config/nameTagConfig';
import { useNameTagTunerStore } from '../../stores/nameTagTunerStore';
import { useAppStore } from '../../stores/appStore';
import { useHudStore } from '../../stores/hudStore';
import { SliderControl } from '../../primitives/SliderControl';
import {
  CAR_SLOT_BADGES,
  NameTagCalibrationSection,
} from './name-tag-tuner/NameTagCalibrationSection';
import { NameTagColorsAndNamesSection } from './name-tag-tuner/NameTagColorsAndNamesSection';

export interface NameTagTunerFloatingWindowProps {
  isLight?: boolean;
  active?: boolean;
}

const DISTANCE_EXPONENT_PRESETS = [
  { label: 'Calibrated (0.86)', value: 0.86 },
  { label: 'Perceptual (0.92)', value: 0.92 },
  { label: 'Pure Screen (1.00)', value: 1.0 },
  { label: 'Pure World (0.00)', value: 0.0 },
];

const FONT_FAMILY_OPTIONS: Array<{ id: NameTagFontFamily; label: string }> = [
  { id: 'jetbrains-mono', label: 'JetBrains Mono' },
  { id: 'sf-mono', label: 'SF Mono / UI Mono' },
  { id: 'archivo', label: 'Archivo Sans' },
];

const FONT_WEIGHT_OPTIONS: Array<{ value: NameTagFontWeight; label: string }> = [
  { value: 400, label: '400 Regular' },
  { value: 500, label: '500 Medium' },
  { value: 600, label: '600 SemiBold' },
  { value: 700, label: '700 Bold' },
];

export const NameTagTunerFloatingWindow: React.FC<NameTagTunerFloatingWindowProps> = ({
  isLight = false,
}) => {
  const {
    config,
    isTunerArenaActive,
    kickoffPermutationIndex,
    activeCameraMode,
    focusedCarIndex,
    selectedCalibrationCarIndex,
    updateConfig,
    updatePreviewName,
    selectCalibrationCar,
    updateCarOverride,
    resetCarOverride,
    resetAllCarOverrides,
    applyFittedFromCarOverrides,
    exportCalibrationJson,
    resetConfig,
    enterTunerArenaAndSpawnSixCars,
    exitTunerArena,
    reshuffleKickoffPositions,
    selectPovCar,
    focusFreeCamOverview,
  } = useNameTagTunerStore();

  const [telemetry, setTelemetry] = useState<NameTagTelemetrySnapshot>(() =>
    getNameTagTelemetrySnapshot()
  );

  useEffect(() => {
    const refreshTelemetry = () => {
      setTelemetry({ ...getNameTagTelemetrySnapshot() });
    };
    refreshTelemetry();
    const timer = window.setInterval(refreshTelemetry, 160);
    return () => window.clearInterval(timer);
  }, []);

  const isFreeCamApp = useAppStore((state) => state.isFreeCam);
  const sceneRenderScale = useAppStore((state) => state.graphics?.renderScale ?? 50);
  const hudCameraMode = useHudStore((state) => state.cameraMode);
  const hudFocusedCarIndex = useHudStore((state) => state.focusedCarIndex);

  const effectiveCameraMode = isFreeCamApp
    ? 'free'
    : activeCameraMode || hudCameraMode || 'pov';
  const isPovMode =
    effectiveCameraMode === 'pov' ||
    effectiveCameraMode === 'wasmPov' ||
    effectiveCameraMode === 'rearView';
  const effectiveFocusedCarIndex = isTunerArenaActive
    ? focusedCarIndex
    : hudFocusedCarIndex;
  const focusedSlotCode =
    CAR_SLOT_BADGES[effectiveFocusedCarIndex]?.slotCode ||
    `#${effectiveFocusedCarIndex + 1}`;

  const cardBackground = isLight
    ? 'bg-neutral-50/95 border-neutral-200/90 text-neutral-800 shadow-2xs'
    : 'bg-neutral-850/60 border-neutral-700/60 text-neutral-200';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const truncatePreview = (rawName: string) =>
    formatNameTagDisplayText(rawName, config.maxChars);

  return (
    <div className="flex flex-col gap-2.5 select-none text-xs">
      <NameTagCalibrationSection
        config={config}
        telemetry={telemetry}
        isTunerArenaActive={isTunerArenaActive}
        kickoffPermutationIndex={kickoffPermutationIndex}
        effectiveCameraMode={effectiveCameraMode}
        isPovMode={isPovMode}
        effectiveFocusedCarIndex={effectiveFocusedCarIndex}
        focusedSlotCode={focusedSlotCode}
        selectedCalibrationCarIndex={selectedCalibrationCarIndex}
        isLight={isLight}
        updateConfig={updateConfig}
        selectCalibrationCar={selectCalibrationCar}
        updateCarOverride={updateCarOverride}
        resetCarOverride={resetCarOverride}
        resetAllCarOverrides={resetAllCarOverrides}
        applyFittedFromCarOverrides={applyFittedFromCarOverrides}
        exportCalibrationJson={exportCalibrationJson}
        enterTunerArenaAndSpawnSixCars={enterTunerArenaAndSpawnSixCars}
        exitTunerArena={exitTunerArena}
        reshuffleKickoffPositions={reshuffleKickoffPositions}
        selectPovCar={selectPovCar}
        focusFreeCamOverview={focusFreeCamOverview}
      />

      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBackground}`}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-[11px] flex items-center gap-1.5">
            <Tag
              className={`h-3.5 w-3.5 ${isLight ? 'text-sky-600' : 'text-sky-400'}`}
            />
            <span>Horizontal Pill Preview (Blue vs Orange)</span>
          </span>
          <span className={`text-[10px] font-mono ${mutedText}`}>
            {config.pillMinWidth}–{config.pillMaxWidth}×{config.pillHeight}px · R
            {config.cornerRadius}px · Font {config.fontSize}px ({config.fontWeight})
          </span>
        </div>

        <div
          className={`grid grid-cols-2 gap-2 py-1 items-center justify-items-center rounded-lg p-2 border ${
            isLight
              ? 'bg-neutral-200/70 border-neutral-300'
              : 'bg-neutral-950/60 border-neutral-800'
          }`}
        >
          {[0, 1].map((team) => {
            const isOrange = team === 1;
            const backgroundHex = isOrange ? config.orangeBgColor : config.blueBgColor;
            const borderHex = isOrange ? config.orangeBorderColor : config.blueBorderColor;
            const textHex = isOrange ? config.orangeTextColor : config.blueTextColor;
            const sampleName = truncatePreview(
              config.previewNames[isOrange ? 3 : 0] ||
                (isOrange ? 'K' : 'AlphaStriker')
            );
            const adaptiveWidthPx = computeAdaptiveNameTagWidthPx(sampleName, config);
            const effectiveRadiusPx = resolveNameTagCornerRadiusPx(
              adaptiveWidthPx,
              config.pillHeight,
              config.cornerRadius
            );
            const previewScale = 0.52;
            return (
              <div
                key={team}
                style={{
                  width: `${Math.max(24, Math.round(adaptiveWidthPx * previewScale))}px`,
                  height: `${Math.min(64, Math.round(config.pillHeight * previewScale))}px`,
                  backgroundColor: backgroundHex,
                  borderColor: borderHex,
                  borderWidth: `${Math.max(0, config.borderWidth * previewScale)}px`,
                  borderStyle: 'solid',
                  borderRadius: `${Math.round(effectiveRadiusPx * previewScale)}px`,
                  opacity: config.opacity,
                  color: textHex,
                  fontSize: `${Math.max(9, Math.round(config.fontSize * previewScale))}px`,
                  fontWeight: config.fontWeight,
                  fontFamily: resolveNameTagFontFamilyCss(config.fontFamily),
                }}
                className="flex items-center justify-center overflow-hidden px-1.5 shadow-sm transition-all"
              >
                <span className="whitespace-nowrap">{sampleName}</span>
              </div>
            );
          })}
        </div>

        <div
          className={`flex items-center justify-between gap-2 text-[10px] font-mono px-2 py-1 rounded border ${
            isLight
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <span>
            Card Render Scale: <b>{config.cardRenderScale}%</b> (Native Retina Overlay)
          </span>
          <span className={mutedText}>3D Scene Scale: {sceneRenderScale}%</span>
        </div>

        <div className="flex flex-col gap-1.5 pt-0.5">
          <div className="flex items-center justify-between gap-1.5 text-[10px]">
            <span className={mutedText}>Font Family:</span>
            <div className="flex items-center gap-1">
              {FONT_FAMILY_OPTIONS.map((opt) => {
                const isSelected = config.fontFamily === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateConfig({ fontFamily: opt.id })}
                    className={`px-2 py-0.5 rounded border font-mono cursor-pointer transition-colors ${
                      isSelected
                        ? isLight
                          ? 'bg-sky-500/15 border-sky-500 text-sky-800 font-bold'
                          : 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                        : isLight
                          ? 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                          : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-1.5 text-[10px]">
            <span className={mutedText}>Font Weight:</span>
            <div className="grid grid-cols-4 gap-1">
              {FONT_WEIGHT_OPTIONS.map((opt) => {
                const isSelected = config.fontWeight === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateConfig({ fontWeight: opt.value })}
                    className={`px-1.5 py-0.5 rounded border font-mono cursor-pointer transition-colors ${
                      isSelected
                        ? isLight
                          ? 'bg-amber-500/15 border-amber-500 text-amber-800 font-bold'
                          : 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : isLight
                          ? 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                          : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBackground}`}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-[11px]">
            Global Distance Scale Curve &amp; Dual-Space Offsets
          </span>
          <button
            type="button"
            onClick={resetConfig}
            className={`text-[10px] font-mono hover:underline flex items-center gap-1 cursor-pointer ${
              isLight ? 'text-amber-700' : 'text-amber-400'
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Calibrated Defaults</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-1.5 text-[10px]">
          <span className={mutedText}>Depth Metric (Aspect Ratio / Edge Behavior):</span>
          <div className="flex items-center gap-1">
            {(['viewZ', 'euclidean'] as const).map((metric) => {
              const isSelected = config.depthMetric === metric;
              return (
                <button
                  key={metric}
                  type="button"
                  onClick={() => updateConfig({ depthMetric: metric })}
                  className={`px-2 py-0.5 rounded border font-mono cursor-pointer transition-colors ${
                    isSelected
                      ? isLight
                        ? 'bg-sky-500/15 border-sky-500 text-sky-800 font-bold'
                        : 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                      : isLight
                        ? 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                        : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {metric === 'viewZ' ? 'View-Z Plane' : '3D Euclidean'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {DISTANCE_EXPONENT_PRESETS.map((preset) => {
            const isSelected =
              Math.abs(config.distanceScaleExponent - preset.value) < 0.005;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => updateConfig({ distanceScaleExponent: preset.value })}
                className={`px-1 py-1 rounded border text-[9px] font-mono cursor-pointer truncate transition-colors ${
                  isSelected
                    ? isLight
                      ? 'bg-amber-500/15 border-amber-500 text-amber-800 font-bold'
                      : 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                    : isLight
                      ? 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                      : 'border-neutral-700/70 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <SliderControl
            label="Card Render Scale (Independent of 3D Scene)"
            value={config.cardRenderScale}
            min={50}
            max={200}
            step={10}
            unit="%"
            onChange={(nextValue) => updateConfig({ cardRenderScale: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="Camera Relative Scale"
            value={config.cameraScaleFactor}
            min={0.02}
            max={0.3}
            step={0.005}
            onChange={(nextValue) => updateConfig({ cameraScaleFactor: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="Distance Scale Exponent (γ)"
            value={config.distanceScaleExponent}
            min={0.0}
            max={1.5}
            step={0.01}
            onChange={(nextValue) => updateConfig({ distanceScaleExponent: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="Near Scale Multiplier (500 UU)"
            value={config.nearScaleMultiplier}
            min={0.2}
            max={2.5}
            step={0.02}
            unit="x"
            onChange={(nextValue) => updateConfig({ nearScaleMultiplier: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="Far Scale Multiplier (9000 UU)"
            value={config.farScaleMultiplier}
            min={0.2}
            max={2.5}
            step={0.02}
            unit="x"
            onChange={(nextValue) => updateConfig({ farScaleMultiplier: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="3D World Offset (Car Roof Relative)"
            value={config.verticalOffsetUu}
            min={0}
            max={360}
            step={2}
            unit="UU"
            onChange={(nextValue) => updateConfig({ verticalOffsetUu: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="2D Screen Offset (Viewport Relative)"
            value={config.screenVerticalOffsetPx}
            min={-60}
            max={160}
            step={1}
            unit="px"
            onChange={(nextValue) => updateConfig({ screenVerticalOffsetPx: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="Minimum Width"
            value={config.pillMinWidth}
            min={40}
            max={460}
            step={2}
            unit="px"
            onChange={(nextValue) => updateConfig({ pillMinWidth: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="Maximum Width"
            value={config.pillMaxWidth}
            min={80}
            max={480}
            step={4}
            unit="px"
            onChange={(nextValue) => updateConfig({ pillMaxWidth: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="Pill Height"
            value={config.pillHeight}
            min={28}
            max={120}
            step={2}
            unit="px"
            onChange={(nextValue) => updateConfig({ pillHeight: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="Corner Radius"
            value={config.cornerRadius}
            min={0}
            max={60}
            step={1}
            unit="px"
            onChange={(nextValue) => updateConfig({ cornerRadius: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="Font Size"
            value={config.fontSize}
            min={12}
            max={48}
            step={1}
            unit="px"
            onChange={(nextValue) => updateConfig({ fontSize: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="Border Thickness"
            value={config.borderWidth}
            min={0}
            max={12}
            step={0.5}
            unit="px"
            onChange={(nextValue) => updateConfig({ borderWidth: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="Truncation Length (Leading …)"
            value={config.maxChars}
            min={4}
            max={32}
            step={1}
            unit="chars"
            onChange={(nextValue) => updateConfig({ maxChars: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="Card Opacity"
            value={config.opacity}
            min={0.1}
            max={1.0}
            step={0.02}
            onChange={(nextValue) => updateConfig({ opacity: nextValue })}
            isLight={isLight}
          />
          <SliderControl
            label="Background Fill Opacity"
            value={config.bgOpacity}
            min={0.0}
            max={1.0}
            step={0.02}
            onChange={(nextValue) => updateConfig({ bgOpacity: nextValue })}
            isLight={isLight}
          />
        </div>
      </div>

      <NameTagColorsAndNamesSection
        config={config}
        isPovMode={isPovMode}
        effectiveFocusedCarIndex={effectiveFocusedCarIndex}
        focusedSlotCode={focusedSlotCode}
        isLight={isLight}
        updateConfig={updateConfig}
        updatePreviewName={updatePreviewName}
        selectPovCar={selectPovCar}
      />
    </div>
  );
};
