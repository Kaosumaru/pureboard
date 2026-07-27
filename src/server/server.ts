import { RPCServer } from 'yawr';
import { registerRooms } from './rooms';
import { registerChat } from './components/chat';
import { registerTimer } from './components/timer';

export function createServer(port?: number): RPCServer {
  const server = new RPCServer(port);
  registerRooms(server);
  registerChat(server);
  registerTimer(server);
  return server;
}
