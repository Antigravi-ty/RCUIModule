/**
 * devBuiltInPacksLoader.ts
 * On-demand decoder for the 144 built-in Developer Mode `.RLRCSPack` training packs
 * converted from `Training.zip` and `TRAINIC.zip`.
 */

import {
  type StaticTrainingPackMetadata,
  type StaticTrainingShotItem,
  cloneShotItem,
} from './staticTrainingPackTypes';
import { decompressGzipOrText } from './staticTrainingPackCodec';
import {
  DEV_BUILTIN_RLRCSPACK_CATALOG_GZIP_B64,
  DEV_BUILTIN_RLRCSPACK_CATALOG_COUNT,
} from './devBuiltInPacksCatalogData';

export { DEV_BUILTIN_RLRCSPACK_CATALOG_COUNT };

export interface BuiltInDevPackEntry {
  metadata: StaticTrainingPackMetadata;
  items: StaticTrainingShotItem[];
}

let cachedCatalogPromise: Promise<BuiltInDevPackEntry[]> | null = null;

function decodeBase64ToBytes(b64: string): Uint8Array {
  if (typeof atob === 'function') {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  }
  const g = globalThis as unknown as { Buffer?: { from: (s: string, enc: string) => Uint8Array } };
  if (g.Buffer) {
    return new Uint8Array(g.Buffer.from(b64, 'base64'));
  }
  return new Uint8Array(0);
}

/**
 * Decodes and caches the 73 built-in Developer Mode `.RLRCSPack` packs.
 */
export async function loadBuiltInDevPacksCatalog(): Promise<BuiltInDevPackEntry[]> {
  if (!cachedCatalogPromise) {
    cachedCatalogPromise = (async () => {
      try {
        const gzBytes = decodeBase64ToBytes(DEV_BUILTIN_RLRCSPACK_CATALOG_GZIP_B64);
        const jsonText = await decompressGzipOrText(gzBytes);
        const rawList = JSON.parse(jsonText) as BuiltInDevPackEntry[];
        if (!Array.isArray(rawList)) return [];
        return rawList.map((entry) => ({
          metadata: {
            ...entry.metadata,
            isBuiltInDevPack: true,
          },
          items: (entry.items || []).map((it, idx) => cloneShotItem(it, idx)),
        }));
      } catch (err) {
        console.error('[devBuiltInPacksLoader] Failed to decode built-in dev packs catalog:', err);
        return [];
      }
    })();
  }
  return cachedCatalogPromise;
}
