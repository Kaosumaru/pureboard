import { Context, RandomGenerator, StoreContainer, UserPermissions } from './interface';

/**
 * Utility helper class for unit testing store actions and state.
 * Wraps a `StoreContainer` with a pre-built test `Context`, so actions can be
 * dispatched directly without needing to set up permissions or randomness manually.
 *
 * @template StoreData - The type of the state managed by the store.
 * @template Action - The type of the actions that can be dispatched.
 * @template HiddenType - The type of hidden objects, defaults to `any`.
 */
export class UTHelper<StoreData, Action, HiddenType = any> {
  store: StoreContainer<StoreData, Action, HiddenType>;
  ctx = createTestContext();

  constructor(store: StoreContainer<StoreData, Action, HiddenType>) {
    this.store = store;
  }

  /**
   * Dispatches an action against the store's reducer using the test context.
   *
   * @param action - The action to dispatch.
   */
  action(action: Action): void {
    this.store.reducer(this.ctx, action);
  }

  /**
   * Fixes the test random generator to always return the given value,
   * throwing if it falls outside the requested range.
   *
   * @param value - The value the random generator should always produce.
   */
  setRandomValue(value: number): void {
    this.ctx.random.value = value;
    this.ctx.random.mode = TestRandomMode.Fixed;
  }

  /**
   * Sets the strategy used by the test random generator.
   *
   * @param mode - The `TestRandomMode` to use for subsequent random calls.
   */
  setRandomMode(mode: TestRandomMode): void {
    this.ctx.random.mode = mode;
  }

  /**
   * Returns the current state of the wrapped store.
   */
  state(): StoreData {
    return this.store.store.getState();
  }
}

/**
 * Strategies for the `TestRandom` generator used in tests.
 */
export enum TestRandomMode {
  /** Always returns the explicitly set `value`, throwing if out of range. */
  Fixed = 'Fixed',
  /** Always returns the smallest possible value in the requested range. */
  Smallest = 'Smallest',
  /** Always returns the largest possible value in the requested range. */
  Largest = 'Largest',
}

/**
 * Deterministic `RandomGenerator` implementation used for unit testing,
 * so tests can control or bound the values returned instead of relying on real randomness.
 */
class TestRandom implements RandomGenerator {
  value = 0;
  mode: TestRandomMode = TestRandomMode.Smallest;

  intBetween(min: number, max: number): number {
    switch (this.mode) {
      case TestRandomMode.Fixed:
        if (this.value < min || this.value > max) {
          throw new Error(`TestRandom value ${this.value} is not between ${min} and ${max}`);
        }
        return this.value;
      case TestRandomMode.Smallest:
        return min;
      case TestRandomMode.Largest:
        return max;
    }
  }

  int(max: number): number {
    switch (this.mode) {
      case TestRandomMode.Fixed:
        if (this.value >= max) {
          throw new Error(`TestRandom value ${this.value} is greater than max ${max}`);
        }
        return this.value;
      case TestRandomMode.Smallest:
        return 0;
      case TestRandomMode.Largest:
        return max - 1;
    }
  }
}

/**
 * Test-only `Context` that always permits actions and uses the deterministic `TestRandom` generator.
 */
interface TestContext extends Context<any> {
  userPermissions: UserPermissions;
  random: TestRandom;
}

/**
 * Creates a `Context` suitable for unit tests: all permission checks pass,
 * and randomness is deterministic via `TestRandom`.
 */
function createTestContext(): TestContext {
  const ctx: TestContext = {
    userPermissions: {
      canMoveAsPlayer: function (_id: number): boolean {
        return true;
      },
      isUser: function (_id: string, _name: string): boolean {
        return true;
      },
      isServerOriginating: function (): boolean {
        return true;
      },
    },
    random: new TestRandom(),
  };
  return ctx;
}
