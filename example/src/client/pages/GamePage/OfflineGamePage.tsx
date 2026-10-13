import './GamePage.css';
import { JSX } from 'react';
import { Button, Stack } from '@mui/material';
import { CreateOfflineGameRoomClient } from 'pureboard/client';
import { Action } from '@shared/stores/connectFourStore';
import { Main } from '@client/utils/Main';
import { ConnectFourGame } from './Connect4/ConnectFour';
import { ConnectFourOfflineProvider, useConnect4 } from './Connect4/ConnectFourContext';

function NewGameButton(): JSX.Element {
  const { store, action } = useConnect4();
  const winner = store(state => state.victoriousPlayer);

  if (winner === -1) return <></>;
  return (
    <Stack padding={4} alignItems="center">
      <Button
        variant="outlined"
        onClick={() => {
          void action({ type: 'newGame' });
        }}
      >
        New Game
      </Button>
    </Stack>
  );
}

// Serverless version of the game
function OfflineGamePage(): JSX.Element {
  return (
    <CreateOfflineGameRoomClient<Action> options={{ players: 2 }} initialAction={() => ({ type: 'newGame' })}>
      <Main>
        <ConnectFourOfflineProvider>
          <ConnectFourGame />
          <NewGameButton />
        </ConnectFourOfflineProvider>
      </Main>
    </CreateOfflineGameRoomClient>
  );
}

export default OfflineGamePage;
