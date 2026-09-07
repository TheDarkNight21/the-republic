import { recordLife } from '../log';
import { isGuardian, rebuildLiving } from '../population';
import type { World } from '../types';

/** Purely age-driven stage boundaries. Class-dependent decisions live in assessment/education. */
export function runAging(world: World): void {
  rebuildLiving(world);
  for (const i of world.living) {
    const c = world.citizens[i];
    c.age++;
    if (c.age === 3 && c.stage === 'infant') c.stage = 'child';
    if (c.age === 7 && (c.stage === 'child' || c.stage === 'infant')) {
      if (isGuardian(c)) {
        c.stage = 'musicGymnastics';
        c.role = 'trainee';
        recordLife(c, world.year, 'enteredStage', 'Began the guardian curriculum of music and gymnastics (376e)');
      } else {
        c.stage = 'apprentice';
      }
    }
    if (c.age === 60 && (c.stage === 'working' || c.stage === 'auxiliary')) c.stage = 'elder';
  }
}
