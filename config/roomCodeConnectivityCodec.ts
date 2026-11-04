/**
 * roomCodeConnectivityCodec.ts
 * Pure-function room code encoder/decoder and 4-bit relay connectivity bitmask pipeline
 * for UI recipes and store bindings.
 */

export interface DecodedRandomRoomCode {
  mask: number;
  seed: number;
}

export interface ParsedUiRoomCode {
  mode: 'random' | 'custom';
  canonicalRoomCode: string;
  customPrefix: string;
  hostMask: number;
  seed: number | null;
}

const AFFINE_MUL = 3333;
const AFFINE_ADD = 4821;
const AFFINE_INV = 9997;
const AFFINE_MOD = 10000;
const MAX_RANDOM_SEED = 624;

export function clampRoomConnectivityMask(mask: number): number {
  if (!Number.isFinite(mask)) return 0;
  return Math.floor(mask) & 0x0f;
}

export function generateRandomFourDigitRoomCode(mask = 0x0f, explicitSeed?: number): string {
  const cleanMask = clampRoomConnectivityMask(mask);
  const seed =
    typeof explicitSeed === 'number' && Number.isFinite(explicitSeed)
      ? Math.max(0, Math.min(MAX_RANDOM_SEED, Math.floor(explicitSeed)))
      : Math.floor(Math.random() * (MAX_RANDOM_SEED + 1));

  const x = seed * 16 + cleanMask;
  const code = (x * AFFINE_MUL + AFFINE_ADD) % AFFINE_MOD;
  return String(code).padStart(4, '0');
}

export function decodeRandomFourDigitRoomCode(code4: string): DecodedRandomRoomCode | null {
  const trimmed = String(code4 || '').trim();
  if (!/^\d{4}$/.test(trimmed)) return null;
  const numeric = Number(trimmed);
  const shifted = (((numeric - AFFINE_ADD) % AFFINE_MOD) + AFFINE_MOD) % AFFINE_MOD;
  const x = (shifted * AFFINE_INV) % AFFINE_MOD;
  return {
    mask: x & 0x0f,
    seed: x >> 4,
  };
}

export function sanitizeCustomRoomPrefixInput(rawInput: string): string {
  return String(rawInput || '').replace(/[^a-zA-Z0-9]/g, '');
}

export function formatCustomRoomCodeWithMask(customInput: string, mask: number): string {
  const cleanPrefix = sanitizeCustomRoomPrefixInput(customInput).toLowerCase();
  if (!cleanPrefix) return '';
  return `${cleanPrefix}-${clampRoomConnectivityMask(mask).toString(16)}`;
}

export function applyMaskToRoomCodeInput(rawRoomCode: string, mask: number): string {
  const trimmed = String(rawRoomCode || '').trim();
  const cleanMask = clampRoomConnectivityMask(mask);

  const decoded = decodeRandomFourDigitRoomCode(trimmed);
  if (decoded) {
    return generateRandomFourDigitRoomCode(cleanMask, decoded.seed);
  }

  const customWithSuffix = /^([a-zA-Z0-9]+)(?:-[0-9a-fA-F])?$/.exec(trimmed);
  if (customWithSuffix && !/^\d+$/.test(customWithSuffix[1])) {
    return formatCustomRoomCodeWithMask(customWithSuffix[1], cleanMask);
  }

  return generateRandomFourDigitRoomCode(cleanMask);
}

/**
 * Sanitizes user input on the Room Code text box:
 * - For Host: if user types pure digits (up to 4), keeps digits; if user types custom alphanumeric,
 *   strips spaces/hyphens/special chars and appends `-<hex>` suffix on blur or commit.
 * - For Client Join: allows alphanumeric + single hyphen `-` for `<prefix>-<hex>`, normalized to lowercase on submit.
 */
export function sanitizeHostRoomCodeDraft(rawInput: string): string {
  const trimmed = String(rawInput || '');
  const withSingleSuffix = /^([a-zA-Z0-9]+)-([0-9a-fA-F]?)$/.exec(trimmed);
  if (withSingleSuffix) {
    return `${withSingleSuffix[1].toLowerCase()}-${withSingleSuffix[2].toLowerCase()}`;
  }
  return sanitizeCustomRoomPrefixInput(trimmed);
}

export function sanitizeJoinRoomCodeDraft(rawInput: string): string {
  return String(rawInput || '')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase();
}

export function finalizeHostRoomCode(rawInput: string, mask: number): string {
  const trimmed = String(rawInput || '').trim();
  const cleanMask = clampRoomConnectivityMask(mask);
  if (!trimmed) {
    return generateRandomFourDigitRoomCode(cleanMask);
  }
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  const matchSuffix = /^([a-zA-Z0-9]+)(?:-[0-9a-fA-F])?$/.exec(trimmed);
  if (matchSuffix) {
    const prefix = matchSuffix[1];
    if (/^\d+$/.test(prefix)) {
      return generateRandomFourDigitRoomCode(cleanMask, Number(prefix) % 625);
    }
    return formatCustomRoomCodeWithMask(prefix, cleanMask);
  }
  const cleanPrefix = sanitizeCustomRoomPrefixInput(trimmed);
  if (!cleanPrefix) {
    return generateRandomFourDigitRoomCode(cleanMask);
  }
  return formatCustomRoomCodeWithMask(cleanPrefix, cleanMask);
}

export function parseUiRoomCode(rawInput: string): ParsedUiRoomCode | null {
  const clean = String(rawInput || '')
    .trim()
    .toLowerCase();
  if (!clean) return null;

  const decoded = decodeRandomFourDigitRoomCode(clean);
  if (decoded) {
    return {
      mode: 'random',
      canonicalRoomCode: clean,
      customPrefix: '',
      hostMask: decoded.mask,
      seed: decoded.seed,
    };
  }

  const customMatch = /^([a-z0-9]+)-([0-9a-f])$/.exec(clean);
  if (customMatch) {
    const hostMask = parseInt(customMatch[2], 16) & 0x0f;
    return {
      mode: 'custom',
      canonicalRoomCode: `${customMatch[1]}-${hostMask.toString(16)}`,
      customPrefix: customMatch[1],
      hostMask,
      seed: null,
    };
  }

  const prefixOnly = sanitizeCustomRoomPrefixInput(clean);
  if (prefixOnly) {
    return {
      mode: 'custom',
      canonicalRoomCode: prefixOnly,
      customPrefix: prefixOnly,
      hostMask: 0x0f,
      seed: null,
    };
  }

  return null;
}
