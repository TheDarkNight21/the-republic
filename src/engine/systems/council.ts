import { holdCouncil } from '../regime/vote';
import { recordCity, recordLife } from '../log';
import { isAdult, isGuardian, isWarrior, mean } from '../population';
import type { Rng } from '../rng';
import type { Citizen, World } from '../types';

/** 548c: the timocrat honors the spirited soldier, not the thinker. */
const honor = (c: Citizen) => c.evidence.spirit - 0.5 * c.evidence.reason + (c.decorated ? 0.3 : 0) + c.warsFought * 0.05;

/** Restore a citizen's ordinary role when they leave office. */
export function revertRole(c: Citizen): void {
  if (c.role === 'pauper' || c.role === 'drone') return;
  if (isGuardian(c)) {
    if (c.stage === 'philosophy') c.role = 'ruler';
    else if (c.age >= 20) c.role = c.completedDialectic || c.selectedForMathematics ? 'officer' : 'auxiliary';
    else c.role = 'trainee';
  } else {
    c.role = c.age >= 14 ? 'producer' : 'child';
  }
}

function setRulers(world: World, chosen: Citizen[], kind: 'honor' | 'wealth' | 'lot'): void {
  const ids = new Set(chosen.map((c) => c.id));
  for (const id of world.rulers) {
    const c = world.citizens[id];
    if (c.alive && !ids.has(id) && c.stage !== 'philosophy') revertRole(c);
  }
  for (const c of chosen) {
    if (c.role !== 'ruler') {
      c.role = 'ruler';
      if (kind === 'lot') recordLife(c, world.year, 'electedByLot', 'Chosen by lot to hold office (557a)');
      else if (kind === 'wealth') recordLife(c, world.year, 'enteredStage', 'Admitted to office by the property qualification (551b)');
      else recordLife(c, world.year, 'enteredStage', 'Raised to office as a lover of honor (548c)');
    }
  }
  world.rulers = chosen.map((c) => c.id);
}

function selectRulers(world: World, rng: Rng): void {
  const adults = world.living.map((i) => world.citizens[i]).filter(isAdult);
  const size = world.config.council.size;
  switch (world.institutions.officeRule) {
    case 'philosophers': {
      // 540a-b: those who completed the ascent rule in turn; the officers of 35-50 hold the
      // lesser offices with them and fill the council when philosophers are few.
      const philosophers = adults.filter((c) => c.role === 'ruler' && c.stage === 'philosophy');
      const chosen = [...philosophers];
      if (chosen.length < size) {
        const officers = adults
          .filter((c) => isGuardian(c) && c.role !== 'ruler' && c.age >= 35 && (c.completedDialectic || c.assessedMetal === 'gold'))
          .sort((a, b) => Number(b.completedDialectic) - Number(a.completedDialectic) || b.evidence.reason - a.evidence.reason);
        for (const c of officers) {
          if (chosen.length >= size) break;
          chosen.push(c);
        }
      }
      for (const id of world.rulers) {
        const c = world.citizens[id];
        if (c.alive && c.stage !== 'philosophy' && !chosen.includes(c)) revertRole(c);
      }
      for (const c of chosen) {
        if (c.role !== 'ruler') {
          c.role = 'ruler';
          recordLife(c, world.year, 'enteredStage', 'Called to sit in council with the philosophers');
        }
      }
      world.rulers = chosen.map((c) => c.id);
      if (philosophers.length === 0 && chosen.length > 0 && world.year % 10 === 0) recordCity(world, 'council', 'No one has completed the ascent; the council sits without a philosopher');
      return;
    }
    case 'honor': {
      const chosen = adults
        .filter((c) => isGuardian(c) && c.age >= 35)
        .sort((a, b) => honor(b) - honor(a))
        .slice(0, size);
      setRulers(world, chosen, 'honor');
      return;
    }
    case 'wealth': {
      const chosen = [...adults].sort((a, b) => b.wealth + b.property - (a.wealth + a.property)).slice(0, size);
      setRulers(world, chosen, 'wealth');
      return;
    }
    case 'lot': {
      const pool = adults.filter((c) => c.role !== 'pauper');
      const chosen = rng.shuffle([...pool]).slice(0, size);
      setRulers(world, chosen, 'lot');
      return;
    }
    case 'one': {
      const tyrant = world.regime.tyrantId !== null ? world.citizens[world.regime.tyrantId] : null;
      const guard = adults
        .filter((c) => c.id !== tyrant?.id && (isWarrior(c) || c.role === 'pauper' || c.role === 'producer') && c.age <= 50)
        .sort((a, b) => b.soul.spirit + b.soul.appetite - (a.soul.spirit + a.soul.appetite))
        .slice(0, size);
      for (const id of world.rulers) {
        const c = world.citizens[id];
        if (c.alive && c.role === 'bodyguard' && !guard.includes(c)) revertRole(c);
      }
      for (const c of guard) {
        if (c.role !== 'bodyguard') {
          c.role = 'bodyguard';
          recordLife(c, world.year, 'becameBodyguard', "Enrolled in the tyrant's bodyguard (566b)");
        }
      }
      world.rulers = tyrant && tyrant.alive ? [tyrant.id, ...guard.map((c) => c.id)] : guard.map((c) => c.id);
      return;
    }
  }
}

/** 460a: the rulers fix the number of marriages to keep the city the same size, "considering war, disease and the like". */
function regulateBirths(world: World): void {
  const f = world.config.fertility;
  if (!world.institutions.birthControl) {
    if (world.institutions.communalLiving) {
      // Festivals go on, but no one counts: roughly a third of eligible women each year.
      let eligible = 0;
      for (const i of world.living) {
        const c = world.citizens[i];
        if (isGuardian(c) && c.sex === 'F' && c.age >= f.womenAges[0] && c.age <= f.womenAges[1]) eligible++;
      }
      world.council.marriageQuota = Math.round(eligible * 0.35);
    } else {
      world.council.marriageQuota = 0;
    }
    // Nobody counts the citizens any more; households have children as the land allows.
    const room = world.council.targetPopulation / Math.max(1, world.living.length);
    world.council.producerFertilityScalar = Math.max(0.6, Math.min(1.8, Math.pow(room, 1.5)));
    return;
  }
  const pop = world.living.length;
  const expectedDeaths = world.deathsRing.length ? mean(world.deathsRing) : pop / 45;
  const warLoss = world.war.recent.length ? mean(world.war.recent.map((w) => w.casualties)) / world.config.war.meanInterval : 0;
  const desired = Math.max(0, expectedDeaths + warLoss + f.quotaGain * (world.council.targetPopulation - pop));

  let guardians = 0;
  let eligibleWomen = 0;
  let marriedWomen = 0;
  for (const i of world.living) {
    const c = world.citizens[i];
    if (isGuardian(c)) {
      guardians++;
      if (c.sex === 'F' && c.age >= f.womenAges[0] && c.age <= f.womenAges[1]) eligibleWomen++;
    } else if (c.sex === 'F' && c.spouseId !== null && c.age >= 18 && c.age <= 40) marriedWomen++;
  }
  const share = guardians / Math.max(1, pop);
  const shortfall = (world.config.guardianShareTarget - share) / world.config.guardianShareTarget;
  const guardianBirths = Math.max(0, desired * world.config.guardianShareTarget * (1 + 1.5 * shortfall));
  const quota = Math.round(guardianBirths / f.guardianConceptionPerUnion);
  const prevQuota = world.council.marriageQuota;
  world.council.marriageQuota = Math.max(0, Math.min(quota, eligibleWomen));
  const expectedProducerBirths = Math.max(1, marriedWomen * f.producerBasePerMarriedWoman);
  const scalar = (desired - guardianBirths) / expectedProducerBirths;
  world.council.producerFertilityScalar = Math.max(0.3, Math.min(2, scalar));
  if (Math.abs(world.council.marriageQuota - prevQuota) > 3) {
    recordCity(world, 'council', `The rulers set this year's marriages at ${world.council.marriageQuota} to keep the city one`);
  }
}

export function runCouncil(world: World, rng: Rng): void {
  selectRulers(world, rng);
  holdCouncil(world);
  regulateBirths(world);
}
