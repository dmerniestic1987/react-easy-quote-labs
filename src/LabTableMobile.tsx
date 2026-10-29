import * as React from 'react';
import Box from '@mui/material/Box';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import LabCalculator, { LabItem } from './services/lab-calculator';
import LabTableToolbar from './LabTableToolbar';

const columns: GridColDef[] = [
  {
    field: 'code',
    headerName: 'Código',
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
  return (
        <div>
            <Box sx={{ height: 300, width: '100%' }}>
                <DataGrid
                    density="compact"
                    autoHeight
                    rows={LabCalculator.getCurrentLabItems()}
                    onRowSelectionModelChange={(ids) => {
                      const selectedIDs = ids.ids;
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
                    showToolbar
                    slots={{ toolbar: LabTableToolbar }}
                />
            </Box>
        </div>
  );
}
