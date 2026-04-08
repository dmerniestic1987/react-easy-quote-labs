import {
  Paper, TableCell, TableHead, TableRow,
} from '@mui/material';
import React from 'react';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import { LabItem } from './services/lab-calculator';
import DeleteLabIconButton from './DeleteLabIconButton';


const VirtuosoTableComponents: TableComponents<LabItem> = {
    Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
        <TableContainer component={Paper} {...props} ref={ref} />
    )),
    Table: (props) => (
        <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />
    ),
    TableHead,
    TableRow: ({ item: _item, ...props }) => <TableRow {...props} />,
    TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => <TableBody {...props} ref={ref} />),
};

function fixedHeaderContent() {
  return (
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
  );
}

function rowContent(
    _index: number,
    item: LabItem,
    deleteSelectedLabItem: Function,
    deleteSelectedRowSelectionModel: Function
) {
  return (
    <React.Fragment>
        <TableCell style={{ width: 90 }}>
            {item.code}
        </TableCell>
        <TableCell>
            {item.name}
        </TableCell>
        <TableCell style={{ width: 90 }}>
            <DeleteLabIconButton
                labItem={item}
                deleteSelectedLabItem={() => deleteSelectedLabItem(item)}
                deleteSelectedRowSelectionModel={() => deleteSelectedRowSelectionModel(item)}/>
        </TableCell>
    </React.Fragment>
  );
}


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
            components={VirtuosoTableComponents}
            fixedHeaderContent={fixedHeaderContent}
            itemContent={(_index, item) => rowContent(_index, item, deleteSelectedLabItem, deleteSelectedRowSelectionModel)}
        />

    </>
  );
}
