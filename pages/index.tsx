import * as React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import ProTip from '../src/ProTip';
import LabTable from "../src/LabTable";
import Grid from "@mui/system/Unstable_Grid";
import LabMiniSummary from "../src/LabMiniSummary";
import {LabItem} from "../src/services/lab-calculator";
import {useState} from "react";
import {GridRowSelectionModel} from "@mui/x-data-grid";

export default function Home() {
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
  const [selectedLabs, setSelectedLabs] = useState([] as LabItem[]);

  const deleteSelectedRowSelectionModel = (
      itemToDelete: LabItem,
      selectedRowItems: GridRowSelectionModel = rowSelectionModel,
      setRowSelectionModelState: Function = setRowSelectionModel
  ) => {
      const filtered = selectedRowItems.filter(selectedRowItem => { return Number(selectedRowItem) !== itemToDelete.id });
      setRowSelectionModelState(filtered);
  };

  const deleteSelectedLabItem = (
      itemToDelete: LabItem,
      labItems: LabItem[] = selectedLabs,
      setSelectedLabsState: Function = setSelectedLabs,
  ) => {
    const selectedItemsAfterDelete: LabItem[] = labItems.filter(labItems => {
        return labItems.id !== itemToDelete.id;
    });
    setSelectedLabsState(selectedItemsAfterDelete);
  };
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
              <LabTable
                  rowSelectionModel={rowSelectionModel}
                  setSelectedLabItems={setSelectedLabs}
                  setRowSelectionModel={setRowSelectionModel}/>
          </Grid>
          <Grid xs={4}>
              <LabMiniSummary selectedLabItems = {selectedLabs}
                              deleteSelectedLabItem={deleteSelectedLabItem}
                              deleteSelectedRowSelectionModel={deleteSelectedRowSelectionModel}/>
          </Grid>
      </Grid>
    </Container>
  );
}
