import { StoreData, Action, UserInfo, createGameStateStore } from '../../shared/stores/chatStore';
import { ComponentHandler } from '../components';
import { ComponentConstructor } from '../rooms';
import { IServer } from '../interface';

type ActionType = Action;

export type ChatMessageCallback = (id: number, user: UserInfo, message: string) => void;

const chatsContainer = new ComponentHandler<StoreData, ActionType>('chat');

export function createChat(): ComponentConstructor {
  return chatsContainer.createComponent(createGameStateStore());
}

export function createChatWithCallback(callback?: ChatMessageCallback): ComponentConstructor {
  return chatsContainer.createComponent(createGameStateStore(), {
    afterAction: (_store, _id, _ctx, action) => {
      if (action.type === 'message' && callback) {
        callback(_id, action.message.user, action.message.message);
      }
    },
  });
}

export function registerChat(server: IServer): void {
  chatsContainer.register(server);
}
