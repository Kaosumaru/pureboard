import { Action, StoreData, createGameStateStore } from '../../shared/stores/timerStore';
import { BaseComponentClient } from '../baseComponentClient';
import { IGameRoomClient } from '../interface';

export class TimerClient extends BaseComponentClient<StoreData, Action> {
  constructor(gameRoomClient: IGameRoomClient) {
    super(createGameStateStore(0, 0, 0), 'timer', gameRoomClient);
  }
}
