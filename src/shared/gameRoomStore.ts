import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension'; // required for devtools typing
import { Store } from './interface';

export interface UserInfo {
  id: string;
  name: string;
  isAdmin?: boolean;
}

export interface Message {
  user: UserInfo;
  message: string;
}

export interface GameRoomData {
  id: number;
  seats: (UserInfo | null)[];
  type: string;
  timeoutToClose?: number;
  closed: boolean;
  password?: string;
}

export interface GameRoomState extends GameRoomData {
  setState: (data: GameRoomData) => void;
  tookSeat: (userInfo: UserInfo, seat: number) => void;
  leftSeat: (seat: number) => void;
  close: () => void;
}

function replaceItemAtIndex<T>(arr: T[], index: number, newValue: T) {
  return [...arr.slice(0, index), newValue, ...arr.slice(index + 1)];
}

export function canUserMoveAsPlayer(userId: string, game: GameRoomData, player: number): boolean {
  if (player < 0 || player >= game.seats.length) return false;
  return game.seats[player]?.id === userId;
}

export function seatOf(userId: string, game: GameRoomData): number {
  return game.seats.findIndex(info => info?.id === userId);
}

export function createGameRoomStore(): Store<GameRoomState> {
  const useGameRoomStore = create<GameRoomState>()(
    devtools(set => ({
      id: -1,
      seats: [],
      type: '',
      timeoutToClose: 1000 * 60 * 5,
      closed: false,
      setState: (data: GameRoomData) => set(_ => data),
      tookSeat: (userInfo: UserInfo, seat: number) => set(store => ({ ...store, seats: replaceItemAtIndex(store.seats, seat, userInfo) })),
      leftSeat: (seat: number) => set(store => ({ ...store, seats: replaceItemAtIndex(store.seats, seat, null) })),
      close: () => set(store => ({ ...store, closed: true })),
    }))
  );
  return useGameRoomStore;
}
