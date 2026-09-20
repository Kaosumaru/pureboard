import { useSendChatMessage, useChat } from 'pureboard/client';
import { Message } from 'pureboard/shared';
import { ChatThread, ChatThreadEntry } from './ChatThread';

export interface GameChatProps {
  ownId: string;

  onSendMessage?: (message: string) => void;

  readMessages: number;
  setReadMessages: (amount: number) => void;
}

function messagesToChatEntries(messages: Message[], props: GameChatProps): ChatThreadEntry[] {
  return messages.map((message, index) => ({
    key: index,
    nickname: message.user.name,
    message: message.message,
    own: message.user.id === props.ownId,
  }));
}

export default function GameChat(props: GameChatProps) {
  const { store: chatStore } = useChat();
  const sendChatMessage = useSendChatMessage();
  const messages = chatStore(state => state.messages);

  const unreadMessages = messages.length - props.readMessages;

  return (
    <ChatThread
      unread={unreadMessages > 0}
      onRead={() => props.setReadMessages(messages.length)}
      entries={messagesToChatEntries(messages, props)}
      onSendMessage={message => {
        if (props.onSendMessage) {
          props.onSendMessage(message);
        }

        void sendChatMessage(message);
      }}
    />
  );
}
