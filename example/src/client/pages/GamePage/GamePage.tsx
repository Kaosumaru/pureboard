import ConnectFour from './Connect4/ConnectFour';

import './GamePage.css';
import { GameRoomClient } from 'pureboard/client/gameRoomClient';
import { JSX, useEffect, useState } from 'react';
import { Main } from '@client/utils/Main';
import { Button } from '@mui/material';

export interface GameProps {
  client: GameRoomClient;
  userId: string;
}

export interface SpecificGameProps {
  gameRoomClient: GameRoomClient;
}

interface GameWrapperProps {
  client: GameRoomClient;
  userId: string;
  gameElement: (props: SpecificGameProps) => JSX.Element;
}

function getReconnectDelay(tries: number) {
  if (tries < 2) return 1000;
  return 5000;
}

function GameWrapper(props: GameWrapperProps): JSX.Element {
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

  return (
    <Main>
      <props.gameElement gameRoomClient={props.client} />
    </Main>
  );
}

function GamePage(props: GameProps) {
  const closed = props.client.store(state => state.closed);
  if (closed) {
    return (
      <Main>
        <h1>Game closed</h1>
      </Main>
    );
  }

  return <GameWrapper {...props} gameElement={ConnectFour} userId={props.userId} />;
}

export default GamePage;
