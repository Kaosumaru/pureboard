import { JSX } from 'react';
import { useGameRoomClient, GameRoomContext } from './useClient';

interface JoinGameRoomClientProps extends React.PropsWithChildren {
  token: string;
  roomId: number;
  password?: string;
  takeAvailableSeat?: boolean;
  onJoined?: (id: number, password: string | undefined) => Promise<void>;
  onFailed?: (error: Error) => Promise<void>;
}

export function JoinGameRoomClient(props: JoinGameRoomClientProps): JSX.Element {
  const gameClient = useGameRoomClient({
    token: props.token,
    onFailed: () => {
      return props.onFailed?.(new Error('Failed to join game room')) ?? Promise.resolve();
    },
    onSuccess: async client => {
      try {
        await client.join(props.roomId, props.password);
        if (props.takeAvailableSeat ?? true) {
          await client.takeAvailableSeat();
        }
        return props.onJoined?.(props.roomId, props.password);
      } catch (err) {
        return props.onFailed?.(err instanceof Error ? err : new Error(String(err)));
      }
    },
  });

  if (!gameClient) {
    return <></>;
  }

  return <GameRoomContext.Provider value={gameClient}>{props.children}</GameRoomContext.Provider>;
}
