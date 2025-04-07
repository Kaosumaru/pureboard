import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { Context, GroupEmitter as YawrGroupEmitter } from 'yawr';

export type GroupEmitter = YawrGroupEmitter;

export interface IServer extends GroupEmitter {
  RegisterFunction(name: string, method: (context: Context, ...args: any[]) => any): void;
  onGroupRemoved(group: string, method: (() => void) | undefined): void;
  groupMemberCount(group: string): number;
  handleUpgrade(request: IncomingMessage, socket: Duplex, upgradeHead: Buffer, callback: (client: WebSocket, request: IncomingMessage) => void): void;
}
