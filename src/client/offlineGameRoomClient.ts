import { Signal } from 'typed-signals';
import { canUserMoveAsPlayer, createGameRoomStore, GameRoomState, seatOf, UserInfo } from '../shared/gameRoomStore';
import { ConnectionState, createConnectionStore } from '../shared/connectionStore';
import { createHiddenObjectsStore, HiddenObjectsState } from '../shared/hiddenObjectsStore';
import { Context, GameOptions, Store, StoreContainer, UserPermissions } from '../shared/interface';
import { HiddenObjectContainer } from '../server/hiddenObjectsContainer';
import { ServerRandomGenerator } from '../server/serverRandom';
import { SeatingInterface } from './interface';

/**
 * Options controlling the behavior of a `OfflineGameRoomClient`.
 */
export interface OfflineGameRoomClientOptions<Action = any> {
  /**
   * Action applied to the store of the game right after it is set.
   */
  initialAction?: (options: GameOptions) => Action | undefined;

  /**
   * Information about the local user. Defaults to `{ id: 'local', name: 'Player' }`.
   */
  userInfo?: UserInfo;
}

/**
 * The `OfflineGameRoomClient` class is a serverless counterpart of the `GameRoomClient`.
 * It keeps the game room in an internal store, and applies actions locally to the store of the game.
 *
 * As there is no server, the local user is allowed to send every action, including the ones
 * that would normally be available only to other players or to the server.
 */
export class OfflineGameRoomClient<Data = any, Action = any, HiddenType = any> implements SeatingInterface {
  public gameId: number | undefined;
  public gamePassword: string | undefined;
  public userInfo: UserInfo | undefined;
  public store: Store<GameRoomState>;
  public connectionStore: Store<ConnectionState>;

  public container: StoreContainer<Data, Action, HiddenType> | undefined;
  public hiddenObjectsStore: Store<HiddenObjectsState<HiddenType>>;
  public onAfterAction = new Signal<(arg: Action) => void>();

  private readonly initialAction?: (options: GameOptions) => Action | undefined;
  private hiddenObjects?: HiddenObjectContainer<HiddenType>;
  private gameOptions: GameOptions | undefined;
  private readonly random = new ServerRandomGenerator();

  /**
   * Constructs a new `OfflineGameRoomClient` instance.
   * @param options - Settings of the game, and optionally information about the local user.
   */
  constructor(options: OfflineGameRoomClientOptions<Action> = {}) {
    this.hiddenObjectsStore = createHiddenObjectsStore<HiddenType>();
    this.initialAction = options.initialAction;
    this.userInfo = options.userInfo ?? { id: 'local', name: 'Player' };
    this.store = createGameRoomStore();
    this.connectionStore = createConnectionStore();
  }

  public seatOf(): number {
    return seatOf(this.userInfo?.id ?? '', this.state());
  }

  public haveSeat(index: number): boolean {
    return canUserMoveAsPlayer(this.userInfo?.id ?? '', this.state(), index);
  }

  public isSeatEmpty(index: number): boolean {
    return this.state().seats[index] == null;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async createRoom(options: GameOptions): Promise<[number, string | undefined]> {
    if (this.gameId) {
      throw new Error('Already in a game room. Please leave the current room before creating another.');
    }

    this.state().setState({
      id: localRoomId,
      seats: Array.from({ length: options.players }, () => null),
      type: localGameType,
      timeoutToClose: undefined,
      closed: false,
    });
    this.gameId = localRoomId;
    this.gameOptions = options;

    return [this.gameId, undefined];
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async takeSeat(seat: number): Promise<void> {
    const userInfo = this.requireUser();
    this.requireRoom();
    if (seat < 0 || seat >= this.state().seats.length) throw new Error('Seat not found');
    if (this.state().seats[seat]) throw new Error('Seat is taken');
    this.state().tookSeat(userInfo, seat);
    this.updateHiddenObjectsStore();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async leaveSeat(seat: number): Promise<void> {
    this.requireRoom();
    if (!this.haveSeat(seat)) throw new Error('Not authorized');
    this.state().leftSeat(seat);
    this.updateHiddenObjectsStore();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async takeAvailableSeat(): Promise<number> {
    const userInfo = this.requireUser();
    this.requireRoom();
    const alreadySeated = this.seatOf();
    if (alreadySeated !== -1) return alreadySeated;
    const seat = this.state().seats.findIndex(user => !user);
    if (seat === -1) return seat;

    this.state().tookSeat(userInfo, seat);
    this.updateHiddenObjectsStore();
    return seat;
  }

  /**
   * Sets the store of the game, and applies the initial action to it.
   * Called by the component of the game (eg. the one created with `CreateComponentContext`), so the store is defined only once.
   * @param container - The store holding the state of the game.
   */
  public setContainer(container: StoreContainer<Data, Action, HiddenType>): void {
    this.requireRoom();
    if (this.container === container) return;
    this.container = container;
    this.hiddenObjects = container.hasHiddenState ? new HiddenObjectContainer<HiddenType>() : undefined;
    this.hiddenObjectsStore.getState().setState({});

    const initialAction = this.gameOptions && this.initialAction?.(this.gameOptions);
    if (initialAction) {
      this.applyAction(initialAction);
    }
  }

  /**
   * Applies an action directly to the store of the game.
   * @param action - The action to apply.
   */
  public applyAction(action: Action): void {
    this.requireRoom();
    const container = this.container;
    if (!container) throw new Error('Store of the game is not set');
    const objs = this.hiddenObjects;

    this.random.reset();

    try {
      container.reducer(this.createContext(), action);
    } catch (e) {
      objs?.revertDelta();
      throw e;
    }

    objs?.flushDelta();
    this.updateHiddenObjectsStore();

    this.onAfterAction.emit(action);
  }

  /**
   * Fills the hidden objects store with the objects visible to the local user.
   */
  private updateHiddenObjectsStore(): void {
    if (!this.hiddenObjects) return;
    this.hiddenObjectsStore.getState().setState(this.hiddenObjects.getState(this.seatPermissions()));
  }

  private createContext(): Context<HiddenType> {
    return {
      userPermissions: {
        isUser: () => true,
        canMoveAsPlayer: () => true,
        isServerOriginating: () => true,
      },
      random: this.random,
      objects: this.hiddenObjects,
    };
  }

  /**
   * Permissions based on the seats taken by the local user.
   * Used only to decide which hidden objects are visible - actions are never restricted.
   */
  private seatPermissions(): UserPermissions {
    const userId = this.userInfo?.id ?? '';
    const userName = this.userInfo?.name ?? '';
    return {
      isUser: (id: string, name: string) => id === userId && name === userName,
      canMoveAsPlayer: (player: number) => canUserMoveAsPlayer(userId, this.state(), player),
      isServerOriginating: () => false,
    };
  }

  private requireUser(): UserInfo {
    if (!this.userInfo) throw new Error('Not authorized');
    return this.userInfo;
  }

  private requireRoom(): void {
    if (this.gameId === undefined) throw new Error('Room not found');
  }

  /**
   * Retrieves the current state from the store.
   * @returns The current state of the game room.
   */
  private state() {
    return this.store.getState();
  }
}

const localRoomId = 0;
const localGameType = 'localGame';
