import * as React from 'react';
import {Paper} from "@mui/material";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function TotalQuote({ totalQuote }) {
  return (
      <Paper elevation={3}>
          <Box alignItems="center">
              <Typography variant="h4" component="h1" gutterBottom>Total: {totalQuote}</Typography>
          </Box>
      </Paper>
  );
}
