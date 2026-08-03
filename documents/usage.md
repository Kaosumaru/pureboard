# Usage

This page follows the Connect4 example in `example/src` and reflects the current API names.

## 1) Create a game store

Define your `Action` union, `StoreData`, and reducer. Then expose a `createGameStateStore` function that returns `StoreContainer`.

```ts
import { Context, StoreContainer, UserPermissions } from 'pureboard/shared/interface';
import { createComponentStore } from 'pureboard/shared/store';

export interface NewGameAction {
  type: 'newGame';
}

export interface MoveAction {
  type: 'move';
  column: number;
}

export interface SurrenderAction {
  type: 'surrender';
  player: number;
}

export type Action = MoveAction | SurrenderAction | NewGameAction;

export interface StoreData {
  currentPlayer: number;
  victoriousPlayer: number;
  board: FieldType[][];
  lastMoveRow: number;
  lastMoveColumn: number;
}


function makeAction(ctx: Context, store: StoreData, action: Action): StoreData | Partial<StoreData> {
  switch (action.type) {
    case 'surrender':
      if (!ctx.playerValidation.canMoveAsPlayer(action.player)) throw new Error('Not your player');
      return { ...store, victoriousPlayer: 1 - action.player };
    case 'newGame':
      return {
        ...store,
        board: [],
        currentPlayer: ctx.random.int(2),
        victoriousPlayer: -1,
        lastMoveRow: -1,
        lastMoveColumn: -1,
      };
    case 'move':
      // implement move action here
  }
}

export function createGameStateStore(): StoreContainer<StoreData, Action> {
  return createComponentStore(
    {
      board: [],
      currentPlayer: 0,
      lastMoveRow: -1,
      lastMoveColumn: -1,
      victoriousPlayer: -1,
    },
    makeAction
  );
}
```

## 2) Register the game on server

Create a websocket server with `createServer`, then call `registerGame`.

```ts
import express from 'express';
import ViteExpress from 'vite-express';
import { createServer } from 'pureboard/server/server';
import { createChat } from 'pureboard/server/components/chat';
import { registerGame } from 'pureboard/server/components';
import { createGameStateStore } from '@shared/stores/connectFourStore';

const app = express();
const server = ViteExpress.listen(app, 3000);
const gameWebsocketServer = createServer();

// register a game type with an id
registerGame(gameWebsocketServer, 'connect4', createGameStateStore, {
  // attach optional components
  components: [createChat()],
  // provide initial action if needed
  initialAction: () => ({ type: 'newGame' as const }),
});

// implement real authentication here
gameWebsocketServer.registerJWTAuth(async token => ({
  id: token,
  name: token,
  isAdmin: false,
}));

server.on('upgrade', (request, socket, head) => {
  if (request.url === '/ws') {
    gameWebsocketServer.handleUpgrade(request, socket, head);
  }
});
```

## 3) Connect room client (create/join room)

`GameRoomClient` manages room lifecycle and auth.

```ts
import { GameRoomClient } from 'pureboard/client/gameRoomClient';

const roomClient = new GameRoomClient();
const ok = await roomClient.start(userToken);
if (!ok) throw new Error('Authorization failed');

const [gameId, password] = await roomClient.createRoom('connect4', { players: 2 });
await roomClient.takeAvailableSeat();

// or join existing room:
// await roomClient.join(gameId, password);
```

## 4) Create game client

Extend `BaseGameClient` and wrap common actions.

```ts
import { BaseGameClient } from 'pureboard/client/baseGameClient';
import { GameRoomClient } from 'pureboard/client/gameRoomClient';
import { Action, StoreData, createGameStateStore } from '@shared/stores/connectFourStore';

export class ConnectFourClient extends BaseGameClient<StoreData, Action> {
  constructor(gameRoomClient: GameRoomClient) {
    super(createGameStateStore(), 'connect4', gameRoomClient);
  }

  public async makeMove(column: number) {
    await this.sendAction({ type: 'move', column });
  }

  public async surrender(player: number) {
    await this.sendAction({ type: 'surrender', player });
  }

  public async newGame() {
    await this.sendAction({ type: 'newGame' });
  }
}
```

## 5) Use in React

Use `useClient` to create and initialize game/component clients.

```tsx
import { useClient } from 'pureboard/client/react';
import { ChatClient } from 'pureboard/client/clients/chatClient';
import { GameRoomClient } from 'pureboard/client/gameRoomClient';
import { ConnectFourClient } from './ConnectFourClient';

export interface GameProps {
  gameRoomClient: GameRoomClient;
}

export default function ConnectFour(props: GameProps) {
  const client = useClient(ConnectFourClient, props.gameRoomClient);
  const chatClient = useClient(ChatClient, props.gameRoomClient);

  const board = client.store(state => state.board);
  const currentPlayer = client.store(state => state.currentPlayer);
  const messages = chatClient.store(state => state.messages);

  return (
    <div>
      <div>Current player: {currentPlayer}</div>
      <div>Messages: {messages.length}</div>
      <button onClick={() => void client.makeMove(0)}>Play column 0</button>
      <pre>{JSON.stringify(board)}</pre>
    </div>
  );
}
```

