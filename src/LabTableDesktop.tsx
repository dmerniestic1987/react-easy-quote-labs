import * as React from 'react';
import Box from '@mui/material/Box';
import {
  DataGrid,
  GridColDef, GridRowSelectionModel,
} from '@mui/x-data-grid';
import LabCalculator, { LabItem } from './services/lab-calculator';
import LabTableToolbar from './LabTableToolbar';
import { gridLocaleText } from './gridLocale';

const columns: GridColDef[] = [
  {
    field: 'code',
    headerName: 'Abreviatura',
    width: 130,
    editable: false,
  },
  {
    field: 'name',
    headerName: 'Estudio de Laboratorio',
    width: 390,
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

interface LabTableInputParams {
    rowSelectionModel: GridRowSelectionModel,
    setSelectedLabItems: Function,
    setRowSelectionModel: Function
}
export default function LabTableDesktop(
  { rowSelectionModel, setSelectedLabItems, setRowSelectionModel }: LabTableInputParams,
) {
  const pageSize = 5;
  return (
        <div>
            <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
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
                    localeText={gridLocaleText}
                    checkboxSelection
                    showToolbar
                    slots={{ toolbar: LabTableToolbar }}
                />
            </Box>
        </div>
  );
}
