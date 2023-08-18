import {
  Paper, TableCell, TableHead, TableRow,
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

export default function LabMiniSummaryDesktop(
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
                    <TableCell style={{ width: 90 }}>
                        Abreviatura
                    </TableCell>
                    <TableCell>
                        Estudio de Laboratorio
                    </TableCell>
                    <TableCell style={{ width: 90 }}>
                        Eliminar
                    </TableCell>
                </TableRow>
            )}
            itemContent={(index, selectedLabItem) => (
              <>
                    <TableCell style={{ width: 90 }}>
                        {selectedLabItem.code}
                    </TableCell>
                    <TableCell>
                        {selectedLabItem.name}
                    </TableCell>
                    <TableCell style={{ width: 90 }}>
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
