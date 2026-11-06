import type React from 'react';

/**
 * Standard 4-Prop Shell Contract for all `Layer*Recipe` and `*FloatingWindow` surfaces.
 *
 * All domain data and mutations flow directly from Zustand stores (or are transparently
 * shadowed inside RCUITuner via `<StoreSnapshotScope overrides={{ ... }}>`).
 */
export interface StandardSurfaceProps {
  isLight?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onBack?: () => void;
}

export type SurfaceLayerKind =
  | 'floating-user'
  | 'floating-dev'
  | 'layer1'
  | 'layer2'
  | 'layer3'
  | 'layer4'
  | 'layer5';

export type SurfaceMenuGroup =
  | 'active-tuners'
  | 'calibrated-presets'
  | 'sandboxes'
  | 'user-floating'
  | 'menu-layer';

export type SurfaceSizingMode = 'fixed' | 'adaptive';

export interface SurfaceSizingSpec {
  width: number;
  height?: number | 'auto';
  minWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  mode?: SurfaceSizingMode;
}

export interface SurfaceVariantMeta {
  variantId: string;
  label: string;
  description?: string;
  storeOverrides?: Record<string, Record<string, unknown>>;
}

/**
 * Co-located declarative metadata exported by each `*FloatingWindow.tsx` and `Layer*Recipe.tsx`:
 * `export const SURFACE_META: SurfaceMeta = { ... };`
 */
export interface SurfaceMeta {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  layer: SurfaceLayerKind;
  menuGroup?: SurfaceMenuGroup;
  defaultSizing: SurfaceSizingSpec;
  defaultOpen?: boolean;
  variants?: SurfaceVariantMeta[];
}

export interface SurfaceCalibrationOverride extends Partial<SurfaceSizingSpec> {
  defaultConfigOverrides?: Record<string, unknown>;
  calibratedAt?: string;
  calibratedBy?: string;
}

export type SurfaceCalibrationLedger = Record<string, SurfaceCalibrationOverride>;

export type SurfaceApprovalStatus = 'approved' | 'rejected' | 'deferred' | 'pending';

/**
 * 3-Layer Semantic Fingerprint & Approval Record stored in `manifest/uiApprovalLedger.json`.
 *
 * - `templateHash`: Hash of the universal shell template (`Panel.tsx` / `UniversalThreeStageShell.tsx`)
 * - `sizingAndConfigHash`: Hash of resolved sizing + default config (`SURFACE_META.defaultSizing` + `surfaceCalibrationOverrides.json`)
 * - `visualAstHash`: Combined AST-normalized visual structure hash across the surface entry and its local UI subtree
 */
export interface SurfaceApprovalRecord {
  status: SurfaceApprovalStatus;
  surfaceKind: 'floating-window' | 'menu-recipe' | 'showcase-section';
  entryFile: string;
  templateHash: string;
  sizingAndConfigHash: string;
  visualAstHash: string;
  fileVisualHashes: Record<string, string>;
  alphaDeps: string[];
  approvedAt: string;
  note?: string;
}

export interface UiApprovalLedger {
  schemaVersion: 1;
  updatedAt: string;
  templateHash: string;
  surfaces: Record<string, SurfaceApprovalRecord>;
}

export interface DiscoveredSurfaceEntry {
  meta: SurfaceMeta;
  resolvedSizing: SurfaceSizingSpec;
  Component: React.ComponentType<StandardSurfaceProps>;
  modulePath: string;
}
