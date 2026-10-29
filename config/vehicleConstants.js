/**
 * vehicleConstants.js
 * Pure, zero-dependency vehicle hitbox, 3D visual model, and role/loadout constants.
 *
 * Modeled after audioConstants.js and CarColorConstants.js:
 * - Zero Three.js or DOM imports (safe for Web Workers, Headless Node.js, and Network Codecs).
 * - Decouples physical collision hitbox index (hitboxIndex: 0..5) from visual 3D model index (visualIndex: 0..31).
 * - Extensible catalog for future lightweight vehicle models.
 */

export const HITBOX_PRESETS = Object.freeze({
  'hitbox-octane': Object.freeze({
    index: 0,
    id: 'hitbox-octane',
    name: 'Octane',
    length: 120.507,
    width: 86.6994,
    height: 38.6591,
    forward: 13.8757,
    up: 20.755
  }),
  'hitbox-dominus': Object.freeze({
    index: 1,
    id: 'hitbox-dominus',
    name: 'Dominus',
    length: 130.427,
    width: 85.7799,
    height: 33.80,
    forward: 9.00,
    up: 15.75
  }),
  'hitbox-plank': Object.freeze({
    index: 2,
    id: 'hitbox-plank',
    name: 'Batmobile (Plank)',
    length: 131.32,
    width: 87.1704,
    height: 31.8944,
    forward: 9.00857,
    up: 12.0942
  }),
  'hitbox-breakout': Object.freeze({
    index: 3,
    id: 'hitbox-breakout',
    name: 'Breakout',
    length: 133.992,
    width: 83.021,
    height: 32.80,
    forward: 12.50,
    up: 11.75
  }),
  'hitbox-hybrid': Object.freeze({
    index: 4,
    id: 'hitbox-hybrid',
    name: 'Hybrid',
    length: 129.519,
    width: 84.6879,
    height: 36.6591,
    forward: 13.8757,
    up: 20.755
  }),
  'hitbox-merc': Object.freeze({
    index: 5,
    id: 'hitbox-merc',
    name: 'Merc',
    length: 123.22,
    width: 79.2103,
    height: 44.1591,
    forward: 11.3757,
    up: 21.505
  })
});

/**
 * Ordered by C++ WASM hitbox index (0..5):
 * 0: Octane, 1: Dominus, 2: Plank, 3: Breakout, 4: Hybrid, 5: Merc
 */
export const HITBOX_INDEX_TO_ID = Object.freeze([
  'hitbox-octane',
  'hitbox-dominus',
  'hitbox-plank',
  'hitbox-breakout',
  'hitbox-hybrid',
  'hitbox-merc'
]);

/**
 * Canonical visual model catalog (index 0..31).
 * New lightweight 3D models can be appended here with their defaultHitboxId.
 */
export const CAR_VISUAL_CATALOG = Object.freeze([
  Object.freeze({ index: 0, id: 'fennec', label: 'Fennec', isPreset: false, defaultHitboxId: 'hitbox-octane' }),
  Object.freeze({ index: 1, id: 'insidio', label: 'Insidio', isPreset: false, defaultHitboxId: 'hitbox-hybrid' }),
  Object.freeze({ index: 2, id: 'hitbox-octane', label: 'Octane (Whitebox)', isPreset: true, defaultHitboxId: 'hitbox-octane' }),
  Object.freeze({ index: 3, id: 'hitbox-dominus', label: 'Dominus (Whitebox)', isPreset: true, defaultHitboxId: 'hitbox-dominus' }),
  Object.freeze({ index: 4, id: 'hitbox-breakout', label: 'Breakout (Whitebox)', isPreset: true, defaultHitboxId: 'hitbox-breakout' }),
  Object.freeze({ index: 5, id: 'hitbox-plank', label: 'Batmobile/Plank (Whitebox)', isPreset: true, defaultHitboxId: 'hitbox-plank' }),
  Object.freeze({ index: 6, id: 'hitbox-merc', label: 'Merc (Whitebox)', isPreset: true, defaultHitboxId: 'hitbox-merc' })
]);

export const CAR_VISUAL_IDS = Object.freeze(CAR_VISUAL_CATALOG.map((item) => item.id));

export const CAR_VISUAL_OPTIONS = Object.freeze(
  CAR_VISUAL_CATALOG.map(({ id, label, isPreset }) => ({ id, label, isPreset }))
);

export const SHORT_VISUAL_ALIAS_MAP = Object.freeze({
  octane: 'fennec',
  dominus: 'hitbox-dominus',
  breakout: 'hitbox-breakout',
  hybrid: 'insidio',
  plank: 'hitbox-plank',
  batmobile: 'hitbox-plank',
  merc: 'hitbox-merc',
  default: 'fennec',
  'hitbox-hybrid': 'insidio',
  fennec: 'fennec',
  insidio: 'insidio'
});

export const PLAYER_ROLES = Object.freeze({
  PLAYER: 'player',
  SPECTATOR: 'spectator'
});

export const PLAYER_ROLE_CODES = Object.freeze({
  PLAYER: 0,
  SPECTATOR: 2
});

export function normalizeVisualId(visualId) {
  if (!visualId) return 'fennec';
  const raw = String(visualId).toLowerCase().trim();
  if (CAR_VISUAL_IDS.includes(raw)) return raw;
  if (SHORT_VISUAL_ALIAS_MAP[raw]) return SHORT_VISUAL_ALIAS_MAP[raw];
  console.warn(`[vehicleConstants:Fallback] Unknown visualId "${visualId}", falling back to "fennec".`);
  return 'fennec';
}

export function encodeVisualIdIndex(visualId) {
  if (typeof visualId === 'number' && Number.isFinite(visualId)) {
    if (visualId >= 0 && visualId < CAR_VISUAL_IDS.length) {
      return visualId;
    }
    console.warn(`[vehicleConstants:Fallback] Out-of-range visualIndex ${visualId}, falling back to 0 ("fennec").`);
    return 0;
  }
  const canonical = normalizeVisualId(visualId);
  const idx = CAR_VISUAL_IDS.indexOf(canonical);
  return idx >= 0 ? idx : 0;
}

export function decodeVisualIdIndex(index) {
  if (typeof index === 'string') {
    const trimmed = index.trim();
    if (!/^\d+$/.test(trimmed)) {
      return normalizeVisualId(trimmed);
    }
  }
  const idx = Number(index);
  if (Number.isInteger(idx) && idx >= 0 && idx < CAR_VISUAL_IDS.length) {
    return CAR_VISUAL_IDS[idx];
  }
  console.warn(`[vehicleConstants:Fallback] Out-of-range visualIndex ${index} during decode, falling back to "fennec".`);
  return 'fennec';
}

/**
 * Resolves WASM hitbox index (0..5) from a hitboxId, visualId, or numeric index.
 */
export function resolveHitboxIndex(hitboxOrVisual) {
  if (typeof hitboxOrVisual === 'number' && Number.isFinite(hitboxOrVisual)) {
    if (hitboxOrVisual >= 0 && hitboxOrVisual <= 6) {
      return hitboxOrVisual;
    }
    console.warn(`[vehicleConstants:Fallback] Out-of-range hitboxIndex ${hitboxOrVisual}, falling back to 0 (Octane).`);
    return 0;
  }
  if (!hitboxOrVisual) return 0;
  const lower = String(hitboxOrVisual).toLowerCase().trim();
  if (lower.includes('psyclops') || lower.includes('tricycle') || lower.includes('threewheel') || lower.includes('three-wheel')) return 6;
  if (lower.includes('dominus')) return 1;
  if (lower.includes('plank') || lower.includes('batmobile')) return 2;
  if (lower.includes('breakout')) return 3;
  if (lower.includes('hybrid') || lower.includes('insidio')) return 4;
  if (lower.includes('merc')) return 5;
  if (lower.includes('octane') || lower.includes('fennec') || lower === 'default') return 0;
  console.warn(`[vehicleConstants:Fallback] Unknown hitbox type "${hitboxOrVisual}", falling back to 0 (Octane).`);
  return 0;
}

export function decodeHitboxIndex(hitboxIndex) {
  const idx = Number(hitboxIndex);
  if (Number.isInteger(idx) && idx >= 0 && idx < HITBOX_INDEX_TO_ID.length) {
    return HITBOX_INDEX_TO_ID[idx];
  }
  console.warn(`[vehicleConstants:Fallback] Out-of-range hitboxIndex ${hitboxIndex} during decode, falling back to "hitbox-octane".`);
  return 'hitbox-octane';
}

export const encodeHitboxIdIndex = resolveHitboxIndex;
export const decodeHitboxIdIndex = decodeHitboxIndex;

export function resolveVehicleHitboxId(hitboxOrVisual) {
  return decodeHitboxIndex(resolveHitboxIndex(hitboxOrVisual));
}

export const VEHICLE_HITBOX_ARCHETYPES = Object.freeze(
  HITBOX_INDEX_TO_ID.map((id) => HITBOX_PRESETS[id])
);
export const VEHICLE_VISUAL_MODELS = CAR_VISUAL_CATALOG;

export function encodeRoleIndex(role) {
  if (role === 'spectator' || role === PLAYER_ROLE_CODES.SPECTATOR || role === 1) {
    return PLAYER_ROLE_CODES.SPECTATOR;
  }
  return PLAYER_ROLE_CODES.PLAYER;
}

export function decodeRoleIndex(code) {
  return (code === PLAYER_ROLE_CODES.SPECTATOR || code === 1 || code === 'spectator')
    ? PLAYER_ROLES.SPECTATOR
    : PLAYER_ROLES.PLAYER;
}

export const PAINT_FINISH_IDS = Object.freeze(['matte', 'metallic']);
export const BOOST_VISUAL_IDS = Object.freeze(['gold-rush', 'cartoon']);
export const BOOST_AUDIO_PRESET_IDS = Object.freeze([
  'rush',
  'standard',
  'flamethrower',
  'plasma'
]);

export function encodePaintFinishIndex(paintFinish) {
  if (typeof paintFinish === 'number' && Number.isFinite(paintFinish)) {
    return (paintFinish & 1);
  }
  return paintFinish === 'matte' ? 0 : 1;
}

export function decodePaintFinishIndex(index) {
  if (typeof index === 'string') {
    return index === 'matte' ? 'matte' : 'metallic';
  }
  if (index === null || index === undefined) return 'metallic';
  return (Number(index) & 1) === 0 ? 'matte' : 'metallic';
}

export function encodeBoostVisualIndex(boostVisual) {
  if (typeof boostVisual === 'number' && Number.isFinite(boostVisual)) {
    return (boostVisual & 1);
  }
  return boostVisual === 'cartoon' ? 1 : 0;
}

export function decodeBoostVisualIndex(index) {
  if (typeof index === 'string') {
    return index === 'cartoon' ? 'cartoon' : 'gold-rush';
  }
  return (Number(index) & 1) === 1 ? 'cartoon' : 'gold-rush';
}

export function encodeBoostAudioIndex(boostAudio) {
  if (typeof boostAudio === 'number' && Number.isFinite(boostAudio)) {
    return (boostAudio >= 0 && boostAudio < BOOST_AUDIO_PRESET_IDS.length) ? boostAudio : 0;
  }
  if (!boostAudio) return 0;
  const idx = BOOST_AUDIO_PRESET_IDS.indexOf(String(boostAudio).trim());
  return idx >= 0 ? idx : 0;
}

export function decodeBoostAudioIndex(index) {
  if (typeof index === 'string') {
    const trimmed = index.trim();
    if (BOOST_AUDIO_PRESET_IDS.includes(trimmed)) return trimmed;
  }
  const idx = Number(index);
  if (Number.isInteger(idx) && idx >= 0 && idx < BOOST_AUDIO_PRESET_IDS.length) {
    return BOOST_AUDIO_PRESET_IDS[idx];
  }
  return 'rush';
}

/**
 * Packs visualIndex (5 bits, 0..31), hitboxIndex (3 bits, 0..7), colorSlot (8 bits, 0..255),
 * and personal cosmetics (paintFinish, boostVisual, boostAudio) into a 32-bit uint32 for PLAYER_LOADOUT_UPDATED.param2:
 *   bits  0..7 : colorSlot   (0..255)
 *   bits  8..12: visualIndex (0..31)
 *   bits 13..15: hitboxIndex + 1 (1..6, 0 = default from visual)
 *   bit  16    : paintFinishIndex (0 = matte, 1 = metallic)
 *   bit  17    : boostVisualIndex (0 = gold-rush, 1 = cartoon)
 *   bits 18..20: boostAudioIndex  (0..3: rush, standard, flamethrower, plasma)
 *   bit  21    : hasExtendedCosmetics flag (1 when bits 16..20 are explicitly populated)
 */
export function packLoadoutSignalParam2(
  visualIdOrIndex,
  colorSlot = 0,
  hitboxIdOrIndex = null,
  extraOrPaintFinish = null,
  boostVisualArg = null,
  boostAudioArg = null
) {
  const visualIndex = encodeVisualIdIndex(visualIdOrIndex) & 0x1F;
  const resolvedHitboxIndex = (hitboxIdOrIndex !== null && hitboxIdOrIndex !== undefined)
    ? resolveHitboxIndex(hitboxIdOrIndex)
    : resolveHitboxIndex(decodeVisualIdIndex(visualIndex));
  const encodedHitboxBits = (resolvedHitboxIndex + 1) & 0x07;
  const safeColor = (typeof colorSlot === 'number' && colorSlot >= 0) ? (colorSlot & 0xFF) : 0;
  const base16 = (encodedHitboxBits << 13) | ((visualIndex & 0x1F) << 8) | safeColor;
  const extraLoadout = (extraOrPaintFinish && typeof extraOrPaintFinish === 'object')
    ? extraOrPaintFinish
    : (extraOrPaintFinish !== null || boostVisualArg !== null || boostAudioArg !== null)
      ? { paintFinish: extraOrPaintFinish, boostVisual: boostVisualArg, boostAudio: boostAudioArg }
      : null;
  if (!extraLoadout) {
    return base16 >>> 0;
  }
  const paintBit = encodePaintFinishIndex(extraLoadout.paintFinish) & 0x01;
  const boostVisBit = encodeBoostVisualIndex(extraLoadout.boostVisual) & 0x01;
  const boostAudBits = encodeBoostAudioIndex(extraLoadout.boostAudio) & 0x07;
  const extBits = (1 << 21) | (boostAudBits << 18) | (boostVisBit << 17) | (paintBit << 16);
  return (base16 | extBits) >>> 0;
}

export function unpackLoadoutSignalParam2(param2) {
  const raw = (param2 ?? 0) >>> 0;
  const colorSlotId = raw & 0xFF;
  const visualIndex = (raw >>> 8) & 0x1F;
  const encodedHitboxBits = (raw >>> 13) & 0x07;
  const visualId = decodeVisualIdIndex(visualIndex);
  const hitboxIndex = encodedHitboxBits > 0
    ? (encodedHitboxBits - 1)
    : resolveHitboxIndex(visualId);
  const hitboxId = decodeHitboxIndex(hitboxIndex);
  const hasExtended = ((raw >>> 21) & 0x01) !== 0;
  const paintFinishIndex = hasExtended ? ((raw >>> 16) & 0x01) : 1;
  const boostVisualIndex = hasExtended ? ((raw >>> 17) & 0x01) : 0;
  const boostAudioIndex = hasExtended ? ((raw >>> 18) & 0x07) : 0;
  return {
    visualIndex,
    visualId,
    hitboxIndex,
    hitboxId,
    colorSlot: colorSlotId,
    colorSlotId,
    paintFinishIndex,
    paintFinish: decodePaintFinishIndex(paintFinishIndex),
    boostVisualIndex,
    boostVisual: decodeBoostVisualIndex(boostVisualIndex),
    boostAudioIndex,
    boostAudio: decodeBoostAudioIndex(boostAudioIndex),
    hasExtendedCosmetics: hasExtended
  };
}

/**
 * Packs visualIndex and optional explicit hitboxIndex into CMD_SET_LOADOUT.param1 (uint16):
 *   bit 15 (0x8000): 1 if explicit hitboxIndex is encoded in bits 8..14
 *   bits 0..7      : visualIndex (0..255)
 */
export function packLoadoutCommandParam1(visualIdOrIndex, hitboxIdOrIndex = null) {
  const visualIndex = encodeVisualIdIndex(visualIdOrIndex) & 0xFF;
  const hitboxIndex = (hitboxIdOrIndex !== null && hitboxIdOrIndex !== undefined)
    ? resolveHitboxIndex(hitboxIdOrIndex)
    : resolveHitboxIndex(decodeVisualIdIndex(visualIndex));
  return 0x8000 | ((hitboxIndex & 0x7F) << 8) | visualIndex;
}

export function unpackLoadoutCommandParam1(param1) {
  if (typeof param1 === 'string') {
    const visualId = decodeVisualIdIndex(param1);
    const visualIndex = encodeVisualIdIndex(visualId);
    const hitboxIndex = resolveHitboxIndex(visualId);
    return {
      visualIndex,
      visualId,
      hitboxIndex,
      hitboxId: decodeHitboxIndex(hitboxIndex)
    };
  }
  const raw = (param1 ?? 0) & 0xFFFF;
  const visualIndex = raw & 0xFF;
  const visualId = decodeVisualIdIndex(visualIndex);
  const hasExplicitHitbox = (raw & 0x8000) !== 0;
  const hitboxIndex = hasExplicitHitbox
    ? ((raw >>> 8) & 0x7F)
    : resolveHitboxIndex(visualId);
  const hitboxId = decodeHitboxIndex(hitboxIndex);
  return {
    visualIndex,
    visualId,
    hitboxIndex,
    hitboxId
  };
}

/**
 * Packs colorSlot (8 bits) and personal cosmetics into CMD_SET_LOADOUT.param2 (uint16):
 *   bits  0..7 : colorSlot (0..255)
 *   bit   8    : paintFinishIndex (0 = matte, 1 = metallic)
 *   bit   9    : boostVisualIndex (0 = gold-rush, 1 = cartoon)
 *   bits 10..12: boostAudioIndex  (0..3)
 *   bit  15    : 0x8000 (1 when extended personal cosmetics are packed)
 */
export function packLoadoutCommandParam2(
  colorSlot = 0,
  extraOrPaintFinish = null,
  boostVisualArg = null,
  boostAudioArg = null
) {
  const safeColor = (typeof colorSlot === 'number' && colorSlot >= 0) ? (colorSlot & 0xFF) : 0;
  const extraLoadout = (extraOrPaintFinish && typeof extraOrPaintFinish === 'object')
    ? extraOrPaintFinish
    : (extraOrPaintFinish !== null || boostVisualArg !== null || boostAudioArg !== null)
      ? { paintFinish: extraOrPaintFinish, boostVisual: boostVisualArg, boostAudio: boostAudioArg }
      : null;
  if (!extraLoadout) {
    return safeColor;
  }
  const paintBit = encodePaintFinishIndex(extraLoadout.paintFinish) & 0x01;
  const boostVisBit = encodeBoostVisualIndex(extraLoadout.boostVisual) & 0x01;
  const boostAudBits = encodeBoostAudioIndex(extraLoadout.boostAudio) & 0x07;
  return (0x8000 | (boostAudBits << 10) | (boostVisBit << 9) | (paintBit << 8) | safeColor) & 0xFFFF;
}

export function unpackLoadoutCommandParam2(param2) {
  const raw = (param2 ?? 0) & 0xFFFF;
  const colorSlot = raw & 0xFF;
  const hasExtended = (raw & 0x8000) !== 0;
  const paintFinishIndex = hasExtended ? ((raw >>> 8) & 0x01) : 1;
  const boostVisualIndex = hasExtended ? ((raw >>> 9) & 0x01) : 0;
  const boostAudioIndex = hasExtended ? ((raw >>> 10) & 0x07) : 0;
  return {
    colorSlot,
    paintFinishIndex,
    paintFinish: decodePaintFinishIndex(paintFinishIndex),
    boostVisualIndex,
    boostVisual: decodeBoostVisualIndex(boostVisualIndex),
    boostAudioIndex,
    boostAudio: decodeBoostAudioIndex(boostAudioIndex),
    hasExtendedCosmetics: hasExtended
  };
}

export const CAR_COLOR_SLOTS = Object.freeze([
  Object.freeze({ id: 0, name: 'Red', nameEn: 'Red', hex: '#ff7043', team: 1, teamName: 'Team Orange/Red', teamNameEn: 'Team Orange/Red' }),
  Object.freeze({ id: 1, name: 'Green', nameEn: 'Green', hex: '#66bb6a', team: 0, teamName: 'Team Blue', teamNameEn: 'Team Blue' }),
  Object.freeze({ id: 2, name: 'Yellow', nameEn: 'Yellow', hex: '#ffc107', team: 1, teamName: 'Team Orange/Red', teamNameEn: 'Team Orange/Red' }),
  Object.freeze({ id: 3, name: 'Blue', nameEn: 'Blue', hex: '#42a5f5', team: 0, teamName: 'Team Blue', teamNameEn: 'Team Blue' }),
  Object.freeze({ id: 4, name: 'Pink', nameEn: 'Pink', hex: '#fd6e9d', team: 1, teamName: 'Team Orange/Red', teamNameEn: 'Team Orange/Red' }),
  Object.freeze({ id: 5, name: 'Purple', nameEn: 'Purple', hex: '#ba68c8', team: 0, teamName: 'Team Blue', teamNameEn: 'Team Blue' })
]);

export function getCarColorSlotById(id) {
  const num = Number(id);
  return CAR_COLOR_SLOTS.find(s => s.id === num) || CAR_COLOR_SLOTS[0];
}

export function parseColorToNumber(hex) {
  if (typeof hex === 'number') return hex;
  if (!hex) return 0xff7043;
  return parseInt(String(hex).replace('#', ''), 16);
}

