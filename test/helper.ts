import { Context, GroupEmitter, UserInfo } from 'yawr';
import { IServer } from '../src/server/interface';
import { IClient } from '../src/client/interface';
import { SignalConnection, Signal } from 'typed-signals';

export class TestServer implements IServer, GroupEmitter {
  private groups: Map<string, TestClient[]> = new Map();
  private functions: Map<string, (context: Context, ...args: any[]) => any> = new Map();

  public createClient(info: UserInfo = { id: '0', name: 'default' }): IClient {
    const client = new TestClient(this, info);
    client.context = this.createContext(client);
    return client;
  }

  public RegisterFunction(name: string, method: (context: Context, ...args: any[]) => any): void {
    this.functions.set(name, method);
  }

  public onGroupRemoved(_group: string, _method: (() => void) | undefined): void {
    throw new Error('Method not implemented.');
  }

  public groupMemberCount(group: string): number {
    return this.groups.get(group)?.length ?? 0;
  }

  public clientCall<T>(ctx: Context, method: string, ...params: unknown[]): Promise<T> {
    return new Promise((resolve, reject) => {
      const fn = this.functions.get(method);
      if (!fn) {
        reject(new Error(`Method ${method} not found`));
        return;
      }
      try {
        const result = fn(ctx, ...params);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public emitToGroup(group: string, method: string, ...params: any): void {
    const clients = this.groups.get(group);
    if (!clients) return;

    for (const client of clients) {
      client.serverEvent(method, ...params);
    }
  }

  public iterateGroup(group: string, cb: (context: Context) => void): void {
    const clients = this.groups.get(group);
    if (!clients) return;

    for (const client of clients) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      cb(client.context!);
    }
  }

  protected addToGroup(client: TestClient, group: string): void {
    let clients = this.groups.get(group);
    if (!clients) {
      clients = [];
      this.groups.set(group, clients);
    }
    clients.push(client);
  }

  protected removeFromGroup(client: TestClient, group: string): void {
    const clients = this.groups.get(group);
    if (!clients) return;

    const index = clients.indexOf(client);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  }

  protected createContext(client: TestClient): Context {
    return {
      userId: client.userInfo.id,
      userName: client.userInfo.name,
      isAdmin: client.userInfo.isAdmin,

      addToGroup: (group: string): void => {
        this.addToGroup(client, group);
      },
      removeFromGroup: (group: string): void => {
        this.removeFromGroup(client, group);
      },
      emit: (method: string, ...params: any): void => {
        client.serverEvent(method, ...params);
      },
      emitToGroup: (group: string, method: string, ...params: any): void => {
        return this.emitToGroup(group, method, ...params);
      },
      iterateGroup: (group: string, cb: (context: Context) => void): void => {
        return this.iterateGroup(group, cb);
      },
    };
  }
}

export class TestClient implements IClient {
  private server: TestServer;
  public userInfo: UserInfo;
  public context: Context | undefined;
  protected events: Map<string, Signal<(...args: any[]) => void>> = new Map();

  constructor(server: TestServer, info: UserInfo) {
    this.server = server;
    this.userInfo = info;
  }

  getUserInfo(): UserInfo {
    return this.userInfo;
  }

  authorize(_token: string): Promise<UserInfo | undefined> {
    return new Promise(resolve => {
      resolve(this.userInfo);
    });
  }

  connect(): Promise<void> {
    return new Promise(resolve => {
      resolve();
    });
  }
  reconnect(): Promise<void> {
    return new Promise(resolve => {
      resolve();
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect(): void {}

  call<T>(method: string, ...params: unknown[]): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.server.clientCall<T>(this.context!, method, ...params);
  }

  on(name: string, method: (...args: any[]) => void): SignalConnection {
    let signal = this.events.get(name);
    if (!signal) {
      signal = new Signal();
      this.events.set(name, signal);
    }
    return signal.connect(method);
  }

  serverEvent(method: string, ...params: unknown[]): void {
    const signal = this.events.get(method);
    if (!signal) {
      return;
    }
    signal.emit(...params);
  }

  onDisconnected = new Signal<(error: any) => void>();
  onAuthorized = new Signal<(error: any) => void>();
}
