import * as React from 'react';
import Box from '@mui/material/Box';
import {
  DataGrid,
  GridColDef, GridRowSelectionModel,
} from '@mui/x-data-grid';
import LabCalculator, { LabItem } from './services/lab-calculator';
import LabTableToolbar from './LabTableToolbar';
import { gridLocaleText } from './gridLocale';

const priceFormat = new Intl.NumberFormat('es-AR');

const columns: GridColDef<LabItem>[] = [
  {
    field: 'code',
    headerName: 'Abreviatura',
    width: 130,
    editable: false,
  },
  {
    field: 'name',
    headerName: 'Estudio de Laboratorio',
    flex: 1,
    minWidth: 220,
    editable: false,
  },
  {
    field: 'price',
    headerName: 'Precio',
    type: 'number',
    width: 110,
    editable: false,
    valueFormatter: (value: number) => `$ ${priceFormat.format(value)}`,
  },
];

interface LabTableInputParams {
    rowSelectionModel: GridRowSelectionModel,
    setRowSelectionModel: (model: GridRowSelectionModel) => void
}

export default function LabTableDesktop(
  { rowSelectionModel, setRowSelectionModel }: LabTableInputParams,
) {
  return (
        <Box sx={{ width: '100%' }}>
            <DataGrid
                autoHeight
                rows={LabCalculator.getCurrentLabItems()}
                onRowSelectionModelChange={setRowSelectionModel}
                columns={columns}
                rowSelectionModel={rowSelectionModel}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 10,
                    },
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
                localeText={gridLocaleText}
                checkboxSelection
                showToolbar
                slots={{ toolbar: LabTableToolbar }}
            />
        </Box>
  );
}
