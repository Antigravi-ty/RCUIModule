import type React from 'react';

import type {
  DiscoveredSurfaceEntry,
  RootCauseClusterRecommendation,
  StandardSurfaceProps,
  SurfaceApprovalRecord,
  SurfaceApprovalStatus,
  SurfaceCalibrationLedger,
  SurfaceCalibrationOverride,
  SurfaceDriftState,
  SurfaceLayerKind,
  SurfaceMenuGroup,
  SurfaceMeta,
  SurfaceSizingMode,
  SurfaceSizingSpec,
  SurfaceTriageBucket,
  SurfaceTriageStatus,
  SurfaceVariantApprovalUnit,
  SurfaceVariantMeta,
  SurfaceVariantTriageStatus,
  UiApprovalLedger,
} from './surfaceMetaTypes';

export type { DiscoveredSurfaceEntry, RootCauseClusterRecommendation, StandardSurfaceProps, SurfaceApprovalRecord, SurfaceApprovalStatus, SurfaceCalibrationLedger, SurfaceCalibrationOverride, SurfaceDriftState, SurfaceLayerKind, SurfaceMenuGroup, SurfaceMeta, SurfaceSizingMode, SurfaceSizingSpec, SurfaceTriageBucket, SurfaceTriageStatus, SurfaceVariantApprovalUnit, SurfaceVariantMeta, SurfaceVariantTriageStatus, UiApprovalLedger };

import { collectDiscoveredEntries, getDiscoveredFloatingSurfaces, type GlobSurfaceModule } from './floatingSurfaceRegistry';

type ImportMetaGlobFn = <T = unknown>(
  pattern: string,
  options?: { eager?: boolean }
) => Record<string, T>;

const importMetaGlob = (import.meta as unknown as { glob?: ImportMetaGlobFn }).glob;

const recipeSurfaceModules: Record<string, GlobSurfaceModule> =
  typeof importMetaGlob === 'function'
    ? {
        ...importMetaGlob<GlobSurfaceModule>('../recipes/Layer*Recipe.tsx', {
          eager: true,
        }),
        ...importMetaGlob<GlobSurfaceModule>(
          '../recipes/StaticTrainingShotInspectorDrawer.tsx',
          { eager: true }
        ),
      }
    : {};

const DISCOVERED_RECIPE_SURFACES: DiscoveredSurfaceEntry[] =
  collectDiscoveredEntries(recipeSurfaceModules);



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
  return [...getDiscoveredFloatingSurfaces(), ...DISCOVERED_RECIPE_SURFACES].filter(
    (entry) => entry.meta.menuGroup === menuGroup
  );
}
