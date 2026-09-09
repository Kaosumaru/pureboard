import { Button } from '@mui/material';
import { motion } from 'motion/react';
import { createFieldToken } from './ConnectFourSquare';
import { useConnect4 } from './ConnectFourContext';
import { SeatingInterface, useSeatingContext } from 'pureboard/client';
import { UserInfo } from 'pureboard/shared';

function createPlayer(seat: UserInfo | null, index: number, seats: SeatingInterface) {
  if (seat) return <h2>{seat.name}</h2>;
  return (
    <h2>
      {'<empty>'}
      <Button
        variant="outlined"
        onClick={() => {
          void seats.takeSeat(index);
        }}
      >
        Take seat
      </Button>
    </h2>
  );
}

export function PlayersRow() {
  const { store } = useConnect4();
  const currentPlayer = store(state => state.currentPlayer);
  const seat = useSeatingContext();
  const seats = seat.store(state => state.seats);

  return (
    <div className="current-player-container">
      <motion.span style={{ display: 'inline' }} initial={false} animate={{ opacity: currentPlayer == 0 ? 1 : 0.3 }}>
        {createPlayer(seats[0], 0, seat)}
        &nbsp;&nbsp;&nbsp;
        {createFieldToken(1)}
      </motion.span>
      <h1>VS</h1>
      <motion.span style={{ display: 'inline' }} initial={false} animate={{ opacity: currentPlayer == 1 ? 1 : 0.3 }}>
        {createFieldToken(2)}
        &nbsp;&nbsp;&nbsp;
        {createPlayer(seats[1], 1, seat)}
      </motion.span>
    </div>
  );
}
