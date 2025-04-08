import { Action, StoreData, createGameStateStore } from '@shared/stores/connectFourStore';
import { GameRoomClient } from 'pureboard/client/gameRoomClient';
import { seatOf } from 'pureboard/shared/gameRoomStore';
import { BaseGameClient } from 'pureboard/client/baseGameClient';

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
    await this.restartGame({ players: 2 });
  }
}
