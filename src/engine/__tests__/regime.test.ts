import { describe, expect, it } from 'vitest';
import { makeCitizen } from '../citizen';
import { DEFAULT_CONFIG, makeConfig } from '../config';
import { runEvents } from '../regime/events';
import { KALLIPOLIS, PREFERENCES, classifyRegime } from '../regime/institutions';
import { blocOf, classify, holdCouncil } from '../regime/vote';
import { Rng } from '../rng';
import { Simulation } from '../simulation';
import { computeMetrics } from '../metrics';
import type { Citizen, Metal, World } from '../types';
import { createWorld, emptyScratch } from '../world';

function council(world: World, metals: Metal[], wealth = 0): Citizen[] {
  world.rulers = [];
  return metals.map((m) => {
    const soul = m === 'gold' ? { reason: 0.9, spirit: 0.3, appetite: 0.2 } : m === 'silver' ? { reason: 0.3, spirit: 0.9, appetite: 0.3 } : { reason: 0.2, spirit: 0.3, appetite: 0.9 };
    const c = makeCitizen({ id: world.nextId++, sex: 'M', birthYear: -40, age: 40, soul, assignedClass: 'gold', parentsKnown: false }, new Rng(1));
    c.role = 'ruler';
    c.wealth = wealth;
    world.citizens.push(c);
    world.living.push(c.id);
    world.rulers.push(c.id);
    return c;
  });
}

describe('the council decides the institutions', () => {
  it('keeps the kallipolis intact while philosophers hold a majority', () => {
    const world = createWorld(makeConfig({ seed: 1 }));
    council(world, ['gold', 'gold', 'gold', 'silver', 'bronze']);
    for (let y = 0; y < 10; y++) {
      world.year++;
      holdCouncil(world);
    }
    expect(world.institutions).toEqual(KALLIPOLIS);
  });

  it('lets a spirited majority end dialectic and the property ban after a few years, and not before', () => {
    const world = createWorld(makeConfig({ seed: 1 }));
    council(world, ['gold', 'silver', 'silver', 'silver']);
    world.year++;
    holdCouncil(world);
    expect(world.institutions.dialectic).toBe(true);
    for (let y = 0; y < DEFAULT_CONFIG.council.inertiaYears; y++) {
      world.year++;
      holdCouncil(world);
    }
    expect(world.institutions.dialectic).toBe(false);
    expect(world.institutions.propertyBan).toBe(false);
    expect(world.institutions.academy).toBe(true);
    expect(world.institutions.communalLiving).toBe(true);
    expect(world.institutions.officeRule).toBe('honor');
    classify(world);
    expect(world.regime.id).toBe('timocracy');
    expect(world.regime.transitions[0].cause).toMatch(/3 lovers of honor/);
  });

  it('turns rich rulers into lovers of money whatever their metal, except philosophers', () => {
    const world = createWorld(makeConfig({ seed: 1 }));
    world.economy.medianWealth = 10;
    const [gold, silver] = council(world, ['gold', 'silver'], 100);
    expect(blocOf(gold, world)).toBe('philosophers');
    expect(blocOf(silver, world)).toBe('moneyLovers');
    const [poor] = council(world, ['bronze'], 0);
    expect(blocOf(poor, world)).toBe('people');
  });

  it('reads the regime off how office is filled', () => {
    expect(classifyRegime('philosophers')).toBe('aristocracy');
    expect(classifyRegime('wealth')).toBe('oligarchy');
    expect(classifyRegime('one')).toBe('tyranny');
  });
});

describe('the events that are not voted', () => {
  it('never lets the poor rise while there are no paupers', () => {
    const world = createWorld(makeConfig({ seed: 2 }));
    world.scratch = emptyScratch();
    world.history.push(computeMetrics(world));
    const rng = new Rng(3);
    for (let i = 0; i < 200; i++) runEvents(world, rng);
    expect(world.institutions.officeRule).toBe('philosophers');
  });

  it('lets the poor rise against a few weak rich', () => {
    const world = createWorld(makeConfig({ seed: 2 }));
    world.institutions = { ...PREFERENCES.moneyLovers };
    world.scratch = emptyScratch();
    for (const i of world.living) {
      const c = world.citizens[i];
      if (c.age >= 20 && c.assignedClass === 'bronze') c.role = 'pauper';
    }
    world.history.push(computeMetrics(world));
    const rng = new Rng(3);
    let year = 0;
    while (world.institutions.officeRule !== 'lot' && year < 100) {
      year++;
      runEvents(world, rng);
    }
    expect(world.institutions.officeRule).toBe('lot');
    expect(world.log.some((e) => e.text.includes('rose against the rich'))).toBe(true);
  });
});

describe('the whole course', () => {
  it('stands for 300 years when the nuptial number is never missed', () => {
    for (const seed of [1, 2, 3]) {
      const sim = new Simulation(makeConfig({ seed, decay: { ...DEFAULT_CONFIG.decay, mode: 'off' } }));
      sim.run(300);
      expect(sim.world.regime.id, `seed ${seed}`).toBe('aristocracy');
      expect(sim.world.institutions, `seed ${seed}`).toEqual(KALLIPOLIS);
    }
  });

  it('can decline; the first fall is always the compromise of 547b, and tyranny only ever follows democracy', () => {
    let declined = 0;
    let tyrannies = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const sim = new Simulation(makeConfig({ seed }));
      sim.run(300);
      const tr = sim.world.regime.transitions;
      if (tr.length === 0) continue;
      declined++;
      expect(tr[0].to, `seed ${seed}`).toBe('timocracy');
      expect(sim.world.regime.nuptialErrorYear, `seed ${seed}`).not.toBeNull();
      for (const t of tr) {
        if (t.to === 'tyranny') {
          tyrannies++;
          expect(t.from, `seed ${seed}`).toBe('democracy');
        }
        if (t.to === 'oligarchy') expect(['timocracy', 'democracy'], `seed ${seed}`).toContain(t.from);
      }
    }
    expect(declined).toBeGreaterThanOrEqual(3);
    expect(tyrannies).toBeGreaterThanOrEqual(1);
  });
});
