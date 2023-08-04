import * as React from 'react';
import Button from "@mui/material/Button";
import {RequestQuote} from "@mui/icons-material";
import {Paper} from "@mui/material";

export default function TotalQuote({ totalQuote }) {
  return (
      <Paper elevation={3}>
          <div>
            <h1>Total: {totalQuote}</h1>
          </div>
      </Paper>
  );
}
