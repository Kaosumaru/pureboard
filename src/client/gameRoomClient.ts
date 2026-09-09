import { canUserMoveAsPlayer, createGameRoomStore, GameRoomData, GameRoomState, seatOf, UserInfo } from '../shared/gameRoomStore';
import { ConnectionState, createConnectionStore } from '../shared/connectionStore';
import { GameOptions, Store } from '../shared';
import { RPCClient } from 'yawr';
import { BaseClient } from './baseClient';
import { ConnectionInterface, IGameRoomClient, RoomInterface, SeatingInterface } from './interface';

/**
 * Options controlling the behavior of a `GameRoomClient`.
 */
export interface GameRoomClientOptions {
  /**
   * Whether the client should automatically try to reconnect after an unexpected disconnection. Defaults to `true`.
   */
  autoreconnect?: boolean;

  /**
   * Computes the delay (in ms) before a reconnect attempt, based on the number of tries made so far.
   */
  reconnectDelay?: (tries: number) => number | undefined;
}

const defaultReconnectDelay = (tries: number): number | undefined => {
  if (tries > 5) return undefined;
  if (tries < 2) return 1000;
  return 5000;
};

/**
 * The `GameRoomClient` class extends the `BaseClient` and provides functionality
 * for interacting with a game room server. It manages the state of the game room,
 * handles WebSocket events, and provides methods for creating, joining, and managing
 * game rooms and seats.
 */
export class GameRoomClient extends BaseClient implements IGameRoomClient, SeatingInterface, ConnectionInterface, RoomInterface {
  public gameId: number | undefined;
  public gamePassword: string | undefined;
  public userInfo: UserInfo | undefined;
  public store: Store<GameRoomState>;
  public connectionStore: Store<ConnectionState>;

  private readonly autoreconnect: boolean;
  private readonly reconnectDelay: (tries: number) => number | undefined;
  private lastToken: string | undefined;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private disconnectedIntentionally = false;

  /**
   * Constructs a new `GameRoomClient` instance.
   * @param path - The WebSocket path to connect to. Defaults to `/ws`.
   * @param options - Options controlling the behavior of the client, eg. autoreconnect.
   */
  constructor(path = '/ws', options?: GameRoomClientOptions) {
    const url = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + path;
    super(new RPCClient(url));
    this.store = createGameRoomStore();
    this.connectionStore = createConnectionStore();
    this.autoreconnect = options?.autoreconnect ?? true;
    this.reconnectDelay = options?.reconnectDelay ?? defaultReconnectDelay;

    this.onEvent('room/tookSeat', (roomId: number, userId: UserInfo, seat: number) => {
      if (this.gameId !== roomId) return;
      this.state().tookSeat(userId, seat);
    });

    this.onEvent('room/leftSeat', (roomId: number, seat: number) => {
      if (this.gameId !== roomId) return;
      this.state().leftSeat(seat);
    });

    this.onEvent('room/sendSeatsState', (roomId: number, stateData: GameRoomData) => {
      if (this.gameId !== roomId) return;
      this.state().setState(stateData);
    });

    this.onEvent('room/closed', (roomId: number) => {
      if (this.gameId !== roomId) return;
      this.state().close();
    });

    this.onDisconnected(() => this.handleDisconnected());
    this.onAuthorized(() => this.handleReconnected());
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

  public async start(token: string): Promise<boolean> {
    this.lastToken = token;
    await this.client.connect();
    this.userInfo = await this.client.authorize(token);
    if (!this.userInfo) {
      this.disconnect();
      return false;
    }
    return true;
  }

  public disconnect(): void {
    this.disconnectedIntentionally = true;
    this.clearReconnectTimer();
    this.client.disconnect();
  }

  public async reconnect(): Promise<void> {
    if (!this.lastToken) {
      throw new Error('No previous token available for reconnect.');
    }
    await this.client.reconnect();
    await this.start(this.lastToken);
    if (this.gameId) await this.join(this.gameId, this.gamePassword);
  }

  public async createRoom(game: string, options: GameOptions): Promise<[number, string | undefined]> {
    const state = await this.client.call<GameRoomData>(`${game}/createGame`, options);
    if (this.gameId) {
      throw new Error('Already in a game room. Please leave the current room before creating another.');
    }
    this.state().setState(state);
    this.gameId = state.id;
    this.gamePassword = state.password;

    return [this.gameId, state.password];
  }

  public async join(gameId: number, password?: string): Promise<number> {
    await this.client.call<number>('room/join', gameId, password);
    if (this.gameId) {
      throw new Error('Already in a game room. Please leave the current room before joining another.');
    }

    this.gameId = gameId;
    this.gamePassword = password;

    const state = await this.getState();
    this.state().setState(state);

    return this.gameId;
  }

  public async takeSeat(seat: number): Promise<void> {
    await this.client.call('room/takeSeat', this.gameId, seat);
  }

  public async leaveSeat(seat: number): Promise<void> {
    await this.client.call('room/leaveSeat', this.gameId, seat);
  }

  public async takeAvailableSeat(): Promise<number> {
    return await this.client.call<number>('room/takeAvailableSeat', this.gameId);
  }

  public async closeRoom(): Promise<void> {
    if (this.gameId) {
      await this.client.call('room/close', this.gameId);
    }
    this.gameId = undefined;
    this.gamePassword = undefined;
  }

  /**
   * Retrieves the current state of the game room from server.
   * @returns A promise that resolves to the game room state data.
   */
  private async getState(): Promise<GameRoomData> {
    return await this.client.call<GameRoomData>('room/getSeatsState', this.gameId);
  }

  /**
   * Retrieves the current state from the store.
   * @returns The current state of the game room.
   */
  private state() {
    return this.store.getState();
  }

  /**
   * Retrieves the current connection state from the connection store.
   * @returns The current connection state.
   */
  private connectionState() {
    return this.connectionStore.getState();
  }

  private handleDisconnected(): void {
    this.connectionState().setDisconnected(true);
    if (this.autoreconnect && !this.disconnectedIntentionally) this.scheduleReconnect();
  }

  private handleReconnected(): void {
    this.disconnectedIntentionally = false;
    this.clearReconnectTimer();
    this.connectionState().reset();
  }

  private scheduleReconnect(): void {
    const tries = this.connectionState().triesToConnect;
    const delay = this.reconnectDelay(tries);

    this.clearReconnectTimer();
    if (!delay) {
      this.connectionState().setAutoreconnecting(false);
      return;
    }

    this.connectionState().setAutoreconnecting(true);
    this.reconnectTimer = setTimeout(() => {
      this.reconnect().catch(() => {
        this.connectionState().setTriesToConnect(tries + 1);
        this.scheduleReconnect();
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer === undefined) return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }
}
