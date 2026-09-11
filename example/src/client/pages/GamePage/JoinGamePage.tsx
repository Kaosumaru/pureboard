import './GamePage.css';
import { JSX, useState } from 'react';
import { JoinGameRoomClient } from 'pureboard/client';
import { useParams } from 'react-router-dom';
import GamePage from './GamePage';
import { useLoginContext } from '../LoginPage/LoginPage';

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
      <GamePage />;
    </JoinGameRoomClient>
  );
}

export default JoinGamePage;
