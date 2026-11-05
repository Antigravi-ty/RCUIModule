import React, { useState, useEffect } from 'react';
import {
  Zap,
  Copy,
  Check,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';
import {
  getSupersonicTrailConfig,
  updateSupersonicTrailConfig,
  resetSupersonicTrailConfig,
  subscribeSupersonicTrailConfig,
  type SupersonicTrailOrientationMode,
  type SupersonicTrailBlendingMode,
} from '../../config/supersonicTrailConfig';
import { SegmentedSwitch } from '../../primitives/SegmentedSwitch';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { SliderControl } from '../../primitives/SliderControl';
import { TunerColorRow } from '../../compounds/TunerControls';
import { quickNotification } from '../../stores/quickNotificationStore';

export interface SupersonicTrailTunerFloatingWindowProps {
  isLight?: boolean;
  active?: boolean;
}

export const SupersonicTrailTunerFloatingWindow: React.FC<
  SupersonicTrailTunerFloatingWindowProps
> = ({ isLight = false }) => {
  const [cfg, setCfg] = useState(() => getSupersonicTrailConfig());
  const [copied, setCopied] = useState(false);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    return subscribeSupersonicTrailConfig((next) => {
      setCfg(next);
    });
  }, []);

  const handleCopyJson = () => {
    try {
      navigator.clipboard?.writeText(JSON.stringify(cfg, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('[SupersonicTrailTuner] Copy JSON failed:', err);
    }
  };

  const handleDownloadJson = () => {
    try {
      const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'supersonic-wheel-trail-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('[SupersonicTrailTuner] Download JSON failed:', err);
    }
  };

  const handleImportJson = async () => {
    try {
      let text = '';
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        try {
          text = await navigator.clipboard.readText();
        } catch {
          // clipboard permission denied
        }
      }
      if (!text.trim()) {
        quickNotification.warning('Copy Supersonic Trail JSON to clipboard before clicking Import');
        return;
      }
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        updateSupersonicTrailConfig(parsed);
        setImported(true);
        setTimeout(() => setImported(false), 2000);
      }
    } catch (err) {
      console.warn('[SupersonicTrailTuner] Import JSON failed:', err);
      quickNotification.error('Invalid Supersonic Trail JSON in clipboard');
    }
  };

  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-900'
    : 'bg-neutral-900/60 border-neutral-700/60 text-neutral-100';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const startSec = (cfg.startAgeTicks / 120).toFixed(3);
  const endSec = (cfg.endAgeTicks / 120).toFixed(3);
  const visibleSec = (Math.max(1, cfg.endAgeTicks - cfg.startAgeTicks) / 120).toFixed(3);

  return (
    <div className="flex flex-col gap-2.5 h-full select-none text-xs pb-2 overflow-y-auto pr-0.5">
      <div className={`p-2.5 rounded-xl border flex items-center justify-between shrink-0 ${cardBg}`}>
        <div className="flex items-center gap-2 min-w-0">
          <Zap className="h-4 w-4 text-purple-400 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs uppercase tracking-wide truncate">
              Supersonic Wheel Trail Tuner
            </span>
            <span className={`text-[10px] truncate ${mutedText}`}>
              Dual Rear-Wheel Contact Ribbons · White-to-Purple Taper
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleImportJson}
            title="Import Supersonic Trail JSON from clipboard"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all active:scale-95 ${
              imported
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isLight
                ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-200'
            }`}
          >
            {imported ? <Check className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
            <span>{imported ? 'Imported' : 'Import'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            title="Copy Supersonic Trail JSON to clipboard"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all active:scale-95 ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isLight
                ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-200'
            }`}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            title="Export Supersonic Trail JSON file"
            className={`p-1.5 rounded-lg border cursor-pointer transition-all active:scale-95 ${
              isLight
                ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-200'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => resetSupersonicTrailConfig()}
            title="Reset Supersonic Trail to calibrated defaults"
            className={`p-1.5 rounded-lg border cursor-pointer transition-all active:scale-95 ${
              isLight
                ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-200'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 1. Activation & Force Preview */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 shrink-0 ${cardBg}`}>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-purple-400">Force Active Trail</span>
              <span className={`text-[9px] ${mutedText}`}>Show without Supersonic</span>
            </div>
            <ToggleSwitch
              checked={Boolean(cfg.forceActive)}
              onCheckedChange={(forceActive) => updateSupersonicTrailConfig({ forceActive })}
              isLight={isLight}
            />
          </div>

          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg border border-neutral-500/20">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold">Enable Wheel Trails</span>
              <span className={`text-[9px] ${mutedText}`}>Global 8-car toggle</span>
            </div>
            <ToggleSwitch
              checked={Boolean(cfg.enabled)}
              onCheckedChange={(enabled) => updateSupersonicTrailConfig({ enabled })}
              isLight={isLight}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between px-2 py-1 rounded-lg border border-neutral-500/20">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium">Require Wheel Contact</span>
              <span className={`text-[9px] ${mutedText}`}>Ground / Ball / Car touch</span>
            </div>
            <ToggleSwitch
              checked={Boolean(cfg.requireWheelContact)}
              onCheckedChange={(requireWheelContact) =>
                updateSupersonicTrailConfig({ requireWheelContact })
              }
              isLight={isLight}
            />
          </div>

          <div className="flex items-center justify-between px-2 py-1 rounded-lg border border-neutral-500/20">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium">Suspension Compression</span>
              <span className={`text-[9px] ${mutedText}`}>Trigger on spring compress</span>
            </div>
            <ToggleSwitch
              checked={Boolean(cfg.useSuspensionCompression)}
              onCheckedChange={(useSuspensionCompression) =>
                updateSupersonicTrailConfig({ useSuspensionCompression })
              }
              isLight={isLight}
            />
          </div>
        </div>
      </div>

      {/* 2. Age Window (-startTicks to -endTicks @ 120Hz) */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 shrink-0 ${cardBg}`}>
        <div className="flex items-center justify-between border-b border-neutral-500/20 pb-1">
          <span className="font-bold text-[11px] text-purple-400">
            1. Contact History Window (120Hz Ticks)
          </span>
          <span className="font-mono text-[10px] opacity-80">
            -{cfg.startAgeTicks}t ({startSec}s) → -{cfg.endAgeTicks}t ({endSec}s) [{visibleSec}s]
          </span>
        </div>

        <SliderControl
          label="Start Emission Delay (-startAgeTicks)"
          description="0 to -N ticks near wheel remain unlit before glowing white"
          value={cfg.startAgeTicks}
          min={0}
          max={60}
          step={1}
          unit="t"
          editable={true}
          onChange={(val) =>
            updateSupersonicTrailConfig({
              startAgeTicks: val,
              endAgeTicks: Math.max(val + 2, cfg.endAgeTicks),
            })
          }
          isLight={isLight}
        />

        <SliderControl
          label="End Trail Cutoff (-endAgeTicks)"
          description="Tick age where purple tail tapers out (60t = 0.50s, 30t = 0.25s)"
          value={cfg.endAgeTicks}
          min={10}
          max={120}
          step={1}
          unit="t"
          editable={true}
          onChange={(val) =>
            updateSupersonicTrailConfig({
              endAgeTicks: Math.max(cfg.startAgeTicks + 2, val),
            })
          }
          isLight={isLight}
        />
      </div>

      {/* 3. White-to-Purple Luminous Color & Glow */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 shrink-0 ${cardBg}`}>
        <span className="font-bold text-[11px] text-purple-400 border-b border-neutral-500/20 pb-1">
          2. White-to-Purple Gradient &amp; Self-Luminous Glow
        </span>

        <TunerColorRow
          label="Fresh Contact Head Color (-startAge)"
          description="White glowing color at the start of the active trail window"
          value={cfg.headColor}
          onChange={(headColor) => updateSupersonicTrailConfig({ headColor })}
          isLight={isLight}
        />

        <TunerColorRow
          label="Aged Trail Tail Color (-endAge)"
          description="Purple trailing color as the contact trace ages toward -endAgeTicks"
          value={cfg.tailColor}
          onChange={(tailColor) => updateSupersonicTrailConfig({ tailColor })}
          isLight={isLight}
        />

        <SliderControl
          label="White Head Self-Emission Brightness"
          description="Overbright multiplier on fresh points so white head glows without post-bloom"
          value={cfg.headGlowStrength}
          min={1.0}
          max={4.0}
          step={0.05}
          unit="x"
          editable={true}
          onChange={(headGlowStrength) => updateSupersonicTrailConfig({ headGlowStrength })}
          isLight={isLight}
        />

        <SliderControl
          label="White → Purple Color Transition Curve"
          description="Exponent (<1 shifts purple closer to head, >1 keeps white longer)"
          value={cfg.colorTransitionCurve}
          min={0.2}
          max={3.0}
          step={0.05}
          editable={true}
          onChange={(colorTransitionCurve) => updateSupersonicTrailConfig({ colorTransitionCurve })}
          isLight={isLight}
        />

        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-semibold ${mutedText}`}>Blending Mode</span>
          <SegmentedSwitch
            value={cfg.blendingMode}
            onValueChange={(val) =>
              updateSupersonicTrailConfig({ blendingMode: val as SupersonicTrailBlendingMode })
            }
            options={[
              { value: 'additive', label: 'Additive Luminous (Glow)' },
              { value: 'normal', label: 'Normal Alpha Blend' },
            ]}
            size="sm"
            fullWidth
            isLight={isLight}
          />
        </div>
      </div>

      {/* 4. Taper Geometry & Surface Alignment */}
      <div className={`p-2.5 rounded-xl border flex flex-col gap-2 shrink-0 ${cardBg}`}>
        <span className="font-bold text-[11px] text-purple-400 border-b border-neutral-500/20 pb-1">
          3. Head-to-Tail Taper &amp; Surface Alignment
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
              { value: 'surface-aligned', label: 'Surface-Aligned (Hug Ground/Ball)' },
              { value: 'camera-facing', label: 'Camera-Facing Billboard' },
            ]}
            size="sm"
            fullWidth
            isLight={isLight}
          />
        </div>

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
          step={0.02}
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
          description="Offsets ribbon along contact normal to prevent z-fighting on ground/ramps"
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
    </div>
  );
};
