import * as React from 'react';
import Button from "@mui/material/Button";
import {RequestQuote} from "@mui/icons-material";

export default function QuoteButton() {
  return (
      <div>
          <Button variant="contained" endIcon={<RequestQuote />}>
              Cotizar
          </Button>
      </div>
  );
}
