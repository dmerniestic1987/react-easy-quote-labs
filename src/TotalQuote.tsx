import * as React from 'react';
import {Paper} from "@mui/material";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function TotalQuote(props: any) {
  return (
      <Paper elevation={3} >
          <Box>
              <Typography variant="h5" component="h1" gutterBottom align="center">
                  {props.description}: $ {props.totalQuote}
              </Typography>
          </Box>
      </Paper>
  );
}
