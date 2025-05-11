import { RandomGenerator } from '../shared/interface';

export class ClientRandomGenerator implements RandomGenerator {
  setRandomValues(randomValues: number[]): void {
    this.generatedNumbers = randomValues;
  }
  int(_max: number): number {
    return this.getNextRandom();
  }

  intBetween(_min: number, _max: number): number {
    return this.getNextRandom();
  }

  finalize(): void {
    if (this.generatedNumbers.length !== 0) {
      console.error('Not all random numbers were used!');
    }
  }

  private getNextRandom(): number {
    const value = this.generatedNumbers.shift();
    if (value === undefined) {
      throw new Error('No more random numbers available');
    }
    return value;
  }

  private generatedNumbers: number[] = [];
}
