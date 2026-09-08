import { Action, StoreData, createGameStateStore } from '../../shared/stores/timerStore';
import { CreateComponentContext } from '../reactComponents';

export const [TimerProvider, useTimer] = CreateComponentContext<'timer', StoreData, Action>('timer', () => createGameStateStore(0, 0, 0));
