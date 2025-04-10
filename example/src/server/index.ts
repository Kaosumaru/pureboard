import express from 'express';
import ViteExpress from 'vite-express';
import { createServer } from 'pureboard/server/server';
import { UserInfo } from 'pureboard/shared/gameRoomStore';
import { createGameStateStore } from '@shared/stores/connectFourStore';
import { createChat } from 'pureboard/server/components/chat';
import { registerGame } from 'pureboard/server/componentContainer';

try {
  // create express server
  const PORT = process.env.PORT || 3000;
  const app = express();
  app.use(express.json());

  // use ViteExpress to server static files and handle API requests
  const server = ViteExpress.listen(app, +PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });

  //create websocket server
  const gameWebsocketServer = createServer();

  // register game type with chat component
  registerGame(gameWebsocketServer, 'connect4', createGameStateStore, {
    components: [createChat()],
  });

  // register dummy authorization method
  gameWebsocketServer.registerJWTAuth((token: string): Promise<UserInfo | undefined> => {
    return Promise.resolve({
      id: token,
      name: token,
      isAdmin: false,
    });
  });

  // upgrade all /ws requests to websocket connections to gameWebsocketServer
  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      gameWebsocketServer.handleUpgrade(request, socket, head);
    }
  });
} catch (error) {
  console.log(`Error creating websocket server: ${String(error)}`);
}
