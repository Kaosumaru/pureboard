import './GamePage.css';
import { JSX, useEffect, useState } from 'react';
import { GameRoomClient } from 'pureboard/client/gameRoomClient';
import { useParams } from 'react-router-dom';
import GamePage from './GamePage';
import { useLoginContext } from '../LoginPage/LoginPage';

function JoinGamePage(): JSX.Element {
  const context = useLoginContext();
  const [error, setError] = useState<string | undefined>(undefined);
  const [gameClient, setGameClient] = useState<GameRoomClient | undefined>(undefined);
  const params = useParams<{ id?: string; password?: string }>();
  const gameId = Number(params.id);
  const loginContext = useLoginContext();

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    const client = new GameRoomClient();

    client
      .start(context.userId)
      .then(async success => {
        if (cancelled) return;
        if (!success) {
          loginContext.logout();
          return;
        }

        try {
          await client.join(gameId, params.password);
          await client.takeAvailableSeat(); // this can fail if all seats are taken
        } catch (err) {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : String(err));
          return;
        }

        setGameClient(client);
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
  }, [params.id, gameId]);

  if (error) {
    return <>{error}</>;
  }

  if (!params.id) {
    return <>Invalid game id</>;
  }

  if (!gameClient) {
    return <>Connecting...</>;
  }

  return <GamePage client={gameClient} userId={context.userId} />;
}

export default JoinGamePage;
