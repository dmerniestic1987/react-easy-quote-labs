import * as React from 'react';
import Button from "@mui/material/Button";
import {RequestQuote} from "@mui/icons-material";
import { useRouter } from 'next/navigation';

export default function QuoteButton() {
    const router = useRouter();
    return (
      <div>
          <Button variant="contained" endIcon={<RequestQuote />} onClick={
              () => router.push('/summary')
          }>
              Cotizar
          </Button>
      </div>
  );
}
