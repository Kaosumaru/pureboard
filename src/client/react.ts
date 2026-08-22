import { useCallback, useEffect, useMemo, createContext, useContext } from 'react';
import { BaseComponentClient } from './baseComponentClient';
import { ConnectionInterface, IDisposableClient, RoomInterface, SeatInterface } from './interface';
import { GameRoomClient } from './gameRoomClient';

type InferAction<T> = T extends BaseComponentClient<any, infer Action, any> ? Action : never;

export function useAfterAction<T extends BaseComponentClient<any, any, any>>(client: T, listener: (action: InferAction<T>) => void, deps: any[] = []): void {
  const cachedListener = useCallback(listener, deps);
  useEffect(() => {
    const connection = client.onAfterAction.connect(cachedListener);
    return () => {
      connection.disconnect();
    };
  }, [client, cachedListener]);
}

export const GameRoomContext = createContext<GameRoomClient | null>(null);

export function useRoomContext(): RoomInterface {
  const gameRoomClient = useContext(GameRoomContext);
  if (gameRoomClient === null) {
    throw new Error('useRoomContext must be used within a GameRoomProvider');
  }
  return gameRoomClient;
}

export function useConnectionContext(): ConnectionInterface {
  const gameRoomClient = useContext(GameRoomContext);
  if (gameRoomClient === null) {
    throw new Error('useConnectionContext must be used within a GameRoomProvider');
  }
  return gameRoomClient;
}

export function useSeatingContext(): SeatInterface {
  const gameRoomClient = useContext(GameRoomContext);
  if (gameRoomClient === null) {
    throw new Error('useSeatingContext must be used within a GameRoomProvider');
  }
  return gameRoomClient;
}

export function useClient<T extends IDisposableClient, Args extends unknown[]>(type: { new (gameRoomClient: GameRoomClient, ...args: Args): T }, ...args: Args): T {
  const gameRoomClient = useContext(GameRoomContext);
  if (gameRoomClient === null) {
    throw new Error('useClient must be used within a GameRoomProvider');
  }

  const client = useMemo(() => new type(gameRoomClient, ...args), [gameRoomClient, ...args]);
  useEffect(() => {
    void client.initialize();
    return () => {
      client.deinitialize();
    };
  }, [client]);
  return client;
}
