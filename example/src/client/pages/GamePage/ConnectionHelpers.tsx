import { Button } from '@mui/material';
import { Main } from '@client/utils/Main';
import { GameRoom, useConnectionContext } from 'pureboard/client';

export function ConnectionHelpers() {
  const connection = useConnectionContext();

  return (
    <>
      <GameRoom.Disconnected>
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
      </GameRoom.Disconnected>
      <GameRoom.Connecting>
        <Main>
          <h1>Connecting to game...</h1>
        </Main>
      </GameRoom.Connecting>
      <GameRoom.Closed>
        <Main>
          <h1>Game closed</h1>
        </Main>
      </GameRoom.Closed>
    </>
  );
}
