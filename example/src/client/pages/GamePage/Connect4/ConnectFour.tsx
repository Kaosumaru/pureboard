import { Button } from '@mui/material';
import { ConnectFourClient } from './ConnectFourClient';
import ConnectFourSquare from './ConnectFourSquare';
import { createContent } from './interface';
import './styles.css';
import { GameRoomClient } from 'pureboard/client/gameRoomClient';
import { UserInfo } from 'pureboard/shared/gameRoomStore';
import { motion } from 'motion/react';
import ConnectFourOptions from './ConnectFourOptions';
import { useClient } from 'pureboard/client/react';
import GameTabs, { ETabs } from '../Components/GameTabs';
import { SpecificGameProps } from '../GamePage';

function createPlayer(seat: UserInfo | null, index: number, gameRoomClient: GameRoomClient) {
  if (seat) return <h2>{seat.name}</h2>;
  return (
    <h2>
      {'<empty>'}
      <Button
        variant="outlined"
        onClick={() => {
          void gameRoomClient.takeSeat(index);
        }}
      >
        Take seat
      </Button>
    </h2>
  );
}

function createPlayersRow(seats: (UserInfo | null)[], currentPlayer: number, gameRoomClient: GameRoomClient) {
  return (
    <div className="current-player-container">
      <motion.span style={{ display: 'inline' }} initial={false} animate={{ opacity: currentPlayer == 0 ? 1 : 0.3 }}>
        {createPlayer(seats[0], 0, gameRoomClient)}
        &nbsp;&nbsp;&nbsp;
        {createContent(1)}
      </motion.span>
      <h1>VS</h1>
      <motion.span style={{ display: 'inline' }} initial={false} animate={{ opacity: currentPlayer == 1 ? 1 : 0.3 }}>
        {createContent(2)}
        &nbsp;&nbsp;&nbsp;
        {createPlayer(seats[1], 1, gameRoomClient)}
      </motion.span>
    </div>
  );
}

function ConnectFourGame(props: SpecificGameProps & { client: ConnectFourClient }) {
  const client = props.client;

  const seats = props.gameRoomClient.store(state => state.seats);
  const board = client.store(state => state.board);
  const currentPlayer = client.store(state => state.currentPlayer);
  const winner = client.store(state => state.victoriousPlayer);
  const lastMoveColumn = client.store(state => state.lastMoveColumn);
  const lastMoveRow = client.store(state => state.lastMoveRow);

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
            void client.makeMove(colIdx);
          }}
        />
      );
    });
  });

  return (
    <div className="main-Page-Container">
      {winner !== -1 ? (
        <div className="current-player-container">
          <h1>Winner</h1>
          {createContent(winner + 1)}
        </div>
      ) : (
        createPlayersRow(seats, currentPlayer, props.gameRoomClient)
      )}
      <div className={'cf-Container'}>{fullBoard}</div>
    </div>
  );
}

export default function ConnectFour(props: SpecificGameProps) {
  const client = useClient(ConnectFourClient, props.gameRoomClient);

  const createComponent = (tab: ETabs) => {
    switch (tab) {
      case ETabs.Game:
        return <ConnectFourGame gameRoomClient={props.gameRoomClient} client={client} />;
      case ETabs.Settings:
        return <ConnectFourOptions gameRoomClient={props.gameRoomClient} client={client} />;
    }
    return <></>;
  };

  return <GameTabs gameClient={client} gameRoomClient={props.gameRoomClient} createComponent={createComponent} />;
}
