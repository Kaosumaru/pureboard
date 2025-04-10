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
