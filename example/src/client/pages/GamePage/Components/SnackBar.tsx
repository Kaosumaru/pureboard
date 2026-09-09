import { useChat } from 'pureboard/client/clients/chatClient';
import { MessageAction } from 'pureboard/shared/stores/chatStore';
import { useCallback, useState } from 'react';
import { IconButton, Snackbar, SnackbarCloseReason } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
export interface SnackBarProps {
  currentThread?: string;
  onClick?: (user: string) => void;
}

export const SnackBar = (props: SnackBarProps) => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState('');
  const [message, setMessage] = useState('');

  const currentThread = props.currentThread;

  const { useOnAction } = useChat();

  const callback = useCallback(
    (action: MessageAction) => {
      if (action.type === 'message') {
        if (user === currentThread) return;
        setOpen(true);
        setUser(action.message.user.name);
        setMessage(`${action.message.user.name}: ${action.message.message}`);
      }
    },
    [currentThread]
  );

  useOnAction(callback);

  const handleClose = (_: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const action = (
    <IconButton onClick={handleClose}>
      <CloseIcon color="secondary" />
    </IconButton>
  );

  return (
    <div>
      <Snackbar
        sx={{ top: { xs: 0, sm: 70 } }}
        open={open}
        anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
        autoHideDuration={2000}
        onClose={handleClose}
        message={message}
        onClick={() => {
          if (props.onClick) props.onClick(user);
          setOpen(false);
        }}
        action={action}
      />
    </div>
  );
};
