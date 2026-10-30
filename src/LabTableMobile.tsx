import * as React from 'react';
import Box from '@mui/material/Box';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import LabCalculator, { LabItem } from './services/lab-calculator';
import LabTableToolbar from './LabTableToolbar';
import { gridLocaleText } from './gridLocale';

// One column with the code above the name: the full study name is readable without scrolling sideways.
const columns: GridColDef<LabItem>[] = [
  {
    field: 'name',
    headerName: 'Estudio',
    flex: 1,
    minWidth: 0,
    editable: false,
    // Quick filter searches this value, so both the code and the name are matched.
    valueGetter: (_value, row) => `${row.code} ${row.name}`,
    renderCell: ({ row }) => (
      <Box sx={{ py: 1, lineHeight: 1.3, whiteSpace: 'normal' }}>
        <Box component="span" sx={{ display: 'block', fontWeight: 700 }}>{row.code}</Box>
        <Box component="span" sx={{ display: 'block', color: 'text.secondary' }}>{row.name}</Box>
      </Box>
    ),
  },
];

interface LabTableInputParams {
    rowSelectionModel: GridRowSelectionModel,
    setRowSelectionModel: (model: GridRowSelectionModel) => void
}

export default function LabTableMobile(
  { rowSelectionModel, setRowSelectionModel }: LabTableInputParams,
) {
  const pageSize = 5;
  return (
        <Box sx={{ width: '100%' }}>
            <DataGrid
                autoHeight
                rows={LabCalculator.getCurrentLabItems()}
                onRowSelectionModelChange={setRowSelectionModel}
                columns={columns}
                rowSelectionModel={rowSelectionModel}
                getRowHeight={() => 'auto'}
                getEstimatedRowHeight={() => 64}
                columnHeaderHeight={44}
                disableColumnMenu
                localeText={gridLocaleText}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize,
                    },
                  },
                }}
                pageSizeOptions={[pageSize]}
                checkboxSelection
                showToolbar
                slots={{ toolbar: LabTableToolbar }}
            />
        </Box>
  );
}
