import { useCallback, useEffect, useMemo } from 'react';
import { BaseComponentClient } from './baseComponentClient';
import { GameRoomClient } from './gameRoomClient';
import { StandardGameAction } from '../shared/standardActions';
import { IDisposableClient } from './interface';

type InferAction<T> = T extends BaseComponentClient<any, infer Action, any> ? Action : never;

export function useAfterAction<T extends BaseComponentClient<any, any, any>>(client: T, listener: (action: InferAction<T> | StandardGameAction) => void, deps: any[] = []): void {
  const cachedListener = useCallback(listener, deps);
  useEffect(() => {
    const connection = client.onAfterAction.connect(cachedListener);
    return () => {
      connection.disconnect();
    };
  }, [client, cachedListener]);
}

export function useClient<T extends IDisposableClient>(type: { new (client: GameRoomClient): T }, baseClient: GameRoomClient): T {
  const client = useMemo(() => new type(baseClient), [baseClient]);
  useEffect(() => {
    void client.initialize();
    return () => {
      client.deinitialize();
    };
  }, [client]);
  return client;
}
