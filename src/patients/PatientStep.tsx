import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import { ApiError } from '../api/client';
import {
  DOCUMENT_TYPE_LABELS,
  createClient,
  searchClientsByDocument,
  searchClientsByName,
  type Client,
  type ClientSearchResult,
  type DocumentType,
} from '../api/clients';
import { describeError, type UserFacingError } from '../api/errors';

type Props = {
  selected: Client | null;
  onSelect: (client: Client) => void;
  onError: (error: UserFacingError) => void;
};

const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 400;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function clientLabel(client: Pick<Client, 'firstName' | 'lastName'>): string {
  return `${client.lastName}, ${client.firstName}`;
}

export function documentLabel(client: Pick<Client, 'personIdType' | 'personId'>): string {
  return client.personId
    ? `${client.personIdType ? DOCUMENT_TYPE_LABELS[client.personIdType] : 'Documento'} ${client.personId}`
    : 'Sin documento';
}

const emptyForm = { firstName: '', lastName: '', personIdType: 'dni' as DocumentType, personId: '', email: '', phoneNumber: '' };

export default function PatientStep({ selected, onSelect, onError }: Props) {
  const [changing, setChanging] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<'name' | 'document'>('name');
  const [nameText, setNameText] = useState('');
  const [docType, setDocType] = useState<DocumentType>('dni');
  const [docNumber, setDocNumber] = useState('');
  const [results, setResults] = useState<ClientSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const requestId = useRef(0);

  const runSearch = useCallback(async (search: () => Promise<ClientSearchResult>) => {
    const id = ++requestId.current;
    setLoading(true);
    setSearchError(null);
    try {
      const found = await search();
      if (id === requestId.current) setResults(found);
    } catch (e) {
      if (id === requestId.current) {
        setResults(null);
        setSearchError(describeError(e, 'buscar pacientes').message);
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Search by name while typing, after a short pause.
  useEffect(() => {
    if (tab !== 'name' || nameText.trim().length < MIN_SEARCH_LENGTH) return undefined;
    const timer = setTimeout(() => void runSearch(() => searchClientsByName(nameText)), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [tab, nameText, runSearch]);

  const searchByDocument = () => {
    if (docNumber.trim()) void runSearch(() => searchClientsByDocument(docType, docNumber));
  };

  const showResults = tab === 'document' || nameText.trim().length >= MIN_SEARCH_LENGTH ? results : null;

  const homonyms = useMemo(() => {
    const counts = new Map<string, number>();
    (showResults?.clients ?? []).forEach((client) => {
      const key = `${client.firstName} ${client.lastName}`.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.values()).some((count) => count > 1);
  }, [showResults]);

  const choose = (client: Client) => {
    onSelect(client);
    setChanging(false);
    setCreating(false);
  };

  const formErrors = {
    firstName: form.firstName.trim() ? null : 'Obligatorio',
    lastName: form.lastName.trim() ? null : 'Obligatorio',
    personId: form.personId.trim() ? null : 'Obligatorio',
    email: !form.email.trim() || EMAIL_PATTERN.test(form.email.trim()) ? null : 'Email inválido',
  };
  const formValid = Object.values(formErrors).every((error) => error === null);
  const setField = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
    setDuplicate(false);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!formValid) return;
    setSaving(true);
    setDuplicate(false);
    const data = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      personIdType: form.personIdType,
      personId: form.personId.trim(),
      email: form.email.trim() || undefined,
      phoneNumber: form.phoneNumber.trim() || undefined,
    };
    try {
      const id = await createClient(data);
      choose({ id, ...data, email: data.email ?? null, phoneNumber: data.phoneNumber ?? null });
      setForm(emptyForm);
      setSubmitted(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        // Expected situation, not a failure: it only warns.
        console.warn('[cotizaciones] El paciente ya existe', { status: e.status, message: e.message });
        setDuplicate(true);
      } else {
        onError(describeError(e, 'crear el paciente'));
      }
    } finally {
      setSaving(false);
    }
  };

  const searchExisting = () => {
    setTab('document');
    setDocType(form.personIdType);
    setDocNumber(form.personId);
    setCreating(false);
    void runSearch(() => searchClientsByDocument(form.personIdType, form.personId));
  };

  if (selected && !changing) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Paciente seleccionado
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {clientLabel(selected)}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {documentLabel(selected)}
        </Typography>
        <Button variant="outlined" fullWidth onClick={() => setChanging(true)}>
          Cambiar paciente
        </Button>
      </Paper>
    );
  }

  if (creating) {
    return (
      <Box component="form" onSubmit={handleCreate} noValidate>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Nuevo paciente
          </Typography>
          {duplicate && (
            <Alert
              severity="warning"
              action={
                <Button color="inherit" size="small" onClick={searchExisting}>
                  Buscarlo
                </Button>
              }
            >
              Ya existe un paciente con ese documento.
            </Alert>
          )}
          <TextField
            required
            label="Nombre"
            value={form.firstName}
            onChange={setField('firstName')}
            error={submitted && !!formErrors.firstName}
            helperText={submitted ? formErrors.firstName : undefined}
            slotProps={{ htmlInput: { autoComplete: 'off' } }}
          />
          <TextField
            required
            label="Apellido"
            value={form.lastName}
            onChange={setField('lastName')}
            error={submitted && !!formErrors.lastName}
            helperText={submitted ? formErrors.lastName : undefined}
            slotProps={{ htmlInput: { autoComplete: 'off' } }}
          />
          <Stack direction="row" spacing={1.5}>
            <TextField
              select
              required
              label="Tipo"
              value={form.personIdType}
              onChange={setField('personIdType')}
              sx={{ minWidth: 130 }}
            >
              {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((type) => (
                <MenuItem key={type} value={type}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              required
              fullWidth
              label="Número de documento"
              value={form.personId}
              onChange={setField('personId')}
              error={submitted && !!formErrors.personId}
              helperText={submitted ? formErrors.personId : undefined}
              slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'off' } }}
            />
          </Stack>
          <TextField
            label="Email (opcional)"
            type="email"
            value={form.email}
            onChange={setField('email')}
            error={submitted && !!formErrors.email}
            helperText={submitted ? formErrors.email : undefined}
            slotProps={{ htmlInput: { autoComplete: 'off', autoCapitalize: 'none' } }}
          />
          <TextField
            label="Celular (opcional)"
            type="tel"
            value={form.phoneNumber}
            onChange={setField('phoneNumber')}
            slotProps={{ htmlInput: { inputMode: 'tel', autoComplete: 'off' } }}
          />
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" fullWidth onClick={() => setCreating(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" fullWidth disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar paciente'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth">
        <Tab value="name" label="Por nombre" />
        <Tab value="document" label="Por documento" />
      </Tabs>

      {tab === 'name' ? (
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Nombre y/o apellido"
          value={nameText}
          onChange={(e) => setNameText(e.target.value)}
          helperText={nameText.trim().length < MIN_SEARCH_LENGTH ? `Escribí al menos ${MIN_SEARCH_LENGTH} letras` : undefined}
          slotProps={{
            htmlInput: { autoComplete: 'off' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      ) : (
        <Stack
          component="form"
          direction="row"
          spacing={1.5}
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            searchByDocument();
          }}
        >
          <TextField
            select
            size="small"
            label="Tipo"
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentType)}
            sx={{ minWidth: 120 }}
          >
            {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((type) => (
              <MenuItem key={type} value={type}>
                {DOCUMENT_TYPE_LABELS[type]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            size="small"
            label="Número"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'off' } }}
          />
          <Button type="submit" variant="contained" disabled={!docNumber.trim()} aria-label="Buscar por documento">
            <SearchIcon />
          </Button>
        </Stack>
      )}

      {loading && (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Buscando…
          </Typography>
        </Stack>
      )}
      {searchError && <Alert severity="error">{searchError}</Alert>}

      {showResults && !loading && (
        <>
          {homonyms && (
            <Alert severity="warning">
              Hay pacientes con el mismo nombre y apellido. Verificá el documento antes de elegir.
            </Alert>
          )}
          {showResults.clients.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No encontramos pacientes. Podés crear uno nuevo.
            </Typography>
          ) : (
            <Paper variant="outlined">
              <List disablePadding>
                {showResults.clients.map((client, index) => (
                  <ListItemButton
                    key={client.id}
                    divider={index < showResults.clients.length - 1}
                    onClick={() => choose(client)}
                  >
                    <ListItemText
                      primary={clientLabel(client)}
                      secondary={documentLabel(client)}
                      slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}
          {showResults.hasMore && (
            <Typography variant="caption" color="text.secondary">
              Hay más resultados. Afiná la búsqueda para verlos.
            </Typography>
          )}
        </>
      )}

      <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => setCreating(true)}>
        Nuevo paciente
      </Button>
      {selected && (
        <Button onClick={() => setChanging(false)}>Volver a {clientLabel(selected)}</Button>
      )}
    </Stack>
  );
}
