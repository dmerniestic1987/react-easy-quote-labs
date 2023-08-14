import {
  IconButton, Paper, TableCell, TableHead, TableRow,
} from '@mui/material';
import React from 'react';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import { TableVirtuoso } from 'react-virtuoso';
import DeleteIcon from '@mui/icons-material/Delete';
import BigNumber from 'bignumber.js';
import LabCalculator, {LabItem} from './services/lab-calculator';
import TotalQuote from './TotalQuote';
import MathUtils from './services/math-utils';


const TableComponents = {
  // @ts-ignore
  Scroller: React.forwardRef((props, ref) => <TableContainer component={Paper} {...props} ref={ref} />),
  Table: (props: any) => <Table {...props} style={{ borderCollapse: 'separate' }} />,
  TableHead,
  TableRow,
  // @ts-ignore
  TableBody: React.forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
};

export default function LabMiniSummary({ selectedLabItems }: { selectedLabItems: LabItem[] }) {
  const total = LabCalculator.getTotalAmount(selectedLabItems);
  const suggestedTotal = new BigNumber(MathUtils.roundToNearestHundred(total.toNumber()));
  return (
    <>
        <TableVirtuoso
            style={{ height: 400 }}
            data={selectedLabItems || []}
            // @ts-ignore
            components={TableComponents}
            fixedHeaderContent={() => (
                <TableRow>
                    <TableCell style={{ width: 90, background: 'white' }}>
                        Abreviatura
                    </TableCell>
                    <TableCell style={{ background: 'white' }}>
                        Estudio de Laboratorio
                    </TableCell>
                    <TableCell style={{ width: 90, background: 'white' }}>
                        Eliminar
                    </TableCell>
                </TableRow>
            )}
            itemContent={(index, selectedLabItem) => (
              <>
                    <TableCell style={{ width: 90, background: 'white' }}>
                        {selectedLabItem.code}
                    </TableCell>
                    <TableCell style={{ background: 'white' }}>
                        {selectedLabItem.name}
                    </TableCell>
                    <TableCell style={{ width: 90, background: 'white' }}>
                        <IconButton
                            onClick={() => {
                              alert('Funcionalidad pendiente de desarrollo');
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </TableCell>
              </>
            )}
        />
        <TotalQuote description={'Total Sugerido'} totalQuote={suggestedTotal.toFormat(0)}/>
    </>
  );
}
