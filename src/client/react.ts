import { useEffect, useMemo, createContext, useContext, useState } from 'react';
import { BaseComponentClient } from './baseComponentClient';
import { ConnectionInterface, IDisposableClient, RoomInterface, SeatingInterface } from './interface';
import { GameRoomClient } from './gameRoomClient';

type InferAction<T> = T extends BaseComponentClient<any, infer Action, any> ? Action : never;

export function useAfterAction<T extends BaseComponentClient<any, any, any>>(client: T, listener: (action: InferAction<T>) => void): void {
  useEffect(() => {
    const connection = client.onAfterAction.connect(listener);
    return () => {
      connection.disconnect();
    };
  }, [client, listener]);
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

export enum RoomConnectionState {
  CLOSED,
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
}

export function useRoomConnectionState(): RoomConnectionState {
  const seating = useSeatingContext();
  const connection = useConnectionContext();
  const disconnected = connection.connectionStore(state => state.disconnected);
  const autoreconnecting = connection.connectionStore(state => state.autoreconnecting);
  const closed = seating.store(state => state.closed);
  const gameId = seating.store(state => state.id);

  if (disconnected) {
    return RoomConnectionState.DISCONNECTED;
  }

  if (autoreconnecting) {
    return RoomConnectionState.CONNECTING;
  }

  if (closed) {
    return RoomConnectionState.CLOSED;
  }

  if (gameId == -1) {
    return RoomConnectionState.CONNECTING;
  }

  return RoomConnectionState.CONNECTED;
}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ?? []);
  return gameClient;
}
