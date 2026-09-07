import { isGuardian } from './population';
import type { Citizen, DistrictId, World } from './types';

export interface Placement {
  district: DistrictId;
  slotKey: string;
}

/** Where a citizen spends this year, derived purely from state. */
export function placementFor(c: Citizen, world: World): Placement {
  if (world.scratch.combatants.has(c.id)) return { district: 'battlefield', slotKey: 'battlefield' };
  if (world.scratch.festivalPaired.has(c.id)) return { district: 'temple', slotKey: 'temple' };
  if (c.role === 'tyrant' || c.role === 'bodyguard') return { district: 'council', slotKey: 'council' };
  if (c.role === 'ruler') return { district: 'council', slotKey: 'council' };
  if (c.role === 'pauper' || c.role === 'drone') return { district: 'agora', slotKey: 'agora/homes' };

  if (isGuardian(c) && c.occupation === null) {
    if (!c.parentsKnown && c.age <= 6) return { district: 'nursery', slotKey: 'nursery' };
    switch (c.stage) {
      case 'infant':
      case 'child':
        return { district: c.parentsKnown ? 'agora' : 'nursery', slotKey: c.parentsKnown ? 'agora/homes' : 'nursery' };
      case 'musicGymnastics':
        return { district: 'academy', slotKey: 'academy/music' };
      case 'militaryTraining':
        return { district: 'academy', slotKey: 'academy/palaestra' };
      case 'mathematics':
        return { district: 'academy', slotKey: 'academy/mathematics' };
      case 'dialectic':
        return { district: 'academy', slotKey: 'academy/dialectic' };
      case 'practicalOffice':
        return { district: 'barracks', slotKey: 'barracks/officers' };
      default:
        return { district: 'barracks', slotKey: 'barracks/mess' };
    }
  }

  if (c.age < 14) {
    const parent = c.fatherId !== null ? world.citizens[c.fatherId] : c.motherId !== null ? world.citizens[c.motherId] : null;
    if (parent && parent.occupation === 'farmer') return { district: 'farms', slotKey: 'farms' };
    return { district: 'agora', slotKey: 'agora/homes' };
  }
  if (c.occupation === 'farmer') return { district: 'farms', slotKey: 'farms' };
  if (c.occupation) return { district: 'agora', slotKey: `agora/${c.occupation}` };
  return { district: 'agora', slotKey: 'agora/homes' };
}

export function runPlacement(world: World): void {
  for (const i of world.living) {
    const c = world.citizens[i];
    const p = placementFor(c, world);
    c.district = p.district;
    c.slotKey = p.slotKey;
  }
}
