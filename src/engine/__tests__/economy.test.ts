import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, makeConfig } from '../config';
import { isGuardian } from '../population';
import { PREFERENCES } from '../regime/institutions';
import { Simulation } from '../simulation';

describe('economy', () => {
  it('keeps guardians propertyless in the kallipolis', () => {
    const sim = new Simulation(makeConfig({ seed: 4, decay: { ...DEFAULT_CONFIG.decay, mode: 'off' } }));
    sim.run(100);
    const guardians = sim.world.living.map((i) => sim.world.citizens[i]).filter(isGuardian);
    expect(guardians.length).toBeGreaterThan(50);
    expect(guardians.every((c) => c.wealth === 0 && c.property === 0)).toBe(true);
    expect(sim.world.history.every((r) => r.pauperShare === 0)).toBe(true);
  });

  it('lets guardians grasp at property once timocracy arrives', () => {
    const sim = new Simulation(makeConfig({ seed: 4, decay: { ...DEFAULT_CONFIG.decay, mode: 'off' } }));
    sim.run(20);
    sim.world.institutions = { ...PREFERENCES.honorLovers };
    sim.world.config.council.inertiaYears = 10_000;
    sim.run(20);
    const last = sim.world.history[sim.world.history.length - 1];
    expect(last.guardianPropertyShare).toBeGreaterThan(0.3);
  });

  it('produces paupers only when the regime allows it', () => {
    const sim = new Simulation(makeConfig({ seed: 4, decay: { ...DEFAULT_CONFIG.decay, mode: 'off' } }));
    sim.run(20);
    sim.world.institutions = { ...PREFERENCES.moneyLovers };
    sim.world.config.council.inertiaYears = 10_000;
    sim.run(40);
    const last = sim.world.history[sim.world.history.length - 1];
    expect(last.pauperShare).toBeGreaterThan(0.05);
  });
});
