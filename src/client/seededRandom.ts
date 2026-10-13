import { RandomGenerator } from '../shared/interface';
import { create, RandomSeed } from 'random-seed';

/**
 * Random generator producing the same values for the same seed and number of previously applied actions.
 */
export class SeededRandomGenerator implements RandomGenerator {
  constructor(seed: number) {
    this.seed = seed;
    this.randomSeed = create(`${seed}`);
  }

  int(max: number): number {
    return this.randomSeed.range(max);
  }

  intBetween(min: number, max: number): number {
    return this.randomSeed.intBetween(min, max);
  }

  reset(): void {
    this.randomSeed = create(`${this.seed}:${this.actions}`);
    this.actions++;
  }

  private readonly seed: number;
  private actions = 0;
  private randomSeed: RandomSeed;
}
