# Top down server architecture

## Components

Game room instance can have components attached. These components are separate stores, that can be mutated using `Actions`.
Clients send `Action`, server validates them, applies to state, and sends to other clients connected to this room.

## Game room instances

`rooms.ts` holds instances of game rooms with components.
Room instances have a timeout and are automatically deleted after no player is connected.

## RPC calls

`registerRooms` registers API for joining instance of game rooms and taking a seat in the game.
Game instance keeps array of seats and array of components (game itself is also a component).

`registerGame` in `server/components.ts` registers RPC calls for:

- `<gameType>/createGame`
- `<gameType>/getState`
- `<gameType>/action`

It wires your game store constructor into a `ComponentHandler`, optionally attaches additional components (`createChat`, `createTimer`, custom components), and broadcasts applied actions to room members.

If a user joins a room, he is assigned to that room "group" and will get notifications.



