import './LoginPage.css';
import { Backdrop, CircularProgress, Stack } from '@mui/material';
import { createContext, JSX, useCallback, useContext, useEffect, useState } from 'react';
import { useUserIdCookie } from '@client/api/auth';
import { Login } from '../GamePage/Components/Login';

export interface LoginProps {
  children?: JSX.Element | JSX.Element[];
}

export type GlobalContent = {
  logout: () => void;
  userId: string;
};

export const LoginContext = createContext<GlobalContent>({
  logout: () => {
    // do nothing
  },
  userId: '',
});

function LoginPage(props: LoginProps) {
  const [error, SetError] = useState<string | undefined>();
  const [checkingSession, SetCheckingSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [userIdCookieValue, setUserIdCookie, removeUserIdCookie] = useUserIdCookie();

  const handleLogin = useCallback((username: string) => {
    setIsLoading(true);

    if (username.length < 3) {
      SetError('Username must be at least 3 characters long');
      setIsLoading(false);
      return;
    }

    setUserIdCookie(username);
    setUserId(username);
    SetError(undefined);

    setIsLoggedIn(true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const cookie = userIdCookieValue;

    if (cookie) {
      setUserId(cookie);
      SetCheckingSession(false);
      setIsLoggedIn(true);
      setIsLoading(false);
    } else {
      SetCheckingSession(false);
    }
  }, []);

  if (checkingSession) {
    return (
      <Backdrop sx={theme => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })} open={checkingSession}>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  if (!isLoggedIn) {
    return (
      <Stack>
        <Login isLoading={isLoading} onLogin={handleLogin} error={error} />
      </Stack>
    );
  }

  const logout = () => {
    removeUserIdCookie();
    setIsLoggedIn(false);
    setIsLoading(false);
  };

  return <LoginContext.Provider value={{ logout, userId }}>{props.children}</LoginContext.Provider>;
}

export default LoginPage;
export const useLoginContext = () => useContext(LoginContext);
