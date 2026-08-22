import { Signal, SignalConnection } from 'typed-signals';
import { UserInfo } from 'yawr';
import { GameOptions, GameRoomState, Store } from '../shared';

export interface IClient {
  authorize(token: string): Promise<UserInfo | undefined>;
  connect(): Promise<void>;
  reconnect(): Promise<void>;
  disconnect(): void;
  getUserInfo(): UserInfo | undefined;

  call<T>(method: string, ...params: unknown[]): Promise<T>;
  on(name: string, method: (...args: any[]) => void): SignalConnection;
  onDisconnected: Signal<(error: any) => void>;
  onAuthorized: Signal<(error: any) => void>;
}

export interface IGameRoomClient {
  client: IClient;
  gameId?: number;
}

export interface IDisposableClient {
  initialize(): Promise<void>;
  deinitialize(): void;
}

export interface IBaseComponentClient {
  type: string;
}

export interface SeatInterface {
  /**
   * The Redux-like store that manages the state of the game room.
   */
  store: Store<GameRoomState>;

  /**
   * Gets the seat index of the current user.
   * @returns The seat index of the user.
   */
  seatOf(): number;

  /**
   * Checks if the current user currecntly occupies a specific seat.
   * @param index - The index of the seat to check.
   * @returns `true` if the user can occupy the seat, otherwise `false`.
   */
  haveSeat(index: number): boolean;

  /**
   * Checks if a specific seat is empty.
   * @param index - The index of the seat to check.
   * @returns `true` if the seat is empty, otherwise `false`.
   */
  isSeatEmpty(index: number): boolean;

  /**
   * Takes a specific seat in the game room.
   * @param seat - The index of the seat to take.
   */
  takeSeat(seat: number): Promise<void>;

  /**
   * Leaves a specific seat in the game room.
   * @param seat - The index of the seat to leave.
   */
  leaveSeat(seat: number): Promise<void>;

  /**
   * Takes the first available seat in the game room.
   * @returns A promise that resolves to the index of the seat taken.
   */
  takeAvailableSeat(): Promise<number>;
}

export interface ConnectionInterface {
  /**
   * Information about the current user.
   */
  userInfo: UserInfo | undefined;

  /**
   * Starts the client by connecting to the server and authorizing the user.
   * @param token - The authorization token for the user.
   * @returns A promise that resolves to `true` if the client started successfully, otherwise `false`.
   */
  start(token: string | undefined): Promise<boolean>;

  /**
   * Disconnects the client from the server.
   */
  disconnect(): void;

  /**
   * Reconnects the client to the server and reinitializes the game room state.
   * @param token - The authorization token for the user.
   */
  reconnect(token: string | undefined): Promise<void>;
}

export interface RoomInterface {
  /**
   * The ID of the current game room.
   */
  gameId: number | undefined;

  /**
   * The password for the current game room, if applicable.
   */
  gamePassword: string | undefined;

  /**
   * Creates a new game room.
   * @param game - The id of the game.
   * @param options - The options for the game room.
   * @returns A promise that resolves to a tuple containing the game room ID and password.
   */
  createRoom(game: string, options: GameOptions): Promise<[number, string | undefined]>;

  /**
   * Joins an existing game room.
   * @param gameId - The ID of the game room to join.
   * @param password - The password for the game room, if required.
   * @returns A promise that resolves to the game room ID.
   */
  join(gameId: number, password?: string): Promise<number>;

  /**
   * Closes the current game room.
   */
  closeRoom(): Promise<void>;
}
