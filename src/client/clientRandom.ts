import { IRandomGenerator } from '../shared/interface';
import { create, RandomSeed } from 'random-seed';

export class ClientRandomGenerator implements IRandomGenerator {
  int(max: number): number {
    if (!this.randomSeed) {
      throw new Error('Random seed not initialized');
    }
    return this.randomSeed.range(max);
  }

  intBetween(min: number, max: number): number {
    if (!this.randomSeed) {
      throw new Error('Random seed not initialized');
    }
    return this.randomSeed.intBetween(min, max);
  }

  setSeed(seed: number | undefined): void {
    this.randomSeed = seed ? create(seed.toString()) : undefined;
  }

  private randomSeed: RandomSeed | undefined;
}
