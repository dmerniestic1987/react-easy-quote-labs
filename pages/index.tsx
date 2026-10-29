import * as React from 'react';
import MobileQuoteStepper from '../src/MobileQuoteStepper';
import LabQuoteDesktop from '../src/LabQuoteDesktop';
import UserMenu from '../src/auth/UserMenu';
import { useLayoutMode } from '../src/useLayoutMode';

export default function Home() {
  const layout = useLayoutMode();
  return (
    <>
      <UserMenu />
      {layout === 'mobile' ? <MobileQuoteStepper /> : <LabQuoteDesktop />}
    </>
  );
}
