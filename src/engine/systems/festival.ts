import { shouldNuptialErrorOccur } from '../regime/nuptialTrigger';
import { recordCity, recordLife } from '../log';
import { isGuardian } from '../population';
import type { Rng } from '../rng';
import { partOf } from '../soul';
import type { Citizen, World } from '../types';

/** 459d-e: "the best men must have sex with the best women as often as possible"; gold before silver. */
export function meritOf(c: Citizen): number {
  const metal = c.assessedMetal ?? c.assignedClass;
  const part = partOf(metal);
  return (metal === 'gold' ? 1 : 0) + 0.6 * c.evidence[part] + 0.2 * (c.decorated ? 1 : 0) + 0.2 * Math.min(1, c.warsFought / 5);
}

function merit(c: Citizen, rng: Rng): number {
  return meritOf(c) + rng.normal(0, 0.05);
}

/** Bk V 458c-461e: marriage festivals with rigged lots so the best breed with the best. */
export function runFestival(world: World, rng: Rng): void {
  if (!world.institutions.communalLiving) return;
  const f = world.config.fertility;
  const women: Citizen[] = [];
  const men: Citizen[] = [];
  const nearWindowWomen: Citizen[] = [];
  for (const i of world.living) {
    const c = world.citizens[i];
    if (!isGuardian(c) || c.fled) continue;
    if (c.sex === 'F') {
      if (c.age >= f.womenAges[0] && c.age <= f.womenAges[1]) women.push(c);
      else if (c.age >= 16 && c.age <= 45) nearWindowWomen.push(c);
    } else if (c.age >= f.menAges[0] && c.age <= f.menAges[1]) men.push(c);
  }
  const scored = (arr: Citizen[]) => arr.map((c) => ({ c, m: merit(c, rng) })).sort((a, b) => b.m - a.m).map((x) => x.c);
  const w = scored(women);
  const m = scored(men);
  const decoratedMen = m.filter((c) => c.decorated);

  const conceptionFrom = (mother: Citizen, father: Citizen, sanctioned: boolean) => {
    world.scratch.conceptions.push({ motherId: mother.id, fatherId: father.id, sanctioned, guardian: true });
  };

  let unions = 0;
  const quota = world.council.marriageQuota;
  for (let k = 0; k < quota && k < w.length && m.length > 0; k++) {
    const mother = w[k];
    // 460b: the best men get the most frequent unions.
    const father = k < m.length ? m[k] : decoratedMen.length ? decoratedMen[k % decoratedMen.length] : m[k % m.length];
    world.scratch.festivalPaired.add(mother.id);
    world.scratch.festivalPaired.add(father.id);
    world.scratch.festivalPairs.push([mother.id, father.id]);
    recordLife(mother, world.year, 'pairedAtFestival', `Paired with ${father.name} at the marriage festival`);
    recordLife(father, world.year, 'pairedAtFestival', `Paired with ${mother.name} at the marriage festival`);
    unions++;
    if (rng.chance(f.guardianConceptionPerUnion)) conceptionFrom(mother, father, true);
  }

  // 461b-c: unions outside the rulers' sanction still happen; their offspring are not reared.
  if (m.length > 0) {
    for (const mother of w) {
      if (world.scratch.festivalPaired.has(mother.id)) continue;
      if (rng.chance(f.unsanctionedGuardianConception)) conceptionFrom(mother, rng.pick(m), false);
    }
    for (const mother of nearWindowWomen) {
      if (rng.chance(f.outOfWindowGuardianConception)) conceptionFrom(mother, rng.pick(m), false);
    }
  }

  if (world.regime.nuptialErrorYear === null && shouldNuptialErrorOccur(world, rng)) {
    world.regime.nuptialErrorYear = world.year;
    recordCity(world, 'nuptial', 'The rulers miscalculated the nuptial number; unions were made out of season (546d)');
  }
  if (unions > 0) recordCity(world, 'festival', `Marriage festival: ${unions} unions sanctioned by the rulers`);
}
