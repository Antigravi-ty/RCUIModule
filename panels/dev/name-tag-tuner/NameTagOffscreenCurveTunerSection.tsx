import React, { useMemo, useRef, useState } from 'react';
import { Activity, Check, Compass, Copy } from 'lucide-react';
import {
  DEFAULT_NAME_TAG_CONFIG,
  computeOffscreenDistanceScale,
  type NameTagConfig,
} from '../../../config/nameTagConfig';
import { useNameTagTunerStore } from '../../../stores/nameTagTunerStore';
import { SliderControl } from '../../../primitives/SliderControl';
import { ToggleSwitch } from '../../../primitives/ToggleSwitch';

export interface NameTagOffscreenCurveTunerSectionProps {
  isLight?: boolean;
  config?: NameTagConfig;
  updateConfig?: (partial: Partial<NameTagConfig>) => void;
}

const CURVE_EXPONENT_PRESETS: Array<{
  label: string;
  exponent: number;
  desc: string;
}> = [
  {
    label: 'Fast Near Drop (γ=0.45)',
    exponent: 0.45,
    desc: 'Shrinks quickly right after leaving near threshold, then flattens out at far range',
  },
  {
    label: 'Balanced Root (γ=0.75)',
    exponent: 0.75,
    desc: 'Natural perspective-like non-linear falloff',
  },
  {
    label: 'Linear (γ=1.00)',
    exponent: 1.0,
    desc: 'Uniform linear size reduction from Near UU to Far UU',
  },
  {
    label: 'Hold Large Longer (γ=1.65)',
    exponent: 1.65,
    desc: 'Stays large across mid-field and shrinks steeper only at deep far distances',
  },
];

const EDGE_ANGLE_PRESETS: Array<{ label: string; deg: number }> = [
  { label: 'Left Edge (0°)', deg: 0 },
  { label: 'Bottom Edge (90°)', deg: 90 },
  { label: 'Right Edge (180°)', deg: 180 },
  { label: 'Top Edge (270°)', deg: 270 },
];

export const NameTagOffscreenCurveTunerSection: React.FC<
  NameTagOffscreenCurveTunerSectionProps
> = ({ isLight = false, config: propConfig, updateConfig: propUpdateConfig }) => {
  const store = useNameTagTunerStore();
  const config = propConfig ?? store.config;
  const updateConfig = propUpdateConfig ?? store.updateConfig;

  const [copiedJson, setCopiedJson] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const scrubTrackRef = useRef<HTMLDivElement | null>(null);
  const scrubDragStateRef = useRef<{
    active: boolean;
    lastClientX: number;
    accumulatedAngle: number;
  }>({
    active: false,
    lastClientX: 0,
    accumulatedAngle: config.offscreenDistanceSimAngleDeg || 0,
  });

  const subCardBackground = isLight
    ? 'border-neutral-200 bg-neutral-100/75'
    : 'border-neutral-800 bg-neutral-900/50';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const nearUu =
    Number(config.offscreenDistanceNearUu) ||
    DEFAULT_NAME_TAG_CONFIG.offscreenDistanceNearUu;
  const farUu = Math.max(
    nearUu + 100,
    Number(config.offscreenDistanceFarUu) ||
      DEFAULT_NAME_TAG_CONFIG.offscreenDistanceFarUu
  );
  const simDistUu =
    Number(config.offscreenDistanceSimDistanceUu) ||
    DEFAULT_NAME_TAG_CONFIG.offscreenDistanceSimDistanceUu;
  const simAngleDeg =
    (((Number(config.offscreenDistanceSimAngleDeg) || 0) % 360) + 360) % 360;

  const currentSimScale = useMemo(
    () => computeOffscreenDistanceScale(simDistUu, config),
    [
      simDistUu,
      config.offscreenDistanceScaleEnabled,
      config.offscreenDistanceMinScale,
      config.offscreenDistanceNearUu,
      config.offscreenDistanceFarUu,
      config.offscreenDistanceCurveExponent,
    ]
  );

  const currentSimRadiusPx = Math.round(
    config.offscreenCircleRadiusPx * currentSimScale * 10
  ) / 10;

  const svgPoints = useMemo(() => {
    const width = 280;
    const height = 84;
    const padX = 8;
    const padY = 8;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;
    const maxPlotDistUu = Math.max(farUu * 1.12, 8000);
    const samples = 48;
    const pts: string[] = [];

    for (let i = 0; i <= samples; i++) {
      const dist = (i / samples) * maxPlotDistUu;
      const scale = computeOffscreenDistanceScale(dist, config);
      const x = padX + (dist / maxPlotDistUu) * plotW;
      const y = padY + (1 - scale) * plotH;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    const simX =
      padX + Math.min(1, Math.max(0, simDistUu / maxPlotDistUu)) * plotW;
    const simY = padY + (1 - currentSimScale) * plotH;
    const nearX =
      padX + Math.min(1, Math.max(0, nearUu / maxPlotDistUu)) * plotW;
    const farX =
      padX + Math.min(1, Math.max(0, farUu / maxPlotDistUu)) * plotW;

    return {
      polyline: pts.join(' '),
      simX,
      simY,
      nearX,
      farX,
      maxPlotDistUu,
    };
  }, [
    nearUu,
    farUu,
    simDistUu,
    currentSimScale,
    config.offscreenDistanceScaleEnabled,
    config.offscreenDistanceMinScale,
    config.offscreenDistanceCurveExponent,
  ]);

  const curveExportPayload = useMemo(
    () => ({
      offscreenDistanceScaleEnabled: config.offscreenDistanceScaleEnabled,
      offscreenCircleRadiusPx: config.offscreenCircleRadiusPx,
      offscreenDistanceMinScale: config.offscreenDistanceMinScale,
      offscreenDistanceNearUu: config.offscreenDistanceNearUu,
      offscreenDistanceFarUu: config.offscreenDistanceFarUu,
      offscreenDistanceCurveExponent: config.offscreenDistanceCurveExponent,
      cardDisplayMode: config.cardDisplayMode,
      circleLabelMode: config.circleLabelMode,
      circleColorMode: config.circleColorMode,
      onscreenCircleFixedSize: config.onscreenCircleFixedSize,
      onscreenCircleRadiusPx: config.onscreenCircleRadiusPx,
      slotCodes: config.slotCodes,
    }),
    [config]
  );

  const curveExportJson = useMemo(
    () => JSON.stringify(curveExportPayload, null, 2),
    [curveExportPayload]
  );

  const handleCopyCurveJson = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(curveExportJson).catch(() => {});
    }
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1800);
  };

  // Trackless 0°–360° scrub bar handler (endless horizontal drag without progress fill bar)
  const handleScrubPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubDragStateRef.current = {
      active: true,
      lastClientX: e.clientX,
      accumulatedAngle: simAngleDeg,
    };
    if (!config.offscreenDistanceSimEnabled) {
      updateConfig({ offscreenDistanceSimEnabled: true });
    }
  };

  const handleScrubPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubDragStateRef.current.active) return;
    const trackWidth = scrubTrackRef.current?.clientWidth || 240;
    const deltaX = e.clientX - scrubDragStateRef.current.lastClientX;
    scrubDragStateRef.current.lastClientX = e.clientX;
    const deltaDeg = (deltaX / Math.max(80, trackWidth)) * 360;
    const nextAngle =
      (((scrubDragStateRef.current.accumulatedAngle + deltaDeg) % 360) + 360) %
      360;
    scrubDragStateRef.current.accumulatedAngle = nextAngle;
    updateConfig({
      offscreenDistanceSimAngleDeg: Math.round(nextAngle),
      offscreenDistanceSimEnabled: true,
    });
  };

  const handleScrubPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scrubDragStateRef.current.active) {
      scrubDragStateRef.current.active = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore capture release errors
      }
    }
  };

  const thumbNorm = ((simAngleDeg % 360) + 360) % 360 / 360;

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200/70 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-[11px] flex items-center gap-1.5">
          <Activity
            className={`h-3.5 w-3.5 ${isLight ? 'text-teal-600' : 'text-teal-400'}`}
          />
          <span>
            Off-Screen Distance Non-Linear Size Curve Tuner &amp; 360° Ground Simulator
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] ${mutedText}`}>Distance Scaling</span>
          <ToggleSwitch
            checked={config.offscreenDistanceScaleEnabled}
            onChange={(nextValue) =>
              updateConfig({ offscreenDistanceScaleEnabled: nextValue })
            }
            isLight={isLight}
          />
        </div>
      </div>

      <div className={`p-2 rounded-lg border flex flex-col gap-2 ${subCardBackground}`}>
        {/* Interactive Non-Linear Curve Graph */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className={mutedText}>
              Non-Linear Curve Preview (Max = 100% Current Radius{' '}
              {config.offscreenCircleRadiusPx}px → Far Min{' '}
              {Math.round(config.offscreenDistanceMinScale * 100)}%):
            </span>
            <span className="font-mono font-bold text-teal-400">
              @{simDistUu} UU → {Math.round(currentSimScale * 100)}% (
              {currentSimRadiusPx}px)
            </span>
          </div>

          <svg
            viewBox="0 0 280 84"
            className={`w-full h-20 rounded border ${
              isLight
                ? 'bg-white border-neutral-200'
                : 'bg-neutral-950/80 border-neutral-800'
            }`}
          >
            {[8, 42, 76].map((yPos) => (
              <line
                key={yPos}
                x1="8"
                y1={yPos}
                x2="272"
                y2={yPos}
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeDasharray="3 3"
              />
            ))}
            <line x1={svgPoints.nearX} y1="6" x2={svgPoints.nearX} y2="78" stroke="#38bdf8" strokeOpacity="0.45" strokeDasharray="2 2" />
            <line x1={svgPoints.farX} y1="6" x2={svgPoints.farX} y2="78" stroke="#fb923c" strokeOpacity="0.45" strokeDasharray="2 2" />
            <polyline fill="none" stroke="#14b8a6" strokeWidth="2.2" points={svgPoints.polyline} />
            <circle cx={svgPoints.simX} cy={svgPoints.simY} r="4.2" fill="#facc15" stroke="#0f172a" strokeWidth="1.5" />
          </svg>

          {/* Curve Exponent Presets */}
          <div className="grid grid-cols-4 gap-1 pt-0.5">
            {CURVE_EXPONENT_PRESETS.map((preset) => {
              const isSelected =
                Math.abs(config.offscreenDistanceCurveExponent - preset.exponent) <
                0.04;
              return (
                <button
                  key={preset.label}
                  type="button"
                  title={preset.desc}
                  onClick={() =>
                    updateConfig({
                      offscreenDistanceCurveExponent: preset.exponent,
                      offscreenDistanceScaleEnabled: true,
                    })
                  }
                  className={`px-1.5 py-0.5 rounded border text-[9px] font-mono cursor-pointer truncate transition-colors ${
                    isSelected
                      ? isLight
                        ? 'bg-teal-500/15 border-teal-500 text-teal-900 font-bold'
                        : 'bg-teal-500/20 border-teal-400 text-teal-300 font-bold'
                      : isLight
                        ? 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                        : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Curve Parameters Sliders */}
        <div className="grid grid-cols-2 gap-2">
          <SliderControl
            label="Min Far Scale (Floor Ratio)"
            value={config.offscreenDistanceMinScale}
            min={0.15}
            max={1.0}
            step={0.05}
            unit="x"
            onChange={(nextValue) =>
              updateConfig({ offscreenDistanceMinScale: nextValue })
            }
            isLight={isLight}
          />
          <SliderControl
            label="Non-Linear Curve Exponent (γ)"
            value={config.offscreenDistanceCurveExponent}
            min={0.15}
            max={3.0}
            step={0.05}
            onChange={(nextValue) =>
              updateConfig({ offscreenDistanceCurveExponent: nextValue })
            }
            isLight={isLight}
          />
          <SliderControl
            label="Near Full-Size Distance (100%)"
            value={config.offscreenDistanceNearUu}
            min={100}
            max={3000}
            step={50}
            unit="UU"
            onChange={(nextValue) =>
              updateConfig({ offscreenDistanceNearUu: nextValue })
            }
            isLight={isLight}
          />
          <SliderControl
            label="Far Min-Size Distance"
            value={config.offscreenDistanceFarUu}
            min={1000}
            max={12000}
            step={100}
            unit="UU"
            onChange={(nextValue) =>
              updateConfig({ offscreenDistanceFarUu: nextValue })
            }
            isLight={isLight}
          />
        </div>

        {/* Ground Dashed Line & 0-360° Screen-Edge Orbit Simulator */}
        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-neutral-200/70 dark:border-neutral-800">
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="font-semibold flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-amber-500" />
              <span>
                Simulate Ground Dashed Distance Line &amp; 360° Screen-Edge Circle
              </span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`font-mono text-[9px] ${mutedText}`}>
                {config.offscreenDistanceSimEnabled
                  ? `ACTIVE (${simDistUu} UU · ${simAngleDeg}°)`
                  : 'SIMULATOR OFF'}
              </span>
              <ToggleSwitch
                checked={config.offscreenDistanceSimEnabled}
                onChange={(nextValue) =>
                  updateConfig({ offscreenDistanceSimEnabled: nextValue })
                }
                isLight={isLight}
              />
            </div>
          </div>

          <SliderControl
            label="Simulated Car Distance (3D Ground Dashed Line + Ring)"
            value={simDistUu}
            min={200}
            max={10000}
            step={50}
            unit="UU"
            onChange={(nextValue) =>
              updateConfig({
                offscreenDistanceSimDistanceUu: nextValue,
                offscreenDistanceSimEnabled: true,
              })
            }
            isLight={isLight}
          />

          {/* Trackless 0-360° Endless Orbit Scrub Bar (no progress fill bar) */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className={mutedText}>
                360° Screen Orbit Scrub (Trackless Drag Left/Right to Orbit Screen):
              </span>
              <span className="font-mono font-bold text-[10px]">
                {simAngleDeg}°
              </span>
            </div>

            <div
              ref={scrubTrackRef}
              onPointerDown={handleScrubPointerDown}
              onPointerMove={handleScrubPointerMove}
              onPointerUp={handleScrubPointerUp}
              onPointerCancel={handleScrubPointerUp}
              title="Drag left or right freely (wraps 0°–360°) to orbit the simulated indicator around all four screen edges"
              className={`relative h-6 rounded-md border cursor-ew-resize flex items-center px-2 select-none ${
                isLight
                  ? 'bg-neutral-200/75 border-neutral-300 hover:border-teal-500'
                  : 'bg-neutral-950/80 border-neutral-700 hover:border-teal-400'
              }`}
            >
              {/* Center dashed guide line (NO progress fill bar) */}
              <div className="w-full border-t border-dashed border-neutral-400/50 dark:border-neutral-600 pointer-events-none" />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono opacity-45 pointer-events-none">
                ← Drag Left / Right to Orbit Screen 0°–360° →
              </span>
              {/* Floating scrub handle */}
              <div
                style={{
                  left: `calc(${(thumbNorm * 100).toFixed(1)}% - 10px)`,
                }}
                className="absolute h-4 w-5 rounded bg-teal-500 border border-white shadow-xs flex items-center justify-center pointer-events-none"
              >
                <div className="h-2 w-0.5 bg-white/90 rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 pt-0.5">
              {EDGE_ANGLE_PRESETS.map((preset) => {
                const isSelected = Math.abs(simAngleDeg - preset.deg) <= 2;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      updateConfig({
                        offscreenDistanceSimAngleDeg: preset.deg,
                        offscreenDistanceSimEnabled: true,
                      })
                    }
                    className={`px-1 py-0.5 rounded border text-[9px] font-mono cursor-pointer truncate transition-colors ${
                      isSelected
                        ? isLight
                          ? 'bg-amber-500/15 border-amber-500 text-amber-900 font-bold'
                          : 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : isLight
                          ? 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                          : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export / Copy Curve Data JSON */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-200/70 dark:border-neutral-800">
            <span className={`text-[10px] ${mutedText}`}>
              Export Tuned Distance Curve Parameters (Lock Default Values):
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowExportPreview((prev) => !prev)}
                className={`px-2 py-0.5 rounded border text-[9px] font-mono cursor-pointer ${
                  isLight
                    ? 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                {showExportPreview ? 'Hide JSON' : 'View JSON'}
              </button>
              <button
                type="button"
                onClick={handleCopyCurveJson}
                className={`px-2 py-0.5 rounded border text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer ${
                  copiedJson
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : isLight
                      ? 'bg-teal-500/15 border-teal-500 text-teal-900 hover:bg-teal-500/25'
                      : 'bg-teal-500/20 border-teal-400 text-teal-200 hover:bg-teal-500/30'
                }`}
              >
                {copiedJson ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Copied Curve JSON!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Curve Data</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showExportPreview && (
            <pre
              className={`p-1.5 rounded border text-[9px] font-mono overflow-x-auto select-all ${
                isLight
                  ? 'bg-white border-neutral-200 text-neutral-800'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300'
              }`}
            >
              {curveExportJson}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
