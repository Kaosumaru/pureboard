import './GamePage.css';
import { JSX, useEffect, useState } from 'react';
import GamePage from './GamePage';
import { useLoginContext } from '../LoginPage/LoginPage';
import { GameRoomClient } from 'pureboard/client/gameRoomClient';

function CreateGamePage(): JSX.Element {
  const context = useLoginContext();
  const [gameClient, setGameClient] = useState<GameRoomClient | undefined>(undefined);
  const loginContext = useLoginContext();

  useEffect(() => {
    let cancelled = false;
    const client = new GameRoomClient();

    client
      .start(context.userId)
      .then(async success => {
        if (!success) {
          loginContext.logout();
          return;
        }

        if (cancelled) return;

        const game = 'connect4';

        const [id, password] = await client.createRoom(game, { players: 2 });
        await client.takeAvailableSeat();
        const url = password ? `/joinGame/${id}/${password}` : `/game/${id}`;
        window.history.replaceState(null, 'Game', url);
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
  }, []);

  if (!gameClient) {
    return <>Connecting...</>;
  }

  return <GamePage client={gameClient} userId={context.userId} />;
}

export default CreateGamePage;
