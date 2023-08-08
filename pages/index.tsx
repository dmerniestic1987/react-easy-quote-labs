import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ProTip from '../src/ProTip';
import LabTable from "../src/LabTable";
import QuoteButton from "../src/QuoteButton";

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          my: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" component="h1">Centro Médico Vida y Fortaleza</Typography>
        <h2>Cotizaciones de Laboratorios</h2>
        <ProTip />
        <LabTable />
        <QuoteButton />
      </Box>
    </Container>
  );
}
