import { Action, StoreData, createGameStateStore } from '@shared/stores/connectFourStore';
import { CreateComponentContext } from 'pureboard/client';

export const [ConnectFourProvider, useConnect4] = CreateComponentContext<'connect4', StoreData, Action>(
  'connect4',
  () => createGameStateStore()
);
