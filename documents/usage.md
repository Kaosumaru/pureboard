# Usage

This page follows the Connect4 example in `example/src`, building a working simple multiplayer Connect4 game.

## 1) Create a game store

Define your `Action` union, `StoreData`, and reducer. Then expose a `createGameStateStore` function that returns `StoreContainer`.

```ts
import { Context, StoreContainer, UserPermissions, createComponentStore } from 'pureboard/shared';

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
import { createServer, createChat, registerGame } from 'pureboard/server';
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

Component `CreateGameRoomClient` creates a new game room

```tsx
function CreateGamePage(): JSX.Element {


  return (
    <CreateGameRoomClient
      token={/*player session token*/}
      gameId="connect4"
      options={{ players: 2 }}
      onCreated={(id, password) => {
        // replace current url, so refreshing the page will rejoin the game,
        // not create new one
        const url = password ? `/joinGame/${id}/${password}` : `/game/${id}`;
        window.history.replaceState(null, 'Game', url);
        return Promise.resolve();
      }}
      onFailed={err => {
        // logout or show error to player
      }}
    >
      <GameRoom.Connected>
        <ConnectFour />
      </GameRoom.Connected>
    </CreateGameRoomClient>
  );
}
```

Component `CreateGameRoomClient` joins a game room

```tsx
    <JoinGameRoomClient
      token={context.userId}
      roomId={roomId}
      password={params.password}
      onFailed={err => {
        // show error to player
      }}
    >
      <GameRoom.Connected>
        <ConnectFour />
      </GameRoom.Connected>
    </JoinGameRoomClient>
  );
```

## 4) Declare game context

Get context provider and hook

```ts
export const [ConnectFourProvider, useConnect4] = CreateComponentContext<'connect4', StoreData, Action>(
  'connect4',
  () => createGameStateStore()
);
```

## 5) Use in React

Use `useClient` to create and initialize game/component clients.

```tsx
import { useClient, GameRoomClient } from 'pureboard/client';
import { ConnectFourClient } from './ConnectFourClient';
import { ConnectFourProvider, useConnect4 } from './ConnectFourContext';

export default function ConnectFour() {
  // wrap game rendering logic in ConnectFourProvider - this will allow you to use useConnect4 inside
  return (
    <ConnectFourProvider>
      <ConnectFourGame />
    </ConnectFourProvider>
  );
}

export default function ConnectFour() {
  const { store, action } = useConnect4();

  const board = store(state => state.board);
  const currentPlayer = store(state => state.currentPlayer);
  const messages = store(state => state.messages);

  return (
    <div>
      <div>Current player: {currentPlayer}</div>
      <div>Messages: {messages.length}</div>
      <button onClick={() => void action({ type: 'move', column: 0 })}>
        Play on column 0
      </button>
      <pre>{JSON.stringify(board)}</pre>
    </div>
  );
}
```

