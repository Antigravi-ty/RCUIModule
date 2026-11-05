/**
 * temTrainingPackParser.ts
 * Converts parsed Rocket League Custom Training Pack (.Tem) documents into native
 * RocketCompanion .RCSPack bundles (StaticTrainingPackMetadata + StaticTrainingShotItem[]),
 * preserving all extra .Tem attributes inside metadata.description as structured JSON.
 */

import {
  type StaticTrainingPackMetadata,
  type StaticTrainingShotItem,
  type RCSPackArchive,
  MAX_SHOTS_PER_PACK,
  generateUUID,
  createDefaultShotItem,
  cloneShotItem,
} from './staticTrainingPackTypes';
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
 * Converts a parsed `.Tem` document into a native RocketCompanion Static Training Pack
 * (`StaticTrainingPackMetadata` + `StaticTrainingShotItem[]` + `RCSPackArchive`).
 *
 * - Maps directly supported physics/timing fields (`TM_Name`, `TM_Guid`, `CreatedAt`, `UpdatedAt`,
 *   `TimeLimit`, `Ball_GameEditor` location/speed/direction, `DynamicSpawnPointMesh` location/rotation/speed)
 * - Dumps all remaining `.Tem` metadata and per-round unmapped attributes (`Code`, `Type`, `Difficulty`,
 *   `CreatorName`, `CreatorPlayerID`, `MapName`, `Tags`, `bUnowned`, `VelocityStartRotationR`, `EditorFreeCam`,
 *   `savedataEnvelope`, `header`) as structured JSON into `metadata.description`.
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
    const ballRollUru = Number(ballArch?.VelocityStartRotationR ?? 0);

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

    const roundExtra: Record<string, unknown> = {
      roundIndex: round.round_index ?? idx + 1,
    };
    if (ballRollUru !== 0) {
      roundExtra.ballVelocityStartRotationRUru = ballRollUru;
      roundExtra.ballVelocityStartRotationRDeg = uruToDegrees(ballRollUru);
    }
    if (camArch) {
      roundExtra.editorFreeCam = {
        location: [
          Number(camArch.LocationX ?? 0),
          Number(camArch.LocationY ?? 0),
          Number(camArch.LocationZ ?? 0),
        ],
        rotationUru: [
          Number(camArch.RotationP ?? 0),
          Number(camArch.RotationY ?? 0),
          Number(camArch.RotationR ?? 0),
        ],
        rotationDeg: camArch.computed?.rotation_deg ?? null,
      };
    }
    if (unknownArchetypes.length > 0) {
      roundExtra.unrecognizedArchetypes = unknownArchetypes;
    }
    for (const [rk, rv] of Object.entries(round)) {
      if (rk !== 'TimeLimit' && rk !== 'SerializedArchetypes' && rk !== 'round_index') {
        roundExtra[rk] = rv;
      }
    }
    extraRoundAttributes.push(roundExtra);

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
          kickoffState,
          randomAngularVelocity: true,
          angularVelocity: [0, 0, 0],
        },
      },
      idx
    );
  });

  if (items.length === 0) {
    items.push(createDefaultShotItem(0));
  }

  const unmappedPackProperties: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(props)) {
    if (key === 'Rounds' || key === 'TM_Name' || key === 'TM_Guid') continue;
    unmappedPackProperties[key] = val;
  }

  const unmappedDescriptionDump: Record<string, unknown> = {
    sourceFormat: 'RL_TEM_SaveData',
    sourceFileName: parsedTem.fileName,
    temVariant: parsedTem.variant,
    crcValid: parsedTem.header.crcValid,
    storedCrc32: parsedTem.header.storedCrc32,
    calculatedCrc32: parsedTem.header.calculatedCrc32,
    savedataEnvelope: parsedTem.savedataEnvelope,
    rootProperties: parsedTem.rootProperties,
    properties: unmappedPackProperties,
    totalRoundsInTem: totalTemRoundsCount,
    importedShotsCount: items.length,
    ...(truncatedFromRoundsCount !== null
      ? { truncatedFromRounds: truncatedFromRoundsCount }
      : {}),
    roundExtras: extraRoundAttributes,
  };

  const descriptionJson = JSON.stringify(unmappedDescriptionDump, null, 2);

  const metadata: StaticTrainingPackMetadata = {
    uuid: rawGuid,
    title: rawTitle,
    description: descriptionJson,
    createdAt,
    updatedAt,
    itemCount: items.length,
  };

  const archive: RCSPackArchive = {
    format: 'RCSPack',
    version: 1,
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
