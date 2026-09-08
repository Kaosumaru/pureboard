import './GamePage.css';
import { JSX, useState } from 'react';
import { GameRoomContext, useGameRoomClient } from 'pureboard/client';
import { useParams } from 'react-router-dom';
import GamePage from './GamePage';
import { useLoginContext } from '../LoginPage/LoginPage';

function JoinGamePage(): JSX.Element {
  const context = useLoginContext();
  const [error, setError] = useState<string | undefined>(undefined);
  const params = useParams<{ id?: string; password?: string }>();
  const gameId = Number(params.id);
  const loginContext = useLoginContext();

  const gameClient = useGameRoomClient(
    {
      token: context.userId,
      onFailed: () => {
        loginContext.logout();
        return Promise.resolve();
      },
      onSuccess: async client => {
        try {
          await client.join(gameId, params.password);
          await client.takeAvailableSeat(); // this can fail if all seats are taken
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
          return;
        }
      },
    },
    [params.id]
  );

  if (error) {
    return <>{error}</>;
  }

  if (!params.id) {
    return <>Invalid game id</>;
  }

  if (!gameClient) {
    return <>Connecting...</>;
  }

  return (
    <GameRoomContext.Provider value={gameClient}>
      <GamePage userId={context.userId} />;
    </GameRoomContext.Provider>
  );
}

export default JoinGamePage;
