import { describe, expect, it } from 'vitest';
import { Rng } from '../rng';

describe('Rng', () => {
  it('is deterministic for a seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const xs = Array.from({ length: 50 }, () => a.next());
    const ys = Array.from({ length: 50 }, () => b.next());
    expect(xs).toEqual(ys);
    expect(new Rng(43).next()).not.toBe(new Rng(42).next());
  });

  it('produces normals with the right mean and sd', () => {
    const r = new Rng(7);
    const n = 20000;
    let sum = 0;
    let sq = 0;
    for (let i = 0; i < n; i++) {
      const x = r.normal(2, 0.5);
      sum += x;
      sq += x * x;
    }
    const mean = sum / n;
    const sd = Math.sqrt(sq / n - mean * mean);
    expect(mean).toBeCloseTo(2, 1);
    expect(sd).toBeCloseTo(0.5, 1);
  });

  it('shuffles deterministically and keeps all elements', () => {
    const a = new Rng(1).shuffle([1, 2, 3, 4, 5, 6]);
    const b = new Rng(1).shuffle([1, 2, 3, 4, 5, 6]);
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('draws weighted indices in proportion', () => {
    const r = new Rng(3);
    const counts = [0, 0, 0];
    for (let i = 0; i < 10000; i++) counts[r.weighted([1, 2, 7])]++;
    expect(counts[2] / 10000).toBeCloseTo(0.7, 1);
    expect(counts[0] / 10000).toBeCloseTo(0.1, 1);
  });
});
