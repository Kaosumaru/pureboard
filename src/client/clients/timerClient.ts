import { Action, StoreData, createGameStateStore } from '../../shared/stores/timerStore';
import { BaseComponentClient, IComponentClient } from '../baseComponentClient';

export class TimerClient extends BaseComponentClient<StoreData, Action> {
  constructor(gameRoomClient: IComponentClient) {
    super(createGameStateStore(0, 0, 0), 'timer', gameRoomClient);
  }
}
