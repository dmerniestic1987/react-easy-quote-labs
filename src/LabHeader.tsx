import Box from '@mui/material/Box';
import * as React from 'react';
import ProTip from './ProTip';

interface LabInterfaceInputParam {
    title: string,
    subTitle: string,
}

export default function LabHeader({ title, subTitle } : LabInterfaceInputParam) {
  return (
        <Box
            sx={{
              my: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
        >
            <h1>{title}</h1>
            <h2>{subTitle}</h2>
            <ProTip />
        </Box>
  );
}