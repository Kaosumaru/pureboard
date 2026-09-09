import ConnectFour from './Connect4/ConnectFour';

import './GamePage.css';
import { JSX } from 'react';
import { Button } from '@mui/material';
import { Main } from '@client/utils/Main';
import { useConnectionContext, useSeatingContext } from 'pureboard/client/react';

export interface GameProps {
  userId: string;
}

interface GameWrapperProps {
  userId: string;
  gameElement: () => JSX.Element;
}

function GameWrapper(props: GameWrapperProps): JSX.Element {
  const connection = useConnectionContext();
  const disconnected = connection.connectionStore(state => state.disconnected);
  const autoreconnecting = connection.connectionStore(state => state.autoreconnecting);

  if (autoreconnecting) {
    return (
      <Main>
        <h1>Disconnected, reconnecting...</h1>
      </Main>
    );
  }

  if (disconnected) {
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
  }

  return (
    <Main>
      <props.gameElement />
    </Main>
  );
}

function GamePage(props: GameProps) {
  const seating = useSeatingContext();
  const closed = seating.store(state => state.closed);
  if (closed) {
    return (
      <Main>
        <h1>Game closed</h1>
      </Main>
    );
  }

  const gameId = seating.store(state => state.id);
  // TODO handle the case where the game ID is not yet available more gracefully
  if (gameId == -1) {
    return (
      <Main>
        <h1>Connecting to game...</h1>
      </Main>
    );
  }

  return <GameWrapper {...props} gameElement={ConnectFour} userId={props.userId} />;
}

export default GamePage;
