import * as React from 'react';
import Chip from '@mui/material/Chip';
import { orderStatusLabel, type OrderStatus } from '../api/orders';

const COLORS: Record<OrderStatus, 'default' | 'info' | 'warning' | 'success'> = {
  quoted: 'default',
  executed: 'info',
  pending_results: 'warning',
  results_done: 'success',
};

export default function QuoteStatusChip({ status }: { status: string }) {
  return <Chip size="small" label={orderStatusLabel(status)} color={COLORS[status as OrderStatus] ?? 'default'} />;
}
