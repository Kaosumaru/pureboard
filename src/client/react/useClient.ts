import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { GameRoomClient } from '../gameRoomClient';
import { IDisposableClient } from '../interface';

export const GameRoomContext = createContext<GameRoomClient | null>(null);

export function useClient<T extends IDisposableClient, Args extends unknown[]>(type: { new (gameRoomClient: GameRoomClient, ...args: Args): T }, ...args: Args): T {
  const gameRoomClient = useContext(GameRoomContext);
  if (gameRoomClient === null) {
    throw new Error('useClient must be used within a GameRoomProvider');
  }

  const client = useMemo(() => new type(gameRoomClient, ...args), [gameRoomClient, type, args]);
  useEffect(() => {
    void client.initialize();
    return () => {
      client.deinitialize();
    };
  }, [client, args, type]);
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
        if (cancelled) return;

        if (!success) {
          await props.onFailed();
          return;
        }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ?? []);
  return gameClient;
}
