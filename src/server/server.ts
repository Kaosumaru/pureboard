import { RPCServer } from 'yawr';
import { registerGames } from './games';
import { registerChat } from './components/chat';
import { registerTimer } from './components/timer';

export function createServer(port?: number): RPCServer {
  const server = new RPCServer(port);
  registerGames(server);
  registerChat(server);
  registerTimer(server);
  return server;
}
