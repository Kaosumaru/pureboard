import type {} from '@redux-devtools/extension'; // required for devtools typing
import { Context, StoreContainer } from '../interface';
import { StandardGameAction } from '../standardActions';
import { createComponentStore } from '../store';

export interface UserInfo {
  id: string;
  name: string;
}

export interface MessageAction {
  type: 'message';
  message: Message;
}

export type Action = MessageAction;

export interface Message {
  user: UserInfo;
  message: string;
}

export interface StoreData {
  messages: Message[];
}

export function createGameStateStore(): StoreContainer<StoreData, Action> {
  return createComponentStore(
    {
      messages: [],
    },
    makeAction
  );
}

function makeAction(ctx: Context, store: StoreData, action: Action | StandardGameAction): StoreData | Partial<StoreData> {
  switch (action.type) {
    case 'message': {
      const { id, name } = action.message.user;
      if (!ctx.playerValidation.isUser(id, name)) throw new Error('Not allowed to send message');
      return { messages: [...store.messages, action.message] };
    }
    case 'newGame':
      return { ...store };
  }
}
