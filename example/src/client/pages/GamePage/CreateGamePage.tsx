import './GamePage.css';
import { JSX } from 'react';
import { ConnectionHelpers } from './ConnectionHelpers';
import { useLoginContext } from '../LoginPage/LoginPage';
import { CreateGameRoomClient, GameRoom } from 'pureboard/client';
import { Main } from '@client/utils/Main';
import ConnectFour from './Connect4/ConnectFour';

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
      <Main>
        <ConnectionHelpers />
        <GameRoom.Connected>
          <ConnectFour />
        </GameRoom.Connected>
      </Main>
    </CreateGameRoomClient>
  );
}

export default CreateGamePage;
