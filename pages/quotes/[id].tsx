import * as React from 'react';
import { useRouter } from 'next/router';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import QuoteDetail from '../../src/quotes/QuoteDetail';

export default function QuoteDetailPage() {
  const { isReady, query } = useRouter();
  if (!isReady) return null;
  const id = Number(query.id);
  if (!Number.isInteger(id) || id < 1) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="error">El número de cotización no es válido.</Alert>
      </Container>
    );
  }
  return <QuoteDetail id={id} />;
}
