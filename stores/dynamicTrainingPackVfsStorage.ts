/**
 * dynamicTrainingPackVfsStorage.ts
 * IndexedDB Virtual Filesystem (VFS) persistence and `.RCDPack` / JSON import-export
 * for Dynamic Training Pack scenarios (multi-car setups, overdub control tapes,
 * and fallback policies) using `rc-virtual-fs-db` (`category: 'dynamic-training-pack'`).
 */

import {
  vfsPutNodes,
  vfsGetAllByCategory,
  vfsDeleteByUuid,
  type VfsNodeRecord,
} from './staticTrainingPackVfsDriver';
import type { TrainingVariancePresetId } from '../config/kevpertVariancePresets';

export const DYNAMIC_PACK_ARCHIVE_MAGIC = 'RCDPACK_V1';

export interface PersistedDynamicCarSlotPayload {
  slotIndex: number;
  team: 0 | 1;
  role: 'player' | 'teammate' | 'opponent';
  displayName: string;
  colorHex?: string;
  fallbackPolicy: 'keep-previous' | 'nexto' | 'necto' | 'disappear';
  recordedTickCount?: number;
  initialCarConfig?: Record<string, unknown>;
  recordedControls?: Array<Record<string, unknown>>;
  tapeEndTick?: number;
}

export interface PersistedDynamicScenarioPayload {
  id: string;
  title: string;
  description: string;
  category:
    | 'passing-play'
    | 'shadow-defense'
    | 'rebound-read'
    | 'replay-slice'
    | 'multi-car-overdub';
  prerollSeconds: number;
  timeoutSeconds: number;
  playerCarSlotIndex: number;
  recommendedKevpertPreset?: TrainingVariancePresetId;
  carSlots: PersistedDynamicCarSlotPayload[];
  ball?: Record<string, unknown>;
  updatedAt?: number;
}

export function buildDynamicScenarioVfsPath(scenarioId: string): string {
  return `/dynamic-training-pack/${scenarioId}/scenario`;
}

export async function saveDynamicScenarioToVfs(
  scenario: PersistedDynamicScenarioPayload
): Promise<void> {
  if (!scenario || !scenario.id) return;
  const now = Date.now();
  const node: VfsNodeRecord = {
    path: buildDynamicScenarioVfsPath(scenario.id),
    category: 'dynamic-training-pack',
    uuid: scenario.id,
    nodeType: 'metadata',
    updatedAt: now,
    data: { ...scenario, updatedAt: now },
  };
  await vfsPutNodes([node]);
}

export async function loadAllDynamicScenariosFromVfs(): Promise<
  PersistedDynamicScenarioPayload[]
> {
  try {
    const records = await vfsGetAllByCategory('dynamic-training-pack');
    const results: PersistedDynamicScenarioPayload[] = [];
    for (const rec of records) {
      const p = rec.data as PersistedDynamicScenarioPayload | undefined;
      if (p && typeof p.id === 'string' && Array.isArray(p.carSlots)) {
        results.push(p);
      }
    }
    return results;
  } catch {
    return [];
  }
}

export async function deleteDynamicScenarioFromVfs(
  scenarioId: string
): Promise<void> {
  if (!scenarioId) return;
  await vfsDeleteByUuid(scenarioId);
}

export function exportDynamicScenariosArchiveJson(
  scenarios: PersistedDynamicScenarioPayload[],
  filename = 'dynamic-training-pack.RCDPack'
): void {
  const archive = {
    magic: DYNAMIC_PACK_ARCHIVE_MAGIC,
    exportedAt: new Date().toISOString(),
    scenarios,
  };
  const blob = new Blob([JSON.stringify(archive, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.RCDPack')
    ? filename
    : `${filename}.RCDPack`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseDynamicScenariosFromFile(
  file: File
): Promise<PersistedDynamicScenarioPayload[]> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (parsed && Array.isArray(parsed.scenarios)) {
    return parsed.scenarios.filter(
      (s: any) => s && typeof s.id === 'string' && Array.isArray(s.carSlots)
    );
  }
  if (parsed && typeof parsed.id === 'string' && Array.isArray(parsed.carSlots)) {
    return [parsed as PersistedDynamicScenarioPayload];
  }
  return [];
}
