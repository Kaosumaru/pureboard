import { SignalConnection } from 'typed-signals';
import { RPCClient } from 'yawr';

export class BaseClient {
  protected client: RPCClient;

  constructor(client: RPCClient) {
    this.client = client;
  }

  protected onEvent(name: string, method: (...args: any[]) => void): void {
    const connection = this.client.on(name, method);
    this.addConnection(connection);
  }

  public onDisconnected(method: () => void): SignalConnection {
    return this.addConnection(this.client.onDisconnected.connect(method));
  }

  public onAuthorized(method: () => void): SignalConnection {
    return this.addConnection(this.client.onAuthorized.connect(method));
  }

  protected addConnection(connection: SignalConnection): SignalConnection {
    this.signalConnections.push(connection);
    return connection;
  }

  protected disconnectAllSignals(): void {
    for (const connection of this.signalConnections) connection.disconnect();
    this.signalConnections = [];
  }

  signalConnections: SignalConnection[] = [];
}
