import type { RegimeId } from '../types';

/** How office is filled. The regime name is read off this. */
export type OfficeRule = 'philosophers' | 'honor' | 'wealth' | 'lot' | 'one';

/** The interest a ruler votes from, given their true nature and their purse. */
export type Bloc = 'philosophers' | 'honorLovers' | 'moneyLovers' | 'people' | 'tyrant';
export const BLOCS: readonly Bloc[] = ['philosophers', 'honorLovers', 'moneyLovers', 'people', 'tyrant'];

export interface Institutions {
  academy: boolean;
  dialectic: boolean;
  assessments: boolean;
  /** Common mess, marriage festivals and the rearing pen stand or fall together (416d-417b, 457c-d). */
  communalLiving: boolean;
  birthControl: boolean;
  /** 421d-422a: craftsmen kept between wealth and poverty. */
  wealthGuard: boolean;
  /** 417a: guardians may hold no gold, silver, land or house. */
  propertyBan: boolean;
  officeRule: OfficeRule;
  armAll: boolean;
  rentRate: number;
  taxRate: number;
  warlike: number;
  jobChangeProbability: number;
}

export const KALLIPOLIS: Institutions = {
  academy: true,
  dialectic: true,
  assessments: true,
  communalLiving: true,
  birthControl: true,
  wealthGuard: true,
  propertyBan: true,
  officeRule: 'philosophers',
  armAll: true,
  rentRate: 0,
  taxRate: 0.15,
  warlike: 1,
  jobChangeProbability: 0,
};

/** What each interest wants, drawn from the portraits of Book VIII. */
export const PREFERENCES: Record<Bloc, Institutions> = {
  philosophers: KALLIPOLIS,
  honorLovers: {
    academy: true,
    dialectic: false, // 548b-c: they neglect the muse of philosophy
    assessments: true,
    communalLiving: true, // 547d: common messes and gymnastics kept
    birthControl: true,
    wealthGuard: false, // 548a-b: lovers of money in secret
    propertyBan: false, // 547b-c: land and houses divided among themselves
    officeRule: 'honor',
    armAll: true,
    rentRate: 0.1,
    taxRate: 0.15,
    warlike: 0.8, // 547e-548a: always at war
    jobChangeProbability: 0,
  },
  moneyLovers: {
    academy: false, // 553c-d: reason made to sit on the floor and count money
    dialectic: false,
    assessments: false,
    communalLiving: false,
    birthControl: false,
    wealthGuard: false,
    propertyBan: false,
    officeRule: 'wealth', // 551a-b: a property qualification for office
    armAll: false, // 551d-e: they fear to arm the multitude
    rentRate: 0.5, // 555c-e: lending at interest, buying up the land
    taxRate: 0.1,
    warlike: 1.2,
    jobChangeProbability: 0.01,
  },
  people: {
    academy: false,
    dialectic: false,
    assessments: false, // 558b-c: no one is asked what they trained for
    communalLiving: false,
    birthControl: false,
    wealthGuard: true, // 565a: the property of the rich handed to the people
    propertyBan: false,
    officeRule: 'lot', // 557a
    armAll: true,
    rentRate: 0.2,
    taxRate: 0.1,
    warlike: 1,
    jobChangeProbability: 0.06,
  },
  tyrant: {
    academy: false,
    dialectic: false,
    assessments: false,
    communalLiving: false,
    birthControl: false,
    wealthGuard: false,
    propertyBan: false,
    officeRule: 'one',
    armAll: true,
    rentRate: 0.3,
    taxRate: 0.35, // 568d-e: the tyrant lives off the citizens
    warlike: 0.5, // 566e: always stirring up war
    jobChangeProbability: 0.03,
  },
};

export const BOOLEAN_KEYS = ['academy', 'dialectic', 'assessments', 'communalLiving', 'birthControl', 'wealthGuard', 'propertyBan', 'armAll'] as const;
export const SCALAR_KEYS = ['rentRate', 'taxRate', 'warlike', 'jobChangeProbability'] as const;

export function classifyRegime(rule: OfficeRule): RegimeId {
  switch (rule) {
    case 'philosophers':
      return 'aristocracy';
    case 'honor':
      return 'timocracy';
    case 'wealth':
      return 'oligarchy';
    case 'lot':
      return 'democracy';
    case 'one':
      return 'tyranny';
  }
}

export interface RegimeInfo {
  title: string;
  description: string;
  /** Bk IX 587e: the king lives 729 times more pleasantly than the tyrant. */
  happiness: number;
}

export const REGIME_INFO: Record<RegimeId, RegimeInfo> = {
  aristocracy: { title: 'Kallipolis (aristocracy)', description: 'Office goes to those who completed the ascent to the Good and returned to rule.', happiness: 729 },
  timocracy: { title: 'Timocracy', description: 'Office goes to the lovers of honor, the most spirited of the guardians.', happiness: 243 },
  oligarchy: { title: 'Oligarchy', description: 'A property qualification decides who rules; the city is two cities, rich and poor.', happiness: 81 },
  democracy: { title: 'Democracy', description: 'Offices go by lot, every kind of life is permitted, no one is compelled to rule or be ruled.', happiness: 9 },
  tyranny: { title: 'Tyranny', description: 'One man rules as master of the city with a bodyguard at his back.', happiness: 1 },
};

export const BLOC_LABEL: Record<Bloc, string> = {
  philosophers: 'philosophers',
  honorLovers: 'lovers of honor',
  moneyLovers: 'lovers of money',
  people: 'the people',
  tyrant: 'the tyrant',
};

export const INSTITUTION_LABEL: Record<(typeof BOOLEAN_KEYS)[number], string> = {
  academy: 'the academy',
  dialectic: 'dialectic',
  assessments: 'the testing of souls',
  communalLiving: 'communal living',
  birthControl: 'the regulation of births',
  wealthGuard: 'the guard against wealth and poverty',
  propertyBan: 'the ban on guardian property',
  armAll: 'arms for all guardians',
};

export function happinessRatioToKing(regime: RegimeId): number {
  return REGIME_INFO.aristocracy.happiness / REGIME_INFO[regime].happiness;
}
