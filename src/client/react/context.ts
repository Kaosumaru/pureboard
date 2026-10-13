import { useContext } from 'react';
import { ConnectionInterface, SeatingInterface, RoomInterface } from '../interface';
import { GameRoomContext } from './useClient';
import { OfflineGameRoomContext } from './createOfflineGameRoom';

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
  const offlineClient = useContext(OfflineGameRoomContext);
  const client = gameRoomClient ?? offlineClient;
  if (client === null) {
    throw new Error('useSeatingContext must be used within a GameRoomProvider');
  }
  return client;
}
