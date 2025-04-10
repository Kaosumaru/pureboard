import { CurrentPlayerValidation, Store, StoreContainer } from '../shared/interface';
import { createHiddenObjectsStore, HiddenObjectsState } from '../shared/hiddenObjectsStore';
import { ClientRandomGenerator } from './clientRandom';
import { BaseClient } from './baseClient';
import { getClientHiddenObjects } from './clientHiddenObjects';
import { Signal } from 'typed-signals';
import { GameOptions, StandardGameAction } from '../shared/standardActions';
import { ActionHiddenObjectInfo, StateResponseInterface } from '../shared/internalInterface';
import { IBaseComponentClient, IDisposableClient, IGameRoomClient } from './interface';

function createDummyValidation(): CurrentPlayerValidation {
  return {
    isUser: () => true,
    canMoveAsPlayer: () => true,
    isServerOriginating: () => true,
  };
}

export class BaseComponentClient<Data, Action, HiddenType = any> extends BaseClient implements IDisposableClient, IBaseComponentClient {
  public store: Store<Data>;
  public container: StoreContainer<Data, Action, HiddenType>;
  public hiddenObjectsStore: Store<HiddenObjectsState<HiddenType>>;
  protected gameId: number;

  constructor(container: StoreContainer<Data, Action, HiddenType>, type: string, client: IGameRoomClient) {
    if (client.gameId === undefined) throw new Error('GameId is not set');
    super(client.client);

    this.gameId = client.gameId;

    this.container = container;
    this.store = container.store;
    this.type = type;
    this.hiddenObjectsStore = createHiddenObjectsStore<HiddenType>();
  }

  public async initialize(): Promise<void> {
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
        this.container.reducer(validation, action, this.random, getClientHiddenObjects(hiddenInfo));
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

    await this.getState();
  }

  public deinitialize(): void {
    this.disconnectAllSignals();
    this.deinitialized = true;
    this.hasState = false;
  }

  public sendAction(action: Action | StandardGameAction): Promise<void> {
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
    await this.sendAction({ type: 'newGame', options });
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
