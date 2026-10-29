import * as React from 'react';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/system';
import MobileQuoteStepper from '../src/MobileQuoteStepper';
import LabQuoteDesktop from '../src/LabQuoteDesktop';
import UserMenu from '../src/auth/UserMenu';

export default function Home() {
  const theme = useTheme();
  const isSmScreen = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <>
      <UserMenu />
      {isSmScreen ? <MobileQuoteStepper /> : <LabQuoteDesktop />}
    </>
  );
}
