import { Button, Stack } from '@mui/material';
import { GameRoomClient } from 'pureboard/client/gameRoomClient';
import { ConnectFourClient } from './ConnectFourClient';

export interface ConnectFourOptionsProps {
  gameRoomClient: GameRoomClient;
  client: ConnectFourClient;
}

export default function ConnectFourOptions(props: ConnectFourOptionsProps) {
  const winner = props.client.store(state => state.victoriousPlayer);

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
    </Stack>
  );
}
