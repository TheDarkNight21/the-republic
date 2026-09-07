import { recordCity } from '../log';
import { isAdult, isGuardian, isGuardianClass } from '../population';
import type { Citizen, World } from '../types';
import { BLOCS, BLOC_LABEL, BOOLEAN_KEYS, INSTITUTION_LABEL, PREFERENCES, SCALAR_KEYS, classifyRegime, type Bloc, type Institutions } from './institutions';

/** Which interest a ruler votes from: their true nature, unless money has got hold of them. */
export function blocOf(c: Citizen, world: World): Bloc {
  if (c.role === 'tyrant') return 'tyrant';
  if (c.trueMetal === 'gold') return 'philosophers';
  const holding = c.wealth + c.property;
  const med = world.economy.medianWealth;
  // 550e-551a, 553a-d: once wealth is honored, whoever has enough of it guards it above all else.
  if (holding > med * world.config.council.richMultiple) return 'moneyLovers';
  if (c.trueMetal === 'silver') return 'honorLovers';
  // 547b, 553c: a bronze soul inside the landed class wants more land; outside it, it is one of the many.
  return isGuardian(c) && !world.institutions.propertyBan && world.institutions.communalLiving ? 'moneyLovers' : 'people';
}

const OFFICE_LABEL: Record<Institutions['officeRule'], string> = {
  philosophers: 'those who have completed the ascent',
  honor: 'the most honored of the guardians',
  wealth: 'those who meet a property qualification',
  lot: 'citizens chosen by lot',
  one: 'one man alone',
};

/** Share of adult guardians whose soul is neither gold nor silver (547a). */
export function guardianDiscontent(world: World): { share: number; discontented: number; guardians: number } {
  let guardians = 0;
  let discontented = 0;
  for (const i of world.living) {
    const c = world.citizens[i];
    if (!isAdult(c) || !isGuardian(c)) continue;
    guardians++;
    if (!isGuardianClass(c.trueMetal)) discontented++;
  }
  return { share: guardians ? discontented / guardians : 0, discontented, guardians };
}

/**
 * The sitting council votes on every institution. A change must be carried several years
 * running before it takes effect, so the city has some inertia.
 */
export function holdCouncil(world: World): void {
  const counts: Record<Bloc, number> = { philosophers: 0, honorLovers: 0, moneyLovers: 0, people: 0, tyrant: 0 };
  let n = 0;
  for (const id of world.rulers) {
    const c = world.citizens[id];
    if (!c.alive) continue;
    counts[blocOf(c, world)]++;
    n++;
  }
  world.regime.council = counts;
  if (n === 0) return;
  if (counts.tyrant > 0) {
    counts.tyrant = n; // the guard votes with its master
    for (const b of BLOCS) if (b !== 'tyrant') counts[b] = 0;
  }
  const plurality = BLOCS.reduce((best, b) => (counts[b] > counts[best] ? b : best), 'philosophers' as Bloc);

  const proposed: Institutions = { ...world.institutions };
  for (const key of BOOLEAN_KEYS) {
    let yes = 0;
    for (const b of BLOCS) if (PREFERENCES[b][key]) yes += counts[b];
    proposed[key] = yes * 2 > n;
  }
  for (const key of SCALAR_KEYS) proposed[key] = PREFERENCES[plurality][key];
  proposed.officeRule = PREFERENCES[plurality].officeRule;
  // Philosophers can only take office back once the guardian class is sound enough to consent (547a-b).
  if (proposed.officeRule === 'philosophers' && world.institutions.officeRule !== 'philosophers' && guardianDiscontent(world).share > world.config.events.factionFloor) {
    proposed.officeRule = world.institutions.officeRule;
  }

  const cur = world.institutions;
  const streaks = world.regime.streaks;
  const inertia = world.config.council.inertiaYears;
  const changed: string[] = [];
  for (const key of Object.keys(proposed) as (keyof Institutions)[]) {
    if (proposed[key] === cur[key]) {
      streaks[key] = 0;
      continue;
    }
    streaks[key] = (streaks[key] ?? 0) + 1;
    if (streaks[key]! < inertia) continue;
    streaks[key] = 0;
    (cur as unknown as Record<string, unknown>)[key] = proposed[key];
    if (key === 'officeRule') changed.push(`office now goes to ${OFFICE_LABEL[proposed.officeRule]}`);
    else if ((BOOLEAN_KEYS as readonly string[]).includes(key)) changed.push(`${proposed[key] ? 'restored' : 'abolished'} ${INSTITUTION_LABEL[key as (typeof BOOLEAN_KEYS)[number]]}`);
    else if (key === 'rentRate') changed.push(`the poor now pay ${Math.round((proposed.rentRate as number) * 100)}% of their earnings to the propertied`);
    else if (key === 'taxRate') changed.push(`the levy is set at ${Math.round((proposed.taxRate as number) * 100)}%`);
  }
  if (changed.length > 0) {
    const who = BLOCS.filter((b) => counts[b] > 0)
      .map((b) => `${counts[b]} ${BLOC_LABEL[b]}`)
      .join(', ');
    recordCity(world, 'council', `The council (${who}) ${changed.join('; ')}`);
  }
}

/** Read the regime off the institutions and log the change if the name has moved. */
export function classify(world: World): void {
  const next = classifyRegime(world.institutions.officeRule);
  if (next === world.regime.id) return;
  const counts = world.regime.council;
  const who = BLOCS.filter((b) => counts[b] > 0)
    .map((b) => `${counts[b]} ${BLOC_LABEL[b]}`)
    .join(', ');
  const cause = `office now goes to ${OFFICE_LABEL[world.institutions.officeRule]}; the council that decided it was ${who}`;
  world.regime.transitions.push({ year: world.year, from: world.regime.id, to: next, cause });
  recordCity(world, 'regime', `${world.regime.id} gives way to ${next}: ${cause}`);
  world.regime.id = next;
  world.regime.sinceYear = world.year;
}
