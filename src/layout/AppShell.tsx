import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import MenuIcon from '@mui/icons-material/Menu';
import UserMenu from '../auth/UserMenu';
import { getLeaveWarning } from '../quote/leave-guard';
import { NAV_ITEMS, type NavItem } from './nav-items';

function NavMenu() {
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [leaving, setLeaving] = useState<{ item: NavItem; warning: string } | null>(null);

  const go = (item: NavItem) => {
    setAnchor(null);
    if (item.match(router.pathname)) return;
    const warning = getLeaveWarning();
    if (warning) setLeaving({ item, warning });
    else void router.push(item.href);
  };

  return (
    <>
      <Button
        color="inherit"
        startIcon={<MenuIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        aria-label="Menú principal"
      >
        Menú
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.match(router.pathname);
          return (
            <MenuItem
              key={item.href}
              component={Link}
              href={item.href}
              selected={active}
              aria-current={active ? 'page' : undefined}
              onClick={(e: React.MouseEvent) => {
                // Next's Link navigates by itself; take over only to run the "leave this screen?" check.
                e.preventDefault();
                go(item);
              }}
            >
              <ListItemIcon>
                <Icon />
              </ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>

      <Dialog open={leaving !== null} onClose={() => setLeaving(null)} fullWidth maxWidth="xs">
        <DialogTitle>¿Salir de esta pantalla?</DialogTitle>
        <DialogContent>
          <DialogContentText>{leaving?.warning}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaving(null)}>Quedarme</Button>
          <Button
            variant="contained"
            onClick={() => {
              const target = leaving?.item;
              setLeaving(null);
              if (target) void router.push(target.href);
            }}
          >
            Salir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/** Top bar shared by every screen: the main menu on the left and the user menu on the right. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar variant="dense" sx={{ justifyContent: 'space-between' }}>
          <NavMenu />
          <UserMenu />
        </Toolbar>
      </AppBar>
      {children}
    </>
  );
}
