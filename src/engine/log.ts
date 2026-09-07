import type { Citizen, CityLogKind, LifeEventKind, World } from './types';

export function recordLife(c: Citizen, year: number, kind: LifeEventKind, text: string): void {
  c.history.push({ year, kind, text });
}

export function recordCity(world: World, kind: CityLogKind, text: string, citizenIds?: number[]): void {
  world.log.push(citizenIds ? { year: world.year, kind, text, citizenIds } : { year: world.year, kind, text });
}
