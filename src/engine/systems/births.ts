import { makeCitizen } from '../citizen';
import { recordCity, recordLife } from '../log';
import type { Rng } from '../rng';
import { inheritSoul } from '../soul';
import type { Metal, World } from '../types';

function inWindow(age: number, [lo, hi]: [number, number]): boolean {
  return age >= lo && age <= hi;
}

/** Bk V 460b-461c: sanctioned children go to the rearing pen; the rest are not reared. */
export function runBirths(world: World, rng: Rng): void {
  const pen = world.institutions.communalLiving;
  const f = world.config.fertility;
  for (const con of world.scratch.conceptions) {
    const mother = world.citizens[con.motherId];
    const father = world.citizens[con.fatherId];
    if (!mother.alive) continue;
    const penBirth = con.guardian && pen;
    if (penBirth) {
      const ok =
        con.sanctioned &&
        mother.assignedClass !== 'bronze' &&
        father.assignedClass !== 'bronze' &&
        inWindow(mother.age, f.womenAges) &&
        inWindow(father.age, f.menAges);
      if (!ok) {
        world.scratch.notReared++;
        recordLife(mother, world.year, 'childNotAdmitted', 'A child was not admitted to the rearing pen (460c)');
        if (father.alive) recordLife(father, world.year, 'childNotAdmitted', 'A child was not admitted to the rearing pen (460c)');
        continue;
      }
    }
    const outOfSeason = con.guardian && world.regime.nuptialErrorYear !== null;
    const soul = inheritSoul(mother.soul, father.soul, rng, world.config, outOfSeason);
    const assignedClass: Metal = penBirth || !pen ? mother.assignedClass : 'bronze';
    const child = makeCitizen(
      {
        id: world.nextId++,
        sex: rng.chance(0.5) ? 'F' : 'M',
        birthYear: world.year,
        age: 0,
        soul,
        assignedClass,
        parentsKnown: !penBirth,
        motherId: mother.id,
        fatherId: father.id,
        sanctionedBirth: con.sanctioned,
        bornOutOfSeason: outOfSeason,
      },
      rng,
    );
    if (penBirth) {
      recordLife(child, world.year, 'born', 'Born of a sanctioned union; parents recorded by the rulers, unknown to the child');
      recordLife(child, world.year, 'admittedToRearingPen', 'Taken to the rearing pen and nursed by the city (460c-d)');
    } else {
      recordLife(child, world.year, 'born', `Born to ${mother.name} and ${father.name}`);
    }
    mother.childrenIds.push(child.id);
    father.childrenIds.push(child.id);
    recordLife(mother, world.year, 'childBorn', penBirth ? 'Bore a child for the city' : `Bore ${child.name}`);
    if (father.alive) recordLife(father, world.year, 'childBorn', penBirth ? 'Fathered a child for the city' : `Fathered ${child.name}`);
    world.citizens.push(child);
    world.living.push(child.id);
    world.scratch.births++;
  }
  if (world.scratch.notReared > 0) {
    recordCity(world, 'notReared', `${world.scratch.notReared} ${world.scratch.notReared === 1 ? 'child was' : 'children were'} not admitted to the rearing pen (460c)`);
  }
}
