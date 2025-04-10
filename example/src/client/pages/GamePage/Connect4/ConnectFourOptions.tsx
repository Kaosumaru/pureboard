import { Button, Stack } from '@mui/material';
import { GameRoomClient } from 'pureboard/client/gameRoomClient';
import { ConnectFourClient } from './ConnectFourClient';
import { useLoginContext } from '@client/pages/LoginPage/LoginPage';

export interface ConnectFourOptionsProps {
  gameRoomClient: GameRoomClient;
  client: ConnectFourClient;
}

export default function ConnectFourOptions(props: ConnectFourOptionsProps) {
  const winner = props.client.store(state => state.victoriousPlayer);
  const context = useLoginContext();

  return (
    <Stack spacing={2}>
      {winner === -1 && (
        <Button
          variant="outlined"
          onClick={() => {
            void props.client.surrender();
          }}
        >
          Surrender
        </Button>
      )}
      {winner !== -1 && (
        <Button
          variant="outlined"
          onClick={() => {
            void props.client.newGame();
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
