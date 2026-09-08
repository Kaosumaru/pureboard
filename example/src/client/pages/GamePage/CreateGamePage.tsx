import './GamePage.css';
import { JSX } from 'react';
import GamePage from './GamePage';
import { useLoginContext } from '../LoginPage/LoginPage';
import { GameRoomContext, useGameRoomClient } from 'pureboard/client';

function CreateGamePage(): JSX.Element {
  const context = useLoginContext();
  const loginContext = useLoginContext();
  const gameClient = useGameRoomClient({
    token: context.userId,
    onFailed: () => {
      loginContext.logout();
      return Promise.resolve();
    },
    onSuccess: async client => {
      const game = 'connect4';
      const [id, password] = await client.createRoom(game, { players: 2 });
      await client.takeAvailableSeat();
      const url = password ? `/joinGame/${id}/${password}` : `/game/${id}`;
      window.history.replaceState(null, 'Game', url);
    },
  });

  if (!gameClient) {
    return <>Connecting...</>;
  }

  return (
    <GameRoomContext.Provider value={gameClient}>
      <GamePage userId={context.userId} />;
    </GameRoomContext.Provider>
  );
}

export default CreateGamePage;
