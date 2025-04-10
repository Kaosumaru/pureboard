import { StoreData, Action, createGameStateStore, timeLeftForPlayer } from '../../shared/stores/timerStore';
import { ComponentContainer } from '../componentContainer';
import { StandardGameAction, Store } from '../../shared/interface';
import { GroupEmitter, IServer } from '../interface';
import { ComponentConstructor } from '../games';

type ActionType = Action;

type TimerCallback = (gameId: number, player: number) => void;

const gameContainer = new ComponentContainer<StoreData, ActionType>('timer');

export function applyActionOnTimer(ctx: GroupEmitter, id: number, action: ActionType): void {
  gameContainer.sendServerAction(ctx, id, action);
}

export function createTimer(cb: TimerCallback, maxTime: number, players: number, perActivationTimeIncrement = 0): ComponentConstructor {
  let timer: NodeJS.Timeout | undefined;
  const afterActionApplied = (store: Store<StoreData>, id: number, ctx: GroupEmitter, action: Action | StandardGameAction) => {
    if (action.type === 'setActivePlayer') {
      clearTimeout(timer);

      if (action.player === undefined) return;

      const timeLeft = timeLeftForPlayer(store.getState(), action.player);
      const player = action.player;
      timer = setTimeout(() => {
        cb(id, player);
      }, timeLeft);
    }
  };

  const store = createGameStateStore(maxTime, players, perActivationTimeIncrement);
  return gameContainer.createComponent(store, { players }, afterActionApplied);
}

export function registerTimer(server: IServer): void {
  gameContainer.registerServer(server);
}
