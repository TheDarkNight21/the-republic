/** Deterministic PRNG (mulberry32) with the distributions the engine needs. */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = (seed >>> 0) || 0x9e3779b9;
  }

  /** Uniform in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [a, b] inclusive. */
  int(a: number, b: number): number {
    return a + Math.floor(this.next() * (b - a + 1));
  }

  uniform(a: number, b: number): number {
    return a + this.next() * (b - a);
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Box-Muller normal. */
  normal(mu = 0, sigma = 1): number {
    let u = 0;
    while (u === 0) u = this.next();
    const v = this.next();
    return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  lognormal(mu = 0, sigma = 1): number {
    return Math.exp(this.normal(mu, sigma));
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** In-place Fisher-Yates. */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  /** Weighted index draw; weights need not sum to 1. */
  weighted(weights: readonly number[]): number {
    let total = 0;
    for (const w of weights) total += w;
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r < 0) return i;
    }
    return weights.length - 1;
  }
}

export const clamp = (x: number, lo: number, hi: number): number => (x < lo ? lo : x > hi ? hi : x);
