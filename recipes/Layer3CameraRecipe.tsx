import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { dialogue } from '../compounds/Dialogue';
import { useMenuLayoutStore, DEFAULT_PANEL_SIZING } from '../tokens/menuLayoutStore';
import {
  useCameraSettingsStyleStore,
  DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG,
  type CameraSettingsStyleConfig,
} from '../tokens/cameraSettingsStyleStore';
import {
  CAMERA_SLIDER_SPECS,
  DEFAULT_CAMERA_CONFIG,
  DEFAULT_CAMERA_SETTINGS,
  normalizeCameraSettings,
  toCameraConfig,
  type CameraConfig,
  type CameraProfileSettings,
  type CameraSettingsInput,
  type CameraSliderSpec,
  type CameraBooleanSpec,
} from './camera/cameraConfigSpecs';
import {
  CameraSliderRow,
  CameraBooleanSection,
  CameraResetSection,
} from './camera/CameraSettingsRows';

export {
  DEFAULT_CAMERA_CONFIG,
  DEFAULT_CAMERA_SETTINGS,
  CAMERA_SLIDER_SPECS,
  normalizeCameraSettings,
  toCameraConfig,
  type CameraConfig,
  type CameraProfileSettings,
  type CameraSettingsInput,
  type CameraSliderSpec,
  type CameraBooleanSpec,
};

export interface Layer3CameraRecipeProps {
  isLight?: boolean;
  developerMode?: boolean;
  /** Controlled camera settings (supports both CameraConfig and legacy CameraProfileSettings keys) */
  settings?: CameraSettingsInput;
  /** Alias for controlled settings */
  config?: CameraSettingsInput;
  /** Uncontrolled initial camera settings */
  defaultSettings?: CameraSettingsInput;
  /** Alias for defaultSettings */
  defaultConfig?: CameraSettingsInput;
  /** Optional style parameter overrides for isolated multi-variant shootout comparison */
  styleParams?: Partial<CameraSettingsStyleConfig>;
  onChange?: (settings: CameraProfileSettings, patch: Partial<CameraConfig>) => void;
  onConfigChange?: (config: CameraConfig, patch: Partial<CameraConfig>) => void;
  onReset?: (defaults: CameraConfig) => void;
  onHoldLivePreviewChange?: (active: boolean) => void;
  onCollapsePreview?: () => void;
  onBack?: () => void;
  className?: string;
}

/**
 * [Recipe] Layer 3 Camera Settings (User & Developer Tier)
 * Supports the Spine-Aligned Camera Settings design driven by `useCameraSettingsStyleStore`:
 * - All 7 Sliders share the exact same track width and vertical spine alignment, forming a crisp center dividing line.
 * - Left labels omit leading icons by default and align right-to-left against the Slider's left edge.
 * - Right value readout containers align on their left edge immediately after the Slider; shorter containers
 *   match the longest container width ('uniform-longest') or hug content ('hug-content'), with text left-aligned ('left').
 * - Invert Swivel & Camera Shake use the tactile `<Checkbox>` primitive aligned on the spine or extracted into a special group.
 * - Reset Camera Defaults renders as a big icon+label action button that triggers a red double-check `Dialogue` confirmation.
 */
export const Layer3CameraRecipe: React.FC<Layer3CameraRecipeProps> = React.memo(({
  isLight = false,
  developerMode = false,
  settings: propSettings,
  config: propConfig,
  defaultSettings,
  defaultConfig,
  styleParams,
  onChange,
  onConfigChange,
  onReset,
  onCollapsePreview,
  onBack = () => {},
  className = '',
}) => {
  const controlledInput = propSettings ?? propConfig;
  const initialInput = defaultSettings ?? defaultConfig;

  const [internalSettings, setInternalSettings] = useState<CameraProfileSettings>(() =>
    normalizeCameraSettings(
      {
        presetId: 'default',
        ...DEFAULT_CAMERA_SETTINGS,
      },
      initialInput
    )
  );

  const settings = normalizeCameraSettings(internalSettings, controlledInput);
  const [confirmReset, setConfirmReset] = useState(false);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const storeConfig = useCameraSettingsStyleStore();
  const cfg: CameraSettingsStyleConfig = {
    ...DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG,
    ...storeConfig,
    ...(styleParams || {}),
  };

  const sizing = useMenuLayoutStore(
    (s) => s.panels?.['layer3-camera'] ?? DEFAULT_PANEL_SIZING['layer3-camera']
  );

  // Measure the longest readout width across all 7 slider rows so all 3-column rows stay 100% locked
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [measuredMaxReadoutW, setMeasuredMaxReadoutW] = useState<number>(cfg.readoutMinWidthPx);

  useLayoutEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;
    const nodes = el.querySelectorAll<HTMLElement>('[data-camera-readout-measure="true"]');
    let maxIntrinsic = 0;
    nodes.forEach((node) => {
      const w = Math.ceil(node.scrollWidth);
      if (w > maxIntrinsic) maxIntrinsic = w;
    });
    const extraPad = cfg.readoutContainerMode === 'plain-text' ? 4 : cfg.readoutPaddingXPx * 2 + 4;
    const resolvedW = Math.max(cfg.readoutMinWidthPx, maxIntrinsic + extraPad);
    if (resolvedW !== measuredMaxReadoutW) {
      setMeasuredMaxReadoutW(resolvedW);
    }
  }, [
    settings,
    cfg.readoutMinWidthPx,
    cfg.readoutFontSizePx,
    cfg.readoutPaddingXPx,
    cfg.readoutContainerMode,
    measuredMaxReadoutW,
  ]);

  useEffect(() => {
    if (!confirmReset) return;
    const timer = window.setTimeout(() => setConfirmReset(false), 2600);
    return () => window.clearTimeout(timer);
  }, [confirmReset]);

  const updateField = <K extends keyof CameraProfileSettings>(
    key: K,
    value: CameraProfileSettings[K]
  ) => {
    const rawPatch: CameraSettingsInput = { [key]: value };
    if (key === 'fovDeg' || key === 'fov') {
      rawPatch.fov = Number(value);
      rawPatch.fovDeg = Number(value);
    } else if (key === 'distanceUu' || key === 'distance') {
      rawPatch.distance = Number(value);
      rawPatch.distanceUu = Number(value);
    } else if (key === 'heightUu' || key === 'height') {
      rawPatch.height = Number(value);
      rawPatch.heightUu = Number(value);
    }
    const next = normalizeCameraSettings(settings, rawPatch);
    const configKey: keyof CameraConfig =
      key === 'fovDeg'
        ? 'fov'
        : key === 'distanceUu'
        ? 'distance'
        : key === 'heightUu'
        ? 'height'
        : (key as keyof CameraConfig);
    const configPatch: Partial<CameraConfig> = {
      [configKey]: next[configKey],
    };
    setInternalSettings(next);
    onChange?.(next, configPatch);
    onConfigChange?.(toCameraConfig(next), configPatch);
  };

  const executeResetDefaults = () => {
    const next: CameraProfileSettings = {
      presetId: 'default',
      ...DEFAULT_CAMERA_SETTINGS,
    };
    const nextCfg = toCameraConfig(next);
    setInternalSettings(next);
    onChange?.(next, nextCfg);
    onConfigChange?.(nextCfg, nextCfg);
    onReset?.(nextCfg);
    setConfirmReset(false);
  };

  const handleResetButtonClick = () => {
    if (cfg.resetConfirmMode === 'dialogue') {
      dialogue.show({
        id: 'camera-settings-reset-confirm',
        title: cfg.resetDialogueTitle || 'RESET CAMERA DEFAULTS',
        tone: 'error',
        icon: 'octagon-alert',
        isLight,
        content: (
          <div className="flex flex-col gap-2 text-xs leading-relaxed">
            <p className={isLight ? 'text-neutral-700 font-medium' : 'text-neutral-200 font-medium'}>
              Are you sure you want to restore all Camera Settings to their factory competitive defaults?
            </p>
            <div
              className={`p-2.5 rounded-lg border font-mono text-[11px] grid grid-cols-2 gap-x-4 gap-y-1 ${
                isLight
                  ? 'bg-rose-50/70 border-rose-200/80 text-rose-900'
                  : 'bg-rose-950/35 border-rose-800/60 text-rose-200'
              }`}
            >
              <span>FOV: 110°</span>
              <span>Distance: 270 UU</span>
              <span>Height: 100 UU</span>
              <span>Pitch Angle: -4°</span>
              <span>Stiffness: 0.45</span>
              <span>Swivel Speed: 4.7</span>
              <span>Transition: 1.2</span>
              <span>Shake / Invert: Off</span>
            </div>
          </div>
        ),
        buttons: [
          {
            label: 'Reset Camera Defaults',
            variant: 'danger',
            onClick: () => {
              executeResetDefaults();
            },
          },
          {
            label: 'Cancel',
            variant: 'outline',
          },
        ],
      });
      return;
    }

    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    executeResetDefaults();
  };

  const readoutColWidthPx = Math.max(cfg.readoutMinWidthPx, measuredMaxReadoutW);
  const stepperExtraWidthPx = cfg.sliderShowStepper ? 64 : 0;
  const controlColWidthPx = cfg.sliderTrackWidthPx + stepperExtraWidthPx;
  const totalSpineWidthPx =
    cfg.labelColumnWidthPx +
    cfg.labelToControlGapPx +
    controlColWidthPx +
    cfg.controlToReadoutGapPx +
    readoutColWidthPx +
    cfg.rowPaddingXPx * 2;

  const rowHoverClasses = cfg.showRowHoverBg
    ? isLight
      ? 'hover:bg-neutral-200/65'
      : 'hover:bg-white/[0.055]'
    : '';

  return (
    <PanelContainer
      isLight={isLight}
      sizing={sizing}
      data-developer-mode={developerMode ? 'true' : 'false'}
      className={`w-full select-none transition-opacity duration-200 ${className}`}
    >
      <PanelHeader
        isLight={isLight}
        title="CAMERA SETTINGS"
        onBack={onBack}
        onRightAction={onCollapsePreview}
        rightActionLabel="Live Preview"
        onRightActionHoverChange={(hovered) =>
          setHoveredDesc(
            hovered
              ? 'Press TAB or click to dock panel to the side and inspect live 3D camera geometry.'
              : null
          )
        }
      />

      <PanelContent scrollable={true}>
        <div
          ref={listContainerRef}
          data-layout="camera-settings-list"
          data-camera-preset={cfg.preset}
          className={`flex flex-col w-full ${
            cfg.centerFormBlock ? 'items-center' : 'items-start'
          }`}
          style={{
            transform:
              cfg.formOffsetXPx !== 0 ? `translateX(${cfg.formOffsetXPx}px)` : undefined,
          }}
        >
          {/* 1–7. Spine-Aligned Camera Geometry Sliders */}
          <div
            className="flex flex-col max-w-full"
            style={{ gap: `${cfg.rowGapPx}px` }}
          >
            {CAMERA_SLIDER_SPECS.map((spec) => (
              <CameraSliderRow
                key={spec.key}
                spec={spec}
                rawValue={settings[spec.key]}
                cfg={cfg}
                isLight={isLight}
                controlColWidthPx={controlColWidthPx}
                readoutColWidthPx={readoutColWidthPx}
                rowHoverClasses={rowHoverClasses}
                onUpdate={updateField}
                onHoverDesc={setHoveredDesc}
              />
            ))}

            {/* 8–9. Checkbox Controls (Invert Swivel & Camera Shake) */}
            <CameraBooleanSection
              settings={settings}
              cfg={cfg}
              isLight={isLight}
              controlColWidthPx={controlColWidthPx}
              readoutColWidthPx={readoutColWidthPx}
              rowHoverClasses={rowHoverClasses}
              onUpdate={updateField}
              onHoverDesc={setHoveredDesc}
            />
          </div>

          {/* 10. Big Reset Camera Defaults Action Button (with Red Double-Check Dialogue) */}
          <CameraResetSection
            cfg={cfg}
            isLight={isLight}
            confirmReset={confirmReset}
            totalSpineWidthPx={totalSpineWidthPx}
            onResetClick={handleResetButtonClick}
            onHoverDesc={setHoveredDesc}
          />
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Adjust field of view, distance, height, pitch angle, stiffness, swivel speed, transition speed, and camera shake."
        hoveredDescription={hoveredDesc}
        rightLabel="Live Preview"
        rightShortcut="TAB"
        onRightClick={onCollapsePreview}
      />
    </PanelContainer>
  );
});

Layer3CameraRecipe.displayName = 'Layer3CameraRecipe';
