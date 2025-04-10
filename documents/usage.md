# Usage

## Create State

State is used in both server and client.

```ts
export interface SomeAction {
  type: 'someAction';
  ... // other properties
}

export interface SomeOtherAction {
  type: 'someOtherAction';
  ... // other properties
}

export type Action = SomeAction | SomeOtherAction;

export interface StoreData {
  yourGameProperty: string;
  ... // state interface
}


export function createGameStateStore(): StoreContainer<StoreData, Action | StandardGameAction> {
  const useGameStateStore = create<StoreData>()(
    devtools(
      (): StoreData => ({
        yourGameProperty: "",
        ... // initial state data
      })
    )
  );

  return {
    store: useGameStateStore,
    reducer: (playerValidation: CurrentPlayerValidation, action: Action | StandardGameAction, random: RandomGenerator) =>
      useGameStateStore.setState(store => reducer(playerValidation, store, action, random)),
  };
}

function reducer(
  playerValidation: CurrentPlayerValidation,
  store: StoreData,
  action: Action | StandardGameAction,
  random: RandomGenerator
): StoreData | Partial<StoreData> {
   /*
   * Return new game state after applying an action
   * Bear in mind that this function should be pure - always give same result for an Action
   * Randomness can be achieved by RandomGenerator
   */
   ...
}
```

## Create server

```ts
// import createGameStateStore from your store
const server = ...; // create express http eserver

//create websocket server
const gameWebsocketServer = createServer();

// register game type with chat component
registerGame(gameWebsocketServer, <unique-id>, createGameStateStore, {
   components: [createChat()], // add chat to this game
});

// register authorization method
gameWebsocketServer.registerJWTAuth( ... );

// upgrade all /ws requests to websocket connections to gameWebsocketServer
server.on('upgrade', (request, socket, head) => {
   if (request.url === '/ws') {
   gameWebsocketServer.handleUpgrade(request, socket, head);
   }
});
```

## Create game client

```ts
// import createGameStateStore, StoreData and Action from your store
export class GameClient extends BaseGameClient<StoreData, Action> {
    constructor(gameRoomClient: GameRoomClient) {
        super(createGameStateStore(), <unique-id>, gameRoomClient);
    }

    // optionally create wrappers for sending an action
    public async someAction(...) {
        await this.sendAction({ type: 'someAction', ... });
    }
}
```

## Use game client in react components

```ts
export interface GameProps {
  gameRoomClient: GameRoomClient;
}

export default function GameComponent(props: GameProps) {
  // forward connected GameRoomClient as a prop to this component

  // use client for your game
  const client = useClient(GameClient, props.gameRoomClient);
  // use underlying zustand store as you wish to render your game
  const yourGameProperty = client.store((state) => state.yourGameProperty);

  // and you can use clients for attached components
  const chatClient = useClient(ChatClient, props.gameRoomClient);
  const messages = chatClient.store((state) => state.messages);

  const handleClick = () => {
    // send an action to the server
    client.someAction( ... );
    client.sendAction({ type: 'someAction', ... });
  }

  return (
    <button onClick={handleClick}>
      Click me
    </button>
  );
};
}
```
