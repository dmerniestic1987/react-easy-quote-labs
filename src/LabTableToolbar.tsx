import * as React from 'react';
import { Toolbar, QuickFilter, QuickFilterControl, QuickFilterClear } from '@mui/x-data-grid';

const DEBOUNCE_IN_MILLIS = 500;

export default function LabTableToolbar() {
  return (
    <Toolbar>
      <QuickFilter expanded debounceMs={DEBOUNCE_IN_MILLIS}>
        <QuickFilterControl placeholder="Buscar..." aria-label="Buscar estudios" />
        <QuickFilterClear />
      </QuickFilter>
    </Toolbar>
  );
}
