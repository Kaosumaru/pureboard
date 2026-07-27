# Top down server architecture

## Components

Game room instance can have components attached. These components are separate stores, that can be mutated using `Actions`.
Clients send `Action`, server validates them, applies to state, and sends to other clients connected to this room.

## Game room instances

`games.ts` is holding instances of game rooms with components.
Room instances have a timeout and are automatically deleted after no player is connected.

## RPC calls

`registerGames` registers API for joining instance of game rooms and taking a seat in the game.
Game instance is keeping array of seats and array of components (game is on of the components).

`registerGame` in `ComponentContainer.ts` is registering RPC calls to create a game room for a specific game, get actual game state and apply actions.
If a user joins a room, he is assigned to that room "group" and will get notifications.



