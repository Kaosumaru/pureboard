import { useSeatingContext, useConnectionContext } from './context';

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
