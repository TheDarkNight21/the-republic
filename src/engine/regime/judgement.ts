import type { Citizen, World } from '../types';

/** How well one ruler can read a soul (546d-e: children of the wrong season make poor testers). */
export function rulerJudgement(c: Citizen, world: World): number {
  const j = world.config.judgement;
  let q = c.trueMetal === 'gold' ? 1 : j.nonGoldRuler;
  if (c.bornOutOfSeason) q *= j.outOfSeasonRuler;
  return q;
}

/** Mean judgement of the sitting council, in (0, 1]. */
export function councilJudgement(world: World): number {
  let total = 0;
  let n = 0;
  for (const id of world.rulers) {
    const c = world.citizens[id];
    if (!c.alive) continue;
    total += rulerJudgement(c, world);
    n++;
  }
  return n ? total / n : world.config.judgement.nonGoldRuler;
}

/** The noise with which the city observes a soul this year. */
export function assessmentSigma(world: World): number {
  return world.config.assessment.baseSigma / Math.max(0.2, councilJudgement(world)) + world.regime.driftSigma;
}
