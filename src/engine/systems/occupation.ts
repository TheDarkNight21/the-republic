import { recordLife } from '../log';
import type { Rng } from '../rng';
import type { Citizen, Occupation, Soul, World } from '../types';
import { OCCUPATIONS } from '../types';

/** Demand for each craft: the city must be fed first (Bk II 369d-371e). */
const DEMAND: Record<Occupation, number> = {
  farmer: 0.35,
  laborer: 0.1,
  builder: 0.08,
  weaver: 0.08,
  cobbler: 0.06,
  smith: 0.07,
  merchant: 0.07,
  sailor: 0.06,
  retailer: 0.08,
  physician: 0.05,
};

function affinity(o: Occupation, s: Soul): number {
  switch (o) {
    case 'merchant':
    case 'retailer':
      return 1 + s.appetite;
    case 'sailor':
      return 1 + 0.5 * (s.appetite + s.spirit);
    case 'smith':
    case 'builder':
      return 1 + s.spirit;
    case 'physician':
      return 1 + 1.5 * s.reason;
    default:
      return 1;
  }
}

export function chooseOccupation(soul: Soul, rng: Rng, exclude: Occupation | null = null): Occupation {
  const weights = OCCUPATIONS.map((o) => (o === exclude ? 0 : DEMAND[o] * affinity(o, soul)));
  return OCCUPATIONS[rng.weighted(weights)];
}

/** Assign a craft to someone entering the producer class (by age, demotion, or cowardice). */
export function assignOccupation(c: Citizen, world: World, rng: Rng, text: string): void {
  c.occupation = chooseOccupation(c.soul, rng);
  if (c.assignedClass === 'bronze') {
    c.stage = c.age >= 60 ? 'elder' : 'working';
    if (c.role !== 'pauper' && c.role !== 'drone') c.role = 'producer';
  }
  recordLife(c, world.year, 'occupationChosen', `${text} as a ${c.occupation}`);
}

export function runOccupation(world: World, rng: Rng): void {
  const inst = world.institutions;
  for (const i of world.living) {
    const c = world.citizens[i];
    if (c.assignedClass !== 'bronze' && inst.communalLiving) continue;
    if (c.age === 14 && c.occupation === null) {
      assignOccupation(c, world, rng, 'Took up the craft suited to their nature');
      continue;
    }
    if (inst.jobChangeProbability > 0 && c.occupation && c.age < 60 && rng.chance(inst.jobChangeProbability)) {
      const next = chooseOccupation(c.soul, rng, c.occupation);
      recordLife(c, world.year, 'occupationChanged', `Left the ${c.occupation}'s trade to become a ${next}`);
      c.occupation = next;
      c.jobChanges++;
    }
  }
}
