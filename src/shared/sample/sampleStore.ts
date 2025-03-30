import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension'; // required for devtools typing
import { CurrentPlayerValidation, Store } from '../interface';

export interface CastVoteAction {
  type: 'castVote';
  votes: number;
}

export type Action = CastVoteAction;

export interface StoreData {
  votesCast: number;
  maxVotes: number;
}

export interface StoreState extends StoreData {
  action: (playerValidation: CurrentPlayerValidation, action: Action) => void;
}

function castVotes(playerValidation: CurrentPlayerValidation, data: StoreData, votes: number): StoreData {
  return {
    votesCast: votes,
    maxVotes: data.maxVotes,
  };
}

export function createGameStateStore(maxVotes: number): Store<StoreState> {
  const useGameStateStore = create<StoreState>()(
    devtools(set => ({
      votesCast: 0,
      maxVotes: maxVotes,
      action: (playerValidation: CurrentPlayerValidation, action: Action) => set(store => makeAction(playerValidation, store, action)),
    }))
  );
  return useGameStateStore;
}

function makeAction(playerValidation: CurrentPlayerValidation, store: StoreData, action: Action): StoreState | Partial<StoreState> {
  switch (action.type) {
    case 'castVote':
      return castVotes(playerValidation, store, action.votes);
  }
}
