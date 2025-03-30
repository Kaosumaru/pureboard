import { Action, StoreData, createGameStateStore } from '../../shared/stores/chatStore';
import { GameRoomClient } from '../gameRoomClient';
import { BaseComponentClient } from '../baseComponentClient';
import { Signal } from 'typed-signals';

export class ChatClient extends BaseComponentClient<StoreData, Action> {
  constructor(gameRoomClient: GameRoomClient) {
    super(createGameStateStore(), 'chat', gameRoomClient);
  }

  public sendMessage(message: string): Promise<void> {
    return this.doAction({
      type: 'message',
      message: {
        user: {
          id: this.gameRoomClient.userInfo?.id ?? '',
          name: this.gameRoomClient.userInfo?.name ?? '',
        },
        message,
      },
    });
  }

  protected override onAction(action: Action): void {
    super.onAction(action);
    if (action.type === 'message') {
      this.onMessage.emit(action.message.user.name, action.message.message);
      if (action.message.user.id !== this.gameRoomClient.userInfo?.id) {
        this.onExternalMessage.emit(action.message.user.name, action.message.message);
        return;
      }
    }
  }

  onMessage = new Signal<(user: string, message: string) => void>();
  onExternalMessage = new Signal<(user: string, message: string) => void>();
}
