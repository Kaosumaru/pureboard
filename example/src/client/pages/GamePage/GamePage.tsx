import ConnectFour from './Connect4/ConnectFour';

import './GamePage.css';
import { JSX } from 'react';
import { Main } from '@client/utils/Main';
import { useSeatingContext } from 'pureboard/client/react';

export interface GameProps {
  userId: string;
}

interface GameWrapperProps {
  userId: string;
  gameElement: () => JSX.Element;
}

/*function getReconnectDelay(tries: number) {
  if (tries < 2) return 1000;
  return 5000;
}
*/

function GameWrapper(props: GameWrapperProps): JSX.Element {
  // TODO client should manage autoreconnect
  /*
  const [disconnected, setDisconnected] = useState(false);
  const [autoreconnecting, setAutoreconnecting] = useState(false);
  const [triesToConnect, setTriesToConnect] = useState(0);

  useEffect(() => {
    
    const connection = props.client.onDisconnected(() => setDisconnected(true));
    const connection2 = props.client.onAuthorized(() => {
      setDisconnected(false);
      setAutoreconnecting(false);
    });
    return () => {
      connection.disconnect();
      connection2.disconnect();
    };
  }, [props.client]);

  useEffect(() => {
    if (!disconnected) {
      setAutoreconnecting(false);
      setTriesToConnect(0);
      return;
    }
    if (triesToConnect > 5) {
      setAutoreconnecting(false);
      return;
    }
    setAutoreconnecting(true);
    const timer = setTimeout(() => {
      props.client.reconnect(props.userId).catch(err => {
        console.log(err);
        setDisconnected(true);
        setTriesToConnect(triesToConnect + 1);
      });
    }, getReconnectDelay(triesToConnect));
    return () => clearTimeout(timer);
  }, [disconnected, triesToConnect]);

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
            void props.client.reconnect(props.userId);
          }}
        >
          Reconnect
        </Button>
      </Main>
    );
  }
  */
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
