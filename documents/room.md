# Room

## Overview

Server can host multiple rooms with different game types.
These rooms can optionally have shared functionality (related or not to the actual game mechanics).

Room usually has:
- room id and password
- information about seats and assigned players
- components:
    - main game component which holds state of the game
    - additional components (chat, timer, replay recorder, etc)

## Components

Common built-in components:
- ingame chat
- chess-like timer that causes player to lose if he doesn't have enough time

These components work exactly like game state: players can send actions that modify component state.
(In fact, game state is also kept in a game component)

### Chat

Chat is the simplest additional component. It is not related to game mechanics, just a store of messages,
and players append new messages by sending `message` action.

When sending message action, sender information is included in the payload and validated by server.
This is needed because server does not modify client actions, it validates and applies them.

Since clients need "who sent the message", action includes user info,
and server verifies that username/id in action matches authenticated sender.

### Timer

Timer is a component for chess-like clocks. If a player exceeds time limit, game can force a loss.
Timer logic is separate from game reducer. After active player changes, apply `setActivePlayer` on timer.

Current implementation is server-based: after game action is applied, hook applies timer action.

To achieve that, `afterAction` hook is used:
```ts
import { registerGame } from 'pureboard/server/components';
import { createChat } from 'pureboard/server/components/chat';
import { createTimer, applyActionOnTimer } from 'pureboard/server/components/timer';

const players = 2;
const timeInSeconds = 10 * 60;
const incrementInSeconds = 5;

registerGame(server, 'connect4', createGameStateStore, {
  afterAction,
  components: [
    createChat(),
    createTimer(
      // called when a player runs out of time
      (id, player) => {
        console.log(`Player ${player} timed out in game ${id}`);
        // Trigger your own timeout handling here (for example: close room,
        // persist match result, notify external service, etc.)
      },
      timeInSeconds,
      players,
      incrementInSeconds
    ),
  ],
});

function afterAction(store: Store<StoreData>, id: number, ctx: GroupEmitter, action: Action): void {
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
