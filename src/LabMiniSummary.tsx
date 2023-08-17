import {
  IconButton, Paper, TableCell, TableHead, TableRow,
} from '@mui/material';
import React from 'react';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import { TableVirtuoso } from 'react-virtuoso';
import { LabItem } from './services/lab-calculator';
import DeleteLabIconButton from './DeleteLabIconButton';


const TableComponents = {
  // @ts-ignore
  Scroller: React.forwardRef((props, ref) => <TableContainer component={Paper} {...props} ref={ref} />),
  Table: (props: any) => <Table {...props} style={{ borderCollapse: 'separate' }} />,
  TableHead,
  TableRow,
  // @ts-ignore
  TableBody: React.forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
};

interface LabMiniSummaryInputParams {
    selectedLabItems: LabItem[],
    deleteSelectedLabItem: Function,
    deleteSelectedRowSelectionModel: Function,
}

export default function LabMiniSummary(
  { selectedLabItems, deleteSelectedLabItem, deleteSelectedRowSelectionModel }: LabMiniSummaryInputParams,
) {
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
                        <DeleteLabIconButton
                            labItem={selectedLabItem}
                            deleteSelectedLabItem={deleteSelectedLabItem}
                            deleteSelectedRowSelectionModel={deleteSelectedRowSelectionModel}/>
                    </TableCell>
              </>
            )}
        />

    </>
  );
}
