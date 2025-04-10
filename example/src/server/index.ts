import express from 'express';
import ViteExpress from 'vite-express';
import { createServer } from 'pureboard/server/server';
import { UserInfo } from 'pureboard/shared/gameRoomStore';
import { createGameStateStore } from '@shared/stores/connectFourStore';
import { createChat } from 'pureboard/server/components/chat';
import { registerGame } from 'pureboard/server/componentContainer';

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

const server = ViteExpress.listen(app, +PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

try {
  const websocketServer = createServer();
  registerGame(websocketServer, 'connect4', createGameStateStore, {
    components: [createChat()],
  });

  websocketServer.registerJWTAuth((token: string): Promise<UserInfo | undefined> => {
    return Promise.resolve({
      id: token,
      name: token,
      isAdmin: false,
    });
  });

  server.on('upgrade', (request, socket, head) => {
    if (!request.url) return;
    const url = request.url;
    if (url === '/ws') {
      websocketServer.handleUpgrade(request, socket, head);
    }
  });
} catch (error) {
  console.log(`Error creating websocket server: ${String(error)}`);
}
