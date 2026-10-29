import * as React from 'react';
import Container from '@mui/material/Container';
import LabTableDesktop from "../src/LabTableDesktop";
import Grid from "@mui/material/Grid";
import LabMiniSummaryDesktop from "../src/LabMiniSummaryDesktop";
import LabCalculator, {LabItem} from "../src/services/lab-calculator";
import {useState} from "react";
import {GridRowSelectionModel} from "@mui/x-data-grid";
import TotalQuote from "../src/TotalQuote";
import BigNumber from "bignumber.js";
import MathUtils from "../src/services/math-utils";
import LabHeader from "../src/LabHeader";
import PrescriptionPicker from "../src/prescriptions/PrescriptionPicker";

export default function LabQuoteDesktop() {
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const [selectedLabs, setSelectedLabs] = useState([] as LabItem[]);
  const total = LabCalculator.getTotalAmount(selectedLabs);
  const suggestedTotal = new BigNumber(MathUtils.roundToNearestHundred(total.toNumber()));
  const deleteSelectedRowSelectionModel = (
      itemToDelete: LabItem,
      selectedRowItems: GridRowSelectionModel = rowSelectionModel,
      setRowSelectionModelState: Function = setRowSelectionModel
  ) => {
      const ids = new Set(selectedRowItems.ids);
      ids.delete(itemToDelete.id);
      setRowSelectionModelState({ ...selectedRowItems, ids });
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
      <LabHeader title={'CEMEVYF - Labos'} subTitle={'Cotizaciones - Labo Octubre 2026 1.35'} />
      <Grid container spacing={2} sx={{
          justifyContent: 'center',
          alignItems: 'center',
          my: 2,
      }}>
          <Grid size={6}>
              <LabTableDesktop
                  rowSelectionModel={rowSelectionModel}
                  setSelectedLabItems={setSelectedLabs}
                  setRowSelectionModel={setRowSelectionModel}/>
          </Grid>
          <Grid size={4}>
              <LabMiniSummaryDesktop selectedLabItems = {selectedLabs}
                                     deleteSelectedLabItem={deleteSelectedLabItem}
                                     deleteSelectedRowSelectionModel={deleteSelectedRowSelectionModel}/>
          </Grid>
          <Grid size={10} sx={{ display: 'flex', justifyContent: 'center' }}>
              <TotalQuote description={'Total sugerido'} totalQuote={suggestedTotal.toFormat(0)}/>
          </Grid>
          <Grid size={10}>
              <PrescriptionPicker variant="desktop" />
          </Grid>
      </Grid>
    </Container>
  );
}
