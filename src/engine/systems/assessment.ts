import { assessmentSigma } from '../regime/judgement';
import { recordCity, recordLife } from '../log';
import { isGuardian } from '../population';
import { clamp, type Rng } from '../rng';
import { PARTS, dominantMetal } from '../soul';
import type { Citizen, Metal, World } from '../types';
import { assignOccupation } from './occupation';

/** One noisy look at a citizen's nature; the city keeps a precision-weighted running mean. */
export function observe(c: Citizen, sigma: number, rng: Rng): void {
  const w = sigma <= 0 ? 1e6 : 1 / (sigma * sigma);
  for (const part of PARTS) {
    const obs = clamp(c.soul[part] + (sigma <= 0 ? 0 : rng.normal(0, sigma)), 0, 1);
    c.evidence[part] = (c.evidence[part] * c.evidenceWeight + obs * w) / (c.evidenceWeight + w);
  }
  c.evidenceWeight += w;
  c.observations++;
  c.assessedMetal = dominantMetal(c.evidence);
}

function setClass(c: Citizen, to: Metal, world: World, reason: string): void {
  c.classChanges.push({ year: world.year, from: c.assignedClass, to, reason });
  c.assignedClass = to;
}

export function promoteToGuardians(c: Citizen, world: World, rng: Rng): void {
  const to = c.assessedMetal === 'gold' ? 'gold' : 'silver';
  setClass(c, to, world, 'raised up from the craftsmen');
  c.occupation = null;
  world.economy.treasury += c.wealth;
  c.wealth = 0;
  c.role = 'trainee';
  c.stage = c.age < 18 ? 'musicGymnastics' : 'militaryTraining';
  recordLife(c, world.year, 'promoted', `Judged to have ${to} in the soul and raised to the guardians (415c)`);
  recordCity(world, 'assessment', `${c.name}, a craftsman's child, was raised to the guardians`, [c.id]);
  void rng;
}

export function demoteToProducers(c: Citizen, world: World, rng: Rng, why: string): void {
  setClass(c, 'bronze', world, why);
  c.selectedForMathematics = false;
  if (world.rulers.includes(c.id)) world.rulers = world.rulers.filter((id) => id !== c.id);
  recordLife(c, world.year, 'demoted', `${why}; sent down to the craftsmen (415c)`);
  recordCity(world, 'assessment', `${c.name} was sent down to the craftsmen: ${why.toLowerCase()}`, [c.id]);
  if (c.age >= 14) assignOccupation(c, world, rng, 'Assigned by the rulers to work');
  else {
    c.stage = c.age >= 7 ? 'apprentice' : c.age >= 3 ? 'child' : 'infant';
    c.role = 'child';
  }
}

function decide(c: Citizen, world: World, rng: Rng): void {
  const assessed = c.assessedMetal!;
  const guardian = isGuardian(c);
  if (!guardian) {
    // Craftsmen's children are tested until 18 (413d-414a); adults keep their station.
    if (c.age <= 18 && assessed !== 'bronze') promoteToGuardians(c, world, rng);
    return;
  }
  if (assessed === 'bronze') {
    demoteToProducers(c, world, rng, c.age <= 10 ? 'Found to have bronze in the soul' : 'Failed the tests of labor, pain and contest');
    return;
  }
  if (assessed !== c.assignedClass) {
    setClass(c, assessed, world, 'reassessed');
    recordLife(c, world.year, 'assessed', `Reassessed: judged to be of ${assessed}`);
  } else {
    recordLife(c, world.year, 'assessed', `Tested at ${c.age}; still judged ${assessed}`);
  }
}

/** The Myth of the Metals in practice (414b-415d, 537a-540a). */
export function runAssessment(world: World, rng: Rng): void {
  const cfg = world.config;
  if (cfg.decay.mode === 'drift') world.regime.driftSigma += cfg.decay.driftPerYear;
  if (!world.institutions.assessments) return;
  const sigma = assessmentSigma(world);
  const checkpoints = cfg.assessment.checkpoints;
  for (const i of world.living) {
    const c = world.citizens[i];
    if (!checkpoints.includes(c.age)) continue;
    if (c.age === 7) {
      observe(c, cfg.assessment.childGamesSigma, rng);
      continue;
    }
    observe(c, sigma, rng);
    decide(c, world, rng);
  }
}
