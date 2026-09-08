import { useCallback } from 'react';
import { Action, StoreData, createGameStateStore } from '../../shared/stores/chatStore';
import { useConnectionContext } from '../react';
import { CreateComponentContext } from '../reactComponents';

export const [ChatProvider, useChat] = CreateComponentContext<'chat', StoreData, Action>('chat', () => createGameStateStore());

export function useSendChatMessage(): (message: string) => Promise<void> {
  const connection = useConnectionContext();
  const { action } = useChat();

  return useCallback(
    (message: string): Promise<void> => {
      return action({
        type: 'message',
        message: {
          user: {
            id: connection.userInfo?.id ?? '',
            name: connection.userInfo?.name ?? '',
          },
          message,
        },
      });
    },
    [action, connection]
  );
}

/*
import { Action, StoreData, createGameStateStore } from '../../shared/stores/chatStore';
import { BaseComponentClient } from '../baseComponentClient';
import { Signal } from 'typed-signals';
import { IGameRoomClient } from '../interface';

export class ChatClient extends BaseComponentClient<StoreData, Action> {
  constructor(gameRoomClient: IGameRoomClient) {
    super(createGameStateStore(), 'chat', gameRoomClient);
  }

  public sendMessage(message: string): Promise<void> {
    const info = this.client.getUserInfo();
    return this.sendAction({
      type: 'message',
      message: {
        user: {
          id: info?.id ?? '',
          name: info?.name ?? '',
        },
        message,
      },
    });
  }

  protected override onAction(action: Action): void {
    super.onAction(action);
    if (action.type === 'message') {
      const info = this.client.getUserInfo();
      this.onMessage.emit(action.message.user.name, action.message.message);
      if (action.message.user.id !== info?.id) {
        this.onExternalMessage.emit(action.message.user.name, action.message.message);
        return;
      }
    }
  }

  onMessage = new Signal<(user: string, message: string) => void>();
  onExternalMessage = new Signal<(user: string, message: string) => void>();
}
*/
