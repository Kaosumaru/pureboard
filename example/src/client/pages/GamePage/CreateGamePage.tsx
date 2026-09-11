import './GamePage.css';
import { JSX } from 'react';
import GamePage from './GamePage';
import { useLoginContext } from '../LoginPage/LoginPage';
import { CreateGameRoomClient } from 'pureboard/client';

function CreateGamePage(): JSX.Element {
  const context = useLoginContext();
  const loginContext = useLoginContext();

  return (
    <CreateGameRoomClient
      token={context.userId}
      gameId="connect4"
      options={{ players: 2 }}
      onCreated={(id, password) => {
        const url = password ? `/joinGame/${id}/${password}` : `/game/${id}`;
        window.history.replaceState(null, 'Game', url);
        return Promise.resolve();
      }}
      onFailed={() => {
        loginContext.logout();
        return Promise.resolve();
      }}
    >
      <GamePage />;
    </CreateGameRoomClient>
  );
}

export default CreateGamePage;
