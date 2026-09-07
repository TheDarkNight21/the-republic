import type { Rng } from '../rng';
import type { World } from '../types';
import { councilJudgement } from './judgement';

/**
 * Bk VIII 546a-547a: the rulers, "being men", will one day miss the nuptial number and
 * beget children out of season. Nothing forces it; poorer judgement makes it likelier.
 */
export function shouldNuptialErrorOccur(world: World, rng: Rng): boolean {
  const d = world.config.decay;
  switch (d.mode) {
    case 'off':
      return false;
    case 'stochastic':
      return world.year >= d.graceYears && rng.chance(d.errorProbabilityPerFestival / Math.max(0.2, councilJudgement(world)));
    case 'drift':
      return world.year >= d.graceYears && world.regime.driftSigma >= 0.05;
  }
}
