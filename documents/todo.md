# TODO

## Architecture

- rename and clarify API

## Docs

- fill examples with example of how to implement a simple game

## GameOptions & StandardGameAction

This doesn't seem well defined right now.
Currently, we are expecting that every game can respond to `newGame` action, and `GameOptions` are provided when creating room to create seats.
This creates weird dependencies:
- room needs to create seats
- technically action is sent to game component and an cause a mismatch with seats between game and room
- this introduces a weird requirement for all components to handle "newGame" action

## Other

- add a way to add a bot player (maybe a bot component would be a good pick? Then we could save type of bot assigned to each seat)
- add easy way for an generic "undo" (save a patch between old state and new state?)
- add info, client code, and example of 'effect-based' game

