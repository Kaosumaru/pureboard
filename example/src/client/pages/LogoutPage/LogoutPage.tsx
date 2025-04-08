import { Stack } from '@mui/material';
import { useEffect } from 'react';
import { useUserIdCookie } from '@client/api/auth';

function LogoutPage() {
  const [, , removeCookie] = useUserIdCookie();

  useEffect(() => {
    removeCookie();
  }, []);

  return (
    <Stack>
      <div>Logged out</div>
    </Stack>
  );
}

export default LogoutPage;
