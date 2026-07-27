import { Context, UserPermissions, Store, StoreContainer } from '../shared/interface';
import { HiddenObjectContainer } from './hiddenObjectsContainer';
import { ServerRandomGenerator } from './serverRandom';
import { Component, ComponentConstructor, createUserPermissions, createRoomAndJoin, getRoomComponent, roomIdToGroup } from './rooms';
import { GroupEmitter, IServer } from './interface';
import { overridenComponentContainerValidation } from './test/server';
import { createServerValidation } from './utils';
import { GameOptions, StandardGameAction } from '../shared/standardActions';
import { ActionHiddenObjectInfo, StateResponseInterface } from '../shared/internalInterface';

interface IGenericComponent<Data, Action, HiddenType> {
  afterActionApplied(ctx: GroupEmitter, action: Action | StandardGameAction): void;
  container: StoreContainer<Data, Action, HiddenType>;
  afterActionCallback?: (ctx: GroupEmitter, action: Action | StandardGameAction) => void;
}

export interface IAction {
  type: string;
}

interface ComponentData<Data, ActionType extends IAction, HiddenObjectType = any> {
  game: IGenericComponent<Data, ActionType, HiddenObjectType>;
  hiddenObjects?: HiddenObjectContainer<HiddenObjectType>;
}

const random = new ServerRandomGenerator();

type AfterActionType<StateType, ActionType> = (store: Store<StateType>, id: number, ctx: GroupEmitter, action: ActionType | StandardGameAction) => void;

export class ComponentContainer<Data, ActionType extends IAction, HiddenObjectType = any> {
  protected hasHiddenState: boolean;

  constructor(type: string, hasHiddenState = false) {
    this.type = type;
    this.hasHiddenState = hasHiddenState;
  }

  createComponent(container: StoreContainer<Data, ActionType, HiddenObjectType>, options: GameOptions, afterAction?: AfterActionType<Data, ActionType>) {
    return (id: number): Component => {
      const game = new GenericComponent<Data, ActionType, HiddenObjectType>(container);

      const hiddenObjects = this.hasHiddenState ? new HiddenObjectContainer<HiddenObjectType>() : undefined;

      random.reset();

      const context: Context<HiddenObjectType> = {
        playerValidation: createServerValidation(),
        random,
        objects: hiddenObjects,
      };
      game.container.reducer(context, { type: 'newGame', options });

      if (afterAction) {
        game.afterActionCallback = (ctx, action) => afterAction(container.store, id, ctx, action);
      }

      const data: ComponentData<Data, ActionType, HiddenObjectType> = {
        game,
        hiddenObjects,
      };

      return [this.type, data as never];
    };
  }

  getContainer(id: number): StoreContainer<Data, ActionType, HiddenObjectType> {
    return this.get(id).game.container;
  }

  protected get(id: number): ComponentData<Data, ActionType, HiddenObjectType> {
    return getRoomComponent<ComponentData<Data, ActionType, HiddenObjectType>>(id, this.type);
  }

  sendServerAction(ctx: GroupEmitter, gameId: number, action: ActionType): void {
    const validation = createServerValidation();
    this.applyAction(ctx, gameId, action, validation);
  }

  registerGameWithCreation(server: IServer, storeConstructor: () => StoreContainer<Data, ActionType, HiddenObjectType>, settings: ICreationSettings<Data, ActionType>): void {
    this.registerGame(server);
    server.RegisterFunction(this.type + '/createGame', (ctx, options: GameOptions) => {
      const components: ComponentConstructor[] = [this.createComponent(storeConstructor(), options, settings.afterAction), ...(settings.components ?? [])];
      return createRoomAndJoin(ctx, options, this.type, components, settings.timeout ?? emptyRoomLifetime);
    });
  }

  registerGame(server: IServer): void {
    const validationFunction = overridenComponentContainerValidation ?? createUserPermissions;
    server.RegisterFunction(this.type + '/action', (ctx, gameId: number, action: ActionType | StandardGameAction) => {
      const validation = validationFunction(ctx, gameId);
      this.applyAction(ctx, gameId, action, validation);
    });

    server.RegisterFunction(this.type + '/getGameState', (ctx, gameId: number) => {
      const validation = validationFunction(ctx, gameId);
      const gameData = this.get(gameId);
      return {
        state: gameData.game.container.store.getState(),
        hidden: gameData.hiddenObjects?.getState(validation),
      } satisfies StateResponseInterface<Data, HiddenObjectType>;
    });
  }

  protected beforeActionApplied(_ctx: GroupEmitter, _gameId: number, _action: ActionType | StandardGameAction, _validation: UserPermissions): void {
    // This is a hook for subclasses to implement
  }

  private applyAction(ctx: GroupEmitter, gameId: number, action: ActionType | StandardGameAction, validation: UserPermissions) {
    this.beforeActionApplied(ctx, gameId, action, validation);

    const gameData = this.get(gameId);
    const objs = gameData.hiddenObjects;

    const context: Context<HiddenObjectType> = {
      playerValidation: validation,
      random,
      objects: objs,
    };

    random.reset();

    try {
      gameData.game.container.reducer(context, action);
    } catch (e) {
      objs?.revertDelta();
      throw e;
    }

    const seed = random.seed();

    if (objs) {
      ctx.iterateGroup(roomIdToGroup(gameId), ctx => {
        const validation = createUserPermissions(ctx, gameId);
        const info: ActionHiddenObjectInfo<HiddenObjectType> = {
          delta: objs.getStateDelta(validation),
          responses: objs.responses(),
        };
        ctx.emit(this.type + '/onAction', gameId, action, seed, info);
      });
      objs.flushDelta();
    } else {
      ctx.emitToGroup(roomIdToGroup(gameId), this.type + '/onAction', gameId, action, seed);
    }

    gameData.game.afterActionApplied(ctx, action);
  }

  type: string;
}

const emptyRoomLifetime = 1000 * 60 * 5;

export function registerGame<Data, ActionType extends IAction, HiddenObjectType = any>(
  server: IServer,
  type: string,
  storeConstructor: () => StoreContainer<Data, ActionType, HiddenObjectType>,
  settings: ICreationSettings<Data, ActionType>
): void {
  const gameContainer = new ComponentContainer<Data, ActionType, HiddenObjectType>(type, settings.hasHiddenState ?? false);
  gameContainer.registerGameWithCreation(server, storeConstructor, settings);
}
export interface ICreationSettings<StateType, ActionType> {
  components?: ComponentConstructor[];
  afterAction?: AfterActionType<StateType, ActionType>;
  timeout?: number;
  hasHiddenState?: boolean;
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
