/**
 * temTrainingPackParser.ts
 * Converts parsed Rocket League Custom Training Pack (.Tem) documents into native
 * RocketCompanion Generation-2 .RLRCSPack / .RCSPack bundles (StaticTrainingPackMetadata + StaticTrainingShotItem[]),
 * mapping VelocityStartRotationR and EditorFreeCam directly into shot items, setting description to
 * "$Code by $CreatorName" (or empty), and storing remaining unmapped .Tem attributes in originalDescription.
 */

import {
  type StaticTrainingPackMetadata,
  type StaticTrainingShotItem,
  type StaticTrainingEditorFreeCam,
  type RCSPackArchive,
  MAX_SHOTS_PER_PACK,
  generateUUID,
  createDefaultShotItem,
  cloneShotItem,
} from './staticTrainingPackTypes';
import { resolveRecommendedVariationForPack } from './staticTrainingVariationTypes';
import {
  type TemSaveDataEnvelope,
  type TemObjectTypeEntry,
  type TemObjectRecord,
  type TemEnrichedArchetype,
  type TemRoundRecord,
  type ParsedTemTrainingPack,
  type ParsedTemDocument,
  uruToDegrees,
  uruToRadians,
  enrichTemArchetype,
  isTemBinaryPayload,
  parseTemBinaryBytes,
} from './temPropertyDeserializer';

export {
  type TemSaveDataEnvelope,
  type TemObjectTypeEntry,
  type TemObjectRecord,
  type TemEnrichedArchetype,
  type TemRoundRecord,
  type ParsedTemTrainingPack,
  type ParsedTemDocument,
  uruToDegrees,
  uruToRadians,
  enrichTemArchetype,
  isTemBinaryPayload,
  parseTemBinaryBytes,
};

const CAR_GROUND_SETTLE_THRESHOLD_Z = 45.0;
const CAR_GROUND_DEFAULT_Z = 17.05;
const BALL_GROUND_MIN_Z = 93.15;

export const RANK_ORDER_MAP: Record<string, number> = {
  Bronze: 1,
  Silver: 2,
  Gold: 3,
  Platinum: 4,
  Diamond: 5,
  Champion: 6,
  'Grand Champion': 7,
  'Supersonic Legend': 8,
  Progression: 9,
};

const MONTH_NAME_TO_NUM: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

export interface TemToRCSPackConversionResult {
  parsedTem: ParsedTemTrainingPack;
  metadata: StaticTrainingPackMetadata;
  items: StaticTrainingShotItem[];
  totalTemRoundsCount: number;
  truncatedFromRoundsCount: number | null;
  unmappedDescriptionDump: Record<string, unknown>;
  archive: RCSPackArchive;
}

export type ConvertedTemPackBundle = TemToRCSPackConversionResult;

function extractEpochMs(val: unknown, fallbackMs: number): number {
  if (typeof val === 'number' && val > 0) {
    return val < 10_000_000_000 ? Math.round(val * 1000) : Math.round(val);
  }
  if (val && typeof val === 'object' && 'epoch' in val) {
    const epochSec = Number((val as { epoch?: unknown }).epoch);
    if (Number.isFinite(epochSec) && epochSec > 0) {
      return Math.round(epochSec * 1000);
    }
  }
  return fallbackMs;
}

/**
 * Checks whether an EditorFreeCam pose in a `.Tem` round is Rocket League's untouched
 * default editor spawn camera (`location: [-600, -700, 530], pitch: -15°, yaw: 65°`).
 */
export function isDefaultRlEditorFreeCam(
  loc: [number, number, number],
  pitchDeg: number,
  yawDeg: number
): boolean {
  return (
    Math.abs(loc[0] - -600) < 25 &&
    Math.abs(loc[1] - -700) < 25 &&
    Math.abs(loc[2] - 530) < 25 &&
    Math.abs(pitchDeg - -15) < 1.8 &&
    Math.abs(yawDeg - 65) < 1.8
  );
}

/**
 * Derives structured folder/filter tags, competitive rank tier, and official release date
 * from a training pack's title, creator, code, and difficulty.
 */
export function derivePackTagsAndMetadata(params: {
  title: string;
  creator?: string | null;
  code?: string | null;
  difficulty?: unknown;
}): {
  tags: string[];
  rankTier?: string;
  releaseYearMonth?: string;
  normalizedCreator?: string;
} {
  const { title, creator, code, difficulty } = params;
  const tagSet = new Set<string>();
  const rawCreator = (creator || '').trim();
  const titleLower = (title || '').toLowerCase();
  const creatorLower = rawCreator.toLowerCase();

  let normalizedCreator = rawCreator || undefined;

  if (
    creatorLower.includes('kevpert') ||
    creatorLower.includes('hampert') ||
    creatorLower.includes('samuraipert') ||
    titleLower.includes('kevpert')
  ) {
    tagSet.add('Kevpert');
    if (!normalizedCreator) normalizedCreator = 'Kevpert';
  } else if (creatorLower === 'psyonix' || titleLower.includes('psyonix')) {
    tagSet.add('Psyonix');
    normalizedCreator = 'Psyonix';
  } else if (creatorLower.includes('poquito')) {
    tagSet.add('Poquito');
  } else if (creatorLower.includes('wayprotein')) {
    tagSet.add('Wayprotein');
  } else if (creatorLower.includes('biddles')) {
    tagSet.add('Biddles');
  } else if (creatorLower.includes('virge')) {
    tagSet.add('Virge');
  } else if (creatorLower.includes('coco')) {
    tagSet.add('Coco');
  } else if (code && code.trim().toUpperCase() === '0FB6-C16F-D26D-0A6F') {
    if (!normalizedCreator) normalizedCreator = 'Iowa';
    tagSet.add('Iowa');
  } else if (creatorLower.includes('mark_maboco') || titleLower.startsWith('boo ')) {
    tagSet.add('Mark_MaBoCo');
  }

  if (!code || !code.trim()) {
    tagSet.add('Local');
  } else if (normalizedCreator && !tagSet.has('Kevpert') && !tagSet.has('Psyonix')) {
    tagSet.add('Community');
  }

  // Extract Kevpert F-key tag if present
  const fKeyMatch = title.match(/\b(F3|F5|F7|F8|F9|F10|F11|F12)\b/i);
  if (fKeyMatch) {
    tagSet.add(fKeyMatch[1].toUpperCase());
  }

  // Detect Month + Year (e.g. "Sept 2022", "July 2023", "Nov 2024")
  let releaseYearMonth: string | undefined;
  const dateMatch = title.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2})\b/i
  );
  if (dateMatch) {
    const mKey = dateMatch[1].toLowerCase();
    const yr = dateMatch[2];
    const mNum = MONTH_NAME_TO_NUM[mKey] || '01';
    releaseYearMonth = `${yr}-${mNum}`;
    tagSet.add(releaseYearMonth);
    if (tagSet.has('Psyonix')) {
      tagSet.add(`Psyonix ${yr}`);
    }
  }

  // Detect Rank Tier or Progression
  let rankTier: string | undefined;
  if (/\bprogression\b/i.test(title)) {
    rankTier = 'Progression';
    tagSet.add('Progression');
  } else if (/\b(ssl|supersonic legend)\b/i.test(title)) {
    rankTier = 'Supersonic Legend';
  } else if (/\b(gc|grand champion)\b/i.test(title)) {
    rankTier = 'Grand Champion';
  } else if (/\bchampion\b/i.test(title)) {
    rankTier = 'Champion';
  } else if (/\bdiamond\b/i.test(title)) {
    rankTier = 'Diamond';
  } else if (/\bplatinum\b/i.test(title)) {
    rankTier = 'Platinum';
  } else if (/\bgold\b/i.test(title)) {
    rankTier = 'Gold';
  } else if (/\bsilver\b/i.test(title)) {
    rankTier = 'Silver';
  } else if (/\bbronze\b/i.test(title)) {
    rankTier = 'Bronze';
  } else if (difficulty && typeof difficulty === 'object' && 'EDifficulty' in difficulty) {
    const ediff = String((difficulty as { EDifficulty?: unknown }).EDifficulty || '');
    if (ediff === 'D_Easy') rankTier = 'Gold';
    else if (ediff === 'D_Medium') rankTier = 'Diamond';
    else if (ediff === 'D_Hard') rankTier = 'Champion';
  }

  if (rankTier) {
    tagSet.add(rankTier);
  }

  return {
    tags: Array.from(tagSet),
    rankTier,
    releaseYearMonth,
    normalizedCreator,
  };
}

/**
 * Converts a parsed `.Tem` document into a Generation-2 RocketCompanion Static Training Pack
 * (`RLRCSPack` / `RCSPackArchive`).
 *
 * - Maps directly supported physics/timing fields (`TM_Name`, `TM_Guid`, `CreatedAt`, `UpdatedAt`,
 *   `TimeLimit`, `Ball_GameEditor` location/speed/direction + `VelocityStartRotationR`,
 *   `DynamicSpawnPointMesh` location/rotation/speed, and `EditorFreeCam` camera pose).
 * - Sets `metadata.description` to `"$Code by $CreatorName"` (or `""` if neither exists).
 * - Stores only the remaining unmapped `.Tem` attributes in `metadata.originalDescription`.
 */
export function convertParsedTemToRCSPackBundle(
  parsedTem: ParsedTemTrainingPack
): TemToRCSPackConversionResult {
  const now = Date.now();
  const primaryObj =
    parsedTem.objects.find((o) => o.type.includes('TrainingEditorData_TA')) ||
    parsedTem.objects[0];
  const props = primaryObj?.properties || parsedTem.properties || {};

  const rawGuid =
    typeof props.TM_Guid === 'string' && props.TM_Guid.trim()
      ? props.TM_Guid.trim()
      : generateUUID();
  const rawTitle =
    typeof props.TM_Name === 'string' && props.TM_Name.trim()
      ? props.TM_Name.trim()
      : parsedTem.fileName.replace(/\.tem$/i, '') || 'Imported .Tem Pack';

  const rawCode =
    typeof props.Code === 'string' && props.Code.trim() ? props.Code.trim() : undefined;
  const rawCreator =
    typeof props.CreatorName === 'string' && props.CreatorName.trim()
      ? props.CreatorName.trim()
      : undefined;

  const createdAt = extractEpochMs(props.CreatedAt, now);
  const updatedAt = extractEpochMs(props.UpdatedAt, createdAt);

  const rawRounds = Array.isArray(props.Rounds) ? (props.Rounds as TemRoundRecord[]) : [];
  const totalTemRoundsCount = rawRounds.length;
  const cappedRounds = rawRounds.slice(0, MAX_SHOTS_PER_PACK);
  const truncatedFromRoundsCount =
    totalTemRoundsCount > MAX_SHOTS_PER_PACK ? totalTemRoundsCount : null;

  const extraRoundAttributes: Array<Record<string, unknown>> = [];
  const items: StaticTrainingShotItem[] = cappedRounds.map((round, idx) => {
    const archetypes = Array.isArray(round.SerializedArchetypes)
      ? round.SerializedArchetypes
      : [];

    let ballArch: TemEnrichedArchetype | null = null;
    let carArch: TemEnrichedArchetype | null = null;
    let camArch: TemEnrichedArchetype | null = null;
    const unknownArchetypes: unknown[] = [];

    for (const entry of archetypes) {
      if (entry && typeof entry === 'object') {
        const arch = entry as TemEnrichedArchetype;
        if (arch.role === 'Ball' || String(arch.ObjectArchetype || '').includes('Ball')) {
          ballArch = arch;
        } else if (
          arch.role === 'PlayerCarSpawn' ||
          String(arch.ObjectArchetype || '').includes('DynamicSpawnPointMesh')
        ) {
          carArch = arch;
        } else if (arch.role === 'EditorFreeCam' || arch.IsPC === true) {
          camArch = arch;
        } else {
          unknownArchetypes.push(arch);
        }
      } else {
        unknownArchetypes.push(entry);
      }
    }

    const timeoutSeconds = Number.isFinite(Number(round.TimeLimit))
      ? Math.max(1, Math.min(60, Number(round.TimeLimit)))
      : 10;

    const ballX = Number(ballArch?.StartLocationX ?? 0);
    const ballY = Number(ballArch?.StartLocationY ?? 0);
    const ballZ = Math.max(
      BALL_GROUND_MIN_Z,
      Number(ballArch?.StartLocationZ ?? BALL_GROUND_MIN_Z)
    );
    const ballSpeed = Math.max(0, Math.min(4000, Number(ballArch?.VelocityStartSpeed ?? 0)));
    const ballPitchRad = uruToRadians(Number(ballArch?.VelocityStartRotationP ?? 0));
    const ballYawRad = uruToRadians(Number(ballArch?.VelocityStartRotationY ?? 0));
    const ballRollRad = uruToRadians(Number(ballArch?.VelocityStartRotationR ?? 0));

    const kickoffState = ballSpeed <= 1e-3 && ballZ > BALL_GROUND_MIN_Z + 5.0;

    const carX = Number(carArch?.LocationX ?? 0);
    const carY = Number(carArch?.LocationY ?? -2400);
    const rawCarZ = Number(carArch?.LocationZ ?? 30);
    const carPitchRad = uruToRadians(Number(carArch?.RotationP ?? 0));
    const carYawRad = uruToRadians(Number(carArch?.RotationY ?? 16384));
    const carRollRad = uruToRadians(Number(carArch?.RotationR ?? 0));
    const carSpeed = Math.max(0, Math.min(2300, Number(carArch?.VelocityStartSpeed ?? 0)));

    const isCarGrounded =
      rawCarZ <= CAR_GROUND_SETTLE_THRESHOLD_Z &&
      Math.abs(carPitchRad) < 1e-3 &&
      Math.abs(carRollRad) < 1e-3;
    const effectiveCarZ = isCarGrounded
      ? CAR_GROUND_DEFAULT_Z
      : Math.max(CAR_GROUND_DEFAULT_Z, rawCarZ);

    let editorFreeCam: StaticTrainingEditorFreeCam | undefined;
    if (camArch) {
      const camLoc: [number, number, number] = [
        Number(camArch.LocationX ?? 0),
        Number(camArch.LocationY ?? 0),
        Number(camArch.LocationZ ?? 0),
      ];
      const camPitchUru = Number(camArch.RotationP ?? 0);
      const camYawUru = Number(camArch.RotationY ?? 0);
      const camRollUru = Number(camArch.RotationR ?? 0);
      const isDefaultOverview = isDefaultRlEditorFreeCam(
        camLoc,
        uruToDegrees(camPitchUru),
        uruToDegrees(camYawUru)
      );
      editorFreeCam = {
        location: camLoc,
        pitch: uruToRadians(camPitchUru),
        yaw: uruToRadians(camYawUru),
        roll: uruToRadians(camRollUru),
        ...(isDefaultOverview ? { isDefaultOverview: true } : {}),
      };
    }

    const roundExtra: Record<string, unknown> = {};
    if (unknownArchetypes.length > 0) {
      roundExtra.unrecognizedArchetypes = unknownArchetypes;
    }
    for (const [rk, rv] of Object.entries(round)) {
      if (rk !== 'TimeLimit' && rk !== 'SerializedArchetypes' && rk !== 'round_index') {
        roundExtra[rk] = rv;
      }
    }
    if (Object.keys(roundExtra).length > 0) {
      extraRoundAttributes.push({
        roundIndex: round.round_index ?? idx + 1,
        ...roundExtra,
      });
    }

    return cloneShotItem(
      {
        id: `${rawGuid}-shot-${idx}`,
        index: idx,
        name: `Shot ${idx + 1}`,
        timeoutSeconds,
        car: {
          location: [carX, carY, effectiveCarZ],
          headingYaw: carYawRad,
          headingPitch: isCarGrounded ? 0 : carPitchRad,
          airRoll: isCarGrounded ? 0 : carRollRad,
          speed: carSpeed,
          speedYaw: carYawRad,
          speedPitch: isCarGrounded ? 0 : carPitchRad,
          speedFollowsHeading: true,
          snapToGround: isCarGrounded,
          hasFlip: true,
          initialBoost: 100,
          unlimitedBoost: true,
        },
        ball: {
          location: [ballX, ballY, ballZ],
          speed: ballSpeed,
          speedYaw: ballYawRad,
          speedPitch: ballPitchRad,
          ...(Math.abs(ballRollRad) > 1e-6 ? { startRotationRoll: ballRollRad } : {}),
          kickoffState,
          randomAngularVelocity: false,
          angularVelocity: [0, 0, 0],
        },
        ...(editorFreeCam ? { editorFreeCam } : {}),
      },
      idx
    );
  });

  if (items.length === 0) {
    items.push(createDefaultShotItem(0));
  }

  const unmappedPackProperties: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(props)) {
    if (
      key === 'Rounds' ||
      key === 'TM_Name' ||
      key === 'TM_Guid' ||
      key === 'CreatedAt' ||
      key === 'UpdatedAt'
    ) {
      continue;
    }
    unmappedPackProperties[key] = val;
  }

  const unmappedDescriptionDump: Record<string, unknown> = {
    sourceFormat: 'RL_TEM_SaveData',
    sourceFileName: parsedTem.fileName,
    temVariant: parsedTem.variant,
    crcValid: parsedTem.header.crcValid,
    storedCrc32: parsedTem.header.storedCrc32,
    ...(parsedTem.savedataEnvelope ? { savedataEnvelope: parsedTem.savedataEnvelope } : {}),
    ...(Object.keys(parsedTem.rootProperties || {}).length > 0
      ? { rootProperties: parsedTem.rootProperties }
      : {}),
    properties: unmappedPackProperties,
    totalRoundsInTem: totalTemRoundsCount,
    importedShotsCount: items.length,
    ...(truncatedFromRoundsCount !== null
      ? { truncatedFromRounds: truncatedFromRoundsCount }
      : {}),
    ...(extraRoundAttributes.length > 0 ? { roundExtras: extraRoundAttributes } : {}),
  };

  const originalDescriptionJson = JSON.stringify(unmappedDescriptionDump, null, 2);

  // Default description: "$Code by $CreatorName" (e.g. "DEC7-4CAD-1452-30D3 by Kevpert") or empty
  let defaultDescription = '';
  if (rawCode && rawCreator) {
    defaultDescription = `${rawCode} by ${rawCreator}`;
  } else if (rawCode) {
    defaultDescription = rawCode;
  } else if (rawCreator) {
    defaultDescription = `by ${rawCreator}`;
  }

  const derived = derivePackTagsAndMetadata({
    title: rawTitle,
    creator: rawCreator,
    code: rawCode,
    difficulty: props.Difficulty,
  });

  const recommendedVariation = resolveRecommendedVariationForPack(
    rawCode,
    rawTitle,
    rawCreator
  );

  const metadata: StaticTrainingPackMetadata = {
    uuid: rawGuid,
    title: rawTitle,
    description: defaultDescription,
    originalDescription: originalDescriptionJson,
    ...(rawCode ? { code: rawCode } : {}),
    ...(derived.normalizedCreator ? { creator: derived.normalizedCreator } : {}),
    ...(derived.tags.length > 0 ? { tags: derived.tags } : {}),
    ...(derived.releaseYearMonth ? { releaseYearMonth: derived.releaseYearMonth } : {}),
    ...(derived.rankTier ? { rankTier: derived.rankTier } : {}),
    sourcePackType: 'RLRCSPack',
    ...(recommendedVariation ? { recommendedVariation } : {}),
    createdAt,
    updatedAt,
    itemCount: items.length,
  };

  const archive: RCSPackArchive = {
    format: 'RLRCSPack',
    version: 2,
    category: 'static-training-pack',
    metadata,
    items,
  };

  return {
    parsedTem,
    metadata,
    items,
    totalTemRoundsCount,
    truncatedFromRoundsCount,
    unmappedDescriptionDump,
    archive,
  };
}

/**
 * Convenience helper to parse a browser `File` (`.Tem` or `.decrypted.bin`) directly
 * into a `TemToRCSPackConversionResult`.
 */
export async function convertTemFileToRCSPackBundle(
  file: File
): Promise<TemToRCSPackConversionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const rawBytes = new Uint8Array(arrayBuffer);
  const parsedTem = parseTemBinaryBytes(rawBytes, file.name);
  return convertParsedTemToRCSPackBundle(parsedTem);
}

export const parseAndConvertTemFile = convertTemFileToRCSPackBundle;
