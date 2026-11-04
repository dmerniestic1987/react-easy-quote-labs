import * as React from 'react';
import MobileQuoteStepper from '../src/MobileQuoteStepper';
import DesktopQuoteStepper from '../src/DesktopQuoteStepper';
import { useLayoutMode } from '../src/useLayoutMode';

export default function Home() {
  const layout = useLayoutMode();
  return (
    <>
      {layout === 'mobile' ? <MobileQuoteStepper /> : <DesktopQuoteStepper />}
    </>
  );
}
