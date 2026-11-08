import React, { useState, useEffect } from 'react';
import {
  Flame,
  Copy,
  Check,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';
import {
  getDemolitionShockwaveConfig,
  subscribeDemolitionShockwaveConfig,
  updateDemolitionShockwaveConfig,
  resetDemolitionShockwaveConfig,
} from '../../config/demolitionShockwaveConfig';
import { quickNotification } from '../../stores/quickNotificationStore';
import { DemolitionCoordinateSimulatorSection } from './demolition-shockwave-tuner/DemolitionCoordinateSimulatorSection';
import { DemolitionRingGeometryAndGradientSection } from './demolition-shockwave-tuner/DemolitionRingGeometryAndGradientSection';
import type { SurfaceMeta, StandardSurfaceProps } from '../../manifest/surfaceMetaTypes';

export const SURFACE_META: SurfaceMeta = {
  id: 'demolition-shockwave-tuner',
  title: 'Demolition Shockwave Active Tuner',
  layer: 'floating-dev',
  menuGroup: 'active-tuners',
  icon: 'Flame',
  defaultSizing: {
    width: 480,
    height: 640,
    minWidth: 360,
    minHeight: 220,
    maxHeight: 840,
    mode: 'adaptive',
  },
};

export interface DemolitionShockwaveTunerFloatingWindowProps extends StandardSurfaceProps {}

export const DemolitionShockwaveTunerFloatingWindow: React.FC<
  DemolitionShockwaveTunerFloatingWindowProps
> = ({ isLight = false }) => {
  const [cfg, setCfg] = useState(() => getDemolitionShockwaveConfig());
  const [copied, setCopied] = useState(false);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    return subscribeDemolitionShockwaveConfig((next) => {
      setCfg(next);
    });
  }, []);

  const cardBg = isLight
    ? 'bg-neutral-50 border-neutral-200 text-neutral-900'
    : 'bg-neutral-900/60 border-neutral-700/60 text-neutral-100';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const handleCopyJson = () => {
    try {
      navigator.clipboard?.writeText(JSON.stringify(cfg, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('[DemolitionShockwaveTuner] Copy JSON failed:', err);
    }
  };

  const handleDownloadJson = () => {
    try {
      const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'demolition-shockwave-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('[DemolitionShockwaveTuner] Download JSON failed:', err);
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
        quickNotification.warning(
          'Copy Demolition Shockwave JSON to clipboard before clicking Import'
        );
        return;
      }
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        updateDemolitionShockwaveConfig(parsed);
        setImported(true);
        setTimeout(() => setImported(false), 2000);
      }
    } catch (err) {
      console.warn('[DemolitionShockwaveTuner] Import JSON failed:', err);
      quickNotification.error('Invalid Demolition Shockwave JSON in clipboard');
    }
  };

  return (
    <div className="flex flex-col gap-2.5 h-full select-none text-xs pb-2 overflow-y-auto pr-0.5">
      <div
        className={`p-2.5 rounded-xl border flex items-center justify-between shrink-0 ${cardBg}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Flame className="h-4 w-4 text-rose-400 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs uppercase tracking-wide truncate">
              Demolition Shockwave Active Tuner
            </span>
            <span className={`text-[10px] truncate ${mutedText}`}>
              Single-Quad Camera-Facing Shockwave Ring · XYZ Coordinate Explosion Simulator
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleImportJson}
            title="Import Demolition Shockwave JSON from clipboard"
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
            title="Copy Demolition Shockwave JSON to clipboard"
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
            title="Export Demolition Shockwave JSON file"
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
            onClick={() => resetDemolitionShockwaveConfig()}
            title="Reset Demolition Shockwave to calibrated defaults"
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

      <DemolitionCoordinateSimulatorSection cfg={cfg} isLight={isLight} />
      <DemolitionRingGeometryAndGradientSection cfg={cfg} isLight={isLight} />
    </div>
  );
};
