import { StoreData, Action, createGameStateStore } from '@shared/stores/connectFourStore';
import { createChat } from 'pureboard/server/components/chat';
import { IServer } from 'pureboard/server/interface';
import { ComponentContainer } from 'pureboard/server/componentContainer';

const gameContainer = new ComponentContainer<StoreData, Action>('connect4');

export function registerConnect4(server: IServer): void {
  gameContainer.registerServerWithCreation(server, createGameStateStore, {
    components: [createChat()],
  });
}
