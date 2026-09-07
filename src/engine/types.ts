import type { SimConfig } from './config';
import type { Bloc, Institutions } from './regime/institutions';

export type Metal = 'gold' | 'silver' | 'bronze';
export type SoulPart = 'reason' | 'spirit' | 'appetite';
export type Sex = 'F' | 'M';

export type Stage =
  | 'infant' // 0-2
  | 'child' // 3-6
  | 'musicGymnastics' // 7-17 guardian curriculum (Bk II-III)
  | 'militaryTraining' // 18-20 (537b)
  | 'mathematics' // 20-30 (537c)
  | 'dialectic' // 30-35 (539e)
  | 'practicalOffice' // 35-50 (540a)
  | 'philosophy' // 50+ ruling in turn (540a-b)
  | 'auxiliary' // warriors who stopped at the warrior stage
  | 'apprentice' // producers 7-13
  | 'working' // producers 14+
  | 'elder';

export type Role =
  | 'child'
  | 'trainee'
  | 'auxiliary'
  | 'officer'
  | 'ruler'
  | 'producer'
  | 'pauper'
  | 'drone'
  | 'tyrant'
  | 'bodyguard';

export type Occupation =
  | 'farmer'
  | 'builder'
  | 'weaver'
  | 'cobbler'
  | 'smith'
  | 'merchant'
  | 'sailor'
  | 'retailer'
  | 'laborer'
  | 'physician';

export const OCCUPATIONS: readonly Occupation[] = [
  'farmer',
  'builder',
  'weaver',
  'cobbler',
  'smith',
  'merchant',
  'sailor',
  'retailer',
  'laborer',
  'physician',
];

export type DistrictId =
  | 'nursery'
  | 'academy'
  | 'barracks'
  | 'council'
  | 'agora'
  | 'farms'
  | 'temple'
  | 'battlefield';

export type RegimeId = 'aristocracy' | 'timocracy' | 'oligarchy' | 'democracy' | 'tyranny';
export const REGIME_ORDER: readonly RegimeId[] = ['aristocracy', 'timocracy', 'oligarchy', 'democracy', 'tyranny'];

export interface Soul {
  reason: number;
  spirit: number;
  appetite: number;
}

export type LifeEventKind =
  | 'born'
  | 'admittedToRearingPen'
  | 'assessed'
  | 'promoted'
  | 'demoted'
  | 'enteredStage'
  | 'selectedMathematics'
  | 'selectedDialectic'
  | 'becameRuler'
  | 'becameAuxiliary'
  | 'becameOfficer'
  | 'occupationChosen'
  | 'occupationChanged'
  | 'married'
  | 'widowed'
  | 'pairedAtFestival'
  | 'childBorn'
  | 'childNotAdmitted'
  | 'foughtInWar'
  | 'decorated'
  | 'fled'
  | 'acquiredProperty'
  | 'becamePauper'
  | 'becameDrone'
  | 'electedByLot'
  | 'becameTyrant'
  | 'becameBodyguard'
  | 'died';

export interface LifeEvent {
  year: number;
  kind: LifeEventKind;
  text: string;
}

export interface ClassChange {
  year: number;
  from: Metal;
  to: Metal;
  reason: string;
}

export interface Citizen {
  id: number;
  name: string;
  sex: Sex;
  birthYear: number;
  deathYear: number | null;
  alive: boolean;
  age: number;

  /** Innate nature (Bk IV 435-441). Hidden from the city. */
  soul: Soul;
  trueMetal: Metal;
  bornOutOfSeason: boolean;

  /** What the city believes (Bk III 414-415). */
  evidence: Soul;
  evidenceWeight: number;
  observations: number;
  assessedMetal: Metal | null;
  assignedClass: Metal;
  classChanges: ClassChange[];

  stage: Stage;
  role: Role;
  occupation: Occupation | null;
  jobChanges: number;
  selectedForMathematics: boolean;
  completedDialectic: boolean;

  wealth: number;
  property: number;
  poorYears: number;
  motherId: number | null;
  fatherId: number | null;
  parentsKnown: boolean;
  spouseId: number | null;
  widowedYear: number | null;
  childrenIds: number[];
  sanctionedBirth: boolean;

  warsFought: number;
  fled: boolean;
  decorated: boolean;

  district: DistrictId;
  slotKey: string;
  history: LifeEvent[];
}

export interface RegimeTransition {
  year: number;
  from: RegimeId;
  to: RegimeId;
  cause: string;
}

export interface RegimeState {
  /** Derived each year from how office is filled. */
  id: RegimeId;
  sinceYear: number;
  nuptialErrorYear: number | null;
  /** Extra observation noise accumulated in 'drift' mode. */
  driftSigma: number;
  tyrantId: number | null;
  transitions: RegimeTransition[];
  /** 547b: set once the guardians have divided the land among themselves. */
  landDivided: boolean;
  /** Years each proposed institutional change has been carried in a row. */
  streaks: Partial<Record<keyof Institutions, number>>;
  /** Composition of this year's council by interest. */
  council: Record<Bloc, number>;
}

export interface Conception {
  motherId: number;
  fatherId: number;
  sanctioned: boolean;
  guardian: boolean;
}

export interface WarRecord {
  year: number;
  won: boolean;
  casualties: number;
  combatants: number;
  fled: number;
}

export interface AgeBands {
  F: Record<Metal, number[]>;
  M: Record<Metal, number[]>;
}

export interface YearRecord {
  year: number;
  regime: RegimeId;
  population: number;
  counts: {
    gold: number;
    silver: number;
    bronze: number;
    paupers: number;
    drones: number;
    rulers: number;
    auxiliaries: number;
  };
  births: number;
  notReared: number;
  deaths: number;
  warCasualties: number;
  justice: number;
  harmony: number;
  wisdom: number;
  courage: number;
  gini: number;
  guardianPurity: number;
  guardianPropertyShare: number;
  mismatchShare: number;
  pauperShare: number;
  ageBands: AgeBands;
}

export type CityLogKind =
  | 'festival'
  | 'war'
  | 'plague'
  | 'assessment'
  | 'regime'
  | 'council'
  | 'nuptial'
  | 'notReared'
  | 'info';

export interface CityLogEntry {
  year: number;
  kind: CityLogKind;
  text: string;
  citizenIds?: number[];
}

export interface World {
  config: SimConfig;
  year: number;
  citizens: Citizen[];
  living: number[];
  nextId: number;
  regime: RegimeState;
  institutions: Institutions;
  rulers: number[];
  council: {
    marriageQuota: number;
    producerFertilityScalar: number;
    targetPopulation: number;
  };
  war: {
    nextWarYear: number;
    last: WarRecord | null;
    recent: WarRecord[];
  };
  economy: {
    treasury: number;
    medianWealth: number;
    povertyLine: number;
  };
  deathsRing: number[];
  history: YearRecord[];
  log: CityLogEntry[];
  /** Per-year scratch, cleared at the start of each tick. */
  scratch: {
    conceptions: Conception[];
    festivalPaired: Set<number>;
    festivalPairs: [number, number][];
    combatants: Set<number>;
    births: number;
    notReared: number;
    deaths: number;
    warCasualties: number;
    plague: boolean;
  };
}
