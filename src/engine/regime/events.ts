import { recordCity, recordLife } from '../log';
import { isAdult, isWarrior } from '../population';
import { PREFERENCES } from './institutions';
import { guardianDiscontent } from './vote';
import type { Rng } from '../rng';
import type { Citizen, World } from '../types';

export function pickChampion(world: World): Citizen | null {
  let best: Citizen | null = null;
  let score = -Infinity;
  for (const i of world.living) {
    const c = world.citizens[i];
    if (!isAdult(c) || c.age > 60) continue;
    if (c.wealth + c.property > world.economy.medianWealth) continue;
    const s = c.soul.appetite + c.soul.spirit - c.soul.reason;
    if (s > score) {
      score = s;
      best = c;
    }
  }
  return best;
}

function seizeOffice(world: World, tyrant: Citizen, text: string): void {
  tyrant.role = 'tyrant';
  world.regime.tyrantId = tyrant.id;
  world.institutions.officeRule = 'one';
  world.regime.streaks = {};
  recordLife(tyrant, world.year, 'becameTyrant', text);
  recordCity(world, 'regime', `${tyrant.name} ${text.charAt(0).toLowerCase()}${text.slice(1)}`, [tyrant.id]);
}

/**
 * The two changes of office that are not voted: the poor rising against the rich (556e-557a)
 * and the people's champion becoming a tyrant (565c-566a). Also what follows a tyrant's death.
 */
export function runEvents(world: World, rng: Rng): void {
  const e = world.config.events;
  const rec = world.history[world.history.length - 1];
  const rule = world.institutions.officeRule;

  if (rule === 'one') {
    const tyrant = world.regime.tyrantId !== null ? world.citizens[world.regime.tyrantId] : null;
    if (tyrant && tyrant.alive) return;
    const guard = world.rulers.map((id) => world.citizens[id]).filter((c) => c.alive && c.role === 'bodyguard');
    guard.sort((a, b) => b.soul.spirit + b.soul.appetite - (a.soul.spirit + a.soul.appetite));
    if (guard.length > 0 && rng.chance(e.successionChance)) {
      seizeOffice(world, guard[0], 'Seized the tyranny on the death of the master');
    } else {
      world.institutions.officeRule = 'lot';
      world.regime.tyrantId = null;
      world.regime.streaks = {};
      recordCity(world, 'regime', 'The tyrant is dead and no one held the city; offices fell to the lot');
    }
    return;
  }

  if (!rec) return;

  if (rule === 'philosophers') {
    // 547a-c: iron and bronze among the guardians pull toward money; gold and silver toward virtue.
    // When the discontented are many enough, the two sides come to blows and settle in the middle.
    const { share, discontented, guardians } = guardianDiscontent(world);
    if (share > e.factionFloor && rng.chance(e.factionRate * (share - e.factionFloor))) {
      Object.assign(world.institutions, PREFERENCES.honorLovers);
      world.regime.streaks = {};
      recordCity(
        world,
        'regime',
        `The guardians fell into dissension (${discontented} of ${guardians} had bronze in the soul); the two sides settled in the middle: land and houses divided, honor to rule, philosophy neglected (547b-c)`,
      );
    }
    return;
  }

  if (rule === 'lot') {
    const years = world.year - world.regime.sinceYear;
    if (years >= e.championMinYears && rec.gini > e.championGiniFloor) {
      const p = (e.championRate * (rec.gini - e.championGiniFloor)) / e.championGiniFloor;
      if (rng.chance(p)) {
        const champion = pickChampion(world);
        if (champion) seizeOffice(world, champion, 'Rose as the champion of the people and became a tyrant (565c-566a)');
      }
    }
    return;
  }

  // Any other rule: the many poor may rise when the few who bear arms are weak.
  if (rec.pauperShare > e.revoltPauperFloor) {
    let armed = 0;
    let armedSpirit = 0;
    for (const i of world.living) {
      const c = world.citizens[i];
      if (isWarrior(c) && c.age >= 20 && c.age <= 50 && (world.institutions.armAll || c.wealth + c.property >= world.economy.medianWealth)) {
        armed++;
        armedSpirit += c.soul.spirit;
      }
    }
    const weakness = 1 - Math.min(1, (armed / 100) * (armed ? armedSpirit / armed : 0));
    const lostRecently = world.war.last !== null && !world.war.last.won && world.year - world.war.last.year <= 5 ? 2 : 1;
    const p = e.revoltRate * (rec.pauperShare - e.revoltPauperFloor) * weakness * lostRecently;
    if (rng.chance(p)) {
      const adults = world.living.map((i) => world.citizens[i]).filter(isAdult);
      const rich = [...adults].sort((a, b) => b.wealth + b.property - (a.wealth + a.property)).slice(0, Math.max(1, Math.floor(adults.length * 0.1)));
      let pool = 0;
      for (const r of rich) {
        pool += r.wealth * 0.3;
        r.wealth *= 0.7;
      }
      const paupers = adults.filter((c) => c.role === 'pauper');
      for (const p of paupers) {
        p.wealth += pool / Math.max(1, paupers.length);
        p.role = p.occupation ? 'producer' : 'auxiliary';
        p.poorYears = 0;
      }
      world.institutions.officeRule = 'lot';
      world.regime.streaks = {};
      recordCity(world, 'regime', `The poor rose against the rich (${Math.round(rec.pauperShare * 100)}% were paupers, ${armed} stood armed against them), took a share of their goods and made offices by lot (557a)`);
    }
  }
}
