import type React from 'react';
import {
  SURFACE_CALIBRATION_OVERRIDES,
  UI_APPROVAL_LEDGER,
  getSurfaceApprovalRecord,
  getSurfaceCalibrationOverride,
  resolveCalibratedDefaultConfig,
  resolveCalibratedSurfaceSizing,
} from './surfaceCalibration';
import type {
  DiscoveredSurfaceEntry,
  StandardSurfaceProps,
  SurfaceApprovalRecord,
  SurfaceApprovalStatus,
  SurfaceCalibrationLedger,
  SurfaceCalibrationOverride,
  SurfaceLayerKind,
  SurfaceMenuGroup,
  SurfaceMeta,
  SurfaceSizingMode,
  SurfaceSizingSpec,
  SurfaceVariantMeta,
  UiApprovalLedger,
} from './surfaceMetaTypes';

export {
  SURFACE_CALIBRATION_OVERRIDES,
  UI_APPROVAL_LEDGER,
  getSurfaceApprovalRecord,
  getSurfaceCalibrationOverride,
  resolveCalibratedDefaultConfig,
  resolveCalibratedSurfaceSizing,
  type DiscoveredSurfaceEntry,
  type StandardSurfaceProps,
  type SurfaceApprovalRecord,
  type SurfaceApprovalStatus,
  type SurfaceCalibrationLedger,
  type SurfaceCalibrationOverride,
  type SurfaceLayerKind,
  type SurfaceMenuGroup,
  type SurfaceMeta,
  type SurfaceSizingMode,
  type SurfaceSizingSpec,
  type SurfaceVariantMeta,
  type UiApprovalLedger,
};

interface GlobSurfaceModule {
  SURFACE_META?: SurfaceMeta;
  default?: React.ComponentType<StandardSurfaceProps>;
  [exportName: string]: unknown;
}

declare global {
  interface ImportMeta {
    glob<T = unknown>(
      pattern: string,
      options?: { eager?: boolean }
    ): Record<string, T>;
  }
}

const floatingWindowModules: Record<string, GlobSurfaceModule> =
  typeof import.meta.glob === 'function'
    ? import.meta.glob<GlobSurfaceModule>(
        '../panels/{user,dev}/*FloatingWindow.tsx',
        { eager: true }
      )
    : {};

const recipeSurfaceModules: Record<string, GlobSurfaceModule> =
  typeof import.meta.glob === 'function'
    ? import.meta.glob<GlobSurfaceModule>('../recipes/Layer*Recipe.tsx', {
        eager: true,
      })
    : {};

function resolveModuleComponent(
  mod: GlobSurfaceModule
): React.ComponentType<StandardSurfaceProps> | null {
  if (typeof mod.default === 'function' || (mod.default && typeof mod.default === 'object')) {
    return mod.default as React.ComponentType<StandardSurfaceProps>;
  }
  for (const [key, value] of Object.entries(mod)) {
    if (key === 'SURFACE_META') continue;
    if (
      (key.endsWith('FloatingWindow') || key.endsWith('Recipe')) &&
      (typeof value === 'function' || (value && typeof value === 'object'))
    ) {
      return value as React.ComponentType<StandardSurfaceProps>;
    }
  }
  return null;
}

function collectDiscoveredEntries(
  modulesRecord: Record<string, GlobSurfaceModule>
): DiscoveredSurfaceEntry[] {
  const entries: DiscoveredSurfaceEntry[] = [];
  for (const [modulePath, mod] of Object.entries(modulesRecord)) {
    if (!mod || !mod.SURFACE_META) continue;
    const Component = resolveModuleComponent(mod);
    if (!Component) continue;
    const meta = mod.SURFACE_META;
    entries.push({
      meta,
      resolvedSizing: resolveCalibratedSurfaceSizing(meta.id, meta.defaultSizing),
      Component,
      modulePath,
    });
  }
  return entries.sort((a, b) => a.meta.id.localeCompare(b.meta.id));
}

const DISCOVERED_FLOATING_SURFACES: DiscoveredSurfaceEntry[] =
  collectDiscoveredEntries(floatingWindowModules);

const DISCOVERED_RECIPE_SURFACES: DiscoveredSurfaceEntry[] =
  collectDiscoveredEntries(recipeSurfaceModules);

/**
 * Returns all floating window surfaces that declare co-located `export const SURFACE_META`.
 */
export function getDiscoveredFloatingSurfaces(): DiscoveredSurfaceEntry[] {
  return DISCOVERED_FLOATING_SURFACES;
}

/**
 * Returns all menu layer recipe surfaces that declare co-located `export const SURFACE_META`.
 */
export function getDiscoveredRecipeSurfaces(): DiscoveredSurfaceEntry[] {
  return DISCOVERED_RECIPE_SURFACES;
}

/**
 * Filters discovered surfaces by `menuGroup` (e.g. `'active-tuners'`, `'calibrated-presets'`, `'sandboxes'`).
 */
export function getDiscoveredSurfacesByMenuGroup(
  menuGroup: SurfaceMenuGroup
): DiscoveredSurfaceEntry[] {
  return [...DISCOVERED_FLOATING_SURFACES, ...DISCOVERED_RECIPE_SURFACES].filter(
    (entry) => entry.meta.menuGroup === menuGroup
  );
}
