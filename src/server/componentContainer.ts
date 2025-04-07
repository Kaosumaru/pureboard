import {
  ActionHiddenObjectInfo,
  createDummyValidation,
  createServerValidation,
  CurrentPlayerValidation,
  GameOptions,
  StandardGameAction,
  StateResponseInterface,
  Store,
  StoreContainer,
} from '../shared/interface';
import { GroupEmitter } from 'yawr';
import { HiddenObjectContainer } from './hiddenObjectsContainer';
import { ServerRandomGenerator } from './serverRandom';
import { createCurrentPlayerValidation, createGameRoomAndJoin, GameConstructor } from './games';
import { IServer } from './interface';
import { overridenComponentContainerValidation } from './test/server';

interface IGenericComponent<Data, Action, HiddenType> {
  afterActionApplied(ctx: GroupEmitter, action: Action | StandardGameAction): void;
  container: StoreContainer<Data, Action, HiddenType>;
  afterActionCallback?: (ctx: GroupEmitter, action: Action | StandardGameAction) => void;
}

export interface IAction {
  type: string;
}

const random = new ServerRandomGenerator();

const groupOf = (id: number) => `game/${id}`;
type AfterActionType<StateType, ActionType> = (store: Store<StateType>, id: number, ctx: GroupEmitter, action: ActionType | StandardGameAction) => void;

export class ComponentContainer<Data, ActionType extends IAction, HiddenObjectType = any> {
  protected objects = new Map<number, HiddenObjectContainer<HiddenObjectType>>();
  protected games = new Map<number, IGenericComponent<Data, ActionType, HiddenObjectType>>();
  protected hasHiddenState: boolean;

  constructor(type: string, hasHiddenState = false) {
    this.type = type;
    this.hasHiddenState = hasHiddenState;
  }

  addGame(container: StoreContainer<Data, ActionType, HiddenObjectType>, options: GameOptions, afterAction?: AfterActionType<Data, ActionType>) {
    return (id: number): (() => void) => {
      const game = new GenericComponent<Data, ActionType, HiddenObjectType>(container);

      const hiddenObjects = this.hasHiddenState ? new HiddenObjectContainer<HiddenObjectType>() : undefined;
      game.container.action(createDummyValidation(), { type: 'newGame', options }, random, hiddenObjects);

      this.games.set(id, game);
      if (hiddenObjects) {
        this.objects.set(id, hiddenObjects);
      }
      if (afterAction) {
        game.afterActionCallback = (ctx, action) => afterAction(container.store, id, ctx, action);
      }

      return () => {
        this.deleteGame(id);
      };
    };
  }

  deleteGame(id: number): void {
    this.games.delete(id);
  }

  getContainer(id: number): StoreContainer<Data, ActionType, HiddenObjectType> {
    return this.get(id).container;
  }

  protected get(id: number): IGenericComponent<Data, ActionType, HiddenObjectType> {
    const game = this.games.get(id);
    if (!game) {
      throw new Error('Game not found');
    }
    return game;
  }

  sendServerAction(ctx: GroupEmitter, gameId: number, action: ActionType): void {
    const validation = createServerValidation();
    this.applyAction(ctx, gameId, action, validation);
  }

  registerServer(server: IServer): void {
    const validationFunction = overridenComponentContainerValidation ?? createCurrentPlayerValidation;
    server.RegisterFunction(this.type + '/action', (ctx, gameId: number, action: ActionType | StandardGameAction) => {
      const validation = validationFunction(ctx, gameId);
      this.applyAction(ctx, gameId, action, validation);
    });

    server.RegisterFunction(this.type + '/getGameState', (ctx, gameId: number) => {
      const validation = validationFunction(ctx, gameId);
      const game = this.get(gameId);
      return {
        state: game?.container.store.getState(),
        hidden: this.objects.get(gameId)?.getState(validation),
      } satisfies StateResponseInterface<Data, HiddenObjectType>;
    });
  }

  registerServerWithCreation(server: IServer, constructor: () => StoreContainer<Data, ActionType, HiddenObjectType>, settings: ICreationSettings<Data, ActionType>): void {
    this.registerServer(server);
    server.RegisterFunction(this.type + '/createGame', (ctx, options: GameOptions) => {
      let components: GameConstructor[] = [this.addGame(constructor(), options, settings.afterAction)];
      if (settings.components) {
        components = components.concat(settings.components(options));
      }

      return createGameRoomAndJoin(ctx, options, this.type, components, settings.timeout ?? emptyRoomLifetime);
    });
  }

  protected beforeActionAplied(_ctx: GroupEmitter, _gameId: number, _action: ActionType | StandardGameAction, _validation: CurrentPlayerValidation): void {
    // This is a hook for subclasses to implement
  }

  private applyAction(ctx: GroupEmitter, gameId: number, action: ActionType | StandardGameAction, validation: CurrentPlayerValidation) {
    this.beforeActionAplied(ctx, gameId, action, validation);

    const game = this.get(gameId);
    const objs = this.objects.get(gameId);

    try {
      game.container.action(validation, action, random, objs);
    } catch (e) {
      objs?.revertDelta();
      throw e;
    }

    const seed = random.seed();
    random.reset();

    if (objs) {
      ctx.iterateGroup(groupOf(gameId), ctx => {
        const validation = createCurrentPlayerValidation(ctx, gameId);
        const info: ActionHiddenObjectInfo<HiddenObjectType> = {
          delta: objs.getStateDelta(validation),
          responses: objs.responses(),
        };
        ctx.emit(this.type + '/onAction', gameId, action, seed, info);
      });
      objs.flushDelta();
    } else {
      ctx.emitToGroup(groupOf(gameId), this.type + '/onAction', gameId, action, seed);
    }

    game.afterActionApplied(ctx, action);
  }

  type: string;
}

const emptyRoomLifetime = 1000 * 60 * 5;

export interface ICreationSettings<StateType, ActionType> {
  components?: (options: GameOptions) => GameConstructor[];
  afterAction?: AfterActionType<StateType, ActionType>;
  timeout?: number;
}

class GenericComponent<Data, Action, HiddenType> implements IGenericComponent<Data, Action, HiddenType> {
  container: StoreContainer<Data, Action, HiddenType>;
  constructor(container: StoreContainer<Data, Action, HiddenType>) {
    this.container = container;
  }

  afterActionApplied(ctx: GroupEmitter, action: Action): void {
    if (this.afterActionCallback) {
      this.afterActionCallback(ctx, action);
    }
  }

  afterActionCallback?: (ctx: GroupEmitter, action: Action | StandardGameAction) => void;
}
