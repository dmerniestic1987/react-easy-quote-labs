import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const PHONE_MAX_SHORT_SIDE = 600;

/**
 * Picks the mobile or the desktop interface.
 *
 * A phone must keep the mobile interface when it is rotated: its window becomes wider than the breakpoint, and
 * switching interfaces would discard the quote in progress. So a touch device whose physical screen is phone
 * sized is always "mobile". On any other device the window width decides, as before.
 */
export function useLayoutMode(): 'mobile' | 'desktop' {
  const theme = useTheme();
  // The app only renders after the session check, in the browser, so it is safe to read the real value right away.
  const narrowWindow = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const touch = useMediaQuery('(pointer: coarse)', { noSsr: true });
  const phoneScreen = touch && Math.min(window.screen.width, window.screen.height) < PHONE_MAX_SHORT_SIDE;
  return narrowWindow || phoneScreen ? 'mobile' : 'desktop';
}
