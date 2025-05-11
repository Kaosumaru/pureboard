import { RandomGenerator } from '../shared/interface';

export class ServerRandomGenerator implements RandomGenerator {
  int(max: number): number {
    return this.intBetween(0, max - 1);
  }

  intBetween(min: number, max: number): number {
    const value = getRandomInt(min, max);
    this.addValue(value);
    return value;
  }

  randomValues(): number[] {
    return this.generatedNumbers;
  }

  reset(): void {
    this.generatedNumbers = [];
  }

  private addValue(value: number): void {
    this.generatedNumbers.push(value);
  }

  private generatedNumbers: number[] = [];
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
