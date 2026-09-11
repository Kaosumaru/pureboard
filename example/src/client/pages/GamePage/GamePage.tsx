import ConnectFour from './Connect4/ConnectFour';

import './GamePage.css';
import { Button } from '@mui/material';
import { Main } from '@client/utils/Main';
import { RoomConnectionState, useConnectionContext, useRoomConnectionState } from 'pureboard/client';

function GamePage() {
  const connectionState = useRoomConnectionState();
  const connection = useConnectionContext();

  switch (connectionState) {
    case RoomConnectionState.CLOSED:
      return (
        <Main>
          <h1>Game closed</h1>
        </Main>
      );
    case RoomConnectionState.CONNECTING:
      return (
        <Main>
          <h1>Connecting to game...</h1>
        </Main>
      );
    case RoomConnectionState.DISCONNECTED:
      return (
        <Main>
          <h1>Disconnected</h1>
          <Button
            onClick={() => {
              void connection.reconnect();
            }}
          >
            Reconnect
          </Button>
        </Main>
      );
    case RoomConnectionState.CONNECTED:
      break;
    default:
      return (
        <Main>
          <h1>Unknown connection state</h1>
        </Main>
      );
  }

  return (
    <Main>
      <ConnectFour />
    </Main>
  );
}

export default GamePage;
