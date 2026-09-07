import { computeMetrics } from './metrics';
import { runPlacement } from './placement';
import { runEvents } from './regime/events';
import { classify } from './regime/vote';
import type { Rng } from './rng';
import { runAging } from './systems/aging';
import { runAssessment } from './systems/assessment';
import { runBirths } from './systems/births';
import { runCouncil } from './systems/council';
import { runEconomy } from './systems/economy';
import { runEducation } from './systems/education';
import { runFamilies } from './systems/families';
import { runFestival } from './systems/festival';
import { runMortality } from './systems/mortality';
import { runOccupation } from './systems/occupation';
import { runWar } from './systems/war';
import type { World } from './types';
import { emptyScratch } from './world';

/** One year of the city. Order matters; see the plan's tick section. */
export function step(world: World, rng: Rng): void {
  world.year++;
  world.scratch = emptyScratch();
  runAging(world);
  runMortality(world, rng);
  runWar(world, rng);
  runAssessment(world, rng);
  runEducation(world, rng);
  runOccupation(world, rng);
  runEconomy(world, rng);
  runCouncil(world, rng);
  runFestival(world, rng);
  runFamilies(world, rng);
  runBirths(world, rng);
  world.history.push(computeMetrics(world));
  runEvents(world, rng);
  classify(world);
  runPlacement(world);
}

export function runYears(world: World, rng: Rng, years: number): void {
  for (let i = 0; i < years; i++) step(world, rng);
}
