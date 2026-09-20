import { Context, UserPermissions, Store, StoreContainer, GameOptions as RoomOptions } from '../shared/interface';
import { HiddenObjectContainer } from './hiddenObjectsContainer';
import { ServerRandomGenerator } from './serverRandom';
import { Component, ComponentConstructor, createUserPermissions, createRoomAndJoin, getRoomComponent, roomIdToGroup } from './rooms';
import { GroupEmitter, IServer } from './interface';
import { overridenComponentContainerPermissions } from './test/server';
import { createServerPermissions } from './utils';
import { ActionHiddenObjectInfo, StateResponseInterface } from '../shared/internalInterface';

interface IGenericComponent<Data, Action, HiddenType> {
  afterActionApplied(ctx: GroupEmitter, action: Action, permissions: UserPermissions): void;
  beforeActionApplied(ctx: GroupEmitter, action: Action, permissions: UserPermissions): void;
  container: StoreContainer<Data, Action, HiddenType>;
  afterActionCallback?: (ctx: GroupEmitter, action: Action, permissions: UserPermissions) => void;
  beforeActionCallback?: (ctx: GroupEmitter, action: Action, permissions: UserPermissions) => void;
}

export interface IAction {
  type: string;
}

interface ComponentData<Data, ActionType extends IAction, HiddenObjectType = any> {
  component: IGenericComponent<Data, ActionType, HiddenObjectType>;
  hiddenObjects?: HiddenObjectContainer<HiddenObjectType>;
}

const random = new ServerRandomGenerator();

type ActionHookType<StateType, ActionType> = (store: Store<StateType>, id: number, ctx: GroupEmitter, action: ActionType, permissions: UserPermissions) => void;

export class ComponentHandler<Data, ActionType extends IAction, HiddenObjectType = any> {
  protected hasHiddenState: boolean;

  constructor(type: string, hasHiddenState = false) {
    this.type = type;
    this.hasHiddenState = hasHiddenState;
  }

  createComponent(container: StoreContainer<Data, ActionType, HiddenObjectType>, settings: IComponentSettings<Data, ActionType> = {}, initialAction?: ActionType) {
    return (id: number): Component => {
      const component = new GenericComponent<Data, ActionType, HiddenObjectType>(container);

      const hiddenObjects = this.hasHiddenState ? new HiddenObjectContainer<HiddenObjectType>() : undefined;

      random.reset();

      const context: Context<HiddenObjectType> = {
        userPermissions: createServerPermissions(),
        random,
        objects: hiddenObjects,
      };

      const beforeAction = settings.beforeAction;
      if (beforeAction) {
        component.beforeActionCallback = (ctx, action, permissions) => beforeAction(container.store, id, ctx, action, permissions);
      }

      const afterAction = settings.afterAction;
      if (afterAction) {
        component.afterActionCallback = (ctx, action, permissions) => afterAction(container.store, id, ctx, action, permissions);
      }

      if (initialAction) {
        component.container.reducer(context, initialAction);
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
    const permissions = createServerPermissions();
    this.applyAction(ctx, roomId, action, permissions);
  }

  registerWithCreateHandler(server: IServer, storeConstructor: () => StoreContainer<Data, ActionType, HiddenObjectType>, settings: ICreationSettings<Data, ActionType>): void {
    this.register(server);

    server.RegisterFunction(this.type + '/createGame', (ctx, options: RoomOptions) => {
      const initialAction = settings.initialAction?.(options);
      const components: ComponentConstructor[] = [this.createComponent(storeConstructor(), settings, initialAction), ...(settings.components ?? [])];

      return createRoomAndJoin(ctx, {
        seats: options.players,
        typeId: this.type,
        components,
        timeout: settings.timeout ?? emptyRoomLifetime,
      });
    });
  }

  register(server: IServer): void {
    const permissionsFunction = overridenComponentContainerPermissions ?? createUserPermissions;
    server.RegisterFunction(this.type + '/action', (ctx, roomId: number, action: ActionType) => {
      const permissions = permissionsFunction(ctx, roomId);
      this.applyAction(ctx, roomId, action, permissions);
    });

    server.RegisterFunction(this.type + '/getState', (ctx, roomId: number) => {
      const permissions = permissionsFunction(ctx, roomId);
      const componentData = this.get(roomId);
      return {
        state: componentData.component.container.store.getState(),
        hidden: componentData.hiddenObjects?.getState(permissions),
      } satisfies StateResponseInterface<Data, HiddenObjectType>;
    });
  }

  private applyAction(ctx: GroupEmitter, roomId: number, action: ActionType, permissions: UserPermissions) {
    const componentData = this.get(roomId);
    const objs = componentData.hiddenObjects;

    componentData.component.beforeActionApplied(ctx, action, permissions);

    const context: Context<HiddenObjectType> = {
      userPermissions: permissions,
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
        const permissions = createUserPermissions(ctx, roomId);
        const info: ActionHiddenObjectInfo<HiddenObjectType> = {
          delta: objs.getStateDelta(permissions),
          responses: objs.responses(),
        };
        ctx.emit(this.type + '/onAction', roomId, action, seed, info);
      });
      objs.flushDelta();
    } else {
      ctx.emitToGroup(roomIdToGroup(roomId), this.type + '/onAction', roomId, action, seed);
    }

    componentData.component.afterActionApplied(ctx, action, permissions);
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
  afterAction?: ActionHookType<StateType, ActionType>;
  beforeAction?: ActionHookType<StateType, ActionType>;
  timeout?: number;
  hasHiddenState?: boolean;
  initialAction?: (options: RoomOptions) => ActionType | undefined;
}

export interface IComponentSettings<StateType, ActionType> {
  afterAction?: ActionHookType<StateType, ActionType>;
  beforeAction?: ActionHookType<StateType, ActionType>;
}

class GenericComponent<Data, Action, HiddenType> implements IGenericComponent<Data, Action, HiddenType> {
  container: StoreContainer<Data, Action, HiddenType>;
  constructor(container: StoreContainer<Data, Action, HiddenType>) {
    this.container = container;
  }

  beforeActionApplied(ctx: GroupEmitter, action: Action, permissions: UserPermissions): void {
    if (this.beforeActionCallback) {
      this.beforeActionCallback(ctx, action, permissions);
    }
  }

  afterActionApplied(ctx: GroupEmitter, action: Action, permissions: UserPermissions): void {
    if (this.afterActionCallback) {
      this.afterActionCallback(ctx, action, permissions);
    }
  }

  beforeActionCallback?: (ctx: GroupEmitter, action: Action, permissions: UserPermissions) => void;
  afterActionCallback?: (ctx: GroupEmitter, action: Action, permissions: UserPermissions) => void;
}
