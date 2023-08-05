import * as React from 'react';
import Box from '@mui/material/Box';
import {DataGrid, GridColDef, GridToolbar} from '@mui/x-data-grid';
import {useState} from "react";
import TotalQuote from "./TotalQuote";

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
        width: 350,
        editable: false,
    },
    {
        field: 'price',
        headerName: 'Precio',
        type: 'number',
        width: 150,
        editable: false,
    },
];

const rows: LabItem[] = [
    { id: 1, code: 'HPR', name: '17-HIDROXI PROGESTERONA', price: 2623.11 } as LabItem,
    { id: 2, code: 'NU5', name: '5-NUCLEOTIDASA', price: 1772.42 } as LabItem,
    { id: 3, code: 'BHB', name: 'ACIDO BETA HIDROXI BUTIRICO', price: 1000.67 } as LabItem,
    { id: 4, code: 'ABI', name: 'ACIDOS BILIARES', price: 500.42 } as LabItem,
    { id: 5, code: 'AC', name: 'GRASO ACIDOS GRASOS SAT.DE CADENA LARGA', price: 680.95 } as LabItem,
    { id: 6, code: 'ACYL', name: 'ACIL CARNITINA', price: 1730.01 } as LabItem,
    { id: 7, code: 'ACTH', name: 'ACTH CORTICOTROFINA', price: 1500 } as LabItem,
    { id: 8, code: 'ADR', name: 'ADRENALINA PLASM', price: 1772 } as LabItem,
    { id: 9, code: 'ADO', name: 'ADRENALINA en orina', price: 200 } as LabItem,
    { id: 10, code: 'AGUA-B', name: 'AGUA ANALISIS BATERIOLOGICO', price: 250 } as LabItem,
    { id: 11, code: 'AGUA-F', name: 'AGUA ANALISIS FISICO QUIMICO', price: 175 } as LabItem,
    { id: 12, code: 'ALB', name: 'ALBUMINA', price: 8900 } as LabItem,

];

export default function LabTable() {
    const pageSize = 5;
    const debounceInMillis = 500;
    const [total, setTotal] = useState(0);
    return (
        <div>
            <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
                    rows={rows}
                    onRowSelectionModelChange={(ids) => {
                        const selectedIDs = new Set(ids);
                        const selectedRowData: LabItem[] = rows.filter((labItem) =>
                            selectedIDs.has(labItem.id)
                        );
                        let totalQuote = 0;
                        selectedRowData.forEach(labItem => {
                            totalQuote += labItem.price;
                        });
                        setTotal(totalQuote);
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
            <TotalQuote totalQuote={total}/>
        </div>
    );
}
