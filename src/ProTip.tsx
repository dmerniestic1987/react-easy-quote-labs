import * as React from 'react';
import { Alert } from '@mui/material';

export default function ProTip() {
  return (
    <Alert severity="info">
        Por favor busque y seleccione los estudios que quiere cotizar. El total está redondeado sin centavos
    </Alert>
  );
}
