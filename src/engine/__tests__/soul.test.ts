import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, makeConfig } from '../config';
import { Rng } from '../rng';
import { dominantMetal, inheritSoul, sampleSoul } from '../soul';

describe('soul', () => {
  it('samples a population with a small gold and silver minority', () => {
    const rng = new Rng(11);
    const counts = { gold: 0, silver: 0, bronze: 0 };
    const n = 20000;
    for (let i = 0; i < n; i++) counts[dominantMetal(sampleSoul(rng, DEFAULT_CONFIG))]++;
    expect(counts.gold / n).toBeGreaterThan(0.04);
    expect(counts.gold / n).toBeLessThan(0.1);
    expect(counts.silver / n).toBeGreaterThan(0.1);
    expect(counts.silver / n).toBeLessThan(0.25);
  });

  it('returns the parental mean with full heritability and no noise', () => {
    const cfg = makeConfig({ soul: { ...DEFAULT_CONFIG.soul, heritability: 1, noise: 0 } });
    const a = { reason: 0.8, spirit: 0.2, appetite: 0.4 };
    const b = { reason: 0.6, spirit: 0.4, appetite: 0.2 };
    const child = inheritSoul(a, b, new Rng(1), cfg, false);
    expect(child.reason).toBeCloseTo(0.7);
    expect(child.spirit).toBeCloseTo(0.3);
    expect(child.appetite).toBeCloseTo(0.3);
  });

  it('makes out-of-season children more appetitive on average', () => {
    const rng = new Rng(5);
    const p = { reason: 0.7, spirit: 0.4, appetite: 0.4 };
    let inSeason = 0;
    let outOfSeason = 0;
    for (let i = 0; i < 4000; i++) {
      inSeason += inheritSoul(p, p, rng, DEFAULT_CONFIG, false).appetite;
      outOfSeason += inheritSoul(p, p, rng, DEFAULT_CONFIG, true).appetite;
    }
    expect(outOfSeason / 4000 - inSeason / 4000).toBeGreaterThan(0.04);
  });
});
