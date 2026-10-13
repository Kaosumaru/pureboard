import { OfflineGameRoomClient } from '../src/client/offlineGameRoomClient';
import { createComponentStore } from '../src/shared/store';
import { StoreContainer } from '../src/shared/interface';

interface StoreData {
  players: number;
  rolls: number[];
}

type Action = { type: 'setup'; players: number } | { type: 'roll' };

function createStore(): StoreContainer<StoreData, Action> {
  return createComponentStore<StoreData, Action>({ players: 0, rolls: [] }, (ctx, state, action) => {
    switch (action.type) {
      case 'setup':
        return { players: action.players, rolls: [ctx.random.int(1000)] };
      case 'roll':
        return { rolls: [...state.rolls, ctx.random.int(1000)] };
    }
  });
}

function playGame(seed?: number): number[] {
  const client = new OfflineGameRoomClient<StoreData, Action>({
    players: 2,
    seed,
    container: createStore(),
    initialAction: options => ({ type: 'setup', players: options.players }),
  });
  for (let i = 0; i < 5; i++) client.applyAction({ type: 'roll' });
  return client.container?.store.getState().rolls ?? [];
}

describe('offline game room client', () => {
  it('produces the same game for the same seed', () => {
    const rolls = playGame(7);
    expect(rolls).toHaveLength(6);
    expect(new Set(rolls).size).toBeGreaterThan(1);
    expect(playGame(7)).toEqual(rolls);
    expect(playGame(0)).toEqual(playGame(0));
    expect(playGame(8)).not.toEqual(rolls);
  });

  it('creates the room synchronously and can be played before rendering', () => {
    const container = createStore();
    const client = new OfflineGameRoomClient<StoreData, Action>({
      players: 3,
      container,
      initialAction: options => ({ type: 'setup', players: options.players }),
    });

    expect(client.gameId).toBeDefined();
    expect(client.store.getState().seats).toEqual([null, null, null]);
    expect(container.store.getState().players).toBe(3);

    client.applyAction({ type: 'roll' });
    expect(container.store.getState().rolls).toHaveLength(2);

    // setting the same store again (as the offline provider does) keeps the game
    client.setContainer(container);
    expect(container.store.getState().rolls).toHaveLength(2);
  });

  it('applies the initial action once, whichever of the room and the store comes first', async () => {
    const container = createStore();
    const client = new OfflineGameRoomClient<StoreData, Action>({ container, initialAction: options => ({ type: 'setup', players: options.players }) });
    expect(container.store.getState().rolls).toHaveLength(0);

    await client.createRoom({ players: 2 });
    expect(container.store.getState()).toMatchObject({ players: 2 });
    expect(container.store.getState().rolls).toHaveLength(1);

    const later = new OfflineGameRoomClient<StoreData, Action>({ players: 4, initialAction: options => ({ type: 'setup', players: options.players }) });
    const laterContainer = createStore();
    later.setContainer(laterContainer);
    expect(laterContainer.store.getState().players).toBe(4);
  });

  it('seats other users', async () => {
    const rival = { id: 'rival', name: 'Rival' };
    const client = new OfflineGameRoomClient({ seats: [null, rival, null] });

    expect(client.store.getState().seats).toEqual([null, rival, null]);
    expect(client.haveSeat(1)).toBe(false);
    await expect(client.takeSeat(1)).rejects.toThrow('Seat is taken');
    expect(await client.takeAvailableSeat()).toBe(0);
    expect(client.seatOf()).toBe(0);
  });

  it('does not allow creating a room twice', async () => {
    const client = new OfflineGameRoomClient({ players: 2 });
    await expect(client.createRoom({ players: 2 })).rejects.toThrow('Already in a game room');
  });
});
