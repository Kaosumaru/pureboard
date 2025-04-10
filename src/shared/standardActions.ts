/**
 * Represents an action to start a new game.
 * If game needs a specific options to start, it can extends this action and add more fields.
 *
 * @interface NewGameAction
 * @property {'newGame'} type - The type of the action, which is always 'newGame'.
 * @property {GameOptions} options - The configuration options for the new game.
 */
export interface NewGameAction {
  type: 'newGame';
  options: GameOptions;
}

/**
 * Represents the configuration options for a game.
 *
 * @interface GameOptions
 * @property {number} players - The number of players participating in the game.
 */
export interface GameOptions {
  players: number;
}

export type StandardGameAction = NewGameAction;
