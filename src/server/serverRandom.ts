import { RandomGenerator } from '../shared/interface';
import { create, RandomSeed } from 'random-seed';

export class ServerRandomGenerator implements RandomGenerator {
  int(max: number): number {
    if (!this.randomSeed) {
      this.regenerateSeed();
    }
    return this.randomSeed?.range(max) ?? 0;
  }

  intBetween(min: number, max: number): number {
    if (!this.randomSeed) {
      this.regenerateSeed();
    }
    return this.randomSeed?.intBetween(min, max) ?? 0;
  }

  seed(): number | undefined {
    return this.currentSeed;
  }

  regenerateSeed(): void {
    this.currentSeed = Math.random();
    this.randomSeed = create(this.currentSeed.toString());
  }

  reset(): void {
    this.currentSeed = undefined;
    this.randomSeed = undefined;
  }

  private currentSeed: number | undefined;
  private randomSeed: RandomSeed | undefined;
}
