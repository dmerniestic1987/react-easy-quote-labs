import * as React from 'react';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface LabItem {
    id: string,
    code: string,
    name: string,
    price: number,
}

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
        width: 300,
        editable: false,
    },
    {
        field: 'price',
        headerName: 'Precio',
        type: 'number',
        width: 110,
        editable: false,
    },
];

const rows: LabItem[] = [
    { id: 1, code: 'HPR', name: '17-HIDROXI PROGESTERONA', price: 2623.11 } as LabItem,
    { id: 2, code: 'NU5', name: '5-NUCLEOTIDASA', price: 1772.42 } as LabItem,
    { id: 3, code: 'BHB', name: 'ACIDO BETA HIDROXI BUTIRICO', price: 1772.42 } as LabItem,
    { id: 4, code: 'ABI', name: 'ACIDOS BILIARES', price: 1772.42 } as LabItem,
    { id: 5, code: 'AC', name: 'GRASO ACIDOS GRASOS SAT.DE CADENA LARGA', price: 1772.42 } as LabItem,
    { id: 6, code: 'ACYL', name: 'ACIL CARNITINA', price: 1772.42 } as LabItem,
    { id: 7, code: 'ACTH', name: 'ACTH CORTICOTROFINA', price: 1772.42 } as LabItem,
    { id: 8, code: 'ADR', name: 'ADRENALINA PLASM', price: 1772.42 } as LabItem,
    { id: 9, code: 'ADO', name: 'ADRENALINA en orina', price: 1772.42 } as LabItem,
    { id: 10, code: 'AGUA-B', name: 'AGUA ANALISIS BATERIOLOGICO', price: 1772.42 } as LabItem,
    { id: 11, code: 'AGUA-F', name: 'AGUA ANALISIS FISICO QUIMICO', price: 1772.42 } as LabItem,
    { id: 12, code: 'ALB', name: 'ALBUMINA', price: 1772.42 } as LabItem,

];

export default function LabTable() {
    return (
        <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: {
                            pageSize: 5,
                        },
                    },
                }}
                pageSizeOptions={[5]}
                checkboxSelection
                disableRowSelectionOnClick
            />
        </Box>
    );
}
