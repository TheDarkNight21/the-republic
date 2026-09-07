import { recordCity, recordLife } from '../log';
import { isCombatAge, isGuardian, isWarrior, rebuildLiving } from '../population';
import type { Rng } from '../rng';
import type { Citizen, World } from '../types';
import { demoteToProducers } from './assessment';
import { die } from './mortality';

function scheduleNext(world: World, rng: Rng): void {
  const w = world.config.war;
  const mult = world.institutions.warlike;
  world.war.nextWarYear = world.year + Math.max(2, Math.round(rng.normal(w.meanInterval, w.intervalJitter) * mult));
}

function combatantsFor(world: World): Citizen[] {
  const out: Citizen[] = [];
  for (const i of world.living) {
    const c = world.citizens[i];
    if (!isWarrior(c) || !isCombatAge(c) || c.fled) continue;
    // 551e: the oligarchs "fear to arm the multitude"; only the propertied fight.
    if (!world.institutions.armAll && c.wealth + c.property < world.economy.medianWealth) continue;
    out.push(c);
  }
  return out;
}

/** Bk V 466e-471c: guardians as warriors; cowards are made craftsmen, the brave are honored. */
export function runWar(world: World, rng: Rng): void {
  if (world.year < world.war.nextWarYear) return;
  const w = world.config.war;
  const combatants = combatantsFor(world);
  const n = combatants.length;
  const severity = rng.uniform(w.severityRange[0], w.severityRange[1]);
  let meanSpirit = 0;
  for (const c of combatants) meanSpirit += c.soul.spirit;
  meanSpirit = n ? meanSpirit / n : 0;
  const strength = meanSpirit * Math.sqrt(n / 100) * rng.uniform(0.8, 1.2);
  const won = strength > w.winThreshold;

  let casualties = 0;
  let fled = 0;
  for (const c of combatants) {
    world.scratch.combatants.add(c.id);
    c.warsFought++;
    const flees = rng.chance(0.15 * (1 - c.soul.spirit));
    if (flees) {
      fled++;
      c.fled = true;
      recordLife(c, world.year, 'fled', 'Left the ranks in battle');
    }
    const pDeath = severity * (won ? 0.6 : 1.2) * (flees ? 0.5 : 1);
    if (rng.chance(pDeath)) {
      casualties++;
      world.scratch.warCasualties++;
      die(c, world, 'war');
      continue;
    }
    recordLife(c, world.year, 'foughtInWar', won ? 'Fought in a victorious campaign' : 'Fought in a defeat');
    if (flees) {
      if (isGuardian(c)) demoteToProducers(c, world, rng, 'Left the ranks in battle (468a)');
    } else if (!c.decorated && c.soul.spirit > 0.7 && rng.chance(0.3)) {
      c.decorated = true;
      recordLife(c, world.year, 'decorated', 'Crowned for valor and honored by the city (468b-e)');
    }
  }
  if (!won) world.economy.treasury *= 0.8;
  const record = { year: world.year, won, casualties, combatants: n, fled };
  world.war.last = record;
  world.war.recent.push(record);
  if (world.war.recent.length > 3) world.war.recent.shift();
  recordCity(
    world,
    'war',
    n === 0
      ? 'War came and no one stood to arms; the city paid tribute'
      : `War: ${n} took the field and ${won ? 'prevailed' : 'were beaten'}; ${casualties} fell${fled ? `, ${fled} fled` : ''}`,
  );
  rebuildLiving(world);
  scheduleNext(world, rng);
}
