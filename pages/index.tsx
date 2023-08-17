import * as React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import ProTip from '../src/ProTip';
import LabTable from "../src/LabTable";
import Grid from "@mui/system/Unstable_Grid";
import LabMiniSummary from "../src/LabMiniSummary";
import LabCalculator, {LabItem} from "../src/services/lab-calculator";
import {useState} from "react";
import {GridRowSelectionModel} from "@mui/x-data-grid";
import TotalQuote from "../src/TotalQuote";
import BigNumber from "bignumber.js";
import MathUtils from "../src/services/math-utils";
import LabHeader from "../src/LabHeader";

export default function Home() {
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
  const [selectedLabs, setSelectedLabs] = useState([] as LabItem[]);
  const total = LabCalculator.getTotalAmount(selectedLabs);
  const suggestedTotal = new BigNumber(MathUtils.roundToNearestHundred(total.toNumber()));
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
      <LabHeader title={'Centro Médico Vida y Fortaleza'} subTitle={'Cotizaciones de Laboratorios'} />
      <Grid container spacing={2} sx={{
          justifyContent: 'center',
          alignItems: 'center',
          my: 2,
      }}>
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
          <TotalQuote xs={11} description={'Total Sugerido'} totalQuote={suggestedTotal.toFormat(0)}/>
      </Grid>


    </Container>
  );
}
