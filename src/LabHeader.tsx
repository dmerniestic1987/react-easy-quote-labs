import Box from '@mui/material/Box';
import * as React from 'react';
import Typography from '@mui/material/Typography';

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
            <Typography variant="h5" gutterBottom sx={{ typography: { xs: 'h6', md: 'h5' }, textAlign: 'center' }}>
                {title}
            </Typography>
            <Typography variant="h5" gutterBottom sx={{ typography: { xs: 'h6', md: 'h5' }, textAlign: 'center' }}>
                {subTitle}
            </Typography>
        </Box>
  );
}
