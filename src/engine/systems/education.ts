import { recordCity, recordLife } from '../log';
import { isGuardian } from '../population';
import type { Rng } from '../rng';
import type { Citizen, World } from '../types';
import { assignOccupation } from './occupation';

export function becomeAuxiliary(c: Citizen, world: World): void {
  c.stage = 'auxiliary';
  c.role = 'auxiliary';
  recordLife(c, world.year, 'becameAuxiliary', 'Took up the shield among the auxiliaries');
}

export function becomeOfficer(c: Citizen, world: World, text: string): void {
  c.stage = 'auxiliary';
  c.role = 'officer';
  recordLife(c, world.year, 'becameOfficer', text);
}

export function becomeRuler(c: Citizen, world: World): void {
  c.stage = 'philosophy';
  c.role = 'ruler';
  if (!world.rulers.includes(c.id)) world.rulers.push(c.id);
  recordLife(c, world.year, 'becameRuler', 'At fifty, led to the Good itself and made to rule in turn (540a)');
  recordCity(world, 'council', `${c.name} joined the philosopher-rulers`, [c.id]);
}

/** The guardian education ladder (Bk VII 535a-540c). */
export function runEducation(world: World, rng: Rng): void {
  const inst = world.institutions;
  const dialecticCohort: Citizen[] = [];
  for (const i of world.living) {
    const c = world.citizens[i];
    if (!isGuardian(c)) continue;
    switch (c.age) {
      case 18:
        if (c.stage === 'musicGymnastics') {
          c.stage = 'militaryTraining';
          c.role = 'trainee';
          recordLife(c, world.year, 'enteredStage', 'Two years of compulsory physical and military training (537b)');
        }
        break;
      case 20:
        if (c.stage === 'militaryTraining' || c.stage === 'musicGymnastics') {
          if (inst.academy && c.assessedMetal === 'gold') {
            c.stage = 'mathematics';
            c.role = 'trainee';
            c.selectedForMathematics = true;
            recordLife(c, world.year, 'selectedMathematics', 'Selected for ten years of arithmetic, geometry, astronomy and harmonics (537c-d)');
          } else {
            becomeAuxiliary(c, world);
            if (!inst.communalLiving && c.occupation === null) assignOccupation(c, world, rng, 'With no city to feed them, took up work');
          }
        }
        break;
      case 30:
        if (c.stage === 'mathematics') dialecticCohort.push(c);
        break;
      case 35:
        if (c.stage === 'dialectic') {
          c.stage = 'practicalOffice';
          c.completedDialectic = true;
          becomeOfficerKeepStage(c, world);
        }
        break;
      case 50:
        if (c.stage === 'practicalOffice' && c.completedDialectic) becomeRuler(c, world);
        break;
      default:
        break;
    }
  }
  if (dialecticCohort.length > 0) {
    dialecticCohort.sort((a, b) => b.evidence.reason - a.evidence.reason);
    const selected = inst.dialectic ? Math.max(1, Math.ceil(dialecticCohort.length / 2)) : 0;
    dialecticCohort.forEach((c, idx) => {
      if (idx < selected && c.assessedMetal === 'gold') {
        c.stage = 'dialectic';
        c.role = 'trainee';
        recordLife(c, world.year, 'selectedDialectic', 'Chosen at thirty for five years of dialectic (537d-539e)');
      } else {
        becomeOfficer(c, world, inst.dialectic ? 'Not chosen for dialectic; given command among the auxiliaries' : 'The muse of philosophy is neglected (548b); made an officer instead');
      }
    });
  }
}

function becomeOfficerKeepStage(c: Citizen, world: World): void {
  c.role = 'officer';
  recordLife(c, world.year, 'enteredStage', 'Sent back into the cave: fifteen years of military command and office (539e-540a)');
}
