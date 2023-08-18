import Box from '@mui/material/Box';
import * as React from 'react';
import Typography from '@mui/material/Typography';
import ProTip from './ProTip';

interface LabInterfaceInputParam {
    title: string,
    subTitle: string,
}

export default function LabHeader({ title, subTitle } : LabInterfaceInputParam) {
  return (
        <Box
            sx={{
              my: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
        >
            <Typography variant="h5" gutterBottom>
                {title}
            </Typography>
            <Typography variant="h5" gutterBottom>
                {subTitle}
            </Typography>
            <ProTip />
        </Box>
  );
}
