import { useContext, useMemo, useEffect, createContext, ReactNode, JSX } from 'react';
import { BaseComponentClient } from '../baseComponentClient';
import { HiddenObjectsState, Store, StoreContainer } from '../../shared';
import { GameRoomContext } from './useClient';
import { useOfflineComponentContext } from './offlineComponentContext';
import { createUseOnAction } from './useOnAction';

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

export type StoreConstructor<Data, Action, HiddenType> = () => StoreContainer<Data, Action, HiddenType>;

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
      useOnAction: createUseOnAction<Action>(client.onAfterAction),
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

type ComponentProviderType = ({ children }: { children: ReactNode }) => JSX.Element;

// [provider, hook to access the component, provider to be used in an offline game room]
type CreateComponentContextReturnType<Data, Action, HiddenType> = [ComponentProviderType, () => ComponentContext<Data, Action, HiddenType>, ComponentProviderType];

export function CreateComponentContext<Type extends string, Data, Action, HiddenType = any>(
  id: Type,
  constructor: StoreConstructor<Data, Action, HiddenType>
): CreateComponentContextReturnType<Data, Action, HiddenType> {
  const ComponentContext = createContext<ComponentContext<Data, Action, HiddenType> | null>(null);

  const provider = function ComponentProvider({ children }: { children: ReactNode }) {
    const component = useComponentContext<Data, Action, HiddenType>(id, constructor);
    return <ComponentContext.Provider value={component}>{children}</ComponentContext.Provider>;
  };

  const offlineProvider = function OfflineComponentProvider({ children }: { children: ReactNode }) {
    const component = useOfflineComponentContext<Data, Action, HiddenType>(constructor);
    return <ComponentContext.Provider value={component}>{children}</ComponentContext.Provider>;
  };

  const useContextHook = () => {
    const context = useContext(ComponentContext);
    if (!context) {
      throw new Error('useComponentContext must be used within a ComponentProvider');
    }
    return context;
  };

  return [provider, useContextHook, offlineProvider] as const;
}
