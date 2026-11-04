import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getClient, type Client } from '../api/clients';
import { describeErrorInline, logError } from '../api/errors';
import { getOrderDetail, type Order } from '../api/orders';
import { clientLabel, documentLabel } from '../patients/PatientStep';
import { formatMoney, formatQuoteDate } from '../services/quote-image';
import { lastQuotesHref } from './last-query';
import OrderFiles from './OrderFiles';
import QuoteStatusChip from './QuoteStatusChip';

type Loaded = { key: string; order?: Order; patient?: Client | null; error?: string };

/** Amounts in the currency of the quote; the interface only creates pesos, older quotes may be in dollars. */
function money(amount: number, currency: string): string {
  if (currency === 'ARS') return formatMoney(amount);
  return `${currency} ${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body1" component="div">
        {children}
      </Typography>
    </Box>
  );
}

export default function QuoteDetail({ id }: { id: number }) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const key = `${id}:${attempt}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const order = await getOrderDetail(id);
        let patient: Client | null = null;
        if (order.client) {
          // Document, e-mail and phone are extra: the detail shows without them if this call fails.
          patient = await getClient(order.client.id).catch((e) => {
            logError('No se pudieron cargar los datos del paciente', e);
            return null;
          });
        }
        if (!cancelled) setLoaded({ key, order, patient });
      } catch (e) {
        if (!cancelled) setLoaded({ key, error: describeErrorInline(e, `cargar la cotización ${id}`) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, key]);

  const current = loaded?.key === key ? loaded : null;
  const order = current?.order;

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Button component={Link} href={lastQuotesHref()} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Volver a cotizaciones
      </Button>

      {!current && (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress aria-label="Cargando cotización" />
        </Box>
      )}

      {current?.error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => setAttempt((n) => n + 1)}>
              Reintentar
            </Button>
          }
        >
          {current.error}
        </Alert>
      )}

      {order && (
        <Stack spacing={3}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h5" component="h1">
              Cotización N° {order.id}
            </Typography>
            <QuoteStatusChip status={order.status} />
          </Stack>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 4 }}>
              <Field label="Fecha de cotización">{formatQuoteDate(order.createdAt)}</Field>
              {order.executedAt && <Field label="Fecha de ejecución">{formatQuoteDate(order.executedAt)}</Field>}
              <Field label="Total">
                <Box component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {money(order.totalAmount, order.currency)}
                </Box>
              </Field>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }} component="section" aria-label="Paciente">
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              Paciente
            </Typography>
            {order.client ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 4 }} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Field label="Apellido y nombre">{clientLabel(order.client)}</Field>
                {current.patient && <Field label="Documento">{documentLabel(current.patient)}</Field>}
                {current.patient?.email && <Field label="Email">{current.patient.email}</Field>}
                {current.patient?.phoneNumber && <Field label="Celular">{current.patient.phoneNumber}</Field>}
              </Stack>
            ) : (
              <Typography color="text.secondary">Sin paciente asignado.</Typography>
            )}
          </Paper>

          <Box component="section" aria-label="Estudios cotizados">
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              Estudios cotizados
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Estudio</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={`${item.code ?? item.name}-${index}`}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.code ?? '—'}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {money(Number(item.totalPrice), order.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={2} align="right" sx={{ fontWeight: 700 }}>
                      Total
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {money(order.totalAmount, order.currency)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <OrderFiles orderId={order.id} />
        </Stack>
      )}
    </Container>
  );
}
