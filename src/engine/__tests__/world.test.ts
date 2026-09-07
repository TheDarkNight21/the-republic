import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../config';
import { median } from '../population';
import { createWorld, survivorship } from '../world';

describe('createWorld', () => {
  const world = createWorld(DEFAULT_CONFIG);

  it('founds the city at the target size with a plausible age pyramid', () => {
    expect(world.citizens.length).toBe(1000);
    const med = median(world.citizens.map((c) => c.age));
    expect(med).toBeGreaterThanOrEqual(18);
    expect(med).toBeLessThanOrEqual(34);
  });

  it('has philosopher-rulers from the start', () => {
    expect(world.rulers.length).toBeGreaterThanOrEqual(4);
    for (const id of world.rulers) expect(world.citizens[id].completedDialectic).toBe(true);
  });

  it('gives producers crafts, with farmers the largest group', () => {
    const producers = world.citizens.filter((c) => c.assignedClass === 'bronze' && c.age >= 14);
    const farmers = producers.filter((c) => c.occupation === 'farmer').length;
    expect(farmers / producers.length).toBeGreaterThan(0.25);
    expect(farmers / producers.length).toBeLessThan(0.45);
    expect(producers.every((c) => c.occupation !== null)).toBe(true);
  });

  it('keeps guardians near the target share', () => {
    const g = world.citizens.filter((c) => c.assignedClass !== 'bronze').length / 1000;
    expect(g).toBeGreaterThan(0.12);
    expect(g).toBeLessThan(0.28);
  });

  it('implies a pre-modern life expectancy', () => {
    const l = survivorship(DEFAULT_CONFIG);
    const e0 = l.reduce((a, b) => a + b, 0);
    expect(e0).toBeGreaterThan(38);
    expect(e0).toBeLessThan(55);
  });
});
