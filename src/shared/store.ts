import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension'; // required for devtools typing
import { Context, StoreContainer } from './interface';

export type ReducerType<StateType, ActionType, HiddenType> = (ctx: Context<HiddenType>, data: StateType, action: ActionType) => StateType | Partial<StateType>;
export function createComponentStore<StateType, ActionType, HiddenType = any>(
  initialState: StateType,
  reducerAction: ReducerType<StateType, ActionType, HiddenType>
): StoreContainer<StateType, ActionType, HiddenType> {
  const store = create<StateType>()(devtools((): StateType => initialState));
  return {
    store,
    reducer: (ctx: Context<HiddenType>, action: ActionType) => store.setState(store => reducerAction(ctx, store, action)),
  };
}
