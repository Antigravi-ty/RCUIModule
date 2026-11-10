import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Keyboard,
  RotateCcw,
  Sliders,
  Upload,
} from 'lucide-react';
import type { StandardSurfaceProps, SurfaceMeta } from '../../manifest/surfaceMetaTypes';
import { useFloatingStore } from '../../stores/floatingStore';
import { useKeyboardInputOverlayStore } from '../../stores/keyboardInputOverlayStore';
import { quickNotification } from '../../stores/quickNotificationStore';
import { KeyboardInputOverlayMatrixStage } from './keyboard-input-overlay/KeyboardInputOverlayMatrixStage';
import { KeyboardOverlayGeometryAndOpacitySection } from './keyboard-input-overlay/KeyboardOverlayGeometryAndOpacitySection';
import { KeyboardOverlayColorsAndArrowsSection } from './keyboard-input-overlay/KeyboardOverlayColorsAndArrowsSection';
import { KeyboardOverlayCarNoseArrowsSection } from './keyboard-input-overlay/KeyboardOverlayCarNoseArrowsSection';

export const SURFACE_META: SurfaceMeta = {
  id: 'keyboard-input-overlay',
  title: 'Keyboard Input Overlay',
  subtitle: '3x3 Retro Keycaps · 3D Attitude Arrows · Car Nose Arrows',
  description:
    'Adaptive 3x3 retro trapezoid keycap overlay (Q/W/E, A/S/D, Slide/Boost/Jump) with independent opacity superposition, camera-relative 3D WASD arrows, and 3D Car Nose Arrow rendering.',
  icon: 'keyboard',
  layer: 'floating-dev',
  menuGroup: 'active-tuners',
  defaultSizing: {
    width: 340,
    height: 410,
    minWidth: 240,
    minHeight: 240,
    mode: 'adaptive',
  },
  variants: [
    { variantId: 'overlay', label: '1. 3x3 Overlay' },
    { variantId: 'advanced', label: '2. Advanced Menu' },
  ],
};

export type KeyboardInputOverlayTab = 'overlay' | 'advanced';

export interface KeyboardInputOverlayFloatingWindowProps extends StandardSurfaceProps {
  active?: boolean;
  activeTab?: KeyboardInputOverlayTab | string;
}

export const KeyboardInputOverlayFloatingWindow: React.FC<
  KeyboardInputOverlayFloatingWindowProps
> = ({ isLight = false, active = true, activeTab: controlledTab, onTabChange }) => {
  const store = useKeyboardInputOverlayStore();
  const { opacity: globalFloatingOpacity } = useFloatingStore();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [localTab, setLocalTab] = useState<KeyboardInputOverlayTab>('overlay');
  const activeTab: KeyboardInputOverlayTab =
    controlledTab === 'overlay' || controlledTab === 'advanced'
      ? controlledTab
      : localTab;

  const handleSelectTab = (tab: KeyboardInputOverlayTab) => {
    setLocalTab(tab);
    onTabChange?.(tab);
  };

  const [copied, setCopied] = useState(false);
  const [imported, setImported] = useState(false);

  // Multiplicative Opacity Superposition:
  // Global Floating Window Opacity (e.g. 20%) * Keyboard Opacity (e.g. 500%) = 100% result.
  // Applied directly to the enclosing `[data-floating-window-id="keyboard-input-overlay"]` shell element
  // without mutating `FloatingWindowInstance.tsx` infrastructure.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const shellEl = el.closest('[data-floating-window-id]') as HTMLElement | null;
    if (!shellEl) return;

    const applySuperposedOpacity = () => {
      const globalFrac = Math.max(0.01, Math.min(1, (globalFloatingOpacity ?? 85) / 100));
      const keyFrac = Math.max(0.01, (store.keyboardOpacityPct ?? 100) / 100);
      const effectiveAlpha = store.compensateGlobalOpacity
        ? Math.max(0.02, Math.min(1, globalFrac * keyFrac))
        : Math.max(0.02, Math.min(1, globalFrac * Math.min(1, keyFrac)));
      shellEl.style.opacity = effectiveAlpha.toFixed(3);
    };

    applySuperposedOpacity();

    if (typeof MutationObserver !== 'undefined') {
      const mo = new MutationObserver(() => {
        const globalFrac = Math.max(0.01, Math.min(1, (globalFloatingOpacity ?? 85) / 100));
        const keyFrac = Math.max(0.01, (store.keyboardOpacityPct ?? 100) / 100);
        const desired = (
          store.compensateGlobalOpacity
            ? Math.max(0.02, Math.min(1, globalFrac * keyFrac))
            : Math.max(0.02, Math.min(1, globalFrac * Math.min(1, keyFrac)))
        ).toFixed(3);
        if (shellEl.style.opacity !== desired) {
          shellEl.style.opacity = desired;
        }
      });
      mo.observe(shellEl, { attributes: true, attributeFilter: ['style'] });
      return () => mo.disconnect();
    }
  }, [
    globalFloatingOpacity,
    store.keyboardOpacityPct,
    store.compensateGlobalOpacity,
  ]);

  if (!active) return null;

  const handleCopyJson = () => {
    try {
      const jsonStr = store.exportConfigJson();
      navigator?.clipboard?.writeText?.(jsonStr).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.warn('[KeyboardInputOverlay] Copy JSON failed:', err);
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
      console.warn('[KeyboardInputOverlay] Download JSON failed:', err);
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

  const inactiveTabTone = isLight
    ? 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'
    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800';

  const btnTone = isLight
    ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
    : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-200';

  return (
    <div
      ref={rootRef}
      data-ui-interactive="true"
      className="flex flex-col gap-2 text-xs select-none"
    >
      {/* Compact Top Mode Switcher & JSON Toolbar */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="grid grid-cols-2 gap-1 flex-1">
          <button
            type="button"
            onClick={() => handleSelectTab('overlay')}
            className={`flex items-center justify-center gap-1 py-1 px-2 rounded-lg border font-bold text-[11px] transition-all cursor-pointer ${
              activeTab === 'overlay'
                ? isLight
                  ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-xs'
                : inactiveTabTone
            }`}
          >
            <Keyboard className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">3x3 Overlay</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('advanced')}
            className={`flex items-center justify-center gap-1 py-1 px-2 rounded-lg border font-bold text-[11px] transition-all cursor-pointer ${
              activeTab === 'advanced'
                ? isLight
                  ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                  : 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-xs'
                : inactiveTabTone
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Advanced</span>
          </button>
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

          {activeTab === 'advanced' && (
            <>
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
            </>
          )}
        </div>
      </div>

      {activeTab === 'overlay' ? (
        <KeyboardInputOverlayMatrixStage isLight={isLight} />
      ) : (
        <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-0.5">
          {/* Compact Live Mini-Preview at top of Advanced Menu */}
          <KeyboardOverlayGeometryAndOpacitySection isLight={isLight} />
          <KeyboardOverlayCarNoseArrowsSection isLight={isLight} />
          <KeyboardOverlayColorsAndArrowsSection isLight={isLight} />
        </div>
      )}
    </div>
  );
};

KeyboardInputOverlayFloatingWindow.displayName =
  'KeyboardInputOverlayFloatingWindow';
export default KeyboardInputOverlayFloatingWindow;
