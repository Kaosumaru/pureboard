import { useCallback, useEffect, useMemo, createContext, useContext, useState } from 'react';
import { BaseComponentClient } from './baseComponentClient';
import { ConnectionInterface, IDisposableClient, RoomInterface, SeatingInterface } from './interface';
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

export function useSeatingContext(): SeatingInterface {
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

interface UseGameRoomClientProps {
  token: string;
  onFailed: () => Promise<void>;
  onSuccess: (client: GameRoomClient) => Promise<void>;
}

export function useGameRoomClient(props: UseGameRoomClientProps, deps?: React.DependencyList): GameRoomClient | undefined {
  const [gameClient, setGameClient] = useState<GameRoomClient | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    const client = new GameRoomClient();

    client
      .start(props.token)
      .then(async success => {
        if (!success) {
          await props.onFailed();
          return;
        }

        if (cancelled) return;

        setGameClient(client);
        await props.onSuccess(client);
      })
      .catch(err => {
        if (cancelled) {
          return;
        }
        throw err;
      });

    return () => {
      cancelled = true;
      client?.disconnect();
      setGameClient(undefined);
    };
  }, deps ?? []);
  return gameClient;
}
