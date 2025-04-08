import { SnackBar } from './SnackBar';
import { ChatClient } from 'pureboard/client/clients/chatClient';

export interface SnackBarProps {
  client: ChatClient;
  onClick?: (user: string) => void;
}

export const SnackBarChat = (props: SnackBarProps) => {
  return <SnackBar currentThread={undefined} onPrivMessage={props.client.onExternalMessage} onClick={props.onClick} />;
};
