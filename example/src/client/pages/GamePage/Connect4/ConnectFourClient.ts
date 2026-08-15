import { Action, StoreData, createGameStateStore } from '@shared/stores/connectFourStore';
import { BaseComponentClient, GameRoomClient } from 'pureboard/client';

export class ConnectFourClient extends BaseComponentClient<StoreData, Action> {
  constructor(gameRoomClient: GameRoomClient) {
    super(createGameStateStore(), 'connect4', gameRoomClient);
    this.gameRoomClient = gameRoomClient;
  }

  public async makeMove(column: number) {
    await this.sendAction({ type: 'move', column });
  }

  public async surrender() {
    const player = this.seatOf();
    await this.sendAction({ type: 'surrender', player });
  }

  public async newGame() {
    await this.sendAction({ type: 'newGame' });
  }

  public seatOf(): number {
    return this.gameRoomClient.seatOf();
  }

  haveSeat(index: number): boolean {
    return this.gameRoomClient.haveSeat(index);
  }

  gameRoomClient: GameRoomClient;
}
