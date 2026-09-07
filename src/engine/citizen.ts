import type { Rng } from './rng';
import { makeName } from './names';
import { dominantMetal } from './soul';
import type { Citizen, Metal, Sex, Soul } from './types';

export interface NewCitizenInput {
  id: number;
  sex: Sex;
  birthYear: number;
  age: number;
  soul: Soul;
  assignedClass: Metal;
  parentsKnown: boolean;
  motherId?: number | null;
  fatherId?: number | null;
  sanctionedBirth?: boolean;
  bornOutOfSeason?: boolean;
}

export function makeCitizen(input: NewCitizenInput, rng: Rng): Citizen {
  return {
    id: input.id,
    name: makeName(rng, input.sex),
    sex: input.sex,
    birthYear: input.birthYear,
    deathYear: null,
    alive: true,
    age: input.age,
    soul: input.soul,
    trueMetal: dominantMetal(input.soul),
    bornOutOfSeason: input.bornOutOfSeason ?? false,
    evidence: { reason: 0, spirit: 0, appetite: 0 },
    evidenceWeight: 0,
    observations: 0,
    assessedMetal: null,
    assignedClass: input.assignedClass,
    classChanges: [],
    stage: 'infant',
    role: 'child',
    occupation: null,
    jobChanges: 0,
    selectedForMathematics: false,
    completedDialectic: false,
    wealth: 0,
    property: 0,
    poorYears: 0,
    motherId: input.motherId ?? null,
    fatherId: input.fatherId ?? null,
    parentsKnown: input.parentsKnown,
    spouseId: null,
    widowedYear: null,
    childrenIds: [],
    sanctionedBirth: input.sanctionedBirth ?? true,
    warsFought: 0,
    fled: false,
    decorated: false,
    district: 'agora',
    slotKey: 'agora/homes',
    history: [],
  };
}
