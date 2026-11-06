import rawCalibrationOverrides from './surfaceCalibrationOverrides.json';
import rawApprovalLedger from './uiApprovalLedger.json';
import type {
  SurfaceApprovalRecord,
  SurfaceCalibrationLedger,
  SurfaceCalibrationOverride,
  SurfaceSizingSpec,
  UiApprovalLedger,
} from './surfaceMetaTypes';

export const SURFACE_CALIBRATION_OVERRIDES: SurfaceCalibrationLedger =
  (rawCalibrationOverrides as SurfaceCalibrationLedger) ?? {};

export const UI_APPROVAL_LEDGER: UiApprovalLedger =
  (rawApprovalLedger as UiApprovalLedger) ?? {
    schemaVersion: 1,
    updatedAt: '',
    templateHash: '',
    surfaces: {},
  };

/**
 * Returns the RCUITuner calibration override entry for a given surface ID, if any.
 */
export function getSurfaceCalibrationOverride(
  surfaceId: string
): SurfaceCalibrationOverride | undefined {
  return SURFACE_CALIBRATION_OVERRIDES[surfaceId];
}

/**
 * Merges a surface's initial `SURFACE_META.defaultSizing` declaration with any
 * non-intrusive calibration overrides recorded by RCUITuner in
 * `manifest/surfaceCalibrationOverrides.json`.
 */
export function resolveCalibratedSurfaceSizing(
  surfaceId: string,
  defaultSizing: SurfaceSizingSpec
): SurfaceSizingSpec {
  const override = SURFACE_CALIBRATION_OVERRIDES[surfaceId];
  if (!override) {
    return { ...defaultSizing };
  }
  return {
    width: override.width ?? defaultSizing.width,
    height: override.height ?? defaultSizing.height,
    minWidth: override.minWidth ?? defaultSizing.minWidth,
    minHeight: override.minHeight ?? defaultSizing.minHeight,
    maxHeight: override.maxHeight ?? defaultSizing.maxHeight,
    mode: override.mode ?? defaultSizing.mode,
  };
}

/**
 * Merges a surface's initial default config object with any calibrated default config
 * overrides from `manifest/surfaceCalibrationOverrides.json`.
 */
export function resolveCalibratedDefaultConfig<TConfig extends object>(
  surfaceId: string,
  defaultConfig: TConfig
): TConfig {
  const override = SURFACE_CALIBRATION_OVERRIDES[surfaceId]?.defaultConfigOverrides;
  if (!override || typeof override !== 'object') {
    return defaultConfig;
  }
  return {
    ...defaultConfig,
    ...(override as Partial<TConfig>),
  };
}

/**
 * Looks up the 3-layer semantic hash approval record for a surface ID.
 */
export function getSurfaceApprovalRecord(
  surfaceId: string
): SurfaceApprovalRecord | undefined {
  return UI_APPROVAL_LEDGER.surfaces?.[surfaceId];
}
