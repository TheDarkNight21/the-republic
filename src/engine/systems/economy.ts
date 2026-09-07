import { recordCity, recordLife } from '../log';
import { isAdult, isGuardian, median } from '../population';
import type { Rng } from '../rng';
import type { Citizen, World } from '../types';

function householdWealth(c: Citizen): number {
  return c.wealth + c.property;
}

/**
 * Producers own and earn; guardians are provisioned in kind (416d-417b) while the rearing pen
 * stands. Wealth never compounds on its own: what the rich gain, the poor pay as rent (555c-e).
 */
export function runEconomy(world: World, rng: Rng): void {
  const e = world.config.economy;
  const inst = world.institutions;
  let taxes = 0;
  let provisioned = 0;
  const workers: Citizen[] = [];

  for (const i of world.living) {
    const c = world.citizens[i];
    if (c.age < 14) continue;
    if (isGuardian(c) && inst.communalLiving) {
      provisioned++;
      if (!inst.propertyBan && c.age >= 20 && c.soul.appetite > c.soul.reason && rng.chance(e.guardianPropertyChance)) {
        if (c.property === 0) recordLife(c, world.year, 'acquiredProperty', 'Began to acquire land and gold in secret (548a)');
        c.property += Math.max(0, rng.normal(e.guardianPropertyMean, 0.5));
      }
      continue;
    }
    const earns = c.occupation !== null && c.age < 60 && c.role !== 'tyrant' && c.role !== 'bodyguard' && c.role !== 'trainee';
    if (earns) {
      const income = e.incomeByOccupation[c.occupation!] * rng.lognormal(0, 0.25);
      const tax = income * inst.taxRate;
      taxes += tax;
      c.wealth += income - tax - e.consumption;
      workers.push(c);
    } else {
      c.wealth -= e.consumption * 0.5;
    }
    if (c.wealth < 0) c.wealth = 0;
  }
  world.economy.treasury = Math.max(0, world.economy.treasury + taxes - provisioned * 0.3);

  const householders: Citizen[] = [];
  for (const i of world.living) {
    const c = world.citizens[i];
    if (!isAdult(c)) continue;
    if (isGuardian(c) && inst.communalLiving && c.property === 0) continue;
    householders.push(c);
  }
  const med = median(householders.map(householdWealth));
  world.economy.medianWealth = med;
  world.economy.povertyLine = med * e.povertyFraction;

  // 547b-c: the moment the ban falls, the guardians divide the land and houses among themselves.
  if (!inst.propertyBan && !world.regime.landDivided) {
    world.regime.landDivided = true;
    let takers = 0;
    for (const i of world.living) {
      const c = world.citizens[i];
      if (isGuardian(c) && c.age >= 20 && c.soul.appetite > c.soul.reason) {
        c.property += rng.uniform(0.3, 1.2) * Math.max(1, med);
        recordLife(c, world.year, 'acquiredProperty', 'Took a share when the guardians divided the land and houses (547b)');
        takers++;
      }
    }
    recordCity(world, 'info', `${takers} guardians divided the land and houses of the city among themselves (547b-c)`);
  }

  if (inst.rentRate > 0) {
    // 555c-e: the propertied lend and buy up the land; those beneath them pay for the use of it.
    let pool = 0;
    for (const c of workers) {
      if (householdWealth(c) >= med) continue;
      const r = Math.min(c.wealth, inst.rentRate * e.incomeByOccupation[c.occupation!]);
      c.wealth -= r;
      pool += r;
    }
    const landlords = householders.filter((c) => householdWealth(c) >= med && householdWealth(c) > 0);
    let total = 0;
    for (const l of landlords) total += householdWealth(l);
    if (total > 0) for (const l of landlords) l.wealth += (pool * householdWealth(l)) / total;
    else world.economy.treasury += pool;
  }
  if (inst.wealthGuard) {
    // 421d-422a: the rulers keep the craftsmen from both wealth and poverty.
    const cap = med * e.guardedCap;
    const floor = med * e.guardedFloor;
    for (const c of householders) {
      if (isGuardian(c)) continue;
      if (c.wealth > cap) {
        world.economy.treasury += c.wealth - cap;
        c.wealth = cap;
      } else if (c.wealth < floor && world.economy.treasury > 0) {
        const need = Math.min(floor - c.wealth, world.economy.treasury);
        c.wealth += need;
        world.economy.treasury -= need;
      }
    }
  }

  if (world.regime.id === 'tyranny') {
    // 568d-e: the tyrant lives off the property of the citizens.
    const sorted = [...householders].sort((a, b) => householdWealth(b) - householdWealth(a));
    for (const c of sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.05)))) {
      world.economy.treasury += c.wealth * 0.1;
      c.wealth *= 0.9;
    }
  }

  if (inst.wealthGuard && inst.communalLiving) return;
  let newPaupers = 0;
  for (const c of householders) {
    if (c.role === 'ruler' || c.role === 'tyrant' || c.role === 'bodyguard') continue;
    const hw = householdWealth(c);
    if (hw < world.economy.povertyLine) c.poorYears++;
    else c.poorYears = 0;
    if (c.role !== 'pauper' && c.role !== 'drone' && c.poorYears >= e.pauperYears) {
      c.role = 'pauper';
      newPaupers++;
      recordLife(c, world.year, 'becamePauper', 'Sold what they had and joined the paupers (552a-b)');
    } else if (c.role === 'pauper' && hw >= world.economy.povertyLine * 2) {
      c.role = c.occupation ? 'producer' : 'auxiliary';
      c.poorYears = 0;
    } else if (c.role === 'producer' && hw > med * e.droneMultiple && c.age >= 60) {
      c.role = 'drone';
      recordLife(c, world.year, 'becameDrone', 'Lives idle on accumulated wealth, a drone in the hive (552c)');
    }
  }
  if (newPaupers >= 5) recordCity(world, 'info', `${newPaupers} citizens fell into pauperdom this year`);
}
