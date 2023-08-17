import * as React from 'react';
import { Alert } from '@mui/material';
import Typography from '@mui/material/Typography';

export default function TotalQuote(props: any) {
  return (
      <Alert sx={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
      }} severity="info" >
          <Typography variant="h5" component="h1" gutterBottom align="center">
              {props.description}: $ {props.totalQuote}
          </Typography>
      </Alert>
  );
}
