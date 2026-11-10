import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  RotateCcw,
  Sliders,
  Upload,
} from 'lucide-react';
import type { StandardSurfaceProps, SurfaceMeta } from '../../manifest/surfaceMetaTypes';
import { useKeyboardInputOverlayStore } from '../../stores/keyboardInputOverlayStore';
import { quickNotification } from '../../stores/quickNotificationStore';
import { KeyboardOverlayGeometryAndOpacitySection } from './keyboard-input-overlay/KeyboardOverlayGeometryAndOpacitySection';
import { KeyboardOverlayColorsAndArrowsSection } from './keyboard-input-overlay/KeyboardOverlayColorsAndArrowsSection';
import { KeyboardOverlayCarNoseArrowsSection } from './keyboard-input-overlay/KeyboardOverlayCarNoseArrowsSection';

export const SURFACE_META: SurfaceMeta = {
  id: 'keyboard-input-overlay-tuner',
  title: 'Keyboard Input Overlay Tuner',
  subtitle: '3x3 Retro Bevel · 3D Attitude Arrows · Car Nose Arrows',
  description:
    'Developer tuner for the 3x3 Keyboard Input Overlay (opacity superposition, trapezoid bevels, 3D WASD attitude arrows) and 4-way 3D Car Nose Arrows.',
  icon: 'keyboard',
  layer: 'floating-dev',
  menuGroup: 'active-tuners',
  defaultSizing: {
    width: 470,
    height: 640,
    minWidth: 340,
    minHeight: 240,
    mode: 'adaptive',
  },
};

export interface KeyboardInputOverlayTunerFloatingWindowProps
  extends StandardSurfaceProps {
  active?: boolean;
}

export const KeyboardInputOverlayTunerFloatingWindow: React.FC<
  KeyboardInputOverlayTunerFloatingWindowProps
> = ({ isLight = false, active = true }) => {
  const store = useKeyboardInputOverlayStore();
  const [copied, setCopied] = useState(false);
  const [imported, setImported] = useState(false);

  if (!active) return null;

  const handleCopyJson = () => {
    try {
      const jsonStr = store.exportConfigJson();
      navigator?.clipboard?.writeText?.(jsonStr).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.warn('[KeyboardInputOverlayTuner] Copy JSON failed:', err);
    }
  };

  const handleDownloadJson = () => {
    try {
      const jsonStr = store.exportConfigJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'keyboard-input-overlay-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('[KeyboardInputOverlayTuner] Download JSON failed:', err);
    }
  };

  const handleImportJson = async () => {
    try {
      let text = '';
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        try {
          text = await navigator.clipboard.readText();
        } catch {
          // clipboard permission unavailable
        }
      }
      if (!text.trim()) {
        quickNotification.warning(
          'Copy configuration JSON to clipboard before clicking Import'
        );
        return;
      }
      if (store.importConfigJson(text)) {
        setImported(true);
        setTimeout(() => setImported(false), 1800);
      } else {
        quickNotification.error('Invalid Keyboard Input Overlay JSON in clipboard');
      }
    } catch {
      quickNotification.error('Invalid Keyboard Input Overlay JSON in clipboard');
    }
  };

  const btnTone = isLight
    ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
    : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-200';

  return (
    <div
      data-ui-interactive="true"
      className="flex flex-col gap-2.5 text-xs select-none"
    >
      {/* Top JSON Configuration Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-wider truncate">
            Overlay &amp; 3D Car Nose Arrows Calibration
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopyJson}
            title="Copy Keyboard Input Overlay & Car Nose Arrow JSON configuration to clipboard"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold cursor-pointer transition-all active:scale-95 ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : btnTone
            }`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleImportJson}
            title="Import Keyboard Input Overlay JSON configuration from clipboard"
            className={`p-1 rounded-lg border cursor-pointer transition-all active:scale-95 ${
              imported
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : btnTone
            }`}
          >
            {imported ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            title="Download Keyboard Input Overlay JSON configuration file"
            className={`p-1 rounded-lg border cursor-pointer transition-all active:scale-95 ${btnTone}`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => store.resetDefaults()}
            title="Reset Keyboard Input Overlay & Car Nose Arrows to defaults"
            className={`p-1 rounded-lg border cursor-pointer transition-all active:scale-95 ${btnTone}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 max-h-[540px] overflow-y-auto pr-0.5">
        <KeyboardOverlayGeometryAndOpacitySection isLight={isLight} />
        <KeyboardOverlayCarNoseArrowsSection isLight={isLight} />
        <KeyboardOverlayColorsAndArrowsSection isLight={isLight} />
      </div>
    </div>
  );
};

KeyboardInputOverlayTunerFloatingWindow.displayName =
  'KeyboardInputOverlayTunerFloatingWindow';
export default KeyboardInputOverlayTunerFloatingWindow;
