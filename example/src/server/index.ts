import express from 'express';
import ViteExpress from 'vite-express';
import { createServer } from 'pureboard/server/server';
import { registerConnect4 } from './games/connect4';
import { UserInfo } from 'pureboard/shared/gameRoomStore';

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

const server = ViteExpress.listen(app, +PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

try {
  const websocketServer = createServer();

  websocketServer.registerJWTAuth((token: string): Promise<UserInfo | undefined> => {
    return Promise.resolve({
      id: token,
      name: token,
      isAdmin: false,
    });
  });

  registerConnect4(websocketServer);

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
