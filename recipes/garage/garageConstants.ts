// 1. Car Tab: 7 vehicles following RocketCompanion's canonical chassis list
export interface CarDef {
  id: string;
  name: string;
  hitbox: 'Octane' | 'Dominus' | 'Breakout' | 'Plank' | 'Hybrid' | 'Merc';
}

export const CARS: CarDef[] = [
  { id: 'fennec', name: 'Fennec', hitbox: 'Octane' },
  { id: 'insidio', name: 'Insidio', hitbox: 'Hybrid' },
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

// 3. Player Anthem Tab: Music presets + Random option
export interface AnthemDef {
  id: string;
  title: string;
  artist: string;
  duration: string;
  tag: string;
}

export const ANTHEMS: AnthemDef[] = [
  { id: 'random', title: 'Shuffle / Random Anthem', artist: 'All Soundtracks', duration: 'VARIES', tag: 'Random' },
  { id: 'solar-wind', title: 'Solar Eruption (VIP)', artist: 'Tokyo Machine', duration: '0:15', tag: 'High BPM' },
  { id: 'champion-rush', title: 'Champion Arena Rush', artist: 'Koven', duration: '0:14', tag: 'Orchestral' },
  { id: 'neon-overdrive', title: 'Neon Overdrive', artist: 'Pegboard Nerds', duration: '0:16', tag: 'Synthwave' },
  { id: 'sub-bass-fury', title: 'Sub-Bass Drop', artist: 'Noisestorm', duration: '0:12', tag: 'Bass Heavy' },
  { id: 'cyber-victory', title: 'Victory Circuit', artist: 'Protostar', duration: '0:15', tag: 'Electronic' },
];
