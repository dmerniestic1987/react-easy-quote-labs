import {Paper, TableCell, TableHead, TableRow} from "@mui/material";
import React from "react";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import {faker} from "@faker-js/faker";
import { TableVirtuoso } from 'react-virtuoso';

const TableComponents = {
    Scroller: React.forwardRef((props, ref) => <TableContainer component={Paper} {...props} ref={ref} />),
    Table: props => <Table {...props} style={{ borderCollapse: 'separate' }} />,
    TableHead: TableHead,
    TableRow: TableRow,
    TableBody: React.forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
}
const generated = [];

export function toggleBg(index) {
    return index % 2 ? '#f5f5f5' : 'white';
}

export function user(index = 0) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
        index: index + 1,
        bgColor: toggleBg(index),
        name: `${firstName} ${lastName}`,
        initials: `${firstName.substr(0, 1)}${lastName.substr(0, 1)}`,
        jobTitle: faker.person.jobTitle(),
        description: faker.lorem.sentence(10),
        longText: faker.lorem.paragraphs(1),
    }
}

export const getUser = (index) => {
    if (!generated[index]) {
        generated[index] = user(index);
    }

    return generated[index];
}

function generateUsers(length, startIndex = 0) {
    return Array.from({ length }).map((_, i) => getUser(i + startIndex))
}

export default function VirtualSummary() {
    return (
        <TableVirtuoso
        style={{ height: 400 }}
        data={generateUsers(100)}
        components={TableComponents}
        fixedHeaderContent={() => (
            <TableRow>
                <TableCell style={{ width: 150, background: 'white' }}>
                    Name
                </TableCell>
                <TableCell style={{ background: 'white' }}>
                    Description
                </TableCell>
            </TableRow>
        )}
        itemContent={(index, userItem) => (
            <>
                <TableCell style={{ width: 150, background: 'white' }}>
                    {userItem.name}
                </TableCell>
                <TableCell style={{ background: 'white'  }}>
                    {userItem.description}
                </TableCell>
            </>
        )}
    />)
}
