import { describe, expect, it } from 'vitest';
import { makeConfig } from '../config';
import { isGuardian } from '../population';
import { Rng } from '../rng';
import { meritOf, runFestival } from '../systems/festival';
import { step } from '../tick';
import { createWorld, emptyScratch } from '../world';

describe('marriage festival', () => {
  it('sanctions exactly the quota and respects the age windows', () => {
    const world = createWorld(makeConfig({ seed: 12 }));
    world.year = 1;
    world.scratch = emptyScratch();
    world.council.marriageQuota = 6;
    runFestival(world, new Rng(2));
    const sanctioned = world.scratch.conceptions.filter((c) => c.sanctioned);
    const pairedWomen = [...world.scratch.festivalPaired].map((id) => world.citizens[id]).filter((c) => c.sex === 'F');
    expect(pairedWomen.length).toBe(6);
    for (const c of world.scratch.festivalPaired) {
      const cit = world.citizens[c];
      expect(isGuardian(cit)).toBe(true);
      if (cit.sex === 'F') expect(cit.age >= 20 && cit.age <= 40).toBe(true);
      else expect(cit.age >= 25 && cit.age <= 55).toBe(true);
    }
    expect(sanctioned.length).toBeLessThanOrEqual(6);
  });

  it('pairs the best with the best', () => {
    const world = createWorld(makeConfig({ seed: 12 }));
    world.year = 1;
    world.scratch = emptyScratch();
    world.council.marriageQuota = 20;
    runFestival(world, new Rng(2));
    const pairs = world.scratch.festivalPairs.map(([w, m]) => [meritOf(world.citizens[w]), meritOf(world.citizens[m])]);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const xs = pairs.map((p) => p[0]);
    const ys = pairs.map((p) => p[1]);
    const mx = mean(xs);
    const my = mean(ys);
    let num = 0;
    let dx = 0;
    let dy = 0;
    for (let i = 0; i < xs.length; i++) {
      num += (xs[i] - mx) * (ys[i] - my);
      dx += (xs[i] - mx) ** 2;
      dy += (ys[i] - my) ** 2;
    }
    expect(num / Math.sqrt(dx * dy)).toBeGreaterThan(0.6);
  });

  it('does not rear unsanctioned children and keeps pen children from knowing their parents', () => {
    const world = createWorld(makeConfig({ seed: 12 }));
    const rng = new Rng(1);
    const before = world.citizens.length;
    for (let i = 0; i < 40; i++) step(world, rng);
    const born = world.citizens.slice(before);
    const pen = born.filter((c) => !c.parentsKnown);
    expect(pen.length).toBeGreaterThan(20);
    for (const c of pen) {
      expect(c.sanctionedBirth).toBe(true);
      expect(c.history.some((e) => e.kind === 'admittedToRearingPen')).toBe(true);
    }
    const notReared = world.history.reduce((a, r) => a + r.notReared, 0);
    expect(notReared).toBeGreaterThan(0);
    expect(born.every((c) => c.sanctionedBirth || c.parentsKnown)).toBe(true);
  });
});
