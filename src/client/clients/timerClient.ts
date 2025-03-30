import { Action, StoreData, createGameStateStore } from '../../shared/stores/timerStore';
import { GameRoomClient } from '../gameRoomClient';
import { BaseComponentClient } from '../baseComponentClient';

export class TimerClient extends BaseComponentClient<StoreData, Action> {
  constructor(gameRoomClient: GameRoomClient) {
    super(createGameStateStore(0, 0, 0), 'timer', gameRoomClient);
  }
}
