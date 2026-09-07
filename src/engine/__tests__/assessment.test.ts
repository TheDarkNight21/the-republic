import { describe, expect, it } from 'vitest';
import { makeCitizen } from '../citizen';
import { DEFAULT_CONFIG, makeConfig } from '../config';
import { Rng } from '../rng';
import { Simulation } from '../simulation';
import { runAssessment } from '../systems/assessment';
import { createWorld } from '../world';

describe('Myth of the Metals', () => {
  it('sorts everyone correctly when the rulers see perfectly', () => {
    const cfg = makeConfig({ seed: 5, assessment: { ...DEFAULT_CONFIG.assessment, baseSigma: 0, childGamesSigma: 0 }, decay: { ...DEFAULT_CONFIG.decay, mode: 'off' } });
    const sim = new Simulation(cfg);
    sim.run(60);
    const adults = sim.world.living.map((i) => sim.world.citizens[i]).filter((c) => c.age >= 20 && c.age < 80 && !c.fled);
    const mismatched = adults.filter((c) => c.assignedClass !== c.trueMetal);
    expect(mismatched.length / adults.length).toBeLessThan(0.02);
  });

  it("raises a craftsman's gold child and sends down a guardian's bronze child at ten", () => {
    const cfg = makeConfig({ seed: 8, assessment: { ...DEFAULT_CONFIG.assessment, baseSigma: 0.02, childGamesSigma: 0.02 } });
    const world = createWorld(cfg);
    const rng = new Rng(3);
    const goldChild = makeCitizen({ id: world.nextId++, sex: 'M', birthYear: -10, age: 10, soul: { reason: 0.9, spirit: 0.3, appetite: 0.2 }, assignedClass: 'bronze', parentsKnown: true }, rng);
    goldChild.stage = 'apprentice';
    const bronzeChild = makeCitizen({ id: world.nextId++, sex: 'F', birthYear: -10, age: 10, soul: { reason: 0.2, spirit: 0.3, appetite: 0.9 }, assignedClass: 'silver', parentsKnown: false }, rng);
    bronzeChild.stage = 'musicGymnastics';
    bronzeChild.role = 'trainee';
    world.citizens.push(goldChild, bronzeChild);
    world.living.push(goldChild.id, bronzeChild.id);
    world.year = 1;
    runAssessment(world, rng);
    expect(goldChild.assignedClass).toBe('gold');
    expect(goldChild.stage).toBe('musicGymnastics');
    expect(goldChild.history.some((e) => e.kind === 'promoted')).toBe(true);
    expect(bronzeChild.assignedClass).toBe('bronze');
    expect(bronzeChild.stage).toBe('apprentice');
    expect(bronzeChild.history.some((e) => e.kind === 'demoted')).toBe(true);
  });

  it('does nothing once the regime stops testing', () => {
    const world = createWorld(makeConfig({ seed: 2 }));
    world.institutions.assessments = false;
    world.year = 1;
    const before = world.citizens.map((c) => c.observations);
    runAssessment(world, new Rng(1));
    expect(world.citizens.map((c) => c.observations)).toEqual(before);
  });
});
