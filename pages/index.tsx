import * as React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import ProTip from '../src/ProTip';
import LabTable from "../src/LabTable";
import QuoteButton from "../src/QuoteButton";
import Grid from "@mui/system/Unstable_Grid";
import LabMiniSummary from "../src/LabMiniSummary";
import {LabItem} from "../src/services/lab-calculator";
import {useState} from "react";

export default function Home() {
  const [selectedLabs, setSelectedLabs] = useState([] as LabItem[]);
  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          my: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <h1>Centro Médico Vida y Fortaleza</h1>
        <h2>Cotizaciones de Laboratorios</h2>
        <ProTip />
      </Box>
      <Grid container spacing={2}>
          <Grid xs={7}>
              <LabTable setSelectedLabItems={setSelectedLabs}/>
          </Grid>
          <Grid xs={4}>
              <LabMiniSummary selectedLabItems = {selectedLabs} />
          </Grid>
      </Grid>
      <QuoteButton />
    </Container>
  );
}
