import { create } from 'zustand';
import { syncBridge as crossClientSync } from './syncBridge';

export type CameraSettingsPresetId =
  | 'spine-aligned-default'
  | 'spine-hug-readout'
  | 'spine-centered-checkbox-cluster'
  | 'spine-detached-checkbox-card'
  | 'classic-settings-rows';

export type CameraReadoutContainerMode = 'uniform-longest' | 'hug-content' | 'plain-text';
export type CameraReadoutTextAlign = 'left' | 'center' | 'right';
export type CameraLabelTextAlign = 'right' | 'left';
export type CameraBooleanControlType = 'checkbox' | 'toggle-switch';
export type CameraCheckboxPlacement =
  | 'spine-left'
  | 'spine-center'
  | 'centered-cluster'
  | 'detached-card';
export type CameraCheckboxColorVariant = 'neutral' | 'amber' | 'orange' | 'sky' | 'emerald' | 'rose';
export type CameraCheckboxIconStyle = 'check' | 'bold-check' | 'dot' | 'minus';
export type CameraCheckboxAnimStyle = 'spring-scale' | 'crisp-fade' | 'bounce';
export type CameraSliderColorScheme = 'neutral' | 'amber' | 'orange' | 'sky' | 'emerald' | 'rose';

export type CameraResetButtonMode = 'big-button' | 'compact-row';
export type CameraResetButtonStyle =
  | 'danger-subtle'
  | 'danger-solid'
  | 'danger-outline'
  | 'neutral-hover-danger';
export type CameraResetButtonWidthMode = 'spine-width' | 'full-width' | 'centered-auto';
export type CameraResetConfirmMode = 'dialogue' | 'inline-two-step';

export interface CameraSettingsStyleConfig {
  /** Active preset identifier */
  preset: CameraSettingsPresetId;

  // ── 1. Spine Alignment & Form Centering ──
  /** Whether the entire [Label | Slider/Checkbox | Readout] spine block is horizontally centered in the panel */
  centerFormBlock: boolean;
  /** Manual horizontal fine-tuning offset in px when centering (default: 0) */
  formOffsetXPx: number;
  /** Vertical gap between rows in px (default: 2) */
  rowGapPx: number;
  /** Row vertical padding (top & bottom) in px (default: 6) */
  rowPaddingYPx: number;
  /** Row horizontal padding (left & right) in px (default: 10) */
  rowPaddingXPx: number;
  /** Row hover highlight border radius in px (default: 8) */
  rowBorderRadiusPx: number;
  /** Whether to show subtle row hover highlight background (default: true) */
  showRowHoverBg: boolean;
  /** Whether to render a vertical guide line along the left edge of the Slider spine for inspection (default: false) */
  showSpineGuideLine: boolean;

  // ── 2. Left Label Column (Right-Aligned to Slider Left Edge, Zero Leading Icon) ──
  /** Whether to show leading SVG icon before label text (default: false — no icon in front of text) */
  showRowIcon: boolean;
  /** Label text alignment relative to the Slider left edge ('right' = right-to-left against slider spine, 'left' = classic left edge) */
  labelTextAlign: CameraLabelTextAlign;
  /** Fixed width of the label column in px so all labels align cleanly on the spine (default: 152) */
  labelColumnWidthPx: number;
  /** Horizontal gap between right-aligned label text and the left edge of the Slider/Checkbox spine in px (default: 14) */
  labelToControlGapPx: number;
  /** Label font size in px (default: 13) */
  labelFontSizePx: number;
  /** Label font weight (default: 600) */
  labelFontWeight: number;

  // ── 3. Center Slider Spine (Equal Track Length) ──
  /** Exact equal width of all Slider progress tracks in px (default: 184) */
  sliderTrackWidthPx: number;
  /** Thickness of the Slider track bar in px (default: 6) */
  sliderTrackHeightPx: number;
  /** Diameter of the Slider thumb handle in px (default: 14) */
  sliderThumbSizePx: number;
  /** Active fill color scheme for Sliders (default: 'neutral') */
  sliderColorScheme: CameraSliderColorScheme;
  /** Whether to show - / + stepper buttons beside sliders (default: false) */
  sliderShowStepper: boolean;

  // ── 4. Right Value Readout Container (Left-Aligned Container & Left-to-Right Text) ──
  /** Horizontal gap between Slider right edge and Value Readout container left edge in px (default: 12) */
  controlToReadoutGapPx: number;
  /**
   * Readout container sizing & alignment mode:
   * - 'uniform-longest': All readout containers align their left edges AND stretch to match the longest readout container width; text inside is left-aligned.
   * - 'hug-content': All readout containers align their left edges right after the slider; each container hugs its own text width so longer numbers extend further right.
   * - 'plain-text': No container border/background box; numbers render directly left-aligned from left to right.
   */
  readoutContainerMode: CameraReadoutContainerMode;
  /** Text alignment inside the readout container ('left' = left-to-right display, 'center', 'right') */
  readoutTextAlign: CameraReadoutTextAlign;
  /** Minimum width of the readout column/container in px when 'uniform-longest' is active (default: 64) */
  readoutMinWidthPx: number;
  /** Readout font size in px (default: 12) */
  readoutFontSizePx: number;
  /** Readout horizontal padding in px (default: 8) */
  readoutPaddingXPx: number;
  /** Readout vertical padding in px (default: 2) */
  readoutPaddingYPx: number;
  /** Readout container border radius in px (default: 6) */
  readoutBorderRadiusPx: number;

  // ── 5. Checkbox Controls (Invert Swivel & Camera Shake) ──
  /** Control primitive used for Invert Swivel & Camera Shake ('checkbox' | 'toggle-switch', default: 'checkbox') */
  booleanControlType: CameraBooleanControlType;
  /**
   * How Checkbox items are positioned:
   * - 'spine-left': Label is right-aligned in the left column, Checkbox is left-aligned with the Slider's left edge in the middle spine.
   * - 'spine-center': Label is right-aligned in the left column, Checkbox is centered under the Slider track column.
   * - 'centered-cluster': Extracted as a special centered horizontal pair below the Sliders.
   * - 'detached-card': Extracted into a separate subtle card/group below the Sliders.
   */
  checkboxPlacement: CameraCheckboxPlacement;
  /** Extra top spacing above the Checkbox section in px (default: 4) */
  checkboxSectionTopGapPx: number;
  /** Checkbox square/squircle dimension in px (default: 18) */
  checkboxSizePx: number;
  /** Checkbox border radius in px (default: 5) */
  checkboxRadiusPx: number;
  /** Checkbox active color variant (default: 'amber') */
  checkboxVariant: CameraCheckboxColorVariant;
  /** Checkbox checkmark stroke width (default: 2.75) */
  checkboxStrokeWidth: number;
  /** Checkbox inner indicator style ('check' | 'bold-check' | 'dot' | 'minus') */
  checkboxIconStyle: CameraCheckboxIconStyle;
  /** Checkbox toggle animation style ('spring-scale' | 'crisp-fade' | 'bounce') */
  checkboxAnimationStyle: CameraCheckboxAnimStyle;
  /** High-contrast border when unchecked (default: false) */
  checkboxHighContrastUnchecked: boolean;
  /** Whether to show optional status text (e.g. "Enabled" / "Off") to the right of the checkbox (default: false) */
  checkboxShowStatusText: boolean;

  // ── 6. Big Reset Camera Defaults Button & Red Double-Check Dialogue ──
  /** Reset control presentation ('big-button' | 'compact-row', default: 'big-button') */
  resetButtonMode: CameraResetButtonMode;
  /** Visual color treatment for the big Reset button (default: 'danger-subtle') */
  resetButtonStyle: CameraResetButtonStyle;
  /** Horizontal width mode of the big Reset button ('spine-width' | 'full-width' | 'centered-auto', default: 'spine-width') */
  resetButtonWidthMode: CameraResetButtonWidthMode;
  /** Label text inside the big Reset button (default: 'Reset Camera Defaults') */
  resetButtonLabel: string;
  /** Whether to show the RotateCcw icon inside the big Reset button (default: true) */
  resetButtonShowIcon: boolean;
  /** Height of the big Reset button in px (default: 38) */
  resetButtonHeightPx: number;
  /** Font size of the big Reset button in px (default: 13) */
  resetButtonFontSizePx: number;
  /** Border radius of the big Reset button in px (default: 10) */
  resetButtonRadiusPx: number;
  /** Icon size inside the big Reset button in px (default: 15) */
  resetButtonIconSizePx: number;
  /** Top margin above the big Reset button in px (default: 10) */
  resetButtonTopMarginPx: number;
  /** Confirmation mechanism when clicking Reset ('dialogue' = red double-check Dialogue modal, 'inline-two-step' = inline button text change) */
  resetConfirmMode: CameraResetConfirmMode;
  /** Title of the double-check Dialogue modal (default: 'RESET CAMERA DEFAULTS') */
  resetDialogueTitle: string;
}

export const DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG: CameraSettingsStyleConfig = {
  preset: 'spine-aligned-default',

  // 1. Spine Alignment & Form Centering
  centerFormBlock: true,
  formOffsetXPx: 0,
  rowGapPx: 2,
  rowPaddingYPx: 6,
  rowPaddingXPx: 10,
  rowBorderRadiusPx: 8,
  showRowHoverBg: true,
  showSpineGuideLine: false,

  // 2. Left Label Column
  showRowIcon: false,
  labelTextAlign: 'right',
  labelColumnWidthPx: 152,
  labelToControlGapPx: 14,
  labelFontSizePx: 13,
  labelFontWeight: 600,

  // 3. Center Slider Spine
  sliderTrackWidthPx: 184,
  sliderTrackHeightPx: 6,
  sliderThumbSizePx: 14,
  sliderColorScheme: 'neutral',
  sliderShowStepper: false,

  // 4. Right Value Readout Container
  controlToReadoutGapPx: 12,
  readoutContainerMode: 'uniform-longest',
  readoutTextAlign: 'left',
  readoutMinWidthPx: 64,
  readoutFontSizePx: 12,
  readoutPaddingXPx: 8,
  readoutPaddingYPx: 2,
  readoutBorderRadiusPx: 6,

  // 5. Checkbox Controls
  booleanControlType: 'checkbox',
  checkboxPlacement: 'spine-left',
  checkboxSectionTopGapPx: 4,
  checkboxSizePx: 18,
  checkboxRadiusPx: 5,
  checkboxVariant: 'amber',
  checkboxStrokeWidth: 2.75,
  checkboxIconStyle: 'check',
  checkboxAnimationStyle: 'spring-scale',
  checkboxHighContrastUnchecked: false,
  checkboxShowStatusText: false,

  // 6. Big Reset Button & Red Double-Check Dialogue
  resetButtonMode: 'big-button',
  resetButtonStyle: 'danger-subtle',
  resetButtonWidthMode: 'spine-width',
  resetButtonLabel: 'Reset Camera Defaults',
  resetButtonShowIcon: true,
  resetButtonHeightPx: 38,
  resetButtonFontSizePx: 13,
  resetButtonRadiusPx: 10,
  resetButtonIconSizePx: 15,
  resetButtonTopMarginPx: 10,
  resetConfirmMode: 'dialogue',
  resetDialogueTitle: 'RESET CAMERA DEFAULTS',
};

export const CAMERA_SETTINGS_STYLE_PRESETS: Record<
  CameraSettingsPresetId,
  {
    id: CameraSettingsPresetId;
    label: string;
    shortLabel: string;
    description: string;
    patch: Partial<CameraSettingsStyleConfig>;
  }
> = {
  'spine-aligned-default': {
    id: 'spine-aligned-default',
    label: 'Option A (Default): Center-Axis Sliders + Right-Aligned Labels + Uniform Left-Aligned Readout + Center Checkboxes + Red Reset Button',
    shortLabel: 'Center-Axis + Uniform Readout (Default)',
    description:
      'Removes leading icons and right-aligns labels against a uniform center-axis slider column; right readout boxes share uniform width with left-aligned digits; Invert Swivel and Camera Shake use center-aligned checkboxes; Reset uses a confirmation dialogue.',
    patch: {
      ...DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG,
      preset: 'spine-aligned-default',
    },
  },
  'spine-hug-readout': {
    id: 'spine-hug-readout',
    label: 'Option B: Center-Axis Sliders + Auto-Width Readout Boxes + Center Checkboxes',
    shortLabel: 'Center-Axis + Auto-Width Readout',
    description:
      'Readout boxes sit flush against the right of each slider and size naturally to their character length while keeping digits left-aligned.',
    patch: {
      ...DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG,
      preset: 'spine-hug-readout',
      readoutContainerMode: 'hug-content',
    },
  },
  'spine-centered-checkbox-cluster': {
    id: 'spine-centered-checkbox-cluster',
    label: 'Option C: Center-Axis Sliders + Centered Dual-Column Checkbox Row',
    shortLabel: 'Centered Dual-Column Checkboxes',
    description:
      'Keeps the 7 sliders on a strict center axis while extracting Invert Swivel and Camera Shake into a centered side-by-side checkbox row.',
    patch: {
      ...DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG,
      preset: 'spine-centered-checkbox-cluster',
      checkboxPlacement: 'centered-cluster',
      checkboxSectionTopGapPx: 8,
    },
  },
  'spine-detached-checkbox-card': {
    id: 'spine-detached-checkbox-card',
    label: 'Option D: Center-Axis Sliders + Grouped Checkbox Card + Full-Width Reset Button',
    shortLabel: 'Grouped Checkbox Card + Full-Width Reset',
    description:
      'Places the two checkboxes inside a bordered group card and uses a full-width danger button for Reset Camera Defaults.',
    patch: {
      ...DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG,
      preset: 'spine-detached-checkbox-card',
      checkboxPlacement: 'detached-card',
      checkboxSectionTopGapPx: 8,
      resetButtonWidthMode: 'full-width',
    },
  },
  'classic-settings-rows': {
    id: 'classic-settings-rows',
    label: 'Option E (Legacy Baseline): Left-Aligned Icon Rows + Right ToggleSwitch',
    shortLabel: 'Legacy Left-Aligned Icon Rows',
    description:
      'Retains the classic left-aligned icon + title and right slider/toggle layout for A/B comparison against the center-axis layout.',
    patch: {
      ...DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG,
      preset: 'classic-settings-rows',
      showRowIcon: true,
      labelTextAlign: 'left',
      labelColumnWidthPx: 185,
      readoutContainerMode: 'uniform-longest',
      readoutTextAlign: 'right',
      booleanControlType: 'toggle-switch',
      checkboxPlacement: 'spine-left',
      resetButtonMode: 'compact-row',
    },
  },
};

const STORAGE_KEY = 'ui-storybook-camera-settings-style-v1';
const SYNC_KEY = 'store:cameraSettingsStyle:v1';

const normalizeConfig = (
  raw?: Partial<CameraSettingsStyleConfig>
): CameraSettingsStyleConfig => ({
  ...DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG,
  ...(raw && typeof raw === 'object' ? raw : {}),
});

const loadSavedConfig = (): CameraSettingsStyleConfig => {
  if (typeof localStorage === 'undefined') {
    return { ...DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG };
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG };
  }
};

const saveConfig = (cfg: CameraSettingsStyleConfig) => {
  if (!crossClientSync.isApplyingRemote()) {
    crossClientSync.set(SYNC_KEY, cfg);
  }
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // ignore storage errors
  }
};

const extractSnapshot = (s: CameraSettingsStyleConfig): CameraSettingsStyleConfig => ({
  preset: s.preset,
  centerFormBlock: s.centerFormBlock,
  formOffsetXPx: s.formOffsetXPx,
  rowGapPx: s.rowGapPx,
  rowPaddingYPx: s.rowPaddingYPx,
  rowPaddingXPx: s.rowPaddingXPx,
  rowBorderRadiusPx: s.rowBorderRadiusPx,
  showRowHoverBg: s.showRowHoverBg,
  showSpineGuideLine: s.showSpineGuideLine,
  showRowIcon: s.showRowIcon,
  labelTextAlign: s.labelTextAlign,
  labelColumnWidthPx: s.labelColumnWidthPx,
  labelToControlGapPx: s.labelToControlGapPx,
  labelFontSizePx: s.labelFontSizePx,
  labelFontWeight: s.labelFontWeight,
  sliderTrackWidthPx: s.sliderTrackWidthPx,
  sliderTrackHeightPx: s.sliderTrackHeightPx,
  sliderThumbSizePx: s.sliderThumbSizePx,
  sliderColorScheme: s.sliderColorScheme,
  sliderShowStepper: s.sliderShowStepper,
  controlToReadoutGapPx: s.controlToReadoutGapPx,
  readoutContainerMode: s.readoutContainerMode,
  readoutTextAlign: s.readoutTextAlign,
  readoutMinWidthPx: s.readoutMinWidthPx,
  readoutFontSizePx: s.readoutFontSizePx,
  readoutPaddingXPx: s.readoutPaddingXPx,
  readoutPaddingYPx: s.readoutPaddingYPx,
  readoutBorderRadiusPx: s.readoutBorderRadiusPx,
  booleanControlType: s.booleanControlType,
  checkboxPlacement: s.checkboxPlacement,
  checkboxSectionTopGapPx: s.checkboxSectionTopGapPx,
  checkboxSizePx: s.checkboxSizePx,
  checkboxRadiusPx: s.checkboxRadiusPx,
  checkboxVariant: s.checkboxVariant,
  checkboxStrokeWidth: s.checkboxStrokeWidth,
  checkboxIconStyle: s.checkboxIconStyle,
  checkboxAnimationStyle: s.checkboxAnimationStyle,
  checkboxHighContrastUnchecked: s.checkboxHighContrastUnchecked,
  checkboxShowStatusText: s.checkboxShowStatusText,
  resetButtonMode: s.resetButtonMode,
  resetButtonStyle: s.resetButtonStyle,
  resetButtonWidthMode: s.resetButtonWidthMode,
  resetButtonLabel: s.resetButtonLabel,
  resetButtonShowIcon: s.resetButtonShowIcon,
  resetButtonHeightPx: s.resetButtonHeightPx,
  resetButtonFontSizePx: s.resetButtonFontSizePx,
  resetButtonRadiusPx: s.resetButtonRadiusPx,
  resetButtonIconSizePx: s.resetButtonIconSizePx,
  resetButtonTopMarginPx: s.resetButtonTopMarginPx,
  resetConfirmMode: s.resetConfirmMode,
  resetDialogueTitle: s.resetDialogueTitle,
});

export interface CameraSettingsStyleStore extends CameraSettingsStyleConfig {
  setParam: <K extends keyof CameraSettingsStyleConfig>(
    key: K,
    value: CameraSettingsStyleConfig[K]
  ) => void;
  updateParams: (patch: Partial<CameraSettingsStyleConfig>) => void;
  applyPreset: (presetId: CameraSettingsPresetId) => void;
  resetToDefaults: () => void;
  exportConfigCode: () => string;
}

const initialConfig = normalizeConfig(
  crossClientSync.get<CameraSettingsStyleConfig>(SYNC_KEY, loadSavedConfig())
);

export const useCameraSettingsStyleStore = create<CameraSettingsStyleStore>((set, get) => ({
  ...initialConfig,

  setParam: (key, value) => {
    set((state) => {
      const next = normalizeConfig({
        ...extractSnapshot(state),
        [key]: value,
      });
      saveConfig(next);
      return next;
    });
  },

  updateParams: (patch) => {
    set((state) => {
      const next = normalizeConfig({
        ...extractSnapshot(state),
        ...patch,
      });
      saveConfig(next);
      return next;
    });
  },

  applyPreset: (presetId) => {
    const found = CAMERA_SETTINGS_STYLE_PRESETS[presetId];
    if (!found) return;
    set((state) => {
      const next = normalizeConfig({
        ...extractSnapshot(state),
        ...found.patch,
        preset: presetId,
      });
      saveConfig(next);
      return next;
    });
  },

  resetToDefaults: () => {
    const fresh = { ...DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG };
    saveConfig(fresh);
    set(() => fresh);
  },

  exportConfigCode: () => {
    const snapshot = extractSnapshot(get());
    return `export const DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG: CameraSettingsStyleConfig = ${JSON.stringify(
      snapshot,
      null,
      2
    )};`;
  },
}));

crossClientSync.registerDefault(SYNC_KEY, { ...DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG });

crossClientSync.onReset((scopePrefix) => {
  if (scopePrefix && !SYNC_KEY.startsWith(scopePrefix)) return;
  const fresh = { ...DEFAULT_CAMERA_SETTINGS_STYLE_CONFIG };
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  useCameraSettingsStyleStore.setState(fresh);
});

crossClientSync.subscribeKey<CameraSettingsStyleConfig>(SYNC_KEY, (remote) => {
  if (!remote || typeof remote !== 'object') return;
  const merged = normalizeConfig(remote);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // ignore
    }
  }
  useCameraSettingsStyleStore.setState(merged);
});
