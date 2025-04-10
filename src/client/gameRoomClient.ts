import { canUserMoveAsPlayer, createGameRoomStore, GameRoomData, GameRoomState, seatOf, UserInfo } from '../shared/gameRoomStore';
import { Store } from '../shared/interface';
import { RPCClient } from 'yawr';
import { BaseClient } from './baseClient';
import { GameOptions } from '../shared/standardActions';
import { IGameRoomClient } from './interface';

/**
 * The `GameRoomClient` class extends the `BaseClient` and provides functionality
 * for interacting with a game room server. It manages the state of the game room,
 * handles WebSocket events, and provides methods for creating, joining, and managing
 * game rooms and seats.
 */
export class GameRoomClient extends BaseClient implements IGameRoomClient {
  /**
   * The ID of the current game room.
   */
  public gameId: number | undefined;

  /**
   * The password for the current game room, if applicable.
   */
  public gamePassword: string | undefined;

  /**
   * Information about the current user.
   */
  public userInfo: UserInfo | undefined;

  /**
   * The Redux-like store that manages the state of the game room.
   */
  public store: Store<GameRoomState>;

  /**
   * Constructs a new `GameRoomClient` instance.
   * @param path - The WebSocket path to connect to. Defaults to `/ws`.
   */
  constructor(path = '/ws') {
    const url = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + path;
    super(new RPCClient(url));
    this.store = createGameRoomStore();

    this.onEvent('game/tookSeat', (roomId: number, userId: UserInfo, seat: number) => {
      if (this.gameId !== roomId) return;
      this.state().tookSeat(userId, seat);
    });

    this.onEvent('game/leftSeat', (roomId: number, seat: number) => {
      if (this.gameId !== roomId) return;
      this.state().leftSeat(seat);
    });

    this.onEvent('game/sendSeatsState', (roomId: number, stateData: GameRoomData) => {
      if (this.gameId !== roomId) return;
      this.state().setState(stateData);
    });

    this.onEvent('game/closed', (roomId: number) => {
      if (this.gameId !== roomId) return;
      this.state().close();
    });
  }

  /**
   * Gets the seat index of the current user.
   * @returns The seat index of the user.
   */
  public seatOf(): number {
    return seatOf(this.userInfo?.id ?? '', this.state());
  }

  /**
   * Checks if the current user currecntly occupies a specific seat.
   * @param index - The index of the seat to check.
   * @returns `true` if the user can occupy the seat, otherwise `false`.
   */
  public haveSeat(index: number): boolean {
    return canUserMoveAsPlayer(this.userInfo?.id ?? '', this.state(), index);
  }

  /**
   * Checks if a specific seat is empty.
   * @param index - The index of the seat to check.
   * @returns `true` if the seat is empty, otherwise `false`.
   */
  public isSeatEmpty(index: number): boolean {
    return this.state().seats[index] == null;
  }

  /**
   * Starts the client by connecting to the server and authorizing the user.
   * @param token - The authorization token for the user.
   * @returns A promise that resolves to `true` if the client started successfully, otherwise `false`.
   */
  public async start(token: string | undefined): Promise<boolean> {
    if (!token) {
      this.disconnect();
      return false;
    }
    await this.client.connect();
    this.userInfo = await this.client.authorize(token);
    if (!this.userInfo) {
      this.disconnect();
      return false;
    }
    return true;
  }

  /**
   * Disconnects the client from the server.
   */
  public disconnect(): void {
    this.client.disconnect();
  }

  /**
   * Reconnects the client to the server and reinitializes the game room state.
   * @param token - The authorization token for the user.
   */
  public async reconnect(token: string | undefined): Promise<void> {
    await this.client.reconnect();
    await this.start(token);
    if (this.gameId) await this.join(this.gameId, this.gamePassword);
  }

  /**
   * Creates a new game room.
   * @param game - The id of the game.
   * @param options - The options for the game room.
   * @returns A promise that resolves to a tuple containing the game room ID and password.
   */
  public async createRoom(game: string, options: GameOptions): Promise<[number, string | undefined]> {
    const state = await this.client.call<GameRoomData>(`${game}/createGame`, options);
    this.state().setState(state);
    this.gameId = state.id;
    this.gamePassword = state.password;

    return [this.gameId, state.password];
  }

  /**
   * Joins an existing game room.
   * @param gameId - The ID of the game room to join.
   * @param password - The password for the game room, if required.
   * @returns A promise that resolves to the game room ID.
   */
  public async join(gameId: number, password?: string): Promise<number> {
    await this.client.call<number>('game/join', gameId, password);
    this.gameId = gameId;
    this.gamePassword = password;

    const state = await this.getState();
    this.state().setState(state);

    return this.gameId;
  }

  /**
   * Takes a specific seat in the game room.
   * @param seat - The index of the seat to take.
   */
  public async takeSeat(seat: number): Promise<void> {
    await this.client.call('game/takeSeat', this.gameId, seat);
  }

  /**
   * Leaves a specific seat in the game room.
   * @param seat - The index of the seat to leave.
   */
  public async leaveSeat(seat: number): Promise<void> {
    await this.client.call('game/leaveSeat', this.gameId, seat);
  }

  /**
   * Takes the first available seat in the game room.
   * @returns A promise that resolves to the index of the seat taken.
   */
  public async takeAvailableSeat(): Promise<number> {
    return await this.client.call<number>('game/takeAvailableSeat', this.gameId);
  }

  /**
   * Closes the current game room.
   */
  public async close(): Promise<void> {
    await this.client.call('game/close', this.gameId);
  }

  /**
   * Retrieves the current state of the game room from server.
   * @returns A promise that resolves to the game room state data.
   */
  public async getState(): Promise<GameRoomData> {
    return await this.client.call<GameRoomData>('game/getSeatsState', this.gameId);
  }

  /**
   * Retrieves the current state from the store.
   * @returns The current state of the game room.
   * @private
   */
  private state() {
    return this.store.getState();
  }
}
