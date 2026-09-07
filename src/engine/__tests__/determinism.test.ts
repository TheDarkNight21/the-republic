import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeConfig } from '../config';
import { Simulation } from '../simulation';

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.ts') && !p.includes('__tests__')) out.push(p);
  }
  return out;
}

describe('determinism', () => {
  it('produces identical histories for the same seed', () => {
    const a = new Simulation(makeConfig({ seed: 99 }));
    const b = new Simulation(makeConfig({ seed: 99 }));
    a.run(120);
    b.run(120);
    expect(JSON.stringify(a.world.history)).toBe(JSON.stringify(b.world.history));
    expect(a.world.citizens.map((c) => [c.id, c.name, c.alive, c.assignedClass, c.stage, c.wealth])).toEqual(
      b.world.citizens.map((c) => [c.id, c.name, c.alive, c.assignedClass, c.stage, c.wealth]),
    );
  });

  it('diverges for different seeds', () => {
    const a = new Simulation(makeConfig({ seed: 1 }));
    const b = new Simulation(makeConfig({ seed: 2 }));
    a.run(5);
    b.run(5);
    expect(JSON.stringify(a.world.history)).not.toBe(JSON.stringify(b.world.history));
  });

  it('keeps the engine free of React', () => {
    const files = walk(join(__dirname, '..'));
    expect(files.length).toBeGreaterThan(10);
    for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(/from ['"]react/);
  });
});
