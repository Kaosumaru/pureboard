import { useChat, useConnectionContext } from 'pureboard/client';
import { Badge, Stack, Tab, Tabs } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import CasinoIcon from '@mui/icons-material/Casino';
import SettingsIcon from '@mui/icons-material/Settings';
import { JSX, useState } from 'react';
import GameChat from './GameChat';
import { SnackBar } from './SnackBar';

export interface GameTabsProps {
  createComponent: (currentTab: ETabs) => JSX.Element;
  padding?: boolean;
}

export default function GameTabs(props: GameTabsProps): JSX.Element {
  const connection = useConnectionContext();

  const [tab, setTab] = useState<ETabs>(ETabs.Game);
  const { store: chatStore } = useChat();

  const messages = chatStore(state => state.messages);
  const [readMessages, setReadMessages] = useState(0);
  const unreadMessages = messages.length - readMessages;

  return (
    <>
      <TopBar tab={tab} setTab={setTab} unreadMessages={unreadMessages} />
      {(props.padding ?? true) && <Stack padding={1} />}
      {tab === ETabs.Chat && (
        <>
          <GameChat
            ownId={connection.userInfo?.id ?? ''}
            readMessages={readMessages}
            setReadMessages={setReadMessages}
          />
        </>
      )}
      {tab !== ETabs.Chat && <SnackBar onClick={() => setTab(ETabs.Chat)} />}
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
