import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {LabItem} from "./services/lab-calculator";

function createData(
    id: number,
    code: string,
    name: string,
    price: number
): LabItem {
    return {id, code, name, price};

}

const rows = [
    createData(1, 'OCP', 'Orina Completa', 200),
    createData(2, 'VDRL', 'Análisis de ETS', 2100),

];

export default function LagSummaryTable() {
    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{width: '20%'}}>Abreviatura</TableCell>
                        <TableCell align="left">Estudio de Laboratorio</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow
                            key={row.code}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell align="left">{row.code}</TableCell>
                            <TableCell component="th" scope="row" >
                                {row.name}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
