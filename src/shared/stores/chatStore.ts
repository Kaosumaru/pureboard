import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension'; // required for devtools typing
import { CurrentPlayerValidation, RandomGenerator, StandardGameAction, StoreContainer } from '../interface';

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
  const store = create<StoreData>()(
    devtools(
      (): StoreData => ({
        messages: [],
      })
    )
  );
  return {
    store,
    action: (playerValidation: CurrentPlayerValidation, action: Action | StandardGameAction, _: RandomGenerator) => store.setState(store => makeAction(playerValidation, store, action)),
  };
}

function makeAction(playerValidation: CurrentPlayerValidation, store: StoreData, action: Action | StandardGameAction): StoreData | Partial<StoreData> {
  switch (action.type) {
    case 'message': {
      const { id, name } = action.message.user;
      if (!playerValidation.isUser(id, name)) throw new Error('Not allowed to send message');
      return { messages: [...store.messages, action.message] };
    }
    case 'newGame':
      return { ...store };
  }
}
