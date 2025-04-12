# Overview

`pureboard` is a library that allows for easy implementation of multiplayer games, by replicating actions on a state.
It's designed for boardgame-like games, but can be used for other projects.
It uses `zustand` for state management, so replicated state on client can be easily used in a `React` project.

## How it works?

Clients can send `Action`s and modify server `State`, which then will be replicated to other clients.
In order for that to work, `Reducer` function needs to be pure.

1. Creation of a new game causes server to create a `State` with some `id`
2. Users can send an `Action` to the server
3. Server then tries to apply that `Action` on server's `State`
   - if it fails (cause that `Action` describes an invalid move in the game, or user doesn't have permission), applying this `Action` throws an exception that is sent back to the client, and flow stops here
4. Server then sends this `Action` to all clients, so they all will apply it, and change their `State`

## Glossary

`State` - state managed by zustand that has a reducer function which accepts

`Action` - definition of a move that player can do to change the game state

`Reducer` - function that gets a State, Action (and optionally some external data), and creates a new `State` by applying `Action` on a previous one

`User` - authenticated user that have an unique userID

`Player` - games usually have multiple `Players/Seats`, and one user can be occupy to one or more (that way you can play chess against yourself)

## Reducer

Reducer must be a pure function. This is trivial in a games with perfect information, but even in them, you usually have some random elements - like who is the starting player. Also, some games introduce hidden state, that is only visible to a given player (like his hand of cards).

Both of these things are achieved by providing an external data - namely, `RandomGenerator` and `IHiddenObjects`
