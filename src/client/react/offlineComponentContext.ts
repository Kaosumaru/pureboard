import { useContext, useEffect, useMemo } from 'react';
import { HiddenObjectsState, Store } from '../../shared';
import { OfflineGameRoomContext } from './createOfflineGameRoom';
import type { ComponentContext, StoreConstructor } from './reactComponents';
import { createUseOnAction } from './useOnAction';

// in an offline game room, actions are applied directly to the store, without any server
export function useOfflineComponentContext<Data, Action, HiddenType = any>(constructor: StoreConstructor<Data, Action, HiddenType>): ComponentContext<Data, Action, HiddenType> {
  const offlineClient = useContext(OfflineGameRoomContext);
  if (offlineClient === null) {
    throw new Error('useOfflineComponentContext must be used within an offline GameRoomProvider');
  }

  const context = useMemo(() => {
    const container = constructor();
    return {
      container,
      store: container.store,
      // eslint-disable-next-line @typescript-eslint/require-await
      action: async (action: Action) => offlineClient.applyAction(action),
      hiddenObjectsStore: offlineClient.hiddenObjectsStore as Store<HiddenObjectsState<HiddenType>>,
      useOnAction: createUseOnAction<Action>(offlineClient.onAfterAction),
    };
  }, [offlineClient, constructor]);

  useEffect(() => {
    offlineClient.setContainer(context.container);
  }, [offlineClient, context]);
  return context;
}
