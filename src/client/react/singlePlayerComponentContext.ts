import { useContext, useEffect, useMemo } from 'react';
import { HiddenObjectsState, Store } from '../../shared';
import { SinglePlayerGameRoomContext } from './createSinglePlayerGameRoom';
import type { ComponentContext, StoreConstructor } from './reactComponents';
import { createUseOnAction } from './useOnAction';

// in a single player game room, actions are applied directly to the store, without any server
export function useSinglePlayerComponentContext<Data, Action, HiddenType = any>(constructor: StoreConstructor<Data, Action, HiddenType>): ComponentContext<Data, Action, HiddenType> {
  const singlePlayerClient = useContext(SinglePlayerGameRoomContext);
  if (singlePlayerClient === null) {
    throw new Error('useSinglePlayerComponentContext must be used within a single player GameRoomProvider');
  }

  const context = useMemo(() => {
    const container = constructor();
    return {
      container,
      store: container.store,
      // eslint-disable-next-line @typescript-eslint/require-await
      action: async (action: Action) => singlePlayerClient.applyAction(action),
      hiddenObjectsStore: singlePlayerClient.hiddenObjectsStore as Store<HiddenObjectsState<HiddenType>>,
      useOnAction: createUseOnAction<Action>(singlePlayerClient.onAfterAction),
    };
  }, [singlePlayerClient, constructor]);

  useEffect(() => {
    singlePlayerClient.setContainer(context.container);
  }, [singlePlayerClient, context]);
  return context;
}
