import * as React from 'react';
import Box from '@mui/material/Box';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  GridToolbar,
} from '@mui/x-data-grid';
import LabCalculator, { LabItem } from './services/lab-calculator';

const columns: GridColDef[] = [
  {
    field: 'code',
    headerName: 'Abreviatura',
    width: 100,
    editable: false,
  },
  {
    field: 'name',
    headerName: 'Estudio de Laboratorio',
    width: 300,
    editable: false,
  },
];

interface LabTableInputParams {
    rowSelectionModel: GridRowSelectionModel,
    setSelectedLabItems: Function,
    setRowSelectionModel: Function
}
export default function LabTableMobile(
  { rowSelectionModel, setSelectedLabItems, setRowSelectionModel }: LabTableInputParams,
) {
  const pageSize = 5;
  const debounceInMillis = 500;
  return (
        <div>
            <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
                    density="compact"
                    autoHeight
                    rows={LabCalculator.getCurrentLabItems()}
                    onRowSelectionModelChange={(ids) => {
                      const selectedIDs = new Set(ids);
                      const selectedRowData: LabItem[] = LabCalculator.getCurrentLabItems().filter(labItem => selectedIDs.has(labItem.id));
                      setSelectedLabItems(selectedRowData);
                      setRowSelectionModel(ids);
                    }}
                    columns={columns}
                    rowSelectionModel={rowSelectionModel}
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
