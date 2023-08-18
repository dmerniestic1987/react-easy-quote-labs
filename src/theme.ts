import { Roboto } from 'next/font/google';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

export const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#06A1C0',
    },
    secondary: {
      main: '#0441cc',
    },
    error: {
      main: red.A400,
    },
    mode: 'light',
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
});

export default theme;
