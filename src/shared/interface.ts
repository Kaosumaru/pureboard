/**
 * Interface representing the validation logic for a player in a game.
 * This validation determines, if user is allowed to make a move for player in the game.
 */
export interface CurrentPlayerValidation {
  /**
   * Determines if the user sending the action occupies the seat with given id.
   *
   * @param id - The numeric ID of the player.
   * @returns A boolean indicating whether the player can move.
   */
  canMoveAsPlayer(id: number): boolean;

  /**
   * Checks if the provided ID and name match the user sending the action.
   *
   * @param id - The string ID of the user.
   * @param name - The name of the user.
   * @returns A boolean indicating whether the ID and name correspond to the current user.
   */
  isUser(id: string, name: string): boolean;

  /**
   * Determines if the action or request originates from the server.
   *
   * @returns A boolean indicating whether the origin is the server.
   */
  isServerOriginating(): boolean;
}

/**
 * Interface representing a random number generator.
 * On server, before applying the action, the random number generator is creating a new seed.
 * On client, the random number generator is seeded with the same seed as the server.
 * This way, the client and server will generate the same random numbers for a given action.
 */
export interface RandomGenerator {
  /**
   * Generates a random integer between 0 (inclusive) and the specified maximum value (exclusive).
   *
   * @param max - The upper bound (exclusive) for the random integer.
   * @returns A random integer between 0 (inclusive) and `max` (exclusive).
   */
  int(max: number): number;

  /**
   * Generates a random integer between the specified minimum (inclusive) and maximum (exclusive) values.
   *
   * @param min - The lower bound (inclusive) for the random integer.
   * @param max - The upper bound (exclusive) for the random integer.
   * @returns A random integer between `min` (inclusive) and `max` (exclusive).
   */
  intBetween(min: number, max: number): number;
}

/**
 * Interface representing id -> object mapping.
 */
export type ObjectsMap<Type> = {
  [id: number]: Type;
};

/**
 * Interface representing the state of hidden objects in a game.
 */
export interface HiddenObjectsData<Type> {
  objects: ObjectsMap<Type>;
}

/**
 * Interface representing a collection of hidden objects with visibility control.
 * Game can contain such collection, and it can be used to manage objects that are not visible to all players.
 * (eg cards in a hand, or hidden objects in a game).
 *
 * Server has access to all objects, but client can only see the objects that are visible to them.
 * If action causes the object to change visibility, the server will send the new visibility state to all players.
 *
 * Bear in mind, that if given client seen the content of object, making it hidden again can allow for cheating.
 * (eg player seen card with id 13 and then it is hidden again, but game client can still remember that information).
 * In these cases, you shoulf use function shuffleAndHide.
 *
 * @template T - The type of the objects being managed.
 */
export interface IHiddenObjects<T> {
  /*
   * Shuffles contents of all ids and hides them.
   * This is useful if you want to hide objects that were already seen by the player.
   * For example, if you want to hide cards in a hand, but player already seen them.
   *
   * @param ids - The ids of the objects to shuffle.
   * @param visibleTo - The id of the player that will see the objects.
   */
  shuffleAndHide(ids: number[], visibleTo: number): void;

  // Get the state of the hidden object .
  getVisibleObject(id: number): T;

  // Set visibility state of the object.
  setObjectVisibleOnlyFor(id: number, player: number): void;

  // Set object visible for all players.
  setObjectVisibleForAll(id: number): void;

  // Add a new object to the collection.
  addObject(id: number, object: T): void;

  // Removes all objects from the collection.
  clearObjects(): void;
}

export interface IHiddenObjectWrapper<Type> {
  object: Type;
  visibleOnlyTo?: number;
}

export type IHiddenObjectWrapperMap<Type> = {
  [id: number]: IHiddenObjectWrapper<Type> | null;
};

export interface StateResponseInterface<Data, HiddenType> {
  state: Data;
  hidden?: IHiddenObjectWrapperMap<HiddenType>;
}

export interface ActionHiddenObjectInfo<HiddenType> {
  delta: IHiddenObjectWrapperMap<HiddenType>;
  responses: [number, HiddenType][];
}

export interface NewGameAction {
  type: 'newGame';
  options: GameOptions;
}

export type StandardGameAction = NewGameAction;

export interface GameOptions {
  players: number;
}

export interface Store<StateType> {
  setState(data: StateType, replace: boolean): void;
  getState(): StateType;
  <T>(cb: (state: StateType) => T): T;
}

export interface StoreContainer<StateType, ActionType, HiddenType = any> {
  store: Store<StateType>;
  action: (playerValidation: CurrentPlayerValidation, action: ActionType | StandardGameAction, random: RandomGenerator, objects?: IHiddenObjects<HiddenType>) => void;
}
