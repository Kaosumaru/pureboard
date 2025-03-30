import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension'; // required for devtools typing
import { CurrentPlayerValidation, RandomGenerator, StandardGameAction, StoreContainer } from '../interface';

export interface SetActivePlayerAction {
  type: 'setActivePlayer';
  player: number | undefined;
}

export interface RestartAction {
  type: 'restart';
}

export type Action = SetActivePlayerAction | RestartAction;

export interface PlayerTime {
  elapsedTime: number;
  activations: number;
  lastActivationTimestamp: number | undefined;
}

export interface StoreData {
  activePlayer: number | undefined;
  maxTime: number;
  perActivationTimeIncrement: number;
  players: PlayerTime[];
}

function createPlayers(players: number): PlayerTime[] {
  const playerTimes: PlayerTime[] = [];
  for (let i = 0; i < players; i++) {
    playerTimes.push({
      elapsedTime: 0,
      activations: 0,
      lastActivationTimestamp: undefined,
    });
  }
  return playerTimes;
}

export function timeLeftForPlayer(data: StoreData, player: number): number {
  const now = Date.now();
  const state = data.players[player];
  const elapsed = state.elapsedTime + (state.lastActivationTimestamp ? now - state.lastActivationTimestamp : 0);

  const increment = (state.activations > 0 ? state.activations - 1 : 0) * data.perActivationTimeIncrement;
  const timeLeft = data.maxTime + increment - elapsed;

  return timeLeft > 0 ? timeLeft : 0;
}

export function createGameStateStore(maxTimeInSeconds: number, players: number, perActivationTimeIncrement = 0): StoreContainer<StoreData, Action> {
  const store = create<StoreData>()(
    devtools(
      (): StoreData => ({
        activePlayer: undefined,
        maxTime: maxTimeInSeconds * 1000,
        perActivationTimeIncrement,
        players: createPlayers(players),
      })
    )
  );
  return {
    store,
    action: (playerValidation: CurrentPlayerValidation, action: Action | StandardGameAction, _: RandomGenerator) => store.setState(store => makeAction(playerValidation, store, action)),
  };
}

function setActivePlayer(playerValidation: CurrentPlayerValidation, data: StoreData, player: number | undefined): StoreData {
  if (!playerValidation.isServerOriginating()) throw new Error('Not server originating');

  const { players } = data;

  const newPlayers = [...players];
  const now = Date.now();
  if (data.activePlayer !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    newPlayers[data.activePlayer].elapsedTime += now - newPlayers[data.activePlayer].lastActivationTimestamp!;
    newPlayers[data.activePlayer].lastActivationTimestamp = undefined;
  }

  if (player !== undefined) {
    newPlayers[player].activations++;
    newPlayers[player].lastActivationTimestamp = now;
  }

  return {
    ...data,
    activePlayer: player,
    players: newPlayers,
  };
}

function makeAction(playerValidation: CurrentPlayerValidation, store: StoreData, action: Action | StandardGameAction): StoreData | Partial<StoreData> {
  switch (action.type) {
    case 'setActivePlayer':
      return setActivePlayer(playerValidation, store, action.player);
    case 'restart':
      return { ...store, activePlayer: undefined, players: createPlayers(store.players.length) };
    case 'newGame':
      return { ...store };
  }
}
