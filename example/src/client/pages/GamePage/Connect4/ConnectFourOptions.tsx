import { Button, Stack } from '@mui/material';
import { useLoginContext } from '@client/pages/LoginPage/LoginPage';
import { useConnect4 } from './ConnectFourClient';
import { GameRoomContext } from 'pureboard/client/react';
import { useContext } from 'react';

export default function ConnectFourOptions() {
  const gameRoomClient = useContext(GameRoomContext);
  const { store, action } = useConnect4();

  const winner = store(state => state.victoriousPlayer);
  const context = useLoginContext();

  return (
    <Stack spacing={2}>
      {winner === -1 && (
        <Button
          variant="outlined"
          onClick={() => {
            void action({ type: 'surrender', player: gameRoomClient?.seatOf() ?? 0 });
          }}
        >
          Surrender
        </Button>
      )}
      {winner !== -1 && (
        <Button
          variant="outlined"
          onClick={() => {
            void action({ type: 'newGame' });
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
