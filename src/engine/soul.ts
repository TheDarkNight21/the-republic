import type { SimConfig } from './config';
import { clamp, type Rng } from './rng';
import type { Metal, Soul, SoulPart } from './types';

export const PARTS: readonly SoulPart[] = ['reason', 'spirit', 'appetite'];

/** Bk III 415a: reason rules the gold, spirit the silver, appetite the bronze/iron. */
export function metalOf(part: SoulPart): Metal {
  return part === 'reason' ? 'gold' : part === 'spirit' ? 'silver' : 'bronze';
}

export function partOf(metal: Metal): SoulPart {
  return metal === 'gold' ? 'reason' : metal === 'silver' ? 'spirit' : 'appetite';
}

export function dominantPart(soul: Soul): SoulPart {
  if (soul.reason >= soul.spirit && soul.reason >= soul.appetite) return 'reason';
  if (soul.spirit >= soul.appetite) return 'spirit';
  return 'appetite';
}

export function dominantMetal(soul: Soul): Metal {
  return metalOf(dominantPart(soul));
}

export function sampleSoul(rng: Rng, cfg: SimConfig): Soul {
  const p = cfg.soul.priors;
  return {
    reason: clamp(rng.normal(p.reason[0], p.reason[1]), 0.02, 0.98),
    spirit: clamp(rng.normal(p.spirit[0], p.spirit[1]), 0.02, 0.98),
    appetite: clamp(rng.normal(p.appetite[0], p.appetite[1]), 0.02, 0.98),
  };
}

/**
 * Children resemble their parents but regress toward the population prior; children
 * conceived "out of season" (546d-547a) are noisier and more appetitive.
 */
export function inheritSoul(mother: Soul, father: Soul, rng: Rng, cfg: SimConfig, outOfSeason: boolean): Soul {
  const h = cfg.soul.heritability;
  const noise = cfg.soul.noise + (outOfSeason ? cfg.soul.outOfSeasonExtraNoise : 0);
  const out = {} as Soul;
  for (const part of PARTS) {
    const mid = (mother[part] + father[part]) / 2;
    let v = h * mid + (1 - h) * cfg.soul.priors[part][0] + rng.normal(0, noise);
    if (outOfSeason && part === 'appetite') v += cfg.soul.outOfSeasonAppetiteBias;
    out[part] = clamp(v, 0.02, 0.98);
  }
  return out;
}
