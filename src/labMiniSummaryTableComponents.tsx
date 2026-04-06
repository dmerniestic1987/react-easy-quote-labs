import {
  Paper, Table, TableBody, TableHead, TableRow,
} from '@mui/material';
import TableContainer from '@mui/material/TableContainer';
import * as React from 'react';
import type { ScrollerProps, TableBodyProps, TableComponents } from 'react-virtuoso';
import type { LabItem } from './services/lab-calculator';

const Scroller = React.forwardRef<HTMLDivElement, ScrollerProps>(function VirtuosoScroller(props, ref) {
  return <TableContainer component={Paper} {...props} ref={ref} />;
});

const TableBodyForward = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  function VirtuosoTableBody(props, ref) {
    return <TableBody {...props} ref={ref} />;
  },
);

export const labMiniSummaryTableComponents: TableComponents<LabItem> = {
  Scroller,
  Table: (props) => <Table {...props} style={{ borderCollapse: 'separate' }} />,
  TableHead,
  TableRow,
  TableBody: TableBodyForward,
};
