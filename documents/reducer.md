# Reducer

## Common patterns

### Send player id in actions related to player, and validate it

Since one user can take one or more seats, actions should specify which player is doing it.
Then, you should include something like this in your reducer:

```ts
if (!playerValidation.canMoveAsPlayer(action.player)) throw new Error('Not your turn');
```

### Validate Actions

Check for invalid input or moves in reducer

```ts
if (victoriousPlayer !== -1) throw new Error('Game is already over');
if (column < 0 || column >= board[0].length) throw new Error('Invalid column');
```

### Random values

Reducer can use provided `RandomGenerator` to generate random numbers.
You CANNOT use Math.random, as then reducer wouldn't be pure, and every client would generate a different random number, leading to a desync.

```ts
if (action.type === "newGame") {
    return {
        currentPlayer: random.int(2),
        ...
    }
}
```

### Hidden state

You can use `IHiddenObjects<Type>` to keep a store of hidden objects, which can be made visible to some players.

For example, you can create a hand of cards:

```ts
for (const card of hand) {
  objects.addObject(card.id, card.id % 4 === 0 ? 'skull' : 'flower');
}
```

To create a hidden store with ids that correspond to a string.

> [!WARNING]  
> Remember that if a client saw value of given object, or if you are creating objects in predictable way
> (like in this sample, card.id = 0 will be always a skull)
>
> You should make sure that ids are randomized so client can't infer what value is under given id - you can use shuffleAndHide method

This will will shuffle internal values of given array of ids

```ts
objects.shuffleAndHide(
  player.hand.map(card => card.id),
  visibleForPlayerId
);
```

So if you start with:

> 0 -> skull
> 1 -> flower
> 2 -> flower
> 3 -> flower

Calling `objects.shuffleAndHide([0,1,2,3], 0);`

will hide these objects for all player except player 0, and will cause values of these objects to shuffle, so you can end with:

> 0 -> flower
> 1 -> flower
> 2 -> skull
> 3 -> flower

(or any other combination)

Clients will only get values of objects that are marked as visible for them, server keeps all these objects. If an action will cause an object to become visible for given client, data about it will be sent to that client together with that action.

Client can get info about value visible to him using `hiddenObjectsStore`

```ts
const object = props.client.hiddenObjectsStore(state => state.objects[props.id]);
```
