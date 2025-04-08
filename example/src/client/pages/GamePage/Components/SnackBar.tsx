import { useEffect } from 'react';
import React from 'react';
import { IconButton, Snackbar, SnackbarCloseReason } from '@mui/material';
import { Signal } from 'typed-signals';
import CloseIcon from '@mui/icons-material/Close';

export interface SnackBarProps {
  currentThread?: string;
  onPrivMessage: Signal<(user: string, message: string) => void>;
  onClick?: (user: string) => void;
}

export const SnackBar = (props: SnackBarProps) => {
  const [open, setOpen] = React.useState(false);
  const [user, setUser] = React.useState('');
  const [message, setMessage] = React.useState('');

  const onPrivMessage = props.onPrivMessage;
  const currentThread = props.currentThread;

  useEffect(() => {
    const connection = onPrivMessage.connect((user, message) => {
      if (user === currentThread) return;
      setOpen(true);
      setUser(user);
      setMessage(`${user}: ${message}`);
    });

    return () => {
      connection.disconnect();
    };
  }, [onPrivMessage, currentThread]);

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
