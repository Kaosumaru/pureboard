export interface CurrentPlayerValidation {
  canMoveAsPlayer(id: number): boolean;
  isUser(id: string, name: string): boolean;
  isServerOriginating(): boolean;
}

export interface RandomGenerator {
  int(max: number): number;
  intBetween(min: number, max: number): number;
}

export interface IHiddenObjects<T> {
  shuffleAndHide(ids: number[], visibleTo: number): void;
  getVisibleObject(id: number): T;
  setObjectVisibleOnlyFor(id: number, player: number): void;
  setObjectVisibleForAll(id: number): void;
  addObject(id: number, object: T): void;
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

export function createDummyValidation(): CurrentPlayerValidation {
  return {
    isUser: (_id: string, _name: string) => true,
    canMoveAsPlayer: (_player: number) => true,
    isServerOriginating: () => true,
  };
}

export function createServerValidation(): CurrentPlayerValidation {
  return {
    isUser: (_id: string, _name: string) => false,
    canMoveAsPlayer: (_player: number) => false,
    isServerOriginating: () => true,
  };
}

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
