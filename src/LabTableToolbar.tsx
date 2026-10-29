import * as React from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import { Toolbar, QuickFilter, QuickFilterControl, QuickFilterClear } from '@mui/x-data-grid';

const DEBOUNCE_IN_MILLIS = 500;

export default function LabTableToolbar() {
  return (
    <Toolbar style={{ width: '100%', padding: 8 }}>
      <QuickFilter expanded debounceMs={DEBOUNCE_IN_MILLIS} style={{ flex: 1 }}>
        <QuickFilterControl
          render={({ ref, ...other }, state) => (
            <TextField
              {...other}
              inputRef={ref}
              fullWidth
              size="small"
              placeholder="Buscar por código o nombre"
              aria-label="Buscar estudios"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: state.value ? (
                    <InputAdornment position="end">
                      <QuickFilterClear edge="end" size="small" aria-label="Borrar búsqueda">
                        <CancelIcon fontSize="small" />
                      </QuickFilterClear>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
          )}
        />
      </QuickFilter>
    </Toolbar>
  );
}
