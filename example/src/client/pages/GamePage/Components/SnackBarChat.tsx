import { SnackBar } from './SnackBar';

export interface SnackBarProps {
  onClick?: (user: string) => void;
}

export const SnackBarChat = (props: SnackBarProps) => {
  return <SnackBar currentThread={undefined} onClick={props.onClick} />;
};
