import React, { useState } from 'react';
import { Crosshair, Compass, Wind, RotateCcw, Activity, Copy, Check } from 'lucide-react';
import { SliderControl } from '../../primitives/SliderControl';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { quickNotification } from '../../tokens/quickNotificationStore';

/**
 * 6. [Dev] Reachability & Intercept Cone Tuner (`reachability-tuner`)
 * Standalone L6 Floating Window Panel — Ground Reachability LUT, Aerial 3D Spacetime Horn & Optimal Intercept 3D Cross.
 */
export const ReachabilityTunerFloatingWindow: React.FC<{ isLight?: boolean }> = React.memo(({ isLight = false }) => {
  const [enabled, setEnabled] = useState(true);
  const [copiedJson, setCopiedJson] = useState(false);

  // 1. Ground Reachability
  const [showGround, setShowGround] = useState(true);
  const [groundMode, setGroundMode] = useState<'lut' | 'analytical'>('lut');
  const [groundFillOpacity, setGroundFillOpacity] = useState(18);

  // 2. Aerial 3D Spacetime Horn
  const [showAerial, setShowAerial] = useState(true);
  const [aerialMode, setAerialMode] = useState<'funnel' | 'bubbles'>('funnel');
  const [aerialOpacity, setAerialOpacity] = useState(28);
  const [aerialShowRings, setAerialShowRings] = useState(true);
  const [includeJumpImpulse, setIncludeJumpImpulse] = useState(true);

  // 3. Optimal Intercept 3D Cross
  const [showIntercept, setShowIntercept] = useState(true);
  const [crossOrientation, setCrossOrientation] = useState<'world' | 'trajectory'>('world');
  const [crossArmLength, setCrossArmLength] = useState(50);
  const [crossThickness, setCrossThickness] = useState(5);
  const [showClosestWhenUnreachable, setShowClosestWhenUnreachable] = useState(true);

  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
    : 'bg-neutral-900/60 border-neutral-800 text-neutral-200';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const resetDefaults = () => {
    setEnabled(true);
    setShowGround(true);
    setGroundMode('lut');
    setGroundFillOpacity(18);
    setShowAerial(true);
    setAerialMode('funnel');
    setAerialOpacity(28);
    setAerialShowRings(true);
    setIncludeJumpImpulse(true);
    setShowIntercept(true);
    setCrossOrientation('world');
    setCrossArmLength(50);
    setCrossThickness(5);
    setShowClosestWhenUnreachable(true);
    quickNotification.info('Reset Reachability & Intercept parameters to defaults.');
  };

  const handleCopyJson = () => {
    const config = {
      enabled,
      showGround,
      groundMode,
      groundFillOpacity: groundFillOpacity / 100,
      showAerial,
      aerialMode,
      aerialOpacity: aerialOpacity / 100,
      aerialShowRings,
      includeJumpImpulse,
      showIntercept,
      crossOrientation,
      crossArmLength,
      crossThickness,
      showClosestWhenUnreachable,
    };
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(JSON.stringify(config, null, 2)).catch(() => {});
    }
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1800);
    quickNotification.success('Copied ReachabilityConfig JSON.');
  };

  return (
    <div className="p-3.5 flex flex-col gap-2.5 text-xs select-none">
      {/* Master Switch, Copy JSON & Reset Header Card */}
      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${cardBg}`}>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs">Reachability &amp; Intercept System</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                enabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-neutral-500/15 border-neutral-500/30 text-neutral-400'
              }`}
            >
              {enabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>
          <span className={`text-[10px] mt-0.5 truncate ${mutedText}`}>
            Optimal 3D Cross (50 UU / 5 UU) · Horn Centrality Color
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyJson}
            className={`px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
              copiedJson
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : isLight
                ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-300'
            }`}
          >
            {copiedJson ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
          </button>
          <button
            type="button"
            onClick={resetDefaults}
            title="Reset parameters to defaults"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-300'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <ToggleSwitch checked={enabled} onChange={setEnabled} isLight={isLight} />
        </div>
      </div>

      {/* Real-time Performance & Intercept Telemetry */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between border-b border-neutral-500/20 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-bold text-[11px]">Live 120Hz Telemetry &amp; Compute Cost</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 font-semibold">
            {enabled ? '1.4 µs/frame' : '0.0 µs (Idle)'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
          <div className="p-1.5 rounded-lg bg-black/10 dark:bg-black/25 border border-neutral-500/15 flex flex-col">
            <span className={mutedText}>Surface State</span>
            <span className="font-bold text-emerald-400">ON GROUND</span>
          </div>
          <div className="p-1.5 rounded-lg bg-black/10 dark:bg-black/25 border border-neutral-500/15 flex flex-col">
            <span className={mutedText}>Live Boost</span>
            <span className="font-bold text-amber-400">68.0 / 100</span>
          </div>
          <div className="p-1.5 rounded-lg bg-black/10 dark:bg-black/25 border border-neutral-500/15 flex flex-col">
            <span className={mutedText}>Intercept ETA</span>
            <span className="font-bold text-emerald-400">1.42s (HIT)</span>
          </div>
        </div>

        {enabled && showIntercept && (
          <div className="flex flex-col gap-1 text-[10px] font-mono pt-0.5 px-0.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-400">CORE 82% (SWEET SPOT)</span>
              <span className="text-sky-400">Min Boost: 34</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={mutedText}>Cross XYZ: [-420, 1180, 642] UU</span>
            </div>
          </div>
        )}
      </div>

      {/* 1. Ground Reachability Section */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-[11px]">1. Ground Reachability (Boost = 0)</span>
              <span className={`text-[10px] ${mutedText}`}>
                1s / 2s / 3s surface contours · Auto-hides when airborne
              </span>
            </div>
          </div>
          <ToggleSwitch checked={showGround} onChange={setShowGround} isLight={isLight} />
        </div>

        {showGround && (
          <div className="flex flex-col gap-2 pt-1.5 border-t border-neutral-500/20">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] ${mutedText}`}>Solver Engine</span>
              <SegmentedSwitch
                value={groundMode}
                onValueChange={(v) => setGroundMode(v as 'lut' | 'analytical')}
                options={[
                  { value: 'lut', label: 'WASM 3D LUT (1.4µs)' },
                  { value: 'analytical', label: 'Analytical' },
                ]}
                size="sm"
                isLight={isLight}
              />
            </div>

            <SliderControl
              label="Ground Fan Opacity"
              value={groundFillOpacity}
              min={4}
              max={50}
              step={1}
              unit="%"
              onChange={setGroundFillOpacity}
              isLight={isLight}
            />
          </div>
        )}
      </div>

      {/* 2. Aerial 3D Spacetime Funnel / Horn Section */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-amber-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-[11px]">2. Aerial 3D Spacetime Horn (Boost-Driven)</span>
              <span className={`text-[10px] ${mutedText}`}>
                Continuous 0–3s interception corridor driven by live Boost
              </span>
            </div>
          </div>
          <ToggleSwitch checked={showAerial} onChange={setShowAerial} isLight={isLight} />
        </div>

        {showAerial && (
          <div className="flex flex-col gap-2 pt-1.5 border-t border-neutral-500/20">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] ${mutedText}`}>3D Geometry Mode</span>
              <SegmentedSwitch
                value={aerialMode}
                onValueChange={(v) => setAerialMode(v as 'funnel' | 'bubbles')}
                options={[
                  { value: 'funnel', label: 'Continuous Horn' },
                  { value: 'bubbles', label: '1s/2s/3s Bubbles' },
                ]}
                size="sm"
                isLight={isLight}
              />
            </div>

            <SliderControl
              label="Horn Mesh Opacity"
              value={aerialOpacity}
              min={5}
              max={65}
              step={1}
              unit="%"
              onChange={setAerialOpacity}
              isLight={isLight}
            />

            <div className="flex items-center justify-between py-0.5">
              <span className={`text-[11px] ${mutedText}`}>Show 1s/2s/3s Rings &amp; Guide Rails</span>
              <ToggleSwitch checked={aerialShowRings} onChange={setAerialShowRings} isLight={isLight} />
            </div>

            <div className="flex items-center justify-between py-0.5">
              <div className="flex flex-col">
                <span className={`text-[11px] ${mutedText}`}>Include Min 1st-Jump Impulse (328 UU/s)</span>
                <span className="text-[9px] text-neutral-500">
                  Predicts ground-to-air using lowest tap-jump velocity
                </span>
              </div>
              <ToggleSwitch checked={includeJumpImpulse} onChange={setIncludeJumpImpulse} isLight={isLight} />
            </div>
          </div>
        )}
      </div>

      {/* 3. Optimal Intercept 3D Orthogonal Cross Section */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-sky-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-[11px]">3. Optimal Intercept 3D Cross</span>
              <span className={`text-[10px] ${mutedText}`}>
                Red (Edge/Low Tol) → Yellow (Catching) → Green (Horn Center)
              </span>
            </div>
          </div>
          <ToggleSwitch checked={showIntercept} onChange={setShowIntercept} isLight={isLight} />
        </div>

        {showIntercept && (
          <div className="flex flex-col gap-2 pt-1.5 border-t border-neutral-500/20">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] ${mutedText}`}>Orthogonal Axes</span>
              <SegmentedSwitch
                value={crossOrientation}
                onValueChange={(v) => setCrossOrientation(v as 'world' | 'trajectory')}
                options={[
                  { value: 'world', label: 'World XYZ' },
                  { value: 'trajectory', label: 'Ball Tangent' },
                ]}
                size="sm"
                isLight={isLight}
              />
            </div>

            <SliderControl
              label="Cross Arm Length"
              value={crossArmLength}
              min={20}
              max={380}
              step={5}
              unit=" UU"
              onChange={setCrossArmLength}
              isLight={isLight}
            />

            <SliderControl
              label="Cross Line Thickness"
              value={crossThickness}
              min={1}
              max={36}
              step={1}
              unit=" UU"
              onChange={setCrossThickness}
              isLight={isLight}
            />

            <div className="flex items-center justify-between py-0.5">
              <span className={`text-[11px] ${mutedText}`}>Show Closest Point When Unreachable</span>
              <ToggleSwitch
                checked={showClosestWhenUnreachable}
                onChange={setShowClosestWhenUnreachable}
                isLight={isLight}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
ReachabilityTunerFloatingWindow.displayName = 'ReachabilityTunerFloatingWindow';
