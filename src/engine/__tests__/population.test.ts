import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, makeConfig } from '../config';
import { Simulation } from '../simulation';

describe('the city stays one (423b)', () => {
  it('holds the population and the guardian share for 300 years without decay', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const sim = new Simulation(makeConfig({ seed, decay: { ...DEFAULT_CONFIG.decay, mode: 'off' } }));
      sim.run(300);
      const h = sim.world.history;
      for (const r of h) {
        expect(r.population, `seed ${seed} year ${r.year}`).toBeGreaterThanOrEqual(750);
        expect(r.population, `seed ${seed} year ${r.year}`).toBeLessThanOrEqual(1200);
      }
      for (const r of h.slice(30)) {
        const share = (r.counts.gold + r.counts.silver) / r.population;
        expect(share, `seed ${seed} year ${r.year}`).toBeGreaterThan(0.1);
        expect(share, `seed ${seed} year ${r.year}`).toBeLessThan(0.28);
      }
      const births = h.reduce((a, r) => a + r.births, 0) / h.length;
      expect(births).toBeGreaterThan(15);
      expect(births).toBeLessThan(30);
      expect(sim.world.regime.id).toBe('aristocracy');
    }
  });
});
