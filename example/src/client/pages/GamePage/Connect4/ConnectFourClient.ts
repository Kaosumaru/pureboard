import { Action, StoreData, createGameStateStore } from '@shared/stores/connectFourStore';
import { BaseGameClient, GameRoomClient } from 'pureboard/client';
import { seatOf } from 'pureboard/shared';

export class ConnectFourClient extends BaseGameClient<StoreData, Action> {
  constructor(gameRoomClient: GameRoomClient) {
    super(createGameStateStore(), 'connect4', gameRoomClient);
  }

  public async makeMove(column: number) {
    await this.sendAction({ type: 'move', column });
  }

  public async surrender() {
    const myId = this.gameRoomClient.userInfo?.id ?? '';
    const player = seatOf(myId, this.gameRoomState());
    await this.sendAction({ type: 'surrender', player });
  }

  public async newGame() {
    await this.sendAction({ type: 'newGame' });
  }
}
