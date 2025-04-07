import { Signal, SignalConnection } from 'typed-signals';
import { UserInfo } from 'yawr';

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
