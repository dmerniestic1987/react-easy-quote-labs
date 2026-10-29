import * as React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

type TotalQuoteProps = {
  description: string;
  totalQuote: string;
};

/** One-line total: small label on the left, the amount large and bold on the right. */
export default function TotalQuote({ description, totalQuote }: TotalQuoteProps) {
  return (
    <Paper
      variant="outlined"
      role="status"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        width: { xs: '100%', md: 'auto' },
        minWidth: { md: 380 },
        px: 2,
        py: { xs: 1, md: 1.5 },
        borderColor: 'primary.main',
        borderLeftWidth: 4,
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
        {description}
      </Typography>
      <Typography
        component="span"
        sx={{
          color: 'primary.main',
          fontWeight: 700,
          fontSize: { xs: '1.5rem', md: '1.875rem' },
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
        }}
      >
        $ {totalQuote}
      </Typography>
    </Paper>
  );
}
