import { Chip, Typography } from '@mui/material';

export interface MessageProps {
  nickname?: string;
  imageUrl?: string;
  text: string;
  own: boolean;
}

export const Message = (props: MessageProps) => {
  const label = props.imageUrl ? (
    <img src={props.imageUrl}></img>
  ) : (
    <Typography variant="body2">
      {props.nickname && <b>{props.nickname}: </b>}
      {props.text}
    </Typography>
  );

  return (
    <Chip
      sx={{
        alignSelf: props.own ? 'flex-end' : 'flex-start',
        backgroundColor: props.own ? '#b0b0b060' : '#00000060',
        height: 'auto',
        '& .MuiChip-label': {
          display: 'block',
          whiteSpace: 'normal',
          margin: 0.5,
        },
      }}
      label={label}
      variant={props.own ? 'filled' : 'outlined'}
    />
  );
};
