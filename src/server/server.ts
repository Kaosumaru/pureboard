import { RPCServer } from 'yawr';
import { IServer } from './interface';

export function createServer(port?: number): IServer {
  return new RPCServer(port);
}
