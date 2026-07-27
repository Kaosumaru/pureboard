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
  component: IGenericComponent<Data, ActionType, HiddenObjectType>;
  hiddenObjects?: HiddenObjectContainer<HiddenObjectType>;
}

const random = new ServerRandomGenerator();

type AfterActionType<StateType, ActionType> = (store: Store<StateType>, id: number, ctx: GroupEmitter, action: ActionType | StandardGameAction) => void;

export class ComponentHandler<Data, ActionType extends IAction, HiddenObjectType = any> {
  protected hasHiddenState: boolean;

  constructor(type: string, hasHiddenState = false) {
    this.type = type;
    this.hasHiddenState = hasHiddenState;
  }

  createComponent(container: StoreContainer<Data, ActionType, HiddenObjectType>, options: GameOptions, afterAction?: AfterActionType<Data, ActionType>) {
    return (id: number): Component => {
      const component = new GenericComponent<Data, ActionType, HiddenObjectType>(container);

      const hiddenObjects = this.hasHiddenState ? new HiddenObjectContainer<HiddenObjectType>() : undefined;

      random.reset();

      const context: Context<HiddenObjectType> = {
        playerValidation: createServerValidation(),
        random,
        objects: hiddenObjects,
      };
      component.container.reducer(context, { type: 'newGame', options });

      if (afterAction) {
        component.afterActionCallback = (ctx, action) => afterAction(container.store, id, ctx, action);
      }

      const data: ComponentData<Data, ActionType, HiddenObjectType> = {
        component: component,
        hiddenObjects,
      };

      return [this.type, data as never];
    };
  }

  getContainer(id: number): StoreContainer<Data, ActionType, HiddenObjectType> {
    return this.get(id).component.container;
  }

  protected get(id: number): ComponentData<Data, ActionType, HiddenObjectType> {
    return getRoomComponent<ComponentData<Data, ActionType, HiddenObjectType>>(id, this.type);
  }

  sendServerAction(ctx: GroupEmitter, roomId: number, action: ActionType): void {
    const validation = createServerValidation();
    this.applyAction(ctx, roomId, action, validation);
  }

  registerWithCreateHandler(server: IServer, storeConstructor: () => StoreContainer<Data, ActionType, HiddenObjectType>, settings: ICreationSettings<Data, ActionType>): void {
    this.register(server);
    server.RegisterFunction(this.type + '/createGame', (ctx, options: GameOptions) => {
      const components: ComponentConstructor[] = [this.createComponent(storeConstructor(), options, settings.afterAction), ...(settings.components ?? [])];
      return createRoomAndJoin(ctx, options, this.type, components, settings.timeout ?? emptyRoomLifetime);
    });
  }

  register(server: IServer): void {
    const validationFunction = overridenComponentContainerValidation ?? createUserPermissions;
    server.RegisterFunction(this.type + '/action', (ctx, roomId: number, action: ActionType | StandardGameAction) => {
      const validation = validationFunction(ctx, roomId);
      this.applyAction(ctx, roomId, action, validation);
    });

    server.RegisterFunction(this.type + '/getState', (ctx, roomId: number) => {
      const validation = validationFunction(ctx, roomId);
      const componentData = this.get(roomId);
      return {
        state: componentData.component.container.store.getState(),
        hidden: componentData.hiddenObjects?.getState(validation),
      } satisfies StateResponseInterface<Data, HiddenObjectType>;
    });
  }

  protected beforeActionApplied(_ctx: GroupEmitter, _roomId: number, _action: ActionType | StandardGameAction, _validation: UserPermissions): void {
    // This is a hook for subclasses to implement
  }

  private applyAction(ctx: GroupEmitter, roomId: number, action: ActionType | StandardGameAction, validation: UserPermissions) {
    this.beforeActionApplied(ctx, roomId, action, validation);

    const componentData = this.get(roomId);
    const objs = componentData.hiddenObjects;

    const context: Context<HiddenObjectType> = {
      playerValidation: validation,
      random,
      objects: objs,
    };

    random.reset();

    try {
      componentData.component.container.reducer(context, action);
    } catch (e) {
      objs?.revertDelta();
      throw e;
    }

    const seed = random.seed();

    if (objs) {
      ctx.iterateGroup(roomIdToGroup(roomId), ctx => {
        const validation = createUserPermissions(ctx, roomId);
        const info: ActionHiddenObjectInfo<HiddenObjectType> = {
          delta: objs.getStateDelta(validation),
          responses: objs.responses(),
        };
        ctx.emit(this.type + '/onAction', roomId, action, seed, info);
      });
      objs.flushDelta();
    } else {
      ctx.emitToGroup(roomIdToGroup(roomId), this.type + '/onAction', roomId, action, seed);
    }

    componentData.component.afterActionApplied(ctx, action);
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
  const componentHandler = new ComponentHandler<Data, ActionType, HiddenObjectType>(type, settings.hasHiddenState ?? false);
  componentHandler.registerWithCreateHandler(server, storeConstructor, settings);
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
