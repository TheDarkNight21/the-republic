import { describe, expect, it } from 'vitest';
import { makeCitizen } from '../citizen';
import { DEFAULT_CONFIG, makeConfig } from '../config';
import { Rng } from '../rng';
import { step } from '../tick';
import type { Citizen, World } from '../types';
import { PREFERENCES } from '../regime/institutions';
import { createWorld } from '../world';

function plant(world: World, soul: Citizen['soul'], sex: 'F' | 'M'): Citizen {
  const c = makeCitizen({ id: world.nextId++, sex, birthYear: 0, age: 0, soul, assignedClass: 'gold', parentsKnown: false }, new Rng(9));
  world.citizens.push(c);
  world.living.push(c.id);
  return c;
}

function immortal(world: World, c: Citizen) {
  // Keep the fixture alive and un-drafted so the ladder is observable across 50 years.
  world.config.mortality.hazards = world.config.mortality.hazards.map(([a]) => [a, 0]);
  world.config.mortality.plagueChance = 0;
  world.config.war.firstWarYear = 10_000;
  world.war.nextWarYear = 10_000;
  return c;
}

describe('guardian education ladder', () => {
  it('walks a reason-dominant child from music to rule at fifty', () => {
    const cfg = makeConfig({ seed: 3, assessment: { ...DEFAULT_CONFIG.assessment, baseSigma: 0.01, childGamesSigma: 0.01 }, decay: { ...DEFAULT_CONFIG.decay, mode: 'off' } });
    const world = createWorld(cfg);
    const c = immortal(world, plant(world, { reason: 0.95, spirit: 0.4, appetite: 0.2 }, 'F'));
    const rng = new Rng(4);
    const seen: Record<number, string> = {};
    for (let y = 1; y <= 50; y++) {
      step(world, rng);
      seen[c.age] = c.stage;
    }
    expect(seen[7]).toBe('musicGymnastics');
    expect(seen[18]).toBe('militaryTraining');
    expect(seen[20]).toBe('mathematics');
    expect(seen[30]).toBe('dialectic');
    expect(seen[35]).toBe('practicalOffice');
    expect(seen[50]).toBe('philosophy');
    expect(c.role).toBe('ruler');
    expect(world.rulers).toContain(c.id);
  });

  it('makes a spirit-dominant child an auxiliary at twenty', () => {
    const cfg = makeConfig({ seed: 3, assessment: { ...DEFAULT_CONFIG.assessment, baseSigma: 0.01, childGamesSigma: 0.01 }, decay: { ...DEFAULT_CONFIG.decay, mode: 'off' } });
    const world = createWorld(cfg);
    const c = immortal(world, plant(world, { reason: 0.3, spirit: 0.95, appetite: 0.2 }, 'M'));
    const rng = new Rng(4);
    for (let y = 1; y <= 21; y++) step(world, rng);
    expect(c.assignedClass).toBe('silver');
    expect(c.stage).toBe('auxiliary');
    expect(c.role).toBe('auxiliary');
  });

  it('skips dialectic under timocracy', () => {
    const cfg = makeConfig({ seed: 3, assessment: { ...DEFAULT_CONFIG.assessment, baseSigma: 0.01, childGamesSigma: 0.01 }, decay: { ...DEFAULT_CONFIG.decay, mode: 'off' } });
    const world = createWorld(cfg);
    world.institutions = { ...PREFERENCES.honorLovers };
    world.config.council.inertiaYears = 10_000; // freeze the institutions for the fixture
    const c = immortal(world, plant(world, { reason: 0.95, spirit: 0.4, appetite: 0.2 }, 'F'));
    const rng = new Rng(4);
    for (let y = 1; y <= 31; y++) step(world, rng);
    expect(c.stage).not.toBe('dialectic');
    expect(c.role).toBe('officer');
  });
});
