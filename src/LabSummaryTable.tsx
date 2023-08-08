import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import LabCalculator, {LabItem} from "./services/lab-calculator";

export default function LabSummaryTable() {
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
                    {LabCalculator.getSelectedItems().map((row: LabItem) => (
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
            <h2>Total: ${LabCalculator.getTotalAmount(LabCalculator.getSelectedItems()).toFormat(0)}</h2>
        </TableContainer>
    );
}