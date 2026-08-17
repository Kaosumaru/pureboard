import { useContext, useMemo, useEffect, createContext, ReactNode, JSX } from 'react';
import { BaseComponentClient } from './baseComponentClient';
import { GameRoomContext } from './react';
import { HiddenObjectsState, Store, StoreContainer } from '../shared';

interface ComponentContext<Data, Action, HiddenType = any> {
  store: Store<Data>;
  hiddenObjectsStore: Store<HiddenObjectsState<HiddenType>>;
  action: (action: Action) => Promise<void>;
}

type StoreConstructor<Data, Action, HiddenType> = () => StoreContainer<Data, Action, HiddenType>;

export function useComponentContext<Data, Action, HiddenType = any>(id: string, constructor: StoreConstructor<Data, Action, HiddenType>): ComponentContext<Data, Action, HiddenType> {
  const gameRoomClient = useContext(GameRoomContext);
  if (gameRoomClient === null) {
    throw new Error('useComponentContext must be used within a GameRoomProvider');
  }

  const context = useMemo(() => {
    const client = new BaseComponentClient<Data, Action, HiddenType>(constructor(), id, gameRoomClient);
    return {
      store: client.store,
      action: client.sendAction.bind(client),
      client: client,
      hiddenObjectsStore: client.hiddenObjectsStore,
    };
  }, [gameRoomClient]);

  useEffect(() => {
    void context.client.initialize();
    return () => {
      context.client.deinitialize();
    };
  }, [context]);
  return context;
}

type CreateComponentContextReturnType<Data, Action, HiddenType> = [({ children }: { children: ReactNode }) => JSX.Element, () => ComponentContext<Data, Action, HiddenType>];

export function CreateComponentContext<Type extends string, Data, Action, HiddenType = any>(
  id: Type,
  constructor: StoreConstructor<Data, Action, HiddenType>
): CreateComponentContextReturnType<Data, Action, HiddenType> {
  const ComponentContext = createContext<ComponentContext<Data, Action, HiddenType> | null>(null);

  const provider = function ComponentProvider({ children }: { children: ReactNode }) {
    const component = useComponentContext<Data, Action, HiddenType>(id, constructor);
    return <ComponentContext.Provider value={component}>{children}</ComponentContext.Provider>;
  };

  const useContextHook = () => {
    const context = useContext(ComponentContext);
    if (!context) {
      throw new Error('useComponentContext must be used within a ComponentProvider');
    }
    return context;
  };

  return [provider, useContextHook] as const;
}
