# Room

## Overview

Server can hosts multiple 'rooms' with different types of games.
These rooms can optionally have shared functionality (related or not to the actual game mechanics).

Room usually has:
- room id and password
- information about game seats and players assigned to state
- components:
    - main game component which holds state of the game
    - additional components (chat, timer, replay recorder, etc)

## Components

Examples are:
- ingame chat
- chess-like timer that causes player to lose if he doesn't have enough time

These components work exactly like game state - players can send actions that can modify current state of a component.
(In fact, game state is also kept in a game component)

### Chat

Chat is the simplest type of an additional component - it's not related to game mechanics, just a store of messages, 
and players can append a new message by sending MessageAction.

Note that when sending message action, you are also storing in the message your user name, and server is verifying that.
This is needed, cause by architecture of `pureboard`, server is not modyfing client actions - only veryfies them.

Since you need information of "who is sending the message" to display it, client must implicitly include it in the action
- and server is veryfing that it the message is corrent (server validates if username in the action matches sender)

### Timer

Timer is a component that you can use if you want to add a chess-like timer to the game - if a player will go over time limit, he will lose the game. Timer logic is separate from the actual game logic - after active player changes, you need to apply `setActivePlayer` action on the timer so it's start to count time for that player.

Current server implementation is server based - after server applies action to the game state, due to the hook it will apply action on the timer store.

To achieve that, `afterAction` hook is used:
```ts

const players = 2;
const time = 10 * 60;
const increment = 5;

gameContainer.registerServerWithCreation(server, createGameStateStore, {
    afterAction,
    components: [
        createChat(),
        createTimer(
        // this callback will be called when a player's time limit is up
        (id, player) => { 
            gameContainer.sendServerAction(server, id, {
                type: 'surrender',
                player,
            });
        },
        time,
        players,
        increment,
        ),
    ],
});


function afterAction(
  store: Store<StoreData>,
  id: number,
  ctx: GroupEmitter,
  action: Action | StandardGameAction,
): void {
  switch (action.type) {
    case 'move': {
      const player = store.getState().currentPlayer;
      // this informs the timer that it should gauge time for the other player
      applyActionOnTimer(ctx, id, { type: 'setActivePlayer', player, currentTimestamp: Date.now() });
      break;
    }
    case 'newGame':
      // this restarts the timer after newGame action is called on the game store
      applyActionOnTimer(ctx, id, { type: 'restart' });
      break;
    default:
  }
}
```