import * as React from 'react';
import { useEffect, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { searchClientsByName, type Client } from '../api/clients';
import { describeError } from '../api/errors';
import { ORDER_STATUS_LABELS, type OrderStatus } from '../api/orders';
import { clientLabel, documentLabel } from '../patients/PatientStep';
import { hasFilters, type QuoteFilterValues } from './filters';

type Props = {
  value: QuoteFilterValues;
  onChange: (next: QuoteFilterValues) => void;
  onClear: () => void;
};

const ID_DEBOUNCE_MS = 400;
const SEARCH_DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 2;

function PatientFilter({ value, onChange }: Pick<Props, 'value' | 'onChange'>) {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // Search while typing, after a short pause. The same search the patient step uses.
  useEffect(() => {
    if (inputValue.trim().length < MIN_SEARCH_LENGTH) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setProblem(null);
      try {
        const found = await searchClientsByName(inputValue);
        if (!cancelled) setOptions(found.clients);
      } catch (e) {
        if (!cancelled) setProblem(describeError(e, 'buscar pacientes').message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inputValue]);

  const selected = value.client ? options.find((client) => client.id === value.client?.id) ?? null : null;
  return (
    <Autocomplete<Client>
      sx={{ minWidth: 260, flex: 1 }}
      size="small"
      options={options}
      // The API already filters by name: showing every result is right, so the built-in filtering is off.
      filterOptions={(all) => all}
      value={selected}
      inputValue={value.client && !selected && !inputValue ? value.client.label : inputValue}
      onInputChange={(_, text, reason) => {
        if (reason !== 'reset') setInputValue(text);
      }}
      onChange={(_, client) => {
        onChange({ ...value, client: client ? { id: client.id, label: clientLabel(client) } : null });
        if (!client) setInputValue('');
      }}
      getOptionLabel={(client) => clientLabel(client)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      loading={loading}
      loadingText="Buscando…"
      noOptionsText={
        problem ?? (inputValue.trim().length < MIN_SEARCH_LENGTH ? 'Escribí al menos 2 letras' : 'Sin resultados')
      }
      renderOption={(props, client) => {
        const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: string };
        return (
          <Box component="li" key={key} {...rest}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {clientLabel(client)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {documentLabel(client)}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Paciente"
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={16} /> : null}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}

export default function QuoteFilters({ value, onChange, onClear }: Props) {
  // The number is typed digit by digit: apply it after a pause instead of querying on every key.
  const [idText, setIdText] = useState(value.id);
  useEffect(() => {
    if (idText === value.id) return undefined;
    const timer = setTimeout(() => onChange({ ...value, id: idText }), ID_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [idText, value, onChange]);

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField
          select
          size="small"
          label="Estado"
          value={value.status}
          onChange={(e) => onChange({ ...value, status: e.target.value as OrderStatus | '' })}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => (
            <MenuItem key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="N° de cotización"
          value={idText}
          onChange={(e) => setIdText(e.target.value.replace(/\D/g, ''))}
          slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'off' } }}
          sx={{ minWidth: 180 }}
        />
        <PatientFilter value={value} onChange={onChange} />
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
        <TextField
          size="small"
          type="date"
          label="Desde"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: value.to || undefined } }}
        />
        <TextField
          size="small"
          type="date"
          label="Hasta"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: value.from || undefined } }}
        />
        <Button onClick={onClear} disabled={!hasFilters(value) && !idText}>
          Limpiar filtros
        </Button>
      </Stack>
    </Stack>
  );
}
