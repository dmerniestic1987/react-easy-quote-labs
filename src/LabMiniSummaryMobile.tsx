import * as React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { LabItem } from './services/lab-calculator';

interface LabMiniSummaryInputParams {
    selectedLabItems: LabItem[],
    onRemove: (item: LabItem) => void,
}

export default function LabMiniSummaryMobile(
  { selectedLabItems, onRemove }: LabMiniSummaryInputParams,
) {
  const items = selectedLabItems || [];
  return (
    <Paper variant="outlined" component="section" aria-label="Estudios seleccionados">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Estudios seleccionados
        </Typography>
        <Chip size="small" label={items.length} color={items.length ? 'primary' : 'default'} />
      </Box>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
          Todavía no elegiste estudios.
        </Typography>
      ) : (
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', maxHeight: 240, overflowY: 'auto' }}>
          {items.map((item) => (
            <Box
              component="li"
              key={item.id}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2, pr: 0.5, py: 0.5, borderTop: 1, borderColor: 'divider', '&:first-of-type': { borderTop: 0 } }}
            >
              <Box sx={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>
                <Typography variant="body2" component="span" sx={{ display: 'block', fontWeight: 700 }}>
                  {item.code}
                </Typography>
                <Typography variant="body2" component="span" color="text.secondary" sx={{ display: 'block' }}>
                  {item.name}
                </Typography>
              </Box>
              <IconButton aria-label={`Quitar ${item.code}`} onClick={() => onRemove(item)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
