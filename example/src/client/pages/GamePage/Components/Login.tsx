import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { Alert, Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { useState } from 'react';
export interface LoginProps {
  isLoading: boolean;
  title?: string;
  buttonText?: string;
  caption?: string;
  error?: string;
  onLogin?: (user: string) => void;
}

export const Login = (props: LoginProps) => {
  const paperStyle = { padding: 20, width: 280, margin: '19px auto' };

  const [username, setUsername] = useState('');

  // <FormControlLabel control={<Checkbox defaultChecked />} label="Remember Me" />
  return (
    <Grid>
      <Paper style={paperStyle}>
        <Grid>
          <Typography variant="h4">{props.title ?? 'Login'}</Typography>
          <Typography variant="caption">{props.caption}</Typography>
        </Grid>
        <TextField
          id="standard-login"
          value={username}
          disabled={props.isLoading}
          onChange={event => setUsername(event.target.value)}
          label="Username"
          variant="standard"
          placeholder="Enter Your Username"
          fullWidth
          required
        />

        <Box sx={{ m: 1, position: 'relative' }}>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={props.isLoading}
            fullWidth
            onClick={() => props.onLogin && props.onLogin(username)}
          >
            {props.buttonText ?? 'Login'}
          </Button>
          {props.isLoading && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
        {props.error && <Alert severity="error">{props.error}</Alert>}
      </Paper>
    </Grid>
  );
};
