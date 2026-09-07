import { makeCitizen } from './citizen';
import { KALLIPOLIS } from './regime/institutions';
import { DEFAULT_CONFIG, type SimConfig } from './config';
import { runPlacement } from './placement';
import { Rng } from './rng';
import { sampleSoul } from './soul';
import { observe } from './systems/assessment';
import { chooseOccupation } from './systems/occupation';
import type { Citizen, Metal, World } from './types';

export function hazardAt(age: number, cfg: SimConfig): number {
  for (const [maxAge, h] of cfg.mortality.hazards) if (age <= maxAge) return h;
  return 1;
}

/** Survivorship curve l(a) implied by the hazard table. */
export function survivorship(cfg: SimConfig): number[] {
  const l: number[] = [1];
  for (let a = 0; a < 100; a++) l.push(l[a] * (1 - hazardAt(a, cfg)));
  return l;
}

function sampleAge(rng: Rng, l: number[]): number {
  return rng.weighted(l);
}

/** Place a founding citizen into the stage a running kallipolis would have them in. */
function initialStage(c: Citizen, rng: Rng, cfg: SimConfig): void {
  const age = c.age;
  if (age <= 2) {
    c.stage = 'infant';
    return;
  }
  if (age <= 6) {
    c.stage = 'child';
    return;
  }
  if (c.assignedClass === 'bronze') {
    if (age <= 13) {
      c.stage = 'apprentice';
      return;
    }
    c.occupation = chooseOccupation(c.soul, rng);
    c.role = 'producer';
    c.stage = age >= 60 ? 'elder' : 'working';
    if (age >= 20) {
      const years = Math.min(1, (age - 14) / 30);
      c.wealth = rng.lognormal(Math.log(cfg.economy.initialMedianWealth), cfg.economy.initialWealthSigma) * (0.3 + 0.7 * years);
    }
    return;
  }
  c.role = 'trainee';
  if (age <= 17) {
    c.stage = 'musicGymnastics';
    return;
  }
  if (age <= 19) {
    c.stage = 'militaryTraining';
    return;
  }
  const gold = c.assessedMetal === 'gold';
  if (!gold) {
    c.stage = age >= 60 ? 'elder' : 'auxiliary';
    c.role = 'auxiliary';
    return;
  }
  c.selectedForMathematics = true;
  if (age <= 29) {
    c.stage = 'mathematics';
    return;
  }
  if (age <= 34) {
    c.stage = 'dialectic';
    return;
  }
  c.completedDialectic = true;
  if (age <= 49) {
    c.stage = 'practicalOffice';
    c.role = 'officer';
    return;
  }
  c.stage = 'philosophy';
  c.role = 'ruler';
}

export function createWorld(config: SimConfig = DEFAULT_CONFIG): World {
  const rng = new Rng(config.seed);
  const l = survivorship(config);
  const world: World = {
    config,
    year: 0,
    citizens: [],
    living: [],
    nextId: 0,
    regime: {
      id: 'aristocracy',
      sinceYear: 0,
      nuptialErrorYear: null,
      driftSigma: 0,
      tyrantId: null,
      transitions: [],
      landDivided: false,
      streaks: {},
      council: { philosophers: 0, honorLovers: 0, moneyLovers: 0, people: 0, tyrant: 0 },
    },
    institutions: { ...KALLIPOLIS },
    rulers: [],
    council: { marriageQuota: 0, producerFertilityScalar: 1, targetPopulation: config.targetPopulation },
    war: { nextWarYear: config.war.firstWarYear + rng.int(-4, 4), last: null, recent: [] },
    economy: { treasury: 50, medianWealth: config.economy.initialMedianWealth, povertyLine: 0 },
    deathsRing: [],
    history: [],
    log: [],
    scratch: emptyScratch(),
  };

  for (let i = 0; i < config.targetPopulation; i++) {
    const age = sampleAge(rng, l);
    const soul = sampleSoul(rng, config);
    const sex = rng.chance(0.5) ? 'F' : 'M';
    // The city has already sorted anyone old enough; younger children carry their birth-class provisionally.
    const c = makeCitizen(
      { id: world.nextId++, sex, birthYear: -age, age, soul, assignedClass: 'bronze', parentsKnown: true },
      rng,
    );
    if (age >= 10) {
      for (const cp of config.assessment.checkpoints) {
        if (cp > age) break;
        observe(c, cp === 7 ? config.assessment.childGamesSigma : config.assessment.baseSigma, rng);
      }
      c.assignedClass = c.assessedMetal as Metal;
      c.parentsKnown = c.assignedClass === 'bronze';
    } else {
      if (age >= 7) observe(c, config.assessment.childGamesSigma, rng);
      if (rng.chance(config.guardianShareTarget)) {
        c.assignedClass = soul.reason >= soul.spirit ? 'gold' : 'silver';
        c.parentsKnown = false;
      }
    }
    initialStage(c, rng, config);
    c.history.push({ year: 0, kind: 'born', text: age === 0 ? 'Born in the founding year' : `Citizen of the city at its founding, aged ${age}` });
    world.citizens.push(c);
  }

  // Producer households: pair adults of marriageable age.
  const women = world.citizens.filter((c) => c.assignedClass === 'bronze' && c.sex === 'F' && c.age >= 18 && c.age <= 60);
  const men = world.citizens.filter((c) => c.assignedClass === 'bronze' && c.sex === 'M' && c.age >= 22 && c.age <= 65);
  rng.shuffle(women);
  rng.shuffle(men);
  men.sort((a, b) => a.age - b.age);
  women.sort((a, b) => a.age - b.age);
  const n = Math.min(women.length, men.length);
  for (let i = 0; i < n; i++) {
    if (!rng.chance(0.7)) continue;
    const w = women[i];
    const m = men[i];
    w.spouseId = m.id;
    m.spouseId = w.id;
  }

  world.rulers = world.citizens.filter((c) => c.role === 'ruler').map((c) => c.id);
  world.living = world.citizens.map((c) => c.id);
  runPlacement(world);
  world.log.push({ year: 0, kind: 'info', text: `The city is founded with ${world.citizens.length} citizens and ${world.rulers.length} philosopher-rulers.` });
  return world;
}

export function emptyScratch(): World['scratch'] {
  return {
    conceptions: [],
    festivalPaired: new Set(),
    festivalPairs: [],
    combatants: new Set(),
    births: 0,
    notReared: 0,
    deaths: 0,
    warCasualties: 0,
    plague: false,
  };
}
