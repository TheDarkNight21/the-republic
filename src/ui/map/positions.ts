import type { World } from '@engine/types';
import { lotFor } from './districts';

function hash(n: number): number {
  let x = (n + 1) * 2654435761;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519);
  x ^= x >>> 13;
  x = Math.imul(x, 3266489917);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

const PAD = 6;
const PAD_TOP = 20; // leave the lot label clear

/** Deterministic dot positions: each citizen has a fixed spot inside whatever lot they occupy this year. */
export class PositionStore {
  x = new Float32Array(0);
  y = new Float32Array(0);
  tx = new Float32Array(0);
  ty = new Float32Array(0);
  alpha = new Float32Array(0);
  private slot: string[] = [];

  private grow(n: number): void {
    if (n <= this.x.length) return;
    const size = Math.max(n, this.x.length * 2, 1024);
    const copy = (old: Float32Array) => {
      const next = new Float32Array(size);
      next.set(old);
      return next;
    };
    this.x = copy(this.x);
    this.y = copy(this.y);
    this.tx = copy(this.tx);
    this.ty = copy(this.ty);
    this.alpha = copy(this.alpha);
  }

  /** Called once per simulation change: refresh targets from the world. */
  sync(world: World): void {
    this.grow(world.citizens.length);
    for (const c of world.citizens) {
      const i = c.id;
      if (!c.alive) continue;
      if (this.slot[i] !== c.slotKey) {
        this.slot[i] = c.slotKey;
        const r = lotFor(c.slotKey).rect;
        const u = hash(i * 2);
        const v = hash(i * 2 + 1);
        this.tx[i] = r.x + PAD + u * (r.w - PAD * 2);
        this.ty[i] = r.y + PAD_TOP + v * (r.h - PAD_TOP - PAD);
        if (this.alpha[i] === 0) {
          // First appearance: start at the spot instead of flying in from the origin.
          this.x[i] = this.tx[i];
          this.y[i] = this.ty[i];
        }
      }
    }
  }

  /** Per animation frame: ease toward targets; the dead fade out. */
  animate(world: World): void {
    const n = world.citizens.length;
    for (let i = 0; i < n; i++) {
      const c = world.citizens[i];
      if (c.alive) {
        this.x[i] += (this.tx[i] - this.x[i]) * 0.12;
        this.y[i] += (this.ty[i] - this.y[i]) * 0.12;
        this.alpha[i] = Math.min(1, this.alpha[i] + 0.1);
      } else if (this.alpha[i] > 0) {
        this.alpha[i] = Math.max(0, this.alpha[i] - 0.05);
      }
    }
  }
}
