import { Stack } from '@mui/material';
import { isMobileSafari } from 'react-device-detect';
import styled from 'styled-components';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export const Main = styled(Stack)`
  height: 100vh;
  height: ${isMobileSafari ? '80vh' : '100vh'};
  ${isMobileSafari ? 'min-height: -webkit-fill-available;' : ''}
`;
