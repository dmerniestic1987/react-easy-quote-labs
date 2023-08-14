import * as React from 'react';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import LabCalculator, { LabItem } from './services/lab-calculator';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  {
    field: 'code',
    headerName: 'Abreviatura',
    width: 150,
    editable: false,
  },
  {
    field: 'name',
    headerName: 'Estudio de Laboratorio',
    width: 350,
    editable: false,
  },
  {
    field: 'price',
    headerName: 'Precio',
    type: 'number',
    width: 90,
    editable: false,
  },
];

export default function LabTable({ setSelectedLabItems }: any) {
  const pageSize = 5;
  const debounceInMillis = 500;

  return (
        <div>
            <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
                    rows={LabCalculator.getCurrentLabItems()}
                    onRowSelectionModelChange={(ids) => {
                      const selectedIDs = new Set(ids);
                      const selectedRowData: LabItem[] = LabCalculator.getCurrentLabItems().filter(labItem => selectedIDs.has(labItem.id));
                      setSelectedLabItems(selectedRowData);
                    }}
                    columns={columns}
                    initialState={{
                      pagination: {
                        paginationModel: {
                          pageSize,
                        },
                      },
                    }}
                    pageSizeOptions={[pageSize]}
                    checkboxSelection
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                      toolbar: {
                        showQuickFilter: true,
                        quickFilterProps: { debounceMs: debounceInMillis },
                      },
                    }}
                />
            </Box>
        </div>
  );
}
