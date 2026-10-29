import * as React from 'react';
import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ChangePasswordDialog from './ChangePasswordDialog';
import { useAuth } from './AuthProvider';

const ROLE_LABELS = { SECRETARY: 'Secretaría', BUSINESS_ADMIN: 'Administración' } as const;

export default function UserMenu() {
  const { state, logout } = useAuth();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  if (state.status !== 'authenticated') return null;
  const { user } = state;

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar variant="dense" sx={{ justifyContent: 'flex-end' }}>
        <Button
          color="inherit"
          startIcon={<AccountCircle />}
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-haspopup="menu"
          aria-expanded={!!anchor}
        >
          <Typography variant="body2" component="span">
            {user.username} · {ROLE_LABELS[user.role]}
          </Typography>
        </Button>
        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
          <MenuItem
            onClick={() => {
              setAnchor(null);
              setPasswordDialogOpen(true);
            }}
          >
            Cambiar contraseña
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchor(null);
              void logout();
            }}
          >
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Toolbar>
      <ChangePasswordDialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} />
    </AppBar>
  );
}
