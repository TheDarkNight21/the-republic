import { describe, expect, it } from 'vitest';
import { makeConfig } from '../config';
import { isCombatAge, isWarrior } from '../population';
import { Rng } from '../rng';
import { runWar } from '../systems/war';
import { createWorld, emptyScratch } from '../world';

describe('war', () => {
  it('only warriors of fighting age take the field, and cowards are made craftsmen', () => {
    const world = createWorld(makeConfig({ seed: 21 }));
    world.year = 5;
    world.war.nextWarYear = 5;
    world.scratch = emptyScratch();
    const rng = new Rng(7);
    runWar(world, rng);
    expect(world.scratch.combatants.size).toBeGreaterThan(20);
    for (const id of world.scratch.combatants) {
      const c = world.citizens[id];
      expect(c.warsFought).toBe(1);
      if (c.fled && c.alive) {
        expect(c.assignedClass).toBe('bronze');
        expect(c.occupation).not.toBeNull();
      } else if (c.alive) {
        expect(isWarrior(c) || c.role === 'ruler').toBe(true);
        expect(isCombatAge(c)).toBe(true);
      }
    }
    expect(world.war.last?.year).toBe(5);
    expect(world.war.nextWarYear).toBeGreaterThan(5);
    expect(world.log.some((e) => e.kind === 'war')).toBe(true);
  });

  it('never sees the perfectly spirited flee', () => {
    const world = createWorld(makeConfig({ seed: 21 }));
    for (const c of world.citizens) c.soul.spirit = 1;
    world.year = 5;
    world.war.nextWarYear = 5;
    world.scratch = emptyScratch();
    runWar(world, new Rng(7));
    expect(world.war.last?.fled).toBe(0);
  });

  it('halves the interval under a tyrant', () => {
    const intervals = (regime: 'aristocracy' | 'tyranny') => {
      const world = createWorld(makeConfig({ seed: 21 }));
      if (regime === 'tyranny') world.institutions.warlike = 0.5;
      const rng = new Rng(7);
      const out: number[] = [];
      for (let i = 0; i < 30; i++) {
        world.year = world.war.nextWarYear;
        world.scratch = emptyScratch();
        const from = world.year;
        runWar(world, rng);
        out.push(world.war.nextWarYear - from);
      }
      return out.reduce((a, b) => a + b, 0) / out.length;
    };
    expect(intervals('tyranny')).toBeLessThan(intervals('aristocracy') * 0.7);
  });
});
