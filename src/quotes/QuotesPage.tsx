import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { describeErrorInline } from '../api/errors';
import { listOrders, type OrderPage, type OrderSummary } from '../api/orders';
import { gridLocaleText } from '../gridLocale';
import { clientLabel } from '../patients/PatientStep';
import { formatQuoteDate } from '../services/quote-image';
import { useLayoutMode } from '../useLayoutMode';
import {
  EMPTY_FILTERS,
  PAGE_SIZES,
  buildQuery,
  parseFilters,
  parsePaging,
  toApiFilters,
  type QuoteFilterValues,
} from './filters';
import { rememberQuotesQuery } from './last-query';
import QuoteFilters from './QuoteFilters';
import QuoteStatusChip from './QuoteStatusChip';

type Outcome = { key: string; page?: OrderPage; error?: string };

const NO_PATIENT = 'Sin paciente';
const patientOf = (order: OrderSummary) => (order.client ? clientLabel(order.client) : NO_PATIENT);

const columns: GridColDef<OrderSummary>[] = [
  { field: 'id', headerName: 'N° de cotización', width: 160, sortable: false },
  {
    field: 'status',
    headerName: 'Estado',
    width: 210,
    sortable: false,
    renderCell: ({ row }) => <QuoteStatusChip status={row.status} />,
  },
  {
    field: 'client',
    headerName: 'Paciente',
    flex: 1,
    minWidth: 220,
    sortable: false,
    valueGetter: (_value, row) => patientOf(row),
  },
  {
    field: 'createdAt',
    headerName: 'Fecha de cotización',
    width: 200,
    sortable: false,
    valueGetter: (_value, row) => formatQuoteDate(row.createdAt),
  },
  {
    field: 'actions',
    headerName: 'Acciones',
    width: 170,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: ({ row }) => (
      <Button component={Link} href={`/quotes/${row.id}`} size="small" variant="outlined" startIcon={<VisibilityIcon />}>
        Ver detalle
      </Button>
    ),
  },
];

function QuoteCard({ order }: { order: OrderSummary }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Cotización N° {order.id}
          </Typography>
          <QuoteStatusChip status={order.status} />
        </Stack>
        <Typography variant="body2">{patientOf(order)}</Typography>
        <Typography variant="body2" color="text.secondary">
          {formatQuoteDate(order.createdAt)}
        </Typography>
        <Button component={Link} href={`/quotes/${order.id}`} variant="outlined" startIcon={<VisibilityIcon />}>
          Ver detalle
        </Button>
      </Stack>
    </Paper>
  );
}

export default function QuotesPage() {
  const router = useRouter();
  const layout = useLayoutMode();
  const filters = useMemo(() => parseFilters(router.query), [router.query]);
  const { page, size } = useMemo(() => parsePaging(router.query), [router.query]);
  const [reloadKey, setReloadKey] = useState(0);
  const [clearKey, setClearKey] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const requestKey = JSON.stringify([filters, page, size, reloadKey]);

  useEffect(() => {
    if (!router.isReady) return undefined;
    let cancelled = false;
    listOrders(toApiFilters(filters), page, size)
      .then((result) => {
        if (!cancelled) setOutcome({ key: requestKey, page: result });
      })
      .catch((e) => {
        if (!cancelled) setOutcome({ key: requestKey, error: describeErrorInline(e, 'cargar las cotizaciones') });
      });
    return () => {
      cancelled = true;
    };
  }, [router.isReady, filters, page, size, requestKey]);

  // So "Volver" from a detail returns to this same list.
  useEffect(() => {
    if (router.isReady) rememberQuotesQuery(router.asPath.split('?')[1] ?? '');
  }, [router.isReady, router.asPath]);

  const update = (next: QuoteFilterValues, nextPage = 1, nextSize = size) => {
    void router.replace({ pathname: '/quotes', query: buildQuery(next, nextPage, nextSize) }, undefined, { shallow: true });
  };

  const current = outcome?.key === requestKey ? outcome : null;
  const loading = router.isReady && current === null;
  // While the next page loads, the previous one stays on screen.
  const shown = current?.page ?? outcome?.page;
  const orders = shown?.orders ?? [];
  const total = shown?.total ?? 0;

  // A page number past the end (an old link, or fewer results) goes back to the first page.
  useEffect(() => {
    if (current?.page && current.page.orders.length === 0 && current.page.total > 0 && page > 1) {
      update(filters, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" component="h1">
            Cotizaciones
          </Typography>
          {shown && (
            <Typography variant="body2" color="text.secondary">
              {total} {total === 1 ? 'cotización' : 'cotizaciones'}
            </Typography>
          )}
        </Box>
        <IconButton aria-label="Actualizar listado" onClick={() => setReloadKey((n) => n + 1)} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Stack>

      <QuoteFilters
        key={clearKey}
        value={filters}
        onChange={(next) => update(next)}
        onClear={() => {
          // The fields restart only after the URL is clean, or they would read the old filters again.
          void router
            .replace({ pathname: '/quotes', query: buildQuery(EMPTY_FILTERS, 1, size) }, undefined, { shallow: true })
            .then(() => setClearKey((n) => n + 1));
        }}
      />

      {current?.error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setReloadKey((n) => n + 1)}>
              Reintentar
            </Button>
          }
        >
          {current.error}
        </Alert>
      )}

      {layout === 'mobile' ? (
        <Stack spacing={1.5}>
          {loading && <LinearProgress />}
          {orders.map((order) => (
            <QuoteCard key={order.id} order={order} />
          ))}
          {!loading && !current?.error && orders.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No hay cotizaciones con esos filtros.
            </Typography>
          )}
          <TablePagination
            component="div"
            count={total}
            page={Math.min(page - 1, Math.max(0, Math.ceil(total / size) - 1))}
            rowsPerPage={size}
            rowsPerPageOptions={PAGE_SIZES}
            onPageChange={(_, next) => update(filters, next + 1)}
            onRowsPerPageChange={(e) => update(filters, 1, Number(e.target.value))}
            labelRowsPerPage="Por página"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </Stack>
      ) : (
        <DataGrid
          autoHeight
          rows={orders}
          columns={columns}
          loading={loading}
          paginationMode="server"
          rowCount={total}
          paginationModel={{ page: page - 1, pageSize: size }}
          onPaginationModelChange={(model) =>
            update(filters, model.pageSize !== size ? 1 : model.page + 1, model.pageSize)
          }
          pageSizeOptions={PAGE_SIZES}
          disableRowSelectionOnClick
          disableColumnSorting
          disableColumnMenu
          localeText={{ ...gridLocaleText, noRowsLabel: 'No hay cotizaciones con esos filtros' }}
        />
      )}
    </Container>
  );
}
