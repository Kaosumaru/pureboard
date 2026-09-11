import { useContext, useMemo, useEffect, createContext, ReactNode, JSX } from 'react';
import { BaseComponentClient } from '../baseComponentClient';
import { HiddenObjectsState, Store, StoreContainer } from '../../shared';
import { GameRoomContext } from './useClient';

export interface ComponentContext<Data, Action, HiddenType = any> {
  // store for the component's state
  store: Store<Data>;

  // store for the component's hidden objects state
  hiddenObjectsStore: Store<HiddenObjectsState<HiddenType>>;

  // function to send an action to the component
  action: (action: Action) => Promise<void>;

  // function to register a handler for actions sent to the component
  useOnAction: (handler: (action: Action) => void) => void;
}

type StoreConstructor<Data, Action, HiddenType> = () => StoreContainer<Data, Action, HiddenType>;

function useComponentContext<Data, Action, HiddenType = any>(id: string, constructor: StoreConstructor<Data, Action, HiddenType>): ComponentContext<Data, Action, HiddenType> {
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
      useOnAction: (handler: (action: Action) => void) => {
        useEffect(() => {
          const connection = client.onAfterAction.connect(handler);
          return () => {
            connection.disconnect();
          };
        }, [handler]);
      },
    };
  }, [gameRoomClient, constructor, id]);

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
