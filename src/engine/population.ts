import type { Citizen, Metal, World } from './types';

export function living(world: World): Citizen[] {
  return world.living.map((i) => world.citizens[i]);
}

export function rebuildLiving(world: World): void {
  world.living.length = 0;
  for (let i = 0; i < world.citizens.length; i++) if (world.citizens[i].alive) world.living.push(i);
}

export function isGuardianClass(m: Metal): boolean {
  return m === 'gold' || m === 'silver';
}

export function isGuardian(c: Citizen): boolean {
  return isGuardianClass(c.assignedClass);
}

export function isAdult(c: Citizen): boolean {
  return c.age >= 20;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let t = 0;
  for (const v of values) t += v;
  return t / values.length;
}

export function isWarrior(c: Citizen): boolean {
  return c.role === 'auxiliary' || c.role === 'officer' || c.role === 'bodyguard';
}

export function isCombatAge(c: Citizen): boolean {
  return c.age >= 20 && c.age <= 50;
}
