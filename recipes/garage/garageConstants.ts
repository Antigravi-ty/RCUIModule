// 1. Car Tab: 8 vehicles following RocketCompanion's canonical chassis list
export interface CarDef {
  id: string;
  name: string;
  hitbox: 'Octane' | 'Dominus' | 'Breakout' | 'Plank' | 'Hybrid' | 'Merc';
}

export const CARS: CarDef[] = [
  { id: 'fennec', name: 'Fennec', hitbox: 'Octane' },
  { id: 'insidio', name: 'Insidio', hitbox: 'Hybrid' },
  { id: 'ryza', name: 'Ryza', hitbox: 'Octane' },
  { id: 'hitbox-octane', name: 'Octane (Whitebox)', hitbox: 'Octane' },
  { id: 'hitbox-dominus', name: 'Dominus (Whitebox)', hitbox: 'Dominus' },
  { id: 'hitbox-breakout', name: 'Breakout (Whitebox)', hitbox: 'Breakout' },
  { id: 'hitbox-plank', name: 'Plank (Whitebox)', hitbox: 'Plank' },
  { id: 'hitbox-merc', name: 'Merc (Whitebox)', hitbox: 'Merc' },
];

// 2. Paint / Colour Tab: Compact numeric color ID (uint8, extensible up to 20 per team) for P2P bandwidth efficiency
export interface ColorDef {
  id: number;
  name: string;
  hex: string;
  team: 0 | 1; // 0 = Blue, 1 = Orange
  borderClass: string;
}

export type TeamColourDef = ColorDef;

export const BLUE_TEAM_COLORS: ColorDef[] = [
  { id: 1, name: 'Emerald Green', hex: '#66bb6a', team: 0, borderClass: 'border-emerald-600' },
  { id: 5, name: 'Royal Purple', hex: '#ba68c8', team: 0, borderClass: 'border-purple-600' },
  { id: 3, name: 'Sky Blue', hex: '#42a5f5', team: 0, borderClass: 'border-sky-600' },
];

export const ORANGE_TEAM_COLORS: ColorDef[] = [
  { id: 2, name: 'Sunburst Yellow', hex: '#ffc107', team: 1, borderClass: 'border-amber-500' },
  { id: 4, name: 'Neon Pink', hex: '#fd6e9d', team: 1, borderClass: 'border-pink-500' },
  { id: 0, name: 'Flame Red', hex: '#ff7043', team: 1, borderClass: 'border-orange-600' },
];

export const BLUE_TEAM_COLOURS = BLUE_TEAM_COLORS;
export const ORANGE_TEAM_COLOURS = ORANGE_TEAM_COLORS;

// 3. Player Anthem Tab: 58 converted M4A stingers + No Anthem (default) + Shuffle / Random Anthem
import {
  ANTHEM_CATALOG,
  ANTHEM_CATEGORIES,
  ANTHEM_SPECIFIC_CATEGORIES,
  DEFAULT_ANTHEM_ID,
  DEFAULT_RANDOM_ANTHEM_SCOPE,
  DEFAULT_RANDOM_ANTHEM_CATEGORY,
  type AnthemDef,
  type AnthemCategoryDef,
  type RandomAnthemScope,
} from '../../config/spatialAudioConfig';

export {
  ANTHEM_CATALOG,
  ANTHEM_CATEGORIES,
  ANTHEM_SPECIFIC_CATEGORIES,
  DEFAULT_ANTHEM_ID,
  DEFAULT_RANDOM_ANTHEM_SCOPE,
  DEFAULT_RANDOM_ANTHEM_CATEGORY,
};
export type { AnthemDef, AnthemCategoryDef, RandomAnthemScope };

export const ANTHEMS: readonly AnthemDef[] = ANTHEM_CATALOG;
