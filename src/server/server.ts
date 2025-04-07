import { RPCServer } from 'yawr';

export function createServer(port?: number): RPCServer {
  return new RPCServer(port);
}
