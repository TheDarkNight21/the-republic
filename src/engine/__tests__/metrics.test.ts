import { describe, expect, it } from 'vitest';
import { makeCitizen } from '../citizen';
import { DEFAULT_CONFIG, makeConfig } from '../config';
import { computeMetrics, gini } from '../metrics';
import { Rng } from '../rng';
import type { Citizen, Metal, World } from '../types';
import { createWorld, emptyScratch } from '../world';

describe('gini', () => {
  it('is 0 for equality and 0.75 for one holder among four', () => {
    expect(gini([1, 1, 1, 1])).toBeCloseTo(0);
    expect(gini([0, 0, 0, 10])).toBeCloseTo(0.75);
    expect(gini([])).toBe(0);
  });
});

function tiny(): World {
  const world = createWorld(makeConfig({ seed: 1, targetPopulation: 1 }));
  world.citizens = [];
  world.living = [];
  world.rulers = [];
  world.nextId = 0;
  world.scratch = emptyScratch();
  return world;
}

function add(world: World, trueMetal: Metal, assigned: Metal, role: Citizen['role'], wealth = 0): Citizen {
  const soul = trueMetal === 'gold' ? { reason: 0.9, spirit: 0.3, appetite: 0.2 } : trueMetal === 'silver' ? { reason: 0.3, spirit: 0.9, appetite: 0.2 } : { reason: 0.2, spirit: 0.3, appetite: 0.9 };
  const c = makeCitizen({ id: world.nextId++, sex: 'M', birthYear: -30, age: 30, soul, assignedClass: assigned, parentsKnown: true }, new Rng(1));
  c.role = role;
  c.wealth = wealth;
  if (role === 'producer') c.occupation = 'farmer';
  world.citizens.push(c);
  world.living.push(c.id);
  if (role === 'ruler') world.rulers.push(c.id);
  return c;
}

describe('the four virtues', () => {
  it('computes justice, wisdom, courage and harmony on a hand-built city', () => {
    const world = tiny();
    add(world, 'gold', 'gold', 'ruler');
    add(world, 'gold', 'gold', 'ruler');
    add(world, 'bronze', 'gold', 'ruler'); // a bronze soul among the rulers
    add(world, 'silver', 'silver', 'auxiliary');
    add(world, 'silver', 'silver', 'auxiliary');
    add(world, 'bronze', 'silver', 'auxiliary'); // a coward-to-be
    add(world, 'bronze', 'bronze', 'producer', 10);
    add(world, 'bronze', 'bronze', 'producer', 10);
    add(world, 'bronze', 'bronze', 'producer', 10);
    add(world, 'bronze', 'bronze', 'producer', 10);
    add(world, 'gold', 'bronze', 'producer', 10); // a gold soul left among the craftsmen
    add(world, 'bronze', 'bronze', 'producer', 10).jobChanges = 1;
    const m = computeMetrics(world);
    expect(m.wisdom).toBeCloseTo(2 / 3);
    expect(m.courage).toBeCloseTo(2 / 3);
    // matched and steady: 2 rulers + 2 auxiliaries + 4 producers = 8 of 12
    expect(m.justice).toBeCloseTo(8 / 12);
    expect(m.mismatchShare).toBeCloseTo(3 / 12);
    // rulers are reason-led; consent by true nature: gold 2/3, silver 2/2, bronze 5/7 (job-hopper still consents)
    expect(m.harmony).toBeCloseTo((2 / 3 + 1 + 5 / 7) / 3);
    expect(m.guardianPurity).toBeCloseTo(4 / 6);
    expect(m.gini).toBeCloseTo(0);
    expect(m.counts.rulers).toBe(3);
  });

  it('reports the happiness scale of Book IX', () => {
    expect(DEFAULT_CONFIG.horizonYears).toBe(300);
  });
});
