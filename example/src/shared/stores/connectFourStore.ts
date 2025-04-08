import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension'; // required for devtools typing
import { CurrentPlayerValidation, RandomGenerator, StandardGameAction, StoreContainer } from 'pureboard/shared/interface';

export enum FieldType {
  Empty,
  X,
  O,
}

export interface MoveAction {
  type: 'move';
  column: number;
}

export interface SurrenderAction {
  type: 'surrender';
  player: number;
}

export type Action = MoveAction | SurrenderAction;

export interface StoreData {
  currentPlayer: number;
  victoriousPlayer: number;
  board: FieldType[][];
  lastMoveRow: number;
  lastMoveColumn: number;
}

function create2DArray<T>(rows: number, cols: number, value: T): T[][] {
  return Array.from({ length: rows }, () => Array<T>(cols).fill(value));
}

function isMoveVictorious(data: StoreData, row: number, column: number): boolean {
  const { board } = data;
  const currentField = board[row][column];
  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  for (const [dx, dy] of directions) {
    let count = 0;
    for (let i = -3; i <= 3; ++i) {
      const x = column + i * dx;
      const y = row + i * dy;
      if (x < 0 || x >= board[0].length || y < 0 || y >= board.length) continue;
      if (board[y][x] === currentField) {
        count++;
        if (count === 4) return true;
      } else {
        count = 0;
      }
    }
  }
  return false;
}

function makeMove(playerValidation: CurrentPlayerValidation, data: StoreData, column: number): StoreData {
  const { board, currentPlayer, victoriousPlayer } = data;
  if (victoriousPlayer !== -1) throw new Error('Game is already over');
  if (column < 0 || column >= board[0].length) throw new Error('Invalid column');
  if (!playerValidation.canMoveAsPlayer(currentPlayer)) throw new Error('Not your turn');

  for (let i = board.length - 1; i >= 0; --i) {
    if (board[i][column] === FieldType.Empty) {
      const tempBoard = [...board];
      tempBoard[i][column] = currentPlayer === 0 ? FieldType.X : FieldType.O;

      const newData: StoreData = {
        board: tempBoard,
        currentPlayer: currentPlayer === 0 ? 1 : 0,
        victoriousPlayer,
        lastMoveRow: i,
        lastMoveColumn: column,
      };
      if (isMoveVictorious(newData, i, column)) newData.victoriousPlayer = currentPlayer;

      return newData;
    }
  }
  throw new Error('Column is full');
}

export function createGameStateStore(): StoreContainer<StoreData, Action | StandardGameAction> {
  const useGameStateStore = create<StoreData>()(
    devtools(
      (): StoreData => ({
        board: [],
        currentPlayer: 0,
        lastMoveRow: -1,
        lastMoveColumn: -1,
        victoriousPlayer: -1,
      })
    )
  );

  return {
    store: useGameStateStore,
    action: (playerValidation: CurrentPlayerValidation, action: Action | StandardGameAction, random: RandomGenerator) =>
      useGameStateStore.setState(store => makeAction(playerValidation, store, action, random)),
  };
}

function makeAction(playerValidation: CurrentPlayerValidation, store: StoreData, action: Action | StandardGameAction, random: RandomGenerator): StoreData | Partial<StoreData> {
  switch (action.type) {
    case 'move':
      return makeMove(playerValidation, store, action.column);
    case 'surrender':
      if (!playerValidation.canMoveAsPlayer(action.player)) throw new Error('Not your player');
      return { ...store, victoriousPlayer: 1 - action.player };
    case 'newGame': {
      const newStore: StoreData = {
        board: create2DArray<FieldType>(6, 7, FieldType.Empty),
        currentPlayer: random.int(2),
        lastMoveRow: -1,
        lastMoveColumn: -1,
        victoriousPlayer: -1,
      };

      return { ...store, ...newStore };
    }
  }
}
