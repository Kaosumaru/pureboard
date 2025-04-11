import { GameRoomClient } from 'pureboard/client/gameRoomClient';
import { Badge, Stack, Tab, Tabs } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import CasinoIcon from '@mui/icons-material/Casino';
import SettingsIcon from '@mui/icons-material/Settings';
import { JSX, useState } from 'react';
import { ChatClient } from 'pureboard/client/clients/chatClient';
import { SnackBarChat } from './SnackBarChat';
import GameChat from './GameChat';
import { useClient } from 'pureboard/client/react';
import { IBaseComponentClient } from 'pureboard/client/interface';

export interface GameTabsProps {
  gameClient: IBaseComponentClient;
  gameRoomClient: GameRoomClient;
  createComponent: (currentTab: ETabs) => JSX.Element;
  padding?: boolean;
}

export default function GameTabs(props: GameTabsProps): JSX.Element {
  const [tab, setTab] = useState<ETabs>(ETabs.Game);
  const chatClient = useClient(ChatClient, props.gameRoomClient);

  const messages = chatClient.store(state => state.messages);
  const [readMessages, setReadMessages] = useState(0);
  const unreadMessages = messages.length - readMessages;

  return (
    <>
      <TopBar tab={tab} setTab={setTab} unreadMessages={unreadMessages} />
      {(props.padding ?? true) && <Stack padding={1} />}
      {tab === ETabs.Chat && (
        <>
          <GameChat
            client={chatClient}
            ownId={props.gameRoomClient.userInfo?.id ?? ''}
            readMessages={readMessages}
            setReadMessages={setReadMessages}
          />
        </>
      )}
      {tab !== ETabs.Chat && <SnackBarChat client={chatClient} onClick={() => setTab(ETabs.Chat)} />}
      {props.createComponent(tab)}
    </>
  );
}

interface TopBarProps {
  unreadMessages: number;
  tab: ETabs;
  setTab: (tab: ETabs) => void;
}

export enum ETabs {
  Game,
  Chat,
  Settings,
}

function TopBar(props: TopBarProps) {
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    props.setTab(newValue);
  };

  return (
    <Tabs
      sx={{ minHeight: '72px', maxHeight: '72px' }}
      value={props.tab}
      variant="fullWidth"
      onChange={handleChange}
      aria-label="icon label tabs example"
    >
      <Tab icon={<CasinoIcon />} label="GAME" />
      <Tab
        icon={
          <Badge badgeContent={props.unreadMessages} color="secondary">
            <MessageIcon />
          </Badge>
        }
        label="CHAT"
      />
      <Tab icon={<SettingsIcon />} label="SETTINGS" />
    </Tabs>
  );
}
