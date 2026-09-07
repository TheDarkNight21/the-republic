export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const MAP_W = 960;
export const MAP_H = 640;

export interface Lot {
  key: string;
  rect: Rect;
  label?: string;
  small?: boolean;
}

/** The plan of the city: walls enclose the academy, the barracks, the rearing pen and the agora; the farms lie outside. */
export const WALL: [number, number][] = [
  [24, 40],
  [40, 24],
  [660, 24],
  [690, 60],
  [690, 590],
  [660, 616],
  [40, 616],
  [24, 590],
];

export const LOTS: Lot[] = [
  { key: 'academy/music', rect: { x: 44, y: 44, w: 146, h: 126 }, label: 'music and gymnastics' },
  { key: 'academy/palaestra', rect: { x: 198, y: 44, w: 132, h: 126 }, label: 'palaestra' },
  { key: 'academy/mathematics', rect: { x: 44, y: 178, w: 146, h: 122 }, label: 'mathematics' },
  { key: 'academy/dialectic', rect: { x: 198, y: 178, w: 132, h: 122 }, label: 'dialectic' },
  { key: 'barracks/mess', rect: { x: 350, y: 44, w: 200, h: 256 }, label: 'common mess' },
  { key: 'barracks/officers', rect: { x: 350, y: 44, w: 200, h: 256 } },
  { key: 'council', rect: { x: 560, y: 44, w: 110, h: 256 }, label: 'council' },
  { key: 'nursery', rect: { x: 44, y: 322, w: 156, h: 274 }, label: 'rearing pen' },
  { key: 'agora/builder', rect: { x: 220, y: 322, w: 112, h: 62 }, label: 'builders', small: true },
  { key: 'agora/smith', rect: { x: 341, y: 322, w: 112, h: 62 }, label: 'smiths', small: true },
  { key: 'agora/weaver', rect: { x: 462, y: 322, w: 112, h: 62 }, label: 'weavers', small: true },
  { key: 'agora/cobbler', rect: { x: 220, y: 392, w: 112, h: 62 }, label: 'cobblers', small: true },
  { key: 'agora/merchant', rect: { x: 341, y: 392, w: 112, h: 62 }, label: 'merchants', small: true },
  { key: 'agora/retailer', rect: { x: 462, y: 392, w: 112, h: 62 }, label: 'retailers', small: true },
  { key: 'agora/sailor', rect: { x: 220, y: 462, w: 112, h: 62 }, label: 'sailors', small: true },
  { key: 'agora/laborer', rect: { x: 341, y: 462, w: 112, h: 62 }, label: 'laborers', small: true },
  { key: 'agora/physician', rect: { x: 462, y: 462, w: 112, h: 62 }, label: 'physicians', small: true },
  { key: 'agora/homes', rect: { x: 220, y: 532, w: 354, h: 64 }, label: 'households' },
  { key: 'temple', rect: { x: 586, y: 322, w: 84, h: 100 }, label: 'temple' },
  { key: 'agora/market', rect: { x: 586, y: 432, w: 84, h: 164 }, label: 'market' },
  { key: 'farms', rect: { x: 712, y: 24, w: 236, h: 440 }, label: 'farms' },
  { key: 'battlefield', rect: { x: 712, y: 486, w: 236, h: 130 }, label: 'the field of war' },
];

export const LOT_BY_KEY: Record<string, Lot> = Object.fromEntries(LOTS.map((l) => [l.key, l]));

export const DISTRICT_GROUPS: { label: string; rect: Rect }[] = [
  { label: 'academy', rect: { x: 44, y: 44, w: 286, h: 256 } },
  { label: 'barracks', rect: { x: 350, y: 44, w: 320, h: 256 } },
  { label: 'agora', rect: { x: 220, y: 322, w: 450, h: 274 } },
];

export function lotFor(slotKey: string): Lot {
  return LOT_BY_KEY[slotKey] ?? LOT_BY_KEY['agora/homes'];
}
