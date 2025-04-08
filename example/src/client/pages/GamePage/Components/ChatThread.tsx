/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Button, Stack, TextField } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import SendIcon from '@mui/icons-material/Send';
import { Message } from './Message';

const Main = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin: 0;
`;

const StyledStack = styled(Stack)`
  flex-grow: 1;
  overflow-y: scroll;
`;

const FlexGrow = styled.div`
  flex-grow: 1;
`;

const Flex = styled.div`
  display: flex;
  align-items: stretch;
`;

export interface ChatThreadEntry {
  key?: React.Key;
  nickname?: string;
  imageUrl?: string;
  message: string;
  own: boolean;
}

export interface ChatThreadProps {
  entries: ChatThreadEntry[];
  unread?: boolean;
  onSendMessage?: (message: string) => void;
  onRead?: () => void;
}

export const ChatThread = (props: ChatThreadProps) => {
  const [text, setText] = useState('');
  const stackRef = useRef<HTMLDivElement>(null);
  const unread = props.unread;
  const onRead = props.onRead;

  const sendMessage = () => {
    if (!text) return;
    if (props.onSendMessage) props.onSendMessage(text);
    setText('');
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === 'Enter') sendMessage();
  };

  useEffect(() => {
    if (stackRef.current) {
      stackRef.current.scrollTop = stackRef.current.scrollHeight;
    }
    if (unread && onRead) onRead();
  }, [props.entries, unread, onRead]);

  return (
    <Main>
      <StyledStack spacing={0.5} alignItems="center" ref={stackRef}>
        {props.entries.map(entry => (
          <Message
            key={entry.key}
            text={entry.message}
            own={entry.own}
            nickname={entry.nickname}
            imageUrl={entry.imageUrl}
          />
        ))}
      </StyledStack>
      <Stack spacing={0.5}>
        <Flex>
          <FlexGrow>
            <TextField
              fullWidth
              id="chat-input"
              autoComplete="off"
              variant="outlined"
              value={text}
              onChange={event => setText(event.target.value)}
              onKeyDown={onKeyDown}
            />
          </FlexGrow>
          <Button variant="contained" endIcon={<SendIcon />} onClick={sendMessage} />
        </Flex>
      </Stack>
    </Main>
  );
};
