import { Button, Stack } from '@mui/material';
import { useLoginContext } from '@client/pages/LoginPage/LoginPage';
import { useContext } from 'react';
import { ConnectFourContext } from './ConnectFour';

export default function ConnectFourOptions() {
  const client = useContext(ConnectFourContext);

  if (!client) {
    throw new Error('ConnectFourGame must be used within a GameRoomProvider and ConnectFourProvider');
  }

  const winner = client.store(state => state.victoriousPlayer);
  const context = useLoginContext();

  return (
    <Stack spacing={2}>
      {winner === -1 && (
        <Button
          variant="outlined"
          onClick={() => {
            void client.surrender();
          }}
        >
          Surrender
        </Button>
      )}
      {winner !== -1 && (
        <Button
          variant="outlined"
          onClick={() => {
            void client.newGame();
          }}
        >
          New Game
        </Button>
      )}
      {
        <Button
          variant="outlined"
          onClick={() => {
            context.logout();
          }}
        >
          Logout
        </Button>
      }
    </Stack>
  );
}
