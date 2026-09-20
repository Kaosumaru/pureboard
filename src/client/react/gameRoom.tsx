import { JSX } from 'react';
import { RoomConnectionState, useRoomConnectionState } from './connectionState';

function GameRoomConnected(props: React.PropsWithChildren): JSX.Element {
  const connectionState = useRoomConnectionState();
  if (connectionState !== RoomConnectionState.CONNECTED) {
    return <></>;
  }
  return <>{props.children}</>;
}

function GameRoomDisconnected(props: React.PropsWithChildren): JSX.Element {
  const connectionState = useRoomConnectionState();
  if (connectionState !== RoomConnectionState.DISCONNECTED) {
    return <></>;
  }
  return <>{props.children}</>;
}

function GameRoomConnecting(props: React.PropsWithChildren): JSX.Element {
  const connectionState = useRoomConnectionState();
  if (connectionState !== RoomConnectionState.CONNECTING) {
    return <></>;
  }
  return <>{props.children}</>;
}

function GameRoomClosed(props: React.PropsWithChildren): JSX.Element {
  const connectionState = useRoomConnectionState();
  if (connectionState !== RoomConnectionState.CLOSED) {
    return <></>;
  }
  return <>{props.children}</>;
}

export const GameRoom = {
  Connected: GameRoomConnected,
  Disconnected: GameRoomDisconnected,
  Connecting: GameRoomConnecting,
  Closed: GameRoomClosed,
};
