import { DEFAULT_CONFIG, type SimConfig } from './config';
import { Rng } from './rng';
import { step } from './tick';
import type { Citizen, World } from './types';
import { createWorld } from './world';

export class Simulation {
  world: World;
  private rng: Rng;
  version = 0;

  constructor(config: SimConfig = DEFAULT_CONFIG) {
    this.world = createWorld(config);
    this.rng = new Rng(config.seed * 7919 + 17);
  }

  get config(): SimConfig {
    return this.world.config;
  }

  step(): void {
    step(this.world, this.rng);
    this.version++;
  }

  run(years: number): void {
    for (let i = 0; i < years; i++) this.step();
  }

  reset(config: SimConfig = this.world.config): void {
    this.world = createWorld(config);
    this.rng = new Rng(config.seed * 7919 + 17);
    this.version++;
  }

  citizen(id: number): Citizen | undefined {
    return this.world.citizens[id];
  }

  get atHorizon(): boolean {
    return this.world.year >= this.world.config.horizonYears;
  }
}
