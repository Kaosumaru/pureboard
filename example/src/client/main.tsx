import { createTheme, ThemeProvider } from '@mui/material';
import './index.css';
import '@fontsource/roboto/400.css';
import React from 'react';
import { CookiesProvider } from 'react-cookie';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage/LoginPage';
import LogoutPage from './pages/LogoutPage/LogoutPage';
import JoinGamePage from './pages/GamePage/JoinGamePage';
import CreateGamePage from './pages/GamePage/CreateGamePage';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CookiesProvider defaultSetOptions={{ path: '/' }}>
      <ThemeProvider theme={darkTheme}>
        <BrowserRouter>
          <Routes>
            <Route
              path="/joinGame/:id/:password"
              element={
                <LoginPage>
                  <JoinGamePage />
                </LoginPage>
              }
            />
            <Route path="/logout" element={<LogoutPage />} />
            <Route
              path="/"
              element={
                <LoginPage>
                  <CreateGamePage />
                </LoginPage>
              }
            />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </CookiesProvider>
  </React.StrictMode>
);
