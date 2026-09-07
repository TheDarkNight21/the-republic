import { recordLife } from '../log';
import { isGuardian } from '../population';
import type { Rng } from '../rng';
import type { Citizen, World } from '../types';

/** Private households: the craftsmen always, and everyone once the rearing pen is gone. */
export function runFamilies(world: World, rng: Rng): void {
  const f = world.config.fertility;
  const eligible = (c: Citizen) => !isGuardian(c) || !world.institutions.communalLiving;
  const singleWomen: Citizen[] = [];
  const singleMen: Citizen[] = [];
  const marriedWomen: Citizen[] = [];
  for (const i of world.living) {
    const c = world.citizens[i];
    if (!eligible(c) || c.role === 'tyrant') continue;
    const widowedRecently = c.widowedYear !== null && world.year - c.widowedYear < 2;
    if (c.spouseId === null) {
      if (widowedRecently || c.age > 60) continue;
      if (c.sex === 'F' && c.age >= f.producerMarriageAges.F) singleWomen.push(c);
      else if (c.sex === 'M' && c.age >= f.producerMarriageAges.M) singleMen.push(c);
    } else if (c.sex === 'F' && c.age >= 18 && c.age <= 40) marriedWomen.push(c);
  }

  rng.shuffle(singleMen);
  const taken = new Set<number>();
  for (const w of singleWomen) {
    if (!rng.chance(f.producerMarriageChance) || singleMen.length === 0) continue;
    let best: Citizen | null = null;
    let bestScore = Infinity;
    for (let t = 0; t < 6; t++) {
      const m = rng.pick(singleMen);
      if (taken.has(m.id) || Math.abs(m.age - w.age) > 8) continue;
      const score = Math.abs(Math.log((m.wealth + 1) / (w.wealth + 1)));
      if (score < bestScore) {
        bestScore = score;
        best = m;
      }
    }
    if (!best) continue;
    taken.add(best.id);
    w.spouseId = best.id;
    best.spouseId = w.id;
    recordLife(w, world.year, 'married', `Married ${best.name}`);
    recordLife(best, world.year, 'married', `Married ${w.name}`);
    if (w.age >= 18 && w.age <= 40) marriedWomen.push(w);
  }

  for (const w of marriedWomen) {
    const spouse = w.spouseId !== null ? world.citizens[w.spouseId] : null;
    if (!spouse || !spouse.alive) continue;
    if (rng.chance(f.producerBasePerMarriedWoman * world.council.producerFertilityScalar)) {
      world.scratch.conceptions.push({ motherId: w.id, fatherId: spouse.id, sanctioned: true, guardian: false });
    }
  }
}
