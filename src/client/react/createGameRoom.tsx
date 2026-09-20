import { JSX } from 'react';
import { useGameRoomClient, GameRoomContext } from './useClient';
import { GameOptions } from '../../shared/interface';

interface CreateGameRoomClientProps extends React.PropsWithChildren {
  token: string;
  gameId: string;
  options: GameOptions;
  takeAvailableSeat?: boolean;
  onCreated?: (id: number, password: string | undefined) => Promise<void>;
  onFailed?: (error: Error) => Promise<void>;
}

export function CreateGameRoomClient(props: CreateGameRoomClientProps): JSX.Element {
  const gameClient = useGameRoomClient({
    token: props.token,
    onFailed: () => {
      return props.onFailed?.(new Error('Failed to create game room')) ?? Promise.resolve();
    },
    onSuccess: async client => {
      const game = 'connect4';
      const [id, password] = await client.createRoom(game, props.options);

      if (props.takeAvailableSeat ?? true) {
        await client.takeAvailableSeat();
      }
      return props.onCreated?.(id, password);
    },
  });

  if (!gameClient) {
    return <></>;
  }

  return <GameRoomContext.Provider value={gameClient}>{props.children}</GameRoomContext.Provider>;
}
