import { Button } from '@mui/material';
import ConnectFourSquare, { createFieldToken } from './ConnectFourSquare';
import './styles.css';
import { ChatProvider, SeatingInterface, useSeatingContext } from 'pureboard/client';
import { UserInfo } from 'pureboard/shared';
import { motion } from 'motion/react';
import ConnectFourOptions from './ConnectFourOptions';
import GameTabs, { ETabs } from '../Components/GameTabs';
import { ConnectFourProvider, useConnect4 } from './ConnectFourContext';

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

function createPlayersRow(seats: (UserInfo | null)[], currentPlayer: number, seat: SeatingInterface) {
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

function ConnectFourGame() {
  const seating = useSeatingContext();

  const seats = seating.store(state => state.seats);

  const { store, action } = useConnect4();
  const board = store(state => state.board);
  const currentPlayer = store(state => state.currentPlayer);
  const winner = store(state => state.victoriousPlayer);
  const lastMoveColumn = store(state => state.lastMoveColumn);
  const lastMoveRow = store(state => state.lastMoveRow);

  const fullBoard = board.map((row, rowIdx) => {
    return row.map((_, colIdx) => {
      const isLastMove = lastMoveColumn === colIdx && lastMoveRow === rowIdx;
      return (
        <ConnectFourSquare
          key={`${colIdx}_${rowIdx}`}
          colIdx={colIdx}
          rowIdx={rowIdx}
          field={board[rowIdx][colIdx]}
          isLastMove={isLastMove}
          onClick={(_, colIdx) => {
            void action({ type: 'move', column: colIdx });
          }}
        />
      );
    });
  });

  const hasWinner = winner !== -1;
  const topRowComponent = hasWinner ? (
    <div className="current-player-container">
      <h1>Winner</h1>
      {createFieldToken(winner + 1)}
    </div>
  ) : (
    createPlayersRow(seats, currentPlayer, seating)
  );

  return (
    <div className="main-Page-Container">
      {topRowComponent}
      <div className={'cf-Container'}>{fullBoard}</div>
    </div>
  );
}

export default function ConnectFour() {
  const createComponent = (tab: ETabs) => {
    switch (tab) {
      case ETabs.Game:
        return <ConnectFourGame />;
      case ETabs.Settings:
        return <ConnectFourOptions />;
    }
    return <></>;
  };

  return (
    <ConnectFourProvider>
      <ChatProvider>
        <GameTabs createComponent={createComponent} />
      </ChatProvider>
    </ConnectFourProvider>
  );
}
