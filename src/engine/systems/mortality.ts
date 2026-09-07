import { recordCity, recordLife } from '../log';
import { isGuardian, rebuildLiving } from '../population';
import type { Rng } from '../rng';
import type { Citizen, World } from '../types';
import { hazardAt } from '../world';

export type DeathCause = 'age' | 'plague' | 'war';

export function die(c: Citizen, world: World, cause: DeathCause): void {
  c.alive = false;
  c.deathYear = world.year;
  world.scratch.deaths++;
  const text = cause === 'war' ? 'Fell in battle' : cause === 'plague' ? 'Died in the plague' : `Died at ${c.age}`;
  recordLife(c, world.year, 'died', text);

  if (c.spouseId !== null) {
    const s = world.citizens[c.spouseId];
    if (s.alive) {
      s.spouseId = null;
      s.widowedYear = world.year;
      recordLife(s, world.year, 'widowed', `Widowed by the death of ${c.name}`);
    }
  }
  // Private property passes to the household (guardians in the kallipolis have none).
  const estate = c.wealth + c.property;
  c.wealth = 0;
  c.property = 0;
  if (estate > 0) {
    // 416d-e: while the guardians live in common, nothing private may pass to them.
    const penActive = world.institutions.communalLiving;
    const heirs = c.childrenIds.map((id) => world.citizens[id]).filter((h) => h.alive && h.parentsKnown && !(penActive && isGuardian(h)));
    if (heirs.length > 0) for (const h of heirs) h.wealth += estate / heirs.length;
    else if (c.spouseId !== null && world.citizens[c.spouseId].alive) world.citizens[c.spouseId].wealth += estate;
    else world.economy.treasury += estate;
  }
  if (world.rulers.includes(c.id)) world.rulers = world.rulers.filter((id) => id !== c.id);
  if (world.regime.tyrantId === c.id) world.regime.tyrantId = null;
}

export function runMortality(world: World, rng: Rng): void {
  const m = world.config.mortality;
  const plague = rng.chance(m.plagueChance);
  world.scratch.plague = plague;
  if (plague) recordCity(world, 'plague', 'A plague fell upon the city');
  const crowding = Math.max(0, world.living.length / world.config.targetPopulation - 1.2) * m.crowdingHazard;
  for (const i of world.living) {
    const c = world.citizens[i];
    let h = hazardAt(c.age, world.config);
    if (isGuardian(c) && c.age >= 15 && c.age <= 59) h *= m.guardianMultiplier;
    if (c.role === 'pauper') h *= m.pauperMultiplier;
    if (plague) h += m.plagueExtraHazard;
    h += crowding;
    if (rng.chance(h)) die(c, world, plague ? 'plague' : 'age');
  }
  world.deathsRing.push(world.scratch.deaths);
  if (world.deathsRing.length > 5) world.deathsRing.shift();
  rebuildLiving(world);
}
