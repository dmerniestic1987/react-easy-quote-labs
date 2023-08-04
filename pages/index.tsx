import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ProTip from '../src/ProTip';
import Copyright from '../src/Copyright';
import LabTable from "../src/LabTable";

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          my: 4,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Centro Médico Vida y Fortaleza - Cotizaciones de Laboratorios
        </Typography>

        <ProTip />
        <LabTable />
        <Copyright />
      </Box>
    </Container>
  );
}
