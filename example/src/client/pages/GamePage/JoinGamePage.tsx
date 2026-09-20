import './GamePage.css';
import { JSX, useState } from 'react';
import { GameRoom, JoinGameRoomClient } from 'pureboard/client';
import { useParams } from 'react-router-dom';
import { ConnectionHelpers } from './ConnectionHelpers';
import { useLoginContext } from '../LoginPage/LoginPage';
import ConnectFour from './Connect4/ConnectFour';

function JoinGamePage(): JSX.Element {
  const context = useLoginContext();
  const [error, setError] = useState<string | undefined>(undefined);
  const params = useParams<{ id?: string; password?: string }>();
  const roomId = Number(params.id);

  if (error) {
    return <>{error}</>;
  }

  if (!params.id) {
    return <>Invalid game id</>;
  }

  return (
    <JoinGameRoomClient
      token={context.userId}
      roomId={roomId}
      password={params.password}
      onFailed={err => {
        setError(err.message);
        return Promise.resolve();
      }}
    >
      <ConnectionHelpers />;
      <GameRoom.Connected>
        <ConnectFour />
      </GameRoom.Connected>
    </JoinGameRoomClient>
  );
}

export default JoinGamePage;
