import { Signal, SignalConnection } from 'typed-signals';
import { UserInfo } from 'yawr';
import { GameOptions } from '../shared/standardActions';

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
  restartGame(options: GameOptions): Promise<void>;
}
