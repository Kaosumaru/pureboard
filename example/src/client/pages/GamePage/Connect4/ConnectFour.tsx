import ConnectFourSquare, { createFieldToken } from './ConnectFourSquare';
import './styles.css';
import { ChatProvider } from 'pureboard/client';
import ConnectFourOptions from './ConnectFourOptions';
import GameTabs, { ETabs } from '../Components/GameTabs';
import { ConnectFourProvider, useConnect4 } from './ConnectFourContext';
import { PlayersRow } from './ConnectFourPlayersRow';

function ConnectFourGame() {
  const { store, action } = useConnect4();
  const board = store(state => state.board);
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
    <PlayersRow />
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
