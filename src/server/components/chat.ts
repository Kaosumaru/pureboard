import { StoreData, Action, UserInfo, createGameStateStore } from '../../shared/stores/chatStore';
import { ComponentContainer } from '../componentContainer';
import { GameConstructor } from '../games';
import { IServer } from '../interface';

type ActionType = Action;

export type ChatMessageCallback = (id: number, user: UserInfo, message: string) => void;

const gameContainer = new ComponentContainer<StoreData, ActionType>('chat');

export function createChat(): GameConstructor {
  return gameContainer.addGame(createGameStateStore(), { players: 0 });
}

export function createChatWithCallback(callback?: ChatMessageCallback): GameConstructor {
  return gameContainer.addGame(createGameStateStore(), { players: 0 }, (_store, _id, _ctx, action) => {
    if (action.type === 'message' && callback) {
      callback(_id, action.message.user, action.message.message);
    }
  });
}

export function registerChat(server: IServer): void {
  gameContainer.registerServer(server);
}
