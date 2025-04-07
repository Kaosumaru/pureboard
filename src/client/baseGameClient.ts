import { GameRoomState } from '../shared/gameRoomStore';
import { StoreContainer } from '../shared/interface';
import { BaseComponentClient } from './baseComponentClient';
import { GameRoomClient } from './gameRoomClient';

export class BaseGameClient<Data, Action, HiddenType = any> extends BaseComponentClient<Data, Action, HiddenType> {
  protected gameRoomClient: GameRoomClient;

  constructor(container: StoreContainer<Data, Action, HiddenType>, type: string, gameRoomClient: GameRoomClient) {
    super(container, type, gameRoomClient);

    this.gameRoomClient = gameRoomClient;
  }

  public seatOf(): number {
    return this.gameRoomClient.seatOf();
  }

  haveSeat(index: number): boolean {
    return this.gameRoomClient.haveSeat(index);
  }

  public getGameRoomClient(): GameRoomClient {
    return this.gameRoomClient;
  }

  protected gameRoomState(): GameRoomState {
    return this.gameRoomClient.store.getState();
  }
}
