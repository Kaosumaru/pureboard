import { createStoreContainer, Reducer } from '../interface';

export interface UserInfo {
  id: string;
  name: string;
}

export interface Message {
  user: UserInfo;
  message: string;
}

export interface StoreData {
  messages: Message[];
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createGameStateStore() {
  return createStoreContainer<StoreData, Reducer<StoreData>>(
    {
      messages: [],
    },
    1,
    ctx => ({
      message: (data: StoreData, message: Message) => {
        const { id, name } = message.user;
        if (!ctx.playerValidation.isUser(id, name)) throw new Error('Not allowed to send message');
        return { messages: [...data.messages, message] };
      },
      newGame: (data: StoreData) => {
        return { ...data };
      },
    })
  );
}
