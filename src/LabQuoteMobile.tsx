import * as React from 'react';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import type { GridRowSelectionModel } from '@mui/x-data-grid';
import type { LabItem } from './services/lab-calculator';
import TotalQuote from '../src/TotalQuote';
import LabHeader from '../src/LabHeader';
import LabTableMobile from './LabTableMobile';
import LabMiniSummaryMobile from './LabMiniSummaryMobile';

export type LabQuoteMobileProps = {
  /** The selection lives in the parent, so it survives navigating between steps and reloads. */
  rowSelectionModel: GridRowSelectionModel;
  onRowSelectionModelChange: (model: GridRowSelectionModel) => void;
  selectedLabs: LabItem[];
  suggestedTotalFormatted: string;
  onRemove: (item: LabItem) => void;
};

export default function LabQuoteMobile({
  rowSelectionModel,
  onRowSelectionModelChange,
  selectedLabs,
  suggestedTotalFormatted,
  onRemove,
}: LabQuoteMobileProps) {
  return (
    <Container maxWidth="xl" disableGutters>
      <Stack spacing={2}>
        <LabHeader title={'CEMEVYF: Octubre 2026'} subTitle={'Cotización de Laboratorios 1.35'} />
        <LabTableMobile
              rowSelectionModel={rowSelectionModel}
              setRowSelectionModel={onRowSelectionModelChange}/>
        <LabMiniSummaryMobile selectedLabItems={selectedLabs} onRemove={onRemove}/>
        <TotalQuote description={'Total sugerido'} totalQuote={suggestedTotalFormatted}/>
      </Stack>
    </Container>
  );
}
