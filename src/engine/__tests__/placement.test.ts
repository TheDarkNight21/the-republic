import { describe, expect, it } from 'vitest';
import { makeConfig } from '../config';
import { placementFor } from '../placement';
import { createWorld, emptyScratch } from '../world';

describe('placement', () => {
  const world = createWorld(makeConfig({ seed: 3 }));
  world.scratch = emptyScratch();
  const find = (pred: (c: (typeof world.citizens)[number]) => boolean) => world.citizens.find(pred)!;

  it('puts guardian infants in the rearing pen and smiths in the agora', () => {
    const infant = find((c) => c.age <= 6 && c.assignedClass !== 'bronze');
    expect(placementFor(infant, world).district).toBe('nursery');
    const smith = find((c) => c.occupation === 'smith');
    expect(placementFor(smith, world).slotKey).toBe('agora/smith');
    const farmer = find((c) => c.occupation === 'farmer');
    expect(placementFor(farmer, world).district).toBe('farms');
    const ruler = find((c) => c.role === 'ruler');
    expect(placementFor(ruler, world).district).toBe('council');
  });

  it('sends combatants to the battlefield and the paired to the temple', () => {
    const aux = find((c) => c.role === 'auxiliary');
    world.scratch.combatants.add(aux.id);
    expect(placementFor(aux, world).district).toBe('battlefield');
    world.scratch.combatants.clear();
    world.scratch.festivalPaired.add(aux.id);
    expect(placementFor(aux, world).district).toBe('temple');
  });
});
