import type { Metal, RegimeId } from '@engine/types';

/** Marble, ink and Egyptian blue: a site plan drawn on stone. */
export const COLORS = {
  marble: '#E8E6E0',
  marbleDeep: '#DAD6CC',
  marbleLine: '#C9C4B8',
  ink: '#1E2230',
  inkMuted: '#5F6472',
  inkFaint: '#9A9DA8',
  blue: '#2F5DA8',
  blueSoft: '#D6E0F2',
  gold: '#A97A0C',
  silver: '#4F7BBF',
  bronze: '#A85A2F',
  pauper: '#5560A8',
  danger: '#7A2E2E',
};

export const METAL_COLOR: Record<Metal, string> = {
  gold: COLORS.gold,
  silver: COLORS.silver,
  bronze: COLORS.bronze,
};

export const METAL_LABEL: Record<Metal, string> = {
  gold: 'gold',
  silver: 'silver',
  bronze: 'bronze',
};

/** Ambient wash over the ground as the city declines. */
export const REGIME_WASH: Record<RegimeId, string> = {
  aristocracy: 'rgba(47, 93, 168, 0)',
  timocracy: 'rgba(169, 122, 12, 0.06)',
  oligarchy: 'rgba(168, 90, 47, 0.08)',
  democracy: 'rgba(85, 96, 168, 0.08)',
  tyranny: 'rgba(122, 46, 46, 0.14)',
};
