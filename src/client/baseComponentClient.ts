import { GameRoomClient } from './gameRoomClient';
import { ActionHiddenObjectInfo, createDummyValidation, GameOptions, StandardGameAction, StateResponseInterface, Store, StoreContainer } from '../shared/interface';
import { useCallback, useEffect, useMemo } from 'react';
import { createHiddenObjectsStore, HiddenObjectsState } from '../shared/hiddenObjectsStore';
import { ClientRandomGenerator } from './clientRandom';
import { BaseClient } from './baseClient';
import { getClientHiddenObjects } from './clientHiddenObjects';
import { Signal } from 'typed-signals';
import { IClient } from './interface';

export interface IDisposableClient {
  initialize(): void;
  deinitialize(): void;
}

export interface IBaseComponentClient {
  type: string;
  restartGame(options: GameOptions): Promise<void>;
}

export interface IComponentClient {
  client: IClient;
  gameId?: number;
}

export class BaseComponentClient<Data, Action, HiddenType = any> extends BaseClient implements IDisposableClient, IBaseComponentClient {
  public store: Store<Data>;
  public container: StoreContainer<Data, Action, HiddenType>;
  public hiddenObjectsStore: Store<HiddenObjectsState<HiddenType>>;
  protected gameId: number;

  constructor(container: StoreContainer<Data, Action, HiddenType>, type: string, client: IComponentClient) {
    if (client.gameId === undefined) throw new Error('GameId is not set');
    super(client.client);

    this.gameId = client.gameId;

    this.container = container;
    this.store = container.store;
    this.type = type;
    this.hiddenObjectsStore = createHiddenObjectsStore<HiddenType>();
  }

  public initialize(): void {
    this.hasState = false;
    this.deinitialized = false;
    const validation = createDummyValidation();

    this.onEvent(`${this.type}/onAction`, (gameId: number, action: Action | StandardGameAction, seed: number | null, hiddenInfo?: ActionHiddenObjectInfo<HiddenType>) => {
      if (!this.hasState) return;
      if (this.gameId !== gameId) return;
      if (hiddenInfo !== undefined) {
        this.hiddenState().setStateDelta(hiddenInfo.delta);
      }

      this.random.setSeed(seed !== null ? seed : undefined);
      try {
        this.container.action(validation, action, this.random, getClientHiddenObjects(hiddenInfo));
      } catch (err) {
        console.error(`While trying to apply action, from server:\n ${String(err)}`);
        throw err;
      }
      this.random.setSeed(undefined);

      this.onAction(action);
      this.onAfterAction.emit(action);
    });

    this.onAuthorized(() => {
      void this.getState();
    });

    this.getState().catch(err => {
      // TODO show this error somewhere
      console.error(err);
    });
  }

  public deinitialize(): void {
    this.disconnectAllSignals();
    this.deinitialized = true;
    this.hasState = false;
  }

  protected doAction(action: Action | StandardGameAction): Promise<void> {
    return this.client.call<void>(`${this.type}/action`, this.gameId, action);
  }

  public isDestroyed(): boolean {
    return this.deinitialized;
  }

  protected state(): Data {
    return this.container.store.getState();
  }

  protected hiddenState(): HiddenObjectsState<HiddenType> {
    return this.hiddenObjectsStore.getState();
  }

  public async getState(): Promise<Data> {
    const resp = await this.client.call<StateResponseInterface<Data, HiddenType>>(`${this.type}/getGameState`, this.gameId);
    if (resp.hidden !== undefined) {
      this.hiddenState().setState(resp.hidden);
    }
    this.container.store.setState(resp.state, true);
    this.hasState = true;
    return resp.state;
  }

  public async restartGame(options: GameOptions): Promise<void> {
    await this.doAction({ type: 'newGame', options });
  }

  protected onAction(_action: Action | StandardGameAction): void {
    // Override this method to handle actions
  }

  hasState = false;
  deinitialized = false;
  type: string;
  random = new ClientRandomGenerator();
  onAfterAction = new Signal<(arg: Action | StandardGameAction) => void>();
}

type InferAction<T> = T extends BaseComponentClient<any, infer Action, any> ? Action : never;

export function useAfterAction<T extends BaseComponentClient<any, any, any>>(client: T, listener: (action: InferAction<T> | StandardGameAction) => void, deps: any[] = []): void {
  const cachedListener = useCallback(listener, deps);
  useEffect(() => {
    const connection = client.onAfterAction.connect(cachedListener);
    return () => {
      connection.disconnect();
    };
  }, [client, cachedListener]);
}

export function useClient<T extends IDisposableClient>(type: { new (client: GameRoomClient): T }, baseClient: GameRoomClient): T {
  const client = useMemo(() => new type(baseClient), [baseClient]);
  useEffect(() => {
    client.initialize();
    return () => {
      client.deinitialize();
    };
  }, [client]);
  return client;
}
